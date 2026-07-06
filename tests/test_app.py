"""Backend endpoint tests for AWEAR (app.py).

Focus: the money paths (orders, creator credits, commission), input validation,
idempotency, auth, rate limiting, and buy-routing — the things a regression would
break silently in front of an investor.
"""
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
# Rate limiting (kept LAST — it deliberately exhausts the /api/orders budget)
# --------------------------------------------------------------------------- #
def test_orders_rate_limit_429(client):
    codes = [client.post("/api/orders", json=_order_body(client_ref="rl")).status_code
             for _ in range(25)]
    assert 429 in codes                      # limit is 20/min -> must trip
    assert codes.count(200) <= 20
