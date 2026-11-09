create table point_events(id bigint generated always as identity primary key,
 user_id uuid not null references profiles(id) on delete cascade,
 amount int not null,
 kind text not null check (kind in ('host','self')),
 created_at timestamptz not null default now());
create index on point_events(user_id,id);
alter table point_events enable row level security;
create policy r on point_events for select to authenticated using (true);
grant select on point_events to authenticated;

create or replace function add_points(u uuid, n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from profiles where id=auth.uid() and is_admin) then raise exception 'Only the host can give points'; end if;
 if n is null or n not between -100 and 100 then raise exception 'Points must be between -100 and 100'; end if;
 update profiles set points=greatest(0,points+n) where id=u and not is_admin;
 if found then insert into point_events(user_id,amount,kind) values(u,n,'host'); end if;
end $$;

create or replace function self_points(n int) returns void language plpgsql security definer set search_path=public as $$
begin
 if n is null or n not between 1 and 10 then raise exception 'Choose 1 to 10'; end if;
 update profiles set points=points+n where id=auth.uid() and not is_admin;
 if found then insert into point_events(user_id,amount,kind) values(auth.uid(),n,'self'); end if;
end $$;