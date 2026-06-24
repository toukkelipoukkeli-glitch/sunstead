# Agent Kappa: Hackathon Scorer For Aiven Project Candidates

> Date: 2026-06-24  
> Mission: judge-facing synthesis scout  
> Navigator position: emerging and aligned, approaching cold. The target is clear enough to rank candidates, but exact mentor preference and live Aiven quota remain warm.

## Hackathon Classification

- Primary scoring mode: `technical-first` with heavy live-demo pressure. The rubric is explicit and technical: 34% depth of MCP integration, 33% workflow autonomy, 33% creativity/impact.
- Challenge style: `sponsor-needs` with an open-ended creative wrapper. Aiven wants proof that Aiven MCP can let agents control, stream, or query open-source data infrastructure.
- Judging/submission mode: Aiven/partner-selected finalists, then 4-minute pitch plus 1-minute Q&A. The first minute must make Aiven MCP visible.
- Chosen target track: Aiven main challenge. Optional Anthropic/ElevenLabs wrappers are only worth pursuing if rules allow multi-track entry and they do not change the core build.
- Core demo flow to optimize for: a data incident or data-product workflow starts, agents coordinate over Aiven Kafka, query/write Aiven PostgreSQL, use Aiven MCP for service/Kafka/Postgres actions, and show an action receipt ledger.
- Intentionally cut: generic SQL chatbot, broad AI SRE, full observability platform, production auth, live destructive service operations, OpenSearch dependency unless confirmed, and any hidden backend flow where Aiven is just storage.

Unknowns to flag before large implementation:

- Who is presenting and what demo style fits them best.
- Whether one project may legally enter side tracks.
- Whether judging includes code review or is mostly pitch/booth/demo.
- Exact hackathon Aiven org quotas, service creation latency, Kafka Connect availability, Schema Registry setup, and whether OpenSearch MCP tools are live.
- Whether Aiven mentors prefer "no-backend app swarm," "self-driving data engineer," or "data detective/operator" framing.

## Scoring Model

Rubric score is weighted from 0-100:

- MCP depth: 34%. Highest score requires multiple Aiven MCP surfaces, not just one SQL call.
- Workflow autonomy: 33%. Highest score requires agents to detect/plan/coordinate/act with limited manual glue.
- Creativity/impact: 33%. Highest score requires a memorable wedge that is not already owned by generic AI SRE, BI copilots, or Kafka admin chatbots.

Pitch visibility and build feasibility are separate 1-5 gates because a high-rubric idea can still lose if judges cannot see it in 4 minutes or if the happy path is fragile.

## Ranked Slate

| Rank | Candidate | One-line demo | MCP | Autonomy | Creativity / impact | Rubric / 100 | Pitch visibility | Build feasibility | T/A/P | Verdict |
|---:|---|---|---:|---:|---:|---:|---:|---:|---|---|
| 1 | Kafka Lag Autopilot + Flight Recorder | A data operator detects Kafka lag or poison messages, investigates through Aiven MCP, creates a safe recovery path, and stores every action as a Postgres/Kafka receipt. | 9.5 | 9.0 | 8.8 | 91 | 5.0 | 4.3 | T22 A92 P70 | Build this. Best balance of sponsor fit, visibility, and feasibility. |
| 2 | Data Product First Responder | Bad order/payment events stream in, agents trace the business impact, quarantine the bad data, and keep the dashboard honest. | 8.9 | 8.5 | 8.7 | 87 | 4.8 | 4.4 | T20 A86 P66 | Strong fallback if non-SRE judges need a clearer business story. |
| 3 | Backendless SwarmDesk | User asks for a live support desk; agents create the Postgres schema and Kafka topics, then run the workflow with no domain backend. | 8.4 | 9.3 | 8.8 | 88 | 4.5 | 3.7 | T28 A90 P62 | Creative and demoable, but riskier to keep Aiven infra central. |
| 4 | Runbook Memory Flight Recorder | Prior incidents live in pgvector; a new incident retrieves memory, proposes a safe fix, and logs an incident passport. | 8.6 | 8.7 | 8.6 | 86 | 4.0 | 4.0 | T24 A88 P64 | Good layer inside rank 1; weaker as the whole product because memory is less visual. |
| 5 | Schema Drift Contract Negotiator | Agents detect schema drift in Kafka events, compare registry/table evidence, and route incompatible data to a safe path. | 8.1 | 8.6 | 8.5 | 84 | 4.2 | 4.0 | T26 A84 P58 | Strong technical subplot; tool support for schema writes is uncertain. |
| 6 | Self-Driving Pipeline Builder | User describes a resilient real-time pipeline; agents provision or verify Aiven Postgres/Kafka, create topics/tables, and test the stream. | 9.3 | 8.2 | 7.4 | 83 | 4.2 | 3.4 | T18 A82 P64 | Exact sponsor language, but obvious and live provisioning is risky. Use as setup, not final story. |
| 7 | Digital Ops Twin / AI Town For Data Infra | Agent characters each have Kafka mailboxes and Postgres memory; a mayor agent redesigns the data plane through MCP. | 7.7 | 8.8 | 9.2 | 86 | 4.9 | 3.3 | T35 A90 P55 | Memorable expo toy risk. Only pick if sponsor strongly wants creative simulations. |
| 8 | Aiven Apps Self-Deploying Ops Room | Agents use Aiven MCP to deploy the UI/app next to the data services, then operate it. | 8.8 | 8.0 | 8.4 | 84 | 4.8 | 2.6 | T35 A86 P51 | High wow, high late-hour risk. Treat Aiven Apps deploy as a bonus receipt. |
| 9 | FinOps Data Governor | Agent watches service metrics/pricing, recommends right-sizing, and asks approval for plan/config changes. | 8.5 | 7.8 | 7.2 | 79 | 3.6 | 4.4 | T18 A70 P52 | Credible but less exciting. Works better as a receipt/action type than core demo. |
| 10 | Query Optimizer DBA | Agent finds slow Postgres queries, asks Aiven optimizer, and writes index recommendations. | 7.8 | 7.2 | 6.5 | 72 | 3.2 | 4.2 | T12 A60 P48 | Too crowded and Aiven already has EverSQL/optimizer assets. Cut as core. |
| 11 | Generic SQL Analyst | Chat with Postgres, ask questions, get charts. | 5.8 | 5.2 | 4.4 | 52 | 3.5 | 4.5 | T8 A45 P37 | Kill. It can be built fast but does not win this rubric. |

Rank is expected hackathon value, not raw rubric alone. SwarmDesk and Digital Ops Twin have high creative scores, but the top data-operator lane is safer because it makes the sponsor primitive undeniable.

## Recommended Build

Build **Aiven Data Operator Flight Recorder**, using **Kafka Lag Autopilot** as the story.

Judge-facing sentence:

> Aiven MCP gives agents the keys to data infrastructure; our operator makes those actions safe and visible by coordinating through Kafka, remembering in Postgres, and leaving receipts for every MCP call.

Concrete happy path:

1. Seed an order stream in Aiven Kafka and a small order/incident state in Aiven PostgreSQL.
2. Trigger a visible incident: lag spike, poison messages, schema drift, or late orders.
3. Detector agent publishes `incident.opened` to Kafka.
4. Stream detective reads Kafka messages and topic state through Aiven MCP.
5. SQL detective queries Postgres through Aiven MCP for business impact and prior incidents.
6. Operator agent chooses one safe live action:
   - create a dead-letter Kafka topic;
   - produce an alert/remediation event;
   - create a quarantine table;
   - insert/update an incident receipt row;
   - optionally create an index or PgBouncer pool only if pre-tested.
7. Auditor agent writes a structured receipt to Postgres and publishes `mcp.call.completed` to Kafka.
8. UI shows the incident timeline, Kafka agent bus, Postgres evidence, MCP tool transcript, action risk, rollback plan, and before/after health.

Minimum Aiven MCP surfaces to show:

- Core: `aiven_service_list`, `aiven_service_get`, metrics/logs/event logs if stable.
- Kafka: `aiven_kafka_topic_list`, `aiven_kafka_topic_create`, `aiven_kafka_topic_message_produce`, `aiven_kafka_topic_message_list`.
- PostgreSQL: `aiven_pg_read`, `aiven_pg_write`, optionally query statistics or available extensions.
- Safety: read-only/scoped mode in pitch language, approval gate for risky actions.

Do not make service creation the live climax. Pre-create Aiven services if latency or quota is uncertain. A live topic/table/message write is enough to prove depth without risking the pitch.

## 4-Minute Demo Flow

0:00-0:25 - Frame the problem.

"Agents can now operate data infrastructure directly through Aiven MCP. That is powerful, but risky unless every action is inspectable."

0:25-0:55 - Show the live data plane.

Show Aiven Kafka order stream, Aiven Postgres receipt/evidence tables, and a thin UI. Make clear this is not a generic backend API: Kafka is the agent bus, Postgres is memory/evidence, Aiven MCP is the control plane.

0:55-1:35 - Trigger the incident.

Click "Trigger checkout lag." The UI fills with Kafka events: `incident.opened`, `detector.observation`, `sql.investigation.requested`. Show MCP tool chips as they fire.

1:35-2:25 - Autonomous investigation.

Agents inspect Kafka messages, query Postgres, and fetch service evidence. The judge sees hypotheses update with citations: SQL row counts, Kafka topic offsets/messages, Aiven service metric/log snippets.

2:25-3:10 - Safe action through Aiven MCP.

Operator proposes: "Create `orders.dead_letter.<timestamp>` and route poison events; risk low; rollback delete/ignore topic." Presenter approves. The agent performs one live MCP write and the UI shows the receipt.

3:10-3:40 - Before/after and memory.

Show bad events quarantined, incident status improved, and a Postgres receipt with action, agent, tool, input summary, output summary, risk, rollback, and Kafka offsets.

3:40-4:00 - Close on rubric.

"Depth: Aiven MCP across Kafka, Postgres, service evidence. Autonomy: detect, investigate, plan, execute with guardrails. Impact: data infra agents can act, and teams get receipts."

## UI Recommendations

Use one operational screen, not a landing page.

Required visible panels:

- Data plane health: one lag/anomaly gauge and one order stream counter.
- Kafka agent bus: live cards for `incident.opened`, `hypothesis.created`, `approval.requested`, `mcp.call.completed`.
- MCP receipt timeline: tool name, agent, target service, risk, result, rollback.
- Evidence drawer: SQL result, Kafka sample/offset, metric/log snippet.
- Approval button: only for the single safe write in the pitch path.

Avoid a chat-first UI. A small prompt box is fine, but the screen should look like an autonomous control room where actions are happening.

## Architecture Recommendation

Keep the build small and inspectable.

Postgres tables:

- `operator_receipts(action_id, agent, intent, mcp_tool, input_summary, result_summary, risk, rollback, status, created_at)`
- `incidents(incident_id, kind, status, started_at, resolved_at, summary)`
- `hypotheses(incident_id, agent, claim, confidence, evidence_ref, created_at)`
- `runbook_memory(incident_id, embedding optional, symptoms, fix, outcome)`
- `orders_demo(order_id, status, amount, event_time, anomaly_flag)`

Kafka topics:

- `orders.raw`
- `operator.events`
- `operator.approvals`
- `orders.dead_letter.demo`

Agents:

- Detector: watches seeded stream and opens incidents.
- Stream detective: inspects Kafka topic messages/state.
- SQL detective: queries Postgres for impact and prior evidence.
- Operator: selects safe action and calls Aiven MCP after policy check.
- Auditor: writes receipts and final report.

The runner can be simple TypeScript/Python workers. Do not build a general agent framework if Kafka topics plus named roles are enough.

## Explicit Cuts

- Cut generic "ask your database" as the product. It is crowded and weak for MCP depth.
- Cut broad AI SRE across Kubernetes, logs, traces, cloud, PagerDuty, GitHub, and Slack.
- Cut full data observability: no lineage graph, monitor catalog, or ML anomaly platform.
- Cut production auth, roles, teams, billing, and account settings.
- Cut live service deletion, plan scaling, or destructive SQL in the pitch path.
- Cut Aiven Apps deploy unless it already works reliably before final polish.
- Cut OpenSearch from the core path unless Aiven confirms official MCP tool support during the event.
- Cut Kafka Connect unless the connector path is pre-tested and sponsor specifically values it.
- Cut A2A/ACP/AG-UI protocol work. Kafka is the sponsor-aligned agent bus.
- Cut multiple incidents. One incident with receipts beats three shallow demos.
- Cut any feature that still works just as well if Aiven MCP is replaced by a normal backend REST API.

## Sponsor Questions

Ask these before locking implementation:

1. Which Aiven MCP tool actions would most impress the Aiven judges: service creation, Kafka topic/message operations, Postgres SQL, metrics/logs, Kafka Connect, or Aiven Apps deploy?
2. Is a seeded Aiven sandbox with one live safe write acceptable, or do they expect live provisioning during the pitch?
3. Are Kafka Connect and Schema Registry tools available and reliable in the hackathon org?
4. Is OpenSearch available through official Aiven MCP today, or should we cut it entirely?
5. Do they prefer a serious data-operator incident demo or a more creative no-backend agent swarm?
6. Are Aiven credits/quota enough for multiple service creates during rehearsals, or should we pre-create services?
7. Can a project enter Anthropic or ElevenLabs side tracks in addition to Aiven?
8. Will finalists be evaluated mainly from live pitch, expo table interaction, Devpost submission, or code review?
9. What safety posture do they want to see: full autonomous action, human-approved writes, or read-only investigation plus recommendations?
10. Who from our team is presenting, and should the product be optimized for a technical walkthrough or a punchier product story?

## Load-Bearing Claims With T/A/P

| Claim | T | A | P=A-T | Evidence / what lowers T |
|---|---:|---:|---:|---|
| Aiven MCP can credibly be the control plane for this demo across Postgres, Kafka, metrics/logs, services, and apps. | 8 | 95 | 87 | Official docs and repo list create/manage, scoped/read-only modes, Kafka tools, Postgres tools, metrics/logs, and app deploy. Lower T by running the exact hosted MCP tools in the hack org. |
| Generic database MCP is now table stakes. | 10 | 80 | 70 | Neon, Supabase, MongoDB, Google Toolbox, ClickHouse, pgEdge, Redis, and others have similar database MCP surfaces. Lower T not needed; avoid this lane. |
| Generic Kafka MCP/admin is becoming crowded. | 12 | 78 | 66 | Confluent and Google Managed Service for Apache Kafka expose MCP for topics/connectors/schemas/clusters. Lower T not needed; Kafka must be the visible agent bus, not just admin CRUD. |
| A flight-recorder receipt layer is the highest-leverage wedge. | 22 | 92 | 70 | It converts "agent with keys to infra" from scary/invisible to inspectable and judge-visible. Lower T by building a UI where receipts appear within 60 seconds. |
| Kafka Lag Autopilot is the best first scenario. | 22 | 92 | 70 | It joins Aiven Kafka, Postgres memory, MCP actions, autonomy, and visible before/after. Lower T by confirming exact metrics/log/topic tools and one stable live write. |
| Bad-data quarantine is the best fallback scenario. | 20 | 86 | 66 | Easier for non-SRE judges: bad records are blocked before dashboards lie. Lower T with one reliable anomaly injection and DLQ/quarantine action. |
| A no-backend app swarm is creative but easier to misframe. | 28 | 90 | 62 | Strong if Aiven remains the state/queue layer; weak if it looks like a normal support bot. Lower T with UI that foregrounds tables/topics/tool receipts. |
| Live service provisioning is impressive but risky. | 18 | 76 | 58 | Aiven MCP supports service creation/update, but pitch-time latency/quota/wifi can fail. Lower T by measuring service create time twice in the real venue network. |
| OpenSearch should not be in the core plan yet. | 14 | 62 | 48 | Aiven blog says OpenSearch is coming soon, while current repo scopes list core/pg/kafka/application/integrations. Lower T if mentor confirms live OpenSearch MCP tools. |
| A generic SQL analyst is a dead end for winning. | 8 | 45 | 37 | It is buildable but crowded and does not show workflow autonomy or Kafka. Treat as support feature only. |

## Build Feasibility Gates

Before committing to final build, prove these in order:

1. Aiven MCP hosted or local connection works in the intended demo environment.
2. A live safe write works: create topic, produce message, create table, or insert receipt row.
3. UI can show Kafka events and Postgres receipts without manual refresh.
4. Seeded incident can be triggered and resolved in under 90 seconds.
5. Full 4-minute pitch can run after disconnecting the network, using replayed receipts as fallback.

If any gate fails:

- If MCP connection fails: replay saved MCP receipts but keep one live Postgres/Kafka client action if possible.
- If Kafka topic creation fails: pre-create topics and live-produce a message.
- If Postgres write fails: write receipt locally for UI and state clearly the planned `aiven_pg_write` path, but this is a major score hit.
- If metrics/logs are slow: use topic messages and SQL evidence as the primary proof.

## Sources Checked

Local required files:

- `investigations/aiven_landscape_2026_06_24/01_landscape/MISSION_01_LANDSCAPE.md`
- `AIDEN_INFO.txt`
- `SUNSTEAD_HACK.md`
- `PLAYBOOK.md`
- `navigate/SIMPLE_METHODOLOGY.md`
- `navigate/SIMPLE_GEOMETRIC_NAVIGATOR.logos`
- `autonomous-agents-world/DEEP_THESIS.md`

Local sibling landscape outputs checked:

- `AGENT_ALPHA_DATAOPS_COMPANIES.md`
- `AGENT_BETA_MCP_ECOSYSTEM.md`
- `AGENT_DELTA_NO_BACKEND_SWARMS.md`
- `AGENT_EPSILON_DEVOPS_OPERATORS.md`
- `AGENT_ZETA_DATA_DETECTIVES.md`

Targeted web checks:

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub tool list: https://github.com/aiven-open/mcp-aiven
- Aiven MCP product page: https://aiven.io/mcp
- Aiven MCP blog: https://aiven.io/blog/aiven-mcp
- Confluent MCP docs: https://docs.confluent.io/cloud/current/ai/ai-tools/open-source-mcp-server.html
- Google Managed Service for Apache Kafka MCP docs: https://docs.cloud.google.com/managed-service-for-apache-kafka/docs/use-managed-service-for-apache-kafka-mcp

## Final Recommendation

Converge on **Kafka Lag Autopilot + Flight Recorder**.

It wins the beam intersection:

- Forward beam: Aiven MCP already exposes the exact building blocks: Kafka, PostgreSQL, services, metrics/logs, scoped/read-only modes, and app deploy.
- Backward beam: judges need to see MCP depth, workflow autonomy, creativity/impact, and a first-minute demo moment.
- Bridge: receipts make autonomous infrastructure action visible, credible, and memorable.

One polished incident, one safe live MCP write, one Kafka event rail, one Postgres receipt ledger. Everything else is optional.
