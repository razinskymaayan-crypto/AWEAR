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

## Mark lane — last run (2026-08-07, run 61)
- **Task**: Gabbana P1 open items — store product image fallbacks + check-in strip peek gradient.
- **Done**: (1) `.ms-suggest-img` given `background: var(--surface,#F3F1EC)` + flex centering so product images have a consistent placeholder during load and proper fallback icon positioning. (2) `.og-wrap::after` sticky gradient (transparent → #FAF9F7) added — 24px height, margin-top -24px — creates a subtle scroll-peek cue below the Today's Look hero. (3) `.ms-suggest-sell` upgraded to `min-height: 44px; display: inline-flex; align-items: center;` — touch target now meets 44px rule. Gabbana 8.5/10 PASS on both screens. check-render green.
- **Next**: Any new INBOX/DEFECTS item; token peg UX decision still NEEDS_DECISION #3 (founder-only). Remaining Gabbana P2: store thumbnail dark-ambient photo inconsistency (loremflickr pipeline, needs backend image fetch improvement — mark for valentino/sam).
- **Prior runs**: run 60 — AI Stylist portrait hero fix 751fbb8; run 59 — profile stats truncation fix 2721e66; run 58 — purchase-modal drag-dismiss 69746b3; run 57 — item-sheet 3-tier CTA 13b0bb9; run 56 — look-item-detail drill-down 1322d82; run 55 — flat-lay hero + match chip 49307bd; run 54 — match% pills dde3cdf; run 53 — Find Similar wired fd686d0; run 52 — Wallet UI 41c83e3.

## Ayalon lane — last run (2026-08-05, run 50)
- **Task**: DEMO_SCRIPT.md re-verification + 4 targeted updates. Commit 3dfa560.
- **Done**: (1) Fixed stale "pipeline gap" note in beat 2 — closet image gap was closed 2026-08-02 (commit 3c4d18d); presenter no longer instructed to apologize. (2) Beat 6 closet image note updated to confident framing. (3) Beat 5 new tip: BH-21 item thumbnail drill-down bonus demo path. (4) Pre-flight: added `POST /api/demo/seed-closet` fast-seed shortcut. (5) Footer status updated to 2026-08-05 re-verified. check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — 4 changes, awaiting founder approval); token peg UX decision (#3 in COMMERCE_PLAN); PITCH_DECK PDF/Keynote conversion is human-only step.
- **Prior runs**: run 49 — BH-21 + STEVE-35 DoD 38cc0da; run 48 — PITCH_DECK + BUSINESS_PLAN stale data fixed 3c4d18d; run 47 — COMMERCE-8/9 DoD verified 9b81cee; run 46 — COMMERCE_PLAN.md SoT update a5a1992; run 45 — COMMERCE-3/4/5/6/7 verified 7c977d4.

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
