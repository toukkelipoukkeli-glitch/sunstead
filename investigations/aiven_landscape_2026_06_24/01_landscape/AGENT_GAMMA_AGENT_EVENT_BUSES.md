# Agent Gamma: Agent Event Buses, Queues, Memory, and Pub/Sub

Status: emerging and aligned - the event-bus territory is highly relevant to Aiven, but the exact Kafka-native agent story is already being claimed by Confluent/Flink. The Aiven wedge is not "we invented agent pub/sub"; it is "agents can visibly create, configure, use, and audit the data plane through Aiven MCP."

## Hackathon Fit

- Detected type: `technical-first` + `sponsor-needs`, with an open-ended creative build inside Aiven's constraints.
- Judging/submission mode: Aiven partner selects top 3, then 4 minute pitch + 1 minute Q&A. Assume presenter-led demo; live expo/table details and presenter are still unknown.
- Chosen target: Aiven main challenge. Possible side wrappers only if legal and cheap; do not dilute the Aiven story.
- Best core demo flow: user asks for an autonomous data workflow, agents use Aiven MCP to create/inspect Kafka/Postgres resources, agents collaborate through Kafka topics, and the UI shows live Kafka events plus Postgres memory/receipts.
- Intentional cuts: no generic agent framework, no broad admin console, no production durability engine, no hidden backend-heavy work that judges cannot see.

Mission-critical unknowns to flag before major build: presenter, final submission rules, team/track multi-entry legality, and whether Aiven mentors prefer live provisioning or seeded resources with one live safe MCP action.

## Executive Read

The strongest pattern is a visible "agent operations bus": Kafka is the collaboration layer, PostgreSQL/pgvector is memory and artifacts, and Aiven MCP is the control plane that provisions, queries, and verifies the data infrastructure. This matches the Aiven brief exactly and gives judges something concrete to see in under 60 seconds.

T/A/P: "An Aiven-native event bus demo scores if Kafka/Postgres/MCP are visible primitives, not hidden implementation details." T18 A86 P68.

T/A/P: "Competing as a generic multi-agent orchestrator is low value because AutoGen, LangGraph, CrewAI, Dapr, Temporal, Flink Agents, and Confluent already occupy that framing." T10 A72 P62.

T/A/P: "Kafka-native AI agents are now a crowded claim because Apache Flink Agents and Confluent Streaming Agents explicitly pitch event-driven agents on Flink/Kafka." T14 A82 P68.

## Source Map

| Project | URL | Match | What matters for Aiven | Gap / caution |
| --- | --- | --- | --- | --- |
| Aiven MCP | https://aiven.io/docs/tools/mcp-server | Exact challenge substrate | Official docs say MCP can create/manage PostgreSQL, Apache Kafka, plans, metrics, logs, and service configuration, with read-only/scoped tools. This is the sponsor-visible control plane. | Early availability; live destructive actions need guardrails and seeded fallback. |
| Aiven MCP server repo | https://github.com/aiven-open/mcp-aiven | Exact | Confirms MCP server for Aiven cloud data platform, including PostgreSQL and Kafka management from AI assistants. | Repo warns actions can be destructive; demo should use read-only for most steps and one safe write. |
| AutoGen Core | https://microsoft.github.io/autogen/stable/ | Exact framework pattern | AutoGen Core is explicitly an event-driven framework for scalable multi-agent systems and supports MCP workbench plus gRPC distributed runtime. | Its pub/sub runtime is not Kafka-native. For Aiven, either borrow the topic/subscription model or bridge AutoGen events to Kafka. |
| AutoGen topics/subscriptions | https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/core-concepts/topic-and-subscription.html | Exact pattern | Topics are `(type, source)` scopes; subscriptions map topics to agent IDs. This maps cleanly to Kafka topic/key design. | AutoGen broadcast is one-way, not request/response; need result topics or Postgres receipts. |
| AutoGen distributed runtime | https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/framework/distributed-agent-runtime.html | Exact but experimental | Host/worker runtime manages cross-process lifecycle and message delivery. Good reference for "agents as distributed actors." | Docs mark it experimental; too risky as core hackathon dependency unless already familiar. |
| LangGraph | https://docs.langchain.com/oss/python/langgraph/overview | Adjacent | Strong stateful graph runtime: durable execution, streaming, human-in-loop, persistence. Best for controlled demo flow. | Not an event bus by itself; Kafka must be added as external event stream. |
| LangGraph persistence | https://docs.langchain.com/oss/python/langgraph/persistence | Adjacent | Checkpointers = short-term thread memory; stores = long-term cross-thread memory. Translate to Postgres/pgvector for Aiven. | If hidden behind LangGraph, Aiven may look incidental; expose the Postgres tables. |
| CrewAI event listeners | https://docs.crewai.com/en/concepts/event-listener | Adjacent | CrewAI has an internal event bus for lifecycle events, monitoring, logging, and integrations. Useful for emitting agent receipts to Kafka. | This is not distributed pub/sub for agent collaboration. Avoid pitching CrewAI's event bus as Kafka-native. |
| CrewAI flows/crews | https://docs.crewai.com/en | Adjacent | Good fast role-based teams and event-driven Flows for a polished demo. | Generic "researcher/writer/reviewer crew" is crowded and weak for Aiven unless MCP/Kafka is the main act. |
| Temporal AI agent tutorial | https://learn.temporal.io/tutorials/ai/durable-ai-agent/ | Adjacent durability layer | Temporal frames agents as distributed systems; Workflows/Activities/Signals/Queries make long-running agents reliable and inspectable. | Overkill for a 2-day hack unless already in stack; it can make Aiven less visible. |
| Temporal workflow messages | https://docs.temporal.io/encyclopedia/workflow-message-passing | Adjacent pattern | Signals/Queries/Updates are useful mental models for command, status, and approval channels. | Temporal is not a Kafka bus. Do not add it unless reliability is the demo story. |
| Dapr Agents | https://docs.dapr.io/developing-ai/dapr-agents/ | Exact/adjacent | Dapr Agents v1.0 gives durable agents, workflows, state, messaging, observability. Very close to this challenge's architecture. | Dapr abstracts infra; if used, Aiven becomes replaceable unless Kafka/Postgres components and MCP actions are visible. |
| Dapr Agents core concepts | https://docs.dapr.io/developing-ai/dapr-agents/dapr-agents-core-concepts/ | Exact | Docs explicitly describe deterministic workflow orchestration and event-driven orchestration through Pub/Sub messaging. | Strong competitor pattern; copy the idea, not the full platform. |
| Dapr pub/sub | https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-overview/ | Exact infra pattern | Platform-agnostic pub/sub, at-least-once delivery, pluggable brokers, dead-letter topics, outbox, competing consumers. | If building directly on Aiven Kafka, only borrow these patterns; Dapr itself adds setup cost. |
| Apache Flink Agents | https://nightlies.apache.org/flink/flink-agents-docs-latest/docs/get-started/overview/ | Exact Kafka/stream-native competitor | Flink Agents makes agents first-class operators in real-time datastreams with memory, tool/MCP invocation, checkpointing, and durable execution. | This is the closest "already exists" to Kafka-native agents. Do not claim novelty here. |
| Confluent Streaming Agents | https://docs.confluent.io/cloud/current/ai/streaming-agents/overview.html | Exact commercial competitor | Event-driven agents run natively on Flink within streams, with MCP tools, replayability, session store, observability, and multi-agent examples. | Confluent owns the polished Kafka/Flink agent product narrative. Aiven needs a different wedge: MCP-controlled open-source data platform, not managed Flink agents. |
| Confluent event-driven MAS patterns | https://www.confluent.io/blog/event-driven-multi-agent-systems/ | Exact pattern | Names the useful patterns: orchestrator-worker, hierarchical, blackboard, market-based. Good pitch vocabulary. | Confluent has already written the thought-leadership article. Use it as prior art and contrast. |
| Confluent Flink/Kafka orchestrator | https://www.confluent.io/blog/multi-agent-orchestrator-using-flink-and-kafka/ | Exact competitor/demo | Shows a multi-agent orchestrator using Kafka as short-term shared memory and Flink for routing. | Avoid building a weaker clone unless Aiven MCP is the differentiator. |
| LlamaIndex AgentWorkflow | https://developers.llamaindex.ai/python/framework/understanding/agent/multi_agent/ | Adjacent | Built-in AgentWorkflow manages handoffs among multiple agents; useful for quick specialist-agent demos. | In-process workflow abstraction; no native Aiven/Kafka story. |
| Google ADK sessions/events/memory | https://google.github.io/adk-docs/events/ and https://google.github.io/adk-docs/sessions/ | Adjacent | ADK treats events as execution records and sessions/state/memory as structured context. Good mental model for receipts. | Google ecosystem framing; not a direct Aiven wedge. |
| Restate durable agents | https://docs.restate.dev/ai/patterns/durable-agents | Adjacent | Durable agents persist LLM calls, tool execution, and routing decisions. | Similar to Temporal/Inngest; durable execution is not the Aiven scoring core. |
| Inngest | https://www.inngest.com/docs | Adjacent | Event-driven durable execution with queues, state, retries, concurrency, and observability. | Good for production, but a black-box queue layer would hide Aiven. |
| Pydantic AI durable execution | https://pydantic.dev/docs/ai/integrations/durable_execution/overview/ | Adjacent | Durable agents with streaming, MCP, Temporal support. | Good type-safe agent library; not an event bus by itself. |
| Mastra | https://mastra.ai/docs/agents/overview | Adjacent | TypeScript agents with memory, tools, workflows, MCP, tracing/evals. | Product-stack convenience, not Kafka-native collaboration. |

## Exact vs Adjacent Matches

Exact matches for this challenge:

- Aiven MCP + Kafka + Postgres: the sponsor's own exact substrate.
- AutoGen Core: event-driven multi-agent programming model with topics/subscriptions, distributed runtime, MCP workbench.
- Dapr Agents: durable agents plus workflow/pub-sub/state stores; can use Kafka as broker and database-backed state.
- Apache Flink Agents: event-driven agents directly inside streaming runtime, including memory/tools/MCP.
- Confluent Streaming Agents / Kafka-Flink orchestrator: commercialized Kafka-native agent orchestration.
- Kafka event-driven patterns: orchestrator-worker, hierarchical agents, blackboard, market-based competition, consumer groups, dead letters, outbox.

Adjacent matches:

- LangGraph: reliable state machine/graph runtime; needs Kafka and Postgres adapters to become Aiven-native.
- CrewAI: fast role-based multi-agent abstraction; internal event bus is more monitoring hook than distributed collaboration.
- Temporal/Restate/Inngest/Pydantic durable execution: excellent reliability primitive; not the visible sponsor primitive unless used sparingly.
- LlamaIndex/Google ADK/Mastra: useful agent workflow and memory patterns; Aiven must be explicit and visible.

## Patterns To Steal

- Orchestrator-worker: one planner routes tasks to specialized agents through Kafka command topics; workers emit result events. T12 A76 P64.
- Blackboard: agents append hypotheses, evidence, and artifacts to Kafka/Postgres; any agent can react to shared state. T20 A80 P60.
- Market-based: agents bid or vote on next action through Kafka; evaluator chooses the winning plan. High demo novelty, higher complexity. T36 A72 P36.
- Hierarchical: manager agent decomposes into sub-managers and workers; useful but easy to overbuild. T24 A58 P34.
- Event-sourced receipts: every agent decision, MCP call, SQL query, Kafka publish, and human approval gets a durable record. This is the strongest Aiven demo primitive. T14 A88 P74.

Suggested Aiven event envelope:

```json
{
  "run_id": "demo-001",
  "event_id": "evt-123",
  "parent_event_id": "evt-098",
  "agent": "pipeline_planner",
  "role": "orchestrator",
  "type": "mcp.kafka.create_topic.requested",
  "status": "completed",
  "input_ref": "postgres://agent_artifacts/...",
  "output_ref": "postgres://mcp_receipts/...",
  "topic": "agent.commands",
  "key": "demo-001:pipeline_planner",
  "idempotency_key": "create-topic-demo-001-agent-events",
  "created_at": "2026-06-24T00:00:00Z"
}
```

Suggested Aiven topics:

- `agent.commands`: orchestrator-to-agent work requests.
- `agent.events`: all agent lifecycle events.
- `agent.receipts`: MCP tool call receipts and user approvals.
- `domain.events`: live business/simulation stream.
- `agent.hypotheses`: blackboard-style claims, plans, and critiques.
- `agent.dead_letters`: failed or rejected actions.

Suggested Postgres tables:

- `agent_runs(run_id, goal, status, started_at, completed_at)`
- `agent_events(event_id, run_id, agent, type, payload, created_at)`
- `mcp_receipts(receipt_id, run_id, tool_name, args_redacted, result_summary, status)`
- `agent_memory(id, run_id, agent, memory_type, content, embedding)`
- `artifacts(id, run_id, kind, uri, content_summary)`

## What Is Crowded / Already Solved

- Generic role-playing crews are crowded. A "planner/researcher/writer/reviewer" flow will look like any CrewAI/LangGraph demo unless the data plane is the star.
- Kafka-native agent claims are crowded. Confluent and Apache Flink Agents already have the exact "event-driven agents on Kafka/Flink" story.
- Durable execution is crowded. Temporal, Dapr, Restate, Inngest, and Pydantic AI all explain durable agents well.
- Memory is table stakes. "Agents remember things in a vector DB" is not enough; memory must drive visible decisions and be queryable during demo.
- Observability alone is not enough. Traces/logs are useful, but the Aiven score needs MCP control and autonomous workflow, not just dashboards.

## Gaps And Wedges

- Infra-changing agents are still more demoable than agent frameworks. Most frameworks orchestrate agent logic; Aiven can show agents creating/configuring Kafka topics and Postgres tables live. T16 A86 P70.
- Receipts are underused. A Kafka/Postgres flight recorder for agent actions makes autonomy legible and safe. T15 A84 P69.
- Sponsor-native blackboard is open. Most frameworks keep state inside their runtime; using Aiven Kafka/Postgres as shared state makes the sponsor unavoidable. T19 A80 P61.
- "No-backend" remains visually strong if literal. If the UI reads directly from Kafka/Postgres-backed artifacts and agents use MCP instead of custom APIs, the story matches Aiven's brief. T24 A82 P58.
- Confluent owns Flink/Kafka agent runtime; Aiven can own "AI agents with keys to the open-source data platform." T20 A78 P58.

## Three Aiven Demo Ideas

### 1. Agent Flight Recorder For Aiven

User says: "Spin up a live operations room for a flash-sale app and let agents coordinate the incident response."

Flow:

- Planner agent uses Aiven MCP to inspect or create Kafka topics and Postgres tables.
- Triage, analyst, and SRE agents communicate through Kafka.
- Every MCP action, Kafka publish, SQL query, and decision writes a receipt.
- UI shows live topic stream, Postgres memory, and a final incident timeline.

Why it scores: MCP depth is visible, Kafka is real agent-to-agent collaboration, Postgres is memory/audit, and the demo moment is readable in 30 seconds.

T/A/P: T20 A90 P70.

Cut: no real alerting integrations; seed the domain events and show one safe live MCP action.

### 2. Self-Building Streaming Pipeline Architect

User says: "I need a resilient real-time pipeline for support tickets: classify, route, summarize, and store decisions."

Flow:

- Architect agent designs Kafka topics, Postgres schema, and consumer groups.
- MCP executor agent creates/updates resources or verifies seeded resources.
- Worker agents classify tickets, route high-risk items, and write summaries.
- Auditor agent queries Postgres and Kafka receipts to verify end-to-end processing.

Why it scores: directly mirrors "Self-Driving Data Engineer" from the Aiven prompt, but turns it into multi-agent collaboration rather than a single chat assistant.

T/A/P: T18 A84 P66.

Cut: skip production-grade schema registry/Flink; use typed JSON envelopes and a visible validator.

### 3. Kafka Blackboard Data Detective

User says: "Watch this live event stream and explain anomalies before they become incidents."

Flow:

- Sensor/event producer emits order, latency, or game/simulation events to Kafka.
- Detector agents subscribe to different slices and publish hypotheses to `agent.hypotheses`.
- Critic/evaluator agent ranks hypotheses and asks MCP agent to run Postgres queries for evidence.
- Final recommendation and evidence trail appear as a Postgres-backed incident card.

Why it scores: blackboard collaboration is visually distinct and uses both streaming and queryable memory.

T/A/P: T28 A82 P54.

Cut: no real ML anomaly model; use seeded anomalies plus simple thresholds so the agent reasoning stays reliable.

## Recommended Build Stance

Use LangGraph or a small custom loop for the control flow only if it speeds implementation. Do not make the framework the product. The architecture should be explained as:

> Aiven MCP is the hands, Kafka is the nervous system, Postgres is the memory, and the UI is the judge-facing flight recorder.

Best expected implementation path:

1. Pre-provision or quickly create Aiven Kafka/Postgres with MCP.
2. Run 3-4 agent roles in one process for reliability.
3. Publish every handoff and receipt to Kafka.
4. Persist summarized memory/receipts/artifacts to Postgres.
5. Build one live UI that shows the stream, memory, and final decision.
6. During pitch, execute one safe live MCP action: create a topic/table, list resources, run a SQL query, or publish a Kafka message.

## Cuts

- Cut Flink unless Aiven mentor explicitly asks for it; Confluent/Flink already own that exact agent-runtime story.
- Cut Temporal/Dapr/Inngest unless the team already has working boilerplate; they solve reliability but risk hiding Aiven.
- Cut general multi-agent chat. Agents should produce visible data-plane events and receipts, not just text.
- Cut broad natural-language infra admin. Build one polished happy path.
- Cut live destructive MCP actions. Use scoped/read-only mode for exploration and one controlled write in a throwaway project.
- Cut OpenSearch unless it is confirmed available and necessary; Postgres/pgvector is enough for memory.
- Cut account/auth/settings/deployment polish unless required for submission.
- Cut "framework comparison" in the pitch. Use the research only to justify why the demo is Aiven-native.

## Final Gamma Recommendation

Build the Agent Flight Recorder variant unless sponsor feedback points harder toward DataOps. It is the cleanest bridge between prior "freedom with receipts" thinking and Aiven's rubric: agents act autonomously, but every action lands in Kafka/Postgres as inspectable proof. The differentiator is not that agents collaborate; it is that their collaboration is carried by Aiven-managed data infrastructure and controlled through Aiven MCP.
