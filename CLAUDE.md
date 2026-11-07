# CLAUDE.md — ADIAK Team Maker

## Architecture
- Static vanilla HTML/CSS/JS. **No framework, no bundler, no build step for the website.** Do not migrate to one.
  If a future native plugin needs bundling, use the smallest possible separate bundle.
- Entry points: `index.html` (student app), `admin/index.html` (admin panel). App start: `boot()` in `assets/js/app/main.js`.
- `assets/js/shared/` (config, i18n, icons), `assets/js/app/` (core, pages, extras, main), `assets/js/admin/`, `assets/css/`, `assets/icons/`.
- `assets/vendor/supabase.js` = `@supabase/supabase-js` **2.45.4** UMD, vendored. No CDN dependencies. Do not upgrade it unless asked.
- UI uses inline SVG icons (`icons.js`) and no gradients. Do not redesign.

## Script loading order (do not change)
- App: `vendor/supabase.js → config.js → i18n.js → icons.js → core.js → pages.js → extras.js → main.js`
- Admin: `vendor/supabase.js → config.js → i18n.js → icons.js → i18n-admin.js → admin.js`
- These are plain global scripts; the check script at the bottom of each page depends on these globals.

## GitHub Pages
- Deploys from branch `main`, folder `/ (root)`. No Pages workflow, no build.
- `index.html`, `sw.js`, `manifest.webmanifest`, `favicon.ico` must stay at the root.
- Everything committed is publicly served, so never commit secrets.

## Supabase & auth
- Project ref `epenklutnevjvgpsjehp`. `config.js` holds only the URL and the public anon key. Never put the service_role key in the repo.
- Auth: `signInWithPassword` with `<id>@classroom.app`. Single-device rule via `claim_session` / `kickedOut()`. **Do not change auth or claim_session.**
- All tables use RLS. Verify Supabase state with read-only queries; never assume it.
- An existing push pipeline lives only in Supabase (not in the repo): trigger `tg_push` on `messages` →
  edge function `push-send` (web-push/VAPID); tables `push_subs`, `push_config`; RPCs `save_push`, `drop_push`, `push_targets`.
  Edge function `feedback-notify` also exists. Change these only within an approved phase, and only additively.

## Service worker (`sw.js`)
- Network-first, same-origin only; precaches the `SHELL` list (includes `assets/vendor/supabase.js`).
- Bump `V` (currently `adiak-v5`) whenever `SHELL` or asset paths change.
- Registration in `index.html` is skipped in native Capacitor (`Capacitor.isNativePlatform()`); websites register normally.

## Android / Capacitor (Phase 2)
- Pinned: Capacitor core/cli/android **8.6.0** (exact), Node **22**, JDK **21** (Temurin), AGP **8.13.0**, Gradle **8.14.3**, compile/target SDK **36**, minSdk **24**.
- `appId` `az.adiak.teammaker`, `webDir` `www` (gitignored, never the repo root).
- `npm ci && npm run build && npx cap sync android`, then `cd android && ./gradlew assembleDebug`.
- `scripts/build-www.mjs` copies an allowlist (`index.html`, `favicon.ico`, `manifest.webmanifest`, `sw.js`, `admin/`, `assets/`)
  and fails on any unresolved page/manifest/SW reference. **Add new top-level runtime files to its allowlist.**
- Capacitor serves the root `index.html` for extensionless paths, so in-app links to the admin panel must be `admin/index.html`, never `admin/`.
- CI: `.github/workflows/android.yml` builds the debug APK artifact `adiak-debug-apk`, with no secrets.
- `android/` is committed; build output, `local.properties`, `assets/public` and generated plugin folders are ignored by `android/.gitignore`.

## Token efficiency
- Read only the files you need; use grep and line ranges. Do not re-audit the repo or dump whole files.
- Keep reports short: changed files, commit, tests, results, open issues.

## Android plan (one phase at a time, each needs explicit approval)
1. **Offline web**: vendored supabase-js, SW precache, native SW guard. *(done)*
2. **Capacitor shell + GitHub Actions debug APK.** *(this phase)*
3. **FCM push**: Firebase Messaging plugin (verify its API for the pinned Capacitor version); additive Supabase changes
   (FCM tokens in `push_subs`, FCM branch in `push-send`, `FCM_SERVICE_ACCOUNT` as a Supabase secret).
   Signed APKs on GitHub Releases for `v*` tags (keystore and passwords only in GitHub Secrets) come in a separately approved step.
4. *(optional)* Finish Web Push for the website.

## Hard rules
- **Never commit or push to `main` directly.** Use feature branches + PRs; never merge without the owner's approval.
- **Never start a phase that has not been explicitly approved.**
- **Never expose or commit secrets**: Firebase config/service accounts, `google-services.json`, keystores, passwords, service_role keys, `push_config` values.
- No UI redesign, no unrelated dependency upgrades, no unnecessary architecture changes.
- Verify changes (e.g. Playwright against `python3 -m http.server`) and report results honestly, including what could not be tested.
