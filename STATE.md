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

## Steve lane — last run (2026-07-18)
- **Task**: generate_garment_image pipeline (INBOX 2026-07-18 founder task, part B of closet AI core)
- **Commit**: a049e14 on auto/steve
- **Done**: `_generate_garment_image_sync` + `POST /api/generate-garment` + `_last_gen` scan-health + 5 pytests + openai>=2.41
- **Remaining**: UI half (mark lane) — confirm screen shows generated image, "Regenerate" button
- **CI_FAILURES note**: combined patch (BASE-anchor + GATE 3 stale-ownership fix) still NOT applied on main. Escalation stands in NEEDS_YOU.md. Do NOT re-analyze.

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

## ⏸️ PAUSED BY FOUNDER (2026-07-05)
Carmel instructed: stop, push everything to GitHub, wait. **Resume only when Carmel or her partner says to continue.**
Everything through Phase 8 is committed and pushed; P4 reviews done and findings fixed for all completed phases.

## What's next (when resumed)
1. **Phase 7 — verification harness**: pytest suite for app.py critical paths (<30s), ruff config, `scripts/verify.sh` (tests+lint+guards+render; referenced by CLAUDE.md — still a sanctioned dangling ref), `evals/` for the 3 gate agents (gabbana/steve-review/jeff-merge; mine ci-debug/jeff-rejections + knowledge incidents for scenarios), `/run-evals` skill, `/review` fresh-context diff skill, wire into jeff-merge.yml.
2. **Phase 9 — code quality + hygiene** (parallel worktree subagents): conservative app.py module extraction, section markers in index.html (NO modularization), scripts/ dedupe + headers, `git rm --cached data/awear.db` (NEEDS_DECISION #2 default), delete 23 stale merged feat/* branches, worktree prune, archive .claude/agents/logs/, fix schema.sql "PostgreSQL" comment, delete whoami.yml.
3. **Phase 10 — autonomy dry run**: M-tier task (candidate: comments persistence to SQLite — `_comments_store` in-memory dict, BE-005 violation), executed with the new machinery only; then crash-simulation resume test from this file alone.
4. **Final deliverable**: AUDIT_REPORT before/after + template-extraction guide; present NEEDS_DECISION.md to founders.

## Open questions
See NEEDS_DECISION.md — 5 items, defaults applied, none blocking.

## Open questions
See NEEDS_DECISION.md — 5 items, all with best-guess defaults applied; none blocking.

## Test commands (preserve across compaction)
- Server: `venv312/bin/uvicorn app:app --reload --port 8000`
- Render check: `npm run check-render`
- Guards: `bash scripts/guard_checks.sh`
- Tests/lint: pytest + ruff arrive in Phase 7
