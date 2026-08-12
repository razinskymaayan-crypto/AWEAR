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

## Mark lane — last run (2026-08-12, run 84)
- **Task**: feat(look-sheet) — editorial polish: 3/4 hero, 64px thumbnails, flat accent CTA. Gabbana 8.5/10 PASS.
- **Done**: static/app.css only. 9 targeted CSS fixes: sl-hero aspect-ratio 4/5→3/4 + 24px margin; match-chip box-shadow; sl-title 15px→18px; thumbnails 44px→64px; price color muted→fg + weight 800; sheet-buy/sheet-row-buy gradient→flat var(--accent,#e8526a); fallback fixes (--t-h1,--t-h3). Commit 4ee2c5f.
- **Next**: next unfinished MASTER_PLAN/INBOX item; DEFECTS.md if new items appear. OW-011: do not revisit look-sheet hero/thumbnails/CTA this run.
- **Prior runs**: run 83 — look-sheet per-item match % chips c9a9b6d; run 82 — home DS-004/DS-008 + quick-actions 13→6 + outfit 4:5 66aad7b; run 81 — look grid edit mode da98dbd; run 80 — DS light-mode P1+P2 350b0c4; run 79 — DS polish P1 58459c2; run 78 — closet portrait tiles 1472c6f.

## Ayalon lane — last run (2026-08-12, run 68)
- **Task**: DoD gap fill — add POSTGRES-COUNT-FIX entry to DOD_AUDIT.md (steve run 46, 15 Postgres crash sites, missing despite run-66 DoD sweep).
- **Done**: docs/DOD_AUDIT.md (POSTGRES-COUNT-FIX entry with line-level grep evidence at 15 app.py sites). check-render PASS.
- **Next**: NEEDS_DECISION #7 (Slide 3 moat edits — awaiting founder approval); NEEDS_DECISION #9 (token peg — await founder call); PITCH_DECK PDF/Keynote conversion is human-only. Commerce plan all items ✅, docs current through 2026-08-12.
- **Prior runs**: run 67 — DEMO_SCRIPT + PITCH_DECK test count 305→311 5b8a036; run 66 — DoD 7 ships mark-80→82 + steve-46→48 2eaff75; run 65 — DEMO_SCRIPT Appendix A (Marketplace bonus beat) 1e291d8; run 64 — DEMO_SCRIPT sync f7b928a; run 63 — DOD_AUDIT 6 entries mark-76→79 + steve catalog/backend c7e4d31.

## Steve lane — last run (2026-08-12, run 48)
- **Task**: fix(data) — prod_ht_019 color mismatch (declared "navy" but CDN image is ROYAL-BLUE) + OW-016 CDN color-consistency detector in data_integrity.py. Catches the 2026-08-06 rejection class automatically before every merge.
- **Done**: scripts/data_integrity.py (check_image_color_consistency + _CDN_COLOR_CANON), static/data/products.json + _products_hats_accessories.json (prod_ht_019 navy→royal blue), tests/test_app.py (2 new pytests fail-before/pass-after). Commit a950a87. data_integrity.py PASS (all 200 products clean). check-render PASS.
- **Next**: INBOX/DEFECTS first; remaining MASTER_PLAN/INBOX items.
- **Prior runs**: run 46 — Postgres COUNT crash fix 8528783; run 45 — posts enrichment 174→200 tags; run 44 — posts enrichment 79→174/200 168c90f; run 43 — For You sort_by=match 32b3369; run 42 — posts enrichment +18 tags.
- **Status**: Commerce fully shipped. 311 tests (test_app.py) + 1 (test_data_integrity.py) = 312 total. 94% route coverage (68/72 routes OK, 4 ext-dep expected). Feed catalog: 200/200 products (100%). Search now matches on tags + search_query.

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
