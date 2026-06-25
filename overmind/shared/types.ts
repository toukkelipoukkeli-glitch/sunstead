// Aiven Overmind — the shared contract. Every package + the control-room UI import from here.
// This is the source of truth that lets the swarm's parts cohere.

// ───────────────────────── Behavior graph ─────────────────────────
export type BehaviorKind =
  | 'table' | 'index' | 'constraint' | 'function' | 'trigger' | 'view' | 'extension'
  | 'rls' | 'auth' | 'storage' | 'realtime' | 'rpc' | 'edge_function' | 'client_call'

// How the swarm will handle each behavior. Overmind prefers `generate_service` where Aiden flags.
export type Classification =
  | 'direct_migrate'    // copy as-is to Aiven Postgres (tables, indexes, pgvector)
  | 'aiven_rewrite'     // re-express on an Aiven primitive (realtime → Kafka)
  | 'generate_service'  // Surgeon generates a real Aiven-native replacement (auth, storage, data API)
  | 'review'            // needs human eyes (RLS tied to auth context)
  | 'cut'               // out of scope

export type AivenTarget = 'aiven_postgres' | 'aiven_kafka' | 'generated_backend' | 'none'

export interface BehaviorNode {
  id: string
  kind: BehaviorKind
  name: string
  detail: string
  classification: Classification
  target: AivenTarget
  /** ids of nodes this depends on (e.g. an RLS policy depends on auth) */
  dependsOn: string[]
  /** evidence: where in the repo/db this was found */
  evidence?: string[]
}

export interface BehaviorGraph {
  source: {
    framework: string
    usesSupabaseJs: boolean
    tables: string[]
    extensions: string[]
    hasAuth: boolean
    hasStorage: boolean
    hasRealtime: boolean
    hasEdgeFunctions: boolean
    rowCounts: Record<string, number>
  }
  nodes: BehaviorNode[]
  /** readiness 0..100 (the proof number) */
  readiness: number
  summary: string
}

// ───────────────────────── Aiven stack (provisioned via MCP) ─────────────────────────
export interface AivenStack {
  project: string
  postgres?: { service: string; state: string; pgvector: boolean }
  kafka?: { service: string; state: string; topics: string[] }
}

// ───────────────────────── Run / phases ─────────────────────────
export type RunPhase =
  | 'recon' | 'graph' | 'plan' | 'provision' | 'migrate'
  | 'generate' | 'heal' | 'verify' | 'cutover' | 'operate' | 'done' | 'error'

export interface MigrationRun {
  id: string
  source: string            // the source app being migrated
  status: 'running' | 'done' | 'error'
  phase: RunPhase
  startedAt: string
}

// How a run is driven:
//   'demo'    — the warm demo path: reuse the live overmind-pg/overmind-kafka and VERIFY the
//               already-migrated data (real, ~40s). DEFAULT — do not regress.
//   'analyze' — clone a public repo, really scan/graph/generate the Aiven-native backend, and
//               honestly frame provisioning + live-data migration as pending the source DB creds
//               (we never fake row counts and never touch the demo's overmind-pg data).
export type RunMode = 'demo' | 'analyze'

// ───────────────────────── The swarm (mission-control viz) ─────────────────────────
export type AgentRole =
  | 'orchestrator' | 'recon' | 'architect' | 'operator'
  | 'surgeon' | 'migrator' | 'healer' | 'verifier' | 'cto'

export type AgentStatus = 'idle' | 'working' | 'done' | 'error'

export interface AgentActivity {
  agentId: string
  role: AgentRole
  status: AgentStatus
  task: string
  detail?: string
  ts: string
}

// ───────────────────────── Receipts / validation / artifacts ─────────────────────────
/** Every Aiven MCP action is logged here — the auditable trail the judges trust. */
export interface Receipt {
  id: string
  action: string            // e.g. "aiven_service_create", "aiven_kafka_topic_create"
  summary: string
  ok: boolean
  ts: string
}

export interface ValidationCheck {
  name: string
  status: 'pass' | 'fail' | 'pending'
  expected?: string
  actual?: string
}

export interface GeneratedArtifact {
  path: string
  kind: 'auth' | 'data_api' | 'realtime_bridge' | 'storage' | 'vector' | 'schema' | 'config'
  status: 'generated' | 'tested' | 'failed' | 'healed'
  healAttempts: number
  lastError?: string
}

export interface CtoRecommendation {
  id: string
  severity: 'info' | 'warn' | 'critical'
  title: string
  detail: string
  action: string
  metric?: string
  ts: string
}

// ───────────────────────── CTO monitor (always-on) ─────────────────────────
// The latest snapshot the always-on monitor holds in memory. Every field degrades to null
// independently — one failing signal must never blank the rest. The /api/cto/state endpoint
// returns this (always 200), and the CTO chat agent reads it via the get_state tool.
export interface CtoState {
  ts: string // ISO of this snapshot
  tenant: string
  pg: {
    status: 'running' | 'unknown'
    plan: string
    rows: number | null
    connections: number | null
    maxConnections: number | null
    cacheHitRatioPct: number | null
    dbSizePretty: string | null
    cpuPct: number | null
    memPct: number | null
    diskPct: number | null
    hasVectorIndex: boolean | null
  }
  kafka: { status: 'running' | 'unknown'; plan: string; topics: number | null }
  cost: { pgUsd: number | null; kafkaUsd: number | null; totalUsd: number | null; supabaseUsd: number }
  // null = pg_stat_statements unavailable (extension not enabled); [] = enabled but no rows yet.
  slowQueries: { query: string; calls: number; meanMs: number; totalMs: number }[] | null
  watching: string[] // human labels of what the monitor checks each tick
  alerts: CtoRecommendation[]
  lastCheckedAgoMs: number
}

// ───────────────────────── SSE protocol (api → control-room) ─────────────────────────
// Every server-sent event is one of these. The control-room is a pure function of this stream.
export type SwarmEvent =
  | { type: 'phase'; phase: RunPhase; run: MigrationRun }
  | { type: 'agent'; activity: AgentActivity }
  | { type: 'graph'; graph: BehaviorGraph }
  | { type: 'stack'; stack: AivenStack }
  | { type: 'receipt'; receipt: Receipt }
  | { type: 'migration'; table: string; copied: number; total: number }
  | { type: 'kafka'; topic: string; direction: 'produce' | 'consume'; payload: string }
  | { type: 'artifact'; artifact: GeneratedArtifact }
  | { type: 'heal'; artifact: string; attempt: number; ok: boolean; error?: string }
  | { type: 'validation'; check: ValidationCheck }
  | { type: 'cost'; supabaseUsd: number; aivenUsd: number; note: string }
  | { type: 'cto'; rec: CtoRecommendation }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; msg: string }
  | { type: 'done'; readiness: number; summary: string }
  | { type: 'error'; msg: string }
