-- ===== permissions =====
alter table profiles add column perms text[] not null default '{}';
create function _perm(u uuid, p text) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from profiles where id=u and (is_admin or 'admin'=any(perms) or p=any(perms))) $$;
create function _req_admin() returns void language plpgsql stable security definer set search_path=public as
$$ begin if not _perm(auth.uid(),'admin') then raise exception 'Admins only'; end if; end $$;

-- ===== settings =====
create table app_settings(key text primary key, value text not null);
insert into app_settings values('max_groups','6');
alter table app_settings enable row level security;
create policy r on app_settings for select to authenticated using (true);

-- ===== one device per account =====
create table sessions(user_id uuid primary key references profiles(id) on delete cascade, sid text not null, updated_at timestamptz not null default now());
alter table sessions enable row level security;
create policy own on sessions for select to authenticated using (user_id=auth.uid());
create function claim_session(s text) returns void language sql security definer set search_path=public as
$$ insert into sessions(user_id,sid) values(auth.uid(),s) on conflict (user_id) do update set sid=excluded.sid, updated_at=now() $$;

-- ===== archive of old chats =====
create table archives(id bigint generated always as identity primary key, label text not null, created_at timestamptz not null default now(), created_by uuid references profiles(id) on delete set null);
create table archived_messages(id bigint primary key, archive_id bigint not null references archives(id) on delete cascade,
 channel text not null, channel_label text not null, sender uuid references profiles(id) on delete set null, body text not null,
 file_path text, file_name text, file_type text, file_size int, created_at timestamptz not null, participants uuid[]);
create index on archived_messages(archive_id,channel,id);
alter table archives enable row level security; alter table archived_messages enable row level security;
create policy r on archives for select to authenticated using (true);
create policy r on archived_messages for select to authenticated using (participants is null or auth.uid()=any(participants) or _perm(auth.uid(),'admin'));
create policy admin_all on messages for select to authenticated using (_perm(auth.uid(),'admin'));
drop policy chat_read on storage.objects;
create policy chat_read on storage.objects for select to authenticated using (bucket_id='chat-files' and
 (exists(select 1 from public.messages m where m.file_path=name) or exists(select 1 from public.archived_messages a where a.file_path=name)));

-- ===== existing functions: use permissions =====
create or replace function add_points(u uuid, n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not _perm(auth.uid(),'points') then raise exception 'You do not have permission to give points'; end if;
 if n is null or n=0 or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin;
 if found then insert into point_events(user_id,amount,kind) values(u,n,'host'); end if;
end $$;

create or replace function start_kick(t uuid) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; tg profiles; kid bigint;
begin
 select * into p from profiles where id=auth.uid();
 select * into tg from profiles where id=t;
 if not found or tg.group_id is null then raise exception 'That person is not in a group'; end if;
 if t=p.id then raise exception 'Use Leave group instead'; end if;
 if not _perm(p.id,'admin') and not exists(select 1 from groups where id=tg.group_id and host_id=p.id) then
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
 if not _perm(p.id,'admin') and not exists(select 1 from groups where id=q.group_id and host_id=p.id) then raise exception 'Only the group host makes the final decision'; end if;
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
$$ delete from invites where id=i and (invited_by=auth.uid() or _perm(auth.uid(),'admin')) $$;

create or replace function create_group(nm text, cap int) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; gid bigint; mx int;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.group_id is not null then raise exception 'Only idle students can create a group'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 select value::int into mx from app_settings where key='max_groups';
 if (select count(*) from groups)>=coalesce(mx,6) then raise exception 'The group limit (%) is reached', coalesce(mx,6); end if;
 insert into groups(name,capacity,host_id) values(trim(nm),cap,p.id) returning id into gid;
 update profiles set group_id=gid where id=p.id;
 delete from requests where user_id=p.id;
 perform _say('g:'||gid,p.name||' created the group.');
end $$;

-- ===== admin helpers =====
create function _pwgen() returns text language sql volatile security definer set search_path=public as
$$ select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789',(get_byte(b,i)%31)+1,1),'') from (select extensions.gen_random_bytes(8) b) x, generate_series(0,7) i $$;
create function _set_temp(u uuid, p text) returns void language plpgsql security definer set search_path=public as $$
begin
 update auth.users set encrypted_password=extensions.crypt(p,extensions.gen_salt('bf')),
  raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||'{"must_change":true}'::jsonb, updated_at=now() where id=u;
 delete from auth.sessions where user_id=u;
 update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u;
end $$;

-- ===== admin functions (all check admin rights) =====
create function admin_set_name(u uuid, nm text) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); nm:=trim(nm);
 if char_length(nm) not between 2 and 30 then raise exception 'Name must be 2 to 30 characters'; end if;
 update profiles set name=nm where id=u;
exception when unique_violation then raise exception 'That name is already taken';
end $$;

create function admin_set_login(u uuid, idt text) returns text language plpgsql security definer set search_path=public as $$
declare e text;
begin perform _req_admin(); idt:=lower(trim(idt));
 if idt !~ '^[a-z0-9._-]{2,40}$' then raise exception 'ID: 2-40 characters, letters, digits, dot, dash, underscore'; end if;
 e:=idt||'@classroom.app';
 if exists(select 1 from auth.users where email=e and id<>u) then raise exception 'That ID is already used'; end if;
 update auth.users set email=e, updated_at=now() where id=u;
 update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(e)) where user_id=u and provider='email';
 update profiles set login=e where id=u;
 return e;
end $$;

create function admin_reset_password(u uuid) returns text language plpgsql security definer set search_path=public as $$
declare p text;
begin perform _req_admin(); p:=_pwgen(); perform _set_temp(u,p); return p; end $$;

create function admin_force_logout(u uuid) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); delete from auth.sessions where user_id=u; update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u; end $$;

create function admin_set_perms(u uuid, p text[]) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin();
 if not (p <@ array['admin','points']) then raise exception 'Unknown permission'; end if;
 if u=auth.uid() and not 'admin'=any(p) and not exists(select 1 from profiles where id=u and is_admin) then raise exception 'You cannot remove your own admin right'; end if;
 update profiles set perms=p where id=u;
end $$;

create function admin_remove_member(u uuid) returns void language plpgsql security definer set search_path=public as $$
declare g bigint; nm text;
begin perform _req_admin();
 select group_id,name into g,nm from profiles where id=u; if g is null then return; end if;
 update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g);
 if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 perform _say('g:'||g,nm||' was removed from the group by an admin.');
end $$;

create function admin_move_member(u uuid, g bigint) returns void language plpgsql security definer set search_path=public as $$
declare old bigint; nm text; cap int; n int;
begin perform _req_admin();
 select group_id,name into old,nm from profiles where id=u;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap and old is distinct from g then raise exception 'That group is full'; end if;
 update profiles set group_id=g where id=u; delete from requests where user_id=u; delete from invites where user_id=u; delete from kicks where target_id=u;
 if old is not null and old<>g then perform _fix_host(old); end if;
 perform _fix_host(g); perform _say('g:'||g,nm||' was moved here by an admin.');
end $$;

create function admin_group_update(g bigint, nm text, cap int, host uuid) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin();
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if cap<(select count(*) from profiles where group_id=g) then raise exception 'The group already has more members than that'; end if;
 if host is not null and not exists(select 1 from profiles where id=host and group_id=g) then raise exception 'The host must be a member of the group'; end if;
 update groups set name=trim(nm), capacity=cap, host_id=coalesce(host,host_id) where id=g;
end $$;

create function admin_delete_group(g bigint) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); delete from messages where channel='g:'||g; delete from groups where id=g; end $$;

create function admin_delete_message(i bigint) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); delete from messages where id=i; end $$;
create function admin_clear_channel(ch text) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin(); delete from messages where channel=ch; end $$;

create function admin_close_day(lbl text, dissolve boolean) returns bigint language plpgsql security definer set search_path=public as $$
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
end $$;

create function admin_import_students(names text[]) returns table(slot_name text, new_name text, new_login text, temp_password text) language plpgsql security definer set search_path=public as $$
declare slots uuid[]; i int; raw text; parts text[]; fn text; ln text; base text; idt text; k int; nm text; pw text; u uuid; olds text;
begin perform _req_admin();
 select array_agg(id order by login) into slots from profiles where not is_admin;
 if names is null or array_length(names,1) is null then raise exception 'No names given'; end if;
 if array_length(names,1)>coalesce(array_length(slots,1),0) then raise exception 'More names than student accounts (%)',coalesce(array_length(slots,1),0); end if;
 for i in 1..array_length(names,1) loop
  raw:=regexp_replace(trim(names[i]),'\s+',' ','g'); continue when raw='';
  u:=slots[i]; parts:=string_to_array(raw,' ');
  fn:=regexp_replace(translate(lower(parts[1]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  ln:=regexp_replace(translate(lower(parts[array_length(parts,1)]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  base:=case when array_length(parts,1)>1 and ln<>'' then fn||'.'||left(ln,1) else fn end;
  if base='' then base:='student'||i; end if;
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
end $$;

create function admin_set_setting(k text, v text) returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin();
 if k<>'max_groups' then raise exception 'Unknown setting'; end if;
 if v !~ '^[0-9]{1,2}$' or v::int not between 1 and 12 then raise exception 'Choose 1 to 12'; end if;
 if v::int<(select count(*) from groups) then raise exception 'There are already more groups than that'; end if;
 update app_settings set value=v where key=k;
end $$;

create function admin_reset_all() returns void language plpgsql security definer set search_path=public as $$
begin perform _req_admin();
 delete from messages; delete from archives; delete from point_events; delete from groups;
 update profiles set points=0, group_id=null;
end $$;

-- ===== permissions on functions =====
revoke execute on function _perm(uuid,text),_req_admin(),claim_session(text),_pwgen(),_set_temp(uuid,text),
 admin_set_name(uuid,text),admin_set_login(uuid,text),admin_reset_password(uuid),admin_force_logout(uuid),admin_set_perms(uuid,text[]),
 admin_remove_member(uuid),admin_move_member(uuid,bigint),admin_group_update(bigint,text,int,uuid),admin_delete_group(bigint),
 admin_delete_message(bigint),admin_clear_channel(text),admin_close_day(text,boolean),admin_import_students(text[]),
 admin_set_setting(text,text),admin_reset_all(),add_points(uuid,int),create_group(text,int) from public, anon, authenticated;
grant execute on function _perm(uuid,text),claim_session(text),add_points(uuid,int),create_group(text,int),
 admin_set_name(uuid,text),admin_set_login(uuid,text),admin_reset_password(uuid),admin_force_logout(uuid),admin_set_perms(uuid,text[]),
 admin_remove_member(uuid),admin_move_member(uuid,bigint),admin_group_update(bigint,text,int,uuid),admin_delete_group(bigint),
 admin_delete_message(bigint),admin_clear_channel(text),admin_close_day(text,boolean),admin_import_students(text[]),
 admin_set_setting(text,text),admin_reset_all() to authenticated;
grant select on app_settings,sessions,archives,archived_messages to authenticated;
alter publication supabase_realtime add table sessions, app_settings;

-- ===== launch clean-up: no preset groups; login by typed ID (no public name list) =====
delete from messages where channel like 'g:%';
delete from groups;
drop view roster;