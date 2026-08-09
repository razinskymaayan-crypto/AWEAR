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

## Mark lane — last run (2026-08-09, run 69)
- **Task**: Commerce UX fix — profile look-tap now opens proper 3-tier buy sheet (Buy/Find Similar/Resale per item) instead of a dead "Close"-only sheet. Commit a554415.
- **Done**: static/app.js only. Replaced stale 45-line inline sheet renderer with openSheetLook() call in the public profile Posts tab. check-render + check-interactions green.
- **Next**: INBOX commerce UI tasks all done; token peg UX decision still NEEDS_DECISION #3 (founder-only); further polish pass on any Gabbana-flagged items.
- **Prior runs**: run 68 — DS-004 light-theme scope 843722d; run 67 — look-sheet chip animation 5a3f177; run 66 — activity feed refresh 2d34d59; run 65 — shopping grid match% 6d7ac3f; run 64 — scan-confirm source link elevation 0f0db8b; run 63 — demo match% seed fix 324cadd; run 62 — scan-confirm source link always-visible cb28e28; run 61 — ms-suggest-img placeholder + og-wrap peek gradient fe6132f; run 60 — AI Stylist portrait hero 751fbb8.

## Ayalon lane — last run (2026-08-08, run 57)
- **Task**: DoD verification — added entries for SCAN-SOURCE-ELEVATION (mark run 64, 0f0db8b) and SHOP-MATCH-CONSISTENCY (mark run 65, 6d7ac3f); updated stale "272 pytests" summary → 277/278.
- **Done**: docs/DOD_AUDIT.md. Commit cbb7bb6. check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg UX — await founder call); PITCH_DECK PDF/Keynote conversion is human-only. Commerce plan all 9 items ✅, DoD audit current.
- **Prior runs**: run 56 — demo doc sync 0f424f9; run 55 — SEED-CLOSET + SEED-WALLET DoD entries + beat-7 pre-flight a2a9b91; run 54 — full commerce DoD re-verification + NEEDS_DECISION #9; run 53 — DEMO_SCRIPT sync cf4ea7b; run 52 — COMMERCE-XCUST + MATCH-MATRIX DoD 6ee8141; run 51 — BH-22/THUMBNAIL/ITEM-SHEET-CTA/ONBOARDING/COMMERCE-7-REGRESSION DoD; run 50 — DEMO_SCRIPT re-verification + 4 updates 3dfa560.

## Steve lane — last run (2026-08-09, run 40)
- **Task**: Prove pending→confirmed→wallet lifecycle end-to-end. Add `test_skimlinks_pending_to_confirmed_wallet_lifecycle`: inserts 35-day-old pending credit, verifies balance=0/pending_balance>0, calls confirm-pending?days=30, asserts balance reflects confirmed credit. Replaces misleading `test_skimlinks_confirm_pending_moves_old_credits` with correctly-named `test_skimlinks_confirm_pending_days_zero_rejected`. 280 → 281 tests. Commit a2051a7.
- **Done**: tests/test_app.py only. check-render green, py_compile green.
- **Next**: All commerce done, Supabase wired, 281 tests. Next: any new INBOX/DEFECTS; or advance demo via richer posts.json (135/200 products untagged).
- **Prior runs**: run 39 — complementarity matrix 9b203aa; run 38 — seed-wallet endpoint; run 37 — duplicate test fix; run 36 — Postgres compat; run 35 — test coverage 19 pytests; run 34 — /api/demo/seed-closet; run 33 — idx_credits_txn UNIQUE race fix.
- **Status**: Commerce fully shipped. 281 tests. 94% route coverage (68/72 routes OK, 4 ext-dep expected).

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
