export type ProofSource = "fixture" | "live" | "cached"

export type RunStatus = "idle" | "running" | "complete" | "failed"

export type RunState =
  | "idle"
  | "access_connected"
  | "scan_running"
  | "behavior_mapped"
  | "aiven_shadow_ready"
  | "migration_running"
  | "migration_validated"
  | "realtime_validated"
  | "demo_cutover_running"
  | "demo_cutover_complete"
  | "report_ready"
  | "failed"

export type AgentName =
  | "access_broker"
  | "repo_scanner"
  | "behavior_mapper"
  | "aiven_operator"
  | "migration_operator"
  | "compatibility_surgeon"
  | "validation_auditor"
  | "cutover_manager"
  | "report_agent"

export type RunEvent = {
  runId: string
  type: string
  agent: AgentName
  state: RunState
  status: "started" | "ok" | "failed" | "skipped"
  source: ProofSource
  summary: string
  details?: Record<string, unknown>
  createdAt: string
}

export type RunContext = {
  runId: string
  mode: "fixture" | "live"
  now(): string
  emit(event: RunEvent): void
}

export type BehaviorClassification =
  | "direct_migrate"
  | "rewrite"
  | "adapter_required"
  | "review_required"
  | "cut"

export type BehaviorFinding = {
  id: string
  behavior: string
  detected: boolean
  sourceRefs: string[]
  classification: BehaviorClassification
  target: string
  demoTreatment: string
  source: ProofSource
}

export type BehaviorScanResult = {
  sourceRoot: string
  filesScanned: number
  refsScanned: string[]
  detected: {
    tables: string[]
    realtimeTables: string[]
    auth: boolean
    storageBuckets: string[]
    edgeFunctions: string[]
    rpcFunctions: string[]
    rlsTables: string[]
    triggerFunctions: string[]
    vector: boolean
  }
  findings: BehaviorFinding[]
  source: ProofSource
  createdAt: string
}

export type DataMigrationResult = {
  source: ProofSource
  ok: boolean
  missingEnv: string[]
  events: RunEvent[]
  receipts: AivenReceipt[]
  checks: ValidationCheck[]
  rowValidations: RowValidation[]
}

export type CutoverResult = {
  source: ProofSource
  ok: boolean
  missingEnv: string[]
  events: RunEvent[]
  receipts: AivenReceipt[]
  checks: ValidationCheck[]
}

export type KafkaAgentBusResult = {
  source: ProofSource
  ok: boolean
  missingEnv: string[]
  events: RunEvent[]
  kafkaEvents: RunEvent[]
  receipts: AivenReceipt[]
  checks: ValidationCheck[]
}

export type AivenReceipt = {
  id: string
  runId: string
  agent: AgentName
  intent: string
  tool: string
  target: string
  risk: "read_only" | "safe_write" | "reversible_demo_change"
  result: "ok" | "failed" | "cached"
  rollback?: string
  details?: Record<string, unknown>
  source: ProofSource
  createdAt: string
}

export type ValidationCheck = {
  id: string
  runId: string
  checkName: string
  status: "passed" | "failed" | "skipped"
  details: Record<string, unknown>
  source: ProofSource
  createdAt: string
}

export type RowValidation = {
  table: "posts" | "reactions" | "demo_users" | "app_events"
  expected: number
  actual: number
  status: "passed" | "failed" | "skipped"
  source: ProofSource
}

export type Report = {
  runId: string
  headline: string
  readinessScore: number
  demoCutoverStatus: "passed" | "failed" | "skipped"
  runtimeDependency: "removed_from_scoped_demo_path" | "unchanged" | "blocked"
  rowValidations: RowValidation[]
  checks: ValidationCheck[]
  receipts: AivenReceipt[]
  blockers: string[]
  rollback: string
  costSummary: string
  ctoRecommendation: string
  source: ProofSource
  createdAt: string
}

export type Post = {
  id: string
  body: string
  authorHandle: string
  imageUrl?: string
  reactionCount: number
  createdAt: string
}

export type LeaderboardRow = {
  postId: string
  body: string
  authorHandle: string
  reactionCount: number
  rank: number
}

export type AddReactionInput = {
  postId: string
  emoji: string
  userId?: string
}

export type PulseWallEvent = {
  id: string
  runId: string
  eventType: "post.reaction_added" | "post.created" | "leaderboard.updated"
  entityType: "post" | "reaction" | "leaderboard"
  entityId: string
  payload: Record<string, unknown>
  createdAt: string
}

export type PulseWallProvider = {
  listPosts(): Promise<Post[]>
  getLeaderboard(): Promise<LeaderboardRow[]>
  addReaction(input: AddReactionInput): Promise<void>
  listRecentEvents(input: { sinceId?: string; limit?: number }): Promise<PulseWallEvent[]>
}

export type RunSnapshot = {
  runId: string
  status: RunStatus
  state: RunState
  mode: ProofSource
  events: RunEvent[]
  kafkaEvents: RunEvent[]
  behaviorFindings: BehaviorFinding[]
  receipts: AivenReceipt[]
  validationChecks: ValidationCheck[]
  report: Report
}
