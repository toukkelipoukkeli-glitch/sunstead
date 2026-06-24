> **Status:** GOLD
> **Mission T:** 55 -> 20
> **Date:** 2026-06-24
> **Navigator position:** emerging but aligned, close enough to commit a build trunk after sponsor calibration.

# Mission 01 Synthesis: Aiven Landscape

## Verdict

Build **PulseOps: Aiven Data Operator Flight Recorder**.

Best compact pitch:

> Aiven MCP gives agents the keys to Kafka and PostgreSQL. PulseOps shows how they can run a live data operation safely: Kafka is their reflexes, Postgres is their memory, and every MCP action leaves a receipt.

Best demo scenario:

> **Kafka Lag Autopilot + Flight Recorder**: a live checkout/order stream hits lag, poison messages, or bad data; agents investigate through Aiven MCP, coordinate through Kafka, query/write Postgres evidence, execute one safe action, and show a replayable receipt ledger.

This is the strongest intersection of the Aiven rubric:

- **Depth of MCP integration:** Aiven MCP surfaces for Kafka topic/message work, PostgreSQL read/write/query evidence, service discovery, metrics/logs/event logs if stable.
- **Workflow autonomy:** detector, stream detective, SQL detective, operator, and auditor agents detect, plan, coordinate, act, and remember.
- **Creativity and impact:** not another SQL chatbot or AI SRE clone; it makes autonomous data-infra action visible, safe, and replayable.

## Hackathon Classification

- Detected hackathon type: `sponsor-needs` with open-ended creative execution.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a concrete sponsor primitive.
- Judging/submission mode: Aiven partner selects finalists; finalists pitch for 4 minutes with 1 minute Q&A.
- Chosen track: Aiven main challenge, "The Autonomous Data Operator".
- Optional tracks: unknown. Do not optimize for side tracks until rules confirm multi-entry.
- Core demo flow: one live data incident, one autonomous investigation, one safe MCP action, one visible receipt trail.
- Intentionally cut: generic chat-with-SQL, full AI SRE, broad data observability, production auth, live destructive service changes, OpenSearch dependency until confirmed, and any path where Aiven MCP is hidden behind a normal backend.

## What The 10 Agents Found

| Agent | Scope | Strongest contribution |
|---|---|---|
| alpha | DataOps companies | AI data engineering and text-to-SQL are crowded; the open wedge is Kafka/Postgres operator with receipts. |
| beta | MCP ecosystem | MCP is now table stakes; Aiven must show cross-service managed data-plane control, not generic DB MCP. |
| gamma | Agent event buses | Kafka should be the visible agent bus and receipt stream, not hidden framework plumbing. |
| delta | No-backend swarms | "Agents are the backend" is viable if Postgres stores state and Kafka carries handoffs. |
| epsilon | DevOps/SRE operators | Generic AI SRE is crowded; data-plane SRE for Kafka/Postgres is less owned. |
| zeta | Data detectives | Generic RCA/data observability is crowded; Aiven-native evidence ledger rescues the incident path. |
| eta | Real-time demos | Business live ops beats abstract dashboards; use a launch room with synthetic traffic and one incident button. |
| theta | Governance/trust | The receipt layer is not decoration; it is the safety primitive for agents with infrastructure keys. |
| iota | Weird concepts | Data twin/data OS framing is high-amplitude if reduced to a 2D Aiven data-plane ops room. |
| kappa | Hackathon scorer | Independently ranked Kafka Lag Autopilot + Flight Recorder first by rubric and feasibility. |

## Landscape Map

### Crowded / Dangerous Lanes

1. **Text-to-SQL and BI copilots.** Vanna, Wren AI, ThoughtSpot, Databricks Genie, Snowflake Cortex Analyst, BigQuery data agents, Supabase/Neon/MongoDB MCP, and many others make generic data chat too weak.
2. **Generic database MCP.** Aiven, Neon, Supabase, Google MCP Toolbox, MongoDB, ClickHouse, Redis, pgEdge, and others prove "LLM connects to DB" is no longer enough.
3. **Generic Kafka MCP/admin.** Confluent, Google Managed Kafka MCP, community Kafka MCP, and Kafka MCP proposals crowd topic/admin/message CRUD.
4. **AI SRE and incident RCA.** AWS DevOps Agent, Azure SRE Agent, Datadog Bits AI SRE, PagerDuty SRE Agent, Resolve, incident.io, Rootly, Cleric, New Relic, Better Stack, HolmesGPT, K8sGPT, and others own broad incident investigation.
5. **Data observability.** Monte Carlo, Bigeye, Anomalo, Soda, Sifflet, Metaplane, Elementary, Great Expectations, and others cover monitor/explain/root-cause for data quality.
6. **Enterprise governance and catalogs.** Databricks Unity Catalog, Snowflake Horizon, Microsoft Purview, DataHub, OpenMetadata, Collibra, Alation, Atlan, Okta, Entra, Teleport, Credal own broad catalog/IAM/governance.
7. **Agent runtimes and marketplaces.** Cloudflare Agents, Dapr Agents, LangGraph, AutoGen, CrewAI, Temporal, Salesforce AgentExchange, ServiceNow, and GPT Store own generic agent platform framing.

### Open Wedges

| Wedge | Why it matters | T/A/P |
|---|---|---:|
| Aiven-native flight recorder | Converts "agent with infra keys" from scary/invisible to reviewable. | 20/92/72 |
| Kafka as visible agent bus | Most frameworks hide orchestration; Aiven challenge explicitly names Kafka for agent collaboration. | 20/88/68 |
| Postgres as memory + receipts | pg/pgvector can store incident memory, receipts, hypotheses, artifacts, and audit rows. | 22/86/64 |
| Data-plane SRE | Broad AI SRE is crowded; Kafka/Postgres managed data service operations are less visually owned. | 24/92/68 |
| Live ops room / data twin | Makes Aiven services, topics, tables, incidents, agents, and actions visible in one screen. | 24/94/70 |
| Policy-gated MCP writes | Shows real autonomy without looking reckless. | 16/84/68 |

## The Winning Idea

### Name

Use **PulseOps** as the product name in the UI and pitch.

Use **Aiven Data Operator Flight Recorder** as the explanatory subtitle.

Avoid a too-generic name like "DataOps AI" or "Aiven SRE Agent".

### One-Sentence Pitch

> PulseOps is an autonomous data operator for Aiven: agents coordinate through Kafka, remember in Postgres, and use Aiven MCP to investigate and safely repair live data incidents with receipts for every action.

### 20-Second Story

> A checkout stream starts failing during a flash sale. Instead of a human stitching together Kafka, SQL, logs, and runbooks, PulseOps agents do it: they detect the incident, inspect Kafka and Postgres through Aiven MCP, propose a safe recovery action, execute it after approval, and leave a replayable flight recorder.

### Why It Hits Aiven

- It uses Aiven MCP as the control plane, not just as setup.
- It uses Kafka as agent-to-agent coordination and live event stream.
- It uses PostgreSQL as memory, evidence, receipts, and optional pgvector retrieval.
- It makes autonomous workflows replace backend boilerplate for the incident flow.
- It is visible and judge-readable in under 3 minutes.

## Demo Spec

### Scenario

Domain: ecommerce flash sale / live launch room.

Incident: checkout lag, poison message, schema drift, or bad order data.

Recommended first incident:

> A burst of malformed or late `order.created` events causes consumer lag and wrong dashboard state. PulseOps detects it and creates a bounded recovery path: a dead-letter topic or quarantine table, plus a receipt and rollback plan.

### First-Minute Screen

One operational screen, not a landing page:

- left: live event stream and health/lag gauge;
- center: Kafka agent bus cards;
- right: MCP receipt timeline;
- drawer: Postgres evidence/memory rows;
- top strip: Aiven project, Kafka service, Postgres service, agent scopes.

### Agent Roles

Keep agents concrete and few:

- **Detector:** watches the event stream and opens incidents.
- **Stream Detective:** inspects Kafka topics/messages/offsets/lag evidence.
- **SQL Detective:** queries Postgres for business impact and prior incidents.
- **Operator:** chooses and executes one safe MCP action after policy check.
- **Auditor:** writes the flight recorder and final explanation.

### Aiven MCP Actions To Show

Minimum viable live actions:

- list or inspect Aiven services;
- list Kafka topics;
- produce/read a Kafka message;
- create or verify one Kafka topic such as `orders.dead_letter.demo`;
- read/write PostgreSQL evidence and receipt rows.

Bonus if stable:

- fetch service metrics/logs/event logs;
- query Postgres query stats;
- show available extensions / pgvector memory;
- deploy/redeploy app through Aiven Apps only if already reliable.

Avoid as live pitch climax:

- service deletion;
- plan scaling;
- broad production DDL;
- connector chaos;
- anything dependent on OpenSearch until Aiven confirms official support.

### Core Data Model

Postgres tables:

- `incidents(id, kind, status, started_at, resolved_at, summary)`
- `operator_receipts(action_id, agent, intent, mcp_tool, input_summary, result_summary, risk, rollback, status, created_at)`
- `hypotheses(incident_id, agent, claim, confidence, evidence_ref, created_at)`
- `agent_memory(id, kind, symptoms, fix, outcome, embedding optional, created_at)`
- `orders_demo(order_id, status, amount, event_time, anomaly_flag)`

Kafka topics:

- `orders.raw`
- `operator.events`
- `operator.approvals`
- `orders.dead_letter.demo`
- `operator.receipts`

Event envelope:

```json
{
  "run_id": "demo-001",
  "event_id": "evt-123",
  "agent": "stream_detective",
  "type": "mcp.kafka.topic.create.requested",
  "status": "completed",
  "input_ref": "postgres://operator_receipts/...",
  "output_ref": "kafka://operator.receipts/demo-001",
  "created_at": "2026-06-24T00:00:00Z"
}
```

## 4-Minute Pitch Flow

0:00-0:25 - Frame:

> Agents can now operate data infrastructure directly through Aiven MCP. That is powerful, but risky unless every action is inspectable.

0:25-0:55 - Show the data plane:

> This screen has no domain backend hiding the work. Kafka is the agent bus and live stream; Postgres is memory and evidence; Aiven MCP is the control plane.

0:55-1:35 - Trigger the incident:

Click `Trigger checkout lag`. Kafka events appear: `incident.opened`, `detector.observation`, `sql.investigation.requested`.

1:35-2:25 - Autonomous investigation:

Agents inspect Kafka messages/topic state, query Postgres for impact and similar prior incident, and show MCP tool chips as evidence.

2:25-3:10 - Safe action:

Operator proposes `Create orders.dead_letter.demo and quarantine malformed events`. Risk: low. Rollback: ignore/delete topic and replay original events. Presenter approves.

3:10-3:40 - Receipt and replay:

Postgres receipt row appears. Kafka `mcp.call.completed` event appears. UI shows before/after health and the flight recorder.

3:40-4:00 - Close:

> Depth: Aiven MCP across Kafka and Postgres. Autonomy: agents detected, investigated, planned, and acted. Impact: data-infra agents can be useful because their actions are visible and safe.

## Product Variants

| Rank | Variant | Use when | Verdict |
|---:|---|---|---|
| 1 | **Kafka Lag Autopilot + Flight Recorder** | Technical Aiven judges care about Kafka/Postgres/MCP depth. | Primary build. |
| 2 | **PulseOps Live Launch Room** | Need more product clarity for non-SRE judges. | Same build, friendlier wrapper. |
| 3 | **Data Product First Responder** | Judges react better to bad data/business dashboard story than infra lag. | Fallback scenario. |
| 4 | **Aiven Data Twin Ops Room** | Sponsor likes high-amplitude weirdness. | UI framing, not separate product. |
| 5 | **Backendless SwarmDesk** | Sponsor emphasizes no-backend app swarm. | Backup, higher risk of looking generic. |

## What To Cut

- Generic SQL analyst/chat.
- Generic AI SRE across all cloud/Kubernetes/observability.
- Full data observability platform.
- Full data catalog, lineage graph, IAM, or compliance product.
- Full marketplace or synthetic company roleplay.
- Real external APIs like Shopify, Stripe, Slack, PagerDuty, GitHub.
- Complex anomaly ML; deterministic seeded anomalies are enough.
- Custom workflow engine; Kafka topics plus simple workers are enough.
- Live destructive MCP actions.
- OpenSearch as core dependency until Aiven confirms support.
- Side-track wrappers until the Aiven happy path is stable.

## Sponsor Questions

Ask Aiven mentors before locking build details:

1. Which MCP tool actions would most impress you: service creation, Kafka topics/messages, Postgres SQL, metrics/logs, Kafka Connect, Schema Registry, or Aiven Apps?
2. Is a seeded Aiven sandbox with one live safe write acceptable, or do you expect live provisioning?
3. Are Kafka Connect and Schema Registry reliable in the hackathon org?
4. Is OpenSearch available through official Aiven MCP today, or should we cut it?
5. Would you rather see a serious data-operator incident demo, a no-backend app swarm, or a creative data twin simulation?
6. What safety posture is best for the pitch: full autonomous write, human-approved writes, or read-only investigation plus recommendations?
7. Can one project enter side tracks legally?
8. Who is presenting, and should the flow be tuned for technical walkthrough or punchier product story?

## Feasibility Gates

Prove these before deeper implementation:

1. Aiven MCP hosted or local connection works in the demo environment.
2. One safe live write works: create topic, produce message, create table, or insert receipt row.
3. UI can show Kafka events and Postgres receipts without manual refresh.
4. Seeded incident can trigger and resolve in under 90 seconds.
5. Full pitch can run with replayed receipts if network fails.

Fallbacks:

- If service creation is slow, pre-create services and live-create only a topic/table/message/row.
- If metrics/logs are slow, use topic messages and SQL evidence as primary proof.
- If Kafka creation fails, pre-create topics and live-produce messages.
- If Postgres write fails, the score takes a hit; prioritize fixing this before UI extras.

## Classification Changes

- Generic SQL assistant: WARM -> PLATEAU. Correct but low leverage for this challenge.
- Generic AI SRE: WARM -> PLATEAU. Crowded and not Aiven-specific enough.
- No-backend app swarm: HOT -> BRIDGE. Strong if expressed through Kafka/Postgres/MCP, risky if support-bot-like.
- Data detective: HOT -> BRIDGE. Strong when paired with flight recorder and safe Aiven action.
- Flight recorder receipts: HOT -> WARM/COLD-ish. Multiple agents converged; remaining uncertainty is implementation and sponsor preference.
- Live provisioning as climax: HOT -> RISK. Good proof, but pitch-fragile; use safe live write instead.

## Bottleneck

Old bottleneck: unknown idea landscape.

Status: closed enough for build direction.

New bottleneck: **MCP spike and demo reliability**, T=20, P(solvable) ~80%.

The next mission should not do more abstract ideation. It should prove the Aiven MCP/Kafka/Postgres happy path and lock the visible demo surface.

## To The Next Agent

COLD:

- Aiven rubric: 34% MCP depth, 33% autonomy, 33% creativity/impact.
- Judging: partner-selected finalists, 4 minute pitch, 1 minute Q&A.
- Text-to-SQL, generic BI copilots, generic AI SRE, generic MCP DB access, and broad governance are crowded.
- Aiven MCP/Kafka/Postgres must be visible in the first minute.

WARM:

- Exact live MCP tool availability and latency in the hackathon account.
- Whether Aiven mentors prefer serious incident response or more creative no-backend/data-twin framing.
- OpenSearch support through official Aiven MCP.
- Presenter style and whether side tracks are legal.

PLATEAU:

- Building a generic SQL chatbot.
- Building a full dashboard without action.
- Building broad observability or data catalog clones.
- Building a custom agent framework instead of showing Kafka/Postgres/MCP.

DEAD:

- Autonomous delete/scale/production mutation as the live pitch climax. Too risky and distracts from safe autonomy.

BOTTLENECK:

- Build spike: connect Aiven MCP, create/list Kafka topic, produce/read message, read/write Postgres receipt, show in UI.

-> Mission 02: demo spike and pitch spec.

## Source Artifacts

Primary local artifacts:

- `AGENT_ALPHA_DATAOPS_COMPANIES.md`
- `AGENT_BETA_MCP_ECOSYSTEM.md`
- `AGENT_GAMMA_AGENT_EVENT_BUSES.md`
- `AGENT_DELTA_NO_BACKEND_SWARMS.md`
- `AGENT_EPSILON_DEVOPS_OPERATORS.md`
- `AGENT_ZETA_DATA_DETECTIVES.md`
- `AGENT_ETA_REALTIME_DEMOS.md`
- `AGENT_THETA_GOVERNANCE_TRUST.md`
- `AGENT_IOTA_WEIRD_CONCEPTS.md`
- `AGENT_KAPPA_HACKATHON_SCORER.md`

Key external anchors:

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Aiven MCP product page: https://aiven.io/mcp
- Confluent MCP docs: https://docs.confluent.io/cloud/current/ai/ai-tools/open-source-mcp-server.html
- Google Managed Kafka MCP docs: https://docs.cloud.google.com/managed-service-for-apache-kafka/docs/use-managed-service-for-apache-kafka-mcp
- Datadog Bits AI SRE: https://www.datadoghq.com/blog/bits-ai-sre/
- OpenLineage: https://openlineage.io/
- Cloudflare Agents: https://developers.cloudflare.com/agents/
- DBOS paper: https://vldb.org/pvldb/vol15/p21-skiadopoulos.pdf
