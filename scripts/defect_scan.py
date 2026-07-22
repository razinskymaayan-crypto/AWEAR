#!/usr/bin/env python3
"""DEFECT SCAN — the single product-health signal that DRIVES agent work.

This is Change A of the engine redesign (.claude/master/ENGINE_REDESIGN.md): the agents stop
working from a human wishlist (INBOX) and start working from MEASURED defects. It runs both
scanners, scores every finding by severity x centrality, and writes a ranked queue to
ci-debug/product-defects.json + a human-readable ci-debug/DEFECTS.md.

Sources:
  * scripts/health_sweep.py   -> backend: every route, 5xx = crash          (BACKEND lane / steve)
  * scripts/ux-audit.mjs      -> frontend: stuck overlays, contrast, overlap (UI lane / mark)

Scoring (deterministic, tunable):
  score = SEVERITY_WEIGHT[kind] * CENTRALITY[screen-or-route]
  - severity: crash > dead-control > stuck-overlay > contrast > overlap > cosmetic
  - centrality: core surfaces (feed/store/ai/dm/profile, and the routes they call) weigh more.

Each defect carries a `lane` so the engine can route it to the owner without a human deciding.
Exit 0 always (it is a reporter; the LIST is the product). Coverage is ALWAYS reported (OW-015).

Run:  venv312/bin/python scripts/defect_scan.py            (assumes a server on :8000 for the UI scan)
      SKIP_UI=1 venv312/bin/python scripts/defect_scan.py  (backend defects only, no browser)
"""
from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
os.chdir(ROOT)

SEVERITY = {           # higher = worse
    "crash": 100,      # 5xx / exception on a route
    "dead_control": 70,  # clickable element that does nothing
    "stuck_overlay": 60,  # opens but cannot be closed
    "js_error": 55,    # console/page error on a screen
    "contrast": 40,    # WCAG AA fail (black-on-black / white-on-white)
    "overlap": 35,     # text physically covering text
    "contract_4xx": 20,  # unexpected 4xx — usually stub-arg noise, low
    "coverage_gap": 15,  # something the scan could not exercise
}

CORE_SURFACES = ("feed", "store", "ai", "dm", "profile")

# route substrings that belong to the core surfaces (drive centrality)
CORE_ROUTE_HINTS = ("posts", "products", "feed", "users", "closet", "analyze",
                    "dm", "stories", "wallet", "wishlist", "follow", "outfit", "stylist")


def _centrality_route(route: str) -> float:
    return 1.5 if any(h in route.lower() for h in CORE_ROUTE_HINTS) else 1.0


def _centrality_screen(view: str) -> float:
    return 1.5 if (view or "").lower() in CORE_SURFACES else 1.0


def _lane_for(kind: str) -> str:
    return "steve" if kind in ("crash", "contract_4xx") else "mark"


def run_backend() -> dict:
    """Run health_sweep.py in-process-ish (as a subprocess for isolation) and read its json."""
    try:
        subprocess.run([sys.executable, "scripts/health_sweep.py"],
                       capture_output=True, timeout=180, check=False)
    except Exception as e:  # noqa: BLE001
        return {"error": str(e)}
    p = ROOT / "ci-debug" / "health-sweep.json"
    return json.loads(p.read_text()) if p.exists() else {}


def run_ui() -> dict:
    """Run ux-audit.mjs and parse its structured tail. Returns {} on any failure (reported)."""
    if os.getenv("SKIP_UI"):
        return {"skipped": "SKIP_UI set"}
    try:
        out = subprocess.run(["node", "scripts/ux-audit.mjs"],
                             capture_output=True, text=True, timeout=240, check=False)
    except Exception as e:  # noqa: BLE001
        return {"error": str(e)}
    text = out.stdout + out.stderr
    # A DID-NOT-RUN must never look like "clean". If the audit couldn't reach the server or
    # never printed its report header, treat it as NOT RUN (loud), not as zero defects (OW-015).
    if "server unreachable" in text or "UX AUDIT" not in text:
        return {"error": "ux-audit did not run (server unreachable or crashed) — UI NOT scanned"}
    res = {"stuck": [], "contrast": [], "overlap": [], "raw_ok": "interactions OK" in text}
    section = None
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("① STUCK"): section = "stuck"; continue
        if s.startswith("② LOW CONTRAST"): section = "contrast"; continue
        if s.startswith("③ OVERLAP"): section = "overlap"; continue
        if s.startswith("④") or s.startswith("⑤") or s.startswith("────"): section = None; continue
        if section and s.startswith("✗"):
            res[section].append(s[1:].strip())
    return res


def build_defects(backend: dict, ui: dict) -> list[dict]:
    defects = []
    # backend crashes
    for c in backend.get("crashes", []):
        route = c.get("route", "?")
        defects.append({"kind": "crash", "lane": "steve", "where": route,
                        "detail": str(c.get("detail", ""))[:160],
                        "score": SEVERITY["crash"] * _centrality_route(route)})
    # NOTE: 4xx responses are DELIBERATELY NOT added as defects. The sweep sends empty/stub
    # bodies, so a 400/422 is almost always the endpoint CORRECTLY rejecting bad input — not a
    # bug. Treating them as top-priority work sent agents chasing ghosts (OW-015: a tool that
    # cries "defect" on working code is worse than no tool). They are surfaced separately in
    # DEFECTS.md as a "coverage to improve" note (give the sweep real bodies), never as tasks.
    # Only genuine crashes (5xx/exception) and stuck UI are real, actionable defects.
    # UI defects
    for st in ui.get("stuck", []):
        defects.append({"kind": "stuck_overlay", "lane": "mark", "where": st, "detail": "",
                        "score": SEVERITY["stuck_overlay"] * 1.3})
    for c in ui.get("contrast", []):
        defects.append({"kind": "contrast", "lane": "mark", "where": c[:80], "detail": "",
                        "score": SEVERITY["contrast"] * 1.2})
    for o in ui.get("overlap", []):
        defects.append({"kind": "overlap", "lane": "mark", "where": o[:80], "detail": "",
                        "score": SEVERITY["overlap"]})
    defects.sort(key=lambda d: d["score"], reverse=True)
    return defects


def main() -> int:
    backend = run_backend()
    ui = run_ui()
    defects = build_defects(backend, ui)

    b_total = backend.get("total", 0)
    b_ok = backend.get("ok", 0)
    coverage = {
        "backend_routes_ok": b_ok, "backend_routes_total": b_total,
        "backend_pct": round(100 * b_ok / b_total) if b_total else 0,
        "ui_ran": not bool(ui.get("error") or ui.get("skipped")),
        "backend_uncovered": len(backend.get("uncovered", [])),
    }

    pathlib.Path("ci-debug").mkdir(exist_ok=True)
    payload = {"defects": defects, "coverage": coverage,
               "counts": {k: sum(1 for d in defects if d["kind"] == k) for k in SEVERITY}}
    pathlib.Path("ci-debug/product-defects.json").write_text(json.dumps(payload, indent=2))

    # human-readable, ranked — this is what a lane reads to pick its task
    lines = ["# PRODUCT DEFECTS — the agent work queue (auto-generated by defect_scan.py)",
             "",
             f"> Coverage (OW-015): backend {coverage['backend_routes_ok']}/{coverage['backend_routes_total']} "
             f"routes exercised ({coverage['backend_pct']}%), {coverage['backend_uncovered']} uncovered; "
             f"UI scan {'ran' if coverage['ui_ran'] else 'DID NOT RUN'}.",
             "> A lane picks the highest-scored OPEN defect in its column BEFORE the INBOX.",
             ""]
    if not coverage["ui_ran"]:
        lines.append("⚠️ **UI SCAN DID NOT RUN** — the stuck-overlay/contrast/overlap checks were "
                     f"SKIPPED (reason: {ui.get('error') or ui.get('skipped')}). This is NOT 'clean' — "
                     "the whole UI surface is UNVERIFIED this run. Fix the scan before trusting the list.")
    if not defects:
        lines.append("✓ No product defects found by the current scan (note the coverage line above — "
                     "absence of a finding is not proof; raise coverage).")
    for i, d in enumerate(defects[:40], 1):
        lines.append(f"{i}. **[{d['lane']}]** `{d['kind']}` (score {round(d['score'])}) — "
                     f"{d['where']}{('  ·  ' + d['detail']) if d['detail'] else ''}")
    # 4xx = coverage-to-improve, NOT tasks (stub bodies → correct rejections). Listed so we
    # know which endpoints the sweep can't yet exercise for real, never as agent work.
    susp = backend.get("suspicious", [])
    if susp:
        lines += ["", "---", f"### Coverage to improve ({len(susp)} routes returned 4xx to stub bodies — NOT bugs, NOT tasks)",
                  "Give the sweep a valid body for these in scripts/health_sweep.py BODIES to raise real coverage:"]
        lines += [f"- {s.get('route')} → {s.get('status')}" for s in susp[:25]]
    pathlib.Path("ci-debug/DEFECTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("\n".join(lines[:6]))
    print(f"\n→ {len(defects)} defects ranked · wrote ci-debug/DEFECTS.md + product-defects.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
