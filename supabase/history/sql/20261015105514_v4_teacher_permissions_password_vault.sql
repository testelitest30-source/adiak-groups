-- ===== müəllim rolu + ayrı-ayrı yetkilər =====
alter table profiles add column role text not null default 'student' check (role in ('student','teacher'));
alter table profiles add column pw_updated_at timestamptz;

-- yalnız tələbələr qrupa düşə bilər (müəllim və Host düşə bilməz)
create function _only_students_in_groups() returns trigger language plpgsql as $$
begin
 if new.group_id is not null and (new.role<>'student' or new.is_admin) then raise exception 'Only students can be placed in groups'; end if;
 return new;
end $$;
create trigger only_students_in_groups before insert or update of group_id on profiles for each row execute function _only_students_in_groups();

-- yetki yoxlayan köməkçi: admin hər şeyi edə bilər, qalanlar yalnız özündəki yetkini
create function _req(p text) returns void language plpgsql stable security definer set search_path=public as $$
begin if not _perm(auth.uid(),p) then raise exception 'You do not have permission for this action'; end if; end $$;

-- ===== parol surəti (şifrələnmiş) =====
select vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'pw_copy_key','Encrypts the admin-visible copy of passwords');
create table password_vault(user_id uuid primary key references profiles(id) on delete cascade, ct text not null,
 source text not null check (source in ('temp','student')), updated_at timestamptz not null default now());
alter table password_vault enable row level security;
revoke all on password_vault from anon, authenticated;
create function _pw_key() returns text language sql stable security definer set search_path=public as
$$ select decrypted_secret from vault.decrypted_secrets where name='pw_copy_key' $$;
-- adminlərin parolu heç vaxt saxlanmır
create function _pw_save(u uuid, pw text, src text) returns void language plpgsql security definer set search_path=public as $$
begin
 if _perm(u,'admin') then delete from password_vault where user_id=u; return; end if;
 insert into password_vault(user_id,ct,source) values(u,encode(extensions.pgp_sym_encrypt(pw,_pw_key()),'base64'),src)
  on conflict (user_id) do update set ct=excluded.ct, source=excluded.source, updated_at=now();
 update profiles set pw_updated_at=now() where id=u;
end $$;

create or replace function _set_temp(u uuid, p text) returns void language plpgsql security definer set search_path=public as $$
begin
 update auth.users set encrypted_password=extensions.crypt(p,extensions.gen_salt('bf')),
  raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||'{"must_change":true}'::jsonb, updated_at=now() where id=u;
 delete from auth.sessions where user_id=u;
 update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u;
 perform _pw_save(u,p,'temp');
end $$;

-- istifadəçi öz parolunu dəyişəndə sayt bunu çağırır; parol həqiqətən düzgün olmalıdır
create function set_my_password_copy(pw text) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and encrypted_password=extensions.crypt(pw,encrypted_password)) then raise exception 'That is not your current password'; end if;
 perform _pw_save(auth.uid(),pw,'student');
end $$;

create function admin_get_password(u uuid) returns table(pw text, source text, updated_at timestamptz) language plpgsql security definer set search_path=public as $$
begin perform _req('passwords');
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 return query select extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()), v.source, v.updated_at from password_vault v where v.user_id=u;
end $$;

create function admin_list_passwords() returns table(user_id uuid, name text, login text, role text, pw text, source text, updated_at timestamptz) language plpgsql security definer set search_path=public as $$
begin perform _req('passwords');
 return query select p.id,p.name,p.login,p.role,
   case when v.ct is null then null else extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end, v.source, v.updated_at
  from profiles p left join password_vault v on v.user_id=p.id where not _perm(p.id,'admin') order by p.name;
end $$;

create or replace function admin_reset_password(u uuid) returns text language plpgsql security definer set search_path=public as $$
declare p text;
begin perform _req('passwords');
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 p:=_pwgen(); perform _set_temp(u,p); return p; end $$;

-- ===== yeni adam yaratmaq: tələbə və ya müəllim =====
drop function admin_create_user(text);
drop function _create_user(text);
create function _create_user(raw text, r text default 'student') returns table(new_name text, new_login text, temp_password text) language plpgsql security definer set search_path=public as $$
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
end $$;
create function admin_create_user(raw text, r text default 'student') returns table(new_name text, new_login text, temp_password text) language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); return query select * from _create_user(raw,r); end $$;

-- ===== hər əməliyyat öz yetkisini tələb edir =====
create or replace function admin_set_perms(u uuid, p text[]) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin();
 if not (p <@ array['admin','points','groups','chats','passwords','panel']) then raise exception 'Unknown permission'; end if;
 if u=auth.uid() and not 'admin'=any(p) and not exists(select 1 from profiles where id=u and is_admin) then raise exception 'You cannot remove your own admin right'; end if;
 update profiles set perms=p where id=u;
 if 'admin'=any(p) then delete from password_vault where user_id=u; end if;
end $$;

create or replace function add_points(u uuid, n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not _perm(auth.uid(),'points') then raise exception 'You do not have permission to give points'; end if;
 if n is null or n=0 or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin and role='student';
 if not found then raise exception 'That account cannot receive points'; end if;
 insert into point_events(user_id,amount,kind) values(u,n,'host');
end $$;

create or replace function admin_remove_member(u uuid) returns void language plpgsql security definer set search_path=public as $$
declare g bigint; nm text;
begin perform _req('groups');
 select group_id,name into g,nm from profiles where id=u; if g is null then return; end if;
 update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g);
 if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 perform _say('g:'||g,nm||' was removed from the group.');
end $$;

create or replace function admin_move_member(u uuid, g bigint) returns void language plpgsql security definer set search_path=public as $$
declare old bigint; nm text; cap int; n int;
begin perform _req('groups');
 select group_id,name into old,nm from profiles where id=u;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap and old is distinct from g then raise exception 'That group is full'; end if;
 update profiles set group_id=g where id=u; delete from requests where user_id=u; delete from invites where user_id=u; delete from kicks where target_id=u;
 if old is not null and old<>g then perform _fix_host(old); end if;
 perform _fix_host(g); perform _say('g:'||g,nm||' was added to this group.');
end $$;

create or replace function admin_group_update(g bigint, nm text, cap int, host uuid) returns void language plpgsql security definer set search_path=public as $$
begin perform _req('groups');
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if cap<(select count(*) from profiles where group_id=g) then raise exception 'The group already has more members than that'; end if;
 if host is not null and not exists(select 1 from profiles where id=host and group_id=g) then raise exception 'The host must be a member of the group'; end if;
 update groups set name=trim(nm), capacity=cap, host_id=coalesce(host,host_id) where id=g;
end $$;

create or replace function admin_delete_group(g bigint) returns void language plpgsql security definer set search_path=public as $$
begin perform _req('groups'); delete from messages where channel='g:'||g; delete from groups where id=g; end $$;

create or replace function admin_delete_message(i bigint) returns void language plpgsql security definer set search_path=public as $$
begin perform _req('chats'); delete from messages where id=i; end $$;
create or replace function admin_clear_channel(ch text) returns void language plpgsql security definer set search_path=public as $$
begin perform _req('chats'); delete from messages where channel=ch; end $$;
create or replace function admin_clear_all_chats() returns void language plpgsql security definer set search_path=public as $$
begin perform _req('chats'); delete from messages; end $$;

create or replace function start_kick(t uuid) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; tg profiles; kid bigint;
begin
 select * into p from profiles where id=auth.uid();
 select * into tg from profiles where id=t;
 if not found or tg.group_id is null then raise exception 'That person is not in a group'; end if;
 if t=p.id then raise exception 'Use Leave group instead'; end if;
 if not _perm(p.id,'groups') and not exists(select 1 from groups where id=tg.group_id and host_id=p.id) then
  raise exception 'Only the group host or admin can start a kick vote'; end if;
 if exists(select 1 from kicks where target_id=t) then raise exception 'A vote is already open for this person'; end if;
 insert into kicks(group_id,target_id) values(tg.group_id,t) returning id into kid;
 if p.group_id=tg.group_id then insert into kick_ballots values(kid,p.id,true); end if;
 perform _say('g:'||tg.group_id,'Kick vote started for '||tg.name||'. 80% of the other members must approve.');
 perform _check_kick(kid);
end $$;

create or replace function host_decide(r bigint, ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare q requests; p profiles; nm text;
begin
 select * into p from profiles where id=auth.uid();
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not _perm(p.id,'groups') and not exists(select 1 from groups where id=q.group_id and host_id=p.id) then raise exception 'Only the group host makes the final decision'; end if;
 if q.stage<>'approved' then raise exception 'The members have not approved this request yet'; end if;
 select name into nm from profiles where id=q.user_id;
 if ok then
  if not _accept(q.user_id,q.group_id) then raise exception 'The group is full'; end if;
 else
  delete from requests where id=r;
  perform _say('g:'||q.group_id,'The host declined '||nm||'.');
 end if;
end $$;

create or replace function cancel_invite(i bigint) returns void language sql security definer set search_path=public as
$$ delete from invites where id=i and (invited_by=auth.uid() or _perm(auth.uid(),'groups')) $$;

-- çatları oxumaq/silmək = "chats" yetkisi
drop policy admin_all on messages;
create policy chats_all on messages for select to authenticated using (_perm(auth.uid(),'chats'));
drop policy r on archived_messages;
create policy r on archived_messages for select to authenticated using (participants is null or auth.uid()=any(participants) or _perm(auth.uid(),'chats'));

-- ===== icazələr =====
revoke execute on function _only_students_in_groups(),_req(text),_pw_key(),_pw_save(uuid,text,text),_create_user(text,text) from public, anon, authenticated;
revoke execute on function set_my_password_copy(text),admin_get_password(uuid),admin_list_passwords(),admin_create_user(text,text) from public, anon;
grant execute on function set_my_password_copy(text),admin_get_password(uuid),admin_list_passwords(),admin_create_user(text,text) to authenticated;