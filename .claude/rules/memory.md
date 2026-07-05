# Memory rules — who writes what, where

The discipline that keeps five projects resumable. Every file below has ONE owner-class and ONE purpose; writing the right thing to the wrong file is how memory rots.

| File | Purpose | Who writes | When |
|---|---|---|---|
| `STATE.md` (root) | Live task state — the resume point. A fresh session must be able to continue from this file alone | ANY agent in interactive sessions; in autonomous CI lanes — the ENGINE only (6 parallel manager lanes would merge-conflict on it; lanes record via activity_log) | Continuously: task start (what+plan), direction change, task end. Overwrite stale sections — it's a snapshot, not a log |
| `DECISIONS.md` (root) | Settled infra/architecture questions, one line + rationale | Jeff/Steve-level calls only (founder, CTO-gate, or the main session) | When a question is settled or reversed |
| `.claude/agents/knowledge/<domain>.md` + `INDEX.md` row | Incident-derived learning codes — short, general, deduplicated | The domain owner agent, after a human correction or discovered edge case | Same cycle as the incident; INDEX row is mandatory (guard_checks blocks un-indexed codes) |
| `.claude/agents/activity_log.md` | Concurrency log — who touched what | Every agent | One row per completed task |
| `notes/<task-slug>.md` | Per-task working notes: approach, dead ends, PR links | The agent doing the task | During the task + after every PR; see `notes/README.md` |
| `NEEDS_DECISION.md` (root) | Open founder decisions with options + recommendation + applied default | Any agent that hits one | The moment a human-only decision is identified — then keep moving on the default |
| `~/.claude/.../memory/` (auto-memory) | Cross-session facts about user/project preferences | Claude Code auto-memory (main session only) | Managed by the harness; verified writing 2026-07-05 |
| `.claude/master/*` | Founder strategy space | Founders + strategy agents only | — |

Rules:
- **Never duplicate**: a fact lives in exactly one file; others point to it.
- **STATE.md is a snapshot**: delete finished-work detail (it's in git/AUDIT trail), keep only what a resuming session needs.
- **Learnings are general**: no customer specifics, no one-off trivia; if it won't help a future task, it isn't a learning.
- **A rejected report becomes a learning** before the responsible agent's next task (see `.claude/rules/reporting.md`).
