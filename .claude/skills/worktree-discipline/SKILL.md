---
name: worktree-discipline
description: Worktree isolation discipline — Iron Rule #14 (.claude/agents/docs/daily_model.md). Use at the START of every worktree-assigned task, before writing any file, to verify you're in the correct worktree (not the main repo) and it isn't forked from a stale HEAD. Also covers what to do if Edit/Write refuses to work in your worktree (stop and report — never write to the main checkout). NOT needed if you were explicitly told to work on the main checkout.
allowed-tools: Read, Grep, Glob, Bash
---

# Worktree Discipline — Iron Rule #14

## What went wrong (2026-06-18)

**Incident 1 — Direct commit to main:**
Shira committed directly to `main` without worktree isolation. The commit bypassed peer review and
Jeff's diff check. Detected only after merge.

**Incident 2 — Stale HEAD fork:**
4 consecutive worktrees were all forked from the same old commit (`290667f`) instead of current
`main`. Steve investigated and found: the Agent tool freezes HEAD at session start — worktrees
created mid-session fork from that frozen point, not the live `main`. Result: agents worked on
stale code and their diffs were based on outdated state.

**Incident 3 — Writing to main repo path:**
Agents using absolute paths (`/Users/tamargrosz/AWEAR/static/index.html`) bypassed their worktree
and wrote directly to the main checkout. The worktree exists in a different directory.

## Iron Rule #14 (full text: `.claude/agents/docs/daily_model.md`)

> Worktree isolation is never bypassed under any circumstances. If Edit/Write tools refuse to
> operate inside your assigned worktree, **stop and report** — do not "solve" it by writing to
> the main repo path. That is exactly what the rule is meant to prevent.

Related — CLAUDE.md Iron Rule 7: manually created worktrees go under
`/Users/tamargrosz/AWEAR/worktrees/` — never directly in `~/`. (Agent-tool worktrees are
auto-created under `.claude/worktrees/agent-*` — both are valid locations; `~/` is not.)

## Before you start any task — verify your location

```bash
# Where am I?
pwd
# Should be something like: /Users/tamargrosz/AWEAR/.claude/worktrees/agent-XXXX/
# NOT: /Users/tamargrosz/AWEAR/

# Confirm this is a worktree, not the main checkout
git rev-parse --show-toplevel
git worktree list
```

If your path is `/Users/tamargrosz/AWEAR/` (the main repo) — **stop**. You should not be
writing here. Request a proper worktree from Jeff.

## Verify your worktree is up to date

```bash
# What commit is this worktree based on?
git log --oneline -3

# What is current main?
git log --oneline origin/main -3

# If they diverge significantly, your worktree may be stale.
# Report to Jeff before writing code on top of outdated state.
```

## Never use absolute paths to main repo files

```bash
# ❌ WRONG — bypasses worktree isolation
# Edit: /Users/tamargrosz/AWEAR/static/index.html

# ✅ RIGHT — relative path within your worktree
# Edit: static/index.html   (from within your worktree directory)
```

## If Edit/Write refuses to work

**Do not** try to work around it. The refusal may mean:
- Your worktree path is wrong
- The file is outside your worktree
- A git lock exists

Report exactly: "Edit tool refused at path X with error Y. Stopping per Iron Rule #14."
Jeff will investigate and either fix the worktree or redirect the task.

## After your work is done

Do not merge yourself. Push your branch or leave the worktree for Jeff to review:
```bash
git add <specific-files>
git commit -m "Description of change"
# Then report back to Jeff with the commit hash — he reviews and merges
```

The diff check + Playwright verify (`/verify-rendering`) happens **before** merge. The only
path to `main` is the jeff-merge gate (`.github/workflows/jeff-merge.yml`: build +
guard_checks + adversarial persona review) — never merge to main yourself.
