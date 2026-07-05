# STATE — live task state (resume point for any fresh session)

> Updated continuously during work; at minimum at the end of every phase/task.
> A fresh session should be able to resume from THIS FILE ALONE.
> Discipline defined in `.claude/rules/memory.md` (Phase 5).

## Current effort: Foundation Audit & Upgrade (10-phase overhaul)
- **Plan**: `/Users/tamargrosz/.claude/plans/greedy-inventing-allen.md` (approved 2026-07-05)
- **Tracking**: AUDIT_REPORT.md (findings + effort log), NEEDS_DECISION.md (human decisions), TEMPLATE_BOUNDARY.md (company content log)
- **Branch**: local `main`, one commit per phase `foundation: phase N — <summary>`, NO push without founder ask
- **Context**: autonomous agents paused via `.agents_paused` — do not unpause; safe window for infra edits

## Phase status
| Phase | Status |
|---|---|
| 0 — Inventory & diagnosis | ✅ done (see AUDIT_REPORT.md) |
| Setup — scaffolding files | ✅ done (commit 967da14) |
| 1 — CLAUDE.md pruning + hook slimming | ✅ done — auto-load 5.9k→2.6k tokens; awaiting P4 review |
| 2 — Skills upgrade + skill-gardener | ✅ done (a6abfb9 + review fixes) — P4 reviewed, YAML blocker fixed |
| 3 — Agents: 30-line format + model routing | ⬜ |
| 4 — Hooks & settings rails | ⬜ |
| 5 — Memory architecture | ⬜ |
| 6 — Effort tiers | ⬜ |
| 7 — Verification harness (pytest/ruff/evals) | ⬜ |
| 8 — Reporting protocol | ⬜ |
| 9 — Code quality + hygiene (parallel worktrees) | ⬜ |
| 10 — Autonomy dry run | ⬜ |
| Final — deliverables | ⬜ |

## What's next
Phase 3 (agents → 30-line format, model routing). Note: CLAUDE.md forward-references `.claude/rules/{effort,memory,reporting}.md` + `scripts/verify.sh` — these land in Phases 5–8; dangling until then by design. SF-004 needs an sf.md entry (Phase 4).

## Open questions
See NEEDS_DECISION.md — 5 items, all with best-guess defaults applied; none blocking.

## Test commands (preserve across compaction)
- Server: `venv312/bin/uvicorn app:app --reload --port 8000`
- Render check: `npm run check-render`
- Guards: `bash scripts/guard_checks.sh`
- Tests/lint: pytest + ruff arrive in Phase 7
