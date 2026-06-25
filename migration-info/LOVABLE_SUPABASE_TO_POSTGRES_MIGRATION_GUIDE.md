# Migrating A Lovable/Supabase App To Aiven For PostgreSQL

Research date: June 2026

Scope: **Lovable or Lovable-style app using Supabase -> Aiven for PostgreSQL**.

This guide records mechanics and source facts for moving a Lovable/Supabase-style app's Postgres data plane to Aiven for PostgreSQL.

## Migration Flow

Common database migration path:

```text
Identify backend ownership
  -> export/sync the Lovable app code
  -> inspect Supabase usage
  -> create/verify Aiven Postgres
  -> dump Supabase schema/data
  -> restore into Aiven Postgres
  -> validate row counts and smoke queries
  -> rewire the app through a backend adapter
  -> cut over the scoped runtime
```

The important distinction:

- **Tables, indexes, constraints, functions, triggers, and many extensions** can usually migrate to Aiven Postgres.
- **Supabase Auth, Storage, Realtime, Edge Functions, client SDK behavior, and RLS auth context** do not become Aiven Postgres features automatically.

## What Lovable changes about the migration

Lovable can produce apps backed by either:

| Source backend | What it means for migration |
| --- | --- |
| Your own Supabase project connected to Lovable | Best case. You have Supabase dashboard access, direct DB URL, API keys, SQL migrations, and can use Supabase/Postgres migration tools. |
| Lovable Cloud / Lovable-managed backend | Harder. Supabase documents that Lovable Cloud projects may be backed by a Lovable-managed Supabase instance that does not appear in your own Supabase dashboard and does not expose the same direct database/service-role access.[^supabase-identify-lovable] |

Before doing anything else, identify which one you have. Supabase's Lovable troubleshooting doc gives the practical distinction: if the backend is Lovable Cloud, it is managed by Lovable and not visible as a normal project in your Supabase dashboard; if it is your own Supabase project, you manage it in Supabase directly.[^supabase-identify-lovable]

Lovable documents GitHub integration for syncing/exporting project code, which matters because the repo is the artifact you will scan and modify during migration.[^lovable-github] Lovable's external hosting docs also describe migration-related work such as moving data, storage, and configuration out of Lovable Cloud.[^lovable-external]

## Migration Mechanics

### Phase 1: export and inspect the app

Get the Lovable project into GitHub or a local repo. Then scan for Supabase dependencies:

```bash
rg "@supabase/supabase-js|supabase\\.from|supabase\\.auth|supabase\\.storage|supabase\\.channel|supabase\\.rpc|functions\\.invoke|VITE_SUPABASE"
```

Classify the findings:

| Supabase usage | Aiven Postgres migration meaning |
| --- | --- |
| `supabase.from("table")` | Data access must move behind a backend API using Aiven Postgres credentials. |
| SQL migrations under `supabase/migrations` | Strong source for target schema. |
| RLS policies | May restore as SQL, but policies depending on Supabase Auth need review. |
| `supabase.auth` | Not solved by Aiven Postgres. Requires a separate auth architecture. |
| `supabase.storage` | Not solved by Aiven Postgres. Move objects to object storage later. |
| `supabase.channel` / Postgres Changes | Browser-facing Supabase Realtime API does not exist in plain Aiven Postgres; requires another event path. |
| `supabase.rpc` | SQL functions may move; frontend `.rpc()` calls need a backend route or adapter. |
| Edge Functions | Move to an API server, worker, or later Aiven Apps if available. |

### Phase 2: create or verify Aiven Postgres

Create an Aiven for PostgreSQL service in the right region and plan, or verify an existing service.

You need:

- Aiven Postgres connection URI;
- SSL mode configured, commonly `sslmode=require` or stricter certificate verification depending on deployment needs; Aiven documents TLS-protected PostgreSQL connections and connection-code samples.[^aiven-connect]
- Target database name;
- Target user with privileges to create schema, extensions, and tables;
- Required extensions enabled or available.

Reference receipt/proof schema used by Aiden planning docs:

```sql
create table if not exists migration_runs (
  id text primary key,
  source_app text not null,
  target_service text not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists mcp_receipts (
  id bigserial primary key,
  run_id text not null references migration_runs(id),
  agent text not null,
  intent text not null,
  tool text not null,
  target text,
  risk text not null,
  result text not null,
  rollback text,
  created_at timestamptz not null default now()
);

create table if not exists validation_checks (
  id bigserial primary key,
  run_id text not null references migration_runs(id),
  check_name text not null,
  status text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### Phase 3: dump Supabase schema and data

If the Lovable app uses a Supabase project you control, use the Supabase CLI dump flow. Supabase recommends `supabase db dump` for Supabase projects because it wraps `pg_dump` with Supabase-specific compatibility behavior and excludes Supabase-managed schemas by default.[^supabase-self-host-restore][^supabase-cli-dump]

For app schema/data only:

```bash
supabase db dump \
  --db-url "$SOURCE_SUPABASE_DB_URL" \
  --schema public \
  -f schema.sql

supabase db dump \
  --db-url "$SOURCE_SUPABASE_DB_URL" \
  --schema public \
  --use-copy \
  --data-only \
  -f data.sql
```

If you need roles:

```bash
supabase db dump \
  --db-url "$SOURCE_SUPABASE_DB_URL" \
  --role-only \
  -f roles.sql
```

Supabase's platform restore guide uses three files: `roles.sql`, `schema.sql`, and `data.sql`.[^supabase-self-host-restore] For **Aiven Postgres**, you usually want to be more selective than a full platform restore:

- dump app schemas like `public`;
- avoid relying on Supabase-managed schemas unless you intentionally need them;
- do not assume `auth`, `storage`, or realtime internals become working app services on Aiven;
- treat RLS policies as SQL artifacts that need semantic review.

If the source is Lovable Cloud and you do not have direct DB access, use Lovable's documented external migration/export flow: export code through GitHub, recreate schema from migrations, export tables to CSV where available, and import data into the target.[^lovable-external] PostgreSQL's `COPY` command is the native primitive for bulk loading CSV-like data.[^postgres-copy]

### Phase 4: prepare Aiven Postgres before restore

Before applying `schema.sql`, check:

- Postgres version compatibility;
- required extensions;
- schemas and permissions;
- RLS policy behavior;
- vector/search extension support if the app uses AI search;
- whether generated SQL references Supabase-only schemas such as `auth` or `storage`.

For example, if the app uses UUID defaults:

```sql
create extension if not exists pgcrypto;
```

If it uses pgvector:

```sql
create extension if not exists vector;
```

Supabase's restore docs warn to check Postgres version and extension compatibility before restoring.[^supabase-self-host-restore]

### Phase 5: restore into Aiven Postgres

For a SQL dump:

```bash
psql "$AIVEN_POSTGRES_URL" \
  --variable ON_ERROR_STOP=1 \
  --file schema.sql

psql "$AIVEN_POSTGRES_URL" \
  --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica' \
  --file data.sql

psql "$AIVEN_POSTGRES_URL" \
  --command 'ANALYZE;'
```

Aiven documents standard `pg_dump`/`pg_restore` migration into Aiven for PostgreSQL and recommends `ANALYZE` after loading data so query planner statistics are updated.[^aiven-pgdump] PostgreSQL documents `pg_dump` and `pg_restore` as the standard dump and restore utilities.[^postgres-pgdump][^postgres-pgrestore]

For larger production migrations, use Aiven's `aiven-db-migrate`, which supports logical replication and dump/restore, with logical replication as the default strategy when possible.[^aiven-db-migrate] PostgreSQL logical replication uses publication/subscription semantics and is the right mental model for lower-downtime migrations.[^postgres-logical-replication]

Minimal shadow migration pattern:

```text
source rows -> target rows -> row-count checks -> smoke query -> receipt
```

### Phase 6: validate the Aiven target

Minimum SQL checks:

```sql
select 'posts' as table_name, count(*) from public.posts
union all
select 'reactions', count(*) from public.reactions;

select extname from pg_extension order by extname;

select conname, contype
from pg_constraint
where connamespace = 'public'::regnamespace
order by conname;

select *
from public.posts
order by created_at desc
limit 10;
```

Also validate:

- migrated row counts match;
- key smoke query passes;
- inserts work;
- triggers still fire;
- indexes exist;
- vector/search functions still compile if present;
- app backend can connect over TLS;
- no browser bundle contains the Aiven Postgres URL.

Example validation output:

```text
posts        40/40 rows validated
reactions    60/60 rows validated
profiles     12/12 rows validated
events        8/8 rows validated

Smoke query: passed
Extensions: pgcrypto, vector available
Receipts: written to Aiven Postgres
```

### Phase 7: rewire the app correctly

This is the part many migrations understate.

The original Lovable/Supabase app may do this in the browser:

```ts
const { data } = await supabase
  .from("posts")
  .select("*")
  .order("created_at", { ascending: false })
```

Do **not** replace that with a direct Aiven Postgres connection in the browser. Vite exposes `VITE_*` variables to client-side code and warns not to put sensitive values there.[^vite-env] A raw Aiven Postgres connection string is a secret.

Correct shape:

```text
Lovable/Vite frontend
  -> local or deployed backend adapter
  -> Aiven Postgres
```

Frontend after migration:

```ts
const response = await fetch("/api/posts?limit=20")
const data = await response.json()
```

Backend adapter:

```ts
app.get("/api/posts", async (req, reply) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100)
  const { rows } = await pg.query(
    "select * from public.posts order by created_at desc limit $1",
    [limit]
  )
  return rows
})
```

That backend adapter is what lets Supabase disappear from the runtime path without leaking Aiven credentials.

## Supabase behaviors that affect the Aiven Postgres migration

### Auth and RLS

Supabase Auth integrates with Postgres authorization and RLS using JWT claims and helper functions such as `auth.uid()`.[^supabase-auth][^supabase-rls] RLS itself is native Postgres, but policies that depend on Supabase Auth context do not automatically keep working when the app stops using Supabase.

For the Aiven migration:

- simple policies can restore as SQL, but still require semantic review;
- `auth.uid()` policies require a replacement auth context or server-side authorization;
- seeded/local users do not prove production auth migration.

### Storage

Supabase Storage object bytes are not just rows in Postgres. Supabase's backup docs distinguish database backups from Storage objects, and dashboard restore docs note that storage metadata can be restored without the underlying files.[^supabase-backups][^supabase-dashboard-restore]

For the Aiven Postgres scope:

- storage metadata can exist in Postgres without object bytes;
- object bytes require a separate object-store migration;
- Aiven Postgres does not replace Supabase Storage.

### Realtime

Supabase Realtime supports Postgres Changes, Broadcast, and Presence. Postgres Changes depend on publication/replication configuration for relevant tables.[^supabase-realtime-postgres] Plain Aiven Postgres does not provide the same browser-facing Supabase Realtime API.

Replacement patterns include:

```text
Supabase Realtime channel
  -> detected in frontend code
  -> classified as realtime behavior
  -> mapped to another event path
  -> backend adapter exposes polling, SSE, WebSocket, or another browser delivery mechanism
```

Potential event-path building blocks:

- Aiven Postgres events/outbox table.
- Aiven Kafka topic.
- Backend polling endpoint.
- Backend SSE endpoint.
- Backend WebSocket endpoint.

### Edge Functions and RPC

Supabase Edge Functions are server-side TypeScript functions running on Deno.[^supabase-edge-functions] SQL functions can migrate to Aiven Postgres if they are standard Postgres functions. Calls like `supabase.rpc()` or `functions.invoke()` need a backend API route or worker replacement.

## Cutover options for Aiven Postgres

| Strategy | Use when | Notes |
| --- | --- | --- |
| Cold cutover | Small app or short downtime window | Pause writes, dump, restore, validate, switch env/API |
| Shadow migration | Need target validation while source stays live | Source stays live; Aiven target is validated beside it |
| Logical replication | Larger production migration | Use Aiven migration tooling or Postgres logical replication |
| Dual-write | Advanced production migration | Higher app complexity, useful only when downtime is unacceptable |

Aiven's `pg_dump`/`pg_restore` guide notes that writes after the dump begins are not included, so writes should be disabled during final dump if using that path.[^aiven-pgdump]

## Aiven-specific proof package

Example migration report fields:

```text
Target: Aiven for PostgreSQL
Source: Lovable/Supabase app

Schema applied: passed
Rows validated: 120/120
Smoke query: passed
Extensions checked: passed
Backend adapter: generated
Supabase browser runtime path: removed

Needs adapter:
- Auth
- Storage
- RLS policies depending on auth.uid()

Realtime replacement:
- event path selected separately from data migration

Rollback:
- Restore old frontend env/API target
- Keep Supabase source intact
- Drop Aiven shadow schema after rollback window
```

Example Aiven action log:

```text
aiven_service_get postgres                 ok
aiven_pg_service_available_extensions      ok
aiven_pg_write migration_runs              ok
aiven_pg_write schema/data                 ok
aiven_pg_read validation_counts            ok
aiven_pg_write mcp_receipts                ok
```

Example Kafka action log:

```text
aiven_kafka_topic_create migration.events  ok
aiven_kafka_topic_message_produce          ok
aiven_kafka_topic_message_list             ok
validation.check.passed kafka_roundtrip    ok
```

## Common failure modes

### Treating Lovable Cloud as owned Supabase

If the app uses Lovable Cloud, you may not have direct DB URL or service-role access.[^supabase-identify-lovable] Use Lovable's export path, or first move to a Supabase project you control.

### Restoring Supabase internals as if they were app behavior

Schemas and roles can restore without recreating Supabase's platform services. For Aiven Postgres, focus on app-owned data and SQL behavior.

### Assuming RLS still authorizes users

Policies using Supabase Auth helpers need a new auth context. Mark them as review-required.

### Forgetting object files

Storage metadata is not enough. Object bytes need a separate storage migration.[^supabase-backups][^supabase-dashboard-restore]

### Leaking Aiven credentials to the browser

Do not put `DATABASE_URL`, `AIVEN_POSTGRES_URL`, or a Postgres password in `VITE_*` variables. Vite exposes those to client code.[^vite-env]

### Calling the migration complete after row counts only

Row counts prove data copy. They do not prove auth, storage, realtime, or edge behavior.

## Command crib sheet

### Scan Lovable/Supabase repo

```bash
rg "@supabase/supabase-js|supabase\\.from|supabase\\.auth|supabase\\.storage|supabase\\.channel|supabase\\.rpc|functions\\.invoke|VITE_SUPABASE"
```

### Dump Supabase app schema and data

```bash
supabase db dump --db-url "$SOURCE_SUPABASE_DB_URL" --schema public -f schema.sql
supabase db dump --db-url "$SOURCE_SUPABASE_DB_URL" --schema public --data-only --use-copy -f data.sql
```

### Restore into Aiven Postgres

```bash
psql "$AIVEN_POSTGRES_URL" --variable ON_ERROR_STOP=1 --file schema.sql
psql "$AIVEN_POSTGRES_URL" --variable ON_ERROR_STOP=1 --command 'SET session_replication_role = replica' --file data.sql
psql "$AIVEN_POSTGRES_URL" --command 'ANALYZE;'
```

### Generic Postgres dump/restore to Aiven

```bash
pg_dump -d "$SOURCE_POSTGRES_URL" --format directory --jobs 4 -f dumpdir
pg_restore -d "$AIVEN_POSTGRES_URL" --jobs 4 dumpdir
psql "$AIVEN_POSTGRES_URL" -c "ANALYZE;"
```

### Aiven migration status

```bash
avn service migration-status --project "$AIVEN_PROJECT" "$DEST_PG_SERVICE"
```

## Sources

[^lovable-github]: Lovable, "Connect to GitHub", https://docs.lovable.dev/integrations/github

[^lovable-external]: Lovable, "Deploying and hosting outside Lovable Cloud", https://docs.lovable.dev/tips-tricks/external-deployment-hosting

[^supabase-identify-lovable]: Supabase, "Identifying Lovable backend: Lovable Cloud or Supabase", https://supabase.com/docs/guides/troubleshooting/identify-lovable-cloud-or-supabase-backend

[^supabase-self-host-restore]: Supabase, "Restore a Platform Project to Self-Hosted", https://supabase.com/docs/guides/self-hosting/restore-from-platform

[^supabase-cli-dump]: Supabase, "CLI Reference: supabase db dump", https://supabase.com/docs/reference/cli/introduction

[^supabase-auth]: Supabase, "Auth", https://supabase.com/docs/guides/auth

[^supabase-rls]: Supabase, "Row Level Security", https://supabase.com/docs/guides/database/postgres/row-level-security

[^supabase-realtime-postgres]: Supabase, "Postgres Changes", https://supabase.com/docs/guides/realtime/postgres-changes

[^supabase-backups]: Supabase, "Database Backups", https://supabase.com/docs/guides/platform/backups

[^supabase-dashboard-restore]: Supabase, "Restore Dashboard backup", https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore

[^supabase-edge-functions]: Supabase, "Edge Functions", https://supabase.com/docs/guides/functions

[^vite-env]: Vite, "Env Variables and Modes", https://vite.dev/guide/env-and-mode

[^postgres-pgdump]: PostgreSQL, "`pg_dump`", https://www.postgresql.org/docs/current/app-pgdump.html

[^postgres-pgrestore]: PostgreSQL, "`pg_restore`", https://www.postgresql.org/docs/current/app-pgrestore.html

[^postgres-logical-replication]: PostgreSQL, "Logical Replication", https://www.postgresql.org/docs/current/logical-replication.html

[^postgres-copy]: PostgreSQL, "`COPY`", https://www.postgresql.org/docs/current/sql-copy.html

[^aiven-pgdump]: Aiven, "Migrate PostgreSQL databases to Aiven using pg_dump and pg_restore", https://aiven.io/docs/products/postgresql/howto/migrate-pg-dump-restore

[^aiven-db-migrate]: Aiven, "Migrate PostgreSQL databases to Aiven using aiven-db-migrate", https://aiven.io/docs/products/postgresql/howto/migrate-aiven-db-migrate

[^aiven-connect]: Aiven, "Connect to Aiven for PostgreSQL services", https://aiven.io/docs/products/postgresql/howto/list-code-samples
