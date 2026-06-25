# Critical Path — Canonical Entry Point And Roadmap

Date: 2026-06-25

Start here.

This file is the canonical implementation roadmap for Aiden. It owns mission order, dependencies,
acceptance gates, and cut lines. If you are about to code, rehearse, or assign work, use this file
as the entrypoint.

Current next action:

> Build Mission 00, the fixture-backed demo shell, using the final runtime contracts so every
> fixture slot can later be replaced by live Aiven/Supabase proof without changing the demo flow.

## Required Reading

Before starting implementation, read these in order. This file owns the mission order, but the other docs own the exact demo, locked decisions, runtime contracts, Aiven proof, and verification gates.

1. [`../AIDEN_INFO.txt`](../AIDEN_INFO.txt) — sponsor challenge, rubric, and required Aiven/MCP framing.
2. [`../STATUS.md`](../STATUS.md) — locked decisions, current assets, blockers, and judge framing.
3. [`../DEMO_FLOW.md`](../DEMO_FLOW.md) — canonical live-demo script and what judges should see.
4. [`SPEC_STACK.md`](SPEC_STACK.md) — how the planning docs fit together.
5. [`LOCKED_DECISIONS.md`](LOCKED_DECISIONS.md) — final choices; if another doc leaves an option open, this wins.
6. [`RUNTIME_CONTRACTS.md`](RUNTIME_CONTRACTS.md) — state machine, API routes, event payloads, tables, env vars, and provider boundaries.
7. [`MCP_AND_AIVEN_CONTRACT.md`](MCP_AND_AIVEN_CONTRACT.md) — exact Aiven proof actions, receipts, Kafka topic contract, and fallback rules.
8. [`VERIFICATION_RUNBOOK.md`](VERIFICATION_RUNBOOK.md) — preflight gates, rehearsal path, failure fallbacks, and stage runbook.

Do not start broad UI polish or agent-framework work until the reader can explain the demo-safe runtime path:

```text
Browser -> local Aiden adapter -> Aiven Postgres + app_events
Agents  -> Aiven Kafka migration.events
```

## Document Map

Canonical implementation specs:

| Doc | Owns |
| --- | --- |
| [`CRITICAL_PATH.md`](CRITICAL_PATH.md) | Mission order, dependencies, acceptance gates, and cut lines |
| [`LOCKED_DECISIONS.md`](LOCKED_DECISIONS.md) | Non-reopened choices: source app, stack, realtime path, Kafka role, scope, and build priority |
| [`RUNTIME_CONTRACTS.md`](RUNTIME_CONTRACTS.md) | Runtime interfaces, data models, events, tables, and env boundaries |
| [`MCP_AND_AIVEN_CONTRACT.md`](MCP_AND_AIVEN_CONTRACT.md) | Sponsor-visible Aiven MCP actions, receipt shape, Postgres checks, Kafka proof |
| [`VERIFICATION_RUNBOOK.md`](VERIFICATION_RUNBOOK.md) | Demo preflight, validation gates, fallback modes, and rehearsal timing |
| [`SPEC_STACK.md`](SPEC_STACK.md) | Which specs exist and when they are ready for code |

Product and demo references:

| Doc | Use |
| --- | --- |
| [`../DEMO_FLOW.md`](../DEMO_FLOW.md) | The user-facing story and stage sequence. If the UI conflicts with this, fix the UI. |
| [`../BUILD_PLAN.md`](../BUILD_PLAN.md) | Honest difficulty, build order, and what is intentionally cut. |
| [`../STATUS.md`](../STATUS.md) | Current truth of the project and locked architecture choices. |
| [`ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md`](ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md) | Product architecture, agent roster, safety gates, and one-click operator model. |
| [`AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md`](AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md) | Strategy framing and why this is behavior migration, not generic ETL. |

Source and research references:

| Doc | Use |
| --- | --- |
| [`../migration-info/README.md`](../migration-info/README.md) | Raw migration reference index. Use for source facts only; not an architecture authority. |
| [`../LOVABLE_TO_AIVEN_MIGRATION_IDEA.md`](../LOVABLE_TO_AIVEN_MIGRATION_IDEA.md) | Original ideation input. Useful for pitch language, not implementation authority. |
| [`../migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`](../migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md) | Raw Supabase/Postgres migration mechanics: scanner patterns, dump/restore, validation queries, backend boundary, failure modes, and source links. |
| [`../migration-info/AGENTIC_DATABASE_MIGRATION_MARKET_SCAN.md`](../migration-info/AGENTIC_DATABASE_MIGRATION_MARKET_SCAN.md) | Raw company/tool landscape and migration category data. |
| [`../judges.md`](../judges.md) | Judge/sponsor framing if presenter copy needs tuning. |
| [`../idea.md`](../idea.md) | Older idea notes; read only when looking for pitch fragments. |

Demo assets:

| Path | Use |
| --- | --- |
| [`../demo/pulsewall/`](../demo/pulsewall/) | Primary Lovable/Supabase-style source app for the Aiden demo. |
| [`../demo/pulsewall/supabase/migrations/0001_init.sql`](../demo/pulsewall/supabase/migrations/0001_init.sql) | Primary schema source for scanner and migration proof. |
| [`../demo/pulsewall-seed.sql`](../demo/pulsewall-seed.sql) | Seeded demo data for row-count and activity proof. |
| [`../demo/lovable-export-checklist.md`](../demo/lovable-export-checklist.md) | Checklist for treating the demo app like a Lovable export. |
| [`../demo/live-hype-wall/`](../demo/live-hype-wall/) | Secondary Lovable-style reference app; use only if PulseWall is blocked. |

Conflict rule:

- Locked implementation decisions: [`LOCKED_DECISIONS.md`](LOCKED_DECISIONS.md) wins.
- Demo sequence conflicts: [`../DEMO_FLOW.md`](../DEMO_FLOW.md) wins.
- Runtime/API/table conflicts: [`RUNTIME_CONTRACTS.md`](RUNTIME_CONTRACTS.md) wins.
- Aiven/MCP/Kafka proof conflicts: [`MCP_AND_AIVEN_CONTRACT.md`](MCP_AND_AIVEN_CONTRACT.md) wins.
- Build order conflicts: this file wins.
- Raw migration reference conflicts: current specs win over [`../migration-info/`](../migration-info/).
- Historical idea conflicts: current specs win.

## Position

LOCATE: emerging and aligned; ground by building the visible demo shell, then replacing fixtures with live proof.

Backward target:

> In a live Aiven demo, one click migrates PulseWall's scoped happy path from Supabase behavior to an Aiven-backed runtime path, with visible MCP receipts, Aiven Postgres validation, Aiven Postgres event delivery to the browser, Aiven Kafka agent-bus events, and a final proof package.

Forward knowns:

- PulseWall exists under `demo/pulsewall/`.
- Supabase-style behavior is detectable in source and migrations.
- Aiven MCP is the required sponsor surface.
- Aiven Apps is not available.
- Backend glue must run locally for the demo.
- Kafka is kept off the browser-critical path; browser realtime uses Aiven Postgres `app_events` through polling.

## Build Principle

Build the demo shell first, but make it contract-driven, not disposable:

```text
fixture demo shell -> MCP/Postgres proof spine -> scanner -> Aiven Postgres data + app_events -> scoped cutover/browser polling -> Kafka agent-bus proof -> UI hardening
```

The first implementation should make the entire `Graduate To Aiven` story visible with fixture events. Every fixture must use the same `RunEvent`, receipt, validation, Kafka-event, and report contracts that live code will later emit.

Do not start broad visual polish until live proof replacement has begun. The shell exists to lock timing, presenter flow, and UI proof slots; it is not permission to avoid the real Aiven work.

## Recommended Implementation Order

For one implementer, build in this order:

```text
00 -> 01 -> 02 -> 03 -> 05 -> 04 -> 06 -> 07
```

Meaning:

1. fixture-backed demo shell;
2. Aiven proof spine;
3. PulseWall scanner + behavior graph;
4. Aiven Postgres data migration and `app_events`;
5. provider cutover + browser polling proof;
6. Kafka agent bus proof;
7. control room UI hardening + final report;
8. rehearsal hardening.

For two implementers, Mission 04 can run in parallel after Mission 01. It must not delay Mission 05.

## Dependency DAG

```text
00 Fixture-backed demo shell
  -> 01 Aiven proof spine
  -> 03 Aiven Postgres data migration
  -> 05 Provider cutover + Postgres events
       -> 06 Control room UI hardening + final report
            -> 07 Rehearsal hardening

01 Aiven proof spine
  -> 04 Kafka agent bus proof
       -> 06 Control room UI hardening + final report

00 Fixture-backed demo shell
  -> 02 PulseWall scanner + behavior graph
       -> 06 Control room UI hardening + final report
```

Mission 02 and Mission 04 can run in parallel with the Postgres path, but not at the cost of delaying Mission 05. If there is only one implementer, do Mission 04 after Mission 05. Mission 00 should be completed first so all later work has visible slots to replace.

## Mission 00: Fixture-Backed Demo Shell

Status: DEFINED  
Gap T: 14  
Mission T: 14 — would rise if the existing app structure fights the control-room shell  
A: 95  
Cone: narrow-deep  
Depends on: `DEMO_FLOW.md`, runtime event contract

Target:

Make the full demo flow visible immediately, almost hardcoded, using fixture events and fixture data.

Build:

- local control-room page;
- one primary `Graduate To Aiven` button;
- fixture `RunEvent[]` stream with realistic timing;
- source app card;
- behavior map;
- Aiven shadow plane card;
- Aiven Kafka agent bus panel;
- MCP receipt stream;
- row validation cards;
- realtime rewrite card with Postgres events -> browser polling proof slot and Kafka production event-bus proof slot;
- scoped cutover card;
- final report with cost/CTO placeholders clearly fixture-backed.

Acceptance:

- presenter can run the full story in under four minutes without live infra;
- every visible card is fed by the same contract that live code will use later;
- every fixture/live/cached proof has a status field or debug marker;
- no real secret is required for Mission 00;
- hidden/manual step controls exist so the presenter can pause the story.

Kill/fallback:

- If embedding PulseWall is slow, use a source-app card or screenshot-like fixture panel.
- If styling slows work, keep layout simple and dense; proof slots matter more than polish.
- If the event stream state model is unclear, simplify to one append-only `RunEvent[]` array and derive UI state from it.

## Mission 01: Aiven Proof Spine

Status: DEFINED  
Gap T: 15  
Mission T: 15 — would rise if hosted MCP auth or Kafka tool behavior is unstable  
A: 90  
Cone: narrow-deep  
Depends on: Aiven credentials and target project

Target:

Replace the fixture Aiven receipt/Kafka proof blocks with sponsor-visible live Aiven actions.

Build:

- load Aiven connection/config from `.env.local`;
- list/verify Aiven project/services;
- write one row to Aiven Postgres;
- read it back;
- create/verify `migration.events` Kafka topic;
- produce/list one Kafka message;
- write an `mcp_receipts` row.

Acceptance:

- terminal or local API returns project/service status;
- Aiven Postgres contains a receipt row for the run;
- Kafka message roundtrip succeeds;
- Mission 00 UI shows these as live events instead of fixture events;
- failure messages are explicit and demo-safe.

Kill/fallback:

- If service creation is flaky, pre-provision and only verify.
- If Kafka topic creation is flaky, pre-create topic and only produce/list.
- If MCP wrapper blocks execution, call the same action through the lowest-risk available Aiven client but label it as fallback; keep at least one live MCP read/write if possible.

## Mission 02: PulseWall Scanner + Behavior Graph

Status: DEFINED  
Gap T: 12  
Mission T: 12 — would rise if source app shifts substantially  
A: 75  
Cone: narrow-deep  
Depends on: PulseWall fixture

Target:

Replace the fixture behavior graph with a scan of real PulseWall files.

Build:

- scan `demo/pulsewall/` for Supabase markers;
- scan SQL migrations;
- detect tables, realtime, auth, storage, RLS, RPC/functions, pgvector;
- produce deterministic JSON.

Acceptance:

- output includes every row needed by the behavior map;
- output is stable without LLM;
- Mission 00 UI renders scanner output without UI code changes;
- LLM can add explanation but cannot be required for detection.

Kill/fallback:

- If scanner misses real code, add explicit fixture annotations.
- If LLM classification is slow, use deterministic mapping.

## Mission 03: Aiven Postgres Data Migration

Status: DEFINED  
Gap T: 18  
Mission T: 18 — would rise if schema has Supabase-specific statements that block target restore  
A: 85  
Cone: narrow-deep  
Depends on: Mission 01

Target:

Replace fixture row counts with representative PulseWall data in Aiven Postgres and validated reads.

Build:

- create demo schema/tables on Aiven Postgres;
- load representative `posts` and `reactions`;
- create a small `demo_users`/auth mirror only if author labels or foreign keys need it;
- create initial `app_events` rows for the browser polling proof;
- record migration step receipts;
- validate row counts and smoke query;
- optional: check `vector` extension if available.

Acceptance:

- rows exist in Aiven Postgres;
- counts match expected fixture values;
- smoke query passes;
- Mission 00 validation cards show live values instead of fixture values;
- validation rows are written.

Kill/fallback:

- If full schema restore slows work, create a minimal demo schema matching the visible happy path.
- If pgvector is unavailable, mark vector as compatibility finding and do not block demo.

## Mission 04: Kafka Agent Bus Proof

Status: DEFINED  
Gap T: 16  
Mission T: 16 — would lower to 10 after live `migration.events` produce/list is visible in the UI  
A: 90  
Cone: narrow-deep  
Depends on: Mission 01

Target:

Replace fixture Kafka agent-bus events with real Aiven Kafka `migration.events` produce/list output.

Build:

- topic `migration.events`;
- emit agent bus events for each state transition;
- produce/list workflow events;
- show them in the Aiven Kafka Agent Bus panel;
- keep Kafka out of the browser-critical realtime path.

Acceptance:

- control room shows agent bus events from Kafka;
- validation records `kafka_agent_bus_roundtrip`;
- Mission 00 Kafka panel can switch from fixture stream to live stream without layout changes.

Kill/fallback:

- If Kafka consumer logic is unstable, use produce/list polling instead of a long-lived consumer.
- If topic creation is unstable, pre-create `migration.events` and only produce/list live.
- Do not cut Kafka from the demo; demote it to cached only after two failed live rehearsals and keep one smaller live proof if possible.

## Mission 05: Provider Cutover + Postgres Events

Status: DEFINED  
Gap T: 24  
Mission T: 24 — would lower if one visible PulseWall screen loads from Aiven provider and receives one Postgres-backed event  
A: 95  
Cone: narrow-deep  
Depends on: Mission 03

Target:

Replace fixture cutover proof with a scoped demo runtime using the local Aiden adapter, Aiven Postgres data, and Aiven Postgres `app_events` for browser realtime.

Build:

- define `supabaseProvider` and `aivenProvider`;
- backend adapter routes: `GET /api/posts`, `GET /api/leaderboard`, `POST /api/reactions`, `GET /api/events/recent`;
- optional after polling works: `GET /api/events` SSE;
- `POST /api/reactions` inserts a reaction and an `app_events` row in Aiven Postgres;
- `GET /api/events/recent` polls recent `app_events`;
- frontend switch controlled by local config or run state;
- remove Supabase runtime path for the happy screen after cutover.

Acceptance:

- migrated screen reads from Aiven Postgres;
- reaction/event path writes and reads Aiven Postgres `app_events`;
- browser receives one Postgres-backed event through polling;
- no Aiven secret appears in browser env;
- smoke test proves the screen loads after cutover.

Kill/fallback:

- If full PulseWall integration is too slow, build one migrated demo panel in control room that uses the same adapter and clearly label it as the scoped runtime path.
- Do not build SSE until polling works; if polling is unstable, show `/api/events/recent` result in a browser panel.
- Do not put Postgres credentials in Vite client variables.

## Mission 06: Control Room UI Hardening + Final Report

Status: DEFINED  
Gap T: 18  
Mission T: 18 — would rise if underlying events are not ready  
A: 80  
Cone: narrow-deep  
Depends on: Missions 01-05 enough to replay events

Target:

Harden the already-built Mission 00 shell for judges after live proof replacement is underway.

Build:

- cold-open completed state polish;
- source app card polish;
- agent timeline polish;
- behavior map polish;
- Aiven shadow plane card polish;
- Aiven Kafka agent bus panel polish;
- receipt stream polish;
- validation card polish;
- final proof report polish;
- clear fixture/live/cached indicators in debug or presenter mode.

Acceptance:

- `Graduate To Aiven` visibly drives the run;
- every major state has a clear UI proof;
- final report matches `DEMO_FLOW.md`;
- presenter can pause/resume or use manual step controls.
- fixture-backed mode and live mode both use the same visible flow.

Kill/fallback:

- If live state streaming is unstable, use replayable run events from a JSON fixture after at least one live proof action.
- Do not let UI polish delay Mission 05.

## Mission 07: Rehearsal Hardening

Status: DEFINED  
Gap T: 12  
Mission T: 12 — would rise if any live dependency is not reproducible  
A: 95  
Cone: narrow-deep  
Depends on: all previous missions

Target:

Make the pitch reliable.

Build:

- one-command preflight;
- one-command reset;
- seeded data reset;
- cached fallback event stream;
- recorded backup;
- 4-minute script;
- judge Q&A bullets.

Acceptance:

- full demo run completes twice consecutively;
- internet/Aiven failure fallback still tells the story honestly;
- presenter knows exact lines for scoped Supabase removal and auth/storage blockers.

Kill/fallback:

- If a live component fails twice during rehearsal, demote it to recorded/cached proof and keep one smaller live MCP/Kafka action.
