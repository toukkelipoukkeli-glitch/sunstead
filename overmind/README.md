# Aiven Overmind

> **Point Overmind at any Lovable/Supabase app → a swarm of agents rebuilds it on Aiven,
> 100% working, while you watch — then runs it for you forever.**

Aiven Overmind is an autonomous agent swarm that **graduates a vibe-coded Lovable/Supabase app
onto Aiven**. It doesn't just copy tables. It recovers what the app *expected its backend to do* —
auth, storage, realtime, data API, vector search — re-expresses each behavior on an Aiven-native
primitive, generates the replacement backend, self-heals it until every smoke test is green,
verifies the cutover, and then **stays on as an always-on CTO operator** reading live Aiven metrics.

This is the ambitious sibling of the sensible one-click migrator. Where the honest "Aiden" approach
**flags** the hard behaviors (auth/storage) as "adapter required," **Overmind builds them**. Zero
Supabase. Zero flags. Full autonomy — bounded by typed tools and an auditable receipt ledger.

---

## What it is, in one screen

A single npm package with five concerns and a live mission-control UI:

| Layer | What it does |
|---|---|
| **`core/`** | Deterministic migration brain. Scans the repo + introspects the source DB → a **behavior graph** (the heart of "behavior migration"). No Aiven, no network except the source DB. |
| **`aiven/`** | All Aiven access — the **judged MCP surface**. A Claude agent drives the live Aiven MCP (`aiven_*` tools); a REST path is the deterministic fallback. Every action → a `Receipt`. |
| **`surgeon/`** | Codegen. Emits a real Aiven-native backend (own JWT auth, `/api` data routes over Aiven PG, Kafka→SSE realtime bridge, pgvector search, bytea storage), modeled on `demo/pulsewall-aiven`. |
| **`agents/`** | The Anthropic Agent SDK **swarm** — Recon · Architect · Surgeon · Healer · CTO — bounded tool-loops that add reasoning + narration on top of the deterministic core. |
| **`server/`** | The **orchestrator + 10-phase state machine**, SSE fan-out, self-heal loop, verifier, and the persistent CTO tick. Plus WorkOS auth (humans via AuthKit, **agents self-register** for scoped JWTs). |
| **`web/`** | Mission Control — a React dashboard that is a **pure function of the `/api/stream` SSE**: swarm nodes, the behavior graph filling in, receipts streaming, the Aiven plane, cost card, CTO panel. |

The whole thing degrades gracefully: every external dependency (Anthropic key, Aiven token, target
DB) is optional. Missing one drops that stage to a clearly-labelled deterministic path so the
pipeline — and the demo — always runs end to end. Real where it's real, honest where it isn't.

---

## Architecture

### The swarm (Anthropic Agent SDK + Aiven MCP)

A live mesh of specialist agents, each a **bounded** Claude tool-loop (hard turn ceiling, typed
tools, receipt ledger — autonomy that's auditable, not a free-form shell):

- **Recon** — scans the repo + introspects the source DB, reasons about the behavior graph.
- **Architect** — graph → target Aiven stack (PG + pgvector, Kafka topics) + plan + cost.
- **Operator** — drives the **Aiven MCP**: provision PG + Kafka, topics, connection info, receipts.
- **Surgeon** — *generates* the Aiven-native backend, one service per behavior.
- **Migrator** — moves schema + data + embeddings into Aiven Postgres.
- **Healer** (loop) — deploy → smoke-test → read error → patch → repeat until green.
- **Verifier** — row-count parity, smoke query, Kafka roundtrip, auth flow, pgvector search.
- **CTO** (persistent) — reads live Aiven metrics → scaling / index / cost / **carbon** moves.

### The 10-phase state machine (`server/orchestrator.ts`)

```
recon → graph → plan → provision → migrate → generate → heal → verify → cutover → operate
```

Each phase is wrapped: a thrown error becomes a `{type:'log'|'error'}` event and the run continues
where it's safe to. Every phase emits typed `SwarmEvent`s the UI renders live. The contract for the
whole system is one file — [`shared/types.ts`](shared/types.ts) — imported by every package *and*
the UI, so the swarm's parts cohere.

### The Aiven MCP (the judged core)

`aiven/mcp.ts` runs an Anthropic agent wired to the live Aiven MCP
(`https://mcp.aiven.live/mcp?allow_secrets=true`, bearer `AIVEN_TOKEN`) via the Messages API MCP
connector. The agent calls `aiven_*` tools **itself**; every tool call is turned into a `Receipt`
and streamed to the control room. MCP usage spans the surface:

`aiven_project_list` · `aiven_service_list` · `aiven_service_get` · `aiven_service_type_plans` ·
`aiven_service_plan_pricing` · `aiven_service_create` · `aiven_service_connection_info` ·
`aiven_pg_service_available_extensions` · `aiven_pg_write` · `aiven_pg_read` ·
`aiven_kafka_topic_create` · `aiven_kafka_topic_message_produce` · `aiven_kafka_topic_message_list` ·
`aiven_service_metrics_fetch` · `aiven_pg_optimize_query`.

> MCP is the **control plane and proof layer** — provisioning, inspection, schema/metadata writes,
> Kafka topics/events, validation reads, metrics, receipts — *not* the bulk data pipe. (Note:
> `aiven_pg_write` blocks `CREATE FUNCTION`/`DROP`, so functions/triggers apply over a direct `pg`
> connection in `aiven/pg.ts`.)

### Agentic auth (autonomy you can trust)

`server/workos.ts` gives humans a WorkOS AuthKit login **and lets an agent register itself**
(`POST /api/agents/register`) to receive scoped, short-lived credentials before it can `POST
/api/run`. With no `WORKOS_API_KEY` this runs in self-contained **mock mode** (locally-signed scoped
JWTs) so the agentic-signup story demos with zero external account.

---

## How to run it

Prereqs: Node 20+. `node_modules` is already installed — **do not** run `npm install`.

```bash
# 1. Configure (all keys optional — missing ones degrade gracefully)
cp .env.example .env.local        # then fill what you have

# 2. Dev: API (:8788) + Vite web (proxied /api → :8788), both with hot reload
npm run dev

# 3. Or headless: stream every SwarmEvent as one JSON line on stdout
npm run migrate:demo              # drives the full 10-phase run against demo/live-hype-wall

# 4. Production-style: build the web bundle, then serve it from the API
npm run build && npm start        # http://0.0.0.0:8788
```

**API surface** (Hono, binds `0.0.0.0:8788`):

- `GET /api/health` — readiness + which integrations are live (`aiven`/`anthropic`/`workos`).
- `GET /api/stream` — SSE of `SwarmEvent`s (`event: pulse` + `event: ping` heartbeat). The UI is a
  pure function of this stream; multiple browsers watch the same run live.
- `POST /api/run {source?}` — start a migration (auth-gated: human session **or** registered agent).
- `POST /api/agents/register` — an agent self-registers for scoped credentials.

**Environment** (`.env.local`, see `.env.example`):

- `AIVEN_TOKEN`, `AIVEN_PROJECT=touko-1f1c` — the live Aiven MCP / REST surface.
- `ANTHROPIC_API_KEY` — the swarm + the Aiven-MCP agent. **Unset → agents run deterministic paths.**
- `DATABASE_URL`, `KAFKA_*` — the target Aiven PG + Kafka, filled after provisioning.
- `SOURCE_REPO_DIR` (default `../demo/live-hype-wall`), `SOURCE_DATABASE_URL` — the app to migrate.
- `WORKOS_*` — optional; absent → mock-mode agentic auth.

---

## Real proof points (no smoke)

What is genuinely real in the demo, and where to see it:

- **A real 32-behavior graph.** `core/graph.ts` fuses the static repo scan (`core/scan.ts`) and live
  DB introspection (`core/introspect.ts`) into one classified `BehaviorGraph` — table / index /
  function / trigger / RLS / extension / realtime / auth / storage / RPC / edge-function / client
  call — each with classification, dependency edges, evidence (file:line or `pg_*` catalog), and a
  blended **0–100 readiness score** (the proof number). This is behavior migration, not a `pg_dump`.
- **MCP-provisioned Aiven stack.** `overmind-pg` (Postgres + pgvector) and, when the source has
  realtime, `overmind-kafka` — created and inspected **live through the Aiven MCP** on project
  `touko-1f1c`, with every `aiven_*` call written to the receipt ledger the UI streams.
- **Real migrated data.** Schema + representative rows + embeddings land in Aiven Postgres; the
  Verifier asserts **row-count parity** against the source and a live smoke query (`select 1`,
  `pg_extension` check for `vector`).
- **Realtime actually hops over Aiven Kafka.** At cutover the realtime spine produces an event to an
  Aiven Kafka topic and consumes it back — Supabase Realtime re-expressed as a Kafka + SSE bridge.
- **The self-heal loop runs real generated code.** `server/heal.ts` deploys the Surgeon's output,
  smoke-tests it, feeds real errors to the Healer agent, patches, and retries until green.
- **The CTO agent emits real recommendations from real metrics.** `server/cto.ts` reads live Aiven
  metrics via the MCP/REST surface → scaling / index / pooling / **carbon-aware region** moves.
- **Agents authenticate themselves.** An agent self-registers for a scoped JWT before it can start a
  migration — autonomy with a human-checkable boundary.

The honest line for the judges: **real where it's real, honest where it isn't.** Anything that needs
a key you didn't set is clearly labelled "planned" in the stream, never faked as live.

---

## Reuse / reference

- `demo/live-hype-wall` — a real Lovable source app the Recon agent scans.
- `demo/pulsewall-aiven` — the target backend shape the Surgeon generates *toward* (copy its server
  patterns); `demo/pulsewall-aiven/db/schema.sql` is the reference Aiven schema.

See [`MOONSHOT.md`](MOONSHOT.md) for the vision, [`CONTRACT.md`](CONTRACT.md) for the module map and
build contract, and [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for the 4-minute stage script.
