import pytest
from accounts.models import User
from searches.models import SearchProfile
from .matching import match_listing
from .divar import DivarListingProvider, DivarParser, DivarURLBuilder
from .types import NormalizedListing
@pytest.mark.django_db
def test_hard_ranges_and_keywords_match():
    u = User.objects.create_user(username="a", email="a@example.com", password="password123")
    p = SearchProfile.objects.create(user=u, title="کمری", brand="Toyota", model="Camry", min_year=2018, max_price=3_000_000_000, description_keywords=["سانروف"], minimum_match_score=60)
    item = NormalizedListing("x", "Toyota Camry", "https://divar.ir/v/-/x", price=2_000_000_000, year=2020, description="سانروف", brand="Toyota", model="Camry")
    result = match_listing(p, item)
    assert result.matched and result.score >= 60
def test_excluded_keyword_rejects():
    class P: brand=""; model=""; trim=""; min_year=max_year=min_price=max_price=min_mileage=max_mileage=None; cities=[]; colors=[]; transmission=""; body_condition=""; description_keywords=[]; excluded_keywords=["تصادفی"]; minimum_match_score=0
    assert not match_listing(P(), NormalizedListing("x", "خودرو تصادفی", "https://example.com")).matched

def test_divar_url_uses_city_slug():
    class P:
        cities = ["تهران"]
        brand = "رنو"
        model = "ساندرو"
        trim = ""
        min_price = None
        max_price = None
    url = DivarURLBuilder().build(P())
    assert url.startswith("https://divar.ir/s/tehran/car?")
    assert "%D8%AA%D9%87%D8%B1%D8%A7%D9%86" not in url

def test_divar_parser_extracts_card_fields():
    payload = {"token": "abc", "title": "رنو ساندرو اتوماتیک ۱۳۹۷", "middle_description_text": "۱,۸۰۰,۰۰۰,۰۰۰ تومان", "top_description_text": "۸۵,۰۰۰ کیلومتر", "action": {"payload": {"web_info": {"city_persian": "تهران", "district_persian": "پونک"}}}}
    listing = DivarParser()._walk_json(payload)[0]
    assert listing.price == 1_800_000_000
    assert listing.year == 1397
    assert listing.mileage == 85_000
    assert listing.city == "تهران" and listing.district == "پونک"

def test_divar_html_card_extracts_vehicle_values():
    html = '<a href="/v/test/abc"><h2>ساندرو اتومات ۹۷</h2><span>۱۲۸,۰۰۰ کیلومتر</span><span>۲,۳۰۰,۰۰۰,۰۰۰ تومان</span></a>'
    listing = DivarParser().parse(html)[0]
    assert listing.price == 2_300_000_000
    assert listing.year == 1397
    assert listing.mileage == 128_000

def test_divar_converts_gregorian_vehicle_year_to_jalali():
    html = '<a href="/v/test/abc"><h2>کیا اسپورتیج ۲۰۱۵</h2><span>۱۰۰,۰۰۰ کیلومتر</span><span>۵,۰۰۰,۰۰۰,۰۰۰ تومان</span></a>'
    listing = DivarParser().parse(html)[0]
    assert listing.year == 1394

def test_model_name_can_infer_omitted_brand():
    class P:
        brand = "کیا"; model = "اسپورتیج"; trim = ""
        min_year = 1394; max_year = 1405; min_price = None; max_price = 5_500_000_000
        min_mileage = max_mileage = None; cities = ["تهران"]; colors = []
        transmission = body_condition = ""; description_keywords = excluded_keywords = []
        minimum_match_score = 70
    listing = NormalizedListing("x", "اسپورتیج ۲۰۱۵ فول", "https://example.com", price=5_000_000_000, year=1394, city="تهران")
    assert match_listing(P(), listing).matched

def test_divar_detail_extracts_chassis_and_body():
    class Response:
        text = '<div class="kt-base-row"><p class="kt-score-row__title">وضعیت شاسی‌ها</p><div class="kt-score-row__score">سالم و پلمپ</div></div><div class="kt-base-row"><p class="kt-score-row__title">بدنه</p><div class="kt-score-row__score">سالم و بی‌خط و خش</div></div><h2 class="kt-title-row__title">توضیحات</h2><div><p class="kt-description-row__text">خودرو کاملاً سالم است.\nسند تک‌برگ.</p></div>'
        def raise_for_status(self): pass
    class Client:
        def get(self, url): return Response()
    listing = DivarListingProvider(Client()).enrich(NormalizedListing("x", "car", "https://divar.ir/v/-/x"))
    assert listing.chassis_condition == "سالم و پلمپ"
    assert listing.body_condition == "سالم و بی‌خط و خش"
    assert listing.description == "خودرو کاملاً سالم است.\nسند تک‌برگ."
