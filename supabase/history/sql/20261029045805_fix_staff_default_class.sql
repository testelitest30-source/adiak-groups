create or replace function public._def_class() returns text language sql stable security definer set search_path to 'public' as $f$
 select case when (select count(*) from classes c where public._can_class(c.tag))=1 then (select c.tag from classes c where public._can_class(c.tag)) end $f$;
create or replace function public._msg_class() returns trigger language plpgsql security definer set search_path to 'public' as $f$
begin if new.channel='all' and new.class_tag is null and new.sender is not null then
  select class_tag into new.class_tag from profiles where id=new.sender and role='student' and not public._perm(id,'admin');
  if new.class_tag is null then new.class_tag:=public._def_class(); end if;
 end if; return new; end $f$;
create or replace function public.send_message(ch text,body text,cls text default null) returns void language plpgsql security definer set search_path to 'public' as $f$
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
end $f$;
create or replace function public.admin_clear_channel(ch text,cls text default null) returns void language plpgsql security definer set search_path to 'public' as $f$
declare tg text;
begin tg:=case when ch='all' then coalesce(cls,public._def_class()) else public._chtag(ch,null) end; perform public._req_c('chats',tg);
 if ch='all' then delete from messages where channel='all' and class_tag=tg; else delete from messages where channel=ch; end if; end $f$;
revoke all on function public._def_class() from public, anon; grant execute on function public._def_class() to authenticated;