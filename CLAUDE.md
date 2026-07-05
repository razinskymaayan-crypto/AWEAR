# AWEAR — Agent Briefing

Fashion social app. FastAPI `app.py` (~4.1k lines) + vanilla JS SPA `static/index.html` (~11.8k lines) + dormant `mobile/` (RN). DB: SQLite `data/awear.db`. Server: `venv312/bin/uvicorn app:app --reload --port 8000`. Line numbers in docs are hints — **grep is the truth**.

## Start here, every task
1. Read `STATE.md` (current work state / resume point). Update it when you finish or pause.
2. Classify the task S/M/L per `.claude/rules/effort.md` and behave accordingly.
3. Check `.claude/agents/activity_log.md` last 3 entries for concurrent edits; append your own when done: `| YYYY-MM-DD | agent | branch/file | status | description |`
4. Settled questions: `DECISIONS.md` — consult before re-researching. Learning codes: the injected INDEX headline points into `.claude/agents/knowledge/`.

## Iron Rules (CI-enforced at jeff-merge; full list `.claude/agents/knowledge/INDEX.md`)
- UI: `icon()`/inline SVG, never emoji; `var(--token, fallback)`, never bare hex → `.claude/rules/design-tokens.md`
- Backend: SQLite from day 1 (no in-memory stores); BE-006 `user_key` pattern; no HTTP calls inside async endpoints
- Rename = grep 3 layers (`app.py` + `static/index.html` + `mobile/`) — use `backend-rename-safety` skill
- DoD = verified (grep/curl/test/render), never "I think it works"; report per `.claude/rules/reporting.md`
- Editing discipline (grep-before-Read, worktrees, TDZ): `.claude/rules/editing.md`

## Key paths
- Plans: master `.claude/master/MASTER_PLAN.md` · design SoT `docs/VISUAL_VISION.md` · specs `.claude/agents/plans/INDEX.md`
- Tokens SoT: `awear-tokens.json` (edit the json — it generates `static/tokens.css`)
- Memory: `STATE.md` · `DECISIONS.md` · `notes/` (per-task) · rules of who-writes-what: `.claude/rules/memory.md`
- Pipeline/automation docs: `.claude/agents/docs/PIPELINE.md` · agent briefs: `.claude/agents/docs/briefs/` · Telegram only via `scripts/tglib.py`

## Verify (fast commands)
`bash scripts/guard_checks.sh` · `npm run check-render` · `bash scripts/verify.sh` (tests+lint). Before editing giant files, load the matching skill: `spa-navigation` (index.html), `backend-patterns` (app.py).

## Compaction directive
When compacting context, ALWAYS preserve: the modified-file list, test commands, and current task state (STATE.md contents).
