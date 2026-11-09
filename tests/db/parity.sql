-- Schema fingerprint. Run read-only on production AND on the local baseline; all three values must match
-- before any migration is applied (drift check). Baseline 2026-11-09:
--   fns  f272d14e2351a790f71cf04eeac512af   pol a5bcf306dda9110151fe03dd3a569948   cols b2d25064e6fb2befc0530184b73de7d4
select (select md5(string_agg(proname||':'||md5(replace(pg_get_functiondef(oid),E'\r','')),',' order by proname)) from pg_proc where pronamespace='public'::regnamespace) fns,
(select md5(string_agg(tablename||policyname||coalesce(qual,'')||coalesce(with_check,''),',' order by tablename,policyname)) from pg_policies where schemaname in ('public','storage')) pol,
(select md5(string_agg(c.relname||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||a.attnotnull,',' order by c.relname,a.attnum)) from pg_class c join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped where c.relnamespace='public'::regnamespace and c.relkind='r') cols;
