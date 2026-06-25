# Migration Info Hub

This directory stores raw reference material for the Lovable/Supabase to Aiven migration work.

It is not the canonical demo plan. The canonical implementation roadmap is
[`../plans/CRITICAL_PATH.md`](../plans/CRITICAL_PATH.md). Current product decisions live in
`../STATUS.md`, `../DEMO_FLOW.md`, and `../plans/`.

## Files

| File | Raw data included |
| --- | --- |
| [`LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`](LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md) | Lovable/Supabase backend ownership notes, Supabase usage scanner patterns, dump/restore mechanics, Aiven Postgres setup checks, validation queries, adapter boundary, failure modes, command crib sheet, and source links. |
| [`AGENTIC_DATABASE_MIGRATION_MARKET_SCAN.md`](AGENTIC_DATABASE_MIGRATION_MARKET_SCAN.md) | Company/tool landscape, OSS migration primitives, adjacent governance tools, category patterns, hard migration problems, risks, and source links. |

## Raw Reference Categories

### Lovable/Supabase Inputs

- Lovable app code export or GitHub sync.
- Owned Supabase project versus Lovable Cloud / Lovable-managed backend.
- Source database URL or export files.
- Supabase migrations under `supabase/migrations`.
- Supabase client usage in application code.

### Supabase Behaviors To Detect

- `@supabase/supabase-js`
- `VITE_SUPABASE_*`
- `supabase.from(...)`
- `supabase.auth`
- `supabase.storage`
- `supabase.channel(...)`
- `supabase.rpc(...)`
- `functions.invoke(...)`
- SQL migrations, RLS policies, triggers, functions, indexes, extensions, and publication statements.

### Aiven/Postgres Migration Mechanics

- Aiven Postgres connection and TLS requirements.
- Extension checks such as `pgcrypto` and `vector`.
- `supabase db dump`.
- `pg_dump`, `pg_restore`, and `psql`.
- Aiven `aiven-db-migrate`.
- Logical replication / CDC for larger migrations.
- Row counts, smoke queries, extension checks, inserts, trigger checks, and index checks.

### Browser And Backend Boundary

- Aiven Postgres credentials must stay out of browser-visible `VITE_*` variables.
- Frontend calls should go through a backend adapter.
- The backend adapter owns Aiven Postgres connectivity.

### Market Data Categories

- Platform migration agents.
- Neutral migration automation.
- Validation and reconciliation tools.
- Governance and delivery tools.
- Open-source schema migration tools.
- Open-source data movement and replication tools.
- Cross-engine conversion and loading tools.
- AI SQL clients and database workbenches.

## Authority

Use this directory for source facts and citations.

Do not use it to resolve architecture conflicts. Current Aiden specs win over older recommendation language in these reference docs.
