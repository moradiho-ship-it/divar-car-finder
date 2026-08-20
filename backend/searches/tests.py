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
