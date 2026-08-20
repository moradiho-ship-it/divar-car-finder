from django.conf import settings
from django.db import models

class SearchProfile(models.Model):
    TRANSMISSION = [("automatic", "اتوماتیک"), ("manual", "دنده‌ای")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="search_profiles")
    title = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True, db_index=True)
    brand = models.CharField(max_length=80, blank=True)
    model = models.CharField(max_length=80, blank=True)
    trim = models.CharField(max_length=80, blank=True)
    min_year = models.PositiveSmallIntegerField(null=True, blank=True)
    max_year = models.PositiveSmallIntegerField(null=True, blank=True)
    min_price = models.PositiveBigIntegerField(null=True, blank=True)
    max_price = models.PositiveBigIntegerField(null=True, blank=True)
    min_mileage = models.PositiveIntegerField(null=True, blank=True)
    max_mileage = models.PositiveIntegerField(null=True, blank=True)
    cities = models.JSONField(default=list, blank=True)
    districts = models.JSONField(default=list, blank=True)
    colors = models.JSONField(default=list, blank=True)
    transmission = models.CharField(max_length=20, choices=TRANSMISSION, blank=True)
    body_condition = models.CharField(max_length=80, blank=True)
    description_keywords = models.JSONField(default=list, blank=True)
    excluded_keywords = models.JSONField(default=list, blank=True)
    telegram_enabled = models.BooleanField(default=True)
    send_images = models.BooleanField(default=False)
    notify_once = models.BooleanField(default=True)
    minimum_match_score = models.PositiveSmallIntegerField(default=70)
    crawl_interval_minutes = models.PositiveIntegerField(default=60)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ["-created_at"]
    def __str__(self): return self.title
