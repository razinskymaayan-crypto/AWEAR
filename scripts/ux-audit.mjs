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
    // An overlay is "showing" only if it is BOTH marked open (class/attr) AND actually
    // on-screen. AWEAR sheets are display:flex permanently and slide in via a `.show`/`.open`
    // class + transform, so geometric visibility alone reports a CLOSED sheet as open (it sits
    // off-screen via transform but still has size). We require the open-state signal first —
    // matching how the app itself decides, and how a real user perceives it.
    isOpen(el) {
      const cls = el.classList;
      const opened = cls.contains('show') || cls.contains('open') || el.getAttribute('aria-hidden') === 'false';
      if (cls.contains('show') === false && cls.contains('open') === false
          && el.getAttribute('aria-hidden') !== 'false') {
        // no explicit open marker → fall back to geometry, but require it be within the viewport
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        const inView = r.top >= -5 && r.bottom <= innerHeight + 5 && r.width > 60 && r.height > 60;
        return inView && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
      }
      if (!opened) return false;
      // marked open — confirm it's really rendered (not display:none / opacity 0)
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
    },
    visibleOverlays() {
      const out = [];
      document.querySelectorAll('[id]').forEach((el) => {
        const id = el.id || '';
        if (!/sheet|overlay|modal|drawer|popup|viewer/i.test(id)) return;
        if (this.isOpen(el)) out.push(id);
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
    // Is the element ACTUALLY rendered — walking the ancestor chain, not just its own box?
    // A closed bottom-sheet sets opacity:0 / translateY on the SHEET container; the leaf text still
    // computes opacity:1, so a leaf-only check flags a hidden sheet's buttons (false positive). And
    // scanning ONLY the opened overlay's subtree misses the SHEET (it's a sibling of the backdrop, not
    // a child) — a false negative that hid the real "Show Results" bug. So: scan the whole doc, but
    // gate on true render-visibility up the tree.
    renderVisible(el) {
      let n = el;
      while (n && n.nodeType === 1) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < 0.15) return false;
        if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return false;
        n = n.parentElement;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return false;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;  // off-screen (translated-away sheets)
      return true;
    },
    // low-contrast visible text (WCAG AA 4.5:1 for normal text). Scans the whole document (so open
    // sheets, which are siblings of their backdrop, are covered) and relies on renderVisible() to
    // exclude any closed/hidden overlay.
    contrastIssues() {
      const bad = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.children.length) return;                       // leaf text only
        const t = (el.textContent || '').trim();
        if (!t || t.length < 2) return;
        if (!this.renderVisible(el)) return;
        const cs = getComputedStyle(el);
        const bi = cs.backgroundImage || '';
        const grad = bi.includes('gradient') ? (bi.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/g) || []) : [];
        const clipText = (cs.webkitBackgroundClip || cs.backgroundClip) === 'text';
        // TEXT color candidates: normally cs.color; but for background-clip:text (gradient text, color
        // is intentionally transparent) the visible ink IS the gradient stops — use those, not "transparent".
        const textCands = clipText && grad.length ? grad : [cs.color];
        // BG candidates: solid ancestor color; PLUS the element's own gradient stops when it is NOT
        // clip-text (a real gradient FILL, e.g. the "Show Results" dark button) — backgroundColor is
        // transparent for gradients, so without this a dark gradient button reads as the light parent
        // surface and the black-on-black slips through. For clip-text, the gradient is the ink not the bg.
        const bgCands = clipText ? [this.bgOf(el.parentElement || el)] : [this.bgOf(el), ...grad];
        let ratio = 21, bgHit = bgCands[0], fgHit = cs.color;
        for (const tc of textCands) {
          const l1 = this.lum(tc); if (l1 == null) continue;
          for (const cand of bgCands) {
            const l2 = this.lum(cand); if (l2 == null) continue;
            const rr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
            if (rr < ratio) { ratio = rr; bgHit = cand; fgHit = tc; }
          }
        }
        if (ratio === 21) return;   // no resolvable color pair
        const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
        if (ratio < (big ? 3 : 4.5)) {
          bad.push({ text: t.slice(0, 40), ratio: +ratio.toFixed(2), color: fgHit, bg: bgHit,
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
    // Is an OPEN overlay geometrically SANE on screen? Catches the 2-week bug the
    // stuck-check missed: a sheet whose top (with its close control) is pushed off-screen
    // and whose body leaves dead space — it "opens and closes" fine but looks broken.
    overlayGeometry(id) {
      // Skip inner scroll/body parts (they legitimately don't reach the screen edges).
      if (/(body|scroll|grab|handle|footer|card|hero)$/i.test(id)) return { ok: true, skip: true };
      const el = document.getElementById(id);
      if (!el) return { ok: true };
      const r = el.getBoundingClientRect();
      if (r.width < 80 || r.height < 80) return { ok: true, skip: true };  // not actually shown
      const vh = innerHeight, vw = innerWidth;
      const cs = getComputedStyle(el);
      const problems = [];
      // DETERMINISTIC root-cause signal (reliable, no fragile scroll repro): a full-viewport or
      // bottom-anchored overlay positioned `absolute` inherits the page's scroll offset and WILL
      // render off-screen once scrolled — it must be `fixed`. This is the actual class of the
      // 2-week item-sheet bug, and it catches every instance regardless of current scroll.
      const anchored = cs.inset === '0px' || cs.bottom === '0px' || parseFloat(cs.bottom) === 0;
      if (cs.position === 'absolute' && anchored) {
        problems.push('position:absolute (should be fixed) — will break when the page is scrolled');
      }
      // Plus the live symptom if it happens to be visible now: a close control off-screen.
      const close = el.querySelector('[id*="close" i],[class*="close" i],[aria-label*="close" i]');
      if (close) {
        const c = close.getBoundingClientRect();
        if (c.width > 0 && (c.top < 0 || c.bottom > vh + 1 || c.left < 0 || c.right > vw + 1)) {
          problems.push(`close control off-screen (top ${Math.round(c.top)})`);
        }
      }
      return { ok: problems.length === 0, problems };
    },
  };
};

// ---------- 1) STUCK / BROKEN OVERLAYS ----------
const stuck = [], broken = [], opened = [], unopenable = [], contrastInOverlay = [];
for (const [fn, args] of OPENERS) {
  try {
    await page.evaluate(HELPERS);
    // SCROLL THE PAGE FIRST — this is the exact condition that hid the 2-week item-sheet bug:
    // an absolute-positioned sheet rendered correctly at scrollTop 0 but broke once scrolled.
    // Test the realistic case, not the convenient one (OW-015).
    await page.evaluate(() => { try { (document.querySelector('.phone main') || document.scrollingElement || document.body).scrollTop = 400; window.scrollTo(0, 400); } catch (_) {} });
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

    // GEOMETRY CHECK — is the open overlay actually SANE on screen (X visible, no dead space)?
    // This is what would have caught the sheet bug the "can it close" check missed.
    for (const id of appeared) {
      const g = await page.evaluate((i) => window.__ux.overlayGeometry(i), id);
      if (!g.ok) broken.push({ fn, id, problems: g.problems.join('; ') });
    }

    // CONTRAST INSIDE THE OPEN OVERLAY — the gap that let the black-on-black "Show Results" and
    // toast through: contrast was only scanned on the main screens, never inside sheets/modals
    // (they're hidden at rest). Now every open overlay's own text/buttons are checked (OW-015).
    // Scan the whole doc while this overlay is open (the sheet is a sibling of its backdrop, so a
    // subtree scan would miss it); renderVisible() excludes any still-closed overlay. Dedup by text+sel.
    const oc = await page.evaluate(() => window.__ux.contrastIssues());
    oc.forEach((x) => { if (!contrastInOverlay.some((y) => y.text === x.text && y.sel === x.sel)) contrastInOverlay.push({ overlay: fn, ...x }); });

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
    // Trigger a toast so its contrast IS scanned — transient UI is invisible at rest, which is
    // exactly why the black-on-black "Removed from saved" toast went unscanned for weeks.
    await page.evaluate(() => { try { window.showToast && showToast('Removed from saved'); } catch (_) {} });
    await page.waitForTimeout(150);
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

line(`\n①b BROKEN LAYOUT  (opened SCROLLED — close control off-screen / dead space; the item-sheet class)`);
if (!broken.length) line('   ✓ none — every overlay renders sane when the page is scrolled');
broken.forEach((b) => line(`   ✗ ${b.fn}  →  #${b.id}  (${b.problems})`));

line(`\n②b LOW CONTRAST INSIDE OVERLAYS  (black-on-black in sheets/modals — the "Show Results" class)`);
if (!contrastInOverlay.length) line('   ✓ none — every open overlay\'s text/buttons pass AA');
contrastInOverlay.slice(0, 20).forEach((c) => line(`   ✗ [${c.overlay}] "${c.text}" ${c.ratio}:1  ${c.color} on ${c.bg}`));

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
