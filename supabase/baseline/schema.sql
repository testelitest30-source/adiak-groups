-- ADIAK production schema baseline (schema only, NO data, NO secrets), reconstructed read-only from production catalogs.
-- Concatenation of supabase/baseline/0[1-6]_*.sql (the parts are the source; this file is generated). Verified by tests/db/parity.sql.
-- Local stand-ins for Supabase platform schemas live in 00_stubs.sql and are NOT part of this file.

-- ===== 01_tables.sql =====
-- Baseline (schema only, NO data) reconstructed read-only from production catalogs on 2026-11-09.
-- Used only to build the local test database. Never apply to production.
create table public.app_settings(key text not null, value text not null);
create table public.archived_messages(id bigint not null, archive_id bigint not null, channel text not null, channel_label text not null, sender uuid, body text not null, file_path text, file_name text, file_type text, file_size integer, created_at timestamp with time zone not null, participants uuid[]);
create table public.archives(id bigint generated always as identity not null, label text not null, created_at timestamp with time zone default now() not null, created_by uuid);
create table public.class_staff(user_id uuid not null, class_tag text not null, role text not null, perms text[] default '{}'::text[] not null);
create table public.classes(tag text not null, title text, created_at timestamp with time zone default now() not null);
create table public.feedback(id bigint generated always as identity not null, user_id uuid, class_tag text, body text not null, file_path text, file_name text, file_type text, status text default 'new'::text not null, tg_sent boolean default false not null, created_at timestamp with time zone default now() not null);
create table public.groups(id bigint generated always as identity not null, name text not null, capacity integer not null, host_id uuid, class_tag text);
create table public.invites(id bigint generated always as identity not null, group_id bigint not null, user_id uuid not null, invited_by uuid);
create table public.join_ballots(request_id bigint not null, voter_id uuid not null, approve boolean not null);
create table public.kick_ballots(kick_id bigint not null, voter_id uuid not null, approve boolean not null);
create table public.kicks(id bigint generated always as identity not null, group_id bigint not null, target_id uuid not null);
create table public.messages(id bigint generated always as identity not null, channel text not null, sender uuid, body text not null, created_at timestamp with time zone default now() not null, file_path text, file_name text, file_type text, file_size integer, class_tag text, edited_at timestamp with time zone, deleted boolean default false not null, reply_to bigint);
create table public.msg_reactions(msg_id bigint not null, user_id uuid not null, emoji text not null);
create table public.password_vault(user_id uuid not null, ct text not null, source text not null, updated_at timestamp with time zone default now() not null);
create table public.point_events(id bigint generated always as identity not null, user_id uuid not null, amount integer not null, kind text not null, created_at timestamp with time zone default now() not null);
create table public.profiles(id uuid not null, name text not null, login text not null, avatar text, points integer default 0 not null, group_id bigint, is_admin boolean default false not null, perms text[] default '{}'::text[] not null, role text default 'student'::text not null, pw_updated_at timestamp with time zone, class_tag text);
create table public.push_config(id integer not null, pub text, priv text, secret text default encode(extensions.gen_random_bytes(24), 'hex'::text) not null);
create table public.push_subs(id bigint generated always as identity not null, user_id uuid not null, endpoint text not null, p256dh text not null, auth text not null, created_at timestamp with time zone default now() not null);
create table public.requests(id bigint generated always as identity not null, user_id uuid not null, group_id bigint not null, stage text default 'pending'::text not null);
create table public.sessions(user_id uuid not null, sid text not null, updated_at timestamp with time zone default now() not null);
create table public.stickers(id bigint generated always as identity not null, owner uuid not null, path text not null, created_at timestamp with time zone default now() not null);
create table public.tags(id bigint generated always as identity not null, name text not null, emoji text default '🏷️'::text not null, color text default '#7c3aed'::text not null, descr text default ''::text not null, reward integer default 0 not null, rule text default 'manual'::text not null, rule_n integer default 0 not null, created_at timestamp with time zone default now() not null);
create table public.user_tags(user_id uuid not null, tag_id bigint not null, source text default 'manual'::text not null, created_at timestamp with time zone default now() not null);

alter table public.app_settings add constraint app_settings_pkey PRIMARY KEY (key);
alter table public.archived_messages add constraint archived_messages_pkey PRIMARY KEY (id);
alter table public.archives add constraint archives_pkey PRIMARY KEY (id);
alter table public.class_staff add constraint class_staff_pkey PRIMARY KEY (user_id, class_tag);
alter table public.class_staff add constraint class_staff_role_check CHECK ((role = ANY (ARRAY['teacher'::text, 'starosta'::text])));
alter table public.classes add constraint classes_pkey PRIMARY KEY (tag);
alter table public.classes add constraint classes_tag_check CHECK ((tag ~ '^[a-z0-9][a-z0-9_-]{0,11}$'::text));
alter table public.feedback add constraint feedback_body_check CHECK (((char_length(body) >= 3) AND (char_length(body) <= 2000)));
alter table public.feedback add constraint feedback_pkey PRIMARY KEY (id);
alter table public.feedback add constraint feedback_status_check CHECK ((status = ANY (ARRAY['new'::text, 'done'::text])));
alter table public.groups add constraint groups_capacity_check CHECK (((capacity >= 1) AND (capacity <= 10)));
alter table public.groups add constraint groups_class_tag_fmt CHECK (((class_tag IS NULL) OR (class_tag ~ '^[a-z0-9][a-z0-9_-]{0,11}$'::text)));
alter table public.groups add constraint groups_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 30)));
alter table public.groups add constraint groups_pkey PRIMARY KEY (id);
alter table public.invites add constraint invites_group_id_user_id_key UNIQUE (group_id, user_id);
alter table public.invites add constraint invites_pkey PRIMARY KEY (id);
alter table public.join_ballots add constraint join_ballots_pkey PRIMARY KEY (request_id, voter_id);
alter table public.kick_ballots add constraint kick_ballots_pkey PRIMARY KEY (kick_id, voter_id);
alter table public.kicks add constraint kicks_pkey PRIMARY KEY (id);
alter table public.kicks add constraint kicks_target_id_key UNIQUE (target_id);
alter table public.messages add constraint messages_body_check CHECK (((char_length(body) <= 1000) AND ((file_path IS NOT NULL) OR (char_length(body) >= 1))));
alter table public.messages add constraint messages_pkey PRIMARY KEY (id);
alter table public.msg_reactions add constraint msg_reactions_emoji_check CHECK ((emoji = ANY (ARRAY['👍'::text, '❤️'::text, '😂'::text, '😮'::text, '😢'::text, '🙏'::text])));
alter table public.msg_reactions add constraint msg_reactions_pkey PRIMARY KEY (msg_id, user_id);
alter table public.password_vault add constraint password_vault_pkey PRIMARY KEY (user_id);
alter table public.password_vault add constraint password_vault_source_check CHECK ((source = ANY (ARRAY['temp'::text, 'student'::text])));
alter table public.point_events add constraint point_events_kind_check CHECK ((kind = ANY (ARRAY['host'::text, 'self'::text])));
alter table public.point_events add constraint point_events_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_avatar_check CHECK ((char_length(avatar) <= 30000));
alter table public.profiles add constraint profiles_class_tag_fmt CHECK (((class_tag IS NULL) OR (class_tag ~ '^[a-z0-9][a-z0-9_-]{0,11}$'::text)));
alter table public.profiles add constraint profiles_login_key UNIQUE (login);
alter table public.profiles add constraint profiles_name_check CHECK (((char_length(name) >= 2) AND (char_length(name) <= 30)));
alter table public.profiles add constraint profiles_name_key UNIQUE (name);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_role_check CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text])));
alter table public.push_config add constraint push_config_id_check CHECK ((id = 1));
alter table public.push_config add constraint push_config_pkey PRIMARY KEY (id);
alter table public.push_subs add constraint push_subs_endpoint_key UNIQUE (endpoint);
alter table public.push_subs add constraint push_subs_pkey PRIMARY KEY (id);
alter table public.requests add constraint requests_pkey PRIMARY KEY (id);
alter table public.requests add constraint requests_stage_check CHECK ((stage = ANY (ARRAY['pending'::text, 'voting'::text, 'approved'::text])));
alter table public.requests add constraint requests_user_id_group_id_key UNIQUE (user_id, group_id);
alter table public.sessions add constraint sessions_pkey PRIMARY KEY (user_id);
alter table public.stickers add constraint stickers_owner_path_key UNIQUE (owner, path);
alter table public.stickers add constraint stickers_path_check CHECK ((char_length(path) <= 200));
alter table public.stickers add constraint stickers_pkey PRIMARY KEY (id);
alter table public.tags add constraint tags_color_check CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text));
alter table public.tags add constraint tags_descr_check CHECK ((char_length(descr) <= 300));
alter table public.tags add constraint tags_emoji_check CHECK ((char_length(emoji) <= 8));
alter table public.tags add constraint tags_name_check CHECK (((char_length(name) >= 1) AND (char_length(name) <= 24)));
alter table public.tags add constraint tags_name_key UNIQUE (name);
alter table public.tags add constraint tags_pkey PRIMARY KEY (id);
alter table public.tags add constraint tags_reward_check CHECK (((reward >= 0) AND (reward <= 1000)));
alter table public.tags add constraint tags_rule_check CHECK ((rule = ANY (ARRAY['manual'::text, 'points'::text, 'team'::text, 'host'::text])));
alter table public.tags add constraint tags_rule_n_check CHECK (((rule_n >= 0) AND (rule_n <= 100000)));
alter table public.user_tags add constraint user_tags_pkey PRIMARY KEY (user_id, tag_id);
alter table public.user_tags add constraint user_tags_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'auto'::text])));
alter table public.archived_messages add constraint archived_messages_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE;
alter table public.archived_messages add constraint archived_messages_sender_fkey FOREIGN KEY (sender) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.archives add constraint archives_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.class_staff add constraint class_staff_class_tag_fkey FOREIGN KEY (class_tag) REFERENCES classes(tag) ON UPDATE CASCADE ON DELETE CASCADE;
alter table public.class_staff add constraint class_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.feedback add constraint feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.groups add constraint groups_class_tag_fk FOREIGN KEY (class_tag) REFERENCES classes(tag) ON UPDATE CASCADE;
alter table public.groups add constraint groups_host_id_fkey FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.invites add constraint invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
alter table public.invites add constraint invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.invites add constraint invites_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.join_ballots add constraint join_ballots_request_id_fkey FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE;
alter table public.join_ballots add constraint join_ballots_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.kick_ballots add constraint kick_ballots_kick_id_fkey FOREIGN KEY (kick_id) REFERENCES kicks(id) ON DELETE CASCADE;
alter table public.kick_ballots add constraint kick_ballots_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.kicks add constraint kicks_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
alter table public.kicks add constraint kicks_target_id_fkey FOREIGN KEY (target_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_sender_fkey FOREIGN KEY (sender) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.msg_reactions add constraint msg_reactions_msg_id_fkey FOREIGN KEY (msg_id) REFERENCES messages(id) ON DELETE CASCADE;
alter table public.msg_reactions add constraint msg_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.password_vault add constraint password_vault_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.point_events add constraint point_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_class_tag_fk FOREIGN KEY (class_tag) REFERENCES classes(tag) ON UPDATE CASCADE;
alter table public.profiles add constraint profiles_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.push_subs add constraint push_subs_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.requests add constraint requests_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
alter table public.requests add constraint requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.sessions add constraint sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.stickers add constraint stickers_owner_fkey FOREIGN KEY (owner) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.user_tags add constraint user_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
alter table public.user_tags add constraint user_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
CREATE INDEX archived_messages_archive_id_channel_id_idx ON public.archived_messages USING btree (archive_id, channel, id);
CREATE INDEX messages_channel_id_idx ON public.messages USING btree (channel, id);
CREATE INDEX messages_file_idx ON public.messages USING btree (file_path) WHERE (file_path IS NOT NULL);
CREATE INDEX point_events_user_id_id_idx ON public.point_events USING btree (user_id, id);
alter table public.app_settings enable row level security;
alter table public.archived_messages enable row level security;
alter table public.archives enable row level security;
alter table public.class_staff enable row level security;
alter table public.classes enable row level security;
alter table public.feedback enable row level security;
alter table public.groups enable row level security;
alter table public.invites enable row level security;
alter table public.join_ballots enable row level security;
alter table public.kick_ballots enable row level security;
alter table public.kicks enable row level security;
alter table public.messages enable row level security;
alter table public.msg_reactions enable row level security;
alter table public.password_vault enable row level security;
alter table public.point_events enable row level security;
alter table public.profiles enable row level security;
alter table public.push_config enable row level security;
alter table public.push_subs enable row level security;
alter table public.requests enable row level security;
alter table public.sessions enable row level security;
alter table public.stickers enable row level security;
alter table public.tags enable row level security;
alter table public.user_tags enable row level security;

-- ===== 02_functions_a.sql =====
-- Baseline functions (part A: _accept .. _req_c), verbatim from production pg_get_functiondef.
CREATE OR REPLACE FUNCTION public._accept(u uuid, g bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare cap int; n int; nm text;
begin
 select capacity into cap from groups where id=g for update;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then delete from requests where group_id=g; delete from invites where group_id=g; return false; end if;
 update profiles set group_id=g where id=u returning name into nm;
 delete from requests where user_id=u;
 delete from invites where user_id=u;
 perform _fix_host(g);
 perform _say('g:'||g, nm||' joined the group 🎉');
 if n+1>=cap then delete from requests where group_id=g; delete from invites where group_id=g; perform _say('g:'||g,'The group is full.'); end if;
 return true;
end $function$
;
CREATE OR REPLACE FUNCTION public._can_class(tag text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select public._is_admin() or (tag is not null and (exists(select 1 from profiles me where me.id=auth.uid() and me.role='student' and me.class_tag=tag) or exists(select 1 from class_staff s where s.user_id=auth.uid() and s.class_tag=tag))) $function$
;
CREATE OR REPLACE FUNCTION public._can_see_user(o uuid, v uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select exists(select 1 from profiles po, profiles pv where po.id=o and pv.id=v and (
  po.id=pv.id or public._perm(pv.id,'admin') or public._perm(po.id,'admin')
  or (po.role='student' and ((pv.role='student' and pv.class_tag is not null and pv.class_tag=po.class_tag) or exists(select 1 from class_staff s where s.user_id=pv.id and s.class_tag=po.class_tag)))
  or (po.role='teacher' and exists(select 1 from class_staff so where so.user_id=po.id and (pv.class_tag=so.class_tag or exists(select 1 from class_staff sv where sv.user_id=pv.id and sv.class_tag=so.class_tag)))))) $function$
;
CREATE OR REPLACE FUNCTION public._chan_ok(ch text, u uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint; a uuid; b uuid;
begin
 if ch='all' then return true; end if;
 select group_id into g from profiles where id=u;
 if g is not null and ch='g:'||g then return true; end if;
 if ch like 'd:%' then a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  return a<>b and u in (a,b) and public._can_see_user(case when a=u then b else a end,u); end if;
 return false;
exception when others then return false;
end $function$
;
CREATE OR REPLACE FUNCTION public._check_join(r bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q requests; n int; need int; yea int; nay int; nm text;
begin
 select * into q from requests where id=r; if not found or q.stage<>'voting' then return; end if;
 select count(*) into n from profiles where group_id=q.group_id;
 need:=n/2+1;
 select count(*) filter (where b.approve), count(*) filter (where not b.approve) into yea,nay
  from join_ballots b join profiles p on p.id=b.voter_id and p.group_id=q.group_id where b.request_id=r;
 select name into nm from profiles where id=q.user_id;
 if yea>=need then
  update requests set stage='approved' where id=r;
  perform _say('g:'||q.group_id,'Majority approved '||nm||'. Waiting for the host''s final decision.');
 elsif n-nay<need then
  delete from requests where id=r;
  perform _say('g:'||q.group_id,'Request from '||nm||' was declined by the vote.');
 end if;
end $function$
;
CREATE OR REPLACE FUNCTION public._check_kick(k bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q kicks; n int; need int; yea int; nay int; nm text;
begin
 select * into q from kicks where id=k; if not found then return; end if;
 select count(*) into n from profiles where group_id=q.group_id and id<>q.target_id;
 need:=(4*n+4)/5;
 select count(*) filter (where b.approve), count(*) filter (where not b.approve) into yea,nay
  from kick_ballots b join profiles p on p.id=b.voter_id and p.group_id=q.group_id and p.id<>q.target_id where b.kick_id=k;
 select name into nm from profiles where id=q.target_id;
 if yea>=need then
  update profiles set group_id=null where id=q.target_id;
  delete from kicks where id=k;
  perform _fix_host(q.group_id);
  perform _say('g:'||q.group_id,nm||' was removed from the group (vote passed).');
 elsif n-nay<need then
  delete from kicks where id=k;
  perform _say('g:'||q.group_id,'Vote to remove '||nm||' failed.');
 end if;
end $function$
;
CREATE OR REPLACE FUNCTION public._chtag(ch text, ctag text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if ch='all' then return ctag; end if;
 if ch ~ '^g:[0-9]+$' then return (select class_tag from groups where id=substr(ch,3)::bigint); end if;
 if ch ~ '^d:[0-9a-f-]{36}:[0-9a-f-]{36}$' then return coalesce((select class_tag from profiles where id=split_part(ch,':',2)::uuid),(select class_tag from profiles where id=split_part(ch,':',3)::uuid)); end if;
 return null;
exception when others then return null;
end $function$
;
CREATE OR REPLACE FUNCTION public._cperm(tag text, p text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select public._is_admin() or (tag is not null and exists(select 1 from class_staff s where s.user_id=auth.uid() and s.class_tag=tag and p=any(s.perms))) $function$
;
CREATE OR REPLACE FUNCTION public._create_user(raw text, r text DEFAULT 'student'::text)
 RETURNS TABLE(new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare parts text[]; fn text; ln text; base text; idt text; k int:=1; nm text; pw text; u uuid:=gen_random_uuid();
 mp text:='əıöüçşğƏÖÜÇŞĞİ'; mt text:='eioucsgeoucsgi';
begin
 if r not in ('student','teacher') then raise exception 'Role must be student or teacher'; end if;
 raw:=regexp_replace(trim(coalesce(raw,'')),'\s+',' ','g'); if raw='' then raise exception 'Type a name'; end if;
 parts:=string_to_array(raw,' ');
 fn:=regexp_replace(lower(translate(parts[1],mp,mt)),'[^a-z0-9]','','g');
 ln:=regexp_replace(lower(translate(parts[array_length(parts,1)],mp,mt)),'[^a-z0-9]','','g');
 base:=case when array_length(parts,1)>1 and ln<>'' then fn||'.'||left(ln,1) else fn end; if base='' then base:='user'; end if;
 idt:=base; while exists(select 1 from auth.users where email=idt||'@classroom.app') loop k:=k+1; idt:=base||k; end loop;
 nm:=left(raw,30); k:=1; while exists(select 1 from profiles where name=nm) loop k:=k+1; nm:=left(raw,26)||' '||k; end loop;
 pw:=_pwgen();
 insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
 values('00000000-0000-0000-0000-000000000000',u,'authenticated','authenticated',idt||'@classroom.app',extensions.crypt(pw,extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"must_change":true}'::jsonb,now(),now(),'','','','');
 insert into auth.identities(id,user_id,identity_data,provider,provider_id,last_sign_in_at,created_at,updated_at)
 values(gen_random_uuid(),u,jsonb_build_object('sub',u::text,'email',idt||'@classroom.app','email_verified',true),'email',u::text,now(),now(),now());
 insert into profiles(id,name,login,role,perms) values(u,nm,idt||'@classroom.app',r,case when r='teacher' then '{points,groups}'::text[] else '{}'::text[] end);
 perform _pw_save(u,pw,'temp');
 new_name:=nm; new_login:=idt; temp_password:=pw; return next;
end $function$
;
CREATE OR REPLACE FUNCTION public._def_class()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select case when (select count(*) from classes c where public._can_class(c.tag))=1 then (select c.tag from classes c where public._can_class(c.tag)) end $function$
;
CREATE OR REPLACE FUNCTION public._fix_host(g bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ update groups set host_id = case when exists(select 1 from profiles where id=groups.host_id and group_id=g)
   then host_id else (select id from profiles where group_id=g order by name limit 1) end where id=g $function$
;
CREATE OR REPLACE FUNCTION public._group_tag_fill()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if new.class_tag is null and new.host_id is not null then select class_tag into new.class_tag from profiles where id=new.host_id; end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public._gtag(g bigint)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select class_tag from groups where id=g $function$
;
CREATE OR REPLACE FUNCTION public._is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select public._perm(auth.uid(),'admin') $function$
;
CREATE OR REPLACE FUNCTION public._msg_class()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if new.channel='all' and new.class_tag is null and new.sender is not null then
  select class_tag into new.class_tag from profiles where id=new.sender and role='student' and not public._perm(id,'admin');
  if new.class_tag is null then new.class_tag:=public._def_class(); end if;
 end if; return new; end $function$
;
CREATE OR REPLACE FUNCTION public._norm_tag(t text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
 select lower(regexp_replace(coalesce(t,''),'\s+','','g'))
$function$
;
CREATE OR REPLACE FUNCTION public._only_students_in_groups()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
 if new.group_id is not null and (new.role<>'student' or new.is_admin) then raise exception 'Only students can be placed in groups'; end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public._perm(u uuid, p text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists(select 1 from profiles where id=u and (is_admin or 'admin'=any(perms) or p=any(perms))) $function$
;
CREATE OR REPLACE FUNCTION public._ptag(u uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select class_tag from profiles where id=u $function$
;
CREATE OR REPLACE FUNCTION public._pw_key()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select decrypted_secret from vault.decrypted_secrets where name='pw_copy_key' $function$
;
CREATE OR REPLACE FUNCTION public._pw_save(u uuid, pw text, src text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if _perm(u,'admin') then delete from password_vault where user_id=u; return; end if;
 insert into password_vault(user_id,ct,source) values(u,encode(extensions.pgp_sym_encrypt(pw,_pw_key()),'base64'),src)
  on conflict (user_id) do update set ct=excluded.ct, source=excluded.source, updated_at=now();
 update profiles set pw_updated_at=now() where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public._pwgen()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select string_agg(substr('abcdefghjkmnpqrstuvwxyz23456789',(get_byte(b,i)%31)+1,1),'') from (select extensions.gen_random_bytes(8) b) x, generate_series(0,7) i $function$
;
CREATE OR REPLACE FUNCTION public._req(p text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if not _perm(auth.uid(),p) then raise exception 'You do not have permission for this action'; end if; end $function$
;
CREATE OR REPLACE FUNCTION public._req_admin()
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin if not _perm(auth.uid(),'admin') then raise exception 'Admins only'; end if; end $function$
;
CREATE OR REPLACE FUNCTION public._req_c(p text, tag text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin if not public._cperm(tag,p) then raise exception 'You do not have permission for this action'; end if; end $function$
;

-- ===== 03_functions_b.sql =====
-- Baseline functions (part B: _same_class_in_group .. admin_import_students), from production pg_get_functiondef.
-- (CRLF line endings in a few production bodies are normalised to LF here; logic is identical.)
CREATE OR REPLACE FUNCTION public._same_class_in_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare gt text;
begin
 if new.group_id is not null and (tg_op='INSERT' or new.group_id is distinct from old.group_id or new.class_tag is distinct from old.class_tag) then
  select class_tag into gt from groups where id=new.group_id;
  if new.class_tag is null then raise exception 'Enter your class group number first'; end if;
  if gt is distinct from new.class_tag then raise exception 'This team belongs to another class group'; end if;
 end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION public._say(ch text, t text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ insert into messages(channel,sender,body) values(ch,null,t) $function$
;
CREATE OR REPLACE FUNCTION public._set_temp(u uuid, p text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 update auth.users set encrypted_password=extensions.crypt(p,extensions.gen_salt('bf')),
  raw_user_meta_data=coalesce(raw_user_meta_data,'{}'::jsonb)||'{"must_change":true}'::jsonb, updated_at=now() where id=u;
 delete from auth.sessions where user_id=u;
 update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u;
 perform _pw_save(u,p,'temp');
end $function$
;
CREATE OR REPLACE FUNCTION public._tag_award(u uuid, t tags, src text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 insert into user_tags(user_id,tag_id,source) values(u,t.id,src) on conflict do nothing;
 if found and t.reward>0 then update profiles set points=points+t.reward where id=u; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public._tags_eval(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t tags; p profiles;
begin
 select * into p from profiles where id=u;
 if not found or p.is_admin or p.role<>'student' then return; end if;
 for t in select * from tags where rule<>'manual' loop
  if (t.rule='points' and p.points>=t.rule_n) or (t.rule='team' and p.group_id is not null)
     or (t.rule='host' and exists(select 1 from groups g where g.host_id=u)) then
   perform _tag_award(u,t,'auto');
  end if;
 end loop;
end $function$
;
CREATE OR REPLACE FUNCTION public._tg_grp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin if new.host_id is not null then perform _tags_eval(new.host_id); end if; return null; end $function$
;
CREATE OR REPLACE FUNCTION public._tg_prof()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _tags_eval(new.id); return null; end $function$
;
CREATE OR REPLACE FUNCTION public._tg_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare sec text;
begin
 if new.sender is null then return null; end if;
 select secret into sec from push_config where id=1;
 perform net.http_post(url:='https://epenklutnevjvgpsjehp.supabase.co/functions/v1/push-send',
  headers:=jsonb_build_object('Content-Type','application/json','x-push-secret',sec),
  body:=jsonb_build_object('mid',new.id));
 return null;
exception when others then return null;
end $function$
;
CREATE OR REPLACE FUNCTION public.add_points(u uuid, n integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not public._cperm(public._ptag(u),'points') then raise exception 'You do not have permission to give points'; end if;
 if n is null or n=0 or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin and role='student';
 if not found then raise exception 'That account cannot receive points'; end if;
 insert into point_events(user_id,amount,kind) values(u,n,'host');
end $function$
;
CREATE OR REPLACE FUNCTION public.add_sticker(pth text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
     begin
      if auth.uid() is null or not exists(select 1 from profiles where id=auth.uid()) then raise exception 'Not signed in'; end if;
       if not exists(select 1 from storage.objects where bucket_id='stickers' and name=pth) then raise exception 'Sticker file not found'; end if;
        if (select count(*) from stickers where owner=auth.uid())>=60 then raise exception 'Sticker limit reached (60)'; end if;
         insert into stickers(owner,path) values(auth.uid(),pth) on conflict do nothing;
         end $function$
;
CREATE OR REPLACE FUNCTION public.admin_add_students(cls text, names text[])
 RETURNS TABLE(new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare i int; r record; nm text;
begin perform public._req_c('accounts',cls);
 if not exists(select 1 from classes where tag=cls) then raise exception 'That class group does not exist'; end if;
 if names is null or array_length(names,1) is null then raise exception 'No names given'; end if;
 if array_length(names,1)>60 then raise exception 'At most 60 names at a time'; end if;
 for i in 1..array_length(names,1) loop
  nm:=regexp_replace(trim(names[i]),'\s+',' ','g'); continue when nm='';
  select * into r from _create_user(nm,'student');
  update profiles set class_tag=cls where login=r.new_login||'@classroom.app';
  new_name:=r.new_name; new_login:=r.new_login; temp_password:=r.temp_password; return next;
 end loop;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_clear_all_chats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin perform _req_admin(); delete from messages; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_clear_channel(ch text, cls text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tg text;
begin tg:=case when ch='all' then coalesce(cls,public._def_class()) else public._chtag(ch,null) end; perform public._req_c('chats',tg);
 if ch='all' then delete from messages where channel='all' and class_tag=tg; else delete from messages where channel=ch; end if; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_close_day(lbl text, dissolve boolean)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a bigint;
begin perform _req_admin();
 insert into archives(label,created_by) values(coalesce(nullif(trim(lbl),''),'Archive '||to_char(now(),'YYYY-MM-DD')),auth.uid()) returning id into a;
 insert into archived_messages(id,archive_id,channel,channel_label,sender,body,file_path,file_name,file_type,file_size,created_at,participants)
  select m.id,a,m.channel,
   case when m.channel='all' then 'Everyone'
        when m.channel like 'g:%' then coalesce((select name from groups where id=split_part(m.channel,':',2)::bigint),'Group')
        else coalesce((select string_agg(name,' & ' order by name) from profiles where id in (split_part(m.channel,':',2)::uuid,split_part(m.channel,':',3)::uuid)),'Chat') end,
   m.sender,m.body,m.file_path,m.file_name,m.file_type,m.file_size,m.created_at,
   case when m.channel='all' then null
        when m.channel like 'g:%' then coalesce((select array_agg(p.id) from profiles p where p.group_id=split_part(m.channel,':',2)::bigint),'{}')
        else array[split_part(m.channel,':',2)::uuid,split_part(m.channel,':',3)::uuid] end
  from messages m;
 delete from messages;
 if dissolve then delete from groups; end if;
 return a;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_create_class(t text, ttl text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v text;
begin perform _req_admin(); v:=_norm_tag(t);
 if v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if exists(select 1 from classes where tag=v) then raise exception 'That class group already exists'; end if;
 insert into classes(tag,title) values(v,nullif(trim(coalesce(ttl,'')),''));
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_create_user(raw text, r text DEFAULT 'student'::text)
 RETURNS TABLE(new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); return query select * from _create_user(raw,r); end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_feedback(i bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from feedback where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_group(g bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public._req_c('groups',public._gtag(g)); delete from messages where channel='g:'||g; delete from groups where id=g; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_message(i bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tg text;
begin select public._chtag(channel,class_tag) into tg from messages where id=i; perform public._req_c('chats',tg); delete from messages where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_tag(i bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from tags where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_delete_user(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; g bigint;
begin
 select * into p from profiles where id=u;
 if not found then raise exception 'Person not found'; end if;
 if u=auth.uid() then raise exception 'You cannot delete yourself'; end if;
 if p.is_admin then raise exception 'Admin accounts cannot be deleted here'; end if;
 perform public._req_c('accounts',p.class_tag);
 g:=p.group_id;
 if g is not null then
  update profiles set group_id=null where id=u;
  delete from kicks where target_id=u;
  perform _fix_host(g);
  if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 end if;
 delete from messages where sender=u;
 delete from auth.users where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_force_logout(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from auth.sessions where user_id=u; update sessions set sid='revoked-'||gen_random_uuid()::text, updated_at=now() where user_id=u; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_get_password(u uuid)
 RETURNS TABLE(pw text, source text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public._req_c('passwords',public._ptag(u));
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 if not public._is_admin() and not exists(select 1 from profiles where id=u and role='student') then raise exception 'You do not have permission for this action'; end if;
 return query select case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
  case when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source else 'stale' end, v.updated_at
  from password_vault v join auth.users a on a.id=v.user_id where v.user_id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_give_tag(u uuid, t bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g tags;
begin perform _req_admin(); select * into g from tags where id=t; if not found then raise exception 'Tag not found'; end if;
 if not exists(select 1 from profiles where id=u and role='student' and not is_admin) then raise exception 'Only students can get tags'; end if;
 perform _tag_award(u,g,'manual'); end $function$
;
CREATE OR REPLACE FUNCTION public.admin_group_update(g bigint, nm text, cap integer, host uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public._req_c('groups',public._gtag(g));
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if cap<(select count(*) from profiles where group_id=g) then raise exception 'The group already has more members than that'; end if;
 if host is not null and not exists(select 1 from profiles where id=host and group_id=g) then raise exception 'The host must be a member of the group'; end if;
 update groups set name=trim(nm), capacity=cap, host_id=coalesce(host,host_id) where id=g;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_import_students(names text[])
 RETURNS TABLE(slot_name text, new_name text, new_login text, temp_password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare slots uuid[]; i int; j int:=0; raw text; parts text[]; fn text; ln text; base text; idt text; k int; nm text; pw text; u uuid; olds text;
begin perform _req_admin();
 -- only accounts nobody has claimed yet (password never changed) are given to the new names
 select array_agg(p.id order by p.login) into slots from profiles p join auth.users a on a.id=p.id
  where not p.is_admin and coalesce(a.raw_user_meta_data->>'must_change','')='true';
 if names is null or array_length(names,1) is null then raise exception 'No names given'; end if;
 if array_length(names,1)>coalesce(array_length(slots,1),0) then raise exception 'Only % unused accounts are left, but % names were given',coalesce(array_length(slots,1),0),array_length(names,1); end if;
 for i in 1..array_length(names,1) loop
  raw:=regexp_replace(trim(names[i]),'\s+',' ','g'); continue when raw='';
  j:=j+1; u:=slots[j]; parts:=string_to_array(raw,' ');
  fn:=regexp_replace(translate(lower(parts[1]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  ln:=regexp_replace(translate(lower(parts[array_length(parts,1)]),'əıöüçşğ','eioucsg'),'[^a-z0-9]','','g');
  base:=case when array_length(parts,1)>1 and ln<>'' then fn||'.'||left(ln,1) else fn end;
  if base='' then base:='student'||j; end if;
  idt:=base; k:=1;
  while exists(select 1 from auth.users where email=idt||'@classroom.app' and id<>u) loop k:=k+1; idt:=base||k; end loop;
  nm:=left(raw,30); k:=1;
  while exists(select 1 from profiles where name=nm and id<>u) loop k:=k+1; nm:=left(raw,26)||' '||k; end loop;
  select name into olds from profiles where id=u; pw:=_pwgen();
  update profiles set name=nm, login=idt||'@classroom.app' where id=u;
  update auth.users set email=idt||'@classroom.app' where id=u;
  update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(idt||'@classroom.app')) where user_id=u and provider='email';
  perform _set_temp(u,pw);
  slot_name:=olds; new_name:=nm; new_login:=idt; temp_password:=pw; return next;
 end loop;
end $function$
;

-- ===== 04_functions_c.sql =====
-- Baseline functions (part C: admin_list_passwords .. edit_message), from production pg_get_functiondef.
CREATE OR REPLACE FUNCTION public.admin_list_passwords()
 RETURNS TABLE(user_id uuid, name text, login text, role text, pw text, source text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not (public._is_admin() or exists(select 1 from class_staff where class_staff.user_id=auth.uid() and 'passwords'=any(class_staff.perms))) then raise exception 'You do not have permission for this action'; end if;
 return query select p.id,p.name,p.login,p.role,
  case when v.ct is not null and a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()) end,
  case when v.ct is null then null when a.encrypted_password=extensions.crypt(extensions.pgp_sym_decrypt(decode(v.ct,'base64'),_pw_key()),a.encrypted_password) then v.source else 'stale' end, v.updated_at
  from profiles p join auth.users a on a.id=p.id left join password_vault v on v.user_id=p.id
  where not _perm(p.id,'admin') and (public._is_admin() or (p.role='student' and public._cperm(p.class_tag,'passwords'))) order by p.name;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_move_member(u uuid, g bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare old bigint; nm text; cap int; n int;
begin perform public._req_c('groups',public._gtag(g));
 select group_id,name into old,nm from profiles where id=u;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap and old is distinct from g then raise exception 'That group is full'; end if;
 update profiles set group_id=g where id=u; delete from requests where user_id=u; delete from invites where user_id=u; delete from kicks where target_id=u;
 if old is not null and old<>g then perform _fix_host(old); end if;
 perform _fix_host(g); perform _say('g:'||g,nm||' was added to this group.');
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_remove_member(u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint; nm text;
begin perform public._req_c('groups',public._ptag(u));
 select group_id,name into g,nm from profiles where id=u; if g is null then return; end if;
 update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g);
 if not exists(select 1 from profiles where group_id=g) then delete from requests where group_id=g; end if;
 perform _say('g:'||g,nm||' was removed from the group.');
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_remove_staff(u uuid, cls text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from class_staff where user_id=u and class_tag=cls;
 update profiles set perms=array_remove(perms,'panel') where id=u and role='student' and not exists(select 1 from class_staff where user_id=u);
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_reset_all()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 delete from messages; delete from archives; delete from point_events; delete from groups;
 update profiles set points=0, group_id=null;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_reset_password(u uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p text;
begin perform public._req_c('passwords',public._ptag(u));
 if _perm(u,'admin') then raise exception 'Admin passwords are private. Only the admin can change their own password.'; end if;
 if not public._is_admin() and not exists(select 1 from profiles where id=u and role='student') then raise exception 'You do not have permission for this action'; end if;
 p:=_pwgen(); perform _set_temp(u,p); return p; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_save_tag(i bigint, nm text, em text, col text, ds text, rw integer, rl text, rn integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid;
begin perform _req_admin();
 if trim(coalesce(nm,''))='' then raise exception 'Type a tag name'; end if;
 if i is null then
  insert into tags(name,emoji,color,descr,reward,rule,rule_n)
  values(trim(nm),coalesce(nullif(trim(em),''),'🏷️'),coalesce(col,'#7c3aed'),coalesce(ds,''),coalesce(rw,0),coalesce(rl,'manual'),coalesce(rn,0)) returning id into i;
 else
  update tags set name=trim(nm),emoji=coalesce(nullif(trim(em),''),'🏷️'),color=coalesce(col,'#7c3aed'),descr=coalesce(ds,''),reward=coalesce(rw,0),rule=coalesce(rl,'manual'),rule_n=coalesce(rn,0) where id=i;
  if not found then raise exception 'Tag not found'; end if;
 end if;
 for u in select id from profiles where role='student' and not is_admin loop perform _tags_eval(u); end loop;
 return i;
exception when unique_violation then raise exception 'A tag with that name already exists';
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_class_tag(u uuid, t text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; v text;
begin perform _req_admin();
 select * into p from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 v:=nullif(_norm_tag(t),'');
 if v is not null and v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if v is not null and not exists(select 1 from classes where tag=v) then raise exception 'That class group does not exist'; end if;
 if p.group_id is not null and v is distinct from p.class_tag then raise exception 'Remove the person from their team first'; end if;
 update profiles set class_tag=v where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_feedback(i bigint, s text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); if s not in ('new','done') then raise exception 'Invalid status'; end if; update feedback set status=s where id=i; end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_login(u uuid, idt text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e text;
begin perform _req_admin(); idt:=lower(trim(idt));
 if idt !~ '^[a-z0-9._-]{2,40}$' then raise exception 'ID: 2-40 characters, letters, digits, dot, dash, underscore'; end if;
 e:=idt||'@classroom.app';
 if exists(select 1 from auth.users where email=e and id<>u) then raise exception 'That ID is already used'; end if;
 update auth.users set email=e, updated_at=now() where id=u;
 update auth.identities set identity_data=jsonb_set(identity_data,'{email}',to_jsonb(e)) where user_id=u and provider='email';
 update profiles set login=e where id=u;
 return e;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_name(u uuid, nm text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if not (public._is_admin() or (public._cperm(public._ptag(u),'accounts') and exists(select 1 from profiles where id=u and role='student' and not is_admin))) then raise exception 'Admins only'; end if;
 nm:=trim(nm);
 if char_length(nm) not between 2 and 30 then raise exception 'Name must be 2 to 30 characters'; end if;
 update profiles set name=nm where id=u;
exception when unique_violation then raise exception 'That name is already taken';
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_perms(u uuid, p text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 if not (p <@ array['admin','points','groups','chats','passwords','panel']) then raise exception 'Unknown permission'; end if;
 if u=auth.uid() and not 'admin'=any(p) and not exists(select 1 from profiles where id=u and is_admin) then raise exception 'You cannot remove your own admin right'; end if;
 update profiles set perms=p where id=u;
 update class_staff set perms=(select coalesce(array_agg(x),'{}') from unnest(p) x where x in ('points','groups','chats','passwords','accounts')) where user_id=u and role='teacher';
 if 'admin'=any(p) then delete from password_vault where user_id=u; end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_role(u uuid, r text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g bigint;
begin perform _req_admin();
 if r not in ('student','teacher') then raise exception 'Role must be student or teacher'; end if;
 if exists(select 1 from profiles where id=u and is_admin) then raise exception 'The Host account has no role'; end if;
 if r='teacher' then
  select group_id into g from profiles where id=u;
  if g is not null then update profiles set group_id=null where id=u; delete from kicks where target_id=u; perform _fix_host(g); end if;
  delete from requests where user_id=u; delete from invites where user_id=u;
 end if;
 update profiles set role=r where id=u;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_setting(k text, v text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin();
 if k<>'max_groups' then raise exception 'Unknown setting'; end if;
 if v !~ '^[0-9]{1,2}$' or v::int not between 1 and 12 then raise exception 'Choose 1 to 12'; end if;
 if v::int<(select count(*) from groups) then raise exception 'There are already more groups than that'; end if;
 update app_settings set value=v where key=k;
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_set_staff(u uuid, cls text, r text, p text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pr profiles;
begin perform _req_admin();
 select * into pr from profiles where id=u; if not found then raise exception 'Person not found'; end if;
 if not exists(select 1 from classes where tag=cls) then raise exception 'That class group does not exist'; end if;
 if r not in ('teacher','starosta') then raise exception 'Role must be teacher or class representative'; end if;
 if p is null or not (p <@ array['points','groups','chats','passwords','accounts']) then raise exception 'Unknown permission'; end if;
 if r='teacher' and (pr.role<>'teacher' or pr.is_admin) then raise exception 'That person is not a teacher'; end if;
 if r='starosta' and (pr.role<>'student' or pr.is_admin or pr.class_tag is distinct from cls) then raise exception 'The class representative must be a student of that class'; end if;
 insert into class_staff(user_id,class_tag,role,perms) values(u,cls,r,p) on conflict (user_id,class_tag) do update set role=excluded.role, perms=excluded.perms;
 update profiles set perms=perms||array['panel'] where id=u and not ('panel'=any(perms));
end $function$
;
CREATE OR REPLACE FUNCTION public.admin_take_tag(u uuid, t bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform _req_admin(); delete from user_tags where user_id=u and tag_id=t; end $function$
;
CREATE OR REPLACE FUNCTION public.cancel_invite(i bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ delete from invites where id=i and (invited_by=auth.uid() or _perm(auth.uid(),'groups')) $function$
;
CREATE OR REPLACE FUNCTION public.cancel_request(g bigint)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ delete from requests where user_id=auth.uid() and group_id=g $function$
;
CREATE OR REPLACE FUNCTION public.claim_session(s text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ insert into sessions(user_id,sid) values(auth.uid(),s) on conflict (user_id) do update set sid=excluded.sid, updated_at=now() $function$
;
CREATE OR REPLACE FUNCTION public.class_choices()
 RETURNS TABLE(tag text, title text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select c.tag,c.title from classes c
 where exists(select 1 from profiles me where me.id=auth.uid() and me.role='student' and me.class_tag is null and not public._perm(me.id,'admin'))
 order by c.tag $function$
;
CREATE OR REPLACE FUNCTION public.create_group(nm text, cap integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; gid bigint; mx int;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.group_id is not null then raise exception 'Only idle students can create a group'; end if;
 if p.class_tag is null then raise exception 'Enter your class group number first'; end if;
 if cap is null or cap not between 1 and 10 then raise exception 'Size must be 1 to 10'; end if;
 if nm is null or char_length(trim(nm)) not between 1 and 30 then raise exception 'Group name must be 1 to 30 characters'; end if;
 select value::int into mx from app_settings where key='max_groups';
 if (select count(*) from groups where class_tag=p.class_tag)>=coalesce(mx,6) then raise exception 'The group limit (%) is reached', coalesce(mx,6); end if;
 insert into groups(name,capacity,host_id,class_tag) values(trim(nm),cap,p.id,p.class_tag) returning id into gid;
 update profiles set group_id=gid where id=p.id;
 delete from requests where user_id=p.id;
 perform _say('g:'||gid,p.name||' created the group.');
end $function$
;
CREATE OR REPLACE FUNCTION public.delete_message(mid bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
       begin
        update messages set deleted=true, body='', file_path=null, file_name=null, file_type=null, file_size=null
          where id=mid and not deleted and (sender=auth.uid() or public._is_admin());
           if not found then raise exception 'You cannot delete this message'; end if;
           end $function$
;
CREATE OR REPLACE FUNCTION public.delete_sticker(sid bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
         begin delete from stickers where id=sid and owner=auth.uid(); end $function$
;
CREATE OR REPLACE FUNCTION public.drop_push(ep text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin delete from push_subs where endpoint=ep and user_id=auth.uid(); end $function$
;
CREATE OR REPLACE FUNCTION public.edit_message(mid bigint, b text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    declare t text:=trim(b);
    begin
     if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
      update messages set body=t, edited_at=now() where id=mid and sender=auth.uid() and not deleted and file_path is null;
       if not found then raise exception 'You cannot edit this message'; end if;
       end $function$
;

-- ===== 05_functions_d.sql =====
-- Baseline functions (part D: host_decide .. vote_kick), from production pg_get_functiondef.
CREATE OR REPLACE FUNCTION public.host_decide(r bigint, ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q requests; p profiles; nm text;
begin
 select * into p from profiles where id=auth.uid();
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not _perm(p.id,'groups') and not exists(select 1 from groups where id=q.group_id and host_id=p.id) then raise exception 'Only the group host makes the final decision'; end if;
 if q.stage<>'approved' then raise exception 'The members have not approved this request yet'; end if;
 select name into nm from profiles where id=q.user_id;
 if ok then
  if not _accept(q.user_id,q.group_id) then raise exception 'The group is full'; end if;
 else
  delete from requests where id=r;
  perform _say('g:'||q.group_id,'The host declined '||nm||'.');
 end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.leave_group()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles;
begin
 select * into p from profiles where id=auth.uid();
 if not found or p.group_id is null then return; end if;
 update profiles set group_id=null where id=p.id;
 delete from kicks where target_id=p.id;
 perform _fix_host(p.group_id);
 if not exists(select 1 from profiles where group_id=p.group_id) then delete from requests where group_id=p.group_id; end if;
 perform _say('g:'||p.group_id,p.name||' left the group.');
end $function$
;
CREATE OR REPLACE FUNCTION public.open_vote(r bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q requests; nm text;
begin
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then raise exception 'Only members of this group can open a vote'; end if;
 if q.stage<>'pending' then raise exception 'A vote was already opened for this request'; end if;
 update requests set stage='voting' where id=r;
 select name into nm from profiles where id=q.user_id;
 perform _say('g:'||q.group_id,'Vote opened: should '||nm||' join? Members, please vote.');
 perform _check_join(r);
end $function$
;
CREATE OR REPLACE FUNCTION public.push_targets(mid bigint)
 RETURNS TABLE(endpoint text, p256dh text, auth text, title text, body text, ch text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select s.endpoint, s.p256dh, s.auth,
  case when m.channel='all' then coalesce(pr.name,'?')||' · '||coalesce(m.class_tag,'')
       when m.channel like 'g:%' then coalesce(pr.name,'?')||' · '||coalesce((select g.name from groups g where 'g:'||g.id=m.channel),'')
       else coalesce(pr.name,'?') end,
  case when m.file_type='sticker' then '🎭 Sticker' when m.file_path is not null then '📎 '||coalesce(m.file_name,'File') else left(m.body,140) end,
  m.channel
 from messages m
 join profiles pr on pr.id=m.sender
 join profiles u on u.id<>m.sender and public._chan_ok(m.channel,u.id) and (m.channel<>'all' or u.class_tag is not distinct from m.class_tag)
 join push_subs s on s.user_id=u.id
 where m.id=mid and not m.deleted;
$function$
;
CREATE OR REPLACE FUNCTION public.request_join(g bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; n int; cap int;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin then raise exception 'The host account cannot join groups'; end if;
 if p.group_id is not null then raise exception 'Leave your current group first'; end if;
 if p.class_tag is null then raise exception 'Enter your class group number first'; end if;
 select capacity into cap from groups where id=g; if not found then raise exception 'Group not found'; end if;
 if (select class_tag from groups where id=g) is distinct from p.class_tag then raise exception 'This team belongs to another class group'; end if;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then raise exception 'This group is full'; end if;
 if n=0 then perform _accept(p.id,g); return; end if;
 if not exists(select 1 from requests where user_id=p.id and group_id=g) then
  insert into requests(user_id,group_id) values(p.id,g);
  perform _say('g:'||g,p.name||' wants to join. A member can put the request to a vote.');
 end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.respond_invite(i bigint, ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q invites; me profiles;
begin
 select * into me from profiles where id=auth.uid();
 select * into q from invites where id=i and user_id=auth.uid();
 if not found then raise exception 'This invitation is no longer open'; end if;
 if ok then
  if me.group_id is not null then raise exception 'Leave your group first'; end if;
  if not _accept(me.id,q.group_id) then raise exception 'That group is full'; end if;
 else
  delete from invites where id=i;
  perform _say('g:'||q.group_id,me.name||' declined the invitation.');
 end if;
end $function$
;
CREATE OR REPLACE FUNCTION public.save_push(ep text, p text, a text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 insert into push_subs(user_id,endpoint,p256dh,auth) values(auth.uid(),ep,p,a)
 on conflict(endpoint) do update set user_id=auth.uid(), p256dh=p, auth=a;
end $function$
;
CREATE OR REPLACE FUNCTION public.send_feedback(b text, fp text DEFAULT NULL::text, fn text DEFAULT NULL::text, ft text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; t text:=trim(b); i bigint;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if t is null or char_length(t) not between 3 and 2000 then raise exception 'Write between 3 and 2000 characters'; end if;
 if fp is not null and left(fp,length(auth.uid()::text)+1)<>auth.uid()::text||'/' then raise exception 'Invalid file'; end if;
 if (select count(*) from feedback where user_id=p.id and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many feedback messages. Try again later.'; end if;
 insert into feedback(user_id,class_tag,body,file_path,file_name,file_type) values(p.id,p.class_tag,t,fp,left(fn,120),left(ft,120)) returning id into i;
 return i;
end $function$
;
CREATE OR REPLACE FUNCTION public.send_file(ch text, path text, fname text, ftype text, fsize integer, caption text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if not _chan_ok(ch,p.id) then raise exception 'Invalid chat'; end if;
 if path is null or split_part(path,'/',1)<>p.id::text or not exists(select 1 from storage.objects where bucket_id='chat-files' and name=path) then raise exception 'File upload not found'; end if;
 if fsize is null or fsize<=0 or fsize>26214400 then raise exception 'File must be under 25 MB'; end if;
 insert into messages(channel,sender,body,file_path,file_name,file_type,file_size)
  values(ch,p.id,left(trim(coalesce(caption,'')),1000),path,left(coalesce(fname,'file'),120),left(coalesce(ftype,''),100),fsize);
end $function$
;
CREATE OR REPLACE FUNCTION public.send_invite(g bigint, u uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; t profiles; n int; cap int;
begin
 select * into p from profiles where id=auth.uid();
 select * into t from profiles where id=u;
 if not found or t.is_admin then raise exception 'Person not found'; end if;
 if not exists(select 1 from groups where id=g and host_id=p.id) then raise exception 'Only the group host can invite'; end if;
 if t.group_id is not null then raise exception 'That person is already in a group'; end if;
 if t.class_tag is distinct from (select class_tag from groups where id=g) then raise exception 'That person is in another class group'; end if;
 select capacity into cap from groups where id=g;
 select count(*) into n from profiles where group_id=g;
 if n>=cap then raise exception 'Your group is full'; end if;
 if exists(select 1 from requests where user_id=u and group_id=g) then
  perform _accept(u,g); return;
 end if;
 insert into invites(group_id,user_id,invited_by) values(g,u,p.id) on conflict do nothing;
 perform _say('g:'||g,p.name||' invited '||t.name||'.');
end $function$
;
CREATE OR REPLACE FUNCTION public.send_message(ch text, body text, cls text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; a uuid; b uuid; t text; tg text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 t:=trim(body); if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
 if ch='all' then
  if p.role='student' and not public._is_admin() then tg:=p.class_tag; if tg is null then raise exception 'Enter your class group number first'; end if; else tg:=coalesce(cls,public._def_class()); end if;
  if tg is null then raise exception 'Choose a class first'; end if;
  if not public._can_class(tg) then raise exception 'Invalid chat'; end if;
 elsif ch='g:'||coalesce(p.group_id::text,'-') then null;
 elsif ch like 'd:%' then
  a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  if a=b or p.id not in (a,b) or not public._can_see_user(case when a=p.id then b else a end) then raise exception 'Invalid chat'; end if;
 else raise exception 'Invalid chat'; end if;
 insert into messages(channel,sender,body,class_tag) values(ch,p.id,t,case when ch='all' then tg end);
end $function$
;
CREATE OR REPLACE FUNCTION public.send_reply(ch text, body text, cls text DEFAULT NULL::text, rep bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
           declare p profiles; t text; tg text;
           begin
            select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
             t:=trim(body); if t is null or char_length(t) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters'; end if;
              if not _chan_ok(ch,p.id) then raise exception 'Invalid chat'; end if;
               if rep is not null and not exists(select 1 from messages where id=rep and channel=ch) then raise exception 'Invalid chat'; end if;
                if ch='all' then
                  if p.role='student' and not public._is_admin() then tg:=p.class_tag; if tg is null then raise exception 'Enter your class group number first'; end if; else tg:=coalesce(cls,public._def_class()); end if;
                    if tg is null then raise exception 'Choose a class first'; end if;
                      if not public._can_class(tg) then raise exception 'Invalid chat'; end if;
                       end if;
                        insert into messages(channel,sender,body,class_tag,reply_to) values(ch,p.id,t,case when ch='all' then tg end,rep);
                        end $function$
;
CREATE OR REPLACE FUNCTION public.send_sticker(ch text, sid bigint, cls text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
         declare p profiles; s stickers; tg text;
         begin
          select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
           select * into s from stickers where id=sid and owner=p.id; if not found then raise exception 'Sticker not found'; end if;
            if not _chan_ok(ch,p.id) then raise exception 'Invalid chat'; end if;
             if ch='all' then
               if p.role='student' and not public._is_admin() then tg:=p.class_tag; if tg is null then raise exception 'Enter your class group number first'; end if; else tg:=coalesce(cls,public._def_class()); end if;
                 if tg is null then raise exception 'Choose a class first'; end if;
                   if not public._can_class(tg) then raise exception 'Invalid chat'; end if;
                    end if;
                     insert into messages(channel,sender,body,file_path,file_name,file_type,file_size,class_tag)
                      values(ch,p.id,'','s/'||s.path,'sticker','sticker',1,case when ch='all' then tg end);
                      end $function$
;
CREATE OR REPLACE FUNCTION public.set_my_class_tag(t text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; v text;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if p.is_admin or p.role<>'student' then raise exception 'Only students have a class group number'; end if;
 if p.class_tag is not null then raise exception 'Your class group number is already set. Ask an admin to change it'; end if;
 v:=_norm_tag(t);
 if v !~ '^[a-z0-9][a-z0-9_-]{0,11}$' then raise exception 'Class group number: 1 to 12 letters or digits, for example 636s'; end if;
 if not exists(select 1 from classes where tag=v) then raise exception 'That class group does not exist'; end if;
 update profiles set class_tag=v where id=p.id;
end $function$
;
CREATE OR REPLACE FUNCTION public.set_my_password_copy(pw text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 if not exists(select 1 from auth.users where id=auth.uid() and encrypted_password=extensions.crypt(pw,encrypted_password)) then raise exception 'That is not your current password'; end if;
 perform _pw_save(auth.uid(),pw,'student');
end $function$
;
CREATE OR REPLACE FUNCTION public.staff_classes()
 RETURNS TABLE(tag text, title text, role text, perms text[], students integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 select c.tag,c.title,'admin'::text,array['points','groups','chats','passwords','accounts'],(select count(*)::int from profiles p where p.class_tag=c.tag and p.role='student' and not p.is_admin) from classes c where public._is_admin()
 union all
 select c.tag,c.title,s.role,s.perms,(select count(*)::int from profiles p where p.class_tag=c.tag and p.role='student' and not p.is_admin) from class_staff s join classes c on c.tag=s.class_tag where s.user_id=auth.uid() and not public._is_admin()
 order by 1 $function$
;
CREATE OR REPLACE FUNCTION public.start_kick(t uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p profiles; tg profiles; kid bigint;
begin
 select * into p from profiles where id=auth.uid();
 select * into tg from profiles where id=t;
 if not found or tg.group_id is null then raise exception 'That person is not in a group'; end if;
 if t=p.id then raise exception 'Use Leave group instead'; end if;
 if not _perm(p.id,'groups') and not exists(select 1 from groups where id=tg.group_id and host_id=p.id) then
  raise exception 'Only the group host or admin can start a kick vote'; end if;
 if exists(select 1 from kicks where target_id=t) then raise exception 'A vote is already open for this person'; end if;
 insert into kicks(group_id,target_id) values(tg.group_id,t) returning id into kid;
 if p.group_id=tg.group_id then insert into kick_ballots values(kid,p.id,true); end if;
 perform _say('g:'||tg.group_id,'Kick vote started for '||tg.name||'. 80% of the other members must approve.');
 perform _check_kick(kid);
end $function$
;
CREATE OR REPLACE FUNCTION public.toggle_reaction(mid bigint, e text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                        declare m messages; cur text;
                        begin
                         select * into m from messages where id=mid; if not found or m.deleted then raise exception 'Message not found'; end if;
                          if not _chan_ok(m.channel,auth.uid()) then raise exception 'Invalid chat'; end if;
                           select emoji into cur from msg_reactions where msg_id=mid and user_id=auth.uid();
                            if cur is null then insert into msg_reactions(msg_id,user_id,emoji) values(mid,auth.uid(),e);
                             elsif cur=e then delete from msg_reactions where msg_id=mid and user_id=auth.uid();
                              else update msg_reactions set emoji=e where msg_id=mid and user_id=auth.uid(); end if;
                              end $function$
;
CREATE OR REPLACE FUNCTION public.update_me(nm text, av text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if nm is not null then nm:=trim(nm); if char_length(nm) not between 2 and 30 then raise exception 'Name must be 2 to 30 characters'; end if; end if;
 update profiles set name=coalesce(nm,name), avatar=coalesce(av,avatar) where id=auth.uid();
exception when unique_violation then raise exception 'That name is already taken';
end $function$
;
CREATE OR REPLACE FUNCTION public.vote_join(r bigint, ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q requests;
begin
 select * into q from requests where id=r; if not found then raise exception 'This request is no longer open'; end if;
 if not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then raise exception 'Only members of this group can vote'; end if;
 if q.stage<>'voting' then raise exception 'Voting is not open for this request'; end if;
 insert into join_ballots values(r,auth.uid(),ok) on conflict (request_id,voter_id) do update set approve=excluded.approve;
 perform _check_join(r);
end $function$
;
CREATE OR REPLACE FUNCTION public.vote_kick(k bigint, ok boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q kicks;
begin
 select * into q from kicks where id=k; if not found then raise exception 'This vote is closed'; end if;
 if auth.uid()=q.target_id or not exists(select 1 from profiles where id=auth.uid() and group_id=q.group_id) then
  raise exception 'Only the other members of this group can vote'; end if;
 insert into kick_ballots values(k,auth.uid(),ok) on conflict (kick_id,voter_id) do update set approve=excluded.approve;
 perform _check_kick(k);
end $function$
;

-- ===== 06_triggers_policies_grants.sql =====
-- Baseline triggers, policies, buckets, settings, realtime publication and grants, from production catalogs.
CREATE TRIGGER group_tag_fill BEFORE INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION _group_tag_fill();
CREATE TRIGGER msg_class BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION _msg_class();
CREATE TRIGGER only_students_in_groups BEFORE INSERT OR UPDATE OF group_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION _only_students_in_groups();
CREATE TRIGGER same_class_in_group BEFORE INSERT OR UPDATE OF group_id, class_tag ON public.profiles FOR EACH ROW EXECUTE FUNCTION _same_class_in_group();
CREATE TRIGGER tg_push AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION _tg_push();
CREATE TRIGGER tg_tags_grp AFTER INSERT OR UPDATE OF host_id ON public.groups FOR EACH ROW EXECUTE FUNCTION _tg_grp();
CREATE TRIGGER tg_tags_prof AFTER UPDATE OF points, group_id ON public.profiles FOR EACH ROW EXECUTE FUNCTION _tg_prof();

create policy chat_read on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'chat-files'::text) AND ((EXISTS ( SELECT 1
   FROM messages m
  WHERE (m.file_path = objects.name))) OR (EXISTS ( SELECT 1
   FROM archived_messages a
  WHERE (a.file_path = objects.name))))));
create policy chat_upload on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'chat-files'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy fb_r on public.feedback as PERMISSIVE for SELECT to authenticated using (_is_admin());
create policy fb_rd on storage.objects as PERMISSIVE for SELECT to authenticated using (((bucket_id = 'feedback'::text) AND _is_admin()));
create policy fb_up on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'feedback'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy own on public.sessions as PERMISSIVE for SELECT to authenticated using ((user_id = auth.uid()));
create policy r on public.app_settings as PERMISSIVE for SELECT to authenticated using (true);
create policy r on public.archived_messages as PERMISSIVE for SELECT to public using ((_is_admin() OR (auth.uid() = ANY (participants))));
create policy r on public.archives as PERMISSIVE for SELECT to authenticated using (true);
create policy r on public.class_staff as PERMISSIVE for SELECT to public using (((user_id = auth.uid()) OR _can_class(class_tag)));
create policy r on public.classes as PERMISSIVE for SELECT to public using (_can_class(tag));
create policy r on public.groups as PERMISSIVE for SELECT to public using (_can_class(class_tag));
create policy r on public.invites as PERMISSIVE for SELECT to public using (_can_class(_gtag(group_id)));
create policy r on public.join_ballots as PERMISSIVE for SELECT to public using (_can_class(_ptag(voter_id)));
create policy r on public.kick_ballots as PERMISSIVE for SELECT to public using (_can_class(_ptag(voter_id)));
create policy r on public.kicks as PERMISSIVE for SELECT to public using (_can_class(_gtag(group_id)));
create policy r on public.messages as PERMISSIVE for SELECT to public using ((((channel = 'all'::text) AND _can_class(class_tag)) OR (channel = ('g:'::text || ( SELECT (profiles.group_id)::text AS group_id
   FROM profiles
  WHERE (profiles.id = auth.uid())))) OR ((channel ~~ 'd:%'::text) AND (((auth.uid())::text = split_part(channel, ':'::text, 2)) OR ((auth.uid())::text = split_part(channel, ':'::text, 3)))) OR _cperm(_chtag(channel, class_tag), 'chats'::text)));
create policy r on public.point_events as PERMISSIVE for SELECT to public using (_can_class(_ptag(user_id)));
create policy r on public.profiles as PERMISSIVE for SELECT to public using (((id = auth.uid()) OR _can_see_user(id)));
create policy r on public.requests as PERMISSIVE for SELECT to public using (_can_class(_gtag(group_id)));
create policy rx_r on public.msg_reactions as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM messages m
  WHERE (m.id = msg_reactions.msg_id))));
create policy stk_r on public.stickers as PERMISSIVE for SELECT to authenticated using ((owner = auth.uid()));
create policy stk_read on storage.objects as PERMISSIVE for SELECT to authenticated using ((bucket_id = 'stickers'::text));
create policy stk_upload on storage.objects as PERMISSIVE for INSERT to authenticated with check (((bucket_id = 'stickers'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy tags_r on public.tags as PERMISSIVE for SELECT to authenticated using (true);
create policy utags_r on public.user_tags as PERMISSIVE for SELECT to authenticated using (true);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('chat-files','chat-files',false,26214400,NULL);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('feedback','feedback',false,10485760,NULL);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('stickers','stickers',false,1048576,'{image/png,image/webp,image/jpeg,image/gif}');
insert into public.app_settings values ('max_groups','6');
insert into public.push_config(id) values (1);

alter publication supabase_realtime add table public.profiles, public.groups, public.requests, public.join_ballots, public.kicks,
  public.kick_ballots, public.messages, public.invites, public.app_settings, public.sessions, public.tags, public.user_tags, public.msg_reactions;

-- Table grants as in production (Supabase default privileges: anon/authenticated/service_role have all table privileges; RLS restricts).
grant all on all tables in schema public to anon, authenticated, service_role;
-- ...except these 9 tables, which production had already locked down (verified 2026-11-09 against information_schema.role_table_grants):
revoke all on public.class_staff, public.classes, public.groups, public.join_ballots, public.kick_ballots, public.kicks, public.messages, public.profiles, public.requests, public.password_vault from anon, authenticated;
grant select on public.class_staff, public.classes, public.groups, public.join_ballots, public.kick_ballots, public.kicks, public.messages, public.profiles, public.requests to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
-- Function grants exactly as in production (pg_proc.proacl on 2026-11-09).
revoke all on all functions in schema public from public, anon, authenticated, service_role;
grant execute on all functions in schema public to service_role;
grant execute on function public._norm_tag(text), public._group_tag_fill(), public._same_class_in_group(), public._tg_prof(), public._tg_grp() to public;
grant execute on function public._norm_tag(text), public._group_tag_fill(), public._same_class_in_group(), public._tg_prof(), public._tg_grp() to anon, authenticated;
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p where p.pronamespace='public'::regnamespace and p.proname not in
    ('_accept','_check_join','_check_kick','_req_admin','_fix_host','_pwgen','_set_temp','_say','_pw_save','_only_students_in_groups',
     '_req','_pw_key','_create_user','_norm_tag','_group_tag_fill','_same_class_in_group','_tg_prof','_tg_grp')
  loop execute format('grant execute on function %s to authenticated', f.sig); end loop; end $$;
