alter table requests add column stage text not null default 'pending' check (stage in ('pending','voting','approved'));

create or replace function request_join(g bigint) returns void language plpgsql security definer set search_path=public as $$
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
  perform _say('g:'||g,p.name||' wants to join. A member can put the request to a vote.');
 end if;
end $$;

create function open_vote(r bigint) returns void language plpgsql security definer set search_path=public as $$
declare q requests; nm text;
begin
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then raise exception 'Only members of this group can open a vote'; end if;
 if q.stage<>'pending' then raise exception 'A vote was already opened for this request'; end if;
 update requests set stage='voting' where id=r;
 select name into nm from profiles where id=q.user_id;
 perform _say('g:'||q.group_id,'Vote opened: should '||nm||' join? Members, please vote.');
 perform _check_join(r);
end $$;

create or replace function _check_join(r bigint) returns void language plpgsql security definer set search_path=public as $$
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
end $$;

create or replace function vote_join(r bigint, ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare q requests;
begin
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then raise exception 'Only members of this group can vote'; end if;
 if q.stage<>'voting' then raise exception 'Voting is not open for this request'; end if;
 insert into join_ballots values(r,auth.uid(),ok) on conflict (request_id,voter_id) do update set approve=excluded.approve;
 perform _check_join(r);
end $$;

create function host_decide(r bigint, ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare q requests; p profiles; nm text;
begin
 select * into p from profiles where id=auth.uid();
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not p.is_admin and not exists(select 1 from groups where id=q.group_id and host_id=p.id) then raise exception 'Only the group host makes the final decision'; end if;
 if q.stage<>'approved' then raise exception 'The members have not approved this request yet'; end if;
 select name into nm from profiles where id=q.user_id;
 if ok then
  if not _accept(q.user_id,q.group_id) then raise exception 'The group is full'; end if;
 else
  delete from requests where id=r;
  perform _say('g:'||q.group_id,'The host declined '||nm||'.');
 end if;
end $$;

revoke execute on function open_vote(bigint),host_decide(bigint,boolean) from public, anon;
grant execute on function open_vote(bigint),host_decide(bigint,boolean) to authenticated;