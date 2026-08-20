import pytest
from django.db import IntegrityError
from rest_framework.test import APIClient
from accounts.models import User
from searches.models import SearchProfile
from .models import Listing, SearchMatch
@pytest.mark.django_db(transaction=True)
def test_provider_external_id_unique():
    Listing.objects.create(provider="divar", external_id="a", title="one", url="https://example.com/a")
    with pytest.raises(IntegrityError): Listing.objects.create(provider="divar", external_id="a", title="two", url="https://example.com/b")

@pytest.mark.django_db
def test_bulk_delete_only_removes_current_users_matches():
    first = User.objects.create_user(username="first", email="first@example.com", password="password123")
    second = User.objects.create_user(username="second", email="second@example.com", password="password123")
    first_profile = SearchProfile.objects.create(user=first, title="first")
    second_profile = SearchProfile.objects.create(user=second, title="second")
    listing = Listing.objects.create(provider="divar", external_id="shared", title="shared", url="https://example.com/shared")
    SearchMatch.objects.create(search_profile=first_profile, listing=listing, match_score=90)
    SearchMatch.objects.create(search_profile=second_profile, listing=listing, match_score=80)
    client = APIClient(); client.force_authenticate(first)
    response = client.post("/api/listings/bulk-delete/", {"ids": [listing.id]}, format="json")
    assert response.status_code == 200
    assert not SearchMatch.objects.filter(search_profile=first_profile, listing=listing).exists()
    assert SearchMatch.objects.filter(search_profile=second_profile, listing=listing).exists()
    assert Listing.objects.filter(pk=listing.id).exists()
