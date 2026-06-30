#!/bin/bash
# guard_checks.sh — turns advisory learning codes into BLOCKING gates (closes OW-006).
#
# WHY: rules that live only in markdown get violated and reverted. These are the
# machine-checkable invariants from docs/SURFACE_SPECS.md + the knowledge base.
#
# Two kinds of check:
#   INVARIANTS — run on the whole static/index.html (must always hold).
#   DIFF GATES — run only on lines this commit ADDS (block NEW violations, ignore legacy).
#
# Usage: bash scripts/guard_checks.sh         # uses the staged diff if present
# Exit:  0 = pass, 1 = a gate failed (prints the violation + citing code).

set -u
F="static/index.html"
fail=0
note() { echo "  ❌ $1"; fail=1; }

[ -f "$F" ] || { echo "guard_checks: $F not found — skip"; exit 0; }

# ---- INVARIANTS (whole-file; these are locked decisions in docs/SURFACE_SPECS.md) ----

# notch: header must reserve the top safe-area, viewport must opt in (Dynamic Island)
grep -Eq 'header[^}]*env\(safe-area-inset-top\)' "$F" \
  || note "header lost env(safe-area-inset-top) — Dynamic Island collision (SURFACE_SPECS/notch)"
grep -q 'viewport-fit=cover' "$F" \
  || note "viewport meta lost viewport-fit=cover — notch not honored (SURFACE_SPECS/notch)"

# locked: no external 'Google Shopping' wording/redirect — buy is in-app (SURFACE_SPECS item-sheet)
if grep -iq 'google shopping' "$F"; then
  note "'Google Shopping' wording is back — buy must stay in-app via /api/orders (OW-011, SURFACE_SPECS)"
fi

# repeat-mistake registry: known non-existent class that crashed double-tap like (OW-008)
if grep -q '\.fca-icon\b' "$F"; then
  note "reference to non-existent class '.fca-icon' (canonical is '.fca-ico') — repeat of OW-008"
fi

# ---- DIFF GATES (only on lines this commit adds) ----
ADDED=""
if git rev-parse --git-dir >/dev/null 2>&1; then
  ADDED=$(git diff --cached -U0 -- "$F" 2>/dev/null | grep '^+' | grep -v '^+++' || true)
fi

if [ -n "$ADDED" ]; then
  # DS-004: no NEW hardcoded hex in a CSS color/bg/border prop without a var() fallback
  BADHEX=$(printf '%s\n' "$ADDED" \
    | grep -Ei '(color|background|border|fill|stroke|box-shadow)[^;]*#[0-9a-fA-F]{3,6}' \
    | grep -v 'var(--' || true)
  if [ -n "$BADHEX" ]; then
    note "new hardcoded hex in a CSS property without var(--token, #fallback) (DS-004):"
    printf '%s\n' "$BADHEX" | head -3 | sed 's/^/      /'
  fi

  # DS-008: no NEW emoji used as UI chrome (data emoji in seed arrays are tolerated)
  CHROME_EMOJI=$(printf '%s\n' "$ADDED" \
    | grep -E '✓|⚠️|✨|🎉|➕|🌸|🔥|❤️|🛍️|👗|👖|👟' \
    | grep -Eiv 'search_query|caption|comment|message|seed|//|emoji:' || true)
  if [ -n "$CHROME_EMOJI" ]; then
    note "new emoji used as UI chrome — use icon() instead (DS-008):"
    printf '%s\n' "$CHROME_EMOJI" | head -3 | sed 's/^/      /'
  fi
fi

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "guard_checks: BLOCKED — fix the above (or, if a founder/metric reversed a lock, update docs/SURFACE_SPECS.md first)."
  exit 1
fi
echo "guard_checks: PASS — locked invariants hold, no new hex/emoji/known-mistake."
exit 0
