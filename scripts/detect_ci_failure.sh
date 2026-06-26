#!/bin/bash
# Self-healing: detect whether the most recent COMPLETED autopilot run FAILED, and if that
# failure has not been recorded yet, append its failed-step log tail to CI_FAILURES.md so the
# current run can diagnose and fix it autonomously.
#
# Uses the built-in GITHUB_TOKEN (needs `actions: read` permission). No personal token needed.
set -u

REPO="${GITHUB_REPOSITORY:-}"
TOKEN="${GH_TOKEN:-}"
OUT=".claude/agents/knowledge/CI_FAILURES.md"
[ -z "$TOKEN" ] || [ -z "$REPO" ] && { echo "detect_ci_failure: no token/repo — skipping"; exit 0; }

api() { curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" "$@"; }
py() { python3 -c "$1"; }

RUNS=$(api "https://api.github.com/repos/$REPO/actions/workflows/autopilot.yml/runs?status=completed&per_page=1")
CONCLUSION=$(echo "$RUNS" | py "import sys,json
d=json.load(sys.stdin); r=d.get('workflow_runs',[])
print(r[0]['conclusion'] if r else '')")
RUN_ID=$(echo "$RUNS" | py "import sys,json
d=json.load(sys.stdin); r=d.get('workflow_runs',[])
print(r[0]['id'] if r else '')")

if [ "$CONCLUSION" != "failure" ]; then
  echo "detect_ci_failure: previous completed run = ${CONCLUSION:-none} — nothing to heal"
  exit 0
fi
if grep -q "run $RUN_ID" "$OUT" 2>/dev/null; then
  echo "detect_ci_failure: run $RUN_ID already recorded"
  exit 0
fi

JOBS=$(api "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/jobs")
JOB_ID=$(echo "$JOBS" | py "import sys,json
d=json.load(sys.stdin); j=[x for x in d.get('jobs',[]) if x.get('conclusion')=='failure']
print(j[0]['id'] if j else '')")
STEP=$(echo "$JOBS" | py "import sys,json
d=json.load(sys.stdin); j=[x for x in d.get('jobs',[]) if x.get('conclusion')=='failure']
s=[s for s in (j[0]['steps'] if j else []) if s.get('conclusion')=='failure']
print(s[0]['name'] if s else 'unknown step')")

LOG_TAIL=""
if [ -n "$JOB_ID" ]; then
  LOG_TAIL=$(curl -sL -H "Authorization: Bearer $TOKEN" \
    "https://api.github.com/repos/$REPO/actions/jobs/$JOB_ID/logs" 2>/dev/null | tail -40)
fi

{
  echo ""
  echo "## [UNRESOLVED] run $RUN_ID — failed at: $STEP ($(date -u +%Y-%m-%dT%H:%MZ))"
  echo '```'
  echo "${LOG_TAIL:-<log unavailable>}"
  echo '```'
} >> "$OUT"
echo "detect_ci_failure: recorded UNRESOLVED failure for run $RUN_ID (step: $STEP)"
