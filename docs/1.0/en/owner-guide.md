# Owner guide (Control Center)

Open **Admin panel** (`admin/index.html`) and sign in with the owner account.

* **Operations** — students, teachers, classes, teams, active users (15 min), upcoming presentations, notifications and failed pushes in 24 h, accounts without profile, live sessions.
* **Presentations** — all events of all classes; manage them in Teacher Studio.
* **Delivery** — Android push queue (queued / sent / retry / dead / invalid), active devices, invalid tokens, last successful send, recent errors. Token values are never shown.
* **Audit log** — every presentation change (draws, approvals, returns, scores, live corrections) and platform change, with reason.
* **Platform** *(owner only)* — feature switches (Presentation Center, live mode, assignments, Android push, maintenance + message) and ownership transfer. Every change is audited.
* **Diagnostics** *(owner only)* — background jobs (pg_cron), storage per bucket, errors, migration versions, accounts without a profile (kept, never deleted automatically), build/version.
* Classic Ledger sections (People, Groups, Classes, Tags, Chats, Passwords, Close the day, Import, Settings) work as before.

Backups are managed in the Supabase dashboard (Database → Backups); the panel does not pretend to know their state.
