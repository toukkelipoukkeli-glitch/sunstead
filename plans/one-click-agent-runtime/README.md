# Mission Spec: One-Click Agent Runtime

Date: 2026-06-25

Mission ID: `M05.6`

Status: LIVE PG VERIFIED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: PulseWall source app -> one visible `Graduate To Aiven` action -> bounded agents scan, verify Aiven, migrate data, validate `app_events`, cut over the scoped runtime, publish Kafka workflow proof if available, and generate the final report.
- Intentional cuts: production auth migration, production storage migration, full CDC, production cutover, arbitrary shell agents, and complex multi-process agent infrastructure.

## Purpose

The current system has the right building blocks, but the visible product promise is still stronger than the runtime:

```text
Current:
Presenter can click separate proof actions.

Needed:
One visible product action orchestrates the whole safe migration workflow.
```

This mission turns the existing deterministic modules into an actual one-click agent runtime without introducing risky free-form autonomy.

The goal is not to build a chatbot or let an LLM operate the database. The goal is to make the existing typed tools feel and behave like a bounded autonomous operator.

## Position In Critical Path

Run this after:

- Mission 02 scanner exists;
- Mission 03 live Aiven Postgres migration path exists;
- Mission 05 live provider cutover path exists;
- Mission 05.5 live verifier has passed the Aiven Postgres path.

Run this before:

- Mission 06 UI hardening;
- Mission 07 rehearsal hardening;
- any broad Anthropic/agent SDK showcase.

This mission owns the gap between:

```text
The pieces work independently.
```

and:

```text
The demo visibly behaves like one autonomous migration operator.
```

## Current Truth

Built before this mission:

- `POST /api/runs/:runId/source-scan`
- `POST /api/runs/:runId/proof-spine`
- `POST /api/runs/:runId/data-migration`
- `POST /api/runs/:runId/provider-cutover`
- `POST /api/runs/:runId/kafka-agent-bus`
- `npm run verify:live`
- typed `RunEvent`, receipt, check, report, and Kafka event contracts
- agent names in events and UI

Implemented in this mission:

- `src/apps/aiden-api/src/state/oneClickOrchestrator.ts` defines the bounded agent runtime types, run modes, deterministic reasoner, and sequential step runner.
- `POST /api/runs/:runId/graduate` now runs source scan -> proof spine -> data migration -> provider cutover -> Kafka bus proof -> final report.
- `POST /api/runs/:runId/graduate-fixture` preserves an explicit offline fixture fallback.
- The control-room primary button disables while the one-click run is active; presenter proof buttons remain as fallback/debug controls.
- `npm run verify:live -- --one-click` verifies the product route against live Aiven Postgres.

Remaining:

- Anthropic Agent SDK integration is now owned by [`../anthropic-agent-sdk-reasoner/README.md`](../anthropic-agent-sdk-reasoner/README.md); it is text/report-only and fail-open.
- Mission 06A still needs the visible access-broker permission panel before the one-click action.
- Live Kafka remains pending until Kafka credentials are configured; missing Kafka stays warning-only.

## Architecture Decision

Use a deterministic local orchestrator with named agent steps.

Do not build separate agent processes.
Do not let an LLM call infrastructure tools directly.
Do not use a free-form shell agent.

The architecture is:

```text
Graduate To Aiven
  -> OneClickOrchestrator
      -> typed AgentStep registry
          -> existing scanner / Aiven / migration / cutover / Kafka tools
      -> optional bounded AgentReasoner
      -> RunEvent + receipts + checks + report
```

The product may say "agents" because each step is owned by a named specialist with bounded tools, a typed input/output contract, receipts, and validation gates.

## Agent Runtime Model

Add a small runtime module in the API first:

```text
src/apps/aiden-api/src/state/oneClickOrchestrator.ts
```

Do not create a new workspace package unless this file becomes too large.

### Core types

```ts
type AgentStepName =
  | "access_broker"
  | "repo_scanner"
  | "behavior_mapper"
  | "aiven_operator"
  | "migration_operator"
  | "compatibility_surgeon"
  | "validation_auditor"
  | "cutover_manager"
  | "report_agent"
  | "kafka_bus_operator"

type AgentStep = {
  name: AgentStepName
  label: string
  risk: "read_only" | "safe_write" | "reversible_demo_change"
  requiredForLivePg: boolean
  run(input: AgentRunContext): Promise<AgentStepResult>
}

type AgentStepResult = {
  ok: boolean
  source: "live" | "cached" | "fixture"
  summary: string
  blocking: boolean
  snapshot: RunSnapshot
}
```

The exact type names can change, but the runtime must preserve these ideas:

- every agent step has an owner;
- every step has a risk level;
- every step calls typed functions, not arbitrary tools;
- every step returns a snapshot;
- blocking failures stop the one-click run with a useful message;
- non-blocking Kafka failure becomes warning/cached proof when Kafka env is absent.

## Step Registry

Initial registry:

| Step | Agent | Existing implementation to call | Blocking |
| --- | --- | --- | --- |
| Access preflight | `access_broker` | current run creation + env/config check | yes only if API cannot run |
| Source scan | `repo_scanner` / `behavior_mapper` | `runSourceScan(runId)` | yes |
| Aiven proof spine | `aiven_operator` | `runProofSpine(runId)` | yes for Postgres proof when live mode is required |
| Data migration | `migration_operator` | `runDataMigration(runId)` | yes for live PG mode |
| Scoped cutover | `cutover_manager` / `compatibility_surgeon` | `runProviderCutover(runId)` | yes for live PG mode |
| Kafka bus proof | `kafka_bus_operator` | `runKafkaAgentBus(runId)` | no unless `--require-kafka` or env configured |
| Final report | `report_agent` | existing `getSnapshot(runId).report` plus optional reasoner | no if deterministic fallback works |

Important order:

```text
source scan
  -> proof spine
  -> data migration
  -> provider cutover
  -> Kafka bus proof
  -> final report
```

This differs slightly from the pitch script, where Kafka can appear before final cutover. For demo reliability, browser-critical Aiven Postgres cutover remains protected before Kafka. The UI can still display Kafka in the landing-zone panel once the proof runs.

## One-Click API Contract

Make the existing visible route the canonical one-click route:

```text
POST /api/runs/:runId/graduate
```

After this mission, `/graduate` should run the full `OneClickOrchestrator`.

Keep the separate routes as presenter/debug controls:

```text
POST /api/runs/:runId/source-scan
POST /api/runs/:runId/proof-spine
POST /api/runs/:runId/data-migration
POST /api/runs/:runId/provider-cutover
POST /api/runs/:runId/kafka-agent-bus
POST /api/runs/:runId/step/:stepName
```

If a fixture-only fallback is still needed, add an explicit debug route:

```text
POST /api/runs/:runId/graduate-fixture
```

Do not leave the visible `Graduate To Aiven` button wired to fixture-only playback once this mission is complete.

## Run Modes

Support three modes through environment and request options:

```text
AGENT_RUN_MODE=live_pg        # default for rehearsals after M05.5
AGENT_RUN_MODE=cached_ok      # fallback: continue with cached/skipped proof
AGENT_RUN_MODE=fixture        # offline demo rail
```

Behavior:

| Mode | Postgres live required | Kafka live required | Use |
| --- | --- | --- | --- |
| `live_pg` | yes | no, warn if missing | primary judged demo |
| `cached_ok` | no | no | honest fallback |
| `fixture` | no | no | offline rehearsal / broken infra |

The UI must show `live`, `cached`, or `fixture` labels from the existing contracts. The orchestrator must not hide cached proof behind live language.

## Anthropic / Agent SDK Use

The repo does not currently use Anthropic or an agent SDK. This mission may add a small bounded reasoner, but it must be optional and fail-open.

Add an adapter interface:

```ts
type AgentReasoner = {
  summarizeBehavior(input: SanitizedBehaviorInput): Promise<string>
  writeExecutiveRecommendation(input: SanitizedReportInput): Promise<string>
  explainFailure(input: SanitizedFailureInput): Promise<string>
}
```

Implementations:

| Implementation | Required | Behavior |
| --- | --- | --- |
| `deterministicReasoner` | yes | template-based summaries; no network |
| `anthropicAgentSdkReasoner` | optional | uses `@anthropic-ai/claude-agent-sdk` and `ANTHROPIC_API_KEY` for text only |

Allowed LLM uses:

- summarize scanner findings;
- explain why auth/storage/RLS are blockers;
- generate final CTO recommendation copy;
- explain a failed gate in human language;
- generate patch notes for the scoped adapter.

Forbidden LLM uses:

- direct database mutation;
- direct Kafka mutation;
- direct Aiven service mutation;
- arbitrary shell execution;
- secret handling;
- final production cutover decisions;
- silently overriding validation failures.

The reasoner receives sanitized structured data only. It must never receive:

- full database URLs;
- API tokens;
- Kafka passwords;
- source service-role keys;
- raw `.env.local` contents.

Environment:

```text
AGENT_REASONER=off | anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=...
```

Default:

```text
AGENT_REASONER=off
```

For the hackathon, the Anthropic Agent SDK layer is a score enhancer, not a dependency. If it fails, the one-click migration still completes with deterministic copy.

## UI Contract

The visible UI should have one primary product action:

```text
Graduate To Aiven
```

When clicked:

- disables itself while the run is active;
- progress strip advances through the same 14-event timeline;
- panels fill from the existing `RunSnapshot`;
- source app card switches after successful provider cutover;
- final report becomes the end state.

Presenter controls remain, but they should be secondary:

- keep them visible only in presenter/debug mode, or visually subordinate;
- they are fallback controls, not the product path;
- they should not be required for the main demo.

Recommended visible stage sequence:

```text
Cold-open completed report
  -> Reset
  -> Source app card
  -> Click Graduate To Aiven
  -> Agent timeline runs automatically
  -> Aiven proof receipts and validation cards update
  -> Source app panel switches to scoped Aiven adapter
  -> React to top post
  -> app_events polling proof updates
  -> Final report
```

## Event Contract

Preserve the current 14-event story. The one-click orchestrator should replace events by type, not append uncontrolled extra events.

Required final event types:

```text
access.connected
repo.scan.started
source.behavior.detected
behavior.scan.completed
aiven.project.detected
aiven.postgres.verified
aiven.kafka.verified
mcp.receipt.written
migration.schema.applied
migration.rows.validated
realtime.postgres_events_bridge.passed
kafka.agent_bus_roundtrip.passed
cutover.demo_runtime.ready
proof.package.generated
```

If a step is cached/skipped, keep the same event type with:

```text
source: "cached"
status: "skipped"
```

If a blocking live step fails:

```text
state: "failed"
status: "failed"
source: "live"
```

and stop the orchestrator.

## Report Contract

The final report should be generated from deterministic facts:

- events;
- receipts;
- validation checks;
- row validations;
- adapter status;
- Kafka bus status;
- blockers.

The optional reasoner may rewrite:

- headline;
- CTO recommendation;
- blocker explanations;
- presenter-friendly failure summary.

It may not rewrite:

- readiness score unless the deterministic scorer provides inputs;
- row counts;
- pass/fail status;
- proof source labels;
- rollback facts.

## Verification

Add verifier coverage:

```text
npm run verify:live -- --one-click
```

Required assertions:

- `POST /api/runs/:runId/graduate` runs the orchestrator path;
- source scan event is `live/ok`;
- migration schema and rows are `live/ok` in `live_pg` mode;
- provider cutover and realtime bridge are `live/ok` in `live_pg` mode;
- adapter mode becomes `live`;
- `/api/posts` returns Aiven-backed posts after cutover;
- `POST /api/reactions` writes successfully;
- `/api/events/recent` returns the reaction event;
- Kafka is `live/ok` if Kafka env exists, otherwise `cached/skipped` with warning;
- final report has `demoCutoverStatus: "passed"`;
- final report has `runtimeDependency: "removed_from_scoped_demo_path"`;
- no terminal output includes secrets.

Also keep separate-endpoint verifier behavior for debugging:

```text
npm run verify:live -- --separate-steps
```

## Acceptance

- One visible `Graduate To Aiven` click runs the full migration flow end to end.
- Presenter does not need to click `Run live proof`, `Migrate data`, `Cutover app`, or `Kafka bus` during the main demo.
- The separate proof buttons remain available as fallback/debug controls.
- Existing live Aiven Postgres path still passes `npm run verify:live`.
- New one-click path passes `npm run verify:live -- --one-click`.
- The orchestrator uses named agent steps and typed tools.
- Optional Anthropic/LLM reasoner cannot mutate infra and cannot block the run.
- Missing Anthropic key does not degrade the demo.
- Missing Kafka credentials produces warning/cached Kafka proof, not a failed browser-critical run.
- All fixture/live/cached labels remain honest.
- No secrets are printed or sent to the browser.

## Implementation Plan

1. Add `oneClickOrchestrator.ts`.
2. Refactor existing run-store functions so the orchestrator can call them without duplicating route logic.
3. Make `POST /api/runs/:runId/graduate` call the orchestrator.
4. Add `graduate-fixture` only if needed for offline fallback.
5. Add `AgentReasoner` interface with deterministic implementation.
6. Add optional `anthropicAgentSdkReasoner` behind `ANTHROPIC_API_KEY` / `AGENT_REASONER=anthropic`, with `AGENT_REASONER=off` as the explicit disable switch.
7. Update control-room button state/copy for running one-click mode.
8. Move presenter controls into fallback/debug treatment if time allows.
9. Update `verify-live-aiven.mjs` with `--one-click`.
10. Run typecheck, Vite build, separate-step verifier, and one-click verifier.

## Fallbacks

If one-click orchestration becomes unstable:

- keep separate proof buttons as presenter fallback;
- record a successful live Postgres cutover run;
- make `Graduate To Aiven` play the cached event stream honestly labeled;
- use presenter line: "The one-click operator is replaying the last verified live run; the receipts show the live proof."

If Anthropic/SDK integration slows work:

- cut it entirely;
- keep deterministic reasoner;
- preserve agent runtime as named bounded modules.

If Kafka remains unavailable:

- keep Kafka cached/skipped with a clear warning;
- keep browser-critical Postgres cutover live;
- do not let Kafka block the run.

## Presenter Language

Use this line if asked whether these are "real agents":

> The agents are bounded operators, not chatbots. Each one owns a migration step, can only call typed tools, and leaves receipts. The LLM layer is optional and only writes explanations; Postgres, Kafka, and cutover are controlled by deterministic tools.

Use this line if Anthropic is disabled:

> For the hackathon path, we kept the core migration deterministic. The agent runtime is the state machine plus specialist operators; the LLM can be plugged in for summaries and patch notes without changing the safety model.
