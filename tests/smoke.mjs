// ADIAK UI smoke testləri (Playwright, Supabase tam saxta — production-a heç bir sorğu getmir).
// İşə salmaq: node tests/smoke.mjs [etiket]     (etiket: ekran şəkilləri qovluğu, məs. "baseline")
// Ekran şəkilləri: tests/out/<etiket>/  (gitignore-dadır)
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { serve } from "./lib/server.mjs";
import { mockSupabase } from "./lib/mock-supabase.mjs";
import { IDS, fakeSession } from "./lib/fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LABEL = process.argv[2] || "latest";
const OUT = join(ROOT, "tests", "out", LABEL);
await mkdir(OUT, { recursive: true });

const srv = await serve(ROOT);
const browser = await chromium.launch();
const results = [];
const allLeaks = [], allWrites = new Set();

async function open({ user = null, width = 1280, height = 800, scheme = "light", theme = null, path = "/index.html" } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, serviceWorkers: "block", deviceScaleFactor: 1 });
  const log = await mockSupabase(context, srv.origin);
  const s = user ? fakeSession(user) : null;
  await context.addInitScript(([s, theme]) => {
    try {
      if (sessionStorage.getItem("__seeded")) return;      // yalnız ilk açılışda (reload testləri üçün)
      sessionStorage.setItem("__seeded", "1");
      localStorage.setItem("lang", "az");
      if (theme) localStorage.setItem("theme", theme);
      if (s) { localStorage.setItem(s.key, s.value); localStorage.setItem("sid", "mock-sid"); }
    } catch (e) {}
  }, [s, theme]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(srv.origin + path);
  return { context, page, log, errors };
}
const settle = (page, ms = 600) => page.waitForTimeout(ms);
async function test(name, fn) {
  let env;
  try { env = await fn(); results.push([name, "PASS", ""]); }
  catch (e) { results.push([name, "FAIL", e.message.split("\n")[0]]); }
  finally {
    if (env) {
      allLeaks.push(...env.log.leaks); env.log.writes.forEach((w) => allWrites.add(w));
      if (env.errors.length) results.push([name + " (page errors)", "FAIL", env.errors[0]]);
      await env.context.close();
    }
  }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const shot = (page, n) => page.screenshot({ path: join(OUT, n + ".png") });

// 1. Giriş ekranı (sessiya yoxdur)
await test("login screen renders (AZ)", async () => {
  const env = await open({ width: 390, height: 844 });
  await env.page.waitForSelector("#idin");
  assert(await env.page.locator("#pw").count() === 1, "password field missing");
  assert((await env.page.textContent("body")).includes("Daxil ol"), "AZ login label missing");
  await shot(env.page, "login-390-light");
  return env;
});

// 2. Tələbə: masaüstü naviqasiya, rol görünüşü
await test("student desktop: side nav, real labels, no admin link", async () => {
  const env = await open({ user: IDS.student });
  const { page } = env;
  await page.waitForSelector("aside.side .nav button");
  const labels = await page.locator("aside.side .nav button").allTextContents();
  for (const l of ["Ana səhifə", "Qruplar", "Çat", "Bildirişlər", "Alətlər", "Ayarlar"]) assert(labels.some((t) => t.includes(l)), "nav label missing: " + l);
  assert(await page.locator('a.navlink[href="admin/index.html"]').count() === 0, "student must not see admin link");
  await page.locator("aside.side .nav button", { hasText: "Qruplar" }).click(); await settle(page);
  assert(await page.locator("aside.side .nav button.on", { hasText: "Qruplar" }).count() === 1, "Groups tab not active");
  assert((await page.evaluate(() => history.state && history.state.n)) >= 1, "navigation did not push history");
  await page.goBack(); await settle(page);
  assert(await page.locator("aside.side .nav button.on", { hasText: "Ana səhifə" }).count() === 1, "Back did not return to Home");
  return env;
});

// 3. Mövzu: auto → light → dark, reload-dan sonra qalır
await test("theme cycle + persistence after reload", async () => {
  const env = await open({ user: IDS.student });
  const { page } = env;
  await page.waitForSelector("aside.side .nav button");
  const attr = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  assert(await attr() === null, "default should be auto (no attribute)");
  const btn = page.locator('aside.side button[onclick="cycleTheme()"]');
  await btn.click(); await settle(page, 200); assert(await attr() === "light", "1st click → light");
  await btn.click(); await settle(page, 200); assert(await attr() === "dark", "2nd click → dark");
  await page.reload(); await page.waitForSelector("aside.side .nav button");
  assert(await attr() === "dark", "dark not persisted after reload");
  return env;
});

// 4. Modal: aç / Escape ilə bağla
await test("modal opens and closes with Escape", async () => {
  const env = await open({ user: IDS.student });
  const { page } = env;
  await page.waitForSelector("aside.side .nav button");
  await page.evaluate(() => confirmLogout());
  assert(await page.locator("#modal .ov").count() === 1, "modal did not open");
  await page.keyboard.press("Escape"); await settle(page, 200);
  assert(await page.locator("#modal .ov").count() === 0, "Escape did not close modal");
  return env;
});

// 5. Müəllim: sinif avtomatik açılır, admin linki görünür
await test("teacher: class auto-selected, admin link visible", async () => {
  const env = await open({ user: IDS.teacher });
  const { page } = env;
  await page.waitForSelector("aside.side .nav button");
  assert(await page.locator('a.navlink[href="admin/index.html"]').count() === 1, "teacher with panel perm should see admin link");
  assert((await page.textContent("aside.side")).includes("10A"), "class 10A not shown");
  return env;
});

// 6. Telefon: tabbar, drawer, çat açılanda yazı sahəsi görünür və tabbar gizlənir
await test("phone: tabbar, drawer, chat composer visible", async () => {
  const env = await open({ user: IDS.student, width: 390, height: 844 });
  const { page } = env;
  await page.waitForSelector("#tabbar .tb");
  assert(await page.locator("#tabbar .tb").count() === 5, "tabbar should have 5 buttons");
  await page.locator("#tabbar .tb").last().click(); await settle(page, 300);
  assert(await page.locator("#drawer").count() === 1, "drawer did not open");
  await page.locator("#scrim").click({ position: { x: 380, y: 400 } }); await settle(page, 300);
  assert(await page.locator("#drawer").count() === 0, "drawer did not close");
  await page.evaluate(() => openChat("g:1")); await settle(page);
  assert(await page.locator("#tabbar").count() === 0, "tabbar must hide in open chat");
  const box = await page.locator("#tx").boundingBox();
  assert(box && box.y + box.height <= 844 && box.y > 0, "composer not inside viewport");
  await shot(page, "chat-390-auto");
  return env;
});

// 7. Admin paneli: icazəyə görə bölmələr
await test("admin panel: tabs by permission", async () => {
  const count = async (user) => {
    const env = await open({ user, path: "/admin/index.html" });
    await settle(env.page, 1500);
    const n = await env.page.locator("aside.side .nav button").count();
    const txt = await env.page.textContent("body");
    if (user === IDS.admin) await shot(env.page, "admin-1280-auto");
    await env.context.close(); allLeaks.push(...env.log.leaks);
    return { n, txt };
  };
  const a = await count(IDS.admin), t = await count(IDS.teacher), s = await count(IDS.student);
  assert(a.n === 11, `admin should see 11 sections, saw ${a.n}`);
  assert(t.n === 3, `teacher (panel+points) should see 3 sections (dash, people, groups), saw ${t.n}`);   // TABS-da "panel" tələb edənlər
  assert(s.n === 0 && /No access|İcazə yoxdur|Giriş yoxdur/i.test(s.txt), "student must get No access");
  return null;
});

// 8. Ekran şəkilləri: tələbə ana səhifə 390/768/1280 × light/dark
for (const [w, h] of [[390, 844], [768, 1024], [1280, 800]]) for (const theme of ["light", "dark"]) {
  await test(`screenshot home ${w} ${theme}`, async () => {
    const env = await open({ user: IDS.student, width: w, height: h, theme, scheme: theme });
    await env.page.waitForSelector(w <= 800 ? "#tabbar" : "aside.side");
    await settle(env.page, 900);
    await shot(env.page, `home-${w}-${theme}`);
    return env;
  });
}

await test("no request reached a non-mocked host", async () => { assert(allLeaks.length === 0, "leaked: " + allLeaks.slice(0, 3).join(", ")); return null; });

await browser.close(); srv.close();
const w = Math.max(...results.map((r) => r[0].length));
for (const [n, s, m] of results) console.log(`${s === "PASS" ? "✔" : "✘"} ${n.padEnd(w)}  ${m}`);
console.log(`\nMocked writes observed (never sent to Supabase): ${[...allWrites].join(", ") || "none"}`);
console.log(`Screenshots: tests/out/${LABEL}/`);
const failed = results.filter((r) => r[1] === "FAIL").length;
console.log(failed ? `${failed} FAILED` : "ALL PASSED");
process.exit(failed ? 1 : 0);
