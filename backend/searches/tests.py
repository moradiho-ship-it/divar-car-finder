import pytest
from accounts.models import User
from .models import SearchProfile
from .serializers import SearchProfileSerializer
@pytest.mark.django_db
def test_profile_belongs_to_user():
    u = User.objects.create_user(username="a", email="a@example.com", password="password123")
    p = SearchProfile.objects.create(user=u, title="تست")
    assert p.user == u and p.crawl_interval_minutes == 60

def test_blank_optional_numbers_are_null_not_zero():
    serializer = SearchProfileSerializer(data={
        "title": "تست", "min_year": "", "max_year": None,
        "min_price": "   ", "max_price": "", "min_mileage": "", "max_mileage": None,
    })
    assert serializer.is_valid(), serializer.errors
    for field in ("min_year", "max_year", "min_price", "max_price", "min_mileage", "max_mileage"):
        assert serializer.validated_data[field] is None


@pytest.mark.django_db
def test_multi_model_and_trim_values_replace_legacy_fields():
    user = User.objects.create_user(username="multi", email="multi@example.com", password="password123")
    serializer = SearchProfileSerializer(data={
        "title": "پژوهای من", "brand": "پژو",
        "models": ["206", "207i", "206"],
        "trims": ["تیپ ۲", "اتوماتیک MC"],
    })
    assert serializer.is_valid(), serializer.errors
    profile = serializer.save(user=user)
    assert profile.models == ["206", "207i"]
    assert profile.trims == ["تیپ ۲", "اتوماتیک MC"]
    assert profile.model == "206" and profile.trim == "تیپ ۲"

    update = SearchProfileSerializer(profile, data={"models": [], "trims": []}, partial=True)
    assert update.is_valid(), update.errors
    profile = update.save()
    assert profile.models == profile.trims == []
    assert profile.model == profile.trim == ""


def test_legacy_model_input_populates_multi_values():
    serializer = SearchProfileSerializer(data={"title": "جستجوی قدیمی", "model": "206", "trim": "تیپ ۲"})
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["models"] == ["206"]
    assert serializer.validated_data["trims"] == ["تیپ ۲"]
