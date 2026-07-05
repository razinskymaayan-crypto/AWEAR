#!/bin/bash
# hook_posttool_check.sh — PostToolUse hook (matcher: Edit|Write): mechanical style/syntax
# feedback right after an edit, instead of waiting for the merge gate.
#
# PostToolUse semantics: exit 0 stdout goes to transcript only (model never sees it);
# exit 2 + stderr is fed back to the model WITHOUT undoing the edit (tool already ran).
# So: real problems -> stderr + exit 2 (model fixes forward); otherwise exit 0 silent.
#
# stdin: hook JSON with .tool_input.file_path

FILE=$(python3 -c "import json,sys; print((json.load(sys.stdin).get('tool_input') or {}).get('file_path',''))" 2>/dev/null)
[ -n "$FILE" ] && [ -f "$FILE" ] || exit 0

case "$FILE" in
  *.py)
    # Syntax check — a broken app.py takes the whole server down
    if ! ERR=$(python3 -m py_compile "$FILE" 2>&1); then
      echo "post-edit check: PYTHON SYNTAX ERROR in $FILE — fix now: $ERR" >&2
      exit 2
    fi
    # Ruff stays advisory here; blocking lint runs in scripts/verify.sh (Phase 7)
    ;;
  *static/index.html)
    # Cheap invariant check (full render check is the verify-rendering skill / CI)
    if ! grep -q 'viewport-fit=cover' "$FILE"; then
      echo "post-edit check: viewport-fit=cover missing from index.html — notch invariant broken (guard_checks will block merge)" >&2
      exit 2
    fi
    ;;
esac
exit 0
