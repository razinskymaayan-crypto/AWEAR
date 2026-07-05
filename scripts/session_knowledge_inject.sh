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
echo "Org-wide learning codes (mandatory for ALL agents). For domain work, grep $K/INDEX.md"
echo "for your domain's codes (BE/DS/MB/SF/MG/IN) and read the FULL entry in the cited file:"
echo ""
# Inject ONLY the org-wide table — the full INDEX (~3k tokens) was the biggest auto-load leak.
awk '/^## Org-Wide/{f=1; next} /^## /{if(f) exit} f && /^\|/' "$K/INDEX.md"
echo ""
echo "Domain files: $K/{be,ds,mb,sf,mg,in}.md · full registry: $K/INDEX.md"
echo ""
echo "=== LAST 3 ACTIVITY-LOG ENTRIES (concurrent-edit check — OW-003, OW-011) ==="
grep -E '^\|' ".claude/agents/activity_log.md" 2>/dev/null | tail -3
echo ""
echo "=== STATE (resume point — read STATE.md for full detail) ==="
head -20 "STATE.md" 2>/dev/null
echo "=== END AUTO-INJECTED KNOWLEDGE ==="
exit 0
