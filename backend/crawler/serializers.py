from rest_framework import serializers
from .models import CrawlRun
class CrawlRunSerializer(serializers.ModelSerializer):
    search_title = serializers.CharField(source="search_profile.title", read_only=True)
    duration_seconds = serializers.SerializerMethodField()
    class Meta: model = CrawlRun; fields = "__all__"
    def get_duration_seconds(self, obj):
        return round((obj.finished_at - obj.started_at).total_seconds(), 2) if obj.finished_at else None

