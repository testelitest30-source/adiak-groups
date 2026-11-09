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

// outline: optional thin white halo (px) traced from the mark's own alpha (feMorphology dilate), owner decision 2026-11-09:
// keeps the black launcher mark visible on dark wallpapers without changing its shape.
async function render(page, { mark, size, w, h, frac, bg, outline }) {
  w = w || size; h = h || size;
  const m = Math.round(Math.min(w, h) * frac);
  const fx = outline ? `<svg width="0" height="0" style="position:absolute"><filter id="ol" x="-10%" y="-10%" width="120%" height="120%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="${outline}" result="d"/><feFlood flood-color="#fff"/>
    <feComposite in2="d" operator="in" result="w"/><feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter></svg>` : '';
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;display:grid;place-items:center;background:${bg || 'transparent'}">${fx}
    <div style="width:${m}px;height:${m}px;${outline ? 'filter:url(#ol)' : ''}">${svg(mark).replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
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
  // ---- Android launcher: black mark, transparent background, thin white outline (owner decisions) ----
  for (const [d, k] of Object.entries(DPI)) {
    const dir = path.join(RES, `mipmap-${d}`);
    const ol = Math.max(1, Math.round(.75 * k));   // ≈ 0.75 dp white outline (launcher icons only)
    const legacy = await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(48 * k), frac: .84, outline: ol });
    out(path.join(dir, 'ic_launcher.png'), legacy); out(path.join(dir, 'ic_launcher_round.png'), legacy);
    // adaptive layers are 108dp; only the central 66dp circle is guaranteed visible (round masks clip the rest)
    // farthest point ≈ 32.4 dp incl. the 0.75 dp outline: inside the 33 dp safe circle. Monochrome (themed icons) stays outline-free.
    out(path.join(dir, 'ic_launcher_foreground.png'), await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(108 * k), frac: .44, outline: ol }));
    out(path.join(dir, 'ic_launcher_monochrome.png'), await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(108 * k), frac: .44 }));
    // status-bar notification icon: white silhouette on transparent (24dp)
    out(path.join(RES, `drawable-${d}`, 'ic_stat_adiak.png'), await render(page, { mark: 'adiak-mark-white.svg', size: Math.round(24 * k), frac: .92 }));
    // Android 12+ splash icon: 288dp canvas, icon must sit inside the 192dp circle
    out(path.join(RES, `drawable-${d}`, 'splash_icon.png'), await render(page, { mark: 'adiak-mark-black.svg', size: Math.round(288 * k), frac: .5 }));
    out(path.join(RES, `drawable-night-${d}`, 'splash_icon.png'), await render(page, { mark: 'adiak-mark-white.svg', size: Math.round(288 * k), frac: .5 }));
    // legacy (< Android 12) full-screen splash
    for (const [o, w, h] of [['port', 320, 480], ['land', 480, 320]]) {
      out(path.join(RES, `drawable-${o}-${d}`, 'splash.png'), await render(page, { mark: 'adiak-mark-black.svg', w: Math.round(w * k), h: Math.round(h * k), frac: .28, bg: CANVAS }));
      out(path.join(RES, `drawable-${o}-night-${d}`, 'splash.png'), await render(page, { mark: 'adiak-mark-white.svg', w: Math.round(w * k), h: Math.round(h * k), frac: .28, bg: NAVY }));
    }
  }
  out(path.join(RES, 'drawable', 'splash.png'), await render(page, { mark: 'adiak-mark-black.svg', w: 480, h: 320, frac: .28, bg: CANVAS }));
  out(path.join(RES, 'drawable-night', 'splash.png'), await render(page, { mark: 'adiak-mark-white.svg', w: 480, h: 320, frac: .28, bg: NAVY }));
  await b.close(); console.log('brand assets generated');
})();
