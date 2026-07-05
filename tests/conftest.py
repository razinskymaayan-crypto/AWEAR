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
    """A TestClient backed by an isolated temp database."""
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


def _order_body(**over):
    """A valid /api/orders body with sensible defaults; override any field."""
    body = {"product_name": "Linen blazer", "product_id": "p_test", "amount_usd": 100.0}
    body.update(over)
    return body
