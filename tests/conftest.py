"""Shared pytest fixtures for the AWEAR backend tests.

Isolation guarantees (so tests never touch the real DB or leak rate-limit state):
- ``DB_PATH`` is redirected to a throwaway temp SQLite file for the whole session.
- ``_rate_store`` (the in-memory sliding-window limiter) is cleared before every test.
"""
import pathlib
import tempfile

import pytest
from fastapi.testclient import TestClient

import app as appmod


@pytest.fixture(scope="session")
def client():
    """A TestClient backed by an isolated temp database.

    The AI key is removed BEFORE startup so the startup-smoke + moderation
    default to the deterministic DEMO shape regardless of the dev's local env
    (see _hermetic_ai_env). Tests that need a key set it themselves.
    """
    import os
    os.environ.pop("ANTHROPIC_API_KEY", None)
    tmpdir = tempfile.mkdtemp(prefix="awear_test_")
    appmod.DB_PATH = pathlib.Path(tmpdir) / "test_awear.db"
    appmod.init_db()
    with TestClient(appmod.app) as c:
        yield c


@pytest.fixture(autouse=True)
def _clear_rate_store():
    """Reset the rate limiter around every test so limits are deterministic."""
    appmod._rate_store.clear()
    yield
    appmod._rate_store.clear()


@pytest.fixture(autouse=True)
def _hermetic_ai_env(monkeypatch):
    """Make the suite HERMETIC w.r.t. the AI key.

    Comment moderation runs LIVE when ANTHROPIC_API_KEY is present and may
    non-deterministically HOLD comments (status='held', excluded from GET).
    That made test_comments_pagination_and_total pass in CI (no key) but FAIL
    on a dev machine that has a real key in the env — a recurring, confusing
    'works on CI, not for me' failure. Default every test to DEMO mode by
    removing the key; moderation tests that need it call monkeypatch.setenv in
    their own body, which runs after this and overrides it.
    """
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    # The anthropic client is constructed at import (app.py) and BAKES the key from
    # the env at that moment — so deleting the env var isn't enough; the client still
    # holds a live key and /api/analyze would make a real 9s call (mode='live') instead
    # of the demo fallback. Null the baked-in key so no live call escapes a keyless test.
    # Live tests set their own parse/create mock afterwards, which overrides this.
    if getattr(appmod, "client", None) is not None:
        monkeypatch.setattr(appmod.client, "api_key", None, raising=False)


def _order_body(**over):
    """A valid /api/orders body with sensible defaults; override any field."""
    body = {"product_name": "Linen blazer", "product_id": "p_test", "amount_usd": 100.0}
    body.update(over)
    return body


def _tiny_jpeg_bytes() -> bytes:
    """A minimal real JPEG (PIL round-trip) — /api/analyze rejects non-image bytes."""
    import io as _io
    from PIL import Image as _Image

    img = _Image.new("RGB", (10, 10), color="red")
    buf = _io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()
