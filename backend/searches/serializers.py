from rest_framework import serializers
from .models import SearchProfile

class SearchProfileSerializer(serializers.ModelSerializer):
    matches_count = serializers.IntegerField(read_only=True, default=0)
    class Meta:
        model = SearchProfile
        exclude = ("user",)
        read_only_fields = ("last_checked_at", "created_at", "updated_at")
    def validate(self, data):
        for low, high, label in [("min_year", "max_year", "سال"), ("min_price", "max_price", "قیمت"), ("min_mileage", "max_mileage", "کارکرد")]:
            a, b = data.get(low, getattr(self.instance, low, None)), data.get(high, getattr(self.instance, high, None))
            if a is not None and b is not None and a > b: raise serializers.ValidationError({high: f"حداکثر {label} باید بزرگ‌تر از حداقل باشد."})
        score = data.get("minimum_match_score", 70)
        if not 0 <= score <= 100: raise serializers.ValidationError({"minimum_match_score": "امتیاز باید بین ۰ تا ۱۰۰ باشد."})
        if data.get("crawl_interval_minutes", 60) < 5: raise serializers.ValidationError({"crawl_interval_minutes": "حداقل فاصله بررسی ۵ دقیقه است."})
        return data

