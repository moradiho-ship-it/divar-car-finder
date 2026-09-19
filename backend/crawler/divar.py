import json, logging, random, re, time
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode
import httpx
from bs4 import BeautifulSoup
from searches.models import SearchProfile
from .providers import ListingProvider
from .selection import selected_values
from .types import NormalizedListing
logger = logging.getLogger(__name__)

DIVAR_CITY_SLUGS = json.loads(Path(__file__).with_name("divar_cities.json").read_text(encoding="utf-8"))

class DivarURLBuilder:
    BASE = "https://divar.ir/s/{city}/car"
    def build(self, profile: SearchProfile, model: Optional[str] = None) -> str:
        selected_city = (profile.cities or ["تهران"])[0].strip()
        city = DIVAR_CITY_SLUGS.get(selected_city, selected_city.lower())
        models = selected_values(profile, "models", "model")
        trims = selected_values(profile, "trims", "trim")
        if model is None:
            model = models[0] if models else ""
        trim = trims[0] if len(models) <= 1 and len(trims) == 1 else ""
        params = {"q": " ".join(x for x in (profile.brand, model, trim) if x)}
        if profile.min_price is not None: params["price"] = f"{profile.min_price}-"
        if profile.max_price is not None: params["price"] = f"{profile.min_price or 0}-{profile.max_price}"
        return f"{self.BASE.format(city=city)}?{urlencode(params)}"

    def build_many(self, profile: SearchProfile) -> list[str]:
        return [self.build(profile, model) for model in (selected_values(profile, "models", "model") or [""])]

class DivarParser:
    def parse(self, html: str) -> list[NormalizedListing]:
        soup = BeautifulSoup(html, "html.parser")
        script = soup.find("script", id="__NEXT_DATA__")
        if script and script.string:
            try: return self._walk_json(json.loads(script.string))
            except (ValueError, TypeError): logger.warning("parser_failed invalid_next_data")
        return self._cards(soup)
    def _walk_json(self, payload: dict) -> list[NormalizedListing]:
        found = []
        def walk(node):
            if isinstance(node, dict):
                token = node.get("token") or node.get("post_token")
                title = node.get("title")
                is_post_card = "middle_description_text" in node or "top_description_text" in node
                if token and title and is_post_card and not any(x.external_id == str(token) for x in found):
                    web_info = (((node.get("action") or {}).get("payload") or {}).get("web_info") or {})
                    title_text = str(title)
                    year = self._year(title_text)
                    found.append(NormalizedListing(
                        str(token), title_text, f"https://divar.ir/v/-/{token}",
                        self._number(node.get("price") or node.get("middle_description_text")),
                        year=year,
                        mileage=self._number(node.get("mileage") or node.get("top_description_text")),
                        city=str(web_info.get("city_persian") or node.get("city") or ""),
                        district=str(web_info.get("district_persian") or node.get("district") or ""),
                        thumbnail_url=node.get("image_url", ""), raw_data=node,
                    ))
                for value in node.values(): walk(value)
            elif isinstance(node, list):
                for value in node: walk(value)
        walk(payload); return found
    def _cards(self, soup: BeautifulSoup) -> list[NormalizedListing]:
        result = []
        for link in soup.select('a[href*="/v/"]'):
            href = link.get("href", ""); token = href.rstrip("/").split("/")[-1]
            title = link.select_one("h2") or link.select_one("div[title]")
            if token and title:
                title_text = title.get_text(" ", strip=True)
                card_text = link.get_text(" ", strip=True)
                year = self._year(title_text)
                price_match = re.search(r"([\d۰-۹٬,]+)\s*تومان", card_text)
                mileage_match = re.search(r"([\d۰-۹٬,]+)\s*کیلومتر", card_text)
                image = link.select_one("img")
                result.append(NormalizedListing(
                    token, title_text, f"https://divar.ir{href}" if href.startswith("/") else href,
                    price=self._number(price_match.group(1)) if price_match else None,
                    year=year,
                    mileage=self._number(mileage_match.group(1)) if mileage_match else None,
                    thumbnail_url=(image.get("src", "") if image else ""), raw_data={"source": "html"},
                ))
        return result
    @staticmethod
    def _number(value):
        if isinstance(value, int): return value
        digits = re.sub(r"\D", "", str(value or "")); return int(digits) if digits else None

    @classmethod
    def _year(cls, title):
        normalized = str(title or "").translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
        match = re.search(r"(?<!\d)((?:1[34]|19|20)\d{2})(?!\d)", normalized)
        if match:
            year = int(match.group(1))
            return year - 621 if year >= 1900 else year
        short = re.search(r"(?<!\d)(9\d)(?!\d)", normalized)
        return int(short.group(1)) + 1300 if short else None

class DivarListingProvider(ListingProvider):
    name = "divar"
    def __init__(self, client=None):
        self.client = client or httpx.Client(timeout=15, follow_redirects=True, headers={"User-Agent": "DivarCarFinder/1.0 (respectful personal notifier)"})
        self.parser = DivarParser(); self.urls = DivarURLBuilder()
    def search(self, profile):
        found = {}
        for url in self.urls.build_many(profile):
            time.sleep(random.uniform(.4, 1.2))
            for attempt in range(3):
                try:
                    response = self.client.get(url); response.raise_for_status()
                    if "text/html" not in response.headers.get("content-type", ""): raise ValueError("Unexpected Divar response")
                    for listing in self.parser.parse(response.text):
                        if not listing.city: listing.city = (profile.cities or ["تهران"])[0]
                        found[listing.external_id] = listing
                    break
                except (httpx.HTTPError, ValueError) as exc:
                    if attempt == 2: raise
                    logger.warning("provider_retry attempt=%s error=%s", attempt + 1, type(exc).__name__); time.sleep(2 ** attempt)
        return list(found.values())

    def enrich(self, listing: NormalizedListing) -> NormalizedListing:
        """Load fields that Divar only exposes on the individual post page."""
        try:
            response = self.client.get(listing.url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            values = {}
            for title in soup.select(".kt-score-row__title"):
                row = title.find_parent(class_="kt-base-row")
                score = row.select_one(".kt-score-row__score") if row else None
                if score: values[title.get_text(" ", strip=True)] = score.get_text(" ", strip=True)
            listing.chassis_condition = values.get("وضعیت شاسی‌ها", "")
            listing.body_condition = values.get("بدنه", listing.body_condition)
            for heading in soup.select("h1, h2, h3, .kt-title-row__title"):
                if heading.get_text(" ", strip=True) == "توضیحات":
                    description = heading.find_next("p", class_="kt-description-row__text")
                    if description:
                        listing.description = description.get_text("\n", strip=True)
                        break
            image_urls = []
            for image in soup.select("img"):
                url = image.get("src") or image.get("data-src") or ""
                if url.startswith("//"): url = f"https:{url}"
                if url.startswith("http") and ("postimage" in url or "/static/photo/" in url) and url not in image_urls:
                    image_urls.append(url)
            listing.image_urls = image_urls[:10]
            if image_urls: listing.thumbnail_url = image_urls[0]
        except httpx.HTTPError as exc:
            logger.warning("detail_enrichment_failed token=%s error=%s", listing.external_id, type(exc).__name__)
        return listing
