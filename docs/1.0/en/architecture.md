# ADIAK 1.0 — Technical architecture

**One product, two shells.** The website (GitHub Pages / Vercel, `index.html`, `admin/index.html`) and the Android app (Capacitor 8.6, `az.adiak.teammaker`) run the same vanilla-JS code against the same Supabase project (`epenklutnevjvgpsjehp`). No framework, no bundler.

## Client modules
| File | Role |
|---|---|
| `assets/js/shared/intro.js` | Launch animation (once per session, reduced-motion aware) |
| `assets/js/app/core.js · pages.js · extras.js · main.js` | Existing app: state, realtime, chat, groups, requests, tools |
| `assets/js/app/pres.js` | Server notification centre, deep links (`openTarget`), student Team Presentation Center |
| `assets/js/app/live.js` | Live stage, synchronised timer, PDF viewer (pdf.js), operator console |
| `assets/js/app/studio.js` | Teacher Studio, Class Hub, student Classwork |
| `assets/js/app/native.js` | APK only: Back button, FCM push |
| `assets/js/admin/admin.js · control.js` | Ledger admin + Control Center modules |

All 1.0 modules plug into the existing app through small registries (`XPAGES`, `XADM`, `onDbChange`, `XAFTER`) and hide themselves if the server lacks the 1.0 RPCs.

## Server (Supabase)
* **Reads**: RLS SELECT policies only. **Writes**: SECURITY DEFINER RPCs that check caller, role, class, event, team and state.
* **Realtime**: one `room` channel on `postgres_changes`; new tables are forwarded to `onDbChange`.
* **Storage**: private buckets `team-files` (presentation files) and `class-files` (assignments); no update/delete policies for clients.
* **Notifications**: `notifications` table → `push_outbox` → `push-fcm` edge function (FCM HTTP v1) with retries; pg_cron runs reminders and the sweeper.
* **Time**: the live timer is computed from server timestamps (`pres_live`) plus a measured clock offset (`server_now`).
