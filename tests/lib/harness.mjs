// Shared Playwright harness for the ADIAK UI tests (Supabase fully mocked; nothing reaches production).
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { serve } from "./server.mjs";
import { mockSupabase } from "./mock-supabase.mjs";
import { fakeSession } from "./fixtures.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export async function harness(label) {
  const OUT = join(ROOT, "tests", "out", label); await mkdir(OUT, { recursive: true });
  const srv = await serve(ROOT), browser = await chromium.launch(), results = [], leaks = [];
  async function open({ user = null, width = 1280, height = 800, scheme = "light", path = "/index.html", over = {}, native = false } = {}) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, serviceWorkers: "block", deviceScaleFactor: 1, hasTouch: width <= 800 });
    const log = await mockSupabase(context, srv.origin, over);
    const s = user ? fakeSession(user) : null;
    await context.addInitScript(([s, native]) => {
      try { sessionStorage.setItem("adiak-intro", "1"); if (sessionStorage.getItem("__seeded")) return; sessionStorage.setItem("__seeded", "1");
        localStorage.setItem("lang", "az"); if (s) { localStorage.setItem(s.key, s.value); localStorage.setItem("sid", "mock-sid"); } } catch (e) {}
      if (native) window.Capacitor = { isNativePlatform: () => true };
    }, [s, native]);
    const page = await context.newPage(); const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    await page.goto(srv.origin + path);
    return { context, page, log, errors };
  }
  async function test(name, fn) {
    let env;
    try { env = await fn(); results.push([name, "PASS", ""]); }
    catch (e) { results.push([name, "FAIL", String(e.message || e).split("\n")[0]]); }
    finally { if (env) { leaks.push(...env.log.leaks); if (env.errors.length) results.push([name + " (page errors)", "FAIL", env.errors[0]]); await env.context.close(); } }
  }
  const shot = (page, n) => page.screenshot({ path: join(OUT, n + ".png") });
  async function done() {
    await browser.close(); srv.close();
    if (leaks.length) results.push(["no request reached a non-mocked host", "FAIL", leaks[0]]); else results.push(["no request reached a non-mocked host", "PASS", ""]);
    for (const [n, r, m] of results) console.log((r === "PASS" ? "✔ " : "✘ ") + n + (m ? "  — " + m : ""));
    const f = results.filter(r => r[1] !== "PASS").length; console.log(f ? `${f} FAILED` : "ALL PASSED"); process.exit(f ? 1 : 0);
  }
  return { open, test, shot, done, OUT };
}
export const assert = (c, m) => { if (!c) throw new Error(m); };
export const settle = (page, ms = 700) => page.waitForTimeout(ms);
