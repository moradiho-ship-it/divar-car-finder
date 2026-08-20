from abc import ABC, abstractmethod
from typing import Iterable
from searches.models import SearchProfile
from .types import NormalizedListing
class ListingProvider(ABC):
    name: str
    @abstractmethod
    def search(self, profile: SearchProfile) -> Iterable[NormalizedListing]: ...

