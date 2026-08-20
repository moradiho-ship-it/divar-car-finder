from django.core.management.base import BaseCommand
from datetime import timedelta
from django.utils import timezone
from crawler.tasks import crawl_profile, enqueue_due_searches
from searches.models import SearchProfile
class Command(BaseCommand):
    help = "Enqueue active search profiles that are due (cron-compatible)."
    def add_arguments(self, parser):
        parser.add_argument("--sync", action="store_true", help="Run directly without Celery/Redis")
    def handle(self, *args, **options):
        if not options["sync"]:
            ids = enqueue_due_searches(); self.stdout.write(self.style.SUCCESS(f"Enqueued {len(ids)} profiles")); return
        now = timezone.now(); ids = []
        for profile in SearchProfile.objects.filter(is_active=True).only("id", "last_checked_at", "crawl_interval_minutes"):
            if profile.last_checked_at is None or profile.last_checked_at + timedelta(minutes=profile.crawl_interval_minutes) <= now:
                crawl_profile.run(profile.id); ids.append(profile.id)
        self.stdout.write(self.style.SUCCESS(f"Crawled {len(ids)} profiles synchronously"))
