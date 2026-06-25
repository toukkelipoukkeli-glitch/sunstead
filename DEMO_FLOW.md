# Aiden Demo Flow

Date: 2026-06-25

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Chosen track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: existing Lovable/Supabase app stays live -> Aiden inspects backend behavior -> creates an Aiven shadow data plane through MCP -> migrates and validates a small data slice -> maps realtime behavior to Kafka -> commits a controlled demo cutover -> the happy-path app runs without Supabase.
- Intentionally cut: production-grade auth migration, production-grade storage migration, full CDC, every source platform, and a complex agent framework.

## Product Shape

Build a local web app, not a landing page, not a CLI, and not a chat app.

Product name:

> **Aiden Migration Control Room**

Demo promise:

> This Lovable/Supabase app is still running. Aiden builds a safe Aiven shadow data plane, validates it, then cuts over the demo runtime so Supabase is gone.

The judge should understand this in 10 seconds:

> First prove the Aiven data plane beside production. Then switch the demo app to Aiven and delete the Supabase dependency.

## Main Screen

One browser dashboard with three zones:

```text
[ Existing App ]        [ Agent Migration Timeline ]        [ Aiven Shadow Plane ]
 Lovable/Supabase        scan -> classify -> migrate          Postgres + Kafka
 still running           validate -> report                   receipts + events
```

Big status headline before cutover:

```text
Shadow migration ready
App runtime unchanged. Aiven data plane validated.
```

Big status headline after cutover:

```text
Supabase removed
App runtime: Lovable UI -> Aiven backend glue -> Aiven Postgres/Kafka
```

The UI should feel like a serious migration control room. Chat can exist later; it is not the main product.

## Live Demo Script

### 1. Show The Existing App

Open PulseWall, the source Lovable/Supabase-style app.

Presenter line:

> This is the app. It still runs where it was built. We are not breaking production.

Show normal product behavior: posts, reactions, live leaderboard, or task/order updates.

### 2. Open Aiden Control Room

Switch to the Aiden tab.

Top of screen:

```text
Aiden Migration Control Room
Source: Lovable/Supabase app
Target: Aiven shadow data plane
Status: App runtime unchanged
```

Primary button:

```text
Analyze App
```

### 3. Analyze App

Click `Analyze App`.

The timeline shows:

```text
Repo Scanner Agent       completed
Behavior Mapper Agent    completed
Aiven Operator Agent     waiting
Migration Auditor Agent  waiting
```

The behavior map appears:

| Behavior | Detected | Migration path |
| --- | --- | --- |
| Tables | yes | Aiven Postgres |
| Customer/app data | yes | Shadow and validate |
| Supabase Realtime | yes | Aiven Kafka outbox |
| Supabase Auth | yes | Production adapter; bypassed in demo path |
| File Storage | yes | Production adapter; static/external URLs in demo path |
| RLS policies | yes | Review before cutover |
| Edge/RPC logic | optional | Generate adapter plan |

Presenter line:

> Aiden is not just listing tables. It is finding the backend behaviors this app depends on.

### 4. Create Aiven Shadow Plane

Click `Create Aiven Shadow Plane`.

Visible MCP receipts stream in:

```text
aiven_project_list                         ok
aiven_service_list                         ok
aiven_service_get postgres                 ok
aiven_service_get kafka                    ok
aiven_pg_write migration_receipts          ok
aiven_kafka_topic_create migration.events  ok
aiven_kafka_topic_create app.outbox.posts  ok
```

Right-side status:

```text
Aiven Shadow Plane
Postgres: ready
Kafka: ready
Receipts: recording
App runtime: unchanged
```

Presenter line:

> The Aiven MCP is the control plane. Every action leaves a receipt with risk and rollback.

### 5. Run Shadow Migration

Click `Run Shadow Migration`.

Keep the migration small and visual:

```text
posts        40/40 rows validated
reactions    60/60 rows validated
profiles     12/12 rows validated
events        8/8 rows validated
```

Show validation:

```text
App still live: yes
Source unchanged: yes
Aiven shadow copy: valid
Smoke query: passed
Receipt rows: written
```

Presenter line:

> We are not claiming a risky one-click cutover. We are proving the Aiven shadow plane is ready.

### 6. Validate Realtime Rewrite

This is the hero technical beat.

UI card:

```text
Supabase Realtime detected:
supabase.channel("posts")

Mapped to:
Aiven Kafka topic: app.outbox.posts
```

Then show a real Kafka roundtrip:

```json
{
  "event": "post.reaction_added",
  "source_behavior": "supabase_realtime",
  "target": "aiven_kafka",
  "topic": "app.outbox.posts",
  "status": "shadow_validated"
}
```

Receipt timeline:

```text
aiven_kafka_topic_create app.outbox.posts       ok
aiven_kafka_topic_message_produce               ok
aiven_kafka_topic_message_list                  ok
validation.check.passed kafka_event_roundtrip   ok
```

Presenter line:

> This is the migration that matters: the agent understood a realtime behavior and proved the Aiven Kafka replacement path is alive.

### 7. Commit Demo Cutover

Click `Commit Demo Cutover`.

This is the final proof beat. The cutover is intentionally scoped to the demo happy path:

- data reads/writes use Aiven Postgres;
- realtime/activity updates use Aiven Kafka through the generated adapter;
- backend glue runs as an Aiven App if access works, or as the same generated adapter in the fallback demo;
- Supabase Auth and Storage are not migrated as production systems; the demo path uses a seeded/local user and external/static image URLs.

UI card:

```text
Supabase dependency removed from demo runtime

Old path:
Lovable UI -> Supabase client -> Supabase Postgres/Realtime

New path:
Lovable UI -> Aiven backend glue -> Aiven Postgres + Aiven Kafka
```

Verification:

```text
VITE_SUPABASE_URL: removed
@supabase/supabase-js runtime path: unused
App reads from Aiven Postgres: passed
App realtime event from Kafka: passed
Smoke test after cutover: passed
```

Presenter line:

> We did not just produce a plan. For this scoped app path, Supabase is gone and Aiven is running the data plane.

### 8. Final Report

End on one clean report screen:

```text
Migration Complete For Demo Path

Readiness before cutover: 82%
Demo cutover: passed
Supabase runtime dependency: removed
Tables shadowed: 4/4
Rows validated: 120/120
Realtime mapped: Supabase channel -> Aiven Kafka
Kafka event roundtrip: passed
Aiven MCP actions: 12
Kafka events: 9

Production blockers:
- Auth needs production adapter
- Storage needs production adapter
- RLS requires review

Rollback:
- Switch env back to Supabase
- Drop shadow schema
- Delete migration topics
```

Final line:

> Lovable builds the app. Aiven runs the data plane when it becomes a company.

## Action Flow

| Step | User action | Agent action | Aiven/MCP action | UI proof |
| --- | --- | --- | --- | --- |
| 0 | Preload demo | Seed source app and known fixture repo | Aiven project/services ready or pre-created | Source app has visible data |
| 1 | Open PulseWall | None | None | Existing app works |
| 2 | Open Aiden | Load migration run shell | None | Source/target/status header |
| 3 | Click `Analyze App` | Scanner reads source files and SQL fixtures | Optional receipt write | Behavior map appears |
| 4 | Continue analysis | Behavior Mapper classifies dependencies | Optional docs/service lookup | Tables/realtime/auth/storage/RLS statuses |
| 5 | Click `Create Aiven Shadow Plane` | Aiven Operator creates/verifies target resources | Project/service list, Postgres receipt table, Kafka topics | Shadow plane marked ready |
| 6 | Click `Run Shadow Migration` | Migration Operator applies schema/sample rows | Postgres writes and validation reads | Row counts and smoke query pass |
| 7 | Click `Validate Realtime Rewrite` | Compatibility Surgeon maps channel to Kafka outbox | Kafka topic create, message produce, message list/read | Kafka roundtrip passes |
| 8 | Click `Commit Demo Cutover` | Compatibility Surgeon rewires the happy-path runtime to the generated Aiven adapter | Aiven App deploy if access works; otherwise same adapter fallback | Supabase env/client removed from demo runtime |
| 9 | Generate report | Validation Auditor scores readiness, cutover result, and production blockers | Receipt rows written to Postgres, migration events to Kafka | Final proof package |

## What To Build

Minimum MVP:

1. Local web dashboard.
2. PulseWall source app or source fixture with Supabase-style code.
3. Deterministic behavior scanner for:
   - `supabase.auth`
   - `supabase.storage`
   - `supabase.channel`
   - `.from(...)`
   - `.rpc(...)`
4. Behavior map with clear migration paths.
5. Aiven MCP receipt timeline with tool name, status, risk, and rollback.
6. Tiny data migration for 2-4 seeded tables.
7. Aiven Postgres receipt writes and validation reads.
8. Aiven Kafka topic creation plus produce/read roundtrip.
9. Controlled demo cutover that removes the Supabase runtime path for the happy path.
10. Final readiness/cutover report.

## Real vs Generated

Must be real:

- Source scanner over actual files or fixtures.
- Behavior classification output.
- Aiven MCP receipts for Postgres and Kafka actions.
- Row-count validation against the target.
- Kafka event produce/read roundtrip.
- Final demo app smoke test against the Aiven-backed runtime path.

Can be generated/planned:

- Auth migration.
- Storage adapter.
- RLS review.
- Full production cutover.
- Aiven Apps deployment fallback only if access is blocked; the generated adapter path must still be demonstrable.

## Cut List

Do not build:

- login system;
- real production cutover beyond the scoped demo path;
- storage transfer;
- auth migration;
- multi-source migration;
- full CDC;
- deployment pipeline;
- complex agent orchestration framework;
- perfect database migration.

The demo wins if it feels like:

> A serious autonomous migration operator built a safe Aiven shadow plane, proved it, and then removed Supabase from the scoped demo runtime.

## Alignment Notes

This follows the hackathon playbook:

- **Sponsor-needs first:** the story is explicitly how Aiven captures successful Lovable/Supabase apps when they become real startups.
- **One polished flow:** analyze -> shadow -> validate -> realtime rewrite -> cutover -> report.
- **Visible sponsor tech:** Aiven MCP receipts, Aiven Postgres validation, and Aiven Kafka roundtrip are all on screen.
- **Demo over architecture:** the build is a local browser control room with seeded data and a stable happy path, not a broad migration platform.
- **Honest cuts:** production auth/storage migration, full CDC, and multi-source support are named as out of scope.

This follows `plans/AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md`:

- It treats migration as **behavior migration**, not just table copy.
- It uses MCP as the **control plane and proof layer**, not the bulk data pipe.
- It keeps the strongest behavior rewrite as the hero: **Supabase Realtime -> Aiven Kafka**.
- It records receipts in Postgres and events in Kafka so autonomous actions are inspectable.
- It is honest about platform gaps while still showing a full Supabase deletion for the scoped demo runtime.
