-- ADIAK 1.0 / M2 Presentation Center schema: tables, policy helpers, immutability guards, audit, roster sync,
-- team-files bucket + storage policies. Additive only. All writes go through the RPCs in M3.
do $$ begin
  if not exists (select 1 from supabase_migrations.schema_migrations where version = '20261109100000') and to_regclass('public.notifications') is null then
    raise exception 'pre-flight: M1 (adiak10_foundation) must be applied first';
  end if;
  if to_regclass('public.pres_events') is not null then raise exception 'pre-flight: pres_events already exists'; end if;
end $$;

-- ================= tables =================
create table public.pres_events (
  id bigint generated always as identity primary key,
  class_tag text not null references public.classes (tag) on update cascade,
  title text not null check (char_length(title) between 2 and 80),
  descr text not null default '' check (char_length(descr) <= 1000),
  starts_at timestamptz,
  final_due timestamptz,
  slot_minutes int not null default 7 check (slot_minutes between 1 and 60),
  status text not null default 'draft' check (status in ('draft','open','drawn','live','done')),
  frozen_at timestamptz,
  scores_published_at timestamptz,
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index pres_events_class on public.pres_events (class_tag, id desc);

create table public.pres_event_teams (
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  group_name text not null,
  added_by uuid, added_at timestamptz not null default now(),
  removed_at timestamptz, removed_by uuid, remove_reason text,
  speak_state text not null default 'open' check (speak_state in ('open','submitted','approved','needs_review')),
  speak_by uuid, speak_at timestamptz,
  final_state text not null default 'none' check (final_state in ('none','submitted','approved','returned')),
  primary key (event_id, group_id)
);

create table public.pres_draws (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  round int not null check (round >= 1),
  participants bigint[] not null,
  result bigint[] not null,
  drawn_by uuid not null,
  reason text,
  created_at timestamptz not null default now(),
  superseded_at timestamptz, superseded_by uuid, superseded_reason text,
  unique (event_id, round),
  check (cardinality(participants) = cardinality(result) and participants @> result and result @> participants)
);
create unique index pres_draws_current on public.pres_draws (event_id) where superseded_at is null;

create table public.pres_roster (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  user_id uuid not null,
  user_name text not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz, left_reason text,
  participant boolean not null default false,
  frozen_at timestamptz,
  left_group_at timestamptz
);
create unique index pres_roster_active on public.pres_roster (event_id, user_id) where left_at is null;
create index pres_roster_team on public.pres_roster (event_id, group_id);

create table public.pres_speakers (
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  user_id uuid not null,
  position int not null check (position between 1 and 20),
  withdrawn boolean not null default false,
  chosen_at timestamptz not null default now(),
  primary key (event_id, group_id, user_id),
  unique (event_id, group_id, position)
);

create table public.pres_speakers_final (
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  position int not null,
  user_id uuid not null,
  user_name text not null,
  approved boolean not null,
  placed boolean not null default true,
  frozen_at timestamptz not null default now(),
  primary key (event_id, group_id, position)
);

create table public.pres_speaker_log (
  id bigint generated always as identity primary key,
  event_id bigint not null, group_id bigint not null, user_id uuid,
  actor uuid, action text not null, before_pos int, after_pos int, note text,
  at timestamptz not null default now()
);

create table public.pres_files (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  path text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  mime text not null,
  size bigint not null check (size > 0 and size <= 26214400),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  uploader uuid not null, uploader_name text not null,
  created_at timestamptz not null default now(),
  hidden_at timestamptz, hidden_by uuid, hidden_reason text
);
create index pres_files_team on public.pres_files (event_id, group_id, id desc);

create table public.pres_submissions (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  file_id bigint not null references public.pres_files (id),
  version int not null check (version >= 1),
  state text not null default 'submitted' check (state in ('submitted','approved','returned','superseded')),
  submitted_by uuid not null, submitted_at timestamptz not null default now(),
  reviewed_by uuid, reviewed_at timestamptz, note text check (note is null or char_length(note) <= 1000),
  unique (event_id, group_id, version)
);
-- at most one active (pending or approved) submission per team and event => exactly one approved final when approved
create unique index pres_submissions_active on public.pres_submissions (event_id, group_id) where state in ('submitted','approved');

create table public.pres_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid, actor_role text not null,
  entity text not null, entity_id text,
  event_id bigint, group_id bigint,
  action text not null,
  before jsonb, after jsonb,
  reason text
);
create index pres_audit_event on public.pres_audit (event_id, group_id, id desc);

create table public.pres_tasks (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  title text not null check (char_length(title) between 1 and 140),
  assignee uuid,
  due timestamptz,
  status text not null default 'todo' check (status in ('todo','doing','done','cancelled')),
  created_by uuid not null, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), done_at timestamptz
);
create index pres_tasks_team on public.pres_tasks (event_id, group_id);

create table public.pres_announcements (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  body text not null check (char_length(body) between 1 and 2000),
  author uuid not null, created_at timestamptz not null default now(), edited_at timestamptz
);

create table public.pres_live (
  event_id bigint primary key references public.pres_events (id),
  state text not null default 'idle' check (state in ('idle','running','paused','ended')),
  slot_index int not null default 0,
  slot_started_at timestamptz,
  paused_at timestamptz,
  elapsed_ms bigint not null default 0,
  duration_s int not null default 420 check (duration_s between 0 and 7200),
  version int not null default 0,
  updated_by uuid, updated_at timestamptz not null default now()
);

create table public.pres_rubrics (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  version int not null,
  criteria jsonb not null,
  created_by uuid not null, created_at timestamptz not null default now(),
  unique (event_id, version)
);

create table public.pres_scores (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.pres_events (id),
  group_id bigint not null,
  rubric_id bigint not null references public.pres_rubrics (id),
  reviewer uuid not null, reviewer_name text not null,
  scores jsonb not null,
  total numeric(6,2) not null check (total between 0 and 100),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  supersedes_id bigint references public.pres_scores (id),
  superseded_at timestamptz
);
create unique index pres_scores_current on public.pres_scores (event_id, group_id, reviewer) where superseded_at is null;

-- ================= policy helpers (class B: STABLE, boolean only, executable by authenticated) =================
create or replace function public._pres_ev_tag(e bigint) returns text
 language sql stable security definer set search_path = pg_catalog, public as $$ select class_tag from public.pres_events where id = e $$;

create or replace function public._pres_staff(tag text) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select auth.uid() is not null and public._cperm(tag, 'presentations') $$;

create or replace function public._pres_class(e bigint) returns boolean   -- class-wide public info (not drafts)
 language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.pres_events ev where ev.id = e and
     (public._pres_staff(ev.class_tag) or (ev.status <> 'draft' and public._can_class(ev.class_tag)))) $$;

create or replace function public._pres_member(e bigint, g bigint) returns boolean  -- active member, event not frozen
 language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.pres_roster r join public.pres_events ev on ev.id = r.event_id
     where r.event_id = e and r.group_id = g and r.user_id = auth.uid() and r.left_at is null
       and ev.frozen_at is null and ev.status in ('draft','open','drawn')) $$;

create or replace function public._pres_participant(e bigint, g bigint) returns boolean  -- frozen participant
 language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.pres_roster r where r.event_id = e and r.group_id = g
     and r.user_id = auth.uid() and r.participant) $$;

create or replace function public._pres_read(e bigint, g bigint) returns boolean  -- team workspace read access
 language sql stable security definer set search_path = pg_catalog, public as $$
  select public._pres_staff(public._pres_ev_tag(e)) or public._pres_member(e, g) or public._pres_participant(e, g) $$;

-- ================= RLS: SELECT-only policies =================
alter table public.pres_events enable row level security;
alter table public.pres_event_teams enable row level security;
alter table public.pres_draws enable row level security;
alter table public.pres_roster enable row level security;
alter table public.pres_speakers enable row level security;
alter table public.pres_speakers_final enable row level security;
alter table public.pres_speaker_log enable row level security;
alter table public.pres_files enable row level security;
alter table public.pres_submissions enable row level security;
alter table public.pres_audit enable row level security;
alter table public.pres_tasks enable row level security;
alter table public.pres_announcements enable row level security;
alter table public.pres_live enable row level security;
alter table public.pres_rubrics enable row level security;
alter table public.pres_scores enable row level security;

create policy r on public.pres_events for select to authenticated using (public._pres_class(id));
create policy r on public.pres_event_teams for select to authenticated using (public._pres_class(event_id));
create policy r on public.pres_draws for select to authenticated
  using (public._pres_class(event_id) and (superseded_at is null or public._pres_staff(public._pres_ev_tag(event_id))));
create policy r on public.pres_roster for select to authenticated using (user_id = auth.uid() or public._pres_class(event_id));
create policy r on public.pres_speakers for select to authenticated using (public._pres_class(event_id));
create policy r on public.pres_speakers_final for select to authenticated using (public._pres_class(event_id));
create policy r on public.pres_speaker_log for select to authenticated using (public._pres_read(event_id, group_id));
create policy r on public.pres_files for select to authenticated using (public._pres_read(event_id, group_id) or uploader = auth.uid());
create policy r on public.pres_submissions for select to authenticated using (public._pres_read(event_id, group_id));
create policy r on public.pres_audit for select to authenticated using (
  public._pres_staff(public._pres_ev_tag(event_id))
  or (entity in ('pres_files','pres_submissions','pres_tasks') and public._pres_read(event_id, group_id)));
create policy r on public.pres_tasks for select to authenticated using (public._pres_read(event_id, group_id));
create policy r on public.pres_announcements for select to authenticated using (public._pres_class(event_id));
create policy r on public.pres_live for select to authenticated using (public._pres_class(event_id));
create policy r on public.pres_rubrics for select to authenticated using (public._pres_class(event_id));
create policy r on public.pres_scores for select to authenticated using (
  public._pres_staff(public._pres_ev_tag(event_id))
  or (superseded_at is null and public._pres_read(event_id, group_id)
      and exists (select 1 from public.pres_events ev where ev.id = event_id and ev.scores_published_at is not null)));

do $$ declare t text; begin
  foreach t in array array['pres_events','pres_event_teams','pres_draws','pres_roster','pres_speakers','pres_speakers_final',
    'pres_speaker_log','pres_files','pres_submissions','pres_audit','pres_tasks','pres_announcements','pres_live','pres_rubrics','pres_scores']
  loop
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end $$;
alter publication supabase_realtime add table public.pres_events, public.pres_event_teams, public.pres_draws, public.pres_roster,
  public.pres_speakers, public.pres_speakers_final, public.pres_files, public.pres_submissions, public.pres_tasks,
  public.pres_announcements, public.pres_live, public.pres_scores;

-- ================= immutability guards (class D) =================
create or replace function public._tg_pres_nodelete() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
begin raise exception 'History records cannot be deleted (%).', tg_table_name; end $$;

-- TG_ARGV[0]: comma list of columns that may change; TG_ARGV[1]: comma list of set-once columns (only null -> value)
create or replace function public._tg_pres_guard() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
declare mut text[] := string_to_array(coalesce(tg_argv[0], ''), ','); once text[] := string_to_array(coalesce(tg_argv[1], ''), ',');
  o jsonb := to_jsonb(old); n jsonb := to_jsonb(new); c text;
begin
  if (o - mut - once) is distinct from (n - mut - once) then
    raise exception 'This record is protected; only % may change (%).', array_to_string(mut || once, ', '), tg_table_name;
  end if;
  foreach c in array once loop
    if c <> '' and (o -> c) is distinct from (n -> c) and (o ->> c) is not null then
      raise exception 'Column % of % can only be set once.', c, tg_table_name;
    end if;
  end loop;
  return new;
end $$;

create or replace function public._tg_pres_sub_transition() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.state = new.state then return new; end if;
  if not ((old.state = 'submitted' and new.state in ('approved','returned','superseded'))
       or (old.state = 'approved' and new.state = 'returned')) then
    raise exception 'Invalid submission transition % -> %', old.state, new.state;
  end if;
  return new;
end $$;

create or replace function public._tg_pres_file_hide() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
begin
  if new.hidden_at is not null and old.hidden_at is null
     and exists (select 1 from public.pres_submissions s where s.file_id = new.id) then
    raise exception 'A submitted file cannot be hidden.';
  end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['pres_events','pres_event_teams','pres_draws','pres_roster','pres_speakers_final','pres_speaker_log',
    'pres_files','pres_submissions','pres_audit','pres_tasks','pres_announcements','pres_live','pres_rubrics','pres_scores']
  loop execute format('create trigger a_nodelete before delete on public.%I for each row execute function public._tg_pres_nodelete()', t); end loop;
end $$;
create trigger b_guard before update on public.pres_draws for each row execute function public._tg_pres_guard('', 'superseded_at,superseded_by,superseded_reason');
create trigger b_guard before update on public.pres_roster for each row execute function public._tg_pres_guard('left_group_at,user_name,participant', 'left_at,left_reason,frozen_at');
create trigger b_guard before update on public.pres_files for each row execute function public._tg_pres_guard('hidden_at,hidden_by,hidden_reason', '');
create trigger c_hide before update on public.pres_files for each row execute function public._tg_pres_file_hide();
create trigger b_guard before update on public.pres_submissions for each row execute function public._tg_pres_guard('state,reviewed_by,reviewed_at,note', '');
create trigger c_trans before update on public.pres_submissions for each row execute function public._tg_pres_sub_transition();
create trigger b_guard before update on public.pres_audit for each row execute function public._tg_pres_guard('', '');
create trigger b_guard before update on public.pres_speaker_log for each row execute function public._tg_pres_guard('', '');
create trigger b_guard before update on public.pres_speakers_final for each row execute function public._tg_pres_guard('', '');
create trigger b_guard before update on public.pres_rubrics for each row execute function public._tg_pres_guard('', '');
create trigger b_guard before update on public.pres_scores for each row execute function public._tg_pres_guard('', 'superseded_at');
-- participant may only go false -> true
create or replace function public._tg_pres_roster_participant() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.participant and not new.participant then raise exception 'Participation history cannot be removed.'; end if;
  return new;
end $$;
create trigger c_participant before update on public.pres_roster for each row execute function public._tg_pres_roster_participant();

-- ================= audit (class D): every insert/update of the protected entities =================
create or replace function public._tg_pres_audit() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare a uuid := auth.uid(); n jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  o jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end; r jsonb := coalesce(n, o); role text;
begin
  role := case when a is null then 'system'
               when public._pres_staff(public._pres_ev_tag(coalesce((r->>'event_id')::bigint, (r->>'id')::bigint))) then 'staff'
               else 'student' end;
  insert into public.pres_audit (actor, actor_role, entity, entity_id, event_id, group_id, action, before, after, reason)
  values (a, role, tg_table_name, coalesce(r->>'id', r->>'event_id'),
          coalesce((r->>'event_id')::bigint, case when tg_table_name = 'pres_events' then (r->>'id')::bigint end),
          (r->>'group_id')::bigint, lower(tg_op), o, n, nullif(current_setting('adiak.reason', true), ''));
  return null;
end $$;
do $$ declare t text; begin
  foreach t in array array['pres_events','pres_event_teams','pres_draws','pres_roster','pres_files','pres_submissions',
    'pres_tasks','pres_announcements','pres_live','pres_rubrics','pres_scores']
  loop execute format('create trigger z_audit after insert or update on public.%I for each row execute function public._tg_pres_audit()', t); end loop;
end $$;
create trigger z_audit after insert or update or delete on public.pres_speakers for each row execute function public._tg_pres_audit();

-- ================= storage: private team-files bucket =================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
 ('team-files', 'team-files', false, 26214400, array[
   'application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-powerpoint',
   'application/vnd.oasis.opendocument.presentation','application/vnd.apple.keynote','application/x-iwork-keynote-sffkey',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword',
   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel',
   'application/vnd.oasis.opendocument.text','text/plain',
   'image/png','image/jpeg','image/webp','image/gif','video/mp4','video/quicktime','audio/mpeg','audio/mp4','application/zip'])
on conflict (id) do nothing;

-- path: e<event>/g<group>/<uuid>.<ext>
create or replace function public._pres_path_eg(p text, part int) returns bigint
 language sql immutable set search_path = pg_catalog as $$
  select case when p ~ '^e[0-9]{1,12}/g[0-9]{1,12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$'
              then substr(split_part(p, '/', part), 2)::bigint end $$;

create policy team_files_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'team-files'
  and public._pres_path_eg(name, 1) is not null
  and public._pres_member(public._pres_path_eg(name, 1), public._pres_path_eg(name, 2)));
create policy team_files_read on storage.objects for select to authenticated using (
  bucket_id = 'team-files'
  and public._pres_path_eg(name, 1) is not null
  and public._pres_read(public._pres_path_eg(name, 1), public._pres_path_eg(name, 2)));
-- deliberately NO update/delete policy for team-files: objects cannot be overwritten or removed by clients.

-- ================= grants for helpers =================
revoke all on function public._pres_ev_tag(bigint), public._pres_staff(text), public._pres_class(bigint), public._pres_member(bigint, bigint),
  public._pres_participant(bigint, bigint), public._pres_read(bigint, bigint), public._pres_path_eg(text, int),
  public._tg_pres_nodelete(), public._tg_pres_guard(), public._tg_pres_sub_transition(), public._tg_pres_file_hide(),
  public._tg_pres_roster_participant(), public._tg_pres_audit()
  from public, anon, authenticated, service_role;
grant execute on function public._pres_ev_tag(bigint), public._pres_staff(text), public._pres_class(bigint), public._pres_member(bigint, bigint),
  public._pres_participant(bigint, bigint), public._pres_read(bigint, bigint), public._pres_path_eg(text, int) to authenticated, service_role;
