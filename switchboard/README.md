# Switchboard — Vibe Deploy

**Move a Lovable / Bolt app off Supabase and onto Aiven, with an agent crew.**

Lovable, Bolt, and friends generate apps on **Supabase** by default — that's a big
reason Supabase is now a $10.5B company. Supabase is, underneath, just Postgres +
GoTrue + PostgREST + Realtime + Storage. Aiven has the same core technology
(managed Postgres, Kafka) but captures none of this market.

Switchboard proves Aiven **can** be the backend for vibe-coded apps. Point it at a
Supabase app and an agent crew analyzes it, provisions Aiven **through the Aiven
MCP**, migrates the schema + auth, rewrites the client, and reports the gaps.

> This is not a mock. On 2026-06-25 the crew migrated the bundled app onto a real
> Aiven for PostgreSQL service, executing every statement through the Aiven MCP.
> See [proof/migration-proof.md](proof/migration-proof.md).

## The crew

| Agent | Does | Code |
| --- | --- | --- |
| 1 · Code Analyzer | Scans the repo for every supabase-js call + the SQL schema → an analysis | [analyzer.ts](server/agents/analyzer.ts) |
| 2 · Provisioner | Provisions Aiven Postgres (+ Kafka if realtime) via MCP | [aiven-ops.ts](server/agents/aiven-ops.ts) |
| 3 · Schema Migrator | Recreates tables, **pgcrypto auth tables**, indexes, RLS — via MCP SQL | [aiven/schema.aiven.sql](aiven/schema.aiven.sql) |
| 4 · Code Rewriter | Rewrites the client + generates a thin API over Aiven (a real codemod) | [rewriter.ts](server/agents/rewriter.ts) |
| 5 · Migration Reporter | What moved, what didn't, what Aiven should build | [reporter.ts](server/agents/reporter.ts) |

[planner.ts](server/agents/planner.ts) turns the analysis into the plan;
[orchestrate.ts](server/agents/orchestrate.ts) runs the whole thing.

## The secure way in: Connect Supabase (no .env, no password)

The front door is **"Connect Supabase"**, not "paste your whole `.env`". You
authorize through Supabase **OAuth** (or paste a single revocable `sbp_` access
token); Switchboard then reads your project — list projects, introspect the
schema, read rows — entirely over the **Supabase Management API**
(`POST /v1/projects/{ref}/database/query`). What that buys you:

- **No database password and no `.env` ever leave your machine.** The migration
  only needs to *read* the source, and it does that with a scoped token.
- **The token never touches the browser.** It's exchanged server-side (OAuth
  Authorization Code + PKCE) and held in memory keyed by an httpOnly session
  cookie — never written to disk, never logged, dropped on disconnect.
- **You revoke it anytime** — in the Supabase dashboard, independently of us.
- Your Stripe / OpenAI / JWT secrets aren't involved at all, because the whole
  `.env` was never the input.

Operator setup is one-time: register an OAuth app (Supabase → Organization →
OAuth Apps), set `SUPABASE_OAUTH_CLIENT_ID` / `SUPABASE_OAUTH_CLIENT_SECRET` /
`SUPABASE_OAUTH_REDIRECT_URI` in `switchboard/.env`. Without those, the cockpit
falls back to a pasted personal access token (still scoped + revocable). The old
"paste a `.env` / a GitHub repo URL" flow is still there under **Advanced**.

## Run the cockpit

```sh
cd switchboard
npm install
npm run dev            # web on :5173, api on :8787
```

Open http://localhost:5173 → **Analyze this app** → **Migrate to Aiven**. Two
clicks; the five agents run with nothing in between. It boots in **simulate**
mode (no credentials, nothing destructive) but every number shown — schema,
policies, row counts, the rewrite diff — is real output from the agents and the
live migration.

## Run the crew headless

```sh
npx tsx server/agents/orchestrate.ts sample-app    # writes out/
npx tsx server/agents/analyzer.ts   sample-app     # just the analysis
npx tsx server/agents/rewriter.ts   sample-app sample-app-migrated
```

`out/` gets `analysis.json`, `plan.json`, `mcp-ops.json` (the exact Aiven MCP
calls), `rewrite.json`, and `report.md`.

## The migrated app actually runs

The Rewriter generates [sample-app-migrated/](sample-app-migrated) — the sample
app with Supabase swapped for Aiven. `App.tsx` doesn't change; only `src/lib/`
does, plus a generated `api/` (thin Express over Aiven Postgres, ready for Aiven
Apps). To run it against any Postgres:

```sh
cd sample-app-migrated/api && npm install && cp .env.example .env   # paste DATABASE_URL
npm run dev                                                          # :8089
cd .. && npm install && npm run dev                                  # :5174
```

Verified end-to-end (signup → login → session → board → card → list, with 401 on
unauthorized) against Postgres 16; the live Aiven target runs Postgres 17.10. See
[proof/migration-proof.md](proof/migration-proof.md).

## What migrates — and what doesn't (the honest part)

- ✅ **Database** — tables, indexes, constraints, sequences → Aiven Postgres.
- ✅ **Auth** — `auth.users` becomes `app_users` + `sessions` with **pgcrypto**
  bcrypt hashing (verified live on Aiven), behind a thin auth API.
- ✅ **RLS** — policies are standard Postgres; they transfer verbatim. Only the
  identity function changes (`auth.uid()` → a per-request `app.user_id` GUC).
- 🟡 **Realtime** — `supabase.channel()` → Postgres LISTEN/NOTIFY over SSE today;
  Aiven Kafka (`cards.changes`) for high fan-out (adapter generated).
- ⛔ **Storage** — Aiven has no managed object store, so Supabase Storage has no
  drop-in target. The Reporter flags it and recommends Aiven build it.

## What Aiven should build (the pitch's punchline)

1. **Aiven for Object Storage** (S3 API) — close the Storage gap.
2. **Managed auth** (GoTrue on Aiven Postgres) — make auth a zero-code swap.
3. **A Postgres-changes → Kafka/websocket bridge** — managed realtime.
4. **An MCP `migrate-from-supabase` command** — so vibe-coded apps onboard in one step.

## Make it fully real (your own app + your own Aiven)

In the cockpit, "Migrate your own repo instead" analyzes any local path. To
provision/migrate against your own Aiven account headless, set `.env`
(`AIVEN_TOKEN`, `AIVEN_PROJECT`, `MIGRATION_MODE=real`) — the server then drives
the real Aiven API and `pg_dump | psql`. In Claude Code, the agents drive the
Aiven MCP directly (`aiven_service_create`, `aiven_pg_write`, `aiven_kafka_topic_create`).

## Layout

```
sample-app/            the Lovable app being migrated (Supabase)
aiven/schema.aiven.sql the migrated schema (executed live via MCP)
proof/                 evidence of the real migration
server/agents/         the 5 agents + orchestrator + Aiven MCP op planner
server/agents/templates/migrated/  what the Rewriter emits
src/                   the cockpit (Vite + React)
server/index.ts        the cockpit API (analyze + the SSE crew)
aiven-stack/           bonus: GoTrue + PostgREST on Aiven (drop-in, no rewrite)
```

## Teardown

The Aiven target is the free plan ($0). To remove it:
`aiven service terminate pg-22a59da --project samukahonen-dc30` (or the Console).
