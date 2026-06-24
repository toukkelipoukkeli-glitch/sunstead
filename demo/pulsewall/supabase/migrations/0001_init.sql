-- PulseWall schema — Postgres + RLS + Realtime + Storage + pgvector.
-- Run in the Supabase SQL editor of YOUR OWN Supabase project (not Lovable Cloud).
-- Matches demo/pulsewall-seed.sql.

create extension if not exists vector;

-- Tables --------------------------------------------------------------------
create table if not exists public.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references auth.users(id) on delete cascade,
  body           text not null,
  image_url      text,
  reaction_count int  not null default 0,
  embedding      vector(1536),
  created_at     timestamptz not null default now()
);

create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null default '🔥',
  created_at timestamptz not null default now()
);

create index if not exists posts_reaction_count_idx on public.posts (reaction_count desc);
create index if not exists posts_created_at_idx      on public.posts (created_at desc);
create index if not exists reactions_post_id_idx     on public.reactions (post_id);
-- vector index for semantic search (safe to create before rows exist)
create index if not exists posts_embedding_idx
  on public.posts using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Keep reaction_count live via a trigger -------------------------------------
create or replace function public.bump_reaction_count() returns trigger
language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set reaction_count = reaction_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end $$;

drop trigger if exists trg_bump_reaction on public.reactions;
create trigger trg_bump_reaction
  after insert or delete on public.reactions
  for each row execute function public.bump_reaction_count();

-- Row-Level Security ---------------------------------------------------------
alter table public.posts     enable row level security;
alter table public.reactions enable row level security;

-- anyone (including anonymous viewers) can read the wall
create policy "posts readable by all"     on public.posts     for select using (true);
create policy "reactions readable by all" on public.reactions for select using (true);

-- signed-in users act only as themselves
create policy "insert own posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "update own posts" on public.posts for update to authenticated using (auth.uid() = author_id);
create policy "delete own posts" on public.posts for delete to authenticated using (auth.uid() = author_id);
create policy "insert own reactions" on public.reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own reactions" on public.reactions for delete to authenticated using (auth.uid() = user_id);

-- Realtime: stream changes for the wall, counts, and leaderboard -------------
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.reactions;

-- Storage: public bucket for one optional image per post ---------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post-images public read" on storage.objects
  for select using (bucket_id = 'post-images');
create policy "post-images authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'post-images');

-- Semantic search: cosine nearest-neighbour over embeddings ------------------
create or replace function public.match_posts(query_embedding vector(1536), match_count int default 10)
returns table (id uuid, body text, image_url text, reaction_count int, created_at timestamptz, similarity float)
language sql stable as $$
  select p.id, p.body, p.image_url, p.reaction_count, p.created_at,
         1 - (p.embedding <=> query_embedding) as similarity
  from public.posts p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;
