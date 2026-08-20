from django.db import connection
from django.db.models import Count
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from crawler.models import CrawlRun
from listings.models import SearchMatch
from notifications.models import Notification
from searches.models import SearchProfile
class HealthView(APIView):
    permission_classes = [AllowAny]; authentication_classes = []
    def get(self, request):
        try:
            with connection.cursor() as cursor: cursor.execute("SELECT 1")
            return Response({"status": "ok", "database": "ok"})
        except Exception: return Response({"status": "degraded", "database": "error"}, status=503)
class DashboardSummaryView(APIView):
    def get(self, request):
        today = timezone.localdate(); profiles = SearchProfile.objects.filter(user=request.user)
        runs = CrawlRun.objects.filter(search_profile__user=request.user, started_at__date=today)
        matches = SearchMatch.objects.filter(search_profile__user=request.user, detected_at__date=today)
        latest = SearchMatch.objects.filter(search_profile__user=request.user).select_related("listing", "search_profile")[:6]
        return Response({"active_searches": profiles.filter(is_active=True).count(), "scanned_today": sum(runs.values_list("listings_scanned", flat=True)), "matches_today": matches.count(),
            "notifications_sent": Notification.objects.filter(user=request.user, status="sent", sent_at__date=today).count(),
            "latest_matches": [{"id": x.listing_id, "title": x.listing.title, "price": x.listing.price, "year": x.listing.year, "mileage": x.listing.mileage, "city": x.listing.city, "thumbnail_url": x.listing.thumbnail_url, "match_score": x.match_score, "discovered_at": x.detected_at, "url": x.listing.url} for x in latest]})

