-- Baseline functions (part C: admin_list_passwords .. edit_message), from production pg_get_functiondef.
CREATE OR REPLACE FUNCTION public.admin_list_passwords()
 RETURNS TABLE(user_id uuid, name text, login text, role text, pw text, source text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not (public._is_admin() or exists(select 1 from class_staff where class_staff.user_id=auth.uid() and 'passwords'=any(class_staff.perms))) then raise exception 'You do not have permission for this action'; end if;
 return query select p.id,p.name,p.login,p.role,
  case when v.ct is not null and a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
  case when v.ct is null then null when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source else 'stale' end, v.updated_at
  from profiles p join auth.users a on a.id=p.id left join password_vault v on v.user_id=p.id
  where not _perm(p.id,'admin') and (public._is_admin() or (p.role='student' and public._cperm(p.class_tag,'passwords'))) order by p.name;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_move_member(u uuid, g bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare old bigint; nm text; cap int; n int;
begin perform public._req_c('groups',public._gtag(g));
 select group_id,name into old,nm from profiles where id=u;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap and old is distinct from g then raise exception 'That group is full'; end if;
 update profiles set group_id=g where id=u; delete from requests where user_id=u; delete from invites where user_id=u; delete from kicks where target_id=u;
 if old is not null and old<>g then perform _fix_host(old); end if;
 perform _fix_host(g); perform _say('g:'||g,nm||' was added to this group.');
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_remove_member(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint; nm text;
begin perform public._req_c('groups',public._ptag(u));
 select group_id,name into g,nm from profiles where id=u; if g is null then return; end if;
 update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g);
 if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 perform _say('g:'||g,nm||' was removed from the group.');
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_remove_staff(u uuid, cls text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from class_staff where user_id=u and class_tag=cls;
 update profiles set perms=array_remove(perms,'panel') where id=u and role='student' and not exists(select 1 from class_staff where user_id=u);
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_reset_all()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 delete from messages; delete from archives; delete from point_events; delete from groups;
 update profiles set points=0, group_id=null;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_reset_password(u uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p text;
begin perform public._req_c('passwords',public._ptag(u));
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 if not public._is_admin() and not exists(select 1 from profiles where id=u and role='student') then raise exception 'You do not have permission for this action'; end if;
 p:=_pwgen(); perform _set_temp(u,p); return p; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_save_tag(i bigint, nm text, em text, col text, ds text, rw integer, rl text, rn integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid;
begin perform _req_admin();
 if trim(coalesce(nm,''))='' then raise exception 'Type a tag name'; end if;
 if i is null then
  insert into tags(name,emoji,color,descr,reward,rule,rule_n)
  values(trim(nm),coalesce(nullif(trim(em),''),'🏷️'),coalesce(col,'#7c3aed'),coalesce(ds,''),coalesce(rw,0),coalesce(rl,'manual'),coalesce(rn,0)) returning id into i;
 else
  update tags set name=trim(nm),emoji=coalesce(nullif(trim(em),''),'🏷️'),color=coalesce(col,'#7c3aed'),descr=coalesce(ds,''),reward=coalesce(rw,0),rule=coalesce(rl,'manual'),rule_n=coalesce(rn,0) where id=i;
  if not found then raise exception 'Tag not found'; end if;
 end if;
 for u in select id from profiles where role='student' and not is_admin loop perform _tags_eval(u); end loop;
 return i;
exception when unique_violation then raise exception 'A tag with that name already exists';
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_class_tag(u uuid, t text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; v text;
begin perform _req_admin();
 select * into p from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 v:=nullif(_norm_tag(t),'');
 if v is not null and v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if v is not null and not exists(select 1 from classes where tag=v) then raise exception 'That class group does not exist'; end if;
 if p.group_id is not null and v is distinct from p.class_tag then raise exception 'Remove the person from their team first'; end if;
 update profiles set class_tag=v where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_feedback(i bigint, s text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); if s not in ('new','done') then raise exception 'Invalid status'; end if; update feedback set status=s where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_login(u uuid, idt text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e text;
begin perform _req_admin(); idt:=lower(trim(idt));
 if idt !~ '^[a-z0-9._-]{2,40}$' then raise exception 'ID: 2-40 characters, letters, digits, dot, dash, underscore'; end if;
 e:=idt||'@classroom.app';
 if exists(select 1 from auth.users where email=e and id<>u) then raise exception 'That ID is already used'; end if;
 update auth.users set email=e, updated_at=now() where id=u;
 update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(e)) where user_id=u and provider='email';
 update profiles set login=e where id=u;
 return e;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_name(u uuid, nm text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not (public._is_admin() or (public._cperm(public._ptag(u),'accounts') and exists(select 1 from profiles where id=u and role='student' and not is_admin))) then raise exception 'Admins only'; end if;
 nm:=trim(nm);
 if char_length(nm) not between 2 and 30 then raise exception 'Name must be 2 to 30 characters'; end if;
 update profiles set name=nm where id=u;
exception when unique_violation then raise exception 'That name is already taken';
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_perms(u uuid, p text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 if not (p <@ array['admin','points','groups','chats','passwords','panel']) then raise exception 'Unknown permission'; end if;
 if u=auth.uid() and not 'admin'=any(p) and not exists(select 1 from profiles where id=u and is_admin) then raise exception 'You cannot remove your own admin right'; end if;
 update profiles set perms=p where id=u;
 update class_staff set perms=(select coalesce(array_agg(x),'{}') from unnest(p) x where x in ('points','groups','chats','passwords','accounts')) where user_id=u and role='teacher';
 if 'admin'=any(p) then delete from password_vault where user_id=u; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_role(u uuid, r text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint;
begin perform _req_admin();
 if r not in ('student','teacher') then raise exception 'Role must be student or teacher'; end if;
 if exists(select 1 from profiles where id=u and is_admin) then raise exception 'The Host account has no role'; end if;
 if r='teacher' then
  select group_id into g from profiles where id=u;
  if g is not null then update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g); end if;
  delete from requests where user_id=u; delete from invites where user_id=u;
 end if;
 update profiles set role=r where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_setting(k text, v text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 if k<>'max_groups' then raise exception 'Unknown setting'; end if;
 if v !~ '^[0-9]{1,2}$' or v::int not between 1 and 12 then raise exception 'Choose 1 to 12'; end if;
 if v::int<(select count(*) from groups) then raise exception 'There are already more groups than that'; end if;
 update app_settings set value=v where key=k;
end $function$
;
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
 if p is null or not (p <@ array['points','groups','chats','passwords','accounts']) then raise exception 'Unknown permission'; end if;
 if r='teacher' and (pr.role<>'teacher' or pr.is_admin) then raise exception 'That person is not a teacher'; end if;
 if r='starosta' and (pr.role<>'student' or pr.is_admin or pr.class_tag is distinct from cls) then raise exception 'The class representative must be a student of that class'; end if;
 insert into class_staff(user_id,class_tag,role,perms) values(u,cls,r,p) on conflict (user_id,class_tag) do update set role=excluded.role, perms=excluded.perms;
 update profiles set perms=perms||array['panel'] where id=u and not ('panel'=any(perms));
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_take_tag(u uuid, t bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from user_tags where user_id=u and tag_id=t; end $function$
;
CREATE OR REPLACE FUNCTION public.cancel_invite(i bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ delete from invites where id=i and (invited_by=auth.uid() or _perm(auth.uid(),'groups')) $function$
;
CREATE OR REPLACE FUNCTION public.cancel_request(g bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ delete from requests where user_id=auth.uid() and group_id=g $function$
;
CREATE OR REPLACE FUNCTION public.claim_session(s text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ insert into sessions(user_id,sid) values(auth.uid(),s) on conflict (user_id) do update set sid=excluded.sid, updated_at=now() $function$
;
CREATE OR REPLACE FUNCTION public.class_choices()
 RETURNS TABLE(tag text, title text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select c.tag,c.title from classes c
 where exists(select 1 from profiles me where me.id=auth.uid() and me.role='student' and me.class_tag is null and not public._perm(me.id,'admin'))
 order by c.tag $function$
;
CREATE OR REPLACE FUNCTION public.create_group(nm text, cap integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION public.delete_message(mid bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
       begin
        update messages set deleted=true, body='', file_path=null, file_name=null, file_type=null, file_size=null
          where id=mid and not deleted and (sender=auth.uid() or public._is_admin());
           if not found then raise exception 'You cannot delete this message'; end if;
           end $function$
;
CREATE OR REPLACE FUNCTION public.delete_sticker(sid bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
         begin delete from stickers where id=sid and owner=auth.uid(); end $function$
;
CREATE OR REPLACE FUNCTION public.drop_push(ep text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin delete from push_subs where endpoint=ep and user_id=auth.uid(); end $function$
;
CREATE OR REPLACE FUNCTION public.edit_message(mid bigint, b text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    declare t text:=trim(b);
    begin
     if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
      update messages set body=t, edited_at=now() where id=mid and sender=auth.uid() and not deleted and file_path is null;
       if not found then raise exception 'You cannot edit this message'; end if;
       end $function$
;
