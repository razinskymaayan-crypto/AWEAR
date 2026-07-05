#!/usr/bin/env python3
"""hook_bash_guard.py — PreToolUse hook (matcher: Bash): block destructive commands.

WHY (OW-006): a rule without an enforcement mechanism is a recommendation. These are
the commands that can destroy work or leak secrets; prose told agents not to run them,
this hook makes it mechanical. Exit 2 blocks the call; stderr goes back to the model.

Scope: only Claude-issued Bash commands. CI (GitHub Actions) does not pass through
this hook — jeff-merge's `git reset --hard` etc. are unaffected.
Tests: python3 scripts/test_hooks.py
"""
import json
import re
import sys

SECRET_FILE = r"(\.env\b(?!\.(example|sample|template))|client_secret[^ ]*\.json|google_credentials\.json|google_token\.json|[^ ]*\.key\b)"

BLOCKERS = [
    # force push (any remote/branch — history rewrite is a founder decision), incl. +refspec
    (re.compile(r"\bgit\s+push\b[^|;&]*(\s--force\b|\s-f\b|\s--force-with-lease\b|\s\+\S+)"),
     "force push rewrites shared history. Land through the jeff-merge gate instead."),
    # dropping tables (sqlite3 CLI, inline SQL, heredocs)
    (re.compile(r"\bDROP\s+TABLE\b", re.I),
     "DROP TABLE is irreversible on the live DB. Schema changes go through init_db() migration + Sam's approval (BE-003)."),
    # writing/appending/staging secret files
    (re.compile(r"(>>?\s*|tee\s+(-a\s+)?|git\s+add\s+[^|;&]*)" + SECRET_FILE),
     "writing/staging secret files (.env, credentials, keys) is blocked. Secrets are managed by the founder only."),
    # reading/copying secrets out (Read-tool deny alone doesn't cover Bash)
    (re.compile(r"\b(cat|head|tail|less|more|base64|xxd|strings|cp|mv|scp)\s+[^|;&]*" + SECRET_FILE),
     "reading/moving secret files via shell is blocked (same policy as the Read deny-list)."),
    # history-destroying local resets (CI does this in Actions, agents must not)
    (re.compile(r"\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f)"),
     "git reset --hard / git clean -f can destroy uncommitted agent work. Commit/stash first, "
     "or escalate via stall-escalation if you believe a hard reset is required."),
]

RM_MSG = ("rm -rf on repo root / home / .git / parent / wildcard / absolute path outside tmp. "
          "Delete a NARROW relative path instead, or log the intent in NEEDS_DECISION.md for the founder.")

TMP_PREFIXES = ("/tmp/", "/private/tmp/", "/var/folders/")


def _rm_is_dangerous(cmd: str) -> bool:
    """True if any rm invocation has recursive+force flags aimed at a dangerous target.

    Parses flags token-wise so split forms (`rm -r -f`, `rm --recursive --force`) are caught.
    """
    for m in re.finditer(r"(?:^|[|;&]\s*|\$\(\s*|`\s*|\bsudo\s+)rm\s+([^|;&`]*)", cmd):
        tokens = m.group(1).split()
        letters, targets = set(), []
        for tok in tokens:
            if tok == "--recursive":
                letters.add("r")
            elif tok == "--force":
                letters.add("f")
            elif tok.startswith("--"):
                continue
            elif tok.startswith("-") and len(tok) > 1:
                letters.update(tok[1:].lower().replace("r", "r"))
            else:
                targets.append(tok.strip("\"'"))
        if not ({"r", "f"} <= {c for c in letters if c in "rf"}):
            continue
        for t in targets:
            if t in ("/", "~", ".", "..", "./", "*", "./*", ".git", "$HOME", "${HOME}",
                     "$CLAUDE_PROJECT_DIR", "${CLAUDE_PROJECT_DIR}",
                     "$CLAUDE_PROJECT_DIR/", "${CLAUDE_PROJECT_DIR}/"):
                return True
            if t.startswith(("~/", "$HOME/", "${HOME}/", ".git/")):
                return True
            if t.startswith("/") and not t.startswith(TMP_PREFIXES):
                return True
    return False


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # never break the pipeline on hook-parse issues

    cmd = str((data.get("tool_input") or {}).get("command", ""))
    if not cmd:
        return 0

    why = None
    if _rm_is_dangerous(cmd):
        why = RM_MSG
    else:
        for pattern, msg in BLOCKERS:
            if pattern.search(cmd):
                why = msg
                break

    if why:
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
