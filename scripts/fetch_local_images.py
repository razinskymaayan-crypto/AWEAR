#!/usr/bin/env python3
"""Download all demo images LOCALLY so the demo never shows a broken image and doesn't depend on
external retailer CDNs / Pexels at demo time. Also grabs example outfit photos as test inputs for
the product-identification (/api/analyze) work.

What it does:
1. For every product in static/data/products.json: download its image_url -> static/img/products/<id>.jpg
   (retry with a browser UA; on failure fall back to the local /api/product-image proxy; then skip).
   Rewrites products.json: image_url -> /static/img/products/<id>.jpg, keeping the original as
   image_url_source so nothing is lost.
2. Downloads N example outfit/garment photos -> static/img/samples/ (for testing the vision + demo).

Run (server should be up on :8000 for the proxy fallback):  python3 scripts/fetch_local_images.py
Idempotent: skips files already downloaded.
"""
import json
import os
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "static/data/products.json"
PROD_DIR = ROOT / "static/img/products"
SAMPLE_DIR = ROOT / "static/img/samples"
PROXY = "http://localhost:8000/api/product-image?q="
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE


def _get(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*"})
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as r:
        data = r.read()
    if len(data) < 800:  # too small to be a real image
        raise ValueError("image too small")
    return data


def download(url, dest, allow_proxy_query=None):
    if dest.exists() and dest.stat().st_size > 800:
        return "cached"
    # 1) try the real URL
    if url:
        try:
            dest.write_bytes(_get(url)); return "real"
        except Exception:
            pass
    # 2) fall back to the local proxy (uses whatever image service is configured)
    if allow_proxy_query:
        try:
            red = urllib.request.Request(PROXY + urllib.parse.quote(allow_proxy_query),
                                         headers={"User-Agent": UA})
            with urllib.request.urlopen(red, timeout=12, context=_CTX) as r:
                dest.write_bytes(r.read())
            if dest.stat().st_size > 800:
                return "proxy"
        except Exception:
            pass
    return "failed"


def main():
    PROD_DIR.mkdir(parents=True, exist_ok=True)
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

    data = json.loads(PRODUCTS.read_text())
    items = data if isinstance(data, list) else data.get("products") or data.get("items") or []
    stats = {"real": 0, "proxy": 0, "cached": 0, "failed": 0}

    for i, it in enumerate(items):
        pid = it.get("id") or f"p{i}"
        dest = PROD_DIR / f"{pid}.jpg"
        query = it.get("search_query") or it.get("name") or "fashion clothing"
        res = download(it.get("image_url"), dest, allow_proxy_query=query)
        stats[res] = stats.get(res, 0) + 1
        if res in ("real", "proxy", "cached"):
            # keep the original source, point the app at the local copy
            if "image_url_source" not in it and it.get("image_url"):
                it["image_url_source"] = it["image_url"]
            it["image_url"] = f"/static/img/products/{pid}.jpg"
        if (i + 1) % 25 == 0:
            print(f"  ...{i+1}/{len(items)}  {stats}")
        time.sleep(0.05)

    PRODUCTS.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"products: {stats}")

    # example outfit/garment photos for testing the product-identification vision
    samples = [
        "full body outfit street style", "woman denim jacket outfit", "man white t-shirt jeans",
        "sneakers flat lay", "summer dress outfit", "knit sweater outfit",
        "leather boots fashion", "blazer trousers outfit", "hoodie streetwear", "handbag accessory fashion",
    ]
    s_ok = 0
    for n, q in enumerate(samples, 1):
        dest = SAMPLE_DIR / f"sample_{n:02d}.jpg"
        if download(None, dest, allow_proxy_query=q) in ("real", "proxy", "cached"):
            s_ok += 1
    print(f"samples: {s_ok}/{len(samples)} into static/img/samples/")


if __name__ == "__main__":
    main()
