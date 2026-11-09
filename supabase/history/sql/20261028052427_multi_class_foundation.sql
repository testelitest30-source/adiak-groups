create table if not exists public.classes(tag text primary key check (tag ~ '^[a-z0-9][a-z0-9_-]{0,11}$'), title text, created_at timestamptz not null default now());
create table if not exists public.class_staff(user_id uuid not null references public.profiles(id) on delete cascade, class_tag text not null references public.classes(tag) on delete cascade on update cascade, role text not null check (role in ('teacher','starosta')), perms text[] not null default '{}', primary key(user_id,class_tag));
insert into public.classes(tag) select distinct class_tag from public.profiles where class_tag is not null union select '636s' on conflict do nothing;
alter table public.profiles drop constraint if exists profiles_class_tag_fk;
alter table public.profiles add constraint profiles_class_tag_fk foreign key(class_tag) references public.classes(tag) on update cascade;
alter table public.groups drop constraint if exists groups_class_tag_fk;
alter table public.groups add constraint groups_class_tag_fk foreign key(class_tag) references public.classes(tag) on update cascade;
alter table public.classes enable row level security; alter table public.class_staff enable row level security;
revoke all on public.classes, public.class_staff from anon, authenticated;
grant select on public.classes, public.class_staff to authenticated;
insert into public.class_staff(user_id,class_tag,role,perms) select p.id,'636s','teacher',coalesce((select array_agg(x) from unnest(p.perms) x where x in ('points','groups','chats','passwords')),'{}') from public.profiles p where p.role='teacher' and not p.is_admin on conflict do nothing;

create or replace function public._is_admin() returns boolean language sql stable security definer set search_path to 'public' as $f$ select public._perm(auth.uid(),'admin') $f$;
create or replace function public._can_class(tag text) returns boolean language sql stable security definer set search_path to 'public' as $f$
 select public._is_admin() or (tag is not null and (exists(select 1 from profiles me where me.id=auth.uid() and me.role='student' and me.class_tag=tag) or exists(select 1 from class_staff s where s.user_id=auth.uid() and s.class_tag=tag))) $f$;
create or replace function public._cperm(tag text,p text) returns boolean language sql stable security definer set search_path to 'public' as $f$
 select public._is_admin() or (tag is not null and exists(select 1 from class_staff s where s.user_id=auth.uid() and s.class_tag=tag and p=any(s.perms))) $f$;
create or replace function public._req_c(p text,tag text) returns void language plpgsql stable security definer set search_path to 'public' as $f$ begin if not public._cperm(tag,p) then raise exception 'You do not have permission for this action'; end if; end $f$;
create or replace function public._ptag(u uuid) returns text language sql stable security definer set search_path to 'public' as $f$ select class_tag from profiles where id=u $f$;
create or replace function public._gtag(g bigint) returns text language sql stable security definer set search_path to 'public' as $f$ select class_tag from groups where id=g $f$;
create or replace function public._chtag(ch text,ctag text) returns text language plpgsql stable security definer set search_path to 'public' as $f$
begin
 if ch='all' then return ctag; end if;
 if ch ~ '^g:[0-9]+$' then return (select class_tag from groups where id=substr(ch,3)::bigint); end if;
 if ch ~ '^d:[0-9a-f-]{36}:[0-9a-f-]{36}$' then return coalesce((select class_tag from profiles where id=split_part(ch,':',2)::uuid),(select class_tag from profiles where id=split_part(ch,':',3)::uuid)); end if;
 return null;
exception when others then return null;
end $f$;
create or replace function public._can_see_user(o uuid, v uuid default auth.uid()) returns boolean language sql stable security definer set search_path to 'public' as $f$
 select exists(select 1 from profiles po, profiles pv where po.id=o and pv.id=v and (
  po.id=pv.id or public._perm(pv.id,'admin') or public._perm(po.id,'admin')
  or (po.role='student' and ((pv.role='student' and pv.class_tag is not null and pv.class_tag=po.class_tag) or exists(select 1 from class_staff s where s.user_id=pv.id and s.class_tag=po.class_tag)))
  or (po.role='teacher' and exists(select 1 from class_staff so where so.user_id=po.id and (pv.class_tag=so.class_tag or exists(select 1 from class_staff sv where sv.user_id=pv.id and sv.class_tag=so.class_tag)))))) $f$;

alter table public.messages add column if not exists class_tag text;
update public.messages set class_tag='636s' where channel='all' and class_tag is null;
create or replace function public._msg_class() returns trigger language plpgsql security definer set search_path to 'public' as $f$
begin if new.channel='all' and new.class_tag is null and new.sender is not null then select class_tag into new.class_tag from profiles where id=new.sender and role='student'; end if; return new; end $f$;
drop trigger if exists msg_class on public.messages;
create trigger msg_class before insert on public.messages for each row execute function public._msg_class();

drop policy if exists r on public.classes; create policy r on public.classes for select using (public._can_class(tag));
drop policy if exists r on public.class_staff; create policy r on public.class_staff for select using (user_id=auth.uid() or public._can_class(class_tag));
drop policy if exists r on public.profiles; create policy r on public.profiles for select using (id=auth.uid() or public._can_see_user(id));
drop policy if exists r on public.groups; create policy r on public.groups for select using (public._can_class(class_tag));
drop policy if exists r on public.requests; create policy r on public.requests for select using (public._can_class(public._gtag(group_id)));
drop policy if exists r on public.invites; create policy r on public.invites for select using (public._can_class(public._gtag(group_id)));
drop policy if exists r on public.kicks; create policy r on public.kicks for select using (public._can_class(public._gtag(group_id)));
drop policy if exists r on public.join_ballots; create policy r on public.join_ballots for select using (public._can_class(public._ptag(voter_id)));
drop policy if exists r on public.kick_ballots; create policy r on public.kick_ballots for select using (public._can_class(public._ptag(voter_id)));
drop policy if exists r on public.point_events; create policy r on public.point_events for select using (public._can_class(public._ptag(user_id)));
drop policy if exists chats_all on public.messages;
drop policy if exists r on public.messages;
create policy r on public.messages for select using (
 (channel='all' and public._can_class(class_tag))
 or channel=('g:'||(select group_id::text from profiles where id=auth.uid()))
 or (channel like 'd:%' and (auth.uid()::text=split_part(channel,':',2) or auth.uid()::text=split_part(channel,':',3)))
 or public._cperm(public._chtag(channel,class_tag),'chats'));
drop policy if exists r on public.archived_messages;
create policy r on public.archived_messages for select using (public._is_admin() or auth.uid()=any(participants));

create or replace function public._chan_ok(ch text,u uuid) returns boolean language plpgsql stable security definer set search_path to 'public' as $f$
declare g bigint; a uuid; b uuid;
begin
 if ch='all' then return true; end if;
 select group_id into g from profiles where id=u;
 if g is not null and ch='g:'||g then return true; end if;
 if ch like 'd:%' then a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  return a<>b and u in (a,b) and public._can_see_user(case when a=u then b else a end,u); end if;
 return false;
exception when others then return false;
end $f$;

drop function if exists public.send_message(text,text);
create or replace function public.send_message(ch text,body text,cls text default null) returns void language plpgsql security definer set search_path to 'public' as $f$
declare p profiles; a uuid; b uuid; t text; tg text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 t:=trim(body); if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
 if ch='all' then
  if p.role='student' and not public._is_admin() then tg:=p.class_tag; if tg is null then raise exception 'Enter your class group number first'; end if; else tg:=cls; end if;
  if tg is null then raise exception 'Choose a class first'; end if;
  if not public._can_class(tg) then raise exception 'Invalid chat'; end if;
 elsif ch='g:'||coalesce(p.group_id::text,'-') then null;
 elsif ch like 'd:%' then
  a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  if a=b or p.id not in (a,b) or not public._can_see_user(case when a=p.id then b else a end) then raise exception 'Invalid chat'; end if;
 else raise exception 'Invalid chat'; end if;
 insert into messages(channel,sender,body,class_tag) values(ch,p.id,t,case when ch='all' then tg end);
end $f$;

create or replace function public.add_points(u uuid,n integer) returns void language plpgsql security definer set search_path to 'public' as $f$
begin
 if not public._cperm(public._ptag(u),'points') then raise exception 'You do not have permission to give points'; end if;
 if n is null or n=0 or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin and role='student';
 if not found then raise exception 'That account cannot receive points'; end if;
 insert into point_events(user_id,amount,kind) values(u,n,'host');
end $f$;
create or replace function public.admin_clear_all_chats() returns void language plpgsql security definer set search_path to 'public' as $f$ begin perform _req_admin(); delete from messages; end $f$;
drop function if exists public.admin_clear_channel(text);
create or replace function public.admin_clear_channel(ch text,cls text default null) returns void language plpgsql security definer set search_path to 'public' as $f$
declare tg text;
begin tg:=case when ch='all' then cls else public._chtag(ch,null) end; perform public._req_c('chats',tg);
 if ch='all' then delete from messages where channel='all' and class_tag=tg; else delete from messages where channel=ch; end if; end $f$;
create or replace function public.admin_delete_message(i bigint) returns void language plpgsql security definer set search_path to 'public' as $f$
declare tg text;
begin select public._chtag(channel,class_tag) into tg from messages where id=i; perform public._req_c('chats',tg); delete from messages where id=i; end $f$;
create or replace function public.admin_delete_group(g bigint) returns void language plpgsql security definer set search_path to 'public' as $f$
begin perform public._req_c('groups',public._gtag(g)); delete from messages where channel='g:'||g; delete from groups where id=g; end $f$;
create or replace function public.admin_group_update(g bigint,nm text,cap integer,host uuid) returns void language plpgsql security definer set search_path to 'public' as $f$
begin perform public._req_c('groups',public._gtag(g));
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if cap<(select count(*) from profiles where group_id=g) then raise exception 'The group already has more members than that'; end if;
 if host is not null and not exists(select 1 from profiles where id=host and group_id=g) then raise exception 'The host must be a member of the group'; end if;
 update groups set name=trim(nm), capacity=cap, host_id=coalesce(host,host_id) where id=g;
end $f$;
create or replace function public.admin_move_member(u uuid,g bigint) returns void language plpgsql security definer set search_path to 'public' as $f$
declare old bigint; nm text; cap int; n int;
begin perform public._req_c('groups',public._gtag(g));
 select group_id,name into old,nm from profiles where id=u;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap and old is distinct from g then raise exception 'That group is full'; end if;
 update profiles set group_id=g where id=u; delete from requests where user_id=u; delete from invites where user_id=u; delete from kicks where target_id=u;
 if old is not null and old<>g then perform _fix_host(old); end if;
 perform _fix_host(g); perform _say('g:'||g,nm||' was added to this group.');
end $f$;
create or replace function public.admin_remove_member(u uuid) returns void language plpgsql security definer set search_path to 'public' as $f$
declare g bigint; nm text;
begin perform public._req_c('groups',public._ptag(u));
 select group_id,name into g,nm from profiles where id=u; if g is null then return; end if;
 update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g);
 if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 perform _say('g:'||g,nm||' was removed from the group.');
end $f$;
create or replace function public.admin_get_password(u uuid) returns table(pw text,source text,updated_at timestamptz) language plpgsql security definer set search_path to 'public' as $f$
begin perform public._req_c('passwords',public._ptag(u));
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 if not public._is_admin() and not exists(select 1 from profiles where id=u and role='student') then raise exception 'You do not have permission for this action'; end if;
 return query select case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
  case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source else 'stale' end, v.updated_at
  from password_vault v join auth.users a on a.id=v.user_id where v.user_id=u;
end $f$;
create or replace function public.admin_reset_password(u uuid) returns text language plpgsql security definer set search_path to 'public' as $f$
declare p text;
begin perform public._req_c('passwords',public._ptag(u));
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 if not public._is_admin() and not exists(select 1 from profiles where id=u and role='student') then raise exception 'You do not have permission for this action'; end if;
 p:=_pwgen(); perform _set_temp(u,p); return p; end $f$;
create or replace function public.admin_list_passwords() returns table(user_id uuid,name text,login text,role text,pw text,source text,updated_at timestamptz) language plpgsql security definer set search_path to 'public' as $f$
begin
 if not (public._is_admin() or exists(select 1 from class_staff where class_staff.user_id=auth.uid() and 'passwords'=any(class_staff.perms))) then raise exception 'You do not have permission for this action'; end if;
 return query select p.id,p.name,p.login,p.role,
  case when v.ct is not null and a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
  case when v.ct is null then null when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source else 'stale' end, v.updated_at
  from profiles p join auth.users a on a.id=p.id left join password_vault v on v.user_id=p.id
  where not _perm(p.id,'admin') and (public._is_admin() or (p.role='student' and public._cperm(p.class_tag,'passwords'))) order by p.name;
end $f$;
create or replace function public.admin_set_name(u uuid,nm text) returns void language plpgsql security definer set search_path to 'public' as $f$
begin
 if not (public._is_admin() or (public._cperm(public._ptag(u),'accounts') and exists(select 1 from profiles where id=u and role='student' and not is_admin))) then raise exception 'Admins only'; end if;
 nm:=trim(nm);
 if char_length(nm) not between 2 and 30 then raise exception 'Name must be 2 to 30 characters'; end if;
 update profiles set name=nm where id=u;
exception when unique_violation then raise exception 'That name is already taken';
end $f$;
create or replace function public.admin_set_perms(u uuid,p text[]) returns void language plpgsql security definer set search_path to 'public' as $f$
begin perform _req_admin();
 if not (p <@ array['admin','points','groups','chats','passwords','panel']) then raise exception 'Unknown permission'; end if;
 if u=auth.uid() and not 'admin'=any(p) and not exists(select 1 from profiles where id=u and is_admin) then raise exception 'You cannot remove your own admin right'; end if;
 update profiles set perms=p where id=u;
 update class_staff set perms=(select coalesce(array_agg(x),'{}') from unnest(p) x where x in ('points','groups','chats','passwords','accounts')) where user_id=u and role='teacher';
 if 'admin'=any(p) then delete from password_vault where user_id=u; end if;
end $f$;
create or replace function public.admin_set_class_tag(u uuid,t text) returns void language plpgsql security definer set search_path to 'public' as $f$
declare p profiles; v text;
begin perform _req_admin();
 select * into p from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 v:=nullif(_norm_tag(t),'');
 if v is not null and v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if v is not null and not exists(select 1 from classes where tag=v) then raise exception 'That class group does not exist'; end if;
 if p.group_id is not null and v is distinct from p.class_tag then raise exception 'Remove the person from their team first'; end if;
 update profiles set class_tag=v where id=u;
end $f$;
create or replace function public.set_my_class_tag(t text) returns void language plpgsql security definer set search_path to 'public' as $f$
declare p profiles; v text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 if p.class_tag is not null then raise exception 'Your class group number is already set. Ask an admin to change it'; end if;
 v:=_norm_tag(t);
 if v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if not exists(select 1 from classes where tag=v) then raise exception 'That class group does not exist'; end if;
 update profiles set class_tag=v where id=p.id;
end $f$;

create or replace function public.admin_create_class(t text,ttl text default null) returns void language plpgsql security definer set search_path to 'public' as $f$
declare v text;
begin perform _req_admin(); v:=_norm_tag(t);
 if v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if exists(select 1 from classes where tag=v) then raise exception 'That class group already exists'; end if;
 insert into classes(tag,title) values(v,nullif(trim(coalesce(ttl,'')),''));
end $f$;
create or replace function public.admin_set_staff(u uuid,cls text,r text,p text[]) returns void language plpgsql security definer set search_path to 'public' as $f$
declare pr profiles;
begin perform _req_admin();
 select * into pr from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if not exists(select 1 from classes where tag=cls) then raise exception 'That class group does not exist'; end if;
 if r not in ('teacher','starosta') then raise exception 'Role must be teacher or class representative'; end if;
 if p is null or not (p <@ array['points','groups','chats','passwords','accounts']) then raise exception 'Unknown permission'; end if;
 if r='teacher' and (pr.role<>'teacher' or pr.is_admin) then raise exception 'That person is not a teacher'; end if;
 if r='starosta' and (pr.role<>'student' or pr.is_admin or pr.class_tag is distinct from cls) then raise exception 'The class representative must be a student of that class'; end if;
 insert into class_staff(user_id,class_tag,role,perms) values(u,cls,r,p) on conflict (user_id,class_tag) do update set role=excluded.role, perms=excluded.perms;
 update profiles set perms=perms||array['panel'] where id=u and not ('panel'=any(perms));
end $f$;
create or replace function public.admin_remove_staff(u uuid,cls text) returns void language plpgsql security definer set search_path to 'public' as $f$
begin perform _req_admin(); delete from class_staff where user_id=u and class_tag=cls;
 update profiles set perms=array_remove(perms,'panel') where id=u and role='student' and not exists(select 1 from class_staff where user_id=u);
end $f$;
create or replace function public.admin_add_students(cls text,names text[]) returns table(new_name text,new_login text,temp_password text) language plpgsql security definer set search_path to 'public' as $f$
declare i int; r record; nm text;
begin perform public._req_c('accounts',cls);
 if not exists(select 1 from classes where tag=cls) then raise exception 'That class group does not exist'; end if;
 if names is null or array_length(names,1) is null then raise exception 'No names given'; end if;
 if array_length(names,1)>60 then raise exception 'At most 60 names at a time'; end if;
 for i in 1..array_length(names,1) loop
  nm:=regexp_replace(trim(names[i]),'\s+',' ','g'); continue when nm='';
  select * into r from _create_user(nm,'student');
  update profiles set class_tag=cls where login=r.new_login||'@classroom.app';
  new_name:=r.new_name; new_login:=r.new_login; temp_password:=r.temp_password; return next;
 end loop;
end $f$;
create or replace function public.staff_classes() returns table(tag text,title text,role text,perms text[],students integer) language sql stable security definer set search_path to 'public' as $f$
 select c.tag,c.title,'admin'::text,array['points','groups','chats','passwords','accounts'],(select count(*)::int from profiles p where p.class_tag=c.tag and p.role='student' and not p.is_admin) from classes c where public._is_admin()
 union all
 select c.tag,c.title,s.role,s.perms,(select count(*)::int from profiles p where p.class_tag=c.tag and p.role='student' and not p.is_admin) from class_staff s join classes c on c.tag=s.class_tag where s.user_id=auth.uid() and not public._is_admin()
 order by 1 $f$;

do $g$ declare r record; begin
 for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('_is_admin','_can_class','_cperm','_req_c','_ptag','_gtag','_chtag','_can_see_user','_msg_class','_chan_ok','send_message','add_points','admin_clear_all_chats','admin_clear_channel','admin_delete_group','admin_delete_message','admin_get_password','admin_group_update','admin_list_passwords','admin_move_member','admin_remove_member','admin_reset_password','admin_set_name','admin_set_perms','admin_set_class_tag','set_my_class_tag','admin_create_class','admin_set_staff','admin_remove_staff','admin_add_students','staff_classes')
 loop execute format('revoke all on function %s from public, anon',r.sig); execute format('grant execute on function %s to authenticated',r.sig); end loop;
end $g$;