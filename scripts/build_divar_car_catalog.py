"""Build the checked-in car catalog from category.md and Divar's public filters."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "frontend/src/data/divarCarCatalog.json"
CITY_OUTPUT = ROOT / "backend/crawler/divar_cities.json"
ASSETS = "https://open-api.divar.ir/v1/open-platform/assets"
PAGE = "https://divar.ir/s/tehran/car"


def fetch_json(url):
    with urlopen(Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as response:
        return json.load(response)


def category_node(node):
    data = node["data"]
    result = {"key": data["key"], "title": data["title"]}
    if node.get("children"):
        result["children"] = [category_node(child) for child in node["children"]]
    return result


def count_nodes(node):
    return 1 + sum(count_nodes(child) for child in node.get("children", []))


def page_filters():
    with urlopen(Request(PAGE, headers={"User-Agent": "Mozilla/5.0"}), timeout=30) as response:
        html = response.read().decode("utf-8")
    match = re.search(r"window\.__PRELOADED_STATE__\s*=\s*", html)
    if not match:
        raise ValueError("Divar page does not contain filter state")
    state, _ = json.JSONDecoder().raw_decode(html[match.end():])
    widgets = state["nb"]["filtersPage"]["widgetList"]
    headings = {}
    for widget in widgets:
        data = widget["dto"]["data"]
        if widget["widgetType"] == "TITLE_ROW":
            headings[data.get("corresponding_input_widget_id")] = data["text"]

    fields = []
    for widget in widgets:
        data = widget["dto"]["data"]
        field = data.get("field")
        if not field:
            continue
        options = data.get("options", [])
        fields.append({
            "key": field["key"],
            "title": data.get("filter_page_title") or data.get("title") or headings.get(widget["uid"]) or field["key"],
            "widget_type": widget["widgetType"],
            "value_type": field.get("type", ""),
            "options": [
                {"key": option.get("key", option.get("value")), "title": option.get("title", option.get("display"))}
                for option in options
            ],
        })
    return fields


def main():
    supplied = json.loads((ROOT / "category.md").read_text(encoding="utf-8"))
    brands = [category_node(node) for node in supplied["options"]["children"]]
    if len(brands) < 100 or len({brand["key"] for brand in brands}) != len(brands) or sum(map(count_nodes, brands)) < 2000:
        raise ValueError("Brand tree is incomplete or contains duplicate brand keys")

    catalog = {
        "source": {"categories": "category.md", "filters": PAGE, "assets": ASSETS},
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "brands": brands,
        "filters": page_filters(),
        "colors": fetch_json(f"{ASSETS}/color/light")["colors"],
        "body_statuses": fetch_json(f"{ASSETS}/body-status")["body_status"],
        "cities": fetch_json(f"{ASSETS}/city")["cities"],
        "tehran_districts": fetch_json(f"{ASSETS}/district/tehran")["districts"],
    }
    OUTPUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # The crawler needs slugs for every city offered by the form. Some Divar
    # entries repeat the same visible name; keep the first public slug.
    city_slugs = {}
    for city in catalog["cities"]:
        city_slugs.setdefault(city["display"], city["slug"])
    CITY_OUTPUT.write_text(json.dumps(city_slugs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(brands)} brands, {sum(map(count_nodes, brands))} category nodes and {len(catalog['filters'])} filters to {OUTPUT}")


if __name__ == "__main__":
    main()
