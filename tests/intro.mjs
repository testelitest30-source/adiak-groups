// Launch animation (assets/js/shared/intro.js): sequence, timing, colours, reduced motion, skip, once per session.
// Usage: node tests/intro.mjs   (serves the repo itself; Supabase is blocked, nothing is sent anywhere)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html"));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : f.endsWith(".svg") ? "image/svg+xml" : "text/html" }); s.end(d); }); }).listen(0);
const URL0 = `http://127.0.0.1:${srv.address().port}/index.html`;
let pass = 0, fail = 0; const ok = (c, n) => { c ? pass++ : fail++; console.log((c ? "  ok   " : "  FAIL ") + n); };
const b = await chromium.launch();
async function open({ native = false, reduce = false, scheme = "light" } = {}) {
  const c = await b.newContext({ viewport: { width: 420, height: 800 }, serviceWorkers: "block", colorScheme: scheme, reducedMotion: reduce ? "reduce" : "no-preference" });
  await c.route(/supabase\.co/, r => r.abort());
  if (native) await c.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; });
  const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(URL0); return { c, p, errs };
}
const fill = (p, sel) => p.$eval(`#adiak-intro ${sel}`, e => getComputedStyle(e).fill).catch(() => null);
const op = (p, id) => p.$eval(`#${id}`, e => +getComputedStyle(e).opacity).catch(() => null);

{ const { c, p, errs } = await open();
  ok(await p.$("#adiak-intro") !== null, "web: intro overlay shown on first load");
  await p.waitForTimeout(150);
  ok((await fill(p, ".m1")) === "rgb(121, 89, 214)", "web: logo purple from the start (#7959D6)");
  ok((await op(p, "ai-adiak")) < 0.2, "step 1: wordmark hidden while the logo grows");
  await p.waitForTimeout(1000);
  ok((await op(p, "ai-adiak")) > 0.9, "step 2: ADİAK has entered");
  const tx = await p.$eval("#ai-team", e => new DOMMatrix(getComputedStyle(e).transform).m41).catch(() => 0);
  await p.waitForTimeout(450);
  const tx2 = await p.$eval("#ai-team", e => new DOMMatrix(getComputedStyle(e).transform).m41).catch(() => 0);
  ok((await op(p, "ai-team")) > 0.9, "step 4: TEAM has risen");
  await p.waitForTimeout(500);
  const tx3 = await p.$eval("#ai-team", e => new DOMMatrix(getComputedStyle(e).transform).m41).catch(() => 0);
  ok(tx2 > 50 && Math.abs(tx3) < tx2, "step 5: MAKER pushes TEAM toward the logo (" + Math.round(tx2) + " → " + Math.round(tx3) + ")");
  await p.waitForTimeout(1400);
  ok(await p.$("#adiak-intro") === null, "step 6: overlay removed after ~2.8 s (hand-over)");
  ok(await p.$(".card.login") !== null, "app is usable after the intro");
  await p.reload(); ok(await p.$("#adiak-intro") === null, "runs only once per session (reload = no intro)");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs[0] : ""));
  void tx; await c.close(); }

{ const { c, p } = await open({ native: true });
  await p.waitForTimeout(60);
  ok((await fill(p, ".m1")) === "rgb(0, 0, 0)", "app: logo starts black (launcher icon)");
  await p.waitForTimeout(1100);
  ok((await fill(p, ".m1")) === "rgb(121, 89, 214)", "app: logo turns purple while growing");
  await c.close(); }

{ const { c, p } = await open({ native: true, scheme: "dark" });
  await p.waitForTimeout(60);
  ok((await fill(p, ".m1")) === "rgb(255, 255, 255)", "app dark mode: starts white (black would be invisible)");
  await c.close(); }

{ const { c, p } = await open({ reduce: true });
  ok((await fill(p, ".m1")) === "rgb(121, 89, 214)", "reduced motion: static lockup");
  await p.waitForTimeout(900);
  ok(await p.$("#adiak-intro") === null, "reduced motion: gone within 0.9 s");
  await c.close(); }

{ const { c, p } = await open();
  await p.waitForTimeout(300); await p.click("#adiak-intro");
  await p.waitForTimeout(500);
  ok(await p.$("#adiak-intro") === null, "tap skips the animation");
  await c.close(); }

await b.close(); srv.close();
console.log(`intro: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
