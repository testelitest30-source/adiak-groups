-- ADIAK 1.0 / M3 Presentation Center RPCs (class A), internal helpers, freeze, membership sync (class D).
do $$ begin
  if to_regclass('public.pres_events') is null then raise exception 'pre-flight: M2 (pres_schema) must be applied first'; end if;
  if to_regprocedure('public.pres_draw(bigint,integer,text)') is not null then raise exception 'pre-flight: M3 already applied'; end if;
end $$;

-- ================= internal helpers (no client grants) =================
create or replace function public._pres_reason(r text) returns void
 language sql set search_path = pg_catalog as $$ select set_config('adiak.reason', coalesce(r, ''), true) $$;

create or replace function public._pres_need_reason(r text) returns text
 language plpgsql immutable set search_path = pg_catalog as $$
begin
  if r is null or char_length(trim(r)) < 5 then raise exception 'Please give a reason (at least 5 characters).'; end if;
  return left(trim(r), 300);
end $$;

create or replace function public._pres_event_for_staff(e bigint, lock boolean default false) returns public.pres_events
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events;
begin
  perform public._me_ok();
  if lock then select * into ev from public.pres_events where id = e for update; else select * into ev from public.pres_events where id = e; end if;
  if not found then raise exception 'Presentation not found'; end if;
  if not public._pres_staff(ev.class_tag) then raise exception 'You do not have permission for this action'; end if;
  return ev;
end $$;

create or replace function public._pres_staff_ids(tag text) returns uuid[]
 language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(
    (select array_agg(distinct s.user_id) from public.class_staff s where s.class_tag = tag and 'presentations' = any (s.perms)),
    (select array_agg(id) from public.profiles where is_admin or 'admin' = any (perms))) $$;

create or replace function public._pres_team_ids(e bigint, g bigint) returns uuid[]
 language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(array_agg(user_id), '{}') from public.pres_roster
   where event_id = e and group_id = g and (left_at is null or participant) $$;

create or replace function public._pres_event_ids(e bigint) returns uuid[]
 language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(array_agg(distinct r.user_id), '{}') from public.pres_roster r
   join public.pres_event_teams t on t.event_id = r.event_id and t.group_id = r.group_id and t.removed_at is null
   where r.event_id = e and (r.left_at is null or r.participant) $$;

create or replace function public._pres_my_group(e bigint) returns bigint   -- active team of the caller (event not frozen)
 language sql stable security definer set search_path = pg_catalog, public as $$
  select r.group_id from public.pres_roster r join public.pres_events ev on ev.id = r.event_id
   join public.pres_event_teams t on t.event_id = r.event_id and t.group_id = r.group_id and t.removed_at is null
   where r.event_id = e and r.user_id = auth.uid() and r.left_at is null and ev.frozen_at is null
     and ev.status in ('draft','open','drawn') limit 1 $$;

create or replace function public._pres_tgt(e bigint, g bigint, sec text, i bigint default null) returns jsonb
 language sql immutable set search_path = pg_catalog as $$
  select jsonb_strip_nulls(jsonb_build_object('k', 'pres', 'event', e, 'group', g, 'sec', sec, 'id', i)) $$;

create or replace function public._pres_order_log(e bigint, g bigint, u uuid, act text, b int, a int, nt text default null) returns void
 language sql security definer set search_path = pg_catalog, public as $$
  insert into public.pres_speaker_log (event_id, group_id, user_id, actor, action, before_pos, after_pos, note)
  values (e, g, u, auth.uid(), act, b, a, nt) $$;

-- add the current members of a team to the event roster (idempotent)
create or replace function public._pres_roster_fill(e bigint, g bigint) returns void
 language sql security definer set search_path = pg_catalog, public as $$
  insert into public.pres_roster (event_id, group_id, user_id, user_name)
  select e, g, p.id, p.name from public.profiles p
   where p.group_id = g and not exists (select 1 from public.pres_roster r where r.event_id = e and r.user_id = p.id and r.left_at is null)
$$;

-- freeze: participants + immutable speaking-order snapshot (live/done)
create or replace function public._pres_freeze(e bigint) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare tm record; k int;
begin
  if (select frozen_at from public.pres_events where id = e) is not null then return; end if;
  update public.pres_roster r set participant = true, frozen_at = now()
   where r.event_id = e and r.left_at is null
     and exists (select 1 from public.pres_event_teams t where t.event_id = e and t.group_id = r.group_id and t.removed_at is null);
  for tm in select * from public.pres_event_teams where event_id = e and removed_at is null loop
    insert into public.pres_speakers_final (event_id, group_id, position, user_id, user_name, approved, placed)
    select e, tm.group_id, row_number() over (order by s.position), s.user_id, r.user_name, tm.speak_state = 'approved', true
      from public.pres_speakers s join public.pres_roster r on r.event_id = e and r.group_id = tm.group_id and r.user_id = s.user_id and r.participant
     where s.event_id = e and s.group_id = tm.group_id and not s.withdrawn;
    select coalesce(max(position), 0) into k from public.pres_speakers_final where event_id = e and group_id = tm.group_id;
    insert into public.pres_speakers_final (event_id, group_id, position, user_id, user_name, approved, placed)
    select e, tm.group_id, k + row_number() over (order by r.user_name), r.user_id, r.user_name, false, false
      from public.pres_roster r
     where r.event_id = e and r.group_id = tm.group_id and r.participant
       and not exists (select 1 from public.pres_speakers_final f where f.event_id = e and f.group_id = tm.group_id and f.user_id = r.user_id);
  end loop;
  update public.pres_events set frozen_at = now(), updated_at = now() where id = e;
end $$;

-- ================= events =================
create or replace function public.pres_event_save(e bigint, cls text, ttl text, dsc text, starts timestamptz, due timestamptz, slot int)
 returns bigint language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); ev public.pres_events; nid bigint;
begin
  if ttl is null or char_length(trim(ttl)) not between 2 and 80 then raise exception 'Title must be 2 to 80 characters'; end if;
  if char_length(coalesce(dsc, '')) > 1000 then raise exception 'Description is too long (max 1000)'; end if;
  if slot is null or slot not between 1 and 60 then raise exception 'Time per team must be 1 to 60 minutes'; end if;
  if e is null then
    if not exists (select 1 from public.classes where tag = cls) then raise exception 'That class group does not exist'; end if;
    if not public._pres_staff(cls) then raise exception 'You do not have permission for this action'; end if;
    insert into public.pres_events (class_tag, title, descr, starts_at, final_due, slot_minutes, created_by)
    values (cls, trim(ttl), coalesce(trim(dsc), ''), starts, due, slot, u) returning id into nid;
    insert into public.pres_live (event_id, duration_s, updated_by) values (nid, slot * 60, u);
    return nid;
  end if;
  ev := public._pres_event_for_staff(e, true);
  if ev.status in ('live','done') then raise exception 'This presentation is already live or finished'; end if;
  if ev.status <> 'draft' and due is distinct from ev.final_due then raise exception 'Use "Change deadline" to move the deadline'; end if;
  update public.pres_events set title = trim(ttl), descr = coalesce(trim(dsc), ''), starts_at = starts,
         final_due = case when ev.status = 'draft' then due else final_due end, slot_minutes = slot, updated_at = now() where id = e;
  update public.pres_live set duration_s = slot * 60, updated_at = now() where event_id = e and state = 'idle';
  return e;
end $$;

create or replace function public.pres_event_status(e bigint, st text, reason text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true);
begin
  if st = 'open' and ev.status = 'draft' then
    update public.pres_events set status = 'open', updated_at = now() where id = e;
    perform public._notify(public._pres_event_ids(e), 'pres.opened', jsonb_build_object('title', ev.title), public._pres_tgt(e, null, 'overview'), 'open:' || e);
  elsif st = 'done' and ev.status in ('open','drawn','live') then
    perform public._pres_reason(case when ev.status = 'live' then coalesce(reason, 'finished') else public._pres_need_reason(reason) end);
    perform public._pres_freeze(e);
    update public.pres_events set status = 'done', updated_at = now() where id = e;
    update public.pres_live set state = 'ended', version = version + 1, updated_by = auth.uid(), updated_at = now() where event_id = e;
  else
    raise exception 'Cannot change status from % to %', ev.status, st;
  end if;
end $$;

create or replace function public.pres_set_due(e bigint, due timestamptz, reason text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true); r text := public._pres_need_reason(reason);
begin
  if ev.status in ('live','done') then raise exception 'This presentation is already live or finished'; end if;
  if due is not distinct from ev.final_due then return; end if;
  perform public._pres_reason(r);
  update public.pres_events set final_due = due, updated_at = now() where id = e;
  -- reminders for the old deadline are superseded and their pending pushes cancelled (new keys include the new deadline)
  with old as (
    update public.notifications set superseded_at = now()
     where kind in ('pres.rem24','pres.rem2') and (target->>'event')::bigint = e and superseded_at is null
       and dedupe_key not like '%:' || coalesce(extract(epoch from due)::bigint::text, 'none')
    returning id)
  update public.push_outbox set status = 'cancelled', updated_at = now()
   where notification_id in (select id from old) and status in ('queued','retry');
  if ev.status <> 'draft' then
    perform public._notify(public._pres_event_ids(e), 'pres.due_changed', jsonb_build_object('title', ev.title, 'due', due),
      public._pres_tgt(e, null, 'overview'), 'due:' || e || ':' || coalesce(extract(epoch from due)::bigint::text, 'none'));
  end if;
end $$;

-- ================= participating teams =================
create or replace function public.pres_set_teams(e bigint, add_g bigint[], rm_g bigint[], reason text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true); g bigint; cur public.pres_draws; nm text; r text;
begin
  if ev.status in ('live','done') then raise exception 'The team list is frozen once the presentation is live'; end if;
  perform pg_advisory_xact_lock(hashtext('pres_draw'), e::int);
  select * into cur from public.pres_draws where event_id = e and superseded_at is null;
  if found and (coalesce(cardinality(add_g), 0) + coalesce(cardinality(rm_g), 0)) > 0 then
    r := public._pres_need_reason(reason);   -- changing teams after a draw needs a reason and invalidates the draw
  end if;
  perform public._pres_reason(coalesce(r, reason));
  foreach g in array coalesce(add_g, '{}') loop
    select name into nm from public.groups where id = g and class_tag = ev.class_tag;
    if not found then raise exception 'Team % is not in this class group', g; end if;
    insert into public.pres_event_teams (event_id, group_id, group_name, added_by) values (e, g, nm, auth.uid())
    on conflict (event_id, group_id) do update set removed_at = null, removed_by = null, remove_reason = null, group_name = excluded.group_name;
    perform public._pres_roster_fill(e, g);
    if ev.status <> 'draft' then
      perform public._notify(public._pres_team_ids(e, g), 'pres.team_added', jsonb_build_object('title', ev.title), public._pres_tgt(e, g, 'overview'), 'tadd:' || e || ':' || g || ':' || extract(epoch from now())::bigint);
    end if;
  end loop;
  foreach g in array coalesce(rm_g, '{}') loop
    update public.pres_event_teams set removed_at = now(), removed_by = auth.uid(), remove_reason = left(coalesce(r, reason, ''), 300)
     where event_id = e and group_id = g and removed_at is null;
    update public.pres_roster set left_at = now(), left_reason = 'team_removed' where event_id = e and group_id = g and left_at is null;
  end loop;
  if cur.id is not null and (coalesce(cardinality(add_g), 0) + coalesce(cardinality(rm_g), 0)) > 0 then
    update public.pres_draws set superseded_at = now(), superseded_by = auth.uid(), superseded_reason = 'teams changed: ' || r where id = cur.id;
    update public.pres_events set status = 'open', updated_at = now() where id = e and status = 'drawn';
    perform public._notify(public._pres_staff_ids(ev.class_tag), 'pres.redraw_needed', jsonb_build_object('title', ev.title), public._pres_tgt(e, null, 'draw'), 'rdn:' || cur.id);
  end if;
end $$;

-- ================= transparent draw =================
create or replace function public.pres_draw(e bigint, expected_round int, reason text default null) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true); cur int; r text; parts bigint[]; res bigint[]; nid bigint; t record;
begin
  perform pg_advisory_xact_lock(hashtext('pres_draw'), e::int);
  if ev.status not in ('open','drawn') then raise exception 'Open the presentation before drawing (status: %)', ev.status; end if;
  select coalesce(max(round), 0) into cur from public.pres_draws where event_id = e;
  if expected_round is distinct from cur then raise exception 'The draw changed meanwhile. Reload and try again.'; end if;
  if cur > 0 then r := public._pres_need_reason(reason); end if;
  select array_agg(group_id order by group_id), array_agg(group_id order by gen_random_uuid()) into parts, res
    from public.pres_event_teams where event_id = e and removed_at is null;
  if coalesce(cardinality(parts), 0) < 2 then raise exception 'At least two teams are needed for a draw'; end if;
  perform public._pres_reason(r);
  update public.pres_draws set superseded_at = now(), superseded_by = auth.uid(), superseded_reason = r
   where event_id = e and superseded_at is null;
  insert into public.pres_draws (event_id, round, participants, result, drawn_by, reason)
  values (e, cur + 1, parts, res, auth.uid(), r) returning id into nid;
  update public.pres_events set status = 'drawn', updated_at = now() where id = e;
  for t in select g, ord from unnest(res) with ordinality as x(g, ord) loop
    perform public._notify(public._pres_team_ids(e, t.g), case when cur = 0 then 'pres.draw' else 'pres.redraw' end,
      jsonb_build_object('title', ev.title, 'pos', t.ord, 'n', cardinality(res), 'round', cur + 1), public._pres_tgt(e, t.g, 'draw'), 'draw:' || nid);
  end loop;
  return nid;
end $$;

-- ================= speaking order =================
create or replace function public._pres_team_lock(e bigint, g bigint) returns public.pres_event_teams
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare t public.pres_event_teams;
begin
  select * into t from public.pres_event_teams where event_id = e and group_id = g and removed_at is null for update;
  if not found then raise exception 'This team is not part of the presentation'; end if;
  return t;
end $$;

create or replace function public._pres_active_n(e bigint, g bigint) returns int
 language sql stable security definer set search_path = pg_catalog, public as $$
  select count(*)::int from public.pres_roster where event_id = e and group_id = g and left_at is null $$;

create or replace function public.pres_pick(e bigint, pos int) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); g bigint := public._pres_my_group(e); t public.pres_event_teams; n int; old int; holder uuid;
begin
  if g is null then raise exception 'You are not in a team for this presentation'; end if;
  t := public._pres_team_lock(e, g);
  if t.speak_state <> 'open' then raise exception 'The speaking order is locked (%).', t.speak_state; end if;
  n := public._pres_active_n(e, g);
  if pos is null or pos < 1 or pos > n then raise exception 'Choose a position from 1 to %', n; end if;
  select user_id into holder from public.pres_speakers where event_id = e and group_id = g and position = pos;
  if holder is not null and holder <> u then raise exception 'That position is already taken'; end if;
  select position into old from public.pres_speakers where event_id = e and group_id = g and user_id = u;
  if old = pos then return; end if;
  if old is null then insert into public.pres_speakers (event_id, group_id, user_id, position) values (e, g, u, pos);
  else update public.pres_speakers set position = pos, chosen_at = now() where event_id = e and group_id = g and user_id = u; end if;
  perform public._pres_order_log(e, g, u, case when old is null then 'pick' else 'change' end, old, pos);
end $$;

create or replace function public.pres_unpick(e bigint) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); g bigint := public._pres_my_group(e); t public.pres_event_teams; old int;
begin
  if g is null then raise exception 'You are not in a team for this presentation'; end if;
  t := public._pres_team_lock(e, g);
  if t.speak_state <> 'open' then raise exception 'The speaking order is locked (%).', t.speak_state; end if;
  delete from public.pres_speakers where event_id = e and group_id = g and user_id = u returning position into old;
  if old is not null then perform public._pres_order_log(e, g, u, 'unpick', old, null); end if;
end $$;

create or replace function public._pres_order_complete(e bigint, g bigint) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  with act as (select user_id from public.pres_roster where event_id = e and group_id = g and left_at is null),
       sp as (select s.user_id, s.position from public.pres_speakers s join act using (user_id)
               where s.event_id = e and s.group_id = g and not s.withdrawn)
  select (select count(*) from act) > 0
     and (select count(*) from sp) = (select count(*) from act)
     and not exists (select 1 from public.pres_speakers s where s.event_id = e and s.group_id = g and s.withdrawn)
     and (select coalesce(array_agg(position order by position), '{}') from sp) = (select array_agg(i) from generate_series(1, (select count(*)::int from act)) i)
$$;

create or replace function public.pres_submit_order(e bigint) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); g bigint := public._pres_my_group(e); t public.pres_event_teams; ev public.pres_events; host uuid;
begin
  if g is null then raise exception 'You are not in a team for this presentation'; end if;
  t := public._pres_team_lock(e, g);
  if t.speak_state <> 'open' then raise exception 'The speaking order was already submitted'; end if;
  if not public._pres_order_complete(e, g) then raise exception 'Every member must choose a different position first'; end if;
  update public.pres_event_teams set speak_state = 'submitted', speak_by = u, speak_at = now() where event_id = e and group_id = g;
  perform public._pres_order_log(e, g, u, 'submit', null, null);
  select * into ev from public.pres_events where id = e; select host_id into host from public.groups where id = g;
  perform public._notify(array_append(public._pres_staff_ids(ev.class_tag), host), 'pres.order_submitted',
    jsonb_build_object('title', ev.title, 'team', t.group_name), public._pres_tgt(e, g, 'order'), 'osub:' || e || ':' || g || ':' || extract(epoch from now())::bigint);
end $$;

create or replace function public._pres_is_host(e bigint, g bigint) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.groups gr where gr.id = g and gr.host_id = auth.uid()) and public._pres_member(e, g) $$;

create or replace function public.pres_approve_order(e bigint, g bigint) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); t public.pres_event_teams; ev public.pres_events;
begin
  select * into ev from public.pres_events where id = e;
  if not found then raise exception 'Presentation not found'; end if;
  if not (public._pres_staff(ev.class_tag) or public._pres_is_host(e, g)) then raise exception 'Only the team host or staff can approve the order'; end if;
  if ev.frozen_at is not null then raise exception 'The presentation is already live or finished'; end if;
  t := public._pres_team_lock(e, g);
  if t.speak_state <> 'submitted' then raise exception 'There is no submitted order to approve (%).', t.speak_state; end if;
  if not public._pres_order_complete(e, g) then raise exception 'The order is incomplete and cannot be approved'; end if;
  update public.pres_event_teams set speak_state = 'approved', speak_by = u, speak_at = now() where event_id = e and group_id = g;
  perform public._pres_order_log(e, g, u, 'approve', null, null);
  perform public._notify(public._pres_team_ids(e, g), 'pres.order_approved', jsonb_build_object('title', ev.title), public._pres_tgt(e, g, 'order'),
    'oapp:' || e || ':' || g || ':' || extract(epoch from now())::bigint);
end $$;

create or replace function public.pres_return_order(e bigint, g bigint, note text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); t public.pres_event_teams; ev public.pres_events; staff boolean;
begin
  select * into ev from public.pres_events where id = e;
  if not found then raise exception 'Presentation not found'; end if;
  staff := public._pres_staff(ev.class_tag);
  if not (staff or public._pres_is_host(e, g)) then raise exception 'Only the team host or staff can return the order'; end if;
  if ev.frozen_at is not null then raise exception 'The presentation is already live or finished'; end if;
  t := public._pres_team_lock(e, g);
  if t.speak_state = 'open' then return; end if;
  if t.speak_state = 'approved' and not staff then raise exception 'An approved order can only be reopened by staff'; end if;
  delete from public.pres_speakers where event_id = e and group_id = g and withdrawn;
  update public.pres_event_teams set speak_state = 'open', speak_by = u, speak_at = now() where event_id = e and group_id = g;
  perform public._pres_order_log(e, g, u, 'return', null, null, left(note, 300));
  perform public._notify(public._pres_team_ids(e, g), 'pres.order_returned', jsonb_build_object('title', ev.title, 'note', left(coalesce(note, ''), 300)),
    public._pres_tgt(e, g, 'order'), 'oret:' || e || ':' || g || ':' || extract(epoch from now())::bigint);
end $$;

-- ================= files & final version =================
create or replace function public.pres_add_file(e bigint, pth text, fname text, fmime text, fsize bigint, fsha text default null) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); g bigint := public._pres_my_group(e); nm text; me text; allowed text[]; nid bigint; ext text;
begin
  if g is null then raise exception 'You are not in a team for this presentation'; end if;
  if public._pres_path_eg(pth, 1) is distinct from e or public._pres_path_eg(pth, 2) is distinct from g then raise exception 'Invalid file path'; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'team-files' and o.name = pth and (o.owner is null or o.owner = u)) then
    raise exception 'File upload not found'; end if;
  if fsize is null or fsize <= 0 or fsize > 26214400 then raise exception 'Files must be under 25 MB'; end if;
  select allowed_mime_types into allowed from storage.buckets where id = 'team-files';
  if fmime is null or not (fmime = any (allowed)) then raise exception 'This file type is not allowed'; end if;
  ext := lower(substring(pth from '\.([a-z0-9]{1,8})$'));
  if ext not in ('pdf','pptx','ppt','odp','key','docx','doc','xlsx','xls','odt','txt','png','jpg','jpeg','webp','gif','mp4','mov','mp3','m4a','zip') then
    raise exception 'This file type is not allowed'; end if;
  nm := left(regexp_replace(trim(coalesce(fname, '')), '[[:cntrl:]/\\]+', '_', 'g'), 120);
  if nm = '' then nm := 'file.' || ext; end if;
  if fsha is not null and fsha !~ '^[0-9a-f]{64}$' then fsha := null; end if;
  select name into me from public.profiles where id = u;
  insert into public.pres_files (event_id, group_id, path, name, mime, size, sha256, uploader, uploader_name)
  values (e, g, pth, nm, fmime, fsize, fsha, u, me) returning id into nid;
  return nid;
end $$;

create or replace function public.pres_hide_file(fid bigint, reason text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); f public.pres_files; staff boolean;
begin
  select * into f from public.pres_files where id = fid for update;
  if not found then raise exception 'File not found'; end if;
  staff := public._pres_staff(public._pres_ev_tag(f.event_id));
  if not (staff or (f.uploader = u and public._pres_member(f.event_id, f.group_id))) then raise exception 'Only the uploader or staff can hide this file'; end if;
  if f.hidden_at is not null then return; end if;
  if exists (select 1 from public.pres_submissions where file_id = fid) then raise exception 'A submitted file cannot be hidden.'; end if;
  perform public._pres_reason(reason);
  update public.pres_files set hidden_at = now(), hidden_by = u, hidden_reason = left(reason, 300) where id = fid;
end $$;

create or replace function public.pres_unhide_file(fid bigint) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); f public.pres_files;
begin
  select * into f from public.pres_files where id = fid for update;
  if not found then raise exception 'File not found'; end if;
  if not (public._pres_staff(public._pres_ev_tag(f.event_id)) or (f.uploader = u and public._pres_member(f.event_id, f.group_id))) then
    raise exception 'Only the uploader or staff can restore this file'; end if;
  update public.pres_files set hidden_at = null, hidden_by = null, hidden_reason = null where id = fid and hidden_at is not null;
end $$;

create or replace function public.pres_submit_final(fid bigint, expected_active bigint default null) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); f public.pres_files; t public.pres_event_teams; act public.pres_submissions; v int; nid bigint; ev public.pres_events;
begin
  select * into f from public.pres_files where id = fid;
  if not found or f.hidden_at is not null then raise exception 'File not found'; end if;
  if not public._pres_member(f.event_id, f.group_id) then raise exception 'Only members of this team can submit its final version'; end if;
  t := public._pres_team_lock(f.event_id, f.group_id);
  select * into act from public.pres_submissions where event_id = f.event_id and group_id = f.group_id and state in ('submitted','approved') for update;
  if act.id is distinct from expected_active then raise exception 'The final version changed meanwhile. Reload and try again.'; end if;
  if act.state = 'approved' then raise exception 'An approved final already exists. Only staff can return it for corrections.'; end if;
  if act.id is not null then update public.pres_submissions set state = 'superseded' where id = act.id; end if;
  select coalesce(max(version), 0) + 1 into v from public.pres_submissions where event_id = f.event_id and group_id = f.group_id;
  insert into public.pres_submissions (event_id, group_id, file_id, version, submitted_by) values (f.event_id, f.group_id, fid, v, u) returning id into nid;
  update public.pres_event_teams set final_state = 'submitted' where event_id = f.event_id and group_id = f.group_id;
  select * into ev from public.pres_events where id = f.event_id;
  perform public._notify(public._pres_staff_ids(ev.class_tag), 'pres.final_submitted',
    jsonb_build_object('title', ev.title, 'team', t.group_name, 'v', v, 'file', f.name), public._pres_tgt(f.event_id, f.group_id, 'files', nid), 'fsub:' || nid);
  return nid;
end $$;

create or replace function public.pres_review_final(sid bigint, decision text, msg text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); s public.pres_submissions; ev public.pres_events;
begin
  select * into s from public.pres_submissions where id = sid for update;
  if not found then raise exception 'Submission not found'; end if;
  select * into ev from public.pres_events where id = s.event_id;
  if not public._pres_staff(ev.class_tag) then raise exception 'You do not have permission for this action'; end if;
  perform public._pres_team_lock(s.event_id, s.group_id);
  if decision = 'approve' then
    if s.state <> 'submitted' then raise exception 'Only a pending submission can be approved (%).', s.state; end if;
    update public.pres_submissions set state = 'approved', reviewed_by = u, reviewed_at = now(), note = left(msg, 1000) where id = sid;
    update public.pres_event_teams set final_state = 'approved' where event_id = s.event_id and group_id = s.group_id;
    perform public._notify(public._pres_team_ids(s.event_id, s.group_id), 'pres.final_approved', jsonb_build_object('title', ev.title, 'v', s.version),
      public._pres_tgt(s.event_id, s.group_id, 'files', sid), 'fapp:' || sid);
  elsif decision = 'return' then
    if s.state not in ('submitted','approved') then raise exception 'This submission cannot be returned (%).', s.state; end if;
    perform public._pres_reason(public._pres_need_reason(msg));
    update public.pres_submissions set state = 'returned', reviewed_by = u, reviewed_at = now(), note = left(trim(msg), 1000) where id = sid;
    update public.pres_event_teams set final_state = 'returned' where event_id = s.event_id and group_id = s.group_id;
    perform public._notify(public._pres_team_ids(s.event_id, s.group_id), 'pres.final_returned', jsonb_build_object('title', ev.title, 'v', s.version, 'note', left(trim(msg), 300)),
      public._pres_tgt(s.event_id, s.group_id, 'files', sid), 'fret:' || sid || ':' || extract(epoch from now())::bigint);
  else raise exception 'Unknown decision'; end if;
end $$;

-- ================= tasks =================
create or replace function public.pres_task_save(tid bigint, e bigint, g bigint, ttl text, who uuid, due_at timestamptz) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); staff boolean := public._pres_staff(public._pres_ev_tag(e)); tk public.pres_tasks; nid bigint; ev public.pres_events;
begin
  if ttl is null or char_length(trim(ttl)) not between 1 and 140 then raise exception 'Task title must be 1 to 140 characters'; end if;
  if not (staff or public._pres_member(e, g)) then raise exception 'Only members of this team can manage its tasks'; end if;
  if who is not null and not exists (select 1 from public.pres_roster where event_id = e and group_id = g and user_id = who and left_at is null) then
    raise exception 'The task can only be assigned to a member of this team'; end if;
  select * into ev from public.pres_events where id = e;
  if tid is null then
    insert into public.pres_tasks (event_id, group_id, title, assignee, due, created_by) values (e, g, trim(ttl), who, due_at, u) returning id into nid;
  else
    select * into tk from public.pres_tasks where id = tid and event_id = e and group_id = g for update;
    if not found then raise exception 'Task not found'; end if;
    if not (staff or tk.created_by = u or tk.assignee = u) then raise exception 'Only the creator, the assignee or staff can edit this task'; end if;
    update public.pres_tasks set title = trim(ttl), assignee = who, due = due_at, updated_at = now() where id = tid;
    nid := tid;
  end if;
  if who is not null and who <> u and (tid is null or tk.assignee is distinct from who) then
    perform public._notify(array[who], 'pres.task_assigned', jsonb_build_object('title', ev.title, 'task', trim(ttl)), public._pres_tgt(e, g, 'tasks', nid), 'task:' || nid || ':' || who);
  end if;
  return nid;
end $$;

create or replace function public.pres_task_status(tid bigint, st text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); tk public.pres_tasks; ev public.pres_events; staff boolean;
begin
  if st not in ('todo','doing','done','cancelled') then raise exception 'Unknown task status'; end if;
  select * into tk from public.pres_tasks where id = tid for update;
  if not found then raise exception 'Task not found'; end if;
  select * into ev from public.pres_events where id = tk.event_id;
  staff := public._pres_staff(ev.class_tag);
  if not staff then
    if ev.status = 'done' then raise exception 'This presentation is finished'; end if;
    if not (public._pres_member(tk.event_id, tk.group_id) or (ev.status = 'live' and public._pres_participant(tk.event_id, tk.group_id))) then
      raise exception 'Only members of this team can update its tasks'; end if;
    if st = 'cancelled' and tk.created_by <> u then raise exception 'Only the creator can cancel a task'; end if;
    if tk.assignee is not null and tk.assignee <> u and tk.created_by <> u then raise exception 'Only the assignee or the creator can update this task'; end if;
  end if;
  update public.pres_tasks set status = st, updated_at = now(), done_at = case when st = 'done' then now() end where id = tid;
end $$;

-- ================= announcements =================
create or replace function public.pres_announce(e bigint, txt text) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e); nid bigint;
begin
  if txt is null or char_length(trim(txt)) not between 1 and 2000 then raise exception 'Announcement must be 1 to 2000 characters'; end if;
  insert into public.pres_announcements (event_id, body, author) values (e, trim(txt), auth.uid()) returning id into nid;
  if ev.status <> 'draft' then
    perform public._notify(public._pres_event_ids(e), 'pres.announce', jsonb_build_object('title', ev.title, 'text', left(trim(txt), 140)),
      public._pres_tgt(e, null, 'overview', nid), 'ann:' || nid);
  end if;
  return nid;
end $$;

create or replace function public.pres_announce_edit(aid bigint, txt text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare a public.pres_announcements;
begin
  select * into a from public.pres_announcements where id = aid for update;
  if not found then raise exception 'Announcement not found'; end if;
  perform public._pres_event_for_staff(a.event_id);
  if txt is null or char_length(trim(txt)) not between 1 and 2000 then raise exception 'Announcement must be 1 to 2000 characters'; end if;
  update public.pres_announcements set body = trim(txt), edited_at = now() where id = aid;
end $$;

-- ================= synchronized live timer =================
create or replace function public._pres_live_lock(e bigint, ver int) returns public.pres_live
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live;
begin
  perform public._pres_event_for_staff(e);
  select * into l from public.pres_live where event_id = e for update;
  if not found then raise exception 'Presentation not found'; end if;
  if ver is distinct from l.version then raise exception 'The live state changed meanwhile. Refresh and try again.'; end if;
  return l;
end $$;

create or replace function public._pres_live_notify(e bigint, idx int) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare res bigint[]; ev public.pres_events;
begin
  select result into res from public.pres_draws where event_id = e and superseded_at is null;
  select * into ev from public.pres_events where id = e;
  if res is null then return; end if;
  if idx + 1 <= cardinality(res) then
    perform public._notify(public._pres_team_ids(e, res[idx + 1]), 'pres.live_now', jsonb_build_object('title', ev.title), public._pres_tgt(e, res[idx + 1], 'live'), 'now:' || e || ':' || res[idx + 1]);
  end if;
  if idx + 2 <= cardinality(res) then
    perform public._notify(public._pres_team_ids(e, res[idx + 2]), 'pres.next_up', jsonb_build_object('title', ev.title), public._pres_tgt(e, res[idx + 2], 'live'), 'next:' || e || ':' || res[idx + 2]);
  end if;
end $$;

create or replace function public.live_start(e bigint, ver int) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live := public._pres_live_lock(e, ver); ev public.pres_events;
begin
  select * into ev from public.pres_events where id = e for update;
  if ev.status <> 'drawn' then raise exception 'Run the draw before starting the live session'; end if;
  perform public._pres_freeze(e);
  update public.pres_events set status = 'live', updated_at = now() where id = e;
  update public.pres_live set state = 'running', slot_index = 0, slot_started_at = clock_timestamp(), paused_at = null, elapsed_ms = 0,
         duration_s = ev.slot_minutes * 60, version = version + 1, updated_by = auth.uid(), updated_at = now() where event_id = e;
  perform public._pres_live_notify(e, 0);
  return l.version + 1;
end $$;

create or replace function public.live_pause(e bigint, ver int) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live := public._pres_live_lock(e, ver);
begin
  if l.state <> 'running' then raise exception 'The timer is not running'; end if;
  update public.pres_live set state = 'paused', paused_at = clock_timestamp(),
         elapsed_ms = elapsed_ms + (extract(epoch from clock_timestamp() - slot_started_at) * 1000)::bigint, slot_started_at = null,
         version = version + 1, updated_by = auth.uid(), updated_at = now() where event_id = e;
  return l.version + 1;
end $$;

create or replace function public.live_resume(e bigint, ver int) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live := public._pres_live_lock(e, ver);
begin
  if l.state <> 'paused' then raise exception 'The timer is not paused'; end if;
  update public.pres_live set state = 'running', paused_at = null, slot_started_at = clock_timestamp(),
         version = version + 1, updated_by = auth.uid(), updated_at = now() where event_id = e;
  return l.version + 1;
end $$;

create or replace function public._pres_live_goto(e bigint, ver int, idx int) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live := public._pres_live_lock(e, ver); n int; ev public.pres_events;
begin
  if l.state not in ('running','paused') then raise exception 'The live session is not running'; end if;
  select cardinality(result) into n from public.pres_draws where event_id = e and superseded_at is null;
  if idx < 0 or idx >= n then raise exception 'No team at that position'; end if;
  select * into ev from public.pres_events where id = e;
  update public.pres_live set state = 'running', slot_index = idx, slot_started_at = clock_timestamp(), paused_at = null, elapsed_ms = 0,
         duration_s = ev.slot_minutes * 60, version = version + 1, updated_by = auth.uid(), updated_at = now() where event_id = e;
  perform public._pres_live_notify(e, idx);
  return l.version + 1;
end $$;

create or replace function public.live_next(e bigint, ver int) returns int
 language sql security definer set search_path = pg_catalog, public as $$
  select public._pres_live_goto(e, ver, (select slot_index + 1 from public.pres_live where event_id = e)) $$;
create or replace function public.live_prev(e bigint, ver int) returns int
 language sql security definer set search_path = pg_catalog, public as $$
  select public._pres_live_goto(e, ver, (select slot_index - 1 from public.pres_live where event_id = e)) $$;

create or replace function public.live_adjust(e bigint, ver int, delta_s int, reason text) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live := public._pres_live_lock(e, ver);
begin
  if l.state not in ('running','paused') then raise exception 'The live session is not running'; end if;
  if delta_s is null or delta_s = 0 or abs(delta_s) > 1800 then raise exception 'Adjust by up to 30 minutes'; end if;
  perform public._pres_reason(public._pres_need_reason(reason));
  update public.pres_live set duration_s = least(greatest(duration_s + delta_s, 0), 7200), version = version + 1,
         updated_by = auth.uid(), updated_at = now() where event_id = e;
  return l.version + 1;
end $$;

create or replace function public.live_end(e bigint, ver int) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare l public.pres_live := public._pres_live_lock(e, ver);
begin
  if l.state not in ('running','paused') then raise exception 'The live session is not running'; end if;
  update public.pres_live set state = 'ended', version = version + 1, updated_by = auth.uid(), updated_at = now() where event_id = e;
  update public.pres_events set status = 'done', updated_at = now() where id = e;
  return l.version + 1;
end $$;

-- ================= rubric & scores =================
create or replace function public._pres_rubric_valid(c jsonb) returns boolean
 language plpgsql immutable set search_path = pg_catalog as $$
declare x jsonb; keys text[] := '{}';
begin
  if jsonb_typeof(c) <> 'array' or jsonb_array_length(c) not between 1 and 10 then return false; end if;
  for x in select * from jsonb_array_elements(c) loop
    if jsonb_typeof(x) <> 'object' or coalesce(x->>'key', '') !~ '^[a-z0-9_]{1,20}$' or (x->>'key') = any (keys)
       or char_length(coalesce(x->>'label', '')) not between 1 and 60
       or jsonb_typeof(x->'max') <> 'number' or (x->>'max')::numeric <> floor((x->>'max')::numeric) or (x->>'max')::int not between 1 and 100
       or jsonb_typeof(coalesce(x->'weight', '1'::jsonb)) <> 'number' or coalesce((x->>'weight')::numeric, 1) not between 0.1 and 100 then
      return false;
    end if;
    keys := keys || (x->>'key');
  end loop;
  return true;
end $$;

create or replace function public.pres_rubric_save(e bigint, crit jsonb) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true); v int; nid bigint;
begin
  if not public._pres_rubric_valid(crit) then raise exception 'Invalid rubric: 1-10 criteria, each with key, label, max 1-100 and weight 0.1-100'; end if;
  select coalesce(max(version), 0) + 1 into v from public.pres_rubrics where event_id = e;
  insert into public.pres_rubrics (event_id, version, criteria, created_by) values (e, v, crit, auth.uid()) returning id into nid;
  return nid;
end $$;

create or replace function public.pres_score(e bigint, g bigint, sc jsonb, cmt text default '') returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e); rb public.pres_rubrics; x jsonb; s numeric; tot numeric := 0; wsum numeric := 0;
  cur public.pres_scores; nid bigint; nm text;
begin
  if ev.status not in ('live','done') then raise exception 'Scores can be given once the presentation is live'; end if;
  if not exists (select 1 from public.pres_event_teams where event_id = e and group_id = g and removed_at is null) then raise exception 'This team is not part of the presentation'; end if;
  select * into rb from public.pres_rubrics where event_id = e order by version desc limit 1;
  if not found then raise exception 'Create a rubric first'; end if;
  if jsonb_typeof(sc) <> 'object' then raise exception 'Invalid scores'; end if;
  if (select count(*) from jsonb_object_keys(sc)) <> jsonb_array_length(rb.criteria) then raise exception 'Give a score for every criterion (and nothing else)'; end if;
  for x in select * from jsonb_array_elements(rb.criteria) loop
    if not (sc ? (x->>'key')) or jsonb_typeof(sc->(x->>'key')) <> 'number' then raise exception 'Missing score for %', x->>'label'; end if;
    s := (sc->>(x->>'key'))::numeric;
    if s <> floor(s) or s < 0 or s > (x->>'max')::int then raise exception 'Score for % must be a whole number from 0 to %', x->>'label', x->>'max'; end if;
    tot := tot + s / (x->>'max')::numeric * coalesce((x->>'weight')::numeric, 1);
    wsum := wsum + coalesce((x->>'weight')::numeric, 1);
  end loop;
  if char_length(coalesce(cmt, '')) > 2000 then raise exception 'Comment is too long (max 2000)'; end if;
  select * into cur from public.pres_scores where event_id = e and group_id = g and reviewer = auth.uid() and superseded_at is null for update;
  if found then update public.pres_scores set superseded_at = now() where id = cur.id; end if;
  select name into nm from public.profiles where id = auth.uid();
  insert into public.pres_scores (event_id, group_id, rubric_id, reviewer, reviewer_name, scores, total, comment, supersedes_id)
  values (e, g, rb.id, auth.uid(), nm, sc, round(tot / wsum * 100, 2), coalesce(trim(cmt), ''), cur.id) returning id into nid;
  return nid;
end $$;

create or replace function public.pres_publish_scores(e bigint, pub boolean) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true);
begin
  if pub then
    if ev.status not in ('live','done') then raise exception 'Scores can be published once the presentation is live'; end if;
    update public.pres_events set scores_published_at = now(), updated_at = now() where id = e;
    perform public._notify(public._pres_event_ids(e), 'pres.scores', jsonb_build_object('title', ev.title), public._pres_tgt(e, null, 'scores'), 'scores:' || e || ':' || extract(epoch from now())::bigint);
  else
    update public.pres_events set scores_published_at = null, updated_at = now() where id = e;
  end if;
end $$;

-- late addition of a participant after freeze (staff, audited)
create or replace function public.pres_roster_add(e bigint, g bigint, who uuid, reason text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare ev public.pres_events := public._pres_event_for_staff(e, true); nm text;
begin
  if ev.frozen_at is null then raise exception 'Before the presentation is live the roster follows team membership'; end if;
  perform public._pres_reason(public._pres_need_reason(reason));
  if not exists (select 1 from public.pres_event_teams where event_id = e and group_id = g and removed_at is null) then raise exception 'This team is not part of the presentation'; end if;
  select name into nm from public.profiles where id = who and role = 'student' and class_tag = ev.class_tag;
  if not found then raise exception 'That student is not in this class group'; end if;
  if exists (select 1 from public.pres_roster where event_id = e and user_id = who and left_at is null) then raise exception 'That student already takes part in this presentation'; end if;
  insert into public.pres_roster (event_id, group_id, user_id, user_name, participant, frozen_at, left_reason)
  values (e, g, who, nm, true, now(), null);
end $$;

-- "My presentations": own participation history (also for former members)
create or replace function public.pres_my_history() returns table (event_id bigint, title text, status text, group_id bigint, group_name text,
  joined_at timestamptz, left_at timestamptz, participant boolean, uploads int)
 language sql stable security definer set search_path = pg_catalog, public as $$
  select r.event_id, ev.title, ev.status, r.group_id, t.group_name, r.joined_at, r.left_at, r.participant,
         (select count(*)::int from public.pres_files f where f.event_id = r.event_id and f.uploader = r.user_id)
    from public.pres_roster r join public.pres_events ev on ev.id = r.event_id
    left join public.pres_event_teams t on t.event_id = r.event_id and t.group_id = r.group_id
   where r.user_id = public._me_ok() order by r.event_id desc, r.joined_at $$;

-- ================= membership sync (class D) =================
create or replace function public._tg_pres_membership() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare r record; t public.pres_event_teams; host uuid; ev public.pres_events;
begin
  if old.group_id is not distinct from new.group_id then return null; end if;
  -- leaving old team
  if old.group_id is not null then
    for r in select ro.*, e.frozen_at as ev_frozen, e.status as ev_status, e.class_tag, e.title from public.pres_roster ro join public.pres_events e on e.id = ro.event_id
              where ro.user_id = new.id and ro.group_id = old.group_id and ro.left_at is null loop
      if r.ev_frozen is not null then
        update public.pres_roster set left_group_at = coalesce(left_group_at, now()) where id = r.id;   -- history kept, access kept
        continue;
      end if;
      update public.pres_roster set left_at = now(), left_reason = case when new.group_id is null then 'left_team' else 'moved_team' end where id = r.id;
      select * into t from public.pres_event_teams where event_id = r.event_id and group_id = r.group_id for update;
      if t.speak_state in ('approved','needs_review') then
        update public.pres_speakers set withdrawn = true where event_id = r.event_id and group_id = r.group_id and user_id = new.id;
        update public.pres_event_teams set speak_state = 'needs_review' where event_id = r.event_id and group_id = r.group_id;
        select host_id into host from public.groups where id = r.group_id;
        perform public._notify(array_append(public._pres_staff_ids(r.class_tag), host), 'pres.order_review',
          jsonb_build_object('title', r.title, 'team', t.group_name, 'who', new.name), public._pres_tgt(r.event_id, r.group_id, 'order'),
          'orev:' || r.event_id || ':' || r.group_id || ':' || new.id || ':' || extract(epoch from now())::bigint);
      else
        delete from public.pres_speakers where event_id = r.event_id and group_id = r.group_id and user_id = new.id;
        if t.speak_state = 'submitted' then
          update public.pres_event_teams set speak_state = 'open' where event_id = r.event_id and group_id = r.group_id;
          perform public._notify(public._pres_team_ids(r.event_id, r.group_id), 'pres.order_reopened',
            jsonb_build_object('title', r.title, 'who', new.name), public._pres_tgt(r.event_id, r.group_id, 'order'),
            'oreo:' || r.event_id || ':' || r.group_id || ':' || new.id || ':' || extract(epoch from now())::bigint);
        end if;
      end if;
      insert into public.pres_speaker_log (event_id, group_id, user_id, actor, action, note)
      values (r.event_id, r.group_id, new.id, auth.uid(), 'member_left', t.speak_state);
      update public.pres_tasks set assignee = null, updated_at = now()
       where event_id = r.event_id and group_id = r.group_id and assignee = new.id and status in ('todo','doing');
    end loop;
  end if;
  -- joining new team
  if new.group_id is not null then
    for t in select et.* from public.pres_event_teams et join public.pres_events e on e.id = et.event_id
              where et.group_id = new.group_id and et.removed_at is null and e.frozen_at is null and e.status in ('draft','open','drawn')
              for update of et loop
      if exists (select 1 from public.pres_roster where event_id = t.event_id and user_id = new.id and left_at is null) then continue; end if;
      insert into public.pres_roster (event_id, group_id, user_id, user_name) values (t.event_id, t.group_id, new.id, new.name);
      if t.speak_state in ('submitted','approved') then
        update public.pres_event_teams set speak_state = case when t.speak_state = 'approved' then 'needs_review' else 'open' end
         where event_id = t.event_id and group_id = t.group_id;
      end if;
      insert into public.pres_speaker_log (event_id, group_id, user_id, actor, action, note)
      values (t.event_id, t.group_id, new.id, auth.uid(), 'member_joined', t.speak_state);
    end loop;
  end if;
  return null;
end $$;
create trigger tg_pres_membership after update of group_id on public.profiles for each row execute function public._tg_pres_membership();

-- a deleted group leaves the open events it took part in (frozen events keep it as history)
create or replace function public._tg_pres_group_deleted() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  update public.pres_event_teams et set removed_at = now(), remove_reason = 'group_deleted'
    from public.pres_events e where e.id = et.event_id and et.group_id = old.id and et.removed_at is null and e.frozen_at is null;
  update public.pres_draws d set superseded_at = now(), superseded_reason = 'team deleted'
    from public.pres_events e where e.id = d.event_id and e.frozen_at is null and d.superseded_at is null and old.id = any (d.participants);
  update public.pres_events set status = 'open' where status = 'drawn'
     and not exists (select 1 from public.pres_draws d where d.event_id = pres_events.id and d.superseded_at is null);
  return null;
end $$;
create trigger tg_pres_group_deleted after delete on public.groups for each row execute function public._tg_pres_group_deleted();

-- ================= grants =================
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace
     and (p.proname like 'pres\_%' or p.proname like 'live\_%' or p.proname like '\_pres\_%' or p.proname like '\_tg\_pres\_%')
     and p.proname not in ('_pres_ev_tag','_pres_staff','_pres_class','_pres_member','_pres_participant','_pres_read','_pres_path_eg')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname like 'pres\_%' or f.proname like 'live\_%' then execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop;
end $$;
