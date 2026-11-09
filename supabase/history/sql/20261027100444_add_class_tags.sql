alter table public.profiles add column if not exists class_tag text;
alter table public.groups   add column if not exists class_tag text;
alter table public.profiles drop constraint if exists profiles_class_tag_fmt;
alter table public.profiles add  constraint profiles_class_tag_fmt check (class_tag is null or class_tag ~ '^[a-z0-9][a-z0-9_-]{0,11}$');
alter table public.groups   drop constraint if exists groups_class_tag_fmt;
alter table public.groups   add  constraint groups_class_tag_fmt  check (class_tag is null or class_tag ~ '^[a-z0-9][a-z0-9_-]{0,11}$');

update public.profiles set class_tag='636s' where role='student' and not is_admin and class_tag is null;
update public.groups g set class_tag=coalesce((select p.class_tag from public.profiles p where p.id=g.host_id),'636s') where g.class_tag is null;

create or replace function public._norm_tag(t text) returns text language sql immutable set search_path to 'public' as $function$
 select lower(regexp_replace(coalesce(t,''),'\s+','','g'))
$function$;

create or replace function public.set_my_class_tag(t text) returns void language plpgsql security definer set search_path to 'public' as $function$
declare p profiles; v text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 if p.class_tag is not null then raise exception 'Your class group number is already set. Ask an admin to change it'; end if;
 v:=_norm_tag(t);
 if v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 update profiles set class_tag=v where id=p.id;
end $function$;

create or replace function public.admin_set_class_tag(u uuid, t text) returns void language plpgsql security definer set search_path to 'public' as $function$
declare p profiles; v text;
begin perform _req('groups');
 select * into p from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 v:=nullif(_norm_tag(t),'');
 if v is not null and v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if p.group_id is not null and v is distinct from p.class_tag then raise exception 'Remove the person from their team first'; end if;
 update profiles set class_tag=v where id=u;
end $function$;
revoke execute on function public.set_my_class_tag(text) from public, anon;
revoke execute on function public.admin_set_class_tag(uuid,text) from public, anon;
grant  execute on function public.set_my_class_tag(text) to authenticated;
grant  execute on function public.admin_set_class_tag(uuid,text) to authenticated;

create or replace function public._group_tag_fill() returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
 if new.class_tag is null and new.host_id is not null then select class_tag into new.class_tag from profiles where id=new.host_id; end if;
 return new;
end $function$;
drop trigger if exists group_tag_fill on public.groups;
create trigger group_tag_fill before insert on public.groups for each row execute function public._group_tag_fill();

create or replace function public._same_class_in_group() returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare gt text;
begin
 if new.group_id is not null and (tg_op='INSERT' or new.group_id is distinct from old.group_id or new.class_tag is distinct from old.class_tag) then
  select class_tag into gt from groups where id=new.group_id;
  if new.class_tag is null then raise exception 'Enter your class group number first'; end if;
  if gt is distinct from new.class_tag then raise exception 'This team belongs to another class group'; end if;
 end if;
 return new;
end $function$;
drop trigger if exists same_class_in_group on public.profiles;
create trigger same_class_in_group before insert or update of group_id, class_tag on public.profiles for each row execute function public._same_class_in_group();

create or replace function public.create_group(nm text, cap integer) returns void language plpgsql security definer set search_path to 'public' as $function$
declare p profiles; gid bigint; mx int;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.group_id is not null then raise exception 'Only idle students can create a group'; end if;
 if p.class_tag is null then raise exception 'Enter your class group number first'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 select value::int into mx from app_settings where key='max_groups';
 if (select count(*) from groups where class_tag=p.class_tag)>=coalesce(mx,6) then raise exception 'The group limit (%) is reached', coalesce(mx,6); end if;
 insert into groups(name,capacity,host_id,class_tag) values(trim(nm),cap,p.id,p.class_tag) returning id into gid;
 update profiles set group_id=gid where id=p.id;
 delete from requests where user_id=p.id;
 perform _say('g:'||gid,p.name||' created the group.');
end $function$;

create or replace function public.request_join(g bigint) returns void language plpgsql security definer set search_path to 'public' as $function$
declare p profiles; n int; cap int;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin then raise exception 'The host account cannot join groups'; end if;
 if p.group_id is not null then raise exception 'Leave your current group first'; end if;
 if p.class_tag is null then raise exception 'Enter your class group number first'; end if;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 if (select class_tag from groups where id=g) is distinct from p.class_tag then raise exception 'This team belongs to another class group'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then raise exception 'This group is full'; end if;
 if n=0 then perform _accept(p.id,g); return; end if;
 if not exists(select 1 from requests where user_id=p.id and group_id=g) then
  insert into requests(user_id,group_id) values(p.id,g);
  perform _say('g:'||g,p.name||' wants to join. A member can put the request to a vote.');
 end if;
end $function$;

create or replace function public.send_invite(g bigint, u uuid) returns void language plpgsql security definer set search_path to 'public' as $function$
declare p profiles; t profiles; n int; cap int;
begin
 select * into p from profiles where id=auth.uid();
 select * into t from profiles where id=u;
 if not found or t.is_admin then raise exception 'Person not found'; end if;
 if not exists(select 1 from groups where id=g and host_id=p.id) then raise exception 'Only the group host can invite'; end if;
 if t.group_id is not null then raise exception 'That person is already in a group'; end if;
 if t.class_tag is distinct from (select class_tag from groups where id=g) then raise exception 'That person is in another class group'; end if;
 select capacity into cap from groups where id=g;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then raise exception 'Your group is full'; end if;
 if exists(select 1 from requests where user_id=u and group_id=g) then
  perform _accept(u,g); return;
 end if;
 insert into invites(group_id,user_id,invited_by) values(g,u,p.id) on conflict do nothing;
 perform _say('g:'||g,p.name||' invited '||t.name||'.');
end $function$;