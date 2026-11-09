-- Control Center read models: admin vs owner scope; no secrets returned.
insert into auth.users(id, email, created_at) values ('f0000000-0000-4000-8000-000000000001', 'ghost@classroom.app', now());   -- account without profile
update public.profiles set perms = '{admin}' where id = test.id('admin');
insert into public.platform_owner(user_id) values (test.id('admin'));
insert into auth.users(id, email) values ('e0000000-0000-4000-8000-000000000009', 'adm2@classroom.app');
insert into public.profiles(id, name, login, role, perms) values ('e0000000-0000-4000-8000-000000000009', 'Admin Two', 'adm2@classroom.app', 'student', '{admin}');
select test.as('e0000000-0000-4000-8000-000000000009');
select test.ok((public.ops_overview()->>'students')::int = 7, 'admin: overview counts students');
select test.ok((public.ops_overview()->>'incomplete_accounts')::int >= 1, 'overview counts accounts without profile');
select test.lives('select public.ops_push_stats()', 'admin: delivery stats');
select test.lives('select * from public.ops_audit()', 'admin: audit log');
select test.throws('select public.ops_jobs()', 'only the owner', 'admin cannot open owner diagnostics (jobs)');
select test.throws('select * from public.ops_incomplete_accounts()', 'only the owner', 'admin cannot list incomplete accounts');
select test.as(test.id('admin'));
select test.ok((public.ops_jobs()->>'installed') = 'false', 'owner: jobs (pg_cron not installed locally) reported honestly');
select test.ok(jsonb_array_length(public.ops_storage()) >= 5, 'owner: storage per bucket');
select test.eq((select count(*)::int from public.ops_incomplete_accounts() where email = 'ghost@classroom.app'), 1, 'owner: incomplete accounts listed (not deleted)');
select test.ok((select count(*) >= 18 from public.ops_migrations()), 'owner: migration versions visible');
select test.lives('select * from public.ops_errors()', 'owner: error log');
select test.ok(public.ops_push_stats()::text !~* '"token"|p256dh|secret|priv', 'delivery stats contain no token values or keys');
select test.ok(public.ops_overview()::text !~* 'p256dh|"secret"|priv', 'overview contains no secrets');
select test.as(test.id('tpres'));
select test.throws('select public.ops_overview()', 'admins only', 'teacher cannot open the control center data');
select test.as(test.id('s1'));
select test.throws('select public.ops_push_stats()', 'admins only', 'student cannot read delivery stats');
select test.as_anon();
select test.throws('select public.ops_overview()', 'permission denied', 'anon cannot call ops');
