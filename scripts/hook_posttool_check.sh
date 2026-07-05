#!/bin/bash
# hook_posttool_check.sh — PostToolUse hook (matcher: Edit|Write): mechanical style/syntax
# feedback right after an edit, instead of waiting for the merge gate.
#
# Non-blocking by design (always exit 0): PostToolUse feedback is advisory — stdout is
# shown to the model, which fixes forward. Blocking rails live in the PreToolUse guards.
#
# stdin: hook JSON with .tool_input.file_path

FILE=$(python3 -c "import json,sys; print((json.load(sys.stdin).get('tool_input') or {}).get('file_path',''))" 2>/dev/null)
[ -n "$FILE" ] && [ -f "$FILE" ] || exit 0

case "$FILE" in
  *.py)
    # Syntax check — a broken app.py takes the whole server down
    ERR=$(python3 -m py_compile "$FILE" 2>&1) || echo "post-edit check: PYTHON SYNTAX ERROR in $FILE — fix now: $ERR"
    # Lint if ruff is installed (Phase 7 installs it; hook activates automatically)
    if command -v ruff >/dev/null 2>&1; then
      ruff check --quiet "$FILE" 2>/dev/null | head -5 || true
    elif [ -x "venv312/bin/ruff" ]; then
      venv312/bin/ruff check --quiet "$FILE" 2>/dev/null | head -5 || true
    fi
    ;;
  *static/index.html)
    # Cheap invariant echo (full render check is the verify-rendering skill / CI)
    if ! grep -q 'viewport-fit=cover' "$FILE"; then
      echo "post-edit check: viewport-fit=cover missing from index.html — notch invariant broken (guard_checks will block merge)"
    fi
    ;;
esac
exit 0
