from django.core.management.base import BaseCommand
from crawler.scheduling import run_due_synchronously
from crawler.tasks import enqueue_due_searches
class Command(BaseCommand):
    help = "Enqueue active search profiles that are due (cron-compatible)."
    def add_arguments(self, parser):
        parser.add_argument("--sync", action="store_true", help="Run directly without Celery/Redis")
    def handle(self, *args, **options):
        if not options["sync"]:
            ids = enqueue_due_searches(); self.stdout.write(self.style.SUCCESS(f"Enqueued {len(ids)} profiles")); return
        ids = run_due_synchronously()
        self.stdout.write(self.style.SUCCESS(f"Crawled {len(ids)} profiles synchronously"))
