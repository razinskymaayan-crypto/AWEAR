"""Backend endpoint tests for AWEAR (app.py).

Focus: the money paths (orders, creator credits, commission), input validation,
idempotency, auth, rate limiting, and buy-routing — the things a regression would
break silently in front of an investor.
"""
import hashlib

import app as appmod
from conftest import _order_body

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
# Rate limiting (kept LAST — it deliberately exhausts the /api/orders budget)
# --------------------------------------------------------------------------- #
def test_orders_rate_limit_429(client):
    codes = [client.post("/api/orders", json=_order_body(client_ref="rl")).status_code
             for _ in range(25)]
    assert 429 in codes                      # limit is 20/min -> must trip
    assert codes.count(200) <= 20
