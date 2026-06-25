# Mission Spec: Access Broker & Permission Preflight

Date: 2026-06-25

Mission ID: `M06A`

Status: BUILT / LIVE PG VERIFIED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: access connected -> one visible `Graduate To Aiven` action -> source scan -> Aiven shadow proof -> live Aiven Postgres migration -> scoped runtime cutover -> Kafka proof if available -> final report.
- Intentional cuts: production auth migration, production storage migration, full CDC, Aiven Apps deploy, broad source-platform support, and real production cutover.

## Purpose

The access and permission inquiry is part of the product.

The product promise is not:

```text
Click once with no setup and hope the agent has enough power.
```

The product promise is:

```text
Grant access once. Aiden proves what it can safely do. Then one click runs the bounded migration.
```

This mission makes that visible in the control room as an **Access Broker** step. It should help judges understand that Aiden is autonomous because it is permissioned, scoped, and auditable, not because it is an unrestricted shell.

## Product Principle

Separate setup from the product action:

```text
Setup step: connect and verify access rights.
Product action: Graduate To Aiven.
```

The access step should be short, operational, and confidence-building. Do not build a long onboarding wizard for the hackathon.

## Position In Critical Path

Run this after:

- M05.5 live Aiven Postgres gate passes;
- Aiven MCP OAuth is configured;
- the local API can verify Aiven Postgres read/write;
- the control room already renders the main migration panels.

Run this before or alongside:

- M05.6 one-click agent runtime, because the orchestrator should start with access preflight;
- M06 general UI hardening, because this is a required first-viewport product proof.

This spec owns the visible and runtime behavior for the `access_broker` step. M05.6 owns the full one-click orchestration after access passes.

## Current Truth

Built or proven:

- Aiven MCP config is present for the Agent SDK runtime; Codex MCP config is optional developer tooling.
- Aiven project `henri-2699` and Postgres service `pg-3e23b49c` were discovered during setup.
- The proof spine records the read-only Aiven Operator MCP probe, while current data-plane proof actions are still labeled as direct Aiven fallback.
- Ignored `.env.local` contains the local live Postgres connection values.
- `npm run verify:live` passes the live Aiven Postgres runtime path.
- The existing fixture event stream begins with `access.connected`.
- The UI has no dedicated Access Broker panel yet.

Gaps before implementation:

- The product did not visibly explain what access was requested.
- The product did not distinguish required access from optional access.
- The product did not show that production cutover was not requested.
- Kafka/Auth/Storage absence could look like missing work instead of scoped permission decisions.
- `Graduate To Aiven` was not clearly gated by access readiness.

Implemented:

- typed `AccessSnapshot` and `AccessCheck` contracts;
- `POST /api/runs/:runId/access-preflight`;
- Access Broker panel near the command strip;
- `Graduate To Aiven` gating from required checks;
- Kafka warning and production auth/storage/cutover deferred states;
- verifier coverage before migration and after cutover.

## UX Target

Add an Access Broker section near the top of the control room, close to the primary `Graduate To Aiven` action.

Visible shape:

```text
Access Broker

[x] App repo / Lovable export       Read source behavior       connected
[x] Source data path                Seeded/read-only demo data ready
[x] Aiven MCP config                Project access             configured
[x] Aiven Postgres                  Read/write shadow schema   live verified
[!] Aiven Kafka                     Agent bus proof            not configured, cached proof allowed
[-] Production Auth adapter         Later                      not requested
[-] Production Storage adapter      Later                      not requested
[-] Production cutover              Requires approval          not requested

Mode: Shadow migration
Production app unchanged
Graduate To Aiven
```

The panel should communicate:

- what Aiden can touch;
- what it cannot touch;
- what is intentionally deferred;
- why the next button is safe.

## Presenter Beat

Use this after opening the control room and before clicking `Graduate To Aiven`:

> The setup is the access grant. Aiden checks the repo, the source data path, and Aiven permissions first. It has write access only to the Aiven shadow data plane; production cutover is not requested.

Then:

> Now the product action is one click: graduate this app to Aiven.

This should take less than 20 seconds.

## Permission Model

Use a permission ladder, not a generic checklist.

| Stage | Permission | Demo status | Product meaning |
| --- | --- | --- | --- |
| Analyze | Repo/export read + source behavior scan | connected | Aiden can understand the app without changing it |
| Source data | Seeded or read-only source data | ready | Aiden can validate data shape/counts |
| Aiven control | Aiven MCP config + direct fallback receipts | connected | Aiden can inspect target projects/services when credentials are available |
| Shadow migrate | Aiven Postgres write/read | live verified | Aiden can create shadow tables, receipts, and validations |
| Agent bus proof | Aiven Kafka produce/consume | optional warning until env exists | Aiden can show workflow bus if configured |
| Demo cutover | Local adapter env/write | ready | Aiden can switch only the scoped demo runtime |
| Production cutover | Explicit approval + production env write | not requested | Aiden will not affect production users |
| Cleanup | Explicit destructive approval | not requested | Aiden will not delete source/shadow assets |

## Runtime Contract

Add an access snapshot contract. Exact names can change, but preserve the shape:

```ts
type AccessCheckStatus =
  | "ready"
  | "connected"
  | "live_verified"
  | "warning"
  | "blocked"
  | "not_requested"
  | "later"

type AccessCheckSource = "fixture" | "live" | "cached"

type AccessCheck = {
  id:
    | "repo_source"
    | "source_data"
    | "aiven_mcp"
    | "aiven_project"
    | "aiven_postgres"
    | "aiven_kafka"
    | "demo_adapter"
    | "production_auth"
    | "production_storage"
    | "production_cutover"
  label: string
  scope: string
  minimumPermission: string
  status: AccessCheckStatus
  source: AccessCheckSource
  requiredForGraduate: boolean
  proof: string
  safeToShowDetails?: Record<string, unknown>
}

type AccessSnapshot = {
  runId: string
  mode: "shadow_migration" | "fixture" | "cached"
  canGraduate: boolean
  blockers: string[]
  warnings: string[]
  checks: AccessCheck[]
  createdAt: string
}
```

Safe detail examples:

- project name;
- service name;
- service type;
- row-count proof exists;
- `Aiven MCP config present`;
- `Postgres write/read verified`;
- `Kafka env missing`.

Forbidden detail examples:

- Postgres URL;
- tokens;
- passwords;
- usernames when part of a connection string;
- service-role keys;
- raw `.env.local` contents;
- full MCP secret payloads.

## API Contract

Add:

```text
POST /api/runs/:runId/access-preflight
```

Purpose:

- evaluate current access state;
- write/update the `access.connected` event;
- return the normal `RunSnapshot` plus access checks;
- never expose secrets.

Optional if easier:

```text
GET /api/access/preflight
```

Use the route-scoped endpoint first if it fits the current run-store model.

## Event Contract

Do not add lots of new timeline events for this mission. Preserve the current 14-event story.

Use the existing first event:

```text
access.connected
```

When access is good enough to run:

```json
{
  "type": "access.connected",
  "agent": "access_broker",
  "state": "access_connected",
  "status": "ok",
  "source": "live",
  "summary": "Access Broker verified source evidence, Aiven config, and live Aiven Postgres shadow-write permissions.",
  "details": {
    "canGraduate": true,
    "warnings": ["Aiven Kafka not configured; cached proof allowed"],
    "checks": ["repo_source", "source_data", "aiven_mcp", "aiven_postgres"]
  }
}
```

When a required item is missing:

```json
{
  "type": "access.connected",
  "agent": "access_broker",
  "state": "access_connected",
  "status": "failed",
  "source": "live",
  "summary": "Access Broker blocked graduation because Aiven Postgres write/read permission is missing.",
  "details": {
    "canGraduate": false,
    "blockers": ["aiven_postgres"]
  }
}
```

Kafka/Auth/Storage should not block the demo path:

- Kafka missing: `warning`.
- Production Auth: `not_requested` or `later`.
- Production Storage: `not_requested` or `later`.
- Production cutover: `not_requested`.

## Check Definitions

### `repo_source`

Demo behavior:

- Use the local PulseWall source as connected.
- Source should be `live` if scanner can read `demo/pulsewall/`.

UI copy:

```text
App repo / Lovable export
Read source behavior
Connected
```

### `source_data`

Demo behavior:

- Use seeded/scoped demo data.
- Do not require live Supabase source credentials.

UI copy:

```text
Source data path
Seeded/read-only demo data
Ready
```

### `aiven_mcp`

Demo behavior:

- Check Agent SDK Aiven MCP config.
- Treat config presence as connected/configured evidence.
- Upgrade to live proof only when `aiven.mcp.agent.probed` observes an Aiven MCP tool call; keep data-plane fallback labels until MCP read/write wrappers replace them.

UI copy:

```text
Aiven MCP config
Project/service inspection
Connected
```

### `aiven_project`

Demo behavior:

- Show project and Postgres service names if known.
- If `AIVEN_TOKEN` is absent but MCP has discovered the project, show `connected` from MCP/cached evidence rather than a hard failure.

UI copy:

```text
Aiven project
henri-2699 / pg-3e23b49c
Discovered
```

### `aiven_postgres`

Demo behavior:

- Required for live demo.
- Must be live verified by a safe write/read or by the most recent M05.5 pass.

UI copy:

```text
Aiven Postgres
Shadow schema write/read
Live verified
```

### `aiven_kafka`

Demo behavior:

- Optional for browser-critical flow.
- Warning if env is missing.
- Live verified only when Kafka env exists and `kafka_agent_bus_roundtrip` passes.

UI copy:

```text
Aiven Kafka
Agent bus / production event path
Warning: not configured
```

### `demo_adapter`

Demo behavior:

- Required for scoped demo cutover.
- Ready if local API is running and provider boundary exists.

UI copy:

```text
Local Aiden adapter
Scoped demo runtime only
Ready
```

### `production_auth`

Demo behavior:

- Not requested.
- Not a failure.

UI copy:

```text
Production Auth adapter
Explicit future setup
Not requested
```

### `production_storage`

Demo behavior:

- Not requested.
- Not a failure.

UI copy:

```text
Production Storage adapter
Object-store adapter later
Not requested
```

### `production_cutover`

Demo behavior:

- Not requested.
- Must be visibly separate from demo cutover.

UI copy:

```text
Production cutover
Requires separate approval
Not requested
```

## UI Contract

Add a component:

```text
src/apps/control-room/src/components/AccessBrokerPanel.tsx
```

Placement:

- desktop: near the top of the control room, ideally beside or just under the command strip;
- mobile/narrow: directly above the migration timeline;
- cold-open: show a compact completed variant in the report/outcome view.

Visual rules:

- compact, table-like rows;
- no nested cards;
- use icons only where they speed scanning;
- stable row heights;
- show `required`, `warning`, `later`, and `not requested` clearly;
- do not show raw env names as the main user-facing label;
- do not display connection strings or tokens.

Recommended row columns:

```text
Permission target | Minimum scope | Status | Proof
```

Status vocabulary:

| Status | Meaning | UI treatment |
| --- | --- | --- |
| `connected` | auth/config exists | neutral success |
| `ready` | safe to use | success |
| `live_verified` | actual live proof passed; render as `live verified` | stronger success |
| `warning` | demo can continue with reduced proof | warning |
| `later` | acknowledged out-of-scope setup | muted |
| `not requested` | intentionally not granted | muted |
| `blocked` | cannot graduate | danger |

Primary button behavior:

- If required checks pass: `Graduate To Aiven` enabled.
- If required checks fail: disabled with short blocker text.
- Warnings do not disable the button.
- Presenter/debug controls remain secondary.

## Backend Implementation Plan

1. Add access types to `@aiden/contracts`.
2. Add fixture access checks to `@aiden/fixtures`.
3. Add `buildAccessSnapshot(runId)` in the API or a small package.
4. Add `runAccessPreflight(runId)` to `runStore`.
5. Add `POST /api/runs/:runId/access-preflight`.
6. On `POST /api/runs`, initialize access checks from fixture/current env.
7. In the one-click orchestrator, run access preflight first and block only on required live Postgres/source/runtime failures.
8. Include access snapshot in `RunSnapshot`, or derive it from `access.connected.details` if that is faster.
9. Update `npm run verify:live` later with `--access-preflight` or include it in `--one-click`.

Prefer the fastest implementation that keeps access state typed and secret-safe.

## Frontend Implementation Plan

1. Add `AccessBrokerPanel.tsx`.
2. Render it near `CommandStrip` in `ControlRoom.tsx`.
3. Add `Refresh access` secondary action if backend route exists.
4. Show `Graduate To Aiven` disabled only for hard blockers.
5. Add compact cold-open/access summary if it improves the first 10 seconds.
6. Update visual states in `styles.css`.
7. Ensure no row text overflows on laptop-width and narrow viewports.

Do not make this a multi-page onboarding flow.

## Verification

Add or run these checks:

```text
npm run typecheck
npm exec --workspace @aiden/control-room vite -- build
npm run verify:live
```

After one-click runtime exists:

```text
npm run verify:live -- --one-click
```

Manual/browser checks:

- access panel appears before the main run;
- Aiven Postgres shows live verified;
- Kafka missing shows warning, not failure;
- Auth/Storage/Production cutover show not requested/later, not failure;
- no secret value is visible in DOM, screenshots, logs, or report;
- presenter can explain access in under 20 seconds.

## Acceptance

- The control room visibly treats access as the setup step before `Graduate To Aiven`.
- Required permissions are separated from optional/deferred permissions.
- Aiven Postgres live write/read permission is shown as the hard live gate.
- Kafka is shown as sponsor-visible but non-browser-critical.
- Auth, Storage, and production cutover are clearly out of scope and not hidden.
- `Graduate To Aiven` is enabled only when required access checks pass.
- Access state is represented by typed data, not ad hoc strings.
- The `access.connected` event carries enough proof detail for receipts/reporting.
- No secrets are shown or committed.
- The final demo flow still feels one-click after access is connected.

## Fallbacks

If live access probing is flaky:

- show last verified access snapshot from M05.5;
- label it `cached`;
- run one smaller live Aiven Postgres write/read proof before or during the demo.

If Kafka remains unavailable:

- show it as `warning`;
- say: "Kafka is the production agent-bus path; the browser-critical demo runtime is already live on Aiven Postgres."

If source Supabase access is unavailable:

- use local PulseWall source scan and seeded demo data;
- label source data as `seeded demo path`;
- do not claim live Supabase data extraction.

If UI time is tight:

- implement the access panel with fixture/current-env derived rows only;
- skip `Refresh access`;
- preserve the presenter line and hard gate semantics.

## Done Definition

This mission is done when the first screen of the control room communicates:

```text
Aiden has the rights it needs for a shadow migration.
Aiden does not have, need, or use production cutover rights.
The next action is one safe product click.
```

and the runtime can prove the same facts through a typed access snapshot and the `access.connected` event.
