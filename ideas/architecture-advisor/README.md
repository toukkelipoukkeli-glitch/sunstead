# Aiven Architect

**Describe a workload in plain English → get a costed, benchmarked, one-click-provisionable Aiven stack.**

An agentic Aiven solutions-architect / presales tool. You describe an app or workload; a Claude agent builds a structured workload context, drafts 2-3 candidate Aiven architectures, computes a **real** cost comparison from live Aiven pricing across regions, provisions the recommended config **live** on a free tier, runs a **real** micro-benchmark, and returns a costed + benchmarked recommendation with one-click adopt / teardown.

This is the presales / capacity-planning layer Aiven lacks: it grounds the infra decision in the actual workload, and it drives adoption and consumption.

---

## Architecture

```
web (Vite + React)  ──SSE──▶  server/index.ts (Bun.serve)
                                  │
                                  ├─ server/agent.ts   Claude tool-use loop (streams AdviseEvent)
                                  │      tools: aiven_compare_pricing, aiven_list_clouds,
                                  │             aiven_service_create, aiven_service_get,
                                  │             aiven_pg_query, aiven_run_benchmark (+ think/emit_*)
                                  │
                                  ├─ server/mcp.ts      AivenTools via the official Aiven MCP server
                                  ├─ server/aiven.ts    AivenTools via the Aiven REST API (verified live)
                                  ├─ server/pricing.ts  cost engine (service_types -> PriceRow[])
                                  └─ server/bench.ts    real pg micro-benchmark (p50/p95)
```

`AIVEN_BACKEND=mcp` (default) spawns the official Aiven MCP server and exposes its tools through the same `AivenTools` interface, **auto-falling back to the REST implementation** if the MCP server can't be spawned or listed. Set `AIVEN_BACKEND=rest` to force REST.

The cost comparison is the instant, free, real centerpiece — it reads live `GET /v1/project/{project}/service_types` pricing (USD per hour per plan per region; monthly ≈ price × 730) and marks EU-resident regions for data-residency filtering.

---

## Prerequisites

- **[Bun](https://bun.sh)** ≥ 1.1 (`curl -fsSL https://bun.sh/install | bash`). The backend uses `Bun.serve` and Bun's automatic `.env.local` loading.
- An **Aiven personal token** and an **Anthropic API key** in `.env.local` (already present, gitignored):
  ```
  AIVEN_TOKEN=...
  ANTHROPIC_API_KEY=sk-ant-...
  ```
  Optional: `ANTHROPIC_MODEL` (default `claude-sonnet-4-6`), `AIVEN_PROJECT` (default `touko-1f1c`), `AIVEN_BACKEND` (`mcp` | `rest`, default `mcp`), `PORT` (default `8787`), `VITE_MOCK=1` to force the frontend into mock mode.

> The project runs on **$0 Aiven credits**. Provisioning is restricted to **free plans only** (`pg "free-1-1gb"`, `kafka "free-0"`); `/api/provision` and the agent both reject anything else.

---

## Run

```bash
bun run install:all     # installs root + web dependencies
bun run dev             # starts the API (8787) and the Vite dev server concurrently
```

Open the Vite URL it prints (typically http://localhost:5173). For a single-process production-style run:

```bash
bun run build           # builds web/dist
bun run start           # Bun serves the API + the built frontend on :8787
```

Health check: `curl localhost:8787/api/health`
Live pricing sanity check: `curl 'localhost:8787/api/pricing?serviceType=pg&euOnly=true'`

**Demo safety:** the frontend has a **MOCK MODE** toggle (and `VITE_MOCK=1`) that replays a scripted run with no backend — use it if Wi-Fi or an API is flaky on stage.

---

## API

| Method | Route | Body / Query | Returns |
|---|---|---|---|
| POST | `/api/advise` | `{ prompt }` | `text/event-stream` of `AdviseEvent` (drives the whole demo) |
| POST | `/api/provision` | `{ name, serviceType, plan, cloud }` | `ServiceStatus` — **free plans only**, paid rejected with 400 |
| POST | `/api/benchmark` | `{ name }` | `BenchResult` (measured p50/p95) |
| GET | `/api/pricing` | `?serviceType=pg&euOnly=true[&plan=...]` | `PriceRow[]` (live, real $/mo) |
| GET | `/api/health` | — | `{ ok: true, backend }` |

### `AdviseEvent` stream (the demo spine)

Each SSE `data:` line is one of:
`thought` · `tool_call` · `tool_result` · `context` · `candidates` · `pricing` · `recommendation` · `provision` · `benchmark` · `done` · `error`.

The agent always calls `aiven_compare_pricing` before recommending, prefers the cheapest region satisfying residency, provisions only free plans, and is explicit that benchmark latency is **MEASURED** on the provisioned instance while other candidates' latency is **MODELED**.

---

## 4-minute demo script (beat by beat)

**0:00 — Frame it (15s).**
"Aiven has great managed services, but no presales / capacity-planning layer. A prospect says 'I have this workload' — and someone manually maps it to plans, regions, and a cost estimate. We made that an agent. Describe a workload, get a costed, benchmarked, one-click-provisionable Aiven stack."

**0:15 — One click, real prompt (15s).**
Hit the preset: *"EU fintech: 50GB transactional Postgres + an order event stream, low p99 latency, data must stay in the EU, tight budget."* Hit **Advise**.

**0:30 — Watch the agent reason live (45s).**
The timeline streams `thought`s and — the part judges love — real `aiven_*` tool calls firing: `aiven_compare_pricing`, `aiven_list_clouds`. "These are real calls. The agent gathered a workload context, and it will not recommend anything before it has pulled live pricing."

**1:15 — The cost table is the centerpiece (45s).**
Point at the cost-comparison table: real $/month per region, pulled live from Aiven's API, cheapest highlighted, savings vs. the default region, EU residency badges. "This is instant and free — it's the live `service_types` pricing. Same plan, `upcloud-se-sto` vs `upcloud-fi-hel1` is a real price delta. The agent picked the cheapest EU-resident region."

**2:00 — Candidates + recommendation (30s).**
Three candidate cards (cheapest-EU / balanced / lowest-latency) with monthly cost and EU badges, then the recommendation card with the "why."

**2:30 — THE HERO MOMENT: live provision (45s).**
Hit **Provision** on the recommended free Postgres. State flips **REBUILDING → RUNNING** live, with a link straight to the Aiven console. "That is a real service, on my real project, provisioned right now, on the free tier. Click through — it's in the console."

**3:15 — Real benchmark, honestly labelled (30s).**
Benchmark bars render: measured write/read p50/p95 on the instance we just stood up, clearly tagged **MEASURED**, next to the other candidates' **MODELED** estimates. "We don't fake the latency. This one is measured on the box; the others are modeled — and we say so."

**3:45 — Close + teardown (15s).**
"Costed, benchmarked, provisioned — in one flow. Adopt keeps it; **Tear down** removes it." Hit teardown. "This is the capacity-planning layer Aiven is missing, and every run nudges a prospect toward real consumption."

> Fallback: if the network is shaky, flip **MOCK MODE** — the entire run replays from a seeded script with no backend, so the demo never depends on luck.

---

## Talking points (Stanislav / MRR / "context-maxing")

- **The gap it fills.** Aiven sells managed data infrastructure, but the *decision* — which service, which plan, which region, at what cost and latency — is still manual presales / solutions-architecture work. Aiven Architect productizes that layer: a self-serve, agentic SA that any prospect or AE can run in minutes.
- **It drives MRR / consumption.** The output isn't a slide — it's a provisioned service and a one-click "adopt." Every run grounds a real workload in a real, costed, benchmarked Aiven stack and lowers the activation energy to spin services up. That's the adoption / consumption flywheel: faster time-to-first-service, more services provisioned, more MRR.
- **"Context-maxing" the infra decision.** Instead of a generic sizing calculator, the agent maxes out the context of the *specific* workload — data shape, access pattern, scale, throughput, residency, latency sensitivity, budget — and grounds every recommendation in live Aiven pricing and a real benchmark. The decision is made with maximum relevant context, not vibes.
- **Honest by construction.** Pricing is the live API, not a cached guess. Provisioning is real and free-tier only. Benchmark latency is **measured** on the provisioned instance and explicitly distinguished from the **modeled** estimates for the alternatives. Judges can verify every number.
- **Built on Aiven's own primitives.** Same `AivenTools` surface runs through either the official **Aiven MCP server** or the REST API — so this rides Aiven's published interfaces, and the MCP path is exactly the "agent fires real MCP tools" story that resonates on stage.
- **Why presales specifically.** Presales is where deals are won or lost on "can this actually handle my workload, in my region, in my budget?" Answering that in four minutes — with a running service at the end — is a materially better motion than a sizing spreadsheet.
