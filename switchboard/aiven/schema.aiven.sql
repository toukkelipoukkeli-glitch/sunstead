-- PulseBoard, migrated to Aiven for PostgreSQL.
-- This is the OUTPUT of Switchboard's Schema Migrator (Agent 3): the Supabase
-- schema in sample-app/supabase/schema.sql, transformed for Aiven. It is
-- idempotent + self-seeding, so the live Migrator can run it on every click and
-- read back real counts (vs. last run, nothing duplicates).
--
-- Transformations vs. the Supabase original:
--   * auth.users            -> app_users (real table, pgcrypto password hashing)
--   * GoTrue sessions       -> sessions table (token-based)
--   * auth.uid()            -> current_setting('app.user_id', true)::uuid
--   * supabase_realtime pub -> dropped; realtime moves to NOTIFY/Kafka via the API
--   * everything else (tables, columns, indexes, RLS policy logic) transfers verbatim.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---- Auth (replaces Supabase GoTrue) -------------------------------------
create table if not exists app_users (
  id            uuid primary key default gen_random_uuid(),
  email         citext unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

-- ---- Application tables (from public schema) ------------------------------
create table if not exists profiles (
  id           uuid primary key references app_users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table if not exists boards (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references app_users (id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards (id) on delete cascade,
  author_id  uuid not null references app_users (id) on delete cascade,
  column_key text not null default 'good',
  body       text not null,
  votes      int  not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cards_board_id_idx  on cards (board_id);
create index if not exists boards_owner_id_idx on boards (owner_id);

-- ---- Row Level Security (policy logic identical to Supabase) --------------
alter table profiles enable row level security;
alter table boards   enable row level security;
alter table cards    enable row level security;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (true);
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update
  using (id = current_setting('app.user_id', true)::uuid);

drop policy if exists boards_select on boards;
create policy boards_select on boards for select
  using (owner_id = current_setting('app.user_id', true)::uuid);
drop policy if exists boards_insert on boards;
create policy boards_insert on boards for insert
  with check (owner_id = current_setting('app.user_id', true)::uuid);

drop policy if exists cards_select on cards;
create policy cards_select on cards for select
  using (exists (select 1 from boards b
                 where b.id = cards.board_id
                   and b.owner_id = current_setting('app.user_id', true)::uuid));
drop policy if exists cards_insert on cards;
create policy cards_insert on cards for insert
  with check (exists (select 1 from boards b
                      where b.id = cards.board_id
                        and b.owner_id = current_setting('app.user_id', true)::uuid));

-- ---- Seed (idempotent): the data the app migrated from Supabase -----------
insert into app_users (id, email, password_hash) values
  ('11111111-1111-1111-1111-111111111111', 'ada@pulseboard.dev',   crypt('hunter2', gen_salt('bf'))),
  ('22222222-2222-2222-2222-222222222222', 'linus@pulseboard.dev', crypt('correcthorse', gen_salt('bf')))
on conflict (id) do nothing;

insert into profiles (id, display_name, avatar_url) values
  ('11111111-1111-1111-1111-111111111111', 'Ada Lovelace',  'avatars/11111111-1111-1111-1111-111111111111/ada.png'),
  ('22222222-2222-2222-2222-222222222222', 'Linus Torvalds', null)
on conflict (id) do nothing;

insert into boards (id, owner_id, title) values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Sprint 42 Retro')
on conflict (id) do nothing;

insert into cards (id, board_id, author_id, column_key, body, votes) values
  ('cccc0001-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'good',   'Shipped the Aiven migration agent crew', 5),
  ('cccc0002-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'good',   'MCP provisioning just worked on the first try', 3),
  ('cccc0003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'bad',    'Supabase bill doubled after the launch spike', 8),
  ('cccc0004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'action', 'Cut realtime over to Aiven Kafka before GA', 2)
on conflict (id) do nothing;

-- Realtime is NOT a publication on Aiven. The generated API emits
--   select pg_notify('cards:' || board_id, row_to_json(NEW)::text)
-- on insert, and streams it to clients over SSE.
