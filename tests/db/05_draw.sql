-- Transparent team draw: persisted, unique positions, append-only rounds, redraw needs reason, frozen team list.
select test.mk_event() as e \gset
select test.as(test.id('s1'));
select test.throws(format('select public.pres_draw(%s, 0)', :e), 'permission', 'student cannot draw');
select test.as(test.id('tnone'));
select test.throws(format('select public.pres_draw(%s, 0)', :e), 'permission', 'teacher without presentations perm cannot draw');
select test.as(test.id('tother'));
select test.throws(format('select public.pres_draw(%s, 0)', :e), 'permission', 'staff of another class cannot draw');
select test.as(test.id('tpres'));
select test.throws(format('select public.pres_draw(%s, 1)', :e), 'changed meanwhile', 'stale expected_round rejected');
select test.lives(format('select public.pres_draw(%s, 0)', :e), 'staff with perm draws round 1 (no reason needed)');
select test.as_db();
select test.eq((select round from public.pres_draws where event_id = :e and superseded_at is null), 1, 'round 1 stored');
select test.ok((select result @> array[1,2]::bigint[] and cardinality(result) = 2 and participants = array[1,2]::bigint[] from public.pres_draws where event_id = :e),
  'result is a permutation of the frozen participant list');
select test.eq((select status from public.pres_events where id = :e), 'drawn', 'event status drawn');
select test.ok((select drawn_by = test.id('tpres') and created_at is not null from public.pres_draws where event_id = :e), 'initiator and timestamp recorded');
select test.eq((select count(*)::int from public.notifications where kind = 'pres.draw'), 5, 'every team member notified with their position');
select test.ok((select bool_and((params->>'pos')::int between 1 and 2) from public.notifications where kind = 'pres.draw'), 'notification carries the position');
-- redraw
select test.as(test.id('tpres'));
select test.throws(format('select public.pres_draw(%s, 1)', :e), 'reason', 'redraw without reason rejected');
select test.throws(format('select public.pres_draw(%s, 1, ''abc'')', :e), 'reason', 'too short reason rejected');
select test.lives(format('select public.pres_draw(%s, 1, ''Team two was absent'')', :e), 'redraw with reason');
select test.as_db();
select test.eq((select count(*)::int from public.pres_draws where event_id = :e), 2, 'previous round kept (not overwritten)');
select test.eq((select count(*)::int from public.pres_draws where event_id = :e and superseded_at is null), 1, 'exactly one current draw');
select test.eq((select superseded_reason from public.pres_draws where event_id = :e and round = 1), 'Team two was absent', 'superseded round records the reason');
select test.throws(format('update public.pres_draws set result = array[2,1]::bigint[] where event_id = %s and round = 2', :e), 'protected', 'draw result cannot be edited (even by owner)');
select test.throws(format('delete from public.pres_draws where event_id = %s', :e), 'cannot be deleted', 'draws cannot be deleted');
select test.throws(format('update public.pres_draws set superseded_at = clock_timestamp() where event_id = %s and round = 1', :e), 'only be set once', 'superseded_at set-once');
-- frozen team list after the draw
select test.as(test.id('tpres'));
select test.throws(format('select public.pres_set_teams(%s, null, array[2]::bigint[], null)', :e), 'reason', 'changing teams after a draw needs a reason');
select test.lives(format('select public.pres_set_teams(%s, null, array[2]::bigint[], ''Team two withdrew'')', :e), 'staff removes a team with reason');
select test.as_db();
select test.eq((select count(*)::int from public.pres_draws where event_id = :e and superseded_at is null), 0, 'team change invalidates the current draw');
select test.eq((select status from public.pres_events where id = :e), 'open', 'event back to open: new draw required');
select test.ok(exists(select 1 from public.notifications where kind = 'pres.redraw_needed'), 'staff told that a new draw is needed');
select test.as(test.id('tpres'));
select test.throws(format('select public.pres_draw(%s, 2, ''one team only'')', :e), 'two teams', 'a draw needs at least two teams');
-- other class cannot add its team
select test.throws(format('select public.pres_set_teams(%s, array[3]::bigint[], null, ''add other class'')', :e), 'not in this class', 'team from another class rejected');
-- visibility: students see the current draw, not the history
select test.as_db();
select public.pres_set_teams(:e, array[2]::bigint[], null, 'Team two is back') from (select test.as(test.id('tpres'))) x;
select test.as(test.id('tpres'));
select public.pres_draw(:e, 2, 'Draw again after team two returned');
select test.as(test.id('s2'));
select test.eq((select count(*)::int from public.pres_draws where event_id = :e), 1, 'student sees only the current draw');
select test.as(test.id('tpres'));
select test.eq((select count(*)::int from public.pres_draws where event_id = :e), 3, 'staff sees the whole draw history');
select test.as(test.id('x1'));
select test.eq((select count(*)::int from public.pres_draws where event_id = :e), 0, 'other class sees nothing');
