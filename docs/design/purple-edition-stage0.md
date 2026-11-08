# ADIAK Design System 1.0 — Purple Edition · Stage 0 (preparation)

Stage 0 changes **nothing visible**. Every new file is unlinked, and no served page, linked CSS, JS, `sw.js` or Android resource is modified.
Later stages link and apply them, each in its own PR after owner approval.

## Owner decisions (approved)
| # | Decision | Where it lives |
|---|---|---|
| 1 | Light canvas lavender `#F4F1FD` (not `#F8FAFC`) | `assets/css/tokens.css` `--adia-background` |
| 2 | Dark theme navy-indigo `#1C1F38`, surfaces `#262A42` / `#2F334C` | `tokens.css` dark blocks |
| 3 | Sora headings, Inter body, local OFL WOFF2, no CDN | `assets/fonts/`, `@font-face` in `tokens.css` |
| 4 | Limited gradients; gradients behind text use dark stops (AA) | `--adia-gradient-brand` (text-safe), `--adia-gradient-decor` (no text) |
| 5 | Contrast fixes: separate accent and fill, on-primary, darker chip text, success, input border, focus, status | `tokens.css`, checked by `tests/tokens-check.mjs` |
| 6 | Logo: keep the current branding; integrate the new logo only after its SVG is approved | see "Logo integration points" |
| 7 | Keep the real i18n labels (`i18n.js`, `i18n-admin.js`) | no mockup wording |
| 8 | Admin follows the app's auto/light/dark choice with a pre-paint script | Stage 1 |
| 9 | No mockup-only features (fake stats, line chart, activity feed, top search, FAB, 👋) | — |
| 10 | Playwright harness in `tests/`, Supabase fully mocked, outside `www` | `tests/` |
| 11 | No launcher or splash change before logo approval; theme-color and system-bar colors in Stage 1 | — |

## Resolved: Sora has no `Ə` / `ə`, so headings use Plus Jakarta Sans (owner decision)
**Verified:** the Sora font (Google Fonts / Fontsource 5.3.0, every subset) has **no glyph for U+018F `Ə` or U+0259 `ə`**. Inter has every Azerbaijani letter.
With the stack `"Sora","Inter",…`, the browser draws only `Ə/ə` in Inter inside Sora headings. For example, in "Ana səhifə" the "ə" comes from Inter. `tests/tokens-check.mjs` reports this as a warning.

Fonts I verified with **full** Azerbaijani coverage (Fontsource variable, latin + latin-ext):

| Font | Size | Note |
|---|---|---|
| Plus Jakarta Sans | about 47 KB | geometric, closest in feel to Sora |
| DM Sans | about 53 KB | |
| Onest | about 60 KB | |
| Lexend | about 72 KB | |
| Montserrat | about 106 KB | |

Options:
- **(a)** Keep Sora and accept the mixed `ə`.
- **(b)** Use Inter for headings too, so there is no display font.
- **(c)** Replace Sora with Plus Jakarta Sans or another font from the list.

**Decision:** Plus Jakarta Sans for headings, Inter for body. Sora was removed in the student-app stage. The admin uses Schibsted Grotesk and JetBrains Mono, both verified for Azerbaijani.

## Tokens (`assets/css/tokens.css`)
- Light values are on `:root`.
- Dark values are on `:root[data-theme="dark"]`, and the same values are repeated in `@media (prefers-color-scheme:dark){:root:not([data-theme="light"])}`. That second block is required because the app's **auto** mode removes the attribute (`extras.js` `applyTheme`). The test fails if the two blocks drift apart.
- Roles:
  - `--adia-primary` is the brand accent (icons, large text, charts).
  - `--adia-primary-text` is small accent text, AA on every surface.
  - `--adia-primary-fill` + `--adia-on-primary` are button and active-nav backgrounds with white text. Fill stays `#7959D6` in dark mode, because white on the lighter dark accent `#B39CF5` would fail.
- Corrections to the package's `tokens.css`:
  - secondary `#64748B` → `#5B6478` (4.27 → 5.33 on lavender)
  - success `#138A5B` → `#0F7A50`
  - warning `#A8670A` → `#94570A`
  - info `#4066B4` → `#3A5EA8`
  - new `--adia-border-input` (3.90 / 4.22)
  - chip text uses `#6846C9` (5.35)
  - dark palette re-based on the navy-indigo reference

## Old variable → new token map (to apply in Stage 1)
The old names stay as **aliases**, so the existing ~185 hardcoded rules and all JS-generated inline styles keep working while the stages migrate them.

| Old (style.css / features.css) | New token | Old (admin.css) | New token |
|---|---|---|---|
| `--bg` | `--adia-background` | `--bg` | `--adia-background` |
| `--card` | `--adia-surface` | `--card` | `--adia-surface` |
| `--tx` | `--adia-text` | `--tx` | `--adia-text` |
| `--mu` | `--adia-secondary` | `--mu` | `--adia-secondary` |
| `--ac` | `--adia-primary-fill` (backgrounds) / `--adia-primary-text` (text) | `--ac` | same as student |
| `--ac2` | `--adia-primary` | `--ac2` | `--adia-primary` |
| `--bd` | `--adia-border` | `--bd` | `--adia-border` |
| `--me` | `--adia-primary-light` (Stage 4: `--adia-bubble-out-*`) | `--soft` | `--adia-surface-sunken` |
| `--sh` / `--shadow` | `--adia-shadow-card` | `--ok` / `--bad` / `--warn` | `--adia-success` / `--adia-danger` / `--adia-warning` |
| `--r` | `--adia-radius-card` | `--sh` | `--adia-shadow-card` |
| `--pat` (doodle data-URI, `#4f46e5`) | re-tint to purple, or replace with soft canvas shapes (Stage 1) | | |

**Specificity trap:** `features.css:20-21` redefines every old variable on `:root[data-theme="dark"|"light"]`. Those two lines must be rewritten to the aliases in Stage 1, or manual light/dark would override the tokens.

## Brand colors outside CSS (Stage 1, decision 11)
| File | Now | Stage 1 |
|---|---|---|
| `index.html` `<meta name="theme-color">` | `#4f46e5` | `#F4F1FD` light / `#1C1F38` dark (two metas with `media`) |
| `manifest.webmanifest` | `theme_color #4f46e5`, `background_color #0f131c` | `#7959D6` / `#F4F1FD` |
| `android/app/src/main/res/values/app_colors.xml` | `#F5F6F8` | `#F4F1FD` (must equal light `--adia-background`) |
| `android/app/src/main/res/values-night/app_colors.xml` | `#0C0E13` | `#1C1F38` (must equal dark `--adia-background`) |
| `sw.js` | `V = "adiak-v6"` | add `tokens.css` + 4 fonts to `SHELL`, bump to `adiak-v7` |

Known limitation: Android `values-night` follows the **OS** theme, not the in-app manual theme. This was already true and is documented, not changed.

## Logo integration points (for the separately approved logo stage; do not change before then)
| Place | File / code | Current mark |
|---|---|---|
| Student login | `assets/js/app/pages.js` `view()` → `screen==="login"` → `.big-logo ${ic("groups")}` + "ADIAK Team Maker" | people glyph |
| Student sidebar | `pages.js` `sideNav()` → `.brand .blogo ${ic("groups")}` | people glyph |
| Admin sidebar | `assets/js/admin/admin.js` `draw()` → `.brand .logo ${ic("wrench")}` | wrench |
| Admin login | `admin.js` `loginView()` | wrench |
| Favicon | `assets/icons/favicon.svg`, `favicon.ico` | indigo→violet gradient + people |
| PWA | `assets/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `manifest.webmanifest` | old mark |
| Android launcher | `android/app/src/main/res/mipmap-*/ic_launcher{,_round,_foreground}.png`, `mipmap-anydpi-v26/*.xml`, `values/ic_launcher_background.xml` | **stock Capacitor logo** |
| Android splash | `android/app/src/main/res/drawable*/splash.png`, `values/styles.xml` (`AppTheme.NoActionBarLaunch`) | **stock Capacitor logo** |

## UI emoji / glyphs used as interface icons (Stage 2: replace with `ic()`)
Content emoji stay: reactions, the emoji picker, stickers, user tag emoji, medals 🥇🥈🥉.

| File | Interface glyphs |
|---|---|
| `assets/js/admin/admin.js` | ➕ ✏ 🗑 ✅ 🏷 🏫 📄 📝 ⚡ ✋ ↩ ✕ ← 📎 |
| `assets/js/app/pages.js` | ⏻ (logout) ⇄ (switch class) ✓ ✗ ✕ ← 📎 |
| `assets/js/app/core.js` | 🗳 🎭 🖼 🎤 📎 📊 📕 📝 📈 🗜 ⏹ (mostly notification and attachment labels; review case by case) |
| `assets/js/app/extras.js` | 🚀 🌱 🛡 🏅 🎯 🤝 📡 ↺ ✕ (badges and timers; review case by case) |
| `assets/js/shared/i18n.js`, `assets/js/admin/i18n-admin.js` | ✓ → ➕ inside translated strings (must stay in sync with the code) |

## Stage 1 checklist (foundation)
- [ ] Link `assets/css/tokens.css` first in `index.html` and `admin/index.html`.
- [ ] Alias the old variables (table above) in `style.css`, `features.css:20-21` and `admin.css`.
- [ ] Base recipes: `button`, `button.s`, `button.d`, `:disabled`, `:focus-visible`, `input`, `select`, `.card`, `.chip`, `.badge`, `.err`; body font Inter, headings Sora (or the decided alternative).
- [ ] Canvas: lavender, plus `--pat`/blobs re-tinted.
- [ ] Admin pre-paint `data-theme` script (the same as `index.html`). Admin CSS dark mode switches from the OS-only media query to the shared tokens.
- [ ] `theme-color`, manifest, `app_colors.xml`, `sw.js` `SHELL` + `V`.
- [ ] Run `node tests/smoke.mjs stage1` and `node tests/tokens-check.mjs`, compare with `tests/out/baseline/`.
- [ ] `npm ci && npm run build`. CI APK. Galaxy S25: bar colors, Back, chat keyboard.

## Hardcoded color inventory (generated, Stage 0 baseline)
Data-URI patterns are omitted. Each entry is a rule that the later stages migrate to tokens.

### `assets/css/style.css`

| Line | Selector | Hardcoded colors |
|---|---|---|
| 5 | `:root` | #16181d #4338ca #4f46e5 #5f6673 #e6e8ec #eef0ff #f5f6f8 #fff rgba(16,24,40,.05) rgba(16,24,40,.22) |
| 6 | `:root` | #0c0e13 #151922 #1e1b4b #242a36 #6366f1 #818cf8 #98a0ae #e6e8ec rgba(0,0,0,.4) rgba(0,0,0,.6) |
| 8 | `.hd` | #fff |
| 9 | `.hd button` | #ffffff33 |
| 10 | `.card` | #0001 |
| 13 | `button` | #fff |
| 14 | `button.d` | #dc2626 |
| 20 | `.err` | #dc2626 |
| 21 | `.av` | #fff |
| 24 | `.chip.on` | #166534 #dcfce7 |
| 25 | `.badge` | #ef4444 #fff |
| 35 | `.tabs button.on` | #fff |
| 38 | `#fab` | #0006 |
| 41 | `.ov` | #0008 |
| 42 | `#toast` | #0006 #111827 #fff |
| 43 | `#toast.bad` | #dc2626 |
| 46 | `.nt` | #0005 |
| 52 | `#scrim` | #0007 |
| 53 | `#drawer` | #0007 |
| 56 | `.bump` | #16a34a |
| 57 | `.chip.tag3` | #1e40af #dbeafe |
| 58 | `.chip.tag` | #fff |
| 58 | `.chip.tag2` | #92400e #fef3c7 |
| 62 | `.fx` | #16a34a |
| 62 | `.fx.neg` | #dc2626 |
| 65 | `.ub` | #22c55e #fff |
| 69 | `button.rec` | #dc2626 |
| 70 | `button.ok` | #16a34a |
| 76 | `50%` | #22c55e33 |
| 83 | `:root` | rgba(16,24,40,.04) rgba(16,24,40,.28) |
| 87 | `button` | rgba(16,24,40,.12) |
| 88 | `button.d` | #b91c1c |
| 88 | `button.ok` | #15803d |
| 93 | `.b` | rgba(0,0,0,.06) |
| 99 | `.lang` | #ffffff66 |
| 100 | `.lang button` | #fff #ffffff22 |
| 101 | `.lang button.on` | #ffffff66 |
| 102 | `.card .lang button.on` | #fff |
| 104 | `.langfix .lang button.on` | #fff |
| 121 | `.nav button.on` | #fff |
| 128 | `.side .lang button.on` | #fff |
| 154 | `.bcol.me .bar-w i` | #818cf8 |
| 158 | `.seg button.on` | #fff |
| 166 | `.clcard:hover` | rgba(16,24,40,.35) |
| 169 | `#drawer` | #0005 |
| 181 | `.aptabs .on` | #fff |
| 197 | `.rq` | rgba(127,127,127,.14) |
| 202 | `#mm` | rgba(0,0,0,.35) |
| 211 | `#cam` | #000 |
| 213 | `.camb` | #000 |
| 214 | `.shut` | #fff #ffffff33 |

### `assets/css/features.css`

| Line | Selector | Hardcoded colors |
|---|---|---|
| 20 | `:root[data-theme="dark"]` | #0c0e13 #151922 #1e1b4b #242a36 #6366f1 #818cf8 #98a0ae #e6e8ec rgba(0,0,0,.4) rgba(0,0,0,.6) |
| 21 | `:root[data-theme="light"]` | #16181d #4338ca #4f46e5 #5f6673 #e6e8ec #eef0ff #f5f6f8 #fff rgba(16,24,40,.05) rgba(16,24,40,.22) |
| 39 | `#tabbar` | #0007 |
| 55 | `.pod .crown` | #000 |
| 58 | `.pod .crown` | #fff |
| 59 | `:root[data-theme="light"] .pod .crown` | #000 |
| 60 | `:root[data-theme="dark"] .pod .crown` | #fff |
| 64 | `.pstep.s1` | #f59e0b #fcd34d |
| 65 | `.pstep.s2` | #94a3b8 #e2e8f0 |
| 66 | `.pstep.s3` | #ea580c #fdba74 |
| 90 | `.tobot` | #0004 |
| 93 | `.mention.me` | #f59e0b |
| 98 | `#lb` | rgba(0,0,0,.9) |
| 99 | `#lb img` | #000a |
| 100 | `#lb .lbx` | #fff #ffffff2e |
| 101 | `#lb .lbdl` | #fff #ffffff2e |
| 104 | `#offl` | #b45309 #fff |
| 107 | `#pal` | rgba(10,12,24,.55) |
| 108 | `.palbox` | #000b |
| 126 | `.presets button.on` | #fff |
| 131 | `.tmbox.warn .tmfg` | #f59e0b |
| 132 | `.tmbox.crit .tmfg,.tmbox.end .tmfg` | #ef4444 |
| 135 | `.tmbox.crit .tmd` | #ef4444 |
| 136 | `.tmbox.end .tmd` | #ef4444 |
| 149 | `.tpill` | #000a |
| 150 | `.tpill.crit` | #dc2626 |

### `assets/css/admin.css`

| Line | Selector | Hardcoded colors |
|---|---|---|
| 7 | `:root` | #0c0e13 #151922 #1b202b #242a36 #98a0ae #e6e8ec rgba(0,0,0,.4) rgba(0,0,0,.6) |
| 14 | `.side` | #312e81 #fff |
| 15 | `.brand .logo` | #ffffff26 |
| 18 | `.nav button` | #ffffffd9 |
| 19 | `.nav button:hover` | #ffffff1f |
| 20 | `.nav button.on` | #3b2fb0 #fff rgba(0,0,0,.5) |
| 21 | `.nav .sep` | #ffffff26 |
| 22 | `.me` | #ffffff1c |
| 23 | `.me button` | #fff #ffffff26 |
| 23 | `.me a` | #fff |
| 33 | `.stat .ico` | #fff |
| 34 | `.stat:nth-child(2) .ico` | #0284c7 |
| 34 | `.stat:nth-child(3) .ico` | #b45309 |
| 35 | `.stat:nth-child(4) .ico` | #047857 |
| 35 | `.stat:nth-child(5) .ico` | #be123c |
| 35 | `.stat:nth-child(6) .ico` | #475569 |
| 40 | `.btn,button` | #fff rgba(16,24,40,.12) |
| 42 | `button.d` | #b91c1c |
| 42 | `button.ok` | #15803d |
| 50 | `.chip.admin` | #fff |
| 50 | `.chip.teacher` | #1e40af #dbeafe |
| 50 | `.chip.student` | #075985 #e0f2fe |
| 50 | `.chip.host` | #92400e #fef3c7 |
| 51 | `.chip.ok` | #166534 #dcfce7 |
| 51 | `.chip.warn` | #92400e #fef3c7 |
| 51 | `.chip.bad` | #991b1b #fee2e2 |
| 52 | `.av` | #fff #ffffff40 |
| 54 | `.av i` | #22c55e |
| 59 | `.seg button.on` | rgba(0,0,0,.15) |
| 66 | `.ov` | rgba(10,14,30,.55) |
| 67 | `.sheet` | rgba(0,0,0,.6) |
| 74 | `.sw i` | #cbd2e4 |
| 74 | `.sw i:after` | #fff rgba(0,0,0,.3) |
| 92 | `#toast` | #0f172a #fff rgba(0,0,0,.5) |
| 93 | `#toast.bad` | #dc2626 |
| 105 | `.lang-a button` | #fff #ffffff26 |
| 106 | `.lang-a button.on` | #ffffff59 |
| 107 | `.panel .lang-a button.on` | #fff |
| 110 | `.main` | #e6e8ec |
| 112 | `.cls-card` | #e6e8ec #fff |
| 114 | `.cls-tag` | #4338ca |
| 116 | `.fbtn` | #e1e6f0 |
