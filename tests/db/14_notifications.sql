-- Persistent notifications: dedupe, per-user isolation, read sync, failure never breaks the caller.
select test.eq(public._notify(array[test.id('s1'), test.id('s2'), test.id('s1')], 'pres.draw', '{"e":1}', '{"k":"pres","event":1}', 'draw:1:1'), 2,
  'notify fan-out deduplicates users in one call');
select test.eq(public._notify(array[test.id('s1')], 'pres.draw', '{}', '{}', 'draw:1:1'), 0, 'same dedupe key never inserts twice');
select test.eq(public._notify(array[test.id('s1')], 'pres.draw', '{}', '{}', 'draw:1:2'), 1, 'a new dedupe key inserts');
select test.eq(public._notify(array[test.id('outsider')], 'pres.draw', '{}', '{}', null), 0, 'users without a profile are skipped');
select test.eq(public._notify(array[test.id('s1')], 'BAD KIND!', '{}', '{}', null), 0, 'invalid kind: returns 0, does not raise');
select test.ok(exists(select 1 from public.notify_errors where kind = 'BAD KIND!'), 'invalid kind is logged to notify_errors');

-- caller transaction survives a notify failure
create temp table t_side (x int);
select test.lives($q$ do $d$ begin insert into t_side values (1); perform public._notify(array[test.id('s1')], 'BAD KIND!', '{}', '{}'); insert into t_side values (2); end $d$ $q$,
  'main operation continues after a failing notify');
select test.eq((select count(*)::int from t_side), 2, 'both writes of the main operation are kept');

select test.as(test.id('s2'));
select test.eq((select count(*)::int from public.notifications), 1, 's2 sees only own notifications (RLS)');
select test.eq(public.notes_unread_count(), 1, 'unread count for s2');
select test.as(test.id('s1'));
select test.eq((select count(*)::int from public.notes_list()), 2, 'notes_list returns own rows');
select test.eq(public.notes_read(null), 2, 'mark all read');
select test.eq(public.notes_unread_count(), 0, 'read state persisted');
select test.throws('update public.notifications set read_at = null', 'permission denied', 'no direct UPDATE for clients');
select test.throws('insert into public.notifications(user_id, kind) values (auth.uid(), ''x.y'')', 'permission denied', 'no direct INSERT for clients');
select test.as(test.id('outsider'));
select test.throws('select public.notes_list()', 'not signed in', 'auth user without profile is rejected by class A RPC');
select test.as_anon();
select test.throws('select public.notes_list()', 'permission denied', 'anon cannot call notes_list');
