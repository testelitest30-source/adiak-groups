select test.mk_event() as e \gset
select test.as(test.id('s1'));
select public.pres_task_save(null, :e, 1, 'Make slides', test.id('s2'), now() + interval '1 day') as t1 \gset
select test.throws(format($q$select public.pres_task_save(null, %s, 1, 'x', test.id('s4'), null)$q$, :e), 'member of this team', 'cannot assign to another team''s member');
select test.throws(format($q$select public.pres_task_save(null, %s, 2, 'x', null, null)$q$, :e), 'only members', 'cannot create tasks for another team');
select test.throws(format($q$select public.pres_task_save(null, %s, 1, '', null, null)$q$, :e), '1 to 140', 'empty title rejected');
select test.as_db();
select test.ok(exists(select 1 from public.notifications where user_id = test.id('s2') and kind = 'pres.task_assigned'), 'assignee notified');
select test.as(test.id('s3'));
select test.throws(format('select public.pres_task_status(%s, ''done'')', :t1), 'only the assignee', 'other member cannot complete someone''s task');
select test.as(test.id('s2'));
select test.lives(format('select public.pres_task_status(%s, ''done'')', :t1), 'assignee completes the task');
select test.throws(format('select public.pres_task_status(%s, ''cancelled'')', :t1), 'only the creator', 'assignee cannot cancel a task');
select test.as(test.id('s4'));
select test.eq((select count(*)::int from public.pres_tasks where event_id = :e and group_id = 1), 0, 'other team cannot see tasks');
select test.as(test.id('tpres'));
select test.eq((select count(*)::int from public.pres_tasks where event_id = :e), 1, 'staff oversight of tasks');
select test.as_db();
select test.ok((select done_at is not null from public.pres_tasks where id = :t1), 'completion timestamp');
select test.throws(format('delete from public.pres_tasks where id = %s', :t1), 'cannot be deleted', 'tasks cannot be deleted');
-- announcements
select test.as(test.id('s1'));
select test.throws(format($q$select public.pres_announce(%s, 'hi')$q$, :e), 'permission', 'students cannot announce');
select test.as(test.id('tpres'));
select test.lives(format($q$select public.pres_announce(%s, 'Bring a USB stick')$q$, :e), 'staff announces');
select test.as_db();
select test.eq((select count(*)::int from public.notifications where kind = 'pres.announce'), 5, 'every participant notified');
select test.as(test.id('s4'));
select test.eq((select count(*)::int from public.pres_announcements where event_id = :e), 1, 'class members read announcements');
select test.as(test.id('x1'));
select test.eq((select count(*)::int from public.pres_announcements), 0, 'other class does not');
