# Overmind MCP — the agentic operator layer that extends the Aiven MCP

The **Aiven MCP** gives an agent the raw Aiven primitives: create a service, run a query,
fetch metrics, produce a Kafka message. The **Overmind MCP** sits one level up. It turns
those primitives into the *operations a non-expert (human or agent) actually asks for*:

> "Migrate this Lovable app onto Aiven." · "Is my database healthy?" · "What should I do
> next?" · "What does this cost vs Supabase?"

Every tool here **wraps the already-working Overmind engine** (`server/*`, `core/*`,
`aiven/*`) and hits **live Aiven** — project `touko-1f1c`, services `overmind-pg` +
`overmind-kafka`. Nothing is reimplemented or mocked. It's a self-contained stdio MCP
server (official `@modelcontextprotocol/sdk`) that drops into any MCP client — Claude
Code, the MCP Inspector, etc.

```
┌──────────────────────────────────────────────┐
│  Agent / human in an MCP client               │
└───────────────┬──────────────────────────────┘
                │  overmind_migrate / _analyze / _status / _advise / _cost / _services
        ┌───────▼────────────────────────────┐
        │  Overmind MCP (this server)         │  ← operations
        │  wraps runMigration, ctoTick,       │
        │  buildGraph, getPgMetrics, rest.*   │
        └───────┬────────────────────────────┘
                │  aiven_* primitives / direct pg / kafkajs
        ┌───────▼────────────────────────────┐
        │  LIVE Aiven (overmind-pg, -kafka)   │  ← primitives (the Aiven MCP surface)
        └─────────────────────────────────────┘
```

## Tools

| Tool | What it does | Live data it returns | Cost |
|------|--------------|----------------------|------|
| `overmind_analyze({ source? })` | Scan + introspect a Lovable/Supabase app and build the **behavior graph** | The 32-behavior graph for the demo app: counts by classification (`direct_migrate` / `aiven_rewrite` / `generate_service` / `review`), per-kind counts, and a 0–100 readiness score | read-only, fast |
| `overmind_status({ tenant? })` | Plain-English **infra health** from `getPgMetrics` + `summarizeMetrics` | Real `overmind-pg` snapshot: DB size, connections, cache-hit ratio, largest tables + row counts, ANN-index presence | read-only |
| `overmind_advise({ tenant? })` | One tick of the always-on **Aiven CTO** (`ctoTick`) | Severity-tagged recommendations grounded in real `pg_stat_*` numbers (pgvector index, pooling, scaling, region) | read-only |
| `overmind_cost({ tenant? })` | **Cost + savings vs Supabase** from live Aiven plan pricing | Real per-service monthly USD (e.g. pg `startup-4`, kafka `business-4`) and the savings framing | read-only |
| `overmind_services({ tenant? })` | List the tenant's **Aiven services** via `listServices` | The live services in `touko-1f1c` (name, type, plan, state, region), Overmind-managed ones flagged | read-only |
| `overmind_migrate({ source? })` | The **full autonomous migration** (`runMigration`: recon→graph→plan→provision→migrate→generate→heal→verify→cutover→operate) | Final readiness summary + key receipts: live row counts off Aiven PG, a realtime event round-tripped over Aiven Kafka, CTO hand-off | longer; touches live infra |

Defaults: `source` → the bundled demo app (`../demo/live-hype-wall`); `tenant` → `demo`
(maps to the live `overmind-pg` / `overmind-kafka`).

## Run it

This is a **self-contained package** — it has its own `package.json` and only installs the
MCP SDK + zod locally; everything heavy (`pg`, `kafkajs`, `@anthropic-ai/sdk`, `dotenv`)
resolves up the tree from the parent `overmind/node_modules`. Env is loaded from
`overmind/.env.local` automatically (absolute-path load in `bootstrap.ts`).

```bash
cd overmind/mcp
npm install        # only here — does NOT touch overmind/package.json
npm start          # = tsx server.ts  (serves MCP over stdio)
npm test           # spawns the server over stdio, lists tools, exercises the read-only ones
```

## Register it in an MCP client

**Claude Code (stdio):**

```bash
claude mcp add overmind -- npx tsx /Users/touko.ursin/Development/sunstead/overmind/mcp/server.ts
```

or via the package's start script:

```bash
claude mcp add overmind -- npm --prefix /Users/touko.ursin/Development/sunstead/overmind/mcp run start
```

**MCP Inspector (manual poke):**

```bash
npx @modelcontextprotocol/inspector npx tsx /Users/touko.ursin/Development/sunstead/overmind/mcp/server.ts
```

**Raw `mcpServers` config (Claude Desktop / any client):**

```json
{
  "mcpServers": {
    "overmind": {
      "command": "npx",
      "args": ["tsx", "/Users/touko.ursin/Development/sunstead/overmind/mcp/server.ts"]
    }
  }
}
```

No env vars to pass — the server loads `overmind/.env.local` itself.

## Notes

- **stdout is the JSON-RPC channel** — the server logs only to stderr, so it stays clean
  for any client.
- **Defensive by design:** a missing credential or a transient Aiven blip degrades to a
  clear text message; a tool never crashes the server.
- It's a thin façade: it `chdir`s to the Overmind root at boot so the engine's relative
  paths (`../demo/live-hype-wall`) and `.env.local` resolve exactly as they do when the
  engine runs normally.
