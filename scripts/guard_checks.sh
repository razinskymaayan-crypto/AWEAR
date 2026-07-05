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
# The SPA was split out of index.html: HTML shell = index.html, CSS = app.css, JS = app.js.
# Each check now targets the file its concern actually lives in.
F="static/index.html"
CSS="static/app.css"
JS="static/app.js"
fail=0
note() { echo "  ❌ $1"; fail=1; }

[ -f "$F" ] || { echo "guard_checks: $F not found — skip"; exit 0; }

# ---- INVARIANTS (whole-file; these are locked decisions in docs/SURFACE_SPECS.md) ----

# notch: header must reserve the top safe-area (CSS, in app.css), viewport must opt in (HTML meta)
grep -Eq 'header[^}]*env\(safe-area-inset-top\)' "$CSS" 2>/dev/null || grep -Eq 'header[^}]*env\(safe-area-inset-top\)' "$F" \
  || note "header lost env(safe-area-inset-top) — Dynamic Island collision (SURFACE_SPECS/notch)"
grep -q 'viewport-fit=cover' "$F" \
  || note "viewport meta lost viewport-fit=cover — notch not honored (SURFACE_SPECS/notch)"

# locked: no external 'Google Shopping' wording/redirect — buy is in-app (SURFACE_SPECS item-sheet)
if grep -iq 'google shopping' "$F" "$JS" "$CSS" 2>/dev/null; then
  note "'Google Shopping' wording is back — buy must stay in-app via /api/orders (OW-011, SURFACE_SPECS)"
fi

# repeat-mistake registry: known non-existent class that crashed double-tap like (OW-008)
if grep -q '\.fca-icon\b' "$CSS" "$JS" "$F" 2>/dev/null; then
  note "reference to non-existent class '.fca-icon' (canonical is '.fca-ico') — repeat of OW-008"
fi

# ---- KNOWLEDGE-INDEX SYNC (the learning loop only compounds if new codes are discoverable) ----
# Every learning code defined in a domain file MUST have a row in INDEX.md.
# (This is the gate that would have caught DS-016/DS-017/BE-IDEMPOTENT going un-indexed.)
KDIR=".claude/agents/knowledge"
if [ -d "$KDIR" ] && [ -f "$KDIR/INDEX.md" ]; then
  MISSING=$(grep -hoE '^#{2,3} [A-Z]{2}-[A-Z0-9-]+' "$KDIR"/ds.md "$KDIR"/be.md "$KDIR"/mb.md "$KDIR"/sf.md "$KDIR"/mg.md "$KDIR"/in.md 2>/dev/null \
    | sed -E 's/^#+ //' | sort -u \
    | while read -r code; do grep -q "| $code " "$KDIR/INDEX.md" || echo "$code"; done)
  if [ -n "$MISSING" ]; then
    note "learning code(s) defined in a domain file but MISSING from knowledge/INDEX.md (un-indexed = never re-read):"
    printf '%s\n' "$MISSING" | head -5 | sed 's/^/      /'
  fi
fi

# ---- SECURITY GATES (app.py — blocking; a merged secret or injectable SQL is a silent disaster) ----
if [ -f "app.py" ]; then
  # SQL built with f-string/format/concat interpolation instead of ? params
  # (DDL like ALTER/CREATE can't take ? placeholders — allowed when identifiers are code constants)
  SQLI=$(grep -nE '(execute|executemany)\(\s*f["'\'']|(execute|executemany)\([^)]*(%\s*\(|\.format\(|"\s*\+|\x27\s*\+)' app.py \
    | grep -viE 'ALTER TABLE|CREATE (TABLE|INDEX)|DROP TABLE' || true)
  if [ -n "$SQLI" ]; then
    note "SQL built by string interpolation in app.py — use ? placeholders (injection risk):"
    printf '%s\n' "$SQLI" | head -3 | sed 's/^/      /'
  fi
  # hardcoded secrets (long opaque literals assigned to key/token/secret/password names)
  SECRETS=$(grep -nEi '(api_key|apikey|secret|token|password)\s*=\s*["'\''][A-Za-z0-9_\-]{20,}["'\'']' app.py telegram_bot.py telegram_send.py 2>/dev/null \
    | grep -viE 'os\.getenv|environ|example|placeholder|xxx|<' || true)
  if [ -n "$SECRETS" ]; then
    note "possible hardcoded secret (must come from env, never a literal):"
    printf '%s\n' "$SECRETS" | head -3 | sed 's/^/      /'
  fi
fi

# ---- DIFF GATES (only on lines this commit adds) ----
# Prefer the staged diff; if nothing is staged (e.g. CI verifying AFTER the agent committed),
# fall back to everything this run added on top of origin/main — so the gate still bites post-commit.
ADDED=""
if git rev-parse --git-dir >/dev/null 2>&1; then
  ADDED=$(git diff --cached -U0 -- "$F" "$CSS" "$JS" 2>/dev/null | grep '^+' | grep -v '^+++' || true)
  if [ -z "$ADDED" ] && git rev-parse origin/main >/dev/null 2>&1; then
    ADDED=$(git diff origin/main...HEAD -U0 -- "$F" "$CSS" "$JS" 2>/dev/null | grep '^+' | grep -v '^+++' || true)
  fi
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
