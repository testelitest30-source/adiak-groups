-- ADIAK 1.0 / roles: single platform Owner, platform audit, feature flags, access summary, rate limiting.
-- Owner (owner decision 2026-11-09): Nurəli Qasımlı (login nureli.q@classroom.app). Other admins stay admins below the owner.
do $$ begin
  if to_regprocedure('public._me_ok()') is null then raise exception 'pre-flight: M1 foundation must be applied first'; end if;
  if to_regclass('public.platform_owner') is not null then raise exception 'pre-flight: roles already applied'; end if;
end $$;

-- ---------- owner ----------
create table public.platform_owner (
  id int primary key default 1 check (id = 1),
  user_id uuid not null unique references public.profiles (id) on delete restrict,   -- the owner account cannot be deleted
  since timestamptz not null default now()
);
alter table public.platform_owner enable row level security;
revoke all on public.platform_owner from public, anon, authenticated;

do $$ declare u uuid;
begin
  select id into u from public.profiles where login = 'nureli.q@classroom.app';
  if u is not null then
    insert into public.platform_owner (user_id) values (u);
    update public.profiles set perms = (select array_agg(distinct x) from unnest(perms || array['admin']) x) where id = u;
  elsif current_setting('adiak.local', true) is distinct from 'yes' then
    raise exception 'pre-flight: owner account nureli.q@classroom.app not found';
  end if;
end $$;

create or replace function public._is_owner() returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select auth.uid() is not null and exists (select 1 from public.platform_owner where user_id = auth.uid()) $$;

-- assigned teacher of a class (admins and the owner count as teachers of every class)
create or replace function public._is_teacher_of(tag text) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select auth.uid() is not null and (public._is_admin()
    or exists (select 1 from public.class_staff s where s.user_id = auth.uid() and s.class_tag = tag and s.role = 'teacher')) $$;

-- ---------- platform audit ----------
create table public.platform_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid, action text not null, target text, before jsonb, after jsonb, reason text
);
alter table public.platform_audit enable row level security;
create policy r on public.platform_audit for select to authenticated using (public._is_admin());
revoke all on public.platform_audit from public, anon, authenticated;
grant select on public.platform_audit to authenticated;
create or replace function public._tg_nodelete_any() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
begin raise exception 'History records cannot be deleted (%).', tg_table_name; end $$;
create trigger a_nodelete before delete on public.platform_audit for each row execute function public._tg_nodelete_any();
create trigger b_noupdate before update on public.platform_audit for each row execute function public._tg_nodelete_any();

create or replace function public._paudit(act text, tgt text, b jsonb, a jsonb, r text default null) returns void
 language sql security definer set search_path = pg_catalog, public as $$
  insert into public.platform_audit (actor, action, target, before, after, reason) values (auth.uid(), act, tgt, b, a, r) $$;

create or replace function public.owner_transfer(new_owner uuid, reason text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare old uuid;
begin
  perform public._me_ok();
  if not public._is_owner() then raise exception 'Only the owner can do this'; end if;
  if reason is null or char_length(trim(reason)) < 5 then raise exception 'Please give a reason (at least 5 characters).'; end if;
  if not exists (select 1 from public.profiles where id = new_owner) then raise exception 'Person not found'; end if;
  select user_id into old from public.platform_owner where id = 1 for update;
  update public.platform_owner set user_id = new_owner, since = now() where id = 1;
  update public.profiles set perms = (select array_agg(distinct x) from unnest(perms || array['admin']) x) where id = new_owner;
  perform public._paudit('owner.transfer', new_owner::text, jsonb_build_object('owner', old), jsonb_build_object('owner', new_owner), trim(reason));
end $$;

-- ---------- feature flags / platform settings (owner only; values readable by clients through app_settings) ----------
create or replace function public.owner_set_flag(k text, v text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare old text;
begin
  perform public._me_ok();
  if not public._is_owner() then raise exception 'Only the owner can do this'; end if;
  if k not in ('pres_enabled','live_enabled','assignments_enabled','push_enabled','maintenance','maintenance_msg','max_groups') then raise exception 'Unknown setting'; end if;
  if k in ('pres_enabled','live_enabled','assignments_enabled','push_enabled','maintenance') and v not in ('true','false') then raise exception 'Use true or false'; end if;
  if k = 'max_groups' and (v !~ '^[0-9]{1,2}$' or v::int not between 1 and 12) then raise exception 'Choose 1 to 12'; end if;
  if k = 'maintenance_msg' and char_length(coalesce(v, '')) > 300 then raise exception 'Message is too long (max 300)'; end if;
  select value into old from public.app_settings where key = k;
  insert into public.app_settings (key, value) values (k, coalesce(v, '')) on conflict (key) do update set value = excluded.value;
  perform public._paudit('flag.set', k, to_jsonb(old), to_jsonb(v));
end $$;

-- ---------- access summary: the client builds its menus from this; the server still checks every call ----------
create or replace function public.my_access() returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); p public.profiles;
begin
  select * into p from public.profiles where id = u;
  return jsonb_build_object(
    'uid', u, 'role', p.role, 'owner', public._is_owner(), 'admin', public._is_admin(),
    'perms', to_jsonb(p.perms), 'class', p.class_tag, 'group', p.group_id,
    'teaches', coalesce((select jsonb_agg(jsonb_build_object('tag', s.class_tag, 'title', c.title, 'perms', s.perms) order by s.class_tag)
                         from public.class_staff s join public.classes c on c.tag = s.class_tag where s.user_id = u and s.role = 'teacher'), '[]'),
    'leads', coalesce((select jsonb_agg(jsonb_build_object('tag', s.class_tag, 'title', c.title, 'perms', s.perms) order by s.class_tag)
                       from public.class_staff s join public.classes c on c.tag = s.class_tag where s.user_id = u and s.role = 'starosta'), '[]'));
end $$;

-- ---------- rate limiting (per user, per action, sliding window) ----------
create table public.rate_events (user_id uuid not null, action text not null, at timestamptz not null default clock_timestamp());
create index rate_events_ix on public.rate_events (user_id, action, at desc);
alter table public.rate_events enable row level security;
revoke all on public.rate_events from public, anon, authenticated;

create or replace function public._rate(act text, max_n int, win_s int) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := auth.uid(); n int;
begin
  if u is null then return; end if;           -- service/cron context is not rate limited
  select count(*) into n from public.rate_events where user_id = u and action = act and at > clock_timestamp() - make_interval(secs => win_s);
  if n >= max_n then raise exception 'Too many requests. Please wait a moment and try again.' using errcode = 'P0429'; end if;
  insert into public.rate_events (user_id, action) values (u, act);
  if random() < 0.02 then delete from public.rate_events where at < clock_timestamp() - interval '1 day'; end if;
end $$;

-- ---------- grants ----------
revoke all on function public._tg_nodelete_any(), public._is_owner(), public._is_teacher_of(text), public._paudit(text, text, jsonb, jsonb, text),
  public.owner_transfer(uuid, text), public.owner_set_flag(text, text), public.my_access(), public._rate(text, int, int)
  from public, anon, authenticated, service_role;
grant execute on function public._is_owner(), public._is_teacher_of(text) to authenticated, service_role;   -- policy helpers
grant execute on function public.owner_transfer(uuid, text), public.owner_set_flag(text, text), public.my_access() to authenticated;
