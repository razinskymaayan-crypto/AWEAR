---
name: verify-rendering
description: Verify AWEAR's static SPA actually renders in a real browser (not just JS syntax check) — loads a screen via headless Playwright, captures console/page errors, and screenshots it. Required before merging any commit that touches static/index.html rendering (DOM/CSS/JS), per Iron Rule #9 in .claude/agents/docs/daily_model.md. NOT needed for backend-only (app.py) or mobile/ changes that don't touch the SPA.
allowed-tools: Read, Grep, Glob, Bash
---

# Verify Rendering — AWEAR

The app is a single-page HTML/CSS/JS app (`static/index.html`, no framework) served by FastAPI
(`app.py`). JS syntax validation (`node --check`, JSC) only proves the code *parses* — it does not catch:

- CSS layering bugs (elements hidden behind `overflow:hidden` + `position:absolute` siblings)
- `const`/`let` temporal-dead-zone errors (a function called early in script
  execution that references a `const` declared later in the file)
- Any other runtime error that only surfaces when the DOM actually exists

Both bugs fixed on 2026-06-17 ([postmortem](../../agents/logs/postmortem_2026-06-17.md))
were exactly this class of bug, and both passed JS syntax checks cleanly.

## Tier 1 — fast JSDOM smoke test (seconds, no server needed)

```bash
cd /Users/tamargrosz/AWEAR
export PATH="$HOME/.local/bin:$PATH"   # node lives in ~/.local/bin
npm run check-render                   # runs scripts/check-render.mjs (jsdom, installed)
```

Exit 1 on any uncaught runtime error at init (this caught the STREAK_KEY TDZ blank-screen,
2026-06-21). Necessary but not sufficient — it doesn't render pixels. Continue to Tier 2.

## Tier 2 — real headless browser (the merge gate)

### Dev server

Check if it's already running before starting a new one — don't kill an existing server,
another agent or the user may be relying on it.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/   # 200 = already up
```

If not running:

```bash
cd /Users/tamargrosz/AWEAR
source venv312/bin/activate
nohup uvicorn app:app --host 0.0.0.0 --port 8000 --reload > /tmp/uvicorn.log 2>&1 & disown
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/
```

### Playwright (already installed in venv312 — verify, don't reinstall)

```bash
source /Users/tamargrosz/AWEAR/venv312/bin/activate
python3 -c "import playwright; print('ok')"   # verified working in this env
# Only if the import fails: pip install playwright && python3 -m playwright install chromium
```

### Drive + verify (run inline via Bash — adapt screen/localStorage flags as needed)

```bash
source /Users/tamargrosz/AWEAR/venv312/bin/activate && python3 - <<'EOF'
from playwright.sync_api import sync_playwright

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    page.goto("http://localhost:8000/", wait_until="load")
    page.evaluate("localStorage.setItem('awear_onboarded', '1')")  # skip onboarding if needed
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)

    page.screenshot(path="/tmp/verify_screen.png")
    print("ERRORS:", errors)
    browser.close()
EOF
```

Then:
1. **Read `ERRORS`** — anything non-empty is a blocker. `Cannot access 'X' before
   initialization` = TDZ bug (move the `const`/`let` declaration earlier).
   Any other uncaught exception = something crashed mid-render.
2. **Read the screenshot** (`/tmp/verify_screen.png`) with the Read tool — confirm the screen
   that should render is actually visible (not blank, not stuck on a loading/onboarding
   state unless that's expected).
3. Check `#<container>.innerHTML.length` via `page.eval_on_selector` if you need to confirm
   a specific render target actually populated (e.g. `#home-wrap`, `#feed-scroll`).

## Related gate — real-iPhone profile (Iron Rule #13)

UI changes must also pass `python3 scripts/check_notch.py` (viewport-fit=cover + safe-area
header @393x852) — the Dynamic Island collision was invisible to the 390px check alone.

## When to run this

Per Iron Rule #9 (`.claude/agents/docs/daily_model.md`): any commit that changes
`static/index.html` rendering (HTML structure, CSS affecting layout/visibility, or JS in
render functions) must pass this check before merge. Syntax-only checks are necessary
but not sufficient.
