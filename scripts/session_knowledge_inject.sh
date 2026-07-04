#!/bin/bash
# session_knowledge_inject.sh — SessionStart hook: auto-inject the knowledge layer.
#
# WHY (OW-006): "a rule without an enforcement mechanism is only a recommendation."
# Every agent .md says "read OW.md + your domain file first" — prose the model may skip.
# This hook makes consumption MECHANICAL: every session (including headless CI runs)
# starts with the learning-code INDEX + the last activity-log entries already in context.
# stdout of a SessionStart hook is added to the model's context.

cd "$(dirname "$0")/.." || exit 0
K=".claude/agents/knowledge"

[ -f "$K/INDEX.md" ] || exit 0

echo "=== AWEAR KNOWLEDGE (auto-injected; OW-006 enforcement) ==="
echo "Learning-code INDEX — before domain work, read the FULL entry in the cited file:"
echo ""
cat "$K/INDEX.md"
echo ""
echo "=== LAST 5 ACTIVITY-LOG ENTRIES (check for concurrent edits / done areas — OW-003, OW-011) ==="
grep -E '^\|' ".claude/agents/activity_log.md" 2>/dev/null | tail -5
echo ""
echo "=== END AUTO-INJECTED KNOWLEDGE ==="
exit 0
