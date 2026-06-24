# Agent Beta - MCP Ecosystem Relevant to Aiven

Date: 2026-06-24

## Hackathon Frame

Detected hackathon type: `technical-first` and `sponsor-needs`.

Judging/submission mode: Aiven/partners select finalists; finalists give a 4 minute pitch plus 1 minute Q&A. The Aiven challenge rubric is 34% depth of MCP integration, 33% workflow autonomy, and 33% creativity/impact.

Chosen target track: Aiven main challenge. The expected-value path is one Aiven-native build that can optionally be wrapped as a broader autonomous-agent demo, but not a separate Tangled or generic agent submission.

Core demo flow: show an agentic data operator acting through Aiven MCP, with visible tool calls that create/inspect Kafka/Postgres infrastructure, publish/consume Kafka events, write/query Postgres memory/artifacts, and expose an action receipt timeline that judges understand in under 3 minutes.

Intentionally cut: generic SQL chatbot, generic "provision infra from natural language" demo, broad Terraform/Pulumi clone, production auth/governance, real service deletion, OpenSearch as a core dependency until Aiven confirms tool support.

Navigator position: emerging and aligned, approaching cold. The web landscape is crowded enough to reject generic MCP CRUD; the open gap is a visibly autonomous Aiven data-plane workflow with receipts.

## Executive Read

MCP has moved from "interesting connector" to normal vendor surface. Aiven, Neon, Supabase, Confluent, Google Cloud, HashiCorp, Pulumi, AWS, MongoDB, Redis, ClickHouse, Elastic, and OpenSearch all now expose or document MCP servers around data/infrastructure workflows. This means an Aiven hackathon entry cannot win by saying "we connected an agent to Postgres/Kafka." That is table stakes.

Aiven's strongest differentiator is not just database access. It is the combined managed data-plane control surface: project/service discovery, service create/update, Kafka topic and connector operations, Kafka message produce/read, Schema Registry inspection, PostgreSQL read/write/query stats/extensions/PgBouncer/query optimization, metrics/logs/event logs, docs search, and Aiven Apps deployment through one MCP server.

The best wedge is an "autonomous data operator flight recorder": agents are free to act through Aiven MCP, but every action leaves visible receipts in Kafka, Postgres, and the Aiven control plane. This borrows the "freedom with receipts" thesis from the Tangled research but translates it to data infrastructure: judges see not only that the agent acted, but why, which MCP tool ran, what data changed, what event was published, and what rollback/fallback exists.

## Exact Matches

| Project | Type | Match to Aiven challenge | Useful facts | Implication |
| --- | --- | --- | --- | --- |
| [Aiven MCP](https://aiven.io/docs/tools/mcp-server) / [Aiven-Open/mcp-aiven](https://github.com/aiven-open/mcp-aiven) | Official Aiven MCP server | Exact | Hosted at `https://mcp.aiven.live/mcp`; OAuth 2.0 with PKCE for hosted HTTP; local `npx` mode with `AIVEN_TOKEN`; supports read-only mode, service scoping, and optional secret exposure for development only. | This must be central in the pitch and first minute. Show actual Aiven MCP tools, not a hidden wrapper API. |
| Aiven MCP core tools | Official Aiven control plane | Exact | Tool list includes project/service/cloud/VPC discovery, plan pricing, service create/update, metrics, app metrics, logs, query activity, and project event logs. | Demo should visibly call discovery, metrics/logs, and one safe write action. |
| Aiven MCP Kafka tools | Official Aiven Kafka control/data plane | Exact | Tools include topic list/create/get/update/delete, message list/produce, Kafka Connect list/create/edit/status/pause/resume/restart/delete, and Schema Registry subject/version reads. | Kafka can be the agent-to-agent event bus and the judge-visible action stream. |
| Aiven MCP PostgreSQL tools | Official Aiven Postgres data plane | Exact | Tools include available extensions, query statistics, PgBouncer create/update/delete, read-only SQL, write SQL, and AI query optimization. | Postgres should hold durable agent memory, artifacts, and action receipts; pgvector should be framed as long-term memory if enabled. |
| Aiven MCP Apps tools | Official Aiven app deployment | Exact | Tools include Dockerized application deploy/redeploy and VCS integration discovery. | Useful if a live deployment is needed, but probably not worth late-hour risk unless already smooth. |
| Aiven MCP docs search | Official Aiven docs through hosted server | Exact | `aiven_docs_search` is hosted-only. | Use it in demo only if it produces visible "agent consulted Aiven docs" credibility without slowing the flow. |

Primary Aiven source notes:

- Aiven docs state the server can create/manage Aiven services from Cursor, Claude Code, Claude Desktop, VS Code, and Gemini CLI, and can be restricted with read-only mode or tool scopes: https://aiven.io/docs/tools/mcp-server
- The Aiven GitHub tool list currently exposes scopes `all`, `core`, `pg`, `kafka`, `application`, and `integrations`; no `opensearch` scope appears in that list as of `v1.11.2` on 2026-06-24: https://github.com/aiven-open/mcp-aiven
- Aiven's MCP landing page markets PostgreSQL MCP and Kafka MCP as persistent memory and real-time reflexes: https://aiven.io/mcp

## Near-Exact Commercial Matches

| Project | Type | Why it matters | Aiven contrast |
| --- | --- | --- | --- |
| [Confluent open-source MCP server](https://docs.confluent.io/cloud/current/ai/ai-tools/open-source-mcp-server.html) / [GitHub](https://github.com/confluentinc/mcp-confluent) | Kafka/Flink/Schema Registry/Connect/Tableflow MCP | 50+ tools; read/write local server; manages Kafka topics, messages, schemas, connectors, Flink SQL, catalog, diagnostics, Tableflow. | Direct Kafka ecosystem competitor. Aiven needs Kafka plus Postgres plus infra receipts, not only Kafka admin. |
| [Confluent managed MCP servers](https://docs.confluent.io/cloud/current/ai/ai-tools/managed-mcp-server.html) | Hosted Confluent Cloud MCP | Read-only managed servers for environment/cluster discovery, connectors, metrics, topics, schemas, and sample messages. | Aiven's write-capable sandbox story can be more exciting, but Confluent has safer enterprise positioning. |
| [Confluent Real-Time Context Engine](https://docs.confluent.io/cloud/current/ai/real-time-context-engine/overview.html) | Managed Kafka-to-agent context | Exposes real-time business data from Kafka topics through an MCP server; separate from resource-management MCP. | This is closest to "Kafka as agent context." Aiven demo should make topic data actionable, not just inspectable. |
| [Google Managed Service for Apache Kafka MCP](https://docs.cloud.google.com/managed-service-for-apache-kafka/docs/use-managed-service-for-apache-kafka-mcp) | Google-hosted Kafka infra MCP | Remote MCP can create/manage Kafka clusters, topics, consumer groups, ACLs, Connect clusters, and connectors; uses OAuth/IAM and `roles/mcp.toolUser`. | Very direct managed-Kafka MCP competitor. Aiven's win must be memorable cross-service workflow and open-source data stack narrative. |
| [Neon MCP Server](https://neon.com/docs/ai/neon-mcp-server) | Serverless Postgres control-plane MCP | Natural language project/branch/database/query/migration management; hosted OAuth endpoint `https://mcp.neon.tech/mcp`; strong branch-based migration story. | Neon owns "AI creates branches and migrations." Aiven should avoid a database-migration-only demo. |
| [Supabase MCP Server](https://supabase.com/docs/guides/ai-tools/mcp) | Hosted Postgres/app-platform MCP | Tools for tables/extensions/migrations/SQL/logs/advisors/project management/edge functions/branches/storage; read-only and project-scoped URL params. | Supabase owns app-backend convenience. Aiven should emphasize enterprise data infrastructure and Kafka. |
| [Google MCP Toolbox for Databases](https://github.com/googleapis/mcp-toolbox) / [docs](https://mcp-toolbox.dev/) | Multi-database MCP framework | Supports many data sources and production patterns: custom tools, structured queries, semantic search, connection pooling, auth, OpenTelemetry. | This makes generic "DB MCP server" commoditized. Borrow its custom-tool safety pattern. |
| [OpenSearch MCP](https://opensearch.org/blog/introducing-mcp-in-opensearch/) / [GitHub](https://github.com/opensearch-project/opensearch-mcp-server-py) | Search/analytics MCP | OpenSearch 3.0 includes built-in MCP server; standalone server supports stdio, SSE, Streamable HTTP, dynamic per-call connection params, Basic/IAM/header/mTLS auth. | Relevant if Aiven OpenSearch support lands. For now treat as adjacent cache/search layer, not core. |
| [Elastic MCP/Agent Builder](https://www.elastic.co/docs/explore-analyze/ai-features) | Elasticsearch MCP | Elastic offers Agent Builder MCP endpoint for 9.2+/Serverless and a standalone Elasticsearch MCP for older clusters. | Strong search competitor; do not center Elastic/OpenSearch unless sponsor asks. |

## OSS And Database MCP Inventory

| Project | Category | Relevance | Notes |
| --- | --- | --- | --- |
| [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | Reference servers | Baseline | The official reference repo now points users to the MCP Registry for server discovery and warns reference servers are educational, not production-ready. Archived references include PostgreSQL, Redis, SQLite, GitHub, GitLab, etc. |
| [crystaldba/postgres-mcp](https://github.com/crystaldba/postgres-mcp) | Postgres specialist MCP | Adjacent | Postgres MCP Pro positions itself beyond raw SQL: development, testing, deployment, tuning, and maintenance. Good inspiration for query-health tools. |
| [pgEdge Postgres MCP](https://github.com/pgEdge/pgedge-postgres-mcp) | Postgres vendor MCP | Adjacent | Works with Postgres 14+ and pairs an MCP server with a natural-language SQL agent; pgEdge markets this as production-grade Postgres access. |
| [ClickHouse MCP](https://clickhouse.com/docs/use-cases/AI/MCP) / [GitHub](https://github.com/ClickHouse/mcp-clickhouse) | Analytics database MCP | Adjacent | ClickHouse has many official agent framework guides, making "chat with analytics DB" a known pattern. |
| [MongoDB MCP Server](https://www.mongodb.com/docs/mcp-server/get-started/) / [GitHub](https://github.com/mongodb-js/mongodb-mcp-server) | Document database MCP | Adjacent | MongoDB bundles MCP server and agent skills/plugins for Claude Code, Codex, Cursor, and Gemini. Shows plugin-plus-skills packaging trend. |
| [Redis MCP](https://redis.io/docs/latest/integrate/redis-mcp/) / [GitHub](https://github.com/redis/mcp-redis) | Cache/vector/stream MCP | Adjacent | Agents can read/write/query Redis, store sessions, streams, and vectors. Similar "agent memory" story to Postgres/pgvector, but less sponsor-aligned. |
| [OpenSearch Agent Server](https://github.com/opensearch-project/opensearch-agent-server) | Multi-agent search UI/server | Adjacent | Multi-agent orchestration server for OpenSearch Dashboards with MCP integration. Relevant for "search ops room" ideas. |
| [Apache Kafka KIP-1318](https://cwiki.apache.org/confluence/display/KAFKA/KIP-1318%3A%2BModel%2BContext%2BProtocol%2B%28MCP%29%2BServer%2Bfor%2BApache%2BKafka) | Proposed Apache Kafka MCP module | Future exact adjacency | Proposes a standalone `tools/mcp-server` exposing Kafka operations as MCP Tools and Resources, without changing Kafka protocol or brokers. If accepted, generic Kafka MCP becomes commodity. |
| [tuannvm/kafka-mcp-server](https://github.com/tuannvm/kafka-mcp-server) | Community Kafka MCP | Adjacent | Go MCP server for Kafka topic/message/consumer group/health operations. Confirms community demand for vendor-neutral Kafka MCP. |

## Agent Tool Protocols

| Protocol | What it is | Use for Aiven demo | Cut line |
| --- | --- | --- | --- |
| [MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) | Tool/data/resource protocol. Servers expose model-invoked tools, app-controlled resources, and prompts over JSON-RPC using stdio or Streamable HTTP. | Required. Aiven MCP must be the protagonist. Show tool invocations and confirmations. | Do not build a custom tool protocol. |
| MCP authorization | HTTP MCP auth uses OAuth-family standards; the spec requires PKCE in relevant flows and resource indicators for target-resource binding. | Use hosted Aiven OAuth for real demo if possible; otherwise local token with scoped sandbox. | Do not build auth UI for hackathon. |
| MCP 2026-07-28 release candidate | Upcoming stateless core, extensions, Tasks, MCP Apps, auth hardening, JSON Schema 2020-12 tools, deprecations of Roots/Sampling/Logging. | Treat as future direction only. Current clients may still run 2025-11-25 behavior. | Do not depend on RC-only features. |
| [A2A](https://a2a-protocol.org/latest/) | Agent-to-agent communication protocol for agents built by different vendors/frameworks. | Mention as ecosystem context if asked. For demo, Kafka is more sponsor-visible and simpler. | Cut A2A implementation. |
| [ACP](https://agentcommunicationprotocol.dev/introduction/welcome) | Agent Communication Protocol; IBM notes ACP is now part of A2A under Linux Foundation direction. | Context only. | Cut. |
| [AG-UI](https://docs.ag-ui.com/introduction) | Event-based agent-to-UI protocol for streaming agent state to frontends. | Optional if already using a compatible framework; useful pattern for streaming status. | Cut unless it speeds the frontend. |
| [OpenAI Apps SDK / MCP Apps](https://developers.openai.com/apps-sdk/concepts/mcp-server) | ChatGPT app surface built on MCP, adding UI metadata/widgets around MCP tools. | Future packaging idea for an Aiven control app. | Cut for live hackathon unless the product is explicitly a ChatGPT app. |

Important MCP production constraints:

- MCP tools are model-controlled and can query databases, call APIs, or perform computations. The spec recommends clear tool exposure, visual invocation indicators, confirmation prompts, and human ability to deny tool calls: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- MCP resources are application-controlled context such as files, database schemas, or app-specific information: https://modelcontextprotocol.io/specification/2025-11-25/server/resources
- Standard transports are `stdio` and Streamable HTTP; Streamable HTTP replaces older HTTP+SSE from the 2024-11-05 spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports

## Tool-Native Infra Agents

| Project | Type | Relevance to Aiven | Implication |
| --- | --- | --- | --- |
| [Terraform MCP](https://developer.hashicorp.com/terraform/mcp-server) / [GitHub](https://github.com/hashicorp/terraform-mcp-server) | IaC docs/registry MCP | Gives AI current Terraform provider docs/modules/policies; GA as of June 2026. | Terraform owns "generate correct IaC." Do not compete there. |
| [Pulumi MCP Server](https://www.pulumi.com/docs/ai/mcp-server/) | Infra cloud/resource MCP plus Pulumi Neo | Queries Pulumi Cloud stacks/resources, registry, policy violations, org access, and delegates infra tasks to Pulumi Neo. | Pulumi owns "AI infra engineer." Aiven should own "AI data operator." |
| [AWS MCP Servers](https://awslabs.github.io/mcp/) / [AWS GA blog](https://aws.amazon.com/blogs/aws/the-aws-mcp-server-is-now-generally-available/) | Cloud-provider MCP | AWS positions MCP around cloud-native development and infrastructure management; GA blog emphasizes IAM separation and CloudWatch `AWS-MCP` metrics. | Good pattern: separate human/agent permissions and expose audit metrics. |
| [Google Cloud Cloud SQL with MCP Toolbox](https://docs.cloud.google.com/sql/docs/postgres/pre-built-tools-with-mcp-toolbox) | Cloud database MCP integration | Google positions MCP Toolbox as managing auth and connection pooling so agents interact with data from IDEs. | Confirms "database MCP" is mainstream; Aiven demo needs cross-service autonomy. |
| [Pulumi Neo integrations](https://www.pulumi.com/blog/neo-integrations/) | Agent integrates external MCP servers | Pulumi connects Neo to provider-hosted remote MCP servers for Datadog, Honeycomb, PagerDuty, Supabase, etc. | Tool-native infra agents will call vendor MCPs. Aiven could become a high-value tool in someone else's agent; demo can show that future. |

## Pattern Map

### Pattern 1: Vendor-hosted remote MCP

Examples: Aiven, Neon, Supabase, Confluent managed MCP, Pulumi remote MCP, Google Managed Kafka MCP.

Typical traits: HTTP endpoint, OAuth or cloud IAM, always-current tools, easier setup, vendor controls the tool surface.

Aiven demo implication: use the hosted Aiven endpoint if possible. It proves Aiven is not just a library but a live agent-facing control plane.

### Pattern 2: Local OSS MCP with env credentials

Examples: Confluent open-source MCP, OpenSearch standalone MCP, ClickHouse MCP, Redis MCP, community Kafka servers, Postgres MCP variants.

Typical traits: `npx`, `uvx`, Docker, env vars, local process, broad user responsibility.

Aiven demo implication: avoid assembling many local MCPs. The challenge wants Aiven MCP depth. One non-Aiven local MCP at most, and only if it supports the visible story.

### Pattern 3: Raw database MCP

Examples: archived reference Postgres, Supabase database tools, Neon SQL, Google Toolbox prebuilt `execute_sql`, pgEdge, Postgres MCP Pro.

Typical traits: schema introspection, read/write SQL, migrations, query stats/optimization, sometimes semantic/vector search.

Aiven demo implication: raw SQL should be an internal step, not the product. Judges should see "agent stored memory and produced an outcome," not "agent ran SELECT."

### Pattern 4: Kafka as MCP-managed resource

Examples: Aiven Kafka tools, Confluent MCP, Google Managed Kafka MCP, KIP-1318, community Kafka MCP.

Typical traits: topic CRUD, produce/consume, consumer groups, schema registry, connectors, metrics.

Aiven demo implication: Kafka must be the visible collaboration fabric. Let each agent publish an event like `operator.plan.created`, `mcp.call.requested`, `mcp.call.completed`, `anomaly.detected`, `rollback.ready`.

### Pattern 5: Kafka as real-time context, not just admin

Examples: Confluent Real-Time Context Engine and Aiven's own MCP landing page language around live alerts.

Typical traits: topic data becomes queryable/actionable context for agents.

Aiven demo implication: create one topic whose messages visibly drive agent decisions. Do not only create topics; show an event changing the agent's next action.

### Pattern 6: MCP plus skills/plugins

Examples: Supabase Plugin for AI Coding Agents, Neon Codex/Claude plugins, MongoDB AI client bundles.

Typical traits: MCP server plus instructions/skills/prompts/hook-like packaging.

Aiven demo implication: include a repo-level MCP config and a short "Aiven operator skill" prompt file only if time permits. This improves reproducibility and makes the demo feel tool-native.

## Gaps And Wedges

| Gap | T | A | P=A-T | Why it matters | Evidence that lowers T |
| --- | ---: | ---: | ---: | --- | --- |
| Aiven official OpenSearch MCP support is unclear/possibly absent from current official tool list. | 15 | 55 | 40 | The challenge brief says OpenSearch "not 100%"; official Aiven scope/tool list shows `pg`, `kafka`, `application`, `integrations`, not `opensearch`. | Sponsor confirms tool availability or `/mcp` shows OpenSearch tools live. |
| Generic database MCP is crowded. | 10 | 70 | 60 | Neon, Supabase, Google Toolbox, MongoDB, Redis, ClickHouse, pgEdge, and Postgres MCP Pro all cover DB access. | None needed; sources are enough. |
| Generic Kafka MCP/admin is becoming crowded. | 12 | 75 | 63 | Confluent, Google Managed Kafka, community servers, and Kafka KIP-1318 cover topic/admin/message patterns. | Sponsor says they specifically want Kafka admin CRUD more than cross-service workflow. |
| MCP lacks built-in production trust/audit semantics for "agent with keys to data infra." | 25 | 85 | 60 | Specs recommend human confirmations/logging/access controls; vendors warn about destructive actions and dev/test use. | A mature Aiven audit/approval primitive exists and is easy to show. |
| Kafka as a judge-visible agent bus is underused versus hidden agent orchestration. | 25 | 88 | 63 | Most MCP examples are tool-call demos; Aiven rubric explicitly values streaming and agent collaboration. | A rival team or sponsor sample already shows a polished Kafka agent bus. |
| "Freedom with receipts" transfers cleanly from OSS agents to data-infra agents. | 28 | 90 | 62 | Agent actions on infra need reviewability; Aiven event logs + Kafka + Postgres can make this concrete. | Build spike proves receipts can be captured and shown in under 60 seconds. |
| Aiven Apps deployment through MCP could create a strong "agents deploy their own ops room" moment. | 35 | 70 | 35 | High wow if smooth, but deployment risk is high under hackathon pressure. | A single prebuilt Docker app redeploys reliably through Aiven MCP in <2 minutes. |

## Demo Implications

1. Start with Aiven MCP visible in the first minute.
   The demo should open with an agent using Aiven MCP to inspect an existing sandbox project, list services, create or verify a Kafka topic, and write/read a Postgres artifact. This directly maps to "depth of MCP integration."

2. Use one safe live write.
   Best live write candidates: create a Kafka topic with a timestamped name, produce one message, create a small Postgres table/row, or create/update a PgBouncer pool only if pre-tested. Avoid service deletion and plan scaling during judging.

3. Make Kafka more than transport.
   Kafka events should appear in the UI as the workflow heartbeat. A judge should see agents communicating through topics, not just trust that it happened.

4. Make Postgres more than storage.
   Postgres should hold structured receipts: `action_id`, `agent`, `intent`, `mcp_tool`, `input_summary`, `result_summary`, `risk`, `rollback`, `timestamp`. If pgvector is enabled, add "similar past incidents" search.

5. Treat OpenSearch as optional.
   Because official Aiven MCP OpenSearch support is not cold, use OpenSearch only as a bonus deep-search/cache module after sponsor confirmation. Do not build the core story on it.

6. Show autonomy with guardrails.
   Aiven and MCP docs both emphasize destructive risk. Make the operator autonomous on low-risk actions and approval-seeking on high-risk actions. That is more credible than "agent can delete production."

## Product Primitives Inspired By The Scan

### 1. Aiven Data Operator Flight Recorder

One sentence: autonomous data agents can act through Aiven MCP, but every action gets a durable receipt across Kafka, Postgres, and Aiven event logs.

Flow:

1. User: "Investigate checkout latency and prepare a streaming alert pipeline."
2. Planner agent lists Aiven services and identifies existing Postgres/Kafka.
3. Kafka agent creates/verifies `operator-events` topic and produces `plan.created`.
4. Postgres agent creates/writes `operator_receipts`.
5. Detective agent reads metrics/logs/query activity and writes findings.
6. Operator proposes one safe action, executes only a low-risk action, and marks risky actions as approval-required.
7. UI shows receipts and Kafka stream live.

Why it wins: directly hits all rubric items, turns invisible MCP tool calls into judge-visible infrastructure autonomy, and avoids being a generic SQL chatbot.

T/A/P: T28 A90 P62. Main uncertainty is build speed, not landscape originality.

Cuts: no real multi-tenant governance, no service deletion, no full incident platform, no OpenSearch dependency.

### 2. No-Backend Swarm Control Room

One sentence: a small interactive app where agents coordinate entirely through Aiven Kafka and persist state/memory in Aiven Postgres, with Aiven MCP as the only data-plane control surface.

Possible domain wrappers:

- Live e-commerce launch room: demand spikes trigger pricing/inventory/support agents.
- City ops simulation: sensor events trigger logistics, alerts, and response agents.
- Game/simulation: agent factions publish moves/events and store strategy memory.

Why it wins: more creative than DevOps-only and easy for non-specialist judges to understand.

T/A/P: T35 A86 P51. Higher creativity, but riskier to make the simulation feel useful rather than toy-like.

Cuts: no broad game mechanics, no full backend API, no account system, no complex multi-agent framework.

### 3. Self-Driving Pipeline Doctor

One sentence: an agent detects a stream/data anomaly, uses Aiven MCP to inspect Kafka/Postgres metrics/logs/query stats, and proposes or executes safe remediation.

Flow:

1. Seed Kafka lag/error/spike event.
2. Detective consumes/reads event and queries Postgres/Kafka status through MCP.
3. Agent writes root-cause report into Postgres and publishes remediation event.
4. Agent executes one safe action: produce alert, create topic, pause/resume connector in sandbox, or optimize query suggestion.

Why it wins: closest to Aiven's suggested "Intelligent Data Detective" and "Self-Driving Data Engineer."

T/A/P: T22 A78 P56. Lower originality, but technically credible and buildable.

Cuts: real autoscaling unless pre-tested; actual connector chaos; broad observability stack.

## Recommended Direction

Build "Aiven Data Operator Flight Recorder" as the trunk, with the Pipeline Doctor as the scenario and the No-Backend Swarm as the framing.

Positioning:

> Aiven MCP gives agents the keys to data infrastructure. We give judges the receipts: every autonomous decision, Kafka event, SQL write, and Aiven control-plane action is visible, reviewable, and replayable.

This reframes the crowded MCP ecosystem around Aiven's scoring:

- Depth of MCP integration: actual Aiven MCP tools across core, Kafka, Postgres, metrics/logs, and possibly Apps.
- Workflow autonomy: agents plan, coordinate through Kafka, remember in Postgres, investigate, and execute safe actions.
- Creativity/impact: "agent with keys to production data infra" becomes safe and legible through receipts.

## Cuts

- Cut a generic "ask questions of Postgres" UI. Neon, Supabase, Google Toolbox, pgEdge, and others already own that.
- Cut generic Kafka admin chatbot. Confluent and Google Managed Kafka are already there.
- Cut Terraform/Pulumi-style cloud infrastructure generation. Terraform MCP and Pulumi Neo already own IaC/infra-agent mindshare.
- Cut live service deletion, plan scaling, and production credentials. Aiven docs explicitly warn about destructive operations and credential exposure.
- Cut OpenSearch as a core path unless sponsor confirms official Aiven MCP support during the hackathon.
- Cut A2A/ACP implementation. Kafka is the sponsor-aligned agent bus.
- Cut MCP Apps/OpenAI Apps SDK unless the team is already building inside ChatGPT. It is packaging, not core scoring.
- Cut broad connector catalog work. One connector/topic/message path is enough for judging.
- Cut multi-track dilution unless the same receipt/control-room demo can be legally wrapped for another side prize without weakening Aiven.

## Source Index

Primary docs and repos:

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Aiven MCP landing page: https://aiven.io/mcp
- MCP tools spec: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- MCP resources spec: https://modelcontextprotocol.io/specification/2025-11-25/server/resources
- MCP transports spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- MCP authorization spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- MCP 2026-07-28 release candidate: https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/
- Model Context Protocol reference servers: https://github.com/modelcontextprotocol/servers
- Confluent open-source MCP server docs: https://docs.confluent.io/cloud/current/ai/ai-tools/open-source-mcp-server.html
- Confluent MCP GitHub: https://github.com/confluentinc/mcp-confluent
- Confluent managed MCP servers: https://docs.confluent.io/cloud/current/ai/ai-tools/managed-mcp-server.html
- Confluent Real-Time Context Engine: https://docs.confluent.io/cloud/current/ai/real-time-context-engine/overview.html
- Google Managed Service for Apache Kafka MCP: https://docs.cloud.google.com/managed-service-for-apache-kafka/docs/use-managed-service-for-apache-kafka-mcp
- Apache Kafka KIP-1318: https://cwiki.apache.org/confluence/display/KAFKA/KIP-1318%3A%2BModel%2BContext%2BProtocol%2B%28MCP%29%2BServer%2Bfor%2BApache%2BKafka
- Neon MCP Server: https://neon.com/docs/ai/neon-mcp-server
- Supabase MCP Server: https://supabase.com/docs/guides/ai-tools/mcp
- Supabase Plugin for AI Coding Agents: https://supabase.com/docs/guides/ai-tools/plugins
- MCP Toolbox for Databases docs: https://mcp-toolbox.dev/
- MCP Toolbox for Databases GitHub: https://github.com/googleapis/mcp-toolbox
- Google Cloud SQL with MCP Toolbox: https://docs.cloud.google.com/sql/docs/postgres/pre-built-tools-with-mcp-toolbox
- OpenSearch MCP blog: https://opensearch.org/blog/introducing-mcp-in-opensearch/
- OpenSearch MCP Server GitHub: https://github.com/opensearch-project/opensearch-mcp-server-py
- AWS OpenSearch MCP docs: https://docs.aws.amazon.com/opensearch-service/latest/developerguide/opensearch-mcp-server.html
- Elastic AI/MCP docs: https://www.elastic.co/docs/explore-analyze/ai-features
- ClickHouse MCP docs: https://clickhouse.com/docs/use-cases/AI/MCP
- MongoDB MCP docs: https://www.mongodb.com/docs/mcp-server/get-started/
- Redis MCP docs: https://redis.io/docs/latest/integrate/redis-mcp/
- Terraform MCP docs: https://developer.hashicorp.com/terraform/mcp-server
- Pulumi MCP docs: https://www.pulumi.com/docs/ai/mcp-server/
- AWS MCP Servers docs: https://awslabs.github.io/mcp/
- AWS MCP GA blog: https://aws.amazon.com/blogs/aws/the-aws-mcp-server-is-now-generally-available/
- A2A protocol docs: https://a2a-protocol.org/latest/
- ACP docs: https://agentcommunicationprotocol.dev/introduction/welcome
- IBM ACP project note: https://research.ibm.com/projects/agent-communication-protocol
- AG-UI docs: https://docs.ag-ui.com/introduction
- OpenAI Apps SDK MCP docs: https://developers.openai.com/apps-sdk/concepts/mcp-server
