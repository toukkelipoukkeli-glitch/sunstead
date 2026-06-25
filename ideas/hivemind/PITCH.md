# Hivemind — Pitch

Stage pitch: **4 minutes + 1 minute Q&A.** Judge: **Stanislav Dmitriev**, Product Director,
"Aiven Context" — building "the context layer for Humans and AI", evangelist of "context-maxing",
measured on adoption / MRR. Mirror his language: this **is** a shared context layer for humans and
their AIs, running on a managed streaming + vector backend.

---

## One-sentence pitch

> **Hivemind is a shared, live context layer for AI-assisted teams: it streams every teammate's
> Claude Code session onto Aiven Kafka and remembers it in Aiven Postgres + pgvector, so anyone —
> human or agent — can see who's working on what right now and ask "has someone on the team already
> done this?" and get the answer.**

Backup framing if you only get one breath: *"It's the context layer for a team of humans and their
AIs — built on Aiven."*

---

## The gap (say this so the room knows it's not a clone)

Single-user Claude Code transcript viewers exist. Agent-orchestration ("Claude Code Agent Teams")
exists. What does **not** exist: a **passive, live, cross-laptop shared context layer** plus
**collective semantic recall**, on a **managed streaming + vector backend**. Everyone else reaches
for SQLite, WebSockets, or git. Nobody puts the team's AI activity on **Kafka + pgvector** — which is
exactly where an event log and a memory index belong.

---

## 4-minute stage script (beat by beat)

**Total 4:00. Rehearse to land the live-provisioning moment around 1:30 so Kafka has time to settle.**

### 0:00–0:30 — The pain (mirror the judge)

> "Your team has five people, and now each of them has an AI doing work in parallel. That's ten
> workers — and nine of them are invisible to you. You don't know Aino just spent an hour getting
> Kafka SASL auth working until you burn the same hour tomorrow. The context exists; it's just
> trapped on each laptop, one transcript at a time."

The setup: AI multiplied your team's output and **shattered its shared context**. That's the thing
Stanislav's whole product thesis is about — so name it as a context problem, not a dashboard problem.

### 0:30–1:00 — What Hivemind is

> "Hivemind is a shared live context layer for your AI team. A tiny local watcher tails every
> teammate's Claude Code transcripts, turns each new record into one normalized activity event, and
> puts it on a **team bus**. Every machine subscribes, so everyone sees the whole team's work — live —
> plus a search box that asks the collective memory: *has anyone already done this?*"

Two capabilities, say them plainly: **live presence + feed** (who's doing what now) and **collective
recall** (what has the team already figured out).

### 1:00–1:50 — The hero moment: an agent provisions the backend live

This is the beat the Aiven team loves — show it, don't tell it.

> "Watch this. I have nothing provisioned. I'm going to ask an agent — through the **Aiven MCP** — to
> stand up the backend."

On screen: the agent calls the Aiven MCP, **provisions Aiven for Apache Kafka and Aiven for
PostgreSQL**, and hands back a broker list and a connection string. You apply `aiven/schema.sql`
(events + sessions tables, the `vector(256)` column, the full-text `tsv` index). Flip two env vars —
`HIVEMIND_BUS=kafka`, `HIVEMIND_STORE=postgres` — and restart.

> "No infra ticket, no Terraform, no hand-written backend. The agent abstracted away the entire
> streaming-plus-vector stack I'd otherwise spend the hackathon hand-rolling."

(Have this **pre-warmed and recorded** — Kafka is slow to provision. See "Demo safety" below.)

### 1:50–3:15 — The live demo

1. **Presence (left).** Three teammates light up — Aino, Mikael, Sofia — each a card: project, git
   branch, model, session title, a green dot when active, "12s ago". *"This is the team's live
   context — every AI session, on one screen."*
2. **Feed (center).** Events stream newest-at-bottom, color-coded: prompts, replies, tool calls
   (the tool name is shown — Bash, Edit, Grep). *"This is arriving over Kafka right now — that's the
   stat-bus readout in the footer: `bus: kafka`, `store: postgres`."* Point at it.
3. **Two laptops (the payoff).** Type a prompt into Claude Code on the **second** laptop. It appears
   on the **first** laptop's dashboard a moment later. *"That cross-laptop hop **is** the Kafka
   stream. Nothing else moved that event."*
4. **Collective recall (top).** Type into the search bar: *"has anyone set up Kafka SASL auth?"* Up
   comes Aino's session from earlier — ranked, with a snippet and who/when. *"That's pgvector doing
   semantic recall over the team's whole history. The team stopped solving the same problem twice."*

Keep narration tight; let the screen carry it.

### 3:15–4:00 — Why it wins / close

> "Three things make this real and not a demo trick. One: **Kafka is load-bearing** — the
> cross-laptop sync literally *is* the stream; remove it and the team is back to invisible. Two:
> **pgvector is the team's collective memory** — that's what turns a feed into recall. Three: an
> **agent provisioned the whole backend live** through the Aiven MCP.
>
> This is the context layer for a team of humans and their AIs. It's built on Aiven because this is
> exactly the workload Aiven is for — a managed event log and a managed memory index. Thank you."

---

## Rubric mapping (Aiven challenge: 34 / 33 / 33)

State this explicitly if asked "why does this fit the challenge" — and weave it into the close.

### MCP depth — 34%
- An **agent provisions the team's Aiven Kafka + Postgres backend on the fly via the Aiven MCP** —
  this is the live hero moment, not a slide.
- It's not a cosmetic MCP call: the MCP output (brokers, connection string) is what the running
  product consumes — flip `HIVEMIND_BUS=kafka` / `HIVEMIND_STORE=postgres` and Hivemind binds to the
  freshly-provisioned services. The MCP **abstracts away a backend you'd otherwise hand-write.**

### Workflow autonomy — 33%
- Hivemind is **passive**: nobody changes how they work. The watcher tails
  `~/.claude/projects/**/*.jsonl`; activity flows to the team automatically. Zero new habits.
- The whole pipeline is autonomous end-to-end: transcript record → normalized `ActivityEvent` →
  Kafka topic → every machine's consumer → Postgres (materialized presence + embedded events) → SSE
  dashboard. Provisioning, ingest, sync, and recall all run without a human in the loop.

### Creativity / impact — 33%
- A genuinely **new product category**: a live, cross-laptop *shared context layer* for AI teams +
  collective semantic recall. Not a transcript viewer, not agent orchestration.
- Direct impact: kills duplicated work ("someone already did this"), gives leads live visibility into
  what the team's AIs are doing, and turns scattered transcripts into a queryable team memory.
- The idiomatic backend choice **is** the creativity: team activity is an event log (Kafka) and a
  memory (pgvector). Everyone else uses SQLite/WebSockets/git; this uses the right primitives.

---

## The live-provisioning hero moment (run-book)

1. **Pre-warm before you go on stage.** Provision the Aiven Kafka + Postgres services ahead of time
   (Kafka is slow to come up). For the live beat, either re-run the MCP provisioning against a fresh
   project or demonstrate the agent issuing the calls while the pre-warmed services back the actual
   demo — your call on stage, but never block on a cold Kafka.
2. **Apply the schema** once: `psql "$PG_CONNECTION_STRING" -f aiven/schema.sql` (creates `events`
   with the `vector(256)` column and the generated `tsv` full-text column, plus the `sessions`
   presence table and indexes).
3. **Install the Aiven adapter deps** the lazy path needs: `npm i kafkajs pg` (core runs without
   them; they load only when `busKind=kafka` / `storeKind=postgres`).
4. **Flip env and restart:** `HIVEMIND_BUS=kafka HIVEMIND_STORE=postgres node src/index.ts`. The
   startup banner confirms `bus kafka` / `store postgres`.
5. **Always have the recorded fallback queued** (screen recording of the provision + the two-laptop
   sync). If anything stalls on stage, cut to tape and keep talking — the story doesn't change.

---

## Talking to Stanislav (the "context layer" framing)

- Use **his** words: *context layer*, *context for humans and AI*, *context-maxing*. Don't say
  "dashboard" — say **"shared context layer."**
- His lens is **adoption / MRR**: emphasize that it's **passive and zero-friction** (install a
  watcher, change nothing) and that value compounds with team size and history — every event makes
  the collective memory better. That's a retention/adoption story, not a feature list.
- His product is the context layer for humans + AI; **this product is that, for a team and their
  Claude Code agents, on Aiven.** Position Hivemind as a concrete, shipped instance of his thesis —
  let him see his own roadmap in it.

---

## Q&A (1 minute — crisp answers)

**"Isn't this just Claude Code Agent Teams / agent orchestration?"**
No — opposite direction. Agent Teams *orchestrates* agents (tells them what to do). Hivemind is
**passive and observational**: it doesn't direct anyone, it makes the work everyone's *already* doing
visible and recallable across laptops. Orchestration is about control; this is about **shared
context**. They're complementary — you could run both.

**"Is the latency / cross-laptop sync real?"**
Yes. The cross-laptop hop is a real Aiven Kafka round-trip — produce on one machine, consume on every
other (each machine gets its **own consumer group**, so everyone receives every event rather than
splitting partitions). It's perceptibly live — sub-second to low seconds depending on the network.
We pre-warm Kafka because **provisioning** is slow; steady-state **streaming** is fast. Footer shows
`bus: kafka` so you can see it's not the local fan-out.

**"Are the search results real, or canned?"**
Real. With an embedder configured, search is **pgvector cosine ANN** over stored embeddings
(`ORDER BY embedding <=> $query`). With no embedder it degrades gracefully to **Postgres full-text
search** over a generated `tsvector`, and offline it falls back to lexical scoring — same API, three
honest tiers. Nothing is hard-coded; ask for any term and watch it query live.

**"Privacy — you're broadcasting everyone's AI sessions?"**
Three answers. (1) **Scope:** it's a *team* layer on the team's *own* managed Aiven infra, not public.
(2) **Redaction is on by default** (`HIVEMIND_REDACT=true`): obvious secrets — `sk-…`, `ghp_…`,
`AKIA…`, bearer tokens, long hex/JWT — are scrubbed before an event ever leaves the laptop.
(3) **Thinking blocks are always dropped**, and events are short one-line summaries (~280 chars), not
full transcripts. The grown-up version adds per-project opt-in and an exclude-list; the trust model is
the same as a team Slack.

**"Why Kafka and Postgres instead of a database or WebSockets?"**
Because the data *is* an event log and a memory. Kafka is the idiomatic team bus — append-only,
multi-consumer, cross-machine — so the sync is the stream, not a bolted-on socket. pgvector is the
idiomatic team memory — semantic recall over history in the same store that holds presence. Using the
right primitives is *why* it scales past a one-laptop toy; an agent provisions both in seconds via the
Aiven MCP.

**"Does it need Aiven to run? / What if the demo network dies?"**
No hard dependency, which is the point: the **core runs zero-dep** (in-process bus + in-memory/JSONL
store + offline lexical search) so it demos anywhere, and **flips to Aiven via two env vars**. Same
code path, same UI — Aiven is what makes it a *team* product instead of a single-laptop one. If the
network dies on stage, the local mode still shows the full UX while we cut to the recorded Aiven run.

**"What's the business / adoption story?"** (if Stanislav goes there)
Passive install, zero workflow change, value compounds with team size and accumulated history —
classic land-and-expand for a context layer. It's a natural surface for "Aiven Context": the managed
streaming + memory backend *is* the product moat.
