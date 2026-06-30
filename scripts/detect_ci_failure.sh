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

# Noise common to every job-end: groups, post-job cleanup, Node-20 deprecation.
# Filter before tailing so the recorded tail is the failed step's REAL output, not boilerplate.
NOISE_RE='##\[group\]|##\[endgroup\]|Post job cleanup|Node(\.js)? [0-9]+ .*deprecat|set-output command is deprecated|save-state command is deprecated'

WORKDIR=$(mktemp -d 2>/dev/null) || WORKDIR=""
TMPZIP=$(mktemp 2>/dev/null) || TMPZIP=""

LOG_TAIL=""
SOURCE=""

# PRIMARY: per-step log from the run-logs zip. GitHub sanitizes step filenames, so we
# match the failed $STEP as a case-insensitive substring of the basename. When several
# files match (e.g. a same-named setup step), pick the highest numeric "<n>_" prefix.
if [ -n "$WORKDIR" ] && [ -n "$TMPZIP" ]; then
  curl -sL -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/actions/runs/$RUN_ID/logs" -o "$TMPZIP" 2>/dev/null || true
  if command -v unzip >/dev/null 2>&1 && [ -s "$TMPZIP" ]; then
    if unzip -o "$TMPZIP" -d "$WORKDIR" >/dev/null 2>&1; then
      STEP_FILE=$(STEP="$STEP" WORKDIR="$WORKDIR" py "import os,sys,re
step=os.environ.get('STEP','').lower()
root=os.environ.get('WORKDIR','')
best=None; best_n=-1
for dirpath,_,files in os.walk(root):
    for f in files:
        if not f.lower().endswith('.txt'): continue
        if step and step in f.lower():
            m=re.match(r'\s*(\d+)_', f)
            n=int(m.group(1)) if m else -1
            if n>best_n:
                best_n=n; best=os.path.join(dirpath,f)
print(best or '')" 2>/dev/null) || STEP_FILE=""
      if [ -n "$STEP_FILE" ] && [ -f "$STEP_FILE" ]; then
        LOG_TAIL=$(grep -v -E "$NOISE_RE" "$STEP_FILE" 2>/dev/null | tail -60)
        SOURCE="step-log"
      fi
    fi
  fi
fi

# FALLBACK: whole job log (the original behavior) — same noise filter, tail -40.
if [ -z "$LOG_TAIL" ] && [ -n "$JOB_ID" ]; then
  LOG_TAIL=$(curl -sL -H "Authorization: Bearer $TOKEN" \
    "https://api.github.com/repos/$REPO/actions/jobs/$JOB_ID/logs" 2>/dev/null \
    | grep -v -E "$NOISE_RE" | tail -40)
  SOURCE="job-tail-fallback"
fi

# Likely-cause heuristic: failed-job duration. Close to the 30-min cap → timeout; else transient.
LIKELY_CAUSE=$(echo "$JOBS" | py "import sys,json
from datetime import datetime
try:
    d=json.load(sys.stdin)
    j=[x for x in d.get('jobs',[]) if x.get('conclusion')=='failure']
    if not j: sys.exit(0)
    st=j[0].get('started_at'); ct=j[0].get('completed_at')
    if not st or not ct: sys.exit(0)
    f='%Y-%m-%dT%H:%M:%SZ'
    dur=(datetime.strptime(ct,f)-datetime.strptime(st,f)).total_seconds()
    if dur>=1740:
        print('timeout-minutes:30 likely hit')
    else:
        print('transient (API/OAuth/rate-limit) — read the step log above')
except Exception:
    pass" 2>/dev/null) || LIKELY_CAUSE=""

{
  echo ""
  echo "## [UNRESOLVED] run $RUN_ID — failed at: $STEP ($(date -u +%Y-%m-%dT%H:%MZ))"
  echo "source: ${SOURCE:-none}"
  echo '```'
  echo "${LOG_TAIL:-<log unavailable>}"
  echo '```'
  [ -n "$LIKELY_CAUSE" ] && echo "likely_cause: $LIKELY_CAUSE"
} >> "$OUT"

# Non-fatal cleanup — never let detect fail its own run.
[ -n "$WORKDIR" ] && rm -rf "$WORKDIR" 2>/dev/null || true
[ -n "$TMPZIP" ] && rm -f "$TMPZIP" 2>/dev/null || true

echo "detect_ci_failure: recorded UNRESOLVED failure for run $RUN_ID (step: $STEP, source: ${SOURCE:-none})"
