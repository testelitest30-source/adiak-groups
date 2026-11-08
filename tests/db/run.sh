#!/usr/bin/env bash
# Runs tests/db/[0-9]*.sql against a fresh LOCAL database (baseline + all new migrations + fixtures).
# Each test file runs inside one transaction that is rolled back, so files are independent.
# Usage: LOCAL_PG_URL=postgresql://postgres@127.0.0.1:54329 tests/db/run.sh [pattern]
set -uo pipefail
cd "$(dirname "$0")/../.."
BASE="${LOCAL_PG_URL:?set LOCAL_PG_URL to a LOCAL postgres}"
DB=adiak_dbtest
tests/db/setup.sh "$DB" --with-migrations >/dev/null || { echo "setup failed"; exit 1; }
psql "$BASE/$DB" -v ON_ERROR_STOP=1 -q -f tests/db/_lib.sql >/dev/null 2>&1 || { psql "$BASE/$DB" -v ON_ERROR_STOP=1 -q -f tests/db/_lib.sql; exit 1; }
mkdir -p tests/out; : > tests/out/db-report.txt
tp=0; tf=0
for f in tests/db/${1:-[0-9]}*.sql; do
  out=$( { echo "begin;"; cat "$f"; echo; echo "rollback;"; } | psql "$BASE/$DB" -X -q -v ON_ERROR_STOP=1 2>&1 )
  rc=$?
  p=$(echo "$out" | grep -c 'TAP ok - ' || true); n=$(echo "$out" | grep -c 'TAP not ok - ' || true)
  if [ $rc -ne 0 ]; then n=$((n+1)); echo "$out" | grep -E 'ERROR|psql:' | head -3 | sed "s|^|  $f: |"; fi
  printf '%-36s %3d passed %3d failed\n' "$(basename "$f")" "$p" "$n" | tee -a tests/out/db-report.txt
  echo "$out" | grep 'TAP not ok - ' | sed 's/.*TAP /    /' | tee -a tests/out/db-report.txt
  tp=$((tp+p)); tf=$((tf+n))
done
echo "DB TESTS: $tp passed, $tf failed" | tee -a tests/out/db-report.txt
[ "$tf" = 0 ]
