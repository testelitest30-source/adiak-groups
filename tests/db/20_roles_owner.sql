-- Owner / admin / teacher / class-leader / student boundaries (server-side).
insert into auth.users(id, email) values ('e0000000-0000-4000-8000-000000000001', 'admin2@classroom.app'), ('e0000000-0000-4000-8000-000000000002', 'teach2@classroom.app');
insert into public.profiles(id, name, login, role, perms) values ('e0000000-0000-4000-8000-000000000001', 'Second Admin', 'admin2@classroom.app', 'student', '{admin}'),
  ('e0000000-0000-4000-8000-000000000002', 'Teacher Two', 'teach2@classroom.app', 'teacher', '{}');
insert into public.class_staff(user_id, class_tag, role, perms) values ('e0000000-0000-4000-8000-000000000002', 'c1', 'teacher', '{}');
update public.profiles set perms = '{admin}' where id = test.id('admin');
insert into public.platform_owner(user_id) values (test.id('admin'));
select test.as(test.id('admin'));
select test.ok((public.my_access()->>'owner')::boolean and (public.my_access()->>'admin')::boolean, 'owner: my_access says owner+admin');
select test.as('e0000000-0000-4000-8000-000000000001');
select test.ok(not (public.my_access()->>'owner')::boolean and (public.my_access()->>'admin')::boolean, 'second admin: admin but not owner');
select test.throws($q$select public.admin_set_perms(test.id('s1'), array['admin'])$q$, 'only the owner', 'admin cannot grant admin rights');
select test.throws($q$select public.admin_set_perms(test.id('admin'), array['admin','points'])$q$, 'only the owner', 'admin cannot change the owner''s permissions');
select test.throws($q$select public.owner_set_flag('maintenance', 'true')$q$, 'only the owner', 'admin cannot change platform flags');
select test.throws($q$select public.owner_transfer('e0000000-0000-4000-8000-000000000001', 'take over please')$q$, 'only the owner', 'admin cannot take ownership');
select test.lives($q$select public.admin_set_perms(test.id('s1'), array['points'])$q$, 'admin still manages non-admin permissions');
select test.as(test.id('admin'));
select test.lives($q$select public.admin_set_perms(test.id('s2'), array['admin'])$q$, 'owner grants admin');
select test.throws($q$select public.admin_set_perms(test.id('admin'), array['points'])$q$, 'keeps admin', 'owner cannot drop own admin rights');
select test.throws($q$select public.owner_set_flag('maintenance', 'maybe')$q$, 'true or false', 'flag values validated');
select test.lives($q$select public.owner_set_flag('maintenance', 'true')$q$, 'owner sets a flag');
select test.throws($q$select public.owner_transfer('e0000000-0000-4000-8000-000000000001', 'x')$q$, 'reason', 'owner transfer needs a reason');
select test.as_db();
select test.eq((select count(*)::int from public.platform_audit where action = 'flag.set' and target = 'maintenance'), 1, 'flag change audited');
select test.throws($q$delete from public.platform_audit$q$, 'cannot be deleted', 'platform audit is append-only');
select test.throws($q$delete from public.profiles where id = test.id('admin')$q$, 'violates foreign key', 'the owner account cannot be deleted');
-- class leader boundaries
select test.as(test.id('admin'));
select test.throws($q$select public.admin_set_staff(test.id('s6'), 'c1', 'starosta', array['passwords'])$q$, 'cannot get password', 'class leader cannot get password access');
select test.throws($q$select public.admin_set_staff(test.id('s6'), 'c1', 'starosta', array['presentations'])$q$, 'cannot get password or assessment', 'class leader cannot get assessment rights');
select test.lives($q$select public.admin_set_staff(test.id('s6'), 'c1', 'starosta', array['announce','report','coordinate'])$q$, 'class leader gets class-hub perms');
select test.as(test.id('s6'));
select test.eq(jsonb_array_length(public.my_access()->'leads'), 1, 'class leader sees their class hub');
select test.throws($q$select public.owner_set_flag('pres_enabled', 'false')$q$, 'only the owner', 'class leader cannot change settings');
select test.throws($q$select public.admin_set_perms(auth.uid(), array['admin'])$q$, 'admins only|only the owner', 'class leader cannot raise own role');
-- teachers: own classes only, without needing a separate perm
select test.mk_event() as e \gset
select test.as('e0000000-0000-4000-8000-000000000002');
select test.eq(jsonb_array_length(public.my_access()->'teaches'), 1, 'teacher sees their classes');
select test.lives(format('select public.pres_draw(%s, 0)', :e), 'assigned teacher runs the draw of their class');
select test.throws($q$select public.pres_event_save(null, 'c2', 'Other class event', '', null, null, 7)$q$, 'permission', 'teacher cannot create events in another class');
select test.throws($q$select public.admin_set_perms(test.id('s1'), array['points'])$q$, 'admins only', 'teacher cannot manage platform permissions');
select test.as(test.id('tother'));
select test.eq((select count(*)::int from public.pres_events where id = :e), 0, 'teacher of another class cannot see the event');
select test.as(test.id('s1'));
select test.ok(not (public.my_access()->>'admin')::boolean and jsonb_array_length(public.my_access()->'teaches') = 0, 'student: no staff access');
