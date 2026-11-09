create extension if not exists pg_net;
create table if not exists public.push_config(
 id int primary key check(id=1), pub text, priv text,
 secret text not null default encode(gen_random_bytes(24),'hex'));
alter table public.push_config enable row level security;
insert into public.push_config(id) values(1) on conflict do nothing;
create table if not exists public.push_subs(
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 endpoint text not null unique, p256dh text not null, auth text not null,
 created_at timestamptz not null default now());
alter table public.push_subs enable row level security;

create or replace function public.save_push(ep text, p text, a text) returns void
language plpgsql security definer set search_path to 'public' as $$
begin
 if auth.uid() is null then raise exception 'Not signed in'; end if;
 insert into push_subs(user_id,endpoint,p256dh,auth) values(auth.uid(),ep,p,a)
 on conflict(endpoint) do update set user_id=auth.uid(), p256dh=p, auth=a;
end $$;
create or replace function public.drop_push(ep text) returns void
language plpgsql security definer set search_path to 'public' as $$
begin delete from push_subs where endpoint=ep and user_id=auth.uid(); end $$;

create or replace function public.push_targets(mid bigint)
returns table(endpoint text, p256dh text, auth text, title text, body text, ch text)
language sql security definer set search_path to 'public' as $$
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
$$;

create or replace function public._tg_push() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare sec text;
begin
 if new.sender is null then return null; end if;
 select secret into sec from push_config where id=1;
 perform net.http_post(url:='https://epenklutnevjvgpsjehp.supabase.co/functions/v1/push-send',
  headers:=jsonb_build_object('Content-Type','application/json','x-push-secret',sec),
  body:=jsonb_build_object('mid',new.id));
 return null;
exception when others then return null;
end $$;
drop trigger if exists tg_push on public.messages;
create trigger tg_push after insert on public.messages for each row execute function public._tg_push();

revoke execute on function public.save_push(text,text,text), public.drop_push(text), public.push_targets(bigint), public._tg_push() from public, anon;
grant execute on function public.save_push(text,text,text), public.drop_push(text) to authenticated;
grant execute on function public.push_targets(bigint) to service_role;