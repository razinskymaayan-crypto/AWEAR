// Interaction smoke test — the "sense" the autonomous agents were missing.
//
// WHY: check-render only proves the page LOADS. It cannot catch an interaction bug like
// "the item sheet opens but the X won't close it" — the class of bug a human hits and the
// agents never could, because they read code + static screenshots, never USE the app.
// This drives a real browser: it OPENS each overlay/sheet and asserts it actually CLOSES
// (via the X button) and unlocks the page. Exit 1 on any stuck overlay.
//
// Run: node scripts/check-interactions.mjs   (needs the server on :8000 + playwright)
import http from 'node:http';
import { chromium } from 'playwright';

const BASE = process.env.AWEAR_URL || 'http://localhost:8000/';

// tiny wait-for-server so it works in CI right after `uvicorn ... &`
async function waitServer(url, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const ok = await new Promise((res) => {
      const r = http.get(url, (x) => { x.resume(); res(x.statusCode < 500); });
      r.on('error', () => res(false)); r.setTimeout(1000, () => { r.destroy(); res(false); });
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

if (!(await waitServer(BASE))) { console.error('✗ server not reachable at ' + BASE); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

// skip the onboarding gate so we land on the real app
await page.addInitScript(() => { try { localStorage.setItem('awear_onboarded', '1'); } catch (_) {} });
await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForTimeout(1200);

const results = [];

// Each case: open an overlay via a JS call, then assert the X/close actually dismisses it.
// sheetSel: plain ID string ('my-id') → getElementById; starts with '.' or '#' → querySelector.
// Checks both .show (most sheets) and .open (comments-sheet) for open state.
async function testOverlay(name, sheetSel, closeSel, openFn) {
  try {
    await page.evaluate(openFn);
    // wait for the open animation to settle (a real user taps the X where they SEE it, on a
    // still sheet — not a moving target). Then tap it like a user.
    await page.waitForTimeout(650);
    const isOpen = (sel) => {
      const el = /^[.#[]/.test(sel) ? document.querySelector(sel) : document.getElementById(sel);
      if (!el) return false;
      if (el.classList.contains('show') || el.classList.contains('open')) return true;
      const cs = getComputedStyle(el);
      const ah = el.getAttribute('aria-hidden');
      return cs.display !== 'none' && cs.visibility !== 'hidden' && (ah === null || ah === 'false');
    };
    const opened = await page.evaluate(isOpen, sheetSel);
    await page.click(closeSel, { timeout: 2500 });
    await page.waitForTimeout(500);
    const stillOpen = await page.evaluate(isOpen, sheetSel);
    const bodyLocked = await page.evaluate(() => document.body.classList.contains('sheet-open'));
    results.push({ name, opened, closed: !stillOpen, unlocked: !bodyLocked });
  } catch (e) {
    results.push({ name, opened: false, closed: false, unlocked: false, err: String(e) });
  }
}

// 1) The item / buy sheet (the one the founder hit: "opens but won't close")
await testOverlay('buy-sheet (item)', 'buy-sheet', '#sheet-close', () => {
  window.openSheetSingle && openSheetSingle(
    { name: 'Linen Blazer', brand_vibe: 'Everlane', price_estimate_usd: 120, search_query: 'linen blazer', category: 'tops' }, 5, 'tamar');
});

// 2) The global Create menu
await testOverlay('create menu', 'create-overlay', '#create-overlay', () => {
  window.openCreateMenu && openCreateMenu();
});

// 3) Marketplace filter sheet
// The sheet lives inside #marketplace .view which is display:none when inactive.
// position:fixed children are still hidden under a display:none parent, so
// we must navigate to the marketplace view first.
await page.evaluate(() => { window.showView && showView('marketplace'); });
await page.waitForTimeout(400);
await testOverlay('filter sheet (mp-fsheet)', 'mp-fsheet', '#mp-fsheet-close', () => {
  window.openMPFilterSheet && openMPFilterSheet();
});

// 4) Store insight sheet (also inside #marketplace)
await testOverlay('store insight sheet', 'ms-insight-sheet', '#ms-insight-close', () => {
  window.openStoreInsight && openStoreInsight();
});

// 5) Comments sheet (dynamically appended; uses .open class, not .show)
await testOverlay('comments sheet', '.comments-sheet', '.cs-close-btn', () => {
  window.openCommentsSheet && openCommentsSheet('post_001');
});

// 6) Edit profile overlay
await testOverlay('edit-profile overlay', 'edit-profile-overlay', '#edit-profile-close', () => {
  window.openEditProfile && openEditProfile();
});

// 7) Sell-form (purchase-modal) — close via aria-label="Close" X button in header
await testOverlay('sell-form (purchase-modal)', 'purchase-modal', '#purchase-modal [aria-label="Close"]', () => {
  window.openSellForm && openSellForm();
});

// 8) Diary sheet (dynamically appended; uses .show on the overlay)
await testOverlay('diary sheet', 'diary-overlay', '.diary-x-close', () => {
  window.showDiaryModal && showDiaryModal();
});

// 9) Book sheet (dynamically appended; removed from DOM on cancel — no .show class)
await page.evaluate(() => { window.showView && showView('outfits'); });
await page.waitForTimeout(400);
await testOverlay('book sheet', 'book-overlay-el', '.book-cancel', () => {
  window.openBooking && openBooking('stylist_1', 'Abigail Osei');
});

await browser.close();

let failed = false;
for (const r of results) {
  const ok = r.opened && r.closed && r.unlocked;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${r.name}: opened=${r.opened} closed=${r.closed} pageUnlocked=${r.unlocked}${r.err ? ' err=' + r.err : ''}`);
}
if (pageErrors.length) console.log('page errors: ' + pageErrors.slice(0, 3).join(' | '));
if (failed) { console.error('\n✗ INTERACTION FAIL — an overlay opened but did not close/unlock (the "stuck sheet" class).'); process.exit(1); }
console.log('\n✓ interactions OK — overlays open and close cleanly.');
process.exit(0);
