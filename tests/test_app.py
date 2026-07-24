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


def test_index_html_is_no_store(client):
    """The HTML shell must be no-STORE, not merely no-cache.

    Regression: with 'no-cache' the installed Capacitor app kept serving its stored
    copy of index.html across launches (and therefore stale ?v= stamps), so shipped
    fixes were invisible on the phone while mobile Safari showed them fine.
    """
    r = client.get("/")
    assert r.status_code == 200
    cc = r.headers.get("cache-control", "")
    assert "no-store" in cc, f"index.html must be no-store, got: {cc!r}"


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


# --------------------------------------------------------------------------- #
# Closet management: DELETE and PATCH /api/closet/{item_id}
# These endpoints did not exist before this change — all tests below would
# have returned 404/405 on the old codebase (fail-before proven by absence).
# --------------------------------------------------------------------------- #
def _seed_closet_item(client, user_id: str, name: str = "Blue Denim Jacket", ref: str = "") -> str:
    """Confirm one item into the closet and return its assigned id."""
    body = {
        "user_id": user_id,
        "client_ref": ref,
        "items": [{
            "accepted": True,
            "ai": {"name": name, "category": "outerwear", "color": "blue",
                   "brand": "Levi's", "search_query": "denim jacket", "price_estimate_usd": 120},
            "final": {"name": name, "category": "outerwear", "color": "blue",
                      "brand": "Levi's", "search_query": "denim jacket", "price_estimate_usd": 120,
                      "confidence": "high"},
        }],
    }
    r = client.post("/api/closet/confirm", json=body)
    assert r.status_code == 200
    return r.json()["saved"][0]["id"]


def test_closet_delete_removes_item(client):
    item_id = _seed_closet_item(client, "user_del_1", name="Green Parka", ref="del-ref-1")

    r = client.delete(f"/api/closet/{item_id}", params={"user_id": "user_del_1"})
    assert r.status_code == 200
    assert r.json()["deleted"] == item_id

    listed = client.get("/api/closet", params={"user_id": "user_del_1"}).json()
    assert all(it["id"] != item_id for it in listed["items"])


def test_closet_delete_wrong_user_403(client):
    item_id = _seed_closet_item(client, "user_del_owner", name="Red Coat", ref="del-ref-2")

    r = client.delete(f"/api/closet/{item_id}", params={"user_id": "user_del_other"})
    assert r.status_code == 403


def test_closet_delete_missing_404(client):
    r = client.delete("/api/closet/ci_nonexistent_xyz", params={"user_id": "user_del_404"})
    assert r.status_code == 404


def test_closet_patch_updates_fields(client):
    item_id = _seed_closet_item(client, "user_patch_1", name="White Sneakers", ref="patch-ref-1")

    r = client.patch(f"/api/closet/{item_id}", json={
        "user_id": "user_patch_1",
        "name": "Off-White Canvas Sneakers",
        "color": "cream",
        "source_url": "https://example.com/product/123",
    })
    assert r.status_code == 200
    updated = r.json()
    assert updated["name"] == "Off-White Canvas Sneakers"
    assert updated["color"] == "cream"
    assert updated["source_url"] == "https://example.com/product/123"
    assert updated["brand"] == "Levi's"  # unchanged field preserved


def test_closet_patch_wrong_user_403(client):
    item_id = _seed_closet_item(client, "user_patch_owner", name="Silk Blouse", ref="patch-ref-2")

    r = client.patch(f"/api/closet/{item_id}", json={
        "user_id": "user_patch_other",
        "name": "Attempted Rename",
    })
    assert r.status_code == 403


# ── generate-garment endpoint ──────────────────────────────────────────────

def test_generate_garment_demo_path_no_key(client):
    """Without OPENAI_API_KEY, endpoint returns mode='demo', no network call, no crash."""
    import io
    from PIL import Image as _Image
    img = _Image.new("RGB", (10, 10), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    files = {"photo": ("shirt.jpg", buf.getvalue(), "image/jpeg")}
    r = client.post("/api/generate-garment", files=files)
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] == "demo"
    assert body["image_url"] is None
    assert "reason" in body


def test_generate_garment_empty_file_400(client):
    """Empty upload returns 400."""
    r = client.post("/api/generate-garment", files={"photo": ("empty.jpg", b"", "image/jpeg")})
    assert r.status_code == 400


def test_generate_garment_scan_health_exposes_generation(client):
    """scan-health includes a 'generation' block with last_mode and last_reason."""
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    body = r.json()
    assert "generation" in body
    assert "last_mode" in body["generation"]
    assert "last_reason" in body["generation"]


def test_generate_garment_with_item_json(client):
    """item_json is parsed and used (endpoint accepts it without crashing)."""
    import io, json
    from PIL import Image as _Image
    img = _Image.new("RGB", (10, 10), color="green")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    item = {"name": "denim jacket", "category": "outerwear", "color": "blue", "brand": "Zara"}
    r = client.post("/api/generate-garment",
                    files={"photo": ("jacket.jpg", buf.getvalue(), "image/jpeg")},
                    data={"item_json": json.dumps(item)})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] in ("live", "demo")


def test_generate_garment_bad_item_json_graceful(client):
    """Bad item_json (not valid JSON) falls back to empty item gracefully."""
    import io
    from PIL import Image as _Image
    img = _Image.new("RGB", (10, 10), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    r = client.post("/api/generate-garment",
                    files={"photo": ("shirt.jpg", buf.getvalue(), "image/jpeg")},
                    data={"item_json": "not-valid-json{}"})
    assert r.status_code == 200
    body = r.json()
    assert body["mode"] in ("live", "demo")


# ---------------------------------------------------------------------------
# Supabase JWT auth tests
# ---------------------------------------------------------------------------

def _make_supabase_jwt(secret: str, sub: str = "uuid-abc-123", role: str = "authenticated", expired: bool = False) -> str:
    """Mint a test Supabase-style JWT signed with HS256."""
    import time
    import jwt as pyjwt
    now = int(time.time())
    payload = {
        "sub": sub,
        "role": role,
        "exp": now - 10 if expired else now + 3600,
        "iat": now - 1,
    }
    return pyjwt.encode(payload, secret, algorithm="HS256")


def test_supabase_jwt_no_secret(client):
    """With no SUPABASE_JWT_SECRET, JWT lookup returns None and session tokens still work."""
    import app as app_module
    original = app_module.SUPABASE_JWT_SECRET
    try:
        app_module.SUPABASE_JWT_SECRET = ""
        # A session token still works
        with app_module._get_db() as db:
            db.execute("INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, created_at) VALUES (?,?,?,?,?,?)",
                       ("u_jwt_test", "jwtuser", "jwt@test.com", "x", "jwtuser", 0))
            db.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?,?,?)",
                       ("localtoken123", "u_jwt_test", 0))
        resp = client.get("/api/auth/me/u_jwt_test", headers={"Authorization": "Bearer localtoken123"})
        assert resp.status_code == 200
    finally:
        app_module.SUPABASE_JWT_SECRET = original


def test_supabase_jwt_valid(client):
    """Valid Supabase JWT → user_id is the JWT sub."""
    import app as app_module
    secret = "test-secret-for-unit-tests"
    token = _make_supabase_jwt(secret, sub="supabase-uuid-456")
    original = app_module.SUPABASE_JWT_SECRET
    try:
        app_module.SUPABASE_JWT_SECRET = secret
        # Create a user with the Supabase sub as their id so /api/auth/me returns 200
        with app_module._get_db() as db:
            db.execute("INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, created_at) VALUES (?,?,?,?,?,?)",
                       ("supabase-uuid-456", "sbuser", "sb@test.com", "x", "sbuser", 0))
        resp = client.get("/api/auth/me/supabase-uuid-456", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
    finally:
        app_module.SUPABASE_JWT_SECRET = original


def test_supabase_jwt_invalid(client):
    """Tampered/invalid Supabase JWT → 401."""
    import app as app_module
    original = app_module.SUPABASE_JWT_SECRET
    try:
        app_module.SUPABASE_JWT_SECRET = "test-secret-for-unit-tests"
        resp = client.get("/api/auth/me/anyone", headers={"Authorization": "Bearer not.a.jwt.token"})
        assert resp.status_code == 401
    finally:
        app_module.SUPABASE_JWT_SECRET = original


def test_supabase_jwt_expired(client):
    """Expired Supabase JWT → 401."""
    import app as app_module
    secret = "test-secret-for-unit-tests"
    token = _make_supabase_jwt(secret, expired=True)
    original = app_module.SUPABASE_JWT_SECRET
    try:
        app_module.SUPABASE_JWT_SECRET = secret
        resp = client.get("/api/auth/me/anyone", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
    finally:
        app_module.SUPABASE_JWT_SECRET = original


# ---------------------------------------------------------------------------
# DATABASE_URL / Postgres path detection tests (OW-014 — regression for step 3)
# ---------------------------------------------------------------------------

def test_get_db_uses_sqlite_without_database_url():
    """Without DATABASE_URL, _get_db() returns a _CompatDB wrapping SQLite (dialect='sqlite')."""
    import app as app_module
    assert app_module.DATABASE_URL == "", "DATABASE_URL must be empty in CI/test env"
    db = app_module._get_db()
    assert db._dialect == "sqlite"
    db._conn.close()


def test_compat_db_sqlite_execute_and_fetch():
    """_CompatDB sqlite path: execute() returns a cursor with fetchone()/fetchall()."""
    import app as app_module
    import pathlib
    import tempfile
    tmp = pathlib.Path(tempfile.mktemp(suffix=".db"))
    import sqlite3 as _sqlite3
    raw = _sqlite3.connect(str(tmp))
    raw.row_factory = _sqlite3.Row
    db = app_module._CompatDB(raw, "sqlite")
    with db:
        db.execute("CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)")
        db.execute("INSERT INTO t (v) VALUES (?)", ("hello",))
        row = db.execute("SELECT v FROM t").fetchone()
    assert row["v"] == "hello"
    tmp.unlink(missing_ok=True)


def test_database_url_postgres_dialect_selected(monkeypatch):
    """When DATABASE_URL is set, _get_db() selects the postgres dialect
    (connection attempt will fail without a real server — we test the branch taken)."""
    import app as app_module

    class _FakeConn:
        def cursor(self, **_kw):
            return self
        def close(self):
            pass
        def commit(self):
            pass
        def rollback(self):
            pass

    class _FakePsycopg2:
        @staticmethod
        def connect(dsn):
            return _FakeConn()

    monkeypatch.setattr(app_module, "DATABASE_URL", "postgresql://localhost/awear_test")
    import sys
    monkeypatch.setitem(sys.modules, "psycopg2", _FakePsycopg2())
    db = app_module._get_db()
    assert db._dialect == "postgres"
    db._conn.close()


# --------------------------------------------------------------------------- #
# Follow / unfollow — social graph
# --------------------------------------------------------------------------- #

_FOLLOW_TARGET = "user_001"  # guaranteed to exist in static/data/profiles.json


def test_follow_toggle_follow_then_unfollow(client):
    r1 = client.post(f"/api/users/{_FOLLOW_TARGET}/follow")
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["following"] is True
    assert d1["user_id"] == _FOLLOW_TARGET
    assert isinstance(d1["followers"], int)

    r2 = client.post(f"/api/users/{_FOLLOW_TARGET}/follow")
    assert r2.status_code == 200
    assert r2.json()["following"] is False


def test_follow_unknown_user_404(client):
    r = client.post("/api/users/does_not_exist_xyz/follow")
    assert r.status_code == 404


def test_follow_status_reflects_current_state(client):
    # Ensure clean state: unfollow if currently followed
    status = client.get(f"/api/users/{_FOLLOW_TARGET}/follow-status")
    assert status.status_code == 200
    currently = status.json()["following"]
    if currently:
        client.post(f"/api/users/{_FOLLOW_TARGET}/follow")  # unfollow

    # Not following → follow → status True
    client.post(f"/api/users/{_FOLLOW_TARGET}/follow")
    r = client.get(f"/api/users/{_FOLLOW_TARGET}/follow-status")
    assert r.status_code == 200
    assert r.json()["following"] is True
    # Cleanup
    client.post(f"/api/users/{_FOLLOW_TARGET}/follow")


# --------------------------------------------------------------------------- #
# Daily log — style journal + streak tracking
# --------------------------------------------------------------------------- #

def test_daily_log_post_returns_log_and_streak(client):
    r = client.post("/api/daily-log", json={"date": "2026-01-10", "items": ["jeans"], "note": "cozy day"})
    assert r.status_code == 200
    d = r.json()
    assert "log" in d and "streak" in d
    assert d["log"]["date"] == "2026-01-10"
    assert "jeans" in d["log"]["items"]
    assert d["log"]["note"] == "cozy day"


def test_daily_log_get_returns_posted_entry(client):
    client.post("/api/daily-log", json={"date": "2026-02-15", "items": ["dress"]})
    r = client.get("/api/daily-log")
    assert r.status_code == 200
    d = r.json()
    assert "items" in d and "total" in d
    dates = [e["date"] for e in d["items"]]
    assert "2026-02-15" in dates


def test_daily_log_streak_empty_state_returns_zeros(client):
    r = client.get("/api/daily-log/streak")
    assert r.status_code == 200
    d = r.json()
    assert "current_streak" in d and "best_streak" in d


def test_daily_log_upsert_same_date_updates_not_duplicates(client):
    client.post("/api/daily-log", json={"date": "2026-03-01", "note": "v1"})
    client.post("/api/daily-log", json={"date": "2026-03-01", "note": "v2"})
    r = client.get("/api/daily-log")
    entries = [e for e in r.json()["items"] if e["date"] == "2026-03-01"]
    assert len(entries) == 1
    assert entries[0]["note"] == "v2"


def test_daily_log_bad_date_returns_400(client):
    r = client.post("/api/daily-log", json={"date": "not-a-date"})
    assert r.status_code == 400


def test_daily_log_note_too_long_returns_400(client):
    r = client.post("/api/daily-log", json={"date": "2026-04-01", "note": "x" * 2001})
    assert r.status_code == 400


# --------------------------------------------------------------------------- #
# Wishlist — save/unsave marketplace items
# --------------------------------------------------------------------------- #

def test_wishlist_toggle_add_then_remove(client):
    r1 = client.post("/api/wishlist/toggle", json={"item_id": "item_wl_01", "item_type": "marketplace"})
    assert r1.status_code == 200
    assert r1.json()["saved"] is True
    assert r1.json()["count"] >= 1

    r2 = client.post("/api/wishlist/toggle", json={"item_id": "item_wl_01"})
    assert r2.status_code == 200
    assert r2.json()["saved"] is False


def test_wishlist_empty_item_id_returns_400(client):
    r = client.post("/api/wishlist/toggle", json={"item_id": "  ", "item_type": "marketplace"})
    assert r.status_code == 400


def test_wishlist_get_shows_saved_items(client):
    client.post("/api/wishlist/toggle", json={"item_id": "item_wl_02", "item_data": {"name": "Test Jacket"}})
    r = client.get("/api/wishlist")
    assert r.status_code == 200
    d = r.json()
    assert "items" in d and "total" in d
    ids = [i["item_id"] for i in d["items"]]
    assert "item_wl_02" in ids


def test_wishlist_status_returns_saved_and_count_maps(client):
    client.post("/api/wishlist/toggle", json={"item_id": "item_status_A"})
    # item_status_B not saved
    r = client.get("/api/wishlist/status?item_ids=item_status_A,item_status_B")
    assert r.status_code == 200
    d = r.json()
    assert d["saved"]["item_status_A"] is True
    assert d["saved"]["item_status_B"] is False
    assert d["counts"]["item_status_A"] >= 1
    assert d["counts"]["item_status_B"] == 0
    # cleanup
    client.post("/api/wishlist/toggle", json={"item_id": "item_status_A"})


def test_wishlist_status_empty_param_returns_empty_dicts(client):
    r = client.get("/api/wishlist/status")
    assert r.status_code == 200
    assert r.json() == {"saved": {}, "counts": {}}


# --------------------------------------------------------------------------- #
# Bookings — stylist session booking
# --------------------------------------------------------------------------- #

_BOOKING_BODY = {
    "stylist_id": "stylist_01",
    "stylist_name": "Abigail",
    "session_type": "wardrobe_audit",
    "slot_label": "Mon 10:00",
}


def test_bookings_create_returns_confirmed(client):
    r = client.post("/api/bookings", json=_BOOKING_BODY)
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "confirmed"
    assert isinstance(d["booking_id"], int)


def test_bookings_list_includes_created_booking(client):
    client.post("/api/bookings", json=_BOOKING_BODY)
    r = client.get("/api/bookings")
    assert r.status_code == 200
    d = r.json()
    assert "bookings" in d
    assert any(b["stylist_id"] == "stylist_01" for b in d["bookings"])


def test_bookings_cancel_soft_deletes_sets_cancelled(client):
    cr = client.post("/api/bookings", json=_BOOKING_BODY)
    booking_id = cr.json()["booking_id"]
    dr = client.delete(f"/api/bookings/{booking_id}")
    assert dr.status_code == 200
    assert dr.json()["status"] == "cancelled"


def test_bookings_cancel_missing_returns_404(client):
    r = client.delete("/api/bookings/999999")
    assert r.status_code == 404


def test_bookings_create_missing_field_returns_400(client):
    r = client.post("/api/bookings", json={
        "stylist_id": "",
        "stylist_name": "Abigail",
        "session_type": "wardrobe_audit",
        "slot_label": "Mon 10:00",
    })
    assert r.status_code == 400


# --------------------------------------------------------------------------- #
# Challenges — gamification completions
# --------------------------------------------------------------------------- #

def test_challenge_known_id_earns_correct_points(client):
    r = client.post("/api/challenge/complete", json={"challenge_id": "scan"})
    assert r.status_code == 200
    d = r.json()
    assert d["points_earned"] == 20  # CHALLENGE_POINTS["scan"]
    assert d["total_points"] >= 20


def test_challenge_unknown_id_earns_default_points(client):
    r = client.post("/api/challenge/complete", json={"challenge_id": "totally_unknown_xyz"})
    assert r.status_code == 200
    assert r.json()["points_earned"] == 10  # CHALLENGE_POINTS_DEFAULT


def test_challenge_empty_id_returns_400(client):
    r = client.post("/api/challenge/complete", json={"challenge_id": "  "})
    assert r.status_code == 400


def test_challenge_cumulative_points_accumulate(client):
    r1 = client.post("/api/challenge/complete", json={"challenge_id": "diary", "user_key": "test_acc_user"})
    total1 = r1.json()["total_points"]
    r2 = client.post("/api/challenge/complete", json={"challenge_id": "diary", "user_key": "test_acc_user"})
    total2 = r2.json()["total_points"]
    assert total2 == total1 + 10  # diary = 10 pts


def test_supabase_jwt_anon_role(client):
    """JWT with role=anon → 401 (only 'authenticated' allowed)."""
    import app as app_module
    secret = "test-secret-for-unit-tests"
    token = _make_supabase_jwt(secret, sub="anon-user", role="anon")
    original = app_module.SUPABASE_JWT_SECRET
    try:
        app_module.SUPABASE_JWT_SECRET = secret
        resp = client.get("/api/auth/me/anon-user", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
    finally:
        app_module.SUPABASE_JWT_SECRET = original


# ---------------------------------------------------------------------------
# Supabase Storage tests (step 4 of launch-infra epic)
# ---------------------------------------------------------------------------

def test_supabase_storage_upload_no_keys_returns_none(monkeypatch):
    """_supabase_storage_upload returns None immediately when keys are absent (no network)."""
    import app as app_module
    monkeypatch.setattr(app_module, "SUPABASE_URL", "")
    monkeypatch.setattr(app_module, "SUPABASE_SERVICE_KEY", "")
    result = app_module._supabase_storage_upload(b"fake-png", "test.png")
    assert result is None


def test_supabase_storage_upload_success(monkeypatch):
    """_supabase_storage_upload returns a public URL when the PUT succeeds (mocked urllib)."""
    import app as app_module
    import io

    class _FakeResponse:
        status = 200
        def __enter__(self): return self
        def __exit__(self, *_): pass
        def read(self): return b'{"Key":"generated/test.png"}'

    monkeypatch.setattr(app_module, "SUPABASE_URL", "https://fake.supabase.co")
    monkeypatch.setattr(app_module, "SUPABASE_SERVICE_KEY", "fake-service-key")
    monkeypatch.setattr(app_module.urllib.request, "urlopen", lambda req, timeout=30: _FakeResponse())

    result = app_module._supabase_storage_upload(b"\x89PNG\r\n", "shirt.png")
    assert result == "https://fake.supabase.co/storage/v1/object/public/generated/shirt.png"


def test_supabase_storage_upload_network_error_returns_none(monkeypatch):
    """_supabase_storage_upload returns None on any network error (never raises)."""
    import app as app_module

    def _boom(*_args, **_kwargs):
        raise OSError("connection refused")

    monkeypatch.setattr(app_module, "SUPABASE_URL", "https://fake.supabase.co")
    monkeypatch.setattr(app_module, "SUPABASE_SERVICE_KEY", "fake-service-key")
    monkeypatch.setattr(app_module.urllib.request, "urlopen", _boom)

    result = app_module._supabase_storage_upload(b"data", "shirt.png")
    assert result is None


def test_scan_health_includes_supabase_storage(client):
    """scan-health response includes a 'supabase_storage' block with 'configured' key.

    This is a FAIL-BEFORE / PASS-AFTER test (OW-014): the key did not exist before
    Supabase Storage was wired into the scan-health endpoint.
    """
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    body = r.json()
    assert "supabase_storage" in body, "supabase_storage key missing from scan-health"
    assert "configured" in body["supabase_storage"]
    assert body["supabase_storage"]["configured"] is False  # no key in CI env


def test_scan_health_includes_ai_features(client):
    """scan-health exposes an 'ai_features' block covering outfit/stylist/marketplace.

    FAIL-BEFORE / PASS-AFTER (OW-014): the key did not exist before INBOX backlog #2
    wired last-outcome tracking into the three AI endpoints.
    """
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    body = r.json()
    assert "ai_features" in body, "ai_features key missing from scan-health"
    for feature in ("outfit", "stylist", "marketplace"):
        assert feature in body["ai_features"], f"{feature} missing from ai_features"
        block = body["ai_features"][feature]
        assert "last_mode" in block, f"last_mode missing from ai_features.{feature}"
        assert "last_reason" in block, f"last_reason missing from ai_features.{feature}"


def test_scan_health_includes_data_integrity(client):
    """GET /api/scan-health must include a data_integrity block with status."""
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    di = r.json().get("data_integrity")
    assert di is not None, "data_integrity block missing from scan-health"
    assert "status" in di
    assert "products" in di
    assert "posts" in di
    assert "profiles" in di
    assert "orphan_tags" in di
    assert "invalid_user_ids" in di


def test_data_integrity_clean_on_demo_data(client):
    """Demo data must be internally consistent (no orphan tags or invalid user_ids)."""
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    di = r.json()["data_integrity"]
    assert di["orphan_tags"] == 0, f"Orphan product tags found: {di['orphan_tags']}"
    assert di["invalid_user_ids"] == 0, f"Invalid user_ids in posts: {di['invalid_user_ids']}"
    assert di["status"] == "ok"


def test_outfit_generate_sets_last_outfit_mode(client):
    """After calling /api/outfit/generate, _last_outfit['mode'] is 'demo' (no API key in CI).

    FAIL-BEFORE: _last_outfit did not exist. PASS-AFTER: mode is set on every call.
    """
    import app as appmod
    appmod._last_outfit["mode"] = None  # reset sentinel
    client.post("/api/outfit/generate", json={"occasion": "casual", "wardrobe": []})
    # No API key in CI — Claude call throws → demo fallback → mode = "demo"
    assert appmod._last_outfit["mode"] == "demo"


def test_stylist_chat_sets_last_stylist_mode(client):
    """After calling /api/stylist/chat, _last_stylist['mode'] is 'demo' (no API key in CI).

    FAIL-BEFORE: _last_stylist did not exist. PASS-AFTER: mode is set on every call.
    """
    import app as appmod
    appmod._last_stylist["mode"] = None  # reset sentinel
    client.post("/api/stylist/chat", json={"question": "What should I wear today?"})
    # No API key in CI — Claude call throws → demo fallback → mode = "demo"
    assert appmod._last_stylist["mode"] == "demo"


# ---------------------------------------------------------------------------
# Stories — POST/GET/DELETE contract, TTL filter, ownership guard
# ---------------------------------------------------------------------------

def test_story_create_and_list(client):
    r = client.post("/api/stories", json={"image_url": "https://cdn.test/shot.jpg", "caption": "My look"})
    assert r.status_code == 200
    created = r.json()
    assert created["image_url"] == "https://cdn.test/shot.jpg"
    assert created["caption"] == "My look"
    assert "id" in created and "created_at" in created

    r2 = client.get("/api/stories")
    assert r2.status_code == 200
    body = r2.json()
    assert body["total"] >= 1
    ids = [s["id"] for s in body["items"]]
    assert created["id"] in ids


def test_story_list_excludes_expired(client):
    import datetime as _dt
    expired_ts = (_dt.datetime.utcnow() - _dt.timedelta(hours=25)).isoformat()
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        conn.execute(
            "INSERT INTO stories (user_key, image_url, caption, created_at) VALUES (?,?,?,?)",
            ("testclient", "https://cdn.test/old.jpg", "old story", expired_ts),
        )
        conn.commit()
        old_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()

    r = client.get("/api/stories")
    assert r.status_code == 200
    ids = [s["id"] for s in r.json()["items"]]
    assert old_id not in ids, "Expired story should not appear in GET /api/stories"


def test_story_delete_by_owner_removes_it(client):
    r = client.post("/api/stories", json={"image_url": "https://cdn.test/del.jpg"})
    assert r.status_code == 200
    story_id = r.json()["id"]

    rd = client.delete(f"/api/stories/{story_id}")
    assert rd.status_code == 200
    assert rd.json()["deleted"] is True
    assert rd.json()["id"] == story_id

    r2 = client.get("/api/stories")
    ids = [s["id"] for s in r2.json()["items"]]
    assert story_id not in ids


def test_story_delete_wrong_owner_403(client):
    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        conn.execute(
            "INSERT INTO stories (user_key, image_url, caption, created_at) VALUES (?,?,?,?)",
            ("other_user", "https://cdn.test/other.jpg", "", appmod.datetime.datetime.utcnow().isoformat()),
        )
        conn.commit()
        other_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()

    r = client.delete(f"/api/stories/{other_id}")
    assert r.status_code == 403


def test_story_delete_missing_404(client):
    r = client.delete("/api/stories/999999")
    assert r.status_code == 404


def test_story_create_no_image_url_400(client):
    r = client.post("/api/stories", json={"image_url": "", "caption": "no url"})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# Wishlist — toggle/get/status contract, idempotency, user isolation
# ---------------------------------------------------------------------------

def _wl_body(item_id, item_type="marketplace", item_data=None):
    return {"item_id": item_id, "item_type": item_type, "item_data": item_data or {}}


def test_wishlist_toggle_save_then_unsave(client):
    r1 = client.post("/api/wishlist/toggle", json=_wl_body("wl-item-1"))
    assert r1.status_code == 200
    assert r1.json()["saved"] is True
    assert r1.json()["count"] >= 1

    r2 = client.post("/api/wishlist/toggle", json=_wl_body("wl-item-1"))
    assert r2.status_code == 200
    assert r2.json()["saved"] is False
    count_after = r2.json()["count"]
    assert count_after == r1.json()["count"] - 1


def test_wishlist_list_returns_saved_items(client):
    client.post("/api/wishlist/toggle", json=_wl_body("wl-list-a", item_data={"price": 50}))
    client.post("/api/wishlist/toggle", json=_wl_body("wl-list-b", item_data={"price": 80}))

    r = client.get("/api/wishlist")
    assert r.status_code == 200
    body = r.json()
    saved_ids = [it["item_id"] for it in body["items"]]
    assert "wl-list-a" in saved_ids
    assert "wl-list-b" in saved_ids
    assert body["total"] >= 2


def test_wishlist_toggle_empty_item_id_400(client):
    r = client.post("/api/wishlist/toggle", json=_wl_body(""))
    assert r.status_code == 400


def test_wishlist_status_reflects_saved_items(client):
    client.post("/api/wishlist/toggle", json=_wl_body("wl-status-x"))

    r = client.get("/api/wishlist/status", params={"item_ids": "wl-status-x,wl-status-y"})
    assert r.status_code == 200
    body = r.json()
    assert body["saved"]["wl-status-x"] is True
    assert body["saved"]["wl-status-y"] is False
    assert body["counts"]["wl-status-x"] >= 1
    assert body["counts"].get("wl-status-y", 0) == 0


def test_wishlist_user_isolation(client):
    client.post("/api/wishlist/toggle", json=_wl_body("wl-mine"))

    conn = sqlite3.connect(str(appmod.DB_PATH))
    try:
        conn.execute(
            "INSERT OR IGNORE INTO wishlist (user_key, item_id, item_type, item_data) VALUES (?,?,?,?)",
            ("other_user_key", "wl-theirs", "marketplace", "{}"),
        )
        conn.commit()
    finally:
        conn.close()

    r = client.get("/api/wishlist")
    assert r.status_code == 200
    item_ids = [it["item_id"] for it in r.json()["items"]]
    assert "wl-mine" in item_ids
    assert "wl-theirs" not in item_ids


# ---------------------------------------------------------------------------
# Data integrity CLI — scripts/data_integrity.py regression gate
# ---------------------------------------------------------------------------

_VALID_PRODUCT = {
    "id": "p1", "name": "Test Shirt", "brand": "TestBrand", "category": "top",
    "subcategory": "shirt", "color": "white", "image_url": "/static/img/p1.jpg",
    "search_query": "white test shirt", "price_estimate_usd": 29.99,
    "in_stock": True, "tags": ["casual"], "description": "A test shirt.",
    "product_url": "https://example.com/p1",
}
_VALID_PROFILE = {
    "id": "u1", "username": "testuser", "display_name": "Test User",
    "avatar_url": "/static/img/avatar.jpg", "bio": "bio",
    "followers": 10, "following": 5, "posts_count": 1, "verified": False, "location": "Tel Aviv",
}
_VALID_POST = {
    "id": "post_t1", "user_id": "u1", "image_url": "/static/img/post.jpg",
    "caption": "A test post", "likes": 0, "comments": 0,
    "items_tagged": ["p1"], "created_at": "2026-07-22T10:00:00Z",
}


def _write_data_dir(tmpdir, products=None, posts=None, profiles=None):
    import json as _json
    import pathlib
    d = pathlib.Path(tmpdir)
    (d / "products.json").write_text(_json.dumps(products or [_VALID_PRODUCT]))
    (d / "posts.json").write_text(_json.dumps(posts or [_VALID_POST]))
    (d / "profiles.json").write_text(_json.dumps(profiles or [_VALID_PROFILE]))
    return str(d)


def test_data_integrity_cli_exits_clean(tmp_path):
    """scripts/data_integrity.py exits 0 on the real demo data.

    FAIL-BEFORE: script did not exist (BE-TAG-INTEGRITY incident — orphan tags
    went undetected). PASS-AFTER: script exists and all demo data is clean.
    """
    import subprocess
    import sys
    result = subprocess.run(
        [sys.executable, "scripts/data_integrity.py"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, (
        "data_integrity.py reported errors on demo data:\n" + result.stdout + result.stderr
    )


def test_data_integrity_cli_detects_orphan_tag(tmp_path):
    """scripts/data_integrity.py exits 1 when items_tagged references a missing product id.

    FAIL-BEFORE: no check existed — orphan tags silently broke feed item-pills.
    PASS-AFTER: exit 1 on orphan, error message names the bad id.
    """
    import subprocess
    import sys
    post_with_orphan = {**_VALID_POST, "items_tagged": ["nonexistent_prod_id"]}
    data_dir = _write_data_dir(tmp_path, posts=[post_with_orphan])
    result = subprocess.run(
        [sys.executable, "scripts/data_integrity.py", "--data-dir", data_dir],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 1, "Expected exit 1 for orphan tag but got 0"
    assert "nonexistent_prod_id" in result.stdout, (
        "Error output should name the orphan id; got:\n" + result.stdout
    )


def test_data_integrity_cli_detects_invalid_user_id(tmp_path):
    """scripts/data_integrity.py exits 1 when a post's user_id is not in profiles.json.

    FAIL-BEFORE: no check existed — broken user_id references surfaced as blank
    avatar / missing author in the feed.
    PASS-AFTER: exit 1 on bad user_id, error message names the post.
    """
    import subprocess
    import sys
    post_with_bad_user = {**_VALID_POST, "user_id": "nonexistent_user_99"}
    data_dir = _write_data_dir(tmp_path, posts=[post_with_bad_user])
    result = subprocess.run(
        [sys.executable, "scripts/data_integrity.py", "--data-dir", data_dir],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 1, "Expected exit 1 for invalid user_id but got 0"
    assert "nonexistent_user_99" in result.stdout, (
        "Error output should name the bad user_id; got:\n" + result.stdout
    )


# ---------------------------------------------------------------------------
# product-image endpoint (ext-dep: Pexels API / loremflickr redirect)
# ---------------------------------------------------------------------------

def test_product_image_empty_query_returns_404(client):
    """Empty or missing q returns 404 without any network call."""
    r = client.get("/api/product-image")
    assert r.status_code == 404
    r2 = client.get("/api/product-image?q=")
    assert r2.status_code == 404


def test_product_image_with_query_redirects_no_pexels_key(client, monkeypatch):
    """Valid q without PEXELS_API_KEY falls back to loremflickr redirect (no crash).

    Seeds _product_image_cache so the test never makes a real external HTTP call.
    FAIL-BEFORE: endpoint was unreachable in any pytest (no test existed).
    PASS-AFTER: 3xx redirect is returned for a cached query.
    """
    cache_key = "_pytest_no_crash_check_"
    monkeypatch.setitem(appmod._product_image_cache, cache_key, "https://example.com/img.jpg")
    r = client.get(f"/api/product-image?q={cache_key}", follow_redirects=False)
    assert r.status_code in (301, 302, 307, 308), (
        f"Expected redirect for cached query, got {r.status_code}"
    )


# ---------------------------------------------------------------------------
# agent endpoints (Google integration absent in CI — ext-dep fallback tests)
# ---------------------------------------------------------------------------

def test_agent_summary_no_google_creds_returns_500(client, monkeypatch):
    """send_summary_email returning False (no creds) → HTTP 500 with detail.

    FAIL-BEFORE: no test existed; unhandled RuntimeError from _google_unavailable
    would surface as a test-crashing exception rather than a documented 500.
    PASS-AFTER: endpoint cleanly raises HTTPException(500) when send returns False.
    """
    monkeypatch.setattr(appmod, "send_summary_email", lambda *a, **k: False)
    body = {
        "agent": "jeff",
        "department": "Product",
        "attendees": "jeff@awear.app",
        "summary": "Weekly sync",
    }
    r = client.post("/api/agent/summary", json=body)
    assert r.status_code == 500
    assert "email" in r.json()["detail"].lower()


def test_agent_summary_missing_required_fields_returns_422(client):
    """Missing required fields (department, attendees, summary) → 422, no crash."""
    r = client.post("/api/agent/summary", json={"agent": "jeff"})
    assert r.status_code == 422


def test_agent_schedule_no_google_creds_returns_500(client, monkeypatch):
    """create_calendar_event returning None (no creds) → HTTP 500 with detail.

    FAIL-BEFORE: no test existed.
    PASS-AFTER: endpoint cleanly raises HTTPException(500) when create returns None.
    """
    monkeypatch.setattr(appmod, "create_calendar_event", lambda *a, **k: None)
    body = {
        "agent": "jeff",
        "title": "Sprint review",
        "start_iso": "2026-09-01T10:00:00+03:00",
        "end_iso": "2026-09-01T11:00:00+03:00",
    }
    r = client.post("/api/agent/schedule", json=body)
    assert r.status_code == 500
    assert "calendar" in r.json()["detail"].lower()


def test_agent_schedule_missing_required_fields_returns_422(client):
    """Missing title/times → 422, no crash."""
    r = client.post("/api/agent/schedule", json={"agent": "jeff"})
    assert r.status_code == 422


def test_agent_meeting_no_google_creds_returns_500(client, monkeypatch):
    """schedule_agent_meeting returning None (no creds) → HTTP 500 with detail.

    FAIL-BEFORE: no test existed.
    PASS-AFTER: endpoint cleanly raises HTTPException(500) when schedule returns None.
    """
    monkeypatch.setattr(appmod, "schedule_agent_meeting", lambda *a, **k: None)
    body = {
        "organizer": "jeff",
        "participants": ["steve", "mark"],
        "title": "Design review",
        "start_iso": "2026-09-01T14:00:00+03:00",
        "end_iso": "2026-09-01T15:00:00+03:00",
    }
    r = client.post("/api/agent/meeting", json=body)
    assert r.status_code == 500
    assert "meeting" in r.json()["detail"].lower()


def test_agent_meeting_missing_required_fields_returns_422(client):
    """Missing participants/title/times → 422, no crash."""
    r = client.post("/api/agent/meeting", json={"organizer": "jeff"})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Render deployment readiness — database mode in scan-health
# ---------------------------------------------------------------------------

def test_scan_health_includes_database_mode(client):
    """GET /api/scan-health must include a 'database' block exposing DB mode.

    FAIL-BEFORE: 'database' key absent from scan-health response.
    PASS-AFTER: block present with 'mode' (sqlite/postgres) and 'configured' bool.
    Critical for Render deployment: operators must see whether DATABASE_URL is wired.
    """
    r = client.get("/api/scan-health")
    assert r.status_code == 200
    body = r.json()
    assert "database" in body, "database block missing from scan-health — add it for Render diagnostics"
    db = body["database"]
    assert "mode" in db, "database.mode missing"
    assert db["mode"] in ("sqlite", "postgres"), f"unexpected database.mode: {db['mode']}"
    assert "configured" in db, "database.configured missing"
    # In CI (no DATABASE_URL) we expect sqlite mode
    assert db["mode"] == "sqlite", "CI must run in sqlite mode (DATABASE_URL not set)"
    assert db["configured"] is False, "CI must report database not configured (no DATABASE_URL)"


# ---------------------------------------------------------------------------
# Wardrobe match score — GET /api/products/{product_id}/match
# The WOW feature: "85% matches your wardrobe" shown on tagged feed items.
# FAIL-BEFORE: endpoint didn't exist (404/405). PASS-AFTER: 200 with match_pct.
# ---------------------------------------------------------------------------

_MATCH_PRODUCT_ID = "prod_jk_001"  # in static/data/products.json (category=outerwear)


def test_product_match_unknown_product_returns_404(client):
    r = client.get("/api/products/nonexistent_xyz_abc/match")
    assert r.status_code == 404


def test_product_match_empty_closet_returns_base_score(client):
    r = client.get(f"/api/products/{_MATCH_PRODUCT_ID}/match",
                   params={"user_id": "user_match_empty_closet_xyz"})
    assert r.status_code == 200
    body = r.json()
    assert body["product_id"] == _MATCH_PRODUCT_ID
    assert isinstance(body["match_pct"], int)
    assert 55 <= body["match_pct"] <= 95   # base 55, no complementary items yet
    assert body["match_pct"] == 55         # empty closet → exactly base
    assert isinstance(body["reason"], str) and len(body["reason"]) > 0
    assert body["matching_items"] == []


def test_product_match_rich_closet_raises_score(client):
    # Seed complementary items: prod_jk_001 is outerwear → complements top, bottoms, shoes
    uid = "user_match_rich_xyz"
    for name, cat, ref in [
        ("White Tee", "top", "match-ref-top"),
        ("Black Jeans", "bottoms", "match-ref-btm"),
        ("White Sneakers", "shoes", "match-ref-shoe"),
    ]:
        body = {
            "user_id": uid, "client_ref": ref,
            "items": [{
                "accepted": True,
                "ai": {"name": name, "category": cat, "color": "white",
                       "brand": "Zara", "search_query": name, "price_estimate_usd": 50},
                "final": {"name": name, "category": cat, "color": "white",
                          "brand": "Zara", "search_query": name, "price_estimate_usd": 50,
                          "confidence": "high"},
            }],
        }
        appmod._rate_store.clear()
        resp = client.post("/api/closet/confirm", json=body)
        assert resp.status_code == 200

    r = client.get(f"/api/products/{_MATCH_PRODUCT_ID}/match", params={"user_id": uid})
    assert r.status_code == 200
    body = r.json()
    # 3 complementary cats × 8 = +24 → 55 + 24 = 79; +5 richness if ≥5 items (not here → 79)
    assert body["match_pct"] >= 75
    assert len(body["matching_items"]) >= 1
    assert any(it["category"] in ("top", "bottoms", "shoes") for it in body["matching_items"])


def test_product_match_response_shape(client):
    r = client.get(f"/api/products/{_MATCH_PRODUCT_ID}/match")
    assert r.status_code == 200
    body = r.json()
    assert "product_id" in body
    assert "match_pct" in body
    assert "reason" in body
    assert "matching_items" in body
    assert isinstance(body["matching_items"], list)
