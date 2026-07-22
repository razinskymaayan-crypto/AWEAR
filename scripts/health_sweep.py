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
        * ext-dep        -> routes that always 5xx without optional external creds
                            (GMAIL, Google Calendar, open-meteo) — not counted as crashes

    Exit code is 1 only when a 5xx is found; the machine-readable list is written to
    ci-debug/health-sweep.json so it can become the agents' work queue instead of a
    human-written wishlist.

Run:  venv312/bin/python scripts/health_sweep.py
"""
from __future__ import annotations

import base64
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
    "year": "2025",       # GET /api/analytics/wrapped/{year}
    "booking_id": "1",    # DELETE /api/bookings/{booking_id}
    "story_id": "1",      # DELETE /api/stories/{story_id}
}

# Minimal valid bodies for POST/PATCH routes that need one.
BODIES = {
    "/api/orders": {"product_name": "Linen blazer", "product_id": "p_test", "amount_usd": 10.0},
    "/api/moderate": {"text": "nice fit"},
    # Agent management (GMAIL / Google Calendar) — bodies valid; but listed in
    # KNOWN_EXTERNAL_DEPS so 5xx doesn't count as a crash in hermetic CI.
    "/api/agent/summary": {
        "agent": "steve", "department": "Engineering",
        "attendees": "sam, oren", "summary": "weekly sync",
    },
    "/api/agent/schedule": {
        "agent": "steve", "title": "Design review",
        "start_iso": "2026-07-22T10:00:00Z", "end_iso": "2026-07-22T11:00:00Z",
    },
    "/api/agent/meeting": {
        "organizer": "steve", "participants": ["sam", "oren"],
        "title": "Standup", "start_iso": "2026-07-22T10:00:00Z", "end_iso": "2026-07-22T10:30:00Z",
    },
    "/api/outfit/generate": {"occasion": "casual", "wardrobe": []},
    "/api/stylist/chat": {"question": "What should I wear today?"},
    "/api/posts/{post_id}/comments": {"text": "Nice fit!"},
    "/api/daily-log": {"date": "2026-07-22"},
    "/api/auth/register": {
        "username": "sweep_usr", "email": "sweep@test.awear", "password": "Password1!",
    },
    "/api/marketplace/assist": {"query": "blue denim jacket"},
    "/api/challenge/complete": {"challenge_id": "first_outfit"},
    "/api/bookings": {
        "stylist_id": "sty_001", "stylist_name": "Alex",
        "session_type": "Virtual", "slot_label": "Mon 10am",
    },
    "/api/wishlist/toggle": {"item_id": "prod_ss_001"},
    "/api/closet/confirm": {
        "user_id": "user_001", "client_ref": "sweep_ref_001",
        "items": [{"accepted": False, "ai": {"name": "Sweep test item"}, "final": {}}],
    },
    "/api/closet/{item_id}": {"name": "Updated jacket"},  # PATCH — one patchable field
    "/api/analytics/wear": {"item_id": "prod_ss_001", "item_name": "Linen blazer"},
    "/api/stories": {"image_url": "https://example.com/sweep-test.jpg"},
    "/api/dm/send": {"to_user_id": "user_002", "text": "Hey there!"},
}

# Query params for GET routes whose required params aren't path segments.
QUERY_PARAMS = {
    "/api/product-image": {"q": "blue jeans"},
    "/api/search": {"q": "jacket"},
    # W10= is base64(b'[]') — empty array; endpoint adds "==" so decode sees "W10===" which
    # Python's lenient b64decode handles fine, returning [] and then zeroed stats (200).
    "/api/analytics/wardrobe": {"wardrobe": "W10="},
    # weather added to KNOWN_EXTERNAL_DEPS below; still listed here for the call
    "/api/weather": {"lat": "32.09", "lon": "34.78"},
}

# Routes that always 5xx without optional external credentials (GMAIL, Google Calendar,
# open-meteo network). Their failure is expected in hermetic CI — count as "ext-dep"
# rather than a crash so the sweep stays signal-only.
KNOWN_EXTERNAL_DEPS = {
    "POST /api/agent/summary",   # needs GMAIL_APP_PASSWORD
    "POST /api/agent/schedule",  # needs Google Calendar token
    "POST /api/agent/meeting",   # needs Google Calendar token
    "GET /api/weather",          # calls open-meteo — may 502 without network
    "GET /api/product-image",    # redirects to loremflickr.com — external image host
}

# Routes that upload multipart/form-data instead of JSON.
FILE_ROUTES = {"/api/analyze", "/api/generate-garment"}

# Minimal 1×1 transparent PNG — satisfies UploadFile validators on file routes.
_1PX_PNG = base64.b64decode(
    b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
    b"+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)

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

    # Seed rows so DELETE/PATCH path-param routes can resolve their targets.
    # user_key="testclient" matches what FastAPI TestClient sets as request.client.host.
    with appmod._get_db() as db:
        # Closet item for DELETE + PATCH /api/closet/{item_id}
        db.execute(
            "INSERT OR IGNORE INTO closet_items "
            "(id, user_key, name, category, color, brand, search_query, "
            " price_estimate_usd, confidence, source) "
            "VALUES (?,?,?,?,?,?,?,?,?,?)",
            (PARAM_VALUES["item_id"], "testclient", "Sweep jacket", "jacket",
             "blue", "Brand", "blue jacket", 50.0, "high", "scan"),
        )
        # Booking for DELETE /api/bookings/{booking_id}
        db.execute(
            "INSERT OR IGNORE INTO stylist_bookings "
            "(id, user_key, stylist_id, stylist_name, session_type, slot_label) "
            "VALUES (?,?,?,?,?,?)",
            (1, "testclient", "sty_001", "Alex", "Virtual", "Mon 10am"),
        )
        # Story for DELETE /api/stories/{story_id}
        db.execute(
            "INSERT OR IGNORE INTO stories (id, user_key, image_url, caption, created_at) "
            "VALUES (?,?,?,?,datetime('now'))",
            (1, "testclient", "https://example.com/test.jpg", ""),
        )
        db.commit()

    crashes, suspicious, ext_dep, uncovered, ok = [], [], [], [], 0

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
                    kwargs: dict = {}
                    if method in {"POST", "PATCH"}:
                        if path in FILE_ROUTES:
                            kwargs["files"] = {"photo": ("test.png", _1PX_PNG, "image/png")}
                        else:
                            kwargs["json"] = BODIES.get(path, {})
                    elif method == "GET" and path in QUERY_PARAMS:
                        kwargs["params"] = QUERY_PARAMS[path]
                    resp = client.request(method, concrete, timeout=30, **kwargs)
                    code = resp.status_code
                except Exception as exc:  # a raised exception IS a crash
                    route_key = f"{method} {path}"
                    if route_key in KNOWN_EXTERNAL_DEPS:
                        ext_dep.append({"route": route_key, "status": "EXCEPTION",
                                        "note": f"{type(exc).__name__}: {exc}"[:120]})
                    else:
                        crashes.append({"route": route_key, "status": "EXCEPTION",
                                        "detail": f"{type(exc).__name__}: {exc}"[:200]})
                    continue

                route_key = f"{method} {path}"
                if route_key in KNOWN_EXTERNAL_DEPS and code >= 400:
                    # 4xx or 5xx from a known external dep — not a product bug
                    ext_dep.append({"route": route_key, "status": code,
                                    "note": "expected — requires external credentials/network"})
                elif code >= 500:
                    crashes.append({"route": route_key, "status": code,
                                    "detail": resp.text[:200]})
                elif code in (400, 404, 422):
                    suspicious.append({"route": f"{method} {path}", "status": code})
                else:
                    ok += 1

                # After deleting the seeded closet item, re-insert so PATCH (which
                # comes later in the same alphabetical-sort pass) can still find it.
                if method == "DELETE" and path == "/api/closet/{item_id}":
                    with appmod._get_db() as db:
                        db.execute(
                            "INSERT OR IGNORE INTO closet_items "
                            "(id, user_key, name, category, confidence, source) "
                            "VALUES (?,?,?,?,?,?)",
                            (PARAM_VALUES["item_id"], "testclient",
                             "Sweep jacket", "jacket", "high", "scan"),
                        )
                        db.commit()

    total = ok + len(crashes) + len(suspicious) + len(ext_dep) + len(uncovered)
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

    print(f"\n④ EXTERNAL DEPS — expected 5xx without credentials (not crashes)")
    if not ext_dep:
        print("   ✓ none")
    for e in ext_dep:
        print(f"   ⚠ {e['route']} -> {e['status']}  {e.get('note','')}")

    covered_pct = round(100 * ok / total) if total else 0
    print(f"\n──────── {ok}/{total} routes returned OK ({covered_pct}% exercised) · "
          f"{len(crashes)} crashes · {len(uncovered)} uncovered · "
          f"{len(ext_dep)} ext-dep ────────\n")

    pathlib.Path("ci-debug").mkdir(exist_ok=True)
    pathlib.Path("ci-debug/health-sweep.json").write_text(json.dumps(
        {"crashes": crashes, "suspicious": suspicious, "uncovered": uncovered,
         "ext_dep": ext_dep, "ok": ok, "total": total}, indent=2), encoding="utf-8")

    return 1 if crashes else 0


if __name__ == "__main__":
    sys.exit(main())
