-- Baseline functions (part A: _accept .. _req_c), verbatim from production pg_get_functiondef.
CREATE OR REPLACE FUNCTION public._accept(u uuid, g bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare cap int; n int; nm text;
begin
 select capacity into cap from groups where id=g for update;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then delete from requests where group_id=g; delete from invites where group_id=g; return false; end if;
 update profiles set group_id=g where id=u returning name into nm;
 delete from requests where user_id=u;
 delete from invites where user_id=u;
 perform _fix_host(g);
 perform _say('g:'||g, nm||' joined the group 🎉');
 if n+1>=cap then delete from requests where group_id=g; delete from invites where group_id=g; perform _say('g:'||g,'The group is full.'); end if;
 return true;
end $function$
;
CREATE OR REPLACE FUNCTION public._can_class(tag text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select public._is_admin() or (tag is not null and (exists(select 1 from profiles me where me.id=auth.uid() and me.role='student' and me.class_tag=tag) or exists(select 1 from class_staff s where s.user_id=auth.uid() and s.class_tag=tag))) $function$
;
CREATE OR REPLACE FUNCTION public._can_see_user(o uuid, v uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select exists(select 1 from profiles po, profiles pv where po.id=o and pv.id=v and (
  po.id=pv.id or public._perm(pv.id,'admin') or public._perm(po.id,'admin')
  or (po.role='student' and ((pv.role='student' and pv.class_tag is not null and pv.class_tag=po.class_tag) or exists(select 1 from class_staff s where s.user_id=pv.id and s.class_tag=po.class_tag)))
  or (po.role='teacher' and exists(select 1 from class_staff so where so.user_id=po.id and (pv.class_tag=so.class_tag or exists(select 1 from class_staff sv where sv.user_id=pv.id and sv.class_tag=so.class_tag)))))) $function$
;
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
 return false;
exception when others then return false;
end $function$
;
CREATE OR REPLACE FUNCTION public._check_join(r bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q requests; n int; need int; yea int; nay int; nm text;
begin
 select * into q from requests where id=r; if not found or q.stage<>'voting' then return; end if;
 select count(*) into n from profiles where group_id=q.group_id;
 need:=n/2+1;
 select count(*) filter (where b.approve), count(*) filter (where not b.approve) into yea,nay
  from join_ballots b join profiles p on p.id=b.voter_id and p.group_id=q.group_id where b.request_id=r;
 select name into nm from profiles where id=q.user_id;
 if yea>=need then
  update requests set stage='approved' where id=r;
  perform _say('g:'||q.group_id,'Majority approved '||nm||'. Waiting for the host''s final decision.');
 elsif n-nay<need then
  delete from requests where id=r;
  perform _say('g:'||q.group_id,'Request from '||nm||' was declined by the vote.');
 end if;
end $function$
;
CREATE OR REPLACE FUNCTION public._check_kick(k bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q kicks; n int; need int; yea int; nay int; nm text;
begin
 select * into q from kicks where id=k; if not found then return; end if;
 select count(*) into n from profiles where group_id=q.group_id and id<>q.target_id;
 need:=(4*n+4)/5;
 select count(*) filter (where b.approve), count(*) filter (where not b.approve) into yea,nay
  from kick_ballots b join profiles p on p.id=b.voter_id and p.group_id=q.group_id and p.id<>q.target_id where b.kick_id=k;
 select name into nm from profiles where id=q.target_id;
 if yea>=need then
  update profiles set group_id=null where id=q.target_id;
  delete from kicks where id=k;
  perform _fix_host(q.group_id);
  perform _say('g:'||q.group_id,nm||' was removed from the group (vote passed).');
 elsif n-nay<need then
  delete from kicks where id=k;
  perform _say('g:'||q.group_id,'Vote to remove '||nm||' failed.');
 end if;
end $function$
;
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
 return null;
exception when others then return null;
end $function$
;
CREATE OR REPLACE FUNCTION public._cperm(tag text, p text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select public._is_admin() or (tag is not null and exists(select 1 from class_staff s where s.user_id=auth.uid() and s.class_tag=tag and p=any(s.perms))) $function$
;
CREATE OR REPLACE FUNCTION public._create_user(raw text, r text DEFAULT 'student'::text)
 RETURNS TABLE(new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare parts text[]; fn text; ln text; base text; idt text; k int:=1; nm text; pw text; u uuid:=gen_random_uuid();
 mp text:='əıöüçşğƏÖÜÇŞĞİ'; mt text:='eioucsgeoucsgi';
begin
 if r not in ('student','teacher') then raise exception 'Role must be student or teacher'; end if;
 raw:=regexp_replace(trim(coalesce(raw,'')),'\s+',' ','g'); if raw='' then raise exception 'Type a name'; end if;
 parts:=string_to_array(raw,' ');
 fn:=regexp_replace(lower(translate(parts[1],mp,mt)),'[^a-z0-9]','','g');
 ln:=regexp_replace(lower(translate(parts[array_length(parts,1)],mp,mt)),'[^a-z0-9]','','g');
 base:=case when array_length(parts,1)>1 and ln<>'' then fn||'.'||left(ln,1) else fn end; if base='' then base:='user'; end if;
 idt:=base; while exists(select 1 from auth.users where email=idt||'@classroom.app') loop k:=k+1; idt:=base||k; end loop;
 nm:=left(raw,30); k:=1; while exists(select 1 from profiles where name=nm) loop k:=k+1; nm:=left(raw,26)||' '||k; end loop;
 pw:=_pwgen();
 insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('00000000-0000-0000-0000-000000000000',u,'authenticated','authenticated',idt||'@classroom.app',extensions.crypt(pw,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"must_change":true}'::jsonb,now(),now(),'','','','');
 insert into auth.identities(id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
 values(gen_random_uuid(),u,jsonb_build_object('sub',u::text,'email',idt||'@classroom.app','email_verified',true),'email',u::text,now(),now(),now());
 insert into profiles(id,name,login,role,perms) values(u,nm,idt||'@classroom.app',r,case when r='teacher' then '{points,groups}'::text[] else '{}'::text[] end);
 perform _pw_save(u,pw,'temp');
 new_name:=nm; new_login:=idt; temp_password:=pw; return next;
end $function$
;
CREATE OR REPLACE FUNCTION public._def_class()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select case when (select count(*) from classes c where public._can_class(c.tag))=1 then (select c.tag from classes c where public._can_class(c.tag)) end $function$
;
CREATE OR REPLACE FUNCTION public._fix_host(g bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ update groups set host_id = case when exists(select 1 from profiles where id=groups.host_id and group_id=g)
   then host_id else (select id from profiles where group_id=g order by name limit 1) end where id=g $function$
;
CREATE OR REPLACE FUNCTION public._group_tag_fill()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if new.class_tag is null and new.host_id is not null then select class_tag into new.class_tag from profiles where id=new.host_id; end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public._gtag(g bigint)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select class_tag from groups where id=g $function$
;
CREATE OR REPLACE FUNCTION public._is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select public._perm(auth.uid(),'admin') $function$
;
CREATE OR REPLACE FUNCTION public._msg_class()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if new.channel='all' and new.class_tag is null and new.sender is not null then
  select class_tag into new.class_tag from profiles where id=new.sender and role='student' and not public._perm(id,'admin');
  if new.class_tag is null then new.class_tag:=public._def_class(); end if;
 end if; return new; end $function$
;
CREATE OR REPLACE FUNCTION public._norm_tag(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
 select lower(regexp_replace(coalesce(t,''),'\s+','','g'))
$function$
;
CREATE OR REPLACE FUNCTION public._only_students_in_groups()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
 if new.group_id is not null and (new.role<>'student' or new.is_admin) then raise exception 'Only students can be placed in groups'; end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public._perm(u uuid, p text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists(select 1 from profiles where id=u and (is_admin or 'admin'=any(perms) or p=any(perms))) $function$
;
CREATE OR REPLACE FUNCTION public._ptag(u uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select class_tag from profiles where id=u $function$
;
CREATE OR REPLACE FUNCTION public._pw_key()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select decrypted_secret from vault.decrypted_secrets where name='pw_copy_key' $function$
;
CREATE OR REPLACE FUNCTION public._pw_save(u uuid, pw text, src text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if _perm(u,'admin') then delete from password_vault where user_id=u; return; end if;
 insert into password_vault(user_id,ct,source) values(u,encode(extensions.pgp_sym_encrypt(pw,_pw_key()),'base64'),src)
  on conflict (user_id) do update set ct=excluded.ct, source=excluded.source, updated_at=now();
 update profiles set pw_updated_at=now() where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public._pwgen()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789',(get_byte(b,i)%31)+1,1),'') from (select extensions.gen_random_bytes(8) b) x, generate_series(0,7) i $function$
;
CREATE OR REPLACE FUNCTION public._req(p text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if not _perm(auth.uid(),p) then raise exception 'You do not have permission for this action'; end if; end $function$
;
CREATE OR REPLACE FUNCTION public._req_admin()
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin if not _perm(auth.uid(),'admin') then raise exception 'Admins only'; end if; end $function$
;
CREATE OR REPLACE FUNCTION public._req_c(p text, tag text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin if not public._cperm(tag,p) then raise exception 'You do not have permission for this action'; end if; end $function$
;
