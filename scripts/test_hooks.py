#!/usr/bin/env python3
"""test_hooks.py — regression tests for the PreToolUse guard hooks.

Run: python3 scripts/test_hooks.py  (exit 0 = all pass)
Cases are built by string concatenation so this file itself never triggers the bash guard.
"""
import json
import subprocess
import sys

RMRF = "rm " + "-rf"  # avoid tripping the guard on this file's own content

BASH_BLOCK = [
    RMRF + " /",
    RMRF + " ~/",
    RMRF + " .git",
    "rm " + "-fr ..",
    "git push " + "--force origin main",
    "git push " + "-f",
    'sqlite3 data/awear.db "DROP' + ' TABLE users"',
    "echo KEY=x >" + "> .env",
    "git add " + ".env",
    "git reset " + "--hard origin/main",
    "git clean " + "-fd",
]
BASH_PASS = [
    RMRF + " worktrees/agent-x",
    RMRF + " /tmp/foo",
    "git push origin main",
    'sqlite3 data/awear.db "SELECT * FROM users"',
    "cat .env.example",  # read, not write
    "source venv312/bin/activate",
    "git add STATE.md",
    "grep -rn env static/",
    "bash scripts/guard_checks.sh",
]
EDIT_BLOCK = [
    ("/Users/x/AWEAR/.env", "X=1"),
    ("/x/client_secret_abc.json", "{}"),
    ("secrets/prod.key", "k"),
    ("static/index.html", ".sf-card-img { font-size: 40px }"),
    ("static/index.html", "background: #ff0000;"),
]
EDIT_PASS = [
    ("static/index.html", "color: var(--accent, #e8526a);"),
    ("app.py", "x = 1"),
    ("static/index.html", "<div class='sf-card-img'></div>"),
    (".env.example", "KEY=placeholder"),  # example file is fine? -> see note below
]


def run(script, payload):
    p = subprocess.run([sys.executable, script], input=json.dumps(payload),
                       capture_output=True, text=True)
    return p.returncode


def main():
    fails = []
    for cmd in BASH_BLOCK:
        if run("scripts/hook_bash_guard.py", {"tool_input": {"command": cmd}}) != 2:
            fails.append(f"bash guard should BLOCK: {cmd}")
    for cmd in BASH_PASS:
        if run("scripts/hook_bash_guard.py", {"tool_input": {"command": cmd}}) != 0:
            fails.append(f"bash guard should PASS: {cmd}")
    for path, text in EDIT_BLOCK:
        if run("scripts/hook_pretool_guard.py", {"tool_input": {"file_path": path, "new_string": text}}) != 2:
            fails.append(f"edit guard should BLOCK: {path} :: {text}")
    for path, text in EDIT_PASS:
        if run("scripts/hook_pretool_guard.py", {"tool_input": {"file_path": path, "new_string": text}}) != 0:
            fails.append(f"edit guard should PASS: {path} :: {text}")

    if fails:
        print("HOOK TESTS FAILED:")
        for f in fails:
            print("  -", f)
        return 1
    print(f"hook tests: PASS ({len(BASH_BLOCK)+len(BASH_PASS)+len(EDIT_BLOCK)+len(EDIT_PASS)} cases)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
