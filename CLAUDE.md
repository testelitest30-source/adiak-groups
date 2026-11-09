# CLAUDE.md — ADIAK Team Maker

## Architecture
- Static vanilla HTML/CSS/JS. **No framework, no bundler, no build step for the website.** Do not migrate to one.
  If a future native plugin needs bundling, use the smallest possible separate bundle.
- Entry points: `index.html` (student app), `admin/index.html` (admin panel). App start: `boot()` in `assets/js/app/main.js`.
- `assets/js/shared/` (config, i18n, icons), `assets/js/app/` (core, pages, extras, main), `assets/js/admin/`, `assets/css/`, `assets/icons/`.
- `assets/vendor/supabase.js` = `@supabase/supabase-js` **2.45.4** UMD, vendored. No CDN dependencies. Do not upgrade it unless asked.
- UI uses inline SVG icons (`icons.js`). Visual direction: **ADIAK Design System 1.0 — Purple Edition** (see section below). No other redesign.

## Script loading order (do not change)
- App: `intro.js → vendor/supabase.js → config.js → i18n.js → icons.js → core.js → pages.js → extras.js → pres.js → live.js → studio.js → main.js → native.js`
- Admin: `vendor/supabase.js → config.js → i18n.js → icons.js → i18n-admin.js → admin.js → control.js → ../assets/js/app/native.js`
- ADIAK 1.0 modules register through small hooks only: `XPAGES`/`xHomeCards` (pages.js), `onDbChange`/`pxBoot`/`openTarget`/`snotify` (core.js), `XAFTER` (extras.js `afterRender`), `XADM`/`TABS` (admin.js). Every 1.0 feature hides itself when the server has no `my_access` RPC.
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
- Bump `V` (currently `adiak-v10`) whenever `SHELL` or asset paths change. pdf.js (`assets/vendor/pdfjs/`) is lazy-loaded, not in SHELL.
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

## ADIAK 1.0 (branch `ccr-fb87e4c6-x8qay5`, single draft PR to main)
- Plan: `/root/.claude/plans/adiak-1-0-master-magical-dream.md`; decisions: `docs/1.0/decisions.md`; docs AZ/EN: `docs/1.0/{az,en}/`.
- Roles: Owner = `platform_owner` (Nurəli Qasımlı), Admin = `_is_admin()`, Teacher = `class_staff.role='teacher'` (own classes), Class leader = `starosta` (never `passwords`/`presentations`), Student.
- DB: production history = 18 marker files + `supabase/history/manifest.tsv`; new migrations after `20261031205544`, tested on local PG 17.11
  (`tests/db/setup.sh`, `tests/db/run.sh`, `tests/db/rollback.sh`, `tests/cli/markers.sh`, `tests/db/parity.sql`). Never `db push`/`reset` against production.
  New SECURITY DEFINER functions: `search_path = pg_catalog, public`, REVOKE from PUBLIC/anon/authenticated/service_role, then explicit grants (classes A/B/C/D).
  Non-destructive rollback: `supabase/rollback/batchA_disable.sql` (+ `_enable`), `batchC_disable.sql` (generated by `scripts/gen-rollback.py`). `supabase/pending/` = not yet approved.
- Brand: vector sources `assets/brand/*.svg` (never redraw); rasters from `node scripts/gen-brand.cjs`. Launch animation `assets/js/shared/intro.js`.
- Push: `push_devices` + `push_outbox` (retries 1m/5m/30m/2h/6h, dead after 5), edge function `supabase/functions/push-fcm` (secret `FCM_SERVICE_ACCOUNT_JSON`),
  CI writes `google-services.json` from secret `GOOGLE_SERVICES_JSON` (gitignored). Release: `.github/workflows/release.yml` (keystore only from secrets).
- Production gates (owner approval each): migration batches, pg_cron, existing-object hardening, edge deploy, merge, tag, deploy.
- Tests: plus `tests/intro.mjs`, `tests/pres-ui.mjs`, `tests/live-ui.mjs`, `tests/studio-ui.mjs`, `tests/control-ui.mjs`, `tests/edge/push-fcm.test.mjs`.

## Purple Edition design system (approved; staged rollout, one PR per stage)
- Plan, decisions and inventories: `docs/design/purple-edition-stage0.md`. Stages: 0 prep (PR #8) → 1+2 student app (`assets/css/purple.css`) → 3 admin "Ledger" (`assets/css/admin-ui.css`) → QA. Each stage needs explicit approval.
- Tokens: `assets/css/tokens.css` (`--adia-*`). Light canvas `#F4F1FD`, dark navy-indigo `#1C1F38`, brand `#7959D6`.
  Use `--adia-primary-fill` + `--adia-on-primary` for filled controls, `--adia-primary-text` for small accent text. Never put white text on `--adia-primary` in dark mode.
  Dark values exist twice (`[data-theme="dark"]` and the auto-dark media block): change both; `tests/tokens-check.mjs` enforces parity and WCAG AA.
- Gradients: only `--adia-gradient-brand` behind text; `--adia-gradient-decor` for text-free decoration; nowhere else.
- Fonts: local OFL WOFF2 in `assets/fonts/`: Plus Jakarta Sans (headings), Inter (body); admin only: Schibsted Grotesk (display) + JetBrains Mono (figures/IDs).
  No CDN. Every font must pass the Azerbaijani glyph check in `tests/tokens-check.mjs` (Sora/Bricolage/Instrument fail on `Ə/ə`).
- Student styling lives in `assets/css/purple.css` (loaded last, overrides `style.css`/`features.css`; old variables are aliased there). Keep markup changes presentational (classes, `ic()` icons).
- Admin "Ledger" identity lives in `assets/css/admin-ui.css` (loaded after `admin.css`): ink spine with numbered sections, Schibsted Grotesk
  headings/figures, JetBrains Mono labels and IDs, hairline rules, outlined chips, **no gradients**; purple only as the signal (active, primary, focus).
  Admin follows the app's `localStorage.theme` via the pre-paint script in `admin/index.html`. Section numbers in page headers come from `head()` (`pidx`).
- Keep real i18n labels; never copy mockup wording or add mockup-only features (fake stats/charts/feeds, top search, FAB).
- Logo: keep current branding until the new logo SVG is approved; integration points are listed in the design doc. Never redraw a logo.
- Old CSS variables (`--bg --card --tx --mu --ac --ac2 --bd --me ...`) become aliases of tokens in Stage 1; keep them working.

## Tests (dev-only, not deployed)
- `node tests/smoke.mjs [label]`, `node tests/tokens-check.mjs`, and `node tests/screens.mjs <label>` (all screens × 360/390/430/768/1280/1440 × light/dark;
  fails on horizontal overflow, page errors, small tabbar targets, hidden chat composer). Pre-installed Playwright; output in gitignored `tests/out/`.
- Supabase is fully mocked; tests must never authenticate against or write to production. Run both before every design PR.

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
- No UI changes outside the approved Purple Edition stage, no unrelated dependency upgrades, no unnecessary architecture changes.
- Verify changes (e.g. Playwright against `python3 -m http.server`) and report results honestly, including what could not be tested.
