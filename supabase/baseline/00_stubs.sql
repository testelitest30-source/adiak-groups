-- LOCAL TEST ONLY: minimal stand-ins for the Supabase platform schemas (auth, storage, vault, net,
-- extensions, realtime) so the production schema can be loaded into a plain Postgres 17.
-- Never apply to production.
do $$ begin
  if current_setting('adiak.local', true) is distinct from 'yes' then
    raise exception 'refusing: baseline stubs are for the local test database only (set adiak.local=yes)';
  end if;
end $$;
do $$ begin  -- roles are cluster-wide; create once
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  if not exists(select 1 from pg_roles where rolname='authenticator') then create role authenticator noinherit login; end if;
end $$;
grant anon, authenticated, service_role to authenticator;
create schema extensions; create extension pgcrypto schema extensions;
create schema auth; create schema storage; create schema vault; create schema net;
grant usage on schema public, auth, storage, extensions to anon, authenticated, service_role;

create table auth.users(instance_id uuid, id uuid primary key, aud text, role text, email text unique, encrypted_password text,
  email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz,
  confirmation_token text, recovery_token text, email_change_token_new text, email_change text, last_sign_in_at timestamptz);
create table auth.identities(id uuid primary key, user_id uuid references auth.users on delete cascade, identity_data jsonb,
  provider text, provider_id text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz);
create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade);
-- Tests impersonate a user with: set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}';
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb->>'sub','')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb->>'role' $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create table storage.buckets(id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text,
  owner uuid, created_at timestamptz default now(), metadata jsonb, unique(bucket_id, name));
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant execute on all functions in schema storage to anon, authenticated, service_role;

create view vault.decrypted_secrets as select 'pw_copy_key'::text as name, 'local-test-key-not-a-secret'::text as decrypted_secret;

-- net.http_post stub: records calls instead of sending them (tests assert on net._calls).
create table net._calls(id bigserial primary key, url text, headers jsonb, body jsonb, at timestamptz default now());
create function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
  headers jsonb default '{}'::jsonb, timeout_milliseconds int default 5000) returns bigint language plpgsql as
  $$ declare i bigint; begin insert into net._calls(url,headers,body) values(url,headers,body) returning id into i; return i; end $$;

create publication supabase_realtime;
create schema supabase_migrations;
create table supabase_migrations.schema_migrations(version text primary key, statements text[], name text,
  created_by text, idempotency_key text, rollback text[]);
