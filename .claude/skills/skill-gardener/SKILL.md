---
name: skill-gardener
description: Maintain and improve EXISTING skills based on accumulated correction evidence (learning codes, jeff-merge rejections, activity-log rework, revert chains). Use for periodic skill maintenance, after repeated agent corrections on the same theme, or when a founder asks to improve the skills. NOT for creating new skills — that is skill-creator.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, Write, Edit
---

# Skill Gardener — AWEAR

Improves the other skills from evidence of what went wrong. Proposes edits; never merges them itself.
Invoked by a human or a scheduled job only (`disable-model-invocation: true` — it proposes repo-wide changes).

## Step 1 — Gather evidence (read all five sources)

| Source | Path | What to extract |
|--------|------|-----------------|
| Learning codes | `.claude/agents/knowledge/INDEX.md` + domain files (`OW.md`, `ds.md`, `be.md`, `mb.md`, `sf.md`, `mg.md`, `in.md`) | Codes added since the last gardener run |
| Merge rejections | `ci-debug/jeff-rejections.txt` (created by jeff-merge.yml on first rejection — absence means zero rejections so far, not a wrong path) | Rejection reasons per lane |
| Daily lessons | `.claude/agents/knowledge/LEARNING_LOG.md` (NOT `knowledge/LEARNING_LOG.md` — CLAUDE.md's short path is misleading) | Retrospective sections since last run |
| Rework signals | `.claude/agents/activity_log.md` (+ `activity_log_archive.md` if the window is short) | Entries marked failed/redo/fix, same file touched repeatedly |
| Revert chains | `git log --oneline -80 --grep='revert\|fix.*fix\|hotfix' -i` | Fix-the-fix and revert sequences |

Determine "last run": latest `gardener/<date>` branch (`git branch -a | grep gardener/`) or newest
`.claude/agents/plans/skill-gardener-*.md`. If neither exists, use the last 14 days.

## Step 2 — Map evidence to the skill that should have prevented it

Current roster (verify with `ls .claude/skills/` — it grows):

- **backend-patterns** — endpoint/model/DB patterns for app.py
- **backend-rename-safety** — 3-layer grep before any rename
- **code-reviewer** — structured review of all three layers pre-merge
- **container-css-check** — container CSS audit before adding elements
- **frontend-design** — production-grade UI within the design system
- **js-tzdead-zone** — TDZ crash prevention for const/let
- **skill-creator** — build/eval NEW skills (sibling, not a target for merging into)
- **spa-navigation** — orientation map for static/index.html
- **stall-escalation** — stop-and-escalate protocol when blocked
- **ui-ux-pro-max** — UX/accessibility/interaction checklist
- **verify-rendering** — headless Playwright render verification
- **wire-it-up** — verify the connection, not just the file
- **worktree-discipline** — worktree isolation Iron Rule

For each evidence item ask: which skill, had it been triggered or had it contained the missing rule,
would have prevented this? Evidence with no matching skill → note as a **gap** for skill-creator; do not
create the skill here.

## Step 3 — Propose concrete edits

Categories: tighter trigger `description` (skill existed but didn't fire), missing step, new edge case,
stale claim to refresh (line counts, paths, token names — grep is the truth, not old numbers).

Every proposal must be a triple:

```
SKILL: <name>/SKILL.md
EDIT: <exact old → new text, or the exact block to insert and where>
EVIDENCE: <source file + line/code, e.g. "ds.md DS-011" or "jeff-rejections.txt 2026-07-04 steve: ...">
```

No evidence line → no proposal. Style/taste rewrites without a motivating incident are out of scope.

## Step 4 — Apply on a branch, NEVER silently

1. `git checkout -b gardener/<YYYY-MM-DD>` (from current main; work in a worktree under `AWEAR/worktrees/` per Iron Rule 7 if the main checkout is busy).
2. Apply the edits there; nothing outside `.claude/skills/`.
3. Commit with message `gardener: skill maintenance <date>` listing the proposal triples in the body.
4. Write the proposal summary (all triples + gaps + skipped-as-dedup items) as the final report for
   founder review. Merging goes through the jeff-merge gate — the gardener never pushes to main.
5. If branch creation is unavailable, apply nothing; write the full proposal set to
   `.claude/agents/plans/skill-gardener-<YYYY-MM-DD>.md` and add it to `.claude/agents/plans/INDEX.md`.

## Step 5 — Dedup rule

Before proposing, grep previous gardener outputs (`.claude/agents/plans/skill-gardener-*.md` and merged
`gardener/*` commits) for the same skill+edit theme. A proposal that was already rejected once is NOT
re-proposed unless NEW evidence (a later incident) exists — cite the new evidence line explicitly.

## Done =

- Every proposal has skill + exact edit + evidence line.
- Branch (or plan file) exists; main untouched.
- Activity log entry appended: `| <date> | skill-gardener | gardener/<date> | done | N proposals, M gaps |`
