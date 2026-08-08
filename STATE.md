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

## Mark lane — last run (2026-08-08, run 65)
- **Task**: Shopping grid match% — replaced raw tag-overlap formula with `calcCompatScore()` in `renderShopGrid()`. Commit 6d7ac3f.
- **Done**: static/app.js only. check-render green. node --check green.
- **Next**: Any new INBOX/DEFECTS item; token peg UX decision still NEEDS_DECISION #3 (founder-only). Remaining Gabbana P2: store thumbnail dark-ambient photo inconsistency (loremflickr pipeline — valentino/sam).
- **Prior runs**: run 64 — scan-confirm source link elevation 0f0db8b; run 63 — demo match% seed fix 324cadd; run 62 — scan-confirm source link always-visible cb28e28; run 61 — ms-suggest-img placeholder + og-wrap peek gradient fe6132f; run 60 — AI Stylist portrait hero 751fbb8; run 59 — profile stats truncation 2721e66; run 58 — purchase-modal drag-dismiss 69746b3; run 57 — item-sheet 3-tier CTA 13b0bb9; run 56 — look-item-detail drill-down 1322d82; run 55 — flat-lay hero + match chip 49307bd.

## Ayalon lane — last run (2026-08-07, run 54)
- **Task**: Commerce DoD verification + NEEDS_DECISION #9 (token peg) surfaced.
- **Done**: Verified 272 pytests confirmed, 0 open DEFECTS, all 8 COMMERCE_PLAN items ✅. Surfaced COMMERCE_PLAN decision #3 (token peg) into NEEDS_DECISION.md as #9 — was buried in COMMERCE_PLAN.md only. Updated STATE.md. check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg UX — await founder call); PITCH_DECK PDF/Keynote conversion is human-only.
- **Prior runs**: run 53 — DEMO_SCRIPT sync for runs 51-52 ships cf4ea7b; run 52 — COMMERCE-XCUST + MATCH-MATRIX DoD 6ee8141; run 51 — BH-22/THUMBNAIL/ITEM-SHEET-CTA/ONBOARDING/COMMERCE-7-REGRESSION DoD; run 50 — DEMO_SCRIPT re-verification + 4 updates 3dfa560; run 49 — BH-21 + STEVE-35 DoD 38cc0da; run 48 — PITCH_DECK + BUSINESS_PLAN stale data fixed; run 47 — COMMERCE-8/9 DoD 9b81cee; run 46 — COMMERCE_PLAN.md SoT update a5a1992; run 45 — COMMERCE-3/4/5/6/7 verified 7c977d4.

## Steve lane — last run (2026-08-08, run 38)
- **Task**: Add `POST /api/demo/seed-wallet` — idempotent demo creator-wallet seed (mirrors seed-closet pattern). Investor now sees compelling creator earnings ($21.35 confirmed + $10.40 pending) instead of $0 on the wallet screen.
- **Done**: app.py + tests/test_app.py. 3 new hermetic pytests pass. 275 → 278 tests. check-render green.
- **Next**: Any new INBOX/DEFECTS item; health-sweep showed 0 crashes/0 suspicious-4xx — backend clean. Supabase Auth next for launch.
- **Prior runs**: run 37 — duplicate test fix 37e1404; run 36 — Postgres compat 344ae17; run 35 — test coverage 19 pytests e00f95e; run 34 — /api/demo/seed-closet c77b72b; run 33 — idx_credits_txn UNIQUE race fix 6776d9a; run 31 — /api/weather fallback dd0689d.
- **Status**: Commerce fully shipped. 278 tests. 94% route coverage (67/71 routes OK, 4 ext-dep expected).

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
