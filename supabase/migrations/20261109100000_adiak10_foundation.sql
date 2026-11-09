-- ADIAK 1.0 / M1 foundation: hardened defaults, persistent notifications, FCM devices + delivery outbox.
-- Additive only. Existing tables, functions and the web-push pipeline (push_subs/push_targets/_tg_push) are untouched.
-- Function classes (see docs): A = user RPC (authenticated), B = policy helper, C = service-only (INVOKER, service_role),
-- D = trigger function (no EXECUTE grants).

-- ---------- pre-flight ----------
do $$ begin
  if not exists (select 1 from supabase_migrations.schema_migrations where version = '20261031205544') then
    raise exception 'pre-flight: expected base migration 20261031205544 is missing';
  end if;
  if to_regclass('public.notifications') is not null then
    raise exception 'pre-flight: notifications already exists (migration applied twice?)';
  end if;
end $$;

-- ---------- default privileges: new objects get NO implicit client grants ----------
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon;

-- ---------- small shared helpers ----------
create or replace function public._me_ok() returns uuid    -- class A guard: signed in AND has a profile
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare u uuid := auth.uid();
begin
  if u is null or not exists (select 1 from public.profiles where id = u) then raise exception 'Not signed in'; end if;
  return u;
end $$;

create or replace function public._svc_only() returns void  -- class C guard
 language plpgsql stable set search_path = pg_catalog, public as $$
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then raise exception 'service only'; end if;
end $$;

-- private configuration (no client grants at all)
create table public.sys_config (key text primary key, value text not null);
alter table public.sys_config enable row level security;
revoke all on public.sys_config from public, anon, authenticated;
insert into public.sys_config values ('functions_url', 'https://epenklutnevjvgpsjehp.supabase.co/functions/v1')
  on conflict do nothing;

-- ---------- persistent notifications ----------
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  kind text not null check (kind ~ '^[a-z][a-z0-9_.]{1,40}$'),
  params jsonb not null default '{}'::jsonb,
  target jsonb not null default '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  superseded_at timestamptz
);
create unique index notifications_dedupe on public.notifications (user_id, dedupe_key) where dedupe_key is not null;
create index notifications_user on public.notifications (user_id, id desc);
alter table public.notifications enable row level security;
create policy notes_r on public.notifications for select to authenticated using (user_id = auth.uid());
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
alter publication supabase_realtime add table public.notifications;

create table public.notify_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text, users uuid[], err text
);
alter table public.notify_errors enable row level security;
revoke all on public.notify_errors from public, anon, authenticated;

-- push text templates (client renders its own i18n; push-fcm uses these). {name} placeholders come from params.
create table public.notify_kinds (
  kind text not null, lang text not null check (lang in ('az','en')),
  title text not null, body text not null default '',
  primary key (kind, lang)
);
alter table public.notify_kinds enable row level security;
revoke all on public.notify_kinds from public, anon, authenticated;

-- _notify: never raises. A failure is logged to notify_errors and the caller's transaction continues.
create or replace function public._notify(users uuid[], k text, p jsonb, tgt jsonb, dedupe text default null) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare n int := 0;
begin
  begin
    insert into public.notifications (user_id, kind, params, target, dedupe_key)
      select distinct u, k, coalesce(p, '{}'), coalesce(tgt, '{}'), dedupe
      from unnest(users) u
      where u is not null and exists (select 1 from public.profiles pr where pr.id = u)
    on conflict (user_id, dedupe_key) where dedupe_key is not null do nothing;
    get diagnostics n = row_count;
  exception when others then
    begin insert into public.notify_errors (kind, users, err) values (k, users, left(sqlerrm, 500));
    exception when others then null; end;
    n := 0;
  end;
  return n;
end $$;

-- class A RPCs
create or replace function public.notes_list(before_id bigint default null, lim int default 50)
 returns setof public.notifications
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok();
begin
  return query select * from public.notifications n
   where n.user_id = u and n.superseded_at is null and (before_id is null or n.id < before_id)
   order by n.id desc limit least(greatest(coalesce(lim, 50), 1), 100);
end $$;

create or replace function public.notes_read(ids bigint[] default null) returns int
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); n int;
begin
  update public.notifications set read_at = now()
   where user_id = u and read_at is null and (ids is null or id = any (ids));
  get diagnostics n = row_count; return n;
end $$;

create or replace function public.notes_unread_count() returns int
 language sql stable security definer set search_path = pg_catalog, public as $$
  select count(*)::int from public.notifications where user_id = public._me_ok() and read_at is null and superseded_at is null
$$;

create or replace function public.server_now() returns timestamptz
 language sql stable security definer set search_path = pg_catalog, public as $$ select clock_timestamp() $$;

-- ---------- Android (FCM) devices ----------
create table public.push_devices (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique check (char_length(token) between 20 and 4096),
  platform text not null default 'android' check (platform in ('android')),
  lang text not null default 'az' check (lang in ('az','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_ok_at timestamptz,
  fail_count int not null default 0,
  disabled_at timestamptz,
  disabled_reason text
);
create index push_devices_user on public.push_devices (user_id) where disabled_at is null;
alter table public.push_devices enable row level security;
revoke all on public.push_devices from public, anon, authenticated;   -- clients never read tokens

create or replace function public.save_fcm(tok text, lng text default 'az') returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok();
begin
  if tok is null or char_length(tok) not between 20 and 4096 or tok !~ '^[A-Za-z0-9:_\-\.]+$' then raise exception 'Invalid device token'; end if;
  if (select count(*) from public.push_devices where user_id = u and disabled_at is null) >= 10 then
    update public.push_devices set disabled_at = now(), disabled_reason = 'replaced'
     where id = (select id from public.push_devices where user_id = u and disabled_at is null order by updated_at limit 1);
  end if;
  insert into public.push_devices (user_id, token, lang) values (u, tok, case when lng = 'en' then 'en' else 'az' end)
  on conflict (token) do update set user_id = u, lang = excluded.lang, updated_at = now(),
     fail_count = 0, disabled_at = null, disabled_reason = null;
end $$;

create or replace function public.drop_fcm(tok text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok();
begin
  update public.push_devices set disabled_at = now(), disabled_reason = 'logout'
   where token = tok and user_id = u and disabled_at is null;
end $$;

-- ---------- delivery outbox ----------
create table public.push_outbox (
  id bigint generated always as identity primary key,
  notification_id bigint references public.notifications (id) on delete cascade,
  message_id bigint,
  device_id bigint not null references public.push_devices (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued','sending','sent','retry','dead','invalid','cancelled')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  last_http int,
  last_error text,
  provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((notification_id is null) <> (message_id is null))
);
create unique index push_outbox_note on public.push_outbox (notification_id, device_id) where notification_id is not null;
create unique index push_outbox_msg on public.push_outbox (message_id, device_id) where message_id is not null;
create index push_outbox_due on public.push_outbox (next_attempt_at) where status in ('queued','retry','sending');
alter table public.push_outbox enable row level security;
revoke all on public.push_outbox from public, anon, authenticated;

-- class D: wakes the sender after commit (pg_net is asynchronous); never raises
create or replace function public._push_kick() returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare sec text; base text;
begin
  select secret into sec from public.push_config where id = 1;
  select value into base from public.sys_config where key = 'functions_url';
  if sec is null or base is null then return; end if;
  perform net.http_post(url := base || '/push-fcm',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', sec),
    body := jsonb_build_object('run', true));
exception when others then null;
end $$;

create or replace function public._tg_note_outbox() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  begin
    insert into public.push_outbox (notification_id, device_id)
      select new.id, d.id from public.push_devices d where d.user_id = new.user_id and d.disabled_at is null
    on conflict do nothing;
    if found then perform public._push_kick(); end if;
  exception when others then
    begin insert into public.notify_errors (kind, users, err) values ('outbox:' || new.kind, array[new.user_id], left(sqlerrm, 500));
    exception when others then null; end;
  end;
  return null;
end $$;
create trigger tg_note_outbox after insert on public.notifications for each row execute function public._tg_note_outbox();

-- chat messages → FCM devices of everyone who may read the channel (same rule as the existing web push)
create or replace function public._tg_msg_outbox() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.sender is null then return null; end if;
  begin
    insert into public.push_outbox (message_id, device_id)
      select new.id, d.id
        from public.profiles u join public.push_devices d on d.user_id = u.id and d.disabled_at is null
       where u.id <> new.sender and public._chan_ok(new.channel, u.id)
         and (new.channel <> 'all' or u.class_tag is not distinct from new.class_tag)
    on conflict do nothing;
    if found then perform public._push_kick(); end if;
  exception when others then
    begin insert into public.notify_errors (kind, users, err) values ('outbox:msg', array[new.sender], left(sqlerrm, 500));
    exception when others then null; end;
  end;
  return null;
end $$;
create trigger tg_msg_outbox after insert on public.messages for each row execute function public._tg_msg_outbox();

-- class C: claim a batch of due deliveries (lease prevents double sending; SKIP LOCKED for concurrent workers)
create or replace function public.push_claim(lim int default 100)
 returns table (outbox_id bigint, token text, lang text, kind text, params jsonb, target jsonb,
                msg_channel text, msg_sender text, msg_body text, collapse text)
 language plpgsql set search_path = pg_catalog, public as $$
begin
  perform public._svc_only();
  return query
  with due as (
    select o.id from public.push_outbox o
     where (o.status in ('queued','retry') and o.next_attempt_at <= now())
        or (o.status = 'sending' and o.lease_until < now())
     order by o.id limit least(greatest(coalesce(lim, 100), 1), 500)
     for update skip locked),
  upd as (
    update public.push_outbox o set status = 'sending', lease_until = now() + interval '60 seconds',
           attempts = o.attempts + 1, updated_at = now()
      from due where o.id = due.id returning o.*)
  select u.id, d.token, d.lang, n.kind, n.params, n.target,
         m.channel, coalesce(sp.name, ''),
         case when m.id is null then null when m.file_type = 'sticker' then '🎭' when m.file_path is not null
              then '📎 ' || coalesce(m.file_name, 'File') else left(m.body, 140) end,
         case when u.notification_id is not null then 'n' || u.notification_id else 'm' || u.message_id end
    from upd u
    join public.push_devices d on d.id = u.device_id
    left join public.notifications n on n.id = u.notification_id
    left join public.messages m on m.id = u.message_id and not m.deleted
    left join public.profiles sp on sp.id = m.sender;
end $$;

-- class C: record the outcome of one delivery attempt. outcome: ok | retry | invalid | fatal
create or replace function public.push_mark(oid bigint, outcome text, http int default null, err text default null, provider text default null)
 returns void language plpgsql set search_path = pg_catalog, public as $$
declare o public.push_outbox; backoff interval[] := array['1 minute','5 minutes','30 minutes','2 hours','6 hours']::interval[];
begin
  perform public._svc_only();
  select * into o from public.push_outbox where id = oid for update;
  if not found then return; end if;
  if outcome = 'ok' then
    update public.push_outbox set status = 'sent', lease_until = null, last_http = http, last_error = null,
           provider_id = left(provider, 200), updated_at = now() where id = oid;
    update public.push_devices set last_ok_at = now(), fail_count = 0 where id = o.device_id;
  elsif outcome = 'invalid' then
    update public.push_outbox set status = 'invalid', lease_until = null, last_http = http, last_error = left(err, 300), updated_at = now() where id = oid;
    update public.push_devices set disabled_at = now(), disabled_reason = 'invalid:' || left(coalesce(err, ''), 60) where id = o.device_id;
    update public.push_outbox set status = 'cancelled', updated_at = now()
     where device_id = o.device_id and status in ('queued','retry') and id <> oid;
  elsif outcome = 'retry' and o.attempts < 5 then
    update public.push_outbox set status = 'retry', lease_until = null, last_http = http, last_error = left(err, 300),
           next_attempt_at = now() + backoff[o.attempts], updated_at = now() where id = oid;
    update public.push_devices set fail_count = fail_count + 1 where id = o.device_id;
  else
    update public.push_outbox set status = 'dead', lease_until = null, last_http = http, last_error = left(err, 300), updated_at = now() where id = oid;
    update public.push_devices set fail_count = fail_count + 1 where id = o.device_id;
  end if;
end $$;

-- class C: housekeeping (run daily)
create or replace function public.push_purge() returns int
 language plpgsql set search_path = pg_catalog, public as $$
declare n int;
begin
  perform public._svc_only();
  delete from public.push_outbox where (status = 'sent' and updated_at < now() - interval '30 days')
     or (status in ('dead','invalid','cancelled') and updated_at < now() - interval '90 days');
  get diagnostics n = row_count; return n;
end $$;

-- class C: sweeper (run every minute): wakes the sender if anything is due or a lease expired
create or replace function public.push_sweep() returns int
 language plpgsql set search_path = pg_catalog, public as $$
declare n int;
begin
  perform public._svc_only();
  select count(*) into n from public.push_outbox
   where (status in ('queued','retry') and next_attempt_at <= now()) or (status = 'sending' and lease_until < now());
  if n > 0 then perform public._push_kick(); end if;
  return n;
end $$;

-- ---------- exact grants ----------
revoke all on function public._me_ok(), public._svc_only(), public._notify(uuid[], text, jsonb, jsonb, text),
  public.notes_list(bigint, int), public.notes_read(bigint[]), public.notes_unread_count(), public.server_now(),
  public.save_fcm(text, text), public.drop_fcm(text), public._push_kick(), public._tg_note_outbox(), public._tg_msg_outbox(),
  public.push_claim(int), public.push_mark(bigint, text, int, text, text), public.push_purge(), public.push_sweep()
  from public, anon, authenticated, service_role;
grant execute on function public.notes_list(bigint, int), public.notes_read(bigint[]), public.notes_unread_count(),
  public.server_now(), public.save_fcm(text, text), public.drop_fcm(text) to authenticated;
grant execute on function public.push_claim(int), public.push_mark(bigint, text, int, text, text),
  public.push_purge(), public.push_sweep(), public._svc_only() to service_role;
grant select, insert, update, delete on public.push_outbox, public.push_devices, public.notifications,
  public.notify_kinds, public.notify_errors, public.sys_config to service_role;
