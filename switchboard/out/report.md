# Migration report — PulseBoard

**Target:** Aiven pg-22a59da (free-1-1gb, do-ams) in samukahonen-dc30

## Migrated

- ✅ **Database schema (3 tables, 2 indexes)** — Recreated on Aiven Postgres via MCP SQL.
- ✅ **RLS policies (6)** — Policy logic transfers verbatim; auth.uid() rebound to a per-request GUC.
- ✅ **Auth (users + sessions)** — Recreated as pgcrypto tables + a thin auth API.
- 🟡 **Realtime (1 channel(s))** — NOTIFY-over-SSE works today; Kafka topics cards.changes for scale.
- ⛔ **Storage (file uploads)** — No managed Aiven object store; left on Supabase / external bucket.

## Gaps

- **Supabase Storage** — Aiven has no managed S3-compatible object store, so avatar/file uploads have no drop-in target.
- **RLS role/grant migration via MCP** — The Aiven MCP pg_write tool blocks GRANT/CREATE ROLE, so non-owner RLS roles must be created out-of-band.

## What Aiven should build

- Supabase Storage: Aiven for Object Storage (S3 API). Until then the app keeps Supabase Storage or wires its own bucket.
- RLS role/grant migration via MCP: Allow scoped role/grant statements in the MCP so RLS-complete migrations are fully autonomous.
- Ship an Aiven MCP "migrate from Supabase" command so vibe-coded apps onboard in one step.

_Generated 2026-06-25T07:08:42.335Z._