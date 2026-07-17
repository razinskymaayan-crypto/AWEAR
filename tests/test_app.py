"""Backend endpoint tests for AWEAR (app.py).

Focus: the money paths (orders, creator credits, commission), input validation,
idempotency, auth, rate limiting, and buy-routing — the things a regression would
break silently in front of an investor.
"""
import hashlib
import io
import sqlite3

import app as appmod
from conftest import _order_body, _tiny_jpeg_bytes

CREATOR_PCT = appmod.CREATOR_CREDIT_PCT      # 0.05
PRELOVED_PCT = appmod.PRELOVED_COMMISSION_PCT  # 0.08


# --------------------------------------------------------------------------- #
# Smoke / core reads
# --------------------------------------------------------------------------- #
def test_root_serves_html(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]


def test_core_get_endpoints_ok(client):
    for path in ("/api/products", "/api/categories", "/api/posts", "/api/profiles"):
        r = client.get(path)
        assert r.status_code == 200, f"{path} -> {r.status_code}"
        assert r.json() is not None


# --------------------------------------------------------------------------- #
# Orders — the money path (LOCKED economics: 5% creator credit, 8% preloved)
# --------------------------------------------------------------------------- #
def test_order_retail_no_influencer_zero_credit(client):
    r = client.post("/api/orders", json=_order_body(amount_usd=100.0))
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "placed"
    assert d["credit_amount"] == 0.0
    assert d["commission_usd"] == 0.0
    assert d["id"].startswith("ord_")


def test_order_with_influencer_credits_5pct(client):
    r = client.post("/api/orders", json=_order_body(amount_usd=200.0, influencer_id="user_carmel"))
    assert r.status_code == 200
    assert r.json()["credit_amount"] == round(200.0 * CREATOR_PCT, 2)  # 10.0


def test_order_preloved_commission_8pct(client):
    r = client.post("/api/orders", json=_order_body(amount_usd=50.0, kind="preloved"))
    assert r.status_code == 200
    assert r.json()["commission_usd"] == round(50.0 * PRELOVED_PCT, 2)  # 4.0


def test_order_missing_product_name_400(client):
    r = client.post("/api/orders", json=_order_body(product_name=""))
    assert r.status_code == 400


def test_order_negative_price_400(client):
    r = client.post("/api/orders", json=_order_body(amount_usd=-5.0))
    assert r.status_code == 400


def test_order_invalid_kind_400(client):
    r = client.post("/api/orders", json=_order_body(kind="stolen"))
    assert r.status_code == 400


def test_order_idempotent_client_ref(client):
    body = _order_body(amount_usd=75.0, client_ref="ref-abc-123")
    first = client.post("/api/orders", json=body).json()
    second = client.post("/api/orders", json=body).json()
    assert second["deduped"] is True
    assert second["order_id"] == first["order_id"]


def test_order_invalid_type_422(client):
    r = client.post("/api/orders", json={"product_name": "x", "amount_usd": "not-a-number"})
    assert r.status_code == 422  # Pydantic rejects non-numeric float


def test_orders_list_returns_created(client):
    client.post("/api/orders", json=_order_body(product_name="Wool coat", client_ref="list-1"))
    r = client.get("/api/orders")
    assert r.status_code == 200
    names = [it["product_name"] for it in r.json()["items"]]
    assert "Wool coat" in names


def test_wallet_shape(client):
    r = client.get("/api/wallet")
    assert r.status_code == 200
    assert "balance" in r.json() or "balance_usd" in r.json()


def test_wallet_credits_creator_by_user_id(client):
    client.post("/api/orders", json=_order_body(
        amount_usd=200.0, influencer_id="user_wallet_x", client_ref="wallet-x-1"))
    r = client.get("/api/wallet", params={"user_id": "user_wallet_x"})
    assert r.status_code == 200
    d = r.json()
    assert d["balance"] == round(200.0 * CREATOR_PCT, 2)  # 10.0
    assert any(c["item"] == "Linen blazer" for c in d["credits"])


def test_wallet_balance_sums_beyond_limit_50(client):
    import datetime as _dt
    with appmod._get_db() as db:
        for i in range(60):
            db.execute(
                """INSERT INTO credits (id, user_key, order_id, item_name, amount_usd, type, created_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (f"crd_bulk_{i}", "user_wallet_bulk", f"ord_bulk_{i}", "Bulk item",
                 1.0, "creator",
                 (_dt.datetime.utcnow() - _dt.timedelta(seconds=i)).isoformat()),
            )
        db.commit()
    r = client.get("/api/wallet", params={"user_id": "user_wallet_bulk"})
    assert r.status_code == 200
    d = r.json()
    assert d["balance"] == 60.0
    assert len(d["credits"]) == 50


def test_wallet_user_id_too_long_400(client):
    r = client.get("/api/wallet", params={"user_id": "x" * 65})
    assert r.status_code == 400


# --------------------------------------------------------------------------- #
# Buy-routing (resolve-product) — never a dead end
# --------------------------------------------------------------------------- #
def test_resolve_gibberish_is_archive(client):
    r = client.get("/api/resolve-product", params={"q": "zzqxwv nonsense 9999"})
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "archive"
    assert d["alternatives"] == []


def test_resolve_always_has_status(client):
    r = client.get("/api/resolve-product", params={"q": "tee", "category": "tops"})
    assert r.status_code == 200
    assert r.json()["status"] in ("exact", "similar", "archive")


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #
def test_register_happy_path(client):
    r = client.post("/api/auth/register",
                    json={"username": "alice_t", "email": "alice_t@ex.com", "password": "secret1"})
    assert r.status_code == 200
    assert r.json()["user_id"]


def test_register_short_password_400(client):
    r = client.post("/api/auth/register",
                    json={"username": "bob_t", "email": "bob_t@ex.com", "password": "abc"})
    assert r.status_code == 400


def test_register_missing_fields_400(client):
    r = client.post("/api/auth/register", json={"username": "x"})
    assert r.status_code == 400


def test_register_duplicate_409(client):
    body = {"username": "dup_user", "email": "dup@ex.com", "password": "secret1"}
    client.post("/api/auth/register", json=body)
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 409


def test_register_token_is_not_user_id(client):
    r = client.post("/api/auth/register",
                    json={"username": "carol_t", "email": "carol_t@ex.com", "password": "secret1"})
    assert r.status_code == 200
    body = r.json()
    assert body["token"]
    assert body["token"] != body["user_id"]


def test_get_me_no_token_401(client):
    r = client.post("/api/auth/register",
                    json={"username": "dave_t", "email": "dave_t@ex.com", "password": "secret1"})
    user_id = r.json()["user_id"]
    r2 = client.get(f"/api/auth/me/{user_id}")
    assert r2.status_code == 401


def test_get_me_own_token_returns_email(client):
    r = client.post("/api/auth/register",
                    json={"username": "erin_t", "email": "erin_t@ex.com", "password": "secret1"})
    body = r.json()
    r2 = client.get(f"/api/auth/me/{body['user_id']}",
                     headers={"Authorization": f"Bearer {body['token']}"})
    assert r2.status_code == 200
    assert r2.json()["email"] == "erin_t@ex.com"


def test_get_me_other_users_token_403(client):
    a = client.post("/api/auth/register",
                    json={"username": "frank_t", "email": "frank_t@ex.com", "password": "secret1"}).json()
    b = client.post("/api/auth/register",
                    json={"username": "gina_t", "email": "gina_t@ex.com", "password": "secret1"}).json()
    r = client.get(f"/api/auth/me/{b['user_id']}",
                   headers={"Authorization": f"Bearer {a['token']}"})
    assert r.status_code == 403


def test_patch_other_users_token_403_and_unchanged(client):
    a = client.post("/api/auth/register",
                    json={"username": "harry_t", "email": "harry_t@ex.com", "password": "secret1"}).json()
    b = client.post("/api/auth/register",
                    json={"username": "ivy_t", "email": "ivy_t@ex.com", "password": "secret1"}).json()

    r = client.patch(f"/api/auth/me/{b['user_id']}",
                      json={"display_name": "hacked"},
                      headers={"Authorization": f"Bearer {a['token']}"})
    assert r.status_code == 403

    # verify B's display_name is unchanged, via B's own GET
    check = client.get(f"/api/auth/me/{b['user_id']}",
                        headers={"Authorization": f"Bearer {b['token']}"})
    assert check.json()["display_name"] != "hacked"


def test_patch_junk_token_401(client):
    a = client.post("/api/auth/register",
                    json={"username": "jack_t", "email": "jack_t@ex.com", "password": "secret1"}).json()
    r = client.patch(f"/api/auth/me/{a['user_id']}",
                      json={"display_name": "whatever"},
                      headers={"Authorization": "Bearer nonsense"})
    assert r.status_code == 401


def test_patch_own_profile_updates_field(client):
    a = client.post("/api/auth/register",
                    json={"username": "karen_t", "email": "karen_t@ex.com", "password": "secret1"}).json()
    r = client.patch(f"/api/auth/me/{a['user_id']}",
                      json={"display_name": "Karen T"},
                      headers={"Authorization": f"Bearer {a['token']}"})
    assert r.status_code == 200
    assert "display_name" in r.json()["updated"]

    check = client.get(f"/api/auth/me/{a['user_id']}",
                        headers={"Authorization": f"Bearer {a['token']}"})
    assert check.json()["display_name"] == "Karen T"


def test_login_token_works_on_get_me(client):
    reg = client.post("/api/auth/register",
                      json={"username": "leo_t", "email": "leo_t@ex.com", "password": "secret1"}).json()
    login = client.post("/api/auth/login",
                        json={"email": "leo_t@ex.com", "password": "secret1"}).json()
    assert login["token"]
    r = client.get(f"/api/auth/me/{reg['user_id']}",
                    headers={"Authorization": f"Bearer {login['token']}"})
    assert r.status_code == 200
    assert r.json()["email"] == "leo_t@ex.com"


# --------------------------------------------------------------------------- #
# Password hashing — bcrypt with per-user salt + legacy SHA-256 migration
# --------------------------------------------------------------------------- #
def _stored_hash(email):
    with appmod._get_db() as db:
        row = db.execute("SELECT password_hash FROM users WHERE email=?", (email,)).fetchone()
    return row[0]


def test_password_hashes_are_salted_and_bcrypt(client):
    # Two users, SAME password -> stored hashes must differ (per-user salt)
    # and both must be bcrypt (start with "$2"). This fails on the old
    # unsalted SHA-256 code: identical passwords produced identical digests.
    client.post("/api/auth/register",
                json={"username": "mia_t", "email": "mia_t@ex.com", "password": "samepass1"})
    client.post("/api/auth/register",
                json={"username": "nina_t", "email": "nina_t@ex.com", "password": "samepass1"})
    hash_a = _stored_hash("mia_t@ex.com")
    hash_b = _stored_hash("nina_t@ex.com")
    assert hash_a != hash_b
    assert hash_a.startswith("$2")
    assert hash_b.startswith("$2")


def test_login_round_trip_correct_and_wrong_password(client):
    client.post("/api/auth/register",
                json={"username": "otto_t", "email": "otto_t@ex.com", "password": "correcthorse"})

    ok = client.post("/api/auth/login",
                      json={"email": "otto_t@ex.com", "password": "correcthorse"})
    assert ok.status_code == 200
    assert ok.json()["token"]

    bad = client.post("/api/auth/login",
                       json={"email": "otto_t@ex.com", "password": "wrongpassword"})
    assert bad.status_code == 401


def test_legacy_sha256_hash_migrates_to_bcrypt_on_login(client):
    # Simulate a pre-migration user: stored hash is legacy SHA-256, not bcrypt.
    email = "petra_t@ex.com"
    password = "legacypass1"
    legacy_hash = hashlib.sha256(password.encode()).hexdigest()
    user_id = f"user_petra_t_{9999999}"
    with appmod._get_db() as db:
        db.execute(
            """
            INSERT INTO users (id, username, email, password_hash, display_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, "petra_t", email, legacy_hash, "petra_t", 0),
        )

    assert _stored_hash(email) == legacy_hash
    assert not _stored_hash(email).startswith("$2")

    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200
    assert r.json()["token"]

    # After a successful legacy login, the stored hash is upgraded in place.
    upgraded = _stored_hash(email)
    assert upgraded.startswith("$2")
    assert upgraded != legacy_hash


# --------------------------------------------------------------------------- #
# Comments + notifications — SQLite persistence (BE-005 migration off the old
# in-memory dicts, _comments_store / _notifications_store). These prove the
# data survives a fresh connection (i.e. a process restart), not just that
# the endpoint returns 200.
# --------------------------------------------------------------------------- #
def test_comment_persists_in_sqlite(client):
    r = client.post("/api/posts/post_001/comments", json={"text": "sqlite persistence probe"})
    assert r.status_code == 200
    comment = r.json()
    assert comment["id"].startswith("c_post_001_")
    assert comment["text"] == "sqlite persistence probe"

    # Open a BRAND NEW sqlite3 connection directly on the DB file (not the
    # app's _get_db(), a fresh one) — proves the row lives in SQLite, not in
    # process memory. Fails on the old in-memory-dict code: no "comments"
    # table would exist at all.
    import sqlite3
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        row = conn.execute(
            "SELECT id, post_id, user_key, text FROM comments WHERE id = ?",
            (comment["id"],),
        ).fetchone()
    finally:
        conn.close()
    assert row is not None
    assert row[1] == "post_001"
    assert row[3] == "sqlite persistence probe"


def test_comments_pagination_and_total(client):
    post_id = "post_002"
    for i in range(5):
        r = client.post(f"/api/posts/{post_id}/comments", json={"text": f"comment {i}"})
        assert r.status_code == 200

    all_items = client.get(f"/api/posts/{post_id}/comments", params={"limit": 100, "offset": 0}).json()
    assert all_items["total"] == 5
    assert len(all_items["items"]) == 5
    # Insertion order preserved (oldest first, matching the old list-append order).
    assert [it["text"] for it in all_items["items"]] == [f"comment {i}" for i in range(5)]

    page = client.get(f"/api/posts/{post_id}/comments", params={"limit": 2, "offset": 2}).json()
    assert page["total"] == 5
    assert [it["text"] for it in page["items"]] == ["comment 2", "comment 3"]


def test_comments_get_unknown_post_empty(client):
    r = client.get("/api/posts/post_does_not_exist_xyz/comments")
    assert r.status_code == 200
    assert r.json() == {"items": [], "total": 0}


# --------------------------------------------------------------------------- #
# Moderation fail-open/fail-closed (P2 audit fix): moderate_comment() must
# distinguish "no key configured" (demo, SF-003, fails OPEN) from "key
# configured but the call broke" (infra error, fails CLOSED for public
# comments). Old code collapsed both into the same
# {"harmful": False, "fallback": True} shape, so add_comment() always
# published regardless of which case it was. See app.py moderate_comment()
# and add_comment() docstrings for the full rationale.
# --------------------------------------------------------------------------- #
def test_moderate_infra_error_holds_comment(client, monkeypatch):
    # Key IS configured (so we're NOT in the demo branch) but the actual
    # Claude call raises -> must be classified "infra_error", not silently
    # fail open. Old code: no "mode" distinction existed at all, and
    # add_comment() published on ANY moderation failure -> this test's
    # "status == held" assertion fails on the old code (comment publishes as
    # if nothing happened), and the "not in GET" assertion fails too.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-infra-error-case")

    def _raise(*a, **kw):
        raise RuntimeError("simulated network failure")

    monkeypatch.setattr(appmod.client.messages, "create", _raise)

    post_id = "post_003"
    r = client.post(f"/api/posts/{post_id}/comments", json={"text": "held comment probe"})
    assert r.status_code == 200
    comment = r.json()
    assert comment["status"] == "held"

    # Held comments must not appear in the public GET.
    listing = client.get(f"/api/posts/{post_id}/comments", params={"limit": 100}).json()
    assert comment["id"] not in [it["id"] for it in listing["items"]]
    assert "held comment probe" not in [it["text"] for it in listing["items"]]

    # The row still exists in SQLite (text not lost), just not public.
    import sqlite3
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        row = conn.execute(
            "SELECT status, text FROM comments WHERE id = ?", (comment["id"],)
        ).fetchone()
    finally:
        conn.close()
    assert row is not None
    assert row[0] == "held"
    assert row[1] == "held comment probe"


def test_moderate_demo_mode_still_publishes(client, monkeypatch):
    # Regression guard: with NO key configured (the default CI/demo state),
    # a comment must still publish immediately (status visible, appears in
    # GET) exactly as before this fix — the investor demo must work with
    # zero keys (SF-003). This is the pre-existing fail-open path; it must
    # NOT have been accidentally flipped to fail-closed by this change.
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    post_id = "post_004"
    r = client.post(f"/api/posts/{post_id}/comments", json={"text": "demo publish probe"})
    assert r.status_code == 200
    comment = r.json()
    assert comment["status"] == "visible"

    listing = client.get(f"/api/posts/{post_id}/comments", params={"limit": 100}).json()
    assert comment["id"] in [it["id"] for it in listing["items"]]
    assert "demo publish probe" in [it["text"] for it in listing["items"]]


def test_moderate_endpoint_infra_error_mode_and_shape(client, monkeypatch):
    # Direct /api/moderate contract test: key configured + client raising ->
    # mode == "infra_error", error is a bounded enum string (never raw
    # exception text), harmful is None (unknown, not "known safe"). Old code
    # had no "mode" key at all, so `"mode" in body` fails on the old code,
    # and `harmful is None` fails too (old code always returned False).
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-moderate-endpoint")

    def _raise(*a, **kw):
        raise RuntimeError("simulated moderation backend failure")

    monkeypatch.setattr(appmod.client.messages, "create", _raise)

    r = client.post("/api/moderate", json={"text": "some comment text"})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "infra_error"
    assert body["harmful"] is None
    assert body["fallback"] is True
    # Bounded enum, never raw exception text leaking to the client.
    assert body["error"] in ("auth", "rate_limit", "timeout", "parse", "sdk_shape", "unknown")
    assert "simulated moderation backend failure" not in r.text


def test_scan_health_reports_moderation_and_startup_smoke(client):
    # scan-health is EXTENDED (OW-009), not duplicated, to surface moderation
    # + the AI model-id startup smoke test. Old code had neither key at all.
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    body = r.json()
    assert "moderation" in body
    assert "last_mode" in body["moderation"]
    assert "last_error" in body["moderation"]
    assert "startup_smoke" in body
    assert "ran" in body["startup_smoke"]
    assert "model_ok" in body["startup_smoke"]
    assert "error" in body["startup_smoke"]
    # The session-scoped TestClient started up with no ANTHROPIC_API_KEY (the
    # default CI/test environment), so the startup smoke call was SKIPPED
    # (not attempted) rather than failed — assert the skipped/demo shape,
    # not a "model_ok is True" live shape.
    if not appmod.os.environ.get("ANTHROPIC_API_KEY"):
        assert body["startup_smoke"]["ran"] is False
        assert body["startup_smoke"]["model_ok"] is None


def test_notification_emitted_via_like_and_read_all_persists(client):
    # /api/posts/{id}/like calls _emit_notification directly (SF-004) when a
    # like lands on someone else's post. post_001's owner is the target user.
    posts = client.get("/api/posts").json()
    post = posts["items"][0]
    owner_id = post.get("user_id", "")
    assert owner_id, "fixture post must have a user_id for this test to be meaningful"

    like_r = client.post(f"/api/posts/{post['id']}/like")
    assert like_r.status_code == 200

    notifs = client.get(f"/api/notifications/{owner_id}").json()
    assert notifs["total"] >= 1
    assert notifs["unread"] >= 1
    first = notifs["items"][0]
    assert first["read"] is False  # JSON bool, not 0/1
    assert isinstance(first["read"], bool)

    # Read-all -> unread becomes 0, and it persists (fresh GET, fresh SQLite read).
    mark = client.post(f"/api/notifications/{owner_id}/read-all")
    assert mark.status_code == 200
    assert mark.json() == {"status": "ok"}

    after = client.get(f"/api/notifications/{owner_id}").json()
    assert after["unread"] == 0
    assert all(item["read"] is True for item in after["items"])

    # And it's a real SQLite row, not memory — fresh raw connection.
    import sqlite3
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        db_row = conn.execute(
            "SELECT read FROM notifications WHERE user_id = ? LIMIT 1", (owner_id,)
        ).fetchone()
    finally:
        conn.close()
    assert db_row is not None
    assert db_row[0] == 1  # stored as INTEGER 0/1 in SQLite; API layer bools it


def test_emit_notification_skips_silently_on_empty_user_id(client):
    # Direct call to the helper — must not raise and must not create a row
    # (the old and new code both early-return when user_id is falsy).
    appmod._emit_notification("", "like", "someone", "post_xyz")
    import sqlite3
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        count = conn.execute(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ''"
        ).fetchone()[0]
    finally:
        conn.close()
    assert count == 0


# --------------------------------------------------------------------------- #
# Product-recognition pipeline: scan (/api/analyze) -> human confirm
# (/api/closet/confirm) -> persisted closet (/api/closet). Corrections are the
# learning signal recorded in scan_corrections.
# --------------------------------------------------------------------------- #
def _closet_confirm_body(**over):
    body = {
        "user_id": "user_closet_1",
        "client_ref": "",
        "items": [
            {
                "accepted": True,
                "ai": {"name": "White Tee", "category": "top", "color": "white",
                       "brand": "Zara", "search_query": "white tee", "price_estimate_usd": 25},
                "final": {"name": "White Tee", "category": "top", "color": "white",
                          "brand": "Zara", "search_query": "white tee", "price_estimate_usd": 25,
                          "confidence": "high"},
            },
        ],
    }
    body.update(over)
    return body


def test_analyze_demo_mode_every_item_has_bounded_confidence(client):
    # No ANTHROPIC_API_KEY in CI -> falls to demo. Every _DEMO_OUTFITS item must
    # carry a confidence value in the bounded enum (the vision contract change).
    files = {"photo": ("test.jpg", io.BytesIO(_tiny_jpeg_bytes()), "image/jpeg")}
    r = client.post("/api/analyze", files=files)
    assert r.status_code == 200
    d = r.json()
    assert d["mode"] == "demo"
    assert len(d["items"]) > 0
    for item in d["items"]:
        assert item["confidence"] in ("high", "medium", "low")


def test_closet_confirm_two_accepted_then_listed_newest_first(client):
    body = _closet_confirm_body(
        user_id="user_closet_list",
        client_ref="",
        items=[
            {"accepted": True, "ai": {"name": "Item A"}, "final": {"name": "Item A Final"}},
            {"accepted": True, "ai": {"name": "Item B"}, "final": {"name": "Item B Final"}},
        ],
    )
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    d = r.json()
    assert d["deduped"] is False
    ids = [it["id"] for it in d["saved"]]
    assert len(ids) == 2
    assert all(i.startswith("ci_") for i in ids)

    r2 = client.get("/api/closet", params={"user_id": "user_closet_list"})
    assert r2.status_code == 200
    listed = r2.json()
    assert listed["count"] == 2
    names = [it["name"] for it in listed["items"]]
    assert "Item A Final" in names and "Item B Final" in names
    # newest-first: the second-saved item (Item B) should appear before the first.
    assert listed["items"][0]["name"] == "Item B Final"
    assert listed["items"][1]["name"] == "Item A Final"


def test_closet_confirm_records_name_and_category_corrections(client):
    body = _closet_confirm_body(
        user_id="user_closet_correct",
        client_ref="",
        items=[{
            "accepted": True,
            "ai": {"name": "White Tee", "category": "top", "color": "white",
                   "brand": "Zara", "search_query": "white tee", "price_estimate_usd": 25},
            "final": {"name": "Ribbed Crop Top", "category": "crop-top", "color": "white",
                      "brand": "Zara", "search_query": "white tee", "price_estimate_usd": 25,
                      "confidence": "high"},
        }],
    )
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    assert r.json()["corrections_recorded"] == 2  # name + category differ; color/brand/search/price match

    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        rows = conn.execute(
            "SELECT field, ai_value, user_value FROM scan_corrections WHERE user_key = ?",
            ("user_closet_correct",),
        ).fetchall()
    finally:
        conn.close()
    by_field = {r[0]: (r[1], r[2]) for r in rows}
    assert by_field["name"] == ("White Tee", "Ribbed Crop Top")
    assert by_field["category"] == ("top", "crop-top")
    assert "color" not in by_field
    assert "brand" not in by_field


def test_closet_confirm_rejected_item_not_saved_records_rejection(client):
    body = _closet_confirm_body(
        user_id="user_closet_reject",
        client_ref="",
        items=[{"accepted": False, "ai": {"name": "Invisible Hat"}, "final": {}}],
    )
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    d = r.json()
    assert d["saved"] == []
    assert d["corrections_recorded"] == 1

    r2 = client.get("/api/closet", params={"user_id": "user_closet_reject"})
    assert r2.json()["count"] == 0

    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        row = conn.execute(
            "SELECT ai_value, user_value FROM scan_corrections "
            "WHERE user_key = ? AND field = 'rejected'",
            ("user_closet_reject",),
        ).fetchone()
    finally:
        conn.close()
    assert row is not None
    assert row[0] == "Invisible Hat"
    assert row[1] == ""


def test_closet_confirm_double_post_same_client_ref_dedupes(client):
    body = _closet_confirm_body(user_id="user_closet_dedup", client_ref="dedup-ref-1")
    first = client.post("/api/closet/confirm", json=body)
    assert first.status_code == 200
    assert first.json()["deduped"] is False
    saved_count_after_first = len(first.json()["saved"])

    second = client.post("/api/closet/confirm", json=body)
    assert second.status_code == 200
    d2 = second.json()
    assert d2["deduped"] is True
    assert len(d2["saved"]) == saved_count_after_first

    r = client.get("/api/closet", params={"user_id": "user_closet_dedup"})
    assert r.json()["count"] == saved_count_after_first  # unchanged, not doubled


def test_closet_confirm_all_rejected_batch_replay_dedupes(client):
    # An all-rejected batch writes NO closet_items row, so the dedup guard must
    # also consult scan_corrections — otherwise a replay double-inserts
    # 'rejected' rows and skews the append-only learning ledger.
    body = _closet_confirm_body(
        user_id="user_closet_reject_replay",
        client_ref="reject-replay-ref-1",
        items=[{"accepted": False, "ai": {"name": "Phantom Hat"}, "final": {}}],
    )
    first = client.post("/api/closet/confirm", json=body)
    assert first.status_code == 200
    d1 = first.json()
    assert d1["deduped"] is False
    assert d1["saved"] == []
    assert d1["corrections_recorded"] == 1

    second = client.post("/api/closet/confirm", json=body)
    assert second.status_code == 200
    d2 = second.json()
    assert d2["deduped"] is True
    assert d2["saved"] == []
    assert d2["corrections_recorded"] == 0

    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        count = conn.execute(
            "SELECT COUNT(*) FROM scan_corrections WHERE user_key = ? AND client_ref = ?",
            ("user_closet_reject_replay", "reject-replay-ref-1"),
        ).fetchone()[0]
    finally:
        conn.close()
    assert count == 1  # unchanged, not doubled


def test_closet_confirm_persists_across_new_sqlite_connection(client):
    body = _closet_confirm_body(user_id="user_closet_persist", client_ref="persist-ref-1")
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    item_id = r.json()["saved"][0]["id"]

    # Simulate "server restart" — a brand-new sqlite3 connection to the same DB file.
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        row = conn.execute(
            "SELECT id, user_key, name FROM closet_items WHERE id = ?", (item_id,)
        ).fetchone()
    finally:
        conn.close()
    assert row is not None
    assert row[1] == "user_closet_persist"


def test_closet_confirm_no_user_id_falls_back_to_ip_key_and_isolates(client):
    body = _closet_confirm_body(client_ref="")
    body.pop("user_id")
    body["items"] = [{"accepted": True, "ai": {"name": "IP Item"}, "final": {"name": "IP Item Final"}}]
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    assert len(r.json()["saved"]) == 1

    # Under a DIFFERENT explicit user_id, the IP-keyed item must not be visible.
    r2 = client.get("/api/closet", params={"user_id": "some_other_explicit_user"})
    names = [it["name"] for it in r2.json()["items"]]
    assert "IP Item Final" not in names


def test_closet_confirm_zero_items_400(client):
    body = _closet_confirm_body(items=[])
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 400


def test_closet_confirm_too_many_items_400(client):
    one = {"accepted": True, "ai": {"name": "X"}, "final": {"name": "X Final"}}
    body = _closet_confirm_body(items=[one] * 13)
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 400


def test_closet_user_isolation_a_not_visible_to_b(client):
    body_a = _closet_confirm_body(
        user_id="user_iso_a",
        client_ref="iso-a-ref",
        items=[{"accepted": True, "ai": {"name": "A Item"}, "final": {"name": "A Item Final"}}],
    )
    body_b = _closet_confirm_body(
        user_id="user_iso_b",
        client_ref="iso-b-ref",
        items=[{"accepted": True, "ai": {"name": "B Item"}, "final": {"name": "B Item Final"}}],
    )
    client.post("/api/closet/confirm", json=body_a)
    client.post("/api/closet/confirm", json=body_b)

    closet_a = client.get("/api/closet", params={"user_id": "user_iso_a"}).json()
    closet_b = client.get("/api/closet", params={"user_id": "user_iso_b"}).json()

    names_a = [it["name"] for it in closet_a["items"]]
    names_b = [it["name"] for it in closet_b["items"]]
    assert "A Item Final" in names_a and "B Item Final" not in names_a
    assert "B Item Final" in names_b and "A Item Final" not in names_b


# --------------------------------------------------------------------------- #
# Scan-learning loop: /api/analyze must USE scan_corrections, not just let
# POST /api/closet/confirm write to it. _corrections_context() builds a compact
# per-user prompt block from past corrections/rejections; /api/analyze injects
# it into the LIVE Claude call only and reports how many signals it used via
# response["corrections_used"]. See app.py _corrections_context() + analyze().
# --------------------------------------------------------------------------- #
def _mock_parsed_outfit():
    """A minimal but schema-valid OutfitAnalysis-shaped object, structured the
    way response.parsed_output.model_dump() would return it on the live path."""
    class _Parsed:
        def model_dump(self):
            return {
                "items": [{
                    "category": "top", "name": "White Tee", "color": "white",
                    "material_guess": "cotton", "brand_vibe": "Zara",
                    "style_tags": ["minimal"], "resale_potential": "medium",
                    "search_query": "white tee women", "price_estimate_usd": 25,
                    "confidence": "high",
                }],
                "overall_style": "Minimal",
                "occasion": "Everyday",
                "trend_score": 80,
                "summary": "Clean look.",
                "stylist_tip": "Add a jacket.",
            }
    return _Parsed()


def _mock_live_parse(monkeypatch, captured: dict):
    """Monkeypatch appmod.client.messages.parse to succeed and capture kwargs
    (esp. the `messages` content) so tests can assert on what was sent."""
    def _fake_parse(**kwargs):
        captured.update(kwargs)

        class _Resp:
            parsed_output = _mock_parsed_outfit()
        return _Resp()

    monkeypatch.setattr(appmod.client.messages, "parse", _fake_parse)


def _analyze_files():
    return {"photo": ("test.jpg", io.BytesIO(_tiny_jpeg_bytes()), "image/jpeg")}


def _confirm_correction(user_id, client_ref, ai_name, ai_brand, final_name, final_brand):
    """Seed a learning signal through the REAL endpoint (not a direct DB write) —
    exercises the exact same path a real user correction takes."""
    body = {
        "user_id": user_id,
        "client_ref": client_ref,
        "items": [{
            "accepted": True,
            "ai": {"name": ai_name, "category": "top", "color": "white",
                   "brand": ai_brand, "search_query": "x", "price_estimate_usd": 25},
            "final": {"name": final_name, "category": "top", "color": "white",
                      "brand": final_brand, "search_query": "x", "price_estimate_usd": 25,
                      "confidence": "high"},
        }],
    }
    return body


def test_analyze_live_uses_past_corrections(client, monkeypatch):
    # Seed a real correction via POST /api/closet/confirm (name + brand differ
    # from the AI guess) for user_learn_1, then scan again with the SAME user_id
    # -> the corrected brand must appear in what we send Claude, and the response
    # must report at least one signal used. Fails on pre-change code: no user_id
    # param existed, no injected block, and "corrections_used" is not a key at all.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-corrections-live")
    r = client.post("/api/closet/confirm", json=_confirm_correction(
        "user_learn_1", "learn-ref-1", "White Tee", "Zara", "Ribbed Crop Top", "Reformation",
    ))
    assert r.status_code == 200
    assert r.json()["corrections_recorded"] >= 1

    captured: dict = {}
    _mock_live_parse(monkeypatch, captured)

    r2 = client.post("/api/analyze", files=_analyze_files(), params={"user_id": "user_learn_1"})
    assert r2.status_code == 200
    body = r2.json()
    assert body["mode"] == "live"
    assert body["corrections_used"] >= 1

    content_blocks = captured["messages"][0]["content"]
    text_blocks = [b["text"] for b in content_blocks if b.get("type") == "text"]
    joined = "\n".join(text_blocks)
    assert "Reformation" in joined
    assert "Ribbed Crop Top" in joined
    assert "Personal context from this user's correction history" in joined


def test_analyze_live_fresh_user_no_context_injected(client, monkeypatch):
    # A brand-new user_id with zero closet/correction history must NOT get the
    # personal-context prefix, and corrections_used must be exactly 0.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-fresh-user")
    captured: dict = {}
    _mock_live_parse(monkeypatch, captured)

    r = client.post("/api/analyze", files=_analyze_files(), params={"user_id": "user_never_scanned_before"})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "live"
    assert body["corrections_used"] == 0

    content_blocks = captured["messages"][0]["content"]
    text_blocks = [b["text"] for b in content_blocks if b.get("type") == "text"]
    joined = "\n".join(text_blocks)
    assert "Personal context from this user's correction history" not in joined


def test_analyze_corrections_context_capped_at_1500_chars(client, monkeypatch):
    # Seed many DISTINCT corrections for one user (distinct client_refs so none
    # dedupe) — the injected block must never exceed the hard cap, and must not
    # cut off mid-line (every included line, joined back, stays inside the cap).
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-cap")
    user_id = "user_learn_cap"
    for i in range(40):
        # closet_confirm is rate-limited to 20/min per user_key (BE-006) — clear
        # the limiter mid-seed so this test can seed volume beyond that budget
        # without tripping 429s; the seeding VOLUME is what's under test here,
        # not the closet_confirm rate-limit behavior (covered elsewhere).
        if i % 15 == 0:
            appmod._rate_store.clear()
        body = _confirm_correction(
            user_id, f"cap-ref-{i}",
            f"AI Guess Item Number {i} With Some Extra Descriptive Words",
            f"AiBrand{i}",
            f"User Corrected Item Number {i} With Even More Extra Descriptive Words",
            f"UserBrand{i}",
        )
        resp = client.post("/api/closet/confirm", json=body)
        assert resp.status_code == 200

    captured: dict = {}
    _mock_live_parse(monkeypatch, captured)
    r = client.post("/api/analyze", files=_analyze_files(), params={"user_id": user_id})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "live"
    assert body["corrections_used"] > 0

    content_blocks = captured["messages"][0]["content"]
    injected = next(b["text"] for b in content_blocks
                     if b.get("type") == "text" and "Personal context" in b["text"])
    assert len(injected) <= 1500


def test_analyze_demo_path_corrections_used_zero(client, monkeypatch):
    # Even with seeded corrections, if the live call fails (falls to demo),
    # corrections_used must be 0 — demo never actually used them.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-demo-fallback")
    client.post("/api/closet/confirm", json=_confirm_correction(
        "user_learn_demo", "learn-demo-ref-1", "White Tee", "Zara", "Ribbed Crop Top", "Reformation",
    ))

    def _raise(**kwargs):
        raise RuntimeError("simulated parse failure")

    monkeypatch.setattr(appmod.client.messages, "parse", _raise)

    r = client.post("/api/analyze", files=_analyze_files(), params={"user_id": "user_learn_demo"})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "demo"
    assert body["corrections_used"] == 0
    assert len(body["items"]) > 0


def test_analyze_live_mentions_rejected_item(client, monkeypatch):
    # A past rejection (accepted=false) must show up in the injected block as an
    # explicit "do not over-detect" instruction referencing the AI's guess name.
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-for-rejection")
    body = {
        "user_id": "user_learn_reject",
        "client_ref": "learn-reject-ref-1",
        "items": [{"accepted": False, "ai": {"name": "Invisible Fedora Hat"}, "final": {}}],
    }
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    assert r.json()["corrections_recorded"] == 1

    captured: dict = {}
    _mock_live_parse(monkeypatch, captured)

    r2 = client.post("/api/analyze", files=_analyze_files(), params={"user_id": "user_learn_reject"})
    assert r2.status_code == 200
    assert r2.json()["corrections_used"] >= 1

    content_blocks = captured["messages"][0]["content"]
    text_blocks = [b["text"] for b in content_blocks if b.get("type") == "text"]
    joined = "\n".join(text_blocks)
    assert "Invisible Fedora Hat" in joined
    assert "NOT in the" in joined  # rejection phrasing — "do not over-detect"


# --------------------------------------------------------------------------- #
# WebView cache — the app's own JS/CSS MUST be no-store so an iOS/Capacitor fix
# actually loads instead of the WebView silently running a stale cached copy.
# This is a RECURRING bug ("why isn't the simulator updating?") — locked by test.
# --------------------------------------------------------------------------- #
def test_app_js_css_are_no_store(client):
    for asset in ("/static/app.js", "/static/app.css"):
        r = client.get(asset)
        assert r.status_code == 200, asset
        cc = r.headers.get("cache-control", "")
        assert "no-store" in cc, f"{asset} must be no-store, got: {cc!r}"


def test_non_app_static_stays_cacheable(client):
    # only the app shell is no-store; data/images should NOT be forced no-store
    r = client.get("/static/data/products.json")
    assert "no-store" not in r.headers.get("cache-control", "")


# --------------------------------------------------------------------------- #
# Rate limiting (kept LAST — it deliberately exhausts the /api/orders budget)
# --------------------------------------------------------------------------- #
def test_orders_rate_limit_429(client):
    codes = [client.post("/api/orders", json=_order_body(client_ref="rl")).status_code
             for _ in range(25)]
    assert 429 in codes                      # limit is 20/min -> must trip
    assert codes.count(200) <= 20


# --------------------------------------------------------------------------- #
# Outfit generate — DB closet merge (OW-014: regression tests shipped with fix)
# --------------------------------------------------------------------------- #
def test_outfit_generate_uses_db_closet_items_when_user_id_provided(client):
    # Confirm a real top item to the DB for this user.
    uid = "outfit_db_test_user"
    confirm_body = {
        "user_id": uid,
        "client_ref": "outfit-closet-ref-1",
        "items": [{
            "accepted": True,
            "ai":    {"name": "Silk Blouse", "category": "top", "color": "cream",
                      "brand": "Zara", "search_query": "silk blouse", "price_estimate_usd": 60},
            "final": {"name": "Silk Blouse", "category": "top", "color": "cream",
                      "brand": "Zara", "search_query": "silk blouse", "price_estimate_usd": 60,
                      "confidence": "high"},
        }],
    }
    r = client.post("/api/closet/confirm", json=confirm_body)
    assert r.status_code == 200

    # Generate outfits with user_id but empty client wardrobe.
    # Before fix: wardrobe stays empty -> all items _missing=True.
    # After fix: DB item is merged in -> "Silk Blouse" appears as _missing=False.
    r2 = client.post("/api/outfit/generate", json={
        "occasion": "date night",
        "wardrobe": [],
        "user_id": uid,
    })
    assert r2.status_code == 200
    outfits = r2.json()["outfits"]
    assert len(outfits) >= 1
    all_items = [it for o in outfits for it in o["items"]]
    real_items = [it for it in all_items if not it.get("_missing", True)]
    assert len(real_items) >= 1
    assert any(it["name"] == "Silk Blouse" for it in real_items)


def test_outfit_generate_backward_compat_no_user_id(client):
    # No user_id -> client-sent wardrobe still works unchanged.
    r = client.post("/api/outfit/generate", json={
        "occasion": "casual day",
        "wardrobe": [{"name": "Black Jeans", "category": "bottoms", "color": "black"}],
    })
    assert r.status_code == 200
    outfits = r.json()["outfits"]
    assert len(outfits) >= 1
    all_items = [it for o in outfits for it in o["items"]]
    real_items = [it for it in all_items if not it.get("_missing", True)]
    assert any(it["name"] == "Black Jeans" for it in real_items)
