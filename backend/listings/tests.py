import pytest
from django.db import IntegrityError
from .models import Listing
@pytest.mark.django_db(transaction=True)
def test_provider_external_id_unique():
    Listing.objects.create(provider="divar", external_id="a", title="one", url="https://example.com/a")
    with pytest.raises(IntegrityError): Listing.objects.create(provider="divar", external_id="a", title="two", url="https://example.com/b")

