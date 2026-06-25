import type {
  AivenReceipt,
  BehaviorFinding,
  LeaderboardRow,
  Post,
  PulseWallEvent,
  Report,
  RunEvent,
  ValidationCheck
} from "@aiden/contracts"

export const fixtureRunId = "run_2026_06_25_pulsewall"

const baseTime = Date.parse("2026-06-25T10:00:00.000Z")
const at = (seconds: number) => new Date(baseTime + seconds * 1000).toISOString()

export const fixtureEvents: RunEvent[] = [
  {
    runId: fixtureRunId,
    type: "access.connected",
    agent: "access_broker",
    state: "access_connected",
    status: "ok",
    source: "fixture",
    summary: "Repo, source, Aiven Postgres, and Aiven Kafka access are connected.",
    createdAt: at(0)
  },
  {
    runId: fixtureRunId,
    type: "repo.scan.started",
    agent: "repo_scanner",
    state: "scan_running",
    status: "started",
    source: "fixture",
    summary: "Scanning PulseWall source for Supabase client, migrations, RLS, realtime, and functions.",
    createdAt: at(4)
  },
  {
    runId: fixtureRunId,
    type: "source.behavior.detected",
    agent: "repo_scanner",
    state: "scan_running",
    status: "ok",
    source: "fixture",
    summary: "Detected tables, auth, storage, realtime channel, RPC/edge, RLS, and pgvector usage.",
    createdAt: at(8)
  },
  {
    runId: fixtureRunId,
    type: "behavior.scan.completed",
    agent: "behavior_mapper",
    state: "behavior_mapped",
    status: "ok",
    source: "fixture",
    summary: "Behavior graph classified direct migrations, rewrites, adapters, and review blockers.",
    createdAt: at(13)
  },
  {
    runId: fixtureRunId,
    type: "aiven.mcp.agent.probed",
    agent: "aiven_operator",
    state: "aiven_shadow_ready",
    status: "ok",
    source: "fixture",
    summary: "Aiven Operator Agent launched through Anthropic Agent SDK and inspected Aiven through MCP.",
    details: {
      agentRuntime: "anthropic_agent_sdk",
      controlPlane: "anthropic_agent_sdk_aiven_mcp",
      observedToolUses: ["mcp__aiven__aiven_project_list"]
    },
    createdAt: at(16)
  },
  {
    runId: fixtureRunId,
    type: "aiven.project.detected",
    agent: "aiven_operator",
    state: "aiven_shadow_ready",
    status: "ok",
    source: "fixture",
    summary: "Aiven project found; Postgres and Kafka services verified.",
    createdAt: at(18)
  },
  {
    runId: fixtureRunId,
    type: "aiven.postgres.verified",
    agent: "aiven_operator",
    state: "aiven_shadow_ready",
    status: "ok",
    source: "fixture",
    summary: "Aiven Postgres target accepted receipt tables and validation checks.",
    createdAt: at(22)
  },
  {
    runId: fixtureRunId,
    type: "aiven.kafka.verified",
    agent: "aiven_operator",
    state: "aiven_shadow_ready",
    status: "ok",
    source: "fixture",
    summary: "Aiven Kafka topic migration.events verified for agent-bus proof.",
    createdAt: at(25)
  },
  {
    runId: fixtureRunId,
    type: "mcp.receipt.written",
    agent: "aiven_operator",
    state: "aiven_shadow_ready",
    status: "ok",
    source: "fixture",
    summary: "Aiven action receipt written with risk, rollback, and control-plane metadata.",
    createdAt: at(29)
  },
  {
    runId: fixtureRunId,
    type: "migration.schema.applied",
    agent: "migration_operator",
    state: "migration_running",
    status: "ok",
    source: "fixture",
    summary: "PulseWall schema applied to Aiven Postgres.",
    createdAt: at(35)
  },
  {
    runId: fixtureRunId,
    type: "migration.rows.validated",
    agent: "validation_auditor",
    state: "migration_validated",
    status: "ok",
    source: "fixture",
    summary: "Posts, reactions, users, and app events match expected row counts.",
    createdAt: at(42)
  },
  {
    runId: fixtureRunId,
    type: "realtime.postgres_events_bridge.passed",
    agent: "compatibility_surgeon",
    state: "realtime_validated",
    status: "ok",
    source: "fixture",
    summary: "Supabase Realtime behavior mapped to Aiven Postgres app_events and browser polling.",
    createdAt: at(50)
  },
  {
    runId: fixtureRunId,
    type: "kafka.agent_bus_roundtrip.passed",
    agent: "aiven_operator",
    state: "realtime_validated",
    status: "ok",
    source: "fixture",
    summary: "Aiven Kafka migration.events produced and listed an agent workflow event.",
    createdAt: at(56)
  },
  {
    runId: fixtureRunId,
    type: "cutover.demo_runtime.ready",
    agent: "cutover_manager",
    state: "demo_cutover_complete",
    status: "ok",
    source: "fixture",
    summary: "Controlled runtime now reads and writes through the local Aiden adapter.",
    createdAt: at(64)
  },
  {
    runId: fixtureRunId,
    type: "proof.package.generated",
    agent: "report_agent",
    state: "report_ready",
    status: "ok",
    source: "fixture",
    summary: "Final proof package is ready with blockers, rollback, cost, and CTO recommendation.",
    createdAt: at(72)
  }
]

export const behaviorFindings: BehaviorFinding[] = [
  {
    id: "behavior_tables",
    behavior: "Postgres tables and indexes",
    detected: true,
    sourceRefs: ["supabase/migrations/0001_init.sql", "src/Wall.jsx"],
    classification: "direct_migrate",
    target: "Aiven Postgres",
    demoTreatment: "Apply schema and validate row counts.",
    source: "fixture"
  },
  {
    id: "behavior_realtime",
    behavior: "Supabase Realtime channel",
    detected: true,
    sourceRefs: ["src/Wall.jsx:supabase.channel"],
    classification: "rewrite",
    target: "Aiven Postgres app_events + browser polling; Kafka production path proof",
    demoTreatment: "Show Postgres event delivered to browser and Kafka agent-bus roundtrip.",
    source: "fixture"
  },
  {
    id: "behavior_auth",
    behavior: "Supabase Auth",
    detected: true,
    sourceRefs: ["src/App.jsx:supabase.auth"],
    classification: "adapter_required",
    target: "Production auth adapter",
    demoTreatment: "Use managed source user; mark production blocker.",
    source: "fixture"
  },
  {
    id: "behavior_storage",
    behavior: "Supabase Storage",
    detected: true,
    sourceRefs: ["src/Wall.jsx:storage.from"],
    classification: "adapter_required",
    target: "Object-store adapter",
    demoTreatment: "Use static image URLs; mark production blocker.",
    source: "fixture"
  },
  {
    id: "behavior_rls",
    behavior: "RLS policies using auth context",
    detected: true,
    sourceRefs: ["supabase/migrations/0001_init.sql:auth.uid"],
    classification: "review_required",
    target: "Server-side authorization review",
    demoTreatment: "Flag before production cutover.",
    source: "fixture"
  },
  {
    id: "behavior_vector",
    behavior: "pgvector search function",
    detected: true,
    sourceRefs: ["supabase/migrations/0001_init.sql:vector"],
    classification: "direct_migrate",
    target: "Aiven Postgres vector extension",
    demoTreatment: "Check extension availability; do not block core path.",
    source: "fixture"
  }
]

export const receipts: AivenReceipt[] = [
  {
    id: "receipt_project_list",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "list target project services",
    tool: "aiven_service_list",
    target: "touko-1f1c",
    risk: "read_only",
    result: "ok",
    source: "fixture",
    createdAt: at(18)
  },
  {
    id: "receipt_pg_write",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "write migration run receipt",
    tool: "aiven_pg_write",
    target: "migration_runs",
    risk: "safe_write",
    result: "ok",
    rollback: "delete prepared run rows after rehearsal",
    source: "fixture",
    createdAt: at(22)
  },
  {
    id: "receipt_pg_read",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "read migration receipt count",
    tool: "aiven_pg_read",
    target: "mcp_receipts",
    risk: "read_only",
    result: "ok",
    source: "fixture",
    createdAt: at(23)
  },
  {
    id: "receipt_kafka_service",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "verify Kafka service",
    tool: "aiven_service_get",
    target: "migration.events",
    risk: "read_only",
    result: "ok",
    source: "fixture",
    createdAt: at(24)
  },
  {
    id: "receipt_kafka_topic",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "verify agent bus topic",
    tool: "aiven_kafka_topic_create",
    target: "migration.events",
    risk: "safe_write",
    result: "ok",
    rollback: "delete topic if needed",
    source: "fixture",
    createdAt: at(25)
  },
  {
    id: "receipt_schema_apply",
    runId: fixtureRunId,
    agent: "migration_operator",
    intent: "apply PulseWall schema",
    tool: "aiven_pg_write",
    target: "posts,reactions,demo_users,app_events",
    risk: "safe_write",
    result: "ok",
    rollback: "drop shadow tables after rollback window",
    source: "fixture",
    createdAt: at(35)
  },
  {
    id: "receipt_app_events",
    runId: fixtureRunId,
    agent: "compatibility_surgeon",
    intent: "write app event for browser polling",
    tool: "aiven_pg_write",
    target: "app_events",
    risk: "safe_write",
    result: "ok",
    source: "fixture",
    createdAt: at(50)
  },
  {
    id: "receipt_app_events_read",
    runId: fixtureRunId,
    agent: "validation_auditor",
    intent: "read recent app events for browser polling",
    tool: "aiven_pg_read",
    target: "app_events_recent",
    risk: "read_only",
    result: "ok",
    source: "fixture",
    createdAt: at(52)
  },
  {
    id: "receipt_kafka_produce",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "produce agent workflow event",
    tool: "aiven_kafka_topic_message_produce",
    target: "migration.events",
    risk: "safe_write",
    result: "ok",
    source: "fixture",
    createdAt: at(56)
  },
  {
    id: "receipt_kafka_list",
    runId: fixtureRunId,
    agent: "aiven_operator",
    intent: "list agent workflow event",
    tool: "aiven_kafka_topic_message_list",
    target: "migration.events",
    risk: "read_only",
    result: "ok",
    source: "fixture",
    createdAt: at(57)
  }
]

export const validationChecks: ValidationCheck[] = [
  {
    id: "check_posts",
    runId: fixtureRunId,
    checkName: "posts_row_count",
    status: "passed",
    details: { expected: 40, actual: 40 },
    source: "fixture",
    createdAt: at(42)
  },
  {
    id: "check_reactions",
    runId: fixtureRunId,
    checkName: "reactions_row_count",
    status: "passed",
    details: { expected: 120, actual: 120 },
    source: "fixture",
    createdAt: at(42)
  },
  {
    id: "check_smoke_query",
    runId: fixtureRunId,
    checkName: "aiven_postgres_smoke_query",
    status: "passed",
    details: { query: "select count(*) from posts", returnedRows: 1 },
    source: "fixture",
    createdAt: at(44)
  },
  {
    id: "check_receipt_read",
    runId: fixtureRunId,
    checkName: "mcp_receipts_readback",
    status: "passed",
    details: { expectedAtLeast: 4, actual: 9 },
    source: "fixture",
    createdAt: at(45)
  },
  {
    id: "check_realtime",
    runId: fixtureRunId,
    checkName: "postgres_events_browser_polling",
    status: "passed",
    details: { endpoint: "/api/events/recent", delivered: true },
    source: "fixture",
    createdAt: at(50)
  },
  {
    id: "check_kafka",
    runId: fixtureRunId,
    checkName: "kafka_agent_bus_roundtrip",
    status: "passed",
    details: { topic: "migration.events", produced: 1, listed: 1 },
    source: "fixture",
    createdAt: at(56)
  },
  {
    id: "check_cutover",
    runId: fixtureRunId,
    checkName: "controlled_runtime_smoke_test",
    status: "passed",
    details: { provider: "aivenProvider", supabaseRuntimePath: "unused" },
    source: "fixture",
    createdAt: at(64)
  }
]

export const posts: Post[] = [
  {
    id: "post_001",
    body: "Launch wall is live. Reactions are coming from the Aiven-backed controlled runtime.",
    authorHandle: "@mira",
    imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80",
    reactionCount: 48,
    createdAt: at(-240)
  },
  {
    id: "post_002",
    body: "Aiden found Supabase Auth, Storage, Realtime, RLS, Edge Function calls, and pgvector before touching the target.",
    authorHandle: "@kai",
    reactionCount: 37,
    createdAt: at(-180)
  },
  {
    id: "post_003",
    body: "The controlled runtime is using Aiven Postgres for reads, writes, and app_events polling.",
    authorHandle: "@nova",
    reactionCount: 29,
    createdAt: at(-120)
  },
  {
    id: "post_004",
    body: "Kafka is visible as the agent bus, not hidden in the backend and not on the browser-critical path.",
    authorHandle: "@sam",
    reactionCount: 24,
    createdAt: at(-60)
  }
]

export const leaderboard: LeaderboardRow[] = posts
  .map((post) => ({
    postId: post.id,
    body: post.body,
    authorHandle: post.authorHandle,
    reactionCount: post.reactionCount,
    rank: 0
  }))
  .sort((a, b) => b.reactionCount - a.reactionCount)
  .map((row, index) => ({ ...row, rank: index + 1 }))

export const appEvents: PulseWallEvent[] = [
  {
    id: "event_001",
    runId: fixtureRunId,
    eventType: "post.reaction_added",
    entityType: "reaction",
    entityId: "reaction_001",
    payload: {
      postId: "post_001",
      emoji: "rocket",
      source_behavior: "supabase_realtime",
      target: "aiven_postgres.app_events",
      browser_bridge: "/api/events/recent"
    },
    createdAt: at(50)
  },
  {
    id: "event_002",
    runId: fixtureRunId,
    eventType: "leaderboard.updated",
    entityType: "leaderboard",
    entityId: "leaderboard",
    payload: {
      topPostId: "post_001",
      source_behavior: "supabase_realtime",
      bridge: "/api/events/recent"
    },
    createdAt: at(52)
  }
]

export const finalReport: Report = {
  runId: fixtureRunId,
  headline: "Migrated runtime path running on Aiven",
  readinessScore: 82,
  demoCutoverStatus: "passed",
  runtimeDependency: "removed_from_scoped_demo_path",
  rowValidations: [
    { table: "posts", expected: 40, actual: 40, status: "passed", source: "fixture" },
    { table: "reactions", expected: 120, actual: 120, status: "passed", source: "fixture" },
    { table: "demo_users", expected: 8, actual: 8, status: "passed", source: "fixture" },
    { table: "app_events", expected: 2, actual: 2, status: "passed", source: "fixture" }
  ],
  checks: validationChecks,
  receipts,
  blockers: [
    "Production Auth requires adapter or compatible JWT/RLS strategy.",
    "Production Storage requires object-store migration.",
    "RLS policies using Supabase auth context require review before production cutover."
  ],
  rollback: "Switch the controlled runtime adapter back to Supabase, keep the source untouched, and drop Aiven shadow tables after the rollback window.",
  costSummary: "Sizing estimate: Supabase starter path replaced by Aiven Postgres plus Kafka services sized for growth.",
  ctoRecommendation: "Add connection pooling and keep Kafka as the production event path before expanding beyond the controlled runtime path.",
  source: "fixture",
  createdAt: at(72)
}

export const fixtureSnapshot = {
  runId: fixtureRunId,
  status: "complete",
  state: "report_ready",
  mode: "fixture",
  events: fixtureEvents,
  behaviorFindings,
  receipts,
  validationChecks,
  report: finalReport
} as const
