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
