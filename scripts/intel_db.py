#!/usr/bin/env python3
"""AWEAR Intelligence base — read/write helper for the intel_insights store.

The Scout agent (.claude/agents/scout.md) uses this to make research COMPOUND
instead of repeat. Two rules it enforces:

  1. DEDUP FIRST — before any WebSearch, Scout runs `known <topic>` and skips
     topics already covered (reads the linked doc instead of re-researching).
  2. SCORE TO DECIDE — `priority = impact*confidence - effort` ranks whether an
     insight is worth acting on / escalating.

Same DB as the app (data/awear.db). The table is created by app.py init_db();
this module also ensures it on first use so the CLI works before the server runs.

CLI (what Scout calls from Bash):
    python3 scripts/intel_db.py known "<topic>"                 # dedup gate — lists matches
    python3 scripts/intel_db.py add '<json>'                    # insert one insight, prints its id
    python3 scripts/intel_db.py score <id>                      # print priority score
    python3 scripts/intel_db.py set-status <id> <status>        # new|deliberating|acted|escalated|parked|superseded
    python3 scripts/intel_db.py list [status]                   # list insights (optionally by status)

`add` accepts a JSON object with at least: topic, source_type, title, summary.
Optional: source_url, evidence, loop_stage, confidence, impact, effort,
status, proposal, doc_path, created_by.
"""
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "awear.db"
# Committed, git-tracked mirror of every insight. data/awear.db is gitignored and
# is recreated empty on each fresh checkout (e.g. every GitHub Actions run), so the
# DB alone can't dedup across runs. This append-only JSONL is committed with the
# docs, so `known()` survives ephemeral runtimes by hydrating the DB from it.
MIRROR_PATH = ROOT / "docs" / "research" / "intel_insights.jsonl"

VALID_STATUS = {"new", "deliberating", "acted", "escalated", "parked", "superseded"}
VALID_SOURCE = {"competitor", "trend", "pricing", "social", "tech_ux", "other"}

_MIRROR_FIELDS = (
    "id", "topic", "source_type", "source_url", "title", "summary", "evidence",
    "loop_stage", "confidence", "impact", "effort", "status", "proposal",
    "doc_path", "created_by",
)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS intel_insights (
    id           TEXT PRIMARY KEY,
    topic        TEXT NOT NULL,
    source_type  TEXT NOT NULL,
    source_url   TEXT DEFAULT '',
    title        TEXT NOT NULL,
    summary      TEXT NOT NULL,
    evidence     TEXT DEFAULT '',
    loop_stage   TEXT DEFAULT '',
    confidence   INTEGER DEFAULT 3,
    impact       INTEGER DEFAULT 3,
    effort       INTEGER DEFAULT 3,
    status       TEXT DEFAULT 'new',
    proposal     TEXT DEFAULT '',
    doc_path     TEXT DEFAULT '',
    created_by   TEXT DEFAULT 'scout',
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_intel_topic  ON intel_insights (topic);
CREATE INDEX IF NOT EXISTS idx_intel_status ON intel_insights (status);
"""


def _hydrate(conn: sqlite3.Connection) -> None:
    """Load the committed JSONL mirror into the DB (INSERT OR IGNORE by id), so a
    fresh/ephemeral DB still knows every previously recorded insight for dedup."""
    if not MIRROR_PATH.exists():
        return
    with open(MIRROR_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            conn.execute(
                """INSERT OR IGNORE INTO intel_insights
                   (id, topic, source_type, source_url, title, summary, evidence,
                    loop_stage, confidence, impact, effort, status, proposal,
                    doc_path, created_by)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    r.get("id"), r.get("topic", ""), r.get("source_type", "other"),
                    r.get("source_url", ""), r.get("title", ""), r.get("summary", ""),
                    r.get("evidence", ""), r.get("loop_stage", ""),
                    int(r.get("confidence", 3)), int(r.get("impact", 3)),
                    int(r.get("effort", 3)), r.get("status", "new"),
                    r.get("proposal", ""), r.get("doc_path", ""),
                    r.get("created_by", "scout"),
                ),
            )
    conn.commit()


def _mirror_append(row: dict) -> None:
    """Append one insight to the committed JSONL mirror (durable across runtimes)."""
    MIRROR_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MIRROR_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps({k: row.get(k) for k in _MIRROR_FIELDS}, ensure_ascii=False) + "\n")


def _conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)  # idempotent — safe if app.py already made it
    _hydrate(conn)               # pull in committed insights for cross-run dedup
    return conn


def _slug(text: str) -> str:
    """Normalize a topic to a dedup key: lowercase, alnum + single dashes."""
    out = []
    prev_dash = False
    for ch in text.strip().lower():
        if ch.isalnum():
            out.append(ch)
            prev_dash = False
        elif not prev_dash:
            out.append("-")
            prev_dash = True
    return "".join(out).strip("-")


def known(topic: str) -> list:
    """Rows already covering this topic (dedup gate). Matches on normalized slug
    substring in either direction, so 'depop' finds 'depop-resale-flow'."""
    slug = _slug(topic)
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM intel_insights "
            "WHERE status != 'superseded' "
            "AND (topic LIKE ? OR ? LIKE '%' || topic || '%') "
            "ORDER BY created_at DESC",
            (f"%{slug}%", slug),
        ).fetchall()
    return [dict(r) for r in rows]


def _next_id(conn: sqlite3.Connection) -> str:
    """INS-YYYYMMDD-nnn — date from SQLite (no Date.now in scripts), nnn is a
    daily running counter."""
    day = conn.execute("SELECT strftime('%Y%m%d', 'now')").fetchone()[0]
    prefix = f"INS-{day}-"
    row = conn.execute(
        "SELECT id FROM intel_insights WHERE id LIKE ? ORDER BY id DESC LIMIT 1",
        (f"{prefix}%",),
    ).fetchone()
    n = (int(row[0].rsplit("-", 1)[1]) + 1) if row else 1
    return f"{prefix}{n:03d}"


def add(insight: dict) -> str:
    """Insert one insight; returns its id. Normalizes topic to a slug for dedup."""
    required = ("topic", "source_type", "title", "summary")
    missing = [k for k in required if not insight.get(k)]
    if missing:
        raise ValueError(f"missing required field(s): {', '.join(missing)}")
    st = insight.get("source_type")
    if st not in VALID_SOURCE:
        raise ValueError(f"source_type must be one of {sorted(VALID_SOURCE)}")
    row = {
        "topic": _slug(insight["topic"]),
        "source_type": st,
        "source_url": insight.get("source_url", ""),
        "title": insight["title"],
        "summary": insight["summary"],
        "evidence": insight.get("evidence", ""),
        "loop_stage": insight.get("loop_stage", ""),
        "confidence": int(insight.get("confidence", 3)),
        "impact": int(insight.get("impact", 3)),
        "effort": int(insight.get("effort", 3)),
        "status": insight.get("status", "new"),
        "proposal": insight.get("proposal", ""),
        "doc_path": insight.get("doc_path", ""),
        "created_by": insight.get("created_by", "scout"),
    }
    with _conn() as conn:
        new_id = _next_id(conn)
        row["id"] = new_id
        conn.execute(
            """INSERT INTO intel_insights
               (id, topic, source_type, source_url, title, summary, evidence,
                loop_stage, confidence, impact, effort, status, proposal,
                doc_path, created_by)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            tuple(row[k] for k in _MIRROR_FIELDS),
        )
        conn.commit()
    _mirror_append(row)
    return new_id


def score(insight_id: str) -> int:
    """priority = impact*confidence - effort. Higher = more worth acting on."""
    with _conn() as conn:
        row = conn.execute(
            "SELECT impact, confidence, effort FROM intel_insights WHERE id = ?",
            (insight_id,),
        ).fetchone()
    if not row:
        raise KeyError(f"no insight {insight_id}")
    return row["impact"] * row["confidence"] - row["effort"]


def set_status(insight_id: str, status: str) -> None:
    if status not in VALID_STATUS:
        raise ValueError(f"status must be one of {sorted(VALID_STATUS)}")
    with _conn() as conn:
        cur = conn.execute(
            "UPDATE intel_insights SET status = ?, updated_at = datetime('now') "
            "WHERE id = ?",
            (status, insight_id),
        )
        conn.commit()
    if cur.rowcount == 0:
        raise KeyError(f"no insight {insight_id}")


def _list(status: str = None) -> list:
    with _conn() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM intel_insights WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM intel_insights ORDER BY created_at DESC"
            ).fetchall()
    return [dict(r) for r in rows]


def _print_rows(rows: list) -> None:
    if not rows:
        print("(none)")
        return
    for r in rows:
        pr = r["impact"] * r["confidence"] - r["effort"]
        print(
            f"{r['id']}  [{r['status']}] pr={pr:>3}  {r['source_type']:<10} "
            f"{r['topic']:<28} {r['title']}"
        )
        if r.get("doc_path"):
            print(f"           doc: {r['doc_path']}")


def main(argv: list) -> int:
    if not argv:
        print(__doc__)
        return 1
    cmd = argv[0]
    try:
        if cmd == "known":
            if len(argv) < 2:
                print("usage: intel_db.py known \"<topic>\"", file=sys.stderr)
                return 2
            rows = known(argv[1])
            if rows:
                print(f"ALREADY KNOWN ({len(rows)} insight(s)) — read the doc, do not re-research:")
                _print_rows(rows)
            else:
                print("NOT KNOWN — safe to research this topic.")
            return 0
        if cmd == "add":
            if len(argv) < 2:
                print("usage: intel_db.py add '<json>'", file=sys.stderr)
                return 2
            print(add(json.loads(argv[1])))
            return 0
        if cmd == "score":
            print(score(argv[1]))
            return 0
        if cmd == "set-status":
            set_status(argv[1], argv[2])
            print(f"{argv[1]} -> {argv[2]}")
            return 0
        if cmd == "list":
            _print_rows(_list(argv[1] if len(argv) > 1 else None))
            return 0
        print(f"unknown command: {cmd}", file=sys.stderr)
        print(__doc__, file=sys.stderr)
        return 2
    except (ValueError, KeyError, json.JSONDecodeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
