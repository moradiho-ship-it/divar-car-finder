import pytest
from accounts.models import User
from .models import SearchProfile
@pytest.mark.django_db
def test_profile_belongs_to_user():
    u = User.objects.create_user(username="a", email="a@example.com", password="password123")
    p = SearchProfile.objects.create(user=u, title="تست")
    assert p.user == u and p.crawl_interval_minutes == 60

