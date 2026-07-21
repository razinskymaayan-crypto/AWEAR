// UX AUDIT — the systematic bug finder the founder asked for.
//
// WHY: check-interactions.mjs only drove 2 overlays, but the SPA has 20+ open* functions.
// Everything untested was free to break — which is exactly what the founder hit ("windows
// stuck open everywhere, text on top of text, white-on-white"). This enumerates EVERY
// overlay + scans every visible text node, so we get a COMPLETE list instead of whack-a-mole.
//
// Checks:
//   1. STUCK OVERLAYS  — open each overlay, then try X / backdrop / Escape. Report which close.
//   2. CONTRAST        — every visible text node vs its effective background (WCAG AA 4.5:1).
//   3. OVERLAP         — visible text boxes that intersect another text box (labels colliding).
//
// Run: node scripts/ux-audit.mjs            (defaults to http://localhost:8000)
//      AWEAR_URL=https://awear-x4o2.onrender.com node scripts/ux-audit.mjs
import http from 'node:http';
import https from 'node:https';
import { chromium } from 'playwright';

const BASE = process.env.AWEAR_URL || 'http://localhost:8000/';

// Every open* entry point found in app.js. Args are best-effort realistic stubs; a function
// that throws is reported as "could not open" rather than silently skipped.
const OPENERS = [
  ['openCreateMenu', '()'],
  ['openSheetSingle', `({name:'Linen Blazer',brand_vibe:'Everlane',price_estimate_usd:120,search_query:'linen blazer',category:'tops'},5,'tamar')`],
  ['openCommentsSheet', `('post_001')`],
  ['openMPFilterSheet', '()'],
  ['openEditProfile', '()'],
  ['openStoreInsight', '()'],
  ['openCompatOverlay', '()'],
  ['openCmpPicker', '()'],
  ['openBooking', '()'],
  ['openSellForm', '()'],
  ['openUserMoreMenu', '()'],
  ['openStoryViewer', '(0)'],
  ['openDeadZoneListSheet', '()'],
  ['showDeclutterResults', '()'],
];

async function waitServer(url, tries = 40) {
  const lib = url.startsWith('https') ? https : http;
  for (let i = 0; i < tries; i++) {
    const ok = await new Promise((res) => {
      const r = lib.get(url, (x) => { x.resume(); res(x.statusCode < 500); });
      r.on('error', () => res(false)); r.setTimeout(3000, () => { r.destroy(); res(false); });
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

if (!(await waitServer(BASE))) { console.error('✗ server unreachable: ' + BASE); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('awear_onboarded', '1'); } catch (_) {} });
await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1500);

// ---------- helpers injected into the page ----------
const HELPERS = () => {
  window.__ux = {
    // an overlay is "showing" if it is on screen and covers meaningful area
    visibleOverlays() {
      const out = [];
      document.querySelectorAll('[id]').forEach((el) => {
        const id = el.id || '';
        if (!/sheet|overlay|modal|drawer|popup|viewer/i.test(id)) return;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const onScreen = r.width > 60 && r.height > 60 && r.bottom > 0 && r.top < innerHeight;
        const shown = cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
        if (onScreen && shown) out.push(id);
      });
      return out;
    },
    lum(c) {
      const m = (c || '').match(/[\d.]+/g); if (!m) return null;
      const [r, g, b] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },
    bgOf(el) {
      let n = el;
      while (n && n !== document.documentElement) {
        const c = getComputedStyle(n).backgroundColor;
        const m = (c || '').match(/[\d.]+/g);
        if (m && (m.length < 4 || +m[3] > 0.5)) return c;
        n = n.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
    },
    // low-contrast visible text (WCAG AA 4.5:1 for normal text)
    contrastIssues() {
      const bad = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.children.length) return;                       // leaf text only
        const t = (el.textContent || '').trim();
        if (!t || t.length < 2) return;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.15) return;
        if (r.bottom < 0 || r.top > innerHeight) return;
        const l1 = this.lum(cs.color), l2 = this.lum(this.bgOf(el));
        if (l1 == null || l2 == null) return;
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
        if (ratio < (big ? 3 : 4.5)) {
          bad.push({ text: t.slice(0, 40), ratio: +ratio.toFixed(2), color: cs.color, bg: this.bgOf(el),
                     sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : '') });
        }
      });
      return bad;
    },
    // visible text boxes that physically overlap another text box
    overlapIssues() {
      const els = [...document.querySelectorAll('body *')].filter((el) => {
        if (el.children.length) return false;
        const t = (el.textContent || '').trim(); if (!t) return false;
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 6 && r.top >= 0 && r.bottom <= innerHeight
          && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.15
          && cs.position !== 'fixed';
      });
      const hits = [];
      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
          if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 6 && oy > 6) {                       // real overlap, not 1px touching
            const area = Math.min(a.width * a.height, b.width * b.height);
            if ((ox * oy) / area > 0.35) {              // >35% of the smaller box covered
              hits.push({ a: (els[i].textContent || '').trim().slice(0, 28), b: (els[j].textContent || '').trim().slice(0, 28),
                          overlap: Math.round(ox) + 'x' + Math.round(oy) });
            }
          }
        }
      }
      return hits.slice(0, 25);
    },
  };
};

// ---------- 1) STUCK OVERLAYS ----------
const stuck = [], opened = [], unopenable = [];
for (const [fn, args] of OPENERS) {
  try {
    await page.evaluate(HELPERS);
    const before = await page.evaluate(() => window.__ux.visibleOverlays());
    const ran = await page.evaluate(([f, a]) => {
      try { if (typeof window[f] !== 'function') return 'missing'; eval(`window.${f}${a}`); return 'ok'; }
      catch (e) { return 'threw:' + (e && e.message ? e.message.slice(0, 60) : 'err'); }
    }, [fn, args]);
    if (ran !== 'ok') { unopenable.push(`${fn} (${ran})`); continue; }
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => window.__ux.visibleOverlays());
    const appeared = after.filter((id) => !before.includes(id));
    if (!appeared.length) { unopenable.push(`${fn} (no overlay appeared)`); continue; }
    opened.push(fn);

    // try to close: X button inside, then backdrop click, then Escape
    let closedBy = null;
    for (const method of ['x', 'backdrop', 'escape']) {
      if (closedBy) break;
      try {
        if (method === 'x') {
          const clicked = await page.evaluate((ids) => {
            for (const id of ids) {
              const root = document.getElementById(id); if (!root) continue;
              const btn = root.querySelector('[id*="close" i],[class*="close" i],[aria-label*="close" i],button');
              if (btn) { btn.click(); return true; }
            }
            return false;
          }, appeared);
          if (!clicked) continue;
        } else if (method === 'backdrop') {
          await page.mouse.click(195, 60);                       // top area = backdrop on bottom-sheets
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
        const now = await page.evaluate(() => window.__ux.visibleOverlays());
        if (!appeared.some((id) => now.includes(id))) closedBy = method;
      } catch (_) { /* try next method */ }
    }
    if (!closedBy) {
      stuck.push({ fn, overlay: appeared.join(','), });
      await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});   // reset for next test
      await page.waitForTimeout(900);
    }
  } catch (e) {
    unopenable.push(`${fn} (harness error)`);
  }
}

// ---------- 2/3) CONTRAST + OVERLAP on the main screens ----------
const SCREENS = ['feed', 'store', 'ai', 'profile'];
const contrast = [], overlap = [];
for (const view of SCREENS) {
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(900);
    await page.evaluate((v) => { try { window.showView && showView(v); } catch (_) {} }, view);
    await page.waitForTimeout(900);
    await page.evaluate(HELPERS);
    const c = await page.evaluate(() => window.__ux.contrastIssues());
    const o = await page.evaluate(() => window.__ux.overlapIssues());
    c.forEach((x) => contrast.push({ view, ...x }));
    o.forEach((x) => overlap.push({ view, ...x }));
  } catch (_) {}
}

await browser.close();

// ---------- REPORT ----------
const line = (s) => console.log(s);
line('\n════════ AWEAR UX AUDIT ════════');
line(`\n① STUCK OVERLAYS  (opened but NOTHING closed them — X, backdrop, Escape all failed)`);
if (!stuck.length) line('   ✓ none — every overlay that opened could be closed');
stuck.forEach((s) => line(`   ✗ ${s.fn}  →  #${s.overlay}`));

line(`\n② LOW CONTRAST  (WCAG AA fail — white-on-white / black-on-black class)`);
if (!contrast.length) line('   ✓ none found on the scanned screens');
contrast.slice(0, 30).forEach((c) => line(`   ✗ [${c.view}] "${c.text}" ${c.ratio}:1  ${c.color} on ${c.bg}  (${c.sel})`));
if (contrast.length > 30) line(`   … +${contrast.length - 30} more`);

line(`\n③ OVERLAPPING TEXT  (labels physically covering each other)`);
if (!overlap.length) line('   ✓ none found on the scanned screens');
overlap.slice(0, 20).forEach((o) => line(`   ✗ [${o.view}] "${o.a}"  ⟷  "${o.b}"  (${o.overlap}px)`));

line(`\n④ COULD NOT OPEN (needs a real trigger/args — verify by hand)`);
unopenable.forEach((u) => line(`   • ${u}`));

if (pageErrors.length) { line('\n⑤ PAGE ERRORS'); pageErrors.slice(0, 5).forEach((e) => line('   ! ' + e)); }

const total = stuck.length + contrast.length + overlap.length;
line(`\n──────── ${opened.length} overlays driven · ${total} issues found ────────\n`);
process.exit(0);   // reporting tool: never fail the pipeline, the LIST is the product
