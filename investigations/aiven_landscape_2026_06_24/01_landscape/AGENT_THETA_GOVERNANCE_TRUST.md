# Agent Theta: Governance, Compliance, Lineage, Audit, and Agent Trust

Date: 2026-06-24

Navigator position: emerging and aligned, approaching cold. The enterprise landscape is well mapped around data catalogs, lineage, RBAC/ABAC, audit logs, and AI governance. The hotter gap is narrower: making an autonomous Aiven data operator trusted enough to touch Kafka/Postgres/production-like data by showing identity, policy, lineage, audit, and rollback receipts in the first minute.

## Hackathon Frame

- Detected hackathon type: `technical-first` sponsor-needs challenge with an open-ended creative wrapper.
- Judging/submission mode: Aiven partner selects finalists; finalists pitch for 4 minutes with 1 minute Q&A.
- Target track: Aiven main challenge. Optional side tracks are still unknown and should not distort the core build.
- Core demo flow: an agent investigates or creates a Kafka/Postgres data workflow through Aiven MCP, asks policy for permission, executes only safe actions, and writes a durable receipt to Kafka + Postgres + Aiven logs.
- Intentionally cut: full enterprise data catalog, regulatory compliance product, EU AI Act workflow, multi-cloud IAM, production auth UI, broad lineage graph, real destructive writes.
- Unknown to flag before large implementation: who is presenting, whether multi-track submission is legal, and whether Aiven mentors want governance as the main story or as the trust layer inside a data-operator demo.

## Executive Read

Enterprise governance for AI agents is no longer an empty category. Databricks, Snowflake, Google, Microsoft, Collibra, Alation, Atlan, Okta, Microsoft Entra, Credal, and Teleport are all moving toward the same claim: agents need governed context, agent identity, least privilege, approvals, audit logs, and lineage.

That means "governance for agents" is too big and too crowded for the hackathon. The Aiven wedge is more specific:

> **Aiven Data Operator Flight Recorder:** agents can act on Aiven Kafka/Postgres through MCP, but every action is policy-checked, scoped, lineage-aware, and recorded as a replayable receipt.

This translates the prior "freedom with receipts" thesis from open-source code agents to data infrastructure. The judge should see that the agent has keys, but also see who the agent is, which tool it called, what data it touched, why it was allowed, what changed, where the evidence lives, and how to roll it back.

## What Enterprise Buyers Fear

The trust problem is not "can the model write SQL?" It is:

- Agent uses a broad human token and silently reads PII.
- Agent writes to production tables without change approval.
- Agent creates or deletes Kafka topics without ownership or retention policy.
- Agent follows prompt-injected instructions from retrieved data.
- Agent cannot explain which upstream data or Kafka offsets drove a decision.
- Audit logs show a service account, not the responsible agent/user/task.
- Data catalog policy says "PII", but the agent context omits that classification.
- A remediation works once, but no durable evidence exists for compliance review.

MCP makes this sharper because tools are model-controlled. The MCP spec says tools let models interact with external systems such as databases/APIs and recommends visible exposed tools, invocation indicators, and human ability to deny tool calls: https://modelcontextprotocol.io/specification/2025-11-25/server/tools.

## Exact Matches For Aiven

| Primitive | Source | Why it matters | Aiven demo implication | T/A/P |
|---|---|---|---|---|
| Aiven MCP destructive capability warning | https://github.com/aiven-open/mcp-aiven | Aiven explicitly warns the MCP server can create, modify, and delete services/data, including dropping databases, deleting services, and producing messages. | Put "agent with keys" in the pitch, then immediately show scoped permissions and receipts. | T6 A92 P86 |
| Aiven MCP read-only mode and service scopes | https://github.com/aiven-open/mcp-aiven | Remote MCP supports `read_only=true`; `services_scope` can reduce the tool surface to `pg`, `kafka`, etc.; secrets are disabled in read-only mode. | Demo the operator switching from read-only investigation to gated write mode. | T8 A86 P78 |
| Aiven MCP event/log/metrics tools | https://github.com/aiven-open/mcp-aiven | Tools include service metrics, service logs, project event logs, query activity, Kafka topic/message operations, and Postgres read/write. | Receipts can cite real Aiven project logs plus app-level Kafka/Postgres receipts. | T10 A84 P74 |
| Aiven roles and permissions | https://aiven.io/docs/platform/concepts/permissions | Permissions/roles are granted to organization users, application users, and groups at organization/unit/project level; cumulative permissions can surprise teams. | Use a dedicated application user or scoped sandbox; do not run demo as broad personal admin if avoidable. | T12 A76 P64 |
| Aiven application users | https://aiven.io/docs/platform/howto/manage-application-users | Non-human users can get programmatic access but Aiven warns they are a security risk if unmanaged. | Treat the agent as an app user with owner, scope, token duration, and audit row. | T12 A80 P68 |
| Aiven Kafka governance | https://aiven.io/docs/products/kafka/concepts/governance-overview | Kafka governance includes ownership, four-eyes approvals, topic catalog, RBAC, monitoring, and audit logs. | Strong exact hook: agent-created topics need owner, retention, PII flag, approval, and audit receipt. | T10 A82 P72 |
| Aiven PostgreSQL audit logging | https://aiven.io/docs/products/postgresql/concepts/pg-audit-logging | pgAudit can support security, compliance evidence, accountability, RCA, and change management; logs can be sent to OpenSearch, Kafka, or syslog. | Show a Postgres audit trail for the agent's SQL write, but keep the visual summary in the app UI. | T10 A78 P68 |

## Exact And Near-Exact Market Matches

| System | Category | Match | Gap relative to Aiven | T/A/P |
|---|---|---|---|---|
| Databricks Unity Catalog + Unity AI Gateway | data and AI governance | Unified governance for data and AI assets; docs cover access control, lineage, auditing, classification, data quality, AI governance. Blog says it governs agents, models, MCP servers, and data with identity-aware access, runtime policies, guardrails, and auditability. Sources: https://docs.databricks.com/aws/en/data-governance/unity-catalog/ and https://www.databricks.com/blog/governing-ai-agents-scale-unity-catalog | Very close enterprise story; too broad to beat. Aiven should not claim "Unity Catalog for Aiven." Build a small visible receipt layer over Aiven primitives. | T8 A82 P74 |
| Snowflake Horizon Catalog | agentic data catalog | "Agentic catalog" with semantic context, sensitive data protection, data quality, lineage, AI guardrails, AI governance. Source: https://docs.snowflake.com/en/user-guide/snowflake-horizon | Strong proof that catalogs are being reframed for agents. Aiven differentiates through open-source Kafka/Postgres control, not catalog breadth. | T8 A78 P70 |
| Google Knowledge Catalog + lineage MCP | governed context for agents | Gemini-powered catalog builds a context graph for agents; Google added a remote MCP server for data lineage graph queries in preview. Sources: https://docs.cloud.google.com/dataplex/docs/introduction and https://docs.cloud.google.com/dataplex/docs/release-notes | Very direct "catalog/lineage via MCP" competitor. Avoid building a catalog. Use lineage-lite receipts for the demo. | T7 A82 P75 |
| Microsoft Purview | AI security/compliance governance | Purview manages data security and compliance for Copilots, agents, enterprise AI apps, and detected generative AI apps. Source: https://learn.microsoft.com/en-us/purview/ai-microsoft-purview | Enterprise compliance lane is owned by Microsoft. Aiven demo should be operational trust, not compliance suite. | T8 A74 P66 |
| Collibra AI Governance / AI Command Center | AI use case + agent registry | Central repository for AI agents, models, and use cases; assessments cover business context, data/models, legal/ethics, risks/safeguards, NIST AI RMF, AIUC-1; traceability links agents/models/data/use cases. Source: https://productresources.collibra.com/docs/collibra/latest/Content/AIGovernance/co_about-ai-governance.htm | Too heavyweight for hackathon. Borrow "agent registry + approved use case" as one row, not a workflow product. | T8 A76 P68 |
| Alation Agentic Data Intelligence Platform | catalog + governance + agents | Combines cataloging, governance, quality, lineage, and AI automation; agents can enforce policies, flag quality issues, or recommend datasets. Source: https://www.alation.com/product/agentic-data-intelligence-platform/ | Agentic governance is now catalog vendor messaging. Aiven must be more concrete and demo-native. | T10 A72 P62 |
| Atlan Active Data Governance | active metadata/context layer | PII classifications propagate along lineage; agents querying via Atlan MCP receive classifications before acting. Source: https://atlan.com/active-data-governance/ | Very close "metadata context to agents" pattern. Aiven can show a smaller policy check: topic/table tags -> allowed/blocked MCP action. | T10 A76 P66 |
| Credal | enterprise agent control plane | Provides human-in-the-loop approval, audit logging, access controls, and governance over third-party MCP tools. Source: https://www.credal.ai/ | Directly owns generic agent governance. Aiven should not build generic Credal; build Aiven-specific flight receipts. | T8 A78 P70 |
| Microsoft Entra Agent ID | agent identity | Gives AI agents purpose-built identities, OAuth/MCP/A2A support, lifecycle governance, risk controls, and audit logs. Source: https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id | Identity is becoming platform-level. Hackathon version should simulate agent identity as signed rows and scoped Aiven app users. | T8 A80 P72 |
| Okta for AI Agents | agent identity governance | Discovers/onboards agents, enforces least privilege with short-lived credentials, supports kill switch and full audit trail. Source: https://www.okta.com/products/govern-ai-agent-identity/ | Confirms identity-first framing. Do not build IAM; make agent identity visible in every receipt. | T8 A76 P68 |
| Teleport Agentic Identity | infra identity/access/audit | Treats agents as first-class identities; emphasizes no standing privileges, JIT access, session capture, prompts/queries/tool-call audit. Source: https://goteleport.com/use-cases/agentic-identity-and-access-control/ | Very close for infra trust. Aiven can win by showing the same idea inside a Kafka/Postgres data operator. | T8 A82 P74 |

## Adjacent Matches: Core Data Governance And Lineage Landscape

These are not direct Aiven competitors, but they define what enterprise users expect when agents touch data.

| Tool / Standard | Category | Relevance | Aiven implication |
|---|---|---|---|
| DataHub | open-source metadata/catalog | Modern data catalog for discovery, governance, lineage, profiling, data contracts, ownership, PII. Source: https://docs.datahub.com/docs/features | Do not build a catalog. Build a tiny `data_assets` + `lineage_edges` table and say it can export to DataHub/OpenLineage later. |
| OpenMetadata | open-source catalog/governance | Access control merges RBAC and ABAC; policies based on user, role, and resource attributes. Source: https://docs.open-metadata.org/v1.12.x/how-to-guides/admin-guide/roles-policies | Model the policy gate as ABAC: agent role + action + asset tags + risk. |
| OpenLineage / Marquez | open lineage standard | Tracks metadata about datasets, jobs, and runs; includes open standard, Marquez reference implementation, libraries, integrations. Source: https://openlineage.io/ | Strong future export format. For hackathon, store one lineage event per MCP action or Kafka offset range. |
| Apache Atlas + Ranger | governance metadata + security | Atlas integrates with Ranger for authorization/masking based on classifications like PII/SENSITIVE. Source: https://atlas.apache.org/1.2.0/index.html | Use "classification travels to policy" as a demo concept; do not run Atlas/Ranger. |
| Apache Ranger | centralized policy/audit | Supports policies, row filters, masking, classification-based access, APIs, and centralized audit logs across services including Kafka. Source: https://ranger.apache.org/blogs/policy_model.html | Useful pattern for topic/table authorization. Too heavy to include. |
| OPA / Rego | policy-as-code | General policy engine that decouples policy decision-making from enforcement and evaluates structured input. Source: https://www.openpolicyagent.org/docs | Best hackathon policy gate. A small Rego policy can allow low-risk Kafka topic creation but require approval for production writes. |
| Cedar / AWS Verified Permissions | fine-grained authorization | Externalizes authorization, centralizes policy management, supports least privilege and audit. Source: https://aws.amazon.com/verified-permissions/ | Alternative to OPA; use the concept, not the service. OPA is faster locally. |
| Langfuse / Phoenix / OTel GenAI | LLM/agent tracing | Langfuse captures prompts, responses, tool calls; Phoenix traces model calls, retrieval, tool use; OTel GenAI defines tool attributes. Sources: https://langfuse.com/docs/observability/overview, https://arize.com/docs/phoenix, https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/ | Good for developer debugging, but not enough for compliance. Pair traces with durable Aiven receipts. |

## Crowded Or Already Solved

1. **Enterprise catalog and glossary.** DataHub, OpenMetadata, Collibra, Alation, Atlan, Purview, Snowflake, Databricks, and Google all cover discovery, ownership, business context, and governance.
2. **Full lineage graph.** OpenLineage, Marquez, DataHub, OpenMetadata, Atlas, Databricks, Snowflake, Google, and Atlan cover lineage deeply. A hackathon graph will look shallow.
3. **Generic AI governance registry.** Collibra, Microsoft Purview, and GRC products are better suited to lifecycle assessments, model inventories, and compliance workflows.
4. **Generic agent IAM.** Microsoft Entra Agent ID, Okta, Teleport, Credal, and others are explicitly building agent identity, least privilege, approvals, and audit.
5. **LLM observability.** LangSmith, Langfuse, Phoenix, Datadog, Arize, and OTel cover traces, costs, latency, model calls, retrieval, and tool calls.

## Gaps And Aiven Wedges

| Gap | Why it matters | T | A | P=A-T | Evidence that lowers T |
|---|---|---:|---:|---:|---|
| Aiven-native agent action receipt | Catalog/IAM products govern at platform scale, but judges need a visible receipt for one autonomous Kafka/Postgres action. | 14 | 88 | 74 | Demo shows MCP tool, policy decision, Kafka event, Postgres row, Aiven event/log link in under 60 seconds. |
| Policy gate before MCP write | MCP tools can be destructive; Aiven read-only/scoped modes exist, but the product primitive is "agent asks policy before write." | 16 | 84 | 68 | Local OPA policy blocks one risky action and allows one safe action live. |
| Lineage-lite for agent decisions | Full lineage is crowded; agents still need to cite which topic offsets, SQL rows, and prior receipts drove a decision. | 18 | 80 | 62 | Receipt includes `source_topic`, `offset_range`, `sql_query_hash`, `asset_tags`, and downstream impact. |
| Agent identity that is legible to humans | Aiven application users and Entra/Okta/Teleport prove nonhuman identity matters; hackathon UI can make it obvious. | 14 | 78 | 64 | Each receipt names agent, owner, delegated human, credential mode, and scope. |
| Trust layer for "no-backend" swarm | Delta/Beta/Alpha recommend flight recorder; governance turns it from toy swarm into enterprise data operator. | 16 | 86 | 70 | UI shows both autonomous action and reason it was safe. |
| Audit trails across three planes | Aiven has platform logs and pgAudit; agent frameworks have traces; Kafka has event logs. Few demos tie them together. | 20 | 86 | 66 | One screen joins agent trace, Kafka event, Postgres receipt, and Aiven project/audit log. |
| Governance-aware remediation | Observability agents explain incidents, but production trust requires approvals and rollback evidence. | 18 | 82 | 64 | Agent creates a DLQ/topic/index only after policy allows it and stores rollback instructions. |

## Recommended Primitive: Aiven Trust Kernel

Build a small governance kernel inside the Aiven data operator:

- `agents`: `agent_id`, `owner`, `role`, `allowed_scopes`, `credential_mode`, `status`.
- `assets`: `asset_id`, `type` (`kafka_topic`, `pg_table`, `service`), `owner`, `classification`, `environment`, `retention`, `lineage_uri`.
- `policies`: human-readable policy names plus OPA/Rego snippets or JSON rules.
- `action_requests`: desired MCP call, input summary, target asset, risk level, policy decision, approval state.
- `mcp_receipts`: action id, agent id, user intent, MCP tool, params hash, before/after summary, result, rollback, timestamps.
- `lineage_edges`: source asset, target asset, job/action id, Kafka offset range, SQL hash, created_at.
- Kafka topics: `governance.action.requested`, `governance.policy.decided`, `governance.action.completed`, `governance.action.blocked`, `governance.audit.receipt`.

Minimum live policy examples:

- Allow read-only MCP calls for all demo agents.
- Allow creating a Kafka topic only if `environment != production`, `owner` is set, and `retention_hours <= 168`.
- Require human approval for `aiven_pg_write` on tables tagged `PII`.
- Block `aiven_service_update` or delete actions during pitch.

This is enough to make the operator credible without building Collibra or Okta.

## Three Demo Ideas

### 1. Governed Aiven Data Operator Flight Recorder

One-liner: "Aiven MCP gives the agent keys to Kafka and Postgres; our flight recorder proves every action was scoped, policy-checked, and auditable."

Flow:

1. User asks: "Create a safe real-time checkout incident pipeline."
2. Agent lists Aiven services through MCP in read-only mode.
3. Planner proposes a Kafka topic, Postgres receipt table, and policy gates.
4. Policy agent evaluates the action request.
5. Operator executes one safe MCP write: create/verify topic, produce message, or create a Postgres table.
6. Receipt writer stores the action in Postgres and publishes it to Kafka.
7. UI shows agent identity, policy decision, MCP tool, asset tags, before/after, rollback, and audit links.

Why it scores: deep MCP integration, visible autonomy, and a memorable trust story.  
T/A/P: T18 A90 P72.  
Cuts: no full catalog, no production IAM, no real deletion/scaling, no complex approvals UI.

### 2. PII Firewall For Agentic SQL

One-liner: "The agent can query production-like data, but it cannot cross a PII boundary without a receipt and approval."

Flow:

1. Seed Postgres with `orders`, `customers`, and `payments`; tag `customers.email` as PII in a simple catalog table.
2. User asks the agent to investigate revenue drop.
3. Agent proposes SQL that joins orders to customer emails.
4. Policy gate blocks the raw PII query and suggests an aggregate-safe query.
5. Agent runs the safe read through Aiven MCP, stores query hash/results, and writes a receipt.
6. UI shows blocked unsafe path versus approved safe path.

Why it scores: makes access control obvious to non-infra judges and turns "agent with DB keys" into a visual product moment.  
T/A/P: T20 A82 P62.  
Cuts: no real DLP scanner, no column-level database policy enforcement beyond the demo gate, no broad SQL copilot.

### 3. Kafka Topic Governance Autopilot

One-liner: "Agents can create Kafka topics, but every topic gets an owner, retention policy, classification, lineage, and four-eyes approval when risk is high."

Flow:

1. User asks for a new `bad_orders_dlq` during a live incident.
2. Agent reads Kafka topic state through Aiven MCP.
3. Policy checks topic name, owner, retention, environment, classification.
4. Low-risk topic is created live; high-risk topic would require approval.
5. Receipt is published to `governance.audit.receipt`; topic appears in a topic catalog panel.
6. Downstream report shows lineage from `orders.raw` -> `bad_orders_dlq` -> `incident_report`.

Why it scores: Aiven Kafka governance already talks about ownership, four-eyes approval, catalog, RBAC, audit. This is the agent-native version.  
T/A/P: T16 A84 P68.  
Cuts: no complete Kafka governance portal, no ACL management unless already easy, no real enterprise multi-team workflow.

## Best Expected Value

Pick Demo 1 as the main trunk and borrow one moment from Demo 2 or 3 depending on sponsor feedback.

Best pitch sentence:

> "Aiven MCP lets agents operate the data layer directly. We make that safe enough to demo: every Kafka/Postgres action is scoped, policy-checked, lineage-aware, and written as a receipt."

First-minute target:

1. Show agent identity and allowed Aiven MCP scopes.
2. Trigger a live Kafka/Postgres action.
3. Policy gate allows or blocks it.
4. Aiven MCP tool call runs.
5. Kafka receipt event and Postgres receipt row appear.
6. Presenter expands "why trusted" and shows owner, policy, tool, asset, lineage, rollback.

This keeps governance visible and sponsor-native without losing demo momentum.

## What To Cut

- Cut full data catalog UI. One asset table with tags and owner is enough.
- Cut full lineage graph. Show a 3-node lineage strip with Kafka offsets and SQL hash.
- Cut regulatory compliance workflows. Mention NIST/AI governance as future mapping only.
- Cut IAM integration. Use Aiven app user/scoped token/read-only mode and visible simulated identity.
- Cut building a generic MCP gateway. The sponsor wants Aiven MCP depth.
- Cut live destructive actions: delete service/topic/table, broad writes, plan scaling.
- Cut broad policy languages comparison. Use OPA-style policy if implementation needs a real gate.
- Cut LLM observability dashboards unless already available. Receipts are the judge-facing trace.
- Cut OpenSearch dependency unless needed for Aiven pgAudit visualization and already stable.
- Cut "trust score." Use explicit receipts; reductive scores invite arguments.

## Source Index

- Aiven MCP server: https://github.com/aiven-open/mcp-aiven
- Aiven roles and permissions: https://aiven.io/docs/platform/concepts/permissions
- Aiven application users: https://aiven.io/docs/platform/howto/manage-application-users
- Aiven organization logs: https://aiven.io/docs/platform/howto/view-organization-logs
- Aiven Kafka governance: https://aiven.io/docs/products/kafka/concepts/governance-overview
- Aiven PostgreSQL audit logging: https://aiven.io/docs/products/postgresql/concepts/pg-audit-logging
- MCP tools spec: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- Google Cloud MCP read/write controls: https://docs.cloud.google.com/mcp/prevent-read-write-tool-use
- OWASP Agentic AI threats: https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- DataHub: https://docs.datahub.com/docs/features
- OpenMetadata roles/policies: https://docs.open-metadata.org/v1.12.x/how-to-guides/admin-guide/roles-policies
- OpenLineage: https://openlineage.io/
- Apache Atlas: https://atlas.apache.org/1.2.0/index.html
- Apache Ranger policy model: https://ranger.apache.org/blogs/policy_model.html
- Open Policy Agent: https://www.openpolicyagent.org/docs
- Amazon Verified Permissions / Cedar: https://aws.amazon.com/verified-permissions/
- Databricks Unity Catalog: https://docs.databricks.com/aws/en/data-governance/unity-catalog/
- Databricks agent governance: https://www.databricks.com/blog/governing-ai-agents-scale-unity-catalog
- Snowflake Horizon Catalog: https://docs.snowflake.com/en/user-guide/snowflake-horizon
- Microsoft Purview AI protections: https://learn.microsoft.com/en-us/purview/ai-microsoft-purview
- Google Knowledge Catalog: https://docs.cloud.google.com/dataplex/docs/introduction
- Google Knowledge Catalog lineage release notes: https://docs.cloud.google.com/dataplex/docs/release-notes
- Collibra AI Governance: https://productresources.collibra.com/docs/collibra/latest/Content/AIGovernance/co_about-ai-governance.htm
- Alation Agentic Data Intelligence Platform: https://www.alation.com/product/agentic-data-intelligence-platform/
- Atlan Active Data Governance: https://atlan.com/active-data-governance/
- Credal: https://www.credal.ai/
- Microsoft Entra Agent ID: https://learn.microsoft.com/en-us/entra/agent-id/what-is-microsoft-entra-agent-id
- Okta for AI Agents: https://www.okta.com/products/govern-ai-agent-identity/
- Teleport Agentic Identity: https://goteleport.com/use-cases/agentic-identity-and-access-control/
- Langfuse observability: https://langfuse.com/docs/observability/overview
- Arize Phoenix: https://arize.com/docs/phoenix
- OpenTelemetry GenAI attributes: https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/
