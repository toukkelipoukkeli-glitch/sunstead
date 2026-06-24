# Lovable → Aiven Behavior Migrator — "Aiven, your CTO"

> **This is what we're building.** Aiven challenge.
> Source: conversation with the **whole Aiven team** at the event — almost all of them are
> from the **startup / business** side, not infra. So the idea is deliberately pitched at
> *their* problem: how does Aiven win the next wave of vibe-coded startups the moment those
> apps stop being toys?

---

## One-sentence pitch

> **When your Lovable app blows up, an agent graduates it off Supabase/Lovable Cloud onto
> Aiven — it migrates the schema + data, rewrites realtime onto Aiven Kafka, and rewires the
> app to run on Aiven's data plane — so the app ends up running on Aiven with Supabase
> deleted — then stays in the repo as an always-on "CTO" agent that watches the app and tells
> you what to do next.**

Backup framing if you only get one breath: *"Lovable builds the app, Aiven runs it — an agent does
the migration, deletes the Supabase dependency, and keeps thinking about what's next."*

---

## The actual idea (what the Aiven team asked for)

Two pieces. The **behavior migration** is the main thing; the **CTO agent** is the expansion that
makes it sticky.

### 1. The behavior migration (the core, the hero) ⭐

The story everyone recognizes: someone vibe-codes an app in **Lovable**, it ships on the
default **Supabase** backend, and then it *blows up* — traffic, data, real users. Now the
managed-but-generic backend is the bottleneck: costs spike, you've outgrown the free/cheap
tier, and you're suddenly an accidental ops team with no infra experience.

Today migrating off that is a scary, manual, multi-day job: stand up new Postgres, copy the
schema, move the data, rewire connection strings, understand auth/storage/realtime/function
dependencies, test, and cut over without losing rows. Exactly the kind of work a founder from
the business side *cannot* do and is terrified to get wrong.

**So make it an agent.** Point it at the Lovable/Supabase project; it:

- **introspects** the existing app behavior, not just the database: schema, tables,
  extensions, row counts, RLS policies, Supabase Auth, Storage, Realtime channels, RPC calls,
  edge functions, env vars, and `supabase-js` usage,
- builds a **behavior graph**: direct migrate / rewrite to Aiven / adapter required /
  external replacement / manual review,
- **provisions** the target **Aiven for PostgreSQL** and optional **Aiven Kafka** landing zone
  via the **Aiven MCP / API**,
- **migrates** schema + representative data + extensions (pgvector, etc.) using the right
  migration tools, with MCP as the control plane and proof layer,
- **rewrites one behavior** in the demo — Supabase Realtime → Aiven Kafka outbox/event stream,
- **rewires the app onto Aiven** — repoints data + realtime to Aiven Postgres + Kafka so the app
  talks to Aiven only and **Supabase is removed from the stack** (for the demo the rewired app runs
  locally against Aiven; hosting the glue *on* Aiven Apps is the productized next step — see below),
- **flags the genuinely hard replacements honestly** — Auth and Storage — as named adapters
  (GoTrue / object store), v2,
- **verifies** the cutover (row counts match, app boots, queries pass),
- records every step as **MCP receipts** in Aiven Postgres and Kafka,
- and hands back a **before/after cost comparison** — "you were paying $X, this is $Y on
  Aiven" — because **saving money is half the reason to move**.

The whole point: a non-technical founder clicks once, the agent tells the truth about what
can move, moves the Aiven-native data plane, rewrites one behavior, and gives them a safe
cutover plan without making them touch a connection string.

### Key correction: this is behavior migration, not just data migration

Data migration asks: *can I copy these tables?*

Behavior migration asks: *what did the app expect Supabase/Lovable Cloud to do for it, and
which of those behaviors can become Aiven-native?*

That distinction is the product.

| Source behavior | Aiven target story | Demo treatment |
| --- | --- | --- |
| Postgres tables, indexes, constraints | Direct migration to Aiven Postgres | Apply schema and migrate sample rows |
| pgvector / extensions | Check and enable if available | Show extension check if stable |
| RLS policies | Analyze, but flag auth-role dependency | Show as `needs auth adapter` |
| Supabase Auth | GoTrue/Keycloak adapter (Aiven Apps when GA) | v2 — named, not built |
| Supabase Storage | Object store + metadata (external S3) | v2 — storage needs durable backing |
| Supabase Realtime | Rewrite to Aiven Kafka outbox/event stream | **The flashy live demo beat** |
| Edge Functions / RPC | Rewrite to a worker/API on Aiven's data plane | Run live against Aiven; host on Aiven Apps post-GA |
| Supabase client calls | Generate backend adapter/code diff | Show one small diff |

MCP should **not** be the bulk data pipe. For real migrations, the agent should orchestrate
the right tools (`aiven-db-migrate`, `pg_dump`/`pg_restore`, `pgloader`, Debezium/Kafka
Connect, source exports). MCP is best for provisioning, inspection, schema/metadata writes,
Kafka topics/events, validation reads, logs/metrics, receipts — **and deploying the replacement
backend as an Aiven App.**

### Reality check (00:28, day before submission): no Aiven Apps access — and we don't need it ⭐

We verified the Aiven MCP live on project `touko-1f1c`: **provisioning, Postgres (read/write/
extensions/optimize), Kafka (topics + produce/consume), pricing, and metrics are all real and
accessible**, with Postgres + Kafka services already RUNNING. **Aiven Apps deploy, though, is
Limited-Availability and our account isn't enabled** (and GitHub isn't connected) — so hosting the
glue *on* Aiven is out for this demo.

That's fine: **you don't need Aiven Apps to delete Supabase.** Supabase is "deleted" the moment the
app's *data plane* is 100% Aiven (Postgres + Kafka) and nothing calls Supabase anymore — the glue
code can run anywhere (locally for the demo). So the live hero is the **migration + realtime→Kafka
rewrite + CTO agent + cost card**, all driven by MCP with real services behind them.

Hosting on **Aiven Apps is the honest, scoped next step** — and we have the exact MCP path proven
(`aiven_application_deploy` wires an App to Postgres/Kafka with auto-injected creds); it just needs
LA access (ask Daniil / Julie). If access lands before 18:00, we bolt the live deploy on as a bonus
beat; if not, the demo is complete without it.

### 2. "Aiven is your CTO" (the expansion that makes it stick)

Migration is a one-time event; we don't want a one-time product. So after the cutover the
agent **doesn't leave** — it stays in the repo as an always-on **CTO agent**: it watches the
app and the Aiven services and proactively answers *"what should I do next?"*

- "Your Postgres is at 80% connections — bump the plan / add pooling."
- "This query is slow; here's the index."
- "Traffic 10×'d this week — here's the scaling move and what it'll cost."
- "You're storing embeddings in a way that'll get expensive; here's the better shape."
- "Time to add a read replica / a Kafka topic for this event stream."

For a founder with no infra background, this is the CTO they don't have — and for Aiven it's
a continuous nudge toward more services and more consumption (the adoption / MRR flywheel).

---

## Why this fits the Aiven challenge

The rubric is roughly **MCP depth 34 / workflow autonomy 33 / creativity + impact 33**, judged
through the Aiven Context / "context-maxing" lens.

- **MCP depth (34):** the migration is *real agentic MCP work* — the agent uses the **Aiven
  MCP** to provision/verify Postgres and Kafka, apply target schema, write receipts, produce
  migration events, validate rows, inspect service state, **and read live metrics + query stats for
  the CTO agent**. Not a cosmetic call — MCP is the migration control plane. (Hosting the rewired
  glue on Aiven Apps would add a deploy beat via `aiven_application_deploy`, but that's LA / no
  access yet — named as the next step.)
- **Workflow autonomy (33):** end-to-end with a human only at "go." Introspect → provision →
  classify behavior → migrate → rewrite/flag unsupported behavior → verify → report, then the
  CTO agent runs continuously. Zero infra skill required from the user.
- **Creativity / impact (33):** it targets the **exact moment Aiven should win** — a
  vibe-coded app outgrowing its starter backend — and converts it into Aiven consumption with
  a cost story attached. The behavior-graph + CTO-agent layer is a genuinely new surface, not
  a migration script.

---

## Reading the room — the Aiven judges (startup / business)

Full per-person profiles + talking points: **[judges.md](judges.md)**. The people we pitch are
**not infra engineers** — they're product + startup-program + go-to-market. So the framing isn't
"look at this clever infra demo," it's **"here's how Aiven captures the Lovable wave and turns it
into accounts that grow."**

### The anchor frame — say Aiven's own new mission back to them

Aiven just rebranded around one line (CEO Oskari Saarenmaa): **"Stop Managing. Start Building."** —
"no longer just a data infrastructure platform… the best platform to build production applications
and AI agents." **Our idea is that slogan, executed:** the founder stops managing the migration and
the ops, the agent does it, they keep building. Open the pitch by quoting it back.

### Lovable is a co-sponsor — frame it as partnership, not rescue

Lovable is a Sunstead partner too (alongside Anthropic, Vercel, ElevenLabs). So the line is
**"Lovable builds the app, Aiven runs it"** — a clean handoff at the moment of success, *not*
"escape Lovable." Respect the starter backend; we're the graduation path, not the exit.

### The three judges (one hook each — detail in judges.md)

- **Stanislav Dmitriev — Product Director, "Aiven Context"; presented this challenge.** Evangelist
  of **context-maxing** ("stop token-maxing, start context-maxing"). Mirror it: the agent *maxes
  the context* of a real running app — schema, data, traffic, cost — and turns that into the right
  Aiven stack + a stream of next-best actions. He's ex-presales/prototyping and a hackathon winner
  who vibe-codes for fun — he rewards a **polished, real, playful** demo and **MCP depth**.
- **Daniil Freidin — Startup Program Manager (ex-Slush/Junction).** Measures **real value to
  founders** and adoption. Pitch the migrator as **top-of-funnel for Aiven for Startups**: it lands
  the account at the exact moment a startup is scaling, "with confidence and the support they need."
- **Julie Bastien — Startup Program Manager & Sustainability/GreenOps Lead.** Wants **production
  reality over demos**, cost efficiency, and **trust in autonomous agents** (her stated worries:
  AI autonomy vs. human validation, systems that confidently hallucinate). Answer both: the agent
  **verifies the cutover** (row counts match, app boots) — validation built in — and the CTO agent
  can surface **cost *and* carbon** (Aiven ships free in-console carbon metrics; that's her baby).

### The land-and-expand story (for Daniil + Julie)

Migration is the **land** (move them onto Aiven, cheaper, one click); the CTO agent is the
**expand** (it keeps recommending — and provisioning — more Aiven services as the app grows). That
*is* the Aiven for Startups thesis, automated — and it plugs straight into the **$100K credits**
they hand out.

---

## The "save money" angle (lead with it for the business folks)

Make the cost delta a first-class, *real* output, not a footnote:

- Pull the current Supabase tier/cost (or have the user state it).
- Compute the **Aiven equivalent from live Aiven pricing** across plans/regions (this exact
  cost engine already exists in [architecture-advisor/](ideas/architecture-advisor/README.md)
  — reuse it).
- Show **$/mo before → after**, highlighted, with the cheapest region satisfying residency.

For a founder watching burn, "the agent moved my app and cut the bill" is the whole pitch in
one sentence.

---

## Demo shape (sketch — to be built)

1. **Start with a real Lovable app on Supabase** that has data in it (seed it so the row
   counts are visible and non-trivial).
2. **"Graduate to Aiven."** One click. The agent streams its reasoning: scanning the repo,
   building the behavior graph, provisioning/verifying Aiven Postgres + Kafka via MCP, and
   applying the Aiven-native landing zone.
3. **The behavior rewrite beat:** the UI shows `Supabase Realtime channel -> Aiven Kafka
   outbox`. The agent creates the Kafka topic through Aiven MCP, emits a test event, reads it
   back, and generates the adapter note.
4. **The delete-Supabase beat:** the rewired app boots **live against Aiven** (locally) — data from
   Aiven Postgres, realtime from Aiven Kafka — with no Supabase in the loop. *"Supabase is gone; the
   whole data plane is Aiven. Hosting this on Aiven Apps is one MCP call away once we're off the LA
   waitlist."*
5. **The verify beat:** row counts match before/after; the app boots against Aiven-backed
   data; a query returns the same result; remaining blockers are honest (`Auth: deployable as
   Aiven App / v2`, `Storage: external S3 / v2`). *"Real where it's real, honest where it isn't."*
6. **The cost card:** $X on Supabase → $Y on Aiven, savings highlighted.
7. **The CTO beat:** the agent posts its first proactive recommendation ("you're at 80%
   connections — here's the move"). *"And it doesn't leave — it's now watching the app for
   you."*

Pre-warm the Aiven provisioning, and keep a recorded fallback for the live migration in case
the network is flaky on stage.

---

## Open questions / to figure out before building

- **Aiven Apps access — RESOLVED as no-go for the demo:** verified ~00:28 day-of — account not
  LA-enabled, GitHub not connected, no time to chase it. Pivot: the rewired app runs against Aiven
  directly (Supabase still deleted). MCP deploy path (`aiven_application_deploy`) is proven for
  post-hackathon, or if Daniil/Julie enable access before 18:00.
- **Lovable export surface:** what do we actually get from a Lovable project — repo access,
  the Supabase project directly, or both? Migration plan depends on this. (Check Lovable's
  GitHub sync + the Supabase project's direct Postgres connection.)
- **Supabase-specific features:** auth, storage, RLS, edge functions, realtime — which of
  these does the demo app use, and what's the Aiven equivalent / shim for each? Scope the
  demo to Postgres data plus one realtime-to-Kafka behavior rewrite; flag auth/storage as
  adapter-required, not solved.
- **Zero-downtime vs. cutover:** for the demo, a clean cutover is fine; name the dual-write /
  logical-replication path as the grown-up version if asked.
- **Cost numbers must be real** — wire the live Aiven pricing, don't hand-wave the savings.
- **How much does the CTO agent ship for the hackathon?** Likely one or two real, live
  recommendations driven off actual Aiven service metrics — enough to make the "it stays and
  thinks" promise concrete, not a mockup.
- **MCP vs migration tools:** use MCP for provisioning/validation/receipts and normal migration
  tools for bulk copy. This distinction makes the pitch more credible to technical judges.

---

## Reuse from what's already here

- **Cost engine + live Aiven pricing + provisioning via MCP/REST:**
  [architecture-advisor/](ideas/architecture-advisor/README.md) already provisions Aiven
  Postgres on the free tier, compares live pricing across regions, and runs a real benchmark.
  The migrator is that machinery pointed at an *existing* app instead of a plain-English
  prompt — big head start.
- **The "agent provisions Aiven live via MCP" hero moment** is proven in
  [hivemind/](ideas/hivemind/PITCH.md) — same beat, reused here for the migration cutover.
