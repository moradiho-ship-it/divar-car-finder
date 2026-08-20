from rest_framework import viewsets
from .models import CrawlRun
from .serializers import CrawlRunSerializer
class CrawlRunViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CrawlRunSerializer
    filterset_fields = ("status", "search_profile")
    ordering_fields = ("started_at", "listings_scanned", "matches_found")
    def get_queryset(self): return CrawlRun.objects.filter(search_profile__user=self.request.user).select_related("search_profile")

