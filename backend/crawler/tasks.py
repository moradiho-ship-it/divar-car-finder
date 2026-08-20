import logging
from datetime import timedelta
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from redis import Redis
from searches.models import SearchProfile
from .divar import DivarListingProvider
from .services import claim_crawl, execute_crawl
logger = logging.getLogger(__name__)

@shared_task(bind=True)
def crawl_profile(self, profile_id):
    profile = SearchProfile.objects.get(pk=profile_id, is_active=True)
    run = claim_crawl(profile)
    if run is None: return {"status": "locked"}
    lock = None
    if settings.REDIS_URL.startswith(("redis://", "rediss://")):
        redis = Redis.from_url(settings.REDIS_URL)
        lock = redis.lock(f"crawl:profile:{profile_id}", timeout=900, blocking_timeout=0)
        try:
            if not lock.acquire(blocking=False):
                run.delete(); return {"status": "locked"}
        except Exception:
            logger.warning("redis_unavailable_using_database_lock search_profile_id=%s", profile_id)
            lock = None
    try:
        run = execute_crawl(profile, DivarListingProvider(), run=run); return {"status": run.status, "run_id": run.id}
    finally:
        if lock:
            try: lock.release()
            except Exception: logger.warning("crawl_lock_expired search_profile_id=%s", profile_id)

@shared_task
def enqueue_due_searches():
    now = timezone.now(); ids = []
    for p in SearchProfile.objects.filter(is_active=True).only("id", "last_checked_at", "crawl_interval_minutes"):
        if p.last_checked_at is None or p.last_checked_at + timedelta(minutes=p.crawl_interval_minutes) <= now:
            crawl_profile.delay(p.id); ids.append(p.id)
    return ids
