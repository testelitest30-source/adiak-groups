# ADIAK 1.0 — decisions log

| # | Decision | Why |
|---|---|---|
| 1 | Owner / Super Admin = **Nurəli Qasımlı** (`platform_owner`, by login `nureli.q@classroom.app`). "Host" and Sübhan stay Admins. | Owner decision 2026-11-09. Server-side table, no client grants; the owner account cannot be deleted. |
| 2 | Launcher icon: **black symbol on transparent**; app intro: black → purple; web/PWA/in-app: purple logo. | Owner decision. Dark mode starts white (black would be invisible). Note: a black icon is hard to see on dark wallpapers. |
| 3 | Logo rebuilt as hand-made vector paths; glow and underside shading dropped (lighting, not geometry). Wordmark = Plus Jakarta Sans outlined. | No gradients/effects allowed; no font dependency; İ dot preserved. |
| 4 | Teacher Studio and Class Hub live inside the student app (Purple Edition); Control Center = existing Ledger admin. | One product on web and Android; teachers don't need the admin panel daily. |
| 5 | Assigned teachers run presentations/assignments of **their** classes without an extra grant; `presentations` perm lets other staff do it. | Teachers' daily work; class isolation stays server-side. |
| 6 | Class leaders keep existing perms; may get `announce`, `coordinate`, `report`; never `passwords` or `presentations` (assessment). | Prompt §4.3. |
| 7 | FCM tokens in a new `push_devices` table, sender = new edge function `push-fcm`. | Keeps the working web-push pipeline (`push_subs`, `push-send`) untouched. |
| 8 | Live viewer shows **PDF** (pdf.js 3.11.174 legacy, vendored, lazy, `isEvalSupported:false` against CVE-2024-4367). PPTX/Keynote: "Open" fallback, never claimed as previewable. | No CDN, no server converter. |
| 9 | Event chat = channel `p:<event>:<group>` on the existing messages table/UI; "Close the day" keeps event chats. | Reuse; history belongs to the workspace. |
| 10 | Access to an event workspace comes from the event roster: active members before the freeze, participants (read-only) forever after `live`. Late joiners only via staff with a reason. | No history lost; one consistent rule for files, chat, tasks. |
| 11 | "Previous team" continues the team's recorded time (no reset). | A mistaken "next" never loses recorded time. |
| 12 | Duration criterion: full marks within tolerance, linear to 0 at twice the tolerance; override needs an audited reason. No team-vs-team comparison. | Prompt §7.6. |
| 13 | Notifications: server rows are the source; client toasts for server-covered events are suppressed only while server notifications are live. Chat messages stay unread-count based (no per-message rows except @mentions). | Avoid duplicates and table bloat. |
| 14 | Migration history: 18 marker files + sha256 manifest, **plus the exact statement text in `supabase/history/sql/`** (exported read-only on 2026-11-09, every sha256 equal to the manifest). The earlier "secret-like" hits were reviewed by hand: only column names and secrets generated in the DB at run time, no literal values. | Complete audit trail without any secret; markers stay proven by `tests/cli/markers.sh`. |
| 15 | No attendance model and no peer voting exist → none invented. | Prompt: "where supported". |
| 16 | Web push postponed to 1.1. | Prompt §12. |
| 17 | Signing key generated in the build session (RSA 4096, 30 years); delivered to the owner privately; GitHub secrets added by the owner (no secrets API in this session). | Prompt §13. |
