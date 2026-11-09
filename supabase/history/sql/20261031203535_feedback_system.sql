create table if not exists public.feedback(
 id bigint generated always as identity primary key,
 user_id uuid references public.profiles(id) on delete set null,
 class_tag text,
 body text not null check(char_length(body) between 3 and 2000),
 file_path text, file_name text, file_type text,
 status text not null default 'new' check(status in ('new','done')),
 tg_sent boolean not null default false,
 created_at timestamptz not null default now());
alter table public.feedback enable row level security;
drop policy if exists fb_r on public.feedback;
create policy fb_r on public.feedback for select to authenticated using(public._is_admin());

insert into storage.buckets(id,name,public,file_size_limit) values('feedback','feedback',false,10485760) on conflict(id) do nothing;
drop policy if exists fb_up on storage.objects;
create policy fb_up on storage.objects for insert to authenticated with check(bucket_id='feedback' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists fb_rd on storage.objects;
create policy fb_rd on storage.objects for select to authenticated using(bucket_id='feedback' and public._is_admin());

create or replace function public.send_feedback(b text, fp text default null, fn text default null, ft text default null) returns bigint
language plpgsql security definer set search_path to 'public' as $$
declare p profiles; t text:=trim(b); i bigint;
begin
 select * into p from profiles where id=auth.uid(); if not found then raise exception 'Not signed in'; end if;
 if t is null or char_length(t) not between 3 and 2000 then raise exception 'Write between 3 and 2000 characters'; end if;
 if fp is not null and left(fp,length(auth.uid()::text)+1)<>auth.uid()::text||'/' then raise exception 'Invalid file'; end if;
 if (select count(*) from feedback where user_id=p.id and created_at>now()-interval '1 hour')>=5 then raise exception 'Too many feedback messages. Try again later.'; end if;
 insert into feedback(user_id,class_tag,body,file_path,file_name,file_type) values(p.id,p.class_tag,t,fp,left(fn,120),left(ft,120)) returning id into i;
 return i;
end $$;

create or replace function public.admin_set_feedback(i bigint, s text) returns void
language plpgsql security definer set search_path to 'public' as $$
begin perform _req_admin(); if s not in ('new','done') then raise exception 'Invalid status'; end if; update feedback set status=s where id=i; end $$;

create or replace function public.admin_delete_feedback(i bigint) returns void
language plpgsql security definer set search_path to 'public' as $$
begin perform _req_admin(); delete from feedback where id=i; end $$;

revoke execute on function public.send_feedback(text,text,text,text), public.admin_set_feedback(bigint,text), public.admin_delete_feedback(bigint) from public, anon;
grant execute on function public.send_feedback(text,text,text,text), public.admin_set_feedback(bigint,text), public.admin_delete_feedback(bigint) to authenticated;