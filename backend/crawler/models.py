from django.db import models
from searches.models import SearchProfile
class CrawlRun(models.Model):
    STATUSES = [(x, x) for x in ("running", "success", "partial", "failed")]
    search_profile = models.ForeignKey(SearchProfile, on_delete=models.CASCADE, related_name="crawl_runs")
    started_at = models.DateTimeField(auto_now_add=True, db_index=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default="running")
    listings_scanned = models.PositiveIntegerField(default=0)
    matches_found = models.PositiveIntegerField(default=0)
    new_matches = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    class Meta: ordering = ["-started_at"]

