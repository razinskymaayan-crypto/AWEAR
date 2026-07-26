# STATE — live task state (resume point for any fresh session)

> Updated continuously during work; at minimum at the end of every phase/task.
> A fresh session should be able to resume from THIS FILE ALONE.
> Discipline defined in `.claude/rules/memory.md` (Phase 5).

## Current effort: Foundation Audit & Upgrade (10-phase overhaul)
- **Plan**: `/Users/tamargrosz/.claude/plans/greedy-inventing-allen.md` (approved 2026-07-05)
- **Tracking**: AUDIT_REPORT.md (findings + effort log), NEEDS_DECISION.md (human decisions), TEMPLATE_BOUNDARY.md (company content log)
- **Branch**: local `main`, one commit per phase `foundation: phase N — <summary>`, NO push without founder ask
- **Context**: agents RESUMED 2026-07-05 by remote session (3 disjoint lanes, 6h cadence, `.agents_paused` deleted) — infra edits on shared files now need the concurrency check (activity_log) first
- **2026-07-06 (main session)**: protection-layer hardening shipped — jeff GATE 0 (deterministic lane ownership), circuit breaker (3 consecutive failed cycles → auto-pause + TG), conflict TTL (chronic branch → one-time TG escalation; `auto/ayalon`+`auto/scout` will escalate on jeff's next run — founder should reconcile-or-delete them), main-canary (smoke on direct human pushes to main), `.gitattributes` union-merge for append-only logs, loop-liveness re-pointed to autopilot-managers (was watching the DISABLED autopilot.yml; window 3h→7h)

## Mark lane — last run (2026-07-27, run 25)
- **Task**: DS-004 sweep — fix all wrong --success fallbacks in app.css. commit 0651046.
- **Done**: 14 occurrences of #1a7a4a and #34d399 (light-mode success values) replaced with #52c97a (canonical dark-mode token value). Affected: adm-grade-card, adm-grade-letter, adm-grade-label, adm-grade-sub, styl-avail.open, cmp-verdict, sus-score-card, sus-score-num, sus-score-label, sus-score-grade, earn big-num, listing live dot, modal-card earn-line. Same class as 2026-07-23 gate rejection. check-render ✓.
- **Status checks done**: DEFECTS.md — no open [mark] items. Assignments — all checked off. Dead buttons verified (feed like/save/share/comment wired). Close gestures verified (all sheets have drag-dismiss). No DS-008/009 violations found.
- **Next**: Continue INBOX ★★★★★ UX sweep — check remaining screens with gabbana for visual bugs, or advance the WOW flow demo quality. No open defects for mark lane.
- **Prior runs**: run 24 — shopping text truncation + badge polish (002c75f); run 23 — diary-overlay backdrop + scan-confirm drag-dismiss (8a73939); run 22 — generate-garment UI (activity log 2026-07-22); run 21 — DS-004 --progress-track.

## Steve lane — last run (2026-07-26, run 21)
- **Task**: Self-heal — verify and close [OPEN] CI_FAILURES.md entry for 6 failing tests.
- **Done**: Race condition confirmed: CI triggered at 10:14:36 before f0cf6a1 fix (10:11:31) propagated. Code fix already on branch: (1) agent_schedule/agent_meeting wrap Calendar calls in try/except → 503; (2) agent_summary broadened RuntimeError→Exception → 503 on SMTP/connection errors; (3) scan-health.agent_services.google_available added. Verified live: schedule→503 "calendar", meeting→503 "meeting". CI_FAILURES.md [OPEN]→[FIXED] blocked by file permissions (`.claude/agents/knowledge/` not in pre-approved write list).
- **Prior run (run 20)**: Resilience audit — harden agent Google-service endpoints. commit f0cf6a1. Suite: 203/203.
- **Resilience audit status**: COMPLETE. All Claude/OpenAI/weather/Pexels/Supabase/Google paths verified.
- **All INBOX launch infra steps done**: Render (60f159e), Supabase Auth (9667fd0), Postgres _CompatDB (8c8b41), Storage (565f18d).
- **Next**: INBOX item 3 — data-integrity orphan check (id-references between static/data/*.json and app.py). OR Supabase epic next step.
- **Founder action needed**: Set DATABASE_URL on Render dashboard (postgresql://...) to activate Postgres; run notes/schema_postgres.sql in Supabase SQL editor once.

## Phase status
| Phase | Status |
|---|---|
| 0 — Inventory & diagnosis | ✅ done (see AUDIT_REPORT.md) |
| Setup — scaffolding files | ✅ done (commit 967da14) |
| 1 — CLAUDE.md pruning + hook slimming | ✅ done — auto-load 5.9k→2.6k tokens; awaiting P4 review |
| 2 — Skills upgrade + skill-gardener | ✅ done (a6abfb9 + review fixes) — P4 reviewed, YAML blocker fixed |
| 3 — Agents: 30-line format + model routing | ✅ done — 1,986→535 lines, briefs/ created, sonnet routing on implementers |
| 4 — Hooks & settings rails | ✅ done — bash guard, secret deny, DS-009, posttool checks, 32-case test suite |
| 5 — Memory architecture | ✅ done — DECISIONS seeded, rules/memory.md, notes/ |
| 6 — Effort tiers | ✅ done — rules/effort.md + workflow wiring |
| 7 — Verification harness (pytest/ruff/evals) | ⬜ next |
| 8 — Reporting protocol | ✅ done (executed before 7) — rules/reporting.md + engine/lane prompt wiring |
| 9 — Code quality + hygiene (parallel worktrees) | ⬜ |
| 10 — Autonomy dry run | ⬜ |
| Final — deliverables | ⬜ |

## 🔴 ACTIVE (2026-07-19, Maayan + main session) — supersedes the paused Foundation-Audit state above
Two parallel tracks; lanes are RUNNING (not paused), cadence every 2h, model claude-sonnet-4-6.

**Track 1 — LAUNCH INFRA (target: full launch ~2026-08-18, first cohort ~200 users):**
- Backend LIVE on Render: `https://awear-x4o2.onrender.com` (Capacitor `server.url` points here; app runs on a real iPhone + uploaded to TestFlight as `com.awear.fashion` under Segev Olpak's paid Apple acct; Carmel invited, pending his email accept).
- Supabase project created; SUPABASE_* + DATABASE_URL set in Render. Agent epic (INBOX ★★★): Auth → Postgres (steve wired `_get_db()` choke-point) → Storage. DECISIONS #17.
- Image-gen (`/api/generate-garment`, OpenAI, demo-first) built — LIVE call fails (needs OpenAI org-verify + billing); decided match-first + cache for scale; free alt = bg-removal (route B), deferred.

**Track 2 — HARDEN THE AUTONOMY ENGINE (founder: perfect by 2026-07-20 eve, then re-test):**
Full-pipeline audit done. Fixes shipped by MAIN SESSION (lanes can't touch `.github/`): P0 base-anchor OW-013 (fc6b321 — THE 'nothing lands' bug), ownership-map alignment (05cfba4), P1 rejection-feedback + P2 INBOX/shared + P4 self-heal routing (92b353c). Cadence 6h→2h. Lanes redirected to infra-hardening ONLY (no features) until the re-test.
- REMAINING: verify the next cycle lands work (gate-ledger); phantom-lane cleanup; GATE 3 determinism; evaluate GitHub-native CODEOWNERS + Merge Queue (strategic simplification).

## Open questions
See NEEDS_DECISION.md — defaults applied, none blocking. Live founder decisions: OpenAI billing (for live image-gen) · which Apple acct for the real launch (Segev's vs own).

## Test commands (preserve across compaction)
- Server: `venv312/bin/uvicorn app:app --reload --port 8000`
- Render check: `npm run check-render`
- Guards: `bash scripts/guard_checks.sh`
- Tests/lint: pytest + ruff arrive in Phase 7
