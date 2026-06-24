# Sunstead Hack — Main Challenges (full detail)

Full briefs for the two **main** challenges, transcribed from the Hacker Dashboard.
Short summaries also live in [SUNSTEAD_HACK.md](SUNSTEAD_HACK.md#challenges).

> Submission window observed open at transcription time (countdown ~T-54:23 → submissions due ~Thu Jun 26).
> Top 3 of each main challenge pitch (4 min pitch + 1 min Q&A), finalists picked by the partners.

---

## 1. The Autonomous Data Operator — Aiven

> Build a multi-agent system that natively controls, streams, or queries open-source data
> infrastructure using the Aiven Model Context Protocol (MCP).

### The Vision
Traditional applications require thousands of lines of backend boilerplate just to let an LLM
talk to a database or a message queue. The Model Context Protocol (MCP) rewrites this playbook.

Using the Aiven MCP Server, AI agents gain direct, native access to the data layer. They can
provision PostgreSQL databases, spin up Apache Kafka streaming clusters, run raw queries, and
trigger event pipelines — all through natural language. Aiven wants to see how powerful agent
swarms can dynamically orchestrate enterprise data systems when handed the keys to the platform.

### The Challenge
Build an agentic system where autonomous workflows interact with and manage data infrastructure
via the Aiven MCP. Instead of writing traditional backend APIs, agents dynamically orchestrate,
stream, and query the underlying infrastructure directly via MCP tool calls.

Bring your own idea — an AI-driven game, an automated DevOps assistant, a live analytics tool —
and use Aiven services as the baseline for the agents' communication, memory storage, and state.

### Your Arsenal — what the Aiven MCP can do
Connect the Aiven MCP URL straight into Cursor, Claude Code, or LangChain to give agents access to:

- **Core Infrastructure Management** — agents spin up, scale, configure, or delete actual cloud
  data services on the fly based on user requirements.
- **PostgreSQL** — execute SQL queries and run similarity searches (pgvector extension); agents
  read and write their own long-term memories and data artifacts.
- **Apache Kafka** — publish messages and listen to live event streams in real time; true
  agent-to-agent collaboration via pub/sub.
- **OpenSearch** *(not 100% confirmed)* — ultra-fast context caching and deep search for complex
  workloads.

### Need inspiration?
1. **The "No-Backend" App Swarm** — an interactive app (multi-agent research agency, live AI
   simulation) where agents bypass middleware and pass tasks via Kafka event streams, storing
   history in PostgreSQL via the Aiven MCP.
2. **The Self-Driving Data Engineer** — an autonomous DevOps/DataOps assistant. User types
   "I need a resilient real-time streaming pipeline for an e-commerce store," and the agent uses
   MCP tools to provision and configure the needed database and Kafka clusters automatically.
3. **The Intelligent Data Detective** — an agent that monitors metrics or live streams; on an
   anomaly or traffic spike it uses the MCP to run analytical DB queries or scale up infra.

### Resources & Support
- **Platform access** — every team gets cloud credits to deploy managed services on Aiven.
  Claim them by creating a new Aiven account.
- **The Bridge** — docs + access to the Aiven MCP Server: <https://aiven.io/docs/tools/mcp-server>
- **On-site mentors** — Aiven experts are on-site to help.
- Company: Aiven — <https://aiven.io/>

### Judging Criteria
| Weight | Criterion | What they ask |
| --- | --- | --- |
| 34% | Depth of MCP Integration | How effectively did agents leverage Aiven MCP tools to achieve their goals? |
| 33% | Workflow Autonomy | Did the system abstract away traditional manual backend coding? |
| 33% | Creativity & Impact | How original, useful, or incredibly cool is the project? |

### Prizes
- **1st** — €1000 + 30K in Aiven credits
- **2nd** — €750 + 30K in Aiven credits
- **3rd** — $30K in Aiven credits

---

## 2. Tools for Builders on Tangled — Tangled

> Build an integration with Tangled, over the AT Protocol, that enhances the open-source experience.

### The Challenge
Tangled is a code platform built natively on the AT Protocol. The API is open, with no (rate)
limits — the most open canvas they know of for the next thing in software: autonomous agents
that review code, co-develop features, and ship pull requests alongside humans. Tangled brings
this to Junction because the participants are exactly the early founders and builders who can
prove what an open, protocol-native developer platform unlocks when agents are first-class
citizens.

Directions they call out:
- **Agentic** — a fully autonomous code-review agent that listens to the firehose and responds to
  incoming pull requests, or an agent that co-develops features alongside you and submits its own PRs.
- **Playful** — a previous community project built a leaderboard tracking who pushes the most code
  to Tangled and sparked a (glorious) push arms race.

The challenge is intentionally open-ended; bring your own idea and let AT Protocol primitives do
the heavy lifting.

### Insight
Most excited by **novel integrations**. Avenues: agents operating autonomously in the code forge —
incoming-PR review off the firehose, or a co-developer agent that opens its own PRs on your repo.
The crux: lean on **AT Protocol primitives for state and ephemerality** instead of reinventing them.

### Resources & Support
- Build with Tangled, the developer platform built on the AT Protocol. Integrations talk to the
  platform directly through the protocol itself — the same way Tangled does.
- Every participant gets **full open access by default**; the platform is open and extensible.
- **Tangled's built-in CI is free** — automated workflows from day one.
- Docs: <https://docs.tangled.org> — friendly to paste into Claude or any LLM.
- **Lewis** (founding engineer) is on-site for protocol questions to architecture feedback.
- Company: Tangled — <https://tangled.org/>

### Judging Criteria
| Weight | Criterion | What they ask |
| --- | --- | --- |
| 99% | How to win | Original and inspiring projects that lean into AT Protocol primitives rather than reinventing infrastructure around them. |
| 1% | Side challenge | The team that pushes the most code to Tangled during the event gets a special shout-out. |

### Prizes
- **1st** — €1024
- **2nd** — €512
- **3rd** — €256

---

## Side challenges (for reference)
- **ElevenLabs** — every participant gets a free month of Creator tier. Give your project a voice.
- **Anthropic** — two days and Claude. Three ways to win.

> Our current build targets the **Tangled** track — see
> [ideas/tangled-evidence-radar/PITCH.md](ideas/tangled-evidence-radar/PITCH.md).
