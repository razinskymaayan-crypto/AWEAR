#!/bin/zsh
# AWEAR Autopilot — continuous autonomous loop.
# Runs Claude Code headless, advancing MASTER_PLAN one task at a time, 24/7.
# As soon as one run finishes, the next starts → maximum throughput, no idle.
# Managed by launchd (com.awear.autopilot). Logs to logs/autopilot.log.

set -u

REPO="/Users/tamargrosz/AWEAR"
CLAUDE_BIN="$HOME/.vscode/extensions/anthropic.claude-code-2.1.185-darwin-arm64/resources/native-binary/claude"
LOG_DIR="$REPO/logs"
LOG="$LOG_DIR/autopilot.log"
MODEL="opus"
# Minimum seconds between runs (safety throttle so a fast-failing run can't spin).
MIN_GAP=15
# Quiet hours — autopilot pauses so YOU always have quota for interactive work.
# Blackout = [QUIET_START, QUIET_END) in 24h local time. 18..23 => paused 18:00–22:59.
QUIET_START=18
QUIET_END=23
# Intelligence cadence: every Nth run is a Scout intelligence run (see
# .claude/agents/CYCLE_PROTOCOL.md → Intelligence Lane). N=4 => ~25% of capacity.
INTEL_EVERY=4
INTEL_COUNTER="$REPO/.intel_run_count"

mkdir -p "$LOG_DIR"
cd "$REPO" || exit 1

# Fall back to PATH lookup if the pinned binary moved (version bump).
[ -x "$CLAUDE_BIN" ] || CLAUDE_BIN="$(command -v claude)"

PROMPT='You are an autonomous AWEAR engineer working solo. Do ONE task this run, end to end.

0. FIRST read .claude/master/INBOX.md. If there is any message marked [פתוח] (open), that is your task this run — it OVERRIDES the master plan. Do exactly what it asks. When done, write a short reply in Hebrew directly under that message and change its tag from [פתוח] to [DONE]. If there are multiple open messages, handle the oldest one. If there are no open messages, continue to step 0.5.
0.5. INTELLIGENCE RUN: the RUN MODE line at the very top of this prompt says either INTELLIGENCE or BUILD. If it says INTELLIGENCE and there is NO open [פתוח] INBOX message and NO ANSWERED founder directive pending, then act as the Scout agent for this run: follow .claude/agents/scout.md exactly (DEDUP FIRST via `python3 scripts/intel_db.py known`, ≤6 web fetches, write docs/research/<date>-<topic>.md, record insights via `python3 scripts/intel_db.py add`, then decide act-vs-escalate per the decision table), append an activity_log.md row (agent = scout), and STOP — skip steps 1-5. A broken build (CI-fix) or an ANSWERED directive still overrides an intelligence run. Otherwise continue to step 1.
1. Read .claude/master/MASTER_PLAN.md and the last 10 lines of .claude/agents/activity_log.md.
2. Pick the single highest-priority unfinished task. If everything planned is done, pick the next concrete improvement that moves the product toward the master plan.
3. Implement it following .claude/commands/ship.md exactly: sync origin/main first (git fetch + merge, never overwrite the other team), build the change (delegate UI work to the dolce subagent; gate any visual change with the gabbana subagent, score must be 8+), then VERIFY — `node --check` on the extracted JS AND `npm run check-render` must both exit 0. Do not commit if verification fails.
4. Append one activity_log.md entry in the required format.
5. git fetch again; if behind, merge; then commit (end message with the Co-Authored-By line) and `git push origin main`.

Keep the change scoped — no unrelated edits. Never report success unless verification and push actually passed. Work on exactly one task, then stop.'

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ===== AUTOPILOT STARTED =====" >> "$LOG"

while true; do
  # Quiet-hours guard: during the blackout window, idle in 5-min checks.
  HOUR=$(date +%H)
  HOUR=${HOUR#0}   # strip leading zero so 08 isn't read as octal
  if [ "$HOUR" -ge "$QUIET_START" ] && [ "$HOUR" -lt "$QUIET_END" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] quiet hours (${QUIET_START}:00-${QUIET_END}:00) — paused, holding your quota" >> "$LOG"
    sleep 300
    continue
  fi

  START=$(date +%s)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] --- run begin ---" >> "$LOG"

  # Intelligence cadence: increment the run counter; every INTEL_EVERY-th run is
  # a Scout intelligence run (unless a CI-fix / ANSWERED directive overrides it).
  RUN_N=$(( $(cat "$INTEL_COUNTER" 2>/dev/null || echo 0) + 1 ))
  echo "$RUN_N" > "$INTEL_COUNTER"
  if [ $(( RUN_N % INTEL_EVERY )) -eq 0 ]; then
    RUN_MODE="RUN MODE: INTELLIGENCE (run #$RUN_N — every ${INTEL_EVERY}th run is Scout; see step 0.5)."
  else
    RUN_MODE="RUN MODE: BUILD (run #$RUN_N)."
  fi
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $RUN_MODE" >> "$LOG"

  # Scoped autonomy: only these tool families are allowed — no blanket bypass.
  # It can read/edit code, run git/npm/node/python, but cannot run arbitrary
  # destructive shell (rm -rf, curl|sh, etc.) without that being in the list.
  "$CLAUDE_BIN" -p "${RUN_MODE}"$'\n\n'"${PROMPT}" \
    --model "$MODEL" \
    --permission-mode acceptEdits \
    --allowedTools \
      "Edit" "Write" "Read" "Glob" "Grep" "Task" \
      "Bash(git add:*)" "Bash(git commit:*)" "Bash(git push:*)" \
      "Bash(git fetch:*)" "Bash(git merge:*)" "Bash(git status:*)" \
      "Bash(git log:*)" "Bash(git diff:*)" "Bash(git checkout:*)" \
      "Bash(git pull:*)" "Bash(git stash:*)" \
      "Bash(npm install:*)" "Bash(npm run:*)" \
      "Bash(node:*)" "Bash(python3:*)" "Bash(awk:*)" \
      "Bash(sqlite3:*)" "Bash(bash scripts/tg.sh:*)" \
      "WebSearch" "WebFetch" \
    --output-format text \
    >> "$LOG" 2>&1

  CODE=$?
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] --- run end (exit $CODE) ---" >> "$LOG"

  # Throttle: ensure at least MIN_GAP seconds per cycle.
  ELAPSED=$(( $(date +%s) - START ))
  if [ "$ELAPSED" -lt "$MIN_GAP" ]; then
    sleep $(( MIN_GAP - ELAPSED ))
  fi
done
