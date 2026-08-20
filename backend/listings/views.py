from django.db.models import Q
from rest_framework import viewsets
from .models import Listing
from .serializers import ListingSerializer
class ListingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ListingSerializer
    filterset_fields = ("brand", "model", "city", "year", "matches__search_profile")
    ordering_fields = ("discovered_at", "price", "mileage", "year", "matches__match_score")
    def get_queryset(self):
        qs = Listing.objects.filter(matches__search_profile__user=self.request.user).prefetch_related("matches__search_profile").distinct()
        p = self.request.query_params
        if p.get("min_price"): qs = qs.filter(price__gte=p["min_price"])
        if p.get("max_price"): qs = qs.filter(price__lte=p["max_price"])
        if p.get("min_score"): qs = qs.filter(matches__match_score__gte=p["min_score"])
        if p.get("q"): qs = qs.filter(Q(title__icontains=p["q"]) | Q(description__icontains=p["q"]))
        return qs

