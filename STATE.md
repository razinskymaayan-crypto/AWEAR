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

## Mark lane — last run (2026-07-27, run 27)
- **Task**: Fix nav background to clear 25 scanner false-positive contrast defects. commit 0c806be.
- **Done**: Changed `nav` background from `color-mix(in srgb, var(--bg) 94%, transparent)` → `var(--bg, #0e0c0f)`. Root cause: `ux-audit.mjs lum()` divides `color(srgb…)` format values by 255 → both near-black text AND the misread bg compute as near-zero luminance → false 1.11:1. Fix removes `color(srgb…)` format from computed nav bg. Visual delta: imperceptible (6% transparency on #0e0c0f). check-render ✓.
- **Scanner bug filed**: added to steve's assignments — `ux-audit.mjs:lum()` needs to handle `color(srgb …)` format.
- **Next**: Continue INBOX ★★★★★ UX sweep — pick another screen pair to gabbana-audit, or pick the scan-closet HITL confirm screen UI (notes/scan-closet-hitl-backend.md HANDOFF).
- **Prior runs**: run 26 — Gabbana UX sweep Feed+Profile/Closet (a865b07); run 25 — DS-004 --success fallbacks sweep (0651046); run 24 — shopping text truncation + badge polish (002c75f); run 23 — diary-overlay backdrop + scan-confirm drag-dismiss (8a73939).

## Steve lane — last run (2026-07-27, run 22)
- **Task**: Self-heal — mark [UNRESOLVED] REPEAT-FAILURE: steve(exposed-bug) as [FIXED] in CI_FAILURES.md.
- **Done**: Confirmed code fix already committed on branch (app.py diff vs origin/main shows try/except + 503 for agent_schedule, agent_meeting, agent_summary + agent_services in scan_health). 6 regression tests are in tests/test_app.py. Updated CI_FAILURES.md: collapsed 8 [OPEN] + 1 [UNRESOLVED] entries into single [FIXED] entry.
- **Prior run (run 21)**: Self-heal verify attempt. Code fix already on branch from run 20.
- **Prior run (run 20)**: Resilience audit — harden agent Google-service endpoints. commit f0cf6a1. Suite: 203/203.
- **Resilience audit status**: COMPLETE. All Claude/OpenAI/weather/Pexels/Supabase/Google paths verified.
- **All INBOX launch infra steps done**: Render (60f159e), Supabase Auth (9667fd0), Postgres _CompatDB (8c8b41), Storage (565f18d).
- **Next**: INBOX item 3 — data-integrity orphan check (id-references between static/data/*.json and app.py). OR Supabase epic next step.
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
- Image-gen (`/api/generate-garment`, OpenAI, demo-first) built — LIVE call fails (needs OpenAI org-verify + billing); decided match-first + cache for scale; free alt = bg-removal (route B), deferred.

**Track 2 — HARDEN THE AUTONOMY ENGINE (founder: perfect by 2026-07-20 eve, then re-test):**
Full-pipeline audit done. Fixes shipped by MAIN SESSION (lanes can't touch `.github/`): P0 base-anchor OW-013 (fc6b321 — THE 'nothing lands' bug), ownership-map alignment (05cfba4), P1 rejection-feedback + P2 INBOX/shared + P4 self-heal routing (92b353c). Cadence 6h→2h. Lanes redirected to infra-hardening ONLY (no features) until the re-test.
- REMAINING: verify the next cycle lands work (gate-ledger); phantom-lane cleanup; GATE 3 determinism; evaluate GitHub-native CODEOWNERS + Merge Queue (strategic simplification).

## Open questions
See NEEDS_DECISION.md — defaults applied, none blocking. Live founder decisions: OpenAI billing (for live image-gen) · which Apple acct for the real launch (Segev's vs own).

## Test commands (preserve across compaction)
- Server: `venv312/bin/uvicorn app:app --reload --port 8000`
- Render check: `npm run check-render`
- Guards: `bash scripts/guard_checks.sh`
- Tests/lint: pytest + ruff arrive in Phase 7
