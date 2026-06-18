#!/usr/bin/env python3
"""Builds agents/dashboard_data.json from real session transcripts + live_status.json.

Source of truth for token/tool/duration numbers: the Agent tool dispatch
records inside this project's Claude Code session transcripts
(~/.claude/projects/-Users-tamargrosz-AWEAR/*.jsonl). Nothing here is
estimated or invented -- every number traces back to an actual dispatch.
"""
import json
import os
import re
import glob
from datetime import datetime, timezone

TRANSCRIPT_DIR = os.path.expanduser("~/.claude/projects/-Users-tamargrosz-AWEAR")
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(REPO_ROOT, "agents", "dashboard_data.json")
LIVE_STATUS_PATH = os.path.join(REPO_ROOT, "agents", "live_status.json")
MEETING_STATUS_PATH = os.path.join(REPO_ROOT, "agents", "meeting_status.json")
NOTES_PATH = os.path.join(REPO_ROOT, "agents", "agent_notes.json")

# Known roster -- name -> department, matched against dispatch descriptions/prompts.
ROSTER = {
    "shira":   "product",
    "ayalon":  "product",
    "dolce":   "design",
    "gabbana": "design",
    "netta":   "design",
    "mark":    "design",
    "dana":    "mobile",
    "roei":    "mobile",
    "varan":   "mobile",
    "sam":     "backend",
    "oren":    "backend",
    "steve":   "backend",
}

# Static structure for the connection map -- who reports to whom (hierarchy)
# and who does real peer review with whom (peer). This doesn't change with
# activity; it's the org chart from COMPANY_OPERATING_MANUAL.md as data.
ORG_NODES = {
    "board": {"label": "דירקטוריון\nכרמל + מעיין", "kind": "board"},
    "jeff":  {"label": "ג'ף — CEO", "kind": "ceo"},
    "ayalon": {"label": "איילון", "kind": "head"},
    "steve":  {"label": "סטיב", "kind": "head"},
    "mark":   {"label": "מארק", "kind": "head"},
    "varan":  {"label": "וראן", "kind": "head"},
    "shira":  {"label": "שירה", "kind": "ic"},
    "sam":    {"label": "סאם", "kind": "ic"},
    "oren":   {"label": "אורן", "kind": "ic"},
    "dolce":  {"label": "דולצ'ה", "kind": "ic"},
    "gabbana": {"label": "גבאנה", "kind": "ic"},
    "netta":  {"label": "נטה", "kind": "ic"},
    "dana":   {"label": "דנה", "kind": "ic"},
    "roei":   {"label": "רועי", "kind": "ic"},
}

ORG_EDGES = [
    ("board", "jeff", "hierarchy"),
    ("jeff", "ayalon", "hierarchy"),
    ("jeff", "steve", "hierarchy"),
    ("jeff", "mark", "hierarchy"),
    ("jeff", "varan", "hierarchy"),
    ("ayalon", "shira", "hierarchy"),
    ("steve", "sam", "hierarchy"),
    ("steve", "oren", "hierarchy"),
    ("mark", "dolce", "hierarchy"),
    ("mark", "gabbana", "hierarchy"),
    ("mark", "netta", "hierarchy"),
    ("varan", "dana", "hierarchy"),
    ("varan", "roei", "hierarchy"),
    ("dolce", "gabbana", "peer"),
    ("dolce", "netta", "peer"),
    ("dana", "roei", "peer"),
    ("oren", "sam", "peer"),
]

USAGE_RE = re.compile(
    r"agentId:\s*`?([a-zA-Z0-9]+)`?.*?<usage>\s*subagent_tokens:\s*(\d+)\s*tool_uses:\s*(\d+)\s*duration_ms:\s*(\d+)",
    re.S,
)


def guess_persona(text):
    text_l = (text or "").lower()
    for name in ROSTER:
        if name in text_l:
            return name
    return None


def load_jsonl_records(path):
    with open(path, "r", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def extract_dispatches():
    """Returns a list of dispatch dicts gathered from every transcript file."""
    tool_use_index = {}  # tool_use_id -> {description, prompt, ts}
    dispatches = []

    files = sorted(glob.glob(os.path.join(TRANSCRIPT_DIR, "*.jsonl")), key=os.path.getmtime)

    for path in files:
        for obj in load_jsonl_records(path):
            msg = obj.get("message", {})
            content = msg.get("content", [])
            ts = obj.get("timestamp")
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict):
                    continue
                if block.get("type") == "tool_use" and block.get("name") == "Agent":
                    tid = block.get("id")
                    inp = block.get("input", {})
                    tool_use_index[tid] = {
                        "description": inp.get("description", ""),
                        "prompt": inp.get("prompt", ""),
                        "ts": ts,
                    }
                elif block.get("type") == "tool_result":
                    tid = block.get("tool_use_id")
                    raw = block.get("content")
                    if isinstance(raw, list):
                        raw = " ".join(t.get("text", "") for t in raw if isinstance(t, dict))
                    if not isinstance(raw, str) or "subagent_tokens" not in raw:
                        continue
                    m = USAGE_RE.search(raw)
                    if not m:
                        continue
                    agent_id, tokens, tool_uses, duration_ms = m.groups()
                    src = tool_use_index.get(tid, {})
                    description = src.get("description", "")
                    persona = guess_persona(description) or guess_persona(src.get("prompt", ""))
                    dispatches.append({
                        "agentId": agent_id,
                        "persona": persona,
                        "description": description,
                        "tokens": int(tokens),
                        "tool_uses": int(tool_uses),
                        "duration_ms": int(duration_ms),
                        "started_at": src.get("ts"),
                        "completed_at": ts,
                        "source_file": os.path.basename(path),
                    })
    return dispatches


def load_live_status():
    if os.path.exists(LIVE_STATUS_PATH):
        with open(LIVE_STATUS_PATH) as f:
            return json.load(f)
    return {}


def load_meeting_status():
    if os.path.exists(MEETING_STATUS_PATH):
        with open(MEETING_STATUS_PATH) as f:
            return json.load(f)
    return {"in_meeting": False, "attendees": [], "topic": None, "started_at": None}


def load_notes():
    if os.path.exists(NOTES_PATH):
        with open(NOTES_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}


def build():
    dispatches = extract_dispatches()
    live = load_live_status()
    notes = load_notes()

    per_agent = {}
    unattributed = []

    for d in dispatches:
        persona = d["persona"]
        if not persona:
            unattributed.append(d)
            continue
        agg = per_agent.setdefault(persona, {
            "department": ROSTER.get(persona, "unknown"),
            "total_dispatches": 0,
            "total_tokens": 0,
            "total_tool_uses": 0,
            "total_duration_ms": 0,
            "tasks": [],
        })
        agg["total_dispatches"] += 1
        agg["total_tokens"] += d["tokens"]
        agg["total_tool_uses"] += d["tool_uses"]
        agg["total_duration_ms"] += d["duration_ms"]
        agg["tasks"].append({
            "description": d["description"],
            "tokens": d["tokens"],
            "tool_uses": d["tool_uses"],
            "duration_ms": d["duration_ms"],
            "completed_at": d["completed_at"],
            "agentId": d["agentId"],
        })

    # make sure every roster member appears even with zero dispatches
    for name, dept in ROSTER.items():
        per_agent.setdefault(name, {
            "department": dept,
            "total_dispatches": 0,
            "total_tokens": 0,
            "total_tool_uses": 0,
            "total_duration_ms": 0,
            "tasks": [],
        })

    # merge live (currently-running) status
    for name, agg in per_agent.items():
        live_entry = live.get(name)
        if live_entry and live_entry.get("status") == "running":
            agg["status"] = "running"
            agg["current_task"] = live_entry.get("task")
            agg["running_since"] = live_entry.get("started_at")
        else:
            agg["status"] = "idle"
            agg["current_task"] = None
            agg["running_since"] = None
        if agg["tasks"]:
            agg["last_active"] = max(t["completed_at"] for t in agg["tasks"] if t["completed_at"])
        else:
            agg["last_active"] = None
        agg["notes"] = notes.get(name, [])

    company_totals = {
        "total_dispatches": sum(a["total_dispatches"] for a in per_agent.values()),
        "total_tokens": sum(a["total_tokens"] for a in per_agent.values()),
        "total_tool_uses": sum(a["total_tool_uses"] for a in per_agent.values()),
        "unattributed_dispatches": len(unattributed),
    }

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "agents": per_agent,
        "company_totals": company_totals,
        "unattributed": unattributed,
        "org_nodes": ORG_NODES,
        "org_edges": ORG_EDGES,
        "meeting": load_meeting_status(),
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    return out


if __name__ == "__main__":
    import sys
    data = build()
    if "--json" in sys.argv:
        # full payload, for the VS Code extension (no HTTP server involved)
        print(json.dumps(data, ensure_ascii=False))
    else:
        print(json.dumps(data["company_totals"], indent=2))
