-- internal: creates a full account (login + profile) with a temporary password. ID = first name . first letter of surname
create function _create_user(raw text) returns table(new_name text, new_login text, temp_password text) language plpgsql security definer set search_path=public as $$
declare parts text[]; fn text; ln text; base text; idt text; k int:=1; nm text; pw text; u uuid:=gen_random_uuid();
 mp text:='əıöüçşğƏÖÜÇŞĞİ'; mt text:='eioucsgeoucsgi';
begin
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
 insert into profiles(id,name,login) values(u,nm,idt||'@classroom.app');
 new_name:=nm; new_login:=idt; temp_password:=pw; return next;
end $$;

-- admin: add any number of extra people (no 30-person limit)
create function admin_create_user(raw text) returns table(new_name text, new_login text, temp_password text) language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); return query select * from _create_user(raw); end $$;

-- admin: delete every chat at once
create function admin_clear_all_chats() returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); delete from messages; end $$;

-- points: fail loudly when nothing was updated (before, giving points to a staff account silently did nothing)
create or replace function add_points(u uuid, n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not _perm(auth.uid(),'points') then raise exception 'You do not have permission to give points'; end if;
 if n is null or n=0 or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin;
 if not found then raise exception 'That account cannot receive points'; end if;
 insert into point_events(user_id,amount,kind) values(u,n,'host');
end $$;

-- students can no longer give themselves points
drop function self_points(int);

revoke execute on function _create_user(text),admin_create_user(text),admin_clear_all_chats() from public, anon, authenticated;
grant execute on function admin_create_user(text),admin_clear_all_chats() to authenticated;