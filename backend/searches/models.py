from django.conf import settings
from django.db import models as db_models

class SearchProfile(db_models.Model):
    TRANSMISSION = [("automatic", "اتوماتیک"), ("manual", "دنده‌ای")]
    user = db_models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=db_models.CASCADE, related_name="search_profiles")
    title = db_models.CharField(max_length=160)
    is_active = db_models.BooleanField(default=True, db_index=True)
    brand = db_models.CharField(max_length=80, blank=True)
    model = db_models.CharField(max_length=80, blank=True)
    trim = db_models.CharField(max_length=80, blank=True)
    models = db_models.JSONField(default=list, blank=True)
    trims = db_models.JSONField(default=list, blank=True)
    min_year = db_models.PositiveSmallIntegerField(null=True, blank=True)
    max_year = db_models.PositiveSmallIntegerField(null=True, blank=True)
    min_price = db_models.PositiveBigIntegerField(null=True, blank=True)
    max_price = db_models.PositiveBigIntegerField(null=True, blank=True)
    min_mileage = db_models.PositiveIntegerField(null=True, blank=True)
    max_mileage = db_models.PositiveIntegerField(null=True, blank=True)
    cities = db_models.JSONField(default=list, blank=True)
    districts = db_models.JSONField(default=list, blank=True)
    colors = db_models.JSONField(default=list, blank=True)
    transmission = db_models.CharField(max_length=20, choices=TRANSMISSION, blank=True)
    body_condition = db_models.CharField(max_length=80, blank=True)
    description_keywords = db_models.JSONField(default=list, blank=True)
    excluded_keywords = db_models.JSONField(default=list, blank=True)
    telegram_enabled = db_models.BooleanField(default=True)
    send_images = db_models.BooleanField(default=False)
    notify_once = db_models.BooleanField(default=True)
    minimum_match_score = db_models.PositiveSmallIntegerField(default=70)
    crawl_interval_minutes = db_models.PositiveIntegerField(default=60)
    last_checked_at = db_models.DateTimeField(null=True, blank=True)
    created_at = db_models.DateTimeField(auto_now_add=True)
    updated_at = db_models.DateTimeField(auto_now=True)
    class Meta: ordering = ["-created_at"]
    def __str__(self): return self.title
