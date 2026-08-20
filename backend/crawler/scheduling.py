from datetime import timedelta
from django.utils import timezone
from searches.models import SearchProfile

def due_profiles(now=None):
    now = now or timezone.now()
    for profile in SearchProfile.objects.filter(is_active=True).only("id", "last_checked_at", "crawl_interval_minutes"):
        if profile.last_checked_at is None or profile.last_checked_at + timedelta(minutes=profile.crawl_interval_minutes) <= now:
            yield profile

def run_due_synchronously():
    from .tasks import crawl_profile
    ids = []
    for profile in due_profiles():
        crawl_profile.run(profile.id)
        ids.append(profile.id)
    return ids
