import hashlib, secrets
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone
from listings.models import Listing
from searches.models import SearchProfile

class TelegramConnection(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="telegram_connection")
    chat_id = models.CharField(max_length=100, blank=True)
    username = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_code_hash = models.CharField(max_length=64, blank=True)
    verification_expires_at = models.DateTimeField(null=True, blank=True)
    connected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def issue_token(self):
        token = secrets.token_urlsafe(24); self.verification_code_hash = hashlib.sha256(token.encode()).hexdigest(); self.verification_expires_at = timezone.now() + timedelta(minutes=15); self.save(); return token
    def verify(self, token, chat_id, username=""):
        valid = self.verification_expires_at and self.verification_expires_at > timezone.now() and secrets.compare_digest(self.verification_code_hash, hashlib.sha256(token.encode()).hexdigest())
        if valid:
            self.chat_id, self.username, self.is_verified, self.connected_at = str(chat_id), username, True, timezone.now(); self.verification_code_hash = ""; self.verification_expires_at = None; self.save()
        return valid

class Notification(models.Model):
    STATUSES = [(x, x) for x in ("pending", "sent", "failed")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="notifications")
    search_profile = models.ForeignKey(SearchProfile, on_delete=models.CASCADE, related_name="notifications")
    channel = models.CharField(max_length=20, default="telegram")
    status = models.CharField(max_length=20, choices=STATUSES, default="pending", db_index=True)
    external_message_id = models.CharField(max_length=100, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: constraints = [models.UniqueConstraint(fields=("user", "listing", "channel"), name="unique_user_listing_channel")]

