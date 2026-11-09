-- Duration as a measured rubric criterion: computed from the recorded duration, override needs a reason.
select test.mk_event() as e \gset
select test.as(test.id('tpres'));
select test.throws(format($q$select public.pres_rubric_save(%s, '[{"key":"t","label":"Time","max":5,"kind":"duration"}]')$q$, :e), 'invalid rubric', 'duration criterion needs target and tolerance');
select test.throws(format($q$select public.pres_rubric_save(%s, '[{"key":"t","label":"Time","max":5,"kind":"duration","target_s":300,"tolerance_s":30},{"key":"u","label":"T2","max":5,"kind":"duration","target_s":300,"tolerance_s":30}]')$q$, :e),
  'invalid rubric', 'at most one duration criterion');
select public.pres_rubric_save(:e, '[{"key":"content","label":"Content","max":10},{"key":"time","label":"Time management","max":5,"kind":"duration","target_s":300,"tolerance_s":30}]');
select public.pres_draw(:e, 0); select public.live_start(:e, 0);
select test.as_db();
update public.pres_live set slot_started_at = clock_timestamp() - interval '340 seconds' where event_id = :e;   -- 40 s over target
select test.as(test.id('tpres')); select public.live_complete_team(:e, 1);
select test.as_db();
select group_id as g from public.pres_live_slots where event_id = :e and slot_index = 0 \gset
select test.eq(public._pres_duration_score(345000, 300, 30, 5), 3, 'formula: 45 s over with 30 s tolerance -> 3/5 (15 s into the 30 s ramp)');
select test.eq(public._pres_duration_score(310000, 300, 30, 5), 5, 'within tolerance -> full marks');
select test.eq(public._pres_duration_score(400000, 300, 30, 5), 0, 'beyond twice the tolerance -> 0');
select test.as(test.id('tpres'));
select test.throws(format($q$select public.pres_score(%s, %s, '{"content":8,"time":5}')$q$, :e, :g), 'give a reason', 'time score different from the measurement needs a reason');
select test.lives(format($q$select public.pres_score(%s, %s, '{"content":8,"time":3}')$q$, :e, :g), 'measured time score accepted without reason');
select test.as_db();
select test.ok((select (auto->>'time')::int = 3 and (auto->>'duration_s')::int between 339 and 342 from public.pres_scores where event_id = :e and superseded_at is null), 'measured value and duration stored with the score');
select test.as(test.id('tpres'));
select test.lives(format($q$select public.pres_score(%s, %s, '{"content":8,"time":5}', '', 'Projector failed for 40 seconds')$q$, :e, :g), 'override with a reason');
select test.as_db();
select test.ok((select auto->>'override_reason' = 'Projector failed for 40 seconds' from public.pres_scores where event_id = :e and superseded_at is null), 'override reason kept');
select test.ok(exists(select 1 from public.pres_audit where entity = 'pres_scores' and reason = 'Projector failed for 40 seconds'), 'override audited');
