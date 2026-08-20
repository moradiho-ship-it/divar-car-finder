from django.db import models
from searches.models import SearchProfile

class Listing(models.Model):
    provider = models.CharField(max_length=30, default="divar")
    external_id = models.CharField(max_length=160, db_index=True)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    url = models.URLField(max_length=700)
    canonical_url = models.URLField(max_length=700, blank=True, db_index=True)
    image_urls = models.JSONField(default=list, blank=True)
    thumbnail_url = models.URLField(max_length=700, blank=True)
    price = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True, db_index=True)
    mileage = models.PositiveIntegerField(null=True, blank=True)
    brand = models.CharField(max_length=80, blank=True)
    model = models.CharField(max_length=80, blank=True)
    trim = models.CharField(max_length=80, blank=True)
    color = models.CharField(max_length=40, blank=True)
    transmission = models.CharField(max_length=30, blank=True)
    body_condition = models.CharField(max_length=80, blank=True)
    city = models.CharField(max_length=80, blank=True)
    district = models.CharField(max_length=120, blank=True)
    seller_type = models.CharField(max_length=60, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    discovered_at = models.DateTimeField(auto_now_add=True, db_index=True)
    raw_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=("provider", "external_id"), name="unique_provider_listing")]
        ordering = ["-discovered_at"]
    def __str__(self): return self.title

class SearchMatch(models.Model):
    search_profile = models.ForeignKey(SearchProfile, on_delete=models.CASCADE, related_name="matches")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="matches")
    match_score = models.PositiveSmallIntegerField()
    matched_fields = models.JSONField(default=dict)
    failed_fields = models.JSONField(default=list)
    detected_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=("search_profile", "listing"), name="unique_search_listing_match")]
        ordering = ["-detected_at"]

