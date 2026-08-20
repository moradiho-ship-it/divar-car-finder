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
                if token and title and not any(x.external_id == str(token) for x in found):
                    found.append(NormalizedListing(str(token), str(title), f"https://divar.ir/v/-/{token}", self._number(node.get("price")),
                        thumbnail_url=node.get("image_url", ""), raw_data=node))
                for value in node.values(): walk(value)
            elif isinstance(node, list):
                for value in node: walk(value)
        walk(payload); return found
    def _cards(self, soup: BeautifulSoup) -> list[NormalizedListing]:
        result = []
        for link in soup.select('a[href*="/v/"]'):
            href = link.get("href", ""); token = href.rstrip("/").split("/")[-1]
            title = link.select_one("h2") or link.select_one("div[title]")
            if token and title: result.append(NormalizedListing(token, title.get_text(" ", strip=True), f"https://divar.ir{href}" if href.startswith("/") else href, raw_data={"source": "html"}))
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
                return self.parser.parse(response.text)
            except (httpx.HTTPError, ValueError) as exc:
                if attempt == 2: raise
                logger.warning("provider_retry attempt=%s error=%s", attempt + 1, type(exc).__name__); time.sleep(2 ** attempt)
        return []
