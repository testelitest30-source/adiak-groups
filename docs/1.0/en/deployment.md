# Deployment

* **Database**: apply approved batches in order (A → M6 → C/M9 → B pg_cron), each after a backup and a `tests/db/parity.sql` check; rename files to the recorded versions.
* **Edge function**: deploy `supabase/functions/push-fcm` (needs `FCM_SERVICE_ACCOUNT_JSON`, already created).
* **Website**: merge the 1.0 PR into `main` (GitHub Pages) — or Vercel (`npm run build` → `www/`). Service worker version `adiak-v10` refreshes caches.
* **Android**: push tag `v1.0.0` → `release.yml` builds signed APK + AAB and a draft GitHub Release.
* **Custom domain**: add it in Vercel/GitHub Pages, keep HTTPS on; no code change needed (relative paths).
All of these steps need the owner's explicit approval.
