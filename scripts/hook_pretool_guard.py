#!/usr/bin/env python3
"""hook_pretool_guard.py — PreToolUse hook: BLOCK Iron-Rule violations before they are written.

WHY (OW-006): guard_checks.sh catches violations at commit/CI time — after the work is done.
This hook catches them at WRITE time: an Edit/Write to static/index.html that introduces a
hardcoded hex in a CSS property without var() (DS-004) or emoji as UI chrome (DS-008) is
rejected with exit code 2, and the message on stderr is fed back to the model so it fixes
the content and retries. Deterministic enforcement, not prompt prose.

Conservative by design: only checks static/index.html, only the NEW text being written,
and keeps the same data-emoji exclusions as guard_checks.sh (seed/caption emoji are fine).
"""
import json
import re
import sys


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # never break the pipeline on hook-parse issues

    tool_input = data.get("tool_input", {}) or {}
    path = str(tool_input.get("file_path", "")).replace("\\", "/")

    # Secret files: never edited by agents, regardless of content (foundation Phase 4)
    base = path.rsplit("/", 1)[-1]
    is_example = base.endswith((".example", ".sample", ".template"))
    if not is_example and (base == ".env" or base.startswith(".env.") or base.startswith("client_secret")
            or base == "google_credentials.json" or base == "google_token.json"
            or base.endswith(".key")):
        print(
            "BLOCKED: secret files (.env, credentials, keys) are managed by the founder only — "
            "never edited by agents. If a secret is missing, log it in NEEDS_DECISION.md.",
            file=sys.stderr,
        )
        return 2

    if not path.endswith("static/index.html"):
        return 0

    # The text this call ADDS (Edit -> new_string, Write -> content)
    new_text = str(tool_input.get("new_string", "") or tool_input.get("content", "") or "")
    if not new_text:
        return 0

    problems = []

    # DS-004: hardcoded hex in a CSS color-ish property without a var() on the same line
    for line in new_text.splitlines():
        if re.search(r"(color|background|border|fill|stroke|box-shadow)[^;]*#[0-9a-fA-F]{3,6}", line, re.I) \
                and "var(--" not in line:
            problems.append(f"DS-004: hardcoded hex without var(--token, #fallback): {line.strip()[:100]}")

    # DS-008: emoji as UI chrome (same exclusions as guard_checks.sh — data emoji tolerated)
    chrome_emoji = re.compile("✓|⚠️|✨|🎉|➕|🌸|🔥|❤️|🛍️|👗|👖|👟")
    excl = re.compile(r"search_query|caption|comment|message|seed|//|emoji:", re.I)
    for line in new_text.splitlines():
        if chrome_emoji.search(line) and not excl.search(line):
            problems.append(f"DS-008: emoji as UI chrome — use icon() instead: {line.strip()[:100]}")

    # DS-009: no font-size on image containers (breaks image sizing; classes from static/CLAUDE.md)
    img_containers = re.compile(r"\.(sf-card-img|mp-item-img|pimg|pc-feat-cover)\b[^}]*font-size", re.S)
    if img_containers.search(new_text):
        problems.append("DS-009: font-size on an image container (.sf-card-img/.mp-item-img/.pimg/.pc-feat-cover) — remove it")

    if problems:
        print(
            "BLOCKED by Iron-Rule guard (fix the content and retry — do NOT bypass):\n  "
            + "\n  ".join(problems[:5]),
            file=sys.stderr,
        )
        return 2  # exit 2 = block the tool call, stderr goes back to the model

    return 0


if __name__ == "__main__":
    sys.exit(main())
