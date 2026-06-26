// Screenshot a single AWEAR screen for the autopilot's Telegram reports.
//
// Usage:  node scripts/shot.mjs <view> <out.png>
//   <view>  e.g. feed | marketplace | outfits | chat | closet | home | profile | wardrobe
//   <out>   output PNG path (default /tmp/shot.png)
//
// Serves the repo so the SPA loads exactly as in production (API calls fall back to
// demo mode), navigates to the requested view via showView(), and captures a
// mobile-sized screenshot. Fails soft: prints an error and exits non-zero so the
// caller can fall back to a text report.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const view = process.argv[2] || 'feed';
const out = process.argv[3] || '/tmp/shot.png';

const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png',
  '.jpg':'image/jpeg', '.webp':'image/webp', '.ico':'image/x-icon' };

const server = http.createServer((req, res) => {
  try {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/' ) rel = '/static/index.html';
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
  try {
    await page.goto(`http://localhost:${port}/static/index.html`, { waitUntil: 'networkidle', timeout: 25000 });
    // Navigate to the requested view, tolerating either showView() or a nav button.
    await page.evaluate((v) => {
      try { if (typeof showView === 'function') showView(v); } catch {}
      const btn = document.querySelector(`[data-view="${v}"]`);
      if (btn) btn.click();
    }, view);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: out, fullPage: false });
    console.log('shot saved:', out);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(e => { console.error('shot failed:', e.message); server.close(); process.exit(1); });
