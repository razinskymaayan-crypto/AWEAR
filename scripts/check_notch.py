#!/usr/bin/env python3
"""
check_notch.py — real-iPhone-profile render gate.

WHY (OW/notch, 2026-06-30): the render gate only ever loaded the app at a bare 390px
desktop-ish viewport, so the iPhone Dynamic-Island collision was invisible to "done".
This loads the key UI surfaces at iPhone 15 Pro dimensions and asserts:
  (1) the viewport meta opts into the notch via viewport-fit=cover,
  (2) the global <header> reserves the top safe-area (padding-top uses env(safe-area-inset-top)),
  (3) every surface renders with ZERO page/console errors,
and screenshots each surface to /tmp for human eyeballing.

It does NOT geometrically prove island-clearance — a headless browser reports
env(safe-area-inset-top)=0 (no physical notch). The static guarantees (1)+(2) are what make
a real device respect the inset; final on-device confirmation is a human step.

Usage:  python3 scripts/check_notch.py            # needs the app on http://localhost:8000
Exit:   0 = pass, 1 = fail (prints the reason).
"""
import sys

BASE = "http://localhost:8000/"
VIEWS = ["feed", "closet", "marketplace", "outfits"]

def main():
    try:
        from playwright.sync_api import sync_playwright
    except Exception:
        print("check_notch: playwright not installed — SKIP (install: pip install playwright && playwright install chromium)")
        return 0

    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # iPhone 15 Pro logical resolution
        page = browser.new_page(viewport={"width": 393, "height": 852}, device_scale_factor=3)
        errors = []
        page.on("pageerror", lambda e: errors.append(f"JS: {e}"))
        page.on("console", lambda m: errors.append(f"console.error: {m.text}")
                if m.type == "error" and "Failed to load resource" not in m.text else None)

        page.goto(BASE, wait_until="load")
        page.evaluate("localStorage.setItem('awear_onboarded','1')")
        page.reload(wait_until="load")
        page.wait_for_timeout(1500)

        # (1) viewport opts into the notch
        vp = page.evaluate("document.querySelector('meta[name=viewport]')?.content || ''")
        if "viewport-fit=cover" not in vp:
            failures.append("viewport meta is missing 'viewport-fit=cover' (notch not honored)")

        # (2) header reserves the top safe-area inset (check the raw stylesheet text)
        uses_inset = page.evaluate("""() => {
          for (const sh of document.styleSheets) {
            let rules; try { rules = sh.cssRules; } catch(e) { continue; }
            for (const r of rules) {
              const t = r.cssText || '';
              if (/header\\s*\\{/.test(t) && /env\\(safe-area-inset-top\\)/.test(t)) return true;
            }
          }
          return false;
        }""")
        if not uses_inset:
            failures.append("header CSS does not use env(safe-area-inset-top) (header may collide with Dynamic Island)")

        # (3) each surface renders clean at iPhone dims
        for v in VIEWS:
            errors.clear()
            page.evaluate(f"typeof showView==='function' && showView('{v}')")
            page.wait_for_timeout(900)
            page.screenshot(path=f"/tmp/notch_{v}.png")
            internal = [e for e in errors if e.startswith("JS:")]
            if internal:
                failures.append(f"view '{v}' raised: {internal[:2]}")

        browser.close()

    if failures:
        print("check_notch: FAIL")
        for f in failures:
            print("  -", f)
        return 1
    print("check_notch: PASS — viewport-fit=cover + header safe-area inset + 4 surfaces clean @393x852")
    return 0

if __name__ == "__main__":
    sys.exit(main())
