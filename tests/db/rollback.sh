#!/usr/bin/env bash
# Rollback test on fresh LOCAL databases: disable -> baseline byte-for-byte + data kept; enable -> feature back.
set -uo pipefail
cd "$(dirname "$0")/../.."
BASE="${LOCAL_PG_URL:?set LOCAL_PG_URL to a LOCAL postgres}"
tests/db/setup.sh rb_base >/dev/null || exit 1
SIG=$(psql "$BASE/rb_base" -Atc "select md5(string_agg(md5(pg_get_functiondef(p.oid)), ',' order by proname)) from pg_proc p where pronamespace='public'::regnamespace and proname in ('_chan_ok','_chtag','send_message','admin_close_day','admin_set_perms','admin_set_staff','staff_classes')")
tests/db/setup.sh rb_test --with-migrations >/dev/null || exit 1
psql "$BASE/rb_test" -q -v ON_ERROR_STOP=1 -f tests/db/_lib.sql >/dev/null 2>&1 || exit 1
out=$(psql "$BASE/rb_test" -X -q -v ON_ERROR_STOP=1 -v basesig="$SIG" -f tests/db/rollback_test.sql 2>&1); rc=$?
p=$(echo "$out" | grep -c 'TAP ok - '); n=$(echo "$out" | grep -c 'TAP not ok - ')
[ $rc -ne 0 ] && { n=$((n+1)); echo "$out" | grep -E 'ERROR' | head -3; }
echo "$out" | grep 'TAP not ok' | sed 's/.*TAP /    /'
printf '%-36s %3d passed %3d failed\n' rollback_test.sql "$p" "$n"
psql "$BASE/postgres" -qc "drop database rb_base" -c "drop database rb_test" >/dev/null 2>&1
[ "$n" = 0 ]
