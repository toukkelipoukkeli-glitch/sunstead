# Agent Zeta: Data Detectives, Anomaly Agents, and Intelligent Observability

> Status: COMPLETE - landscape scan  
> Agent: zeta  
> Date: 2026-06-24  
> Mission: Map systems that query metrics, logs, traces, databases, warehouses, and streams for incident AI, anomaly detection, root cause analysis, data observability, and streaming analytics agents.

## Position

DEPTH: emerging. DIRECTION: aligned. BOUNDARY: approaching cold.

Backward beam: Aiven judges want depth of MCP integration, workflow autonomy, creativity, and impact. A winning detective idea must show Aiven MCP doing real work in the first minute: query data, inspect metrics/logs, create or use Kafka topics, write evidence to Postgres, and optionally propose or execute a safe infra change.

Forward beam: the market is packed with AI RCA, AIOps, data observability, and conversational analytics. The gap is not "AI finds root cause." The gap is "the agent owns the open-source data plane it investigates, leaves receipts, and uses Kafka/Postgres as visible coordination and memory."

## Hackathon Read

- Detected hackathon type: sponsor-needs challenge with technical-first scoring and product-demo pressure.
- Judging/submission mode: Aiven partner selection, with top 3 pitching; pitch is 4 minutes plus 1 minute Q&A.
- Target track: Aiven main challenge. Multi-track optionality is not clear from the read files, so do not optimize for it until confirmed.
- Core demo flow to optimize for: incident/anomaly arrives, agents investigate via Aiven MCP, Kafka carries agent events, Postgres stores evidence and memory, UI shows receipts and a confident finding.
- Unknown before building: presenter and presenter style. Ask before implementation; optimize the flow around that person.
- Intentionally cut: broad observability integrations, enterprise-grade ML, real production remediation, full lineage graphs, account systems, generic dashboards.

## Market Map

### Exact or Near-Exact Matches

These are close enough that we should not pretend the base idea is novel. The Aiven wedge must be explicit.

| System | What it does | Exact vs adjacent | Aiven implication |
|---|---|---|---|
| Aiven MCP | Official MCP server can create/manage Aiven services from assistants, including PostgreSQL, Kafka, plans, metrics, logs, and service configuration. Source: https://aiven.io/docs/tools/mcp-server and https://github.com/aiven-open/mcp-aiven | Exact substrate | This is the challenge primitive. The demo should show actual MCP tool calls, not a backend pretending to be autonomous. |
| Datadog Bits AI SRE | Autonomous SRE agent investigates alerts, reasons over hypotheses, queries logs/metrics/traces/dashboards/changes/RUM/database/network/profiler, and shows an Agent Trace. Source: https://www.datadoghq.com/blog/bits-ai-sre-deeper-reasoning/ | Exact product category, different platform | Do not build generic "Bits for Aiven." Copy the visible trace/receipt pattern, not the product scope. |
| Grafana Sift + Grafana MCP | Sift detects metric anomalies, log/trace patterns, possible root causes, and next steps. Grafana MCP can list/create incidents and run Sift analyses over Loki/Tempo. Sources: https://grafana.com/docs/grafana-cloud/alerting-and-irm/irm/manage-incidents/investigate/ and https://grafana.com/docs/grafana/latest/developer-resources/mcp/guides/use-grafana-incident-and-sift/ | Very close, especially MCP-triggered investigation | Strong warning: "MCP observability assistant" exists. Aiven needs data-plane control, Kafka agent bus, and Postgres evidence memory to differ. |
| HolmesGPT | CNCF SRE agent that uses an agentic loop to query live observability data and find root causes. Integrations include Datadog, OpenSearch, Kafka, Loki, Kubernetes, Azure SQL, MongoDB, MCP-backed tools, and more. Source: https://github.com/HolmesGPT/holmesgpt | Exact OSS AI SRE pattern | The OSS space already has data-source querying agents. Our edge is Aiven-native service provisioning/config/query plus a polished hackathon story. |
| Confluent Streaming Agents + Flink anomaly detection | Confluent has Streaming Agents and `ML_DETECT_ANOMALIES()` in managed Flink for real-time anomaly signals that agents can investigate. Source: https://www.confluent.io/blog/flink-ml-anomaly-detection-for-agentic-investigation-remediation/ | Exact streaming-agent concept, different cloud | Aiven Kafka can be the visible agent bus and anomaly stream, but avoid making "Confluent clone" the pitch. |
| Elementary MCP | Elementary brings dbt models, lineage, and incidents into Cursor/Claude through MCP; OSS has dbt-native anomaly tests and reports. Sources: https://docs.elementary-data.com/home and https://docs.elementary-data.com/oss/oss-introduction | Near exact for data observability MCP | Data observability plus MCP exists. Aiven wedge should be cross-plane: streaming anomaly -> warehouse/table evidence -> infra control. |

### Adjacent Incident AI and Observability Platforms

| System | What matters | Why it is adjacent |
|---|---|---|
| Dynatrace Intelligence / Davis | Predictive, causal, generative, and agentic AI; analyzer APIs over time series and Grail data. Source: https://developer.dynatrace.com/develop/sdks/client-davis-analyzers/ | Enterprise observability owns causal RCA, but not Aiven MCP/data-plane ownership. |
| New Relic AI / AIOps / SRE Agent | AIOps, SRE Agent, smart alerts, change tracking, queues/streams visibility. Source: https://newrelic.com/platform/applied-intelligence | Broad incumbent. Copy only "change tracking + probable cause" framing. |
| Elastic AI Agent / AI Assistant | LLM assistant can search Elastic data with user permissions, use functions, and produce alert-context conversations. Source: https://www.elastic.co/docs/solutions/observability/ai/observability-ai-assistant | Adjacent OpenSearch-style log detective; Aiven can pair Kafka -> OpenSearch -> Postgres receipts. |
| Splunk Observability AI troubleshooting agent | Collects and correlates metrics, traces, events, and logs, then presents suspected root causes and evidence. Source: https://www.splunk.com/en_us/blog/observability/ai-troubleshooting-agent-in-splunk-observability-cloud.html | Strong incumbent pattern: hypothesis + evidence. Avoid generic Splunk-style RCA. |
| Sentry Seer | AI debugger/root-cause agent using errors, logs, commits, traces, stack traces, profiles, and code context; can generate fixes. Source: https://sentry.io/welcome/ | App-code incident AI, not data infrastructure. Good inspiration for "from issue to fix with receipts." |
| Logz.io AI Agent RCA | Correlates logs, metrics, traces, and change events for RCA. Source: https://logz.io/platform/log-management/ | Adjacent observability assistant; not Aiven-native infra control. |
| OpenObserve SRE Agent | AI SRE over logs, metrics, traces with evidence chain. Source: https://openobserve.ai/ai-sre/ | Similar category, open-ish observability posture. |
| Coroot | Open-source observability/APM with AI-powered RCA over metrics, logs, traces, profiling, and SLOs. Source: https://github.com/coroot/coroot | Adjacent OSS RCA; useful if we want eBPF/Kubernetes-style demo, but likely too much scope. |
| Netdata Anomaly Advisor | Edge-native ML anomaly detection and automated correlation/root-cause ranking. Source: https://www.netdata.cloud/features/aiml/anomaly-detection/ | Strong anomaly UX, but not agentic data-plane control. |
| K8sGPT | Scans Kubernetes clusters, diagnoses, and triages issues in simple English. Source: https://github.com/k8sgpt-ai/k8sgpt | Narrow Kubernetes diagnostic agent; avoid unless the demo needs K8s. |

### Adjacent Incident Management and AI SRE Startups

| System | What matters | Why it is adjacent |
|---|---|---|
| PagerDuty | AI-first operations platform with AIOps, incident orchestration, alert noise reduction, and AI agents. Source: https://www.pagerduty.com/ | Incident lifecycle incumbent; not a data infra control-plane demo. |
| incident.io AI Platform / AI SRE | AI analyzes alerts, triages root cause, and answers questions about recent code changes and past actions. Source: https://incident.io/ai-platform | Good incident-room UX pattern. Less data-plane-native. |
| Rootly AI SRE | Runs parallel hypothesis checks, correlates alerts, surfaces root cause with confidence scores, and shows reasoning. Source: https://rootly.com/ai-sre | Good "shows its work" benchmark; do not compete on incident management breadth. |
| FireHydrant AI | AI-enriched incident summaries, retrospectives, root cause, findings, and action items. Source: https://firehydrant.com/ai/ | Post-incident documentation is crowded and less Aiven-specific. |
| BigPanda | AI incident intelligence, alert correlation, change correlation, root cause, suggested actions. Source: https://www.bigpanda.io/our-product/root-cause-analysis/ | Enterprise AIOps; useful as proof that "correlate change to incident" is table stakes. |
| Resolve AI | AI for production systems; agents investigate incidents, recommend fixes, document, track, and integrate via MCP/API/skills. Source: https://resolve.ai/product/ai-sre | Very close to AI SRE. Avoid "agent handles all alerts" scope. |
| Anyshift | Versioned infrastructure knowledge graph; traces cascading failures across services, deployments, and config. Source: https://www.anyshift.io/ | The graph/change-history angle is strong but hard to build in hackathon time. |
| Metoro | AI SRE gathers logs, traces, metrics, Kubernetes events, deployments, and code context; autonomous RCA. Source: https://metoro.io/ai-sre-agent | Similar RCA category. Our demo needs more Aiven primitives, fewer integrations. |
| Hyground | Self-hosted AI SRE; queries logs, metrics, events, and configs in parallel, returns evidence-backed findings. Source: https://hyground.ai/product/overview | Similar "sovereign AI SRE" angle; avoid generic self-hosted pitch. |
| Aurora / Arvo AI | OSS AI-powered agentic incident management and RCA across AWS/Azure/GCP/Kubernetes and observability tools. Source: https://arvo-ai.github.io/aurora/ | OSS RCA is already emerging. Aiven wedge should be managed open-source data infrastructure, not just cloud querying. |
| Keep | Open-source alert management and AIOps with alert correlation, enrichment, workflows, dashboards. Source: https://www.keephq.dev/ | Good alert bus/workflow inspiration; not enough by itself for Aiven scoring. |

### Data Observability and Warehouse Detectives

| System | What matters | Why it is adjacent |
|---|---|---|
| Monte Carlo | Data + AI observability; AI monitor creation, automatic baseline coverage, lineage, root-cause insights, observability agents. Source: https://montecarlo.ai/platform/data-quality/ | Market leader pattern for data quality incidents. Do not build a generic data observability clone. |
| Bigeye | Automated monitoring, lineage-aware detection, AI-powered diagnosis, root cause, suggested resolutions/preventions. Source: https://www.bigeye.com/platform/data-observability | Strong "lineage-aware RCA" precedent. |
| Anomalo | Unsupervised ML data quality monitoring, automatic root cause analysis, lineage, triage workflows, AIDA conversational analytics. Source: https://www.anomalo.com/product-overview/ | Data quality anomaly category is crowded. |
| Soda | AI-native data quality; anomaly detection, record-level anomaly detection, automated remediation and pipeline fixing. Source: https://soda.io/product/data-observability | Shows "data fixes itself" positioning is taken. |
| Sifflet | End-to-end data estate monitoring, anomaly detection, root cause, upstream/downstream event chain. Source: https://www.siffletdata.com/product-monitoring | Another strong incumbent in data observability. |
| Metaplane by Datadog | ML anomaly detection, pipeline visibility, column-level lineage, root cause, downstream impact. Source: https://www.metaplane.dev/platform-overview | Datadog is absorbing data observability; reinforces category convergence. |
| Great Expectations / GX Cloud | Open-source data quality plus adaptive anomaly detection for volume/completeness issues. Source: https://greatexpectations.io/blog/why-anomaly-detection-matters-in-data-quality-and-how-gx-just-made-it-easier/ | Testing/anomaly framework; less agentic and less visible for Aiven unless paired with MCP. |
| Snowflake Cortex Analyst | Natural-language queries against semantic views and physical tables through REST API. Source: https://docs.snowflake.com/en/user-guide/views-semantic/overview | Text-to-SQL over warehouses is crowded; only use as adjacent "query data safely" pattern. |
| Databricks Genie Spaces | Domain-specific natural-language chat that returns SQL, result tables, and visualizations over Unity Catalog data. Source: https://docs.databricks.com/aws/en/genie/ | Conversational analytics is not enough for Aiven. Needs autonomous workflow and infra action. |
| ThoughtSpot Spotter/Agents | Agentic analytics and semantic modeling from natural language. Source: https://www.thoughtspot.com/product/agents | Adjacent BI assistant. Too far from Aiven MCP unless used for final explanation UI. |

### Streaming Analytics and Live AI Data Infrastructure

| System | What matters | Why it is adjacent |
|---|---|---|
| Confluent | Streaming Agents, Flink SQL, built-in anomaly detection, Kafka/Flink AI patterns. Source: https://www.confluent.io/blog/flink-ml-anomaly-detection-for-agentic-investigation-remediation/ | Closest stream-native competitor. Aiven must lean on "open-source managed Kafka via MCP" and no-backend swarm. |
| RisingWave | PostgreSQL-compatible streaming database for real-time analytics, AI agent infrastructure, anomaly detection, and MCP + streaming database use cases. Source: https://risingwave.com/use-cases/ | Very relevant pattern: agents query always-fresh state. Aiven Postgres/Kafka can emulate the visible version without adding RisingWave. |
| Pathway | Live Data Framework for streaming ETL, live vector search, RAG, anomaly alerts. Source: https://pathway.com/framework | Strong live-AI infra but adding it may dilute Aiven. |
| Quix | Kafka-based stream processing with anomaly detection tutorial that creates/produces anomaly events to Kafka. Source: https://quix.io/docs/quix-streams/tutorials/anomaly-detection/tutorial.html | Good implementation inspiration if we need simple stream anomaly logic. |
| OpenSearch MCP | OpenSearch 3.0 experimental MCP server exposes tools to LLM agents. Source: https://opensearch.org/blog/introducing-mcp-in-opensearch/ | Aiven OpenSearch support is not guaranteed in brief, but logs/search via MCP is a high-value future path. |

## Crowded Areas

1. Generic AI RCA over logs, metrics, and traces is crowded. Datadog, Dynatrace, New Relic, Splunk, Elastic, Grafana, Sentry, Logz.io, OpenObserve, Coroot, Netdata, and others all claim some mix of anomaly detection, correlation, root cause, and evidence.

2. Incident-room AI is crowded. PagerDuty, incident.io, Rootly, FireHydrant, BigPanda, Resolve, Anyshift, Metoro, Hyground, Aurora, and Keep all pitch triage, root cause, summaries, suggested actions, or remediation.

3. Warehouse/data-quality anomaly detection is crowded. Monte Carlo, Bigeye, Anomalo, Soda, Sifflet, Metaplane, GX, and Elementary already cover freshness, volume, schema, lineage, root cause, impact, alert routing, and increasingly "agents."

4. Natural-language SQL/BI is crowded. Snowflake Cortex Analyst, Databricks Genie, ThoughtSpot, and many others make "ask your data" a weak standalone demo.

5. Streaming anomaly detection is known. Kafka/Flink anomaly alerts are a common technical pattern, and Confluent is explicitly tying them to Streaming Agents.

## Gaps and Wedges

### Gap 1: Data-plane control with visible receipts

Most systems investigate existing telemetry stacks. Few make the agent's own data infrastructure visible as the demo: it creates Kafka topics, writes investigation state to Postgres, queries service metrics/logs through MCP, and leaves a replayable event log.

T18 A82 P64. Evidence that would lower T: confirm Aiven MCP tools available onsite for Kafka topic creation, Postgres SQL, service metrics/logs, and safe read-only mode.

### Gap 2: Incident AI + data observability + streaming in one small story

The market silos operational incidents, data quality incidents, and streaming anomalies. A hackathon can compress them: "Kafka lag caused late orders, which caused a revenue table anomaly, which paged the agent, which traced the event chain."

T24 A78 P54. Evidence that would lower T: a seeded demo dataset and one reliable anomaly injection path.

### Gap 3: Agent swarm over Kafka, not hidden orchestration

Most agent products hide orchestration. Aiven can make Kafka the stage: detector, SQL detective, log detective, infra operator, and scribe agents communicate through topics. Judges can see the agent-to-agent stream.

T20 A80 P60. Evidence that would lower T: a simple UI that streams Kafka messages live and links each message to MCP calls.

### Gap 4: Safe autonomy via read-only investigation and gated writes

Enterprise buyers worry about "agents with keys to data/infra." Aiven MCP docs explicitly mention read-only mode and scoped tools. A winning demo can show safe autonomy: read-only investigation first, then human-approved write action such as creating a topic, adding an index, or scaling a service.

T14 A72 P58. Evidence that would lower T: verify read-only/scoped MCP config in the local build and show the permission boundary on screen.

### Gap 5: Open evidence ledger for RCA claims

Datadog has Agent Trace and Rootly shows reasoning, but an Aiven-native "evidence ledger" in Postgres/Kafka is easy to inspect, replay, and score. It makes the invisible AI reasoning visible and sponsor-native.

T16 A76 P60. Evidence that would lower T: one Postgres table with tool calls, SQL, Kafka offsets, hypothesis state, confidence, and final recommendation.

## Most Important Claims With T/A/P

| Claim | T | A | P=A-T | Notes |
|---|---:|---:|---:|---|
| Generic AI root cause analysis is too crowded for the winning thesis. | 8 | 76 | 68 | Many incumbents and OSS projects already pitch this. |
| Aiven-native detective with Kafka bus + Postgres evidence ledger is still a strong hackathon wedge. | 18 | 82 | 64 | The primitive is familiar, but the visible Aiven MCP control plane is fresh enough. |
| Full data observability clone is a dead end for this hackathon. | 10 | 66 | 56 | Monte Carlo, Bigeye, Anomalo, Soda, Sifflet, Metaplane, GX cover the space. |
| Streaming anomaly -> agent investigation is demoable and aligned with Aiven. | 20 | 78 | 58 | Needs seeded events and reliable Kafka/UI path. |
| Real remediation should be gated, not autonomous by default. | 12 | 70 | 58 | Safer for judges and less likely to break live. |
| A visible receipt/flight-recorder layer improves trust and pitch clarity. | 16 | 76 | 60 | Borrowed from Agent Trace/incident timelines, but implemented with Aiven primitives. |
| Natural-language SQL alone will not score well. | 7 | 60 | 53 | Too many warehouse/BI agents already do it; weak MCP depth. |

## Demo Ideas

### 1. Aiven Incident Flight Recorder

One-sentence pitch: "When a data pipeline incident starts, Aiven agents investigate across Kafka, Postgres, metrics, and logs, then leave a replayable evidence ledger."

Demo flow:

1. Inject an incident: Kafka consumer lag rises and order events start arriving late.
2. Detector agent consumes `telemetry.events` and publishes `incident.opened`.
3. Metrics agent uses Aiven MCP to fetch service metrics/logs.
4. SQL detective uses Aiven MCP to query Postgres: late orders, revenue deltas, failed batches.
5. Kafka detective checks topic/consumer lag and recent event shape.
6. Hypothesis agent writes evidence rows to Postgres and publishes hypothesis updates to Kafka.
7. Operator proposes one gated action: create a dead-letter topic, scale service, or add a Postgres index.
8. UI shows the incident timeline, Kafka agent messages, MCP tool calls, SQL evidence, and final root-cause report.

Why it scores:

- Depth of MCP integration: Postgres queries, Kafka topics/messages, metrics/logs, maybe service config.
- Workflow autonomy: multi-agent investigation with hypothesis refinement.
- Creativity and impact: flight recorder makes AI incident reasoning inspectable.

T18 A84 P66.

Cuts:

- No real Kubernetes.
- No broad vendor integrations.
- No automatic destructive remediation.
- Seed telemetry and logs; only one live incident path.

### 2. Data Product First Responder

One-sentence pitch: "An AI data reliability operator catches bad business data while it is still streaming, traces it upstream, and quarantines it before dashboards lie."

Demo flow:

1. Kafka receives order/payment events; Postgres materializes a small analytics table.
2. Inject schema drift or null-price records.
3. Data monitor agent sees volume/null/revenue anomaly.
4. Detective queries Postgres for affected rows, compares against historical baseline, and checks Kafka message samples.
5. Lineage-lite agent maps impact: dashboard KPI, table, Kafka topic, producer.
6. Operator creates `quarantine.bad_orders` or a Kafka dead-letter topic via Aiven MCP, then routes future bad events there.
7. UI shows "bad data blocked before CFO dashboard changed."

Why it scores:

- It combines data observability and streaming action, which are usually separate.
- It makes Aiven Kafka/Postgres central.
- It is easier for non-SRE judges to understand than CPU/latency RCA.

T22 A76 P54.

Cuts:

- No real dbt lineage.
- No full Monte Carlo-style monitor catalog.
- No complex ML; use z-score/rules plus LLM explanation.
- One business metric only.

### 3. No-Backend Swarm Ops Room

One-sentence pitch: "A live ops room where every agent communicates through Aiven Kafka and stores memory in Aiven Postgres - no app backend, just the data plane."

Demo flow:

1. Start a live stream of simulated SaaS events: signups, payments, API latency, queue depth.
2. Detector agent flags anomaly and publishes to Kafka.
3. Three specialized agents race in parallel: metrics detective, SQL detective, stream detective.
4. Judge watches Kafka messages arrive as colored cards.
5. Consensus agent ranks hypotheses and writes `incident_report` to Postgres.
6. Presenter asks a natural-language question: "Why did revenue drop?" The agent answers with cited Kafka offsets, SQL rows, and tool calls.

Why it scores:

- Very visible Aiven MCP/Kafka/Postgres use.
- Strong "agents are the backend" interpretation of the challenge.
- Easy to rehearse and seed.

T20 A82 P62.

Cuts:

- No real enterprise observability.
- No generic chat surface beyond incident Q&A.
- No hard deployment dependency if local demo is enough.
- No multi-incident routing.

## Recommended Direction

Best Zeta recommendation: build Demo 1 with pieces of Demo 3.

Product sentence:

> Aiven Incident Flight Recorder is an autonomous data detective: agents investigate Kafka/Postgres incidents through Aiven MCP, coordinate over Kafka, store every clue in Postgres, and show a replayable root-cause report before a human opens dashboards.

Core first-minute moment:

1. Presenter clicks "Trigger checkout lag incident."
2. Kafka message stream starts moving.
3. Agent calls Aiven MCP to inspect Kafka/Postgres/metrics.
4. UI fills with evidence cards and a root-cause hypothesis.
5. Presenter expands "receipts" and shows SQL, Kafka offsets, tool calls, and the proposed safe action.

Why this beats a generic AI SRE:

- It uses Aiven as the operating substrate, not just a database.
- Kafka is visible as the agent bus.
- Postgres is visible as memory/evidence.
- MCP tool calls are visible as autonomy receipts.
- The story is understandable in under 3 minutes.

## What To Cut

- Cut full observability ingestion. Seed logs/metrics/events; do not build OpenTelemetry pipelines unless already available.
- Cut broad integrations with Datadog, Grafana, Slack, PagerDuty, GitHub, Kubernetes, Snowflake, dbt, and cloud APIs.
- Cut real ML anomaly detection. Use simple rolling baseline/z-score/rules; spend time on explanation and receipts.
- Cut autonomous destructive writes. Gate writes with a confirm button; use safe actions like creating a topic/table, writing an index recommendation, or scaling only if already tested.
- Cut multi-tenant auth, billing, org settings, and alert policy builders.
- Cut a general chat assistant. One structured incident Q&A pane is enough.
- Cut "fix PR" automation. That shifts the demo into Sentry/Resolve territory and away from Aiven.
- Cut full lineage. Use lineage-lite: topic -> table -> dashboard/KPI.

## Source Index

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Datadog Bits AI SRE: https://www.datadoghq.com/blog/bits-ai-sre-deeper-reasoning/
- Grafana Sift: https://grafana.com/docs/grafana-cloud/alerting-and-irm/irm/manage-incidents/investigate/
- Grafana MCP Incident/Sift: https://grafana.com/docs/grafana/latest/developer-resources/mcp/guides/use-grafana-incident-and-sift/
- HolmesGPT: https://github.com/HolmesGPT/holmesgpt
- Confluent anomaly detection and Streaming Agents: https://www.confluent.io/blog/flink-ml-anomaly-detection-for-agentic-investigation-remediation/
- Dynatrace Davis/Dynatrace Intelligence SDK: https://developer.dynatrace.com/develop/sdks/client-davis-analyzers/
- New Relic Applied Intelligence: https://newrelic.com/platform/applied-intelligence
- Elastic AI Assistant: https://www.elastic.co/docs/solutions/observability/ai/observability-ai-assistant
- Splunk AI troubleshooting agent: https://www.splunk.com/en_us/blog/observability/ai-troubleshooting-agent-in-splunk-observability-cloud.html
- Sentry Seer: https://sentry.io/welcome/
- OpenObserve AI SRE: https://openobserve.ai/ai-sre/
- Coroot: https://github.com/coroot/coroot
- Netdata Anomaly Advisor: https://www.netdata.cloud/features/aiml/anomaly-detection/
- K8sGPT: https://github.com/k8sgpt-ai/k8sgpt
- PagerDuty: https://www.pagerduty.com/
- incident.io AI Platform: https://incident.io/ai-platform
- Rootly AI SRE: https://rootly.com/ai-sre
- FireHydrant AI: https://firehydrant.com/ai/
- BigPanda RCA: https://www.bigpanda.io/our-product/root-cause-analysis/
- Resolve AI SRE: https://resolve.ai/product/ai-sre
- Anyshift: https://www.anyshift.io/
- Metoro AI SRE: https://metoro.io/ai-sre-agent
- Hyground: https://hyground.ai/product/overview
- Aurora: https://arvo-ai.github.io/aurora/
- Keep: https://www.keephq.dev/
- Monte Carlo data quality: https://montecarlo.ai/platform/data-quality/
- Bigeye data observability: https://www.bigeye.com/platform/data-observability
- Anomalo product overview: https://www.anomalo.com/product-overview/
- Soda data observability: https://soda.io/product/data-observability
- Sifflet monitoring: https://www.siffletdata.com/product-monitoring
- Metaplane overview: https://www.metaplane.dev/platform-overview
- Great Expectations anomaly detection: https://greatexpectations.io/blog/why-anomaly-detection-matters-in-data-quality-and-how-gx-just-made-it-easier/
- Elementary docs: https://docs.elementary-data.com/home and https://docs.elementary-data.com/oss/oss-introduction
- Snowflake semantic views/Cortex Analyst: https://docs.snowflake.com/en/user-guide/views-semantic/overview
- Databricks Genie Spaces: https://docs.databricks.com/aws/en/genie/
- ThoughtSpot agents: https://www.thoughtspot.com/product/agents
- RisingWave use cases: https://risingwave.com/use-cases/
- Pathway framework: https://pathway.com/framework
- Quix anomaly detection tutorial: https://quix.io/docs/quix-streams/tutorials/anomaly-detection/tutorial.html
- OpenSearch MCP: https://opensearch.org/blog/introducing-mcp-in-opensearch/
