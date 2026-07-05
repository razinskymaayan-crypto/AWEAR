# Code Reviewer — Full Check Commands

All commands verified against the repo. Run only the sections whose files changed.

---

## Section 1 — Python Backend (`app.py`, `google_services.py`)

### 1a. SQL injection — parameterized queries only

```bash
# Find raw string formatting into SQL — should return 0 results
grep -n "execute(f\"\|execute(\".*%\|execute(\".*format\|execute(\".*+" app.py
```

Every DB call must use `?` placeholders:
```python
# ✅
db.execute("SELECT * FROM items WHERE id = ?", (item_id,))
# ❌
db.execute(f"SELECT * FROM items WHERE id = {item_id}")
```

### 1b. No fail silently — error handling

```bash
# Find bare except clauses that swallow errors
grep -n "except:\|except Exception:\s*$\|except Exception as e:\s*$" app.py | head -20
```

Every `except` must either re-raise, log, or return a structured error. Silent swallowing
masked demo-mode failures for weeks (see `.claude/agents/logs/1on1_feedback_2026-06-17.md` — Oren).

### 1c. API key and secrets exposure

```bash
# No hardcoded secrets
grep -n "sk-\|AIza\|Bearer \|api_key\s*=\s*\"" app.py google_services.py
# Should return 0 results. Secrets go in .env, read via os.getenv()
```

### 1d. System prompts — language neutral

```bash
# Find Hebrew in system prompts — should be 0 results
grep -n "SYSTEM_PROMPT\|system_prompt\|\"role\": \"system\"" app.py | head -10
# Then check nearby lines for Hebrew text — AWEAR is global, not Israel-only
```

All system prompts must instruct the model to respond in the user's language, not hardcoded Hebrew.

### 1e. Demo mode must be visible

```bash
# Every endpoint that has a demo fallback must return a `mode` field
grep -n "\"mode\"" app.py | head -20
# Cross-check: does the frontend read this field?
grep -n "result\.mode\|data\.mode\|response\.mode" static/index.html
```

If the backend signals demo mode but the frontend ignores it → users never know. This was live
for weeks (see Oren's 1:1 feedback, 17.06.2026).

### 1f. Field rename safety

If any field name changed in this diff, run the backend-rename-safety skill first:
```bash
# Count all usages of the old field name in frontend and mobile
grep -rn "old_field_name" static/index.html mobile/ | wc -l
```
Zero-tolerance: backend rename without frontend update is an instant reject.

### 1g. New-endpoint gate (Iron Rules BE-005 / BE-006 / SF-004)

For every endpoint added in this diff:
```bash
# BE-006 identity pattern present? (exact spelling, "anon" not "unknown" in new code)
grep -n 'or "anon"' app.py | head
# Rate limit call present?
grep -n "check_rate_limit" app.py | head
# Persistence via SQLite, not module-level dicts:
grep -n "_get_db()" app.py | head -5
# No HTTP calls to self inside async endpoints (SF-004) — should be 0:
grep -n "httpx\|requests\.\(get\|post\)\|localhost:8000" app.py | grep -v "^.*#"
```

---

## Section 2 — Frontend (`static/index.html`)

### 2a. Temporal Dead Zone — const/let before first use

```bash
# Find all global const/let declarations and their line numbers
grep -n "^const \|^let " static/index.html | head -40

# Find render functions called at page load
grep -n "^render\|^init\|DOMContentLoaded\|window\.onload" static/index.html | head -20
```

Any `const`/`let` used inside a function that's called at load time must be declared at a lower
line number than that call. See `/js-tzdead-zone` skill for the full pattern.

### 2b. Hardcoded Hebrew strings

```bash
# Count Hebrew characters in JS render functions (not in data/comments)
grep -n "innerHTML\|textContent\|innerText" static/index.html | grep -P "[֐-׿]" | wc -l
```

Target: 0. Every user-facing string goes through the i18n system (`static/i18n/en.json`,
`static/i18n/he.json`). The 614-hardcoded-strings problem (Roei's audit, 18.06.2026) must not grow.

### 2c. Inline styles and token violations

```bash
# Find inline style attributes — should be 0 in new code
grep -n "style=\"" static/index.html | grep -v "display:none\|visibility" | wc -l

# Find hardcoded color values — should be 0
grep -n "#[0-9a-fA-F]\{3,6\}\|rgb(\|rgba(" static/index.html | grep -v "tokens\|comment\|/\*" | head -20
```

All visual values use `var(--token-name, exact-fallback)` (DS-004 — the fallback form is
required). If a token is missing → propose it to Netta, don't hardcode. Token source of truth:
`awear-tokens.json` → generates `static/tokens.css`.

### 2d. Emoji in UI chrome

```bash
# Emoji in icon/button/nav positions — P0 Gabbana rejection (DS-008)
# Manual scan: look at all <button>, nav items, badge elements for emoji
grep -n "<button\|\.badge\|\.nav-item\|\.icon" static/index.html | head -30
```

Icons = `icon()` in JS template literals, inline SVG in static HTML, `currentColor`.
Any emoji in interactive UI = instant reject.

### 2e. Container CSS before adding elements

If the diff adds HTML inside an existing container:
```bash
# Check the container's overflow and position
grep -n "\.feed-card-full\|\.your-container\|overflow\|position:" static/index.html | head -20
```

See `/container-css-check` skill. This caused the invisible-reactions incident (17.06.2026).

### 2f. New files linked?

```bash
# Any new CSS or JS file referenced in this diff?
# Verify it's actually linked in index.html
grep -n "new-file\.css\|new-module\.js" static/index.html
```

See `/wire-it-up` skill. tokens.css was unlinked for weeks.

### 2g. Render check — mandatory for any HTML/CSS/JS change

Per Iron Rule #9 (`.claude/agents/docs/daily_model.md`) — non-negotiable. Run the
`/verify-rendering` skill (fast tier: `npm run check-render`; real gate: headless Playwright).
Do not approve a frontend change that hasn't passed a real browser render check.

---

## Section 3 — React Native (`mobile/`)

### 3a. i18n coverage

```bash
# Find hardcoded strings in JSX — any visible text that isn't wrapped in t()
grep -rn "\"[א-ת]\|'[א-ת]" mobile/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
# Also check English strings that should be translated
grep -rn "<Text>[A-Z]" mobile/ --include="*.js" | grep -v "{t(" | head -20
```

Every user-visible string must use the i18n `t()` helper from `mobile/i18n/index.js`.

### 3b. Design token usage

```bash
# Find hardcoded colors in RN styles
grep -rn "color:\s*'#\|backgroundColor:\s*'#\|color:\s*\"#" mobile/ --include="*.js" | head -20
```

All values come from `mobile/theme/tokens.js` (which reads from `awear-tokens.json`).

### 3c. Navigation structure

If the diff adds a new screen:
```bash
# Is it registered in the navigator?
grep -rn "Stack.Screen\|Tab.Screen\|Drawer.Screen" mobile/ | grep "YourNewScreen"
```

Unregistered screens can't be navigated to — they're unreachable dead code.

### 3d. Permission handling

If the diff involves camera, location, contacts, or notifications:
```bash
grep -rn "PermissionsAndroid\|requestPermission\|expo-permissions" mobile/ | head -10
```

Every hardware feature requires both iOS (`Info.plist` strings) and Android
(`AndroidManifest.xml` permissions) declarations, plus a runtime request.

---

## Section 4 — Cross-Layer Integration

Run these whenever a change touches more than one layer.

### 4a. API contract consistency

```bash
# Field names returned by app.py
grep -n "\"field_name\"\|'field_name'" app.py | head -10

# Same field name consumed by frontend
grep -n "field_name\|\.field_name" static/index.html mobile/ -r | head -10
```

Any mismatch = silent `undefined` in the UI. No error, no warning.

### 4b. Auth and session consistency

```bash
# What does the backend expect for authentication?
grep -n "Authorization\|session\|token\|cookie" app.py | head -20

# What does the frontend send?
grep -n "Authorization\|localStorage.*token\|fetch.*header" static/index.html | head -20
```
