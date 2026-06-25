# BUILD PLAN — making the Lovable→Aiven migration actually run

Engineering plan + honest difficulty. Companion to [STATUS.md](STATUS.md) (scope) and
[idea.md](idea.md) (spec). Grounded in the **verified** Aiven MCP reality: provisioning,
Postgres, Kafka, pricing, metrics all work on `touko-1f1c`; **Aiven Apps deploy is NOT
enabled** for us.

## Difficulty verdict (read first)

- **Migrate the data plane** (Aiven Postgres + pgvector + copy data): **🟢 easy** — hours, all real MCP.
- **Realtime → Aiven Postgres events, actually updating the live app**: **🟢/🟡 buildable** — the
  browser-critical path stays simple and reliable.
- **Kafka agent bus proof**: **🟢 easy** — one topic, produce/list events, visible in the control room.
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

**2. Browsers can't speak Kafka.** Do not put Kafka on the browser-critical path for the hackathon.
The demo-safe realtime path should be **Aiven Postgres `app_events` -> browser polling**.
Kafka remains a sponsor-visible proof path: agents publish migration events to Aiven Kafka
`migration.events`, and the UI reads/lists them as the agent bus. This preserves Aiven Kafka depth
without making the stage demo depend on a Kafka consumer bridge.

## What to build (ordered, hardest-risk-first)

| # | Piece | How | Difficulty | In demo? |
|---|---|---|---|---|
| 1 | Aiven Postgres + Kafka provisioned | `aiven_service_create` via MCP; confirm `vector` ext | 🟢 ~done (verified) | ✅ |
| 2 | Schema → Aiven PG | take repo migrations, strip Supabase-isms (auth.*, storage.*, `supabase_realtime`, `pg_net` trigger, `auth.uid()` RLS); apply tables + indexes + `match_posts` via `aiven_pg_write` | 🟢 2–3h | ✅ |
| 3 | Data + embeddings → Aiven PG | read source rows (service_role) → `aiven_pg_write` / COPY | 🟢 2–3h | ✅ |
| 4 | **Postgres events → browser polling bridge** (the hero) | `POST /api/reactions` inserts reaction + `app_events` row in Aiven PG; `/api/events/recent` polls that table; client swaps `supabase.channel` → polling | 🟢 ~2–4h | ✅ |
| 5 | **Kafka agent bus proof** | `migration.events` topic through Aiven MCP; produce/list workflow events in the control room | 🟢 1–2h | ✅ |
| 6 | App reads on Aiven | thin server route for the wall/leaderboard/search hitting Aiven PG (incl. `match_posts`) | 🟡 ~½ day | ✅ |
| 7 | Cost card | live Aiven pricing (reuse `ideas/architecture-advisor`) → Supabase $ vs Aiven $ | 🟢 2–3h | ✅ |
| 8 | CTO recs | read `aiven_service_metrics_fetch` → 1–2 real recommendations | 🟢 2–3h | ✅ |
| 9 | Auth fully working | run GoTrue off-Aiven **or** rewrite app auth | 🔴 1–2 days | ✗ flag |
| 10 | Storage fully working | S3/MinIO + rewrite image URLs | 🟡 ~1 day | ✗ flag |
| 11 | Embed fn | point at OpenAI/Voyage; host off-Aiven (Aiven App when enabled) | 🟡 ~½ day | ◑ optional |

## The cut line for the demo (~1 day)

**In (genuinely working, not faked):** data plane fully on Aiven (#1–3), the **Postgres
events→browser polling bridge so the real wall updates live off Aiven Postgres** (#4), the **Kafka agent
bus proof** (#5), the **cost card** (#7) and **CTO recs** (#8), with the rewired app booting against
Aiven. **Flagged honestly:** auth + storage (#9–10) — classified, with a generated adapter plan, no
live surgery. That is "the Lovable migration working" for the core loop, and every number is real.

**Build order = de-risk #4 first** (right after the spine). The browser update must work reliably on
stage, so make it Postgres-backed and rehearse it before polishing anything else. Keep a **recorded
fallback** of the live migration + the Kafka agent-bus proof.

## What "fully working, zero Supabase, any app" needs later (the product)

Re-host GoTrue + PostgREST + Storage + the realtime bridge as managed services pointed at Aiven PG —
**as Aiven Apps once our account is enabled** (the `aiven_application_deploy` MCP path is proven),
otherwise off-Aiven. Then a `supabase-js` app runs unchanged on Aiven. That's ~a week and it's the
"Stop Managing, Start Building" vision — name it as the roadmap, don't try to build it before the demo.
