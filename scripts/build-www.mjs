// Stages the static website into www/ (Capacitor webDir) and checks that every
// local file referenced by the pages, the manifest and the service worker exists.
// The website itself (GitHub Pages, repo root) is not changed by this script.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "www");

// Runtime files only. Add new top-level runtime files/folders here.
const INCLUDE = ["index.html", "favicon.ico", "manifest.webmanifest", "sw.js", "admin", "assets"];
const SKIP = new Set([".DS_Store", "Thumbs.db"]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const p of INCLUDE) {
  const src = join(ROOT, p);
  if (!existsSync(src)) fail(`missing source: ${p}`);
  cpSync(src, join(OUT, p), { recursive: true, filter: s => !SKIP.has(s.split(/[\\/]/).pop()) });
}

// Capacitor runtime + App plugin (official no-bundler builds) for assets/js/app/native.js.
// APK only: they live in node_modules (lockfile-pinned) and are never committed or published to the website.
const NATIVE = {
  "assets/vendor/capacitor/capacitor.js": "node_modules/@capacitor/core/dist/capacitor.js",
  "assets/vendor/capacitor/app.js": "node_modules/@capacitor/app/dist/plugin.js",
  "assets/vendor/capacitor/push.js": "node_modules/@capacitor/push-notifications/dist/plugin.js",
};
for (const [dest, src] of Object.entries(NATIVE)) {
  if (!existsSync(join(ROOT, src))) fail(`missing ${src} (run npm ci)`);
  mkdirSync(dirname(join(OUT, dest)), { recursive: true });
  cpSync(join(ROOT, src), join(OUT, dest));
}
// Build stamp shown by native.js (APK only) so the installed APK can be matched to its commit/run.
const stamp = { version: JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version, sha: (process.env.HEAD_SHA || "local").slice(0, 7), run: process.env.RUN_NUMBER || "local" };
writeFileSync(join(OUT, "assets/vendor/capacitor/build.js"), `window.ADIAK_BUILD=${JSON.stringify(stamp)};\n`);

// Verify references, resolved the same way a browser resolves them.
const missing = [];
const check = (fromFile, ref) => {
  if (!ref || /^(?:[a-z]+:|\/\/|#|data:)/i.test(ref) || ref.includes("${")) return;
  const rel = posix.normalize(posix.join(posix.dirname(fromFile), ref.split(/[?#]/)[0]));
  const target = rel.endsWith("/") || rel === "." ? posix.join(rel, "index.html") : rel;
  if (!existsSync(join(OUT, target))) missing.push(`${fromFile} -> ${ref}`);
};

for (const page of ["index.html", "admin/index.html"]) {
  const html = readFileSync(join(OUT, page), "utf8");
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) check(page, m[1]);
}
const manifest = JSON.parse(readFileSync(join(OUT, "manifest.webmanifest"), "utf8"));
for (const i of manifest.icons || []) check("manifest.webmanifest", i.src);
const sw = readFileSync(join(OUT, "sw.js"), "utf8");
const shell = sw.match(/const SHELL\s*=\s*\[([\s\S]*?)\]/);
if (!shell) fail("sw.js: SHELL list not found");
for (const m of shell[1].matchAll(/"([^"]+)"/g)) check("sw.js", m[1]);
// In-app links to the admin panel must name the file (Capacitor serves index.html for extensionless paths).
for (const f of ["assets/js/app/pages.js", "assets/js/app/extras.js"]) {
  const js = readFileSync(join(OUT, f), "utf8");
  for (const m of js.matchAll(/["'](admin\/[^"']*)["']/g)) {
    if (!m[1].endsWith(".html")) missing.push(`${f} -> ${m[1]} (use admin/index.html)`);
    else check("index.html", m[1]);
  }
}

// Files loaded at runtime by native.js
for (const m of readFileSync(join(OUT, "assets/js/app/native.js"), "utf8").matchAll(/"(assets\/[^"]+\.js)"/g)) check("index.html", m[1]);

if (missing.length) fail("unresolved references:\n  " + missing.join("\n  "));
console.log(`www/ ready: ${INCLUDE.join(", ")} (all references resolved)`);

function fail(msg) { console.error(`build-www: ${msg}`); process.exit(1); }
