-- FCM devices + outbox: idempotent enqueue, lease/skip-locked claim, backoff, dead after 5, invalid token.
select test.as(test.id('s2'));
select test.throws('select public.save_fcm(''short'')', 'invalid device token', 'token format validated');
select test.lives($q$ select public.save_fcm('fcm-token-s2-aaaaaaaaaaaaaaaaaaaaaaaa', 'en') $q$, 'student registers a device');
select test.lives($q$ select public.save_fcm('fcm-token-s2-aaaaaaaaaaaaaaaaaaaaaaaa', 'az') $q$, 'refresh of the same token is an upsert');
select test.throws('select * from public.push_devices', 'permission denied', 'clients cannot read device tokens');
select test.as_db();
select test.eq((select count(*)::int from public.push_devices where user_id = test.id('s2')), 1, 'one device row after refresh');
select test.eq((select lang from public.push_devices where user_id = test.id('s2')), 'az', 'language updated on refresh');

-- enqueue: notification -> one outbox row per active device, plus a wake-up call
delete from net._calls;
select public._notify(array[test.id('s2')], 'pres.draw', '{}', '{"k":"pres"}', 'd1');
select test.eq((select count(*)::int from public.push_outbox), 1, 'notification enqueued once for the device');
select test.ok(exists(select 1 from net._calls where url like '%/push-fcm'), 'sender woken via pg_net');
select public._notify(array[test.id('s2')], 'pres.draw', '{}', '{}', 'd1');
select test.eq((select count(*)::int from public.push_outbox), 1, 'duplicate notification -> no second delivery');

-- message to team g1 -> s2 device (s1 is the sender, so not targeted)
insert into public.messages(channel, sender, body) values ('g:1', test.id('s1'), 'hello team');
select test.eq((select count(*)::int from public.push_outbox where message_id is not null), 1, 'team message enqueued for member device');
insert into public.messages(channel, sender, body) values ('g:2', test.id('s4'), 'other team');
select test.eq((select count(*)::int from public.push_outbox where message_id is not null), 1, 'other team message NOT delivered to s2');

-- claim: lease + no double claim
select test.as_service();
select test.eq((select count(*)::int from public.push_claim(10)), 2, 'claim returns both due rows');
select test.eq((select count(*)::int from public.push_claim(10)), 0, 'leased rows are not claimed twice');
select test.as_db();
update public.push_outbox set lease_until = now() - interval '1 second';
select test.as_service();
select test.eq((select count(*)::int from public.push_claim(10)), 2, 'expired lease is reclaimed');
-- outcomes
select public.push_mark((select min(id) from public.push_outbox), 'ok', 200, null, 'projects/x/messages/1');
select test.as_db();
select test.eq((select status from public.push_outbox order by id limit 1), 'sent', 'ok -> sent');
select test.ok((select last_ok_at is not null from public.push_devices where user_id = test.id('s2')), 'device last_ok_at updated');

-- retry with backoff, dead after 5 attempts
update public.push_outbox set attempts = 1 where id = (select max(id) from public.push_outbox);
select test.as_service();
select public.push_mark((select max(id) from public.push_outbox), 'retry', 503, 'unavailable');
select test.as_db();
select test.eq((select status from public.push_outbox where id = (select max(id) from public.push_outbox)), 'retry', '503 -> retry');
select test.ok((select next_attempt_at between now() + interval '50 seconds' and now() + interval '70 seconds'
  from public.push_outbox where id = (select max(id) from public.push_outbox)), 'first retry after ~1 minute');
update public.push_outbox set attempts = 5 where id = (select max(id) from public.push_outbox);
select test.as_service();
select public.push_mark((select max(id) from public.push_outbox), 'retry', 503, 'unavailable');
select test.as_db();
select test.eq((select status from public.push_outbox where id = (select max(id) from public.push_outbox)), 'dead', 'after 5 attempts -> dead');

-- invalid token disables the device and cancels its queue
select public._notify(array[test.id('s2')], 'pres.draw', '{}', '{}', 'd2');
select public._notify(array[test.id('s2')], 'pres.draw', '{}', '{}', 'd3');
select test.as_service();
select public.push_mark((select max(id) - 1 from public.push_outbox), 'invalid', 404, 'UNREGISTERED');
select test.as_db();
select test.ok((select disabled_at is not null from public.push_devices where user_id = test.id('s2')), 'UNREGISTERED disables the device');
select test.eq((select status from public.push_outbox where id = (select max(id) from public.push_outbox)), 'cancelled', 'queued rows for that device cancelled');
select public._notify(array[test.id('s2')], 'pres.draw', '{}', '{}', 'd4');
select test.eq((select count(*)::int from public.push_outbox o join public.notifications n on n.id = o.notification_id where n.dedupe_key = 'd4'), 0,
  'disabled device receives nothing new');
-- logout
select test.as(test.id('s2'));
select public.save_fcm('fcm-token-s2-aaaaaaaaaaaaaaaaaaaaaaaa', 'az');
select public.drop_fcm('fcm-token-s2-aaaaaaaaaaaaaaaaaaaaaaaa');
select test.as_db();
select test.eq((select disabled_reason from public.push_devices where user_id = test.id('s2')), 'logout', 'drop_fcm on logout disables the device');
-- a notify/outbox failure must not break message sending
select test.as(test.id('s3'));
select public.save_fcm('fcm-token-s3-bbbbbbbbbbbbbbbbbbbbbbbb', 'az');
select test.as_db();
alter table public.push_outbox add constraint t_break check (false) not valid;
delete from public.notify_errors;
select test.as(test.id('s1'));
select test.lives($q$ select public.send_message('g:1', 'still works') $q$, 'send_message succeeds even if the outbox insert fails');
select test.as_db();
select test.ok(exists(select 1 from public.messages where body = 'still works'), 'the message itself was stored');
select test.ok(exists(select 1 from public.notify_errors where kind = 'outbox:msg'), 'the outbox failure was logged (path really exercised)');
select test.eq(public._notify(array[test.id('s3')], 'pres.draw', '{}', '{}', 'd5'), 1, 'notification row kept when its push enqueue fails');
