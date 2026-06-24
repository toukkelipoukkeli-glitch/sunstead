# Lovable export checklist — can the migrator actually point at it?

The migrator needs two things from the demo app: **(a)** a real Postgres it can introspect and
copy from, and **(b)** the app source to scan behaviors. Lovable gives us both — *if* we set the
project up the right way. There's one decision that makes or breaks it.

## ⚠️ The decision that unblocks everything: own Supabase, NOT Lovable Cloud

Lovable has two backend modes:

- **Lovable Cloud (the default for new projects):** a Supabase instance that *Lovable* manages.
  You **can't see it in your Supabase dashboard**, and you get **no service-role key and no direct
  database URL**. → the migrator (and our seed script) literally can't reach it. ❌
- **Your own Supabase project (BYO):** you connect your own Supabase org/project. Full dashboard,
  **direct connection string, service-role key, SQL editor**. ✅ ← **build PulseWall this way.**

**How:** in the Lovable project → Settings → Integrations → **Supabase → Connect** → authorize →
pick/create a project in *your* Supabase org (Lovable's chat walks you through creating one). If you
already started on Lovable Cloud, switch to / recreate on your own Supabase project — don't fight it.

**How to tell which you're on:** if you can open the project in *your* Supabase dashboard and see
the tables, you're on your own project ✅ (Supabase even has a doc for identifying this — see sources).

## What we get, and what the migrator does with it

| Artifact | Where to get it | Migrator uses it for |
|---|---|---|
| Direct Postgres connection string | Supabase dashboard → Settings → Database | `aiven-db-migrate` / `pg_dump` bulk copy + row-count verification |
| Service-role key + project URL | Supabase dashboard → Settings → API | introspecting auth/storage/realtime config |
| SQL editor | Supabase dashboard | running the seed, inspecting schema/RLS |
| App source repo | Lovable → **GitHub sync** (auto-creates + syncs a repo) or ZIP download | scanning `supabase-js` calls, edge functions, RLS → **the behavior graph** |

Caveats: export is **one-way** (Lovable → GitHub); Lovable won't adopt a pre-existing repo. The repo
includes React, Tailwind, Supabase config, routing, and edge functions — everything we need to scan.

## Pre-build checklist (in order)

1. [ ] New Lovable project → connect **your own Supabase project** (NOT Lovable Cloud).
2. [ ] Build PulseWall with the prompt (auth + realtime + storage + pgvector + edge function).
3. [ ] In your Supabase dashboard, confirm you can see the tables and grab the **connection
       string + service-role key**, and that the **SQL editor** works.
4. [ ] Connect **GitHub sync** → repo created (so the agent can scan the code).
5. [ ] Run [`pulsewall-seed.sql`](pulsewall-seed.sql) in the Supabase SQL editor (~5k posts / ~50k reactions).
6. [ ] Smoke-test the app: wall updates live, leaderboard populated, a real post generates an
       embedding, an image uploads.

## Bonus: the cost story checks out

Independent reports say Lovable Cloud bills jump **3–5× between 10k and 50k users**. That's exactly
our "it blew up and the bill exploded" premise — a real number to cite on stage.

---

Sources:
- [Connect to Supabase — Lovable Docs](https://docs.lovable.dev/integrations/supabase)
- [Lovable Cloud — Lovable Docs](https://docs.lovable.dev/integrations/cloud)
- [Identifying Lovable backend: Lovable Cloud or Supabase — Supabase Docs](https://supabase.com/docs/guides/troubleshooting/identify-lovable-cloud-or-supabase-backend)
- [Connect to GitHub — Lovable Docs](https://docs.lovable.dev/integrations/github)
- [Lovable Cloud vs Supabase pricing comparison (2026)](https://www.lovablemigration.com/pricing-comparison)
