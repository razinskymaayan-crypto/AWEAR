#!/usr/bin/env python3
"""Check every external image URL in static/data/*.json actually loads (MASTER_PLAN A6).

A broken retailer CDN link renders as a line-art fallback icon in the demo —
worse than no link at all. This script GETs each URL (browser-like headers,
Range: first bytes) concurrently and reports non-image / error responses.

Usage: python3 scripts/check_image_urls.py [--json report.json]
Exit 0 = all load, exit 1 = broken URLs found (printed).
"""
import json
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "static" / "data"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    ),
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Range": "bytes=0-2047",
}
TIMEOUT = 15


def collect_urls():
    """-> list of (source_id, url) for every external image reference."""
    out = []
    prods = json.load(open(DATA / "products.json"))
    prods = prods if isinstance(prods, list) else prods.get("products", [])
    for p in prods:
        u = p.get("image_url") or ""
        if u.startswith("http"):
            out.append((p.get("id"), u))
    posts = json.load(open(DATA / "posts.json"))
    posts = posts if isinstance(posts, list) else posts.get("posts", [])
    for p in posts:
        u = p.get("image_url") or p.get("image") or ""
        if u.startswith("http"):
            out.append((p.get("id"), u))
    profs = json.load(open(DATA / "profiles.json"))
    profs = profs if isinstance(profs, list) else profs.get("profiles", [])
    for p in profs:
        u = p.get("avatar") or p.get("avatar_url") or ""
        if u.startswith("http"):
            out.append((p.get("id"), u))
    return out


def check(entry):
    sid, url = entry
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            ctype = r.headers.get("Content-Type", "")
            body = r.read(64)
            if r.status >= 400:
                return (sid, url, f"http {r.status}")
            # some CDNs serve an html error page with 200
            if "text/html" in ctype or body.lstrip()[:1] in (b"<",):
                return (sid, url, f"non-image response ({ctype or 'no content-type'})")
            return None
    except urllib.error.HTTPError as e:
        return (sid, url, f"http {e.code}")
    except Exception as e:
        return (sid, url, f"{type(e).__name__}: {e}")


def main() -> int:
    urls = collect_urls()
    print(f"checking {len(urls)} external image URLs...")
    with ThreadPoolExecutor(max_workers=16) as ex:
        results = list(ex.map(check, urls))
    broken = [r for r in results if r]
    if "--json" in sys.argv:
        out = sys.argv[sys.argv.index("--json") + 1]
        with open(out, "w") as f:
            json.dump([{"id": b[0], "url": b[1], "error": b[2]} for b in broken], f, indent=1)
    if broken:
        print(f"BROKEN: {len(broken)}/{len(urls)}")
        for sid, url, err in broken:
            print(f" - {sid}: {err}  {url[:100]}")
        return 1
    print(f"CLEAN — all {len(urls)} image URLs load")
    return 0


if __name__ == "__main__":
    sys.exit(main())
