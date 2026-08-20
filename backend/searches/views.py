from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SearchProfile
from .serializers import SearchProfileSerializer

class SearchProfileViewSet(viewsets.ModelViewSet):
    serializer_class = SearchProfileSerializer
    filterset_fields = ("is_active", "brand", "model")
    ordering_fields = ("created_at", "last_checked_at", "title")
    def get_queryset(self): return SearchProfile.objects.filter(user=self.request.user).annotate(matches_count=Count("matches"))
    def perform_create(self, serializer): serializer.save(user=self.request.user)
    @action(detail=True, methods=["post"])
    def run(self, request, pk=None):
        from crawler.tasks import crawl_profile
        profile = self.get_object()
        if profile.crawl_runs.filter(status="running").exists(): return Response({"detail": "این جستجو هم‌اکنون در حال بررسی است."}, status=409)
        result = crawl_profile.run(profile.id)
        status_code = 200 if result.get("status") == "success" else 502
        return Response(result, status=status_code)
    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        source = self.get_object(); source.pk = None; source.title = f"کپی {source.title}"; source.save()
        return Response(self.get_serializer(source).data, status=201)
