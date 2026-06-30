#!/bin/bash
# founder_questions_nudge.sh — daily Telegram reminder for unanswered founder questions.
# No-op when FOUNDER_QUESTIONS.md "## OPEN" has no questions. (OW-012, stale → Telegram)
set -u
MSG=$(python3 - <<'PY'
import os, re, sys
path = ".claude/master/FOUNDER_QUESTIONS.md"
if not os.path.exists(path):
    sys.exit(0)
text = open(path, encoding="utf-8").read()
m = re.search(r'^##\s+OPEN\b.*?$(.*?)(?=^##\s|\Z)', text, re.S | re.M)
section = (m.group(1) if m else "")
qs = re.findall(r'^###\s+(Q\d+\s+—\s+[^\n·]+)', section, re.M)
if not qs:
    sys.exit(0)
head = f"📋 {len(qs)} open founder question(s) waiting — open a Claude session or answer in FOUNDER_QUESTIONS.md:"
lines = "\n".join("• " + q.strip() for q in qs[:8])
print(head + "\n" + lines)
PY
)
[ -z "$MSG" ] && exit 0
bash scripts/tg.sh text "$MSG" || true
