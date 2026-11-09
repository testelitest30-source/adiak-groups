-- Extended drift fingerprint (grants, triggers, constraints, storage buckets). Run read-only on production and the local baseline.
select
(select md5(string_agg(p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||coalesce(array_to_string(array(select x::text from unnest(p.proacl) x order by 1),','),'default'),';' order by p.proname,pg_get_function_identity_arguments(p.oid))) from pg_proc p where p.pronamespace='public'::regnamespace) fn_acl,
(select md5(string_agg(table_name||':'||grantee||':'||privilege_type,';' order by table_name,grantee,privilege_type)) from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated','service_role','PUBLIC')) tbl_acl,
(select md5(string_agg(c.relname||'.'||t.tgname||':'||pg_get_triggerdef(t.oid),';' order by c.relname,t.tgname)) from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and c.relnamespace in ('public'::regnamespace)) trg,
(select md5(string_agg(conrelid::regclass::text||'.'||conname||':'||pg_get_constraintdef(oid),';' order by conrelid::regclass::text,conname)) from pg_constraint where connamespace='public'::regnamespace) cons,
(select string_agg(id||':'||public::text,',' order by id) from storage.buckets) buckets;
