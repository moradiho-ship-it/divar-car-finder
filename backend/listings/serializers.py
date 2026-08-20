from rest_framework import serializers
from .models import Listing, SearchMatch
class MatchSerializer(serializers.ModelSerializer):
    search_title = serializers.CharField(source="search_profile.title", read_only=True)
    search_profile_id = serializers.IntegerField(read_only=True)
    class Meta: model = SearchMatch; fields = ("search_profile_id", "search_title", "match_score", "matched_fields", "failed_fields", "detected_at")
class ListingSerializer(serializers.ModelSerializer):
    matches = MatchSerializer(many=True, read_only=True)
    class Meta: model = Listing; fields = "__all__"

