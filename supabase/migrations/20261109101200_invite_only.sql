-- ADIAK 1.0: invite-only accounts (owner-approved 2026-11-09). Existing accounts are untouched: this only blocks NEW rows
-- that the Supabase Auth service itself inserts (public sign-up, anonymous sign-in, dashboard invites). Accounts created by
-- the app's staff RPCs (admin_create_user / admin_add_students / admin_import_students) run in another session and still work.
-- Switch: sys_config.public_signup = 'on' re-allows Auth-service sign-ups (owner only, SQL). Rollback: drop the trigger.
do $$ begin
  if to_regclass('auth.users') is null then raise exception 'pre-flight: auth.users missing'; end if;
  if exists (select 1 from pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'adiak_invite_only') then
    raise exception 'pre-flight: adiak_invite_only already exists';
  end if;
end $$;

insert into public.sys_config (key, value) values ('public_signup', 'off') on conflict (key) do nothing;

create or replace function public._tg_invite_only() returns trigger
 language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  -- session_user (not current_user): the connected role. Supabase Auth connects as supabase_auth_admin; the app's
  -- SECURITY DEFINER RPCs arrive through PostgREST (authenticator) and are not affected.
  if session_user = 'supabase_auth_admin'
     and coalesce((select value from public.sys_config where key = 'public_signup'), 'off') <> 'on' then
    raise exception 'ADIAK is invite-only: accounts are created by the school' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public._tg_invite_only() from public, anon, authenticated, service_role;

create trigger adiak_invite_only before insert on auth.users for each row execute function public._tg_invite_only();
-- rollback: drop trigger adiak_invite_only on auth.users;
