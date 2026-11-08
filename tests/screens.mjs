// Bütün əsas ekranların ekran şəkilləri (Supabase saxta) + sadə keyfiyyət yoxlamaları.
// node tests/screens.mjs <etiket> [--widths=360,390,430,768,1280,1440] [--themes=light,dark] [--only=home,chat,...]
// Nəticə: tests/out/<etiket>/screens/<ekran>-<en>-<mövzu>.png və report.json
// Yoxlamalar (hər ekranda): üfüqi daşma yoxdur, səhifə xətası yoxdur, telefonda tabbar düymələri ≥44px,
// açıq çatda yazı sahəsi ekranın içindədir, heç bir sorğu saxta olmayan serverə getmir.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { serve } from "./lib/server.mjs";
import { mockSupabase } from "./lib/mock-supabase.mjs";
import { IDS, fakeSession, fakeNotes } from "./lib/fixtures.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, "").split("=")));
const LABEL = process.argv[2] || "latest";
const WIDTHS = (args.widths || "360,390,430,768,1280,1440").split(",").map(Number);
const THEMES = (args.themes || "light,dark").split(",");
const ONLY = args.only ? new Set(args.only.split(",")) : null;
const OUT = join(ROOT, "tests", "out", LABEL, "screens");
await mkdir(OUT, { recursive: true });
const HEIGHT = (w) => (w <= 430 ? 860 : w <= 768 ? 1024 : 860);

// Ekranlar mövcud funksiyalarla açılır (yalnız göstərmək üçün; heç bir məlumat yazılmır)
const RESET = `(()=>{try{if(typeof palOpen!=="undefined"&&palOpen)closePal()}catch(e){}try{if(pm)closeProfile()}catch(e){}
  try{const m=document.getElementById("modal");if(m)m.innerHTML=""}catch(e){}
  menuOpen=false;conv=null;sheet=false;sp=null;openG=null;tab="home";render()})()`;
const STUDENT = [
  ["home", ""],
  ["groups", "goTab('groups')"],
  ["group", "goTab('groups',1)"],
  ["chat-list", "goTab('chat')"],
  ["chat", "openChat('g:1')"],
  ["notes", "goTab('notes')"],
  ["requests", "goTab('req')"],
  ["tools", "goTab('tools')"],
  ["settings", "goTab('settings')"],
  ["profile", `showProfile('${IDS.student2}')`],
  ["dialog", "ask(tr('Are you sure you want to log out?'),()=>{})"],
  ["toast", "toast(tr('Saved'))"],
  ["menu", "if(phone()){menuOpen=true;render()}else openPalette()"],
];
const ADMIN = ["dash", "people", "person", "groups", "classes", "tags", "feedback", "chats", "pass", "day", "import", "settings"];

const srv = await serve(ROOT);
const browser = await chromium.launch();
const report = [], problems = [];
let leaks = [];

async function ctxFor(user, width, theme, path) {
  const context = await browser.newContext({ viewport: { width, height: HEIGHT(width) }, colorScheme: theme, serviceWorkers: "block", deviceScaleFactor: 1, hasTouch: width <= 800 });
  const log = await mockSupabase(context, srv.origin);
  const s = user ? fakeSession(user) : null;
  await context.addInitScript(([s, theme, uid, notes]) => {
    try {
      localStorage.setItem("lang", "az"); localStorage.setItem("theme", theme);
      if (s) { localStorage.setItem(s.key, s.value); localStorage.setItem("sid", "mock-sid"); localStorage.setItem("notes:" + uid, JSON.stringify(notes)); }
    } catch (e) {}
  }, [s, theme, user, fakeNotes()]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.goto(srv.origin + path);
  return { context, page, log, errors };
}
async function checks(page, name, width) {
  const r = await page.evaluate((w) => {
    const out = {};
    out.overflow = document.documentElement.scrollWidth > innerWidth + 1;
    const tb = [...document.querySelectorAll("#tabbar .tb")].map((b) => b.getBoundingClientRect()).filter((b) => b.height < 44 || b.width < 44).length;
    out.smallTargets = w <= 800 ? tb : 0;
    const tx = document.querySelector("#sheet.chat #tx, .chat2 #tx");
    if (tx) { const b = tx.getBoundingClientRect(); out.composerVisible = b.bottom <= innerHeight + 1 && b.top >= 0; }
    return out;
  }, width);
  if (r.overflow) problems.push(`${name}: horizontal overflow`);
  if (r.smallTargets) problems.push(`${name}: ${r.smallTargets} tabbar targets < 44px`);
  if (r.composerVisible === false) problems.push(`${name}: chat composer outside viewport`);
  return r;
}
const shot = async (page, name) => { await page.waitForTimeout(350); await page.screenshot({ path: join(OUT, name + ".png") }); };

for (const theme of THEMES) for (const w of WIDTHS) {
  // Giriş ekranı
  if (!ONLY || ONLY.has("login")) {
    const e = await ctxFor(null, w, theme, "/index.html"); await e.page.waitForSelector("#idin");
    const n = `login-${w}-${theme}`; report.push([n, await checks(e.page, n, w)]); await shot(e.page, n);
    leaks.push(...e.log.leaks); e.errors.forEach((x) => problems.push(`${n}: page error ${x}`)); await e.context.close();
  }
  // Tələbə ekranları
  const st = STUDENT.filter(([k]) => !ONLY || ONLY.has(k));
  if (st.length) {
    const e = await ctxFor(IDS.student, w, theme, "/index.html");
    await e.page.waitForSelector(w <= 800 ? "#tabbar" : "aside.side"); await e.page.waitForTimeout(500);
    for (const [k, js] of st) {
      await e.page.evaluate(RESET); if (js) await e.page.evaluate(js);
      const n = `${k}-${w}-${theme}`; await e.page.waitForTimeout(250);
      report.push([n, await checks(e.page, n, w)]); await shot(e.page, n);
    }
    leaks.push(...e.log.leaks); e.errors.forEach((x) => problems.push(`student ${w} ${theme}: page error ${x}`)); await e.context.close();
  }
  // Admin paneli
  const ad = ADMIN.filter((k) => !ONLY || ONLY.has("admin-" + k) || ONLY.has("admin"));
  if (ad.length) {
    const e = await ctxFor(IDS.admin, w, theme, "/admin/index.html");
    await e.page.waitForSelector("aside.side .nav button"); await e.page.waitForTimeout(400);
    for (const k of ad) {
      if (k === "person") await e.page.evaluate((id) => { switchTab("people"); person(id); }, IDS.student2);
      else await e.page.evaluate((k) => { const m = document.getElementById("modal"); if (m) m.innerHTML = ""; switchTab(k); }, k);
      const n = `admin-${k}-${w}-${theme}`; await e.page.waitForTimeout(300);
      report.push([n, await checks(e.page, n, w)]); await shot(e.page, n);
    }
    leaks.push(...e.log.leaks); e.errors.forEach((x) => problems.push(`admin ${w} ${theme}: page error ${x}`)); await e.context.close();
  }
}
await browser.close(); srv.close();
if (leaks.length) problems.push("requests leaked to a non-mocked host: " + leaks.slice(0, 3).join(", "));
await writeFile(join(OUT, "report.json"), JSON.stringify({ report, problems }, null, 1));
console.log(`${report.length} screenshots → tests/out/${LABEL}/screens/`);
problems.forEach((p) => console.log("✘ " + p));
console.log(problems.length ? `${problems.length} PROBLEMS` : "NO PROBLEMS");
process.exit(problems.length ? 1 : 0);
