// Screenshot the item bottom-sheet (the "WOW" screen) for autopilot Telegram reports.
// The sheet is a triggered overlay, not a showView() route, so we seed a closet and
// call openSheetItem() directly with a representative tagged item.
//
// Usage:  node scripts/shot_sheet.mjs <out.png>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || '/tmp/sheet.png';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png',
  '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };

const server = http.createServer((req, res) => {
  try {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/static/index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end('err'); }
});

async function main() {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.error('playwright not installed'); process.exit(2); }
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  // Seed onboarding + a small closet so the match band + stylist combos render.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('awear_onboarded', '1');
      localStorage.setItem('awear_wardrobe', JSON.stringify([
        { name:'Cream knit cardigan', category:'top', color:'cream', style_tags:['minimal','knit','neutral'], price_estimate_usd:60 },
        { name:'High-rise straight jeans', category:'bottoms', color:'indigo', style_tags:['denim','casual','classic'], price_estimate_usd:80 },
        { name:'White leather sneakers', category:'shoes', color:'white', style_tags:['minimal','casual','clean'], price_estimate_usd:95 },
      ]));
    } catch {}
  });
  try {
    await page.goto(`http://localhost:${port}/static/index.html`, { waitUntil: 'networkidle', timeout: 25000 });
    await page.evaluate(() => {
      const item = {
        name: 'Tailored wool blazer',
        category: 'outerwear',
        color: 'camel',
        brand_vibe: 'Modern editorial',
        style_tags: ['minimal','neutral','classic','tailored'],
        price_estimate_usd: 140,
        search_query: 'camel tailored wool blazer women',
        buy_options: [
          { retailer:'ZARA', scope:'global', url:'https://www.zara.com' },
          { retailer:'ASOS', scope:'global', url:'https://www.asos.com' },
          { retailer:'Mango', scope:'global', url:'https://shop.mango.com' },
        ],
      };
      try { openSheetItem(item, []); } catch (e) { console.error('openSheetItem failed', e.message); }
    });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: out, fullPage: false });
    console.log('sheet shot saved:', out);
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch(e => { console.error('shot failed:', e.message); server.close(); process.exit(1); });
