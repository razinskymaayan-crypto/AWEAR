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

## Mark lane — last run (2026-08-18, run 97)
- **Task**: feat(home): wire Agent Team quick-action + refresh live-activity timeline. Commit ec18610.
- **Done**: Added "Agent Team" hq-btn to home screen quick-actions row — Demo Beat 8 ("Tap: Home → Agent Team") now works without needing a hidden showView call. Also updated AGENT_ACTIVITY with Aug 18 earn-amounts entry. Gabbana 9/10. check-render PASS.
- **Next**: DEFECTS.md if new items; s21-s27 still have img:null (gradient-only cards) — blocked on new photo assets (all 23 local photos assigned).
- **Prior runs**: run 96 — earn amounts 4x 706f84e; run 95 — earn-line dollar amount d7528be; run 94 — source_url to s21-s27 2d8a70c; run 93 — source_url to 7 real-photo posts 4c7504a; run 92 — AGENT_ACTIVITY update c1f245b.

## Ayalon lane — last run (2026-08-18, run 78)
- **Task**: docs(dod): run-78 — DEMO_SCRIPT updated: 3 ships (simulate-purchase, agent-team, earn-4x) + beat-7 live-purchase tip. Commit f182908.
- **Done**: docs/DEMO_SCRIPT.md — added beat-7 DEMO-SIMULATE-PURCHASE tip (caf9204): two strategies (seeded-balance vs live-trigger); logged HOME-AGENT-TEAM (ec18610) beat-8 hardwired; FEED-EARN-4X (706f84e) logged; test count 326→328. Check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg — await founder call). DoD audit current through 2026-08-18 run-78 (328 tests, all ships verified).
- **Prior runs**: run 77 — FEED-EARN-4X verified 75ccdee; run 76 — DOD_AUDIT 3 ships d7ac444; run 75 — DOD_AUDIT 7 ships+326 tests c248977; run 74 — DEMO_SCRIPT 2 ships+326 tests 963fe6b; run 73 — DEMO_SCRIPT re-verified 6 ships c26b8ab.

## Steve lane — last run (2026-08-17, run 53)
- **Task**: feat(demo): POST /api/demo/simulate-purchase — investor demo tool for creator earnings loop.
- **Done**: app.py — new endpoint `demo_simulate_purchase` (line 6126): resolves a post → poster_id → inserts pending credit (8% affiliate commission × 40% creator share). 2 hermetic pytests in tests/test_app.py (basic shape + wallet credit appears). Lets founder trigger the full earn-tokens WOW moment live in the pitch without real Skimlinks credentials. 328 tests total.
- **Status**: Commerce fully shipped. 328 tests. 95% route coverage. All demo beats covered. Full creator-earnings loop demonstrable without external deps.
- **Next**: DEFECTS.md if new items; remaining INBOX improvements in lane.
- **Prior runs**: run 52 — fix(stylist) BrokenPipeError 27c19af; run 51 — feat(stylist) distinct fallback tips d790d8e; run 50 — COLOR-AWARE-MATCH de5989b; run 49 — feat(feed) personalized For You ranking 9ffb9b2; run 48 — fix(data) prod_ht_019 color mismatch a950a87.

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
