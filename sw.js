/* sw.js - service worker: sayt tətbiq kimi yüklənə bilsin və şəbəkə yox olanda açılış ekranı görünsün.
   Qayda: həmişə ƏVVƏL İNTERNETDƏN yükləyir (yeni versiya dərhal görünür), internet yoxdursa yaddaşdakı surəti göstərir.
   Supabase və başqa saytlara (başqa mənbə) toxunmur. */
const V = "adiak-v10"; // v9: ADIAK 1.0 brand (logo, launch animation) // v8: + admin "Ledger" (admin-ui.css + admin şriftləri); v7: Purple Edition tələbə saytı — versiya artırılır ki, köhnə keş silinsin
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "assets/vendor/supabase.js",
  "assets/css/tokens.css", "assets/css/style.css", "assets/css/features.css", "assets/css/purple.css", "assets/css/admin.css", "assets/css/admin-ui.css",
  "assets/fonts/inter-latin-wght-normal.woff2", "assets/fonts/inter-latin-ext-wght-normal.woff2",
  "assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2", "assets/fonts/plus-jakarta-sans-latin-ext-wght-normal.woff2",
  "assets/js/shared/intro.js", "assets/js/shared/config.js", "assets/js/shared/i18n.js", "assets/js/shared/icons.js",
  "assets/js/app/core.js", "assets/js/app/pages.js", "assets/js/app/extras.js", "assets/js/app/pres.js", "assets/js/app/live.js", "assets/js/app/studio.js", "assets/js/app/main.js", "assets/js/app/native.js",
  "admin/index.html", "assets/js/admin/admin.js", "assets/js/admin/i18n-admin.js",
  "assets/icons/favicon.svg", "favicon.ico",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || (r.mode === "navigate" ? caches.match(/\/admin\/?$/.test(u.pathname) ? "admin/index.html" : "index.html") : Response.error())))
  );
});
