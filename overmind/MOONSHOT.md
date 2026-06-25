# Aiven Overmind — the moonshot

> The long shot. Henri's `Aiden` is the honest one-click data-plane migrator (migrate data +
> rewrite one realtime path + **flag** auth/storage). **Overmind goes the other way: it doesn't
> flag — it builds.** An autonomous agent swarm that rebuilds your *entire* Lovable/Supabase
> backend on Aiven — auth, storage, realtime, data, vector — generates the replacement services,
> self-heals until every smoke test is green, deploys it, and then stays on as an always-on Aiven
> operator that keeps optimizing the running system. Zero Supabase. Zero flags. Full autonomy.

## The one line

**Point Overmind at any Lovable app → a swarm of agents rebuilds it on Aiven, 100% working, while
you watch — then runs it for you forever.**

## Why it's a moonshot (vs. Aiden's sensible version)

| | Aiden (Henri) | Overmind (us) |
|---|---|---|
| Auth/Storage | flagged "adapter required" | **agents generate + deploy real replacements** |
| Realtime | rewrite one path | full Kafka event mesh + SSE bridge, generated |
| Failure handling | report blockers | **self-healing loop: deploy → test → repair → green** |
| After migration | hand off cutover package | **autonomous CTO operator that never leaves** |
| Autonomy | deterministic state machine | **Agent SDK swarm that writes & fixes its own code** |
| Result | shadow data plane + receipts | **the whole app, 100% on Aiven, running** |

## The swarm (Anthropic Agent SDK + Aiven MCP)

A live mesh of specialist agents, visualized in mission control as they work in parallel:

- **Recon** (×N, parallel) — scan repo + introspect source DB → behavior graph.
- **Architect** — graph → target Aiven stack + plan + cost.
- **Operator** — drives the **Aiven MCP**: provision PG + Kafka, topics, connection info, receipts.
- **Surgeon** (×N, parallel) — *generate* the Aiven-native backend: auth service, data API,
  Kafka realtime bridge, storage, vector search. Real codegen, one per behavior.
- **Migrator** — move schema + data + embeddings.
- **Healer** (loop) — deploy → smoke-test → read errors → patch generated code → repeat until green.
- **Verifier** — row counts, boot, queries, realtime hop, auth flow, search — all must pass.
- **CTO** (persistent) — reads live Aiven metrics forever → scaling/index/cost/carbon moves.

The swarm is bounded by typed tools + a receipt ledger (every Aiven MCP action is logged) so the
autonomy is auditable, not a free-form shell.

## What's genuinely real in the demo (no smoke)

- Aiven PG + Kafka **provisioned + operated live via the MCP** (heavy MCP usage = the judged core).
- Data + pgvector migrated; **realtime actually hops over Aiven Kafka**.
- The rebuilt backend **boots and serves** on Aiven (the `pulsewall-aiven` target is the reference
  shape the Surgeon generates toward) — auth works, search works, wall is live.
- The **self-heal loop** runs real generated code, catches real errors, patches them.
- The **CTO agent** emits real recommendations from real Aiven metrics.
- **Mission control** renders the swarm + behavior graph + Aiven plane live over SSE.

## Stretch (if the 24h allows)

- Deploy the rebuilt backend **onto Aiven Apps via `aiven_application_deploy`** → 100% on Aiven.
- Run it on a **second, unseen** Lovable app live.

## Build = ultracode workflows

The product is an Agent-SDK swarm; we *build* it with Claude Code workflows (parallel agents per
package), against the contracts in `shared/types.ts` + `CONTRACT.md`. Reuse: `demo/pulsewall-aiven`
(target shape), `demo/live-hype-wall` (source), the live Aiven MCP.
