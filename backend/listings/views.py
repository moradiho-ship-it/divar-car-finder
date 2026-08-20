from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Listing, SearchMatch
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

    @action(detail=False, methods=["post"], url_path="bulk-delete")
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "حداقل یک آگهی را انتخاب کنید."}, status=400)
        listing_ids = list(SearchMatch.objects.filter(
            search_profile__user=request.user, listing_id__in=ids,
        ).values_list("listing_id", flat=True).distinct())
        from notifications.models import Notification
        Notification.objects.filter(user=request.user, listing_id__in=listing_ids).delete()
        deleted_matches, _ = SearchMatch.objects.filter(
            search_profile__user=request.user, listing_id__in=listing_ids,
        ).delete()
        Listing.objects.filter(id__in=listing_ids, matches__isnull=True).delete()
        return Response({"deleted": deleted_matches, "listing_ids": listing_ids})
