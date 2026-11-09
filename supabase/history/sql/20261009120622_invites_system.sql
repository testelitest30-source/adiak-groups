create table invites(id bigint generated always as identity primary key,
 group_id bigint not null references groups(id) on delete cascade,
 user_id uuid not null references profiles(id) on delete cascade,
 invited_by uuid references profiles(id) on delete set null,
 unique(group_id,user_id));
alter table invites enable row level security;
create policy r on invites for select to authenticated using (true);
grant select on invites to authenticated;
alter publication supabase_realtime add table invites;

create or replace function _accept(u uuid,g bigint) returns boolean language plpgsql security definer set search_path=public as $$
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
end $$;

create function send_invite(g bigint, u uuid) returns void language plpgsql security definer set search_path=public as $$
declare p profiles; t profiles; n int; cap int;
begin
 select * into p from profiles where id=auth.uid();
 select * into t from profiles where id=u;
 if not found or t.is_admin then raise exception 'Person not found'; end if;
 if not exists(select 1 from groups where id=g and host_id=p.id) then raise exception 'Only the group host can invite'; end if;
 if t.group_id is not null then raise exception 'That person is already in a group'; end if;
 select capacity into cap from groups where id=g;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then raise exception 'Your group is full'; end if;
 if exists(select 1 from requests where user_id=u and group_id=g) then
  perform _accept(u,g); return;
 end if;
 insert into invites(group_id,user_id,invited_by) values(g,u,p.id) on conflict do nothing;
 perform _say('g:'||g,p.name||' invited '||t.name||'.');
end $$;

create function respond_invite(i bigint, ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare q invites; me profiles;
begin
 select * into me from profiles where id=auth.uid();
 select * into q from invites where id=i and user_id=auth.uid();
 if not found then raise exception 'This invitation is no longer open'; end if;
 if ok then
  if me.group_id is not null then raise exception 'Leave your group first'; end if;
  if not _accept(me.id,q.group_id) then raise exception 'That group is full'; end if;
 else
  delete from invites where id=i;
  perform _say('g:'||q.group_id,me.name||' declined the invitation.');
 end if;
end $$;

create function cancel_invite(i bigint) returns void language sql security definer set search_path=public as
$$ delete from invites where id=i and (invited_by=auth.uid() or exists(select 1 from profiles where id=auth.uid() and is_admin)) $$;

revoke execute on function send_invite(bigint,uuid),respond_invite(bigint,boolean),cancel_invite(bigint) from public, anon;
grant execute on function send_invite(bigint,uuid),respond_invite(bigint,boolean),cancel_invite(bigint) to authenticated;