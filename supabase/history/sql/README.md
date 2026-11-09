# Production migration archive (read-only)

Exact statement text of the 18 migrations applied to production before ADIAK 1.0, exported read-only
from `supabase_migrations.schema_migrations` on 2026-11-09. Each file's sha256 (statements joined with `\n`)
equals `../manifest.tsv`. Checked for secrets: none (the vault key and push secret are generated in the DB at run time).

**Never apply these files.** They are already in production; the CLI sees them through the marker files in
`supabase/migrations/`. This folder is for audit, review and disaster recovery reference only.
