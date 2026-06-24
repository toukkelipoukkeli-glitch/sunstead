
-- Extensions
create extension if not exists vector;
create extension if not exists pg_net;

-- posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_handle text not null,
  body text not null check (char_length(body) between 1 and 280),
  image_url text,
  reaction_count int not null default 0,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;

alter table public.posts enable row level security;

create policy "posts are readable by everyone"
  on public.posts for select
  using (true);

create policy "users can create their own posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "users can update their own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_reaction_count_idx on public.posts (reaction_count desc);
create index posts_embedding_idx on public.posts using hnsw (embedding vector_cosine_ops);

-- reactions
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

grant select on public.reactions to anon;
grant select, insert, update, delete on public.reactions to authenticated;
grant all on public.reactions to service_role;

alter table public.reactions enable row level security;

create policy "reactions are readable by everyone"
  on public.reactions for select
  using (true);

create policy "users can create their own reactions"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can delete their own reactions"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

create index reactions_post_id_idx on public.reactions (post_id);

-- Reaction counter trigger
create or replace function public.update_post_reaction_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set reaction_count = reaction_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set reaction_count = greatest(reaction_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger reactions_count_ins
after insert on public.reactions
for each row execute function public.update_post_reaction_count();

create trigger reactions_count_del
after delete on public.reactions
for each row execute function public.update_post_reaction_count();

-- Semantic search RPC
create or replace function public.match_posts(query_embedding vector(1536), match_count int default 12)
returns table (
  id uuid,
  author_id uuid,
  author_handle text,
  body text,
  image_url text,
  reaction_count int,
  created_at timestamptz,
  similarity float
)
language sql stable
security definer
set search_path = public
as $$
  select
    p.id, p.author_id, p.author_handle, p.body, p.image_url, p.reaction_count, p.created_at,
    1 - (p.embedding <=> query_embedding) as similarity
  from public.posts p
  where p.embedding is not null
  order by p.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_posts(vector, int) to anon, authenticated;

-- Trigger embed-post edge function on insert via pg_net
create or replace function public.trigger_embed_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn_url text := 'https://cmtldiaguhzosdztydsg.supabase.co/functions/v1/embed-post';
  anon_key text := 'sb_publishable_O87x_EjPFPazW8UY7xwutA_cBqteqh6';
begin
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', anon_key,
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object('post_id', new.id, 'body', new.body)
  );
  return new;
end;
$$;

create trigger posts_embed_after_insert
after insert on public.posts
for each row execute function public.trigger_embed_post();

-- Realtime
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.reactions;
alter table public.posts replica identity full;
alter table public.reactions replica identity full;
