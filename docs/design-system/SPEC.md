# ADIAK Design System 1.0 — specification

**Status:** design approved for review · **implementation not started** (waits for approval).
Visual boards: `boards.html` (live, uses the real `assets/js/shared/icons.js`) → `boards-png/` (2×) → `ADIAK_Design_System_1.0.pdf` (13 pages).
Canonical tokens: [`tokens.css`](tokens.css). Reference component CSS: [`components.css`](components.css).

## 1. Principle: strict monochrome

ADIAK = white + black + charcoal + neutral grey. **No hue anywhere** — not for status, errors, destructive actions, charts, badges, avatars, focus or hover.
State is communicated by **contrast step, weight, border style (solid / outline / dashed), icon and wording**.

Verification (repeatable):
- `tools/hue_scan.py` — every rendered board pixel must have R = G = B (result: 0 coloured pixels on all 13 boards).
- Source scan of `docs/design-system/*.{css,js,html}` — the only non-neutral hex strings are *quoted as text* in the critique/implementation boards, naming the live app's current violations.

## 2. Tokens

Official colour tokens (light / dark) exactly as given — see `tokens.css`. Roles:

| Token | Use |
|---|---|
| `--background-secondary` | App canvas (behind cards), chat well, disabled field, Android system-bar strips |
| `--background` | Board/page background where no card layer exists, login card stage |
| `--surface` / `--surface-secondary` / `--surface-elevated` | Cards & bars / hover rows & table head / secondary buttons, selected rows, menus, dark dialogs |
| `--text-primary` / `--text-secondary` / `--text-muted` | Content & icons / labels & supporting copy / placeholders, timestamps, disabled **only** |
| `--border` / `--border-strong` | Dividers & card edges / inputs, outline buttons, unchecked controls |
| `--button-primary(-text)`, `--button-hover` | Primary action, own chat bubble, checked controls, counters |
| `--navigation-active(-text)` | Active sidebar item / tab-bar label |
| `--badge-background/-text` | Neutral badge |
| `--overlay` | Modal / sheet scrim |

Derived (aliases or neutral alpha only): `--focus-ring` (= text-primary), `--focus-halo`, `--knob`, `--chart-self/-other`, `--shadow-1/2/3`.

**Contrast note.** `--text-muted` is 2.85:1 on white (3.67:1 dark) — below AA for body text, so it never carries essential information. `--text-secondary` is 5.74:1 / 6.90:1 (AA).

Type: **Inter**, self-hosted (`fonts/`, OFL, latin + latin-ext so Ə ə Ğ ğ Ş ş İ ı render) — H1 30/36·600, H2 22/28·600, H3 17/24·600, body 15/22 (14/20 dense), support 13/18, caption 12/16. Tabular numerals for scores.
Spacing 4·8·12·16·24·32·48. Radius: 6 (checkbox, kbd) · 10 (button, input, nav item) · 14 (card) · 16 (dialog, sheet) · pill. Controls 40 px (32 small, 44 phone primary). Borders 1 px. Icons 16/20/24.
Breakpoints keep the current CSS: ≤380, ≤800 (phone/tab bar), 801–1100, 1101–1399, ≥1400; admin ≤900.

## 3. Components and states (boards 04–07)

| Component | Rules |
|---|---|
| Button | Primary (ink) · Secondary (elevated) · Outline (border-strong) · Ghost. Hover: primary → `--button-hover`, others → one surface step. Focus: 2 px `--focus-ring`, 2 px offset. Pressed: scale .98. Disabled: elevated fill + muted text. Loading: spinner + verb. |
| Destructive | **Monochrome**: confirmation dialog, alert-triangle icon, explicit verb ("Sil"), primary ink button. Never red. |
| Input / search / select | 40 px, label above, help below. Hover border → muted; focus → text-primary + 3 px halo; **error → 1.5 px ink border + alert-circle + message in text-primary**; disabled → background-secondary. |
| Checkbox / radio / toggle | Off: border-strong outline. On: ink fill (dark: white) with inverted mark/knob. Focus ring as buttons. Disabled: border, muted. |
| Segmented / tabs | Segmented active = surface chip + 600 weight (not ink). Tabs: 2 px ink underline. |
| Card / stat | Surface + 1 px border, radius 14, padding 16/20. Hover → border-strong. Selected → 1 px ink ring. Stat value 28/600 tabular. |
| Badge / status | solid = active/mine/admin · outline = role/pending · dashed = awaiting (sent request) · muted = inactive (Qrupsuz). Status dot: filled = online, ring = away, border-strong = offline. Counter = ink pill. |
| Avatar | Initials on `--surface-elevated` + 1 px border; group = ink tile with groups glyph. **No per-person hue.** |
| Table | 36 px head on surface-secondary, 52 px rows, hover surface-secondary, selected elevated + 2 px ink edge. |
| Chart / podium / progress | You = `--chart-self` (ink), others = `--chart-other` (muted); values always labelled. Podium steps: ink / border-strong / elevated, numbered 1-2-3, crown icon. No gradients. |
| Sidebar / tab bar | Item 36 px; active = `--navigation-active`; counter inverts on active. Tab bar 64 px + safe area, active = pill on elevated + 600 label; hidden while typing and in open chat (unchanged behaviour). |
| Dialog / sheet | `--overlay` scrim, radius 16, shadow-3; dark: elevated surface + border-strong. Phone: bottom sheet with grabber. |
| Toast / banner | Inverted (`--text-primary` bg, `--background` text) + icon. Offline banner inverted. No actions (none exist). |
| Empty / loading / error | 56 px circle icon, title, one line, one action. Skeleton = elevated blocks, opacity pulse (no shimmer gradient). Dots loader ink. |
| Chat | Others: surface bubble + border; **own: ink bubble**; reply quote 2 px left rule; reactions outlined pills (own = 1.5 px ink); date pill; unread separator ink line; system message centred secondary; composer pill field + ink round send. |
| Pagination | Library component only — no current screen paginates. |

## 4. Icons (board 03)

Existing set kept (61 glyphs): 24 × 24, stroke 1.8, round caps/joins, `currentColor`, `aria-hidden` (icon-only buttons need `aria-label`).
Fixes (proposed): `settings` → sliders (current glyph is indistinguishable from `sun`, which sits next to it); admin **Rəy** uses `inbox` (currently same icon as Çatlar); new `back`, `swap`, `x`, `chevR/L/D`, `send`, `more`, `alert`, `alertC`, `filter`, `wifiOff`, `upload`.
Emoji used as **interface icons** (⏻ ⇄ ← ✕ ✓, 🥇🥈🥉, 🏆, 🚫 📎 🖼️ 🎤 🎭 🗳️ previews, badge art, 🎉 ✨ and a purple-heart emoji in copy) → SVG or removed.

## 5. Screens (boards 08–12)

Login · Ana səhifə · Tələbələr (admin İnsanlar) · Tələbə profili · Qruplar · Çat · İdarəetmə (person permissions) · Ayarlar — desktop 1280×800 and phone 390×844, light and dark.
All labels are the app's real Azerbaijani strings. Nothing was added that the app does not do; names and numbers are placeholders.
Presentation-only proposals (need approval): page titles (H1) on each section; visible field labels on login; admin İnsanlar as a table (same data and click target as today's card grid); AZ strings for admin labels that are English today ("Classes" → Siniflər, "Feedback" → Rəylər, "Permissions" → Yetkilər).

## 6. Implementation plan (board 13) — vanilla HTML/CSS/JS, no framework

| Stage | Change | Files |
|---|---|---|
| E1 Tokens | Official tokens + aliases for old names (`--bg`, `--card`, `--tx`, `--mu`, `--bd`, `--ac`, `--me`, `--soft`) so every existing rule keeps working; `data-theme` blocks rewritten; admin reads the same `theme` setting. | style.css, features.css, admin.css |
| E2 Remove colour | ≈60 hard-coded hues in CSS; JS `gcol`, `av()` hsl, `#4f46e5` "Hamı" avatar, `#dc2626` vote bar, `#7c3aed` tag default; blobs, pattern, gradient podium, glass blur. | css, core.js, pages.js, admin.js |
| E3 Type & geometry | Inter in `assets/fonts/` (+ SW `SHELL`, `build-www.mjs` allowlist), radius/heights, page titles. | css, sw.js, scripts/build-www.mjs |
| E4 Icons | settings glyph, new glyphs, ⏻ ⇄ ← and UI emoji → SVG. | icons.js, pages.js, extras.js, core.js, admin.js |
| E5 Components | States, badges, toasts, dialogs, chat bubbles per §3. | css |
| E6 Native & meta | `theme-color`, manifest, `android/app/src/main/res/values{,-night}/app_colors.xml` `app_bg` = `--background-secondary` (#F7F7F7 / #161616). No Capacitor config change. | index.html, manifest, app_colors.xml |
| F Tests | Playwright on `python3 -m http.server`: every screen × 2 themes × 3 widths with mock data; pixel hue scan; console errors; Back / navStack / admStack, modal close, chat keyboard unchanged; `node --check`; `npm run build`; CI APK. | — |

Untouched: auth, `claim_session`/`kickedOut()`, Supabase RPCs and push pipeline, script order and check-script globals, `native.js`, navStack/navSync/admStack, viewport metas, `#sheet.chat #msgs` height logic, Capacitor/Gradle.

## 7. Decisions needed from the owner

1. **User-content emoji** (chat reactions, emoji picker, admin-typed tag emoji, message text) render in colour by the OS. Options: leave as user content, or desaturate with `filter: grayscale(1)` (boards show the grayscale option).
2. **Admin-chosen tag colours** (`tags.color`): render monochrome (data kept, colour ignored) and hide the colour picker? Recommended: yes.
3. **Brand files** `assets/icons/favicon.svg` and the PNG launcher icons use an indigo→violet gradient tile. Recolour to an ink tile with the same two-person glyph? (You asked to keep the logo, so this is not done without approval.)
4. **Inter** adds ≈ 236 KB of woff2 to the site and APK (precached). Alternative: keep the system font stack.
5. The presentation-only proposals in §5.
