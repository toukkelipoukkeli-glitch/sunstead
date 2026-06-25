# BUILD PLAN — making the Lovable→Aiven migration actually run

Engineering plan + honest difficulty. Companion to [STATUS.md](STATUS.md) (scope) and
[idea.md](idea.md) (spec). Grounded in the **verified** Aiven MCP reality: provisioning,
Postgres, Kafka, pricing, metrics all work on `touko-1f1c`; **Aiven Apps deploy is NOT
enabled** for us.

## Difficulty verdict (read first)

- **Migrate the data plane** (Aiven Postgres + pgvector + copy data): **🟢 easy** — hours, all real MCP.
- **Realtime → Kafka, actually updating the live app**: **🟡 the real build** — ~half a day, and it's
  the hero *and* the riskiest "works live on stage" piece (see hard truth #2).
- **Cost card + CTO recs** (read Aiven metrics over MCP): **🟢 easy** — hours.
- **Auth + Storage + data-API fully working with ZERO Supabase**: **🔴 the long pole** — ~a week, see below.

**Bottom line:** "the app 100% functional on Aiven with zero Supabase, fully automated, in the ~day
we have" — **no.** "A real, end-to-end migration of the core loop that genuinely runs on Aiven on
stage" — **yes**, and that's the right target. The fully-functional version is the post-hackathon build.

## Two hard truths to internalize (both come from "no Aiven Apps")

**1. Without Aiven Apps, there's nowhere *on Aiven* to host the replacement glue.** Supabase is
Postgres + four OSS, Postgres-backed services the app's `supabase-js` client talks to: **GoTrue**
(auth), **PostgREST** (data API + `rpc`), **Realtime**, **Storage**. To make the app *fully* work
off Supabase you must re-host those — and Aiven can't host them for us right now. So "fully working"
means hosting that glue **off Aiven** (Fly/Render/a VM) or **rewriting the app** to hit Aiven
directly. Either way the BaaS layer isn't on Aiven, which dilutes the "100% Aiven" line. Aiven holds
the **data plane** (Postgres + Kafka); that's the honest claim.

**2. Browsers can't speak Kafka.** The "realtime → Kafka" hero needs a **Kafka → SSE/WebSocket
bridge**: a server that consumes the Kafka topic and pushes to the browser. Good news — live-hype-wall
is a **TanStack Start** app with its own server runtime, so the bridge lives in the app's server (a
Kafka consumer + an SSE route; the client swaps `supabase.channel(...)` for an `EventSource`). That's
buildable, but it *is* the real work behind the hero beat — not a config flag.

## What to build (ordered, hardest-risk-first)

| # | Piece | How | Difficulty | In demo? |
|---|---|---|---|---|
| 1 | Aiven Postgres + Kafka provisioned | `aiven_service_create` via MCP; confirm `vector` ext | 🟢 ~done (verified) | ✅ |
| 2 | Schema → Aiven PG | take repo migrations, strip Supabase-isms (auth.*, storage.*, `supabase_realtime`, `pg_net` trigger, `auth.uid()` RLS); apply tables + indexes + `match_posts` via `aiven_pg_write` | 🟢 2–3h | ✅ |
| 3 | Data + embeddings → Aiven PG | read source rows (service_role) → `aiven_pg_write` / COPY | 🟢 2–3h | ✅ |
| 4 | **Kafka → SSE bridge** (the hero) | Aiven PG emits post/reaction events to a Kafka topic (`aiven_kafka_topic_create` + producer); TanStack server consumes + SSE; client swaps `supabase.channel` → `EventSource` | 🟡 ~½ day | ✅ |
| 5 | App reads on Aiven | thin server route for the wall/leaderboard/search hitting Aiven PG (incl. `match_posts`) | 🟡 ~½ day | ✅ |
| 6 | Cost card | live Aiven pricing (reuse `ideas/architecture-advisor`) → Supabase $ vs Aiven $ | 🟢 2–3h | ✅ |
| 7 | CTO recs | read `aiven_service_metrics_fetch` → 1–2 real recommendations | 🟢 2–3h | ✅ |
| 8 | Auth fully working | run GoTrue off-Aiven **or** rewrite app auth | 🔴 1–2 days | ✗ flag |
| 9 | Storage fully working | S3/MinIO + rewrite image URLs | 🟡 ~1 day | ✗ flag |
| 10 | Embed fn | point at OpenAI/Voyage; host off-Aiven (Aiven App when enabled) | 🟡 ~½ day | ◑ optional |

## The cut line for the demo (~1 day)

**In (genuinely working, not faked):** data plane fully on Aiven (#1–3), the **Kafka→SSE bridge so
the real wall updates live off Kafka** (#4–5), the **cost card** (#6) and **CTO recs** (#7), with the
rewired app booting against Aiven. **Flagged honestly:** auth + storage (#8–9) — classified, with a
generated adapter plan, no live surgery. That is "the Lovable migration working" for the core loop,
and every number is real.

**Build order = de-risk #4 first** (right after the spine). The Kafka→browser bridge is the only
piece that can quietly not-work on stage; build and rehearse it before polishing anything else. Keep
a **recorded fallback** of the live migration + the Kafka hop.

## What "fully working, zero Supabase, any app" needs later (the product)

Re-host GoTrue + PostgREST + Storage + the realtime bridge as managed services pointed at Aiven PG —
**as Aiven Apps once our account is enabled** (the `aiven_application_deploy` MCP path is proven),
otherwise off-Aiven. Then a `supabase-js` app runs unchanged on Aiven. That's ~a week and it's the
"Stop Managing, Start Building" vision — name it as the roadmap, don't try to build it before the demo.
