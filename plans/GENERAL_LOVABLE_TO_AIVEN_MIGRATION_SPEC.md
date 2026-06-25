# General Lovable/Supabase To Aiven Migration Plan And Spec

Date: 2026-06-25

Status: FIRST SLICE IMPLEMENTED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Current demo flow: `/setup` -> `/control` -> one visible `Graduate To Aiven` action -> behavior scan -> Aiven Postgres migration -> scoped runtime cutover -> Postgres `app_events` proof -> optional Kafka workflow slot -> Agent SDK report.
- Intentional hackathon cuts: GitHub OAuth, upload parsing, Lovable Cloud import, Aiven account creation, production Auth migration, production Storage migration, full CDC, production cutover, and broad arbitrary-app support.

## Purpose

This spec defines how Aiden becomes general beyond PulseWall without weakening the current demo.

The product claim should be:

```text
Aiden migrates the Postgres-backed runtime path of Lovable/Supabase apps to Aiven Postgres, detects behavior that cannot be safely auto-migrated, generates an adapter/cutover plan, validates the supported path, and produces an auditable proof package.
```

The product claim should not be:

```text
Aiden fully migrates every Lovable app, including production Auth, Storage, RLS, Edge Functions, and cutover, with no review.
```

## Current Truth

What works now:

- `/setup` makes source app, source data path, Aiven workspace, and migration scope visible.
- PulseWall is the selected demo source, not an invisible hardcode.
- The scanner reads real source files and detects Supabase tables, Realtime, Auth, Storage, RLS, Edge/RPC markers, triggers, and pgvector.
- The one-click route runs live against Aiven Postgres.
- The scoped runtime reads, writes, and reads back browser events through Aiven Postgres.
- The Anthropic Agent SDK is used as a bounded text-only Report/CTO Agent.

What is still PulseWall-specific:

- Live data migration creates and loads `demo_users`, `posts`, `reactions`, and `app_events`.
- The runtime adapter is a PulseWall provider, not a generated adapter for arbitrary source code.
- Generic source-data shadow copy is implemented for allowlisted source Postgres tables, but full DDL restore and generated app adapters are not implemented.
- Auth, Storage, RLS, Edge Functions, and RPC are detected/classified, not migrated as production systems.

Implemented first slice:

- shared `SetupProfile`, `SourceEvidence`, and related source/profile contract types;
- `RunSnapshot.setupProfile`;
- `POST /api/runs` accepts a setup profile;
- `/setup` stores the selected demo profile and `/control` submits it when creating the run;
- control-room header/source labels read from the run setup profile;
- generic `scanLovableSource({ sourceRoot, sourceLabel })`;
- `scanPulseWallSource()` remains as a compatibility wrapper;
- access preflight now requires source DB URL plus explicit table allowlist for non-seeded source data paths.
- generic source-data shadow copy for owned source Postgres projects when `SOURCE_SUPABASE_DB_URL` or `SOURCE_POSTGRES_URL` and `SOURCE_SUPABASE_TABLES` or `SOURCE_POSTGRES_TABLES` are configured;
- run-scoped Aiven shadow tables `source_table_profiles` and `source_table_rows`;
- generic source row-count validation against the explicit source table allowlist;
- generic product paths still block scoped demo cutover until adapter generation exists.

## Copy Rule

Do not use vague placeholder ETA labels in product UI or specs.

Use precise labels:

- `Selected demo path`
- `Product path`
- `Requires source access`
- `Requires review`
- `Out of hackathon scope`
- `Not requested for this run`

This matters because the setup screen is part of the product story. It should communicate scope and permissions, not a placeholder backlog.

## General Architecture

The generalized pipeline is:

```text
SetupProfile
  -> SourceWorkspace
  -> StaticScanner
  -> SupabaseDbIntrospector
  -> BehaviorClassifier
  -> MigrationManifest
  -> AivenExecutionPlan
  -> AivenExecutor
  -> AdapterPlan
  -> ValidationReport
  -> AgentReport
```

PulseWall becomes one fixture profile inside this pipeline.

## Source Profiles

Support these source kinds as typed profiles:

| Source kind | Input | General migration use | Hackathon state |
| --- | --- | --- | --- |
| `pulsewall_demo` | local `demo/pulsewall` | Fixture and regression target | selected demo path |
| `local_lovable_export` | local folder path | Scan exported code and migrations | product path |
| `github_repo` | repo URL or checked-out folder | Scan source and create adapter branch | product path |
| `owned_supabase_project` | source DB URL or dump plus repo | Full schema/data migration path | product path |
| `lovable_cloud_export` | code export plus CSV/table files | Recreate supported schema/data from artifacts | product path |

The setup profile should be stored with the run. The control room should show the selected source and workspace labels from this profile.

## User Inputs

The agent can infer:

- framework and package manager;
- Supabase client usage;
- table names referenced in code;
- query shapes and common CRUD operations;
- Realtime channels and publication references;
- Storage buckets;
- Auth/RLS usage;
- Edge Function and RPC references;
- migration blockers;
- adapter route candidates;
- validation plan;
- report language.

The user must provide:

- source repo/export access;
- source Supabase DB URL, dump files, or CSV/table exports for real data migration;
- Aiven workspace authorization;
- permission to write target schema/data;
- target region/service choice, or permission for Aiden to choose defaults;
- explicit production cutover approval;
- Auth/Storage replacement decisions for production;
- private env vars required to run the app.

## Core Data Contracts

Add a durable setup/profile contract:

```ts
type SourceKind =
  | "pulsewall_demo"
  | "local_lovable_export"
  | "github_repo"
  | "owned_supabase_project"
  | "lovable_cloud_export"

type SourceDataPath =
  | "seeded_demo_data"
  | "supabase_db_url"
  | "pg_dump_files"
  | "csv_export"

type MigrationScope = {
  shadowMigration: boolean
  scopedDemoCutover: boolean
  productionCutover: "not_requested" | "approval_required" | "approved"
  authMigration: "out_of_scope" | "adapter_required" | "configured"
  storageMigration: "out_of_scope" | "adapter_required" | "configured"
}

type SetupProfile = {
  sourceKind: SourceKind
  sourceDataPath: SourceDataPath
  sourceLabel: string
  sourceRoot?: string
  workspaceLabel: string
  migrationScope: MigrationScope
}
```

Add a source evidence contract:

```ts
type SourceEvidence = {
  sourceRoot: string
  filesScanned: number
  packageManagers: string[]
  frameworks: string[]
  supabase: {
    clientRefs: SourceRef[]
    envRefs: SourceRef[]
    tableRefs: Record<string, SourceRef[]>
    realtimeRefs: Record<string, SourceRef[]>
    authRefs: SourceRef[]
    storageRefs: Record<string, SourceRef[]>
    rpcRefs: Record<string, SourceRef[]>
    edgeFunctionRefs: Record<string, SourceRef[]>
  }
  migrations: {
    files: string[]
    tables: string[]
    functions: string[]
    triggers: string[]
    rlsTables: string[]
    extensions: string[]
  }
}
```

Add a migration manifest contract:

```ts
type MigrationManifest = {
  runId: string
  source: SetupProfile
  evidence: SourceEvidence
  directMigrate: {
    schemas: string[]
    tables: TablePlan[]
    indexes: IndexPlan[]
    constraints: ConstraintPlan[]
    extensions: ExtensionPlan[]
  }
  rewrite: {
    realtime: RealtimeRewritePlan[]
    rpc: AdapterRoutePlan[]
    edgeFunctions: AdapterRoutePlan[]
  }
  blockers: MigrationBlocker[]
  validation: ValidationPlan
}
```

The manifest is the handoff between scanner, agents, executor, UI, and report. Do not let UI components or executor code infer migration state from loose strings.

## Classification Rules

| Behavior | Class | Default handling |
| --- | --- | --- |
| public tables | `direct_migrate` | create target schema and copy rows |
| indexes and constraints | `direct_migrate` | apply after table creation/data load as needed |
| compatible extensions | `direct_migrate` | verify availability on Aiven before restore |
| simple SQL functions/triggers | `review_required` then `direct_migrate` if safe | apply only after parse/restore validation |
| Supabase Realtime | `rewrite` | generate `app_events` polling/SSE path; Kafka optional |
| frontend `.from(...)` calls | `adapter_required` | generate backend route candidates |
| Supabase Auth | `adapter_required` | production blocker unless replacement is configured |
| Supabase Storage | `adapter_required` | production blocker unless object-store path is configured |
| RLS using `auth.uid()` or Supabase roles | `review_required` | do not claim production authorization is migrated |
| Edge Functions | `rewrite` | generate backend worker/API plan |
| RPC calls | `adapter_required` | map to backend route or mark review required |
| unknown external services | `unsupported` | report and block production cutover |

## Implementation Plan

### G00: Remove PulseWall As The Generic Type Name

Status: IMPLEMENTED FOR SCANNER API

Rename generic scanner concepts from `PulseWall` to `LovableSource` while keeping PulseWall labels for the demo fixture.

Acceptance:

- `scanLovableSource({ sourceRoot })` exists.
- `scanPulseWallSource()` remains as a wrapper for the demo path.
- UI and docs still say PulseWall when describing the selected demo source.

### G01: Persist SetupProfile

Status: PARTIAL IMPLEMENTED

Move setup profile from browser-only session storage into run state.

Acceptance:

- `POST /api/runs` can accept a setup profile.
- `RunSnapshot` includes `setupProfile`.
- `/control` shows selected source/workspace from the run, not hardcoded copy.

### G02: General Static Scanner

Status: PARTIAL IMPLEMENTED

Make the scanner operate on any local source root.

Acceptance:

- Scans `.js`, `.jsx`, `.ts`, `.tsx`, `.sql`, `.json`, and `.md`.
- Detects Supabase client usage, env refs, table refs, Realtime, Auth, Storage, RPC, Edge Functions, RLS, triggers, extensions, and pgvector.
- Emits `SourceEvidence` with source refs.
- PulseWall scanner output remains stable.

### G03: Source Database Introspector

Status: PARTIAL IMPLEMENTED

Add optional source DB introspection for owned Supabase projects.

Acceptance:

- Reads source Postgres metadata from `SOURCE_SUPABASE_DB_URL` or a local dump path.
- Captures schemas, tables, columns, indexes, constraints, functions, triggers, extensions, RLS policies, publications, and row counts.
- Redacts source URLs and credentials in logs/artifacts.
- Falls back to static scanner when source DB access is absent.

Current implementation captures allowlisted table columns and row counts for the generic shadow-copy path. Full indexes, constraints, functions, triggers, RLS policies, publications, and dump-file parsing remain to be implemented.

### G04: MigrationManifest Builder

Combine static evidence and DB evidence into one manifest.

Acceptance:

- Produces `directMigrate`, `rewrite`, `blockers`, and `validation` sections.
- Marks Auth, Storage, and RLS truthfully.
- No executor step runs without a manifest.
- The final report reads from the manifest.

### G05: Generic Aiven Executor For Table/Data Path

Status: PARTIAL IMPLEMENTED

Implement the first real general migration executor for supported tables.

Acceptance:

- Creates target schemas/tables from source metadata or dump SQL.
- Copies rows using `COPY`, `pg_dump`/`pg_restore`, or SQL inserts depending on source path.
- Validates row counts per table.
- Writes Aiven action receipts and validation checks.
- Never exposes target credentials to browser code.

Current implementation copies allowlisted source table rows into run-scoped Aiven JSONB shadow tables:

```text
source_table_profiles
source_table_rows
```

This proves source row access, Aiven write access, and count validation without claiming app-compatible target DDL or adapter generation. Full target DDL restore and app-compatible generated tables remain future work.

### G06: Realtime Rewrite Plan

Generalize the PulseWall `app_events` bridge.

Acceptance:

- For each detected Realtime table, creates an `app_events` plan.
- Generates a polling endpoint contract.
- Inserts at least one synthetic validation event for the scoped runtime.
- Keeps Kafka as an optional production/agent-bus proof slot.

### G07: AdapterPlan And Route Generation

Generate an adapter plan from detected frontend Supabase usage.

Acceptance:

- Groups `.from(table)` usage into route candidates.
- Classifies reads, inserts, updates, deletes, and custom query shapes.
- Generates TypeScript route stubs for simple CRUD.
- Marks complex query chains, RPC, Auth, and Storage as adapter-required or review-required.

### G08: Validation And Report

Make validation table-driven from the manifest.

Acceptance:

- Row-count validations are generated for every migrated table.
- Smoke queries are generated from detected read paths.
- Realtime validation is generated from the rewrite plan.
- Agent SDK report uses sanitized manifest facts and does not invent production readiness.

### G09: Fixture Matrix

Add a small set of source fixtures that prove generality.

Acceptance:

- `fixtures/simple-crud`: tables only; should fully migrate.
- `fixtures/crud-realtime`: tables plus Realtime; should migrate and rewrite events.
- `fixtures/auth-rls`: Auth/RLS; should migrate supported data but block production cutover.
- `fixtures/storage-edge-rpc`: Storage, Edge, RPC; should classify and produce adapter plan.
- `demo/pulsewall`: remains the stage fixture and regression target.

## Test Plan

Run these gates after each generalization milestone:

```text
npm run typecheck
npm exec --workspace @aiden/control-room vite -- build
npm run demo:preflight
API_BASE_URL=http://127.0.0.1:8787 npm run verify:live -- --one-click
```

Add generalized scanner tests:

```text
scan fixture simple-crud -> expected manifest
scan fixture crud-realtime -> expected realtime rewrite
scan fixture auth-rls -> expected blockers
scan fixture storage-edge-rpc -> expected adapter plan
scan demo/pulsewall -> current behavior preserved
```

Add live migration tests only for fixtures that should execute against Aiven Postgres. Do not require live Kafka for the general migration gate unless Kafka credentials are explicitly configured.

## Demo Integration

The current `/setup` screen should remain the first screen.

For hackathon judging:

- selected source: PulseWall demo app;
- selected data path: seeded demo data;
- selected workspace: Henri pre-connected workspace;
- selected scope: shadow migration plus scoped demo cutover;
- product paths remain visible but not active for the live demo.

For product evolution:

- choosing a source profile creates a `SetupProfile`;
- source scan produces `SourceEvidence`;
- manifest builder produces a migration plan;
- `Graduate To Aiven` executes supported parts and reports blockers.

## Agent Responsibilities

Deterministic code owns:

- file scanning;
- DB introspection;
- DDL/data execution;
- validation;
- provider cutover;
- receipt creation.

Agents own:

- summarizing behavior;
- grouping blockers;
- explaining why Auth/Storage/RLS need review;
- drafting adapter plans;
- generating report copy;
- suggesting next implementation steps.

Agents must not own:

- arbitrary shell execution;
- unreviewed destructive SQL;
- credential discovery;
- production cutover approval;
- claims about unsupported platform features.

## Migration Readiness Levels

Use these readiness labels:

| Level | Meaning |
| --- | --- |
| `demo_ready` | Scoped demo runtime works against Aiven Postgres |
| `data_plane_ready` | Tables/data validated in Aiven Postgres |
| `adapter_plan_ready` | Backend route plan generated for frontend Supabase calls |
| `review_required` | RLS/Auth/Storage/Edge/RPC need human decision |
| `production_cutover_blocked` | Production switch is not safe yet |

These labels are better than broad pass/fail language because real migrations are partial until behavior and authorization are addressed.

## Cut Lines

For the hackathon:

- Do not build GitHub OAuth.
- Do not build file upload parsing.
- Do not build Aiven account creation.
- Do not build production Auth or Storage migration.
- Do not build full CDC.
- Do not claim arbitrary Lovable production migration.

For the product:

- Build table/data migration first.
- Build adapter generation second.
- Build Auth/Storage/RLS replacement workflows only after the core data plane is reliable.

## Success Criteria

Aiden is meaningfully general when:

- PulseWall is one fixture, not the only schema the executor understands.
- A user can point Aiden at a local Lovable/Supabase export and receive a manifest.
- An owned Supabase project with source DB access can migrate supported tables/data to Aiven Postgres.
- The UI shows what migrated, what was rewritten, and what remains blocked.
- The one-click path still protects the stage demo and remains honest about scope.
