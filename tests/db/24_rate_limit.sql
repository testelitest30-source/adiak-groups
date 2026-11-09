-- Server-side rate limits (not client-side only).
select test.mk_event() as e \gset
select test.as(test.id('s1'));
select count(public.pres_pick(:e, 1)) from generate_series(1, 40);
select test.throws(format('select public.pres_pick(%s, 1)', :e), 'too many requests', '41st pick within a minute is refused');
select test.as(test.id('s2'));
select test.lives(format('select public.pres_pick(%s, 2)', :e), 'limits are per user');
select test.as_db();
update public.rate_events set at = at - interval '2 minutes';
select test.as(test.id('s1'));
select test.lives(format('select public.pres_pick(%s, 1)', :e), 'window slides: allowed again after a minute');
select test.throws('select * from public.rate_events', 'permission denied', 'rate log not readable by clients');
select test.as_service();
select test.lives('select public.push_sweep()', 'service context is not rate limited');
