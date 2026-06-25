# Provisioning the Hivemind backend on Aiven

This is the **hero moment**: an agent stands up the team's shared-context backend live, talking to the
**Aiven MCP** (control plane) to create managed **PostgreSQL + pgvector** and **Apache Kafka** services,
then wires them so Hivemind flips from its zero-dep local fallback to the real cross-laptop stream.

Hivemind needs exactly two managed services:

| Service        | Role in Hivemind                                                                 | Config it backs            |
|----------------|----------------------------------------------------------------------------------|----------------------------|
| Aiven Kafka    | the **team bus** — every teammate publishes/consumes `hivemind.events`           | `HIVEMIND_BUS=kafka`       |
| Aiven Postgres | the **collective memory** — materialized state + pgvector semantic recall        | `HIVEMIND_STORE=postgres`  |

> ⏱ **Latency warning, read first.** Kafka takes several minutes to go `RUNNING` on Aiven (brokers,
> networking, certs). **Do NOT live-provision Kafka on stage.** Pre-warm it before the pitch and keep the
> recorded fallback ready. Postgres comes up faster and is the safer thing to create live if you want a
> visible "watch the agent build it" beat. Everything below has a manual fallback for when the MCP is slow
> or unauthenticated.

---

## 0. Authenticate the Aiven MCP

The MCP server (`https://mcp.aiven.live/mcp`) is OAuth-gated. Before any control-plane call:

1. Call `mcp__aiven__authenticate` → returns an authorization URL.
2. User opens it, authorizes, lands on `http://localhost:<port>/callback?code=...&state=...`.
3. Pass that full callback URL to `mcp__aiven__complete_authentication`.

Once complete, the server's real control-plane tools (service create/list, project/plan/cloud listing,
topic + database management) become available automatically. **The tool names below are the canonical Aiven
control-plane verbs; confirm the exact names exposed by the MCP after auth — surface them with the MCP's own
list, don't assume — they map 1:1 to the Aiven API / `avn` CLI.**

---

## 1. Control plane — create the services (via Aiven MCP)

### 1a. Pick a project, cloud, and plans

Hivemind doesn't care *where* it runs, only that both services share a cloud region for low latency. Have the
agent read these first so it isn't guessing:

- **list projects** → choose the team's Aiven project (the billing/ownership scope all services live under).
- **list clouds** → pick one region and reuse it for BOTH services (e.g. `google-europe-north1` — Finland,
  matches a Helsinki team; any `aws-eu-*` / `azure-*` works). Co-locating cuts cross-service latency.
- **list service plans / pricing** for `pg` and `kafka` → pick the **cheapest plan that satisfies the
  constraint**: Kafka plans must support topic creation (Startup-tier and up do). For a hackathon:
  - Postgres: smallest `hobbyist`/`startup` plan is plenty (a few thousand events + 256-dim vectors).
  - Kafka: smallest `startup` plan; **enable `kafka_rest`/Karapace only if you want the console UI** — the
    Hivemind client speaks the native protocol over SASL/SSL and does not need REST.

### 1b. Create Postgres (pgvector)

Call the service-create tool (`aiven_service_create` / equivalent):

```
service_type: pg
service_name:  hivemind-pg
project:       <team-project>
cloud:         google-europe-north1
plan:          startup-4            # smallest that fits
# pgvector ships as an available extension on Aiven for PostgreSQL — no plan add-on needed;
# we CREATE EXTENSION in the schema step below.
```

This can be created **live on stage** — it reaches `RUNNING` relatively quickly. Poll the service-get tool
until `state == RUNNING`, then read its connection info (host, port, `defaultdb`, user `avnadmin`, password,
and the `sslmode=require` URI).

### 1c. Create Kafka (PRE-WARM — do this before the pitch)

```
service_type: kafka
service_name:  hivemind-kafka
project:       <team-project>
cloud:         google-europe-north1   # same region as pg
plan:          startup-2
# user_config:
#   kafka.auto_create_topics_enable: false   # we create the topic explicitly (1d)
#   schema_registry: false                   # not needed
#   kafka_rest:      false                    # optional; native protocol only
```

Kafka provisioning is the slow one (minutes). Create it ahead of time; by stage time it's already `RUNNING`
and you only demonstrate the *Postgres* create live (or replay the recording).

---

## 2. Data plane — wire the services

After both services are `RUNNING`:

### 2a. Kafka — create the topic

Hivemind publishes/consumes a single topic. Default name (from `src/config.ts`): **`hivemind.events`**.

Via the MCP's Kafka topic-management tool (or `avn service topic-create`):

```
service:     hivemind-kafka
topic:       hivemind.events
partitions:  3          # any >=1; keying is by actor so ordering-per-actor is preserved within a partition
replication: 2          # <= broker count on the plan
retention:   a few hours is fine for a demo (events are also persisted in Postgres)
```

> If `auto_create_topics_enable` is left on you can skip this — the first `producer.send` creates it. Creating
> it explicitly is cleaner and lets you set partitions/retention. **Consumers use `fromBeginning:false`**
> (live tail) and a **unique group per process** (`hivemind-<actor>-<pid>-<ts>`), so every teammate's machine
> receives every event rather than load-balancing a shared group — see `src/bus.ts` `KafkaBus.start()`.

### 2b. Postgres — enable pgvector + apply the schema

Hivemind's `PgStore.init()` deliberately does **not** run DDL — the schema is applied out of band (see
`CONTRACT.md`). Apply `aiven/schema.sql`, which:

- `CREATE EXTENSION IF NOT EXISTS vector;` (pgvector)
- creates `events` (with `embedding vector(256)` nullable + a generated `tsvector` for full-text fallback)
  and the materialized `sessions` table, plus their indexes.

```bash
psql "postgres://avnadmin:PWD@HOST:PORT/defaultdb?sslmode=require" -f aiven/schema.sql
```

If the agent can't shell out to `psql`, the same statements can be run through the MCP's
database/query tool against `hivemind-pg`. The file is idempotent (`IF NOT EXISTS` throughout), so re-running
on stage is safe.

> The ANN index (`ivfflat ... vector_cosine_ops`) is intentionally left commented out in `schema.sql` — build
> it only after some embeddings exist and tune `lists`. Lexical/full-text search works immediately without it.

---

## 3. Point Hivemind at the new services (exact env vars)

Copy `.env.example` → `.env.local` and fill in the values the MCP returned. These names are the **frozen
contract** in `src/config.ts` — nothing reads `process.env` outside that file.

```bash
# --- flip the backends on ---
HIVEMIND_BUS=kafka          # local | kafka      -> uses KafkaBus
HIVEMIND_STORE=postgres     # memory | postgres  -> uses PgStore

# --- Aiven for PostgreSQL (from hivemind-pg connection info) ---
PG_CONNECTION_STRING=postgres://avnadmin:PWD@HOST:PORT/defaultdb?sslmode=require
# (DATABASE_URL is accepted as a fallback alias)

# --- Aiven for Apache Kafka (from hivemind-kafka connection info) ---
KAFKA_BROKERS=HOST:PORT             # comma-separate if the plan exposes multiple brokers
KAFKA_TOPIC=hivemind.events         # must match the topic created in 2a
KAFKA_SSL=true
KAFKA_USERNAME=avnadmin
KAFKA_PASSWORD=PWD
KAFKA_SASL_MECHANISM=scram-sha-256  # Aiven default; "plain" if the service is configured for it

# --- optional: real semantic embeddings for pgvector cosine search ---
# Leave unset and PgStore uses Postgres full-text (plainto_tsquery) instead — search still works.
# EMBED_URL=https://api.openai.com/v1/embeddings
# EMBED_API_KEY=...
# EMBED_MODEL=text-embedding-3-small
# EMBED_DIM=256                     # MUST equal the vector(256) column in schema.sql
```

Notes that bite if you get them wrong:

- **Install the lazy deps once**: `npm i pg kafkajs`. They are imported lazily inside `PgStore`/`KafkaBus`,
  so the core path never needs them — but the Aiven path throws a friendly "run `npm i …`" error if absent.
- **`EMBED_DIM` must equal the column dimension** (`vector(256)` in `schema.sql`). If you point at an
  embedding model with a different dimension, either change both or leave embeddings off and rely on
  full-text. With no embedder, `PgStore.insert` stores a null `embedding` and `search` degrades to
  `tsv @@ plainto_tsquery(...)` — still ranked, still useful.
- **SSL is on by default** for both (`KAFKA_SSL=true`; `PgStore` uses `ssl:{rejectUnauthorized:false}`),
  which is what Aiven's managed endpoints expect.

Start it:

```bash
npm start          # node src/index.ts
```

The startup banner should now report `bus=kafka  store=postgres`. Each teammate runs the same command with the
same `.env.local` (their own `HIVEMIND_USER`), and the Kafka topic fans every machine's Claude Code activity
to every other machine — that cross-laptop sync *is* the Kafka stream.

---

## 4. Manual fallback (no MCP / MCP too slow)

Everything above maps 1:1 to the Aiven console and the `avn` CLI. Use this when auth fails on stage or Kafka
provisioning stalls.

**Console:** Create service → pick PostgreSQL and Kafka, same cloud/region, smallest plans → wait for
`RUNNING` → copy the connection URIs into `.env.local`. For the topic: Kafka service → *Topics* → Add topic
`hivemind.events`. For pgvector: open the *Query editor* (or `psql`) and run `aiven/schema.sql`.

**CLI** (sketch — flags vary by `avn` version):

```bash
avn service create hivemind-pg    -t pg    --plan startup-4 --cloud google-europe-north1
avn service create hivemind-kafka -t kafka --plan startup-2 --cloud google-europe-north1 \
    -c kafka.auto_create_topics_enable=false
avn service wait hivemind-pg
avn service wait hivemind-kafka
avn service topic-create hivemind-kafka hivemind.events --partitions 3 --replication 2
avn service get hivemind-pg    --format '{service_uri}'   # -> PG_CONNECTION_STRING
avn service get hivemind-kafka --json                     # -> brokers, SASL user/pass, SSL
psql "$PG_CONNECTION_STRING" -f aiven/schema.sql
```

Then fill the same env vars from §3 and `npm start`.

---

## 5. Stage runbook (tl;dr)

1. **Before the pitch:** auth the MCP, **pre-warm `hivemind-kafka`** (slow), apply `schema.sql` to a
   pre-warmed `hivemind-pg`, create the `hivemind.events` topic, and smoke-test `npm start` once with
   `bus=kafka store=postgres`. Keep a recording of a successful run.
2. **On stage (the hero moment):** have the agent create `hivemind-pg` **live** via the MCP, poll to
   `RUNNING`, read the URI, run `schema.sql`, drop `PG_CONNECTION_STRING` + the pre-warmed Kafka vars into
   `.env.local`, and `npm start` — the dashboard lights up with the whole team's live Claude Code activity,
   backed by managed Kafka + pgvector the agent just stood up.
3. **If anything stalls:** fall to the recording or the local zero-dep path (`HIVEMIND_BUS=local`,
   `HIVEMIND_STORE=memory`, `HIVEMIND_DEMO=1`) — the same UI, no backend required.
