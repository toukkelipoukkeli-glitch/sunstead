# Runtime Contracts

Date: 2026-06-25

## Topology

```text
Browser
  -> Aiden Control Room UI
  -> PulseWall source app
  -> migrated demo path after cutover

Local Aiden API / worker
  -> state machine
  -> fixture run player
  -> scanner
  -> Agent SDK Aiven MCP probe + direct Aiven fallback proof wrapper
  -> Postgres migration/validation
  -> Kafka produce/list for agent bus
  -> Postgres events polling bridge, SSE optional

Aiven
  -> PostgreSQL: app data, app_events, receipts, validation checks
  -> Kafka: agent bus, migration events, production event-bus proof

Supabase/Lovable source
  -> source app remains unchanged
```

## State Machine

Canonical states:

```text
idle
access_connected
scan_running
behavior_mapped
aiven_shadow_ready
migration_running
migration_validated
realtime_validated
demo_cutover_running
demo_cutover_complete
report_ready
failed
```

Mission 00 may replay these states from fixtures. Live missions must emit the same states through the same event shape.

State transition event shape:

```ts
type RunEvent = {
  runId: string
  type: string
  agent: string
  state: string
  status: "started" | "ok" | "failed" | "skipped"
  source: "fixture" | "live" | "cached"
  summary: string
  details?: Record<string, unknown>
  createdAt: string
}
```

UI state should be derived from an append-only `RunEvent[]` stream. Do not hardwire separate UI paths for fixture and live mode.

Access preflight snapshot shape:

```ts
type AccessCheckStatus =
  | "ready"
  | "connected"
  | "live_verified"
  | "warning"
  | "blocked"
  | "not_requested"
  | "later"

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
  source: "fixture" | "live" | "cached"
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

`RunSnapshot` includes `accessSnapshot`. `Graduate To Aiven` is enabled only when
`accessSnapshot.canGraduate` is true. Kafka warning, production Auth, production Storage, and
production cutover are non-blocking for the scoped demo path.

## Fixture Mode Contract

Mission 00 uses fixture data to render the entire demo flow before live integrations exist.

Fixture files should cover:

- full run event stream;
- behavior graph;
- Aiven action receipts with MCP/direct-fallback labels;
- Kafka agent bus events;
- validation checks;
- realtime rewrite proof through Postgres events;
- Kafka agent-bus proof;
- final report;
- optional cost/CTO card.

Required fixture behavior:

- `POST /api/runs/:runId/graduate` can run in `DEMO_MODE=fixture`;
- events are emitted with realistic timing;
- every event includes `source: "fixture"`;
- the UI can later display `source: "live"` events without layout changes;
- presenter/manual step controls work in fixture mode.

## Agent Names

Use these names consistently in UI, receipts, logs, and events:

- `access_broker`
- `repo_scanner`
- `behavior_mapper`
- `aiven_operator`
- `migration_operator`
- `compatibility_surgeon`
- `validation_auditor`
- `cutover_manager`
- `report_agent`

These can be implemented as modules inside one worker. They do not need separate processes.

## API Endpoints

Local Aiden API:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/runs` | Create/reset a migration run |
| `POST` | `/api/runs/:runId/graduate` | Start the bounded one-click agent workflow |
| `POST` | `/api/runs/:runId/graduate-fixture` | Explicit offline fixture fallback for rehearsal |
| `GET` | `/api/runs/:runId` | Current run state |
| `GET` | `/api/runs/:runId/events` | SSE stream for control room |
| `GET` | `/api/runs/:runId/report` | Final proof package |
| `POST` | `/api/runs/:runId/access-preflight` | Refresh access checks, update `access.connected`, and return a secret-safe `accessSnapshot` |
| `POST` | `/api/runs/:runId/proof-spine` | Run the Aiven project/Postgres/Kafka proof spine and replace proof events |
| `POST` | `/api/runs/:runId/source-scan` | Scan PulseWall source/migrations and replace the behavior graph |
| `POST` | `/api/runs/:runId/data-migration` | Create/load/validate the scoped PulseWall dataset in Aiven Postgres |
| `POST` | `/api/runs/:runId/kafka-agent-bus` | Publish/verify workflow events through the Kafka agent-bus proof, or cached warning when Kafka env is absent |
| `POST` | `/api/runs/:runId/provider-cutover` | Smoke test and switch the scoped adapter to Aiven Postgres when configured |
| `POST` | `/api/runs/:runId/step/:stepName` | Hidden/manual presenter control |

Generated local adapter:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/adapter/status` | Current local adapter mode: fixture or live Aiven provider |
| `GET` | `/api/posts` | Read migrated posts from Aiven Postgres |
| `GET` | `/api/leaderboard` | Read migrated leaderboard from Aiven Postgres |
| `POST` | `/api/reactions` | Write demo reaction and insert Aiven Postgres `app_events` row |
| `GET` | `/api/events/recent` | Primary polling endpoint for recent Aiven Postgres `app_events` rows |
| `GET` | `/api/events` | Optional SSE endpoint backed by Aiven Postgres `app_events` |

## Aiven Postgres Tables

Minimum control-plane tables:

```sql
create table if not exists migration_runs (
  id text primary key,
  source_app text not null,
  target_project text,
  target_postgres_service text,
  target_kafka_service text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists mcp_receipts (
  id bigserial primary key,
  run_id text not null references migration_runs(id),
  agent text not null,
  intent text not null,
  tool text not null,
  target text,
  risk text not null,
  result text not null,
  rollback text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists validation_checks (
  id bigserial primary key,
  run_id text not null references migration_runs(id),
  check_name text not null,
  status text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Minimum realtime bridge table:

```sql
create table if not exists app_events (
  id bigserial primary key,
  run_id text not null,
  event_type text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_run_created_idx
  on app_events (run_id, created_at desc, id desc);
```

Minimum app-data tables for the demo:

- `posts`
- `reactions`
- `app_events`

Optional if needed for author labels or foreign-key preservation:

- `demo_users`

Use a minimal schema if the full Supabase schema slows progress. Do not add `profiles` or generic `events` unless the scanner detects them in the source app.

## Kafka Topics

| Topic | Purpose |
| --- | --- |
| `migration.events` | Agent bus, workflow timeline, and production event-bus proof |
| `migration.audit` | Optional audit mirror |

Agent bus payload:

```json
{
  "runId": "run_2026_06_25_pulsewall",
  "event": "behavior.scan.completed",
  "agent": "repo_scanner",
  "status": "ok",
  "summary": "Detected Supabase data, auth, storage, realtime, RLS",
  "createdAt": "2026-06-25T10:00:00Z"
}
```

Postgres `app_events` payload:

```json
{
  "runId": "run_2026_06_25_pulsewall",
  "event": "post.reaction_added",
  "postId": "post_123",
  "reaction": "hype",
  "source_behavior": "supabase_realtime",
  "target": "aiven_postgres.app_events",
  "createdAt": "2026-06-25T10:00:00Z"
}
```

Kafka is still used for the agent bus and production event-bus proof. It is not required for the browser-critical event update in the hackathon demo.

## Provider Boundary

The app must never put Aiven Postgres credentials in browser env.

Provider shape:

```ts
type PulseWallProvider = {
  listPosts(): Promise<Post[]>
  getLeaderboard(): Promise<LeaderboardRow[]>
  addReaction(input: AddReactionInput): Promise<void>
  listRecentEvents(input: { sinceId?: string; limit?: number }): Promise<PulseWallEvent[]>
}
```

Browser-critical realtime is implemented as a polling loop over `listRecentEvents`, backed by
`GET /api/events/recent` and Aiven Postgres `app_events`. Do not require provider-level
subscription semantics for the hackathon path.

Implementations:

- `supabaseProvider`: existing app path.
- `aivenProvider`: calls local adapter routes.

Cutover means swapping the provider for the scoped demo path, not migrating production auth/storage.

## Environment Variables

Use `.env.local`; never commit real values.

Required for live Aiven Postgres proof mode:

```text
AIVEN_POSTGRES_URL=
```

Recommended for project/service visibility:

```text
AIVEN_TOKEN=
AIVEN_PROJECT=
AIVEN_PG_SERVICE=
```

Optional for Kafka proof:

```text
AIVEN_KAFKA_SERVICE=
AIVEN_KAFKA_BOOTSTRAP_SERVERS=
AIVEN_KAFKA_USERNAME=
AIVEN_KAFKA_PASSWORD=
```

Optional:

```text
ANTHROPIC_API_KEY=
AGENT_REASONER=off|anthropic
ANTHROPIC_MODEL=
CLAUDE_CODE_EXECUTABLE=
SOURCE_SUPABASE_URL=
SOURCE_SUPABASE_DB_URL=
SOURCE_POSTGRES_URL=
SOURCE_SUPABASE_TABLES=
SOURCE_POSTGRES_TABLES=
SOURCE_COPY_LIMIT=
SOURCE_SUPABASE_ANON_KEY=
SOURCE_SUPABASE_SERVICE_ROLE_KEY=
DEMO_MODE=live|fixture
DEMO_RUN_ID=
```

Source Supabase keys are required only when running the original Supabase app live. Generic source-data shadow copy uses `SOURCE_SUPABASE_DB_URL` or `SOURCE_POSTGRES_URL` plus an explicit `SOURCE_SUPABASE_TABLES`/`SOURCE_POSTGRES_TABLES` allowlist. Fixture mode and seeded Aiven demo migration do not require them.

## Secrets Rule

Only local server/worker code may read Aiven credentials, Supabase service role keys, Kafka credentials, or Anthropic keys.

Browser code may receive only non-secret run state and demo data from the local adapter.
