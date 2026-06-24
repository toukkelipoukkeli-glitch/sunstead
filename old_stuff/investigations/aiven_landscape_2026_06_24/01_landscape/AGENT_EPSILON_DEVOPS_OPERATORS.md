# Agent Epsilon: DevOps/SRE/Infra Operators Landscape

> **Mission:** Aiven Landscape 01 / Agent epsilon  
> **Date checked:** 2026-06-24  
> **Scope:** autonomous DevOps/SRE/infra operators: provisioning, scaling, incident remediation, IaC copilots, self-healing infra, production-runbook agents  
> **Navigator position:** emerging and aligned; market crowding is cold enough to ground cuts, Aiven-specific data-plane operator wedge remains warm.

## Local Frame

- Detected hackathon type: `sponsor-needs` with open-ended creative execution.
- Primary scoring mode: technical/product hybrid, sponsor fit first. Aiven rubric is 34% depth of MCP integration, 33% workflow autonomy, 33% creativity/impact.
- Judging/submission mode: Aiven partner selects finalists; finalists pitch for 4 minutes with 1 minute Q&A.
- Target track: Aiven main challenge, "The Autonomous Data Operator".
- Required sponsor primitive: Aiven MCP visibly managing/querying data infrastructure, especially PostgreSQL, Kafka, service plans/config, metrics/logs, and possibly OpenSearch if stable.
- Core demo flow this scan optimizes for: a production/data-plane incident or provisioning request triggers agents that coordinate through Kafka, retrieve operational memory from PostgreSQL/pgvector, and use Aiven MCP to inspect, configure, provision, or scale managed data services.
- Unknowns still worth flagging before build: presenter and pitch style; live provisioning tolerance; whether Aiven mentors prefer provisioning, Kafka collaboration, Postgres memory, or incident remediation; exact submission constraints.
- Intentionally cut: broad cloud/Kubernetes SRE, generic observability chat, normal runbook dashboards, code-fix PR agents, and invisible backend plumbing that hides Aiven MCP.

## Executive Verdict

Autonomous SRE is no longer a blank space. By mid-2026, cloud providers, observability vendors, incident platforms, Kubernetes startups, and OSS projects all market some version of "AI on-call teammate investigates alerts, finds root cause, suggests or executes remediation." AWS DevOps Agent, Azure SRE Agent, Datadog Bits AI SRE, PagerDuty SRE Agent, Resolve AI, incident.io AI SRE, Cleric, Komodor, New Relic, Better Stack, Metoro, and others make generic incident investigation a crowded lane.

The less crowded wedge is narrower: **an autonomous operator for managed data infrastructure, with Kafka as the agent event bus, PostgreSQL/pgvector as operational memory, and Aiven MCP as the visible control plane.** Most AI SRE products investigate Kubernetes/cloud/app telemetry and then suggest Slack actions, tickets, or code PRs. Few make the data plane itself the product surface: Kafka topics, consumer lag, Postgres slow queries, service plans, migrations, runbook memory, and auditable tool-call receipts.

Winning implication: do not pitch "we built an AI SRE." Pitch **"we built a self-driving data operator: agents read and repair a live data pipeline using Aiven MCP, and every action is visible in Kafka + Postgres receipts."**

## Exact And Near-Exact Matches

These players already cover autonomous incident response, runbook execution, RCA, or infrastructure action. They raise the bar and define what to avoid.

| Player | Match | What it does | Crowding / gap for Aiven |
|---|---|---|---|
| [AWS DevOps Agent](https://aws.amazon.com/devops-agent/) | Exact for autonomous incident response | AWS calls it an autonomous on-call engineer that starts investigating when alerts arrive, performs RCA, and gives resolution actions. | Cloud-provider-native. Aiven cannot win as a generic AWS ops agent; Aiven can win by operating the managed data plane across Kafka/Postgres with open-source service framing. |
| [Azure SRE Agent](https://azure.microsoft.com/en-us/products/sre-agent) / [docs](https://sre.azure.com/docs/overview) | Exact | Diagnoses issues, orchestrates mitigations, optimizes cloud operations, connects to incident platforms, source repos, observability, and MCP connectors. | Strong proof that "MCP-connected SRE agent" exists. Aiven must be more concrete and demo-native: Aiven MCP tool calls should be shown as the incident action, not just connector plumbing. |
| [Datadog Bits AI SRE](https://www.datadoghq.com/blog/bits-ai-sre/) | Exact | Autonomously investigates alerts, reads monitor/runbook context, queries Datadog telemetry, learns from investigations, and can hand code-related causes to a dev agent for PRs. | Observability platforms own telemetry-rich RCA. Aiven should not compete on full-stack observability; focus on data infra decisions Datadog would observe but not own. |
| [PagerDuty SRE Agent](https://www.pagerduty.com/platform/ai-agents/sre/) | Exact | Virtual SRE that detects incidents, correlates observability signals, recommends or executes approved remediations, and learns from incident history. | Incident platforms own escalation/runbook orchestration. Aiven can feed/consume runbook events, but the winning demo should make Kafka/Postgres/Aiven service state central. |
| [Resolve AI](https://resolve.ai/) | Exact | Agents handle on-call, incidents, daily production work, background operational tasks, and can integrate through MCP/API/Skills. | Strong direct competitor for "agents run production." Aiven wedge is not general prod ops; it is managed data-service operations plus agent event streams. |
| [incident.io AI SRE](https://incident.io/ai-sre) | Exact | Markets AI that automates investigation, root cause, and resolution in one incident platform. | The "AI resolves incidents like your best engineer" tagline is already claimed. Avoid generic incident story. |
| [Rootly AI SRE](https://rootly.com/sre/rootly-ai-sre-faster-incident-response-automation) | Exact | Incident platform positioning around triage, RCA, runbooks, and MTTR reduction. | Good competitor for incident lifecycle. Aiven should use incident framing only as a visible wrapper around data-plane autonomy. |
| [Cleric](https://cleric.ai/) | Exact | Self-learning AI SRE with operational memory, stack integrations, read-only by default and write access when ready. | Cleric validates operational memory and staged permissions. Aiven can implement a hackathon-sized version in Postgres/pgvector plus explicit MCP receipts. |
| [New Relic SRE Agent](https://docs.newrelic.com/docs/agentic-ai/sre-agent/overview/) | Exact | On-call teammate that interacts with telemetry and workflows for alert triage, investigation, diagnosis, and remediation. | Another observability-native AI SRE. Aiven should not build a telemetry dashboard clone. |
| [Komodor Klaudia](https://komodor.com/platform/klaudia-ai-powered-troubleshooting/) | Near-exact for Kubernetes | Kubernetes-focused AI SRE for root cause, cascading errors, remediation steps, and automated remediation positioning. | Kubernetes AI SRE is crowded. Avoid "we debug pods." If Kubernetes appears, make it just a traffic generator for Kafka/Postgres. |
| [Metoro AI SRE](https://metoro.io/ai-sre-agent) | Near-exact for Kubernetes + fix PR | Detects Kubernetes regressions, correlates telemetry/code, finds root cause, and opens PRs with evidence and RCA summary. | "RCA to PR" is strong but code-centric. Aiven can use "RCA to Aiven MCP action" instead: scale service, adjust topic, create runbook table, etc. |
| [Better Stack AI SRE](https://betterstack.com/ai-sre) | Exact/adjacent | Slack-native AI SRE using logs, metrics, traces, errors, service maps, MCP server, human approvals, and suggested GitHub PRs. | Has an MCP story. Aiven should show MCP depth beyond observability reads: actual managed data infrastructure actions. |
| [IncidentFox](https://www.incidentfox.ai/) / [OSS repo](https://github.com/incidentfox/incidentfox) | Exact emerging OSS | AI SRE that listens to alerts, investigates autonomously, and delivers actionable fixes; repo positions it as open-source incident investigation. | Open-source pressure means a basic alert investigator is copyable. Need sponsor-specific Aiven action loop. |
| [Wild Moose](https://www.wildmoose.ai/product) | Exact | Specialized AI micro-agents investigate alerts, surface root causes, and suggest fixes. | Shows "multi-agent investigation" is also not enough by itself. Kafka-backed collaboration must be visible, not just internal agent architecture. |
| [NeuBird AI SRE](https://neubird.ai/products/ai-sre/) | Exact | Autonomous production ops: investigate incidents, analyze changes/telemetry, attempt remediation, inspect source code, and learn from outcomes. | Competes on "one agent runs production." Aiven should avoid broad production scope. |

## Adjacent Infra Automation And IaC Copilots

This group is not always incident-response-first, but it owns provisioning, IaC, self-service infra, drift, and agent-safe platform control.

| Player / project | Match | What it does | Aiven implication |
|---|---|---|---|
| [Pulumi Neo](https://www.pulumi.com/product/neo/) | Exact for AI infra agent | AI platform engineer for cloud infrastructure provisioning, governance, and optimization with enterprise controls. | Natural-language infra provisioning is crowded. Do not make "agent writes IaC" the only trick. |
| [Spacelift Intent](https://docs.spacelift.io/concepts/intent) / [OSS](https://github.com/spacelift-io/spacelift-intent) | Very close to Aiven MCP shape | MCP server lets Claude Code-like clients provision/manage infra from natural language under policies, state, permissions, and audit trail; OSS version calls provider APIs without Terraform/OpenTofu code. | This is the closest provisioning-control-plane pattern. Aiven can still differentiate by using first-party managed data services plus Kafka/Postgres runtime state. |
| [Terraform MCP Server](https://developer.hashicorp.com/terraform/mcp-server) / [GitHub](https://github.com/hashicorp/terraform-mcp-server) | Adjacent IaC copilot | Gives AI assistants current Terraform Registry/provider/module/policy context and HCP Terraform operations. | IaC copilots reduce hallucination, but the Aiven challenge wants native Aiven MCP action and data-plane autonomy, not just generated HCL. |
| [HashiCorp Agent Skills](https://www.hashicorp.com/en/blog/introducing-hashicorp-agent-skills) | Adjacent | Claude Code plugins/skills for Terraform and Packer best practices, module/provider development, and tests. | Competes with "agent knows Terraform." Cut Terraform unless needed as a fallback receipt. |
| [Firefly](https://www.firefly.ai/) | Adjacent, strong for drift/recovery | Cloud resilience platform around IaC, drift remediation, AI remediation, and infrastructure recovery from outages/cyberattacks. | Strong evidence that drift/recovery is commercialized. Aiven could do a tiny "data infra drift fixer" demo, but not broad CRPM. |
| [Brainboard](https://www.brainboard.co/) | Adjacent | Visual cloud infra design, Terraform/OpenTofu modules, GitOps, drift detection/remediation. | Visual IaC design is not the Aiven wedge. |
| [StackGen](https://stackgen.com/) | Adjacent | Autonomous operations/generative infrastructure; visual designs into Terraform/HCP workflows. | Avoid generic "visual app stack to Terraform." |
| [Humanitec Platform Orchestrator](https://humanitec.com/products/platform-orchestrator) | Adjacent, important guardrail pattern | Lets AI agents provision infrastructure within platform-defined rules; progressive rollouts reduce blast radius. | Borrow guardrail framing: read-only, plan, approve, apply, rollback. Do not build a full IDP. |
| [Qovery](https://www.qovery.com/) | Adjacent | "Agentic infrastructure platform" unifying CI/CD, Kubernetes, Terraform, secrets, monitoring behind one API for agents. | Confirms that agent-facing infra APIs are a 2026 category. Aiven's narrower API can be more demoable. |
| [Port](https://www.port.io/) | Adjacent | Agentic SDLC platform with context lake, workflow orchestration, agent management, governance; supports self-service actions. | A broad developer portal would dilute the demo. Use only the concept of action status/receipts. |
| [Kubiya](https://www.kubiya.ai/) | Adjacent/exact DevOps teammate | AI-driven engineering organization that plans, builds, operates, and measures work; strong DevOps automation branding. | Do not build an "AI DevOps teammate" dashboard. Show one concrete Aiven data-ops teammate. |
| [Massdriver](https://massdriver.cloud/) | Adjacent | Platform orchestrator/developer portal for self-service infrastructure and controlled IaC adoption. | Useful if the final idea is "agent-safe golden path," but too broad for this Aiven demo. |

## OSS And Automation Primitives

These are the substrate. They show that autoscaling, operators, runbooks, and event-driven remediation are already established without LLMs.

| Project | Match | What it does | Aiven implication |
|---|---|---|---|
| [HolmesGPT](https://github.com/HolmesGPT/holmesgpt) | Strong OSS AI SRE | CNCF Sandbox open-source agent for investigating production incidents and finding root causes across Kubernetes, VMs, cloud providers, databases, and SaaS. | Very relevant if we need an OSS reference for agentic investigation. But a HolmesGPT clone is not enough. |
| [K8sGPT](https://k8sgpt.ai/) / [operator](https://github.com/k8sgpt-ai/k8sgpt-operator) | OSS Kubernetes diagnostics | AI-powered Kubernetes issue diagnosis, automated troubleshooting, and in-cluster operator workflows. | Avoid Kubernetes-only diagnosis. Use it as a contrast: Aiven operator is for managed data services. |
| [StackStorm](https://stackstorm.com/) / [GitHub](https://github.com/stackstorm/st2) | Classic auto-remediation | Event-driven automation for auto-remediation, incident response, troubleshooting, deployments, ChatOps, and thousands of actions. | Runbook execution is old. The novelty must be agent planning + Aiven MCP + data-plane memory, not "run script after alert." |
| [Rundeck / PagerDuty Runbook Automation](https://www.pagerduty.com/integrations/rundeck-runbook-automation/) | Classic runbook automation | Automated jobs diagnose and resolve incidents using existing tools, scripts, APIs, and manual procedures. | Same cut: runbooks alone are not a winning demo. |
| [FireHydrant Runbooks](https://firehydrant.com/runbooks/) | Incident runbook automation | Dynamic runbooks trigger manually or automatically based on incident details, severity, or service impact. | Aiven demo should have a runbook, but the runbook should be generated/read from Postgres and executed through Aiven MCP. |
| [KEDA](https://keda.sh/) | Scaling primitive | Kubernetes event-driven autoscaler, scaling containers based on event backlog. | Kafka backlog scaling is solved at app layer. Aiven can instead scale/configure the managed Kafka/Postgres services and show event-to-action. |
| [Karpenter](https://karpenter.sh/) | Scaling/provisioning primitive | Automatically launches right-sized compute resources for Kubernetes workloads. | Compute autoscaling is solved; avoid node autoscaler story. |
| [Crossplane](https://www.crossplane.io/) | Declarative infra control plane | Lets teams expose declarative APIs for resources that humans, automation, and AI systems can safely act on. | Strong conceptual neighbor: Aiven MCP can be the hackathon-scale "AI-safe data control plane." |
| [Kubernetes Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) | Self-healing pattern | Custom resources + controllers reconcile desired state through control loops. | If we use "operator" language, show how the agent differs: it reasons, consults memory, and uses Aiven MCP, while still emitting receipts. |

## What Is Already Solved Or Crowded

- **Generic AI SRE alert investigation:** AWS, Azure, Datadog, PagerDuty, Resolve, incident.io, Cleric, New Relic, Better Stack, Metoro, IncidentFox, and others already claim autonomous RCA or on-call teammate workflows.
- **Kubernetes troubleshooting:** Komodor, Metoro, K8sGPT, HolmesGPT, Robusta, Devtron-style AI SRE, and many OSS experiments crowd pod/event/log diagnosis.
- **Runbook automation:** StackStorm, Rundeck, PagerDuty, FireHydrant, ServiceNow, and incident platforms have mature "trigger workflow from incident" patterns.
- **IaC copilots / natural-language provisioning:** Pulumi Neo, Spacelift Intent, Terraform MCP, HashiCorp Agent Skills, Brainboard, StackGen, Firefly, Humanitec, and Qovery already cover much of "describe infra, get provisioned resources."
- **Autoscaling/self-healing primitives:** Kubernetes, KEDA, Karpenter, HPAs, operators, cloud autoscalers, and managed service features cover deterministic scaling loops.
- **Code-fix PR remediation:** Datadog Bits + Dev Agent, Metoro, Better Stack, and coding agents push incidents toward GitHub PRs. This is adjacent to Tangled-style code agents, not the Aiven data operator sweet spot.

## Gaps And Aiven Wedges

### 1. Data-plane SRE is less visibly owned than app/Kubernetes SRE

Most AI SRE products reason across logs, traces, code, deployments, and Kubernetes. Aiven can make the managed data plane first-class: Kafka lag, topic partitions, retention, consumer groups, schema/backfill events, Postgres slow queries, index recommendations, connection saturation, service plans, backups, and data-product runbooks.

**Wedge:** "AI SREs tell you why the app is down. Aiven Data Operator fixes the data infrastructure the app depends on."

### 2. Kafka can be the agent bus, not just an observed workload

Competitors usually route incident collaboration through Slack, Teams, PagerDuty, Jira, or internal queues. Aiven can make Kafka visible as the swarm substrate: alert events, hypotheses, approvals, tool-call receipts, rollback commands, and after-action messages all travel through topics judges can inspect.

**Wedge:** show the agent swarm itself running on Aiven Kafka in the first minute.

### 3. PostgreSQL/pgvector can be operational memory with receipts

Cleric/Resolve/PagerDuty talk about operational memory, but it is vendor-owned. A hackathon demo can store incident fingerprints, runbook steps, prior remediations, MCP calls, approval state, and postmortems in Aiven PostgreSQL with pgvector retrieval.

**Wedge:** "This agent learned from the last outage because the runbook memory lives in Aiven Postgres, not in a black-box SaaS."

### 4. MCP action receipts are more demoable than hidden automation

The Aiven MCP docs explicitly support creating/managing services from AI assistants, including PostgreSQL, Kafka, plans, metrics, logs, and service configuration, with read-only or tool-limited modes. The GitHub repo warns the server can create/modify/delete services/data under user permissions. That is perfect for a visible "plan -> approve -> action -> receipt" demo.

**Wedge:** show the MCP call transcript and before/after service state, not a generic "fixed" badge.

### 5. Safe autonomy is a better story than full autonomy

The market is converging on "autonomous but governed": read-only first, approved automation, guardrails, state, permissions, audit trail, progressive rollout. Aiven should embrace this.

**Wedge:** agent classifies actions as `observe`, `recommend`, `approve-required`, or `auto-safe`; only low-risk data-plane actions auto-apply.

## 3 Aiven Demo Ideas

### Idea 1: Kafka Lag Autopilot

One-sentence pitch: **A multi-agent data operator watches a live Kafka pipeline, detects consumer lag, diagnoses the bottleneck, and uses Aiven MCP to create/configure the recovery path while logging every decision in PostgreSQL.**

Demo flow:

1. Seed an e-commerce order stream in Aiven Kafka and a Postgres table for order state/runbook memory.
2. Break the pipeline: spike events, pause a consumer, or introduce poison messages.
3. Detector agent publishes `incident.opened` to Kafka.
4. Diagnoser agent reads Kafka metrics/logs via Aiven MCP, queries Postgres for prior incidents, and posts hypotheses to Kafka.
5. Planner agent proposes a concrete data-plane action: create a dead-letter topic, adjust retention/partitions if available, scale service plan if safe, or create a compensating consumer/backfill job.
6. Operator agent executes one visible Aiven MCP action after approval and writes a receipt to Postgres.
7. UI shows lag falling, Kafka event trail, Postgres incident memory, and MCP call receipt.

Why it scores:

- MCP depth: service/metrics/log/config/topic actions are visible.
- Autonomy: agents detect, diagnose, plan, and execute/ask for approval.
- Creativity/impact: "self-healing Kafka pipeline" is sponsor-native and easier to see than a generic runbook bot.

Risks/cuts:

- Do not rely on live plan scaling if credits/time are risky; use topic/config/query actions live and show seeded "scale plan" path as a dry-run.
- Do not build a full observability stack; use one lag graph and one event ledger.

T/A/P: `T22 A90 P68`. Evidence that lowers T: confirm exact Aiven MCP Kafka topic/config and metrics tools in the hack environment.

### Idea 2: Self-Driving Data Engineer

One-sentence pitch: **A user asks for a resilient real-time data pipeline; agents provision Aiven Postgres + Kafka, create topics/tables, wire runbooks, then survive a simulated failure without backend APIs.**

Demo flow:

1. Prompt: "I need a resilient real-time order pipeline with audit trail and anomaly handling."
2. Architect agent proposes Aiven services, topic names, table schema, and runbook policy.
3. Provisioner agent uses Aiven MCP to create or configure Kafka/Postgres resources.
4. Worker agents publish/read Kafka events and write state to Postgres directly through MCP/SQL.
5. Chaos event triggers a runbook: failed writes, lag spike, or schema mismatch.
6. Operator agent queries state, creates remediation artifact, and stores a postmortem.

Why it scores:

- Very close to Aiven's own "Self-Driving Data Engineer" inspiration, which is good for sponsor fit.
- Strong first-minute sponsor primitive if the agent provisions resources live or convincingly replays MCP receipts.

Risks/cuts:

- It may feel too expected because the challenge brief already suggests it.
- Keep it to one pipeline and one failure. Cut multi-cloud, broad app UI, auth, and full Terraform.

T/A/P: `T18 A82 P64`. Evidence that lowers T: Aiven mentor says provisioning depth matters more than incident novelty.

### Idea 3: Data Runbook Flight Recorder

One-sentence pitch: **An Aiven-native production runbook agent turns every data-infra incident into a Kafka event trail and Postgres memory object, then uses that memory to safely remediate the next incident.**

Demo flow:

1. Show Incident A already stored in Postgres: symptoms, hypotheses, MCP reads, chosen fix, rollback, outcome embedding.
2. Trigger Incident B with a similar signature.
3. Detector publishes alert to Kafka; memory agent retrieves nearest prior incident via pgvector.
4. Planner compares current metrics/logs to the prior case and produces a confidence-rated runbook.
5. Operator uses Aiven MCP in read-only mode first, then asks for approval before a write/scale/config action.
6. After resolution, the flight recorder writes a compact incident passport: who/what/why/action/evidence.

Why it scores:

- More differentiated than generic AI SRE because the product object is the **receipt-backed data runbook memory**.
- Uses Kafka and Postgres as core architecture, not accessories.
- Presenter can explain it fast: "The first outage taught the operator; the second one got fixed with receipts."

Risks/cuts:

- Needs careful UI/story polish; otherwise it can look like logs in a table.
- Cut broad analytics. Make one incident card, one event stream, one memory match, one approved action.

T/A/P: `T24 A92 P68`. Evidence that lowers T: confirm pgvector availability and reliable MCP SQL/query flow.

## Best Current Direction

Best Epsilon recommendation: **Kafka Lag Autopilot with Flight Recorder receipts.**

This combines Idea 1's visual operational drama with Idea 3's differentiated memory/receipt layer. The demo is not "an AI SRE clone"; it is a data-plane operator:

- Kafka carries incident and agent collaboration events.
- PostgreSQL/pgvector stores operational memory and receipts.
- Aiven MCP inspects metrics/logs/config and performs at least one visible managed-service action.
- The UI shows before/after state and a human approval gate for risky actions.

Judge-facing line:

> "Generic AI SREs tell you what went wrong. Our Aiven Data Operator uses Kafka, Postgres, and Aiven MCP to coordinate agents that diagnose and repair the data infrastructure itself, with receipts for every action."

## T/A/P Claims

| Claim | T | A | P | Evidence that lowers T |
|---|---:|---:|---:|---|
| Generic autonomous AI SRE / incident RCA is crowded. | 8 | 92 | 84 | AWS, Azure, Datadog, PagerDuty, Resolve, incident.io, Cleric, New Relic, Better Stack, Metoro, IncidentFox all market direct or near-direct workflows. |
| Kubernetes AI SRE is crowded and not the right Aiven wedge. | 10 | 78 | 68 | Komodor, Metoro, K8sGPT, HolmesGPT, Robusta/Kubernetes tooling cover pod/event/log troubleshooting. |
| Natural-language provisioning/IaC copilots are crowded. | 12 | 82 | 70 | Pulumi Neo, Spacelift Intent, Terraform MCP, HashiCorp Agent Skills, Humanitec, Qovery, Firefly, Brainboard, StackGen. |
| Aiven-specific data-plane operator is meaningfully differentiated. | 24 | 92 | 68 | Competitors focus on cloud/app/Kubernetes/observability; scan found less direct positioning around managed Kafka/Postgres autonomous operators with event-bus collaboration. |
| Kafka as the visible agent bus increases hackathon demo clarity. | 20 | 88 | 68 | Aiven challenge explicitly names Kafka for agent-to-agent collaboration; competitors usually hide orchestration behind Slack/internal queues. |
| Postgres/pgvector operational memory is a strong wedge if shown as receipts. | 22 | 86 | 64 | Cleric/PagerDuty/Resolve validate memory; Aiven can make memory queryable, visible, and sponsor-native. |
| Live destructive infra actions are demo-risky; read-only + approved writes is safer. | 14 | 76 | 62 | Aiven MCP can modify/delete services/data; official repo warns about destructive actions under user permissions. |
| A generic chatbot UI would hurt score. | 8 | 84 | 76 | Rubric rewards MCP depth and autonomy; a chat wrapper hides the sponsor primitive. |

## Explicit Cuts

- Cut generic "AI SRE for all cloud/Kubernetes." Too crowded and too broad.
- Cut full observability platform: no logs/traces dashboard beyond the signals needed for one incident.
- Cut code-fix PR remediation. That competes with Datadog/Metoro/Better Stack/Codex-style agents and weakens Aiven centrality.
- Cut Terraform-first implementation unless needed as a fallback receipt. Aiven MCP should be the primary control plane.
- Cut broad IDP/developer portal features: service catalog, RBAC UI, team ownership, golden paths.
- Cut production auth and multi-tenant governance. Use Aiven permissions and explicit demo approval gates.
- Cut multi-cloud infrastructure orchestration. Aiven-managed services are enough.
- Cut live delete operations. Use read-only inspection, safe topic/table/config creation, or seeded dry-run for risky scale/delete.
- Cut OpenSearch unless the Aiven mentor confirms it is stable and worth showing.
- Cut complex agent framework work. Kafka topics + simple roles are more legible than a hidden orchestration library.

## Source Notes

Primary Aiven sources:

- [Aiven MCP docs](https://aiven.io/docs/tools/mcp-server)
- [Aiven MCP GitHub repo](https://github.com/aiven-open/mcp-aiven)
- [Aiven MCP product page](https://aiven.io/mcp)
- [Aiven Terraform provider docs](https://aiven.io/docs/tools/terraform)

Commercial AI SRE / incident response:

- [AWS DevOps Agent](https://aws.amazon.com/devops-agent/)
- [Azure SRE Agent](https://azure.microsoft.com/en-us/products/sre-agent)
- [Azure SRE Agent docs](https://sre.azure.com/docs/overview)
- [Datadog Bits AI SRE](https://www.datadoghq.com/blog/bits-ai-sre/)
- [PagerDuty SRE Agent](https://www.pagerduty.com/platform/ai-agents/sre/)
- [Resolve AI](https://resolve.ai/)
- [incident.io AI SRE](https://incident.io/ai-sre)
- [Rootly AI SRE](https://rootly.com/sre/rootly-ai-sre-faster-incident-response-automation)
- [Cleric](https://cleric.ai/)
- [New Relic SRE Agent](https://docs.newrelic.com/docs/agentic-ai/sre-agent/overview/)
- [Komodor Klaudia](https://komodor.com/platform/klaudia-ai-powered-troubleshooting/)
- [Metoro AI SRE](https://metoro.io/ai-sre-agent)
- [Better Stack AI SRE](https://betterstack.com/ai-sre)
- [IncidentFox](https://www.incidentfox.ai/)
- [IncidentFox OSS](https://github.com/incidentfox/incidentfox)
- [Wild Moose](https://www.wildmoose.ai/product)
- [NeuBird AI SRE](https://neubird.ai/products/ai-sre/)

Infra/IaC/platform automation:

- [Pulumi Neo](https://www.pulumi.com/product/neo/)
- [Spacelift Intent docs](https://docs.spacelift.io/concepts/intent)
- [Spacelift Intent OSS](https://github.com/spacelift-io/spacelift-intent)
- [Terraform MCP Server](https://developer.hashicorp.com/terraform/mcp-server)
- [HashiCorp Agent Skills](https://www.hashicorp.com/en/blog/introducing-hashicorp-agent-skills)
- [Firefly](https://www.firefly.ai/)
- [Brainboard](https://www.brainboard.co/)
- [StackGen](https://stackgen.com/)
- [Humanitec Platform Orchestrator](https://humanitec.com/products/platform-orchestrator)
- [Qovery](https://www.qovery.com/)
- [Port](https://www.port.io/)
- [Kubiya](https://www.kubiya.ai/)
- [Massdriver](https://massdriver.cloud/)

OSS / automation primitives:

- [HolmesGPT](https://github.com/HolmesGPT/holmesgpt)
- [K8sGPT](https://k8sgpt.ai/)
- [K8sGPT Operator](https://github.com/k8sgpt-ai/k8sgpt-operator)
- [StackStorm](https://stackstorm.com/)
- [StackStorm GitHub](https://github.com/stackstorm/st2)
- [PagerDuty/Rundeck Runbook Automation](https://www.pagerduty.com/integrations/rundeck-runbook-automation/)
- [FireHydrant Runbooks](https://firehydrant.com/runbooks/)
- [KEDA](https://keda.sh/)
- [Karpenter](https://karpenter.sh/)
- [Crossplane](https://www.crossplane.io/)
- [Kubernetes Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
