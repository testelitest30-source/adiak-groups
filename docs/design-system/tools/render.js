// Renders every board of boards.html to a 2x PNG, then names them.
// Not part of the website/APK build. Needs Playwright (preinstalled in CI images / `npx playwright`).
// usage (repo root):  python3 -m http.server 8765 &   node docs/design-system/tools/render.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'boards-png');
const NAMES = ['01-design-review', '02-foundations', '03-iconography', '04-components-actions-forms', '05-components-data-display', '06-components-navigation-feedback', '07-components-chat', '08-screens-desktop-light-1', '09-screens-desktop-light-2', '10-screens-desktop-dark-1', '11-screens-desktop-dark-2', '12-screens-mobile', '13-implementation-guide'];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1760, height: 1300 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => errs.push('failed ' + r.url()));
  await p.goto(process.env.BOARDS_URL || 'http://127.0.0.1:8765/docs/design-system/boards.html');
  await p.waitForSelector('body[data-ready="1"]'); await p.evaluate(() => document.fonts.ready);
  const ids = await p.$$eval('.board', a => a.map(x => x.id));
  for (const [i, id] of ids.entries()) await (await p.$('#' + id)).screenshot({ path: `${OUT}/${NAMES[i] || id}.png` });
  console.log(ids.length + ' boards', errs.length ? 'ERRORS ' + errs.join('; ') : 'no errors');
  await b.close(); if (errs.length) process.exit(1);
})();
