# Hivemind

**A shared live-context layer for AI-assisted teams.** A local watcher tails every teammate's Claude Code transcripts, normalizes each new record into an `ActivityEvent`, streams it onto a team bus, materializes it into a store, and pushes it to a live web dashboard over SSE — plus "has anyone on the team already done X?" semantic recall.

Point it at the local fallback and it runs anywhere with **zero dependencies**. Flip two env vars and the same code runs on **Aiven Kafka** (the cross-laptop team bus) and **Aiven Postgres + pgvector** (the collective team memory).

## The gap it fills

Single-user Claude Code transcript viewers exist. Claude Code agent-team orchestration exists. What doesn't: a **passive, live, cross-laptop shared *context* layer** with collective semantic recall, on a managed streaming + vector backend. Everyone else reaches for SQLite, WebSockets, or git. Hivemind makes Kafka genuinely load-bearing — the cross-machine sync *is* the Kafka stream, idiomatic event-log streaming — and pgvector the team's shared memory. You stop re-solving what a teammate solved an hour ago on another machine.

## How it works

Each teammate runs Hivemind locally. The watcher reads only that machine's own Claude Code transcripts and publishes events to the bus. In Kafka mode every instance both **produces** its own events to the topic and **consumes** the whole topic, so every laptop sees the entire team's activity. The store materializes the event log into a feed, a `sessions` presence table, and (with Postgres) a searchable vector index.

```
  ┌─────────────────────────────────────── one teammate's laptop ───────────────────────────────────────┐
  │                                                                                                       │
  │   ~/.claude/projects/**/*.jsonl                                                                       │
  │            │                                                                                          │
  │            ▼                                                                                          │
  │      ┌──────────┐   ActivityEvent   ┌──────────────────┐   subscribe   ┌──────────────┐   SSE/REST   │
  │      │ watcher  │ ────────────────► │       BUS        │ ────────────► │    server    │ ───────────► │  browser
  │      │ (tail +  │     publish       │  LocalBus  (fan- │               │  http + SSE  │  /events     │  dashboard
  │      │  parse)  │                   │  out, in-proc)   │               │  /api/*      │              │  (web/)
  │      └──────────┘                   │       — or —     │               └──────┬───────┘              │
  │      ┌──────────┐                   │   KafkaBus ◄─────┼──── Aiven Kafka topic │ insert               │
  │      │ simulate │ ─── publish ────► │   (produce +     │  (every teammate)     ▼                      │
  │      │ (demo)   │                   │    consume)      │               ┌──────────────┐               │
  │      └──────────┘                   └──────────────────┘               │    STORE     │               │
  │                                                                        │ MemoryStore  │               │
  │                                                                        │ (JSONL)      │               │
  │                                                                        │   — or —     │               │
  │                                                                        │ PgStore      │               │
  │                                                                        │ Aiven PG +   │               │
  │                                                                        │ pgvector     │               │
  │                                                                        └──────────────┘               │
  └───────────────────────────────────────────────────────────────────────────────────────────────────┘

  Local path (default):  watcher ─► LocalBus (in-proc fan-out) ─► MemoryStore (in-mem + JSONL) ─► SSE ─► dashboard
  Aiven path:            watcher ─► Kafka topic (team bus) ─► PgStore (Postgres/pgvector) ─► SSE ─► dashboard
```

## Run it (zero-dep local)

Requires **Node ≥ 22.18** (target Node 26). TypeScript runs directly via Node's type-stripping — no build step, no `npm install` for the core path.

```bash
# 1. Watch your own real Claude Code transcripts
node src/index.ts
# → opens http://localhost:3737

# 2. Or run the demo: simulated teammates so a one-laptop demo looks alive
npm run demo          # = HIVEMIND_DEMO=1 node src/index.ts
```

Open `http://localhost:3737`. You'll see live presence cards (who's working on what), a color-coded activity feed, and a "Has anyone on the team…?" search bar. The core uses **no external dependencies** — `LocalBus` (in-process fan-out), `MemoryStore` (in-memory + a JSONL file at `./data/events.jsonl`), and a lexical embedder for search.

Quick sanity check while it's running:

```bash
curl localhost:3737/api/stats
curl localhost:3737/api/feed?limit=5
curl localhost:3737/api/presence
curl "localhost:3737/api/search?q=test"
```

## Run it (Aiven path)

The same code flips to managed Kafka + Postgres via env vars. The Aiven adapters (`KafkaBus`, `PgStore`) load their deps **lazily**, so they're only needed when you opt in.

```bash
# 1. Provision the backend (Aiven MCP) — an agent can do this live:
#    create an Aiven for Apache Kafka service + an Aiven for PostgreSQL service,
#    enable the pgvector extension, and read out connection details.
#    (Kafka is slow to provision — pre-warm it before a demo.)

# 2. Install the lazily-loaded backend deps
npm i pg kafkajs

# 3. Apply the schema to Postgres (creates the vector extension, events + sessions tables, indexes)
psql "$PG_CONNECTION_STRING" -f aiven/schema.sql

# 4. Point Hivemind at Aiven and run it
cp .env.example .env.local   # fill in the values below, then source it / export them
HIVEMIND_BUS=kafka HIVEMIND_STORE=postgres node src/index.ts
```

Run one instance per teammate, all pointed at the same Kafka topic and Postgres database. Each instance publishes its own laptop's activity to the topic and consumes everyone else's — that shared Kafka log is the team bus. Postgres holds the durable, searchable team memory; with an embedder configured, search runs over pgvector cosine similarity, otherwise it falls back to Postgres full-text search.

## Environment variables

Core runs with **no config at all**. Everything below is optional. Copy `.env.example` to `.env.local` to edit.

| Variable | Default | Purpose |
| --- | --- | --- |
| `HIVEMIND_PORT` | `3737` | Dashboard / API port. |
| `HIVEMIND_USER` | `$USER` / hostname | Your teammate name in the feed. |
| `HIVEMIND_PROJECTS_DIR` | `~/.claude/projects` | Where Claude Code writes transcripts to tail. |
| `HIVEMIND_BACKFILL` | `25` | Recent records per transcript replayed on startup. |
| `HIVEMIND_ACTIVE_WINDOW_MS` | `90000` | Presence "active" threshold (ms). |
| `HIVEMIND_REDACT` | `true` | Scrub obvious secrets (`sk-…`, `ghp_…`, `AKIA…`, Bearer tokens, JWTs) from event text. |
| `HIVEMIND_DEMO` | `false` | `true` → also run simulated teammates. |
| `HIVEMIND_DATA_FILE` | `./data/events.jsonl` | Memory-store persistence path (JSONL). |
| **Backend selection** | | |
| `HIVEMIND_BUS` | `local` | `local` (in-proc fan-out) or `kafka` (Aiven). |
| `HIVEMIND_STORE` | `memory` | `memory` (in-mem + JSONL) or `postgres` (Aiven). |
| **Aiven for PostgreSQL** (when `HIVEMIND_STORE=postgres`) | | |
| `PG_CONNECTION_STRING` | — | e.g. `postgres://avnadmin:PWD@HOST:PORT/defaultdb?sslmode=require`. |
| **Aiven for Apache Kafka** (when `HIVEMIND_BUS=kafka`) | | |
| `KAFKA_BROKERS` | — | `host1:port1,host2:port2`. |
| `KAFKA_TOPIC` | `hivemind.events` | Topic carrying the team event log. |
| `KAFKA_SSL` | `true` | TLS to the brokers. |
| `KAFKA_USERNAME` | `avnadmin` | SASL username. |
| `KAFKA_PASSWORD` | — | SASL password. |
| `KAFKA_SASL_MECHANISM` | `scram-sha-256` | `scram-sha-256` or `plain`. |
| **Optional semantic embeddings** (pgvector search; if unset, Postgres uses full-text search) | | |
| `EMBED_URL` | — | OpenAI-compatible embeddings endpoint, e.g. `https://api.openai.com/v1/embeddings`. |
| `EMBED_API_KEY` | — | Bearer key for the embeddings endpoint. |
| `EMBED_MODEL` | `text-embedding-3-small` | Embedding model id. |
| `EMBED_DIM` | `256` | Embedding dimensions (must match `vector(256)` in `aiven/schema.sql`). |

## What's intentionally out of scope

- **No auth / multi-tenant isolation.** It assumes one trusted team sharing one topic + database. No login, no per-user access control.
- **Not the desktop chat surface.** Hivemind targets the Claude Code surface (terminal, or hosted in the desktop app) where transcripts are readable JSONL. It does not read the desktop chat window (locked IndexedDB).
- **Best-effort redaction, not DLP.** `redact()` catches obvious secret shapes; it is not a guarantee. Don't point it at transcripts full of sensitive data and assume they're scrubbed.
- **No replay/history UI.** The dashboard shows live presence + a rolling feed + search. There's no time-scrubber, threading, or per-session deep-dive view.
- **No production hardening.** No retries/backpressure tuning on the Kafka consumer, no migrations framework, no horizontal scaling of the server. This is a hackathon prototype: dependency-light and readable over robust.
- **No transcript editing or write-back.** Hivemind only reads transcripts; it never modifies Claude Code state.
