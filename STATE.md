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
| Setup — scaffolding files | 🔄 in progress |
| 1 — CLAUDE.md pruning + hook slimming | ⬜ |
| 2 — Skills upgrade + skill-gardener | ⬜ |
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
Finish scaffolding (this file + NEEDS_DECISION.md + TEMPLATE_BOUNDARY.md), commit `foundation: phase 0 — audit & scaffolding`, then Phase 1.

## Open questions
See NEEDS_DECISION.md — 5 items, all with best-guess defaults applied; none blocking.

## Test commands (preserve across compaction)
- Server: `venv312/bin/uvicorn app:app --reload --port 8000`
- Render check: `npm run check-render`
- Guards: `bash scripts/guard_checks.sh`
- Tests/lint: pytest + ruff arrive in Phase 7
