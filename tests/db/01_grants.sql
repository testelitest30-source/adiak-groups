-- Grant/search_path audit for every function and table added by ADIAK 1.0 (classes A/B/C/D from the plan).
create function pg_temp.baseline_names() returns text[] language sql as $$ select array[
 '_accept','_can_class','_can_see_user','_chan_ok','_check_join','_check_kick','_chtag','_cperm','_create_user','_def_class','_fix_host',
 '_group_tag_fill','_gtag','_is_admin','_msg_class','_norm_tag','_only_students_in_groups','_perm','_ptag','_pw_key','_pw_save','_pwgen',
 '_req','_req_admin','_req_c','_same_class_in_group','_say','_set_temp','_tag_award','_tags_eval','_tg_grp','_tg_prof','_tg_push',
 'add_points','add_sticker','admin_add_students','admin_clear_all_chats','admin_clear_channel','admin_close_day','admin_create_class',
 'admin_create_user','admin_delete_feedback','admin_delete_group','admin_delete_message','admin_delete_tag','admin_delete_user',
 'admin_force_logout','admin_get_password','admin_give_tag','admin_group_update','admin_import_students','admin_list_passwords',
 'admin_move_member','admin_remove_member','admin_remove_staff','admin_reset_all','admin_reset_password','admin_save_tag',
 'admin_set_class_tag','admin_set_feedback','admin_set_login','admin_set_name','admin_set_perms','admin_set_role','admin_set_setting',
 'admin_set_staff','admin_take_tag','cancel_invite','cancel_request','claim_session','class_choices','create_group','delete_message',
 'delete_sticker','drop_push','edit_message','host_decide','leave_group','open_vote','push_targets','request_join','respond_invite',
 'save_push','send_feedback','send_file','send_invite','send_message','send_reply','send_sticker','set_my_class_tag',
 'set_my_password_copy','staff_classes','start_kick','toggle_reaction','update_me','vote_join','vote_kick'] $$;
create temp table nf as
select p.proname, p.oid::regprocedure::text sig, p.prosecdef, coalesce(array_to_string(p.proconfig, ','), '') cfg,
       has_function_privilege('public', p.oid, 'EXECUTE') pub, has_function_privilege('anon', p.oid, 'EXECUTE') an,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') au, has_function_privilege('service_role', p.oid, 'EXECUTE') sr
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname <> all (pg_temp.baseline_names());

select test.ok((select count(*) > 60 from nf), 'audit covers the new functions (' || (select count(*) from nf) || ')');
select test.eq((select string_agg(proname, ',') from nf where cfg not like '%search_path=pg_catalog, public%' and cfg not like '%search_path=pg_catalog%'), null,
  'every new function pins search_path to pg_catalog[, public]');
select test.eq((select string_agg(proname, ',') from nf where pub or an), null, 'no new function is executable by PUBLIC or anon');
-- class C: service only
select test.eq((select string_agg(proname, ',') from nf where proname in ('push_claim','push_mark','push_purge','push_sweep','pres_due_reminders') and (au or not sr or prosecdef)),
  null, 'class C: INVOKER, service_role only, not authenticated');
-- class A: authenticated
select test.eq((select string_agg(proname, ',') from nf where (proname like 'pres\_%' or proname like 'live\_%' or proname like 'notes\_%' or proname in ('save_fcm','drop_fcm','server_now'))
   and proname <> 'pres_due_reminders' and not au), null, 'class A: every user RPC executable by authenticated');
-- class B: policy helpers executable by authenticated (required by RLS) and boolean/text only
select test.eq((select string_agg(proname, ',') from nf where proname in ('_pres_staff','_pres_class','_pres_member','_pres_participant','_pres_read','_pres_ev_tag','_pres_path_eg') and not au),
  null, 'class B: policy helpers executable by authenticated');
-- class D + internals: nobody
select test.eq((select string_agg(proname, ',') from nf where (proname like '\_tg\_%' or proname in ('_notify','_push_kick','_pres_freeze','_pres_roster_fill','_pres_can_post',
   '_pres_event_for_staff','_pres_team_lock','_pres_live_lock','_pres_live_goto','_pres_staff_ids','_pres_team_ids','_pres_event_ids','_me_ok')) and au),
  null, 'class D/internal helpers are not executable by clients');
-- tables: clients may only SELECT
select test.eq((select string_agg(distinct table_name, ',') from information_schema.role_table_grants
   where grantee in ('anon','authenticated') and table_schema = 'public' and privilege_type <> 'SELECT'
     and (table_name like 'pres\_%' or table_name in ('notifications','notify_errors','notify_kinds','push_devices','push_outbox','sys_config'))), null,
  'new tables: no INSERT/UPDATE/DELETE grants for clients');
select test.eq((select string_agg(distinct table_name, ',') from information_schema.role_table_grants
   where grantee = 'anon' and table_schema = 'public' and (table_name like 'pres\_%' or table_name in ('notifications','push_devices','push_outbox','sys_config'))), null,
  'new tables: no anon grants at all');
select test.eq((select string_agg(c.relname, ',') from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity), null,
  'RLS enabled on every public table');
select test.eq((select count(*)::int from pg_policies where schemaname = 'public' and cmd <> 'SELECT'), 0, 'no write policies anywhere (writes only via RPCs)');
select test.eq((select count(*)::int from pg_policies where schemaname = 'storage' and policyname like 'team_files%' and cmd in ('UPDATE','DELETE','ALL')), 0,
  'team-files: no update/delete storage policy');
-- ID types match their references
select test.eq((select string_agg(table_name || '.' || column_name || ':' || data_type, ',') from information_schema.columns
   where table_schema = 'public' and (table_name like 'pres\_%' or table_name in ('notifications','push_devices','push_outbox'))
     and ((column_name in ('group_id','event_id') and data_type <> 'bigint')
       or (column_name in ('user_id','uploader','reviewer','assignee','actor','drawn_by','created_by','author','submitted_by') and data_type <> 'uuid'))), null,
  'group/event ids are bigint, user ids are uuid');
select test.eq((select format_type(atttypid, atttypmod) from pg_attribute where attrelid = 'public.pres_draws'::regclass and attname = 'result'), 'bigint[]', 'draw result is bigint[]');
