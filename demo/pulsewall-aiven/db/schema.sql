-- PulseWall — Aiven-native schema. Runs on Aiven for PostgreSQL. Zero Supabase.
-- No auth.users (we own auth), no storage.objects (images live in PG bytea),
-- no supabase_realtime publication (realtime is Aiven Kafka), no pg_net/edge fns.

create extension if not exists vector;
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── Identity (our own auth — replaces Supabase GoTrue) ──────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  handle      text not null,
  created_at  timestamptz not null default now()
);

-- short-lived magic codes (replaces Supabase magic-link email)
create table if not exists auth_codes (
  email       text not null,
  code        text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists auth_codes_email_idx on auth_codes (email);

-- ── Content ─────────────────────────────────────────────────────────────────────
create table if not exists posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references users(id) on delete cascade,
  author_handle  text not null,
  body           text not null check (char_length(body) between 1 and 280),
  image_url      text,
  reaction_count int  not null default 0,
  embedding      vector(1536),
  created_at     timestamptz not null default now()
);
create index if not exists posts_created_at_idx     on posts (created_at desc);
create index if not exists posts_reaction_count_idx on posts (reaction_count desc);
create index if not exists posts_embedding_idx      on posts using hnsw (embedding vector_cosine_ops);

create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  emoji       text not null default '🔥',
  created_at  timestamptz not null default now()
);
create index if not exists reactions_post_id_idx on reactions (post_id);

-- ── Storage (replaces Supabase Storage — image bytes live in Aiven PG) ──────────
create table if not exists images (
  id          uuid primary key default gen_random_uuid(),
  mime        text not null,
  bytes       bytea not null,
  owner_id    uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── reaction_count kept live by a trigger (the wall reads it; Kafka carries deltas)
create or replace function bump_reaction_count() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update posts set reaction_count = reaction_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_bump_reaction on reactions;
create trigger trg_bump_reaction
  after insert or delete on reactions
  for each row execute function bump_reaction_count();

-- ── Semantic search (Aiven pgvector — the same RPC shape the app already expects) ─
create or replace function match_posts(query_embedding vector(1536), match_count int default 12)
returns table (
  id uuid, author_id uuid, author_handle text, body text, image_url text,
  reaction_count int, created_at timestamptz, similarity float
)
language sql stable as $$
  select p.id, p.author_id, p.author_handle, p.body, p.image_url,
         p.reaction_count, p.created_at,
         1 - (p.embedding <=> query_embedding) as similarity
  from posts p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

-- ── Operational tables for the migrator + CTO agent ─────────────────────────────
create table if not exists migration_receipts (
  id          bigserial primary key,
  step        text not null,
  status      text not null,
  detail      text,
  count       int,
  ms          int,
  at          timestamptz not null default now()
);

create table if not exists cto_recommendations (
  id          uuid primary key default gen_random_uuid(),
  severity    text not null,
  title       text not null,
  detail      text not null,
  action      text not null,
  metric      text,
  created_at  timestamptz not null default now()
);
