# Security & roles

| Role | Where | Can | Cannot |
|---|---|---|---|
| Owner (Nurəli Qasımlı) | Control Center + everything | grant/remove admin, feature switches, maintenance, diagnostics, owner transfer | be deleted; lose admin rights |
| Admin | Control Center | people, classes, groups, chats, passwords, operations, delivery, audit | grant admin, change platform flags, diagnostics |
| Teacher | Teacher Studio | own classes: presentations, draw, reviews, live, scoring, assignments, announcements, issues | other classes, platform users/roles |
| Class leader | Class Hub | own class overview; announcements (`announce`), reports (`report`), existing perms | assessment, passwords, settings, other classes |
| Student | App | own team workspace, own speaking slot, team files/chat/tasks, classwork | other teams' files/chat/tasks, unpublished scores |

## Enforcement
* RLS SELECT-only policies; writes only via RPCs; `anon` has no access to new objects.
* Function classes: **A** user RPC (`authenticated`, checks `auth.uid()` + profile), **B** policy helper (boolean), **C** service-only (INVOKER, `service_role`/cron), **D** trigger (no grants). All with `search_path = pg_catalog, public`.
* Immutable history: draws, roster, submissions, files, scores, audit cannot be deleted; only listed columns change along valid transitions.
* Rate limits per user and action (chat, uploads, joins, invites, votes, points, live controls…).
* Files: private buckets, path-scoped upload policies, no client update/delete, server re-checks type, size, owner and path.
* Secrets never in the repo or browser: `FCM_SERVICE_ACCOUNT_JSON` (Supabase), `GOOGLE_SERVICES_JSON` + signing secrets (GitHub).

## Found and fixed in existing production objects (Batch C / M6, need approval)
`push_targets` exposed other users' push keys to any signed-in user; internal helpers callable via the API; trigger functions executable by anon; client write grants on 13 tables; `delete_message` always failed.
