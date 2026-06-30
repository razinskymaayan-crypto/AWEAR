#!/usr/bin/env python3
"""
AWEAR orchestrator (Phase 3) — runs ON THE ALWAYS-ON VM, not GitHub Actions
(Actions has a monthly minutes cap; the VM is unmetered).

It runs manager cycles BACK-TO-BACK until the daily token budget is spent, rotating
between the two pooled accounts (Carmel + Maayan), honoring /pause from Telegram.
After each manager run it pushes that manager's branch; jeff-merge.yml (on GitHub,
triggered by the branch push) integrates it into main with the check-render gate.

State lives in .agent_budget.json (Telegram /status reads it); pause via .agents_paused.

VM setup:
  export CLAUDE_CODE_OAUTH_TOKEN_1=...   # Carmel
  export CLAUDE_CODE_OAUTH_TOKEN_2=...   # Maayan
  export DAILY_TOKEN_BUDGET=20000000     # combined daily cap (tokens)
  python3 scripts/orchestrator.py
"""
from __future__ import annotations

import json
import os
import subprocess
import time
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATE = os.path.join(ROOT, ".agent_budget.json")
PAUSE = os.path.join(ROOT, ".agents_paused")
MANAGERS = ["mark", "steve", "ayalon"]

LANES = {
    "mark":   "Design/UI lane (ICs dolce/valentino/netta, gabbana=gate). Owns static/index.html, static/tokens.css, awear-tokens.json.",
    "steve":  "Backend/integration lane (ICs sam/oren). Owns app.py, schema.sql, static/data/*.json.",
    "ayalon": "Product/social lane (IC shira). Owns docs/*, IDEAS.md, business + social sections.",
}

# ── Budget governor (pure, unit-testable) ───────────────────────────────────
def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def daily_cap() -> int:
    return int(os.getenv("DAILY_TOKEN_BUDGET", "20000000"))


def load_state() -> dict:
    try:
        s = json.load(open(STATE))
    except Exception:
        s = {}
    if s.get("date") != _today():            # daily reset at local midnight
        s = {"date": _today(), "spent_tokens": 0, "active_lane": None, "cycles": 0}
    s["daily_cap_tokens"] = daily_cap()
    return s


def save_state(s: dict) -> None:
    json.dump(s, open(STATE, "w"), ensure_ascii=False, indent=2)


def remaining(s: dict) -> int:
    return max(0, s["daily_cap_tokens"] - s.get("spent_tokens", 0))


def record_spend(tokens: int) -> dict:
    s = load_state()
    s["spent_tokens"] = s.get("spent_tokens", 0) + max(0, int(tokens))
    s["cycles"] = s.get("cycles", 0) + 1
    save_state(s)
    return s


def is_paused() -> bool:
    return os.path.exists(PAUSE)


# ── Manager run (VM only) ───────────────────────────────────────────────────
EST_TOKENS_PER_RUN = int(os.getenv("EST_TOKENS_PER_RUN", "150000"))

PROMPT = (
    "You are MANAGER '{m}' at AWEAR, running autonomously. Lane: {lane}\n"
    "Do ONE end-to-end, value-gated task in YOUR lane only. Priority: "
    ".claude/agents/assignments/{m}.md (Telegram tasks) > INBOX items in your lane > "
    "MASTER_PLAN/PRODUCT_VISION in your lane > domain research to docs/. Delegate craft to your ICs (Task tool). "
    "VERIFY: npm run check-render must pass; gabbana 8+ on visual. Report to Telegram signed '{m}: ...' "
    "(bash scripts/tg.sh). Commit to THIS branch only; do not touch main."
)


def run_manager(manager: str, token: str) -> int:
    env = dict(os.environ, CLAUDE_CODE_OAUTH_TOKEN=token or "")
    branch = f"auto/{manager}"
    subprocess.run(["git", "fetch", "origin", "-q"], cwd=ROOT)
    if subprocess.run(["git", "checkout", "-B", branch, f"origin/{branch}"],
                      cwd=ROOT, stderr=subprocess.DEVNULL).returncode != 0:
        subprocess.run(["git", "checkout", "-B", branch, "origin/main"], cwd=ROOT)
    subprocess.run(["git", "merge", "origin/main", "--no-edit"], cwd=ROOT, stderr=subprocess.DEVNULL)
    p = subprocess.run(
        ["claude", "-p", PROMPT.format(m=manager, lane=LANES[manager]),
         "--model", "opus", "--permission-mode", "acceptEdits", "--output-format", "json"],
        cwd=ROOT, env=env, capture_output=True, text=True, timeout=1800)
    used = EST_TOKENS_PER_RUN
    try:
        u = json.loads(p.stdout).get("usage", {})
        used = (u.get("input_tokens", 0) + u.get("output_tokens", 0)) or EST_TOKENS_PER_RUN
    except Exception:
        pass
    subprocess.run(["git", "push", "origin", f"HEAD:{branch}"], cwd=ROOT, stderr=subprocess.DEVNULL)
    return used


def main() -> None:
    tokens = [t for t in (os.getenv("CLAUDE_CODE_OAUTH_TOKEN_1"),
                          os.getenv("CLAUDE_CODE_OAUTH_TOKEN_2")) if t]
    if not tokens:
        print("Set CLAUDE_CODE_OAUTH_TOKEN_1/2 in the VM env first."); return
    i = 0
    while True:
        s = load_state()
        if is_paused():
            s["active_lane"] = "(paused)"; save_state(s); time.sleep(30); continue
        if remaining(s) <= EST_TOKENS_PER_RUN:
            s["active_lane"] = "(daily budget spent — waiting for reset)"; save_state(s)
            time.sleep(300); continue
        manager = MANAGERS[i % len(MANAGERS)]
        token = tokens[i % len(tokens)]
        s["active_lane"] = manager; save_state(s)
        used = run_manager(manager, token)
        record_spend(used)
        s = load_state(); s["active_lane"] = None; save_state(s)
        i += 1


if __name__ == "__main__":
    main()
