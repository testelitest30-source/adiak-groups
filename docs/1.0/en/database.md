# Database & migrations

## History
Production had 18 migrations (`20261009113759` … `20261031205544`) that were never in the repo. They are represented by **marker files** in `supabase/migrations/` (comments only) and a **sha256 manifest** (`supabase/history/manifest.tsv`). `tests/cli/markers.sh` proves on a local Postgres 17.11 with the Supabase CLI that the markers are treated as applied, never re-run, and that a missing/renamed marker blocks `db push`.

**Never** run `supabase db push`, `db reset` or `migration repair` against production.

## New migrations (local until the owner approves each batch)
| File | Content |
|---|---|
| `20261109100000_adiak10_foundation` | default privileges, notifications, FCM devices, push outbox |
| `20261109100050_roles_owner` | owner, platform audit, flags, `my_access`, rate limiter |
| `20261109100100_pres_schema` / `100200_pres_rpcs` | Presentation Center tables, guards, audit, RPCs, live slots |
| `20261109100300_existing_additive` | event chat + new perms in existing functions (drift-checked) |
| `20261109100400_notify_events_reminders` | server notifications for existing events, reminders |
| `20261109100500_harden_existing` (Batch C) | revoke risky grants on existing objects |
| `20261109100600_fix_delete_message` | message delete bug fix |
| `20261109100700_academics` · `100800_rate_limit_existing` · `100900_ops` | assignments/announcements/issues, rate limits, Control Center read models |
| `supabase/pending/batchB_cron_jobs.sql` | pg_cron jobs (needs approval) |

## Verify locally
```
LOCAL_PG_URL=postgresql://postgres@127.0.0.1:54329 tests/db/run.sh        # 477 checks
LOCAL_PG_URL=postgresql://postgres@127.0.0.1:54329 tests/db/rollback.sh   # non-destructive rollback
SUPABASE_BIN=… LOCAL_PG_URL=… tests/cli/markers.sh                       # migration history gate
```
Before applying to production: run `tests/db/parity.sql` on production (read-only) — the three fingerprints must match the baseline. After MCP `apply_migration`, rename the repo file to the recorded version.

## Rollback (no data loss)
`supabase/rollback/batchA_disable.sql` restores the 7 changed existing functions byte-for-byte, revokes new RPCs, disables new triggers and sets `pres_enabled=false`. All new tables and rows stay. `batchA_enable.sql` re-enables. `batchC_disable.sql` restores the pre-hardening grants and functions.
