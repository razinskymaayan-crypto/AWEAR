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

## Mark lane — last run (2026-08-03, run 52)
- **Task**: COMMERCE_PLAN Part C item 8 — Wallet UI: wire to real `/api/wallet` API, show pending vs confirmed split, fix "5%" copy to "40% of AWEAR's affiliate commission".
- **Done**: renderWallet() rewritten (app.js) — shows confirmed earnings (green) + pending banner (amber) separately; normalizeCredit() handles both old localStorage and new API format; seeds updated to `{item_name, amount_usd, status, created_at}` (v2); fires async fetch to `/api/wallet?user_id=tamar` and updates DOM if non-empty; "How it works" copy corrected. 8 new CSS classes in app.css. check-render PASS, node --check PASS, gabbana PASS (spacing fixed to 8pt grid). IC: dolce.
- **Next**: INBOX commerce remaining — Wallet UI founder decision on token peg (see NEEDS_DECISION.md / COMMERCE_PLAN decisions #3). Then: find-similar endpoint UI when steve ships backend.
- **Prior runs**: run 51 — diary-sheet + book-sheet interaction tests 0f871bf; run 50 — source-link UI prominence 28ce450; run 49 — 3-tier item status look-sheet 268a850; run 47 — fix match-ring % display 15f12d4; run 46 — fix genImage persist to closet 3c4d18d.

## Ayalon lane — last run (2026-08-03, run 46)
- **Task**: COMMERCE_PLAN.md SoT update — mark 3 founder decisions resolved in code; add Part C (remaining) to build order. Verify economics: SKIMLINKS_CREATOR_SHARE_PCT=0.40 matches plan "40% of commission"; token peg still open (credits in USD directly).
- **Done**: COMMERCE_PLAN.md updated (decisions section: 2 resolved, 1 still open; build order: A+B fully ✅, Part C added for find-similar + wallet UI). STATE.md updated. check-render PASS.
- **Context**: run 45 (2026-08-03) verified COMMERCE-3/4/5/6/7 in DOD_AUDIT.md (commit 7c977d4) — STATE.md was not updated that run.
- **Next**: DoD audit — verify steve's find-similar endpoint when it ships (COMMERCE-8 expected); check wallet UI token peg decision once surfaced.
- **Prior runs**: run 45 — COMMERCE-3/4/5/6/7 verified 7c977d4; run 44 — COMMERCE-1/2 verified caa298b; run 43 — RESILIENCE-2/3 + COMPAT-DB verified 8e0226e; run 42 — BH-20 verified 58caca7.

## Steve lane — last run (2026-08-03, run 33)
- **Task**: Fix double-crediting race: non-UNIQUE idx_credits_txn → partial UNIQUE index + INSERT OR IGNORE (rejection fix).
- **Done**: commit 6776d9a. DROP+recreate idx_credits_txn as UNIQUE (WHERE transaction_id != '') to prevent concurrent postbacks from both inserting the same txn. INSERT OR IGNORE + rowcount==0 dedup path handles race at DB layer. Syntax OK, check-render PASS.
- **Next**: INBOX ★★★★★ commerce item 2 — find-similar endpoint (given unavailable item, return lookalikes from catalog using _match_score).
- **Prior runs**: run 31 — /api/weather fallback dd0689d; run 30 — Skimlinks contract tests 91be81f; run 29 — agent_summary 500→503; run 28 — self-heal stale CI_FAILURES; run 27 — scan-health google_available; runs 20-26 — launch infra.
- **Status**: All Supabase epic items shipped (Render ✓, JWT auth ✓, _CompatDB Postgres ✓, Storage ✓). Test suite 225 tests, 93% route coverage (5 ext_dep).
- **Founder action needed**: Set DATABASE_URL on Render dashboard (postgresql://...) to activate Postgres; run notes/schema_postgres.sql in Supabase SQL editor once.

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
