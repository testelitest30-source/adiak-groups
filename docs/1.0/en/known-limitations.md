# Known limitations & troubleshooting

* **PPTX/Keynote are not previewed** in the live viewer — upload the final as PDF; other formats open in a new tab.
* **Web push** (website notifications when the browser is closed) is planned for 1.1; the website shows in-app notifications.
* **Launcher icon** is black on transparent (owner choice) — it is hard to see on dark wallpapers.
* **pg_cron** must be enabled for scheduled reminders and push retries; until then the Diagnostics panel says so.
* **Migration statements** of the 18 pre-1.0 migrations stay only in production (`supabase_migrations`); the repo keeps markers + sha256.
* No attendance tracking (no data model for it).
* Troubleshooting: "Too many requests" = rate limit, wait a minute · push not arriving → Control Center → Delivery · stale screen after an update → reload (service worker `adiak-v10`).
