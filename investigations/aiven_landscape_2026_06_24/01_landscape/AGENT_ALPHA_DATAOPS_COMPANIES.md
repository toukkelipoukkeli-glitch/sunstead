# Agent Alpha: DataOps Companies Landscape

> Date: 2026-06-24  
> Mission: Aiven Autonomous Data Operator landscape  
> Position: emerging and aligned; enough market signal to ground hackathon cuts.

## Hackathon Frame

Detected type: `technical-first` sponsor challenge with an `open-ended creative` wrapper. Aiven is not asking for a fixed business problem; it is asking for the most compelling proof that agents can natively control, stream, and query open-source data infrastructure through Aiven MCP.

Judging mode: partner-selected finalists, then 4 minute pitch plus 1 minute Q&A. The demo needs one visible first-minute action: an agent provisions/configures/queries Aiven infrastructure, Kafka carries agent events, and Postgres stores/queryable memory or receipts.

Target track: Aiven main challenge. Optional side-wrapper only if legal and low-cost: Anthropic/Claude as the agent interface, or ElevenLabs voice for the presenter flow. Do not let side tracks change the core build.

Unknowns to flag before large implementation: who is presenting, whether multi-track submission is legal, and whether Aiven mentors prefer no-backend app swarms, data engineer operators, or data detective demos.

## Executive Read

The market is crowded around text-to-SQL, AI analysts, BI copilots, and data quality observability. It is newly crowded around "agentic data engineering" for Snowflake/Databricks/Fabric stacks. It is much less crowded around a small, visible, open-source-data-infra control plane where multiple agents use MCP to create and operate Postgres plus Kafka and leave auditable action receipts.

Best Aiven wedge: **Autonomous data operator with receipts.** The project should not be another chat-with-your-database product. It should show agents taking controlled infrastructure actions, publishing each decision to Kafka, storing a flight recorder in Postgres/pgvector, and exposing rollback/approval boundaries.

Strongest demo shape: "User asks for a resilient live event pipeline. Planner agent creates Aiven Postgres/Kafka resources or uses seeded ones, worker agents configure topics/tables, detective agent notices a spike or lag, operator agent applies a safe change, and every action is visible as an audit receipt."

## Load-Bearing Claims

| Claim | Evidence | T | A | P=A-T | Implication |
| --- | --- | ---: | ---: | ---: | --- |
| Natural-language database access is crowded. | Vanna, Wren AI, Outerbase, ThoughtSpot, Databricks Genie, Snowflake Cortex Analyst, BigQuery data agents, Fabric SQL Copilot. | 10 | 55 | 45 | Do not make generic text-to-SQL the core. |
| Agentic data engineering is an active category, not just hype. | Upriver, Ardent AI, Definity, Matillion Maia, Acceldata ADE, Qlik agentic data engineering, DataOps.live Metis. | 15 | 75 | 60 | Judges may recognize the category; we need a sharper Aiven-native expression. |
| MCP-based database/platform control is becoming table stakes. | Aiven, Neon, Supabase, MongoDB, Microsoft Fabric/Data Factory, pgEdge, ClickHouse, InfluxDB all expose or discuss MCP-style access. | 15 | 70 | 55 | Aiven MCP depth must go beyond "I connected Claude to SQL." |
| Kafka as the visible multi-agent event bus is less crowded than SQL chat. | Data products mention agents, but most hide orchestration inside their SaaS; Aiven explicitly names Kafka pub/sub for agent collaboration. | 30 | 90 | 60 | Use Kafka on-screen as the coordination primitive. |
| Auditable receipts for agent infrastructure actions are a real gap. | Safety warnings appear in MCP docs; observability products explain incidents, but few demo natural-language infra changes with before/after/rollback receipts. | 25 | 85 | 60 | Build the "flight recorder" surface. |

## Closest Exact Matches

These are closest to the Aiven challenge because they let AI agents or assistants query, manage, or operate data infrastructure, not merely summarize data.

| Company/Product | URL | Why it is close | Difference from Aiven wedge |
| --- | --- | --- | --- |
| Aiven MCP Server | https://aiven.io/docs/tools/mcp-server, https://github.com/aiven-open/mcp-aiven, https://aiven.io/mcp | The sponsor baseline: create/manage Aiven services from AI assistants, including PostgreSQL, Kafka, service plans, metrics, logs, and config. | This is the platform to showcase, not compete with. Need demo flow that makes these tools visible. |
| Neon MCP / Codex plugin | https://neon.com/docs/ai/ai-codex-plugin, https://neon.com/blog/bringing-mcp-to-the-cloud | Natural-language creation and management of Postgres projects, databases, branches, SQL, and autoscaling. Databricks also framed Neon as a database foundation for AI agents: https://www.databricks.com/blog/databricks-neon | Very close for Postgres control, but not Kafka/multi-service open-source data infrastructure. |
| Supabase MCP Server + AI Assistant | https://supabase.com/features/mcp-server, https://supabase.com/features/ai-assistant | Natural-language project/table/query/config management for Supabase/Postgres through MCP and dashboard AI. | Strong no-backend app competitor; Aiven can differentiate on Kafka streaming and infra ops, not just app DB scaffolding. |
| MongoDB MCP Server | https://www.mongodb.com/products/tools/mcp-server, https://www.mongodb.com/docs/mcp-server/overview/ | Natural-language data/deployment interaction, schema exploration, query generation, index/performance advisor access. | Document DB ecosystem; less aligned with Aiven's open-source Postgres/Kafka challenge story. |
| Microsoft Fabric/Data Factory MCP | https://github.com/microsoft/DataFactory.MCP, https://github.com/microsoft/fabric-rti-mcp, https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new | Fabric/Data Factory MCP can expose Fabric resources and preview natural-language creation/testing/deployment of Dataflow Gen2; Fabric RTI MCP handles natural-language KQL/Eventstream access. | Enterprise platform, less hackathon-visible. Good evidence that "data infra via MCP" is a real category. |
| pgEdge Postgres MCP | https://www.pgedge.com/blog/introducing-the-pgedge-postgres-mcp-server, https://github.com/pgEdge/pgedge-postgres-mcp | Postgres MCP server for standard Postgres, including natural-language SQL support. | Query/control for Postgres only. Aiven can show managed services plus Kafka. |
| ClickHouse MCP / AgentHouse | https://github.com/clickhouse/mcp-clickhouse, https://clickhouse.com/blog/agenthouse-demo-clickhouse-llm-mcp | Natural-language analytics through MCP over fast analytical data; read-only by default, write access optional. | Great analytics precedent, but not full autonomous DataOps provisioning. |
| InfluxDB 3 MCP Server | https://www.influxdata.com/blog/influxdb-mcp-server/ | Natural-language time-series querying and management tasks through MCP. | Time-series-specific; useful adjacent pattern for metrics/log demos. |
| Oracle Autonomous AI Database | https://www.oracle.com/autonomous-database/, https://www.oracle.com/autonomous-database/what-is-autonomous-database/ | Long-running "self-driving/self-managing database" incumbent with built-in AI/vector/natural-language query features. | Not open-source, not MCP-native, and not a multi-agent event-stream control demo. |

## Agentic DataOps And Data Engineering

These companies are closest to the phrase "autonomous data operator" at the workflow level. Most operate inside existing enterprise stacks rather than provisioning OSS data infra through MCP.

| Company/Product | URL | What they do | Aiven implication |
| --- | --- | --- | --- |
| Upriver | https://upriverdata.com/ | AI data engineering platform whose agent connects to warehouse, orchestrator, and code to execute data engineering work end-to-end across Snowflake, Databricks, BigQuery, Airflow, dbt, etc. Funding/news: https://www.businessinsider.com/israel-startup-upriver-raises-14-million-ai-data-engineering-2026-6 | Very close category signal. Avoid "AI data engineer" pitch unless the demo is visibly Aiven-specific. |
| Ardent AI | https://tryardent.com/, https://www.globenewswire.com/news-release/2025/09/25/3156336/0/en/ardent-ai-raises-2-15m-to-build-the-first-ai-data-engineer.html | Markets an AI Data Engineer that creates, manages, and repairs data pipelines; current site emphasizes safe database branching for coding agents. | "AI data engineer" is claimed territory. Aiven project should be narrower and more concrete: autonomous Kafka/Postgres operator with receipts. |
| Definity | https://www.definity.ai/, https://www.definity.ai/blog/agentic-data-engineering-12m-series-a | Agentic data engineering for lakehouse/Spark, runtime intelligence, optimization, reliability, and real-time action across pipelines. | Strong adjacent. Shows "actual operation, not dashboards" is the right language. |
| Matillion Maia | https://www.matillion.com/blog/maia-agentic-ai-modern-data-stack, https://www.matillion.com/blog/operationalizing-agentic-data-engineers | Multi-agent data engineers for building, maintaining, optimizing, and scaling data pipelines inside Matillion's platform. | Do not build a full pipeline IDE. Show one crisp autonomous pipeline lifecycle. |
| DataOps.live Metis | https://www.dataops.live/dataops-ai-agent, https://www.dataops.live/blog/cortex-code-coco-dataops-automation | DataOps AI agent for governed Snowflake data products; pairs with Snowflake Cortex Code. | Governance and productionization are important, but too invisible for first-minute hackathon value unless turned into receipts. |
| Acceldata Agentic Data Engineering | https://www.acceldata.io/platform/agentic-data-engineering, https://www.acceldata.io/ | Natural language to production Spark/CDC/streaming code; intelligent agents build, orchestrate, run, and maintain pipelines. | Very close on "describe a pipeline in plain English." Aiven demo should execute infra actions and stream agent events, not just generate code. |
| Qlik Agentic Data Engineering | https://www.qlik.com/us/agentic-ai, https://www.qlik.com/blog/redefining-data-engineering-for-the-agentic-era | Agentic experience across analytics/data engineering, declarative pipelines, real-time routing, and autonomous operations. | Evidence that intent-driven pipelines are crowded in enterprise suites. |
| DataBahn Cruz | https://www.databahn.ai/, https://www.databahn.ai/press-releases/databahn-launches-cruz-data-engineer-in-a-box | Agentic AI for data pipeline management, especially security/observability/telemetry data. | Avoid SIEM/telemetry scope; borrow "data engineer in a box" only if paired with visible Aiven control. |

## Analytics And Database Copilots

This is the most crowded lane. These tools are useful inspiration for UX, but weak as the core Aiven submission because they mostly answer questions rather than operate infrastructure.

| Company/Product | URL | Match level | Notes |
| --- | --- | --- | --- |
| Vanna AI | https://vanna.ai/, https://github.com/vanna-ai/vanna | Adjacent | Natural language to SQL and answers; open-source/hosted. Good for SQL UX, too generic for Aiven. |
| Wren AI | https://getwren.ai/, https://getwren.ai/oss | Adjacent | Open-source GenBI for humans and agents across many sources; governed text-to-SQL, charts, dashboards. Crowded BI area. |
| Outerbase | https://outerbase.com/ | Adjacent | AI-powered database interface, EZQL, dashboards, catalog, broad DB support. Good UI reference, not autonomous infra. |
| MindsDB | https://mindshub.ai/mindsdb-query-engine | Adjacent | SQL query engine over 200+ data sources with jobs/triggers/knowledge bases for AI agents. Could inspire unified data surface. |
| ThoughtSpot Spotter | https://www.thoughtspot.com/product/agents, https://www.thoughtspot.com/press-releases/thoughtspot-launches-spotter-the-autonomous-agent-for-analytics | Adjacent/crowded | Agentic analytics and natural-language governed answers. Avoid competing on BI polish. |
| Databricks Genie / Genie Code | https://docs.databricks.com/aws/en/genie/, https://docs.databricks.com/aws/en/genie-code/ | Adjacent/strong enterprise | NL analytics plus AI coding/data assistant that builds pipelines, dashboards, and code in Databricks. Enterprise platform lane. |
| Snowflake Cortex Analyst / Agents / CoCo | https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst, https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents, https://www.snowflake.com/en/product/snowflake-coco/ | Adjacent/strong enterprise | Managed agents inside governed Snowflake environment; CoCo is data-native coding agent. Aiven should contrast with open-source data services and Kafka. |
| Google BigQuery Gemini / Data Agents | https://docs.cloud.google.com/bigquery/docs/gemini-overview, https://docs.cloud.google.com/bigquery/docs/create-data-agents | Adjacent/strong enterprise | Natural language for discovery/query/visualization and managed BigQuery data agents. Crowds analytics/data agent story. |
| AWS Q Data Integration in Glue | https://docs.aws.amazon.com/glue/latest/dg/q.html, https://aws.amazon.com/blogs/big-data/introducing-amazon-q-data-integration-in-aws-glue/ | Adjacent | Natural-language Glue ETL code generation/troubleshooting. Similar pipeline assistant, not Aiven MCP. |
| Microsoft Fabric Copilot / SQL Copilot | https://learn.microsoft.com/en-us/fabric/data-factory/copilot-fabric-data-factory, https://learn.microsoft.com/en-us/fabric/database/sql/copilot-sql-database | Adjacent/strong enterprise | Natural-language pipeline generation, SQL conversion, explanations. Do not build Microsoft-style Copilot clone. |
| Numbers Station / Alation | https://docs.numbersstation.ai/guides/getting-started/introduction/, https://www.alation.com/blog/ai-for-structured-data-production-ready-agents/ | Adjacent | Conversational analytics and production-ready structured-data agents, now Alation-owned. |
| DataGPT | https://www.dbta.com/Editorial/News-Flashes/DataGPT-Emerges-from-Stealth-Releases-Conversational-AI-Data-Analyst-161119.aspx | Adjacent | Conversational AI data analyst. Too far from infra control. |

## Data Observability And Incident Agents

Useful for the "Intelligent Data Detective" direction, but crowded if the product only detects/explains anomalies.

| Company/Product | URL | What to learn | What to avoid |
| --- | --- | --- | --- |
| Monte Carlo AI Agents | https://docs.getmontecarlo.com/docs/ai-features-and-technical-info, https://montecarlo.ai/ | Monitoring/troubleshooting/root-cause agents over data observability context. | Do not make only an observability dashboard. |
| Sifflet AI Agents | https://www.siffletdata.com/product-agents, https://www.siffletdata.com/blog/sifflet-ai-agents | Sentinel/Sage/Forge pattern: detect, explain, resolve with memory and context. | "Resolve automatically" is crowded; make resolution an Aiven MCP action with receipt. |
| Anomalo AIDA / Data Insights Agent | https://www.anomalo.com/aida/, https://www.anomalo.com/insights/ | Natural-language analytics plus autonomous noteworthy-change reports. | Avoid pure analyst reports. |
| Metaplane by Datadog | https://www.metaplane.dev/, https://www.datadoghq.com/blog/datadog-acquires-metaplane/ | Data observability across stack, ML monitoring, lineage. | Datadog owns "observability for data teams"; only use as context. |

## DBA, Performance, And Infra Agents

These are adjacent control patterns. They show what "safe autonomy" looks like but are not the hackathon core by themselves.

| Company/Product | URL | Relevance |
| --- | --- | --- |
| Aiven AI Database Optimizer / EverSQL | https://aiven.io/tools/sql-query-optimizer, https://aiven.io/blog/aiven-ai-dboptimizer-launch, https://aiven.io/press/aiven-acquires-eversql | Aiven already owns AI query optimization. Do not build a slow-query optimizer clone; use optimizer-like recommendations as one action type if needed. |
| pganalyze | https://pganalyze.com/, https://pganalyze.com/resources/webinars | Postgres performance analysis, query/index recommendations, safe MCP context as a theme. |
| DBtune | https://www.dbtune.com/products | AI-driven automated Postgres parameter tuning. |
| Pulumi Neo | https://www.pulumi.com/product/neo/, https://www.pulumi.com/docs/ai/ | Natural-language AI infrastructure agent with provisioning/governance/optimization. Good analogy for "AI platform engineer," but not data-specific. |
| Harness Agents | https://www.harness.io/products/harness-ai/agents, https://developer.harness.io/docs/platform/harness-ai/devops-agent | Pipeline-native autonomous DevSecOps agents; relevant for approval gates/remediation. |
| Port AI Agents | https://www.port.io/, https://docs.port.io/ai-interfaces/ai-agents/overview/ | Internal developer portal/agent governance. Good adjacent trust/control-plane pattern. |

## Crowded Areas

1. **Text-to-SQL and AI analyst chat.** Too many products already let users ask questions in natural language and get SQL, charts, or dashboards. Building this alone would be Bronze at best for Aiven.
2. **Enterprise data engineering copilots.** Snowflake, Databricks, Fabric, AWS, Matillion, Qlik, Acceldata, DataOps.live, Upriver, Ardent, and Definity are all near "AI data engineer." A hackathon build cannot out-platform them.
3. **Data observability with AI root cause.** Monte Carlo, Sifflet, Anomalo, Metaplane/Datadog already own monitor/explain/RCA language. Aiven needs actual MCP-controlled action, not just diagnosis.
4. **Self-driving DBA optimization.** Oracle, Aiven/EverSQL, DBtune, pganalyze and others cover performance tuning. Use only as a supporting primitive.
5. **Generic natural-language cloud infra.** Pulumi, Harness, Port, AWS/Microsoft agents cover broad infra. Aiven should stay in open-source data infrastructure.

## Gaps And Wedges

| Gap | T | A | P=A-T | Why it matters |
| --- | ---: | ---: | ---: | --- |
| Multi-agent Kafka control plane for data infra operations | 30 | 90 | 60 | Aiven explicitly names Kafka for agent-to-agent collaboration; most competitors hide orchestration. Make Kafka visible in the UI. |
| Infrastructure action receipts | 25 | 85 | 60 | Judges need to see trust: who acted, why, tool call, before/after state, rollback, approval. Borrow "flight recorder" framing from prior autonomous-agent work. |
| No-backend app where agents own Postgres/Kafka state directly | 30 | 80 | 50 | Supabase/Neon own app database scaffolding, but Aiven can show database plus streaming plus memory without custom backend APIs. |
| Data detective that actually remediates Aiven services | 25 | 82 | 57 | Observability products stop at alerts/recommendations; Aiven demo can show a safe MCP-controlled change. |
| Open-source multi-service portability story | 20 | 78 | 58 | Snowflake/Databricks/Fabric are powerful but walled gardens. Aiven can pitch open-source Postgres/Kafka primitives controlled by standard MCP. |

## Demo Ideas

### 1. Aiven Data Operator Flight Recorder

User prompt: "Create a resilient real-time order pipeline for a flash sale and keep it safe."

Flow: Planner agent proposes Postgres tables, Kafka topics, and guardrails. Operator agent uses Aiven MCP to create or configure services/topics/tables. Worker agents publish every action to Kafka. Receipt agent writes action receipts to Postgres/pgvector. UI shows a timeline: intent -> MCP tool -> result -> risk -> rollback.

Why it scores: deep MCP integration, real workflow autonomy, creative trust surface.  
T/A/P: T20 A88 P68.  
Cut: no broad ETL connectors, no full admin console, no production-grade auth.

### 2. Self-Healing Streaming Storefront

User prompt: "Keep checkout analytics alive during a traffic spike."

Flow: Seeded e-commerce events stream through Kafka into Postgres. Detective agent detects lag/spike or bad data. Analyst agent queries Postgres for evidence. Operator agent uses Aiven MCP to adjust a safe config, create a dead-letter topic, or add a materialized view/table. UI shows before/after metrics and receipt.

Why it scores: first-minute visual spike, Kafka central, Aiven action is obvious.  
T/A/P: T25 A86 P61.  
Cut: real autoscaling if flaky; use seeded services/events and one safe live MCP action.

### 3. No-Backend Data Product Factory

User prompt: "Build me a live support-ticket intelligence app."

Flow: Agents create Postgres schema, Kafka topic, synthetic event generator, embeddings table, and queries. The frontend sends user intent to agents; agents read/write directly through Aiven MCP and Kafka. Postgres stores state/memory; Kafka coordinates tasks.

Why it scores: directly answers Aiven's no-backend app swarm inspiration.  
T/A/P: T30 A80 P50.  
Cut: multi-user SaaS, billing, external CRM integrations, general-purpose app builder claims.

## Recommendation

Build a hybrid of demo ideas 1 and 2: **Self-Healing Streaming Storefront with Flight Recorder**.

One-sentence pitch: "Our autonomous data operator keeps a live Kafka/Postgres pipeline healthy, and every infrastructure action it takes through Aiven MCP leaves a receipt judges can inspect."

The demo should show, in order:

1. Live event stream enters Kafka and lands in Postgres.
2. Agent detects spike/lag/bad data.
3. Agent asks permission or applies a pre-approved safe change via Aiven MCP.
4. Kafka receives an `infra.action.requested` and `infra.action.completed` event.
5. Postgres stores the action receipt, evidence, and rollback plan.
6. UI shows the pipeline is healthier after the action.

This avoids the crowded "ask your data a question" lane and makes Aiven infrastructure the main character.

## What To Cut

- Generic chat-with-SQL as the product center.
- BI dashboards beyond one simple operational panel.
- Full data catalog, lineage graph, or governance suite.
- Multi-cloud connectors, Snowflake/Databricks/Fabric integrations, and dbt/Airflow breadth.
- Building a custom workflow engine; Kafka topics and simple agent workers are enough.
- Live creation/deletion of expensive services during pitch if seeded Aiven services are safer.
- OAuth, accounts, billing, roles, teams, admin settings.
- Claims of production autonomy without approval gates, receipts, and rollback.
- Natural-language app builder scope beyond one seeded happy path.
- Anything that works just as well with a normal backend API and no Aiven MCP.

## Source URLs

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Aiven MCP landing page: https://aiven.io/mcp
- Aiven AI Database Optimizer: https://aiven.io/blog/aiven-ai-dboptimizer-launch
- Aiven SQL Query Optimizer: https://aiven.io/tools/sql-query-optimizer
- Aiven acquires EverSQL: https://aiven.io/press/aiven-acquires-eversql
- Neon Codex/MCP plugin: https://neon.com/docs/ai/ai-codex-plugin
- Neon MCP cloud blog: https://neon.com/blog/bringing-mcp-to-the-cloud
- Databricks + Neon: https://www.databricks.com/blog/databricks-neon
- Supabase MCP: https://supabase.com/features/mcp-server
- Supabase AI Assistant: https://supabase.com/features/ai-assistant
- MongoDB MCP product: https://www.mongodb.com/products/tools/mcp-server
- MongoDB MCP docs: https://www.mongodb.com/docs/mcp-server/overview/
- Microsoft DataFactory MCP: https://github.com/microsoft/DataFactory.MCP
- Microsoft Fabric RTI MCP: https://github.com/microsoft/fabric-rti-mcp
- Microsoft Fabric what's new: https://learn.microsoft.com/en-us/fabric/fundamentals/whats-new
- pgEdge Postgres MCP: https://www.pgedge.com/blog/introducing-the-pgedge-postgres-mcp-server
- ClickHouse MCP: https://github.com/clickhouse/mcp-clickhouse
- ClickHouse AgentHouse: https://clickhouse.com/blog/agenthouse-demo-clickhouse-llm-mcp
- InfluxDB MCP: https://www.influxdata.com/blog/influxdb-mcp-server/
- Oracle Autonomous AI Database: https://www.oracle.com/autonomous-database/
- Oracle autonomous database definition: https://www.oracle.com/autonomous-database/what-is-autonomous-database/
- Upriver: https://upriverdata.com/
- Upriver funding coverage: https://www.businessinsider.com/israel-startup-upriver-raises-14-million-ai-data-engineering-2026-6
- Ardent: https://tryardent.com/
- Ardent funding release: https://www.globenewswire.com/news-release/2025/09/25/3156336/0/en/ardent-ai-raises-2-15m-to-build-the-first-ai-data-engineer.html
- Definity: https://www.definity.ai/
- Definity Series A/agentic data engineering: https://www.definity.ai/blog/agentic-data-engineering-12m-series-a
- Matillion Maia: https://www.matillion.com/blog/maia-agentic-ai-modern-data-stack
- Matillion agentic data engineers: https://www.matillion.com/blog/operationalizing-agentic-data-engineers
- DataOps.live AI Agent: https://www.dataops.live/dataops-ai-agent
- DataOps.live Metis + Snowflake CoCo: https://www.dataops.live/blog/cortex-code-coco-dataops-automation
- Acceldata Agentic Data Engineering: https://www.acceldata.io/platform/agentic-data-engineering
- Qlik agentic AI: https://www.qlik.com/us/agentic-ai
- Qlik agentic data engineering: https://www.qlik.com/blog/redefining-data-engineering-for-the-agentic-era
- DataBahn: https://www.databahn.ai/
- DataBahn Cruz: https://www.databahn.ai/press-releases/databahn-launches-cruz-data-engineer-in-a-box
- Vanna AI: https://vanna.ai/
- Vanna GitHub: https://github.com/vanna-ai/vanna
- Wren AI: https://getwren.ai/
- Wren OSS: https://getwren.ai/oss
- Outerbase: https://outerbase.com/
- MindsDB Query Engine: https://mindshub.ai/mindsdb-query-engine
- ThoughtSpot agents: https://www.thoughtspot.com/product/agents
- ThoughtSpot Spotter release: https://www.thoughtspot.com/press-releases/thoughtspot-launches-spotter-the-autonomous-agent-for-analytics
- Databricks Genie: https://docs.databricks.com/aws/en/genie/
- Databricks Genie Code: https://docs.databricks.com/aws/en/genie-code/
- Snowflake Cortex Analyst: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst
- Snowflake Cortex Agents: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents
- Snowflake CoCo: https://www.snowflake.com/en/product/snowflake-coco/
- BigQuery Gemini: https://docs.cloud.google.com/bigquery/docs/gemini-overview
- BigQuery data agents: https://docs.cloud.google.com/bigquery/docs/create-data-agents
- AWS Q Data Integration in Glue: https://docs.aws.amazon.com/glue/latest/dg/q.html
- Microsoft Fabric Data Factory Copilot: https://learn.microsoft.com/en-us/fabric/data-factory/copilot-fabric-data-factory
- Microsoft Fabric SQL Copilot: https://learn.microsoft.com/en-us/fabric/database/sql/copilot-sql-database
- Numbers Station docs: https://docs.numbersstation.ai/guides/getting-started/introduction/
- Alation on structured data agents: https://www.alation.com/blog/ai-for-structured-data-production-ready-agents/
- DataGPT coverage: https://www.dbta.com/Editorial/News-Flashes/DataGPT-Emerges-from-Stealth-Releases-Conversational-AI-Data-Analyst-161119.aspx
- Monte Carlo AI agents docs: https://docs.getmontecarlo.com/docs/ai-features-and-technical-info
- Monte Carlo: https://montecarlo.ai/
- Sifflet AI agents: https://www.siffletdata.com/product-agents
- Anomalo AIDA: https://www.anomalo.com/aida/
- Anomalo Data Insights Agent: https://www.anomalo.com/insights/
- Metaplane: https://www.metaplane.dev/
- Datadog acquires Metaplane: https://www.datadoghq.com/blog/datadog-acquires-metaplane/
- pganalyze: https://pganalyze.com/
- DBtune: https://www.dbtune.com/products
- Pulumi Neo: https://www.pulumi.com/product/neo/
- Pulumi AI docs: https://www.pulumi.com/docs/ai/
- Harness Agents: https://www.harness.io/products/harness-ai/agents
- Port AI Agents: https://docs.port.io/ai-interfaces/ai-agents/overview/
