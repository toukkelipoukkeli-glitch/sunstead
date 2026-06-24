-- PulseWall demo seed — makes the app look "blown up" for the Supabase→Aiven migration demo.
-- Targets ~5,000 posts and ~50,000 reactions across ~200 fake fans over a 7-day "viral" window.
--
-- HOW TO RUN: paste into the Supabase SQL editor of the Lovable-generated project (or psql),
-- AFTER Lovable has created the schema.
--
-- ⚠️ ADJUST table/column names to match what Lovable actually generated. This script assumes:
--   public.posts(id uuid pk, author_id uuid -> auth.users, body text, image_url text,
--                reaction_count int default 0, created_at timestamptz, embedding vector(1536))
--   public.reactions(id uuid pk, post_id uuid -> public.posts, user_id uuid -> auth.users,
--                emoji text, created_at timestamptz)
-- If column names differ (e.g. `content` instead of `body`, `text` instead of `emoji`), tweak below.

create extension if not exists pgcrypto;   -- crypt()/gen_salt() for the fake auth users
create extension if not exists vector;     -- pgvector (the app likely enabled it already)

do $$
declare
  author_ids uuid[];
  post_ids   uuid[];
  bodies text[] := array[
    'this is INSANE 🔥', 'we are so back', 'best launch ever', 'shipping > sleeping',
    'who else is here rn', 'the energy in this room', 'midnight sun hits different',
    'AIVEN MENTIONED', 'context is king 👑', 'just vibe-coded the whole thing',
    'demo gods please be kind', 'agents doing the work while i nap', 'LFG 🚀',
    'this wall is moving so fast', 'someone get this on the big screen', 'pure hype',
    'real-time everything', 'kafka or bust', 'postgres my beloved', 'migrate me daddy'
  ];
  emojis text[] := array['🔥','❤️','🚀','👏','😂','💯','🤯','👑'];
begin
  -- 1) Authors: lightweight fake users so author_id FKs to auth.users hold ------------------
  --    (seed-only; this is the standard Supabase auth.users seed pattern)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    'fan' || g || '@pulsewall.demo', crypt('Demo-Password-1', gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
    '', '', '', ''
  from generate_series(1, 200) g;

  select array_agg(id) into author_ids
  from auth.users where email like 'fan%@pulsewall.demo';

  -- 2) Posts: ~5,000, timestamps weighted toward "now" to mimic a viral spike --------------
  insert into posts (id, author_id, body, image_url, reaction_count, created_at)
  select
    gen_random_uuid(),
    author_ids[1 + floor(random() * array_length(author_ids, 1))::int],
    bodies[1 + floor(random() * array_length(bodies, 1))::int],
    case when random() < 0.4
         then 'https://picsum.photos/seed/pw' || g || '/600/400' else null end,
    0,
    -- power-curve toward recent: random()^3 keeps most timestamps in the last day or two
    now() - (power(random(), 3) * interval '7 days')
  from generate_series(1, 5000) g;

  select array_agg(id) into post_ids from posts;

  -- 3) Reactions: ~50,000 spread across posts -----------------------------------------------
  insert into reactions (id, post_id, user_id, emoji, created_at)
  select
    gen_random_uuid(),
    post_ids[1 + floor(random() * array_length(post_ids, 1))::int],
    author_ids[1 + floor(random() * array_length(author_ids, 1))::int],
    emojis[1 + floor(random() * array_length(emojis, 1))::int],
    now() - (power(random(), 3) * interval '7 days')
  from generate_series(1, 50000) g;

  -- 4) Denormalized counts so the leaderboard is populated immediately ----------------------
  update posts p
  set reaction_count = c.cnt
  from (select post_id, count(*) cnt from reactions group by post_id) c
  where p.id = c.post_id;
end $$;

-- Sanity check (these are the numbers you point at on stage: "X rows → migrated to Aiven"):
select (select count(*) from posts)     as posts,
       (select count(*) from reactions) as reactions,
       (select count(*) from auth.users where email like 'fan%@pulsewall.demo') as fans;

-- OPTIONAL — semantic search needs real embeddings to look good. The seed leaves `embedding`
-- NULL on purpose (random vectors make "find similar" meaningless). For the demo, create a
-- handful of real posts through the app so its edge function fills `embedding` with genuine
-- vectors, OR backfill a small set via your embedding API. Bulk-random embeddings = don't.
