-- ADIAK 1.0 / M8 academics: class announcements, assignments + versioned submissions, class-leader issue reports,
-- Teacher Studio / Class Hub read models. Additive only; class-scoped through _can_class/_is_teacher_of/_cperm.
do $$ begin
  if to_regprocedure('public._is_teacher_of(text)') is null then raise exception 'pre-flight: roles migration must be applied first'; end if;
  if to_regclass('public.assignments') is not null then raise exception 'pre-flight: academics already applied'; end if;
end $$;

-- helper: any staff role in the class (teacher, class leader, admin)
create or replace function public._class_staff(tag text) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select auth.uid() is not null and (public._is_admin() or exists (select 1 from public.class_staff s where s.user_id = auth.uid() and s.class_tag = tag)) $$;
create or replace function public._class_student_ids(tag text) returns uuid[]
 language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(array_agg(id), '{}') from public.profiles where class_tag = tag and role = 'student' and not is_admin $$;
create or replace function public._class_teacher_ids(tag text) returns uuid[]
 language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(array_agg(user_id), '{}') from public.class_staff where class_tag = tag and role = 'teacher' $$;

-- ================= class announcements =================
create table public.class_announcements (
  id bigint generated always as identity primary key,
  class_tag text not null references public.classes (tag) on update cascade,
  title text not null check (char_length(title) between 2 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  author uuid not null, author_name text not null, author_role text not null check (author_role in ('teacher','leader','admin')),
  pinned boolean not null default false, expires_at timestamptz,
  created_at timestamptz not null default now(), edited_at timestamptz,
  removed_at timestamptz, removed_by uuid, removed_reason text
);
create index class_announcements_ix on public.class_announcements (class_tag, id desc);

create or replace function public.class_announce(tag text, ttl text, txt text, pin boolean default false, expires timestamptz default null) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); r text; nid bigint;
begin
  perform public._rate('announce', 10, 600);
  r := case when public._is_admin() then 'admin' when public._is_teacher_of(tag) then 'teacher' when public._cperm(tag, 'announce') then 'leader' end;
  if r is null then raise exception 'You do not have permission for this action'; end if;
  if ttl is null or char_length(trim(ttl)) not between 2 and 120 then raise exception 'Title must be 2 to 120 characters'; end if;
  if txt is null or char_length(trim(txt)) not between 1 and 4000 then raise exception 'Text must be 1 to 4000 characters'; end if;
  insert into public.class_announcements (class_tag, title, body, author, author_name, author_role, pinned, expires_at)
  values (tag, trim(ttl), trim(txt), u, (select name from public.profiles where id = u), r, coalesce(pin, false), expires) returning id into nid;
  perform public._notify(public._class_student_ids(tag) || public._class_teacher_ids(tag), 'class.announce',
    jsonb_build_object('title', trim(ttl), 'text', left(trim(txt), 140)), jsonb_build_object('k', 'class', 'tag', tag, 'sec', 'announcements', 'id', nid), 'cann:' || nid);
  return nid;
end $$;

create or replace function public.class_announce_edit(aid bigint, ttl text, txt text, pin boolean, expires timestamptz) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); a public.class_announcements;
begin
  select * into a from public.class_announcements where id = aid for update;
  if not found or a.removed_at is not null then raise exception 'Announcement not found'; end if;
  if not (a.author = u or public._is_teacher_of(a.class_tag)) then raise exception 'Only the author or a teacher can edit this'; end if;
  if ttl is null or char_length(trim(ttl)) not between 2 and 120 or txt is null or char_length(trim(txt)) not between 1 and 4000 then raise exception 'Title 2-120 and text 1-4000 characters'; end if;
  update public.class_announcements set title = trim(ttl), body = trim(txt), pinned = coalesce(pin, false), expires_at = expires, edited_at = now() where id = aid;
end $$;

create or replace function public.class_announce_remove(aid bigint, reason text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); a public.class_announcements;
begin
  select * into a from public.class_announcements where id = aid for update;
  if not found then raise exception 'Announcement not found'; end if;
  if not (a.author = u or public._is_teacher_of(a.class_tag)) then raise exception 'Only the author or a teacher can remove this'; end if;
  update public.class_announcements set removed_at = now(), removed_by = u, removed_reason = left(reason, 300) where id = aid and removed_at is null;
end $$;

-- ================= assignments =================
create table public.assignments (
  id bigint generated always as identity primary key,
  class_tag text not null references public.classes (tag) on update cascade,
  title text not null check (char_length(title) between 2 and 120),
  descr text not null default '' check (char_length(descr) <= 4000),
  due_at timestamptz,
  mode text not null default 'individual' check (mode in ('individual','team')),
  allow_files boolean not null default true,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz
);
create index assignments_class on public.assignments (class_tag, id desc);

create table public.assignment_submissions (
  id bigint generated always as identity primary key,
  assignment_id bigint not null references public.assignments (id),
  subject_user uuid, subject_group bigint,
  version int not null check (version >= 1),
  path text unique, name text, mime text, size bigint check (size is null or (size > 0 and size <= 26214400)),
  note text not null default '' check (char_length(note) <= 2000),
  submitted_by uuid not null, submitted_by_name text not null, submitted_at timestamptz not null default now(),
  late boolean not null default false,
  state text not null default 'submitted' check (state in ('submitted','accepted','changes_requested','superseded')),
  reviewed_by uuid, reviewed_at timestamptz, feedback text check (feedback is null or char_length(feedback) <= 2000),
  check ((subject_user is null) <> (subject_group is null))
);
create unique index assignment_submissions_active on public.assignment_submissions
  (assignment_id, coalesce(subject_user::text, 'g' || subject_group)) where state in ('submitted','accepted');
create unique index assignment_submissions_ver on public.assignment_submissions (assignment_id, coalesce(subject_user::text, 'g' || subject_group), version);

create or replace function public._asg_tag(a bigint) returns text
 language sql stable security definer set search_path = pg_catalog, public as $$ select class_tag from public.assignments where id = a $$;
-- caller may read/act for this submission subject (own work or own team's work)
create or replace function public._asg_subject_ok(su uuid, sg bigint) returns boolean
 language sql stable security definer set search_path = pg_catalog, public as $$
  select auth.uid() is not null and ((su is not null and su = auth.uid())
     or (sg is not null and exists (select 1 from public.profiles where id = auth.uid() and group_id = sg))) $$;

create or replace function public.assignment_save(aid bigint, cls text, ttl text, dsc text, due timestamptz, md text, files boolean) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); a public.assignments; nid bigint;
begin
  perform public._rate('assignment', 30, 600);
  if ttl is null or char_length(trim(ttl)) not between 2 and 120 then raise exception 'Title must be 2 to 120 characters'; end if;
  if char_length(coalesce(dsc, '')) > 4000 then raise exception 'Description is too long (max 4000)'; end if;
  if md not in ('individual','team') then raise exception 'Choose individual or team'; end if;
  if aid is null then
    if not exists (select 1 from public.classes c where c.tag = cls) then raise exception 'That class group does not exist'; end if;
    if not (public._is_teacher_of(cls) or public._cperm(cls, 'presentations')) then raise exception 'Only teachers of this class can create assignments'; end if;
    insert into public.assignments (class_tag, title, descr, due_at, mode, allow_files, created_by)
    values (cls, trim(ttl), coalesce(trim(dsc), ''), due, md, coalesce(files, true), u) returning id into nid;
    return nid;
  end if;
  select * into a from public.assignments where id = aid for update;
  if not found then raise exception 'Assignment not found'; end if;
  if not (public._is_teacher_of(a.class_tag) or public._cperm(a.class_tag, 'presentations')) then raise exception 'Only teachers of this class can edit assignments'; end if;
  if a.status <> 'draft' and md is distinct from a.mode then raise exception 'The mode cannot change after publishing'; end if;
  update public.assignments set title = trim(ttl), descr = coalesce(trim(dsc), ''), due_at = due, mode = md, allow_files = coalesce(files, true), updated_at = now() where id = aid;
  if a.status = 'published' and due is distinct from a.due_at then
    perform public._notify(public._class_student_ids(a.class_tag), 'class.assignment_due', jsonb_build_object('title', trim(ttl), 'due', due),
      jsonb_build_object('k', 'class', 'tag', a.class_tag, 'sec', 'assignments', 'id', aid), 'adue:' || aid || ':' || coalesce(extract(epoch from due)::bigint::text, 'none'));
  end if;
  return aid;
end $$;

create or replace function public.assignment_status(aid bigint, st text) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); a public.assignments;
begin
  select * into a from public.assignments where id = aid for update;
  if not found then raise exception 'Assignment not found'; end if;
  if not (public._is_teacher_of(a.class_tag) or public._cperm(a.class_tag, 'presentations')) then raise exception 'You do not have permission for this action'; end if;
  if not ((a.status = 'draft' and st = 'published') or (a.status = 'published' and st = 'closed') or (a.status = 'closed' and st = 'published')) then
    raise exception 'Cannot change status from % to %', a.status, st; end if;
  update public.assignments set status = st, updated_at = now(), published_at = coalesce(published_at, case when st = 'published' then now() end) where id = aid;
  if a.status = 'draft' and st = 'published' then
    perform public._notify(public._class_student_ids(a.class_tag), 'class.assignment', jsonb_build_object('title', a.title, 'due', a.due_at),
      jsonb_build_object('k', 'class', 'tag', a.class_tag, 'sec', 'assignments', 'id', aid), 'asg:' || aid);
  end if;
end $$;

create or replace function public.assignment_submit(aid bigint, pth text, fname text, fmime text, fsize bigint, nt text, expected_active bigint default null) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); a public.assignments; p public.profiles; su uuid; sg bigint; act public.assignment_submissions; v int; nid bigint; subj text;
begin
  perform public._rate('submit', 10, 600);
  select * into a from public.assignments where id = aid for update;
  if not found or a.status <> 'published' then raise exception 'This assignment is not open for submissions'; end if;
  select * into p from public.profiles where id = u;
  if p.role <> 'student' or p.class_tag is distinct from a.class_tag then raise exception 'This assignment is for another class'; end if;
  if a.mode = 'team' then
    if p.group_id is null then raise exception 'Join a team first: this is a team assignment'; end if;
    sg := p.group_id; subj := 'g' || sg;
  else su := u; subj := u::text; end if;
  if pth is not null then
    if not a.allow_files then raise exception 'This assignment does not accept files'; end if;
    if pth !~ ('^a' || aid || '/' || subj || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$') then raise exception 'Invalid file path'; end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'class-files' and o.name = pth and (o.owner is null or o.owner = u)) then raise exception 'File upload not found'; end if;
    if fsize is null or fsize <= 0 or fsize > 26214400 then raise exception 'Files must be under 25 MB'; end if;
  elsif char_length(trim(coalesce(nt, ''))) = 0 then raise exception 'Add a file or a note';
  end if;
  if char_length(coalesce(nt, '')) > 2000 then raise exception 'Note is too long (max 2000)'; end if;
  select * into act from public.assignment_submissions where assignment_id = aid and coalesce(subject_user::text, 'g' || subject_group) = coalesce(su::text, 'g' || sg)
     and state in ('submitted','accepted') for update;
  if act.id is distinct from expected_active then raise exception 'The submission changed meanwhile. Reload and try again.'; end if;
  if act.state = 'accepted' then raise exception 'This work is already accepted. Ask your teacher to reopen it.'; end if;
  if act.id is not null then update public.assignment_submissions set state = 'superseded' where id = act.id; end if;
  select coalesce(max(version), 0) + 1 into v from public.assignment_submissions where assignment_id = aid and coalesce(subject_user::text, 'g' || subject_group) = coalesce(su::text, 'g' || sg);
  insert into public.assignment_submissions (assignment_id, subject_user, subject_group, version, path, name, mime, size, note, submitted_by, submitted_by_name, late)
  values (aid, su, sg, v, pth, left(regexp_replace(trim(coalesce(fname, '')), '[[:cntrl:]/\\]+', '_', 'g'), 120), left(fmime, 120), fsize, coalesce(trim(nt), ''), u, p.name,
          a.due_at is not null and now() > a.due_at) returning id into nid;
  perform public._notify(public._class_teacher_ids(a.class_tag), 'class.submission', jsonb_build_object('title', a.title, 'who', coalesce((select name from public.groups where id = sg), p.name)),
    jsonb_build_object('k', 'class', 'tag', a.class_tag, 'sec', 'assignments', 'id', aid), 'asub:' || nid);
  return nid;
end $$;

create or replace function public.assignment_review(sid bigint, decision text, msg text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); s public.assignment_submissions; a public.assignments; who uuid[];
begin
  select * into s from public.assignment_submissions where id = sid for update;
  if not found then raise exception 'Submission not found'; end if;
  select * into a from public.assignments where id = s.assignment_id;
  if not (public._is_teacher_of(a.class_tag) or public._cperm(a.class_tag, 'presentations')) then raise exception 'You do not have permission for this action'; end if;
  if decision = 'accept' and s.state = 'submitted' then
    update public.assignment_submissions set state = 'accepted', reviewed_by = u, reviewed_at = now(), feedback = left(msg, 2000) where id = sid;
  elsif decision = 'changes' and s.state in ('submitted','accepted') then
    if msg is null or char_length(trim(msg)) < 3 then raise exception 'Tell the student what to change'; end if;
    update public.assignment_submissions set state = 'changes_requested', reviewed_by = u, reviewed_at = now(), feedback = left(trim(msg), 2000) where id = sid;
  else raise exception 'This submission cannot be reviewed that way (%).', s.state; end if;
  who := case when s.subject_user is not null then array[s.subject_user] else (select coalesce(array_agg(id), '{}') from public.profiles where group_id = s.subject_group) end;
  perform public._notify(who, case when decision = 'accept' then 'class.review_accept' else 'class.review_changes' end,
    jsonb_build_object('title', a.title, 'note', left(coalesce(msg, ''), 140)), jsonb_build_object('k', 'class', 'tag', a.class_tag, 'sec', 'assignments', 'id', a.id), 'arev:' || sid || ':' || decision);
end $$;

-- immutable history: submissions are never deleted; only review/state columns change, along valid transitions
create or replace function public._tg_asg_transition() returns trigger
 language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.state = new.state then return new; end if;
  if not ((old.state = 'submitted' and new.state in ('accepted','changes_requested','superseded')) or (old.state = 'accepted' and new.state = 'changes_requested')) then
    raise exception 'Invalid submission transition % -> %', old.state, new.state; end if;
  return new;
end $$;
create trigger a_nodelete before delete on public.assignment_submissions for each row execute function public._tg_nodelete_any();
create trigger b_guard before update on public.assignment_submissions for each row execute function public._tg_pres_guard('state,reviewed_by,reviewed_at,feedback', '');
create trigger c_trans before update on public.assignment_submissions for each row execute function public._tg_asg_transition();
create trigger a_nodelete before delete on public.assignments for each row execute function public._tg_nodelete_any();
create trigger a_nodelete before delete on public.class_announcements for each row execute function public._tg_nodelete_any();

-- ================= class-leader issue reports =================
create table public.class_issues (
  id bigint generated always as identity primary key,
  class_tag text not null references public.classes (tag) on update cascade,
  author uuid not null, author_name text not null,
  title text not null check (char_length(title) between 2 and 120),
  body text not null default '' check (char_length(body) <= 2000),
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  created_at timestamptz not null default now(),
  handled_by uuid, handled_at timestamptz, reply text check (reply is null or char_length(reply) <= 2000)
);
create trigger a_nodelete before delete on public.class_issues for each row execute function public._tg_nodelete_any();

create or replace function public.class_issue_report(tag text, ttl text, txt text) returns bigint
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); nid bigint;
begin
  perform public._rate('issue', 5, 600);
  if not (public._cperm(tag, 'report') or public._is_teacher_of(tag)) then raise exception 'Only the class representative can report class issues'; end if;
  if ttl is null or char_length(trim(ttl)) not between 2 and 120 then raise exception 'Title must be 2 to 120 characters'; end if;
  insert into public.class_issues (class_tag, author, author_name, title, body) values (tag, u, (select name from public.profiles where id = u), trim(ttl), left(coalesce(trim(txt), ''), 2000)) returning id into nid;
  perform public._notify(public._class_teacher_ids(tag), 'class.issue', jsonb_build_object('title', trim(ttl)), jsonb_build_object('k', 'class', 'tag', tag, 'sec', 'issues', 'id', nid), 'iss:' || nid);
  return nid;
end $$;

create or replace function public.class_issue_update(iid bigint, st text, msg text default null) returns void
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); i public.class_issues;
begin
  select * into i from public.class_issues where id = iid for update;
  if not found then raise exception 'Issue not found'; end if;
  if not public._is_teacher_of(i.class_tag) then raise exception 'Only teachers of this class can handle issues'; end if;
  if st not in ('acknowledged','resolved','open') then raise exception 'Unknown status'; end if;
  update public.class_issues set status = st, handled_by = u, handled_at = now(), reply = coalesce(left(msg, 2000), reply) where id = iid;
  perform public._notify(array[i.author], 'class.issue_update', jsonb_build_object('title', i.title, 'status', st), jsonb_build_object('k', 'class', 'tag', i.class_tag, 'sec', 'issues', 'id', iid),
    'issu:' || iid || ':' || st || ':' || extract(epoch from now())::bigint);
end $$;

-- ================= RLS =================
alter table public.class_announcements enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.class_issues enable row level security;
create policy r on public.class_announcements for select to authenticated using (public._can_class(class_tag) and (removed_at is null or public._class_staff(class_tag)));
create policy r on public.assignments for select to authenticated using (public._class_staff(class_tag) or (status <> 'draft' and public._can_class(class_tag)));
create policy r on public.assignment_submissions for select to authenticated using (
  public._asg_subject_ok(subject_user, subject_group) or public._is_teacher_of(public._asg_tag(assignment_id)) or public._cperm(public._asg_tag(assignment_id), 'presentations'));
create policy r on public.class_issues for select to authenticated using (author = auth.uid() or public._is_teacher_of(class_tag));
do $$ declare t text; begin
  foreach t in array array['class_announcements','assignments','assignment_submissions','class_issues'] loop
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop; end $$;
alter publication supabase_realtime add table public.class_announcements, public.assignments, public.assignment_submissions, public.class_issues;

-- private bucket for assignment files: a<assignment>/<user uuid | g<group>>/<uuid>.<ext>; no update/delete for clients
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'class-files', 'class-files', false, 26214400, allowed_mime_types from storage.buckets where id = 'team-files'
on conflict (id) do nothing;
create or replace function public._asg_path_ok(p text, for_write boolean) returns boolean
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare aid bigint; subj text; a public.assignments;
begin
  if p !~ '^a[0-9]{1,12}/([0-9a-f-]{36}|g[0-9]{1,12})/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$' then return false; end if;
  aid := substr(split_part(p, '/', 1), 2)::bigint; subj := split_part(p, '/', 2);
  select * into a from public.assignments where id = aid;
  if not found then return false; end if;
  if not for_write and (public._is_teacher_of(a.class_tag) or public._cperm(a.class_tag, 'presentations')) then return true; end if;
  if for_write and a.status <> 'published' then return false; end if;
  return case when subj like 'g%' then public._asg_subject_ok(null, substr(subj, 2)::bigint) else public._asg_subject_ok(subj::uuid, null) end;
end $$;
create policy class_files_insert on storage.objects for insert to authenticated with check (bucket_id = 'class-files' and public._asg_path_ok(name, true));
create policy class_files_read on storage.objects for select to authenticated using (bucket_id = 'class-files' and public._asg_path_ok(name, false));

-- ================= read models =================
-- Teacher Studio / Class Hub class overview (any staff of the class); contains no scores or private notes
create or replace function public.class_overview(tag text) returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
begin
  perform public._me_ok();
  if not public._class_staff(tag) then raise exception 'You do not have permission for this action'; end if;
  return jsonb_build_object(
    'class', (select jsonb_build_object('tag', c.tag, 'title', c.title) from public.classes c where c.tag = class_overview.tag),
    'students', (select count(*) from public.profiles where class_tag = class_overview.tag and role = 'student' and not is_admin),
    'idle', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name), '[]') from public.profiles
              where class_tag = class_overview.tag and role = 'student' and not is_admin and group_id is null),
    'teams', (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'capacity', g.capacity,
                 'members', (select count(*) from public.profiles p where p.group_id = g.id)) order by g.name), '[]') from public.groups g where g.class_tag = class_overview.tag),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'status', e.status, 'starts_at', e.starts_at, 'final_due', e.final_due,
                 'teams', (select coalesce(jsonb_agg(jsonb_build_object('group', t.group_id, 'name', t.group_name, 'order', t.speak_state, 'final', t.final_state,
                    'tasks_open', (select count(*) from public.pres_tasks k where k.event_id = e.id and k.group_id = t.group_id and k.status in ('todo','doing')),
                    'tasks_done', (select count(*) from public.pres_tasks k where k.event_id = e.id and k.group_id = t.group_id and k.status = 'done'))), '[]')
                   from public.pres_event_teams t where t.event_id = e.id and t.removed_at is null)) order by coalesce(e.starts_at, e.created_at)), '[]')
              from public.pres_events e where e.class_tag = class_overview.tag and e.status <> 'done'),
    'assignments', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'due_at', a.due_at, 'status', a.status, 'mode', a.mode,
                 'submitted', (select count(distinct coalesce(s.subject_user::text, 'g' || s.subject_group)) from public.assignment_submissions s where s.assignment_id = a.id and s.state <> 'superseded'),
                 'expected', case when a.mode = 'team' then (select count(*) from public.groups g where g.class_tag = a.class_tag)
                                  else (select count(*) from public.profiles p where p.class_tag = a.class_tag and p.role = 'student' and not p.is_admin) end,
                 'to_review', (select count(*) from public.assignment_submissions s where s.assignment_id = a.id and s.state = 'submitted')) order by a.due_at nulls last), '[]')
              from public.assignments a where a.class_tag = class_overview.tag and a.status = 'published'),
    'issues_open', (select count(*) from public.class_issues i where i.class_tag = class_overview.tag and i.status <> 'resolved'),
    'announcements', (select coalesce(jsonb_agg(x order by x->>'id' desc), '[]') from (select jsonb_build_object('id', id, 'title', title, 'pinned', pinned, 'created_at', created_at) x
                 from public.class_announcements where class_tag = class_overview.tag and removed_at is null order by pinned desc, id desc limit 5) z));
end $$;

-- students who have not submitted a published assignment (teacher view)
create or replace function public.assignment_missing(aid bigint) returns table (subject text, name text)
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare a public.assignments;
begin
  perform public._me_ok();
  select * into a from public.assignments where id = aid;
  if not found or not (public._is_teacher_of(a.class_tag) or public._cperm(a.class_tag, 'presentations')) then raise exception 'You do not have permission for this action'; end if;
  if a.mode = 'team' then
    return query select 'g' || g.id, g.name from public.groups g where g.class_tag = a.class_tag
      and not exists (select 1 from public.assignment_submissions s where s.assignment_id = aid and s.subject_group = g.id and s.state <> 'superseded') order by g.name;
  else
    return query select p.id::text, p.name from public.profiles p where p.class_tag = a.class_tag and p.role = 'student' and not p.is_admin
      and not exists (select 1 from public.assignment_submissions s where s.assignment_id = aid and s.subject_user = p.id and s.state <> 'superseded') order by p.name;
  end if;
end $$;

-- Teacher Studio welcome: everything waiting for this teacher across their classes
create or replace function public.teacher_home() returns jsonb
 language plpgsql stable security definer set search_path = pg_catalog, public as $$
declare u uuid := public._me_ok(); tags text[];
begin
  select coalesce(array_agg(class_tag), '{}') into tags from public.class_staff where user_id = u and role = 'teacher';
  if public._is_admin() and cardinality(tags) = 0 then select coalesce(array_agg(tag), '{}') into tags from public.classes; end if;
  return jsonb_build_object(
    'name', (select name from public.profiles where id = u),
    'classes', (select coalesce(jsonb_agg(jsonb_build_object('tag', c.tag, 'title', c.title,
        'students', (select count(*) from public.profiles p where p.class_tag = c.tag and p.role = 'student' and not p.is_admin),
        'reviews', (select count(*) from public.pres_submissions s join public.pres_events e on e.id = s.event_id where e.class_tag = c.tag and s.state = 'submitted')
                 + (select count(*) from public.assignment_submissions s join public.assignments a on a.id = s.assignment_id where a.class_tag = c.tag and s.state = 'submitted'),
        'orders', (select count(*) from public.pres_event_teams t join public.pres_events e on e.id = t.event_id where e.class_tag = c.tag and t.removed_at is null and t.speak_state in ('submitted','needs_review')),
        'issues', (select count(*) from public.class_issues i where i.class_tag = c.tag and i.status = 'open')) order by c.tag), '[]')
      from public.classes c where c.tag = any (tags)),
    'next', (select jsonb_build_object('kind', k, 'id', id, 'tag', tag, 'title', title, 'at', at) from (
        select 'event' k, e.id, e.class_tag tag, e.title, coalesce(e.starts_at, e.final_due) at from public.pres_events e
         where e.class_tag = any (tags) and e.status in ('open','drawn','live') and coalesce(e.starts_at, e.final_due) > now() - interval '3 hours'
        union all select 'assignment', a.id, a.class_tag, a.title, a.due_at from public.assignments a where a.class_tag = any (tags) and a.status = 'published' and a.due_at > now()
      ) z order by at nulls last limit 1),
    'live', (select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'tag', e.class_tag, 'title', e.title)), '[]') from public.pres_events e where e.class_tag = any (tags) and e.status = 'live'));
end $$;

insert into public.notify_kinds (kind, lang, title, body) values
 ('class.announce','en','{title}','{text}'),('class.announce','az','{title}','{text}'),
 ('class.assignment','en','New assignment: {title}','Open it to see the details.'),('class.assignment','az','Yeni tapşırıq: {title}','Təfərrüatları görmək üçün açın.'),
 ('class.assignment_due','en','Deadline changed: {title}','Check the new deadline.'),('class.assignment_due','az','Son tarix dəyişdi: {title}','Yeni tarixə baxın.'),
 ('class.submission','en','New submission: {title}','{who}'),('class.submission','az','Yeni təhvil: {title}','{who}'),
 ('class.review_accept','en','Accepted: {title}','{note}'),('class.review_accept','az','Qəbul olundu: {title}','{note}'),
 ('class.review_changes','en','Changes requested: {title}','{note}'),('class.review_changes','az','Düzəliş istənilir: {title}','{note}'),
 ('class.issue','en','Class issue reported: {title}',''),('class.issue','az','Sinif problemi bildirildi: {title}',''),
 ('class.issue_update','en','Your report was updated: {title}','{status}'),('class.issue_update','az','Bildirişinizə baxıldı: {title}','{status}')
on conflict (kind, lang) do update set title = excluded.title, body = excluded.body;

do $$ declare f record; begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in
    ('_class_staff','_class_student_ids','_class_teacher_ids','class_announce','class_announce_edit','class_announce_remove','_asg_tag','_asg_subject_ok',
     'assignment_save','assignment_status','assignment_submit','assignment_review','_tg_asg_transition','class_issue_report','class_issue_update','_asg_path_ok',
     'class_overview','assignment_missing','teacher_home')
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f.sig);
    if f.proname not like '\_%' or f.proname in ('_class_staff','_asg_tag','_asg_subject_ok','_asg_path_ok') then
      execute format('grant execute on function %s to authenticated', f.sig); end if;
  end loop; end $$;
