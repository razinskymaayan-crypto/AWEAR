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

## Mark lane — last run (2026-07-31, run 39)
- **Task**: INBOX item 5 — stuck overlays on iOS, bottom-sheet safe-area sweep.
- **Done**: (1) `openCreateMenu`: added `_addSheetDragDismiss` on first open (`_dragBound` guard) — create-sheet now swipes down to dismiss like every other bottom sheet. (2) `.diary-footer`: bottom padding was `12px 16px`; changed to `12px 16px calc(12px + env(safe-area-inset-bottom, 0px))` — submit button no longer hidden behind iPhone X+ home indicator. Audit confirmed all other sheets already had drag-dismiss + safe-area. commit fa40522. check-render PASS. node --check PASS.
- **Next**: INBOX item 5 remaining — DS-004/008/009 sweep with gabbana audit.
- **Prior runs**: run 38 — dead buttons (share wired) 6b4fd5a; run 37 — avatar contrast dc70e2d; run 36 — comments-sheet + purchase-modal (03f5e2e); run 35 — Text truncation sweep (5728519); run 34 — DS-004 sf-sub/sf-card-brand fallbacks (a004b35).

## Steve lane — last run (2026-07-31, run 29)
- **Task**: INBOX item 2 resilience — agent_summary returning 500 (not 503) when Google absent.
- **Done**: Fixed `if not ok` branch in agent_summary: `status_code=500` → `status_code=503`. Updated 2 tests. API now consistent: all Google-absent agent endpoints (summary/schedule/meeting) return 503. commit 39efe7f.
- **Next**: INBOX item 2 continued — scan remaining ext-dep paths for any remaining 500s; or INBOX item 3 (data-integrity cross-ref app.py↔json).
- **Prior runs**: run 28 — self-heal stale CI_FAILURES entries; run 27 — fixed scan-health google_available check; runs 20-26 — launch infra (Render, Supabase, Postgres, Storage).
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
