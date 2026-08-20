import logging
from django.db import transaction
from django.utils import timezone
from listings.models import Listing, SearchMatch
from notifications.services import TelegramService
from .models import CrawlRun
from .matching import match_listing
logger = logging.getLogger(__name__)

def claim_crawl(profile):
    """Atomically claim a profile; works without Redis on free deployments."""
    from searches.models import SearchProfile
    with transaction.atomic():
        locked = SearchProfile.objects.select_for_update().get(pk=profile.pk)
        if locked.crawl_runs.filter(status="running").exists():
            return None
        return CrawlRun.objects.create(search_profile=locked)

def execute_crawl(profile, provider, run=None):
    run = run or claim_crawl(profile)
    if run is None:
        return None
    try:
        normalized = list(provider.search(profile)); new_count = match_count = 0
        for item in normalized:
            result = match_listing(profile, item)
            if not result.matched: continue
            enrich = getattr(provider, "enrich", None)
            if enrich:
                item = enrich(item)
                result = match_listing(profile, item)
                if not result.matched: continue
            match_count += 1
            with transaction.atomic():
                listing, _ = Listing.objects.update_or_create(provider=provider.name, external_id=item.external_id, defaults=item.model_defaults())
                match, created = SearchMatch.objects.get_or_create(search_profile=profile, listing=listing, defaults={"match_score": result.score, "matched_fields": result.matched_fields, "failed_fields": result.failed_fields})
                if created:
                    new_count += 1
                    transaction.on_commit(lambda p=profile, l=listing, m=match: TelegramService().notify(p, l, m))
        now = timezone.now(); profile.last_checked_at = now; profile.save(update_fields=["last_checked_at"])
        run.status = "success"; run.finished_at = now; run.listings_scanned = len(normalized); run.matches_found = match_count; run.new_matches = new_count; run.save()
        logger.info("crawl_finished crawl_run_id=%s search_profile_id=%s", run.id, profile.id); return run
    except Exception as exc:
        run.status = "failed"; run.finished_at = timezone.now(); run.error_message = str(exc)[:2000]; run.save()
        logger.exception("crawl_failed crawl_run_id=%s search_profile_id=%s", run.id, profile.id); return run
