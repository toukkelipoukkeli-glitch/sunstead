# Mission Spec: Live Aiven Verification Gate

Date: 2026-06-25

Mission ID: `M05.5`

Status: DEFINED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: cold-open outcome -> PulseWall source app -> one-click `Graduate To Aiven` -> behavior scan -> Aiven proof spine -> Aiven Postgres data migration -> Postgres `app_events` browser proof -> scoped cutover -> Kafka agent-bus proof -> final report.
- Intentional cuts: production auth migration, production storage migration, full CDC, Aiven Apps deploy, all source platforms, and complex multi-process agent runtime.

## Purpose

This mission turns the already-built cached/scaffold path into a repeatable live Aiven proof gate.

It is not a new product feature. It is the bridge between "the demo shell works" and "we trust it with real Aiven infrastructure during a judged demo."

The hard proof is:

```text
local API -> Aiven Postgres -> local Aiden adapter -> browser API endpoints
```

Kafka remains a sponsor-visible proof path, but it is not allowed to block the browser-critical runtime cutover.

The control-plane proof should use the hosted Aiven MCP server configured for Codex:

```toml
[mcp_servers.aiven]
url = "https://mcp.aiven.live/mcp?allow_secrets=true"
enabled = true
default_tools_approval_mode = "prompt"
startup_timeout_sec = 20
tool_timeout_sec = 90
```

This lives in:

```text
.codex/config.toml
```

The repo also keeps the raw MCP server descriptor for tools that expect JSON MCP config:

```json
{
  "mcpServers": {
    "aiven": {
      "url": "https://mcp.aiven.live/mcp?allow_secrets=true"
    }
  }
}
```

`allow_secrets=true` is acceptable for the local demo operator, but every script must redact secrets from output.

## Position In Critical Path

Run this after:

- Mission 01 scaffold exists;
- Mission 03 scaffold exists;
- Mission 05 scaffold exists;
- local API and control room typecheck/build.

Run this before:

- Mission 04 full Kafka agent-bus panel;
- Mission 06 UI hardening;
- final rehearsal timing.

This gate protects the rest of the build from polishing a path that has not passed live infrastructure proof.

## Target

Add one repeatable verification path that proves Missions 01, 03, and 05 against live Aiven services with no secret leakage.

The presenter and builder should be able to run one command and know:

- Aiven project/service visibility works or is explicitly skipped with reason;
- Aiven Postgres receipt write/read works;
- scoped PulseWall tables exist in Aiven Postgres;
- row counts match the expected demo dataset;
- local adapter can switch to the Aiven provider;
- `/api/posts` reads Aiven rows after cutover;
- `/api/reactions` writes to Aiven Postgres;
- `/api/events/recent` reads the resulting `app_events` row;
- Kafka proof is live if Kafka env exists, otherwise clearly marked as a non-blocking sponsor proof gap.

## Deliverables

### 1. Verification script

Add:

```text
scripts/verify-live-aiven.mjs
```

Add root script:

```json
"verify:live": "node scripts/verify-live-aiven.mjs"
```

The script assumes the local API is already running at `API_BASE_URL` or `http://localhost:8787`.

It must not start the dev server itself. Starting the server should remain a deliberate presenter step so port failures are visible.

The script must verify that `.codex/config.toml` contains `mcp_servers.aiven` before it runs live proof. It may also verify `.mcp.json` for the raw server descriptor. It does not need to print the server URL in normal output.

### 2. API sequence

The script runs this sequence:

```text
GET  /api/health
POST /api/runs
POST /api/runs/:runId/source-scan
POST /api/runs/:runId/proof-spine
POST /api/runs/:runId/data-migration
POST /api/runs/:runId/provider-cutover
GET  /api/adapter/status
GET  /api/posts
GET  /api/leaderboard
POST /api/reactions
GET  /api/events/recent
GET  /api/runs/:runId/report
```

`source-scan` is included even though M02 is already complete because it confirms the live verification run still starts from real PulseWall source evidence.

### 3. Assertions

Hard pass requirements:

- API health returns `ok: true`.
- A fresh/reset run is created.
- source scan emits `behavior.scan.completed` with `source: "live"` and `status: "ok"`.
- data migration emits `migration.schema.applied` with `source: "live"` and `status: "ok"`.
- data migration emits `migration.rows.validated` with `source: "live"` and `status: "ok"`.
- row validations all have `source: "live"` and `status: "passed"`.
- row validation counts match:
  - `posts`: 40
  - `reactions`: 120
  - `demo_users`: 8
  - `app_events`: 2
- provider cutover emits `realtime.postgres_events_bridge.passed` with `source: "live"` and `status: "ok"`.
- provider cutover emits `cutover.demo_runtime.ready` with `source: "live"` and `status: "ok"`.
- `GET /api/adapter/status` returns `mode: "live"`.
- `GET /api/posts` returns at least one post.
- `GET /api/leaderboard` returns at least one row.
- `POST /api/reactions` returns `ok: true`.
- `GET /api/events/recent` returns a `post.reaction_added` event for the posted reaction path.
- final report has `demoCutoverStatus: "passed"`.
- final report has `runtimeDependency: "removed_from_scoped_demo_path"`.

Soft pass requirements:

- `.codex/config.toml` contains the Codex `mcp_servers.aiven` configuration.
- `.mcp.json` contains the raw `mcpServers.aiven` server descriptor.
- proof spine can verify Aiven project/services when `AIVEN_TOKEN` and `AIVEN_PROJECT` exist.
- proof spine can produce/list one Kafka proof event when Kafka env exists.
- Kafka checks may be `skipped` only if Kafka env vars are missing.

Hard fail conditions:

- `AIVEN_POSTGRES_URL` is missing for live mode.
- any required Postgres data-migration or cutover event is `cached`, `fixture`, `skipped`, or `failed`.
- adapter remains in fixture mode after provider cutover.
- `/api/events/recent` does not return the app event after a reaction write.
- any error message prints an env secret or full connection string.

## Environment Contract

Required for this gate:

```text
AIVEN_POSTGRES_URL
```

Required repo config:

```text
.codex/config.toml with mcp_servers.aiven.url = https://mcp.aiven.live/mcp?allow_secrets=true
.mcp.json with mcpServers.aiven.url = https://mcp.aiven.live/mcp?allow_secrets=true
```

Recommended:

```text
AIVEN_TOKEN
AIVEN_PROJECT
AIVEN_PG_SERVICE
```

Optional until Mission 04:

```text
AIVEN_KAFKA_SERVICE
AIVEN_KAFKA_BOOTSTRAP_SERVERS
AIVEN_KAFKA_USERNAME
AIVEN_KAFKA_PASSWORD
```

Optional local override:

```text
API_BASE_URL=http://localhost:8787
```

The script may list which env var names are missing. It must never print env values.

## Output Contract

The terminal output should be short and judge-rehearsal friendly:

```text
Aiden live Aiven verification
API: http://localhost:8787
Run: run_...

PASS source scan: 8 findings from PulseWall
PASS proof spine: Postgres receipt write/read live
WARN proof spine: Kafka skipped, missing AIVEN_KAFKA_...
PASS data migration: posts=40 reactions=120 demo_users=8 app_events=2
PASS cutover: adapter mode live
PASS runtime read: /api/posts returned 40
PASS runtime write: /api/reactions ok
PASS runtime event: /api/events/recent returned post.reaction_added
PASS final report: scoped demo runtime removed Supabase from the demo path

Result: LIVE AIVEN GATE PASSED
```

On failure:

```text
Result: LIVE AIVEN GATE FAILED
Failed gate: provider cutover
Reason: adapter mode fixture after cutover
Next action: check AIVEN_POSTGRES_URL and rerun npm run verify:live
```

No JSON dump by default. Add `--json` only if needed later.

## UI Implications

This mission does not redesign the UI.

It should make the current control room trustworthy by ensuring its live badges are earned:

- `Run live proof` should be backed by live M01 proof when env exists.
- `Migrate data` should show live row validations after M03 passes.
- `Cutover app` should only show the scoped Aiven runtime after M05 passes.
- cached/skipped proof remains allowed only for explicitly missing optional proof surfaces.

If adding a UI action is cheap, the only acceptable addition is a small presenter action:

```text
Verify live path
```

That action should call the same backend sequence or display the last script result. It is not required for this mission if the script is faster.

## Fallback Policy

Postgres fallback:

- If Aiven Postgres fails, the demo is not live-ready.
- Use fixture mode for judging only if time runs out, and say so honestly.
- Do not call the scoped runtime live if adapter mode is still fixture.

Kafka fallback:

- If Kafka env is missing or unstable, keep Kafka as cached/same-day proof and show one smaller live Aiven Postgres proof.
- Do not let Kafka break the browser-critical PulseWall cutover.

API fallback:

- If the full PulseWall source app panel is unstable, show the control-room scoped runtime panel backed by the same adapter endpoints.
- `/api/events/recent` proof is acceptable even if optional SSE is not built.

## Implementation Notes

- Use Node built-in `fetch`; do not add a dependency unless necessary.
- Load `.env.local` with `dotenv/config` or explicit `dotenv.config({ path: ".env.local" })`.
- Read `.codex/config.toml` and `.mcp.json` as configuration only. Do not write secrets into either file.
- Redact known env values from any thrown error before printing.
- Keep request output summarized; do not print full responses unless `--verbose` is passed.
- Exit with code `0` only when hard pass requirements are met.
- Exit with code `1` for hard failures.
- Treat Kafka as `WARN`, not `FAIL`, unless the script is invoked with a future `--require-kafka` flag.
- Keep the script idempotent. M03 already clears and reloads demo-prefixed rows.
- Avoid writing any generated artifact that could include secrets.

## Acceptance

- `npm run verify:live` exists.
- With missing `AIVEN_POSTGRES_URL`, it fails fast with a clear missing-env message and no secret output.
- With live Aiven Postgres configured, it passes M03 and M05 hard gates.
- With live Aiven project credentials configured, it reports M01 project/service visibility.
- With live Kafka credentials configured, it reports Kafka proof as live.
- With Kafka missing, it warns but still passes if Postgres and cutover gates pass.
- The script summary is readable enough to use during rehearsal.
- `npm run typecheck` still passes.
- `npm exec --workspace @aiden/control-room vite -- build` still passes.
- `plans/IMPLEMENTATION_TRACKER.md` records the live verification result after the first real run.

## Done Definition

This mission is done when one repeatable local command proves:

```text
PulseWall scoped runtime -> local Aiden adapter -> Aiven Postgres + app_events
```

and the control room can truthfully show the same run as live for data migration and scoped cutover.

After this passes, the next highest-value work is:

1. Mission 04 Kafka agent-bus panel, if Kafka credentials are available.
2. Mission 06 UI hardening and final report polish.
3. Mission 07 rehearsal hardening and fallback recording.
