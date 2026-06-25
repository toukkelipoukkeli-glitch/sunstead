# Demo script (~2 minutes)

## Pre-flight

```sh
cd switchboard && npm install && npm run dev
```

Open http://localhost:5173. Default **simulate** mode — nothing destructive, runs
with no network. Every number on screen is real agent output.

Have a second terminal ready with `proof/migration-proof.md` open (the "it's
real" card) and, if the Aiven MCP is connected, be ready to run one live query.

## The line to open with

> "Every Lovable app is born on Supabase. That default made Supabase a $10.5
> billion company. Aiven has the same Postgres and Kafka underneath — but nothing
> carries those apps over. So we built the thing that does."

## Click-through

1. **Source.** "This is PulseBoard — a realtime retro board, a normal Supabase
   app: auth, database, realtime, storage." → click **Analyze this app**.

2. **Plan.** "Agent 1 read the code. Three tables, five auth calls, a realtime
   channel, a storage bucket. It mapped each to Aiven — and flagged Storage in
   amber, because Aiven has no object store. That honesty is the point." Point at
   **21 Aiven MCP operations planned**. → click **Migrate to Aiven**.

3. **Migrate.** "Five agents, zero clicks. Provision Aiven through the MCP,
   execute the schema and the pgcrypto auth tables as MCP SQL, rewrite the client,
   write the report." (Watch the crew tick green.)

4. **Done.** Three things to land:
   - "**PulseBoard runs on Aiven.**"
   - The **rewrite diff**: "+640/−119 — the Supabase client is gone, replaced by
     an Aiven API client and a generated backend ready for Aiven Apps."
   - The **report**: "schema ✅, RLS ✅, auth ✅ (pgcrypto verified live),
     realtime 🟡, storage ⛔ — and here's exactly what Aiven should build."

## The "it's real" beat

> "None of that was faked." Show `proof/migration-proof.md`. If the MCP is live,
run one query on stage:

```
aiven_pg_read pg-22a59da:
  select email, (password_hash = crypt('hunter2', password_hash)) as login_ok
  from app_users where email = 'ada@pulseboard.dev';
```

→ `login_ok = true`. "That password was hashed by pgcrypto on Aiven, by an agent,
through the MCP."

## Close

> "Supabase owns the vibe-coding backend because it's the default. Switchboard is
> how Aiven becomes a viable destination — and the report is the roadmap to make
> it the default. Four managed pieces: object storage, auth, realtime, and an MCP
> migrate command."

## If the wifi dies

Nothing to worry about — simulate mode is the default and needs no network. The
cockpit, the agents, and the rewrite all run locally.
