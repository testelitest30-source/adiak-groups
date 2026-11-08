-- ADIAK 1.0 / M5 server-side notifications for existing events (so they persist and reach closed apps),
-- scheduled-reminder function (pg_cron job itself is a separate, separately approved migration), push templates.
-- Only NEW triggers are added to existing tables; existing functions are not modified.
do $$ begin
  if to_regprocedure('public._notify(uuid[],text,jsonb,jsonb,text)') is null then raise exception 'pre-flight: M1 must be applied first'; end if;
  if to_regprocedure('public.pres_due_reminders(timestamptz)') is not null then raise exception 'pre-flight: M5 already applied'; end if;
end $$;

create or replace function public._fold(t text) returns text
 language sql immutable set search_path = pg_catalog as $$
  select lower(translate(coalesce(t, ''), 'əıöüçşğƏIÖÜÇŞĞİ', 'eioucsgeioucsgi')) $$;

create or replace function public._grp_ids(g bigint, except_u uuid default null) returns uuid[]
 language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce(array_agg(id), '{}') from public.profiles where group_id = g and (except_u is null or id <> except_u) $$;

create or replace function public._ts() returns text language sql stable set search_path = pg_catalog as $$
  select (extract(epoch from clock_timestamp()) * 1000)::bigint::text $$;

-- join requests: new / voting / approved / closed
create or replace function public._tg_n_requests() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare nm text; gn text; host uuid;
begin
  if tg_op = 'DELETE' then
    select name into gn from public.groups where id = old.group_id;
    if auth.uid() is distinct from old.user_id
       and not exists (select 1 from public.profiles where id = old.user_id and group_id = old.group_id) then
      perform public._notify(array[old.user_id], 'req.declined', jsonb_build_object('g', gn), '{"k":"req"}', 'reqx:' || old.id);
    end if;
    return null;
  end if;
  select name into nm from public.profiles where id = new.user_id;
  select name, host_id into gn, host from public.groups where id = new.group_id;
  if tg_op = 'INSERT' then
    perform public._notify(public._grp_ids(new.group_id), 'req.new', jsonb_build_object('nm', nm, 'g', gn), '{"k":"req"}', 'req:' || new.id);
  elsif new.stage is distinct from old.stage then
    if new.stage = 'voting' then
      perform public._notify(public._grp_ids(new.group_id), 'req.voting', jsonb_build_object('nm', nm, 'g', gn), '{"k":"req"}', 'reqv:' || new.id);
      perform public._notify(array[new.user_id], 'req.voting_mine', jsonb_build_object('g', gn), '{"k":"req"}', 'reqvm:' || new.id);
    elsif new.stage = 'approved' then
      perform public._notify(array[host], 'req.approved_host', jsonb_build_object('nm', nm, 'g', gn), '{"k":"req"}', 'reqa:' || new.id);
      perform public._notify(array[new.user_id], 'req.approved_mine', jsonb_build_object('g', gn), '{"k":"req"}', 'reqam:' || new.id);
    end if;
  end if;
  return null;
end $$;
create trigger tg_n_requests after insert or update or delete on public.requests for each row execute function public._tg_n_requests();

create or replace function public._tg_n_invites() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public._notify(array[new.user_id], 'inv.new', jsonb_build_object('g', (select name from public.groups where id = new.group_id)), '{"k":"req"}', 'inv:' || new.id);
  return null;
end $$;
create trigger tg_n_invites after insert on public.invites for each row execute function public._tg_n_invites();

create or replace function public._tg_n_kicks() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public._notify(public._grp_ids(new.group_id, new.target_id), 'kick.vote',
    jsonb_build_object('nm', (select name from public.profiles where id = new.target_id)), '{"k":"req"}', 'kick:' || new.id);
  return null;
end $$;
create trigger tg_n_kicks after insert on public.kicks for each row execute function public._tg_n_kicks();

create or replace function public._tg_n_points() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.amount > 0 then
    perform public._notify(array[new.user_id], 'points.add',
      jsonb_build_object('n', new.amount, 'total', (select points from public.profiles where id = new.user_id)), '{"k":"home"}', 'pts:' || new.id);
  end if;
  return null;
end $$;
create trigger tg_n_points after insert on public.point_events for each row execute function public._tg_n_points();

create or replace function public._tg_n_tags() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare t public.tags;
begin
  select * into t from public.tags where id = new.tag_id;
  perform public._notify(array[new.user_id], 'tag.new', jsonb_build_object('name', t.name, 'emoji', t.emoji), '{"k":"home"}', 'tag:' || new.tag_id);
  return null;
end $$;
create trigger tg_n_tags after insert on public.user_tags for each row execute function public._tg_n_tags();

create or replace function public._tg_n_membership() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare gn text; ts text := public._ts();
begin
  if old.group_id is not distinct from new.group_id then return null; end if;
  if new.group_id is not null then
    select name into gn from public.groups where id = new.group_id;
    perform public._notify(array[new.id], 'group.joined', jsonb_build_object('g', gn), jsonb_build_object('k', 'group', 'id', new.group_id), 'gj:' || new.group_id || ':' || ts);
    perform public._notify(public._grp_ids(new.group_id, new.id), 'group.member_joined', jsonb_build_object('nm', new.name, 'g', gn),
      jsonb_build_object('k', 'group', 'id', new.group_id), 'gmj:' || new.id || ':' || ts);
  end if;
  if old.group_id is not null and auth.uid() is distinct from new.id then
    select name into gn from public.groups where id = old.group_id;
    perform public._notify(array[new.id], 'group.removed', jsonb_build_object('g', coalesce(gn, '')), '{"k":"groups"}', 'gr:' || old.group_id || ':' || ts);
  end if;
  return null;
end $$;
create trigger tg_n_membership after update of group_id on public.profiles for each row execute function public._tg_n_membership();

-- @mentions in the class-wide chat (same rule as the client: @Firstname, Azerbaijani letters folded)
create or replace function public._tg_n_mentions() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
declare toks text[]; who uuid[];
begin
  if new.sender is null or new.channel <> 'all' or position('@' in new.body) = 0 then return null; end if;
  select array_agg(distinct public._fold(m[1])) into toks from regexp_matches(new.body, '(?:^|\s)@([[:alnum:]_.-]{2,30})', 'g') as m;
  if toks is null then return null; end if;
  select array_agg(p.id) into who from public.profiles p
   where p.id <> new.sender and p.class_tag is not distinct from new.class_tag
     and public._fold(split_part(p.name, ' ', 1)) = any (toks);
  if who is not null then
    perform public._notify(who, 'chat.mention', jsonb_build_object('nm', (select name from public.profiles where id = new.sender), 'text', left(new.body, 120)),
      jsonb_build_object('k', 'chat', 'ch', 'all', 'mid', new.id), 'men:' || new.id);
  end if;
  return null;
end $$;
create trigger tg_n_mentions after insert on public.messages for each row execute function public._tg_n_mentions();

-- ================= scheduled reminders (class C) =================
-- 24 h reminder when 2h < due-now <= 24h; 2 h reminder when 0 < due-now <= 2h. The dedupe key contains the deadline,
-- so a changed deadline yields new, correctly timed reminders while repeated runs never duplicate.
create or replace function public.pres_due_reminders(at_ts timestamptz default null) returns int
 language plpgsql set search_path = pg_catalog, public as $$
declare t0 timestamptz := coalesce(at_ts, now()); r record; n int := 0; k text;
begin
  perform public._svc_only();
  for r in
    select ev.id e, ev.title, ev.final_due, et.group_id g
      from public.pres_events ev join public.pres_event_teams et on et.event_id = ev.id and et.removed_at is null
     where ev.status in ('open','drawn') and ev.final_due > t0 and ev.final_due <= t0 + interval '24 hours'
       and et.final_state <> 'approved'
  loop
    k := case when r.final_due - t0 <= interval '2 hours' then 'rem2' else 'rem24' end;
    n := n + public._notify(public._pres_team_ids(r.e, r.g), 'pres.' || k,
      jsonb_build_object('title', r.title, 'due', r.final_due), public._pres_tgt(r.e, r.g, 'files'),
      k || ':' || r.e || ':' || extract(epoch from r.final_due)::bigint);
  end loop;
  return n;
end $$;

-- ================= push text templates (client renders its own translations) =================
insert into public.notify_kinds (kind, lang, title, body) values
 ('pres.opened','en','New presentation: {title}','Open it to see your team workspace.'),
 ('pres.opened','az','Yeni təqdimat: {title}','Komanda iş sahənizi görmək üçün açın.'),
 ('pres.team_added','en','Your team takes part in {title}',''),('pres.team_added','az','Komandanız {title} təqdimatında iştirak edir',''),
 ('pres.draw','en','Draw result: you present #{pos} of {n}','{title}'),('pres.draw','az','Püşk nəticəsi: {n} komandadan {pos}-cisiniz','{title}'),
 ('pres.redraw','en','New draw (round {round}): you present #{pos}','{title}'),('pres.redraw','az','Yeni püşk ({round}-ci tur): {pos}-cisiniz','{title}'),
 ('pres.redraw_needed','en','Team list changed: a new draw is needed','{title}'),('pres.redraw_needed','az','Komanda siyahısı dəyişdi: yeni püşk lazımdır','{title}'),
 ('pres.order_submitted','en','{team} submitted its speaking order','Review and approve it.'),('pres.order_submitted','az','{team} çıxış sırasını göndərdi','Yoxlayın və təsdiqləyin.'),
 ('pres.order_approved','en','Speaking order approved','{title}'),('pres.order_approved','az','Çıxış sırası təsdiqləndi','{title}'),
 ('pres.order_returned','en','Speaking order reopened','{note}'),('pres.order_returned','az','Çıxış sırası yenidən açıldı','{note}'),
 ('pres.order_reopened','en','{who} left: choose positions again','{title}'),('pres.order_reopened','az','{who} komandadan çıxdı: yerləri yenidən seçin','{title}'),
 ('pres.order_review','en','{team}: approved order needs review','{who} left the team.'),('pres.order_review','az','{team}: təsdiqlənmiş sıra yoxlanmalıdır','{who} komandadan çıxdı.'),
 ('pres.final_submitted','en','{team} submitted final version {v}','{file}'),('pres.final_submitted','az','{team} final versiyanı göndərdi (v{v})','{file}'),
 ('pres.final_approved','en','Final presentation approved (v{v})','{title}'),('pres.final_approved','az','Final təqdimat təsdiqləndi (v{v})','{title}'),
 ('pres.final_returned','en','Final version returned for corrections','{note}'),('pres.final_returned','az','Final versiya düzəliş üçün qaytarıldı','{note}'),
 ('pres.task_assigned','en','New task: {task}','{title}'),('pres.task_assigned','az','Yeni tapşırıq: {task}','{title}'),
 ('pres.announce','en','Announcement: {title}','{text}'),('pres.announce','az','Elan: {title}','{text}'),
 ('pres.due_changed','en','Deadline changed: {title}','Check the new deadline.'),('pres.due_changed','az','Son tarix dəyişdi: {title}','Yeni tarixə baxın.'),
 ('pres.rem24','en','Final presentation due in 24 hours','{title}'),('pres.rem24','az','Final təqdimatın son tarixinə 24 saat qalıb','{title}'),
 ('pres.rem2','en','Final presentation due in 2 hours','{title}'),('pres.rem2','az','Final təqdimatın son tarixinə 2 saat qalıb','{title}'),
 ('pres.live_now','en','Your team is presenting now','{title}'),('pres.live_now','az','İndi sizin komandanız çıxış edir','{title}'),
 ('pres.next_up','en','Your team is up next','{title}'),('pres.next_up','az','Növbəti sizin komandanızdır','{title}'),
 ('pres.scores','en','Feedback published','{title}'),('pres.scores','az','Rəy və qiymətlər dərc olundu','{title}'),
 ('req.new','en','{nm} wants to join {g}','Open Requests'),('req.new','az','{nm} {g} qrupuna qoşulmaq istəyir','Müraciətləri açın'),
 ('req.voting','en','Vote opened for {nm}','Cast your vote in Requests'),('req.voting','az','{nm} üçün səsvermə açıldı','Müraciətlərdə səs verin'),
 ('req.voting_mine','en','Members are voting on your request','{g}'),('req.voting_mine','az','Üzvlər müraciətinizə səs verir','{g}'),
 ('req.approved_host','en','Majority approved {nm}','Your final decision is needed'),('req.approved_host','az','Əksəriyyət {nm} üçün razılıq verdi','Son qərarınız lazımdır'),
 ('req.approved_mine','en','Members approved your request','Waiting for the host''s final decision'),('req.approved_mine','az','Üzvlər müraciətinizi təsdiqlədi','Hostun son qərarı gözlənilir'),
 ('req.declined','en','Your join request was closed','{g}'),('req.declined','az','Qoşulma müraciətiniz bağlandı','{g}'),
 ('inv.new','en','{g} invited you!','Open Requests to accept'),('inv.new','az','{g} sizi dəvət etdi!','Qəbul etmək üçün Müraciətləri açın'),
 ('kick.vote','en','Kick vote for {nm}','Cast your vote in Requests'),('kick.vote','az','{nm} üçün çıxarma səsverməsi','Müraciətlərdə səs verin'),
 ('points.add','en','+{n} points!','Your total is now {total}'),('points.add','az','+{n} xal!','Cəmi xalınız: {total}'),
 ('tag.new','en','New tag! {emoji} {name}',''),('tag.new','az','Yeni nişan! {emoji} {name}',''),
 ('group.joined','en','You joined {g}','Welcome to the group!'),('group.joined','az','{g} qrupuna qoşuldunuz','Qrupa xoş gəldiniz!'),
 ('group.member_joined','en','{nm} joined your group',''),('group.member_joined','az','{nm} qrupunuza qoşuldu',''),
 ('group.removed','en','You are no longer in {g}',''),('group.removed','az','Artıq {g} qrupunda deyilsiniz',''),
 ('chat.mention','en','{nm} mentioned you','{text}'),('chat.mention','az','{nm} sizi qeyd etdi','{text}')
on conflict (kind, lang) do update set title = excluded.title, body = excluded.body;

-- ================= grants =================
revoke all on function public._fold(text), public._grp_ids(bigint, uuid), public._ts(), public._tg_n_requests(), public._tg_n_invites(),
  public._tg_n_kicks(), public._tg_n_points(), public._tg_n_tags(), public._tg_n_membership(), public._tg_n_mentions(),
  public.pres_due_reminders(timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.pres_due_reminders(timestamptz) to service_role;
-- class C reminder job runs as service_role/postgres and needs these internal helpers
grant execute on function public._notify(uuid[], text, jsonb, jsonb, text), public._pres_team_ids(bigint, bigint), public._pres_tgt(bigint, bigint, text, bigint) to service_role;
