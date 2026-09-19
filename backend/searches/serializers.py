from rest_framework import serializers
from .models import SearchProfile

class SearchProfileSerializer(serializers.ModelSerializer):
    matches_count = serializers.IntegerField(read_only=True, default=0)
    models = serializers.ListField(child=serializers.CharField(max_length=80), required=False)
    trims = serializers.ListField(child=serializers.CharField(max_length=80), required=False)
    class Meta:
        model = SearchProfile
        exclude = ("user",)
        read_only_fields = ("last_checked_at", "created_at", "updated_at")
    def to_internal_value(self, data):
        data = data.copy()
        for field in ("min_year", "max_year", "min_price", "max_price", "min_mileage", "max_mileage"):
            if field in data and (data[field] is None or str(data[field]).strip() == ""):
                data[field] = None
        return super().to_internal_value(data)
    def validate(self, data):
        for singular, plural in (("model", "models"), ("trim", "trims")):
            if plural in data:
                data[plural] = list(dict.fromkeys(data[plural]))
                data[singular] = data[plural][0] if data[plural] else ""
            elif singular in data:
                data[plural] = [data[singular]] if data[singular] else []
        for low, high, label in [("min_year", "max_year", "سال"), ("min_price", "max_price", "قیمت"), ("min_mileage", "max_mileage", "کارکرد")]:
            a, b = data.get(low, getattr(self.instance, low, None)), data.get(high, getattr(self.instance, high, None))
            if a is not None and b is not None and a > b: raise serializers.ValidationError({high: f"حداکثر {label} باید بزرگ‌تر از حداقل باشد."})
        score = data.get("minimum_match_score", 70)
        if not 0 <= score <= 100: raise serializers.ValidationError({"minimum_match_score": "امتیاز باید بین ۰ تا ۱۰۰ باشد."})
        if data.get("crawl_interval_minutes", 60) < 5: raise serializers.ValidationError({"crawl_interval_minutes": "حداقل فاصله بررسی ۵ دقیقه است."})
        return data
