-- Baseline functions (part B: _same_class_in_group .. admin_import_students), from production pg_get_functiondef.
-- (CRLF line endings in a few production bodies are normalised to LF here; logic is identical.)
CREATE OR REPLACE FUNCTION public._same_class_in_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare gt text;
begin
 if new.group_id is not null and (tg_op='INSERT' or new.group_id is distinct from old.group_id or new.class_tag is distinct from old.class_tag) then
  select class_tag into gt from groups where id=new.group_id;
  if new.class_tag is null then raise exception 'Enter your class group number first'; end if;
  if gt is distinct from new.class_tag then raise exception 'This team belongs to another class group'; end if;
 end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public._say(ch text, t text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ insert into messages(channel,sender,body) values(ch,null,t) $function$
;
CREATE OR REPLACE FUNCTION public._set_temp(u uuid, p text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 update auth.users set encrypted_password=extensions.crypt(p,extensions.gen_salt('bf')),
  raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||'{"must_change":true}'::jsonb, updated_at=now() where id=u;
 delete from auth.sessions where user_id=u;
 update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u;
 perform _pw_save(u,p,'temp');
end $function$
;
CREATE OR REPLACE FUNCTION public._tag_award(u uuid, t tags, src text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 insert into user_tags(user_id,tag_id,source) values(u,t.id,src) on conflict do nothing;
 if found and t.reward>0 then update profiles set points=points+t.reward where id=u; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public._tags_eval(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t tags; p profiles;
begin
 select * into p from profiles where id=u;
 if not found or p.is_admin or p.role<>'student' then return; end if;
 for t in select * from tags where rule<>'manual' loop
  if (t.rule='points' and p.points>=t.rule_n) or (t.rule='team' and p.group_id is not null)
     or (t.rule='host' and exists(select 1 from groups g where g.host_id=u)) then
   perform _tag_award(u,t,'auto');
  end if;
 end loop;
end $function$
;
CREATE OR REPLACE FUNCTION public._tg_grp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if new.host_id is not null then perform _tags_eval(new.host_id); end if; return null; end $function$
;
CREATE OR REPLACE FUNCTION public._tg_prof()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _tags_eval(new.id); return null; end $function$
;
CREATE OR REPLACE FUNCTION public._tg_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare sec text;
begin
 if new.sender is null then return null; end if;
 select secret into sec from push_config where id=1;
 perform net.http_post(url:='https://epenklutnevjvgpsjehp.supabase.co/functions/v1/push-send',
  headers:=jsonb_build_object('Content-Type','application/json','x-push-secret',sec),
  body:=jsonb_build_object('mid',new.id));
 return null;
exception when others then return null;
end $function$
;
CREATE OR REPLACE FUNCTION public.add_points(u uuid, n integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not public._cperm(public._ptag(u),'points') then raise exception 'You do not have permission to give points'; end if;
 if n is null or n=0 or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin and role='student';
 if not found then raise exception 'That account cannot receive points'; end if;
 insert into point_events(user_id,amount,kind) values(u,n,'host');
end $function$
;
CREATE OR REPLACE FUNCTION public.add_sticker(pth text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
     begin
      if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid()) then raise exception 'Not signed in'; end if;
       if not exists(select 1 from storage.objects where bucket_id='stickers' and name=pth) then raise exception 'Sticker file not found'; end if;
        if (select count(*) from stickers where owner=auth.uid())>=60 then raise exception 'Sticker limit reached (60)'; end if;
         insert into stickers(owner,path) values(auth.uid(),pth) on conflict do nothing;
         end $function$
;
CREATE OR REPLACE FUNCTION public.admin_add_students(cls text, names text[])
 RETURNS TABLE(new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_clear_all_chats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin perform _req_admin(); delete from messages; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_clear_channel(ch text, cls text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tg text;
begin tg:=case when ch='all' then coalesce(cls,public._def_class()) else public._chtag(ch,null) end; perform public._req_c('chats',tg);
 if ch='all' then delete from messages where channel='all' and class_tag=tg; else delete from messages where channel=ch; end if; end $function$
;
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
  from messages m;
 delete from messages;
 if dissolve then delete from groups; end if;
 return a;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_create_class(t text, ttl text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v text;
begin perform _req_admin(); v:=_norm_tag(t);
 if v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if exists(select 1 from classes where tag=v) then raise exception 'That class group already exists'; end if;
 insert into classes(tag,title) values(v,nullif(trim(coalesce(ttl,'')),''));
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_create_user(raw text, r text DEFAULT 'student'::text)
 RETURNS TABLE(new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); return query select * from _create_user(raw,r); end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_feedback(i bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from feedback where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_group(g bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public._req_c('groups',public._gtag(g)); delete from messages where channel='g:'||g; delete from groups where id=g; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_message(i bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tg text;
begin select public._chtag(channel,class_tag) into tg from messages where id=i; perform public._req_c('chats',tg); delete from messages where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_tag(i bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from tags where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_user(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; g bigint;
begin
 select * into p from profiles where id=u;
 if not found then raise exception 'Person not found'; end if;
 if u=auth.uid() then raise exception 'You cannot delete yourself'; end if;
 if p.is_admin then raise exception 'Admin accounts cannot be deleted here'; end if;
 perform public._req_c('accounts',p.class_tag);
 g:=p.group_id;
 if g is not null then
  update profiles set group_id=null where id=u;
  delete from kicks where target_id=u;
  perform _fix_host(g);
  if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 end if;
 delete from messages where sender=u;
 delete from auth.users where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_force_logout(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from auth.sessions where user_id=u; update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_get_password(u uuid)
 RETURNS TABLE(pw text, source text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public._req_c('passwords',public._ptag(u));
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 if not public._is_admin() and not exists(select 1 from profiles where id=u and role='student') then raise exception 'You do not have permission for this action'; end if;
 return query select case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
  case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source else 'stale' end, v.updated_at
  from password_vault v join auth.users a on a.id=v.user_id where v.user_id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_give_tag(u uuid, t bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g tags;
begin perform _req_admin(); select * into g from tags where id=t; if not found then raise exception 'Tag not found'; end if;
 if not exists(select 1 from profiles where id=u and role='student' and not is_admin) then raise exception 'Only students can get tags'; end if;
 perform _tag_award(u,g,'manual'); end $function$
;
CREATE OR REPLACE FUNCTION public.admin_group_update(g bigint, nm text, cap integer, host uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public._req_c('groups',public._gtag(g));
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if cap<(select count(*) from profiles where group_id=g) then raise exception 'The group already has more members than that'; end if;
 if host is not null and not exists(select 1 from profiles where id=host and group_id=g) then raise exception 'The host must be a member of the group'; end if;
 update groups set name=trim(nm), capacity=cap, host_id=coalesce(host,host_id) where id=g;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_import_students(names text[])
 RETURNS TABLE(slot_name text, new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare slots uuid[]; i int; j int:=0; raw text; parts text[]; fn text; ln text; base text; idt text; k int; nm text; pw text; u uuid; olds text;
begin perform _req_admin();
 -- only accounts nobody has claimed yet (password never changed) are given to the new names
 select array_agg(p.id order by p.login) into slots from profiles p join auth.users a on a.id=p.id
  where not p.is_admin and coalesce(a.raw_user_meta_data->>'must_change','')='true';
 if names is null or array_length(names,1) is null then raise exception 'No names given'; end if;
 if array_length(names,1)>coalesce(array_length(slots,1),0) then raise exception 'Only % unused accounts are left, but % names were given',coalesce(array_length(slots,1),0),array_length(names,1); end if;
 for i in 1..array_length(names,1) loop
  raw:=regexp_replace(trim(names[i]),'\s+',' ','g'); continue when raw='';
  j:=j+1; u:=slots[j]; parts:=string_to_array(raw,' ');
  fn:=regexp_replace(translate(lower(parts[1]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  ln:=regexp_replace(translate(lower(parts[array_length(parts,1)]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  base:=case when array_length(parts,1)>1 and ln<>'' then fn||'.'||left(ln,1) else fn end;
  if base='' then base:='student'||j; end if;
  idt:=base; k:=1;
  while exists(select 1 from auth.users where email=idt||'@classroom.app' and id<>u) loop k:=k+1; idt:=base||k; end loop;
  nm:=left(raw,30); k:=1;
  while exists(select 1 from profiles where name=nm and id<>u) loop k:=k+1; nm:=left(raw,26)||' '||k; end loop;
  select name into olds from profiles where id=u; pw:=_pwgen();
  update profiles set name=nm, login=idt||'@classroom.app' where id=u;
  update auth.users set email=idt||'@classroom.app' where id=u;
  update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(idt||'@classroom.app')) where user_id=u and provider='email';
  perform _set_temp(u,pw);
  slot_name:=olds; new_name:=nm; new_login:=idt; temp_password:=pw; return next;
 end loop;
end $function$
;
