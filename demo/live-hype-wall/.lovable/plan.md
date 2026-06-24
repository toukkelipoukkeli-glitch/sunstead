# PulseWall — Plan

A bold, dark, big-screen-friendly live event wall powered by Lovable Cloud (Supabase under the hood). Magic-link auth to post/react, realtime updates everywhere, image uploads, a leaderboard, and pgvector semantic search.

## Pages / Routes

- `/` — **The Wall**. Giant live "X hypes" counter at the top, masonry feed of posts (newest first), per-post emoji reactions with live counts, semantic search bar, "New hype" composer (sign-in gated). Anonymous viewers can read but not post/react.
- `/leaderboard` — Top 20 posts ranked by `reaction_count`, updating in realtime, rank badges, author handle, body, image.
- `/auth` — Email magic-link sign-in (public).
- `/_authenticated/` — managed layout gating any signed-in-only flows (the composer/reactions also gate inline so anonymous can still browse).

Top nav: PulseWall logo · Wall · Leaderboard · Sign in / Account.

## Design

- Dark, high-contrast, big-screen first. Background near-black with a subtle animated gradient glow.
- Accent: electric magenta + cyan duotone for the counter and rank highlights.
- Typography: oversized display font for the hype counter (tabular numerics, animated tick on increment), tight sans for body.
- Cards: large, rounded, soft glow on new arrivals (entry animation), reaction chips that pulse on increment.
- Optimized for projection: large type, generous spacing, no thin strokes.
- All colors as semantic tokens in `src/styles.css` (oklch). No hardcoded color utilities.

## Data Model (Supabase / Lovable Cloud)

Extensions: `vector`, `pgcrypto`.

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  image_url text,
  reaction_count int not null default 0,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);
```

Plus:
- GRANTs: `authenticated` full CRUD on both; `anon` SELECT on both (public viewing).
- RLS:
  - posts: SELECT anyone; INSERT `auth.uid() = author_id`; UPDATE/DELETE only own.
  - reactions: SELECT anyone; INSERT `auth.uid() = user_id`; DELETE only own.
- Trigger `after insert/delete on reactions` to maintain `posts.reaction_count` atomically.
- Trigger `after insert on posts` to invoke the embedding Edge Function via `pg_net` (async, non-blocking).
- HNSW index on `posts.embedding` (`vector_cosine_ops`).
- RPC `match_posts(query_embedding vector(1536), match_count int)` returning posts ordered by cosine similarity.
- Realtime publication for `posts` and `reactions`.

## Storage

- Public bucket `post-images` (created via storage tool).
- RLS on `storage.objects`: authenticated users can INSERT into their own prefix `{user_id}/...`; public SELECT.
- Composer uploads one optional image, stores public URL on the post row.

## AI Semantic Search (pgvector + Edge Function)

- Supabase Edge Function `embed-post`:
  - Triggered by the DB after-insert trigger (via `pg_net`) with `{ post_id, body }`.
  - Calls Lovable AI Gateway `/embeddings` with `openai/text-embedding-3-small` (1536 dims to match column).
  - Updates `posts.embedding` using service role.
- Search box on `/`: typing a query debounces to a server function that embeds the query (same model) and calls `match_posts` RPC, then renders the matched cards inline above the live feed with a "Clear search" affordance.

## Realtime

- `useEffect` on the Wall subscribes to:
  - `postgres_changes` INSERT on `posts` → prepend with entry animation.
  - `postgres_changes` UPDATE on `posts` → update reaction_count, animate counter tick, recompute global total.
  - `postgres_changes` INSERT/DELETE on `reactions` (optional, for per-post chips that show recent reactor emoji bursts).
- Leaderboard subscribes to `posts` UPDATEs and re-sorts top 20.
- Big "X hypes" counter = `sum(reaction_count)` across all posts; updated locally on each realtime delta and seeded from initial fetch.

## Auth

- Email magic link only (Supabase `signInWithOtp`, `emailRedirectTo: window.location.origin`).
- No profiles table needed — display `auth.users.email` prefix (e.g. `alex@…` → `alex`) as the author handle.
- Anonymous = read-only. Reaction buttons and composer show "Sign in to hype" CTA when signed out (no redirect).

## Technical Notes

- Stack: TanStack Start (modern). Use `createServerFn` for the search-query embedding call; use a Supabase **Edge Function** for the post-insert embedding as the user explicitly requested (also keeps insert latency off the user path).
- Browser Supabase client for realtime + auth + reads + reaction inserts.
- Routes: `src/routes/index.tsx` (Wall), `src/routes/leaderboard.tsx`, `src/routes/auth.tsx`. Each with its own `head()` meta.
- Tanstack Query for initial loads; realtime subscriptions update the query cache directly.
- Image upload via browser Supabase storage client; client-side size/type validation + Zod validation on body (1–280 chars).
- HNSW index, async embedding (post appears immediately; search picks it up once embedding lands a moment later).

## Build Order

1. Enable Lovable Cloud.
2. Migration: extensions, tables, GRANTs, RLS, triggers, RPC, realtime publication, HNSW index.
3. Storage bucket + object RLS.
4. Edge Function `embed-post` + `pg_net` trigger wiring + `LOVABLE_API_KEY`.
5. Design tokens in `src/styles.css` (dark palette, display font via `<link>` in `__root.tsx`).
6. Auth route + magic-link flow + root `onAuthStateChange`.
7. Wall route: counter, feed, composer, reactions, realtime, semantic search.
8. Leaderboard route with realtime re-sort.
9. Polish: animations on increment + new-post entry, empty states, error/notfound boundaries.

## Out of Scope (ask if you want them)

- User profiles / display names / avatars (using email prefix).
- Moderation / reporting.
- Multiple reaction emojis per user per post (currently unique per user+post+emoji; one of each emoji allowed).
- Rate limiting beyond RLS.