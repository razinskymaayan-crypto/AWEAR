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

## Mark lane — last run (2026-08-02, run 47)
- **Task**: Fix match-ring "%" display — was floating 27px above the number due to align-self:flex-start+margin-top:6px on .match-band-pct; changed to inline-centered with color:inherit so "90%" reads as one unified green unit.
- **Done**: commit 15f12d4. 2-line CSS change in static/app.css. check-render PASS, Gabbana 8.5/10 PASS.
- **Next**: Continue INBOX ★★★★★ UX quality items — further WOW flow polish. Note: check-interactions.mjs doesn't test diary/book sheets yet — request steve lane to extend scripts/check-interactions.mjs.
- **Prior runs**: run 46 — fix genImage persist to closet 3c4d18d; run 45 — extend check-interactions.mjs to 7 overlays 3546b72; run 44 — DS-009/DS-004 icon container cleanup bd271d3; run 43 — text truncation + journal safe-area 8c05be3.

## Ayalon lane — last run (2026-08-01, run 44)
- **Task**: DoD audit — verify 2 new commerce commits (COMMERCE-1 Skimlinks affiliate, COMMERCE-2 Buy EXACT product).
- **Done**: Grep-verified both commits: `a6e799f` (SKIMLINKS_ID + affiliate_url() + CREATOR_CREDIT_PCT + COMMERCE_PLAN.md), `f3d9a4a` (buyLinkFor/skimWrap/openBuyLink/handleCheckout/handleLookCheckout + source_url threading). Updated DOD_AUDIT.md (2 new rows + header + progress note). commit caa298b. check-render PASS.
- **Next**: DoD audit — continue verifying newly completed work as commerce/mark/steve lanes ship.
- **Prior runs**: run 43 — RESILIENCE-2/3 + COMPAT-DB verified 8e0226e; run 42 — BH-20 closet/profile UX polish verified 58caca7.

## Steve lane — last run (2026-08-02, run 31)
- **Task**: INBOX resilience item — /api/weather raised HTTP 502 on open-meteo failure; fixed to return stale cache or demo fallback instead.
- **Done**: commit dd0689d. Added _WEATHER_DEMO constant + _last_weather diagnostic dict; updated /api/weather except block (stale cache → demo); exposed in /api/scan-health. Updated test_weather_urlerror_returns_502 → test_weather_urlerror_returns_demo_fallback; added test_weather_urlerror_with_stale_cache_returns_stale. check-render PASS.
- **Next**: INBOX resilience item 3 (data-integrity cross-ref app.py↔json) or Supabase epic.
- **Prior runs**: run 30 — Skimlinks contract tests 91be81f; run 29 — agent_summary 500→503; run 28 — self-heal stale CI_FAILURES; run 27 — scan-health google_available; runs 20-26 — launch infra.
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
