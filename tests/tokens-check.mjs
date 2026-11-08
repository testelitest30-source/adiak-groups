// assets/css/tokens.css yoxlaması: light / dark / auto (sistem) dəyərləri, WCAG kontrastı, şriftlər.
// İşə salmaq: node tests/tokens-check.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { serve } from "./lib/server.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const srv = await serve(ROOT);
const browser = await chromium.launch();
const fails = [], notes = [];

// [ön plan, fon, minimum nisbət, izah]
const PAIRS = [
  ["--adia-text", "--adia-background", 4.5, "text on canvas"],
  ["--adia-text", "--adia-surface", 4.5, "text on surface"],
  ["--adia-secondary", "--adia-background", 4.5, "secondary on canvas"],
  ["--adia-secondary", "--adia-surface", 4.5, "secondary on surface"],
  ["--adia-primary-text", "--adia-background", 4.5, "accent text on canvas"],
  ["--adia-primary-text", "--adia-surface", 4.5, "accent text on surface"],
  ["--adia-chip-text", "--adia-chip-bg", 4.5, "chip text on chip"],
  ["--adia-on-primary", "--adia-primary-fill", 4.5, "on-primary on fill"],
  ["--adia-on-primary", "--adia-primary-fill-hover", 4.5, "on-primary on fill hover"],
  ["--adia-nav-active-text", "--adia-nav-active-bg", 4.5, "active nav"],
  ["--adia-bubble-out-text", "--adia-bubble-out-bg", 4.5, "outgoing bubble"],
  ["--adia-bubble-in-text", "--adia-bubble-in-bg", 4.5, "incoming bubble"],
  ["--adia-success", "--adia-surface", 4.5, "success text"], ["--adia-success", "--adia-success-bg", 4.5, "success on its bg"],
  ["--adia-warning", "--adia-surface", 4.5, "warning text"], ["--adia-warning", "--adia-warning-bg", 4.5, "warning on its bg"],
  ["--adia-danger", "--adia-surface", 4.5, "danger text"], ["--adia-danger", "--adia-danger-bg", 4.5, "danger on its bg"],
  ["--adia-info", "--adia-surface", 4.5, "info text"], ["--adia-info", "--adia-info-bg", 4.5, "info on its bg"],
  ["--adia-border-input", "--adia-surface", 3, "input border (non-text 3:1)"],
  ["--adia-primary", "--adia-surface", 3, "icon / large accent (3:1)"],
  ["--adia-focus", "--adia-surface", 3, "focus indicator (3:1)"],
];

async function readVars(scheme, theme) {
  const ctx = await browser.newContext({ colorScheme: scheme });
  const page = await ctx.newPage();
  // Yalnız tokens.css qoşulmuş saxta səhifə (repo-da belə fayl yoxdur; route ilə verilir)
  await page.route(srv.origin + "/__tokens.html", (r) => r.fulfill({ contentType: "text/html", body: `<!doctype html><html ${theme ? `data-theme="${theme}"` : ""}><head><link rel="stylesheet" href="/assets/css/tokens.css"></head><body>x</body></html>` }));
  await page.goto(srv.origin + "/__tokens.html");
  const vars = await page.evaluate((names) => {
    const cs = getComputedStyle(document.documentElement), probe = document.createElement("i"); document.body.appendChild(probe);
    const o = {};
    for (const n of names) { const raw = cs.getPropertyValue(n).trim(); probe.style.color = ""; probe.style.color = raw; o[n] = { raw, rgb: probe.style.color ? getComputedStyle(probe).color : null }; }
    o.__all = [...cs].filter((k) => k.startsWith("--adia-")).sort().map((k) => k + ":" + cs.getPropertyValue(k).trim()).join(";");
    return o;
  }, [...new Set(PAIRS.flatMap((p) => [p[0], p[1]]))]);
  let fonts = null;
  if (!theme && scheme === "light") {
    fonts = await page.evaluate(async () => {
      const az = "ƏəĞğIıİiÖöŞşÜüÇç";
      await Promise.all(['400 16px "Inter"', '700 16px "Inter"', '700 16px "Sora"'].map((f) => document.fonts.load(f, az)));
      const used = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family + " " + f.unicodeRange.slice(0, 12));
      // Sora-da Ə/ə varmı? Sora → monospace fallback ilə ölçü fərqi
      const w = (font, t) => { const c = document.createElement("canvas").getContext("2d"); c.font = font; return c.measureText(t).width; };
      const soraSchwa = w('700 40px "Sora", monospace', "Əə") !== w("700 40px monospace", "Əə");
      const interSchwa = w('400 40px "Inter", monospace', "Əə") !== w("400 40px monospace", "Əə");
      return { used, soraSchwa, interSchwa };
    });
  }
  await ctx.close();
  return { vars, fonts };
}

const lum = (rgb) => { const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map((x) => +x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const modes = {
  light: await readVars("light", "light"), dark: await readVars("light", "dark"),
  autoLight: await readVars("light", null), autoDark: await readVars("dark", null),
};
if (modes.autoLight.vars.__all !== modes.light.vars.__all) fails.push("auto (system light) tokens differ from [data-theme=light]");
if (modes.autoDark.vars.__all !== modes.dark.vars.__all) fails.push("auto (system dark) tokens differ from [data-theme=dark] — keep both dark blocks identical");
if (modes.light.vars.__all === modes.dark.vars.__all) fails.push("dark theme is not applied");

for (const m of ["light", "dark"]) {
  const v = modes[m].vars;
  for (const [fg, bg, min, what] of PAIRS) {
    if (!v[fg].rgb || !v[bg].rgb) { fails.push(`${m}: ${fg} or ${bg} is not a color`); continue; }
    const r = ratio(v[fg].rgb, v[bg].rgb);
    const line = `${m.padEnd(5)} ${r.toFixed(2).padStart(5)} ≥ ${min}  ${what}`;
    (r + 1e-9 < min ? fails : notes).push(line);
  }
}
const f = modes.autoLight.fonts;
if (!f.interSchwa) fails.push("Inter does not render Ə/ə");
if (!f.soraSchwa) notes.push("WARNING Sora has no Ə/ə glyph — headings fall back to Inter for that letter (owner decision pending)");
notes.push("fonts loaded: " + f.used.join(" | "));

await browser.close(); srv.close();
notes.forEach((n) => console.log("  " + n));
fails.forEach((n) => console.log("✘ " + n));
console.log(fails.length ? `${fails.length} FAILED` : "ALL PASSED");
process.exit(fails.length ? 1 : 0);
