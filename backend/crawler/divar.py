import json, logging, random, re, time
from urllib.parse import urlencode
import httpx
from bs4 import BeautifulSoup
from searches.models import SearchProfile
from .providers import ListingProvider
from .types import NormalizedListing
logger = logging.getLogger(__name__)

DIVAR_CITY_SLUGS = {
    "تهران": "tehran", "کرج": "karaj", "مشهد": "mashhad", "اصفهان": "isfahan",
    "شیراز": "shiraz", "تبریز": "tabriz", "قم": "qom", "اهواز": "ahvaz",
    "رشت": "rasht", "ارومیه": "urmia", "کرمان": "kerman", "یزد": "yazd",
    "قزوین": "qazvin", "همدان": "hamedan", "ساری": "sari", "گرگان": "gorgan",
    "بندرعباس": "bandar-abbas", "اراک": "arak", "زنجان": "zanjan",
    "اردبیل": "ardabil", "سنندج": "sanandaj", "کرمانشاه": "kermanshah",
    "بوشهر": "bushehr", "خرم‌آباد": "khorramabad", "کاشان": "kashan",
}

class DivarURLBuilder:
    BASE = "https://divar.ir/s/{city}/car"
    def build(self, profile: SearchProfile) -> str:
        selected_city = (profile.cities or ["تهران"])[0].strip()
        city = DIVAR_CITY_SLUGS.get(selected_city, selected_city.lower())
        params = {"q": " ".join(x for x in (profile.brand, profile.model, profile.trim) if x)}
        if profile.min_price is not None: params["price"] = f"{profile.min_price}-"
        if profile.max_price is not None: params["price"] = f"{profile.min_price or 0}-{profile.max_price}"
        return f"{self.BASE.format(city=city)}?{urlencode(params)}"

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
                    normalized_title = title_text.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
                    year_match = re.search(r"(?<!\d)(1[34]\d{2})(?!\d)", normalized_title)
                    found.append(NormalizedListing(
                        str(token), title_text, f"https://divar.ir/v/-/{token}",
                        self._number(node.get("price") or node.get("middle_description_text")),
                        year=self._number(year_match.group(1)) if year_match else None,
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
                normalized_title = title_text.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789"))
                year_match = re.search(r"(?<!\d)(1[34]\d{2})(?!\d)", normalized_title)
                if not year_match:
                    year_match = re.search(r"(?<!\d)(9\d)(?!\d)", normalized_title)
                year = self._number(year_match.group(1)) if year_match else None
                if year is not None and year < 100: year += 1300
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

class DivarListingProvider(ListingProvider):
    name = "divar"
    def __init__(self, client=None):
        self.client = client or httpx.Client(timeout=15, follow_redirects=True, headers={"User-Agent": "DivarCarFinder/1.0 (respectful personal notifier)"})
        self.parser = DivarParser(); self.urls = DivarURLBuilder()
    def search(self, profile):
        time.sleep(random.uniform(.4, 1.2))
        for attempt in range(3):
            try:
                response = self.client.get(self.urls.build(profile)); response.raise_for_status()
                if "text/html" not in response.headers.get("content-type", ""): raise ValueError("Unexpected Divar response")
                listings = self.parser.parse(response.text)
                selected_city = (profile.cities or ["تهران"])[0]
                for listing in listings:
                    if not listing.city: listing.city = selected_city
                return listings
            except (httpx.HTTPError, ValueError) as exc:
                if attempt == 2: raise
                logger.warning("provider_retry attempt=%s error=%s", attempt + 1, type(exc).__name__); time.sleep(2 ** attempt)
        return []

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
        except httpx.HTTPError as exc:
            logger.warning("detail_enrichment_failed token=%s error=%s", listing.external_id, type(exc).__name__)
        return listing
