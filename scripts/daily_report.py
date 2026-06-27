#!/usr/bin/env python3
"""AWEAR daily team report — who worked, how much, on what (→ Telegram, 22:00 Israel).

Reads the day's contributions ledger (.claude/agents/contributions/<UTC-date>.md) and that
day's activity_log.md entries, aggregates per agent, builds two brand-styled charts
(contributions + estimated tokens), composes a per-agent text report, and sends everything
to the "Awear Alerts" Telegram group via scripts/tg.sh.

DST-correct: only runs at 22:00 Israel time (Asia/Jerusalem). Scheduled from two UTC crons
(19:00 summer, 20:00 winter); the off-season one exits as a no-op.

Fails soft: missing matplotlib / empty ledger → still sends a text summary.
"""
import os
import re
import sys
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER_DIR = ROOT / ".claude" / "agents" / "contributions"
ACTIVITY_LOG = ROOT / ".claude" / "agents" / "activity_log.md"
CHART = ROOT / "scripts" / "chart.py"
TG = ROOT / "scripts" / "tg.sh"

# Active-domain agents we expect to see; mobile (dana/roei/varan) are intentionally dormant.
ACTIVE_AGENTS = ["dolce", "valentino", "gabbana", "netta", "sam", "oren", "shira", "ayalon"]


def israel_now():
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("Asia/Jerusalem"))
    except Exception:
        # Fallback: assume UTC+3 (summer). Good enough to not crash.
        return datetime.now(timezone.utc)


def tg(mode, *args):
    try:
        subprocess.run(["bash", str(TG), mode, *args], check=False)
    except Exception as e:
        print(f"tg failed: {e}")


def parse_ledger(day: str):
    """Return {agent: {"count": n, "tokens": int, "tasks": [..]}} from the day's ledger."""
    agg = {}
    f = LEDGER_DIR / f"{day}.md"
    if not f.exists():
        return agg
    for line in f.read_text(encoding="utf-8").splitlines():
        # | HH:MM | agent | manager | ~tokens | task |
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 7:
            continue
        agent = parts[2].lower()
        if agent in ("", "agent") or not re.match(r"^[a-z]+$", agent):
            continue
        tokens = 0
        m = re.search(r"([\d.]+)\s*([kmKM]?)", parts[4].replace("~", ""))
        if m:
            val = float(m.group(1))
            unit = m.group(2).lower()
            tokens = int(val * (1_000_000 if unit == "m" else 1_000 if unit == "k" else 1))
        a = agg.setdefault(agent, {"count": 0, "tokens": 0, "tasks": []})
        a["count"] += 1
        a["tokens"] += tokens
        if parts[5]:
            a["tasks"].append(parts[5])
    return agg


def parse_activity_log(day: str, agg):
    """Add agents credited in today's activity_log.md (union with the ledger)."""
    if not ACTIVITY_LOG.exists():
        return agg
    for line in ACTIVITY_LOG.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or day not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 6:
            continue
        agent = parts[2].lower()
        if not re.match(r"^[a-z]+$", agent) or agent in ("agent",):
            continue
        a = agg.setdefault(agent, {"count": 0, "tokens": 0, "tasks": []})
        # Only add a task line if this row isn't already represented; keep it simple.
        desc = parts[5] if len(parts) > 5 else ""
        if desc and desc not in a["tasks"]:
            a["count"] += 1
            a["tasks"].append(desc[:120])
    return agg


def make_chart(out, title, labels, values, ylabel):
    import json
    spec = json.dumps({"title": title, "type": "bar", "labels": labels,
                       "series": [{"name": ylabel, "values": values}], "ylabel": ylabel})
    r = subprocess.run([sys.executable, str(CHART), out, spec], capture_output=True, text=True)
    return r.returncode == 0 and Path(out).exists()


def main():
    now = israel_now()
    if now.hour != 22 and os.environ.get("FORCE_REPORT") != "1":
        print(f"daily_report: not 22:00 Israel (now {now:%H:%M}) — skipping.")
        return 0

    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    agg = parse_ledger(day)
    agg = parse_activity_log(day, agg)

    if not agg:
        tg("text", f"AWEAR daily team report ({day}) — no logged agent activity today.")
        print("no activity")
        return 0

    agents = sorted(agg.keys(), key=lambda k: agg[k]["count"], reverse=True)
    counts = [agg[a]["count"] for a in agents]
    tokens = [round(agg[a]["tokens"] / 1000) for a in agents]  # in K

    c1 = "/tmp/team_contributions.png"
    c2 = "/tmp/team_tokens.png"
    if make_chart(c1, f"Contributions per agent — {day}", agents, counts, "tasks"):
        tg("photo", c1, f"AWEAR daily team report ({day}) — contributions per agent")
    if any(tokens) and make_chart(c2, f"Estimated tokens per agent (K) — {day}", agents, tokens, "tokens (K, est.)"):
        tg("photo", c2, "Estimated token usage per agent (estimate, not exact)")

    # Per-agent text report.
    lines = [f"AWEAR daily team report — {day}", "(token figures are estimates)", ""]
    for a in agents:
        d = agg[a]
        tk = f"~{round(d['tokens']/1000)}K tok" if d["tokens"] else "tok n/a"
        lines.append(f"• {a}: {d['count']} task(s), {tk}")
        for t in d["tasks"][:4]:
            lines.append(f"    – {t}")
    idle = [a for a in ACTIVE_AGENTS if a not in agg]
    if idle:
        lines.append("")
        lines.append("Idle today (active-domain): " + ", ".join(idle))
    tg("text", "\n".join(lines))
    print("report sent")
    return 0


if __name__ == "__main__":
    sys.exit(main())
