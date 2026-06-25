# End-To-End Demo Setup Checklist

Date: 2026-06-25

## Purpose

This checklist is for getting Aiden from local scaffold to a reliable end-to-end demo run.

It is not an architecture doc. Use it to prepare the machine, accounts, fixture data, live proof
credentials, fallback assets, and rehearsal gates.

## Hackathon Frame

- Type: `sponsor-needs`.
- Judging/submission mode: Aiven partner challenge, short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo: PulseWall -> one click `Graduate To Aiven` -> Aiven Postgres shadow path -> Postgres `app_events` browser polling -> Kafka agent-bus proof -> scoped demo cutover -> final report.
- Intentional cuts: production auth migration, production storage migration, full CDC, Aiven Apps deploy, multi-source support, and complex agent runtime.

## Operating Rule

The end-to-end demo must work without the source app using Kafka.

Kafka is later Aiven-side proof only. Do not block the scaffold, Aiven Postgres migration, or browser-critical `app_events` cutover on Kafka setup.

## Right Now: Human Setup

- [ ] Confirm who is presenting.
- [ ] Confirm target demo machine.
- [ ] Confirm browser for judging.
- [ ] Confirm network fallback: phone hotspot or offline fixture mode.
- [ ] Confirm Aiven account access.
- [ ] Confirm whether Aiven MCP is available from the local environment.
- [ ] Confirm project `.codex/config.toml` has `[mcp_servers.aiven]` with `https://mcp.aiven.live/mcp?allow_secrets=true`.
- [ ] Confirm root `.mcp.json` points at `https://mcp.aiven.live/mcp?allow_secrets=true`.
- [ ] Confirm Aiven project name to use.
- [ ] Confirm whether Postgres service already exists or must be created.
- [ ] Confirm whether Kafka service already exists or can be created later.
- [ ] Decide where secrets live: local `.env.local` only.
- [ ] Do not commit `.env.local`, screenshots with secrets, terminal output with tokens, or real connection strings.
- [ ] Do not add secrets to `.mcp.json`; keep local secret material in ignored env or tool auth state only.
- [ ] Do not add secrets to `.codex/config.toml`; use Codex MCP auth/tooling or ignored env files for local secret material.

## Local Machine Setup

- [ ] Node version works with the scaffold.
- [ ] `npm install` completes at repo root.
- [ ] `npm run dev` starts both services.
- [ ] Control room opens at `http://localhost:5173`.
- [ ] API runs at `http://localhost:8787`.
- [ ] Vite proxies `/api` to the local API.
- [ ] `npm run typecheck` passes or known type gaps are logged in `plans/IMPLEMENTATION_TRACKER.md`.
- [ ] Browser console has no fatal errors.
- [ ] No Aiven/Supabase secret is required in fixture mode.

## Mission 00 Fixture Run

The first end-to-end run is fixture-only.

- [ ] Cold-open outcome renders first.
- [ ] `Graduate To Aiven` is the only obvious primary action.
- [ ] Clicking it plays the full fixture `RunEvent[]`.
- [ ] Manual presenter controls can reset, pause, and advance.
- [ ] Source app panel shows PulseWall before path.
- [ ] Behavior map shows tables, realtime, auth, storage, RLS, RPC/edge, pgvector.
- [ ] Aiven shadow plane shows fixture Postgres, Kafka, and MCP receipts.
- [ ] Validation cards show row counts and smoke checks.
- [ ] Realtime proof shows Supabase Realtime -> Aiven Postgres `app_events` -> browser polling.
- [ ] Kafka panel shows fixture `migration.events` agent-bus events.
- [ ] Cutover panel shows old path vs scoped Aiven-backed runtime.
- [ ] Final report renders from a typed `Report` object.
- [ ] `fixture`, `live`, and `cached` labels exist in presenter/debug mode.

## Fixture API Smoke Tests

Run these after Mission 00 endpoints exist:

- [ ] `POST /api/runs` creates a run.
- [ ] `POST /api/runs/:runId/graduate` starts playback.
- [ ] `GET /api/runs/:runId` returns derived run state.
- [ ] `GET /api/runs/:runId/report` returns final report data.
- [ ] `GET /api/posts` returns fixture migrated posts.
- [ ] `GET /api/leaderboard` returns fixture leaderboard.
- [ ] `POST /api/reactions` appends a fixture reaction and `app_events` row.
- [ ] `GET /api/events/recent` returns recent fixture `app_events`.

Do not build `/api/events` SSE until `/api/events/recent` polling works.

## Source App Prep

Primary source app:

- [ ] Use `demo/pulsewall/` as canonical source.
- [ ] Verify source files contain Supabase usage for scanner.
- [ ] Verify SQL migration exists at `demo/pulsewall/supabase/migrations/0001_init.sql`.
- [ ] Verify seed exists at `demo/pulsewall-seed.sql`.
- [ ] Keep `demo/live-hype-wall/` as reference/stress case only.

Live source is optional:

- [ ] If live source app is needed, create or use a Supabase project.
- [ ] Fill `SOURCE_SUPABASE_URL` and `SOURCE_SUPABASE_ANON_KEY` in local `.env.local`.
- [ ] Use `SOURCE_SUPABASE_SERVICE_ROLE_KEY` only if needed for blocked reads.
- [ ] Do not make live source access a blocker for the fixture or seeded Aiven demo path.

## Aiven Postgres Setup

This is the first live infrastructure path to make reliable.

- [ ] Aiven project exists.
- [ ] Aiven Postgres service exists or can be created.
- [ ] Postgres connection string is available locally.
- [ ] Connection works from the demo machine.
- [ ] Required target tables can be created:
  - `migration_runs`
  - `mcp_receipts`
  - `validation_checks`
  - `posts`
  - `reactions`
  - `app_events`
- [ ] Optional `demo_users` table is created only if needed.
- [ ] `vector` extension check is implemented or skipped with a compatibility finding.
- [ ] One receipt row can be inserted and read back.
- [ ] Representative `posts` and `reactions` can be inserted.
- [ ] Row count validation passes.
- [ ] `POST /api/reactions` writes a reaction and `app_events` row.
- [ ] `GET /api/events/recent` reads that event.
- [ ] Browser updates from `/api/events/recent` polling.

## Local `.env.local` Template

Use placeholders only in docs:

```text
DEMO_MODE=fixture
AIVEN_TOKEN=
AIVEN_PROJECT=
AIVEN_PG_SERVICE=
AIVEN_POSTGRES_URL=

# Optional until Kafka proof work starts
AIVEN_KAFKA_SERVICE=
AIVEN_KAFKA_BOOTSTRAP_SERVERS=
AIVEN_KAFKA_USERNAME=
AIVEN_KAFKA_PASSWORD=

# Optional source app live mode
SOURCE_SUPABASE_URL=
SOURCE_SUPABASE_ANON_KEY=
SOURCE_SUPABASE_SERVICE_ROLE_KEY=

# Optional summaries/report text only
ANTHROPIC_API_KEY=
ENABLE_LLM_SUMMARIES=false
```

## Kafka Setup Later

Kafka testing comes after the scaffold, Aiven Postgres migration, and browser-critical `app_events` cutover path.

- [ ] Aiven Kafka service exists.
- [ ] Kafka credentials are available locally.
- [ ] `migration.events` topic exists or can be created.
- [ ] One workflow event can be produced.
- [ ] That event can be listed/read.
- [ ] Kafka panel can switch from fixture events to live `migration.events` proof.
- [ ] If Kafka is unstable, keep cached same-day Kafka proof and run one smaller live produce/list action.

Do not build `app.outbox.posts` unless everything else works.

## Demo Fallback Assets

Prepare before live rehearsals:

- [ ] Fixture mode can run the full flow offline.
- [ ] Same-day cached Aiven Postgres receipt stream exists.
- [ ] Same-day cached Kafka event proof exists if Kafka is attempted.
- [ ] Static screenshot of source app exists.
- [ ] Static screenshot of final report exists.
- [ ] Short recording of successful run exists.
- [ ] Presenter has exact fallback line for cached proof:

```text
This run is replaying the same receipt stream from rehearsal; here is one live Aiven write now.
```

## Visual QA

Check before calling Mission 00 done:

- [ ] Desktop screenshot at laptop demo size.
- [ ] Mobile/narrow screenshot or at least narrow-browser check.
- [ ] No overlapping text.
- [ ] No overflowing buttons.
- [ ] No clipped status labels.
- [ ] Proof cards have stable dimensions.
- [ ] First viewport communicates the outcome without explanation.
- [ ] Cold-open screen looks like a completed result, not a placeholder.
- [ ] `fixture/live/cached` labels are visible in presenter/debug mode.
- [ ] Judge-facing mode is clean and not dominated by debug labels.

## End-To-End Rehearsal Gates

Run in this order:

- [ ] Fixture-only full run.
- [ ] Fixture run with presenter pause/reset controls.
- [ ] Aiven Postgres receipt write/read live.
- [ ] Aiven Postgres data migration live.
- [ ] Aiven Postgres `app_events` polling live.
- [ ] Scoped cutover path reads through local adapter.
- [ ] Kafka smoke proof, only after Postgres path works.
- [ ] Final report with mixed `live/cached/fixture` values clearly labeled.
- [ ] Full four-minute presentation once.
- [ ] Full four-minute presentation twice consecutively.

## Final Go / No-Go

Go if:

- [ ] fixture path is complete;
- [ ] Aiven Postgres receipt and validation are live;
- [ ] browser-critical `app_events` polling works or has an honest browser-panel fallback;
- [ ] Kafka is live or safely cached with one smaller live proof planned;
- [ ] final report renders;
- [ ] presenter can explain scoped demo runtime in one sentence;
- [ ] no secrets appear in browser env, docs, screenshots, or terminal output.

No-go if:

- [ ] `npm run dev` cannot start the local demo;
- [ ] source app or source fixture cannot be shown;
- [ ] no Aiven Postgres write/read proof exists;
- [ ] final report cannot be shown;
- [ ] fallback mode is not rehearsed.
