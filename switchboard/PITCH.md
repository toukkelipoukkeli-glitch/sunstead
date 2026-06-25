# Switchboard — Vibe Deploy (pitch)

## The problem

Lovable, Bolt, v0 and friends generate apps on **Supabase** by default. That
default is worth a fortune: Supabase is a **$10.5B** company largely because it's
where vibe-coded apps are born. Aiven has the same core technology — managed
**Postgres**, **Kafka**, OpenSearch — but captures **none** of this market,
because nothing carries those apps from Supabase to Aiven.

## The product

**Switchboard** is an agent crew that takes an existing Lovable/Supabase app and
migrates it onto Aiven — autonomously, through the **Aiven MCP**.

Point it at a repo. Two clicks. Five agents:

1. **Code Analyzer** — finds every supabase-js call and reads the SQL schema.
2. **Provisioner** — spins up Aiven Postgres (+ Kafka for realtime) via MCP.
3. **Schema Migrator** — recreates tables + **pgcrypto auth tables** + RLS via MCP SQL.
4. **Code Rewriter** — rewrites the client and generates a thin API for Aiven Apps.
5. **Migration Reporter** — what moved, what didn't, and **what Aiven should build**.

## It's real

Not a slideware demo. The crew migrated the sample app onto a **live Aiven for
PostgreSQL** service (`pg-22a59da`, free plan, do-ams), executing every statement
through the Aiven MCP:

- 5 tables, 6 RLS policies, 2 indexes — recreated on Aiven.
- Passwords hashed by **pgcrypto on Aiven** — login verified (right password
  `true`, wrong password `false`).
- The Rewriter is a real codemod: **+640/−119** lines, Supabase client and
  dependency removed, a runnable `api/` generated (verified end-to-end on PG 17).

(Evidence: [proof/migration-proof.md](proof/migration-proof.md).)

## The strategic payload — what Aiven should build

The Reporter doesn't just celebrate; it names the gaps that block one-click
Supabase→Aiven migration today:

1. **Aiven for Object Storage** (S3 API) — the only true gap (Supabase Storage).
2. **Managed auth** (hosted GoTrue on Aiven Postgres) — make auth zero-code.
3. **Managed realtime** (Postgres-changes → Kafka/websocket bridge).
4. **An MCP `migrate-from-supabase` command** — turn this crew into a product.

Ship those four and every Lovable app is a `DATABASE_URL` away from Aiven. That's
how Aiven takes a slice of the $10.5B vibe-coding backend market.

## Why it works

Supabase is Postgres + a few services. Aiven already **is** managed Postgres and
Kafka. The migration isn't magic — it's recognizing that 80% of "Supabase" is
standard Postgres (schema, data, **RLS transfers verbatim**) and the rest is a
thin, generatable layer. Switchboard generates that layer and reports the 20%
Aiven still needs to own.
