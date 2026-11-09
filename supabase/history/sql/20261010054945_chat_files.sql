alter table messages add column file_path text, add column file_name text, add column file_type text, add column file_size int;
alter table messages drop constraint messages_body_check;
alter table messages add constraint messages_body_check check (char_length(body)<=1000 and (file_path is not null or char_length(body)>=1));
create index messages_file_idx on messages(file_path) where file_path is not null;

create function _chan_ok(ch text, u uuid) returns boolean language plpgsql stable security definer set search_path=public as $$
declare g bigint; a uuid; b uuid;
begin
 if ch='all' then return true; end if;
 select group_id into g from profiles where id=u;
 if g is not null and ch='g:'||g then return true; end if;
 if ch like 'd:%' then
  a:=split_part(ch,':',2)::uuid; b:=split_part(ch,':',3)::uuid;
  return a<>b and u in (a,b) and exists(select 1 from profiles where id=a) and exists(select 1 from profiles where id=b);
 end if;
 return false;
exception when others then return false;
end $$;

create function send_file(ch text, path text, fname text, ftype text, fsize int, caption text) returns void language plpgsql security definer set search_path=public as $$
declare p profiles;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if not _chan_ok(ch,p.id) then raise exception 'Invalid chat'; end if;
 if path is null or split_part(path,'/',1)<>p.id::text or not exists(select 1 from storage.objects where bucket_id='chat-files' and name=path) then raise exception 'File upload not found'; end if;
 if fsize is null or fsize<=0 or fsize>26214400 then raise exception 'File must be under 25 MB'; end if;
 insert into messages(channel,sender,body,file_path,file_name,file_type,file_size)
  values(ch,p.id,left(trim(coalesce(caption,'')),1000),path,left(coalesce(fname,'file'),120),left(coalesce(ftype,''),100),fsize);
end $$;

revoke execute on function _chan_ok(text,uuid), send_file(text,text,text,text,int,text) from public, anon, authenticated;
grant execute on function send_file(text,text,text,text,int,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit) values('chat-files','chat-files',false,26214400) on conflict (id) do nothing;
create policy chat_upload on storage.objects for insert to authenticated
 with check (bucket_id='chat-files' and (storage.foldername(name))[1]=auth.uid()::text);
create policy chat_read on storage.objects for select to authenticated
 using (bucket_id='chat-files' and exists(select 1 from public.messages m where m.file_path=name));