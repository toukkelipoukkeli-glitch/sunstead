# MCP And Aiven Contract

Date: 2026-06-25

## Purpose

This document defines exactly how the demo proves Aiven MCP depth.

MCP is the control plane and proof layer. It is not the bulk data pipe.

Mission 00 may render fixture Aiven receipts to lock the demo flow. Final rehearsal and judging must include at least the required live proof actions below, or clearly label cached/fallback proof.

## Required Live Proof Actions

At least these must be real during the final demo or rehearsal:

| Proof | Action | UI evidence |
| --- | --- | --- |
| Project/service visibility | list project/services | Aiven shadow plane card |
| Postgres write | insert migration run or receipt | receipt stream |
| Postgres read | read validation count or receipt | validation card |
| Kafka topic | create or verify topic | Kafka card |
| Kafka produce | publish agent-bus / production event-bus proof event | agent bus card |
| Kafka list/read | show event observed | roundtrip validation |

## Preferred MCP Tool Names

Use the exact available Aiven MCP tool names if confirmed at runtime. Expected names from current planning:

```text
aiven_project_list
aiven_service_list
aiven_service_get
aiven_pg_service_available_extensions
aiven_pg_write
aiven_pg_read
aiven_kafka_topic_list
aiven_kafka_topic_create
aiven_kafka_topic_message_produce
aiven_kafka_topic_message_list
```

If a tool name differs in the live MCP client, wrap it behind the same local intent name so UI and receipts remain stable.

## Receipt Shape

Every Aiven action shown in the UI writes a receipt:

```json
{
  "run_id": "run_2026_06_25_pulsewall",
  "agent": "aiven_operator",
  "intent": "create agent bus topic",
  "tool": "aiven_kafka_topic_create",
  "target": "migration.events",
  "risk": "safe_write",
  "result": "ok",
  "rollback": "delete topic after demo if needed",
  "details": {
    "service": "kafka-demo",
    "topic": "migration.events"
  }
}
```

Risk values:

- `read_only`
- `safe_write`
- `reversible_demo_change`
- `production_impacting`
- `destructive`

Demo should use only `read_only`, `safe_write`, and `reversible_demo_change`.

## Aiven Postgres Contract

Use Aiven Postgres for:

- migrated app rows;
- `app_events` rows for demo realtime;
- `migration_runs`;
- `mcp_receipts`;
- `validation_checks`;
- final proof report data.

Required validation reads:

```sql
select count(*) from posts;
select count(*) from reactions;
select count(*) from app_events where run_id = $1;
select count(*) from mcp_receipts where run_id = $1;
select check_name, status from validation_checks where run_id = $1 order by id;
```

## Aiven Kafka Contract

Use Aiven Kafka for one visible purpose in the hackathon demo:

Agent bus / production event-bus proof:

- `access.connected`
- `repo.scan.started`
- `behavior.scan.completed`
- `aiven.shadow_plane.ready`
- `migration.rows.validated`
- `realtime.postgres_events_bridge.passed`
- `kafka.agent_bus_roundtrip.passed`
- `cutover.demo_runtime.ready`

Browser-critical realtime uses Aiven Postgres `app_events` through `/api/events/recent` polling. SSE is optional after polling works. Kafka must remain visible, but it should not decide whether the browser update works on stage.

## Fallback Rules

Keep the hierarchy:

1. Live MCP action.
2. Live direct Aiven action with clear fallback receipt.
3. Cached result from same-day rehearsal, labeled as cached.
4. Recorded fallback, labeled as recording.

Never silently fake a live Aiven action.

Fixture mode rule:

- Fixture receipts are acceptable for Mission 00 and early UI development.
- Fixture receipts must carry `source: "fixture"` in the UI/event model.
- Fixture receipts are not enough for sponsor proof.
- As soon as Mission 01 lands, replace at least one Postgres receipt and one Kafka message in the same UI slots with `source: "live"` events.

If Aiven/Kafka is slow:

- keep the UI moving with pending states;
- run one smaller live proof action;
- show cached receipts for the longer path;
- presenter says: "This run is replaying the same receipt stream from rehearsal; here is one live Aiven write now."

## Done Criteria

This contract is satisfied when:

- at least one receipt row is live-written to Aiven Postgres;
- at least one validation read comes from Aiven Postgres;
- at least one Kafka message is live-produced and observed;
- the UI shows the tool/intent/risk/rollback for each visible Aiven action.
