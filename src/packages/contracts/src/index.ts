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
  | "adapter_generator"
  | "artifact_validator"
  | "kafka_bus_operator"

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

export type SourceKind =
  | "pulsewall_demo"
  | "local_lovable_export"
  | "github_repo"
  | "owned_supabase_project"
  | "lovable_cloud_export"

export type SourceDataPath =
  | "seeded_demo_data"
  | "supabase_db_url"
  | "pg_dump_files"
  | "csv_export"

export type CsvSourceInput = {
  fileName: string
  tableName: string
  csvText: string
}

export type AivenWorkspaceMode =
  | "connect_existing"
  | "create_new"

export type MigrationScope = {
  shadowMigration: boolean
  scopedDemoCutover: boolean
  productionCutover: "not_requested" | "approval_required" | "approved"
  authMigration: "out_of_scope" | "adapter_required" | "configured"
  storageMigration: "out_of_scope" | "adapter_required" | "configured"
}

export type SetupProfile = {
  sourceKind: SourceKind
  sourceDataPath: SourceDataPath
  aivenWorkspaceMode: AivenWorkspaceMode
  migrationScope: MigrationScope
  sourceLabel: string
  workspaceLabel: string
  sourceRoot?: string
  github?: GitHubSourceRef
  detectedBehaviors: string[]
}

export type GitHubSourceRef = {
  installationId: number
  repositoryId: number
  owner: string
  repo: string
  fullName: string
  defaultBranch: string
  ref?: string
  commitSha: string
  source: "github_app"
}

export type SourceRef = {
  file: string
  line: number
  match: string
}

export type SourceEvidence = {
  sourceRoot: string
  sourceLabel: string
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

export type BehaviorKind =
  | "table"
  | "index"
  | "constraint"
  | "view"
  | "extension"
  | "function"
  | "trigger"
  | "rls"
  | "auth"
  | "storage"
  | "realtime"
  | "rpc"
  | "edge_function"
  | "client_call"
  | "env_var"
  | "csv_export"

export type BehaviorTarget =
  | "aiven_postgres"
  | "aiven_kafka"
  | "generated_adapter"
  | "human_review"
  | "none"

export type MigrationBlocker = {
  id: string
  severity: "info" | "warning" | "blocking"
  behaviorNodeId?: string
  title: string
  detail: string
  resolution: string
  source: ProofSource
}

export type BehaviorNode = {
  id: string
  kind: BehaviorKind
  name: string
  detail: string
  classification: BehaviorClassification
  target: BehaviorTarget
  dependsOn: string[]
  evidence: SourceRef[]
  source: ProofSource
}

export type BehaviorGraph = {
  sourceLabel: string
  sourceKind: SourceKind
  framework: string[]
  packageManagers: string[]
  summary: {
    tables: string[]
    hasAuth: boolean
    hasStorage: boolean
    hasRealtime: boolean
    hasRls: boolean
    hasRpc: boolean
    hasEdgeFunctions: boolean
    hasVector: boolean
  }
  nodes: BehaviorNode[]
  readinessScore: number
  blockers: MigrationBlocker[]
  source: ProofSource
  createdAt: string
}

export type BehaviorScanResult = {
  sourceRoot: string
  sourceLabel: string
  filesScanned: number
  refsScanned: string[]
  evidence: SourceEvidence
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

export type MigrationManifest = {
  runId: string
  source: SetupProfile
  graph: BehaviorGraph
  directMigrate: {
    tables: string[]
    indexes: string[]
    extensions: string[]
    functions: string[]
    triggers: string[]
  }
  shadowCopy: {
    mode: "pulsewall_schema" | "source_table_rows" | "csv_source_rows"
    tables: string[]
    copyLimit?: number
  }
  adapterRequired: {
    auth: boolean
    storage: boolean
    rpc: string[]
    edgeFunctions: string[]
    clientTables: string[]
  }
  realtime: {
    browserPath: "aiven_postgres_app_events"
    kafkaPath: "optional_agent_bus" | "configured_agent_bus"
    sourceTables: string[]
  }
  blockers: MigrationBlocker[]
  validationPlan: Array<{
    id: string
    checkName: string
    expected: string
    source: ProofSource
  }>
  createdAt: string
}

export type GeneratedArtifact = {
  id: string
  runId: string
  kind:
    | "migration_manifest"
    | "adapter_package"
    | "env_example"
    | "migration_notes"
    | "github_pr"
    | "schema_plan"
    | "validation_report"
  path?: string
  title: string
  status: "planned" | "generated" | "validated" | "failed" | "skipped"
  source: ProofSource
  details?: Record<string, unknown>
  createdAt: string
}

export type CutoverArtifact = {
  id: string
  runId: string
  type: "github_pr" | "local_patch" | "artifact_bundle"
  status: "opened" | "generated" | "skipped" | "failed"
  url?: string
  branch?: string
  files: string[]
  proof: string
  source: ProofSource
  details?: Record<string, unknown>
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

export type AccessCheckStatus =
  | "ready"
  | "connected"
  | "live_verified"
  | "warning"
  | "blocked"
  | "not_requested"
  | "later"

export type AccessCheckId =
  | "repo_source"
  | "source_data"
  | "aiven_mcp"
  | "aiven_project"
  | "aiven_postgres"
  | "aiven_kafka"
  | "demo_adapter"
  | "production_auth"
  | "production_storage"
  | "production_cutover"

export type AccessCheck = {
  id: AccessCheckId
  label: string
  scope: string
  minimumPermission: string
  status: AccessCheckStatus
  source: ProofSource
  requiredForGraduate: boolean
  proof: string
  safeToShowDetails?: Record<string, unknown>
}

export type AccessSnapshot = {
  runId: string
  mode: "shadow_migration" | "fixture" | "cached"
  canGraduate: boolean
  blockers: string[]
  warnings: string[]
  checks: AccessCheck[]
  createdAt: string
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
  table: string
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
  setupProfile: SetupProfile
  accessSnapshot: AccessSnapshot
  events: RunEvent[]
  kafkaEvents: RunEvent[]
  behaviorGraph?: BehaviorGraph
  behaviorFindings: BehaviorFinding[]
  migrationManifest?: MigrationManifest
  generatedArtifacts: GeneratedArtifact[]
  cutoverArtifacts: CutoverArtifact[]
  receipts: AivenReceipt[]
  validationChecks: ValidationCheck[]
  report: Report
}
