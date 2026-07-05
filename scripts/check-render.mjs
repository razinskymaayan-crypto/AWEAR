// Lightweight runtime/render smoke test for static/index.html.
//
// WHY: `node --check` only proves the JS *parses*. It does NOT catch runtime
// errors that fire during page init — e.g. Temporal Dead Zone bugs like
// "Cannot access 'STREAK_KEY' before initialization", which blanked the whole
// app on 2026-06-21 yet passed the syntax check. This loads the real HTML in a
// JSDOM window, runs the inline scripts, and FAILS (exit 1) on any uncaught
// runtime error. Fast (no browser download) so it can run in the cloud routine
// and in /ship before every push.
//
// Run: node scripts/check-render.mjs   (needs: npm install)
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const target = process.argv[2]
  ? new URL(process.argv[2], `file://${process.cwd()}/`)
  : new URL('../static/index.html', import.meta.url);
let html = readFileSync(target, 'utf8');

// The SPA was split out of index.html into /static/app.css + /static/app.js. JSDOM only
// executes INLINE <script>, so re-inline the external files here (function replacement so
// literal `$` in the source isn't treated as a regex substitution). No-ops on an unsplit
// file, so this stays backward-compatible.
const baseDir = dirname(fileURLToPath(target));
html = html.replace(/<link rel="stylesheet" href="\/static\/app\.css">/,
  () => `<style>${readFileSync(resolve(baseDir, 'app.css'), 'utf8')}</style>`);
html = html.replace(/<script src="\/static\/app\.js"><\/script>/,
  () => `<script>${readFileSync(resolve(baseDir, 'app.js'), 'utf8')}</script>`);
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push(e.message + (e.detail ? ` :: ${e.detail}` : '')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',     // execute the inline <script> (the whole SPA)
  pretendToBeVisual: true,
  url: 'http://localhost:8000/', // so relative /api and /static URLs are well-formed
  virtualConsole: vc,
});
dom.window.addEventListener('error', (e) => errors.push(e.error?.message || e.message));

// Give async-ish init a tick to settle, then report.
setTimeout(() => {
  // Ignore benign network failures (no server in this harness): i18n XHR / api fetch.
  const real = errors.filter((m) => !/Failed to (load|fetch)|NetworkError|ECONNREFUSED|Not implemented: (XMLHttpRequest|navigation|HTMLCanvas)/i.test(m));
  if (real.length) {
    console.error('✗ RUNTIME ERRORS during render:\n  - ' + real.join('\n  - '));
    process.exit(1);
  }
  console.log('✓ render OK — no uncaught runtime errors at init');
  process.exit(0);
}, 1500);
