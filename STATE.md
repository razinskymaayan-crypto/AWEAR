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

## Mark lane — last run (2026-08-11, run 82)
- **Task**: fix(home) — DS-004/DS-008 + quick-actions 13→6 + outfit card 4:5 ratio. Gabbana 8/10 PASS.
- **Done**: static/app.css + static/app.js. rgba(255,255,255,.06) border → var(--line,#2e2836); › typography → icon('chevronRight',15); 13 quick-actions trimmed to 6 (Outfit AI/Shopping/Abigail/Stylists/Analytics/Wallet); .ho-top fixed 164px → aspect-ratio:4/5. check-render green. Commit 66aad7b.
- **Next**: next unfinished MASTER_PLAN/INBOX item; DEFECTS.md if new items appear. OW-011: do not revisit home quick-actions or look-grid this run.
- **Prior runs**: run 81 — look grid edit mode da98dbd; run 80 — DS light-mode P1+P2 polish 350b0c4; run 79 — DS polish P1 fixes 58459c2; run 78 — closet portrait tiles + DS polish 1472c6f; run 77 — lc-del delete button + shop-pill icon size b18f05a; run 76 — lc-cap AI captions on look grid e136ead.

## Ayalon lane — last run (2026-08-11, run 65)
- **Task**: DEMO_SCRIPT — add Appendix A (Marketplace bonus beat): 90-second P2P resale loop showing circular economy (AI surfaces idle closet items → My Store → Community → 15% commission). Backs PITCH_DECK Slide 5 Phase-3 revenue claim with a live screen.
- **Done**: docs/DEMO_SCRIPT.md. check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg USD/token peg UX — await founder call); PITCH_DECK PDF/Keynote conversion is human-only. Commerce plan all items ✅, docs current through 2026-08-11.
- **Prior runs**: run 64 — DEMO_SCRIPT sync f7b928a; run 63 — DOD_AUDIT 6 entries mark-76→79 + steve catalog/backend c7e4d31; run 62 — DoD 7 entries mark-70→75 + steve-41/42 6007b9c; run 61 — PITCH_DECK + DEMO_SCRIPT sync 0032a50; run 60 — PITCH_DECK sync c12c121; run 59 — DEMO_SCRIPT sync 492183f.

## Steve lane — last run (2026-08-12, run 48)
- **Task**: fix(data) — prod_ht_019 color mismatch (declared "navy" but CDN image is ROYAL-BLUE) + OW-016 CDN color-consistency detector in data_integrity.py. Catches the 2026-08-06 rejection class automatically before every merge.
- **Done**: scripts/data_integrity.py (check_image_color_consistency + _CDN_COLOR_CANON), static/data/products.json + _products_hats_accessories.json (prod_ht_019 navy→royal blue), tests/test_app.py (2 new pytests fail-before/pass-after). Commit a950a87. data_integrity.py PASS (all 200 products clean). check-render PASS.
- **Next**: INBOX/DEFECTS first; remaining MASTER_PLAN/INBOX items.
- **Prior runs**: run 46 — Postgres COUNT crash fix 8528783; run 45 — posts enrichment 174→200 tags; run 44 — posts enrichment 79→174/200 168c90f; run 43 — For You sort_by=match 32b3369; run 42 — posts enrichment +18 tags.
- **Status**: Commerce fully shipped. 309 tests. 94% route coverage (68/72 routes OK, 4 ext-dep expected). Feed catalog: 200/200 products (100%). Search now matches on tags + search_query.

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
