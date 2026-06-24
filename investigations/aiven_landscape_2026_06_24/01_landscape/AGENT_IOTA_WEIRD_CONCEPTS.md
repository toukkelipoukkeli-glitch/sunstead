# Agent Iota: Weird Concepts and Prior Art

> Date: 2026-06-24  
> Mission: Aiven Autonomous Data Operator landscape  
> Navigator position: emerging and exploring, now aligned enough to ground hackathon cuts.  
> Scope: self-driving databases, data operating systems, agent marketplaces, synthetic companies, digital twin ops rooms, autonomous business processes, and agent swarms running real infrastructure.

## Hackathon Frame

Detected type: `sponsor-needs` challenge with an open-ended creative wrapper. The primary scoring mode is technical/product hybrid: Aiven judges score 34% depth of MCP integration, 33% workflow autonomy, and 33% creativity/impact.

Judging/submission mode: Aiven partner selection into top 3, then 4 minute live pitch plus 1 minute Q&A. The demo needs visible Aiven MCP/Kafka/Postgres action in the first minute, not just a wild concept.

Chosen target track: Aiven main challenge. Preserve optional side wrappers only if legal and zero-distraction; do not let agent-marketplace or synthetic-company scope become a second project.

Core demo flow Iota optimizes for: **a data infrastructure digital twin ops room** where a small swarm sees the live Aiven data plane, coordinates over Kafka, uses Postgres as memory/receipt storage, and executes or stages safe MCP actions with a visible flight recorder.

Intentionally cut: full synthetic company, real agent payments, 3D industrial twin clone, production-grade marketplace, autonomous delete/scale actions during pitch, and any idea where Aiven MCP is hidden behind a normal backend.

Unknowns to flag before large implementation: who is presenting, whether Aiven mentors prefer "operator" over "weird simulation," exact Aiven MCP tool availability for Kafka metrics/config, whether live provisioning is safe under venue wifi, and whether multi-track submission is legal.

## Executive Read

The weird territory is real, not science fiction. Oracle and CMU have long-standing self-driving database work; DBOS argues the database can become the operating system; Palantir/DataOS/Cognite frame data platforms as operational control layers; Salesforce and ServiceNow are turning agents into marketplace goods; SAP, UiPath, Microsoft, and Siemens are moving from copilots to autonomous process agents; Cloudflare and AWS are packaging durable agent runtimes; Sedai and Phaidra claim real autonomous infrastructure control; Skyfire/x402/PayPal/Mastercard are building agent payment rails.

The hackathon opportunity is not to out-weird them. It is to **compress the weird future into a legible Aiven-native object**:

> A small ops room where agents run a live data-plane twin, coordinate through Aiven Kafka, remember and audit through Aiven Postgres, and use Aiven MCP as the only control surface.

This is high-amplitude because it hints at an "agent-run data operating system." It is demoable because it reduces to one incident, one topology, one safe MCP write, and one receipt timeline.

## Surprising Concepts

### 1. The "self-driving database" is not new

Oracle's Autonomous AI Database claims autonomous lifecycle operation from placement to backup/update/tuning, while CMU's NoisePage/Peloton line treats true self-driving DBMS design as an architecture problem with integrated planning, workload prediction, behavior models, and action selection.

Implication for Aiven: do not pitch "we invented the self-driving database." Pitch **self-driving data operations across managed open-source services**. The new thing is not tuning one DBMS. It is a swarm controlling Postgres, Kafka, state, memory, and receipts through MCP.

Sources: [Oracle Autonomous AI Database docs](https://docs.oracle.com/en/cloud/paas/autonomous-database/index.html), [CMU NoisePage](https://db.cs.cmu.edu/projects/noisepage/), [CMU Peloton](https://db.cs.cmu.edu/projects/peloton/).

T/A/P: `T8 A82 P74`. Cold prior art; high amplitude because judges may love the phrase but it must be reframed.

### 2. DBOS flips the stack: the database becomes the operating system

DBOS argues that a distributed transactional DBMS can be the basis for scheduling, file management, IPC, provenance, and analytics. That is more radical than "database stores app rows." It says system state itself should be queryable tables.

Implication for Aiven: "Aiven as the data operating system for agents" is a strong phrase if grounded. Postgres stores durable work state/receipts; Kafka is IPC/event bus; MCP is syscalls; agents are processes; the UI is `top`/Activity Monitor for the data plane.

Source: [DBOS: A DBMS-oriented Operating System](https://vldb.org/pvldb/vol15/p21-skiadopoulos.pdf).

T/A/P: `T14 A90 P76`. Strong conceptual bridge; implementation should stay small.

### 3. Enterprise data operating systems already model nouns, verbs, and permissions

Palantir's AIP architecture describes the Ontology as a unified representation of data, logic, action, and security for humans and agents. The Modern Data Company's DataOS explicitly uses the OS metaphor for shared context, governance, and data products. Cognite does the industrial version with contextualized operational data and digital twins.

Implication for Aiven: a broad "enterprise operating system" clone is impossible. But a **mini data-plane ontology** is feasible: services, topics, tables, incidents, agents, actions, approvals, rollback plans.

Sources: [Palantir AIP architecture](https://www.palantir.com/docs/foundry/architecture-center/aip-architecture), [Palantir Ontology system](https://palantir.com/docs/foundry/architecture-center/ontology-system/), [DataOS](https://www.themoderndatacompany.com/), [Cognite industrial digital twin](https://www.cognite.com/en/industrial-digital-twin).

T/A/P: `T18 A88 P70`. High leverage if reduced to data infra objects, not enterprise ontology theater.

### 4. Agent marketplaces are becoming infrastructure, not app stores

Salesforce AgentExchange says it includes agents, sub-agents, tools, and MCP servers inside Agentforce Builder. ServiceNow has a store surface for AI agents. OpenAI's GPT Store normalized discoverable task-specific agents, even if it is not an enterprise control plane.

Implication for Aiven: do not build a marketplace. Borrow the pattern: a tiny **data operator catalog** with 4 specialists: Kafka Doctor, Postgres Steward, Cost Guard, Receipt Auditor. "Install" means publishing an activation event to Kafka and registering capabilities in Postgres.

Sources: [Salesforce AgentExchange](https://www.salesforce.com/agentforce/agentexchange/), [AgentExchange marketplace](https://agentexchange.salesforce.com/), [OpenAI GPT Store](https://openai.com/index/introducing-the-gpt-store/), [ServiceNow AI marketplace](https://store.servicenow.com/store/ai-marketplace).

T/A/P: `T16 A76 P60`. Real market signal, but full marketplace is a scope trap.

### 5. Synthetic companies work as metaphor but fail as product scope

ChatDev and MetaGPT model a software company as specialized agents with roles and SOPs. TheAgentCompany benchmark goes further: agents perform real workplace tasks in a simulated software company with web, code, programs, and coworkers. The benchmark is a useful reality check: even strong agents only complete a minority of long-horizon office tasks autonomously.

Implication for Aiven: a "synthetic company" should be a wrapper, not the product. Use a synthetic ops team that runs one data incident. Do not make CEO/CFO/HR agents unless they directly touch Kafka/Postgres/MCP.

Sources: [ChatDev paper](https://arxiv.org/html/2307.07924v5), [ChatDev GitHub](https://github.com/OpenBMB/ChatDev), [MetaGPT OpenReview](https://openreview.net/forum?id=VtmBAGCN7o), [MetaGPT GitHub](https://github.com/foundationagents/metagpt), [TheAgentCompany paper](https://arxiv.org/html/2412.14161v1), [TheAgentCompany GitHub](https://github.com/TheAgentCompany/TheAgentCompany).

T/A/P: `T18 A80 P62`. Great demo language; dangerous if it turns into roleplay.

### 6. Digital twin ops rooms are the visual language for autonomous infrastructure

Azure Digital Twins models full environments such as factories, farms, railways, stadiums, and cities. NVIDIA Omniverse positions digital twins and simulation as callable agentic workflows for physical AI. Siemens is moving Industrial Copilot from query assistant toward orchestrated AI agents that execute processes. Palantir Foundry Digital Twin and Cognite are enterprise/industrial versions.

Implication for Aiven: build the **data infrastructure twin**, not a 3D factory. Show an operational map: Aiven project -> Kafka service -> topics -> consumers -> Postgres -> tables -> agent memories -> receipts. The twin updates as agents act.

Sources: [Azure Digital Twins](https://learn.microsoft.com/en-us/azure/digital-twins/overview), [NVIDIA Omniverse](https://www.nvidia.com/en-us/omniverse/), [NVIDIA Omniverse DSX Blueprint](https://build.nvidia.com/nvidia/omniverse-dsx-blueprint-for-ai-factories), [Siemens industrial AI agents](https://press.siemens.com/global/en/pressrelease/siemens-introduces-ai-agents-industrial-automation), [Palantir Digital Twin](https://www.palantir.com/platforms/foundry/digital-twin/).

T/A/P: `T22 A92 P70`. Best weird-to-demo bridge if kept 2D and data-native.

### 7. Autonomous business processes are now vendor roadmaps

SAP introduced "Autonomous Enterprise" at Sapphire 2026; Joule Agents automate business workflows at scale. UiPath calls the new category agentic automation, where agents plan and decide rather than only follow fixed RPA scripts. Microsoft Copilot Studio lets teams build and manage agents against business data.

Implication for Aiven: "autonomous workflow" alone is not novel. The Aiven wedge is that the workflow operates the **data substrate itself**: provisioning/checking topics, writing memory, querying data, staging remediation.

Sources: [SAP Autonomous Enterprise](https://news.sap.com/2026/05/sap-sapphire-sap-unveils-autonomous-enterprise/), [SAP Joule Agents](https://www.sap.com/products/artificial-intelligence/ai-agents.html), [UiPath agentic automation](https://www.uipath.com/automation/agentic-automation), [Microsoft Copilot Studio](https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio).

T/A/P: `T12 A78 P66`. Crowded category; still validates sponsor language.

### 8. Real infrastructure autonomy exists, but it is narrow and guarded

Sedai markets a self-driving cloud that starts in Copilot mode and shifts to Autopilot after users trust it. Phaidra sells AI agents for AI factories, especially power/cooling/workload management. Cloudflare Agents gives each hosted agent durable identity, local SQL state, scheduling, recovery, tools, MCP, and payments. AWS Bedrock AgentCore packages runtime, identity, memory, gateway, browser, code, and observability.

Implication for Aiven: safe autonomy is credible if the demo shows modes: `observe`, `recommend`, `approve-required`, `auto-safe`. Do not imply agents should freely mutate production.

Sources: [Sedai](https://sedai.io/), [Phaidra](https://www.phaidra.ai/), [Cloudflare Agents](https://developers.cloudflare.com/agents/), [AWS Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/).

T/A/P: `T14 A86 P72`. Strong proof that "agents running infrastructure" is a real category.

### 9. Agent payments are real enough to inspire budgets, too weird for the core

Cloudflare and Coinbase launched x402 Foundation work and Cloudflare supports x402 in Agents SDK/MCP integrations. Skyfire markets identity/payments for autonomous AI agents and agent-to-agent commerce. PayPal and Mastercard are building agentic commerce rails.

Implication for Aiven: no real payments. Simulate a **risk/cost budget** in Postgres: each agent spends credits to call expensive MCP actions, run analysis, or request approval. This makes autonomy governable and visible without crypto/payment risk.

Sources: [Cloudflare x402](https://blog.cloudflare.com/x402/), [Skyfire](https://skyfire.xyz/skyfire-launches-identity-and-payments-for-autonomous-ai-agents/), [PayPal agentic commerce](https://www.paypal.ai/), [Mastercard Agent Pay](https://www.mastercard.com/us/en/news-and-trends/press/2026/june/mastercard-launches-agent-pay-for-machines.html).

T/A/P: `T26 A74 P48`. Memorable but dangerous for pitch focus.

### 10. Self-driving labs provide the cleanest closed-loop pattern

Self-driving labs run closed loops: propose experiment -> execute with automation -> measure -> update model -> choose next experiment. Argonne, ORNL, and academic reviews frame this as autonomous discovery.

Implication for Aiven: use "self-driving lab" as a pattern for data operations. The operator can run remediation in a sandbox/data twin first, compare evidence, then apply a safe action.

Sources: [ORNL Autonomous Science](https://www.ornl.gov/autonomousscience), [Argonne Autonomous Discovery](https://www.anl.gov/autonomous-discovery), [self-driving lab review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12368842/).

T/A/P: `T24 A82 P58`. Good abstraction, but do not make the demo about science.

## Existing Work Map

| Territory | Existing work | Match to Aiven challenge | Iota read |
| --- | --- | --- | --- |
| Self-driving database | [Oracle Autonomous AI Database](https://docs.oracle.com/en/cloud/paas/autonomous-database/index.html), [CMU NoisePage](https://db.cs.cmu.edu/projects/noisepage/), [Peloton](https://db.cs.cmu.edu/projects/peloton/) | Adjacent/prior art | Avoid claiming novelty on autonomous DB internals. |
| Database as OS | [DBOS paper](https://vldb.org/pvldb/vol15/p21-skiadopoulos.pdf), [DBOS intro](https://dbos-project.github.io/blog/intro-blog.html) | Strong conceptual bridge | Use Postgres/Kafka/MCP as OS metaphor. |
| Data operating system | [Palantir AIP](https://palantir.com/docs/foundry/aip/overview/), [Palantir Ontology](https://palantir.com/docs/foundry/architecture-center/ontology-system/), [DataOS](https://www.themoderndatacompany.com/) | Adjacent enterprise | Build tiny data-plane ontology only. |
| Industrial digital twin | [Azure Digital Twins](https://learn.microsoft.com/en-us/azure/digital-twins/overview), [NVIDIA Omniverse](https://www.nvidia.com/en-us/omniverse/), [Cognite](https://www.cognite.com/en/industrial-digital-twin), [Siemens agents](https://press.siemens.com/global/en/pressrelease/siemens-introduces-ai-agents-industrial-automation) | Visual adjacent | Translate into Aiven data twin, not 3D factory. |
| Agent marketplace | [Salesforce AgentExchange](https://www.salesforce.com/agentforce/agentexchange/), [OpenAI GPT Store](https://openai.com/index/introducing-the-gpt-store/), [ServiceNow Store](https://store.servicenow.com/store/ai-marketplace) | Adjacent distribution pattern | Use tiny specialist catalog, not marketplace. |
| Synthetic company | [ChatDev](https://github.com/OpenBMB/ChatDev), [MetaGPT](https://github.com/foundationagents/metagpt), [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany) | Adjacent multi-agent metaphor | Use only for story and roles. |
| Autonomous enterprise processes | [SAP Autonomous Enterprise](https://news.sap.com/2026/05/sap-sapphire-sap-unveils-autonomous-enterprise/), [UiPath agentic automation](https://www.uipath.com/automation/agentic-automation), [Microsoft Copilot Studio](https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio) | Crowded enterprise process layer | Aiven must act on data infra, not business workflow only. |
| Real infra autonomy | [Sedai](https://sedai.io/), [Phaidra](https://www.phaidra.ai/), [Cloudflare Agents](https://developers.cloudflare.com/agents/), [AWS Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/) | Adjacent/exact runtime pattern | Borrow modes, receipts, observability. |
| Agent payments/economy | [Cloudflare x402](https://blog.cloudflare.com/x402/), [Skyfire](https://skyfire.xyz/skyfire-launches-identity-and-payments-for-autonomous-ai-agents/), [PayPal Agent Ready](https://www.paypal.ai/) | Too weird for core | Simulate budgets only. |

## Exactly This Challenge vs Adjacent

Exactly challenge-shaped:

- Aiven MCP gives agents a direct data-plane control surface for PostgreSQL and Kafka.
- Kafka as agent-to-agent event bus makes swarm behavior visible.
- Postgres as memory/receipt store makes autonomy inspectable.
- A data-plane ops room can show infrastructure actions, workflow autonomy, and creativity at once.

Adjacent but not enough:

- Oracle/CMU self-driving DBMS: too internal to one DBMS.
- Palantir/DataOS: too broad/enterprise if copied literally.
- Agent marketplace: too much platform distribution, not enough live Aiven action.
- Synthetic company: too much roleplay unless roles operate Kafka/Postgres.
- Digital twin: too visual/infrastructure-heavy if 3D or industrial.
- Agent payments/DAOs: fun but distracts from sponsor rubric.

## What Is Too Weird

| Concept | Why it is too weird for this hackathon | Salvage |
| --- | --- | --- |
| Fully autonomous company with CEO/CFO/SRE agents | Takes too long to explain; judges will ask where Aiven is. | Synthetic ops team for one incident. |
| AI DAO that owns Aiven credits and hires agents | Legal/payment/governance rabbit hole. | Simulated budgets and approval rows. |
| Real agent marketplace with third-party install/ratings | Requires distribution, auth, packaging, trust, docs. | Static specialist catalog with 4 built-in agents. |
| 3D Omniverse-style ops room | High visual cost, low Aiven MCP depth. | 2D data twin topology and live event stream. |
| Autonomous service deletion/plan scaling live | Demo risk and scary safety story. | Safe writes: create topic/table/receipt, dry-run risky changes. |
| Self-modifying schemas without approval | Looks irresponsible with production data. | Proposed migration diff plus approval receipt. |
| Real agent payments or x402 integration | Side quest with fraud/security questions. | Cost budget ledger in Postgres. |
| Broad "autonomous enterprise" pitch | SAP/UiPath/Microsoft already own the phrase. | "Autonomous data operator" for Aiven data plane. |

## Gaps and Weird Wedges

| Gap / wedge | T | A | P=A-T | Why it matters | Evidence that lowers T |
| --- | ---: | ---: | ---: | --- | --- |
| Data infrastructure twin as the demo surface | 22 | 92 | 70 | Digital twin is proven visual language; Aiven can make it data-native with services/topics/tables/actions. | UI shows topology updating from MCP/Kafka/Postgres in under 60 seconds. |
| Aiven as agent data OS | 24 | 90 | 66 | DBOS/DataOS/Palantir validate OS framing; Aiven primitives map cleanly to memory, IPC, syscalls, process table. | Presenter can explain it in one sentence and show actual MCP calls. |
| Specialist agent catalog for data operators | 20 | 76 | 56 | Marketplaces are real; static catalog makes roles legible without building a marketplace. | Four specialists run one flow without extra auth/package work. |
| Closed-loop sandbox before action | 26 | 84 | 58 | Self-driving labs and safe infra autonomy both rely on test/measure/apply loops. | Demo includes dry-run/sandbox result before approved live action. |
| Budgeted autonomy | 28 | 74 | 46 | Agent payments are high-amplitude, but real rails are too much. A cost/risk ledger makes governance concrete. | Budget appears as one Postgres table and influences agent choices. |
| "Synthetic ops company" framing | 24 | 78 | 54 | Fun and memorable, but roleplay can swallow the sponsor story. | Every role has an Aiven object: Kafka inbox, Postgres memory, MCP permission. |

## Five Idea Sparks

### 1. Aiven Data Twin Ops Room

One-liner: "A living digital twin of your Aiven data plane, operated by agents with receipts."

Demo flow:

1. UI shows current Aiven services, Kafka topics, Postgres tables, agents, and incidents as a live topology.
2. A synthetic traffic spike enters Kafka.
3. Detector, Kafka Doctor, Postgres Steward, and Auditor agents publish events to Kafka.
4. Operator agent uses Aiven MCP to inspect Kafka/Postgres state and creates one safe object: topic, table, receipt row, or dry-run remediation.
5. The topology changes and the receipt timeline shows who acted, why, tool, evidence, result, rollback.

Why it is weird enough: it feels like Palantir/NVIDIA/DBOS collapsed into a hackathon-sized data control room.

T/A/P: `T24 A94 P70`.

Cuts: no 3D twin, no real enterprise ontology, no broad observability, no destructive live actions.

### 2. Data Operator App Store

One-liner: "Install specialist data agents into an Aiven project like apps into an operating system."

Demo flow:

1. Presenter selects `Kafka Doctor`, `Postgres Steward`, `Cost Guard`, and `Receipt Auditor` from a tiny catalog.
2. Each agent registers capabilities in Postgres and receives a Kafka inbox topic.
3. The swarm handles one incident; each specialist emits findings and proposed actions.
4. Aiven MCP calls are shown as capabilities rather than hidden backend functions.

Why it is weird enough: it borrows AgentExchange/GPT Store energy but makes Aiven the runtime.

T/A/P: `T28 A82 P54`.

Cuts: no real marketplace, no third-party agents, no billing, no plugin install system.

### 3. Synthetic Data Company

One-liner: "A tiny company of agents runs its data department on Aiven."

Demo flow:

1. The company runs a fake ecommerce flash sale.
2. CEO asks for "keep orders flowing and revenue accurate."
3. Data Engineer agent provisions/checks topics/tables; SRE agent monitors lag; Analyst queries revenue; Auditor writes receipts.
4. A bad event stream causes a KPI anomaly; agents coordinate through Kafka and repair/stage remediation.

Why it is weird enough: ChatDev/TheAgentCompany, but for real data infrastructure instead of software roleplay.

T/A/P: `T30 A80 P50`.

Cuts: no HR/legal/finance agents unless they directly use Kafka/Postgres; no broad office simulation.

### 4. Self-Driving Database Zoo

One-liner: "An operator breeds safe database changes in a sandbox before releasing them to production."

Demo flow:

1. Agent detects slow query or bad stream/table shape.
2. It creates candidate fixes: index, table, topic, retention, dead-letter path.
3. It runs sandbox checks or replays seeded events, then ranks actions by risk/cost/benefit.
4. It applies only the safest action or asks for approval.

Why it is weird enough: it borrows self-driving DB and self-driving lab patterns without needing engine-level tuning.

T/A/P: `T26 A86 P60`.

Cuts: no actual autonomous DBMS internals, no benchmark suite, no unapproved production DDL.

### 5. Agentic Data Economy

One-liner: "Agents have a budget and must spend it wisely to investigate and repair the data plane."

Demo flow:

1. Every MCP call, analysis, and risky action has a simulated cost in Postgres.
2. Agents negotiate over Kafka: spend budget on metrics, SQL query, topic sample, or remediation.
3. The operator chooses the highest expected value action under budget and records the decision.
4. UI shows "agent spent 3 credits to inspect Kafka lag, saved 20 credits by avoiding scale-up."

Why it is weird enough: it hints at x402/Skyfire agent economies while staying safe and Aiven-native.

T/A/P: `T35 A76 P41`.

Cuts: no real payments, no crypto, no external checkout, no claims that agents own money.

## Recommended Weird Direction

Best Iota recommendation: **Aiven Data Twin Ops Room with Flight Recorder receipts**.

Pitch sentence:

> Aiven MCP gives agents the keys to the data plane; our ops room shows the twin, the swarm, and the receipts for every action.

First-minute demo:

1. Show data twin: Aiven Postgres, Kafka, topics, tables, agents.
2. Trigger one stream/data incident.
3. Kafka fills with agent events.
4. Agent calls Aiven MCP to inspect and perform one safe action.
5. Postgres receipt appears with intent, evidence, tool, result, rollback.
6. Twin updates from "at risk" to "guarded/recovered."

Why this is higher EV than the other weird ideas:

- It is visibly creative without becoming abstract.
- It makes Aiven infrastructure the main character.
- It lets the presenter say "digital twin," "self-driving," "agent marketplace," and "data OS" but only implement one coherent flow.
- It harmonizes with Alpha/Beta/Epsilon/Zeta recommendations around flight recorder, Kafka bus, Postgres memory, and safe autonomy.

## Cuts

- Cut generic text-to-SQL and BI chat.
- Cut broad enterprise ontology/data catalog.
- Cut a real app store or agent marketplace.
- Cut external SaaS integrations.
- Cut 3D digital twin and graphics-heavy simulation.
- Cut live service delete, plan scaling, and uncontrolled DDL.
- Cut agent payments, crypto wallets, DAOs, and autonomous purchasing.
- Cut full synthetic company roleplay.
- Cut custom workflow engine internals; Kafka topics plus Postgres task/receipt tables are enough.
- Cut OpenSearch unless Aiven mentor confirms official MCP support and the core flow is already done.
- Cut claims of production-ready autonomy. Say "safe sandbox autonomy with approvals and receipts."

## Source Index

- Aiven MCP docs: https://aiven.io/docs/tools/mcp-server
- Aiven MCP GitHub: https://github.com/aiven-open/mcp-aiven
- Oracle Autonomous AI Database: https://docs.oracle.com/en/cloud/paas/autonomous-database/index.html
- CMU NoisePage: https://db.cs.cmu.edu/projects/noisepage/
- CMU Peloton: https://db.cs.cmu.edu/projects/peloton/
- DBOS paper: https://vldb.org/pvldb/vol15/p21-skiadopoulos.pdf
- DBOS intro: https://dbos-project.github.io/blog/intro-blog.html
- Palantir AIP overview: https://palantir.com/docs/foundry/aip/overview/
- Palantir AIP architecture: https://www.palantir.com/docs/foundry/architecture-center/aip-architecture
- Palantir Ontology: https://palantir.com/docs/foundry/architecture-center/ontology-system/
- Palantir Digital Twin: https://www.palantir.com/platforms/foundry/digital-twin/
- DataOS / Modern Data Company: https://www.themoderndatacompany.com/
- Cognite industrial digital twin: https://www.cognite.com/en/industrial-digital-twin
- Azure Digital Twins: https://learn.microsoft.com/en-us/azure/digital-twins/overview
- NVIDIA Omniverse: https://www.nvidia.com/en-us/omniverse/
- NVIDIA Omniverse DSX Blueprint: https://build.nvidia.com/nvidia/omniverse-dsx-blueprint-for-ai-factories
- Siemens industrial AI agents: https://press.siemens.com/global/en/pressrelease/siemens-introduces-ai-agents-industrial-automation
- Salesforce AgentExchange: https://www.salesforce.com/agentforce/agentexchange/
- AgentExchange marketplace: https://agentexchange.salesforce.com/
- OpenAI GPT Store: https://openai.com/index/introducing-the-gpt-store/
- ServiceNow AI marketplace: https://store.servicenow.com/store/ai-marketplace
- SAP Autonomous Enterprise: https://news.sap.com/2026/05/sap-sapphire-sap-unveils-autonomous-enterprise/
- SAP Joule Agents: https://www.sap.com/products/artificial-intelligence/ai-agents.html
- UiPath agentic automation: https://www.uipath.com/automation/agentic-automation
- Microsoft Copilot Studio: https://www.microsoft.com/en-us/microsoft-365-copilot/microsoft-copilot-studio
- ChatDev paper: https://arxiv.org/html/2307.07924v5
- ChatDev GitHub: https://github.com/OpenBMB/ChatDev
- MetaGPT OpenReview: https://openreview.net/forum?id=VtmBAGCN7o
- MetaGPT GitHub: https://github.com/foundationagents/metagpt
- TheAgentCompany paper: https://arxiv.org/html/2412.14161v1
- TheAgentCompany GitHub: https://github.com/TheAgentCompany/TheAgentCompany
- Cloudflare Agents: https://developers.cloudflare.com/agents/
- AWS Bedrock AgentCore: https://aws.amazon.com/bedrock/agentcore/
- Sedai: https://sedai.io/
- Phaidra: https://www.phaidra.ai/
- Cloudflare x402: https://blog.cloudflare.com/x402/
- Skyfire: https://skyfire.xyz/skyfire-launches-identity-and-payments-for-autonomous-ai-agents/
- PayPal agentic commerce: https://www.paypal.ai/
- Mastercard Agent Pay: https://www.mastercard.com/us/en/news-and-trends/press/2026/june/mastercard-launches-agent-pay-for-machines.html
- ORNL Autonomous Science: https://www.ornl.gov/autonomousscience
- Argonne Autonomous Discovery: https://www.anl.gov/autonomous-discovery
- Self-driving lab review: https://pmc.ncbi.nlm.nih.gov/articles/PMC12368842/
