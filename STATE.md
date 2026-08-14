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

## Mark lane — last run (2026-08-14, run 91)
- **Task**: fix(light-mode): 5 polish fixes — home greeting name pop + wallet AA/visual. Commit 3b58a1e.
- **Done**: static/app.css only. End-of-file @media light-mode block (after main rules to win cascade). 5 fixes: (1) home greeting em gradient invisible in light mode → brand red --hl; (2) wallet pending amount amber fails AA → near-black text; (3) wallet hero blob grey (dark-brown at 14%) → rose tint; (4) wallet pending banner warm tan clashes with rose blob → neutral surface; (5) wallet Withdraw button grey-on-grey → editorial black. Gabbana: Home 8/10 PASS, Wallet 9/10 PASS.
- **Next**: DEFECTS.md if new items; check remaining MASTER_PLAN/INBOX items; next highest-value demo improvement.
- **Prior runs**: run 90 — look-sheet editorial polish af93d52; run 89 — wire product_url+search_query into look-sheet items 45edbdc; run 88 — For You server-ranked feed f8d44f7; run 87 — WOW-3-FIXES b92cf50; run 86 — DM tab fallback inbox c4fc7b3; run 85 — scan-confirm source-link callout b7588ba.

## Ayalon lane — last run (2026-08-14, run 73)
- **Task**: docs(demo): run-73 — DEMO_SCRIPT re-verified 2026-08-14; 6 new ships + unlock FOR-YOU talking point. Commit c26b8ab.
- **Done**: docs/DEMO_SCRIPT.md — (1) FOR-YOU-POSTS-RANK ⬜→✅ in beat-4: mark run-88 (f8d44f7) wired UI; talking point "entire For You feed ordered by her style" unblocked; (2) STYLIST-DISTINCT-TIPS tip (d790d8e) added to beat-3; (3) OUTFIT-ANCHOR-ITEM tip (ef26541) added to beat-3 extension; (4) LOOK-SHEET-PRODUCT-URLS tip (45edbdc) added to beat-5; (5) LOOK-SHEET-EDITORIAL-POLISH tip (af93d52) added to beat-5; (6) LIGHT-MODE-POLISH tip (3b58a1e+e51c915) added to pre-flight; footer items (49)-(54) + test count 320→325. check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg — await founder call); PITCH_DECK PDF/Keynote is human-only. DEMO_SCRIPT now current through 2026-08-14 run-73 (325 tests, 54 ships logged).
- **Prior runs**: run 72 — PITCH_DECK 2026-08-14 6 ships+325 tests dc73a3b; run 71 — PITCH_DECK 2026-08-13+320 tests ecfbb44; run 70 — DEMO_SCRIPT footer (41)-(48) b8dc73e; run 69 — DoD 8 ships b7a1067; run 67 — DEMO_SCRIPT+PITCH_DECK 311 5b8a036.

## Steve lane — last run (2026-08-14, run 51)
- **Task**: feat(stylist): distinct fallback outfit tips per look + anchor-item-aware first tip. Commit d790d8e.
- **Done**: app.py `_fallback_outfits` — replaced single `tip` var with `base_tips` tuple (3 distinct tips per occasion × 6 occasion types). Anchor item name injected into tips[0] ("Built around the {item} — ..."). tests/test_app.py (2 hermetic pytests: fail-before proven for identical tips + anchor name in tip[0]). 325 total tests.
- **Status**: Commerce fully shipped. 325 tests. 95% route coverage. All demo beats covered. Stylist fallback now shows 3 distinct looks with genuine styling advice.
- **Next**: DEFECTS.md if new items; remaining INBOX improvements in lane.
- **Prior runs**: run 50 — COLOR-AWARE-MATCH de5989b; run 49 — feat(feed) personalized For You ranking 9ffb9b2; run 48 — fix(data) prod_ht_019 color mismatch a950a87; run 43 — For You sort_by=match 32b3369.

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
