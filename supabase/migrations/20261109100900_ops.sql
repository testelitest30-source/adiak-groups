-- ADIAK 1.0 / M10 operations read models for the Control Center. Read-only. Never returns secrets
-- (no push tokens, no push_config, no vault values, no passwords). Admin-level: overview, delivery, audit.
-- Owner-only: diagnostics (jobs, storage, errors, migrations, incomplete accounts).
do $$ begin
  if to_regprocedure('public._is_owner()') is null then raise exception 'pre-flight: roles migration must be applied first'; end if;
end $$;

create or replace function public._req_admin_ops() returns void
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin perform public._me_ok(); if not public._is_admin() then raise exception 'Admins only'; end if; end $$;
create or replace function public._req_owner() returns void
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin perform public._me_ok(); if not public._is_owner() then raise exception 'Only the owner can do this'; end if; end $$;

create or replace function public.ops_overview() returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_admin_ops();
  return jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student' and not is_admin and not ('admin' = any (perms))),
    'teachers', (select count(*) from public.profiles where role = 'teacher'),
    'leaders', (select count(*) from public.class_staff where role = 'starosta'),
    'admins', (select count(*) from public.profiles where is_admin or 'admin' = any (perms)),
    'classes', (select count(*) from public.classes), 'teams', (select count(*) from public.groups),
    'active_15m', (select count(*) from public.sessions where updated_at > now() - interval '15 minutes'),
    'events_upcoming', (select count(*) from public.pres_events where status in ('open','drawn')),
    'live_now', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title, 'tag', class_tag)), '[]') from public.pres_events where status = 'live'),
    'assignments_open', (select count(*) from public.assignments where status = 'published'),
    'notifications_24h', (select count(*) from public.notifications where created_at > now() - interval '24 hours'),
    'push_failed_24h', (select count(*) from public.push_outbox where status in ('dead','invalid') and updated_at > now() - interval '24 hours'),
    'incomplete_accounts', (select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)),
    'owner', (select jsonb_build_object('name', p.name, 'since', o.since) from public.platform_owner o join public.profiles p on p.id = o.user_id),
    'flags', (select coalesce(jsonb_object_agg(key, value), '{}') from public.app_settings));
end $$;

create or replace function public.ops_push_stats() returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_admin_ops();
  return jsonb_build_object(
    'outbox', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from public.push_outbox group by status) x),
    'devices_active', (select count(*) from public.push_devices where disabled_at is null),
    'devices_disabled', (select count(*) from public.push_devices where disabled_at is not null),
    'invalid_tokens_7d', (select count(*) from public.push_devices where disabled_reason like 'invalid:%' and disabled_at > now() - interval '7 days'),
    'last_ok', (select max(updated_at) from public.push_outbox where status = 'sent'),
    'oldest_due', (select min(next_attempt_at) from public.push_outbox where status in ('queued','retry')),
    'recent_errors', (select coalesce(jsonb_agg(jsonb_build_object('at', updated_at, 'status', status, 'http', last_http, 'error', last_error, 'attempts', attempts) order by updated_at desc), '[]')
                       from (select * from public.push_outbox where last_error is not null order by updated_at desc limit 20) e));
end $$;

create or replace function public.ops_audit(src text default 'all', before_id bigint default null, lim int default 50) returns table (
  source text, id bigint, at timestamptz, actor text, action text, entity text, target text, reason text, before jsonb, after jsonb)
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_admin_ops();
  return query select * from (
    select 'platform'::text, a.id, a.at, coalesce(p.name, 'system'), a.action, 'platform'::text, a.target, a.reason, a.before, a.after
      from public.platform_audit a left join public.profiles p on p.id = a.actor where src in ('all','platform') and (before_id is null or a.id < before_id)
    union all
    select 'presentations', a.id, a.at, coalesce(p.name, a.actor_role), a.action, a.entity, coalesce(a.event_id::text, '') || '/' || coalesce(a.group_id::text, ''), a.reason, a.before, a.after
      from public.pres_audit a left join public.profiles p on p.id = a.actor where src in ('all','presentations') and (before_id is null or a.id < before_id)) x
  order by 3 desc limit least(greatest(coalesce(lim, 50), 1), 200);
end $$;

-- ---------- owner-only diagnostics ----------
create or replace function public.ops_jobs() returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare j jsonb := '[]'; r jsonb := '[]';
begin
  perform public._req_owner();
  if to_regclass('cron.job') is null then return jsonb_build_object('installed', false); end if;
  execute 'select coalesce(jsonb_agg(jsonb_build_object(''name'', jobname, ''schedule'', schedule, ''active'', active) order by jobname), ''[]'') from cron.job' into j;
  if to_regclass('cron.job_run_details') is not null then
    execute 'select coalesce(jsonb_agg(x order by (x->>''start'') desc), ''[]'') from (select jsonb_build_object(''job'', j.jobname, ''status'', d.status, ''start'', d.start_time,
      ''end'', d.end_time, ''message'', left(d.return_message, 200)) x from cron.job_run_details d join cron.job j on j.jobid = d.jobid order by d.start_time desc limit 30) z' into r;
  end if;
  return jsonb_build_object('installed', true, 'jobs', j, 'runs', r);
end $$;

create or replace function public.ops_storage() returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_owner();
  return (select coalesce(jsonb_agg(jsonb_build_object('bucket', b.id, 'public', b.public, 'limit', b.file_size_limit,
     'objects', (select count(*) from storage.objects o where o.bucket_id = b.id),
     'bytes', (select coalesce(sum((o.metadata->>'size')::bigint), 0) from storage.objects o where o.bucket_id = b.id)) order by b.id), '[]') from storage.buckets b);
end $$;

create or replace function public.ops_errors(lim int default 50) returns table (id bigint, at timestamptz, kind text, users int, err text)
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_owner();
  return query select e.id, e.at, e.kind, cardinality(e.users), e.err from public.notify_errors e order by e.id desc limit least(greatest(coalesce(lim, 50), 1), 200);
end $$;

create or replace function public.ops_migrations() returns table (version text, name text)
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_owner();
  return query select m.version, m.name from supabase_migrations.schema_migrations m order by m.version;
end $$;

-- auth accounts without a profile: shown so they can be handled deliberately (never deleted automatically)
create or replace function public.ops_incomplete_accounts() returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz, internal boolean)
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._req_owner();
  return query select u.id, u.email::text, u.created_at, u.last_sign_in_at, coalesce(u.email like '%@classroom.app', false)
    from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id) order by u.created_at;
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in
    ('_req_admin_ops','_req_owner','ops_overview','ops_push_stats','ops_audit','ops_jobs','ops_storage','ops_errors','ops_migrations','ops_incomplete_accounts')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname like 'ops\_%' then execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop; end $$;
