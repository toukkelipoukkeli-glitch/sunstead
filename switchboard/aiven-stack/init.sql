-- Roles + sample data so PostgREST works against a fresh local Postgres.
-- A migrated Supabase DB already has these (anon/authenticated/service_role);
-- on Aiven you migrate the real schema instead of running this.

-- GoTrue expects the auth schema to already exist (Supabase pre-creates it)
-- and queries its tables unqualified, so it needs `auth` on the search_path.
create schema if not exists auth;
alter role postgres set search_path to auth, public;

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password 'postgres';
grant anon, authenticated, service_role to authenticator;

create table public.todos (
  id bigserial primary key,
  task text not null,
  done boolean default false,
  inserted_at timestamptz default now()
);
insert into public.todos (task) values
  ('Move my database to Aiven'),
  ('Move auth to Aiven Apps'),
  ('Cut the Supabase bill');

grant usage on schema public to anon, authenticated, service_role;
grant select on public.todos to anon;
grant all on public.todos to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
