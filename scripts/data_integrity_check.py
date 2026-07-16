#!/usr/bin/env python3
"""Data-integrity audit for static/data/*.json (BE-TAG-INTEGRITY, MASTER_PLAN A6).

Checks, per the demo-reliability DoD:
  1. posts.json items_tagged -> every id exists in products.json (no orphans).
  2. Every product has a usable image field (image/image_url/img) or search_query.
  3. Prices are sane numbers (> 0, < 100000).
  4. posts.json author ids resolve against profiles.json.
  5. Duplicate product ids.

Exit 0 = clean, exit 1 = findings (printed).
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "static" / "data"


def load(name):
    with open(DATA / name) as f:
        return json.load(f)


def as_list(obj, key):
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        return obj.get(key, [])
    return []


def main() -> int:
    findings = []

    products = as_list(load("products.json"), "products")
    posts = as_list(load("posts.json"), "posts")
    profiles = as_list(load("profiles.json"), "profiles")

    print(f"products={len(products)} posts={len(posts)} profiles={len(profiles)}")

    # 5. duplicate ids
    seen, dupes = set(), []
    for p in products:
        pid = p.get("id")
        if pid in seen:
            dupes.append(pid)
        seen.add(pid)
    if dupes:
        findings.append(f"duplicate product ids: {dupes}")

    # 1. orphan tags
    pids = {p.get("id") for p in products}
    orphans = []
    for post in posts:
        for t in post.get("items_tagged", []):
            if t not in pids:
                orphans.append((post.get("id"), t))
    if orphans:
        findings.append(f"orphan items_tagged ({len(orphans)}): {orphans[:15]}")

    # 2. image coverage
    noimg = [
        p.get("id")
        for p in products
        if not (p.get("image") or p.get("image_url") or p.get("img") or p.get("search_query"))
    ]
    if noimg:
        findings.append(f"products with no image AND no search_query ({len(noimg)}): {noimg[:15]}")

    # 3. price sanity
    badprice = []
    for p in products:
        v = p.get("price_estimate_usd", p.get("price_usd", p.get("price")))
        if v is None or not isinstance(v, (int, float)) or not (0 < v < 100000):
            badprice.append((p.get("id"), v))
    if badprice:
        findings.append(f"bad prices ({len(badprice)}): {badprice[:15]}")

    # 4. post authors resolve
    prof_ids = {pr.get("id") for pr in profiles} | {pr.get("username") for pr in profiles}
    badauthor = []
    for post in posts:
        a = post.get("author") or post.get("user_id") or post.get("author_id")
        if a is not None and a not in prof_ids:
            badauthor.append((post.get("id"), a))
    if badauthor:
        findings.append(f"posts with unresolved author ({len(badauthor)}): {badauthor[:15]}")

    if findings:
        print("FINDINGS:")
        for f in findings:
            print(" -", f)
        return 1
    print("CLEAN — all integrity checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
