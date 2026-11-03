/* sw.js - service worker: sayt tətbiq kimi yüklənə bilsin və şəbəkə yox olanda açılış ekranı görünsün.
   Qayda: həmişə ƏVVƏL İNTERNETDƏN yükləyir (yeni versiya dərhal görünür), internet yoxdursa yaddaşdakı surəti göstərir.
   Supabase və başqa saytlara (başqa mənbə) toxunmur. */
const V = "adiak-v3"; // versiya artırılır ki, köhnə fayl yolları olan keş silinsin
const SHELL = [
  "./", "index.html", "manifest.webmanifest",
  "assets/css/style.css", "assets/css/features.css",
  "assets/js/shared/config.js", "assets/js/shared/i18n.js",
  "assets/js/app/core.js", "assets/js/app/pages.js", "assets/js/app/extras.js", "assets/js/app/main.js",
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
      .catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
