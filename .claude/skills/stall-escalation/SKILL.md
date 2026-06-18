---
description: When to stop and escalate vs. push through. The stall-escalation protocol for AWEAR agents — how to recognize a stall, what to report, and what NOT to do when blocked.
---

# Stall-Escalation Protocol

## The problem this solves

Two types of harmful behavior appeared repeatedly in AWEAR's history:

**Type A — Silent stall:** An agent is blocked, can't proceed, and either does nothing for
multiple cycles or starts working around the block in unauthorized ways. Jeff only discovers the
problem when reviewing outputs — hours or cycles later.

**Type B — Scope creep under pressure:** An agent can't do Task A, so it starts doing Task B
(adjacent, not assigned) to "show progress." The result: the wrong thing gets built, and Task A
still isn't done.

Both behaviors are worse than a clean stop.

## The stall conditions — recognize them immediately

A **stall** is any of these:
- You cannot complete the task with the information/tools you have
- A required file, endpoint, or dependency doesn't exist yet
- You're about to bypass a rule (worktree isolation, render check, scope boundary) to make progress
- You've attempted the same step twice and it failed both times
- The task requires a decision that is outside your authority (scope, architecture, product)

## What to do when stalled

**Stop immediately. Do not:**
- Work around worktree isolation by writing to the main repo
- Invent a solution for a decision that belongs to your team lead or Jeff
- Do a different, easier subtask and pretend progress was made
- Silently wait and hope the blocker resolves itself

**Do:**
1. Write a clear stop report:
   ```
   STALL — [your name] — [date]
   Task: [what you were trying to do]
   Blocker: [exactly what stopped you — error message, missing file, unclear scope]
   What I tried: [list attempts]
   What I need to unblock: [specific ask — a file, a decision, a tool, clarification]
   ```
2. Return that report as your output. Don't apologize — a clean stop report is a good output.

## The stall-escalation path

```
You (stalled) → Team Lead (your direct report)
              → Jeff (if team lead is the blocker or can't unblock)
              → Carmel/Maayan (only via Jeff — never directly)
```

Never skip levels. A stall that requires Carmel's input still goes through Jeff first.

## First task rule — tiny on purpose

Dana's first RN task was intentionally tiny (Expo skeleton, not full camera flow). This is a
pattern, not a coincidence:

> When a scope hasn't produced output in 2+ cycles, the first unblocking task must be small
> enough to complete within a single dispatch. This proves the pipeline works before investing
> in larger work.

If you're given a "first task in a new area" — treat it as a proof-of-pipeline exercise. Do the
minimal thing that produces a verifiable artifact (a file that exists, a screen that renders,
a commit with a hash). Don't expand scope to be more impressive.

## What Jeff does with a stall report

Jeff does not penalize clean stops. A stall report with:
- Clear description of what failed
- What was attempted
- What is needed

...is a better output than a partial implementation that silently broke something, or a workaround
that violated isolation rules.

The record of "stopped cleanly and reported" is visible in `agents/logs/activity_log.md`. It is
not a failure entry — it is a process entry.

## The worktree stall specifically (Iron Rule #14)

If Edit/Write tools refuse to operate inside your assigned worktree:
- Do NOT try to write to `/Users/tamargrosz/AWEAR/` (the main repo) as a workaround
- This is the exact failure mode Iron Rule #14 exists to prevent
- Report the exact path and error. Jeff will resolve it.

See also: `/worktree-discipline` skill.
