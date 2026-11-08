-- Roster & access rules (plan §2.5), row by row. History is never deleted.
select test.mk_event() as e \gset
select test.eq((select count(*)::int from public.pres_roster where event_id = :e and left_at is null), 5, 'roster filled from team membership');
-- (1) open order: leaver's slot auto-cleared, roster row kept with left_at
select test.as(test.id('s3')); select public.pres_pick(:e, 1);
select test.as_db();
update public.profiles set group_id = null where id = test.id('s3');
select test.ok((select left_at is not null and left_reason = 'left_team' from public.pres_roster where event_id = :e and user_id = test.id('s3')), 'leaver keeps roster row with left_at');
select test.eq((select count(*)::int from public.pres_speakers where event_id = :e and user_id = test.id('s3')), 0, 'open order: leaver slot cleared');
select test.as(test.id('s3'));
select test.eq((select count(*)::int from public.pres_files where event_id = :e and group_id = 1), 0, 'former member (pre-freeze) loses file access');
select test.eq((select count(*)::int from public.pres_roster where event_id = :e and user_id = test.id('s3')), 1, 'former member still sees own history row');
select test.eq((select count(*)::int from public.pres_my_history()), 1, '"My presentations" lists the event for the former member');
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'not in a team', 'former member cannot act');
-- (2) joiner gets a roster row; submitted order reopens
select test.as(test.id('s1')); select public.pres_pick(:e, 1);
select test.as(test.id('s2')); select public.pres_pick(:e, 2); select public.pres_submit_order(:e);
select test.as_db();
update public.profiles set group_id = 1 where id = test.id('s6');
select test.ok(exists(select 1 from public.pres_roster where event_id = :e and user_id = test.id('s6') and group_id = 1 and left_at is null), 'joiner added to roster');
select test.eq((select speak_state from public.pres_event_teams where event_id = :e and group_id = 1), 'open', 'submitted order reopened when a member joins');
-- (3) approved order: leaver marked withdrawn, state needs_review, cannot be approved until returned
select test.as(test.id('s6')); select public.pres_pick(:e, 3);
select test.as(test.id('s2')); select public.pres_submit_order(:e);
select test.as(test.id('s1')); select public.pres_approve_order(:e, 1);
select test.as_db();
update public.profiles set group_id = null where id = test.id('s6');
select test.eq((select speak_state from public.pres_event_teams where event_id = :e and group_id = 1), 'needs_review', 'approved order -> needs_review');
select test.ok((select withdrawn from public.pres_speakers where event_id = :e and user_id = test.id('s6')), 'leaver kept in approved order as withdrawn');
select test.ok(exists(select 1 from public.notifications where kind = 'pres.order_review'), 'host/staff notified to review');
select test.as(test.id('s1'));
select test.throws(format('select public.pres_approve_order(%s, 1)', :e), 'no submitted order', 'needs_review cannot be approved directly');
select test.lives(format('select public.pres_return_order(%s, 1, ''member left'')', :e), 'host returns a needs_review order');
select test.as_db();
select test.eq((select count(*)::int from public.pres_speakers where event_id = :e and withdrawn), 0, 'withdrawn slots removed on return');
select test.ok((select count(*) from public.pres_speaker_log where event_id = :e and action in ('member_left','member_joined')) >= 3, 'membership changes in speaking-order history');
-- (4) moving between teams: leaves team 1, joins team 2 in the same event
update public.profiles set group_id = 2 where id = test.id('s2');
select test.ok(exists(select 1 from public.pres_roster where event_id = :e and user_id = test.id('s2') and group_id = 1 and left_reason = 'moved_team'), 'move recorded on old team');
select test.ok(exists(select 1 from public.pres_roster where event_id = :e and user_id = test.id('s2') and group_id = 2 and left_at is null), 'move adds to new team');
update public.profiles set group_id = 1 where id = test.id('s2');
-- (5) freeze at live: participants keep read access forever, late joiners get none
select test.as(test.id('s1')); select public.pres_pick(:e, 1);
select test.as(test.id('s2')); select public.pres_pick(:e, 2); select public.pres_submit_order(:e);
select test.as(test.id('s1')); select public.pres_approve_order(:e, 1);
select test.as(test.id('tpres')); select public.pres_draw(:e, 0);
select public.live_start(:e, 0);
select test.as_db();
select test.ok((select bool_and(participant) from public.pres_roster where event_id = :e and left_at is null), 'all active members became participants');
select test.eq((select array_agg(user_id order by position) from public.pres_speakers_final where event_id = :e and group_id = 1), array[test.id('s1'), test.id('s2')],
  'speaking order snapshot frozen');
select test.ok((select bool_and(approved) from public.pres_speakers_final where event_id = :e and group_id = 1), 'snapshot marked approved');
select test.throws(format('update public.pres_speakers_final set position = 9 where event_id = %s', :e), 'protected', 'frozen order cannot be edited');
update public.profiles set group_id = 2 where id = test.id('s2');   -- participant moves away after freeze
select test.ok((select left_at is null and participant and left_group_at is not null from public.pres_roster where event_id = :e and user_id = test.id('s2') and group_id = 1 and left_at is null),
  'participant who moved after freeze keeps participation (left_group_at recorded)');
select test.eq((select count(*)::int from public.pres_roster where event_id = :e and user_id = test.id('s2') and group_id = 2 and left_at is null), 0,
  'no new roster row in a frozen event');
update public.profiles set group_id = 1 where id = test.id('s6');   -- late joiner after freeze
select test.as(test.id('s6'));
select test.eq((select count(*)::int from public.pres_files where event_id = :e and group_id = 1), 0, 'late joiner has no access to the frozen event workspace');
select test.ok(not public._pres_read(:e, 1), 'late joiner: no team read access');
select test.as(test.id('s2'));
select test.ok(public._pres_read(:e, 1), 'participant keeps read access after moving teams');
select test.ok(not public._pres_member(:e, 1), 'participant is not an active member (read-only)');
select test.as(test.id('tpres'));
select test.lives(format($q$select public.pres_roster_add(%s, 1, test.id('s6'), 'joined late, presents too')$q$, :e), 'staff adds a late participant with reason');
select test.as(test.id('s6'));
select test.ok(public._pres_read(:e, 1), 'late participant added by staff can read');
select test.as_db();
select test.throws(format('delete from public.pres_roster where event_id = %s', :e), 'cannot be deleted', 'roster history cannot be deleted');
select test.throws(format($q$update public.pres_roster set participant = false where event_id = %s$q$, :e), 'cannot be removed|protected', 'participation cannot be revoked');
-- (6) group deletion keeps frozen history
delete from public.groups where id = 1;
select test.ok(exists(select 1 from public.pres_event_teams where event_id = :e and group_id = 1 and removed_at is null), 'frozen event keeps a deleted team');
select test.ok(exists(select 1 from public.pres_roster where event_id = :e and group_id = 1), 'roster history survives group deletion');
