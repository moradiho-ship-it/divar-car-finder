from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Optional
@dataclass
class NormalizedListing:
    external_id: str
    title: str
    url: str
    price: Optional[int] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    city: str = ""
    district: str = ""
    description: str = ""
    image_urls: list[str] = field(default_factory=list)
    thumbnail_url: str = ""
    brand: str = ""
    model: str = ""
    trim: str = ""
    color: str = ""
    transmission: str = ""
    body_condition: str = ""
    chassis_condition: str = ""
    seller_type: str = ""
    published_at: Optional[datetime] = None
    raw_data: dict[str, Any] = field(default_factory=dict)
    def model_defaults(self):
        data = asdict(self); data.pop("external_id"); data["canonical_url"] = self.url.split("?")[0]; return data
