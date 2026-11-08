#!/usr/bin/env bash
# Gate 0: proves that the 18 marker files in supabase/migrations/ are treated by the
# Supabase CLI as already applied, so no old production migration can ever be re-run.
# Runs ONLY against a local Postgres (LOCAL_PG_URL); never against production.
# Usage: SUPABASE_BIN=/path/to/supabase LOCAL_PG_URL=postgresql://postgres@127.0.0.1:54329 tests/cli/markers.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
SB="${SUPABASE_BIN:-supabase}"
BASE="${LOCAL_PG_URL:?set LOCAL_PG_URL to a LOCAL postgres}"
case "$BASE" in *supabase.co*|*supabase.com*|*pooler*) echo "refusing: not a local database"; exit 2;; esac
DB=cli_gate_$$
URL="$BASE/$DB?sslmode=disable"
WORK=$(mktemp -d); trap 'rm -rf "$WORK"; psql "$BASE/postgres" -qc "drop database if exists $DB" >/dev/null 2>&1 || true' EXIT
pass=0; fail=0
js(){ echo "$1" | grep -E '^\{' | tail -1; }
matched(){ js "$1" | jq '[.migrations[]|select(.local!="" and .local==.remote)]|length'; }
unmatched(){ js "$1" | jq '[.migrations[]|select(.local!=.remote)]|length'; }
uptodate(){ [ "$(js "$1" | jq -r .upToDate)" = true ]; }
pending(){ js "$1" | jq -r '.migrations|join(",")'; }
ok(){ echo "  PASS $1"; pass=$((pass+1)); }
bad(){ echo "  FAIL $1"; fail=$((fail+1)); }

psql "$BASE/postgres" -qc "create database $DB" >/dev/null
# Seed the history table exactly like production (version + name; statements are not needed).
psql "$URL" -q >/dev/null <<'SQL'
create schema supabase_migrations;
create table supabase_migrations.schema_migrations(version text primary key, statements text[], name text,
  created_by text, idempotency_key text, rollback text[]);
SQL
tail -n +2 supabase/history/manifest.tsv | while IFS=$'\t' read -r v n _; do
  psql "$URL" -qc "insert into supabase_migrations.schema_migrations(version,name) values ('$v','$n')" >/dev/null; done

# Work on a copy so the repo is never modified by the CLI.
mkdir -p "$WORK/supabase/migrations"; for f in supabase/migrations/*.sql; do v=$(basename "$f" | cut -d_ -f1); [ "$v" -le 20261031205544 ] && cp "$f" "$WORK/supabase/migrations/"; done
cd "$WORK"; "$SB" init --force >/dev/null 2>&1 || true

echo "1. migration list: all 18 Local = Remote"
out=$("$SB" migration list --remote="$URL" 2>&1 || true)
[ "$(matched "$out")" = 18 ] && [ "$(unmatched "$out")" = 0 ] && ok "18 matched, 0 unmatched" || { bad "list mismatch"; echo "$out"; }

echo "2. db push --dry-run: nothing to apply"
out=$("$SB" db push --dry-run --remote="$URL" 2>&1 || true)
uptodate "$out" && ok "remote up to date" || { bad "dry-run wanted to apply something"; echo "$out"; }
n=$(psql "$URL" -Atc "select count(*) from supabase_migrations.schema_migrations")
[ "$n" = 18 ] && ok "history still 18 rows" || bad "history has $n rows"

echo "3. a new migration: only it is applied"
cat > supabase/migrations/20261109000000_gate0_probe.sql <<'SQL'
create table public.gate0_probe(id int);
SQL
out=$("$SB" db push --dry-run --remote="$URL" 2>&1 || true)
[ "$(pending "$out")" = "20261109000000_gate0_probe.sql" ] && ok "dry-run lists only the probe" || { bad "dry-run list wrong"; echo "$out"; }
"$SB" db push --remote="$URL" --yes >/dev/null 2>&1 || true
n=$(psql "$URL" -Atc "select count(*) from supabase_migrations.schema_migrations")
t=$(psql "$URL" -Atc "select to_regclass('public.gate0_probe') is not null")
[ "$n" = 19 ] && [ "$t" = t ] && ok "probe applied, history = 19" || bad "after push: history=$n probe=$t"
out=$("$SB" db push --dry-run --remote="$URL" 2>&1 || true)
uptodate "$out" && ok "second push: nothing left" || { bad "second push not idempotent"; echo "$out"; }

echo "4. negative: missing / renamed marker is detected"
mv supabase/migrations/20261010053816_point_history.sql "$WORK/held.sql"
rc=0; out=$("$SB" db push --dry-run --remote="$URL" 2>&1) || rc=$?
[ "$rc" != 0 ] && ! uptodate "$out" && ok "missing marker detected (push refused, rc=$rc)" || { bad "missing marker NOT detected"; echo "$out"; }
echo "$out" | grep -iE "not found|repair" | head -2 | sed 's/^/      cli: /'
mv "$WORK/held.sql" supabase/migrations/20261010053816_point_history.sql
cp supabase/migrations/20261010053816_point_history.sql supabase/migrations/20261010053817_point_history.sql
mv supabase/migrations/20261010053816_point_history.sql "$WORK/held.sql"
rc=0; out=$("$SB" db push --dry-run --remote="$URL" 2>&1) || rc=$?
[ "$rc" != 0 ] && ! uptodate "$out" && ok "wrong-version marker detected (push refused, rc=$rc)" || { bad "wrong-version marker NOT detected"; echo "$out"; }
n=$(psql "$URL" -Atc "select count(*) from supabase_migrations.schema_migrations")
[ "$n" = 19 ] && ok "refused pushes changed nothing (history = 19)" || bad "history changed to $n"
rm supabase/migrations/20261010053817_point_history.sql; mv "$WORK/held.sql" supabase/migrations/20261010053816_point_history.sql

echo "5. rename flow (MCP stamps its own version): rename local file to the recorded version"
psql "$URL" -qc "update supabase_migrations.schema_migrations set version='20261109123456' where version='20261109000000'" >/dev/null
mv supabase/migrations/20261109000000_gate0_probe.sql supabase/migrations/20261109123456_gate0_probe.sql
out=$("$SB" migration list --remote="$URL" 2>&1 || true)
[ "$(matched "$out")" = 19 ] && [ "$(unmatched "$out")" = 0 ] && ok "19 matched after rename" || { bad "mismatch after rename"; echo "$out"; }
out=$("$SB" db push --dry-run --remote="$URL" 2>&1 || true)
uptodate "$out" && ok "up to date after rename" || { bad "rename flow breaks push"; echo "$out"; }

echo "markers.sh: $pass passed, $fail failed"
[ "$fail" = 0 ]
