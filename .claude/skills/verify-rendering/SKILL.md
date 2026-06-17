---
description: Verify AWEAR's static SPA actually renders in a real browser (not just JS syntax check) — loads a screen via headless Playwright, captures console/page errors, and screenshots it. Required before merging any commit that touches static/index.html rendering (DOM/CSS/JS), per daily_model.md Iron Rule #9.
---

# Verify Rendering — AWEAR

This app is a single-page HTML/CSS/JS app (`static/index.html`, no framework)
served by FastAPI (`app.py`). JS syntax validation (e.g. running the script
through JavaScriptCore) only proves the code *parses* — it does not catch:

- CSS layering bugs (elements hidden behind `overflow:hidden` + `position:absolute` siblings)
- `const`/`let` temporal-dead-zone errors (a function called early in script
  execution that references a `const` declared later in the file)
- Any other runtime error that only surfaces when the DOM actually exists

Both bugs fixed on 2026-06-17 ([postmortem](../../../agents/postmortem_2026-06-17.md))
were exactly this class of bug, and both passed JS syntax checks cleanly.

## Dev server

Check if it's already running before starting a new one — don't kill an
existing server, another agent or the user may be relying on it.

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

## Playwright setup (one-time per environment)

```bash
source /Users/tamargrosz/AWEAR/venv312/bin/activate
python3 -c "import playwright" 2>/dev/null || pip install playwright
python3 -m playwright install chromium   # no-op if already installed
```

## Drive + verify

Write a small driver script (adapt the screen/localStorage flags as needed —
e.g. set `awear_onboarded` to skip the onboarding screen and reach the home
screen directly):

```python
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
```

Run it, then:
1. **Read `ERRORS`** — anything non-empty is a blocker. `Cannot access 'X' before
   initialization` = TDZ bug (move the `const`/`let` declaration earlier).
   Any other uncaught exception = something crashed mid-render.
2. **Read the screenshot** with the Read tool — confirm the screen that should
   render is actually visible (not blank, not stuck on a loading/onboarding
   state unless that's expected).
3. Check `#<container>.innerHTML.length` via `page.eval_on_selector` if you
   need to confirm a specific render target actually populated (e.g.
   `#home-wrap`, `#feed-scroll`).

## When to run this

Per daily_model.md Iron Rule #9: any commit that changes `static/index.html`
rendering (HTML structure, CSS affecting layout/visibility, or JS in render
functions) must pass this check before merge. Syntax-only checks (JSC) are
necessary but not sufficient.
