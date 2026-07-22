#!/usr/bin/env python3
"""PRODUCT-health sweep — exercises EVERY route and reports what is actually broken.

WHY THIS EXISTS
    Everything we measured until now was PROCESS health: tests pass, the merge landed,
    the page renders. All of it can be green while the product is broken. A live
    `HTTP 500` on POST /api/users/{id}/follow survived undetected for days simply
    because nothing in the system ever called that endpoint. "No test failed" is not
    "the product works".

WHAT IT DOES
    Enumerates the FastAPI route table (so a new endpoint is covered the day it is
    added — no one has to remember to test it), calls every route with plausible
    arguments against an isolated temp DB, and reports:
        * 5xx            -> a real crash, always a defect
        * unexpected 4xx -> usually a contract/arg mismatch worth a look
        * uncovered      -> routes this sweep could not call (coverage is REPORTED,
                            never silently skipped — see OW-015)

    Exit code is 1 only when a 5xx is found; the machine-readable list is written to
    ci-debug/health-sweep.json so it can become the agents' work queue instead of a
    human-written wishlist.

Run:  venv312/bin/python scripts/health_sweep.py
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import tempfile

os.environ.pop("ANTHROPIC_API_KEY", None)   # hermetic: never make live model calls
os.environ.pop("OPENAI_API_KEY", None)
os.environ.pop("DATABASE_URL", None)        # force SQLite, never touch a real Postgres

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

import app as appmod  # noqa: E402

# Plausible values per path-parameter name. A route whose params we cannot fill is
# reported as UNCOVERED rather than skipped silently.
PARAM_VALUES = {
    "user_id": "user_001",
    "post_id": "post_001",
    "item_id": "prod_ss_001",
    "product_id": "prod_ss_001",
    "listing_id": "1",
    "order_id": "1",
    "thread_id": "1",
    "look_id": "1",
    "id": "1",
}

# Minimal VALID bodies per route so the sweep exercises the real code path (a 2xx), not the
# input-validation guard (a 4xx). Each mirrors the endpoint's Pydantic model / required fields.
# Raising these raises REAL coverage — the % of routes whose logic we actually ran.
BODIES = {
    "/api/orders": {"product_name": "Linen blazer", "product_id": "p_test", "amount_usd": 10.0},
    "/api/moderate": {"text": "nice fit"},
    "/api/daily-log": {"date": "2026-07-22", "note": "test", "items": []},
    "/api/auth/register": {"username": "sweepuser", "email": "sweep@test.co", "password": "abc123"},
    "/api/wishlist/toggle": {"item_id": "prod_ss_001", "item_type": "marketplace"},
    "/api/bookings": {"stylist_id": "styl_1", "stylist_name": "Test", "session_type": "video", "slot_label": "Mon 3pm"},
    "/api/challenge/complete": {"challenge_id": "daily_scan"},
    "/api/stylist/chat": {"question": "what should I wear today?"},
    "/api/outfit/generate": {"occasion": "coffee date", "wardrobe": [], "style_vibes": ["minimal"]},
    "/api/marketplace/assist": {"query": "vintage denim jacket"},
    "/api/closet/confirm": {"user_id": "user_001", "items": []},
    "/api/challenge/complete/": {"challenge_id": "daily_scan"},
    "/api/posts/{post_id}/comments": {"text": "great look"},
    "/api/dm/send": {"to_user_id": "user_002", "text": "hi"},
    "/api/agent/summary": {"period": "week"},
    "/api/analytics/wear": {"item_id": "prod_ss_001"},
    "/api/stories": {"user_id": "user_001", "image_url": "/static/img/products/prod_ss_001.jpg"},
}

# Query-string params for GET routes that require them (else a 400/422 that isn't a bug).
QUERY = {
    "/api/search": {"q": "denim"},
    "/api/weather": {"lat": "32.08", "lon": "34.78"},
    "/api/product-image": {"q": "denim jacket"},
    "/api/analytics/wardrobe": {"user_id": "user_001"},
}

SKIP = {"/openapi.json", "/docs", "/redoc", "/docs/oauth2-redirect"}


def _fill(path: str):
    """Substitute {param} placeholders; return (concrete_path, ok)."""
    out = path
    while "{" in out:
        start = out.index("{")
        end = out.index("}", start)
        name = out[start + 1:end]
        if name not in PARAM_VALUES:
            return path, False
        out = out[:start] + PARAM_VALUES[name] + out[end + 1:]
    return out, True


def main() -> int:
    tmp = tempfile.mkdtemp(prefix="awear_health_")
    appmod.DB_PATH = pathlib.Path(tmp) / "health.db"
    appmod.init_db()

    crashes, suspicious, uncovered, ok = [], [], [], 0

    with TestClient(appmod.app) as client:
        for route in appmod.app.routes:
            path = getattr(route, "path", None)
            methods = getattr(route, "methods", set()) or set()
            if not path or path in SKIP or path.startswith("/static"):
                continue
            for method in sorted(methods & {"GET", "POST", "PATCH", "DELETE"}):
                concrete, fillable = _fill(path)
                if not fillable:
                    uncovered.append(f"{method} {path} (unknown path param)")
                    continue
                try:
                    kwargs = {}
                    if method in {"POST", "PATCH"}:
                        kwargs["json"] = BODIES.get(path, {})
                    if path in QUERY:
                        kwargs["params"] = QUERY[path]
                    resp = client.request(method, concrete, timeout=30, **kwargs)
                    code = resp.status_code
                except Exception as exc:  # a raised exception IS a crash
                    crashes.append({"route": f"{method} {path}", "status": "EXCEPTION",
                                    "detail": f"{type(exc).__name__}: {exc}"[:200]})
                    continue

                if code >= 500:
                    crashes.append({"route": f"{method} {path}", "status": code,
                                    "detail": resp.text[:200]})
                elif code in (400, 404, 422):
                    # often just our stub args, but worth surfacing — never hidden
                    suspicious.append({"route": f"{method} {path}", "status": code})
                else:
                    ok += 1

    total = ok + len(crashes) + len(suspicious) + len(uncovered)
    print("\n════════ AWEAR PRODUCT-HEALTH SWEEP ════════")
    print(f"\n① CRASHES (5xx / exception) — always a real defect")
    if not crashes:
        print("   ✓ none")
    for c in crashes:
        print(f"   ✗ {c['route']} -> {c['status']}  {c.get('detail','')[:120]}")

    print(f"\n② UNEXPECTED 4xx — check the contract (may be stub-arg noise)")
    if not suspicious:
        print("   ✓ none")
    for s in suspicious[:20]:
        print(f"   • {s['route']} -> {s['status']}")
    if len(suspicious) > 20:
        print(f"   … +{len(suspicious)-20} more")

    print(f"\n③ UNCOVERED — reported, NOT silently skipped (OW-015)")
    if not uncovered:
        print("   ✓ none")
    for u in uncovered:
        print(f"   • {u}")

    covered_pct = round(100 * ok / total) if total else 0
    print(f"\n──────── {ok}/{total} routes returned OK ({covered_pct}% exercised) · "
          f"{len(crashes)} crashes · {len(uncovered)} uncovered ────────\n")

    pathlib.Path("ci-debug").mkdir(exist_ok=True)
    pathlib.Path("ci-debug/health-sweep.json").write_text(json.dumps(
        {"crashes": crashes, "suspicious": suspicious, "uncovered": uncovered,
         "ok": ok, "total": total}, indent=2), encoding="utf-8")

    return 1 if crashes else 0


if __name__ == "__main__":
    sys.exit(main())
