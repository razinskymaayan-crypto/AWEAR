# mark self-heal — 2026-07-19

## Status: VERIFIED (code fix already on main)

**CI_FAILURES.md entry**: `[UNRESOLVED] REPEAT-FAILURE: mark (2026-07-18T08:04:07Z)`
→ Should be updated to `[FIXED]` — the code fix landed in commit f4fe9a1.
→ Could not write to `.claude/agents/knowledge/CI_FAILURES.md` this run (permission mode — not in lane).

## Root cause

Scan-confirm UI (sc-*) was written with `var(--accent,#14110F)` and `var(--accent2,#3D3833)` as
CSS fallback values. These are the LIGHT-MODE override values from app.css `:root` (the active
founder override), NOT the canonical dark-mode token values from awear-tokens.json (#e8526a/#c4855a).

Jeff rejected twice for DS-004: "wrong fallback renders CTA button as near-black gradient."

## Fix (already on main — f4fe9a1)

`.sc-cta`, `.sc-field:focus`, sc-header icon — all corrected to:
- `var(--accent, #e8526a)` 
- `var(--accent2, #c4855a)`

## Verification (2026-07-19)

```bash
grep "14110F\|3D3833" static/app.css static/app.js static/index.html
# → 0 hits in sc-* context (only legit hits: light-mode :root definitions and ogd-* components)
```

check-render: ✓ (no uncaught runtime errors at init)

## Learning to file (DS-021 — needs to be added to ds.md)

**Rule**: fallback in `var(--token, fallback)` = dark-mode value from awear-tokens.json, NOT
light-mode override values from app.css `:root`.

**Why**: app.css `:root` defines the active light theme (`--accent:#14110F`). An agent reading
app.css may use these as fallbacks. But `awear-tokens.json` defines canonical dark values
(#e8526a, #c4855a, #7a6af0). DS-004 requires "exact fallback" = the token's canonical value.

**How to check**: before writing `var(--accent/accent2/accent3, ...)`, open awear-tokens.json:
- `--accent: #e8526a`
- `--accent2: #c4855a`
- `--accent3: #7a6af0`
