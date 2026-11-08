-- Event chat p:<event>:<group>: per event, team-only, staff moderation; existing channels unchanged.
select test.mk_event() as e \gset
select test.mk_event() as e2 \gset
select test.as(test.id('s2'));
select test.lives(format($q$select public.send_message('p:%s:1', 'event one chat')$q$, :e), 'member posts in own event chat');
select test.lives(format($q$select public.send_message('p:%s:1', 'event two chat')$q$, :e2), 'member posts in a second event chat of the same team');
select test.throws(format($q$select public.send_message('p:%s:2', 'intrude')$q$, :e), 'invalid chat', 'cannot post into another team''s event chat');
select test.throws($q$select public.send_message('p:999:1', 'x')$q$, 'invalid chat', 'unknown event rejected');
select test.throws($q$select public.send_message('p:1:x', 'x')$q$, 'invalid chat', 'malformed channel rejected');
select test.lives(format($q$select public.send_reply('p:%s:1', 'reply', null, null)$q$, :e), 'send_reply works in event chat');
select test.eq((select count(*)::int from public.messages where channel = 'p:' || :e || ':1'), 2, 'member reads event 1 chat');
select test.eq((select count(*)::int from public.messages where channel = 'p:' || :e2 || ':1'), 1, 'events do not mix');
select test.as(test.id('s4'));
select test.eq((select count(*)::int from public.messages where channel like 'p:%:1'), 0, 'other team cannot read team 1 event chats');
select test.as(test.id('x1'));
select test.eq((select count(*)::int from public.messages where channel like 'p:%'), 0, 'other class cannot read event chats');
select test.as(test.id('tpres'));
select test.eq((select count(*)::int from public.messages where channel = 'p:' || :e || ':1'), 2, 'class staff can read (moderation)');
select test.lives(format($q$select public.send_message('p:%s:1', 'staff note')$q$, :e), 'class staff can post');
select test.as(test.id('tother'));
select test.eq((select count(*)::int from public.messages where channel like 'p:%'), 0, 'staff of another class cannot read');
-- former member loses access before freeze
select test.as_db();
update public.profiles set group_id = null where id = test.id('s3');
select test.as(test.id('s3'));
select test.eq((select count(*)::int from public.messages where channel = 'p:' || :e || ':1'), 0, 'former member cannot read event chat');
select test.throws(format($q$select public.send_message('p:%s:1', 'x')$q$, :e), 'invalid chat', 'former member cannot post');
-- after done: participants read-only
select test.as(test.id('tpres')); select public.pres_draw(:e, 0); select public.live_start(:e, 0);
select test.as(test.id('s2'));
select test.lives(format($q$select public.send_message('p:%s:1', 'during live')$q$, :e), 'participant can post while live');
select test.as(test.id('tpres')); select public.live_end(:e, 1);
select test.as(test.id('s2'));
select test.throws(format($q$select public.send_message('p:%s:1', 'after')$q$, :e), 'invalid chat', 'participants cannot post after done');
select test.eq((select count(*)::int from public.messages where channel = 'p:' || :e || ':1'), 4, 'participants still read the history after done');
-- existing channels still behave exactly as before
select test.lives($q$select public.send_message('g:1', 'team chat')$q$, 'existing team chat unchanged');
select test.throws($q$select public.send_message('g:2', 'x')$q$, 'invalid chat', 'existing other-team chat still blocked');
select test.lives(format($q$select public.send_message('d:%s:%s', 'dm')$q$, least(test.id('s2'), test.id('s1')), greatest(test.id('s2'), test.id('s1'))), 'DMs unchanged');
-- close the day keeps event chats
select test.as(test.id('admin'));
select test.lives($q$select public.admin_close_day('test', false)$q$, 'close the day works with event chats present');
select test.as_db();
select test.eq((select count(*)::int from public.messages where channel like 'p:%'), 5, 'event chats kept by close the day');
select test.eq((select count(*)::int from public.messages where channel not like 'p:%'), 0, 'other chats archived and cleared as before');
