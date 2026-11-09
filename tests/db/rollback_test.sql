-- Rollback: disable restores the reviewed baseline byte-for-byte and keeps all new data; enable restores the feature.
begin;
select test.mk_event() as e \gset
select test.as(test.id('s2')); select public.send_message('p:' || :e || ':1', 'keep me');
select test.as_db();
select count(*) as before_rows from public.pres_audit \gset
commit;
\i supabase/rollback/batchA_disable.sql
begin;
select test.eq((select md5(string_agg(md5(pg_get_functiondef(p.oid)), ',' order by proname)) from pg_proc p where pronamespace = 'public'::regnamespace
  and proname in ('_chan_ok','_chtag','send_message','admin_close_day','admin_set_perms','admin_set_staff','staff_classes')), :'basesig',
  'disable restores the 7 changed functions byte-for-byte');
select test.ok((select qual not like '%p:%' from pg_policies where tablename = 'messages' and policyname = 'r'), 'messages policy restored');
select test.ok(exists(select 1 from public.pres_events where id = :e) and (select count(*) from public.pres_audit) >= :before_rows
  and exists(select 1 from public.messages where body = 'keep me'), 'all new data kept (events, audit, event chat rows)');
select test.as(test.id('s2'));
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'permission denied', 'new RPCs disabled for clients');
select test.eq((select count(*)::int from public.messages where channel like 'p:%'), 0, 'event chats hidden (old policy)');
select test.lives($q$select public.send_message('g:1', 'old chat works')$q$, 'existing features keep working while disabled');
select test.as_db();
commit;
\i supabase/rollback/batchA_enable.sql
begin;
select test.as(test.id('s2'));
select test.lives(format('select public.pres_pick(%s, 1)', :e), 'enable restores the RPCs');
select test.eq((select count(*)::int from public.messages where channel = 'p:' || :e || ':1'), 1, 'event chat visible again, history intact');
commit;
