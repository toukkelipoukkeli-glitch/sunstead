# Agent Delta: No-Backend App Swarms and Agent-Native State

Date: 2026-06-24

Navigator state: emerging and aligned - enough landscape signal to ground a demo wedge, but not enough to claim the category is mature.

## Hackathon Classification

- Primary scoring mode: technical-first with product-visible judging. Aiven scores depth of MCP integration, workflow autonomy, and creativity/impact almost evenly.
- Challenge type: sponsor-needs. The winning framing should sound like Aiven's own thesis: agents natively control, stream, and query open-source data infrastructure.
- Judging/submission mode: Aiven partner selection into finalists, then 4 minute live pitch and 1 minute Q&A.
- Target track: Aiven main challenge. Optional wrapper: ElevenLabs only if voice makes the operator/swarm easier to understand, not as a second build.
- Core demo flow: user asks for an app/workflow, agents use Aiven MCP to create or configure PostgreSQL and Kafka, then the agents run the workflow by writing their own DB rows and Kafka events. The UI shows the swarm, the data plane, and MCP receipts in the first minute.
- Intentionally cut: production auth, broad SaaS integrations, live scaling/deletion in the pitch path, custom workflow engine internals, generic chat UI, and any feature that hides Aiven behind normal backend code.

## Bottom Line

There is no single obvious "Aiven no-backend app swarm" incumbent. The market has adjacent pieces:

- Cloudflare Agents is the closest agent-native runtime: durable agent identity, per-agent SQL state, schedules, WebSockets, and recovery.
- DBOS is the cleanest conceptual proof that Postgres itself can be the workflow orchestrator.
- Convex, LangGraph, Mastra, Inngest, Hatchet, and Trigger.dev prove developers want durable agent/workflow state, but they mostly hide the data plane.
- Confluent is loudly pushing Kafka as the event bus for multi-agent systems.
- Neon and Supabase MCP prove "AI tool directly manages database/project/schema/query state" is now a live product category.

Gap: nobody has a memorable demo where agents directly own both database state and queue/event state on open-source infrastructure, provisioned and operated through MCP, with visible receipts. That is the Aiven wedge.

Load-bearing claim: "The no-backend swarm should be framed as agents being the backend, with Aiven as their operating system." T22 A86 P64. Evidence lowering T: A working demo where the UI has no domain backend API beyond a thin agent runner, while Postgres tables and Kafka topics visibly carry all product state.

## Definition For This Mission

"No-backend app swarm" means:

- The frontend or presenter sends intents to a thin agent runner.
- Agents do not call a traditional domain backend API for app logic.
- Agents use MCP/tool calls to create schema, query/write state, create topics, publish work, consume events, and audit progress.
- PostgreSQL is the durable memory/artifact/task store.
- Kafka is the work queue, handoff rail, event log, and live coordination surface.
- The app's "backend" is mostly data infrastructure plus agent policies.

"Agent-native app" means the primary persistent objects are agents, tasks, memories, events, approvals, and artifacts, not CRUD resources owned by a conventional service layer.

## Closest Matches

| Project / company | What it proves | Fit to Aiven no-backend swarm | Gap / distance | T/A/P |
|---|---|---|---|---|
| Aiven MCP | Agents can create/manage Aiven services and use PostgreSQL/Kafka from Cursor, Claude Code, VS Code, etc. It exposes infra control, SQL, Kafka, logs, metrics, and app deploy paths. Source: https://aiven.io/docs/tools/mcp-server and https://github.com/aiven-open/mcp-aiven | Exact sponsor primitive. It is the only scanned source combining MCP, Postgres, Kafka, and infra management under the challenge brand. | Needs an app pattern that makes these tool calls visible and useful, not just an IDE/database demo. | T8 A95 P87 |
| Cloudflare Agents SDK | Stateful AI agents can have durable identity, local SQL storage, real-time connections, scheduled work, and recoverable execution. Source: https://developers.cloudflare.com/agents/ and https://github.com/cloudflare/agents | Closest product analogue to "agent as backend." Great proof that the category is real. | Proprietary runtime, embedded SQL, no Kafka, no Aiven MCP, no open-source data infra control. | T9 A76 P67 |
| DBOS / Pydantic AI + DBOS | Postgres can be the durable workflow substrate: workers coordinate through Postgres tables, checkpoint steps, recover after crashes, and query observability in SQL. Sources: https://www.dbos.dev/blog/postgres-is-all-you-need-for-durable-execution and https://pydantic.dev/articles/pydantic-ai-dbos | Strong bridge from "backend service" to "database-owned workflow state." Useful for explaining why Postgres can hold agent execution state. | Still code-first durable execution, not a visual app swarm and not MCP-controlled infra. | T10 A68 P58 |
| Confluent event-driven agents | Kafka/Flink can orchestrate multi-agent systems, with Kafka acting as short-term shared memory and event-driven coordination. Sources: https://www.confluent.io/blog/multi-agent-orchestrator-using-flink-and-kafka/ and https://www.confluent.io/blog/the-future-of-ai-agents-is-event-driven/ | Directly validates Kafka as the swarm bus and enterprise story. | More architecture article than hackathon app. Often adds Flink/orchestrator complexity that may distract from Aiven MCP. | T13 A66 P53 |
| LangGraph persistence | Agent graph state can be checkpointed, resumed, inspected, and stored in Postgres; long-term stores hold cross-thread memory. Source: https://docs.langchain.com/oss/python/langgraph/persistence | Good OSS pattern for reliable multi-agent workflow state with PostgresSaver. | Application code still owns orchestration. It does not show agents provisioning the data plane. | T11 A58 P47 |
| Convex Agent / Workflow components | Agent threads, message history, vector search, reactive UI, and durable workflows can be bundled as app primitives. Sources: https://www.convex.dev/components/agent and https://www.convex.dev/components/workflow | Best "smooth no-backend agent app" UX reference. The UI can subscribe to agent progress naturally. | Convex is the backend platform; state is not Aiven Postgres/Kafka and not MCP-managed. | T12 A55 P43 |
| Neon MCP | AI agents can manage Postgres projects, branches, schemas, SQL, migrations, query tuning, and Data API/Auth provisioning through MCP. Source: https://neon.com/docs/ai/neon-mcp-server | Closest database-MCP competitor and a useful contrast. It proves DB control via MCP is becoming expected. | Postgres-only; no Kafka swarm bus. Neon explicitly warns against production MCP DB access. | T9 A62 P53 |
| Supabase MCP | AI tools can create projects, design tables, apply migrations, run SQL, deploy edge functions, and read logs through MCP. Sources: https://supabase.com/docs/guides/ai-tools/mcp and https://supabase.com/features/mcp-server | Strong proof of "AI-native backend management" and likely judge mental model. | Supabase stays app-backend oriented. No native Kafka event bus. | T10 A56 P46 |
| AI Town / Generative Agents | Multi-agent simulations with memory streams are visually memorable; AI Town made a deployable app where characters live/chat/socialize. Sources: https://arxiv.org/abs/2304.03442 and https://github.com/a16z-infra/ai-town | Best visual demo archetype for an agent swarm that owns memory. | Old pattern and not infra-native. Needs Aiven receipts to avoid looking like another AI-town clone. | T14 A60 P46 |
| Relevance AI, Lindy, Zapier Agents, Gumloop | Commercial demand exists for AI workforces, agent teams, memory, workflows, and integrations. Sources: https://relevanceai.com/docs/get-started/introduction, https://docs.lindy.ai/fundamentals/lindy-101/introduction, https://zapier.com/agents, https://docs.gumloop.com/getting-started/introduction | Validates buyer language: "AI teammates," "workflows," "workforces," "agents while you sleep." | Their state and queues are hidden SaaS internals. Weak for Aiven unless used only for market contrast. | T18 A48 P30 |

## Adjacent Patterns

1. MCP as the backend console.
   Aiven, Neon, and Supabase are turning database/project/schema operations into tool calls. This is crowded for "chat with my database," but underused for "agents create and run the app's data plane."

2. Database as workflow engine.
   DBOS and Hatchet show that queues, checkpoints, retries, and observability can live in Postgres-backed systems. For Aiven, this supports a simple demo claim: Postgres is not only memory, it is the swarm's durable work ledger.

3. Kafka as agent communication substrate.
   Confluent's agent writing makes the strongest case that multi-agent systems need event-driven coordination rather than synchronous request/response. For the demo, Kafka topics should be first-class UI objects: inboxes, task requests, completions, approvals, dead letters.

4. Durable agent identity.
   Cloudflare Agents and Durable Objects show the cleanest "agent is a stateful actor" model. Aiven cannot copy the edge runtime, but can copy the mental model: each agent has a row, mailbox topic, memory table, and tool receipt log.

5. Reactive no-backend apps.
   InstantDB, PowerSync, ElectricSQL, Convex, and Supabase show that developers like frontend-to-database/reactive-state apps with minimal bespoke backend code. Sources: https://www.instantdb.com/, https://powersync.com/, https://electric-sql.com/ or https://electric.ax/. This is adjacent because it minimizes backend code, but it is not agent-owned state by itself.

6. Agent memory layers.
   LangGraph, Mastra, Convex, Mem0/Zep-style memory systems make persistence a first-class agent concern. For Aiven, pgvector plus normal SQL can be enough; adding a separate memory product would dilute the sponsor story.

## What Is Crowded Or Already Solved

- Generic "chat with Postgres" and "natural-language SQL" are crowded. Do not build only a DB chatbot.
- IDE-side MCP database management is becoming table stakes across Aiven, Neon, and Supabase. A demo that just creates a table through MCP will not feel original.
- Workflow automation SaaS already owns "AI teammate does tasks across apps." Competing head-on with Zapier/Lindy/Relevance/Gumloop is a bad hackathon wedge.
- Durable execution platforms already own retries, step state, and long-running jobs. Building a workflow engine is a time sink.
- AI Town style simulations are memorable but familiar. Use the visible swarm aesthetic, not the exact "NPC town" premise unless Aiven data receipts are central.

## Gaps And Wedges

| Gap | Why it matters | T/A/P |
|---|---|---|
| Visible agent-owned data plane | Most agent frameworks hide queues, memory, retries, and tool calls. Aiven can make them visible as Postgres tables, Kafka topics, and MCP receipts. | T18 A88 P70 |
| Kafka-native agent handoffs | Agent handoffs are usually chat messages or framework internals. Kafka-backed handoffs make autonomy observable, replayable, and sponsor-native. | T20 A82 P62 |
| No-backend story without cheating | "No backend" can sound fake because some runner must call the LLM and MCP. The defensible claim is "no domain backend": app state and coordination are owned by agents through Aiven data infra. | T16 A72 P56 |
| Agent safety/audit log | Direct DB/queue control is scary. A visible audit table with proposed action, MCP call, result, rollback/fallback, and human approval is a strong trust wedge. | T14 A76 P62 |
| App swarm that provisions itself | Existing agent apps usually assume infra exists. Aiven MCP can show a planner creating the backing Postgres schema and Kafka topics in response to the app's goal. | T24 A90 P66 |
| Frontend that reads the swarm's state directly | A thin UI over Postgres/Kafka mirrors the "no-backend" thesis. The UI should feel like a control room, not a chat transcript. | T22 A78 P56 |

## Recommended Architecture Primitive

Build a "swarm state kernel" rather than a full platform.

- Postgres tables: `agents`, `tasks`, `task_events`, `memories`, `artifacts`, `approvals`, `mcp_receipts`, `topic_registry`, `demo_timeline`.
- Kafka topics: `swarm.commands`, `tasks.created`, `agent.<role>.inbox`, `agent.completed`, `artifacts.ready`, `human.approvals`, `swarm.dead_letters`.
- Agents:
  - Planner: turns user goal into schema/topics/work plan.
  - Infra operator: uses Aiven MCP to create/configure services, tables, and topics.
  - Dispatcher: writes tasks and emits Kafka events.
  - Specialist agents: consume role-specific events, query/write Postgres, produce artifacts.
  - Auditor: queries Postgres/Kafka state, explains what happened, flags unsafe operations.
- UI: timeline of MCP receipts, live topic/message board, task board from Postgres, agent memory/artifact inspector.

This is enough to demo "agents directly own database/queue/workflow state" without building a general-purpose orchestration product.

## Three Demo Ideas

### 1. Backendless SwarmDesk

One-liner: "Describe an operations desk, and a swarm creates its own Postgres/Kafka backend, then runs the desk by passing work through Kafka."

Flow:

1. Presenter says: "Launch a support triage desk for an outdoor gear shop during a storm."
2. Planner designs tables and topics.
3. Infra operator uses Aiven MCP to provision or verify Postgres/Kafka, create tables, and create topics.
4. Simulated customer events enter Kafka.
5. Triage, policy, inventory, and response agents consume tasks, write artifacts/memories to Postgres, and emit completions.
6. UI shows the desk updating from Postgres state and Kafka events, plus an MCP receipt strip.

Why it can win: visible app, visible autonomy, visible Aiven. It is useful enough to explain in 20 seconds and weird enough to be memorable.

Risk: looks like a normal support automation app if the UI hides topics/tables/tool calls. Mitigation: make the data plane the hero.

T/A/P: T24 A90 P66.

### 2. SwarmLab: AI Town For Data Infrastructure

One-liner: "An AI town where every character has a Kafka mailbox and Postgres memory, and the mayor agent can redesign the town's data infrastructure through MCP."

Flow:

1. User creates a shared objective: "Plan a launch party with budget, suppliers, and safety constraints."
2. Agents negotiate through Kafka topics, each with its own mailbox and memory row/table.
3. Postgres stores episodic memory, reflections, commitments, and artifacts.
4. The mayor/infrastructure agent adds a new topic/table when coordination breaks down.
5. UI lets judges click an agent to see memory, mailbox, current task, and MCP-created objects.

Why it can win: AI Town is a proven visual metaphor, but Aiven receipts make it a data-infra story instead of a toy.

Risk: too playful for sponsor-needs. Mitigation: frame as a "digital operations twin" rather than a game.

T/A/P: T30 A84 P54.

### 3. Zero-Backend Live Launch Room

One-liner: "A launch team of agents watches live product events, creates its own workflow state, and coordinates fixes through Kafka without a conventional backend."

Flow:

1. Seed Kafka with live-ish ecommerce/product events.
2. Monitor agent detects anomalies and writes observations to Postgres.
3. Analyst, comms, and infra agents split work via Kafka.
4. Infra operator creates a new table/topic or index via Aiven MCP when the team needs a new state shape.
5. Auditor produces a final incident timeline by querying Postgres and Kafka receipts.

Why it can win: overlaps with Data Detective and DevOps Operator while keeping Delta's no-backend app thesis.

Risk: anomaly monitoring is a crowded Aiven direction. Mitigation: emphasize the self-created app/workflow state, not the anomaly model.

T/A/P: T26 A78 P52.

## Best Expected Value

Pick Demo 1 unless sponsor feedback strongly prefers simulation/creative demos.

Reason: SwarmDesk is business-legible, product-visible, and still technically sponsor-native. It can enter the pitch as "we did not build a backend for this app; the agents created and operated their own Aiven data layer."

Backup: Demo 2 is more memorable for an expo table. Demo 3 is safer if Aiven mentors push toward ops/analytics.

## Cuts

- Cut production auth. Use a single seeded workspace and call out that Aiven permissions/read-only modes are the production path.
- Cut real external integrations. Simulate customers, tickets, inventory, and metrics through Kafka seed events.
- Cut custom workflow engine retries. Use simple task status rows plus Kafka dead-letter topic; do not rebuild Temporal/DBOS.
- Cut OpenSearch unless mentor confirms it is available and valuable. PostgreSQL plus pgvector is enough.
- Cut live destructive operations. Provision once, then replay MCP receipts if wifi or credits fail.
- Cut broad agent marketplace. Four named agents are enough.
- Cut complex autonomous learning. Memories and reflections in Postgres are enough to show persistence.
- Cut "agent writes arbitrary SQL in production" framing. Use scoped tables, approval rows, and audit receipts.

## Sponsor-Framing Notes

- Say "no domain backend," not "no backend at all." The runner still hosts agents and model calls, but Aiven owns application state, queues, memory, and workflow records.
- Make Aiven MCP visible in the first minute: service list, table creation, topic creation, SQL write/read, Kafka produce/consume, logs/metrics if stable.
- Show a before/after: without MCP, a developer would scaffold APIs, migrations, queue workers, and admin tools; with Aiven MCP, agents create and operate the data layer directly.
- Keep the UI operational and dense: task board, topic board, memory inspector, receipt timeline. Avoid a marketing landing page.
- Treat safety as a feature: every autonomous data-plane action gets an audit row and optional human approval.

## Source Index

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Aiven MCP announcement: https://aiven.io/blog/aiven-mcp
- Model Context Protocol intro: https://modelcontextprotocol.io/docs/getting-started/intro
- MCP tools spec: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- Cloudflare Agents docs: https://developers.cloudflare.com/agents/
- Cloudflare Agents GitHub: https://github.com/cloudflare/agents
- Cloudflare agent state docs: https://developers.cloudflare.com/agents/runtime/lifecycle/state/
- Cloudflare Workflows with agents: https://developers.cloudflare.com/agents/concepts/workflows/
- DBOS Postgres durable workflows: https://www.dbos.dev/blog/postgres-is-all-you-need-for-durable-execution
- Pydantic AI + DBOS: https://pydantic.dev/articles/pydantic-ai-dbos
- LangGraph persistence: https://docs.langchain.com/oss/python/langgraph/persistence
- LangGraph memory/PostgresSaver: https://docs.langchain.com/oss/python/langgraph/add-memory
- Confluent Kafka/Flink multi-agent orchestrator: https://www.confluent.io/blog/multi-agent-orchestrator-using-flink-and-kafka/
- Confluent event-driven agents: https://www.confluent.io/blog/the-future-of-ai-agents-is-event-driven/
- AutoGen Core event-driven agents: https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/index.html
- Microsoft Agent Framework overview: https://learn.microsoft.com/en-us/agent-framework/overview/
- Convex Agent component: https://www.convex.dev/components/agent
- Convex Workflow component: https://www.convex.dev/components/workflow
- Convex Durable Agents component: https://www.convex.dev/components/durable-agents
- Mastra memory: https://mastra.ai/docs/memory/overview
- Inngest durable execution: https://www.inngest.com/
- Hatchet GitHub: https://github.com/hatchet-dev/hatchet
- Trigger.dev: https://trigger.dev/
- Neon MCP docs: https://neon.com/docs/ai/neon-mcp-server
- Neon MCP GitHub: https://github.com/neondatabase/mcp-server-neon
- Supabase MCP docs: https://supabase.com/docs/guides/ai-tools/mcp
- Supabase MCP feature page: https://supabase.com/features/mcp-server
- Generative Agents paper: https://arxiv.org/abs/2304.03442
- AI Town: https://github.com/a16z-infra/ai-town
- Relevance AI docs: https://relevanceai.com/docs/get-started/introduction
- Lindy docs: https://docs.lindy.ai/fundamentals/lindy-101/introduction
- Zapier Agents: https://zapier.com/agents
- Gumloop docs: https://docs.gumloop.com/getting-started/introduction
- InstantDB: https://www.instantdb.com/
- PowerSync: https://powersync.com/
- ElectricSQL / Electric: https://electric-sql.com/ and https://electric.ax/
