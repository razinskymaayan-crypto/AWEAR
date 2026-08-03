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

## Mark lane — last run (2026-08-03, run 50)
- **Task**: Commerce — source-link UI prominence in scan-confirm (INBOX ★★★★★ 2026-08-02 item #3).
- **Done**: commit 28ce450. Elevated plain "Source link (optional)" input to a labeled, badged section with real-time URL validation in the scan-confirm edit form. Label with link icon + "earns tokens" badge, accent-tinted border, three validation states (valid=green/warn=amber/empty=accent-tinted), hint "Turns item buyable — you earn tokens when others shop it", aria-describedby wired. Gabbana 8.5/10 PASS. valentino craft.
- **Next**: INBOX commerce item (steve/oren backend: Skimlinks conversion endpoint OR find-similar endpoint) — mark lane has completed all 3 UI commerce items from the ★★★★★ 2026-08-02 INBOX directive. Next is UX-QA P1: bottom-sheet drag-dismiss pattern on remaining sheets (mp-fsheet, ms-insight-sheet, comments-sheet, diary-sheet, book-sheet, modal-overlay).
- **Prior runs**: run 49 — 3-tier item status look-sheet 268a850; run 47 — fix match-ring % display 15f12d4; run 46 — fix genImage persist to closet 3c4d18d; run 45 — extend check-interactions.mjs 3546b72; run 44 — DS-009/DS-004 icon container cleanup bd271d3.

## Ayalon lane — last run (2026-08-01, run 44)
- **Task**: DoD audit — verify 2 new commerce commits (COMMERCE-1 Skimlinks affiliate, COMMERCE-2 Buy EXACT product).
- **Done**: Grep-verified both commits: `a6e799f` (SKIMLINKS_ID + affiliate_url() + CREATOR_CREDIT_PCT + COMMERCE_PLAN.md), `f3d9a4a` (buyLinkFor/skimWrap/openBuyLink/handleCheckout/handleLookCheckout + source_url threading). Updated DOD_AUDIT.md (2 new rows + header + progress note). commit caa298b. check-render PASS.
- **Next**: DoD audit — continue verifying newly completed work as commerce/mark/steve lanes ship.
- **Prior runs**: run 43 — RESILIENCE-2/3 + COMPAT-DB verified 8e0226e; run 42 — BH-20 closet/profile UX polish verified 58caca7.

## Steve lane — last run (2026-08-03, run 32)
- **Task**: INBOX ★★★★★ commerce item — Skimlinks conversion postback endpoint (creator wallet pending tokens).
- **Done**: commit d184f54. POST /api/skimlinks/postback: ingest affiliate postbacks, parse xcust→poster_id:post_id, credit poster wallet with pending tokens (40% × commission), dedup on transaction_id. POST /api/skimlinks/confirm-pending: promote pending→confirmed after return window (days param, default 30). credits table migration: added status (pending/confirmed, default=confirmed) + transaction_id columns. Wallet: exposes pending_balance + per-credit status field. 8 new pytests, 235/235 green. sam IC.
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
