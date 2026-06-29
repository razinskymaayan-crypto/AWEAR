#!/usr/bin/env python3
"""Live smoke-test for AWEAR's real clothing scan (/api/analyze + Claude Vision).

ONE command to confirm, on the machine that has the key, whether the real scan
runs LIVE or silently falls back to DEMO — and WHY. Built for pre-demo confidence.

Usage:
    venv312/bin/python scripts/scan_smoke.py [path/to/image.jpg]

Behaviour:
  • No ANTHROPIC_API_KEY in the environment  -> prints "no_api_key" and exits 2
    WITHOUT making any network call (safe to run in CI / on a key-less box).
  • Key present -> runs the full in-process analyze path on a sample image and
    prints LIVE/DEMO, the demo_reason, the first item's brand/color/material,
    and the buy_options count. Exit 0 only if the scan ran LIVE.

This is a standalone diagnostic, NOT an ASGI endpoint — it uses FastAPI's
in-process TestClient, so SF-004 (no HTTP inside async endpoints) does not apply.
"""
import os
import sys

# Load .env exactly like the app does, so the key check matches production.
try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # noqa: BLE001 — dotenv optional; env var may already be set
    pass

SAMPLE = "static/img/closet/ds1.jpg"


def main() -> int:
    img_path = sys.argv[1] if len(sys.argv) > 1 else SAMPLE

    # 1) Key gate FIRST — never touch the network when no key is configured.
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("RESULT: no_api_key — ANTHROPIC_API_KEY not set; skipping live call.")
        print("        Set it in .env (and the GitHub secret) before the demo.")
        return 2

    if not os.path.exists(img_path):
        print(f"RESULT: error — sample image not found: {img_path}")
        return 3

    # 2) Run the full analyze path in-process (imports app, hits /api/analyze).
    from fastapi.testclient import TestClient

    import app as awear_app

    client = TestClient(awear_app.app)
    with open(img_path, "rb") as fh:
        resp = client.post(
            "/api/analyze",
            files={"photo": (os.path.basename(img_path), fh, "image/jpeg")},
        )

    if resp.status_code != 200:
        print(f"RESULT: error — /api/analyze returned HTTP {resp.status_code}")
        print(resp.text[:500])
        return 4

    data = resp.json()
    mode = data.get("mode")
    reason = data.get("demo_reason")
    items = data.get("items") or []
    first = items[0] if items else {}
    buy = first.get("buy_options") or []

    print(f"RESULT: {str(mode).upper()}  (demo_reason={reason})")
    print(f"  items detected : {len(items)}")
    if first:
        print(f"  first item     : {first.get('name')}")
        print(f"    brand_vibe   : {first.get('brand_vibe')}")
        print(f"    color        : {first.get('color')}")
        print(f"    material     : {first.get('material_guess')}")
        print(f"    search_query : {first.get('search_query')}")
        print(f"    buy_options  : {len(buy)}")
    print(f"  look_total_usd : {data.get('look_total_usd')}")

    # Also surface the diagnostics endpoint so the founder sees the same truth.
    # ?probe=1 makes one tiny extra live call to confirm the key is actually VALID
    # (not just present) — this is what distinguishes "key set but dead" from "key works".
    h = client.get("/api/scan-health?probe=1").json()
    print(f"  scan-health    : {h}")
    print(f"  key_valid      : {h.get('key_valid')}  (probe_error={h.get('probe_error')})")

    return 0 if mode == "live" else 1


if __name__ == "__main__":
    sys.exit(main())
