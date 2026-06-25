# STATUS — where we are (2026-06-25)

Quick orientation. Full product spec in [idea.md](idea.md), demo script in
[DEMO_FLOW.md](DEMO_FLOW.md), judge profiles in [judges.md](judges.md), and the build architecture
in [plans/ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md](plans/ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md).

## Hackathon frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo: PulseWall starts on Lovable/Supabase -> Aiden scans behavior -> creates an Aiven
  shadow data plane through MCP -> migrates/validates representative data -> rewrites realtime to
  Aiven Postgres `app_events` for the browser-critical path -> validates Aiven Kafka as the
  agent bus / production event path -> cuts over the scoped demo runtime so Supabase is gone from
  the visible app path.
- Cut: production auth migration, production storage migration, full CDC, all source platforms,
  broad schema-conversion tooling, and fully autonomous production cutover.

## What we're building

**Lovable -> Aiven behavior migrator + "Aiven, your CTO" agent.** When a vibe-coded Lovable app
blows up, Aiden graduates its data plane off Supabase onto Aiven. It follows the proven
Supabase/Postgres migration path, builds an Aiven shadow plane, rewrites browser-critical realtime
behavior to Aiven Postgres events, validates Aiven Kafka as the agent bus / production event path,
verifies everything with receipts, and cuts over the scoped demo runtime so Supabase is removed from
the path judges see.

## Locked decisions

- **Behavior migration, not just data migration.** The agent builds a behavior graph and classifies
  Supabase features: direct migrate / Kafka rewrite / adapter required / review required / cut.
- **Use proven migration primitives.** For production, Aiden should orchestrate `supabase db dump`,
  `pg_dump`/`psql`, or `aiven-db-migrate`. For the hackathon demo, migrate representative
  PulseWall rows and prove counts/smoke queries.
- **Aiven control proof is visible and honestly labeled.** The repo has hosted Aiven MCP config, but
  the current local API runtime uses direct Aiven fallback for live Postgres/Kafka proof actions and
  labels those receipts as fallback. Real MCP actions can replace the same receipt slots later.
- **Delete Supabase by moving the scoped runtime path.** Aiven Apps is not required. The rewired app
  talks to Aiven Postgres through backend glue, uses Aiven Postgres `app_events` for demo realtime,
  and shows Aiven Kafka as the agent bus / production event path; auth/storage/RLS are production
  blockers, not demo blockers.
- **Use Claude Agent SDK only for bounded agent work.** Claude explains, classifies, and generates
  report/diff text. Typed code executes migration, validation, Kafka, and cutover steps.
- **Demo app = PulseWall.** Full demo script: [DEMO_FLOW.md](DEMO_FLOW.md).

## Current assets

- **PulseWall exists.** Vite + React + Supabase app in [demo/pulsewall/](demo/pulsewall/). It has
  Supabase Auth, Storage, Realtime, RPC/Edge Function calls, RLS, and pgvector so the scanner can
  find real behavior.
- **Schema exists.** PulseWall schema is in
  [demo/pulsewall/supabase/migrations/0001_init.sql](demo/pulsewall/supabase/migrations/0001_init.sql).
- **Seed exists.** [demo/pulsewall-seed.sql](demo/pulsewall-seed.sql) creates the "blown up" demo
  state: roughly 5k posts and 50k reactions.
- **Lovable/Supabase migration guide exists.**
  [LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md](migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md)
  is the source of truth for the real migration mechanics.
- **Architecture doc exists.**
  [plans/ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md](plans/ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md)
  defines the one-click operator, access ladder, agents, safety gates, and proof package.

## PulseWall behavior map

| Feature on Supabase | Behavior class | Demo beat |
| --- | --- | --- |
| `posts` / `reactions` tables | Direct migrate | row counts match after Aiven sample migration |
| indexes, constraints, triggers | Direct migrate / review | smoke queries and trigger behavior checked |
| pgvector + `match_posts` | Direct migrate if extension available | "AI search moves natively" |
| Realtime wall + leaderboard | Rewrite -> Aiven Postgres events for demo; validate Kafka production path | hero beat: channel -> Postgres event -> browser, plus Kafka agent bus |
| Auth magic link | Adapter required | flagged as production blocker |
| Storage post images | Object-store adapter required | flagged as production blocker |
| Edge function embeddings | Backend worker/API rewrite | not a live production migration target |
| RLS using Supabase auth context | Review required | flagged honestly before production cutover |

## Live demo scope

Run one polished path:

1. Show PulseWall running with Supabase behavior.
2. Click `Graduate To Aiven`.
3. Scan real source files and SQL migrations.
4. Build behavior graph.
5. Verify/create Aiven shadow Postgres + Kafka through MCP.
6. Migrate representative `posts` / `reactions` rows to Aiven Postgres.
7. Validate row counts, smoke query, extension availability, and receipt writes.
8. Rewrite realtime behavior to Aiven Postgres `app_events` and prove browser delivery; also prove Aiven Kafka produce/read as the agent bus.
9. Switch the scoped demo runtime to the Aiven-backed adapter.
10. End on a proof report: Supabase runtime dependency removed for the demo path, blockers listed,
    rollback ready.

## Open blockers / next work

- **Mission 06B workspace framing.** Reframe setup copy as connect/create an Aiven workspace while
  keeping Henri's pre-connected workspace as the demo truth.
- **Manual capture.** Browser screenshot QA and short recorded backup still need a local browser or
  screen recorder; `npm run demo:fallback` already writes local fallback artifacts.
- **Optional Kafka live proof.** Configure Kafka env and pass `npm run verify:live -- --require-kafka`
  only if credentials are ready quickly. Otherwise keep Kafka warning/cached and protect Postgres.
- **Optional real MCP action.** Add one real MCP action receipt if feasible; otherwise keep the direct
  fallback label visible and do not present fallback rows as live MCP tool calls.
- **Keep secrets local.** Supabase/Aiven URLs, service keys, Postgres URLs, Kafka credentials, and
  Anthropic keys stay in `.env.local` only.

## Judge framing

All Aiven judges are product/startup-program oriented, not pure infra reviewers. Lead with:

> Lovable builds the app. Aiden graduates the data plane to Aiven when the app becomes a company.

Then prove it with Aiven action receipts, Postgres validation, Postgres-backed realtime delivery,
Kafka workflow-event proof when available, and the final "Supabase removed from demo runtime" card.
