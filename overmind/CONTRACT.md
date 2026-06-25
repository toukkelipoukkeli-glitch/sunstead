# Overmind build contract

The interfaces every package builds against. All types in [`shared/types.ts`](shared/types.ts).
Single npm package (no workspaces). TS run by `tsx`; web built by `vite` (root `web/`, proxy
`/api` → `:8788`). Env via `dotenv` (`.env.local`).

## Module map & exports (own ONLY your files)

### `core/` — deterministic migration brain (no Aiven, no network except source DB)
- `core/scan.ts` → `scanRepo(dir): Promise<RepoScan>` — detect framework, `@supabase/supabase-js`,
  `supabase.from/auth/storage/channel/rpc`, `functions.invoke`, env var names, list
  `supabase/migrations/*.sql`, parse SQL for tables/indexes/RLS/functions/triggers/extensions.
- `core/introspect.ts` → `introspectSource(connStr): Promise<SourceIntrospection>` — via `pg`:
  tables, columns, indexes, constraints, extensions, functions, triggers, RLS policies, row counts.
  Must no-op gracefully if no conn string (repo-only mode).
- `core/graph.ts` → `buildGraph(scan, introspection): BehaviorGraph` — classify every behavior into
  `Classification`, compute `readiness`. This is the heart of "behavior migration".

### `aiven/` — all Aiven access (the judged MCP surface)
- `aiven/rest.ts` → reliable deterministic ops via the Aiven REST API + `AIVEN_TOKEN`:
  `listServices(project)`, `getService(project, name)`, `provision(project, type, plan, cloud, name)`,
  `connectionInfo(project, name)`, `waitRunning(project, name)`, `metrics(project, name)`,
  `planPricing(project, type, plan, cloud)`.
- `aiven/mcp.ts` → `runAivenAgent(prompt, {onReceipt}): Promise<string>` — runs an Anthropic agent
  (see Agent SDK pattern) wired to the **Aiven MCP** (`https://mcp.aiven.live/mcp?allow_secrets=true`,
  bearer `AIVEN_TOKEN`) so the agent calls `aiven_*` tools itself; every tool call → a `Receipt`.
- `aiven/kafka.ts` → `producer/consumer` against the provisioned Kafka (kafkajs, SASL/SSL).
- `aiven/pg.ts` → `pool(connStr)` + `q/q1` helpers for the target Aiven Postgres.

### `surgeon/` — codegen (the moonshot差): generate a real Aiven-native backend
- `surgeon/generate.ts` → `generateBackend(graph, outDir): Promise<GeneratedArtifact[]>` — emit a
  working backend that replaces every Supabase behavior, modeled on `demo/pulsewall-aiven`
  (own JWT auth, `/api` data routes over Aiven PG, Kafka→SSE realtime bridge, pgvector search,
  bytea storage). Templated + LLM-filled for the source's specific tables.

### `agents/` — Anthropic Agent SDK swarm definitions
- `agents/swarm.ts` → exports each specialist as `runRecon`, `runArchitect`, `runSurgeon`,
  `runHealer`, `runCto` — thin wrappers over the Anthropic SDK with role prompts + tools.
  Emit `AgentActivity` via an injected `emit(activity)`.

### `server/` — orchestrator + SSE + state machine
- `server/orchestrator.ts` → `runMigration(source, emit): Promise<void>` — drives phases
  `recon→graph→plan→provision→migrate→generate→heal→verify→cutover→operate`, calling core/aiven/
  surgeon/agents, emitting `SwarmEvent`s through `emit`. Writes receipts to Aiven PG.
- `server/heal.ts` → `healLoop(artifacts, emit)` — deploy/run generated backend, smoke-test, on
  error feed the error to the Healer agent to patch, retry up to N times.
- `server/verify.ts` → row-count parity, boot, query, kafka roundtrip, auth flow, search.
- `server/cto.ts` → `ctoTick()` reads Aiven metrics → `CtoRecommendation[]`.
- `server/index.ts` → Hono app: `GET /api/stream` (SSE of `SwarmEvent`), `POST /api/run` (start a
  migration), `GET /api/health`; serves `web/dist` in prod. Bind `0.0.0.0`, port `8788`.

### `web/` — Mission Control dashboard (React + Vite, dark, big-screen)
- Three zones (per the moonshot): **Source app** · **Swarm + timeline** (agents as live nodes,
  behavior graph filling in, receipts streaming) · **Aiven plane** (PG/Kafka, migration progress,
  validation, cost card, CTO panel). Pure function of the `/api/stream` SSE. `web/index.html`,
  `web/main.tsx`, `web/App.tsx`, `web/api.ts` (EventSource), `web/components/*`, `web/styles.css`.

## SSE protocol
`GET /api/stream` emits `event: pulse` with `data: <JSON SwarmEvent>` (+ `event: ping` heartbeat).
`SwarmEvent` is the discriminated union in `shared/types.ts`. The UI switches on `.type`.

## Anthropic Agent SDK + Aiven MCP pattern
Use `@anthropic-ai/sdk`. Agents are model loops with tools. For the Aiven-MCP-driven agents,
connect the MCP via the SDK's MCP connector (URL `https://mcp.aiven.live/mcp?allow_secrets=true`,
header `Authorization: Bearer ${AIVEN_TOKEN}`) OR call `aiven/rest.ts` from a tool the agent owns —
either way every Aiven action produces a `Receipt`. Needs `ANTHROPIC_API_KEY`. If unset, agents
degrade to deterministic `core`/`aiven` paths so the pipeline still runs (no hard dependency).

## Aiven MCP usage map (maximize the judged surface)
`aiven_project_list` · `aiven_service_list` · `aiven_service_get` · `aiven_service_type_plans` ·
`aiven_service_plan_pricing` · `aiven_service_create` · `aiven_service_connection_info` ·
`aiven_pg_service_available_extensions` · `aiven_pg_write` (tables/indexes/data/receipts) ·
`aiven_pg_read` (validation) · `aiven_kafka_topic_create` · `aiven_kafka_topic_message_produce` ·
`aiven_kafka_topic_message_list` · `aiven_service_metrics_fetch` · `aiven_pg_optimize_query` ·
`aiven_application_deploy` (stretch). NOTE: `aiven_pg_write` blocks CREATE FUNCTION/DROP — apply
functions/triggers over a direct `pg` connection (`aiven/pg.ts`), not via MCP.

## Reuse
`demo/pulsewall-aiven` = the target backend shape the Surgeon generates toward (copy its server
patterns). `demo/live-hype-wall` = a real Lovable source to scan. `demo/pulsewall-aiven/db/schema.sql`
= reference Aiven schema.

## Env (.env.local)
`AIVEN_TOKEN` · `AIVEN_PROJECT=touko-1f1c` · `ANTHROPIC_API_KEY` · `DATABASE_URL` (target Aiven PG,
set after provision) · `KAFKA_*` · `SOURCE_DATABASE_URL` / `SOURCE_SUPABASE_URL` +
`SOURCE_SERVICE_ROLE_KEY` · `PORT=8788`.
