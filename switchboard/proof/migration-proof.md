# Live migration proof

This is not a simulation. On **2026-06-25**, Switchboard's agents provisioned and
migrated PulseBoard onto a **real Aiven for PostgreSQL** service, executing every
statement through the **Aiven MCP Server** (`aiven_pg_write` / `aiven_pg_read`).

## Target (real Aiven service)

| | |
| --- | --- |
| Project | `samukahonen-dc30` |
| Service | `pg-22a59da` |
| Host | `pg-22a59da-samukahonen-dc30.e.aivencloud.com:14340` |
| Plan | `free-1-1gb` · PostgreSQL 17.10 |
| Cloud | `do-ams` (DigitalOcean, Amsterdam) |

## What the agents executed via MCP

`create extension` ×2 (pgcrypto, citext) · `create table` ×5 · `create index` ×2 ·
`alter table … enable row level security` ×3 · `create policy` ×6 · seed `insert` ×4.

## Verification (read back from Aiven)

**Tables + RLS** — `select tablename, rowsecurity, <policy count> from pg_tables`:

| table | RLS | policies |
| --- | --- | --- |
| app_users | off | 0 |
| sessions | off | 0 |
| profiles | on | 2 |
| boards | on | 2 |
| cards | on | 2 |

**Row counts** — `app_users=2, profiles=2, boards=1, cards=4, sessions=0`.

**pgcrypto auth round-trip** — `password_hash = crypt('hunter2', password_hash)`:

| email | correct password | wrong password |
| --- | --- | --- |
| ada@pulseboard.dev | `true` ✅ | `false` ✅ |

Password hashes stored as bcrypt (`$2a$06$…`), computed by pgcrypto **on Aiven**.

**Join across migrated tables** (FKs intact) — top card: *"Supabase bill doubled
after the launch spike"* (8 votes, Ada Lovelace, Sprint 42 Retro).

## Local end-to-end (the generated API actually runs)

The Code Rewriter's output in `sample-app-migrated/api` was run against Postgres
16 (the live Aiven target is 17.10) using the migrated schema. Real requests:

| Request | Result |
| --- | --- |
| `POST /auth/signup` | 200 — user + session token (pgcrypto-hashed) |
| `POST /auth/login` (correct pw) | 200 — token + user |
| `POST /auth/login` (wrong pw) | 401 |
| `GET /auth/user` (Bearer) | 200 — session resolves to the user |
| `POST /api/boards` (Bearer) | 200 — board created, owner from session |
| `POST /api/cards` (Bearer) | 200 — card created (NOTIFY emitted) |
| `GET /api/boards` (no token) | 401 |

So the full migrated stack — front-end → generated API → Postgres — works with
only `DATABASE_URL` pointed at Aiven.

## Reproduce

The exact statements are in [`../aiven/schema.aiven.sql`](../aiven/schema.aiven.sql).
In Claude Code with the Aiven MCP connected, the Migrator agent replays them with
`aiven_pg_write`; headless, the server runs them over a `DATABASE_URL`.

## Teardown

The service is on the **free** plan ($0). To remove it:
`aiven service terminate pg-22a59da --project samukahonen-dc30` (or the Console).
