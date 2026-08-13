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

## Mark lane — last run (2026-08-13, run 87)
- **Task**: feat(ui) — 3 Gabbana-identified WOW demo fixes. Commit b92cf50.
- **Done**: static/app.css + static/app.js. (1) Match band ring 92px→112px + number 24px/w700→32px/w900 — the % match hero is now unmissable. (2) Feed buy CTA ghost→filled accent + weight 800 — commerce intent unmistakable at a glance. (3) DM "Start a conversation" wired to open Tamar's thread (was a broken querySelector). Also: dm-new-cta min-height 44px (WCAG), buy-btn padding on 8pt grid. All DS-004 clean, check-render + check-interactions PASS. Gabbana re-gate: all 3 fixes ≥ 8/10.
- **Next**: DEFECTS.md if new items; check remaining MASTER_PLAN/INBOX items; next highest-value demo improvement.
- **Prior runs**: run 86 — DM tab fallback inbox c4fc7b3; run 85 — scan-confirm source-link callout b7588ba; run 84 — look-sheet editorial polish 4ee2c5f; run 83 — look-sheet match % chips c9a9b6d; run 82 — home DS-004/DS-008 + quick-actions 13→6 + outfit 4:5 66aad7b; run 81 — look grid edit mode da98dbd.
- **Prior runs**: run 85 — scan-confirm source-link callout b7588ba; run 84 — look-sheet editorial polish 4ee2c5f; run 83 — look-sheet match % chips c9a9b6d; run 82 — home DS-004/DS-008 + quick-actions 13→6 + outfit 4:5 66aad7b; run 81 — look grid edit mode da98dbd.

## Ayalon lane — last run (2026-08-13, run 70)
- **Task**: docs(dod): run-70 — sync DEMO_SCRIPT footer: items (41)-(48) + 320 pytests. Commit b8dc73e.
- **Done**: docs/DEMO_SCRIPT.md footer (ship log) updated with items (41)-(48) that run-69 verified inline but missed in the proof-table; test count updated 311→320; re-verified marker updated to run-70. check-render PASS.
- **Gap still pending**: FOR-YOU-POSTS-RANK (9ffb9b2) backend only — mark lane must wire ?sort_by=match&viewer_id= to For You tab fetch.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg — await founder call); PITCH_DECK PDF/Keynote conversion is human-only. Commerce plan all items ✅, docs current through 2026-08-13.
- **Prior runs**: run 69 — DoD 8 ships (mark 83-87 + steve 49-50) + DEMO_SCRIPT tips b7a1067; run 68 — POSTGRES-COUNT-FIX DOD gap; run 67 — DEMO_SCRIPT + PITCH_DECK 311 5b8a036; run 66 — DoD 7 ships 2eaff75; run 65 — DEMO_SCRIPT Appendix A 1e291d8.

## Steve lane — last run (2026-08-13, run 50)
- **Task**: feat(match) — color-aware wardrobe scoring for For You feed + product match. Commit de5989b.
- **Done**: app.py (_wardrobe_match_score gains closet_colors param; get_products/get_posts/product_wardrobe_match all updated to SELECT category+color and pass color families; same-color +7, neutral-product +5, neutral-in-closet +3 bonuses; empty closet still = 55 base). tests/test_app.py (3 new hermetic pytests: same-family bonus, neutral bonus, empty-closet invariant).
- **Status**: Commerce fully shipped. 318 tests total (314 + 3 new color tests + 1 data_integrity). 94% route coverage. For You feed personalized by closet match. Match % is now color-aware.
- **Next mark lane handoff**: wire `?sort_by=match&viewer_id=<viewer>` to the For You tab fetch in app.js so ranked feed reaches the UI.
- **Prior runs**: run 49 — feat(feed) personalized For You ranking 9ffb9b2; run 48 — fix(data) prod_ht_019 color mismatch a950a87; run 46 — Postgres COUNT crash fix 8528783; run 43 — For You sort_by=match 32b3369.

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
