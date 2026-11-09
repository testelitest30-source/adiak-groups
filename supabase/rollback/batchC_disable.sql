-- ADIAK 1.0 Batch C + M9 NON-DESTRUCTIVE rollback: restores the reviewed pre-change definitions and grants.
-- Keeps every table and row. send_message returns to its batch-A (M4) version.
begin;
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
 elsif ch like 'p:%' then
  -- ADIAK 1.0: presentation event chat
  if not public._chan_ok(ch,p.id) then raise exception 'Invalid chat'; end if;
 else raise exception 'Invalid chat'; end if;
 insert into messages(channel,sender,body,class_tag) values(ch,p.id,t,case when ch='all' then tg end);
end $function$;
grant execute on function public.push_targets(bigint), public._chan_ok(text, uuid), public._def_class(), public._msg_class(), public._perm(uuid, text),
  public._req(text), public._req_c(text, text), public._req_admin(), public._tag_award(uuid, public.tags, text), public._tags_eval(uuid), public._tg_push(),
  public._norm_tag(text), public._tg_grp(), public._tg_prof(), public._group_tag_fill(), public._same_class_in_group(), public._only_students_in_groups() to authenticated;
grant execute on function public._norm_tag(text), public._group_tag_fill(), public._same_class_in_group(), public._tg_prof(), public._tg_grp() to public;
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename in ('app_settings','archived_messages','archives','class_staff','classes','feedback',
    'groups','invites','join_ballots','kick_ballots','kicks','messages','msg_reactions','password_vault','point_events','profiles','push_config','push_subs',
    'requests','sessions','stickers','tags','user_tags')
  loop execute format('grant all on public.%I to anon, authenticated', t); end loop; end $$;
commit;
