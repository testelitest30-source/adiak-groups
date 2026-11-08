# Supabase migrations (ADIAK)

- `migrations/2026…_*.sql` up to `20261031205544` are **markers** for the 18 migrations that were applied in
  production before this repo tracked them. They contain no statements and must never be edited or re-run.
  Integrity of the real statements: `history/manifest.tsv` (sha256 computed in production, read-only).
- New migrations: versions after `20261031205544`, one logical change per file. They are tested on a local
  Postgres 17 first and applied to production **only with the owner's explicit approval**.
  After an apply via the Supabase MCP (which stamps its own version), rename the file to the recorded version.
- Never: `supabase db push` / `db reset` / `migration repair` against production.
- Verify markers: `SUPABASE_BIN=… LOCAL_PG_URL=postgresql://postgres@127.0.0.1:54329 tests/cli/markers.sh`
