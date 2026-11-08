# tests/ — development-only UI checks

These tests are **never deployed**. `scripts/build-www.mjs` copies an allowlist only, so `www/` has no `tests/`.
GitHub Pages serves the repo root, so these files are public. They hold **no secrets and no real student data**.

## Safety
- Supabase is **fully mocked** (`lib/mock-supabase.mjs`). REST, RPC, auth, storage and the realtime websocket are answered locally.
  Any request to a host other than the local test server is blocked and fails the run.
- Logged-in states come from a fake session in `localStorage` (`lib/fixtures.mjs`). Nobody signs in, and `claim_session`
  never reaches the server, so no real device is kicked out.
- Write requests (POST/PATCH/DELETE) only get a fake reply and are listed at the end of the run.

## Requirements
Node 22 and Playwright with Chromium. In the cloud dev container both are pre-installed.
Locally, run `npm i -g playwright && npx playwright install chromium`. Playwright is deliberately **not** a project dependency, because the app has no build step.

## Run
```bash
node tests/smoke.mjs [label]     # UI smoke tests + screenshots → tests/out/<label>/ (gitignored)
node tests/tokens-check.mjs      # tokens.css: light/dark/auto parity, WCAG contrast, font glyphs
```
`npm run test:ui` and `npm run test:tokens` are shortcuts for these.

## What `smoke.mjs` covers
- login screen (AZ labels)
- student desktop nav with the real labels, no admin link, tab change, history push and browser Back
- theme cycle auto → light → dark and persistence after reload
- modal open and Escape close
- teacher: class auto-selected, admin link visible
- phone 390px: 5-button tabbar, drawer open/close, open chat hides the tabbar and keeps the composer inside the viewport
- admin panel sections by permission (admin 11, teacher with `panel` 3, student "No access")
- screenshots of home at 390/768/1280 × light/dark, admin dashboard, phone chat
- no request reaching a non-mocked host

**Not covered** (needs a real device or a real account): Android Back, safe-area bar colors, the on-screen keyboard, the single-device kick and push.
