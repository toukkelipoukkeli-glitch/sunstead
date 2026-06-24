# PulseWall — the demo app we migrate Supabase → Aiven

A real-time event "hype wall" (Vite + React + Supabase). Built to exercise **every** Supabase
behavior the migrator classifies, so the migration demo lights up the full behavior graph:
Postgres + RLS, Realtime, Storage, pgvector, an Edge Function, and Auth.

See [../../idea.md](../../idea.md) and [../../STATUS.md](../../STATUS.md) for the why.

## Setup — use your OWN Supabase project (NOT Lovable Cloud)

> Lovable Cloud gives no direct database URL / service-role key, so the migrator can't reach it.
> See [../lovable-export-checklist.md](../lovable-export-checklist.md).

1. **Create a Supabase project** (or connect your own project in Lovable). Copy the project URL
   and the `anon` key (Settings → API).
2. **Schema:** paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) into
   the Supabase SQL editor and run it.
3. **Edge function** (needs an embeddings key):
   ```bash
   supabase functions deploy embed
   supabase secrets set OPENAI_API_KEY=sk-...   # text-embedding-3-small → vector(1536)
   ```
   Swap OpenAI for any 1536-dim embedder by editing `supabase/functions/embed/index.ts`.
4. **Frontend:**
   ```bash
   cd demo/pulsewall
   cp .env.example .env.local      # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
   npm install
   npm run dev
   ```
5. **Seed it to look "blown up"** (optional, great for the demo): run
   [`../pulsewall-seed.sql`](../pulsewall-seed.sql) in the SQL editor → ~5k posts / ~50k reactions.

## How it maps to the migration demo

| Feature here | Behavior class | Migration beat |
|---|---|---|
| `posts`/`reactions` + RLS | direct migrate | row counts match before/after |
| pgvector + `match_posts` | direct migrate → Aiven pgvector | "AI search moves natively" |
| Realtime (wall, counts, leaderboard) | rewrite → Aiven Kafka | the hero beat |
| Auth (magic link) | adapter required | honestly flagged |
| Storage (`post-images`) | externalize to object store | honestly flagged |
| Edge function (`embed`) | convert → Aiven App | the "delete Supabase" deploy beat |

## Notes
- Anonymous visitors can **view** the wall; **posting / reacting** needs a magic-link sign-in.
- `reaction_count` is kept live by a DB trigger; the wall and leaderboard update over Realtime.
- It's a hype wall — reacting is multi-tap (every 🔥 is a row), which is also what makes the
  seed's 50k reactions realistic.
- Semantic search needs **real** embeddings: create a few posts through the running app (the edge
  function fills `embedding`) before trying Search. Bulk-seeded rows are intentionally NULL —
  random vectors would make "similar" meaningless.
