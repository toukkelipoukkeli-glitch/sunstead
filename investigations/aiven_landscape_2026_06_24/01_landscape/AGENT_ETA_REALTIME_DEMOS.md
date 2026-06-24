# Agent Eta - Real-Time Demos, Live Ops, Games, and Event-Driven Stories

Date: 2026-06-24

Navigator position: emerging and aligned, approaching cold. The landscape is crowded around generic Kafka dashboards, CDC pipelines, and game leaderboards; the high-score wedge is a visibly autonomous live-ops demo where Aiven MCP makes Kafka and PostgreSQL reconfigurable by agents during the story.

## Hackathon Frame

- Detected hackathon type: `technical-first` and `sponsor-needs`, with a product-visible demo requirement.
- Challenge style: sponsor-needs. Aiven wants agents that natively control, stream, or query open-source data infrastructure through Aiven MCP.
- Judging/submission mode: Aiven/partners select finalists; finalists get a 4 minute live pitch and 1 minute Q&A.
- Target track: Aiven main challenge. Optional side wrapper only if voice or another sponsor layer improves the same Aiven story without extra build burden.
- Core demo flow: a simulated live operation starts producing events; agents inspect Aiven services, create/verify Kafka topics, write/query PostgreSQL receipts and memory, detect a live anomaly, and execute or propose one safe remediation while the UI shows Kafka messages, Postgres rows, and MCP actions in under 3 minutes.
- Intentionally cut: generic real-time dashboard, generic game leaderboard, production autoscaling, destructive Aiven operations, broad external API integrations, full stream-processing platform, and any hidden backend path that makes Kafka/Postgres invisible.

## Bottom Line

Real-time demos work when judges can see a before/after state change immediately: orders spike, players score, trucks reroute, fraud appears, a customer queue melts down, or a city sensor fails. Kafka gives the demo motion. PostgreSQL gives it memory, state, auditability, and "what changed?" queries. Aiven MCP is the differentiator only if agents use it as the live data-plane control surface, not as a one-time setup script.

Best expected-value direction:

> Build an agent-run live launch room: a stream of synthetic commerce/game/city events flows through Aiven Kafka; Postgres stores operational state, long-term memory, and action receipts; agents use Aiven MCP to create topics/tables, read metrics/logs, publish actions, and write SQL. The UI is an operations control room, not a chart gallery.

Load-bearing claim: "Kafka plus Postgres is judge-visible when Kafka is the heartbeat and Postgres is the receipt book." T18 A90 P72. Evidence that lowers T: a working screen where clicking one injected incident produces a Kafka event, a visible agent action, a Postgres receipt row, and a changed operational outcome within 15 seconds.

## Exact Matches

| Project / source | URL | What it proves | Demo mechanic to steal | Gap / implication |
|---|---|---|---|---|
| Aiven MCP docs | https://aiven.io/docs/tools/mcp-server | Aiven MCP can create/manage PostgreSQL and Kafka services, inspect metrics/logs/config, run read-only mode, and scope tools. | Show MCP tool calls in the first minute: service list, topic create/verify, message produce/read, table create/write. | This is mandatory, not a bonus. A demo that only uses Kafka clients and SQL drivers will score poorly against the rubric. |
| Aiven MCP GitHub tool list | https://github.com/aiven-open/mcp-aiven | Official tools include service create/update/metrics/logs/event logs, Kafka topic/message/connect tools, and PostgreSQL read/write/query stats/query optimization. | Build a visible "MCP receipt strip" with actual tool names like `aiven_kafka_topic_message_produce` and `aiven_pg_write`. | Best safe live writes are topic/message/table/row writes; avoid delete/scale in pitch. |
| Aiven MCP blog | https://aiven.io/blog/aiven-mcp | Aiven positions MCP as agents creating Kafka topics, running SQL, checking logs/metrics, and deploying apps without leaving chat. | Use Aiven's language: "agent does not just suggest SQL; it runs it" and "stream with Kafka hands-free." | The pitch should mirror sponsor vocabulary. |
| Aiven MCP landing page | https://aiven.io/mcp | Aiven frames Postgres MCP as persistent memory and Kafka MCP as real-time reflexes. | Make "memory + reflexes" the central metaphor: Postgres remembers; Kafka reacts. | Directly maps to the challenge brief and judge expectations. |
| Aiven Community Event Search with Dev Tier | https://aiven.io/blog/prototyping-for-free-scaling-for-cheap-with-aiven-dev-tier | Real Aiven Kafka + Postgres product pattern: Postgres stores data, Kafka distributes work across stateless workers, Aiven Apps runs workers. | Use "workers pull tasks from Kafka and persist results to Postgres" as the no-domain-backend live-ops architecture. | This is an Aiven-native adjacent demo; Eta should not duplicate the event-search app itself. |
| Aiven Debezium PostgreSQL to Kafka tutorial | https://aiven.io/developer/debezium-source-postgresql-kafka-across-clouds | Aiven documents Postgres-to-Kafka CDC via Debezium. | If time allows, show Postgres table changes becoming Kafka events; otherwise simulate the pattern and cite CDC as production path. | Live Debezium setup may consume too much time; use only if already reliable. |
| Aiven + ShadowTraffic synthetic data | https://aiven.io/developer/synthetic-data-for-ai-with-aiven-and-shadowtraffic | Aiven has an official path to generate synthetic data into Aiven Kafka. | Generate live events without fragile third-party APIs. | Strong hackathon accelerant; use deterministic seeded events for pitch reliability. |

## Adjacent Matches

| Project / source | URL | Why it matters | Best demo mechanic | Aiven contrast |
|---|---|---|---|---|
| Confluent real-time Kafka dashboards | https://www.confluent.io/blog/build-real-time-kafka-dashboards/ | Defines the mature pattern: Kafka dashboards should become command centers with alerts and one-click actions, not passive charts. | One visible anomaly card with a "propose/execute action" button and live event timeline. | Aiven adds MCP-driven data-plane control and Postgres receipts, not just dashboarding. |
| Confluent gamification demo | https://www.confluent.io/blog/real-time-gaming-infrastructure-kafka-ksqldb-websockets/ | Proven judge-friendly game loop: live question every 20 seconds, 10-second answer window, top-10 leaderboard. | Timer + live scoring + leaderboard makes streaming obvious. | Do not clone a quiz; use a game/live-ops loop where agents create/control data infra. |
| RisingWave games analytics + leaderboard | https://risingwave.com/blog/real-time-gaming-leaderboard/ | Kafka ingestion, materialized views, Superset/Grafana dashboards for player rankings and game trends. | Live leaderboard + materialized stats. | Aiven should not spend build time on another analytics DB; Postgres can hold enough state for a hackathon. |
| Redpanda real-time gaming leaderboard | https://www.redpanda.com/blog/build-real-time-leaderboard-gaming | Confirms real-time leaderboards are a familiar, crowded pattern. | Fast score ingestion and live rank changes. | Leaderboard alone is too solved; add autonomous operations and MCP receipts. |
| Debezium outbox pattern | https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/ | Postgres outbox + CDC to Kafka is a standard way to get reliable event publishing. | Action receipts table doubles as outbox: each approved action is both durable row and stream event. | Full outbox/CDC implementation is optional; concept is strong for explaining reliability. |
| Factor House theLook ecommerce CDC project | https://factorhouse.io/how-to/from-batch-to-real-time-a-hands-on-cdc-project-with-debezium-kafka-and-thelook-ecommerce-data | Turns a static ecommerce dataset into a live Postgres source and Kafka stream with realistic user journeys. | Live store simulator: signups, browsing, purchases, cancellations, returns. | Good seeded domain for a launch-room demo; avoid building a full ecommerce app. |
| ShadowTraffic examples | https://github.com/ShadowTraffic/shadowtraffic-examples | Synthetic generators can emit to Kafka and Postgres, model sensors, support tickets, shopping carts, suspicious accounts, delays, drops, duplicates. | Incident injection: delayed/dropped/duplicated telemetry to trigger the agent. | Strongest source for reliable demo data; no external APIs needed. |
| IBM real-time inventory demo | https://ibm-cloud-architecture.github.io/eda-rt-inventory-gitops/ | Real-time inventory is an established event-driven demo scenario. | Inventory dashboard where low stock or mismatch triggers action. | Aiven wedge: agent creates/updates topics/tables and stores receipts through MCP. |
| Confluent real-time inventory | https://www.confluent.io/blog/real-time-inventory-in-retail/ | Retail inventory benefits from near-real-time streams across sources, enriched by SKU/location and consumed by services. | Stockout alert, replenishment action, "promise broken vs fixed" story. | Use as business-legible live-ops wrapper. |
| Xebia real-time agent context | https://xebia.com/blog/beyond-rag-ai-agents-with-a-real-time-context/ | Architecture explicitly pairs Kafka/Flink short-term real-time context with PostgreSQL + pgvector long-term memory. | "Similar past incident" lookup from Postgres memory after a live event arrives. | Aiven can make both memory and reflexes sponsor-native through MCP. |
| Confluent multi-agent AI | https://www.confluent.io/blog/building-real-time-multi-agent-ai/ | Agents subscribe to Kafka streams and coordinate through shared topics; Postgres sink stores execution logs/job results/flow telemetry. | Topic-per-agent or event-type board; Postgres audit table for agent outputs. | Aiven should emphasize MCP control, not Confluent managed streaming agents. |
| Confluent Flink/Kafka multi-agent orchestrator | https://www.confluent.io/blog/multi-agent-orchestrator-using-flink-and-kafka/ | Event-driven agents are positioned as more resilient than request/response; Kafka can be shared short-term memory. | Agent routing by events, dead-letter/recovery lane, progress monitor. | Cut Flink unless already available; use simple consumers and Aiven MCP receipts. |
| Confluent PodPrep AI research assistant | https://www.confluent.io/blog/event-driven-ai-building-a-research-assistant-with-kafka-and-flink/ | Event-driven AI assistant pattern with code/reference architecture. | Show AI work as a live event pipeline, not a chat transcript. | Aiven opportunity is operations/data infra, not research content prep. |
| Tinybird event sourcing with Kafka | https://www.tinybird.co/blog/event-sourcing-with-kafka | Recent practical writeup validates immutable event history as a demo/product primitive. | Replay slider: rebuild current state from event log. | Aiven can store replay metadata and action receipts in Postgres while Kafka holds live history. |
| Tinybird real-time leaderboard | https://www.tinybird.co/blog/building-real-time-leaderboards-with-tinybird | Leaderboards are current and broadly understood. | Millisecond-feeling rank updates. | Use leaderboard as UI mechanic, not whole idea. |
| TigerData IoT Kafka to PostgreSQL/Grafana | https://www.tigerdata.com/blog/how-to-build-an-iot-pipeline-for-real-time-analytics-in-postgresql | Kafka-to-Postgres/TimescaleDB with Grafana is a clear IoT monitoring pattern. | Sensor stream + Grafana-like time-series chart. | Aiven hackathon should use a custom ops UI so MCP actions are visible. |
| Aiven free/dev tier announcement | https://aiven.io/blog/data-infrastructure-for-all | Free Kafka and low-cost Postgres make prototyping event-driven architectures approachable. | Mention feasibility: managed Kafka/Postgres can be spun up for hackathon-sized demos. | Not a product idea by itself. |

## Best Demo Mechanics

1. Live event heartbeat.
   A small event list should tick every second: `order.created`, `score.updated`, `vehicle.delayed`, `sensor.hot`, `support.ticket.opened`, `agent.action.proposed`. Judges need motion before any explanation.

2. One incident injection button.
   A button like `Start launch surge`, `Break inventory`, or `Inject duplicate telemetry` creates a before/after moment. ShadowTraffic-style delay/drop/duplicate events are especially good because the agent can detect stream quality problems, not just high values.

3. Split-screen infrastructure receipts.
   Left: operational UI. Middle: Kafka topics/messages. Right: Postgres rows/MCP receipts. This turns invisible infrastructure into visible product.

4. Safe live MCP write.
   In the live pitch, use MCP to create or verify a Kafka topic, produce one message, create/write a Postgres table/row, and read it back. Service creation can be pre-seeded or replayed if latency/wifi is risky.

5. Postgres as memory plus audit.
   Store `incident_id`, `agent`, `trigger_event`, `mcp_tool`, `input_summary`, `result_summary`, `risk`, `approval_required`, `rollback`, `created_at`. If pgvector is ready, retrieve a "similar past incident"; if not, normal SQL is enough.

6. Kafka as reflexes.
   Agents should react to topics, not just chat. Use topics such as `live.events`, `agent.plan`, `agent.actions`, `human.approvals`, `ops.resolved`, and `dead.letters`.

7. Replay or rewind.
   A replay button is unusually persuasive: "Kafka kept the live history; Postgres kept the decisions; the agent can explain what happened and rerun the timeline." This is more memorable than another chart.

8. Agent-created data-plane change.
   The most Aiven-native moment is the agent noticing the current schema/topic layout is insufficient and creating one small new object: `ops_incidents` table, `ops.actions` topic, or a dead-letter topic. Keep it safe and bounded.

9. Physical metaphor.
   Use a launch room, city control room, game live-ops desk, or logistics command center. Abstract "real-time analytics" is weak; a visible operation with humans depending on it is strong.

10. Fallback recording.
   Pre-capture the service-create path and have seeded Aiven services ready. Live demo only needs topic/table/message/row writes plus UI reaction.

## Pattern Map

### Pattern 1: Actionable Command Center

The strongest dashboards are not "look at metrics"; they surface a specific problem and let an operator respond. Confluent's dashboard guidance explicitly moves from BI charts to command centers with alerts and one-click action. Aiven's version should replace the human-only action with agent-suggested/agent-executed actions via MCP, with human approval for risky steps.

T/A/P: T12 A84 P72. Low uncertainty because many real-time dashboard sources converge; high amplitude because it creates a 3-minute story.

### Pattern 2: Leaderboard / Scoreboard

Leaderboards are a proven streaming demo: easy to understand, dynamic, and visually rewarding. But they are crowded. Confluent, RisingWave, Redpanda, Tinybird, and many tutorials already show Kafka-like ingestion into live rankings.

T/A/P: T10 A58 P48. Use only as a mechanic inside a bigger live-ops or simulation story.

### Pattern 3: Live Inventory / Launch Room

Inventory, checkout, delivery, and event-launch operations are business-legible. They produce natural anomalies: stockout, oversell, fraud burst, delayed shipment, support surge, payment failure, promotion spike. This maps well to Kafka events and Postgres durable state.

T/A/P: T15 A82 P67. Strong because judges understand the stakes quickly.

### Pattern 4: Simulation as Safe Reality

Synthetic streams are hackathon-friendly because they remove API risk. Aiven + ShadowTraffic and ShadowTraffic examples cover Kafka, Postgres, sensors, support tickets, shopping carts, suspicious accounts, and degraded telemetry. This allows a polished "live" story without depending on third-party services.

T/A/P: T8 A80 P72. Use deterministic seeds and a visible "scenario clock."

### Pattern 5: CDC / Outbox / Receipts

Postgres-to-Kafka CDC and transactional outbox are solved patterns, but the receipt concept is valuable. The demo can use an `action_receipts` table as the durable source of truth and publish corresponding Kafka events. Full Debezium setup is optional; the conceptual bridge is cold enough to cite and the hackathon implementation can be direct writes plus Kafka produce.

T/A/P: T12 A86 P74. High leverage because it turns agent safety into visible infrastructure.

### Pattern 6: Real-Time Context + Long-Term Memory

Kafka is the short-term stream of what is happening now. Postgres/pgvector is long-term memory of past incidents, policies, and outcomes. Xebia and Aiven both point to this combination. In a demo, the agent should retrieve one prior incident/policy from Postgres after seeing a live event in Kafka.

T/A/P: T18 A88 P70. Slightly warmer because pgvector setup may be slower, but normal SQL memory is enough.

### Pattern 7: Event-Driven Agents

Confluent and others are pushing event-driven agents where agents subscribe to streams and coordinate through topics. This is directly adjacent to the Aiven challenge. The gap is making the agents visibly control the data infrastructure through Aiven MCP, rather than just consume Kafka events.

T/A/P: T22 A92 P70. Strong, but implementation can sprawl; keep agent count low.

## Crowded / Already Solved

- Generic "Kafka real-time dashboard" is crowded. It needs an action loop and Aiven MCP receipts to stand out.
- Generic game leaderboard is solved and tutorial-heavy. It is a UI mechanic, not a winning project by itself.
- Generic CDC from Postgres to Kafka is solved by Debezium and many tutorials. Do not spend the pitch on connector plumbing.
- Generic "chat with Postgres" is crowded by database MCP products. It is not Eta's territory.
- Generic Kafka admin chatbot is crowded by Kafka MCP and Confluent-style tooling. Use Kafka administration only as a visible agent action.
- Stream-processing depth with Flink/ksqlDB/RisingWave/Materialize is impressive but can steal time from Aiven MCP scoring. Use only if one teammate already has it working.
- Real external data feeds are risky under live judging. Synthetic streams can be more reliable and more legible.

## Gaps and Wedges

| Gap / wedge | Why it matters | T/A/P | Evidence that lowers T |
|---|---|---:|---|
| Aiven-native live ops room | Most demos either show dashboards or agents, not agents operating the data plane through MCP. | T20 A92 P72 | Working UI shows MCP tool names, Kafka messages, Postgres rows, and action outcome in one flow. |
| Visible "memory + reflexes" | Aiven's own MCP framing maps Postgres to memory and Kafka to reflexes. | T12 A90 P78 | Pitch line lands with sponsor mentor; demo visibly uses both. |
| Replayable agent flight recorder | Kafka + Postgres can make agent actions auditable and replayable. | T18 A88 P70 | One incident can be replayed and explained from stored events/receipts. |
| Synthetic production traffic | Realistic streams make demos memorable without external API risk. | T8 A78 P70 | Seeded generator creates enough motion and anomaly variety in 30 seconds. |
| Agent-created infra object | MCP depth becomes legible when the agent creates a small topic/table in response to the scenario. | T24 A94 P70 | Live topic/table create succeeds reliably; fallback replay exists. |
| Game/sim wrapper with serious ops framing | Games are memorable, but sponsor-needs judging rewards useful data infrastructure. | T28 A82 P54 | A mentor reacts positively to creative sim framing; otherwise use business live ops. |

## Three Aiven Ideas

### 1. PulseOps Live Launch Room

One-liner: "A launch-room agent team watches a live event stream, creates its own Kafka/Postgres ops rails through Aiven MCP, detects a surge, and leaves a receipt for every action."

Domain wrapper:

- Best: ecommerce/product launch because inventory, checkout, support, fraud, and fulfillment are easy to understand.
- Backup: community event search pipeline, borrowing from Aiven's Dev Tier article but reframed as live ops.
- Avoid: generic SaaS analytics with no stakes.

Core demo flow:

1. Presenter clicks `Start Launch`.
2. Synthetic events stream into Kafka: `page.view`, `cart.added`, `order.created`, `payment.failed`, `support.ticket`.
3. Planner agent uses Aiven MCP to list services and verify `launch.events` topic and `ops_receipts` table.
4. Anomaly agent sees payment failures spike and writes an incident row into Postgres.
5. Operator agent creates or verifies `ops.actions` Kafka topic via MCP and publishes `action.proposed`.
6. Memory agent queries Postgres for a similar past incident and attaches the known response.
7. Safe action: publish customer-support priority event, create dead-letter topic, or write a mitigation rule row. Risky actions are marked approval-required.
8. UI shows live stream, current incident, Postgres receipt row, MCP tool call, and resolved status.

Why it can win:

- Hits all Aiven rubric lanes: MCP depth, workflow autonomy, creativity/impact.
- Business stakes are clear in under 20 seconds.
- Uses Kafka for motion and Postgres for memory/receipts, not as hidden plumbing.

T/A/P: T22 A92 P70.

Cuts:

- No real Shopify/Stripe/Meetup/Luma API during pitch.
- No real autoscaling or destructive config changes.
- No full incident-management product.
- No more than 4 agents: planner, detector, operator, auditor.
- No Flink unless already working.

### 2. StreamQuest: A Game Live-Ops Simulator

One-liner: "A multiplayer event game where player telemetry streams through Kafka, Postgres stores player state and agent memory, and an AI live-ops producer changes the event by creating topics/tables through Aiven MCP."

Domain wrapper:

- Players compete in a short "answer/collect/survive" loop.
- The live-ops agent monitors engagement, detects cheating/lag/churn, and launches a power-up or mitigation.
- Judges see a leaderboard, but the real product is autonomous game operations.

Core demo flow:

1. Synthetic players generate Kafka events: `player.joined`, `score.changed`, `quest.completed`, `latency.spike`, `suspicious.combo`.
2. Postgres stores players, sessions, scores, policy rules, and prior incidents.
3. Agent detects a drop in engagement or cheating burst.
4. Agent uses MCP to create `game.liveops.actions` topic or `game_incidents` table.
5. Agent publishes a limited-time event or quarantine action to Kafka.
6. UI shows leaderboard changing, event timeline, agent decision, and Postgres receipts.

Why it can win:

- Highly visible and memorable at a demo table.
- Leaderboard/timer mechanics make Kafka easy to feel.
- More creative than another DevOps bot while still sponsor-native.

T/A/P: T30 A86 P56.

Cuts:

- No actual multiplayer networking. Simulated players are enough.
- No complex game design. One scoring loop and one intervention.
- No graphics-heavy game client; use a polished ops dashboard with a small playable/simulated panel.
- No anti-cheat ML. Use deterministic suspicious patterns.

### 3. ReplayOps Incident Flight Recorder

One-liner: "An autonomous data operator investigates a live stream failure, fixes the safe part, and can replay the whole incident from Kafka events and Postgres receipts."

Domain wrapper:

- Works for IoT sensors, delivery fleet, support tickets, or infrastructure telemetry.
- Best pitch framing: "Agents with keys to data infrastructure need a flight recorder."

Core demo flow:

1. ShadowTraffic-style generator emits normal telemetry to Kafka.
2. Presenter injects degraded data: delayed, dropped, duplicated, or out-of-range events.
3. Detector agent consumes/reads the event stream and writes anomaly findings to Postgres.
4. Operator agent uses Aiven MCP to inspect Kafka topic messages, Postgres query stats/logs, and service metrics if stable.
5. Safe action: create/verify dead-letter topic, produce a remediation event, write a validation rule row, or pause/resume a sandbox connector only if pre-tested.
6. Auditor agent queries Postgres receipts and Kafka messages to generate an incident timeline.
7. Replay button rebuilds the story: event -> detection -> decision -> MCP action -> outcome.

Why it can win:

- Strongest "freedom with receipts" transfer to Aiven.
- Technically credible for sponsor reps.
- Lower UI complexity than a game; less toy risk.

T/A/P: T20 A90 P70.

Cuts:

- No real production observability stack.
- No sophisticated anomaly model; simple thresholds and stream-quality checks are enough.
- No live connector chaos unless pre-tested.
- No broad remediation library.

## Recommended Direction

Pick PulseOps Live Launch Room as the trunk and borrow ReplayOps' receipt/replay mechanics.

Pitch sentence:

> Aiven MCP gives agents the keys to Kafka and Postgres; PulseOps shows how they can run a live operation safely, with Kafka as their reflexes and Postgres as their memory and flight recorder.

3-minute demo arc:

1. 0:00-0:30 - Show live launch events streaming into Kafka and the ops room changing.
2. 0:30-1:10 - Agent uses Aiven MCP to inspect services and verify/create the topic/table it needs.
3. 1:10-1:50 - Inject incident; detector writes Postgres finding and publishes Kafka event.
4. 1:50-2:30 - Operator retrieves prior memory, proposes safe action, executes a bounded Kafka/Postgres write through MCP.
5. 2:30-3:00 - Auditor shows the flight recorder: event, decision, tool, result, rollback/fallback.

Why this is better than the other branches:

- More useful than pure game/sim.
- More memorable than pure observability.
- More Aiven-native than generic dashboard/CDC.
- Safer than live service provisioning as the main moment.

## Implementation Skeleton

Postgres tables:

- `agents(id, role, status, last_seen_at)`
- `incidents(id, source_event_id, severity, state, summary, created_at, resolved_at)`
- `agent_memory(id, kind, summary, embedding optional, created_at)`
- `action_receipts(id, incident_id, agent, mcp_tool, action_type, input_summary, result_summary, risk, approval_required, rollback, created_at)`
- `launch_state(key, value_json, updated_at)`

Kafka topics:

- `launch.events`
- `ops.incidents`
- `ops.agent.plan`
- `ops.actions`
- `ops.approvals`
- `ops.dead_letters`

Agents:

- Planner: turns scenario into required data-plane objects.
- Detector: watches/reads events and writes incident rows.
- Operator: runs safe MCP-backed Kafka/Postgres actions.
- Auditor: builds receipt timeline and explains what happened.

UI panels:

- Live event stream.
- Incident board.
- MCP receipt timeline with tool names.
- Kafka topic/message inspector.
- Postgres receipt/memory inspector.
- Scenario controls: start, inject incident, replay.

## Cuts

- Cut passive dashboarding. Every chart must connect to an action or decision.
- Cut service deletion, plan scaling, and production credentials.
- Cut full CDC/Connect if it threatens demo reliability. Direct producer + Postgres writes are enough; cite Debezium as production path.
- Cut Flink/ksqlDB/RisingWave/Materialize unless one is already working. They are strong but not required for the Aiven rubric.
- Cut broad multi-agent frameworks. Four deterministic role agents beat a fragile swarm.
- Cut external APIs during the pitch. Use seeded synthetic data and optionally mention external feeds as future inputs.
- Cut OpenSearch as a dependency unless sponsor confirms tool availability and it is already stable.
- Cut complex game UI. If using a game wrapper, build an ops room with leaderboard, not a full game.
- Cut hidden backend APIs for domain logic. A thin runner is fine; Kafka/Postgres/MCP must visibly carry state and action.
- Cut ML-heavy anomaly detection. Thresholds, duplicate/drop checks, and known incident lookup are sufficient.

## Source Index

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Aiven MCP blog: https://aiven.io/blog/aiven-mcp
- Aiven MCP landing page: https://aiven.io/mcp
- Aiven Dev Tier community event search: https://aiven.io/blog/prototyping-for-free-scaling-for-cheap-with-aiven-dev-tier
- Aiven Debezium PostgreSQL to Kafka: https://aiven.io/developer/debezium-source-postgresql-kafka-across-clouds
- Aiven + ShadowTraffic synthetic data: https://aiven.io/developer/synthetic-data-for-ai-with-aiven-and-shadowtraffic
- ShadowTraffic examples: https://github.com/ShadowTraffic/shadowtraffic-examples
- Confluent real-time Kafka dashboards: https://www.confluent.io/blog/build-real-time-kafka-dashboards/
- Confluent real-time gaming infrastructure: https://www.confluent.io/blog/real-time-gaming-infrastructure-kafka-ksqldb-websockets/
- Confluent real-time inventory: https://www.confluent.io/blog/real-time-inventory-in-retail/
- Confluent multi-agent AI: https://www.confluent.io/blog/building-real-time-multi-agent-ai/
- Confluent Flink/Kafka multi-agent orchestrator: https://www.confluent.io/blog/multi-agent-orchestrator-using-flink-and-kafka/
- Confluent PodPrep event-driven AI assistant: https://www.confluent.io/blog/event-driven-ai-building-a-research-assistant-with-kafka-and-flink/
- RisingWave games analytics and leaderboard: https://risingwave.com/blog/real-time-gaming-leaderboard/
- Redpanda real-time gaming leaderboard: https://www.redpanda.com/blog/build-real-time-leaderboard-gaming
- Debezium outbox pattern: https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/
- Factor House theLook CDC project: https://factorhouse.io/how-to/from-batch-to-real-time-a-hands-on-cdc-project-with-debezium-kafka-and-thelook-ecommerce-data
- Tinybird event sourcing with Kafka: https://www.tinybird.co/blog/event-sourcing-with-kafka
- Tinybird real-time leaderboards: https://www.tinybird.co/blog/building-real-time-leaderboards-with-tinybird
- TigerData IoT Kafka to PostgreSQL analytics: https://www.tigerdata.com/blog/how-to-build-an-iot-pipeline-for-real-time-analytics-in-postgresql
- IBM real-time inventory demo: https://ibm-cloud-architecture.github.io/eda-rt-inventory-gitops/
- Xebia real-time AI agent context: https://xebia.com/blog/beyond-rag-ai-agents-with-a-real-time-context/
