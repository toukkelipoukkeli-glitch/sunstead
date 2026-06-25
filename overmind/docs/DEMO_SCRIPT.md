# Overmind — 4-minute demo script

> One operator at the keyboard, one narrator (can be the same person). Mission Control is full-screen
> on the projector. The migration is **pre-warmed** (Aiven services already provisioned on
> `touko-1f1c`) and a **recorded fallback** of the live run is ready in case the venue network is
> flaky. Target: **3:50**, leaving a breath before the buzzer.

**The frame to open and close on — Aiven's own new mission, said back to them:**
> *"Aiven's new line is 'Stop Managing. Start Building.' Overmind is that slogan executed: the
> founder stops managing the migration and the ops — a swarm of agents does it — and they keep
> building. Lovable builds the app; Aiven runs it."*

---

## The 4 minutes, beat by beat

### Beat 0 — The hook (0:00–0:25) · 25s

> *"Someone vibe-codes an app in Lovable. It ships on Supabase. Then it blows up — real traffic, real
> data, real users — and now a non-technical founder is an accidental ops team. Migrating off is a
> scary, multi-day job. So we made it an agent swarm."*

**On screen:** the live Lovable source app (`live-hype-wall`) with visible data — non-trivial row
counts. *"This is a real Lovable/Supabase app, with data in it."*

**The one line:** *"Point Overmind at it → a swarm rebuilds it on Aiven, 100% working, while you
watch — then runs it for you forever."* Then click **Graduate to Aiven**.

---

### Beat 1 — Recon + the behavior graph (0:25–1:10) · 45s — *the "context-maxing" beat (Stanislav)*

**On screen:** the swarm nodes light up; the **behavior graph fills in live** — ~32 nodes:
tables, indexes, functions, triggers, RLS, the `vector` extension, realtime, auth, storage, the
data-API surface — each tagged with its classification and **evidence** (file:line / `pg_*` catalog).

> *"This is the product. Data migration asks 'can I copy these tables?' **Behavior migration** asks
> 'what did this app expect its backend to do — and which of those become Aiven-native?' Recon
> scanned the repo **and** introspected the live database, and built a graph: what direct-migrates,
> what gets rewritten onto a Kafka, what we have to **generate**, and the one thing a human should
> eyeball. That's a **0-to-100 readiness score** at the top — grounded, not vibes."*

**Say to Stanislav (don't name him — just land it):** *"The agent **maxes the context** of a real
running app — its schema, its data, its traffic, its bill — and turns that context into the right
Aiven stack. This isn't a token-maxing trick; it's context-maxing, executed."*

---

### Beat 2 — Provision live via the Aiven MCP (1:10–1:55) · 45s — *MCP depth (the judged core)*

**On screen:** the **Operator** node drives the **Aiven MCP**; the **receipt ledger streams** — one
receipt per `aiven_*` tool call: `aiven_service_create` → `overmind-pg` (pgvector), `overmind-kafka`,
`aiven_service_get` RUNNING, `aiven_pg_service_available_extensions`, `aiven_kafka_topic_create`. The
Aiven plane flips to **RUNNING**.

> *"Every one of these is a real call to the **Aiven MCP** — provisioning Postgres with pgvector and
> a Kafka, checking extensions, creating topics, reading connection info. The MCP isn't a cosmetic
> checkbox: **its output is the connection string the migrated app actually runs on.** And every
> action is a **receipt** — the autonomy is auditable, not a free-form shell."*

> *(If pre-warmed: "These services were provisioned by this exact MCP path a few minutes ago —
> here's the ledger; let me show the live `aiven_service_get` returning RUNNING right now.")*

---

### Beat 3 — Rebuild + self-heal + realtime over Kafka (1:55–2:50) · 55s — *workflow autonomy*

**On screen:** the **Surgeon** generates one service per behavior — JWT auth, `/api` data routes,
the **Kafka→SSE realtime bridge**, pgvector search, bytea storage. The **Healer** loop runs:
deploy → smoke-test → **catch a real error** → patch → green. Then a realtime event **produces to an
Aiven Kafka topic and is consumed back** in the ticker.

> *"Here's where we go past the sensible one-click migrator. It would **flag** auth and storage as
> 'adapter required.' Overmind **builds them** — the Surgeon generates the real replacements. The
> Healer deploys the generated code, runs smoke tests, reads the actual error, patches it, and loops
> until green. No human in that loop. And watch — a realtime event just **hopped over Aiven Kafka**:
> Supabase Realtime, re-expressed as a Kafka event mesh with an SSE bridge."*

**Drop the one-up (Stanislav will respect it):** *"Aiven's own Lovable integration keeps Supabase in
the loop as edge-function middleware. We remove Supabase entirely — the whole data plane is Aiven."*

---

### Beat 4 — Verify + cost + Supabase is gone (2:50–3:25) · 35s — *production reality + trust (Julie)*

**On screen:** the **Verifier** checklist goes green — **row-count parity** (source vs. Aiven),
smoke query, Kafka roundtrip, generated auth flow, pgvector search. The **cost card** snaps to
**$599 → $Y on Aiven**, savings highlighted. The Aiven plane reads **100% Aiven, Supabase removed**.

> *"This isn't blind autonomy — it **verifies itself**. Row counts match before and after. The app
> boots against Aiven. A query returns the same result. That's human-checkable validation built into
> the loop, not a hope. Supabase is **gone** — the entire data plane is Aiven. And the bill went from
> $599 to $Y, because saving money is half the reason to move."*

**Say to Julie (cost + trust + carbon — all three):** *"Verification is the trust answer to
'confidently hallucinating' agents. And the cost story includes **carbon** — `overmind-pg` runs in a
low-carbon EU-north region, and the operator can read Aiven's own in-console emissions."*

---

### Beat 5 — The CTO that never leaves (3:25–3:50) · 25s — *land-and-expand (Daniil)*

**On screen:** the migration shows **done**; the **CTO** node stays lit and posts its first real
recommendation off **live Aiven metrics** — "Postgres at X% connections → enable PgBouncer," or the
pgvector HNSW-index advisory, or the carbon-aware region note.

> *"Migration is a one-time event — we didn't want a one-time product. So the agent **doesn't leave.**
> It stays as an always-on CTO, reading live Aiven metrics and answering 'what should I do next?' —
> scale this, index that, here's the greener, cheaper move."*

**Close on the mission + land-and-expand:** *"Every migration is an Aiven account landed at the exact
moment a startup is scaling. Every CTO suggestion is consumption expanded. That's Aiven for Startups'
land-and-expand — automated, and plugged straight into the $100K credits. **Stop Managing. Start
Building** — for the whole Lovable wave."*

---

## Rubric map (≈34 MCP depth / 33 autonomy / 33 creativity + impact)

| Rubric pillar | Where it lands in the demo | The proof on screen |
|---|---|---|
| **MCP depth (34)** | Beat 2 (provision) + threaded through 3–5 | Live `aiven_*` calls → streaming **receipt ledger**; MCP output *is* the connection string; metrics read for the CTO. Real services on `touko-1f1c`, not a mock. |
| **Workflow autonomy (33)** | Beats 1, 3, 5 | One human input ("Graduate"). 10-phase swarm: recon → … → operate. **Self-heal loop** patches its own generated code. **Agents self-register** for scoped JWTs before running. |
| **Creativity / impact (33)** | Beats 0, 1, 4, 5 | The **behavior graph** + **CTO operator** are a new product surface, not a migration script. Targets the exact moment Aiven should win, with a **real cost (and carbon) delta**. |

## Judge map (one thing each must walk away with)

| Judge | Their lens | The line that lands it |
|---|---|---|
| **Stanislav Dmitriev** — Product Director, "Aiven Context" | **MCP depth + context-maxing + "is this a new product?"** | *"The agent maxes the context of a real running app and turns it into the right Aiven stack. The MCP's output is the connection string the app runs on. And we remove Supabase entirely — your own Lovable integration doesn't."* (Beats 1–3) |
| **Daniil Freidin** — Startup Program Manager | **Founder value + adoption + land-and-expand** | *"Top-of-funnel for Aiven for Startups: it lands the account the moment a vibe-coded app is scaling, and the CTO agent keeps expanding the footprint. Land-and-expand, automated, into the $100K credits."* (Beats 0, 5) |
| **Julie Bastien** — Startup Program Manager & GreenOps | **Production reality + cost efficiency + trust/verification + carbon** | *"It verifies itself — row counts, boot, query parity — so it's not blind autonomy. And 'what's next' includes the greener, cheaper move; carbon is first-class."* (Beat 4) |

---

## How Overmind differs from the sensible one-click "Aiden"

> Say this explicitly if asked "how is this different from the other migration entry?" — frame it as
> **two honest points on one spectrum**, not a takedown. Aiden is the responsible product; Overmind
> is the moonshot that shows where it goes.

| | **Aiden** (the sensible one-click migrator) | **Overmind** (this) |
|---|---|---|
| Auth / Storage | **Flags** them — "adapter required," v2 | **Agents generate + deploy real replacements** |
| Realtime | Rewrites **one** path → Kafka | **Full Kafka event mesh + generated SSE bridge** |
| Failure handling | **Reports** blockers | **Self-healing loop:** deploy → test → repair → green |
| After migration | Hands off a cutover package | **Persistent CTO operator that never leaves** |
| Autonomy model | Deterministic state machine | **Agent SDK swarm that writes & fixes its own code** |
| Result | Shadow data plane + receipts | **The whole app, 100% on Aiven, running** |

**The one-liner:** *"Aiden migrates your data and tells you the truth about what's hard. Overmind
**builds** what's hard — and then stays to run it. Same rubric, opposite end of the ambition dial."*

> **Honesty guardrail (keeps trust with Julie):** never claim a service is live that isn't.
> Anything not backed by a set key shows as **"planned"** in the stream. Real where it's real,
> honest where it isn't — that's the line that beats a flashier-but-faked demo with these judges.

---

## Pre-flight checklist

- [ ] Aiven services **pre-warmed** on `touko-1f1c` (`overmind-pg` + `overmind-kafka` RUNNING).
- [ ] `.env.local` has `AIVEN_TOKEN`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, `KAFKA_*` set so the
      verify + cutover beats are **live**, not "planned."
- [ ] `npm run dev` up; Mission Control full-screen; a browser already connected to `/api/stream`.
- [ ] **Recorded fallback** of a full clean run ready to play if the network drops.
- [ ] Cost card numbers confirmed real (live Aiven pricing), not hand-waved.
- [ ] Source app (`live-hype-wall`) showing visible, non-trivial row counts.
