# Aiven Migrator — the agent that moves any Lovable app to Aiven

The product. Point it at a Lovable/Supabase repo; an agent swarm maps it, then a migration
agent moves the data plane onto Aiven **over the live Aiven MCP**. PulseWall
([../live-hype-wall](../live-hype-wall)) is just the app we run it on; the target shape is
[../pulsewall-aiven](../pulsewall-aiven).

## Architecture

```
                 Claude Agent SDK (@anthropic-ai/sdk, claude-opus-4-8)
                                     │
   ┌──────────────── scout swarm (6 agents, in parallel) ────────────────┐
   │  schema/RLS · supabase-js calls · realtime · storage · auth · edge  │   custom tools:
   │  each reads the repo, classifies its surface, submit_findings()     │   list_files / read_file / grep
   └─────────────────────────────┬───────────────────────────────────────┘
                                 ▼
                      behavior graph (out/behavior-graph.json)
              direct-migrate · rewrite · adapter · external · flag
                                 ▼
            migration agent ── connected to the live Aiven MCP ──▶ Aiven
              calls aiven_pg_write / aiven_pg_read / aiven_kafka_topic_create /
              aiven_service_connection_info / aiven_service_metrics_fetch
                                 ▼
                      out/migration-report.md  (real row counts)
```

- **The swarm** (`src/index.ts` → `scout()`) runs one agent per Supabase surface concurrently,
  each with sandboxed repo-reading tools (`src/tools.ts`), each emitting structured
  behavior-graph nodes via a `submit_findings` tool.
- **The migration agent** (`migrate()`) is wired to the **real Aiven MCP** through the SDK's
  native `mcp_servers` connector (`betas: ['mcp-client-2025-11-20']`), so Claude calls the
  `aiven_*` tools itself — this is the challenge, executed by an agent.

## Run

```bash
cd demo/aiven-migrator
cp .env.example .env.local      # ANTHROPIC_API_KEY + AIVEN_TOKEN + target service
npm install

# 1. Just map the app (no Aiven writes) — produces out/behavior-graph.json:
npm run scout

# 2. Full run — swarm + live migration over the Aiven MCP:
npm run migrate
```

Point `SOURCE_REPO` at any cloned Lovable repo to migrate a different app.

## Status / notes

- The scout swarm is standard Agent-SDK tool-use and runs as-is.
- The migration agent uses the **MCP connector** (`mcp_servers`) — the intended "agent drives
  the Aiven MCP" path. The one thing to confirm on first live run is the beta/connector
  plumbing for your installed `@anthropic-ai/sdk`; if the connector path needs adjusting, the
  fallback is a manual tool-use loop with the Aiven REST token. The agent's *instructions* and
  the target (`touko-1f1c` / `pulsewall-pg`) are already wired.
- `aiven_pg_write` allows one statement and blocks `create function/trigger` — so the agent
  creates tables/indexes/data over MCP and the app applies functions/triggers on boot.
