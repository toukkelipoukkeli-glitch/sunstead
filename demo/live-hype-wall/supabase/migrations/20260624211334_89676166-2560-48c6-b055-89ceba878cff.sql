
-- match_posts: switch to security invoker (anon already has SELECT on posts)
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
security invoker
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

-- Revoke execute on internal trigger helpers from public roles
revoke execute on function public.update_post_reaction_count() from public, anon, authenticated;
revoke execute on function public.trigger_embed_post() from public, anon, authenticated;
