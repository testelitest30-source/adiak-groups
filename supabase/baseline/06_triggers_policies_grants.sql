-- Baseline triggers, policies, buckets, settings, realtime publication and grants, from production catalogs.
CREATE TRIGGER group_tag_fill BEFORE INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION _group_tag_fill();
CREATE TRIGGER msg_class BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION _msg_class();
CREATE TRIGGER only_students_in_groups BEFORE INSERT OR UPDATE OF group_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION _only_students_in_groups();
CREATE TRIGGER same_class_in_group BEFORE INSERT OR UPDATE OF group_id, class_tag ON public.profiles FOR EACH ROW EXECUTE FUNCTION _same_class_in_group();
CREATE TRIGGER tg_push AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION _tg_push();
CREATE TRIGGER tg_tags_grp AFTER INSERT OR UPDATE OF host_id ON public.groups FOR EACH ROW EXECUTE FUNCTION _tg_grp();
CREATE TRIGGER tg_tags_prof AFTER UPDATE OF points, group_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION _tg_prof();

create policy chat_read on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'chat-files'::text) AND ((EXISTS ( SELECT 1
   FROM messages m
  WHERE (m.file_path = objects.name))) OR (EXISTS ( SELECT 1
   FROM archived_messages a
  WHERE (a.file_path = objects.name))))));
create policy chat_upload on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'chat-files'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy fb_r on public.feedback as PERMISSIVE for SELECT to authenticated using (_is_admin());
create policy fb_rd on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'feedback'::text) AND _is_admin()));
create policy fb_up on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'feedback'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy own on public.sessions as PERMISSIVE for SELECT to authenticated using ((user_id = auth.uid()));
create policy r on public.app_settings as PERMISSIVE for SELECT to authenticated using (true);
create policy r on public.archived_messages as PERMISSIVE for SELECT to public using ((_is_admin() OR (auth.uid() = ANY (participants))));
create policy r on public.archives as PERMISSIVE for SELECT to authenticated using (true);
create policy r on public.class_staff as PERMISSIVE for SELECT to public using (((user_id = auth.uid()) OR _can_class(class_tag)));
create policy r on public.classes as PERMISSIVE for SELECT to public using (_can_class(tag));
create policy r on public.groups as PERMISSIVE for SELECT to public using (_can_class(class_tag));
create policy r on public.invites as PERMISSIVE for SELECT to public using (_can_class(_gtag(group_id)));
create policy r on public.join_ballots as PERMISSIVE for SELECT to public using (_can_class(_ptag(voter_id)));
create policy r on public.kick_ballots as PERMISSIVE for SELECT to public using (_can_class(_ptag(voter_id)));
create policy r on public.kicks as PERMISSIVE for SELECT to public using (_can_class(_gtag(group_id)));
create policy r on public.messages as PERMISSIVE for SELECT to public using ((((channel = 'all'::text) AND _can_class(class_tag)) OR (channel = ('g:'::text || ( SELECT (profiles.group_id)::text AS group_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) OR ((channel ~~ 'd:%'::text) AND (((auth.uid())::text = split_part(channel, ':'::text, 2)) OR ((auth.uid())::text = split_part(channel, ':'::text, 3)))) OR _cperm(_chtag(channel, class_tag), 'chats'::text)));
create policy r on public.point_events as PERMISSIVE for SELECT to public using (_can_class(_ptag(user_id)));
create policy r on public.profiles as PERMISSIVE for SELECT to public using (((id = auth.uid()) OR _can_see_user(id)));
create policy r on public.requests as PERMISSIVE for SELECT to public using (_can_class(_gtag(group_id)));
create policy rx_r on public.msg_reactions as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM messages m
  WHERE (m.id = msg_reactions.msg_id))));
create policy stk_r on public.stickers as PERMISSIVE for SELECT to authenticated using ((owner = auth.uid()));
create policy stk_read on storage.objects as PERMISSIVE for SELECT to authenticated using ((bucket_id = 'stickers'::text));
create policy stk_upload on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'stickers'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy tags_r on public.tags as PERMISSIVE for SELECT to authenticated using (true);
create policy utags_r on public.user_tags as PERMISSIVE for SELECT to authenticated using (true);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('chat-files','chat-files',false,26214400,NULL);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('feedback','feedback',false,10485760,NULL);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('stickers','stickers',false,1048576,'{image/png,image/webp,image/jpeg,image/gif}');
insert into public.app_settings values ('max_groups','6');
insert into public.push_config(id) values (1);

alter publication supabase_realtime add table public.profiles, public.groups, public.requests, public.join_ballots, public.kicks,
  public.kick_ballots, public.messages, public.invites, public.app_settings, public.sessions, public.tags, public.user_tags, public.msg_reactions;

-- Table grants as in production (Supabase default privileges: anon/authenticated/service_role have all table privileges; RLS restricts).
grant all on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
-- Function grants exactly as in production (pg_proc.proacl on 2026-11-09).
revoke all on all functions in schema public from public, anon, authenticated, service_role;
grant execute on all functions in schema public to service_role;
grant execute on function public._norm_tag(text), public._group_tag_fill(), public._same_class_in_group(), public._tg_prof(), public._tg_grp() to public;
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p where p.pronamespace='public'::regnamespace and p.proname not in
    ('_accept','_check_join','_check_kick','_req_admin','_fix_host','_pwgen','_set_temp','_say','_pw_save','_only_students_in_groups',
     '_req','_pw_key','_create_user','_norm_tag','_group_tag_fill','_same_class_in_group','_tg_prof','_tg_grp')
  loop execute format('grant execute on function %s to authenticated', f.sig); end loop; end $$;
