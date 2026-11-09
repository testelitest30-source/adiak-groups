create table profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null unique check (char_length(name) between 2 and 30),
 login text not null unique,
 avatar text check (char_length(avatar)<=30000),
 points int not null default 0,
 group_id bigint,
 is_admin boolean not null default false);
create table groups(
 id bigint generated always as identity primary key,
 name text not null check (char_length(name) between 1 and 30),
 capacity int not null check (capacity between 1 and 10),
 host_id uuid references profiles(id) on delete set null);
alter table profiles add foreign key (group_id) references groups(id) on delete set null;
create table requests(id bigint generated always as identity primary key,
 user_id uuid not null references profiles(id) on delete cascade,
 group_id bigint not null references groups(id) on delete cascade, unique(user_id,group_id));
create table join_ballots(request_id bigint references requests(id) on delete cascade,
 voter_id uuid references profiles(id) on delete cascade, approve boolean not null, primary key(request_id,voter_id));
create table kicks(id bigint generated always as identity primary key,
 group_id bigint not null references groups(id) on delete cascade,
 target_id uuid not null unique references profiles(id) on delete cascade);
create table kick_ballots(kick_id bigint references kicks(id) on delete cascade,
 voter_id uuid references profiles(id) on delete cascade, approve boolean not null, primary key(kick_id,voter_id));
create table messages(id bigint generated always as identity primary key, channel text not null,
 sender uuid references profiles(id) on delete set null,
 body text not null check (char_length(body) between 1 and 1000), created_at timestamptz not null default now());
create index on messages(channel,id);
insert into groups(name,capacity) select 'Group '||i,5 from generate_series(1,6) i;
create view roster as select name,login from profiles;

alter table profiles enable row level security; alter table groups enable row level security;
alter table requests enable row level security; alter table join_ballots enable row level security;
alter table kicks enable row level security; alter table kick_ballots enable row level security;
alter table messages enable row level security;
create policy r on profiles for select to authenticated using (true);
create policy r on groups for select to authenticated using (true);
create policy r on requests for select to authenticated using (true);
create policy r on join_ballots for select to authenticated using (true);
create policy r on kicks for select to authenticated using (true);
create policy r on kick_ballots for select to authenticated using (true);
create policy r on messages for select to authenticated using (
 channel='all'
 or channel='g:'||(select group_id::text from profiles where id=auth.uid())
 or (channel like 'd:%' and auth.uid()::text in (split_part(channel,':',2),split_part(channel,':',3))));

create function _say(ch text,t text) returns void language sql security definer set search_path=public as
$$ insert into messages(channel,sender,body) values(ch,null,t) $$;

create function _fix_host(g bigint) returns void language sql security definer set search_path=public as
$$ update groups set host_id = case when exists(select 1 from profiles where id=groups.host_id and group_id=g)
   then host_id else (select id from profiles where group_id=g order by name limit 1) end where id=g $$;

create function _accept(u uuid,g bigint) returns boolean language plpgsql security definer set search_path=public as $$
declare cap int; n int; nm text;
begin
 select capacity into cap from groups where id=g for update;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then delete from requests where group_id=g; return false; end if;
 update profiles set group_id=g where id=u returning name into nm;
 delete from requests where user_id=u;
 perform _fix_host(g);
 perform _say('g:'||g, nm||' joined the group 🎉');
 if n+1>=cap then delete from requests where group_id=g; perform _say('g:'||g,'The group is full.'); end if;
 return true;
end $$;

create function _check_join(r bigint) returns void language plpgsql security definer set search_path=public as $$
declare q requests; n int; need int; yea int; nay int; nm text;
begin
 select * into q from requests where id=r; if not found then return; end if;
 select count(*) into n from profiles where group_id=q.group_id;
 need:=n/2+1;
 select count(*) filter (where b.approve), count(*) filter (where not b.approve) into yea,nay
  from join_ballots b join profiles p on p.id=b.voter_id and p.group_id=q.group_id where b.request_id=r;
 if yea>=need then perform _accept(q.user_id,q.group_id);
 elsif n-nay<need then
  select name into nm from profiles where id=q.user_id;
  delete from requests where id=r;
  perform _say('g:'||q.group_id,'Request from '||nm||' was declined.');
 end if;
end $$;

create function _check_kick(k bigint) returns void language plpgsql security definer set search_path=public as $$
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
end $$;

create function request_join(g bigint) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; n int; cap int;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin then raise exception 'The host account cannot join groups'; end if;
 if p.group_id is not null then raise exception 'Leave your current group first'; end if;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then raise exception 'This group is full'; end if;
 if n=0 then perform _accept(p.id,g); return; end if;
 if not exists(select 1 from requests where user_id=p.id and group_id=g) then
  insert into requests(user_id,group_id) values(p.id,g);
  perform _say('g:'||g,p.name||' wants to join. Members: please vote.');
 end if;
end $$;

create function cancel_request(g bigint) returns void language sql security definer set search_path=public as
$$ delete from requests where user_id=auth.uid() and group_id=g $$;

create function vote_join(r bigint, ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare q requests;
begin
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then raise exception 'Only members of this group can vote'; end if;
 insert into join_ballots values(r,auth.uid(),ok) on conflict (request_id,voter_id) do update set approve=excluded.approve;
 perform _check_join(r);
end $$;

create function leave_group() returns void language plpgsql security definer set search_path=public as $$
declare p profiles;
begin
 select * into p from profiles where id=auth.uid();
 if not found or p.group_id is null then return; end if;
 update profiles set group_id=null where id=p.id;
 delete from kicks where target_id=p.id;
 perform _fix_host(p.group_id);
 if not exists(select 1 from profiles where group_id=p.group_id) then delete from requests where group_id=p.group_id; end if;
 perform _say('g:'||p.group_id,p.name||' left the group.');
end $$;

create function create_group(nm text, cap int) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; gid bigint;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.group_id is not null then raise exception 'Only idle students can create a group'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 if (select count(*) from groups)>=12 then raise exception 'Maximum 12 groups'; end if;
 insert into groups(name,capacity,host_id) values(trim(nm),cap,p.id) returning id into gid;
 update profiles set group_id=gid where id=p.id;
 delete from requests where user_id=p.id;
 perform _say('g:'||gid,p.name||' created the group.');
end $$;

create function start_kick(t uuid) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; tg profiles; kid bigint;
begin
 select * into p from profiles where id=auth.uid();
 select * into tg from profiles where id=t;
 if not found or tg.group_id is null then raise exception 'That person is not in a group'; end if;
 if t=p.id then raise exception 'Use Leave group instead'; end if;
 if not p.is_admin and not exists(select 1 from groups where id=tg.group_id and host_id=p.id) then
  raise exception 'Only the group host or admin can start a kick vote'; end if;
 if exists(select 1 from kicks where target_id=t) then raise exception 'A vote is already open for this person'; end if;
 insert into kicks(group_id,target_id) values(tg.group_id,t) returning id into kid;
 if p.group_id=tg.group_id then insert into kick_ballots values(kid,p.id,true); end if;
 perform _say('g:'||tg.group_id,'Kick vote started for '||tg.name||'. 80% of the other members must approve.');
 perform _check_kick(kid);
end $$;

create function vote_kick(k bigint, ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare q kicks;
begin
 select * into q from kicks where id=k; if not found then raise exception 'This vote is closed'; end if;
 if auth.uid()=q.target_id or not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then
  raise exception 'Only the other members of this group can vote'; end if;
 insert into kick_ballots values(k,auth.uid(),ok) on conflict (kick_id,voter_id) do update set approve=excluded.approve;
 perform _check_kick(k);
end $$;

create function add_points(u uuid, n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=auth.uid() and is_admin) then raise exception 'Only the host can give points'; end if;
 if n is null or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin;
end $$;

create function self_points(n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if n is null or n not between 1 and 10 then raise exception 'Choose 1 to 10'; end if;
 update profiles set points=points+n where id=auth.uid() and not is_admin;
end $$;

create function update_me(nm text, av text) returns void language plpgsql security definer set search_path=public as $$
begin
 if nm is not null then nm:=trim(nm); if char_length(nm) not between 2 and 30 then raise exception 'Name must be 2 to 30 characters'; end if; end if;
 update profiles set name=coalesce(nm,name), avatar=coalesce(av,avatar) where id=auth.uid();
exception when unique_violation then raise exception 'That name is already taken';
end $$;

create function send_message(ch text, body text) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; a uuid; b uuid; t text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 t:=trim(body); if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
 if ch='all' or ch='g:'||coalesce(p.group_id::text,'-') then null;
 elsif ch like 'd:%' then
  a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  if a=b or p.id not in (a,b) or not exists(select 1 from profiles where id=a) or not exists(select 1 from profiles where id=b) then raise exception 'Invalid chat'; end if;
 else raise exception 'Invalid chat'; end if;
 insert into messages(channel,sender,body) values(ch,p.id,t);
end $$;

revoke all on all tables in schema public from anon, authenticated;
grant select on profiles,groups,requests,join_ballots,kicks,kick_ballots,messages to authenticated;
grant select on roster to anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function request_join(bigint),cancel_request(bigint),vote_join(bigint,boolean),leave_group(),
 create_group(text,int),start_kick(uuid),vote_kick(bigint,boolean),add_points(uuid,int),self_points(int),
 update_me(text,text),send_message(text,text) to authenticated;
alter publication supabase_realtime add table profiles,groups,requests,join_ballots,kicks,kick_ballots,messages;