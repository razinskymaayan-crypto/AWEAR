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

## Mark lane — last run (2026-08-10, run 75)
- **Task**: feat(profile) — add frosted shopping-bag pill indicator to shoppable look cards in Looks grid.
- **Done**: static/app.css + static/app.js. lc-shop-pill frosted overlay (rgba(0,0,0,.72) + var(--on-media,#ffffff)), bag icon top-right on cards with look_total_usd. check-render green, node --check green. Commit 825a668.
- **Next**: NEEDS_DECISION #3 (token peg) founder-only; continue A4a MASTER_PLAN Looks tab polish.
- **Prior runs**: run 74 — look-sheet 4:3→4:5 + status badge contrast b076404; run 73 — Commerce WOW polish 4d26ab7; run 72 — DS-004 --muted fallbacks 4b746f3; run 71 — DS-016 thumbnail fix ca1294b; run 70 — store tab UX + --warning WCAG fix 0f77b14; run 69 — profile look-tap 3-tier buy sheet a554415; run 68 — DS-004 light-theme scope 843722d.

## Ayalon lane — last run (2026-08-10, run 62)
- **Task**: DOD_AUDIT verification — 7 new verified entries for mark-70→75 + steve-41/42 ships (STORE-TAB-UX, DS-016-IMAGES, COMMERCE-UI-POLISH, LOOK-SHEET-COLLAGE-ASPECT, LOOK-CARD-SHOP-PILL, FEED-CONTENT-ENRICHMENT, TEST-COVERAGE-STORIES-DM). Closes OW-002 gap; 302 test defs / 303 effective confirmed.
- **Done**: docs/DOD_AUDIT.md. check-render PASS. Commit 6007b9c.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg UX — await founder call); PITCH_DECK PDF/Keynote conversion is human-only. Commerce plan all 9 items ✅, all docs current through 2026-08-10.
- **Prior runs**: run 61 — PITCH_DECK + DEMO_SCRIPT sync 0032a50; run 60 — PITCH_DECK 2026-08-09 sync c12c121; run 59 — DEMO_SCRIPT sync 5 tips 492183f; run 58 — DoD verification 7 new entries + 284 test count 06b370c; run 57 — SCAN-SOURCE-ELEVATION + SHOP-MATCH-CONSISTENCY DoD cbb7bb6; run 56 — demo doc sync 0f424f9.

## Steve lane — last run (2026-08-10, run 42)
- **Task**: feat(data) — enrich posts.json: 18 product tags added across 14 posts (11 new unique products surfaced). Catalog visibility 132→121 untagged (79/200 products now in feed). Commit TBD.
- **Done**: static/data/posts.json only (oren IC). data_integrity.py PASS + check-render PASS.
- **Next**: INBOX/DEFECTS first; continue posts enrichment (121/200 still untagged) or backend test coverage.
- **Prior runs**: run 41 — posts enrichment +5 fc5edea; run 40 — skimlinks lifecycle test a2051a7; run 39 — complementarity matrix 9b203aa; run 38 — seed-wallet endpoint; run 37 — duplicate test fix; run 36 — Postgres compat; run 35 — test coverage 19 pytests; run 34 — /api/demo/seed-closet; run 33 — idx_credits_txn UNIQUE race fix.
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
