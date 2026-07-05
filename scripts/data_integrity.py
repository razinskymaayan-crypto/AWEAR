#!/usr/bin/env python3
"""Data integrity checker for static/data/*.json.

Why this exists
---------------
Incident BE-TAG-INTEGRITY (2026-07-04): posts.json `items_tagged` referenced
product ids that did not exist in products.json, so 100% of feed item-pills
opened a broken sheet. A manual spot-check grep missed it -- only a
programmatic full-set check catches this class of bug. This script is the
enforcement mechanism: run it before committing ANY change to
static/data/*.json.

What it checks
--------------
ERRORS (any error -> exit code 1):
  1. posts.json / products.json / profiles.json parse as JSON, non-empty lists
  2. `id` unique within each of the three files
  3. Orphan tags: every id in every post's items_tagged exists in products.json
  4. Every post's user_id exists in profiles.json
  5. Product field validation (required strings, price > 0, in_stock bool,
     tags list of strings, category in ALLOWED_CATEGORIES)
  6. Post field validation (required strings, likes int >= 0, items_tagged list)
  7. Profile field validation (required strings)

WARNINGS (reported, do not fail the run):
  8. Fragment consistency: _products_*.json vs merged products.json
     (cross-fragment dup ids, ids missing either direction, field drift)
  9. Duplicate image_url across products
 10. Count of products referenced by zero posts (visibility only)

Note: profiles[].posts_count / followers / following are intentionally
inflated demo numbers and are NOT validated against posts.json.

How to run
----------
    python3 scripts/data_integrity.py                # from repo root
    python3 scripts/data_integrity.py --data-dir /tmp/copy   # test a copy

Exit code 0 = all error checks passed; 1 = at least one error.
Stdlib only -- no third-party dependencies.
"""

import argparse
import collections
import glob
import json
import sys
from pathlib import Path

ALLOWED_CATEGORIES = {"top", "bottoms", "outerwear", "shoes", "hat", "accessory"}

LIST_CAP = 20  # max issue lines printed per check

errors = []    # (check_name, [issue, ...])
warnings = []  # (check_name, [issue, ...])


def _is_nonempty_str(v):
    return isinstance(v, str) and v.strip() != ""


def report_check(name, issues, is_warning=False):
    """Print one PASS/FAIL/WARN line + capped issue lines; record the result."""
    if not issues:
        print("PASS  %s" % name)
        return
    status = "WARN" if is_warning else "FAIL"
    print("%s  %s" % (status, name))
    for issue in issues[:LIST_CAP]:
        print("    - %s" % issue)
    if len(issues) > LIST_CAP:
        print("    ... and %d more" % (len(issues) - LIST_CAP))
    (warnings if is_warning else errors).append((name, issues))


# ---------------------------------------------------------------- ERROR checks

def check_parse(data_dir):
    """Check 1: files parse as JSON and are non-empty lists."""
    data = {}
    for fname in ("posts.json", "products.json", "profiles.json"):
        issues = []
        path = data_dir / fname
        try:
            with open(path, encoding="utf-8") as f:
                parsed = json.load(f)
            if not isinstance(parsed, list):
                issues.append("%s: top-level value is %s, expected list"
                              % (fname, type(parsed).__name__))
            elif not parsed:
                issues.append("%s: list is empty" % fname)
            else:
                data[fname] = parsed
        except FileNotFoundError:
            issues.append("%s: file not found at %s" % (fname, path))
        except json.JSONDecodeError as e:
            issues.append("%s: invalid JSON -- %s" % (fname, e))
        report_check("parse %s (non-empty JSON list)" % fname, issues)
    return data


def check_unique_ids(fname, records):
    counts = collections.Counter(r.get("id") for r in records)
    issues = ["duplicate id %r (appears %d times)" % (i, n)
              for i, n in counts.items() if n > 1]
    report_check("unique ids in %s" % fname, issues)


def check_orphan_tags(posts, product_ids):
    """Check 3: every items_tagged entry exists in products.json (BE-TAG-INTEGRITY)."""
    issues = []
    for post in posts:
        tags = post.get("items_tagged")
        pid = post.get("id", "<no id>")
        if not isinstance(tags, list):
            issues.append("post %s: items_tagged is %s, expected list"
                          % (pid, type(tags).__name__))
            continue
        for t in tags:
            if not isinstance(t, str):
                issues.append("post %s: items_tagged entry %r is not a string" % (pid, t))
            elif t not in product_ids:
                issues.append("post %s: orphan product id %r (not in products.json)" % (pid, t))
    report_check("orphan tags: posts.items_tagged -> products.id", issues)


def check_post_user_ids(posts, profile_ids):
    issues = ["post %s: user_id %r not in profiles.json"
              % (p.get("id", "<no id>"), p.get("user_id"))
              for p in posts if p.get("user_id") not in profile_ids]
    report_check("posts.user_id -> profiles.id", issues)


def check_product_fields(products):
    issues = []
    for p in products:
        pid = p.get("id", "<no id>")
        for field in ("id", "name", "brand", "category", "image_url", "search_query"):
            if not _is_nonempty_str(p.get(field)):
                issues.append("product %s: %s is not a non-empty string (%r)"
                              % (pid, field, p.get(field)))
        price = p.get("price_estimate_usd")
        if not isinstance(price, (int, float)) or isinstance(price, bool) or price <= 0:
            issues.append("product %s: price_estimate_usd must be a number > 0 (%r)"
                          % (pid, price))
        if not isinstance(p.get("in_stock"), bool):
            issues.append("product %s: in_stock must be a bool (%r)" % (pid, p.get("in_stock")))
        tags = p.get("tags")
        if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
            issues.append("product %s: tags must be a list of strings (%r)" % (pid, tags))
        if p.get("category") not in ALLOWED_CATEGORIES:
            issues.append("product %s: category %r not in %s"
                          % (pid, p.get("category"), sorted(ALLOWED_CATEGORIES)))
    report_check("product field validation", issues)


def check_post_fields(posts):
    issues = []
    for p in posts:
        pid = p.get("id", "<no id>")
        for field in ("id", "user_id", "image_url", "caption"):
            if not _is_nonempty_str(p.get(field)):
                issues.append("post %s: %s is not a non-empty string (%r)"
                              % (pid, field, p.get(field)))
        likes = p.get("likes")
        if not isinstance(likes, int) or isinstance(likes, bool) or likes < 0:
            issues.append("post %s: likes must be an int >= 0 (%r)" % (pid, likes))
        if not isinstance(p.get("items_tagged"), list):
            issues.append("post %s: items_tagged must be a list (may be empty) (%r)"
                          % (pid, p.get("items_tagged")))
    report_check("post field validation", issues)


def check_profile_fields(profiles):
    issues = []
    for p in profiles:
        pid = p.get("id", "<no id>")
        for field in ("id", "username", "display_name", "avatar_url"):
            if not _is_nonempty_str(p.get(field)):
                issues.append("profile %s: %s is not a non-empty string (%r)"
                              % (pid, field, p.get(field)))
    report_check("profile field validation", issues)


# -------------------------------------------------------------- WARNING checks

def check_fragments(data_dir, products):
    """Check 8: _products_*.json fragments vs merged products.json."""
    merged_by_id = {p.get("id"): p for p in products}
    frag_paths = sorted(glob.glob(str(data_dir / "_products_*.json")))
    if not frag_paths:
        report_check("fragment consistency (_products_*.json)",
                     ["no _products_*.json fragment files found"], is_warning=True)
        return

    issues = []
    frag_by_id = {}        # id -> (fragment name, object)
    frag_id_sources = collections.defaultdict(list)  # id -> [fragment names]
    for path in frag_paths:
        name = Path(path).name
        try:
            with open(path, encoding="utf-8") as f:
                frag = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            issues.append("%s: unreadable -- %s" % (name, e))
            continue
        if not isinstance(frag, list):
            issues.append("%s: top-level value is not a list" % name)
            continue
        for obj in frag:
            oid = obj.get("id")
            frag_id_sources[oid].append(name)
            frag_by_id[oid] = (name, obj)

    # (a) ids duplicated across fragments
    for oid, sources in sorted(frag_id_sources.items()):
        if len(sources) > 1:
            issues.append("id %r appears in multiple fragments: %s" % (oid, ", ".join(sources)))

    # (b) fragment ids missing from products.json
    for oid in sorted(set(frag_id_sources) - set(merged_by_id)):
        issues.append("id %r in fragments but missing from products.json (source: %s)"
                      % (oid, ", ".join(frag_id_sources[oid])))

    # (c) merged ids missing from all fragments
    for oid in sorted(set(merged_by_id) - set(frag_id_sources)):
        issues.append("id %r in products.json but missing from all fragments" % oid)

    # (d) per-id field drift, capped at first 10
    drift_count = 0
    for oid in sorted(set(frag_id_sources) & set(merged_by_id)):
        frag_name, frag_obj = frag_by_id[oid]
        merged_obj = merged_by_id[oid]
        if frag_obj != merged_obj:
            drift_count += 1
            if drift_count <= 10:
                keys = sorted(k for k in set(frag_obj) | set(merged_obj)
                              if frag_obj.get(k) != merged_obj.get(k))
                issues.append("id %r drift between %s and products.json -- differing keys: %s"
                              % (oid, frag_name, ", ".join(keys)))
    if drift_count > 10:
        issues.append("... field drift on %d more id(s) not listed" % (drift_count - 10))

    report_check("fragment consistency (_products_*.json)", issues, is_warning=True)


def check_duplicate_image_urls(products):
    """Check 9: duplicate image_url across products (may be intentional reuse)."""
    by_url = collections.defaultdict(list)
    for p in products:
        by_url[p.get("image_url")].append(p.get("id", "<no id>"))
    dupes = [(url, ids) for url, ids in by_url.items() if len(ids) > 1]
    issues = ["image_url shared by %s: %s" % (", ".join(ids), url)
              for url, ids in dupes[:10]]
    if len(dupes) > 10:
        issues.append("... and %d more duplicated image_url(s)" % (len(dupes) - 10))
    report_check("duplicate image_url across products", issues, is_warning=True)


def check_unreferenced_products(posts, product_ids):
    """Check 10: products referenced by zero posts -- count only, visibility."""
    referenced = set()
    for p in posts:
        tags = p.get("items_tagged")
        if isinstance(tags, list):
            referenced.update(t for t in tags if isinstance(t, str))
    unref = len(product_ids - referenced)
    issues = []
    if unref:
        issues.append("%d of %d products are referenced by zero posts (fine -- visibility only)"
                      % (unref, len(product_ids)))
    report_check("products referenced by zero posts", issues, is_warning=True)


# ----------------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser(description="Integrity checks for static/data/*.json")
    parser.add_argument("--data-dir", default="static/data",
                        help="directory containing the data files (default: static/data)")
    args = parser.parse_args()
    data_dir = Path(args.data_dir)

    print("Data integrity check -- %s" % data_dir)
    print("-" * 60)

    data = check_parse(data_dir)
    posts = data.get("posts.json")
    products = data.get("products.json")
    profiles = data.get("profiles.json")

    if products is not None:
        check_unique_ids("products.json", products)
        check_product_fields(products)
    if posts is not None:
        check_unique_ids("posts.json", posts)
        check_post_fields(posts)
    if profiles is not None:
        check_unique_ids("profiles.json", profiles)
        check_profile_fields(profiles)

    product_ids = {p.get("id") for p in products} if products else set()
    profile_ids = {p.get("id") for p in profiles} if profiles else set()
    if posts is not None and products is not None:
        check_orphan_tags(posts, product_ids)
    if posts is not None and profiles is not None:
        check_post_user_ids(posts, profile_ids)

    if products is not None:
        check_fragments(data_dir, products)
        check_duplicate_image_urls(products)
    if posts is not None and products is not None:
        check_unreferenced_products(posts, product_ids)

    print("-" * 60)
    n_errors = sum(len(issues) for _, issues in errors)
    n_warnings = sum(len(issues) for _, issues in warnings)
    if n_warnings:
        print("%d warning(s) -- informational, not failing the run" % n_warnings)
    if n_errors:
        print("FAILED -- %d error(s)" % n_errors)
        return 1
    print("OK -- data integrity verified")
    return 0


if __name__ == "__main__":
    sys.exit(main())
