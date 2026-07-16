"""Demo-reliability gate (MASTER_PLAN A6): static/data/*.json stays internally consistent.

Runs the structural checks from scripts/data_integrity_check.py — orphan
items_tagged, missing image/search_query, insane prices, unresolved post
authors, duplicate product ids. No network: the external image-URL liveness
sweep lives in scripts/check_image_urls.py and runs manually before a demo.
"""
import importlib.util
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "data_integrity_check.py"


def _load_module():
    spec = importlib.util.spec_from_file_location("data_integrity_check", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_static_data_integrity_clean(capsys):
    mod = _load_module()
    rc = mod.main()
    out = capsys.readouterr().out
    assert rc == 0, f"static/data integrity findings:\n{out}"
