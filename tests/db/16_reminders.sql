-- Scheduled reminders: exactly once per window, deadline changes re-time them, approved/done/removed teams excluded.
select test.mk_event() as e \gset
select test.as_db();
update public.pres_events set final_due = now() + interval '30 hours' where id = :e;
select test.as_service();
select test.eq(public.pres_due_reminders(now()), 0, 'nothing 30 h before');
select test.eq(public.pres_due_reminders(now() + interval '7 hours'), 5, '24 h window: all 5 members of 2 teams reminded');
select test.eq(public.pres_due_reminders(now() + interval '7 hours 5 minutes'), 0, 'repeated run in the same window: no duplicates');
select test.eq(public.pres_due_reminders(now() + interval '28 hours 30 minutes'), 5, '2 h window: second reminder');
select test.eq(public.pres_due_reminders(now() + interval '29 hours'), 0, '2 h reminder only once');
select test.eq(public.pres_due_reminders(now() + interval '31 hours'), 0, 'nothing after the deadline');
select test.as_db();
select test.eq((select count(*)::int from public.notifications where kind = 'pres.rem24'), 5, 'one 24 h reminder per member');
select test.eq((select count(*)::int from public.notifications where kind = 'pres.rem2'), 5, 'one 2 h reminder per member');
-- deadline moved later: old reminders superseded, new ones at the new times
select test.as(test.id('tpres'));
select test.throws(format($q$select public.pres_set_due(%s, now() + interval '3 days', null)$q$, :e), 'reason', 'changing the deadline needs a reason');
select test.lives(format($q$select public.pres_set_due(%s, now() + interval '3 days', 'Extended by one day')$q$, :e), 'staff moves the deadline later');
select test.as_db();
select test.eq((select count(*)::int from public.notifications where kind in ('pres.rem24','pres.rem2') and superseded_at is null), 0, 'old reminders superseded');
select test.eq((select count(*)::int from public.notifications where kind = 'pres.due_changed'), 5, 'members told the deadline changed');
select test.as_service();
select test.eq(public.pres_due_reminders(now() + interval '2 days 1 hour'), 5, 'new 24 h reminder fires for the new deadline');
select test.eq(public.pres_due_reminders(now() + interval '2 days 23 hours'), 5, 'new 2 h reminder fires for the new deadline');
-- deadline moved to < 2 h away: only the 2 h reminder
select test.as(test.id('tpres'));
select public.pres_set_due(:e, now() + interval '90 minutes', 'Moved earlier by mistake');
select test.as_service();
select test.eq(public.pres_due_reminders(now()), 5, 'only the 2 h reminder for a deadline 90 min away');
select test.as_db();
select test.eq((select count(*)::int from public.notifications where kind = 'pres.rem24' and dedupe_key like '%' || extract(epoch from (now() + interval '90 minutes'))::bigint),
  0, 'no 24 h reminder for that deadline');
-- approved final / removed team / done event excluded
update public.pres_event_teams set final_state = 'approved' where event_id = :e and group_id = 1;
select test.as(test.id('tpres'));
select public.pres_set_due(:e, now() + interval '20 hours', 'Final deadline set');
select test.as_service();
select test.eq(public.pres_due_reminders(now()), 2, 'team with approved final gets no reminder (only team 2: 2 members)');
select test.as(test.id('tpres'));
select public.pres_set_due(:e, now() + interval '21 hours', 'One more hour');
select public.pres_set_teams(:e, null, array[2]::bigint[], null);
select test.as_service();
select test.eq(public.pres_due_reminders(now()), 0, 'removed team gets no reminder');
-- pending pushes for superseded reminders are cancelled
select test.as(test.id('s4'));
select public.save_fcm('fcm-token-s4-cccccccccccccccccccccccc', 'az');
select test.as_db();
select public._notify(array[test.id('s4')], 'pres.rem24', '{}', jsonb_build_object('k','pres','event', :e), 'rem24:' || :e || ':1');
select test.as(test.id('tpres'));
select public.pres_set_teams(:e, array[2]::bigint[], null, null);
select public.pres_set_due(:e, now() + interval '22 hours', 'Final change');
select test.as_db();
select test.eq((select o.status from public.push_outbox o join public.notifications n on n.id = o.notification_id where n.dedupe_key = 'rem24:' || :e || ':1'), 'cancelled',
  'queued push for the old reminder cancelled');
-- security: only service role / cron
select test.as(test.id('tpres'));
select test.throws('select public.pres_due_reminders()', 'permission denied', 'staff cannot trigger the reminder job');
