# Critical Path — Canonical Entry Point And Roadmap

Date: 2026-06-25

Start here.

This file is the canonical implementation roadmap for Aiden. It owns mission order, dependencies,
acceptance gates, and cut lines. If you are about to code, rehearse, or assign work, use this file
as the entrypoint.

Current next action:

> Capture final screenshots/recording and rehearse the final pitch from `/setup` through `/control`.
> Mission 06A Access Broker, Mission 05.6 one-click runtime, Mission 05.7 Anthropic Agent SDK
> reasoner, Mission 06 control-room hardening, Mission 06B Aiven Workspace Bootstrap framing,
> Mission 06C Source Intake & Workspace Setup, and Mission 07 rehearsal commands are implemented.
> The one-click live Aiven Postgres runtime path
> passes two consecutive rehearsals; Kafka can remain warning-only until credentials are configured.

## Endgoal Vision: Win

The goal is to win the Aiven challenge by making judges feel, within the first 30 seconds, that
they are watching the future control plane Aiven should own. Aiden should look calm, expensive,
legible, and inevitable: one button turns a Lovable/Supabase prototype into an Aiven-backed
runtime with visible receipts, validation, and an executive-ready migration report.

The UI is the primary product proof. How the control room looks, moves, reads, and makes judges
feel is more important than invisible implementation depth. Function is secondary when it does
not change what judges can understand, trust, or remember on stage. Prefer one beautiful,
credible, emotionally clear migration path over broader functionality that looks like a debug
tool.

This is not permission to fake the sponsor proof. Fixture, cached, fallback, and live states must
stay honestly labeled. But every technical task must earn its place on screen: if a feature does
not strengthen the `Graduate To Aiven` moment, the Aiven proof, the final report, or the judge's
confidence, cut it.

## Required Reading

Before starting implementation, read these in order. This file owns the mission order, but the other docs own the exact demo, locked decisions, runtime contracts, Aiven proof, and verification gates.

1. [`../AIDEN_INFO.txt`](../AIDEN_INFO.txt) — sponsor challenge, rubric, and required Aiven/MCP framing.
2. [`../STATUS.md`](../STATUS.md) — locked decisions, current assets, blockers, and judge framing.
3. [`../DEMO_FLOW.md`](../DEMO_FLOW.md) — canonical live-demo script and what judges should see.
4. [`UI_DECISION_PACKAGE.md`](UI_DECISION_PACKAGE.md) — control-room visual direction, screen architecture, proof hierarchy, and UI acceptance gates.
5. [`UI_IMPLEMENTATION_SPEC.md`](UI_IMPLEMENTATION_SPEC.md) — concrete frontend routes, components, visual tokens, copy replacements, and UI build order.
6. [`SPEC_STACK.md`](SPEC_STACK.md) — how the planning docs fit together.
7. [`LOCKED_DECISIONS.md`](LOCKED_DECISIONS.md) — final choices; if another doc leaves an option open, this wins.
8. [`RUNTIME_CONTRACTS.md`](RUNTIME_CONTRACTS.md) — state machine, API routes, event payloads, tables, env vars, and provider boundaries.
9. [`MCP_AND_AIVEN_CONTRACT.md`](MCP_AND_AIVEN_CONTRACT.md) — exact Aiven proof actions, receipts, Kafka topic contract, and fallback rules.
10. [`VERIFICATION_RUNBOOK.md`](VERIFICATION_RUNBOOK.md) — preflight gates, rehearsal path, failure fallbacks, and stage runbook.
11. [`live-aiven-verification-gate/README.md`](live-aiven-verification-gate/README.md) — focused M05.5 spec for proving M01, M03, and M05 against live Aiven before more polish.
12. [`access-broker-permission-ux/README.md`](access-broker-permission-ux/README.md) — product spec for access rights, permission preflight, and the visible setup step before one-click migration.
13. [`aiven-workspace-bootstrap/README.md`](aiven-workspace-bootstrap/README.md) — M06B spec for "connect Aiven account/project, then create fresh services" product framing.
14. [`source-intake-workspace-setup/README.md`](source-intake-workspace-setup/README.md) — M06C spec for source selection, source data path, workspace selection, and scope confirmation before the control room.
15. [`one-click-agent-runtime/README.md`](one-click-agent-runtime/README.md) — M05.6 spec for the bounded one-click agent orchestrator and optional Anthropic reasoner.
16. [`anthropic-agent-sdk-reasoner/README.md`](anthropic-agent-sdk-reasoner/README.md) — M05.7 spec for Anthropic Agent SDK as the bounded Aiven MCP Report/CTO Agent.

Do not start broad visual expansion or agent-framework work until the reader can explain the demo-safe runtime path:

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
| [`MCP_AND_AIVEN_CONTRACT.md`](MCP_AND_AIVEN_CONTRACT.md) | Sponsor-visible Aiven control actions, receipt shape, Postgres checks, Kafka proof |
| [`VERIFICATION_RUNBOOK.md`](VERIFICATION_RUNBOOK.md) | Demo preflight, validation gates, fallback modes, and rehearsal timing |
| [`live-aiven-verification-gate/README.md`](live-aiven-verification-gate/README.md) | M05.5 live Aiven verification gate, script contract, pass/fail assertions, and fallback policy |
| [`access-broker-permission-ux/README.md`](access-broker-permission-ux/README.md) | Access Broker UX, permission ladder, access snapshot contract, and preflight gating |
| [`aiven-workspace-bootstrap/README.md`](aiven-workspace-bootstrap/README.md) | Aiven-native account/workspace onboarding story, demo workspace hardwiring rules, and UI copy |
| [`source-intake-workspace-setup/README.md`](source-intake-workspace-setup/README.md) | Source intake/setup screen, demo profile selection, source data path, workspace mode, and scope confirmation |
| [`one-click-agent-runtime/README.md`](one-click-agent-runtime/README.md) | M05.6 one-click agent runtime, step registry, optional reasoner, and verifier mode |
| [`anthropic-agent-sdk-reasoner/README.md`](anthropic-agent-sdk-reasoner/README.md) | M05.7 Anthropic Agent SDK report reasoner, SDK restrictions, and proof metadata |
| [`SPEC_STACK.md`](SPEC_STACK.md) | Which specs exist and when they are ready for code |
| [`SCAFFOLD_STUB_PLAN.md`](SCAFFOLD_STUB_PLAN.md) | Top-down skeleton plan for contracts, stubs, fixture flow, UI panels, and replacement order |
| [`UI_DECISION_PACKAGE.md`](UI_DECISION_PACKAGE.md) | Control-room visual direction, screen architecture, component hierarchy, proof labels, and UI quality gates |
| [`UI_IMPLEMENTATION_SPEC.md`](UI_IMPLEMENTATION_SPEC.md) | Concrete sales/control route plan, component changes, CSS tokens, copy replacements, and UI implementation sequence |

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
- UI/layout/visual hierarchy conflicts: [`UI_DECISION_PACKAGE.md`](UI_DECISION_PACKAGE.md) wins unless it conflicts with the demo flow, locked decisions, or runtime contracts.
- UI implementation-detail conflicts: [`UI_IMPLEMENTATION_SPEC.md`](UI_IMPLEMENTATION_SPEC.md) wins unless it conflicts with `UI_DECISION_PACKAGE.md`, demo flow, locked decisions, or runtime contracts.
- Build order conflicts: this file wins.
- Scaffold conflicts: [`SCAFFOLD_STUB_PLAN.md`](SCAFFOLD_STUB_PLAN.md) is subordinate to locked decisions, runtime contracts, and this critical path.
- Raw migration reference conflicts: current specs win over [`../migration-info/`](../migration-info/).
- Historical idea conflicts: current specs win.

## Position

LOCATE: emerging and aligned; ground by building the visible demo shell, then replacing fixtures with live proof.

Backward target:

> In a live Aiven demo, one click migrates PulseWall's scoped happy path from Supabase behavior to an Aiven-backed runtime path, with visible Aiven receipts, Aiven Postgres validation, Aiven Postgres event delivery to the browser, a Kafka workflow-events slot that is live when configured or warning/cached otherwise, and a final proof package.

Forward knowns:

- PulseWall exists under `demo/pulsewall/`.
- Supabase-style behavior is detectable in source and migrations.
- Aiven MCP through the Anthropic Agent SDK is the required sponsor-facing control-plane surface; direct Aiven fallback is allowed only for live data-plane proof actions and must be labeled honestly.
- Aiven Apps is not available.
- Backend glue must run locally for the demo.
- Kafka is kept off the browser-critical path; browser realtime uses Aiven Postgres `app_events` through polling.

## Build Principle

Build the demo shell first, but make it contract-driven and demo-quality, not disposable:

```text
fixture demo shell -> Aiven receipt/Postgres proof spine -> scanner -> Aiven Postgres data + app_events -> scoped cutover/browser polling -> Kafka workflow proof slot -> UI hardening
```

The first implementation should make the entire `Graduate To Aiven` story visible with fixture events, including the cold-open outcome screen from `DEMO_FLOW.md`. Every fixture must use the same `RunEvent`, receipt, validation, Kafka-event, and report contracts that live code will later emit.

UI is part of the product proof, not decoration. Mission 00 needs a polished control room with clear hierarchy, credible status cards, crisp motion, and a readable final report from the start. Later missions replace fixture data with live proof; they should not require a UI redesign.

The priority order is:

1. judge-visible clarity, emotion, and stage confidence;
2. sponsor-visible Aiven proof;
3. enough live function to make the proof credible;
4. everything else.

Do not start broad cosmetic expansion until live proof replacement has begun. Keep the UI focused and high-quality, but avoid adding screens that do not serve the locked demo flow. If implementation depth and demo impact conflict, protect the visible judge experience first, as long as the proof labels remain honest.

## Recommended Implementation Order

For one implementer, build in this order:

```text
00 -> 01 -> 02 -> 03 -> 05 -> 05.5 -> 06A -> 05.6 -> 04 -> 06 -> 06B -> 06C -> 07
```

Meaning:

1. fixture-backed demo shell;
2. Aiven proof spine;
3. PulseWall scanner + behavior graph;
4. Aiven Postgres data migration and `app_events`;
5. provider cutover + browser polling proof;
6. live Aiven verification gate for Missions 01, 03, and 05;
7. access broker permission UX;
8. one-click bounded agent runtime;
9. Kafka agent bus proof;
10. control room UI hardening + final report;
11. Aiven workspace bootstrap framing;
12. source intake and workspace setup screen;
13. rehearsal hardening.

For two implementers, Mission 04 can run in parallel after Mission 01. It must not delay Mission 05.

## Dependency DAG

```text
00 Fixture-backed demo shell
  -> 01 Aiven proof spine
  -> 03 Aiven Postgres data migration
  -> 05 Provider cutover + Postgres events
       -> 05.5 Live Aiven verification gate
       -> 06A Access broker permission UX
       -> 05.6 One-click agent runtime
       -> 06 Control room UI hardening + final report
            -> 06B Aiven workspace bootstrap framing
            -> 06C Source intake and workspace setup
            -> 07 Rehearsal hardening

01 Aiven proof spine
  -> 04 Kafka agent bus proof
       -> 06 Control room UI hardening + final report

00 Fixture-backed demo shell
  -> 02 PulseWall scanner + behavior graph
       -> 06 Control room UI hardening + final report
```

Mission 02 and Mission 04 can run in parallel with the Postgres path, but not at the cost of delaying Mission 05. If there is only one implementer, do Mission 04 after Mission 05. Mission 00 should be completed first so all later work has visible slots to replace.

Mission 05.5 is the live verification gate for Missions 01, 03, and 05. Mission 05.6 now makes the
visible product action match the one-click demo promise. Mission 06A turns the access-rights
inquiry into a visible product preflight before broad UI polish. Mission 06B upgrades that story
from credential/access language into Aiven workspace onboarding: connect an existing Aiven account
or let Aiden create a workspace if none exists. Mission 06C adds the missing source-intake product
step so PulseWall and fresh Aiven landing-zone creation are selected demo profile choices, not invisible hardcoding.
Kafka live proof can remain warning-only unless credentials are available quickly.

## Mission 00: Fixture-Backed Demo Shell

Status: BUILT
Gap T: 14
Mission T: 14 — would rise if the existing app structure fights the control-room shell
A: 95
Cone: narrow-deep
Depends on: `DEMO_FLOW.md`, runtime event contract

Target:

Make the full demo flow visible immediately, almost hardcoded, using fixture events and fixture data.

Build:

- local control-room page;
- cold-open completed outcome screen;
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

- cold-open outcome state is present and can be shown before rewinding to the run;
- first screen makes the product feel real, premium, and sponsor-native before any code detail is explained;
- presenter can run the full story in under four minutes without live infra;
- every visible card is fed by the same contract that live code will use later;
- every fixture/live/cached proof has a status field or debug marker;
- UI has a clear demo-ready visual hierarchy; no overlapping text, cramped controls, or placeholder-looking proof cards;
- no real secret is required for Mission 00;
- hidden/manual step controls exist so the presenter can pause the story.

Kill/fallback:

- If embedding PulseWall is slow, use a source-app card or screenshot-like fixture panel.
- If styling slows work, keep layout simple and dense, but keep the quality floor high enough for judging; do not downgrade the UI into a debug dashboard.
- If the event stream state model is unclear, simplify to one append-only `RunEvent[]` array and derive UI state from it.

## Mission 01: Aiven Proof Spine

Status: LIVE PG VERIFIED / DIRECT FALLBACK
Gap T: 15
Mission T: 15 — would rise if hosted MCP auth or Kafka tool behavior is unstable
A: 90
Cone: narrow-deep
Depends on: Aiven credentials and target project

Target:

Replace the fixture Aiven receipt blocks with a small sponsor-visible live Aiven proof spine. The Agent SDK owns the Aiven MCP control-plane path; current Postgres/Kafka data-plane proof code may use direct fallback only when the equivalent MCP action is not reliable yet, and must label those receipts. Kafka here is only a smoke proof; Mission 04 owns the visible Kafka workflow-events panel.

Build:

- load Aiven connection/config from `.env.local`;
- list/verify Aiven project/services when REST/MCP credentials are available;
- write one row to Aiven Postgres;
- read it back;
- create/verify `migration.events` Kafka topic;
- produce/list one Kafka message;
- write an `mcp_receipts` row.

Acceptance:

- terminal or local API returns project/service status;
- Aiven Postgres contains a receipt row for the run;
- one Kafka smoke message roundtrip succeeds when Kafka credentials are configured, otherwise the Kafka slot is warning/cached;
- Mission 00 UI shows these as live events instead of fixture events;
- failure messages are explicit and demo-safe.

Kill/fallback:

- If service creation is flaky, pre-provision and only verify.
- If Kafka topic creation is flaky, pre-create topic and only produce/list.
- If an MCP write/read wrapper blocks browser-critical execution, call the same action through the lowest-risk available Aiven client and label it as fallback; the Agent SDK MCP control-plane probe remains the canonical sponsor-facing path.

## Mission 02: PulseWall Scanner + Behavior Graph

Status: BUILT
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

Status: LIVE PG VERIFIED
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

Status: BUILT / OPTIONAL LIVE CREDS PENDING
Gap T: 16
Mission T: 16 — would lower to 10 after live `migration.events` produce/list is visible in the UI
A: 90
Cone: narrow-deep
Depends on: Mission 01

Target:

Replace the fixture Kafka agent-bus panel with real Aiven Kafka `migration.events` produce/list output for the workflow timeline when Kafka credentials are available. Without Kafka credentials, keep the same panel as warning/cached and do not block the Postgres runtime path.

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
- Do not put Kafka on the browser-critical path. If credentials are unavailable, keep the Kafka slot cached/warning-labeled and protect the live Postgres proof.

## Mission 05: Provider Cutover + Postgres Events

Status: LIVE PG VERIFIED
Gap T: 24
Mission T: 24 — would lower if one visible PulseWall screen loads from Aiven provider and receives one Postgres-backed event
A: 95
Cone: narrow-deep
Depends on: Mission 03

Target:

Replace fixture cutover proof with a scoped demo runtime using the local Aiden adapter, Aiven Postgres data, and Aiven Postgres `app_events` for browser realtime.

This is the protected technical mission. If time gets tight, cut optional SSE, live pricing, extra report copy, and nonessential scanner breadth before weakening this proof.

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

## Mission 05.5: Live Aiven Verification Gate

Status: LIVE PG PASSED / KAFKA ENV PENDING
Gap T: 10
Mission T: 10 — would rise if Aiven network access, credentials, or service permissions are unstable
A: 95
Cone: narrow-deep
Depends on: Missions 01, 03, and 05 scaffold paths

Target:

Prove the cached/scaffold Aiven path against real Aiven infrastructure before adding more UI or
Kafka surface area.

Detailed spec:

- [`live-aiven-verification-gate/README.md`](live-aiven-verification-gate/README.md)

Build:

- add one repeatable `npm run verify:live` script;
- create a fresh run through the local API;
- run source scan, proof spine, data migration, and provider cutover;
- assert that Aiven Postgres migration and scoped runtime cutover are live, not cached;
- verify `/api/posts`, `/api/leaderboard`, `/api/reactions`, and `/api/events/recent` after cutover;
- treat Kafka as a warning unless Kafka env is configured or a future `--require-kafka` flag is used;
- print a short pass/fail summary without secrets.

Acceptance:

- missing `AIVEN_POSTGRES_URL` fails fast with no secret leakage;
- live Aiven Postgres data migration passes row counts for `posts`, `reactions`, `demo_users`, and `app_events`;
- provider cutover switches `/api/adapter/status` to `live`;
- reaction write creates an `app_events` row visible through `/api/events/recent`;
- final report marks scoped demo cutover as passed;
- Kafka is reported as live when configured and as a warning when missing;
- implementation tracker records the first real result.

Kill/fallback:

- If Aiven Postgres cannot pass, do not claim live cutover; use fixture mode with honest presenter copy.
- If Kafka cannot pass, keep it cached/same-day and continue with the browser-critical Aiven Postgres path.
- If the full source app display is unstable, prove the scoped runtime through the control-room panel and adapter endpoints.

## Mission 06A: Access Broker Permission UX

Status: LIVE PG VERIFIED
Gap T: 10
Mission T: 10 — would rise if access checks need deeper MCP integration than current verifier state
A: 90
Cone: narrow-deep
Depends on: Mission 05.5 live Postgres path

Target:

Make the access-rights inquiry a visible product step before `Graduate To Aiven`.

Detailed spec:

- [`access-broker-permission-ux/README.md`](access-broker-permission-ux/README.md)

Build:

- add an Access Broker panel near the command strip;
- define typed access checks for repo/source, source data, Aiven MCP, Aiven project, Aiven Postgres, Aiven Kafka, local demo adapter, production Auth, production Storage, and production cutover;
- represent required, warning, later, and not-requested permissions distinctly;
- add an access preflight API/state path or derive the first implementation from the existing `access.connected` event;
- keep `Graduate To Aiven` enabled only when required checks pass;
- make Kafka/Auth/Storage/production cutover honest non-blocking states, not hidden failures;
- never expose credentials, connection strings, tokens, or raw env values.

Acceptance:

- first viewport shows that setup is the access grant and the product action is one click;
- Aiven Postgres read/write access is visibly live verified;
- Kafka absence appears as warning/cached proof, not as a failed migration;
- Auth, Storage, and production cutover are clearly not requested for the demo path;
- the presenter can explain permissions in under 20 seconds;
- no secrets appear in the UI, terminal output, docs, screenshots, or browser env.

Kill/fallback:

- If live access probing is flaky, show the last verified M05.5 access snapshot as cached and run one smaller live Postgres proof.
- If backend contract work is too slow, ship a typed fixture/current-env panel first and wire refresh later.
- Do not build a multi-page onboarding wizard.

## Mission 05.6: One-Click Agent Runtime

Status: LIVE PG VERIFIED
Gap T: 12
Mission T: 12 — would rise if the existing run-store functions are hard to compose safely
A: 90
Cone: narrow-deep
Depends on: Mission 05.5 live Postgres path

Target:

Make the visible `Graduate To Aiven` action run the full bounded agent workflow instead of requiring
separate presenter clicks for scan, proof spine, migration, cutover, Kafka, and report.

Detailed spec:

- [`one-click-agent-runtime/README.md`](one-click-agent-runtime/README.md)

Build:

- add a deterministic one-click orchestrator;
- define a typed agent-step registry around existing scanner/Aiven/migration/cutover/Kafka functions;
- make `POST /api/runs/:runId/graduate` call the orchestrator;
- keep individual proof routes as presenter/debug fallback controls;
- keep Anthropic/LLM report reasoning optional and text-only, while allowing the Aiven Operator Agent one bounded read-only MCP control-plane probe;
- add `npm run verify:live -- --one-click`.

Acceptance:

- one visible click runs the full migration flow end to end;
- presenter does not need separate proof buttons during the main demo;
- live Aiven Postgres path still passes;
- one-click verifier passes with `npm run verify:live -- --one-click`;
- Kafka remains warning-only when env is missing;
- Anthropic/LLM failure cannot block the run;
- fixture/live/cached labels remain honest.

Kill/fallback:

- If the orchestrator is unstable, keep separate proof buttons as fallback and replay the last verified live run.
- If Anthropic integration slows work, cut it and keep deterministic agent steps.
- If Kafka remains unavailable, keep it cached/skipped and protect the live Postgres cutover proof.

## Mission 05.7: Anthropic Agent SDK Report Reasoner And Aiven Operator Probe

Status: LIVE VERIFIED
Gap T: 6
Mission T: 6 — would rise if the local Claude Code executable is unavailable
A: 90
Cone: narrow-deep
Depends on: Mission 05.6 one-click runtime

Target:

Use Anthropic Agent SDK for the bounded Report/CTO Agent and the Aiven Operator control-plane probe.
Give the SDK direct access to the Aiven MCP server, not Codex project settings, while keeping
shell/file/web tools disabled.

Detailed spec:

- [`anthropic-agent-sdk-reasoner/README.md`](anthropic-agent-sdk-reasoner/README.md)

Build:

- install `@anthropic-ai/claude-agent-sdk`;
- implement an SDK-backed `AgentReasoner`;
- implement an SDK-backed Aiven Operator probe that records `aiven.mcp.agent.probed`;
- restrict SDK execution to bounded turns with no built-in shell/file/web tools, no local settings sources, and only allowlisted Aiven MCP tools;
- keep deterministic fallback;
- store reasoner metadata in `proof.package.generated.details`;
- verify one-click proof package records `anthropic_agent_sdk` when the SDK succeeds.

Acceptance:

- `npm run typecheck` passes;
- `npm run verify:live -- --one-click` passes and reports `agent sdk reasoner: Anthropic Agent SDK produced proof text`;
- proof spine records `aiven.mcp.agent.probed` and marks it `live/ok` only when an Aiven MCP tool call is observed;
- deterministic fallback still completes the run if the SDK fails;
- no secrets are exposed to the browser, terminal, docs, or committed files.

Kill/fallback:

- If the bundled SDK binary fails, use `CLAUDE_CODE_EXECUTABLE` or `~/.local/bin/claude`.
- If the SDK remains unreliable on stage, set `AGENT_REASONER=off` and use deterministic report text.

## Mission 06: Control Room UI Hardening + Final Report

Status: BUILT / LIVE PG VERIFIED
Gap T: 18
Mission T: 18 — would rise if underlying events are not ready
A: 80
Cone: narrow-deep
Depends on: Missions 01-05 enough to replay events

Target:

Harden the already-built Mission 00 shell for judges after live proof replacement is underway.

This mission is required. It is not a downgrade target. Mission 06 turns the working proof into a stage-ready product surface while preserving the Mission 00 contracts.

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
- judge-facing screens feel like a finished migration product, not an internal observability dashboard;
- presenter can pause/resume or use manual step controls;
- fixture-backed mode and live mode both use the same visible flow.

Kill/fallback:

- If live state streaming is unstable, use replayable run events from a JSON fixture after at least one live proof action.
- Do not let cosmetic expansion delay Mission 05, but keep the UI quality bar intact throughout the build.

## Mission 06B: Aiven Workspace Bootstrap Framing

Status: BUILT / LIVE PG VERIFIED
Gap T: 4
Mission T: 4 — would rise only if implemented as real signup/billing automation
A: 95
Cone: narrow-deep
Depends on: Missions 06A and 06

Target:

Reframe setup from "grant Aiden credentials" to "connect or create an Aiven workspace." The product
story is that Aiden brings the app into Aiven's control plane. If the user already has Aiven, Aiden
connects to that workspace. If the user does not, Aiden can create the Aiven workspace during setup.

Detailed spec:

- [`aiven-workspace-bootstrap/README.md`](aiven-workspace-bootstrap/README.md)

Demo truth:

- The hackathon demo connects to an Aiven account/project and creates a fresh Aiven Postgres service for each graduation run.
- The account/project permission is wired through local `.env.local` values and Aiven MCP/OAuth where available.
- The UI should label the target as a fresh Aiven landing zone, not as a pre-created service.
- The repo must never hardcode raw credentials, tokens, passwords, connection strings, or Kafka secrets.

Build:

- update first-screen copy from access/credential-first language to Aiven workspace language;
- keep the existing `AccessSnapshot` and permission gates under the hood;
- show `Aiven account: connected` and `Fresh Postgres target: created during graduation`;
- include a line such as `Aiden creates a new Aiven Postgres service for each graduation run.`;
- label the demo honestly as `fresh Aiven landing zone`;
- preserve `Production cutover: not requested`;
- do not implement real account creation before rehearsal.

Acceptance:

- judges understand Aiden as an Aiven-native workspace operator;
- `/setup` makes the source app, source data path, Aiven workspace, and migration scope explicit
  before judges reach the control room;
- the setup story is "connect or create Aiven workspace," not "paste credentials";
- the demo is described as fresh service provisioning inside a connected Aiven account/project;
- no secret values appear in docs, UI, terminal output, screenshots, committed files, or examples;
- `npm run verify:live -- --one-click` still passes after any copy/UI change.

Kill/fallback:

- If UI time is tight, update only the Access Broker heading/copy and presenter script.
- If asked whether account creation is implemented, say the demo requires an authenticated Aiven account/project and creates fresh services there.
- Do not build signup, billing, account provisioning, or new Aiven organization APIs during the hackathon.

## Mission 06C: Source Intake & Workspace Setup

Status: BUILT / LIVE PG VERIFIED
Gap T: 5
Mission T: 5 — would rise if implemented as real GitHub OAuth/upload/import
A: 95
Cone: narrow-deep
Depends on: Missions 06B and 06

Target:

Add the product step before the control room: select the app source, source data path, Aiven
workspace mode, and migration scope. PulseWall and fresh Aiven landing-zone creation should appear as
selected demo profile choices, not hidden assumptions.

Detailed spec:

- [`source-intake-workspace-setup/README.md`](source-intake-workspace-setup/README.md)

Build:

- add `/setup` as the default entry screen;
- show source choices: PulseWall demo app, GitHub repo, Lovable export;
- show source data choices: seeded demo data, Supabase DB URL/read-only access, CSV/Lovable Cloud export;
- show Aiven workspace choices: create fresh landing zone, existing-service compatibility disabled by default, create account later;
- show migration scope: shadow migration, scoped demo cutover, production cutover not requested;
- click `Continue to Control Room` to enter `/control`;
- keep GitHub/upload/Aiven account creation as visible product paths, not implemented paths;
- keep existing control-room runtime and `AccessSnapshot` gates unchanged.

Acceptance:

- `/setup` exists and is the default entry surface;
- PulseWall/fresh Aiven landing-zone creation are visible selected demo choices;
- unimplemented product paths are visible and honestly labeled;
- no secrets appear in UI or docs;
- `npm run verify:live -- --one-click` still passes after the setup screen lands.

Kill/fallback:

- If time is tight, implement a static React setup page only and route to `/control`.
- Do not build OAuth, upload parsing, Lovable Cloud import, Aiven signup, or real source DB input before capture.

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

- If a live component fails twice during rehearsal, demote it to recorded/cached proof and keep one smaller live Aiven Postgres action.
