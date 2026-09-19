import pytest
from accounts.models import User
from listings.models import Listing, SearchMatch
from searches.models import SearchProfile
from notifications.models import Notification, TelegramConnection
from notifications.services import replay_recent_matches
from notifications.services import fa_number
def test_persian_number_format(): assert fa_number(2850000000) == "۲,۸۵۰,۰۰۰,۰۰۰"


@pytest.mark.django_db
def test_recent_unsent_match_retries_after_telegram_connection(monkeypatch, settings):
    settings.TELEGRAM_BOT_TOKEN = "test-token"
    user = User.objects.create_user(username="notify", email="notify@example.com", password="password123")
    profile = SearchProfile.objects.create(user=user, title="test")
    listing = Listing.objects.create(provider="divar", external_id="new", title="car", url="https://example.com/car")
    match = SearchMatch.objects.create(search_profile=profile, listing=listing, match_score=80)
    sent = []
    monkeypatch.setattr("notifications.services.TelegramService.notify", lambda self, p, l, m: sent.append(m.id))
    replay_recent_matches(profile)
    assert sent == []
    TelegramConnection.objects.create(user=user, is_verified=True, chat_id="123")
    replay_recent_matches(profile)
    assert sent == [match.id]
    Notification.objects.create(user=user, listing=listing, search_profile=profile, status="sent")
    replay_recent_matches(profile)
    assert sent == [match.id]
