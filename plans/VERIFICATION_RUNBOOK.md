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
6. Aiven Kafka reachable if Kafka credentials are configured.
7. Receipt table write/read works.
8. Kafka produce/list works when configured; otherwise the Kafka slot is warning/cached.
9. Local adapter starts.
10. Browser can receive Aiven Postgres `app_events` through polling.
11. Fallback fixture exists.
```

## M07 Rehearsal Commands

Use these from the repo root while the dev server is running.

```bash
npm run demo:preflight
npm run demo:reset
npm run demo:fallback
npm run demo:rehearse
```

Command meanings:

- `npm run demo:preflight` checks API health, control-room reachability, Access Broker readiness, and the source scanner.
- `npm run demo:reset` resets the fixture adapter and writes `artifacts/rehearsal/reset-latest.json`.
- `npm run demo:reset:live` reloads the seeded Aiven Postgres dataset and cuts the local adapter over to Aiven.
- `npm run demo:fallback` runs the explicit fixture fallback path and writes local fallback artifacts under `artifacts/rehearsal/`.
- `npm run demo:rehearse` runs the live one-click verifier twice consecutively.

Artifacts are local-only and ignored by git. Do not move screenshots, recordings, or artifact JSON into tracked docs if they contain environment-specific output.

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

### Gate 3: Aiven Control Proof

Pass:

- Agent SDK Aiven MCP config is present, `aiven.mcp.agent.probed` is recorded, and any direct Aiven fallback receipt is labeled;
- Postgres receipt write/read succeeds;
- UI shows receipt stream.

Fallback:

- show cached full receipt stream and run one live Aiven Postgres receipt write/read proof.

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

- final report shows readiness, demo cutover status, rows, Kafka checks or warning, Aiven action receipt count, blockers, rollback.

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
| 1:15-1:55 | Aiven receipts and shadow plane |
| 1:55-2:35 | Migration validation |
| 2:35-3:15 | Postgres events polling bridge + Kafka agent bus |
| 3:15-3:45 | Scoped cutover |
| 3:45-4:00 | Final report and tagline |

## Four-Minute Script

Use this as the default presenter line sequence.

```text
0:00-0:20
This is PulseWall, a Lovable/Supabase prototype. Aiden starts by showing the destination: a scoped runtime already proven on Aiven.

0:20-0:45
The original app stays untouched. Aiden asks for the minimum access it needs, then maps Supabase behavior: tables, realtime, auth, storage, RLS, edge functions, RPC, and pgvector.

0:45-1:15
I click Graduate To Aiven once. Behind that one action, Aiden runs a bounded operator flow: scan, preflight, Aiven proof, migration, cutover, Kafka proof, and report.

1:15-1:55
The Aiven landing zone is live for Postgres. Receipts show what was written or read, risk level, rollback, and whether the action was live, cached, fixture, or direct fallback.

1:55-2:35
The scoped dataset is loaded and validated in Aiven Postgres. The browser-critical realtime rewrite uses app_events plus /api/events/recent polling.

2:35-3:15
Kafka is the workflow-event and production event-path proof. If credentials are missing, it stays warning-only and cached without blocking the browser demo path.

3:15-3:45
Cutover is intentionally scoped. The local Aiden adapter now reads and writes through Aiven Postgres; production auth, storage, and RLS remain explicit blockers.

3:45-4:00
The final memo is what a founder or CTO needs: readiness, validation, blockers, rollback, cost posture, and the next production steps.
```

## Presenter Safety Lines

Use these exact lines to avoid overclaiming:

```text
This is a scoped demo runtime cutover, not a production auth/storage migration.
The original app stays untouched.
Aiven is running the data plane: Postgres for durable data and demo realtime events. Kafka is the workflow-event slot when configured, and Aiven control actions are receipt-backed with fallback labels.
Auth, Storage, and RLS review are explicitly listed as production blockers.
```

## Judge Q&A Bullets

- Is this a real migration? The demo performs live Aiven Postgres writes, reads, validation, and scoped adapter cutover. Source-data copying is representative/seeded for the hackathon path, and production migration mechanics are explicit next work.
- Did you replace Supabase entirely? For the scoped demo runtime, yes. For production auth, storage, RLS, edge functions, and full data migration, no; those remain listed blockers.
- Why Kafka if browser realtime uses Postgres polling? Kafka is the workflow-event and production event-path proof. Browser-critical demo realtime is Aiven Postgres `app_events` through `/api/events/recent`.
- Are you using Aiven MCP? Yes. The Agent SDK receives Aiven MCP directly for control-plane context. Current data-plane proof actions may still use direct Aiven fallback, and those receipts are labeled.
- What happens if Wi-Fi or Aiven is flaky? Use `npm run demo:fallback`; it replays the same typed event/report flow from local fixture artifacts and keeps one smaller live Aiven Postgres write/read proof if available.
- What is the rollback? Switch the local adapter back to fixture/Supabase path and delete run-scoped Aiven demo rows or demo-prefixed rows from the disposable target.
- What would make this production-ready? Real source extraction, run-scoped or tenant-scoped target schema, auth/storage adapters, RLS policy review, connection pooling, and full rehearsal on production-like data.

## Final Done Definition

The demo is ready when:

- all nine gates pass or have honest fallbacks;
- full run completes twice;
- fixture mode and live mode use the same visible flow;
- no real secret appears in browser code, docs, terminal output, or screenshots;
- presenter can finish in under four minutes;
- final report matches [DEMO_FLOW.md](../DEMO_FLOW.md).
