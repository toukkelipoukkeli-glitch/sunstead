# Scaffold Stub Plan

Date: 2026-06-25

## Purpose

Instantiate the whole Aiden path top-down before replacing stubs with live implementation.

This is not a throwaway mock. The scaffold is the first real product skeleton:

```text
Control Room UI
  -> typed run state machine
  -> fixture event stream
  -> stubbed agent modules
  -> stubbed Aiven/Postgres/Kafka actions
  -> stubbed local adapter
  -> final report
```

The goal is to make the full `Graduate To Aiven` story explicit, clickable, demo-quality, and contract-backed before doing live Aiven work. Later missions replace stub internals behind the same interfaces.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Judging/submission mode: Aiven partner challenge, short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: cold open outcome -> original PulseWall app -> one-click `Graduate To Aiven` -> behavior scan -> Aiven shadow plane -> migration validation -> Postgres events realtime proof -> Kafka agent bus proof -> scoped cutover -> proof report.
- Intentional cuts: production auth, production storage, full CDC, Aiven Apps deploy, broad source-platform support, complex multi-process agent runtime.

## Scaffold Principle

Build the whole path as a vertical skeleton, but keep every layer honest:

- UI must be stage-facing from the start.
- Fixtures must use final contract shapes.
- Every proof item has `source: "fixture" | "live" | "cached"`.
- Stubs return deterministic, believable data.
- No live secret is required for the scaffold.
- No module should expose an API shape that the live implementation cannot reasonably satisfy.

Do not scaffold broad abstractions for "any source to Aiven." Scaffold one excellent PulseWall -> Aiven path.

## Desired First Screen

The initial scaffold should open directly into the control room, not a landing page.
Detailed visual direction, hierarchy, and acceptance gates live in
[`UI_DECISION_PACKAGE.md`](UI_DECISION_PACKAGE.md). This section is the scaffold implementation
summary, not a separate UI authority.

First viewport:

```text
Top strip:
  Aiden Migration Control Room
  Source: PulseWall / Lovable-Supabase
  Target: Aiven Postgres + Kafka
  Mode: Fixture
  [Graduate To Aiven]

Main grid:
  Left: Source app state / before path
  Center: Agent timeline and behavior map
  Right: Aiven shadow plane, receipts, Kafka agent bus

Bottom or report drawer:
  Realtime rewrite proof
  Scoped cutover proof
  Final readiness report
```

Cold-open mode should show the completed outcome first:

```text
Migrated demo path running
Data: Aiven Postgres
Realtime: Aiven Postgres app_events -> browser polling
Agent bus: Aiven Kafka migration.events
Supabase removed from scoped demo runtime
Auth/Storage/RLS: production blockers
```

The presenter can then reset/rewind and click `Graduate To Aiven`.

## Proposed File Structure

Put all implementation source under the root `src/` directory:

```text
src/
  apps/
    control-room/
      src/
        App.tsx
        main.tsx
        styles.css
        components/
          ColdOpenOutcome.tsx
          SourceAppPanel.tsx
          AgentTimeline.tsx
          BehaviorMap.tsx
          AivenShadowPlane.tsx
          ReceiptStream.tsx
          KafkaAgentBus.tsx
          RealtimeProof.tsx
          CutoverProof.tsx
          FinalReport.tsx
          ModeBadge.tsx
        lib/
          api.ts
          deriveRunView.ts
    aiden-api/
      src/
        server.ts
        routes/
          runs.ts
          adapter.ts
        state/
          runStore.ts
          fixturePlayer.ts
        agents/
          accessBroker.ts
          repoScanner.ts
          behaviorMapper.ts
          aivenOperator.ts
          migrationOperator.ts
          compatibilitySurgeon.ts
          validationAuditor.ts
          cutoverManager.ts
          reportAgent.ts

  packages/
    contracts/
      src/
        index.ts
        run.ts
        behavior.ts
        receipts.ts
        validation.ts
        report.ts
        pulsewall.ts
    fixtures/
      src/
        pulsewallRun.ts
        behaviorGraph.ts
        receipts.ts
        validationChecks.ts
        posts.ts
        appEvents.ts
        report.ts
    migration-core/
      src/
        scanSupabaseUsage.ts
        classifyBehavior.ts
        planMigration.ts
    aiven-ops/
      src/
        proofClient.ts
        stubProofClient.ts
        liveProofClient.ts
    pulsewall-adapter/
      src/
        provider.ts
        stubProvider.ts
        aivenProvider.ts
```

If full workspace setup costs too much time, collapse `src/packages/*` into `src/apps/aiden-api/src/*` first, but keep the same module names and exported contracts.

## Local Dev Execution

The scaffold must have one root command for rehearsal and review:

```text
npm run dev
```

Root setup:

- create a root `package.json`;
- use npm workspaces for `src/apps/*` and `src/packages/*`;
- `npm run dev` starts both services;
- API: `http://localhost:8787`;
- control room: `http://localhost:5173`;
- Vite proxies `/api` to `http://localhost:8787`;
- no `.env.local` is required for `DEMO_MODE=fixture`.

Suggested root scripts:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace @aiden/aiden-api\" \"npm run dev --workspace @aiden/control-room\"",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "workspaces": [
    "src/apps/*",
    "src/packages/*"
  ]
}
```

If dependency setup needs to be simpler, use a small Node script instead of `concurrently`, but keep the public command as `npm run dev`.

## Shared Contracts

The scaffold must implement/import the canonical contracts first. `RUNTIME_CONTRACTS.md` owns the
runtime/API/event shapes; the TypeScript below is a scaffold implementation sketch that must stay
aligned with that file. If a conflict appears, update `RUNTIME_CONTRACTS.md` deliberately and then
mirror the change here.

```ts
type ProofSource = "fixture" | "live" | "cached"

type RunStatus = "idle" | "running" | "complete" | "failed"

type RunState =
  | "idle"
  | "access_connected"
  | "scan_running"
  | "behavior_mapped"
  | "aiven_shadow_ready"
  | "migration_running"
  | "migration_validated"
  | "realtime_validated"
  | "demo_cutover_running"
  | "demo_cutover_complete"
  | "report_ready"
  | "failed"

type AgentName =
  | "access_broker"
  | "repo_scanner"
  | "behavior_mapper"
  | "aiven_operator"
  | "migration_operator"
  | "compatibility_surgeon"
  | "validation_auditor"
  | "cutover_manager"
  | "report_agent"

type RunEvent = {
  runId: string
  type: string
  agent: AgentName
  state: RunState
  status: "started" | "ok" | "failed" | "skipped"
  source: ProofSource
  summary: string
  details?: Record<string, unknown>
  createdAt: string
}
```

Core data shapes. These should live under `src/packages/contracts/src/*` even if the first implementation collapses packages into the API app:

```ts
type RunContext = {
  runId: string
  mode: "fixture" | "live"
  now(): string
  emit(event: RunEvent): void
}

type BehaviorFinding = {
  id: string
  behavior: string
  detected: boolean
  sourceRefs: string[]
  classification:
    | "direct_migrate"
    | "rewrite"
    | "adapter_required"
    | "review_required"
    | "cut"
  target: string
  demoTreatment: string
  source: ProofSource
}

type AivenReceipt = {
  id: string
  runId: string
  agent: AgentName
  intent: string
  tool: string
  target: string
  risk: "read_only" | "safe_write" | "reversible_demo_change"
  result: "ok" | "failed" | "cached"
  rollback?: string
  source: ProofSource
  createdAt: string
}

type ValidationCheck = {
  id: string
  runId: string
  checkName: string
  status: "passed" | "failed" | "skipped"
  details: Record<string, unknown>
  source: ProofSource
  createdAt: string
}

type RowValidation = {
  table: "posts" | "reactions" | "demo_users" | "app_events"
  expected: number
  actual: number
  status: "passed" | "failed" | "skipped"
  source: ProofSource
}

type Report = {
  runId: string
  headline: string
  readinessScore: number
  demoCutoverStatus: "passed" | "failed" | "skipped"
  runtimeDependency: "removed_from_scoped_demo_path" | "unchanged" | "blocked"
  rowValidations: RowValidation[]
  checks: ValidationCheck[]
  receipts: AivenReceipt[]
  blockers: string[]
  rollback: string
  costSummary: string
  ctoRecommendation: string
  source: ProofSource
  createdAt: string
}
```

PulseWall adapter contracts:

```ts
type Post = {
  id: string
  body: string
  authorHandle: string
  imageUrl?: string
  reactionCount: number
  createdAt: string
}

type LeaderboardRow = {
  postId: string
  body: string
  authorHandle: string
  reactionCount: number
  rank: number
}

type AddReactionInput = {
  postId: string
  emoji: string
  userId?: string
}

type PulseWallEvent = {
  id: string
  runId: string
  eventType: "post.reaction_added" | "post.created" | "leaderboard.updated"
  entityType: "post" | "reaction" | "leaderboard"
  entityId: string
  payload: Record<string, unknown>
  createdAt: string
}

type PulseWallProvider = {
  listPosts(): Promise<Post[]>
  getLeaderboard(): Promise<LeaderboardRow[]>
  addReaction(input: AddReactionInput): Promise<void>
  listRecentEvents(input: { sinceId?: string; limit?: number }): Promise<PulseWallEvent[]>
}
```

## Stub API Endpoints

Local Aiden API:

| Method | Path | Scaffold behavior |
| --- | --- | --- |
| `POST` | `/api/runs` | Creates a fixture run and returns `runId`. |
| `POST` | `/api/runs/:runId/graduate` | Starts fixture event playback. |
| `GET` | `/api/runs/:runId` | Returns derived run state and current proof data. |
| `GET` | `/api/runs/:runId/events` | Control-room run-event stream; SSE is allowed here and may replay fixture events. |
| `GET` | `/api/runs/:runId/report` | Returns fixture final report. |
| `POST` | `/api/runs/:runId/step/:stepName` | Manual presenter control for advancing the fixture run. |

Local adapter:

| Method | Path | Scaffold behavior |
| --- | --- | --- |
| `GET` | `/api/posts` | Returns fixture migrated posts. |
| `GET` | `/api/leaderboard` | Returns fixture leaderboard. |
| `POST` | `/api/reactions` | Appends fixture reaction and fixture `app_events` row in memory. |
| `GET` | `/api/events/recent` | Returns in-memory fixture `app_events` rows. |
| `GET` | `/api/events` | Optional app realtime SSE endpoint; do not build until `/api/events/recent` polling works. |

## Fixture Run Sequence

The full stub path should emit the same story the live system will later emit:

1. `access.connected`
2. `repo.scan.started`
3. `source.behavior.detected`
4. `behavior.scan.completed`
5. `aiven.project.detected`
6. `aiven.postgres.verified`
7. `aiven.kafka.verified`
8. `mcp.receipt.written`
9. `migration.schema.applied`
10. `migration.rows.validated`
11. `realtime.postgres_events_bridge.passed`
12. `kafka.agent_bus_roundtrip.passed`
13. `cutover.demo_runtime.ready`
14. `proof.package.generated`

Each event should have:

- realistic timing;
- an agent name;
- fixture/live/cached source;
- a visible UI consequence.

## Agent Module Stubs

Each agent is a module with the same shape:

```ts
type AgentStep<I, O> = {
  name: AgentName
  run(input: I, ctx: RunContext): Promise<O>
}
```

Stub responsibilities:

| Agent | Stub output |
| --- | --- |
| `access_broker` | Connected repo/source/Aiven checklist. |
| `repo_scanner` | Deterministic behavior findings from fixture scan. |
| `behavior_mapper` | Compatibility graph rows. |
| `aiven_operator` | Fixture Aiven project, Postgres, Kafka, and receipt records. |
| `migration_operator` | Fixture row counts and smoke-query checks. |
| `compatibility_surgeon` | Provider cutover plan and realtime rewrite proof. |
| `validation_auditor` | Validation checks and readiness score. |
| `cutover_manager` | Scoped demo runtime switch result. |
| `report_agent` | Final proof report. |

Live missions replace individual agent internals, not the module shape.

## UI Components And Data Ownership

| Component | Reads from | Must show |
| --- | --- | --- |
| `ColdOpenOutcome` | `Report` + latest run state | Completed migration outcome in under 10 seconds. |
| `SourceAppPanel` | fixture/source app state | Old path and source behaviors. |
| `AgentTimeline` | `RunEvent[]` | Agents progressing through the one-click run. |
| `BehaviorMap` | `BehaviorFinding[]` | Tables, realtime, auth, storage, RLS, RPC/edge, pgvector. |
| `AivenShadowPlane` | receipts + service status | Postgres ready, Kafka optional/warning, receipts recording. |
| `ReceiptStream` | `AivenReceipt[]` | Aiven actions with control-plane labels, risk, and rollback. |
| `KafkaAgentBus` | agent-bus events | `migration.events` workflow events. |
| `RealtimeProof` | validation + app events | Supabase Realtime -> Postgres `app_events` -> browser polling, plus Kafka prod path proof. |
| `CutoverProof` | provider state | Old path vs new scoped runtime path. |
| `FinalReport` | `Report` | Readiness, row counts, proof, blockers, rollback, cost/CTO. |

## Visual Quality Bar

The scaffold UI must be good enough for judging before live implementation exists.
Follow [`UI_DECISION_PACKAGE.md`](UI_DECISION_PACKAGE.md) for visual hierarchy, proof label behavior,
responsive rules, and presenter mode. The checklist below is the minimum scaffold gate.

Required qualities:

- first screen communicates the product in 10 seconds;
- dense control-room layout, not a landing page;
- no nested card clutter;
- clear source/target/status strip;
- proof cards use stable dimensions;
- text does not overlap or overflow;
- `fixture`, `live`, and `cached` markers exist but do not dominate judge-facing view;
- cold-open report feels like an outcome, not a placeholder;
- `Graduate To Aiven` is the single obvious primary action.

Use restrained colors and high contrast. Avoid making the UI look like generic SaaS marketing or raw developer logs.

## Replacement Order

The scaffold enables this replacement plan:

1. Replace fixture Aiven project/service check with a live Aiven check and label whether it is MCP or direct fallback.
2. Replace fixture Postgres receipt write/read with live Aiven Postgres receipt.
3. Replace fixture Kafka smoke proof with one live `migration.events` topic/message produce-list receipt when Kafka credentials are configured.
4. Replace fixture scanner output with deterministic scan of `demo/pulsewall/`.
5. Replace fixture data migration with live Aiven Postgres tables and row checks.
6. Replace fixture adapter posts/reactions/events with Aiven Postgres reads/writes.
7. Replace fixture Kafka agent-bus panel with full live `migration.events` workflow produce/list when configured; otherwise keep warning/cached proof.
8. Replace fixture final report values with live/cached mixed proof.

Mission labels:

```text
Scaffold -> Mission 00
Step 1-3 -> Mission 01
Step 4   -> Mission 02
Step 5   -> Mission 03
Step 6   -> Mission 05
Step 7   -> Mission 04
Step 8   -> Mission 06
```

## Acceptance Gate For Scaffold

The scaffold is complete when:

- `npm run dev` starts the local API and control room;
- cold-open outcome renders;
- `Graduate To Aiven` plays the full fixture run;
- manual presenter controls can advance/reset the run;
- every panel is wired to typed fixture data, not hardcoded JSX text only;
- `/api/posts`, `/api/reactions`, and `/api/events/recent` work with fixture data;
- final report renders from a `Report` object;
- desktop and mobile screenshots have been checked;
- first viewport communicates the completed demo outcome without presenter explanation;
- no overlapping text, overflowing buttons, cramped proof cards, or placeholder-looking panels remain;
- no Aiven/Supabase secret is needed;
- there is a visible path to replace each stub with a live module.

## What Not To Build In The Scaffold

- real Aiven MCP calls unless they are available and reliable;
- real Supabase copy;
- full `pg_dump`/restore;
- Kafka consumer bridge;
- production auth;
- production storage;
- Aiven Apps deploy;
- generalized plugin architecture;
- separate agent processes;
- app realtime SSE before `/api/events/recent` polling. Control-room run events may still use `/api/runs/:runId/events`.

## First Coding Slice

Build the minimum complete skeleton in this order:

1. Create shared contract types.
2. Create fixture data for events, behavior findings, receipts, validations, posts, app events, and report.
3. Create local API run store and fixture player.
4. Create adapter fixture endpoints for posts, reactions, and recent events.
5. Create control room UI layout and all proof panels.
6. Wire `Graduate To Aiven` to fixture playback.
7. Add cold-open/reset/manual-step controls.
8. Run the app and verify the full path in browser.

Do not proceed to live Aiven work until this skeleton can tell the whole story end to end.
