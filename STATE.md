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

## Mark lane — last run (2026-07-30, run 35)
- **Task**: INBOX item 1 — text truncation sweep (overflow/truncation in outfit/wishlist/home cards).
- **Done**: 3 CSS fixes in app.css: `.og-outfit-name` min-width+ellipsis (AI outfit names), `.wl-item-name` ellipsis in wishlist row, `.ho-name` -webkit-line-clamp:2 in 132px home outfit cards. check-render PASS, commit 5728519.
- **Next**: INBOX item 2 — stuck overlays sweep (check-interactions.mjs + close-path verification). Or item 3 — low-contrast buttons audit.
- **Prior runs**: run 34 — DS-004 sf-sub/sf-card-brand fallbacks (a004b35); run 33 — Dead buttons (eb7dc94); run 32 — Profile UX sweep (be16bac).

## Steve lane — last run (2026-07-29, run 25)
- **Task**: INBOX item 1 — test coverage sweep for list endpoints.
- **Done**: Added 6 hermetic pytests (contract + pagination + filter) for /api/categories, /api/posts (list), /api/profiles (list) — previously only covered by a 2-line smoke test. IC: sam. Commit: 17e7f4b.
- **All INBOX launch infra steps done**: Render (60f159e), Supabase Auth (9667fd0), Postgres _CompatDB (8c8b41), Storage (565f18d).
- **Next**: INBOX item 2 — resilience sweep: every external-dep path must have try→demo/fallback and scan-health coverage. Start with weather (open-meteo) tracking in scan-health.
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
