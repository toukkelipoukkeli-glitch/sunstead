# Verification Runbook

Date: 2026-06-25

## Purpose

This file defines how to know the demo is ready before judges see it.

## Preflight

Run before every rehearsal and before judging:

```text
1. Fixture demo shell can run the full story.
2. Source app loads.
3. Aiden control room loads.
4. Aiven credentials present in .env.local.
5. Aiven Postgres reachable.
6. Aiven Kafka reachable.
7. Receipt table write/read works.
8. Kafka produce/list works.
9. Local adapter starts.
10. Browser can receive Aiven Postgres `app_events` through polling.
11. Fallback fixture exists.
```

## Acceptance Gates

### Gate 0: Fixture Demo Shell

Pass:

- `Graduate To Aiven` runs the full story with fixture `RunEvent[]`;
- behavior map, receipts, Kafka bus, validation cards, cutover card, and final report render;
- fixture events are labeled as fixture in debug/presenter mode;
- presenter can complete the story in under four minutes without live infra.

Fallback:

- use a static screen sequence only for a design review, not for final demo readiness.

### Gate 1: Source App

Pass:

- PulseWall opens.
- Existing Supabase path can show posts/reactions or fixture data.
- Presenter can explain source behavior in under 20 seconds.

Fallback:

- Use screenshot/fixture source panel if live source fails.

### Gate 2: Scanner

Pass:

- scanner detects `.from`, `.auth`, `.storage`, `.channel`, RLS/migrations;
- behavior map matches demo script.

Fallback:

- load checked-in scan fixture and label it as "cached source scan."

### Gate 3: Aiven MCP Proof

Pass:

- service/project check succeeds;
- Postgres receipt write/read succeeds;
- UI shows receipt stream.

Fallback:

- show cached full receipt stream and run one live `aiven_pg_write` proof.

### Gate 4: Postgres Migration

Pass:

- representative rows exist in Aiven Postgres;
- row counts match expected fixture values;
- smoke query passes.

Fallback:

- reset target demo tables from local seed.

### Gate 5: Kafka Agent Bus

Pass:

- `migration.events` topic has agent events;
- UI panel shows events as they arrive or from live poll.

Fallback:

- replay same-day Kafka event fixture and run one live produce/list proof.

### Gate 6: Postgres Events Realtime Bridge

Pass:

- insert `post.reaction_added` into Aiven Postgres `app_events`;
- local adapter reads/lists it;
- browser updates through polling.

Fallback:

- show `/api/events/recent` result in the browser panel if the full app panel is unstable.

### Gate 7: Scoped Cutover

Pass:

- migrated demo path reads from local adapter;
- local adapter reads from Aiven Postgres;
- realtime path uses Aiven Postgres `app_events`;
- Kafka remains visible in the agent-bus panel;
- smoke test after cutover passes.

Fallback:

- show migrated demo panel inside control room instead of full PulseWall screen.

### Gate 8: Final Report

Pass:

- final report shows readiness, demo cutover status, rows, Kafka checks, Aiven MCP action count, blockers, rollback.

Fallback:

- static final report generated from last successful run.

## Rehearsal Requirement

Before judging, run the full flow twice consecutively:

```text
source app -> cold open -> one click -> scan -> Aiven proof -> migration -> Postgres events -> Kafka agent bus -> cutover -> report
```

Also run fixture mode once before live mode. Fixture mode is the fallback rail and must not drift from the live flow.

If any component fails twice:

- demote that component to cached/recorded fallback;
- keep at least one smaller live proof action for Aiven Postgres and Kafka;
- update presenter line so the fallback is honest.

## Stage Timing

Target 4-minute pitch/demo:

| Time | Beat |
| --- | --- |
| 0:00-0:20 | Cold open outcome |
| 0:20-0:45 | Source app and problem |
| 0:45-1:15 | One-click `Graduate To Aiven` and behavior map |
| 1:15-1:55 | Aiven MCP receipts and shadow plane |
| 1:55-2:35 | Migration validation |
| 2:35-3:15 | Postgres events polling bridge + Kafka agent bus |
| 3:15-3:45 | Scoped cutover |
| 3:45-4:00 | Final report and tagline |

## Presenter Safety Lines

Use these exact lines to avoid overclaiming:

```text
This is a scoped demo runtime cutover, not a production auth/storage migration.
The original app stays untouched.
Aiven is running the data plane: Postgres for durable data and demo realtime events, Kafka for the agent bus / production event path, MCP for autonomous control.
Auth, Storage, and RLS review are explicitly listed as production blockers.
```

## Final Done Definition

The demo is ready when:

- all nine gates pass or have honest fallbacks;
- full run completes twice;
- fixture mode and live mode use the same visible flow;
- no real secret appears in browser code, docs, terminal output, or screenshots;
- presenter can finish in under four minutes;
- final report matches [DEMO_FLOW.md](../DEMO_FLOW.md).
