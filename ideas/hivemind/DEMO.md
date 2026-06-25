# Hivemind — demo runbook

Shared live context for AI-assisted teams. This is the exact, rehearsable script for the
4-min stage pitch + 1-min Q&A. It covers the pre-warm checklist, env setup, the two-laptop
flow, the single "wow" moment, the seeded single-laptop fallback (`npm run demo`), a
recorded fallback, and recovery if WiFi / Kafka / OAuth / Postgres fall over.

> **One sentence to say on stage:** "Every teammate's Claude Code session streams onto one
> Aiven Kafka topic, lands in Aiven Postgres + pgvector, and any of us can ask *'has anyone
> on the team already done X?'* — across laptops, live."

---

## 0. Demo modes (decide which one you're running BEFORE you walk up)

| Mode | Backend | Needs network? | When to use |
|------|---------|----------------|-------------|
| **A — Aiven, two laptops** (hero) | Aiven Kafka + Aiven Postgres/pgvector | Yes | Default. The cross-laptop sync IS the Kafka stream. |
| **B — Aiven, one laptop** | Aiven Kafka + Aiven Postgres | Yes | If only one machine is on stage but you still want a real broker. |
| **C — Seeded local** (`npm run demo`) | in-proc bus + in-memory store | **No** | WiFi/Kafka/OAuth failed. Looks identical in the browser. |
| **D — Recorded** | screen recording | No | Total A/V or laptop failure. |

**Rule:** always have **C** primed on the presenting laptop and **D** open in a browser tab,
no matter which mode you intend to show. Falling back must take seconds, not minutes.

---

## 1. Critical environment facts (verified on the demo machine)

- **Node:** `v26.3.1`, npm `11.16.0`. App runs TypeScript directly via type-stripping:
  `node src/index.ts`. **No build step.**
- **Port:** `3737`. Dashboard at `http://localhost:3737`.
- **Core path needs ZERO npm installs** — modes C/D work offline out of the box.
- **Aiven path needs two packages**, loaded lazily: `npm i pg kafkajs`. Install these during
  pre-warm, not on stage.
- Real watcher confirmed working against `~/.claude/projects` (709 transcripts → live events;
  a smoke test showed 424 events / 14 sessions / 4 actors materialized within seconds).

### 1a. KNOWN BLOCKER — read before the dry run (Node 26 type-stripping)

Node 26 runs `.ts` in **strip-only** mode (it deletes types, it does **not** transform syntax).
`src/store.ts` uses two TypeScript **parameter properties**:

```ts
constructor(private config: Config, _embedder: Embedder) { … }   // ~line 162
constructor(private config: Config, private embedder: Embedder) { … }  // ~line 255
```

On `v26.3.1` these throw at startup:

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
```

There is **no Node flag** that fixes this (`--experimental-transform-types` does not exist in
this build; only `--experimental-strip-types`). **Fix it before the demo** by desugaring those
two constructors (declare the field, assign in the body). Verified: after desugaring, the app
boots and the real watcher populates the feed. Do this in the pre-warm window — do not discover
it on stage. Re-run `npm run typecheck` after editing.

> If you can't touch the code, you can still demo **Mode D (recorded)**. Modes A/B/C all run
> `node src/index.ts` and hit the same blocker, so the source fix is the only real path.

---

## 2. Pre-warm checklist (start ~30 min before)

Kafka is **slow to provision** on Aiven — provision early or pre-create the service.

- [ ] **Source fix applied** (section 1a) and `npm run typecheck` is clean.
- [ ] `npm i pg kafkajs` done on **every** laptop that will show Mode A/B.
- [ ] **Aiven Postgres** running; pgvector + tables applied:
      `psql "$PG_CONNECTION_STRING" -f aiven/schema.sql`
- [ ] **Aiven Kafka** running; topic `hivemind.events` created (auto-create may be off —
      create it explicitly). Note SASL mechanism (`scram-sha-256` vs `plain`).
- [ ] `.env.local` filled on each laptop (section 3), with **distinct `HIVEMIND_USER`** per laptop.
- [ ] **Connectivity smoke test on each laptop** (section 4) — green before you trust the stage.
- [ ] **Mode C primed**: a second terminal with `npm run demo` ready to launch.
- [ ] **Mode D ready**: recorded video open in a browser tab, audio checked.
- [ ] Generate a tiny bit of **real, redact-safe** Claude Code activity on the second laptop you
      can search for live (e.g. ask Claude to "set up Kafka SSL"). `HIVEMIND_REDACT=true` scrubs
      obvious secrets, but avoid pasting anything sensitive into a session you'll project.
- [ ] Both laptops on the **same reliable network**; phone hotspot as backup.
- [ ] Browser zoom up (≈150%) so the feed and presence cards read from the back of the room.

---

## 3. Env setup

Copy `.env.example` → `.env.local` and edit. Core runs with **no** config at all.

### Mode A/B (Aiven) — `.env.local`
```bash
HIVEMIND_PORT=3737
HIVEMIND_USER=Touko            # MUST differ per laptop (e.g. Touko / Aino)
HIVEMIND_REDACT=true

HIVEMIND_BUS=kafka
HIVEMIND_STORE=postgres

# Aiven Postgres (run aiven/schema.sql first)
PG_CONNECTION_STRING=postgres://avnadmin:PWD@HOST:PORT/defaultdb?sslmode=require

# Aiven Kafka
KAFKA_BROKERS=HOST:PORT
KAFKA_TOPIC=hivemind.events
KAFKA_SSL=true
KAFKA_USERNAME=avnadmin
KAFKA_PASSWORD=PWD
KAFKA_SASL_MECHANISM=scram-sha-256   # or plain — match the service

# Optional: real semantic recall via pgvector cosine.
# If unset, Postgres search falls back to full-text (still great on stage).
# EMBED_URL=https://api.openai.com/v1/embeddings
# EMBED_API_KEY=sk-...
# EMBED_MODEL=text-embedding-3-small
# EMBED_DIM=256
```

> **Embeddings note:** with no `EMBED_*`, pgvector search degrades to Postgres full-text
> (`plainto_tsquery`) — still convincingly "semantic-ish" and fully offline-of-OpenAI. Only set
> `EMBED_*` if you want true cosine recall AND you've confirmed the endpoint reachable in pre-warm.
> Don't add an OpenAI dependency you haven't tested — it's a new failure point on stage.

### Mode C (seeded local) — no env needed
`npm run demo` sets `HIVEMIND_DEMO=1`; bus stays `local`, store stays `memory`. Works offline.

---

## 4. Connectivity smoke test (run on each laptop during pre-warm)

```bash
# 1. Boot with the real backend
npm start                       # reads .env.local → bus=kafka, store=postgres

# Expect the banner to show:    bus  kafka    store  postgres
# A bad broker/DB will throw immediately at start — that's your early-warning.

# 2. In another terminal, confirm the API answers
curl -s http://localhost:3737/api/stats        # -> {"events":…,"bus":"kafka","store":"postgres",…}
curl -s 'http://localhost:3737/api/feed?limit=5'
curl -s http://localhost:3737/api/presence
curl -s 'http://localhost:3737/api/search?q=kafka'
```

All four must return valid JSON. If `npm start` throws on connect, fix the backend now or
switch the plan to **Mode C**.

---

## 5. The two-laptop flow (Mode A — the hero demo)

Two laptops, same Kafka topic. **Laptop 1 = projector** (your screen). **Laptop 2 = teammate.**

**Setup (both already pre-warmed):**
- Laptop 1: `npm start` → open `http://localhost:3737` on the projector.
- Laptop 2: `npm start` (distinct `HIVEMIND_USER`), Claude Code open in a terminal.

**On stage, in order:**

1. **Frame it (≈20s).** "We're an AI-assisted team. Everyone's pairing with Claude Code in
   their own terminal, on their own laptop — and nobody can see what anyone else is doing.
   Hivemind fixes that." Point at the dashboard: live **feed** (center), **presence** cards
   (left), **search** (top).

2. **Show the bus is real (≈20s).** Footer reads `bus: kafka · store: postgres`. Say:
   "This isn't a WebSocket between two tabs — every event is a record on an **Aiven Kafka**
   topic, and state lives in **Aiven Postgres with pgvector**."

3. **THE WOW MOMENT (≈40s) — cross-laptop live + collective recall.** On **Laptop 2**, type a
   real prompt into Claude Code, e.g.:
   > *"Help me set up Kafka SSL with SASL."*

   Within ~1–2s a new card/feed entry for that teammate appears **on the projector** — it
   crossed laptops over Kafka. Then, on the projector, type into the search bar:
   > *"has anyone set up Kafka SSL?"*

   The teammate's just-now work ranks #1, with snippet + who + when. **That is the single
   legible wow:** *a teammate's keystrokes, seconds old, on a different laptop, become
   searchable team memory.* Say it out loud as it happens.

4. **Tie to the judge's language (≈20s).** "This is the **context layer for humans and their
   AIs** — passive, live, shared. Kafka is the team bus; pgvector is the collective memory."

**Choreography tips**
- Pre-type the Laptop-2 prompt into the terminal; just hit Enter on stage.
- Pre-type the search query too; just hit Enter.
- Keep the dashboard already scrolled to top so the new event lands in view.
- If Laptop 2's event is slow (consumer lag), narrate over it for 1–2s — it arrives.

---

## 6. Mode C — seeded / simulated fallback (`npm run demo`)

The dashboard looks **identical**; the only difference is fake teammates instead of a second
laptop. Nobody in the audience can tell, and it needs **no network**.

```bash
npm run demo        # = HIVEMIND_DEMO=1 node src/index.ts
```

- Three scripted personas appear immediately: **Aino** (`ring-firmware`, BLE reconnect
  backoff), **Mikael** (`sleep-api`, timezone drift), **Sofia** (`oura-ios`, readiness
  widget). New events every ~1.5–3.5s; presence cards go active; feed scrolls.
- Plus your **own real** Claude Code sessions stream in alongside the fakes (the watcher still
  tails `~/.claude/projects`), so you can still show a genuine live event.

**Search queries that land well in Mode C** (these match the seeded scripts):
- `"has anyone touched BLE reconnect?"` → Aino's exponential-backoff work, #1.
- `"timezone drift sleep stages"` → Mikael's staging fix.
- `"readiness widget"` → Sofia's WidgetKit work.

**The wow in Mode C:** type a real prompt into *your own* Claude Code terminal (e.g. "set up
Kafka SSL"), watch it hit the feed live, then search for it. Same beat as Mode A, one laptop.

Footer will read `bus: local · store: memory` — if a judge is watching closely, own it:
"local fallback so it demos anywhere; the same code flips to Aiven Kafka + Postgres with two
env vars." That honesty plays well and still shows the architecture.

---

## 7. Mode D — recorded fallback

If A/V or a laptop dies: play the pre-recorded run (a clean Mode A take). Have it:
- Already loaded in a browser tab (not buried in Finder).
- ~60–90s, captioned with the same beats as section 5.
- Audio levels checked in pre-warm.

Narrate live over the video using the section-5 script so it still feels like a walkthrough.

---

## 8. Recovery playbook (when something breaks on stage)

| Symptom | Likely cause | Recovery |
|---|---|---|
| `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` at startup | Section 1a source fix not applied | Apply the desugar fix; if no time, go **Mode D**. This blocks A/B/C equally. |
| `npm start` throws `KAFKA_BROKERS … no brokers` / connect timeout | Kafka not provisioned / wrong brokers / WiFi | Switch presenting laptop to **Mode C** (`npm run demo`). Don't debug live. |
| SASL / auth error from Kafka | Wrong `KAFKA_SASL_MECHANISM` (`scram-sha-256` vs `plain`) or creds | Fix in pre-warm. On stage → **Mode C**. |
| PgStore: connect / `SELECT 1` fails | Postgres down / bad `PG_CONNECTION_STRING` / SSL | Set `HIVEMIND_STORE=memory` and restart (keeps Kafka if it's up), or go **Mode C**. |
| Relation `events`/`sessions` missing | `aiven/schema.sql` not applied | `psql "$PG_CONNECTION_STRING" -f aiven/schema.sql`, restart. Pre-warm catches this. |
| Laptop-2 event never reaches projector | Consumer lag / topic mismatch / Laptop 2's WiFi | Confirm same `KAFKA_TOPIC`; if WiFi flaky, pivot to **Mode C** on Laptop 1 and do the one-laptop wow. |
| Search returns nothing in Mode A | No `EMBED_*` and FTS found nothing, or empty topic | Use a query that matches recent feed text; FTS needs a word overlap. In doubt, demo the seeded queries in **Mode C**. |
| OAuth / embeddings endpoint fails | `EMBED_URL` unreachable | Unset `EMBED_*` and restart — Postgres search auto-degrades to full-text. The demo does **not** require embeddings. |
| Port `3737` in use (`EADDRINUSE`) | A previous run still bound | `lsof -ti tcp:3737 \| xargs kill`, then restart. (Seen during testing.) |
| Total laptop failure | — | **Mode D** recorded video. |

**Golden rule:** if the live backend wobbles, **switch modes — do not debug on stage.**
Mode C is one command (`npm run demo`) and the audience can't tell the difference.

---

## 9. Exact command crib (copy/paste)

```bash
# --- pre-warm, once per laptop ---
cd ideas/hivemind
npm i pg kafkajs                                  # Aiven adapters (lazy-loaded)
psql "$PG_CONNECTION_STRING" -f aiven/schema.sql  # pgvector + tables
npm run typecheck                                 # after the section-1a source fix

# --- Mode A/B: real Aiven backend (reads .env.local) ---
npm start                                         # banner shows bus=kafka store=postgres

# --- Mode C: seeded local fallback, no network ---
npm run demo                                      # HIVEMIND_DEMO=1, bus=local store=memory

# --- health checks (any mode) ---
curl -s http://localhost:3737/api/stats
curl -s 'http://localhost:3737/api/feed?limit=5'
curl -s http://localhost:3737/api/presence
curl -s 'http://localhost:3737/api/search?q=kafka'

# --- if the port is stuck ---
lsof -ti tcp:3737 | xargs kill

# Dashboard:  http://localhost:3737
```
