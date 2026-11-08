-- Speaking order: own slot only, unique, 1..N, complete before submit, host/staff approval, history.
select test.mk_event() as e \gset
select test.as(test.id('s1'));
select test.lives(format('select public.pres_pick(%s, 1)', :e), 's1 picks position 1');
select test.throws(format('select public.pres_pick(%s, 4)', :e), 'from 1 to 3', 'position beyond team size rejected');
select test.as(test.id('s2'));
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'already taken', 'occupied position rejected');
select test.lives(format('select public.pres_pick(%s, 2)', :e), 's2 picks position 2');
select test.throws(format('select public.pres_submit_order(%s)', :e), 'every member', 'incomplete order cannot be submitted');
select test.lives(format('select public.pres_pick(%s, 3)', :e), 's2 changes to position 3');
select test.as(test.id('s3'));
select test.lives(format('select public.pres_pick(%s, 2)', :e), 's3 takes freed position 2');
select test.as(test.id('s4'));
select test.throws(format('select public.pres_approve_order(%s, 1)', :e), 'only the team host', 'member of another team cannot approve');
select test.as(test.id('s2'));
select test.throws(format('select public.pres_approve_order(%s, 1)', :e), 'only the team host', 'non-host member cannot approve');
select test.throws(format('select public.pres_approve_order(%s, 1)', :e), 'only the team host', 'nothing submitted yet anyway');
select test.lives(format('select public.pres_submit_order(%s)', :e), 'complete order submitted');
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'locked', 'picks locked after submit');
select test.as(test.id('s1'));
select test.lives(format('select public.pres_approve_order(%s, 1)', :e), 'team host approves');
select test.as_db();
select test.eq((select speak_state from public.pres_event_teams where event_id = :e and group_id = 1), 'approved', 'state approved');
select test.eq((select speak_by from public.pres_event_teams where event_id = :e and group_id = 1), test.id('s1'), 'approver recorded');
select test.ok((select array_agg(action order by id) from public.pres_speaker_log where event_id = :e and group_id = 1) @> array['pick','change','submit','approve'],
  'selection history recorded (pick/change/submit/approve)');
select test.ok(exists(select 1 from public.pres_audit where entity = 'pres_speakers' and event_id = :e), 'speaker changes audited');
select test.as(test.id('s1'));
select test.throws(format('select public.pres_return_order(%s, 1, ''x'')', :e), 'only be reopened by staff', 'host cannot reopen an approved order');
select test.as(test.id('tpres'));
select test.lives(format('select public.pres_return_order(%s, 1, ''please swap 1 and 2'')', :e), 'staff reopens an approved order');
select test.as_db();
select test.eq((select speak_state from public.pres_event_teams where event_id = :e and group_id = 1), 'open', 'order open again for revision');
-- concurrent double pick: second transaction must wait on the team lock and then see the slot taken
select test.as(test.id('s4'));
select test.lives(format('select public.pres_pick(%s, 1)', :e), 's4 (team 2) picks 1 - positions are per team');
select test.as(test.id('outsider'));
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'not signed in', 'auth user without profile rejected');
select test.as(test.id('s6'));
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'not in a team', 'idle student rejected');
