# Aiden Demo Flow

Date: 2026-06-25

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Chosen track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: existing Lovable/Supabase app stays live -> user clicks one `Graduate To Aiven` button after access is connected -> Aiden inspects backend behavior -> creates an Aiven shadow data plane through MCP -> migrates and validates a small data slice -> maps realtime behavior to a demo-safe Aiven Postgres events table + browser event bridge -> validates Aiven Kafka as the production agent/event bus -> commits a controlled demo cutover -> the happy-path app runs without Supabase.
- Intentionally cut: production-grade auth migration, production-grade storage migration, full CDC, every source platform, and a complex agent framework.

## Product Shape

Build a local web app, not a landing page, not a CLI, and not a chat app.

Product name:

> **Aiden Migration Control Room**

Demo promise:

> This Lovable/Supabase app is still running. After access is connected, Aiden turns one click into a safe Aiven shadow migration, validates it, then cuts over the demo runtime so Supabase is gone.

The judge should understand this in 10 seconds:

> First prove the Aiven data plane beside production. Then switch the demo app to Aiven and delete the Supabase dependency.

## Main Screen

One browser dashboard with three zones:

```text
[ Existing App ]        [ Agent Migration Timeline ]        [ Aiven Shadow Plane ]
 Lovable/Supabase        access -> scan -> classify           Postgres + Kafka
 still running           migrate -> validate -> report        receipts + events
```

Add a fourth visible panel for the agent coordination layer:

```text
[ Aiven Kafka Agent Bus ]
 access.connected
 behavior.scan.completed
 aiven.shadow_plane.ready
 migration.rows.validated
 realtime.kafka_roundtrip.passed
 cutover.demo_runtime.ready
```

This makes the multi-agent workflow visible through Aiven Kafka, not just implied in the backend.

Big status headline before cutover:

```text
Shadow migration ready
App runtime unchanged. Aiven data plane validated.
```

Big status headline after cutover:

```text
Supabase removed
App runtime: Lovable UI -> local Aiden adapter -> Aiven Postgres events
Agent bus: Aiven Kafka
```

The UI should feel like a serious migration control room. Chat can exist later; it is not the main product.

## Live Demo Script

### 1. Cold Open: Show The Outcome

Start on the completed Aiden report screen.

```text
Migrated demo path running
Data: Aiven Postgres
Realtime: Aiven Postgres events -> browser polling
Agent bus: Aiven Kafka
Production app unchanged
Auth/Storage: production adapters required
```

Presenter line:

> This Lovable app now has a validated Aiven-backed runtime path. The original production app is still untouched. Now I will show the one click that got us here.

Then reset or switch to the start of the run.

### 2. Show The Existing App

Open PulseWall, the source Lovable/Supabase-style app.

Presenter line:

> This is the app. It still runs where it was built. We are not breaking production.

Show normal product behavior: posts, reactions, live leaderboard, or task/order updates.

### 3. Open Aiden Control Room

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
Graduate To Aiven
```

Connection checklist:

```text
[x] App repo connected
[x] Supabase source connected
[x] Aiven project connected
[x] Aiven Postgres ready
[x] Aiven Kafka ready
[ ] Auth adapter configured later
[ ] Storage adapter configured later
```

Presenter line:

> The setup is the access grant. The product action is one click: graduate this app to an Aiven shadow data plane.

### 4. Graduate To Aiven

Click `Graduate To Aiven`.

The user sees one product action. Internally, the demo can still expose manual step controls for reliability, but the visible product flow should feel like one autonomous operator run:

```text
Analyze app
  -> create Aiven shadow plane
  -> run shadow migration
  -> validate realtime rewrite
  -> commit demo cutover
  -> produce proof package
```

The timeline shows:

```text
Access Broker Agent      completed
Repo Scanner Agent       running
Behavior Mapper Agent    waiting
Aiven Operator Agent     waiting
Migration Auditor Agent  waiting
```

The Kafka agent bus panel starts filling with coordination events:

```text
access.connected
repo.scan.started
behavior.map.pending
```

The behavior map appears:

| Behavior | Detected | Migration path |
| --- | --- | --- |
| Tables | yes | Aiven Postgres |
| Customer/app data | yes | Shadow and validate |
| Supabase Realtime | yes | Demo: Aiven Postgres events -> browser polling; production event bus validated with Kafka |
| Supabase Auth | yes | Production adapter; bypassed in demo path |
| File Storage | yes | Production adapter; static/external URLs in demo path |
| RLS policies | yes | Review before cutover |
| Edge/RPC logic | optional | Generate adapter plan |

Presenter line:

> Aiden is not just listing tables. It is finding the backend behaviors this app depends on.

### 5. Aiven Shadow Plane Appears

This starts automatically after analysis in the visible flow.

Visible MCP receipts stream in:

```text
aiven_project_list                         ok
aiven_service_list                         ok
aiven_service_get postgres                 ok
aiven_service_get kafka                    ok
aiven_pg_write migration_receipts          ok
aiven_kafka_topic_create migration.events  ok
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

Kafka agent bus:

```text
behavior.scan.completed
aiven.shadow_plane.ready
```

### 6. Run Shadow Migration

This starts automatically after the Aiven shadow plane is ready.

Keep the migration small and visual:

```text
posts        40/40 rows validated
reactions    60/60 rows validated
demo_users   12/12 rows validated
app_events    8/8 rows validated
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

> The first click does not break production. It proves the Aiven data plane beside it.

Kafka agent bus:

```text
migration.rows.validated
validation.smoke_query.passed
```

### 7. Validate Realtime Rewrite

This is the hero technical beat.

UI card:

```text
Supabase Realtime detected:
supabase.channel("posts")

Demo-safe path:
Aiven Postgres table: app_events
Browser bridge: /api/events/recent via polling

Production event path validated:
Aiven Kafka topic: migration.events
```

Then show a real Postgres event insert and browser delivery, plus a Kafka agent-bus proof:

```json
{
  "event": "post.reaction_added",
  "source_behavior": "supabase_realtime",
  "demo_target": "aiven_postgres.app_events",
  "production_event_bus_proof": "aiven_kafka.migration.events",
  "browser_bridge": "polling",
  "status": "shadow_validated"
}
```

Receipt timeline:

```text
aiven_pg_write app_events                         ok
aiven_pg_read app_events_recent                   ok
adapter.polling_bridge.delivery                  ok
aiven_kafka_topic_create migration.events         ok
aiven_kafka_topic_message_produce                 ok
aiven_kafka_topic_message_list                    ok
validation.check.passed kafka_agent_bus_roundtrip ok
```

Presenter line:

> This is the migration that matters: the agent understood a realtime behavior, made the browser-critical path reliable with Aiven Postgres events, and validated Aiven Kafka as the production event bus.

Kafka agent bus:

```text
realtime.postgres_events_bridge.passed
kafka.agent_bus_roundtrip.passed
```

### 8. Commit Demo Cutover

This starts automatically after validation passes. In the live demo, keep a hidden/manual override so the presenter can pause before the final proof beat if needed.

This is the final proof beat. The cutover is intentionally scoped to the demo happy path:

- data reads/writes use Aiven Postgres;
- realtime/activity updates use Aiven Postgres `app_events` through the generated polling adapter;
- Aiven Kafka stays live as the agent bus and production event-bus proof;
- backend glue runs locally in the Aiden/demo app for this hackathon because Aiven Apps access is not enabled;
- Supabase Auth and Storage are not migrated as production systems; the demo path uses a seeded/local user and external/static image URLs.

UI card:

```text
Supabase dependency removed from demo runtime

Old path:
Lovable UI -> Supabase client -> Supabase Postgres/Realtime

New path:
Lovable UI -> local Aiden adapter -> Aiven Postgres + app_events
Agent bus/prod event proof -> Aiven Kafka migration.events
```

Verification:

```text
VITE_SUPABASE_URL: removed
@supabase/supabase-js runtime path: unused
App reads from Aiven Postgres: passed
Postgres event delivered to browser by polling: passed
Aiven Kafka agent-bus roundtrip: passed
Smoke test after cutover: passed
```

Presenter line:

> We did not just produce a plan. For this scoped demo path, Supabase is gone and Aiven is running the data plane.

Kafka agent bus:

```text
cutover.demo_runtime.ready
proof.package.generated
```

### 9. Final Report

End on one clean report screen:

```text
Migration Complete For Demo Path

Readiness before cutover: 82%
Demo cutover: passed
Supabase runtime dependency: removed from scoped demo path
Tables shadowed: 4/4
Rows validated: 120/120
Demo realtime mapped: Supabase channel -> Aiven Postgres app_events -> browser polling
Production event path validated: Aiven Kafka migration.events
Postgres event -> browser polling delivery: passed
Aiven Kafka agent bus events: 7
Aiven MCP actions: 12
Kafka events: 9
Cost card: Supabase $X/mo -> Aiven $Y/mo
CTO recommendation: add pooling before the next traffic spike

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
| 1 | Cold open | Load completed proof screen | None | Judges see the outcome first |
| 2 | Open PulseWall | None | None | Existing app works |
| 3 | Open Aiden | Load migration run shell | None | Source/target/status header |
| 4 | Click `Graduate To Aiven` | Access Broker, Scanner, and Behavior Mapper run | Optional receipt write, Kafka agent-bus events | Behavior map appears |
| 5 | Automatic | Aiven Operator creates/verifies target resources | Project/service list, Postgres receipt table, Kafka topics | Shadow plane marked ready |
| 6 | Automatic | Migration Operator applies schema/sample rows | Postgres writes and validation reads, Kafka agent-bus events | Row counts and smoke query pass |
| 7 | Automatic | Compatibility Surgeon maps channel to Postgres events + browser bridge and validates Kafka agent bus | Postgres event write/read, Kafka topic create, message produce/list | Postgres event polling delivery and Kafka agent-bus roundtrip pass |
| 8 | Automatic after validation | Compatibility Surgeon rewires the happy-path runtime to the generated local adapter | Local generated adapter uses Aiven Postgres and app_events; Kafka remains agent bus | Supabase env/client removed from scoped demo runtime |
| 9 | Generate report | Validation Auditor scores readiness, cutover result, and production blockers | Receipt rows written to Postgres, migration events to Kafka | Final proof package |

## What To Build

Minimum MVP:

1. Local web dashboard.
2. Fixture-backed full demo run driven by the final `RunEvent[]` contract.
3. PulseWall source app or source fixture with Supabase-style code.
4. Deterministic behavior scanner for:
   - `supabase.auth`
   - `supabase.storage`
   - `supabase.channel`
   - `.from(...)`
   - `.rpc(...)`
5. Behavior map with clear migration paths.
6. Aiven MCP receipt timeline with tool name, status, risk, and rollback.
7. Tiny data migration for 2-4 seeded tables.
8. Aiven Postgres receipt writes and validation reads.
9. Aiven Kafka topic creation plus produce/read roundtrip.
10. Aiven Kafka agent-bus panel showing multi-agent workflow events.
11. Aiven Postgres `app_events` -> browser polling bridge proof that updates the browser.
12. Controlled demo cutover that removes the Supabase runtime path for the happy path.
13. Final readiness/cutover report with cost card and first CTO recommendation.

## Real vs Generated

Must be real:

- Source scanner over actual files or fixtures.
- Behavior classification output.
- Aiven MCP receipts for Postgres and Kafka actions.
- Row-count validation against the target.
- Kafka event produce/read roundtrip.
- Aiven Kafka agent-bus events for the workflow timeline.
- Aiven Postgres `app_events` -> browser polling delivery into the app or a demo browser panel.
- Final demo app smoke test against the Aiven-backed runtime path.
- Cost card and at least one CTO recommendation if live pricing/metrics are stable; otherwise label the card as computed from cached pricing/metric fixtures.

Implementation order note:

- Start with fixture-backed cards for the entire flow.
- Each fixture card must use the same event/data contract as the live version.
- Replace fixture proofs with live proofs incrementally and label `fixture`, `cached`, or `live` in presenter/debug mode.

Can be generated/planned:

- Auth migration.
- Storage adapter.
- RLS review.
- Full production cutover.
- Production hosting for the generated adapter; the local portable adapter path is the live demo path.

## Cut List

Do not build:

- login system;
- real production cutover beyond the scoped demo path;
- storage transfer;
- auth migration;
- multi-source migration;
- full CDC;
- deployment pipeline;
- Aiven Apps deploy in the live path;
- complex agent orchestration framework;
- perfect database migration.

The demo wins if it feels like:

> A serious autonomous migration operator built a safe Aiven shadow plane, proved it, and then removed Supabase from the scoped demo runtime.

## Alignment Notes

This follows the hackathon playbook:

- **Sponsor-needs first:** the story is explicitly how Aiven captures successful Lovable/Supabase apps when they become real startups.
- **One polished flow:** one-click graduate -> shadow -> validate -> realtime rewrite -> cutover -> report.
- **Visible sponsor tech:** Aiven MCP receipts, Aiven Postgres validation, Aiven Postgres event delivery, Aiven Kafka agent-bus events, and Aiven Kafka roundtrip are all on screen.
- **Demo over architecture:** the build is a local browser control room with seeded data and a stable happy path, not a broad migration platform.
- **Honest cuts:** production auth/storage migration, full CDC, and multi-source support are named as out of scope.

This follows `plans/AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md`:

- It treats migration as **behavior migration**, not just table copy.
- It uses MCP as the **control plane and proof layer**, not the bulk data pipe.
- It keeps the strongest behavior rewrite as the hero: **Supabase Realtime -> Aiven Postgres events -> browser event bridge**, with **Aiven Kafka** validated as the agent bus and production event path.
- It records receipts in Postgres and events in Kafka so autonomous actions are inspectable.
- It is honest about platform gaps while still showing a full Supabase deletion for the scoped demo runtime.
