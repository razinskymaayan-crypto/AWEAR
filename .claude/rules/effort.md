# Effort tiers — every task classifies itself FIRST, then behaves accordingly

Referenced from CLAUDE.md step 2. The tier controls process weight; escalating a tier requires a one-line justification in the task report. When genuinely unsure between two tiers, take the higher one and say why.

## S (small)
Typo-level fixes; single-file changes with existing verification (test/guard/render check covers it).
- **Do**: execute directly. No research phase, no plan, no subagents.
- **Verify**: the existing check that covers the file (guard_checks / py_compile / render check).
- **Report**: one line (still in the `.claude/rules/reporting.md` format, minimal fields).

## M (medium)
Multi-file changes within ONE module/layer (e.g. backend-only endpoint + its callers, one SPA view).
- **Do**: brief plan — 5 lines max — then execute.
- **Verify**: run the relevant test/lint/render commands + curl/grep evidence per the domain DoD.
- **Report**: short report, full format.

## L (large)
New features, architecture changes, anything touching >3 modules or crossing layers (app.py + index.html + mobile/), anything irreversible.
- **Do**: full plan mode; research via subagents (P3 — exploration stays out of main context); unknowns surfaced explicitly (assumptions vs unknowns; human-only ones → `NEEDS_DECISION.md` with a default applied).
- **Verify**: full harness — tests + lint + guards + render + fresh-context diff review (`/review`) before done.
- **Report**: full format + confidence + risks.

## Hard rules
- Classification happens BEFORE any work, and is stated in the report's `TIER:` field.
- An S task that starts sprouting files is an M task — stop, reclassify, justify in one line.
- L without a fresh-context review is not done (OW-002: "הושלם" ≠ "נבדק").
