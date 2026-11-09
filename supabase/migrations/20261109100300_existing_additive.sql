-- ADIAK 1.0 / M4 additive changes to EXISTING functions/policies (previous definitions: supabase/baseline/*.sql,
-- restored by supabase/rollback/m4_disable.sql). Every existing branch is kept byte-for-byte; only new branches are added.
--  * event chat channel  p:<event>:<group>  in _chan_ok, _chtag, send_message and the messages SELECT policy
--  * admin_close_day keeps event chats (they belong to the presentation workspace) instead of failing on them
--  * new permission 'presentations' in admin_set_perms, admin_set_staff, staff_classes
do $$ begin
  if to_regprocedure('public._pres_read(bigint,bigint)') is null then raise exception 'pre-flight: M2 must be applied first'; end if;
  if md5(pg_get_functiondef('public._chan_ok(text,uuid)'::regprocedure)) <> md5($b$CREATE OR REPLACE FUNCTION public._chan_ok(ch text, u uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint; a uuid; b uuid;
begin
 if ch='all' then return true; end if;
 select group_id into g from profiles where id=u;
 if g is not null and ch='g:'||g then return true; end if;
 if ch like 'd:%' then a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  return a<>b and u in (a,b) and public._can_see_user(case when a=u then b else a end,u); end if;
 return false;
exception when others then return false;
end $function$
$b$) then raise exception 'pre-flight: _chan_ok differs from the reviewed baseline (drift) - stop'; end if;
end $$;

-- may user u post to (and therefore be notified about) event chat p:e:g ?
create or replace function public._pres_can_post(e bigint, g bigint, u uuid) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.pres_events ev where ev.id = e and (
     public._perm(u, 'admin')
     or exists (select 1 from public.class_staff s where s.user_id = u and s.class_tag = ev.class_tag and (s.role = 'teacher' or s.perms && array['presentations','chats']))
     or (ev.frozen_at is null and ev.status in ('draft','open','drawn') and exists (select 1 from public.pres_roster r
          join public.pres_event_teams t on t.event_id = r.event_id and t.group_id = r.group_id and t.removed_at is null
          where r.event_id = e and r.group_id = g and r.user_id = u and r.left_at is null))
     or (ev.status = 'live' and exists (select 1 from public.pres_roster r where r.event_id = e and r.group_id = g and r.user_id = u and r.participant))))
$$;
revoke all on function public._pres_can_post(bigint, bigint, uuid) from public, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public._chan_ok(ch text, u uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint; a uuid; b uuid;
begin
 if ch='all' then return true; end if;
 select group_id into g from profiles where id=u;
 if g is not null and ch='g:'||g then return true; end if;
 if ch like 'd:%' then a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  return a<>b and u in (a,b) and public._can_see_user(case when a=u then b else a end,u); end if;
 -- ADIAK 1.0: presentation event chat p:<event>:<group>
 if ch ~ '^p:[0-9]{1,12}:[0-9]{1,12}$' then
  return public._pres_can_post(split_part(ch,':',2)::bigint, split_part(ch,':',3)::bigint, u); end if;
 return false;
exception when others then return false;
end $function$;

CREATE OR REPLACE FUNCTION public._chtag(ch text, ctag text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if ch='all' then return ctag; end if;
 if ch ~ '^g:[0-9]+$' then return (select class_tag from groups where id=substr(ch,3)::bigint); end if;
 if ch ~ '^d:[0-9a-f-]{36}:[0-9a-f-]{36}$' then return coalesce((select class_tag from profiles where id=split_part(ch,':',2)::uuid),(select class_tag from profiles where id=split_part(ch,':',3)::uuid)); end if;
 -- ADIAK 1.0: presentation event chat
 if ch ~ '^p:[0-9]{1,12}:[0-9]{1,12}$' then return (select class_tag from pres_events where id=split_part(ch,':',2)::bigint); end if;
 return null;
exception when others then return null;
end $function$;

CREATE OR REPLACE FUNCTION public.send_message(ch text, body text, cls text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; a uuid; b uuid; t text; tg text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 t:=trim(body); if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
 if ch='all' then
  if p.role='student' and not public._is_admin() then tg:=p.class_tag; if tg is null then raise exception 'Enter your class group number first'; end if; else tg:=coalesce(cls,public._def_class()); end if;
  if tg is null then raise exception 'Choose a class first'; end if;
  if not public._can_class(tg) then raise exception 'Invalid chat'; end if;
 elsif ch='g:'||coalesce(p.group_id::text,'-') then null;
 elsif ch like 'd:%' then
  a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  if a=b or p.id not in (a,b) or not public._can_see_user(case when a=p.id then b else a end) then raise exception 'Invalid chat'; end if;
 elsif ch like 'p:%' then
  -- ADIAK 1.0: presentation event chat
  if not public._chan_ok(ch,p.id) then raise exception 'Invalid chat'; end if;
 else raise exception 'Invalid chat'; end if;
 insert into messages(channel,sender,body,class_tag) values(ch,p.id,t,case when ch='all' then tg end);
end $function$;

-- messages SELECT policy: identical existing branches + event chat read access (staff / active member / participant)
drop policy r on public.messages;
create policy r on public.messages as permissive for select to public using (
  (((channel = 'all'::text) AND _can_class(class_tag)) OR (channel = ('g:'::text || ( SELECT (profiles.group_id)::text AS group_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) OR ((channel ~~ 'd:%'::text) AND (((auth.uid())::text = split_part(channel, ':'::text, 2)) OR ((auth.uid())::text = split_part(channel, ':'::text, 3)))) OR _cperm(_chtag(channel, class_tag), 'chats'::text))
  OR ((channel ~ '^p:[0-9]{1,12}:[0-9]{1,12}$') AND public._pres_read((split_part(channel, ':', 2))::bigint, (split_part(channel, ':', 3))::bigint)));

-- close the day: archive/delete everything EXCEPT presentation event chats (which also could not be labelled before)
CREATE OR REPLACE FUNCTION public.admin_close_day(lbl text, dissolve boolean)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a bigint;
begin perform _req_admin();
 insert into archives(label,created_by) values(coalesce(nullif(trim(lbl),''),'Archive '||to_char(now(),'YYYY-MM-DD')),auth.uid()) returning id into a;
 insert into archived_messages(id,archive_id,channel,channel_label,sender,body,file_path,file_name,file_type,file_size,created_at,participants)
  select m.id,a,m.channel,
   case when m.channel='all' then 'Everyone'
        when m.channel like 'g:%' then coalesce((select name from groups where id=split_part(m.channel,':',2)::bigint),'Group')
        else coalesce((select string_agg(name,' & ' order by name) from profiles where id in (split_part(m.channel,':',2)::uuid,split_part(m.channel,':',3)::uuid)),'Chat') end,
   m.sender,m.body,m.file_path,m.file_name,m.file_type,m.file_size,m.created_at,
   case when m.channel='all' then null
        when m.channel like 'g:%' then coalesce((select array_agg(p.id) from profiles p where p.group_id=split_part(m.channel,':',2)::bigint),'{}')
        else array[split_part(m.channel,':',2)::uuid,split_part(m.channel,':',3)::uuid] end
  from messages m where m.channel not like 'p:%';
 delete from messages where channel not like 'p:%';
 if dissolve then delete from groups; end if;
 return a;
end $function$;

-- new permission 'presentations'
CREATE OR REPLACE FUNCTION public.admin_set_perms(u uuid, p text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 if not (p <@ array['admin','points','groups','chats','passwords','panel','presentations']) then raise exception 'Unknown permission'; end if;
 -- ADIAK 1.0: only the owner grants/removes admin rights or changes the owner's account
 if (('admin'=any(p)) is distinct from exists(select 1 from profiles where id=u and 'admin'=any(perms)) or exists(select 1 from platform_owner where user_id=u)) and not public._is_owner() then raise exception 'Only the owner can grant or remove admin rights'; end if;
 if exists(select 1 from platform_owner where user_id=u) and not 'admin'=any(p) then raise exception 'The owner keeps admin rights'; end if;
 if u=auth.uid() and not 'admin'=any(p) and not exists(select 1 from profiles where id=u and is_admin) then raise exception 'You cannot remove your own admin right'; end if;
 update profiles set perms=p where id=u;
 update class_staff set perms=(select coalesce(array_agg(x),'{}') from unnest(p) x where x in ('points','groups','chats','passwords','accounts','presentations')) where user_id=u and role='teacher';
 if 'admin'=any(p) then delete from password_vault where user_id=u; end if;
end $function$;

CREATE OR REPLACE FUNCTION public.admin_set_staff(u uuid, cls text, r text, p text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pr profiles;
begin perform _req_admin();
 select * into pr from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if not exists(select 1 from classes where tag=cls) then raise exception 'That class group does not exist'; end if;
 if r not in ('teacher','starosta') then raise exception 'Role must be teacher or class representative'; end if;
 if p is null or not (p <@ array['points','groups','chats','passwords','accounts','presentations','announce','coordinate','report']) then raise exception 'Unknown permission'; end if;
 -- ADIAK 1.0: class leaders never get password access or assessment (presentations) rights
 if r='starosta' and p && array['passwords','presentations'] then raise exception 'A class representative cannot get password or assessment permissions'; end if;
 if r='teacher' and (pr.role<>'teacher' or pr.is_admin) then raise exception 'That person is not a teacher'; end if;
 if r='starosta' and (pr.role<>'student' or pr.is_admin or pr.class_tag is distinct from cls) then raise exception 'The class representative must be a student of that class'; end if;
 insert into class_staff(user_id,class_tag,role,perms) values(u,cls,r,p) on conflict (user_id,class_tag) do update set role=excluded.role, perms=excluded.perms;
 update profiles set perms=perms||array['panel'] where id=u and not ('panel'=any(perms));
end $function$;

CREATE OR REPLACE FUNCTION public.staff_classes()
 RETURNS TABLE(tag text, title text, role text, perms text[], students integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select c.tag,c.title,'admin'::text,array['points','groups','chats','passwords','accounts','presentations','announce','coordinate','report'],(select count(*)::int from profiles p where p.class_tag=c.tag and p.role='student' and not p.is_admin) from classes c where public._is_admin()
 union all
 select c.tag,c.title,s.role,s.perms,(select count(*)::int from profiles p where p.class_tag=c.tag and p.role='student' and not p.is_admin) from class_staff s join classes c on c.tag=s.class_tag where s.user_id=auth.uid() and not public._is_admin()
 order by 1 $function$;
