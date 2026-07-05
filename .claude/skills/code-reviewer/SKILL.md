---
name: code-reviewer
description: Structured code review for AWEAR's three layers — Python/FastAPI (app.py), vanilla JS SPA (static/index.html), and React Native (mobile/). Runs real grep-based checks against known failure modes and returns a PASS/FAIL verdict. Use before merging any non-trivial change. NOT for design/visual audits (Gabbana), UX checks (ui-ux-pro-max), or writing fixes — it reviews, it does not edit.
allowed-tools: Read, Grep, Glob, Bash
context: fork
---

# Code Reviewer — AWEAR

AWEAR has three distinct layers with different failure modes. This skill runs targeted grep/bash
checks on each one — no phantom scripts, every command works today. It runs in a fork: do all
the file reading here and return ONLY the verdict report below as your final output.

## Step 0 — Orient Before Reviewing

```bash
git diff --stat HEAD~1 HEAD
git diff HEAD~1 HEAD -- app.py static/index.html mobile/
```

Route the review: run only the sections whose files changed. A change to `app.py` only doesn't
need a render check; a change to `static/index.html` needs all of Section 2.

## The check sections — full commands in [checklist.md](checklist.md)

**Section 1 — Backend (`app.py`, `google_services.py`):**
1a SQL injection (parameterized `?` only) · 1b bare/silent excepts · 1c hardcoded secrets ·
1d system prompts language-neutral · 1e demo `mode` field returned AND read by frontend ·
1f field-rename safety (zero tolerance) · **1g new-endpoint gate: BE-006 `user_key`
pattern + `check_rate_limit(...)` + SQLite via `_get_db()` (not in-memory dicts) + no
self-HTTP inside async endpoints (SF-004)**.

**Section 2 — Frontend (`static/index.html`):**
2a TDZ (const/let declared before first load-time use) · 2b hardcoded Hebrew strings (i18n) ·
2c inline styles / hardcoded hex (DS-004: `var(--token, fallback)`) · 2d emoji in UI chrome
(DS-008: `icon()` / inline SVG only) · 2e container CSS before adding elements ·
2f new files actually linked (/wire-it-up) · 2g **render check mandatory** for any HTML/CSS/JS
change — Iron Rule #9 in `.claude/agents/docs/daily_model.md`; run /verify-rendering.

**Section 3 — React Native (`mobile/`):**
3a i18n `t()` coverage · 3b tokens from `mobile/theme/tokens.js` · 3c screens registered in
navigator · 3d permission declarations (iOS + Android + runtime).

**Section 4 — Cross-layer:** 4a API field-name contract (backend ↔ frontend/mobile — mismatch
= silent `undefined`) · 4b auth/session consistency.

## Review Verdict (this is your entire final output)

```
REVIEW — [your name] — [date]
Files reviewed: [list]

PASS / FAIL / PASS WITH NOTES

Blockers (must fix before merge):
- [ ] item

Non-blocking notes (can merge, follow-up ticket):
- [ ] item

Checks run:
- [ ] SQL injection scan
- [ ] Hardcoded secrets scan
- [ ] BE-006 + rate-limit on new endpoints
- [ ] TDZ check
- [ ] Hebrew string count
- [ ] Token/inline style scan
- [ ] Emoji in UI scan
- [ ] verify-rendering (if HTML/CSS/JS changed)
- [ ] Cross-layer field consistency
```

A clean review with all boxes checked and zero blockers goes to Jeff for merge (main is only
reachable via the jeff-merge gate). A review with blockers goes back to the implementing
agent — not to Gabbana, not to Jeff.
