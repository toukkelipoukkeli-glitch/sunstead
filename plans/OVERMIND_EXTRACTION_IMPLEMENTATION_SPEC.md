# Overmind Extraction Implementation Spec

Date: 2026-06-25

Status: SPEC READY, NOT YET IMPLEMENTED

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Chosen track: Aiven main challenge, "The Autonomous Data Operator."
- Current base to keep: `henri` branch, `/setup -> /control -> Graduate To Aiven`.
- Branch to mine for ideas: `origin/overmind`.
- Core demo flow to protect: one visible product action produces an Aiven-backed proof path, receipts, validation, and a final executive report.
- Intentional cuts to keep: production Auth migration, production Storage migration, full CDC, production DNS/env cutover, Aiven Apps, WorkOS, CTO voice, and Kafka on the browser-critical path.

## Executive Decision

Do not merge `origin/overmind`.

Steal its strongest proof mechanics and integrate them into the current `henri` architecture.

The base remains:

```text
Vite/React control room
Fastify local API
typed run state machine
Anthropic Agent SDK as bounded Aiven MCP reasoner/control-plane surface
deterministic scanner/migration/validation code
Aiven Postgres as browser-critical runtime path
Kafka optional/warning unless configured
```

The extraction goal is:

```text
Keep the reliable one-click demo,
but add Overmind's stronger behavior graph,
cutover PR artifact,
target credential resolver,
generated adapter package,
and more legible phase/artifact proof.
```

## Why This Exists

The current branch is stronger for the hackathon because it is focused and rehearsable. The `overmind` branch contains several high-signal implementation ideas we do not yet have:

- a structured `BehaviorGraph`;
- Aiven MCP secrets-first Postgres connection resolution;
- a real GitHub PR cutover artifact;
- generated Aiven-native backend/adapter files;
- explicit phase/artifact event vocabulary;
- stronger row parity and pgvector proof;
- Kafka SASL endpoint hardening;
- a deterministic "real proof or honest pending" degradation style.

This spec turns those ideas into an implementation plan that fits the current repo instead of replacing it.

## Source Audit

| Overmind source | Extract | Why | Do not extract |
| --- | --- | --- | --- |
| `origin/overmind:overmind/core/graph.ts` | `BehaviorGraph`, `BehaviorNode`, dependency edges, readiness score | Stronger than flat `BehaviorFinding[]`; makes "behavior migration" visible and credible | Exact enum names if they conflict with current contracts |
| `origin/overmind:overmind/core/scan.ts` | richer SQL/client scan facts | Better parsing for tables, indexes, functions, triggers, storage, realtime, RPC, edge functions | Full rewrite if current scanner can be extended incrementally |
| `origin/overmind:overmind/server/migrator.ts` | secrets-first target connection resolver, parity proof, pgvector proof | Removes need to manually paste Aiven URL when service metadata is available; improves proof quality | PulseWall-only table copy as the generic path |
| `origin/overmind:overmind/server/pr.ts` | real PR cutover artifact, secret scan, placeholder `.env.aiven`, migration notes | Best judge-visible "agent did work" artifact we lack | `gh` CLI dependency as the only path |
| `origin/overmind:overmind/surgeon/generate.ts` | generated Aiven adapter/backend package concept | Bridges gap between shadow migration and real app migration | Full generated backend as a critical-path claim |
| `origin/overmind:overmind/shared/types.ts` | phase/artifact/stack/event vocabulary | Makes UI and proof stream more structured | Whole separate `SwarmEvent` protocol if it breaks current `RunEvent[]` |
| `origin/overmind:overmind/server/orchestrator.ts` | phase order and honest degradation style | Good mental model for one-click flow | 10-phase rewrite, fresh provisioning default, CTO/operate stage |
| `origin/overmind:overmind/aiven/mcp.ts` | deterministic MCP JSON-RPC secrets call idea | Useful for connection info if allowed | Raw Anthropic Messages API runner; current product uses Agent SDK |
| `origin/overmind:demo/aiven-migrator/src/index.ts` | parallel scout-agent idea | Future product pattern for broad analysis | Older SDK/toolRunner path as current runtime |

## Current Gaps In `henri`

What we have now:

- `/setup` with managed profile, GitHub import, source DB URL/table allowlist, and CSV import;
- one-click run in `runOneClickGraduate`;
- live Aiven Postgres proof;
- generic source/CSV shadow row copy;
- PulseWall-specific interactive Aiven provider cutover;
- optional Kafka workflow bus proof;
- Anthropic Agent SDK bounded reasoner;
- migration change trace UI slot.

What we do not yet have:

- a first-class graph with typed node dependencies;
- a durable migration manifest between scanner, executor, UI, and report;
- source DB introspection fused with repo scan;
- automatic target connection resolution from Aiven service metadata/secrets;
- generated adapter/backend artifacts for generic Lovable apps;
- a real GitHub PR cutover artifact;
- structured generated-artifact/heal/test events;
- app-compatible generic schema migration beyond shadow JSON rows;
- PR branch write permission flow in GitHub setup;
- clear UI distinction between "shadow migration completed" and "adapter PR generated".

## Locked Extraction Rules

These rules avoid repeating the branch split problem.

1. `henri` stays the base.
2. No deletion or replacement of `src/apps/*` or `src/packages/*`.
3. No WorkOS, CTO voice, voice briefing, or broad founder dashboard.
4. No raw Anthropic Messages MCP runner unless the Agent SDK is proven unable to perform the needed bounded task.
5. Deterministic code owns database writes, file generation, validation, and PR API calls.
6. Anthropic Agent SDK may summarize, classify, review sanitized plans, and call allowlisted Aiven MCP read tools.
7. Kafka stays optional and off the browser-critical path.
8. Fresh Aiven service provisioning is optional and explicit, not the default live demo path.
9. GitHub PR generation is a cutover package, not production cutover.
10. Generic Lovable support must remain honest: scan + shadow copy + adapter artifact is not the same as full production migration.

## Target Product Claim After Extraction

The current honest claim:

```text
Aiden can migrate the scoped PulseWall runtime path to Aiven Postgres,
scan generic Lovable/Supabase projects,
copy selected generic source data into Aiven shadow rows,
and report adapter blockers.
```

The upgraded honest claim:

```text
Aiden can scan a Lovable/Supabase project into a behavior graph,
build a migration manifest,
move supported source data into Aiven,
generate an Aiven adapter/cutover package,
open a reviewable GitHub PR when repo write access is granted,
and prove the scoped runtime path on Aiven Postgres.
```

Still not claimed:

```text
One click fully replaces production Supabase Auth, Storage, RLS semantics,
Edge Functions, DNS, production env vars, and all app call sites without review.
```

## New Implementation Missions

These missions are named `OX` for Overmind Extraction. They come after the current critical path unless the team explicitly swaps priorities.

Recommended order:

```text
OX00 Baseline audit and non-regression gate
  -> OX01 Contract additions
  -> OX02 BehaviorGraph v2
  -> OX03 Source DB introspection
  -> OX04 MigrationManifest
  -> OX05 Aiven target connection resolver
  -> OX06 GitHub cutover PR artifact
  -> OX07 Generated Aiven adapter package
  -> OX08 Artifact validation and repair loop
  -> OX09 Control-room integration
  -> OX10 Verification and rehearsal

Optional later:
  OX11 explicit fresh Aiven provisioning
  OX12 Kafka endpoint hardening
```

If time is short, the highest ROI slice is:

```text
OX01 -> OX02 -> OX04 -> OX07 -> OX06 -> OX09 -> OX10
```

That gives the demo a stronger behavior graph, a manifest, generated adapter files, and a real cutover artifact without disturbing the data path.

## OX00: Baseline Audit And Non-Regression Gate

### Target

Lock the current behavior before extraction work begins.

### Files

- `scripts/demo-rehearsal.mjs`
- `scripts/verify-live-aiven.mjs`
- `plans/IMPLEMENTATION_TRACKER.md`
- `plans/VERIFICATION_RUNBOOK.md`

### Implementation

Run and record the current baseline:

```text
npm run typecheck
npm exec --workspace @aiden/control-room vite -- build
npm run verify:live -- --one-click
npm run demo:rehearse
```

If live Aiven credentials are unavailable, record which checks are cached/warning. Do not start extraction work if the base app cannot boot.

### Acceptance

- `/setup` returns 200.
- `/control` returns 200.
- Managed PulseWall profile can create a run.
- `Graduate To Aiven` still completes or fails with explicit setup blockers.
- Current dirty UI additions are understood and not overwritten.

### Cut Line

If baseline fails, fix baseline first. Do not add extraction features on top of a broken one-click path.

## OX01: Contract Additions

### Target

Add structured graph/artifact/cutover contracts while preserving existing `BehaviorFinding[]`, `RunEvent[]`, and UI compatibility.

### Files

- `src/packages/contracts/src/index.ts`
- `src/packages/fixtures/src/index.ts`
- `src/apps/aiden-api/src/state/runStore.ts`
- `src/apps/control-room/src/lib/deriveRunView.ts`

### New Types

Add these without removing existing types:

```ts
export type BehaviorKind =
  | "table"
  | "index"
  | "constraint"
  | "view"
  | "extension"
  | "function"
  | "trigger"
  | "rls"
  | "auth"
  | "storage"
  | "realtime"
  | "rpc"
  | "edge_function"
  | "client_call"
  | "env_var"

export type BehaviorTarget =
  | "aiven_postgres"
  | "aiven_kafka"
  | "generated_adapter"
  | "human_review"
  | "none"

export type BehaviorNode = {
  id: string
  kind: BehaviorKind
  name: string
  detail: string
  classification: BehaviorClassification
  target: BehaviorTarget
  dependsOn: string[]
  evidence: SourceRef[]
  source: ProofSource
}

export type BehaviorGraph = {
  sourceLabel: string
  sourceKind: SourceKind
  framework: string[]
  packageManagers: string[]
  summary: {
    tables: string[]
    hasAuth: boolean
    hasStorage: boolean
    hasRealtime: boolean
    hasRls: boolean
    hasRpc: boolean
    hasEdgeFunctions: boolean
    hasVector: boolean
  }
  nodes: BehaviorNode[]
  readinessScore: number
  blockers: MigrationBlocker[]
  source: ProofSource
  createdAt: string
}

export type MigrationBlocker = {
  id: string
  severity: "info" | "warning" | "blocking"
  behaviorNodeId?: string
  title: string
  detail: string
  resolution: string
  source: ProofSource
}

export type GeneratedArtifact = {
  id: string
  runId: string
  kind:
    | "migration_manifest"
    | "adapter_package"
    | "env_example"
    | "migration_notes"
    | "github_pr"
    | "schema_plan"
    | "validation_report"
  path?: string
  title: string
  status: "planned" | "generated" | "validated" | "failed" | "skipped"
  source: ProofSource
  details?: Record<string, unknown>
  createdAt: string
}

export type CutoverArtifact = {
  id: string
  runId: string
  type: "github_pr" | "local_patch" | "artifact_bundle"
  status: "opened" | "generated" | "skipped" | "failed"
  url?: string
  branch?: string
  files: string[]
  proof: string
  source: ProofSource
  details?: Record<string, unknown>
  createdAt: string
}
```

Extend `RunSnapshot`:

```ts
behaviorGraph?: BehaviorGraph
migrationManifest?: MigrationManifest
generatedArtifacts: GeneratedArtifact[]
cutoverArtifacts: CutoverArtifact[]
```

Keep `behaviorFindings` until every UI panel has migrated.

### Event Additions

Add these event types but do not require every run to emit all of them immediately:

```text
behavior.graph.generated
migration.manifest.generated
aiven.target_connection.resolved
adapter.package.generated
adapter.package.validated
cutover.pr.opened
cutover.pr.skipped
cutover.artifact.generated
```

### Acceptance

- TypeScript compiles.
- Existing fixture run still renders.
- Existing UI reads `behaviorFindings` if `behaviorGraph` is absent.
- New fields default to empty arrays or `undefined`, not `null`.

## OX02: BehaviorGraph v2

### Target

Upgrade the scanner result from a flat findings list into a structured behavior graph with dependencies and readiness.

### Files

- `src/packages/migration-core/src/index.ts`
- new `src/packages/migration-core/src/graph.ts`
- optional new `src/packages/migration-core/src/sqlScan.ts`
- `src/packages/contracts/src/index.ts`
- `src/apps/aiden-api/src/state/runStore.ts`

### Existing Pattern

Current scanner already detects:

- tables;
- realtime tables;
- auth;
- storage buckets;
- edge functions;
- RPC functions;
- RLS tables;
- trigger functions;
- pgvector markers;
- source evidence.

Do not throw this away. Build on it.

### Implementation

Create:

```ts
export const buildBehaviorGraph = (scan: BehaviorScanResult): BehaviorGraph
```

Rules:

| Input | Node kind | Classification | Target |
| --- | --- | --- | --- |
| SQL/client table | `table` | `direct_migrate` | `aiven_postgres` |
| SQL index | `index` | `direct_migrate` | `aiven_postgres` |
| extension | `extension` | `direct_migrate` | `aiven_postgres` |
| trigger/function without Supabase platform dependency | `trigger` / `function` | `review_required` initially | `aiven_postgres` |
| `supabase.channel` / publication | `realtime` | `rewrite` | `generated_adapter` or `aiven_kafka` for production path |
| `supabase.auth` | `auth` | `adapter_required` | `generated_adapter` |
| `storage.from` | `storage` | `adapter_required` | `generated_adapter` |
| `.rpc` | `rpc` | `adapter_required` | `generated_adapter` |
| `functions.invoke` | `edge_function` | `rewrite` | `generated_adapter` |
| RLS with `auth.uid()` | `rls` | `review_required` | `human_review` |
| `.from(...)` frontend calls | `client_call` | `adapter_required` | `generated_adapter` |

Dependency examples:

```text
index:posts_embedding_idx -> table:posts
function:match_posts -> extension:vector, table:posts
trigger:bump_reaction_count -> table:reactions, table:posts
realtime:posts -> table:posts
rls:posts_user_policy -> auth:auth, table:posts
client_call:data_api -> table:posts, table:reactions
```

Readiness score:

```text
100
- 10 if Auth detected
- 10 if Storage detected
- 10 if RLS uses auth.uid()
- 8 if Edge Functions detected
- 6 if RPC detected without matching SQL function
- 5 if source data access missing
- 5 if target Postgres not verified
- 3 if Kafka not configured and realtime detected
floor at 35 when source scan succeeds
```

The exact weights can be tuned later, but the score must be deterministic and explainable.

### Backward Compatibility

Generate `BehaviorFinding[]` from `BehaviorGraph` for existing UI:

```ts
export const behaviorFindingsFromGraph = (graph: BehaviorGraph): BehaviorFinding[]
```

This lets `BehaviorMap` continue to work while a graph UI is added.

### Acceptance

- PulseWall scan produces graph nodes for tables, realtime, auth, storage, RLS, RPC/edge markers, triggers, and vector.
- Generic GitHub import scan produces graph nodes from the imported source snapshot.
- CSV mode produces a minimal graph with table-export nodes and adapter blockers.
- Existing `behaviorFindings` count does not drop unexpectedly.
- Every graph node has evidence or an explicit generated-source explanation.

### Tests

Add unit tests or script-level assertions for:

- PulseWall graph has `table:posts`;
- PulseWall graph has at least one `realtime` node;
- PulseWall graph has auth/storage/RLS blockers;
- vector extension/embedding evidence is classified direct or review-required, not cut;
- CSV graph does not pretend source code behavior is known.

## OX03: Source DB Introspection

### Target

Fuse static source scan with source database metadata when the user provides `SOURCE_SUPABASE_DB_URL` or `SOURCE_POSTGRES_URL`.

### Files

- new `src/packages/migration-core/src/introspect.ts`
- `src/packages/aiven-ops/src/index.ts`
- `src/apps/aiden-api/src/state/runStore.ts`

### Implementation

Create:

```ts
export type SourceDbIntrospection = {
  source: ProofSource
  schemas: string[]
  tables: Array<{
    schema: string
    name: string
    columns: Array<{
      name: string
      dataType: string
      udtName?: string
      nullable: boolean
      defaultValue?: string
    }>
    rowCount?: number
  }>
  indexes: Array<{ schema: string; table: string; name: string; definition: string }>
  constraints: Array<{ schema: string; table: string; name: string; type: string; definition?: string }>
  extensions: string[]
  functions: Array<{ schema: string; name: string; language?: string; securityDefiner?: boolean }>
  triggers: Array<{ schema: string; table: string; name: string; functionName: string }>
  policies: Array<{ schema: string; table: string; name: string; command: string; usesAuthUid: boolean }>
  publications: Array<{ name: string; tables: string[] }>
  createdAt: string
}
```

Queries:

- `information_schema.columns`;
- `pg_indexes`;
- `pg_constraint`;
- `pg_extension`;
- `pg_proc` and `pg_namespace`;
- `pg_trigger`;
- `pg_policies`;
- `pg_publication` / `pg_publication_tables`;
- row counts only for allowlisted tables.

Rules:

- Do not introspect every table row count unless the user has allowed table names.
- Never query `auth.users` rows.
- Never expose source connection strings.
- Mark introspection as skipped when no source DB is configured.
- Source DB introspection is read-only.

### Integration

Update graph builder:

```text
repo scan + source introspection -> BehaviorGraph
```

Introspection wins for actual columns/indexes/extensions. Repo scan wins for frontend client behavior.

### Acceptance

- With only repo source, graph still works.
- With source DB URL + table allowlist, graph includes columns and row counts.
- Source DB failures emit `source.introspection.skipped` or `source.introspection.failed` without crashing the run.
- Access snapshot reflects whether source DB introspection has run.

## OX04: MigrationManifest

### Target

Create a durable manifest that is the handoff between graph, migration executor, adapter generator, UI, and final report.

### Files

- `src/packages/contracts/src/index.ts`
- new `src/packages/migration-core/src/manifest.ts`
- `src/apps/aiden-api/src/state/runStore.ts`
- `src/apps/control-room/src/components/FinalReport.tsx`

### New Type

```ts
export type MigrationManifest = {
  runId: string
  source: SetupProfile
  graph: BehaviorGraph
  directMigrate: {
    tables: string[]
    indexes: string[]
    extensions: string[]
    functions: string[]
    triggers: string[]
  }
  shadowCopy: {
    mode: "pulsewall_schema" | "source_table_rows" | "csv_source_rows"
    tables: string[]
    copyLimit?: number
  }
  adapterRequired: {
    auth: boolean
    storage: boolean
    rpc: string[]
    edgeFunctions: string[]
    clientTables: string[]
  }
  realtime: {
    browserPath: "aiven_postgres_app_events"
    kafkaPath: "optional_agent_bus" | "configured_agent_bus"
    sourceTables: string[]
  }
  blockers: MigrationBlocker[]
  validationPlan: Array<{
    id: string
    checkName: string
    expected: string
    source: ProofSource
  }>
  createdAt: string
}
```

### Implementation

Create:

```ts
export const buildMigrationManifest = (input: {
  runId: string
  setupProfile: SetupProfile
  graph: BehaviorGraph
  sourceDataPath: SourceDataPath
  accessSnapshot: AccessSnapshot
}): MigrationManifest
```

Manifest rules:

- PulseWall managed profile uses `pulsewall_schema`.
- Source DB URL mode uses `source_table_rows` until app-compatible DDL restore is implemented.
- CSV mode uses `csv_source_rows`.
- Auth/storage/RLS are blockers or adapter-required.
- Realtime always maps browser path to Aiven Postgres `app_events`; Kafka remains optional agent bus.
- Production cutover is not in manifest unless explicitly approved.

### Acceptance

- Every one-click run produces `migration.manifest.generated`.
- The final report references manifest blockers, not hardcoded final-report blockers only.
- Generic source DB and CSV runs end with a manifest that says what was migrated and what still blocks adapter cutover.

## OX05: Aiven Target Connection Resolver

### Target

Steal Overmind's strongest data-plane reliability improvement: resolve target Aiven Postgres credentials from the Aiven service when possible, instead of requiring manual `AIVEN_POSTGRES_URL` every time.

### Files

- new `src/packages/aiven-ops/src/targetConnection.ts`
- `src/packages/aiven-ops/src/index.ts`
- `src/apps/aiden-api/src/state/oneClickOrchestrator.ts`
- `plans/MCP_AND_AIVEN_CONTRACT.md` later, after implementation

### Resolver Order

```text
1. Explicit AIVEN_POSTGRES_URL
2. Deterministic Aiven MCP connection-info call with allow_secrets=true
3. Aiven REST connection info if not redacted
4. Fail with setup blocker
```

### API

```ts
export type TargetConnectionResolution = {
  ok: boolean
  source: "env" | "aiven_mcp_connection_info" | "aiven_rest_connection_info" | "unavailable"
  connectionString?: string
  safeServiceLabel?: string
  safeHost?: string
  missingEnv: string[]
  error?: string
}

export const resolveAivenPostgresConnection = async (input: {
  project?: string
  serviceName?: string
  allowMcpSecrets: boolean
}): Promise<TargetConnectionResolution>
```

### Important Design Choice

Use deterministic code for this resolution. Do not ask the LLM to copy secrets into text.

Possible implementation paths:

- direct JSON-RPC call to hosted Aiven MCP `tools/call` for connection info;
- Agent SDK call only if it can return structured tool results safely without exposing secrets to browser/UI;
- REST fallback only when returned password is not redacted.

### Secret Rules

- Never log the connection string.
- Never store the connection string in `RunSnapshot`.
- Never include username/password in receipts.
- Redact `postgres://`, passwords, tokens, and Aiven service URIs in all errors.
- Browser receives only `safeHost`, `safeServiceLabel`, and source label.

### Integration

Replace direct `readEnv("AIVEN_POSTGRES_URL")!` paths with resolver in:

- Postgres proof spine;
- data migration;
- provider cutover;
- adapter provider creation.

Keep `AIVEN_POSTGRES_URL` support because it is fastest for rehearsal.

### Acceptance

- Existing `.env.local` path still works.
- If `AIVEN_POSTGRES_URL` is absent but `AIVEN_TOKEN`, `AIVEN_PROJECT`, and `AIVEN_PG_SERVICE` are present, resolver attempts MCP/REST.
- Redacted REST response does not produce a broken URI.
- UI shows "target connection resolved through Aiven MCP" without showing secrets.

## OX06: GitHub Cutover PR Artifact

### Target

Add the most judge-visible Overmind upgrade: after migration/manifest generation, Aiden can create a reviewable GitHub PR that adds the Aiven adapter package and migration notes.

### Files

- `src/packages/github-source/src/index.ts`
- `src/apps/aiden-api/src/routes/github.ts`
- `src/apps/aiden-api/src/state/runStore.ts`
- new `src/packages/github-source/src/pr.ts`
- `src/apps/control-room/src/components/CutoverProof.tsx`
- `src/apps/control-room/src/components/MigrationChangeTrace.tsx`

### Product Semantics

This is not production cutover.

It is:

```text
Generated cutover package opened as a PR for review.
```

Presenter line:

```text
Aiden did not flip production. It created the Aiven-backed data plane and opened the branch a human can review to repoint the app.
```

### GitHub Permission Model

Current GitHub import is read-oriented. PR creation needs one of:

1. GitHub App `contents: write` and pull request permission if available;
2. GitHub token with repo write access for hackathon rehearsal;
3. `gh` CLI fallback for local developer-only proof;
4. local patch artifact fallback when write is not authorized.

Preferred implementation:

- keep read-only GitHub install as default;
- when user selects "Generate PR", explain that repo branch write permission is required;
- if write permission is absent, generate local artifact and mark PR as skipped due to missing repo write access.

### API

```ts
export type OpenCutoverPullRequestInput = {
  github: GitHubSourceRef
  title: string
  body: string
  branchName: string
  files: Array<{ path: string; content: string }>
}

export type OpenCutoverPullRequestResult = {
  ok: boolean
  status: "opened" | "skipped" | "failed"
  url?: string
  branch?: string
  files: string[]
  error?: string
  source: ProofSource
}
```

### PR Files

First version should create reviewable files, not rewrite the whole app:

```text
MIGRATION.md
.env.aiven.example
aiden/aiven-db.ts
aiden/aiven-events.ts
aiden/aiven-adapter-plan.json
aiden/validation-report.json
```

For PulseWall managed profile, optionally include:

```text
aiden/pulsewall-provider.ts
```

For generic source profiles, do not claim call sites are patched unless they are actually changed.

### Secret Scan

Before creating commits/PRs, scan generated file contents for:

```text
postgres://user:password@
postgresql://user:password@
AIVEN_TOKEN=
ANTHROPIC_API_KEY=
GITHUB_TOKEN=
ghp_
sk-
eyJ...JWT
service_role
SUPABASE_SERVICE_ROLE_KEY=
```

Allowed:

```text
<set-me>
<your-aiven-host>
DATABASE_URL=postgres://avnadmin:<set-me>@...
```

If scan fails, do not create the PR. Emit `cutover.pr.failed` with a secret-safe reason.

### Event Semantics

On success:

```text
cutover.pr.opened
agent: cutover_manager
state: demo_cutover_complete or report_ready
status: ok
source: live
summary: GitHub cutover PR opened with generated Aiven adapter package.
```

On no write access:

```text
cutover.pr.skipped
status: skipped
source: cached
summary: Cutover PR requires repo write permission; local artifact package generated instead.
```

### UI

Add a PR/artifact row in `CutoverProof`:

- "PR opened" with URL when live;
- "Artifact generated" when local only;
- "Write permission required" when skipped;
- file count and branch name;
- source badge.

### Acceptance

- GitHub source run with write permission opens a PR or produces a clear write-permission skip.
- Generated files contain no real secrets.
- PulseWall managed profile can still complete if no GitHub source is attached.
- Final report includes PR URL or artifact package status.
- Production cutover remains `not_requested`.

## OX07: Generated Aiven Adapter Package

### Target

Create the adapter package that the PR artifact commits. This bridges the gap between "data copied to Aiven" and "the app can be repointed."

### Files

- new `src/packages/adapter-generator/package.json`
- new `src/packages/adapter-generator/src/index.ts`
- new `src/packages/adapter-generator/src/templates.ts`
- `src/packages/contracts/src/index.ts`
- `src/apps/aiden-api/src/state/runStore.ts`

### Scope

First version generates a package and instructions. It does not automatically rewrite arbitrary frontend call sites.

Generated package covers:

- pooled Postgres client;
- table read/write helper stubs for detected tables;
- `app_events` helper for realtime replacement;
- optional generic polling/SSE route sketch;
- `.env.aiven.example`;
- `MIGRATION.md`;
- `validation-report.json`;
- `aiven-adapter-plan.json`.

### Input

```ts
export type GenerateAivenAdapterInput = {
  runId: string
  setupProfile: SetupProfile
  graph: BehaviorGraph
  manifest: MigrationManifest
  validations: ValidationCheck[]
  rowValidations: RowValidation[]
  target: {
    serviceLabel?: string
    safeHost?: string
    databaseName?: string
  }
}
```

### Output

```ts
export type GeneratedAdapterPackage = {
  files: Array<{ path: string; content: string; kind: GeneratedArtifact["kind"] }>
  artifacts: GeneratedArtifact[]
  blockers: MigrationBlocker[]
}
```

### Template Rules

`aiden/aiven-db.ts`:

- imports `pg`;
- reads `DATABASE_URL`;
- uses TLS;
- exports a small query helper;
- never includes real credentials.

`aiden/aiven-events.ts`:

- exports `insertAppEvent`;
- exports `listRecentEvents`;
- documents Supabase Realtime -> Aiven Postgres `app_events`.

`aiden/aiven-adapter-plan.json`:

- lists detected tables;
- lists direct migration nodes;
- lists adapter-required nodes;
- lists review blockers;
- lists validation checks.

`MIGRATION.md`:

- explains source behavior;
- explains Aiven target;
- lists what was migrated;
- lists what still needs review;
- says production cutover is not performed.

`.env.aiven.example`:

- placeholders only.

### Optional Agent SDK Use

The Agent SDK may generate or polish `MIGRATION.md` from sanitized facts, but deterministic templates must be the fallback.

Rules:

- no file tool access;
- no shell;
- no web;
- no secrets;
- max budget small;
- final generated markdown is checked by secret scan.

### Acceptance

- Adapter generator works for PulseWall graph.
- Adapter generator works for GitHub-imported generic graph.
- Generated files are deterministic when Agent SDK is off.
- Generated files pass secret scan.
- Generated artifact events appear in the run snapshot.

## OX08: Artifact Validation And Repair Loop

### Target

Borrow Overmind's "heal" concept, but keep it bounded and deterministic.

### Files

- `src/packages/adapter-generator/src/index.ts`
- new `src/packages/adapter-generator/src/validate.ts`
- `src/apps/aiden-api/src/state/runStore.ts`

### Validation Steps

For generated artifacts:

1. secret scan;
2. JSON parse for `aiven-adapter-plan.json`;
3. TypeScript syntax parse for `.ts` files if practical;
4. markdown exists and contains required headings;
5. no generated file exceeds size limit;
6. no TODO/coming-soon language in user-facing artifact unless it is a precise blocker.

### No Unbounded Auto-Repair

Do not run a loop that asks an LLM to patch files repeatedly. For hackathon reliability:

- deterministic template validation first;
- if validation fails, mark artifact failed;
- optionally call Agent SDK once for a sanitized explanation;
- never let artifact repair block the core migration proof.

### Events

```text
adapter.package.generated
adapter.package.validated
adapter.package.failed
```

### Acceptance

- Bad generated JSON fails validation.
- Secret-shaped strings fail validation.
- Failure does not crash one-click run.
- Final report can still be produced with artifact failure listed.

## OX09: Control-Room Integration

### Target

Make the extracted features visible without making the UI feel like logs.

### Files

- `src/apps/control-room/src/components/BehaviorMap.tsx`
- `src/apps/control-room/src/components/CutoverProof.tsx`
- `src/apps/control-room/src/components/FinalReport.tsx`
- `src/apps/control-room/src/components/MigrationChangeTrace.tsx`
- optional new `src/apps/control-room/src/components/ArtifactPackagePanel.tsx`
- `src/apps/control-room/src/styles.css`

### UI Additions

Add three visible proof concepts:

1. **Behavior Graph**
   - node counts by class;
   - top blockers;
   - dependency line summaries;
   - source evidence count.

2. **Generated Adapter Package**
   - files generated;
   - validation status;
   - which behaviors are covered;
   - what remains manual/review.

3. **Cutover PR**
   - PR URL if opened;
   - local artifact fallback if not;
   - branch name;
   - file count;
   - secret scan status.

### Placement

Do not add a new major route.

Use existing surfaces:

- `MigrationChangeTrace`: add "Adapter package" and "Cutover PR" rows.
- `CutoverProof`: show PR/artifact result.
- `FinalReport`: include PR/artifact summary and blockers.
- `BehaviorMap`: upgrade to graph mode when `snapshot.behaviorGraph` exists.

### Copy Rules

Use:

- "PR opened for review";
- "Adapter package generated";
- "Production cutover not requested";
- "Review required";
- "Requires repo write permission";
- "Shadow migration complete".

Avoid:

- "Supabase removed" without scoped qualifier;
- "fully migrated" for generic sources;
- "coming soon" in proof panels;
- "demo" as the main user-facing noun except where explicit demo scope protects truth.

### Acceptance

- First viewport still communicates the one-click flow.
- PR/artifact status is legible in under five seconds.
- Generic source runs do not look broken just because runtime cutover is skipped.
- PulseWall live cutover still has the strongest visual emphasis.

## OX10: Verification And Rehearsal

### Target

Prove extraction work did not damage the live demo and that new proof artifacts work.

### Commands

Add or extend scripts:

```text
npm run typecheck
npm exec --workspace @aiden/control-room vite -- build
npm run verify:live -- --one-click
npm run demo:rehearse
npm run verify:artifacts
```

`verify:artifacts` should test:

- PulseWall graph generation;
- migration manifest generation;
- adapter package generation;
- secret scan;
- local artifact fallback;
- optional GitHub PR dry run if test token exists.

### Required Scenarios

1. Managed PulseWall profile, no GitHub:
   - one-click run still completes;
   - adapter artifact may generate locally;
   - PR skipped because no GitHub source.

2. GitHub source, read-only:
   - scan succeeds;
   - shadow migration can run if source DB/table allowlist exists;
   - adapter package generated;
   - PR skipped with clear permission reason.

3. GitHub source, write authorized:
   - adapter package generated;
   - PR opened;
   - no real secrets in PR files.

4. CSV source:
   - CSV rows shadow-copied;
   - manifest says source behavior unavailable from CSV alone;
   - adapter package blocker is explicit.

5. Missing Aiven Postgres:
   - access broker blocks graduation;
   - no partial target writes claimed.

### Acceptance

- No regression in current live Aiven Postgres path.
- At least one PR or local artifact package can be shown during rehearsal.
- Final report includes graph, manifest, artifact, validation, and blockers.
- Presenter can explain generic limitation in one sentence.

## OX11: Optional Explicit Fresh Aiven Provisioning

### Target

Optionally add Overmind's fresh target service proof, but only behind an explicit setup mode.

### Why Optional

Fresh Aiven Postgres provisioning is impressive but risky in a short live demo because service creation can take minutes. The current pre-connected workspace is safer.

### Setup Mode

Add only when core extraction is stable:

```text
Aiven workspace mode:
- use existing configured Postgres service
- create fresh target service for this run
```

### Agent SDK Boundary

If implemented, use Agent SDK with allowlisted Aiven MCP create/inspect tools or deterministic Aiven API code with clear direct-fallback receipts.

Do not let the model choose destructive operations.

### Acceptance

- Existing service remains default.
- Fresh service mode has a long timeout and visible progress.
- If provisioning is slow, run can continue in "planned target" mode without fake migration claims.

## OX12: Optional Kafka Endpoint Hardening

### Target

Borrow Overmind's Aiven Kafka SASL endpoint detection so live Kafka proof is less fragile.

### Current Truth

Kafka is optional/warning. It must not block the browser path.

### Implementation

Create a resolver:

```ts
export const resolveKafkaBrokers = async (input: {
  project?: string
  serviceName?: string
}): Promise<{
  ok: boolean
  brokers: string[]
  source: "env" | "aiven_service_components" | "unavailable"
  error?: string
}>
```

Order:

```text
1. AIVEN_KAFKA_BOOTSTRAP_SERVERS
2. Aiven service component with SASL auth
3. unavailable warning
```

### Acceptance

- Existing env path still works.
- If Kafka service metadata is available, resolver chooses SASL endpoint over certificate endpoint.
- Kafka failure remains warning unless `AGENT_REQUIRE_KAFKA=true`.

## Data-Plane Upgrade Roadmap

The current generic path copies selected source tables into Aiven `source_table_rows` as JSON shadow rows. That is honest and useful for proof, but not app-compatible.

The next product-grade data path is:

```text
source DB introspection
  -> direct migration table plan
  -> generated Aiven schema DDL
  -> copy allowlisted rows into app-compatible target tables
  -> verify source/target counts
  -> generate adapter package against those target tables
```

Do not attempt full `pg_dump | pg_restore` as the first extraction unless the schema scope is tightly allowlisted. Supabase projects often include auth/storage/realtime/platform schemas that should not be blindly restored into Aiven.

First app-compatible generic slice:

1. allowlisted `public.*` tables only;
2. portable column types only;
3. indexes after table creation;
4. constraints after data copy when safe;
5. RLS policies only reported, not applied;
6. functions/triggers review-required unless parser marks them portable.

Acceptance for that later slice:

- selected source table exists as a real table on Aiven, not just JSON rows;
- count parity passes;
- generated adapter uses real table names;
- report says unsupported schema elements were skipped/review-required.

## Agent Technology Plan

The current locked decision remains correct:

```text
Agents are modules inside one local worker/state machine.
Anthropic Agent SDK is bounded and optional.
Deterministic tools execute side effects.
```

### Agent SDK Uses After Extraction

Good uses:

- summarize behavior graph;
- write executive recommendation;
- explain blocker/failure;
- review generated adapter plan from sanitized facts;
- call allowlisted Aiven MCP read tools for service/project context;
- optionally propose migration notes text.

Bad uses:

- shell/file edits;
- raw DB credential handling;
- unbounded repo rewriting;
- production cutover;
- destructive cleanup;
- selecting arbitrary Aiven tools at runtime.

### Agent Step Registry Additions

Add steps:

```text
behavior_graph_builder
migration_manifest_builder
adapter_package_generator
artifact_validator
cutover_pr_manager
```

Suggested one-click sequence after extraction:

```text
access_broker
repo_scanner
behavior_graph_builder
migration_manifest_builder
aiven_operator
migration_operator
adapter_package_generator
artifact_validator
cutover_manager
kafka_bus_operator
report_agent
```

Blocking rules:

- graph build blocks if source scan fails;
- manifest generation blocks if graph missing;
- Aiven Postgres proof blocks live migration;
- adapter package failure does not block PulseWall runtime cutover, but appears in final report;
- PR failure does not block proof package if local artifact exists;
- Kafka blocks only when explicitly required.

## Security And Secrets

Non-negotiable:

- `.env.local` stays ignored.
- real source DB URLs never enter generated files.
- real Aiven URLs with passwords never enter generated files.
- GitHub PR files use placeholders only.
- every error path sanitizes env secrets.
- no browser-visible JSON contains secrets.

Add a reusable redactor:

```ts
export const redactSecretText = (text: string): string
export const assertNoGeneratedSecrets = (files: Array<{ path: string; content: string }>): void
```

Use it in:

- target resolver;
- GitHub PR writer;
- adapter generator;
- runStore error handling;
- verification scripts.

## UI Truth Table

| Scenario | Data migration | Adapter package | PR | Runtime cutover | UI wording |
| --- | --- | --- | --- | --- | --- |
| PulseWall managed | live Aiven Postgres app tables | generated or not needed | optional | live controlled path | "Scoped runtime is Aiven-backed" |
| GitHub repo only | no rows unless source DB/CSV exists | generated | opened/skipped | skipped | "Adapter package ready; source data access required" |
| GitHub + source DB | shadow rows live | generated | opened/skipped | skipped until adapter support | "Shadow migration complete; adapter review required" |
| CSV export | shadow rows live | generated with blockers | opened/skipped | skipped | "CSV rows imported; source behavior unavailable from CSV alone" |
| Missing Aiven | blocked | not generated | skipped | skipped | "Aiven target required" |

## Implementation File Plan

New files likely needed:

```text
src/packages/migration-core/src/graph.ts
src/packages/migration-core/src/introspect.ts
src/packages/migration-core/src/manifest.ts
src/packages/aiven-ops/src/targetConnection.ts
src/packages/adapter-generator/package.json
src/packages/adapter-generator/tsconfig.json
src/packages/adapter-generator/src/index.ts
src/packages/adapter-generator/src/templates.ts
src/packages/adapter-generator/src/validate.ts
src/packages/github-source/src/pr.ts
src/packages/contracts/src/redaction.ts
src/apps/control-room/src/components/ArtifactPackagePanel.tsx
scripts/verify-artifacts.mjs
```

Existing files likely touched:

```text
package.json
src/packages/contracts/src/index.ts
src/packages/migration-core/src/index.ts
src/packages/aiven-ops/src/index.ts
src/packages/github-source/src/index.ts
src/apps/aiden-api/src/state/runStore.ts
src/apps/aiden-api/src/state/oneClickOrchestrator.ts
src/apps/aiden-api/src/routes/github.ts
src/apps/control-room/src/pages/ControlRoom.tsx
src/apps/control-room/src/components/BehaviorMap.tsx
src/apps/control-room/src/components/CutoverProof.tsx
src/apps/control-room/src/components/FinalReport.tsx
src/apps/control-room/src/components/MigrationChangeTrace.tsx
src/apps/control-room/src/styles.css
```

## Implementation Slices

### Slice A: Graph + Manifest Only

Goal:

```text
Better behavior migration proof without touching Aiven writes.
```

Tasks:

- add graph contracts;
- build graph from existing scanner;
- build manifest;
- expose in snapshot;
- update BehaviorMap/FinalReport lightly.

Done when:

- one-click run emits graph and manifest events;
- PulseWall graph is visible;
- typecheck/build pass.

### Slice B: Artifact Package Local

Goal:

```text
Generate the Aiven adapter package locally, no GitHub write yet.
```

Tasks:

- add adapter-generator package;
- add secret scan;
- generate files in memory or `artifacts/runs/<runId>`;
- expose artifacts in UI;
- final report lists files.

Done when:

- local artifact package generated for PulseWall and GitHub scan;
- no secrets in generated files.

### Slice C: GitHub PR

Goal:

```text
Open the adapter package as a PR when repo write access exists.
```

Tasks:

- add GitHub branch/commit/PR writer;
- handle permission skip;
- add UI PR row;
- add verification dry run.

Done when:

- PR opens in rehearsal or local artifact fallback is cleanly shown.

### Slice D: Target Resolver

Goal:

```text
Reduce setup friction by resolving Aiven Postgres connection from Aiven metadata/secrets.
```

Tasks:

- add resolver;
- integrate into proof/migration/cutover;
- add redaction tests.

Done when:

- env URL path still works;
- MCP/REST path attempts safely;
- no secrets leak.

### Slice E: Generic App-Compatible Table Migration

Goal:

```text
Move selected generic source tables into real Aiven tables, not only JSON shadow rows.
```

Tasks:

- generate portable DDL from introspection;
- create run-scoped schema or prefixed tables;
- copy allowlisted rows;
- validate count parity;
- update adapter generator to point at real tables.

Done when:

- selected source table migrates into an app-compatible Aiven table;
- report still flags unsupported Auth/Storage/RLS.

This is valuable but not needed before PR artifact and graph.

## Cut Lines

If time collapses, cut in this order:

1. OX11 fresh Aiven provisioning.
2. OX12 Kafka endpoint hardening.
3. OX08 repair loop beyond validation.
4. app-compatible generic table DDL.
5. Agent SDK adapter text polish.
6. GitHub write PR, if local artifact package exists.

Do not cut:

- current PulseWall live Aiven Postgres path;
- proof labels;
- secret scan;
- final report honesty;
- one-click entrypoint.

## Risk Register

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| GitHub App lacks write permission | High | PR cannot open | local artifact fallback; explicit access check |
| Secret leakage in generated PR | Medium | Severe | reusable secret scan; placeholders only; fail closed |
| Graph migration breaks existing BehaviorMap | Medium | Medium | keep `BehaviorFinding[]` compatibility |
| Aiven MCP connection-info tool shape differs | Medium | Medium | env URL first; REST fallback; clear setup blocker |
| Generated adapter overclaims support | Medium | High | manifest blockers; no automatic callsite rewrite claim |
| Generic source schema too complex | High | Medium | shadow row copy remains default; app-compatible DDL later |
| UI becomes too busy | Medium | Medium | integrate into existing panels; no new route |
| Agent SDK introduces flakiness | Medium | Low/Medium | deterministic fallback for every generated text |

## Definition Of Done

The extraction is done when a rehearsal can show:

1. Aiden scans source into a visible behavior graph.
2. Aiden creates a migration manifest from that graph.
3. Aiden runs the existing Aiven Postgres proof/migration path without regression.
4. Aiden generates an Aiven adapter package with no secrets.
5. If GitHub write access is available, Aiden opens a PR with the adapter package.
6. If GitHub write access is not available, Aiden shows a local artifact package and the exact missing permission.
7. Final report lists migrated data, generated files, PR/artifact status, blockers, rollback, and production cutover status.
8. Kafka remains optional and warning-only unless credentials are configured.
9. `npm run typecheck` and control-room build pass.
10. The presenter can say the upgraded claim without caveats that sound like backtracking.

## Presenter Framing After Extraction

Use:

```text
The important thing is that Aiden does not just copy tables.
It builds a behavior graph, migrates the Aiven-native data path,
then generates the reviewable adapter branch that removes Supabase from the scoped runtime path.
Production Auth, Storage, and RLS are called out as review gates instead of being hand-waved.
```

If PR opened:

```text
This is the branch Aiden opened. It contains the Aiven adapter, env template, validation report, and migration notes. No production traffic was switched.
```

If PR skipped:

```text
This run has repo read access, not branch write access, so Aiden generated the same cutover package locally and marked the missing permission.
```

If generic source:

```text
For arbitrary Lovable apps, Aiden can scan behavior and migrate the supported data path. Runtime cutover waits for the generated adapter review.
```

## Final Recommendation

Implement `OX01 -> OX02 -> OX04 -> OX07 -> OX06 -> OX09 -> OX10` first.

That gives the best judge-visible lift:

```text
flat findings -> behavior graph
report-only blockers -> migration manifest
local proof -> generated adapter package
abstract cutover -> real PR or artifact
```

Only after that should we spend time on automatic target credential resolution, app-compatible generic DDL, fresh Aiven provisioning, or Kafka hardening.
