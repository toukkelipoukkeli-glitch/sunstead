# Aiven Overmind — the moonshot

> The long shot. Henri's `Aiden` is the honest one-click data-plane migrator (migrate data +
> rewrite one realtime path + **flag** auth/storage). **Overmind goes the other way: it doesn't
> flag — it builds.** An autonomous agent swarm that graduates your Lovable/Supabase backend's heavy
> layer onto Aiven — data, realtime, vector — and generates replacement services for auth, storage
> and the data API, then stays on as an always-on Aiven operator that keeps optimizing the running
> system. Your data + realtime go live on Aiven; the app keeps shipping on Lovable; your CTO runs
> it. (Deploying the generated backend onto Aiven Apps is the LA-gated stretch.)

## The one line

**Point Overmind at any Lovable app → a swarm of agents graduates its heavy layer onto Aiven while
you watch — then a CTO agent runs it for you.**

## Why it's a moonshot (vs. Aiden's sensible version)

| | Aiden (Henri) | Overmind (us) |
|---|---|---|
| Auth/Storage | flagged "adapter required" | **agents generate real replacement services** |
| Realtime | rewrite one path | full Kafka event mesh + SSE bridge, generated |
| Failure handling | report blockers | **self-healing loop: generate → check → repair → re-check** |
| After migration | hand off cutover package | **always-on CTO operator that stays on** |
| Autonomy | deterministic state machine | **Agent SDK swarm that writes & fixes its own code** |
| Result | shadow data plane + receipts | **your data + realtime live on Aiven, CTO operating** |

## The swarm (Anthropic Agent SDK + Aiven MCP)

A live mesh of specialist agents, visualized in mission control as they work in parallel:

- **Recon** (×N, parallel) — scan repo + introspect source DB → behavior graph.
- **Architect** — graph → target Aiven stack + plan + cost.
- **Operator** — drives the **Aiven MCP**: provision PG + Kafka, topics, connection info, receipts.
- **Surgeon** (×N, parallel) — *generate* the Aiven-native backend: auth service, data API,
  Kafka realtime bridge, storage, vector search. Real codegen, one per behavior.
- **Migrator** — move schema + data + embeddings.
- **Healer** (loop) — generate → check the backend → read errors → patch generated code → re-check.
- **Verifier** — row counts, smoke query, realtime hop, search — all must pass.
- **CTO** (persistent) — reads live Aiven metrics forever → scaling/index/cost/carbon moves.

The swarm is bounded by typed tools + a receipt ledger (every Aiven MCP action is logged) so the
autonomy is auditable, not a free-form shell.

## What's genuinely real in the demo (no smoke)

- Aiven PG + Kafka **provisioned + operated live via the MCP** (heavy MCP usage = the judged core).
- Data + pgvector migrated; **realtime actually hops over Aiven Kafka**.
- The Surgeon **generates a real Aiven-native backend** (the `pulsewall-aiven` target is the
  reference shape it generates toward) — auth, data API, realtime bridge, search. The code is
  generated and checked, not deployed (Aiven Apps deployment is the LA-gated stretch).
- The **self-heal loop** runs over real generated code, catches real errors, patches them.
- The **CTO agent** emits real recommendations from real Aiven metrics.
- **Mission control** renders the swarm + behavior graph + Aiven plane live over SSE.

## Stretch (if the 24h allows)

- Deploy the generated backend **onto Aiven Apps via `aiven_application_deploy`** → the whole data plane served on Aiven.
- Run it on a **second, unseen** Lovable app live.

## Build = ultracode workflows

The product is an Agent-SDK swarm; we *build* it with Claude Code workflows (parallel agents per
package), against the contracts in `shared/types.ts` + `CONTRACT.md`. Reuse: `demo/pulsewall-aiven`
(target shape), `demo/live-hype-wall` (source), the live Aiven MCP.
