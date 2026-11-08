#!/usr/bin/env bash
# Builds a fresh LOCAL test database from supabase/baseline/*.sql (+ optionally new migrations).
# Usage: LOCAL_PG_URL=postgresql://postgres@127.0.0.1:54329 tests/db/setup.sh [dbname] [--with-migrations]
set -euo pipefail
cd "$(dirname "$0")/../.."
BASE="${LOCAL_PG_URL:?set LOCAL_PG_URL to a LOCAL postgres}"
case "$BASE" in *supabase.co*|*supabase.com*|*pooler*) echo "refusing: not a local database"; exit 2;; esac
DB="${1:-adiak_test}"
psql "$BASE/postgres" -qc "drop database if exists $DB" -c "create database $DB" >/dev/null
psql "$BASE/$DB" -qc "alter database $DB set adiak.local='yes'" >/dev/null
for f in supabase/baseline/0*.sql; do
  PGOPTIONS='-c adiak.local=yes -c client_min_messages=error -c check_function_bodies=off' psql "$BASE/$DB" -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null || { echo "baseline failed: $f"; exit 1; }
done
# Seed the migration history like production (18 markers), so new migrations run with the real pre-flight check.
tail -n +2 supabase/history/manifest.tsv | while IFS=$'\t' read -r v n _; do
  psql "$BASE/$DB" -qc "insert into supabase_migrations.schema_migrations(version,name) values ('$v','$n')" >/dev/null; done
if [ "${2:-}" = "--with-migrations" ]; then
  for f in $(ls supabase/migrations/*.sql | sort); do
    v=$(basename "$f" | cut -d_ -f1); [ "$v" -le 20261031205544 ] && continue
    PGOPTIONS='-c client_min_messages=warning' psql "$BASE/$DB" -v ON_ERROR_STOP=1 -q -1 -f "$f" >/dev/null || { echo "migration failed: $f"; exit 1; }
    psql "$BASE/$DB" -qc "insert into supabase_migrations.schema_migrations(version,name) values ('$v','$(basename "$f" .sql | cut -d_ -f2-)') on conflict do nothing" >/dev/null
  done
fi
echo "local db $DB ready"
