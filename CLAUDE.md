# CLAUDE.md — ADIAK Team Maker

## Architecture
- Static vanilla HTML/CSS/JS. **No framework, no bundler, no build step for the website.** Do not migrate to one.
  If a future native plugin needs bundling, use the smallest possible separate bundle.
- Entry points: `index.html` (student app), `admin/index.html` (admin panel). App start: `boot()` in `assets/js/app/main.js`.
- `assets/js/shared/` (config, i18n, icons), `assets/js/app/` (core, pages, extras, main), `assets/js/admin/`, `assets/css/`, `assets/icons/`.
- `assets/vendor/supabase.js` = `@supabase/supabase-js` **2.45.4** UMD, vendored. No CDN dependencies. Do not upgrade it unless asked.
- UI uses inline SVG icons (`icons.js`) and no gradients. Do not redesign.

## Script loading order (do not change)
- App: `vendor/supabase.js → config.js → i18n.js → icons.js → core.js → pages.js → extras.js → main.js → native.js`
- Admin: `vendor/supabase.js → config.js → i18n.js → icons.js → i18n-admin.js → admin.js → ../assets/js/app/native.js`
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
- Bump `V` (currently `adiak-v6`) whenever `SHELL` or asset paths change.
- Registration in `index.html` is skipped in native Capacitor (`Capacitor.isNativePlatform()`); websites register normally.

## Android / Capacitor (Phase 2 — done, verified on a Samsung Galaxy S25; PR #5 + PR #6)
- Pinned: Capacitor core/cli/android **8.6.0** (exact), Node **22**, JDK **21** (Temurin), AGP **8.13.0**, Gradle **8.14.3**, compile/target SDK **36**, minSdk **24**.
- `appId` `az.adiak.teammaker`, `webDir` `www` (gitignored, never the repo root).
- `npm ci && npm run build && npx cap sync android`, then `cd android && ./gradlew assembleDebug`.
- `scripts/build-www.mjs` copies an allowlist (`index.html`, `favicon.ico`, `manifest.webmanifest`, `sw.js`, `admin/`, `assets/`)
  and fails on any unresolved page/manifest/SW reference. **Add new top-level runtime files to its allowlist.**
- Capacitor serves the root `index.html` for extensionless paths, so in-app links to the admin panel must be `admin/index.html`, never `admin/`.
- `@capacitor/app` **8.1.2** (exact) handles the Android Back button. `assets/js/app/native.js` is a no-op on the web; in the app it loads
  `assets/vendor/capacitor/{capacitor,app}.js` (copied from `node_modules` by `build-www.mjs`, APK only, never committed) and maps Back to
  `nativeBack()`: close overlay → in-app back → reset to home → `App.exitApp()` on the home root.
- Admin page also loads `native.js` (vendor paths resolve from its own URL). The listener calls `adminBack()` when defined (`admin.js`):
  close modal → previous admin section (`admStack`, filters/search kept in globals, scroll restored) → at admin root `history.back()` to the student page.
  Admin sections never touch browser history.
- In-app navigation history (`pages.js`/`main.js`): `navStack[d]` = page at history depth `d` (`history.state.n`). Navigating to a page already
  in `navStack` truncates back to it (no duplicates); backward/in-place navigation must call `navSync()` and never push.
- Safe area (APK only): `index.html`/`admin/index.html` append a viewport meta without `viewport-fit=cover` when native, so Capacitor
  SystemBars pads the window and the WebView sits between the system bars (env() insets stay 0). Bar strips use the app `--bg`
  (`android/app/src/main/res/values{,-night}/app_colors.xml`, `windowBackground` in `styles.xml`). Do not remove `viewport-fit=cover` from the web meta.
- Phone chat: `#sheet.chat #msgs` is `calc(100% - 8px)` (its 8px top margin); `extras.js` keeps the list at the bottom on viewport resize (keyboard).
- CI: `.github/workflows/android.yml` builds the debug APK artifact `adiak-debug-apk-run<N>` (PRs to any branch, pushes to the Phase 2 branch, manual), with no secrets.
  `build-www.mjs` writes `www/assets/vendor/capacitor/build.js` (`window.ADIAK_BUILD = {sha, run}`, APK only) so an installed APK can be matched to its run.
- Vercel: `vercel.json` sets `outputDirectory` to `www` (Vercel runs `npm run build`).
- `android/` is committed; build output, `local.properties`, `assets/public` and generated plugin folders are ignored by `android/.gitignore`.

## Design System 1.0 (spec done, implementation NOT started — needs approval)
- Spec, boards, PDF and tokens live in `docs/design-system/` (`SPEC.md`, `tokens.css`, `boards.html`, `ADIAK_Design_System_1.0.pdf`).
- **Strict monochrome**: only the official tokens in `docs/design-system/tokens.css` (white/black/charcoal/neutral grey). No hue anywhere —
  not for errors, destructive actions, charts, badges, avatars, focus. State = contrast, weight, border style, icon, wording.
- Icons: SVG only (`icons.js`), 1.8 stroke, round caps/joins, `currentColor`; no emoji as UI icons (emoji only as user content).
- Font: Inter (self-hosted, OFL). Radius 10 controls / 14 cards / 16 dialogs; controls 40 px; spacing 4·8·12·16·24·32·48.
- Check: `python3 -I docs/design-system/tools/hue_scan.py <png>` must report 0 coloured pixels.
- `docs/` is not in the `build-www.mjs` allowlist (never shipped in the APK); GitHub Pages serves it publicly (no secrets).
- An unapproved earlier implementation draft is kept only as a local `git stash` (not pushed); it predates the official tokens.

## Token efficiency
- Read only the files you need; use grep and line ranges. Do not re-audit the repo or dump whole files.
- Keep reports short: changed files, commit, tests, results, open issues.

## Android plan (one phase at a time, each needs explicit approval)
1. **Offline web**: vendored supabase-js, SW precache, native SW guard. *(done)*
2. **Capacitor shell + GitHub Actions debug APK**, Back navigation (student + admin), safe area, phone chat fix. *(done)*
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
