#!/usr/bin/env python3
"""hook_bash_guard.py — PreToolUse hook (matcher: Bash): block destructive commands.

WHY (OW-006): a rule without an enforcement mechanism is a recommendation. These are
the commands that can destroy work or leak secrets; prose told agents not to run them,
this hook makes it mechanical. Exit 2 blocks the call; stderr goes back to the model.

Scope: only Claude-issued Bash commands. CI (GitHub Actions) does not pass through
this hook — jeff-merge's `git reset --hard` etc. are unaffected.
"""
import json
import re
import sys

BLOCKERS = [
    # rm -rf on dangerous targets (repo root, home, git dir, parent, bare wildcard).
    # Scoped deletes (worktrees/agent-x, /tmp/..., node_modules) pass.
    (re.compile(r"\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*[rR][a-zA-Z]*)\s+"
                r"(--\S+\s+)*[\"']?(/(?!tmp/|private/tmp/|var/folders/)|~|\$HOME|\.\.?(?=[\s\"']|$)|\.git\b|\*)"),
     "rm -rf on repo root / home / .git / parent / wildcard. Delete a NARROW path instead, "
     "or log the intent in NEEDS_DECISION.md for the founder."),
    # force push (any remote/branch — history rewrite is a founder decision)
    (re.compile(r"\bgit\s+push\b[^|;&]*(\s--force\b|\s-f\b|\s--force-with-lease\b)"),
     "force push rewrites shared history. Land through the jeff-merge gate instead."),
    # dropping tables (sqlite3 CLI or inline SQL)
    (re.compile(r"\bDROP\s+TABLE\b", re.I),
     "DROP TABLE is irreversible on the live DB. Schema changes go through init_db() migration + Sam's approval (BE-003)."),
    # writing/appending/staging secret files
    (re.compile(r"(>>?\s*|tee\s+(-a\s+)?|git\s+add\s+[^|;&]*)(\.env\b|client_secret[^ ]*\.json|google_credentials\.json|[^ ]*\.key\b)"),
     "writing/staging secret files (.env, credentials, keys) is blocked. Secrets are managed by the founder only."),
    # history-destroying local resets (CI does this in Actions, agents must not)
    (re.compile(r"\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f)"),
     "git reset --hard / git clean -f can destroy uncommitted agent work. Commit/stash first, "
     "or escalate via stall-escalation if you believe a hard reset is required."),
]


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # never break the pipeline on hook-parse issues

    cmd = str((data.get("tool_input") or {}).get("command", ""))
    if not cmd:
        return 0

    for pattern, why in BLOCKERS:
        if pattern.search(cmd):
            print(
                f"BLOCKED by bash guard: {why}\n"
                f"Command was: {cmd[:200]}\n"
                f"Do NOT try to bypass (no eval/base64/sh -c tricks) — adjust the approach or escalate.",
                file=sys.stderr,
            )
            return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
