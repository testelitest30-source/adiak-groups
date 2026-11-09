#!/usr/bin/env node
/* Dev-only: renders every raster brand asset from the vector sources in assets/brand/.
   Usage: node scripts/gen-brand.cjs   (needs Playwright/Chromium and ImageMagick `convert` for favicon.ico)
   Sources of truth: assets/brand/adiak-mark-{purple,black,white}.svg (hand-built vector paths). */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const R = path.resolve(__dirname, '..');
const svg = n => fs.readFileSync(path.join(R, 'assets/brand', n), 'utf8');
const CANVAS = '#F4F1FD', NAVY = '#1C1F38';
const RES = path.join(R, 'android/app/src/main/res');
const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

async function render(page, { mark, size, w, h, frac, bg }) {
  w = w || size; h = h || size;
  const m = Math.round(Math.min(w, h) * frac);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;display:grid;place-items:center;background:${bg || 'transparent'}">
    <div style="width:${m}px;height:${m}px">${svg(mark).replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
  return page.screenshot({ omitBackground: !bg, type: 'png' });
}
const out = (p, buf) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); };

(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ deviceScaleFactor: 1 });
  // ---- web / PWA (purple mark) ----
  fs.writeFileSync(path.join(R, 'assets/icons/favicon.svg'), svg('adiak-mark-purple.svg'));
  out(path.join(R, 'assets/icons/icon-192.png'), await render(page, { mark: 'adiak-mark-purple.svg', size: 192, frac: .78, bg: CANVAS }));
  out(path.join(R, 'assets/icons/icon-512.png'), await render(page, { mark: 'adiak-mark-purple.svg', size: 512, frac: .78, bg: CANVAS }));
  out(path.join(R, 'assets/icons/icon-maskable-512.png'), await render(page, { mark: 'adiak-mark-purple.svg', size: 512, frac: .56, bg: CANVAS }));
  out(path.join(R, 'assets/icons/apple-touch-icon.png'), await render(page, { mark: 'adiak-mark-purple.svg', size: 180, frac: .74, bg: CANVAS }));
  const tmp = []; for (const s of [16, 32, 48]) { const f = path.join(require('os').tmpdir(), `fav${s}.png`); out(f, await render(page, { mark: 'adiak-mark-purple.svg', size: s, frac: .96 })); tmp.push(f); }
  execFileSync('convert', [...tmp, path.join(R, 'favicon.ico')]);
  // ---- Android launcher: black mark, transparent background (owner decision) ----
  for (const [d, k] of Object.entries(DPI)) {
    const dir = path.join(RES, `mipmap-${d}`);
    const legacy = await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(48 * k), frac: .86 });
    out(path.join(dir, 'ic_launcher.png'), legacy); out(path.join(dir, 'ic_launcher_round.png'), legacy);
    // adaptive layers are 108dp; the visible safe zone is the central 66dp circle
    const fg = await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(108 * k), frac: .56 });
    out(path.join(dir, 'ic_launcher_foreground.png'), fg); out(path.join(dir, 'ic_launcher_monochrome.png'), fg);
    // Android 12+ splash icon: 288dp canvas, icon must sit inside the 192dp circle
    out(path.join(RES, `drawable-${d}`, 'splash_icon.png'), await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(288 * k), frac: .5 }));
    out(path.join(RES, `drawable-night-${d}`, 'splash_icon.png'), await render(page, { mark: 'adiak-mark-white.svg', size: Math.round(288 * k), frac: .5 }));
    // legacy (< Android 12) full-screen splash
    for (const [o, w, h] of [['port', 320, 480], ['land', 480, 320]]) {
      out(path.join(RES, `drawable-${o}-${d}`, 'splash.png'), await render(page, { mark: 'adiak-mark-black.svg', w: Math.round(w * k), h: Math.round(h * k), frac: .28, bg: CANVAS }));
      out(path.join(RES, `drawable-night-${o}-${d}`, 'splash.png'), await render(page, { mark: 'adiak-mark-white.svg', w: Math.round(w * k), h: Math.round(h * k), frac: .28, bg: NAVY }));
    }
  }
  out(path.join(RES, 'drawable', 'splash.png'), await render(page, { mark: 'adiak-mark-black.svg', w: 480, h: 320, frac: .28, bg: CANVAS }));
  out(path.join(RES, 'drawable-night', 'splash.png'), await render(page, { mark: 'adiak-mark-white.svg', w: 480, h: 320, frac: .28, bg: NAVY }));
  await b.close(); console.log('brand assets generated');
})();
