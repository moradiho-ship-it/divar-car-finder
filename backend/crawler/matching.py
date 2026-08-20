from dataclasses import asdict, dataclass
from .types import NormalizedListing
@dataclass
class MatchResult:
    matched: bool
    score: int
    matched_fields: dict
    failed_fields: list[str]
    def to_dict(self): return asdict(self)

def match_listing(profile, listing: NormalizedListing) -> MatchResult:
    matched, failed, points, possible = {}, [], 0, 0
    def exact(field, expected, actual, hard=True, weight=10):
        nonlocal points, possible
        if not expected: return
        possible += weight
        ok = bool(actual) and str(expected).casefold() in str(actual).casefold()
        matched[field] = ok
        if ok: points += weight
        elif hard: failed.append(field)
    def between(field, low, high, value, weight=12):
        nonlocal points, possible
        if low is None and high is None: return
        possible += weight
        ok = value is not None and (low is None or value >= low) and (high is None or value <= high)
        matched[field] = ok
        if ok: points += weight
        else: failed.append(field)
    model_actual = listing.model or listing.title
    model_is_visible = bool(profile.model) and profile.model.casefold() in str(model_actual).casefold()
    brand_actual = listing.brand or listing.title
    if profile.brand and model_is_visible and profile.brand.casefold() not in str(brand_actual).casefold():
        brand_actual = f"{profile.brand} {brand_actual}"
    exact("brand", profile.brand, brand_actual); exact("model", profile.model, model_actual)
    exact("trim", profile.trim, listing.trim or listing.title, False, 6)
    between("year", profile.min_year, profile.max_year, listing.year); between("price", profile.min_price, profile.max_price, listing.price, 18)
    between("mileage", profile.min_mileage, profile.max_mileage, listing.mileage)
    if profile.cities: exact("city", "|".join(profile.cities), listing.city, False, 8); matched["city"] = listing.city in profile.cities if listing.city else False
    if profile.colors: exact("color", "|".join(profile.colors), listing.color, False, 5); matched["color"] = listing.color in profile.colors if listing.color else False
    exact("transmission", profile.transmission, listing.transmission, False, 6); exact("body_condition", profile.body_condition, listing.body_condition or listing.description, False, 6)
    text = f"{listing.title} {listing.description}".casefold()
    for keyword in profile.description_keywords:
        possible += 5; ok = keyword.casefold() in text; matched[f"keyword:{keyword}"] = ok; points += 5 if ok else 0
    for keyword in profile.excluded_keywords:
        if keyword.casefold() in text: failed.append(f"excluded:{keyword}")
    score = round(100 * points / possible) if possible else 100
    hard_failed = any(x in failed for x in ("brand", "model", "year", "price", "mileage")) or any(x.startswith("excluded:") for x in failed)
    return MatchResult(not hard_failed and score >= profile.minimum_match_score, score, matched, failed)
