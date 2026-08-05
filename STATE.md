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

## Mark lane — last run (2026-08-05, run 56)
- **Task**: Look-sheet item thumbnails now tap to drill into item sheet — match ring + stylist picks + buy options.
- **Done**: `.sheet-look-emoji` divs got `data-action="look-item-detail"` + `role="button" tabindex="0"` + `sheet-look-emoji--tap` class. Event handler on `sheetBody` (click + keydown) calls `openSheetItem()` on the tapped item. CSS: `cursor:pointer`, `scale(0.93)/opacity:0.84` active feedback, `:focus-visible` accent ring. DS-009 fixed: removed `font-size` from image container, set `width:44px; height:44px` (44px touch target). Gabbana 9/10 PASS. Commit 1322d82.
- **Next**: Any new INBOX item; token peg UX decision is still NEEDS_DECISION #3 (founder-only). object-fit:contain→cover on `.sheet-look-emoji img` is a P2 visual note for next run.
- **Prior runs**: run 55 — flat-lay hero + match chip 49307bd; run 54 — match% pills dde3cdf; run 53 — Find Similar wired fd686d0; run 52 — Wallet UI 41c83e3; run 50 — source-link UI 28ce450; run 49 — 3-tier item status 268a850.

## Ayalon lane — last run (2026-08-04, run 48)
- **Task**: Fix investor-critical stale data in PITCH_DECK.md + BUSINESS_PLAN.md — creator credits "5%" → "~40% מעמלת AWEAR", garment image pipeline status, Skimlinks live status.
- **Done**: docs/PITCH_DECK.md: (1) creator credits corrected 5%→~40% in Slide 5 + Slide 8 demo step; (2) Phase 1 updated to note Skimlinks live (publisher ID `307075X1795350`); (3) garment image note updated ("שמירה לארון = שלב הבא" removed; commit 3c4d18d already closed it); (4) status update entry added 2026-08-04. docs/BUSINESS_PLAN.md: affiliate_url note updated from "when we sign up" to "already live". check-render PASS.
- **Context**: Run 47 (2026-08-03) verified COMMERCE-8/9 in DOD_AUDIT.md (commit 9b81cee) — STATE.md was not updated that run.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — 4 changes, awaiting founder approval); token peg UX decision (#3 in COMMERCE_PLAN); PITCH_DECK PDF/Keynote conversion is human-only step.
- **Prior runs**: run 47 — COMMERCE-8/9 DoD verified + COMMERCE_PLAN Part C closed 9b81cee; run 46 — COMMERCE_PLAN.md SoT update a5a1992; run 45 — COMMERCE-3/4/5/6/7 verified 7c977d4; run 44 — COMMERCE-1/2 verified caa298b.

## Steve lane — last run (2026-08-05, run 35)
- **Task**: Test coverage — 19 hermetic pytests for 5 untested endpoint groups.
- **Done**: commit e00f95e. Added tests for POST /like (toggle + 404), POST /save (toggle + 404), GET /users/{id}/saves (list + empty), GET /users/{id}/follow-status (false/true/cycle), GET /notifications/{id} (shape, seeding, unread_only filter), POST /notifications/{id}/read-all (shape + SQLite persistence). 265 total tests (was ~246).
- **Next**: Any new INBOX item; remaining test gap = endpoints tested error-path only (posts/{id} GET, profiles/{id} GET, stories DELETE, bookmarks DELETE) — P2 polish.
- **Prior runs**: run 34 — /api/demo/seed-closet c77b72b; run 33 — idx_credits_txn UNIQUE race fix 6776d9a; run 31 — /api/weather fallback dd0689d; run 30 — Skimlinks contract tests 91be81f.
- **Status**: Commerce fully shipped. 265 tests. 94% route coverage (67/71 routes exercised per defect_scan).

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
