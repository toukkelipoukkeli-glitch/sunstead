# Aiven Architect — web (demo UI)

The frontend for **Aiven Architect**: describe a workload in plain English, watch
an agent draft 2–3 Aiven architectures, compare real per-region costs, provision
the recommended stack live on the free tier, and benchmark it.

This package is **self-contained** (its own `package.json`, Vite, Tailwind). It
talks to the backend over the spec'd routes; if the backend isn't up, **Mock
mode** replays a full scripted run with zero backend.

## Run

```bash
# from web/
npm install        # or: bun install
npm run dev        # Vite on http://localhost:5173
```

Dev proxies `/api/*` → `http://localhost:8787` (the Bun server) for the SSE
stream and REST routes. Override with `SERVER_ORIGIN=...` if the backend runs
elsewhere. The browser never sees the Aiven token — the server holds secrets.

Build / typecheck:

```bash
npm run build       # tsc -b && vite build  -> dist/
npm run typecheck
```

## Mock mode (demo safety net)

Mock mode replays a scripted, realistic **EU-fintech** run — streaming timeline,
real-shaped pricing, provision `REBUILDING → RUNNING`, and a measured-vs-modeled
benchmark — with **no backend and no network**. Numbers are anchored to the
spec's verified live prices (pg `startup-4`: $0.103/hr Stockholm, $0.151/hr
Helsinki, etc.; `monthly = hr × 730`).

Turn it on three ways:

- the **Mock mode** toggle in the header, or
- append **`?mock=1`** to the URL, or
- build with **`VITE_MOCK=1`**.

On load, the app pings `/api/health`; if the backend is unreachable it **auto-
flips Mock mode on** so the demo never dies on stage.

## How it maps to the API

- `POST /api/advise {prompt}` → `text/event-stream` of `AdviseEvent` — parsed in
  `src/lib/api.ts` (fetch + stream reader, not `EventSource`, because it's a POST).
  Events are folded into one `RunState` by `src/lib/useRun.ts`.
- `POST /api/provision`, `POST /api/benchmark`, `GET /api/pricing`, `GET /api/health`
  — the post-run buttons (`Provision free tier`, `Run benchmark`).
- Frontend types in `src/lib/types.ts` mirror `server/types.ts` exactly (the
  contract). Agent tool names rendered in the timeline mirror the Aiven MCP
  naming: `aiven_compare_pricing`, `aiven_list_clouds`, `aiven_service_create`,
  `aiven_service_get`, `aiven_pg_query`, `aiven_run_benchmark`.

## 4-minute demo script

1. **(0:00) Frame it.** "Aiven has no presales/capacity-planning layer. Describe a
   workload, get a costed, benchmarked, one-click-provisionable Aiven stack."
2. **(0:20) Run the preset.** Click ★ *EU fintech: Postgres + order stream* →
   **Architect it**. Narrate the timeline: real `aiven_*` MCP tool calls firing —
   `aiven_list_clouds`, then `aiven_compare_pricing` *before* any recommendation.
3. **(1:10) Candidates.** Three EU-resident stacks; the recommended one is
   highlighted; trade-offs are spelled out (cost vs latency vs cloud standard).
4. **(1:40) Cost table — the centerpiece.** Real $/mo per region, cheapest
   highlighted, `+$X` deltas, savings vs priciest. Toggle **EU residency only**
   to drop non-EU regions live.
5. **(2:30) Provision — the hero moment.** **Provision free tier** → watch
   `REBUILDING → RUNNING`, open the **Aiven console** link, land on
   *"RUNNING in UpCloud · NL-AMS"*. Costs $0.
6. **(3:10) Benchmark.** **Run benchmark** → measured PG write p50 ≈ 4.2ms on the
   live instance, with modeled bars for the other candidates (clearly labelled).
7. **(3:40) Recommendation.** Costed + benchmarked answer, **Adopt** / **Tear
   down**. Close: "This drives Aiven adoption/consumption — it context-maxes the
   infra decision by grounding it in the actual workload."

**If the network/API dies:** flip **Mock mode** and run the exact same script.

## Talking points (Stanislav / judges)

- **Real, not mocked, by default:** the cost table is computed live from
  `GET /project/touko-1f1c/service_types`; provisioning is a real free-tier
  service; the benchmark is real PG latency on that instance.
- **Honest about modeling:** only the provisioned config's latency is *measured*;
  other candidates are *modeled* — and the UI says so.
- **Business case:** this is the presales/capacity layer Aiven lacks. It shortens
  "which Aiven setup do I need?" from a sales call to a 30-second self-serve loop,
  driving consumption (MRR).
```
