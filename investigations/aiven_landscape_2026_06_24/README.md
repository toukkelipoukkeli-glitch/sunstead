> **Status:** ACTIVE
> **Temperature:** T=20
> **Question:** What Aiven MCP project has the strongest hackathon expected value: visible MCP depth, real autonomy, and a memorable demo?
> **Last updated:** 2026-06-24 14:00 UTC+3

# Aiven Autonomous Data Operator Investigation

Navigator position: emerging and aligned, ready for MCP/demo spike.

## Hackathon Frame

- Detected hackathon type: sponsor-needs with open-ended creative execution.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Chosen target track: Aiven main challenge, "The Autonomous Data Operator".
- Required API/sponsor primitive: Aiven MCP, with visible use of managed PostgreSQL, Kafka, infrastructure management, and optionally OpenSearch if stable.
- Core demo flow: PulseOps data-operator flight recorder; agents investigate a live Kafka/Postgres incident through Aiven MCP, execute one safe action, and leave receipts.
- Intentionally cut until proven useful: generic chatbot UIs, invisible backend plumbing, broad CRUD apps, production auth, and any feature that hides Aiven MCP behind ordinary app behavior.

## Known Unknowns

- Presenter and preferred pitch style.
- Exact submission form constraints and whether a live Aiven account/service must be shown.
- Whether multi-track entry is legal and worth preserving.
- Which Aiven mentor signal matters most: infra provisioning, Kafka collaboration, PostgreSQL/pgvector memory, or no-backend app architecture.
- Live demo tolerance for creating/deleting cloud resources on stage.

## Mission Table

| # | Mission | Status | T | Notes |
|---|---|---:|---:|---|
| 01 | landscape | GOLD | 55 -> 20 | Ten-agent scan converged on PulseOps / Aiven Data Operator Flight Recorder. |

## To Continue

Mission 01 produced:

- sourced competitor/adjacent landscape;
- crowded/dead territories;
- 3-5 high-amplitude idea candidates;
- recommended Aiven-native demo flow with cuts and fallback plan.

Frontier:

- Convert the winning idea into a pitch/demo spec;
- ask Aiven mentors which MCP surface they most want visible;
- build only the one flow that makes the sponsor primitive legible in under 3 minutes.

Current recommendation:

> Build PulseOps: a Kafka/Postgres/Aiven MCP data-operator flight recorder where agents investigate a live stream incident, execute one safe MCP action, and leave receipts.
