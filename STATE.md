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

## Mark lane — last run (2026-08-11, run 79)
- **Task**: fix(marketplace) — DS polish: KPI readability + touch targets + badge token (A4a marketplace area, Gabbana P1 fixes).
- **Done**: static/app.css only. ms-statstrip gap 4px→8px; ms-sx border-radius --r-md→--r-sm; ms-sx-val 13px→15px (profit 17px); mp-qs-chip touch target 36px→44px; mp-item-badge border-radius tokenized; ms-act-btn:active scale(.96); ms-suggest-sell light-mode pill fix. check-render green, check-interactions green. Commit 58459c2.
- **Next**: P2 polish (filter active pill light mode flat style, P2-C mp-item-info padding); or lc-shop-pill RTL (P2 backlog); or next unfinished MASTER_PLAN item.
- **Prior runs**: run 78 — closet portrait tiles + DS polish 1472c6f; run 77 — lc-del delete button + shop-pill icon size b18f05a; run 76 — lc-cap AI captions on look grid e136ead; run 75 — lc-shop-pill frosted bag icon 825a668; run 74 — look-sheet 4:3→4:5 + status badge contrast b076404; run 73 — Commerce WOW polish 4d26ab7.

## Ayalon lane — last run (2026-08-10, run 62)
- **Task**: DOD_AUDIT verification — 7 new verified entries for mark-70→75 + steve-41/42 ships (STORE-TAB-UX, DS-016-IMAGES, COMMERCE-UI-POLISH, LOOK-SHEET-COLLAGE-ASPECT, LOOK-CARD-SHOP-PILL, FEED-CONTENT-ENRICHMENT, TEST-COVERAGE-STORIES-DM). Closes OW-002 gap; 302 test defs / 303 effective confirmed.
- **Done**: docs/DOD_AUDIT.md. check-render PASS. Commit 6007b9c.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg UX — await founder call); PITCH_DECK PDF/Keynote conversion is human-only. Commerce plan all 9 items ✅, all docs current through 2026-08-10.
- **Prior runs**: run 61 — PITCH_DECK + DEMO_SCRIPT sync 0032a50; run 60 — PITCH_DECK 2026-08-09 sync c12c121; run 59 — DEMO_SCRIPT sync 5 tips 492183f; run 58 — DoD verification 7 new entries + 284 test count 06b370c; run 57 — SCAN-SOURCE-ELEVATION + SHOP-MATCH-CONSISTENCY DoD cbb7bb6; run 56 — demo doc sync 0f424f9.

## Steve lane — last run (2026-08-11, run 44)
- **Task**: feat(data) — posts enrichment: 95 more products tagged, 79→174/200 (87% catalog coverage).
- **Done**: static/data/posts.json only (sam IC). Semantic matching by post caption vibe (vintage, capsule, streetwear, cottagecore, etc.), all 6 categories covered, max 6 items_tagged/post enforced. data_integrity.py PASS. check-render PASS. Commit 168c90f.
- **Next**: INBOX/DEFECTS first; remaining 26 niche/seasonal products (ski jackets, parkas) or backend test coverage; Supabase/Postgres migration (DECISIONS #17).
- **Prior runs**: run 43 — For You sort_by=match 32b3369; run 42 — posts enrichment +18 tags; run 41 — posts enrichment +5 fc5edea; run 40 — skimlinks lifecycle test a2051a7; run 39 — complementarity matrix 9b203aa; run 38 — seed-wallet endpoint; run 37 — duplicate test fix; run 36 — Postgres compat; run 35 — test coverage 19 pytests.
- **Status**: Commerce fully shipped. 305 tests. 94% route coverage (68/72 routes OK, 4 ext-dep expected). Feed catalog: 174/200 products exposed.

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
