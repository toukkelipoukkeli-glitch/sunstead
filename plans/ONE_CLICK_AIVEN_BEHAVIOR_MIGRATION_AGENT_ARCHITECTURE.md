# One-Click Aiven Behavior Migration Agent Architecture

Date: 2026-06-25

Source inputs read:

- `plans/AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md`
- `migration-info/AGENTIC_DATABASE_MIGRATION_MARKET_SCAN.md`
- `migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Chosen track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: user grants repo/source/Aiven access -> clicks one button -> Aiden scans the Lovable/Supabase app -> creates or verifies an Aiven shadow data plane -> migrates representative Postgres data -> validates it -> maps browser-critical realtime behavior to Aiven Postgres `app_events` plus browser polling -> validates Aiven Kafka as the agent bus / production event path -> produces a scoped cutover package.
- Intentionally cut: production auth migration, production storage migration, full CDC, all source platforms, broad schema-conversion tooling, and a fully autonomous production cutover without review.

## Executive Take

The product should be **as close to one-click as possible**, but the one click must be honest.

The right promise:

> Give Aiden access once. Click Graduate. It builds an Aiven shadow data plane, moves the Aiven-native parts, proves the migration, rewrites the demo realtime path, and hands you the cutover package.

The wrong promise:

> Click once and a production Supabase app magically becomes a fully equivalent Aiven app.

That is not credible because Supabase includes platform behaviors Aiven Postgres does not replace directly: Auth, Storage, Realtime, Edge Functions, RLS auth context, and browser SDK semantics.

The market scan makes the trust point clear: credible agentic migration systems are not just LLM SQL translators. They combine deterministic scanning, dependency analysis, validated execution, repair loops, and proof packages. Aiden should be a **one-click operator with receipts**, not a chatbot and not an unbounded autonomous shell.

## Product Promise

```text
Before:
Lovable UI -> Supabase client -> Supabase Postgres/Auth/Storage/Realtime

After scoped migration:
Lovable UI -> Aiden generated backend adapter -> Aiven Postgres
                                              -> Aiven Postgres app_events for demo realtime

Agent/prod event path proof:
Aiden agents -> Aiven Kafka migration.events

Still explicit:
Auth: adapter required for production
Storage: object-store adapter required for production
RLS: review required if policies depend on Supabase Auth
```

The business framing:

> Lovable builds the app. Aiden graduates the data plane to Aiven when the app becomes a company.

## What "One-Click" Means

One-click does **not** mean no setup. It means the user only makes one product decision after granting access:

```text
Grant access -> Click Graduate -> Aiden runs the safe migration workflow
```

The required access grant is the setup step:

| Access | Needed for | Minimum scope |
| --- | --- | --- |
| GitHub repo or uploaded Lovable export | Scan source, generate adapter branch/patch | Read repo for analyze; write branch/PR only for cutover package |
| Supabase source database URL | Dump schema/data, inspect extensions, validate source counts | Read-only preferred for analysis; final dump access for migration |
| Supabase service role or admin access | Only if source metadata/Auth/Storage introspection is needed | Avoid for demo; request only when needed |
| Lovable Cloud export access | CSV/schema fallback if direct DB URL is unavailable | Export tables/files/config; no direct DB assumed |
| Aiven account/project access | Verify or create target Postgres/Kafka | Scoped Aiven token or MCP connection for selected project |
| Aiven Postgres connection | Restore data, write receipts, validate target | Target DB owner/admin for migration schema |
| Aiven Kafka access | Agent bus and production event-path proof | Topic create, produce, consume/list for `migration.events` |
| Optional auth provider credentials | Production auth replacement | Out of scope for demo; adapter plan only |
| Optional object store credentials | Production storage replacement | Out of scope for demo; adapter plan only |

In the UI, setup should look like a short "Connect Sources" screen, not a complex wizard:

```text
[x] GitHub connected
[x] Supabase source connected
[x] Aiven project connected
[x] Aiven Postgres ready
[x] Aiven Kafka ready
[ ] Auth adapter configured later
[ ] Storage adapter configured later

Primary button: Graduate To Aiven
```

## What The Agent Can Get On Its Own

After the user grants the initial connections, the agent should aggressively discover everything it can without asking more questions. This is what makes the product feel one-click.

### From the GitHub repo or Lovable export

The agent can discover:

- framework and package manager;
- `@supabase/supabase-js` dependency;
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and other env var names;
- table references from `supabase.from(...)`;
- Auth usage from `supabase.auth`;
- Storage usage from `supabase.storage`;
- Realtime usage from `supabase.channel(...)`;
- RPC usage from `supabase.rpc(...)`;
- Edge Function calls from `functions.invoke(...)`;
- SQL migrations under `supabase/migrations`;
- RLS policies, triggers, functions, indexes, extensions, and publication statements in SQL files;
- generated code locations that need adapter patches;
- whether the frontend currently talks directly to Supabase.

The user should not have to explain any of this manually.

### From the source Supabase database, if connected

The agent can discover:

- schemas, tables, columns, types, indexes, constraints, and row counts;
- installed extensions;
- functions, triggers, views, policies, and publications;
- approximate table sizes;
- sample rows if permitted;
- whether `auth`, `storage`, or `realtime` schemas are present;
- whether app tables reference `auth.users`;
- source-side smoke query results.

The agent can use this to decide whether to run a small dump/restore, use Aiven migration tooling, or fall back to a CSV-style path.

### From Aiven, once authorized

The agent can discover:

- available projects;
- existing Postgres and Kafka services;
- service status and connection details exposed through the authorized interface;
- available PostgreSQL extensions;
- existing Kafka topics;
- service logs, metrics, and query activity if permissions allow;
- live pricing or plan data if exposed through the Aiven APIs/tools;
- whether the target landing zone is already usable.

The agent should prefer **create or verify** behavior:

```text
If Aiven Postgres exists: verify it.
If Kafka topic exists: verify it.
If receipt table exists: reuse it.
If missing and allowed: create it.
```

### From deterministic migration tools

The agent can run or orchestrate:

- `supabase db dump`;
- `pg_dump`;
- `psql`;
- `pg_restore`;
- Aiven `aiven-db-migrate`;
- row-count checks;
- smoke queries;
- generated adapter tests;
- Kafka produce/consume or message-list checks.

The important product design point: the agent can choose the primitive, but the primitive does the actual database work.

## What The User Must Provide

Some things cannot be discovered safely. The user must provide or approve them.

### Absolutely required for a real migration

| Required input | Why it is necessary | Can the agent infer it? |
| --- | --- | --- |
| Source repo or Lovable export | The agent needs code and migrations to understand behavior | No |
| Source data access | The agent needs schema/data to migrate and validate | No |
| Aiven account/project authorization | The agent needs a target project to create/verify Postgres/Kafka | No |
| Aiven Postgres target or permission to create one | The agent needs a migration destination | Partially, if an existing service is visible |
| Permission to write to target Postgres | Needed for schema/data/receipt writes | No |
| Permission to create/use Kafka topics if Kafka proof is included | Needed for the agent-bus / production event-path proof | No |
| Cutover approval | Switching runtime paths can affect production users | No, must be explicit |

### Required only for specific features

| Feature | Required user input | Demo treatment |
| --- | --- | --- |
| Production Auth migration | Auth provider choice, OAuth/SMTP/JWT/session strategy, possibly admin credentials | Flag adapter-required |
| Production Storage migration | Object store destination and credentials | Flag adapter-required |
| Private files | Access policy decisions | Not migrated in demo |
| Final production cutover | Maintenance window, write-freeze approval, rollback owner | Demo cutover only |
| Domain/DNS changes | DNS provider access and approval | Cut |
| Billing-sensitive scaling | Budget approval | Cut or recommend only |
| Destructive cleanup | Explicit deletion approval | Never automatic |

### Things the user should not need to provide manually

If the relevant systems are connected, the user should not have to type:

- table names;
- row counts;
- schema descriptions;
- Supabase feature usage;
- Aiven service names if only one valid target exists;
- Kafka topic names for generated migration/demo topics;
- readiness score inputs;
- rollback checklist boilerplate.

The agent should derive those and show them for review.

## Permission UX

The setup screen should ask for access in business-language terms, not infrastructure jargon:

```text
1. Connect the app repo
   Needed so Aiden can find Supabase behavior and generate the adapter patch.

2. Connect the current backend
   Needed so Aiden can read schema/data and validate the source.

3. Connect Aiven
   Needed so Aiden can create or verify the Postgres/Kafka landing zone.

4. Choose migration mode
   Shadow migration now; production cutover requires separate approval.
```

The user-facing promise:

```text
We will not change production during the first click.
We will build and validate an Aiven shadow data plane.
We will ask again before production cutover.
```

## Permission Ladder

The agent should request the smallest useful permission first and escalate only when the workflow needs it.

| Stage | Permission level | What Aiden can do |
| --- | --- | --- |
| Analyze | Repo read + source DB read | Build behavior graph and estimate readiness |
| Shadow migrate | Target Postgres write + Kafka topic/write permissions | Create shadow schema, copy sample/full data, write receipts, prove event path |
| Generate cutover | Repo branch/PR write | Create backend adapter and frontend patch |
| Demo cutover | Local/demo env write | Run scoped app path on Aiven |
| Production cutover | Explicit final approval + production env write | Switch production runtime path |
| Cleanup | Explicit destructive approval | Drop shadow objects or retire source dependencies |

This ladder keeps the one-click product safe: most of the impressive work happens with read-only source access and isolated target writes.

## Migration Model

Aiden should run a deterministic state machine. Agents operate inside each state with bounded tools.

```text
0. Access Grant
1. Preflight Discovery
2. Behavior Graph
3. Aiven Shadow Plane
4. Schema/Data Migration
5. Behavior Adaptation
6. Validation And Repair
7. Scoped Cutover Package
8. Report And Next Actions
```

This gives the demo a one-click feel while keeping execution predictable.

## End-To-End Flow

### 0. Access Grant

User gives Aiden the minimum required rights.

Actions:

- connect repo;
- connect source Supabase or Lovable export;
- connect Aiven project;
- choose existing Aiven Postgres/Kafka or allow Aiden to create/verify them;
- confirm demo scope: migrate data + realtime path, flag auth/storage.

Agent role:

- **Access Broker Agent** checks whether each credential can perform the required action and records missing permissions.

Output:

```json
{
  "repo": "connected",
  "source_db": "connected",
  "aiven_project": "connected",
  "aiven_postgres": "ready",
  "aiven_kafka": "ready",
  "auth_adapter": "not_configured",
  "storage_adapter": "not_configured"
}
```

### 1. Preflight Discovery

This is read-only.

Actions:

- scan source files for `@supabase/supabase-js`;
- detect `supabase.from`, `supabase.auth`, `supabase.storage`, `supabase.channel`, `supabase.rpc`, and `functions.invoke`;
- read SQL migrations;
- inspect package manager and app framework;
- inspect source database metadata if available;
- detect Lovable Cloud fallback if direct database access is missing.

Agent role:

- **Discovery Agent** builds the source inventory.

Deterministic tools:

- repo scanner;
- SQL file parser;
- env var scanner;
- source DB metadata queries.

Output:

```text
Detected:
- Tables: posts, reactions
- Auth/user dependency: yes
- Target event bridge: app_events
- Supabase Auth: yes
- Supabase Storage: yes
- Supabase Realtime: yes
- RPC/function usage: yes
- RLS policies: yes
- pgvector: yes
```

### 2. Behavior Graph

This is where the product becomes behavior migration, not table copy.

Actions:

- classify each backend dependency;
- decide whether it is direct migrate, Aiven-native rewrite, adapter-required, review-required, or cut;
- score readiness before execution;
- build the migration task graph.

Agent role:

- **Behavior Analyst Agent** turns raw findings into a compatibility graph.

Output:

| Behavior | Classification | Target |
| --- | --- | --- |
| Tables/indexes/constraints | Direct migrate | Aiven Postgres |
| Functions/triggers | Direct migrate or review | Aiven Postgres |
| pgvector | Direct if extension available | Aiven Postgres |
| RLS using `auth.uid()` | Review required | Auth adapter/back-end authorization |
| Supabase Auth | Adapter required | v2 / production adapter |
| Supabase Storage | External replacement | object store adapter |
| Supabase Realtime | Rewrite | Demo: Aiven Postgres `app_events` + browser polling; production event path: Aiven Kafka |
| Supabase client `.from()` | Rewrite | backend API adapter |

### 3. Aiven Shadow Plane

This is the first visible Aiven proof.

Actions:

- list Aiven projects/services through MCP;
- verify existing Aiven Postgres and Kafka;
- check Postgres extension availability;
- create migration metadata tables;
- create Kafka topics if included;
- write the first receipt.

Agent role:

- **Aiven Architect Agent** chooses the target shape.
- **Aiven Operator Agent** executes safe Aiven MCP operations.

MCP/tool actions:

```text
aiven_project_list
aiven_service_list
aiven_service_get postgres
aiven_pg_service_available_extensions
aiven_pg_write migration_runs
aiven_pg_write mcp_receipts
aiven_kafka_topic_list
aiven_kafka_topic_create migration.events
```

Output:

```text
Aiven Shadow Plane
Postgres: ready
Kafka: ready
Receipts: recording
App runtime: unchanged
```

### 4. Schema/Data Migration

MCP should not be the bulk data pipe. The agent should orchestrate the correct migration primitive.

For demo:

- apply a small known schema or selected app schema;
- insert representative rows;
- validate counts through Aiven Postgres.

For real production:

- use `supabase db dump` or `pg_dump` for simple migrations;
- use Aiven `aiven-db-migrate` for PostgreSQL-to-Aiven PostgreSQL where possible;
- use logical replication or CDC if downtime must be reduced;
- use CSV import only as the Lovable Cloud fallback when direct DB access is unavailable.

Agent role:

- **Migration Operator Agent** chooses and runs the migration primitive.
- **Aiven Operator Agent** records receipts and target validation reads.

Execution matrix:

| Source access | Recommended execution |
| --- | --- |
| Owned Supabase DB URL, small app | `supabase db dump` -> `psql` restore into Aiven |
| Owned Supabase DB URL, larger app | Aiven `aiven-db-migrate` or logical replication |
| Lovable Cloud export only | Recreate schema from migrations, import CSVs/table exports |
| Hackathon demo | Seeded data path with visible row validation |

Output:

```text
posts        40/40 rows validated
reactions    60/60 rows validated
demo_users   12/12 rows validated
app_events    8/8 rows validated
```

### 5. Behavior Adaptation

This is where agents add value beyond migration tools.

Actions:

- generate backend API adapter for `.from()` reads/writes;
- generate a code diff that stops the frontend from using direct Supabase data calls;
- generate a realtime rewrite from `supabase.channel()` to the demo-safe Aiven Postgres `app_events` bridge;
- validate Aiven Kafka separately as the agent bus and production event-bus path;
- create auth and storage adapter plans without pretending they are finished;
- identify RLS policies that depend on Supabase auth context.

Agent role:

- **Compatibility Surgeon Agent** generates app changes and adapter code.

Concrete demo change:

```text
Old:
supabase.channel("total-hypes")

New:
poll("/api/events/recent")
  backed by Aiven Postgres table app_events

Production event path:
Aiden agents publish workflow/prod-path proof events to Aiven Kafka migration.events
```

The generated backend adapter owns the Aiven database connection:

```text
Browser -> /api/posts -> Aiven Postgres
Browser -> /api/events -> Aiven Postgres app_events
Agents  -> migration.events -> Aiven Kafka
```

This is mandatory. The Aiven Postgres URL must never go into `VITE_*` frontend variables.

### 6. Validation And Repair

The market scan says the credible category is validation plus repair, not one-shot translation.

Actions:

- compare source/target row counts;
- run smoke queries;
- verify extensions;
- validate generated API route against target data;
- produce and consume/list a Kafka agent-bus proof event;
- run frontend smoke test if available;
- capture errors;
- let agents patch generated SQL/adapter code within bounded limits;
- record unresolved blockers.

Agent role:

- **Validation Auditor Agent** runs checks and computes readiness.
- **Repair Agent** only patches generated artifacts or migration SQL inside a sandbox, never source production blindly.

Readiness score:

```text
Migration readiness: 82/100

+30 schema/data migrated
+14 behavior graph complete
+12 validation checks passed
+15 Aiven resources ready
+6 adapters generated
+5 rollback plan ready
-18 auth/storage remain external
```

### 7. Scoped Cutover Package

For the demo, this can be one-click after validation.

For production, this should be a final approval gate.

Actions:

- generate a PR or patch branch;
- update frontend to call the backend adapter;
- remove runtime use of `VITE_SUPABASE_URL` on the demo path;
- switch backend `DATABASE_URL` to Aiven Postgres;
- switch demo event path to the Aiven Postgres `app_events` bridge;
- keep Aiven Kafka live as the agent bus / production event-path proof;
- keep rollback instructions.

Agent role:

- **Cutover Manager Agent** builds the cutover plan and executes only the approved scope.

Demo cutover proof:

```text
Supabase dependency removed from demo runtime

Old path:
Lovable UI -> Supabase client -> Supabase Postgres/Realtime

New path:
Lovable UI -> Aiden backend adapter -> Aiven Postgres + Aiven Kafka
```

### 8. Report And Next Actions

Actions:

- produce final proof package;
- list migrated objects;
- list blocked/adapter-required features;
- show every Aiven MCP receipt;
- produce rollback plan;
- produce first CTO-agent recommendation.

Agent role:

- **Report Agent** makes the output legible to a founder, judge, or technical reviewer.
- **CTO Agent** turns validation/metrics into the next recommendation.

Output:

```text
Migration Complete For Demo Path

Tables shadowed: 4/4
Rows validated: 120/120
Demo realtime mapped: Supabase channel -> Aiven Postgres app_events -> browser polling
Kafka agent-bus roundtrip: passed
Aiven MCP actions: 12
Supabase runtime dependency: removed from demo path

Production blockers:
- Auth needs production adapter
- Storage needs production adapter
- RLS requires review

Rollback:
- Switch frontend/API target back to Supabase
- Keep source database untouched
- Drop Aiven shadow schema after rollback window
```

## Agent Roster

Use agents as specialists around a state machine. Do not let a free-form agent improvise the migration.

| Agent | Main job | Tools | Output |
| --- | --- | --- | --- |
| Orchestrator Agent | Own the run state, route work, enforce gates | state machine, receipt writer | run timeline |
| Access Broker Agent | Verify permissions and missing credentials | GitHub/Supabase/Aiven probes | access report |
| Discovery Agent | Scan repo and source database | repo scanner, SQL parser, metadata queries | source inventory |
| Behavior Analyst Agent | Classify dependencies | behavior rules, LLM reasoning | behavior graph |
| Aiven Architect Agent | Choose target Aiven shape | Aiven MCP, docs lookup | landing-zone plan |
| Migration Operator Agent | Execute data/schema movement | `supabase db dump`, `pg_dump`, `psql`, `aiven-db-migrate` | migrated target |
| Aiven Operator Agent | Perform Aiven MCP actions | Aiven MCP Postgres/Kafka tools | MCP receipts |
| Compatibility Surgeon Agent | Generate app/backend adapter changes | code scanner, patch generator, LLM | code diff/artifacts |
| Validation Auditor Agent | Prove migration quality | row counts, smoke queries, Kafka roundtrip | validation report |
| Repair Agent | Fix generated SQL/code after test failures | sandbox tests, bounded patches | repaired artifact |
| Cutover Manager Agent | Prepare/execute approved scoped cutover | PR/env switch/smoke test tools | cutover package |
| Report/CTO Agent | Summarize proof and next actions | receipts, metrics, validation data | final report |

## Where LLMs Help And Where They Should Not

Use LLMs for:

- explaining findings;
- classifying ambiguous behavior;
- generating adapter code;
- generating cutover/rollback plans;
- repairing generated SQL/code after compiler/runtime errors;
- turning receipts into a readable report.

Do not use LLMs for:

- raw secret handling;
- unbounded shell execution;
- direct production database mutation;
- silent cutover decisions;
- deciding to drop data;
- claiming validation without deterministic checks.

The robust architecture:

```text
Claude/agent SDK
  -> bounded typed tools
  -> deterministic migration engine
  -> Aiven MCP for control/proof
  -> Aiven Postgres/Kafka receipts
```

## Safety Gates

To keep the product one-click but responsible, classify actions by risk.

| Risk | Examples | Default behavior |
| --- | --- | --- |
| Read-only | scan repo, inspect schemas, count rows | automatic after access grant |
| Safe write | create shadow schema, receipt row, migration topic | automatic during one-click run |
| Reversible app change | create branch/PR, generate adapter file | automatic or one-click approved |
| Production-impacting | switch env, pause writes, final cutover | explicit approval gate |
| Destructive | drop source tables, delete services, delete storage | never automatic |

This makes the UI simple:

```text
[Graduate To Aiven]
Runs: read-only + safe shadow writes + validation + generated cutover package

[Commit Production Cutover]
Requires final human approval
```

For the hackathon, the second button is scoped to the demo runtime, not a real production app.

## Data Plane Design

### Aiven Postgres

Roles:

- target app data store;
- durable migration receipts;
- validation check store;
- CTO-agent memory source.

Tables:

- `migration_runs`
- `source_assets`
- `behavior_findings`
- `compatibility_findings`
- `migration_steps`
- `mcp_receipts`
- `validation_checks`
- `generated_artifacts`

### Aiven Kafka

Roles:

- agent coordination bus;
- migration/audit event rail;
- production event-bus proof.

Topics:

- `migration.events`
- `migration.audit`

## Minimum Demo Implementation

Build the smallest version that proves the product:

1. Connect to `demo/pulsewall`.
2. Scan actual source files and migrations.
3. Build behavior graph.
4. Verify Aiven Postgres and Kafka through MCP.
5. Create receipt tables in Aiven Postgres.
6. Apply/migrate representative data to Aiven Postgres.
7. Validate row counts and smoke query.
8. Create Kafka `migration.events` topic and roundtrip one agent-bus event.
9. Generate or show a real diff for the Postgres `app_events` realtime adapter.
10. Cut over the demo runtime to the backend adapter.
11. Produce final proof report.

Do not build:

- real Supabase Auth migration;
- real Storage transfer;
- full CDC;
- production outage coordination;
- multi-source migration;
- enterprise SSO;
- long-running job infrastructure.

## UI Shape

The UI should make the one-click operator visible:

```text
[ Existing App ]        [ Agent Timeline ]          [ Aiven Shadow Plane ]
 Lovable/Supabase        Access Broker  ok           Postgres ready
 still running           Discovery      ok           Kafka ready
                          Behavior Map   ok           Receipts writing
                          Aiven Operator ok
                          Migration      running
```

Primary button before run:

```text
Graduate To Aiven
```

Primary status during run:

```text
Building Aiven shadow data plane
Production app unchanged
```

Primary status after demo cutover:

```text
Supabase removed from demo runtime
Aiven Postgres runtime validated
Aiven Kafka agent bus validated
```

## Why This Wins Against Generic Migration Tools

The market scan says broad agentic migration is crowded and hard. Aiden should be narrower:

- one source story: Lovable/Supabase apps;
- one target story: Aiven Postgres for the scoped runtime plus Kafka for the agent bus / production event path;
- one visible workflow: shadow migrate, validate, rewrite realtime, cut over scoped runtime;
- one proof package: row counts, smoke queries, receipts, blockers, rollback.

The wedge is not "we migrate every database."

The wedge is:

> We turn the moment a Lovable app outgrows its starter backend into an Aiven migration lead, with an agent that proves the data plane before cutover.

## Build Recommendation

Implement the core as a deterministic migration orchestrator with agent specialists:

```text
apps/control-room
  UI for one-click run, timeline, behavior graph, receipts, report

apps/aiden-api
  Fastify API, run-event stream, state machine, credential probes

packages/migration-core
  repo scanner, behavior classifier, readiness scoring

packages/aiven-ops
  Aiven MCP wrappers, Postgres receipt writes, Kafka roundtrip

packages/compat-surgeon
  generated backend adapter and realtime rewrite diff
```

Do this before adding a complex autonomous framework:

1. deterministic state machine;
2. typed tools;
3. receipt ledger;
4. agent-generated explanations/diffs;
5. bounded repair loop.

That gives the product the right level of autonomy: one-click for the user, controlled execution underneath, and enough proof that Aiven judges can trust what happened.
