-- Live stage record: per-team status and durations persist; invalid/duplicate transitions are refused; recovery = server rows.
select test.mk_event() as e \gset
select test.as(test.id('s1')); select public.pres_pick(:e, 1); select test.as(test.id('s2')); select public.pres_pick(:e, 2);
select test.as(test.id('tpres')); select public.pres_draw(:e, 0);
select test.eq(public.live_start(:e, 0), 1, 'start');
select test.throws(format('select public.live_start(%s, 1)', :e), 'run the draw', 'duplicate start refused');
select test.as_db();
select test.eq((select count(*)::int from public.pres_live_slots where event_id = :e), 2, 'one slot per drawn team');
select test.eq((select array_agg(status order by slot_index) from public.pres_live_slots where event_id = :e), array['presenting','pending'], 'first team presenting');
select test.ok((select array_agg(group_id order by slot_index) from public.pres_live_slots where event_id = :e)
  = (select result from public.pres_draws where event_id = :e and superseded_at is null), 'slots follow the drawn order');
update public.pres_live set slot_started_at = clock_timestamp() - interval '95 seconds' where event_id = :e;
select group_id as g1 from public.pres_live_slots where event_id = :e and slot_index = 0 \gset
select test.as(test.id('tpres'));
select count(*) - 1 as last from public.pres_speakers_final where event_id = :e and group_id = :g1 \gset
select test.eq((select count(public.live_next_speaker(:e, v)) from generate_series(1, :last) v)::int, :last, 'step through every speaker of the team');
select test.throws(format('select public.live_next_speaker(%s, %s)', :e, 1 + :last), 'no speaker', 'cannot go past the last speaker of the team');
select version as v from public.pres_live where event_id = :e \gset
select test.eq(public.live_complete_team(:e, :v), :v + 1, 'complete the first team (stop timer)');
select test.throws(format('select public.live_complete_team(%s, %s)', :e, :v + 1), 'already completed', 'cannot complete twice');
select test.throws(format('select public.live_resume(%s, %s)', :e, :v + 1), 'finished', 'cannot resume a completed team');
select test.as_db();
select test.ok((select status = 'done' and duration_ms between 94000 and 97000 and completed_by = test.id('tpres') from public.pres_live_slots where event_id = :e and slot_index = 0),
  'recorded duration ~95 s and who completed it');
-- "device restart": everything needed to redraw the stage is in server rows
select test.ok((select state = 'paused' and slot_index = 0 from public.pres_live where event_id = :e), 'clock state recoverable from pres_live');
select test.as(test.id('tpres'));
select test.eq(public.live_next(:e, :v + 1), :v + 2, 'next team');
select test.as_db();
select test.ok((select status from public.pres_live_slots where event_id = :e and slot_index = 0) = 'done'
  and (select duration_ms from public.pres_live_slots where event_id = :e and slot_index = 0) between 94000 and 97000, 'completed team keeps its duration after moving on');
select test.as(test.id('tpres'));
select test.lives(format($q$select public.live_note(%s, %s, 'Good eye contact')$q$, :e, :g1), 'staff adds a private note');
select test.eq(public.live_end(:e, :v + 2), :v + 3, 'end');
select test.as_db();
select test.eq((select array_agg(status order by slot_index) from public.pres_live_slots where event_id = :e), array['done','done'], 'all teams done at the end');
select test.as(test.id('s2'));
select test.eq((select count(*)::int from public.pres_live_slots where event_id = :e), 2, 'students see the stage record');
select test.eq((select count(*)::int from public.pres_staff_notes where event_id = :e), 0, 'students never see staff notes');
select test.throws(format($q$select public.live_note(%s, %s, 'x')$q$, :e, :g1), 'permission', 'students cannot add notes');
select test.as_db();
select test.throws(format('delete from public.pres_live_slots where event_id = %s', :e), 'cannot be deleted', 'stage record cannot be deleted');
select test.ok((select count(*) >= 4 from public.pres_audit where entity = 'pres_live_slots' and event_id = :e), 'stage transitions audited');
