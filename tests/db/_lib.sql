-- LOCAL TEST ONLY. Tiny TAP-style helpers + fixed fixtures. Loaded by tests/db/run.sh into the local test DB.
do $$ begin if current_setting('adiak.local', true) is distinct from 'yes' then raise exception 'local only'; end if; end $$;
drop schema if exists test cascade;
create schema test;
grant usage on schema test to anon, authenticated, service_role;

create function test.ok(c boolean, name text) returns void language plpgsql as $$
begin raise notice '%', case when coalesce(c, false) then 'TAP ok - ' else 'TAP not ok - ' end || name; end $$;
create function test.eq(a anycompatible, b anycompatible, name text) returns void language plpgsql as $$
begin
  if a is not distinct from b then raise notice 'TAP ok - %', name;
  else raise notice 'TAP not ok - % (got %, expected %)', name, a, b; end if;
end $$;
-- runs sql; passes if it raises an error whose message matches pat (case-insensitive regex)
create function test.throws(q text, pat text, name text) returns void language plpgsql as $$
begin
  begin execute q;
  exception when others then
    if sqlerrm ~* pat then raise notice 'TAP ok - %', name;
    else raise notice 'TAP not ok - % (wrong error: %)', name, sqlerrm; end if;
    return;
  end;
  raise notice 'TAP not ok - % (no error)', name;
end $$;
create function test.lives(q text, name text) returns void language plpgsql as $$
begin
  begin execute q; raise notice 'TAP ok - %', name;
  exception when others then raise notice 'TAP not ok - % (error: %)', name, sqlerrm; end;
end $$;
-- persona switching (transaction-local)
create function test.as(u uuid) returns void language plpgsql as $$
begin
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
end $$;
create function test.as_anon() returns void language plpgsql as $$
begin execute 'set local role anon'; perform set_config('request.jwt.claims', '{"role":"anon"}', true); end $$;
create function test.as_service() returns void language plpgsql as $$
begin execute 'set local role service_role'; perform set_config('request.jwt.claims', '{"role":"service_role"}', true); end $$;
create function test.as_db() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claims', '', true); end $$;
grant execute on all functions in schema test to anon, authenticated, service_role;

-- personas (fixed ids)
create function test.id(k text) returns uuid language sql immutable as $$
 select (case k
  when 'admin' then 'a0000000-0000-4000-8000-000000000001' when 'tpres' then 'a0000000-0000-4000-8000-000000000002'
  when 'tnone' then 'a0000000-0000-4000-8000-000000000003' when 'tother' then 'a0000000-0000-4000-8000-000000000004'
  when 's1' then 'b0000000-0000-4000-8000-000000000001' when 's2' then 'b0000000-0000-4000-8000-000000000002'
  when 's3' then 'b0000000-0000-4000-8000-000000000003' when 's4' then 'b0000000-0000-4000-8000-000000000004'
  when 's5' then 'b0000000-0000-4000-8000-000000000005' when 's6' then 'b0000000-0000-4000-8000-000000000006'
  when 'x1' then 'c0000000-0000-4000-8000-000000000001' when 'outsider' then 'd0000000-0000-4000-8000-000000000001'
 end)::uuid $$;
grant execute on function test.id(text) to anon, authenticated, service_role;

-- fixtures: class c1 (teams g1: s1 host,s2,s3 · g2: s4 host,s5 · idle s6), class c2 (team g3: x1)
insert into public.classes(tag, title) values ('c1', 'Class 1'), ('c2', 'Class 2');
insert into auth.users(id, email) select test.id(k), k || '@classroom.app'
  from unnest(array['admin','tpres','tnone','tother','s1','s2','s3','s4','s5','s6','x1','outsider']) k;
insert into public.profiles(id, name, login, role, is_admin, class_tag) values
  (test.id('admin'), 'Admin', 'admin@classroom.app', 'student', true, null),
  (test.id('tpres'), 'Teacher Pres', 'tpres@classroom.app', 'teacher', false, null),
  (test.id('tnone'), 'Teacher None', 'tnone@classroom.app', 'teacher', false, null),
  (test.id('tother'), 'Teacher Other', 'tother@classroom.app', 'teacher', false, null),
  (test.id('s1'), 'Student One', 's1@classroom.app', 'student', false, 'c1'),
  (test.id('s2'), 'Student Two', 's2@classroom.app', 'student', false, 'c1'),
  (test.id('s3'), 'Student Three', 's3@classroom.app', 'student', false, 'c1'),
  (test.id('s4'), 'Student Four', 's4@classroom.app', 'student', false, 'c1'),
  (test.id('s5'), 'Student Five', 's5@classroom.app', 'student', false, 'c1'),
  (test.id('s6'), 'Student Six', 's6@classroom.app', 'student', false, 'c1'),
  (test.id('x1'), 'Other Class', 'x1@classroom.app', 'student', false, 'c2');
insert into public.class_staff(user_id, class_tag, role, perms) values
  (test.id('tpres'), 'c1', 'teacher', '{points,groups,chats,presentations}'),
  (test.id('tnone'), 'c1', 'teacher', '{points}'),
  (test.id('tother'), 'c2', 'teacher', '{points,groups,chats,presentations}');
insert into public.groups(id, name, capacity, host_id, class_tag) overriding system value values
  (1, 'Team One', 5, test.id('s1'), 'c1'), (2, 'Team Two', 5, test.id('s4'), 'c1'), (3, 'Team Three', 5, test.id('x1'), 'c2');
update public.profiles set group_id = 1 where id in (test.id('s1'), test.id('s2'), test.id('s3'));
update public.profiles set group_id = 2 where id in (test.id('s4'), test.id('s5'));
update public.profiles set group_id = 3 where id = test.id('x1');

-- creates an open event in c1 with teams g1 + g2 as teacher tpres; returns event id; leaves the session as postgres
create function test.mk_event(status text default 'open') returns bigint language plpgsql as $$
declare e bigint;
begin
  perform test.as(test.id('tpres'));
  e := public.pres_event_save(null, 'c1', 'Final presentations', 'desc', now() + interval '3 days', now() + interval '2 days', 7);
  perform public.pres_set_teams(e, array[1,2]::bigint[], null, null);
  if status <> 'draft' then perform public.pres_event_status(e, 'open'); end if;
  perform test.as_db();
  return e;
end $$;
grant execute on function test.mk_event(text) to authenticated;
select setval(pg_get_serial_sequence('public.groups', 'id'), 100);
