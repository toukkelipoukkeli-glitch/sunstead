import { existsSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  generateAivenAdapterPackage,
  validateGeneratedAdapterPackage
} from "@aiden/adapter-generator"
import {
  canProvisionFreshAivenTarget,
  getActiveAivenTargetSummary,
  getConfiguredCsvSourceSummary,
  hasActiveAivenKafkaTarget,
  hasActiveAivenPostgresTarget,
  runAivenDataMigration,
  runAivenProofSpine,
  runKafkaAgentBusProof
} from "@aiden/aiven-ops"
import type {
  AccessCheck,
  AccessSnapshot,
  AivenReceipt,
  BehaviorFinding,
  BehaviorGraph,
  BehaviorScanResult,
  CutoverArtifact,
  GeneratedArtifact,
  MigrationManifest,
  ProofSource,
  RowValidation,
  RunEvent,
  RunSnapshot,
  SetupProfile,
  GitHubSourceRef,
  ValidationCheck
} from "@aiden/contracts"
import {
  behaviorFindings,
  finalReport,
  fixtureEvents,
  fixtureRunId,
  receipts,
  validationChecks
} from "@aiden/fixtures"
import {
  behaviorFindingsFromGraph,
  buildBehaviorGraph,
  buildMigrationManifest,
  scanLovableSource
} from "@aiden/migration-core"
import { openCutoverPullRequest } from "@aiden/github-source"
import { createAivenPulseWallProvider } from "@aiden/pulsewall-adapter"
import { canUseAivenProvider, switchToAivenProvider } from "./adapterRuntime.js"
import {
  callAgentReasoner,
  readAivenMcpRuntimeConfig,
  readAgentRunMode,
  runAivenMcpOperatorProbe,
  runAgentSteps,
  selectAgentReasoner,
  type AgentRunContext,
  type AgentReasonerSelection,
  type AgentStep
} from "./oneClickOrchestrator.js"

type Listener = (event: RunEvent) => void

const stateDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(stateDir, "../../../../..")

type RunRecord = {
  runId: string
  status: "idle" | "running" | "complete" | "failed"
  setupProfile: SetupProfile
  events: RunEvent[]
  kafkaEvents: RunEvent[]
  proofSource: ProofSource
  behaviorGraph?: BehaviorGraph
  behaviorFindings: BehaviorFinding[]
  migrationManifest?: MigrationManifest
  generatedArtifacts: GeneratedArtifact[]
  cutoverArtifacts: CutoverArtifact[]
  receipts: AivenReceipt[]
  validationChecks: ValidationCheck[]
  rowValidations: RowValidation[]
  timer?: NodeJS.Timeout
}

const runs = new Map<string, RunRecord>()
const listeners = new Map<string, Set<Listener>>()

const defaultSetupProfile: SetupProfile = {
  sourceKind: "pulsewall_demo",
  sourceDataPath: "seeded_demo_data",
  aivenWorkspaceMode: "create_new",
  migrationScope: {
    shadowMigration: true,
    scopedDemoCutover: true,
    productionCutover: "not_requested",
    authMigration: "adapter_required",
    storageMigration: "adapter_required"
  },
  sourceLabel: "PulseWall managed profile",
  workspaceLabel: "Fresh Aiven landing zone",
  detectedBehaviors: ["Supabase client", "tables", "realtime", "auth", "storage", "RLS", "RPC/edge markers"]
}

const sanitizeText = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length < 120 ? trimmed : fallback
}

const sanitizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length < 180 ? trimmed : undefined
}

const sanitizeInteger = (value: unknown, minimum = 1) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : undefined
}

const sourceKinds = new Set<SetupProfile["sourceKind"]>([
  "pulsewall_demo",
  "local_lovable_export",
  "github_repo",
  "owned_supabase_project",
  "lovable_cloud_export"
])
const sourceDataPaths = new Set<SetupProfile["sourceDataPath"]>([
  "seeded_demo_data",
  "supabase_db_url",
  "pg_dump_files",
  "csv_export"
])
const workspaceModes = new Set<SetupProfile["aivenWorkspaceMode"]>([
  "connect_existing",
  "create_new"
])
const productionCutoverModes = new Set<SetupProfile["migrationScope"]["productionCutover"]>([
  "not_requested",
  "approval_required",
  "approved"
])
const adapterModes = new Set<SetupProfile["migrationScope"]["authMigration"]>([
  "out_of_scope",
  "adapter_required",
  "configured"
])

const enumValue = <T extends string>(value: unknown, allowed: Set<T>, fallback: T): T =>
  typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback

const sanitizeSourceRoot = (value: unknown) => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 180 || isAbsolute(trimmed)) return undefined

  const resolved = resolve(repoRoot, trimmed)
  const allowedRoots = [resolve(repoRoot, "demo"), resolve(repoRoot, "fixtures"), resolve(repoRoot, "artifacts")]
  const underAllowedRoot = allowedRoots.some((root) => {
    const relativePath = relative(root, resolved)
    return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath))
  })
  if (!underAllowedRoot) return undefined

  return relative(repoRoot, resolved)
}

const sanitizeGitHubSourceRef = (value: unknown): GitHubSourceRef | undefined => {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Partial<GitHubSourceRef>
  if (raw.source !== "github_app") return undefined

  const repositoryId = sanitizeInteger(raw.repositoryId)
  const installationId = sanitizeInteger(raw.installationId, 0)
  const owner = sanitizeOptionalText(raw.owner)
  const repo = sanitizeOptionalText(raw.repo)
  const fullName = sanitizeOptionalText(raw.fullName)
  const defaultBranch = sanitizeOptionalText(raw.defaultBranch)
  const commitSha = sanitizeOptionalText(raw.commitSha)
  if (
    installationId === undefined ||
    repositoryId === undefined ||
    !owner ||
    !repo ||
    !fullName ||
    !defaultBranch ||
    !commitSha
  ) {
    return undefined
  }

  return {
    installationId,
    repositoryId,
    owner,
    repo,
    fullName,
    defaultBranch,
    ref: sanitizeOptionalText(raw.ref),
    commitSha,
    source: "github_app"
  }
}

const normalizeSetupProfile = (input?: Partial<SetupProfile>): SetupProfile => {
  const sourceKind = enumValue(input?.sourceKind, sourceKinds, defaultSetupProfile.sourceKind)
  const sourceDataPath = enumValue(input?.sourceDataPath, sourceDataPaths, defaultSetupProfile.sourceDataPath)
  const aivenWorkspaceMode = enumValue(
    input?.aivenWorkspaceMode,
    workspaceModes,
    defaultSetupProfile.aivenWorkspaceMode
  )
  const sourceRoot = sourceKind === "pulsewall_demo" ? undefined : sanitizeSourceRoot(input?.sourceRoot)
  const github = sourceKind === "github_repo" ? sanitizeGitHubSourceRef(input?.github) : undefined

  return {
    sourceKind,
    sourceDataPath,
    aivenWorkspaceMode,
    sourceLabel: sanitizeText(input?.sourceLabel, defaultSetupProfile.sourceLabel),
    workspaceLabel: sanitizeText(input?.workspaceLabel, defaultSetupProfile.workspaceLabel),
    sourceRoot,
    ...(github ? { github } : {}),
    detectedBehaviors: Array.isArray(input?.detectedBehaviors)
      ? input.detectedBehaviors.filter((item): item is string => typeof item === "string").slice(0, 24)
      : defaultSetupProfile.detectedBehaviors,
    migrationScope: {
      shadowMigration:
        typeof input?.migrationScope?.shadowMigration === "boolean"
          ? input.migrationScope.shadowMigration
          : defaultSetupProfile.migrationScope.shadowMigration,
      scopedDemoCutover:
        typeof input?.migrationScope?.scopedDemoCutover === "boolean"
          ? input.migrationScope.scopedDemoCutover
          : defaultSetupProfile.migrationScope.scopedDemoCutover,
      productionCutover: enumValue(
        input?.migrationScope?.productionCutover,
        productionCutoverModes,
        defaultSetupProfile.migrationScope.productionCutover
      ),
      authMigration: enumValue(input?.migrationScope?.authMigration, adapterModes, defaultSetupProfile.migrationScope.authMigration),
      storageMigration: enumValue(
        input?.migrationScope?.storageMigration,
        adapterModes,
        defaultSetupProfile.migrationScope.storageMigration
      )
    }
  }
}

const isPulseWallDemoRuntimeProfile = (profile: SetupProfile) =>
  profile.sourceKind === "pulsewall_demo" && profile.sourceDataPath === "seeded_demo_data"

const unsupportedDemoRuntimeReason = (profile: SetupProfile) =>
  isPulseWallDemoRuntimeProfile(profile)
    ? undefined
    : "Controlled runtime cutover requires a generated adapter for this source. Aiden can still complete source scanning, Aiven shadow migration, and proof packaging."

const resolveProfileSourceRoot = (profile: SetupProfile) => {
  if (profile.sourceRoot) {
    return isAbsolute(profile.sourceRoot) ? profile.sourceRoot : resolve(repoRoot, profile.sourceRoot)
  }
  if (profile.sourceKind === "pulsewall_demo") return resolve(repoRoot, "demo/pulsewall")
  return undefined
}

const displayPath = (absolutePath?: string) => {
  if (!absolutePath) return "not provided"
  const relativePath = relative(repoRoot, absolutePath)
  return relativePath && !relativePath.startsWith("..") ? relativePath : absolutePath
}

const uniqueById = <T extends { id: string }>(items: T[]) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

const hasEvent = (record: RunRecord, type: string) => record.events.some((event) => event.type === type)
const hasFixtureEvent = (record: RunRecord, type: string) =>
  record.events.some((event) => event.type === type && event.source === "fixture")

const nextMissingFixtureEvent = (record: RunRecord) =>
  fixtureEvents.find((fixtureEvent) => !hasEvent(record, fixtureEvent.type))

const fixtureReceiptTriggers: Record<string, string> = {
  receipt_project_list: "aiven.project.detected",
  receipt_pg_write: "aiven.postgres.verified",
  receipt_pg_read: "mcp.receipt.written",
  receipt_kafka_service: "aiven.kafka.verified",
  receipt_kafka_topic: "aiven.kafka.verified",
  receipt_schema_apply: "migration.schema.applied",
  receipt_app_events: "realtime.postgres_events_bridge.passed",
  receipt_app_events_read: "realtime.postgres_events_bridge.passed",
  receipt_kafka_produce: "kafka.agent_bus_roundtrip.passed",
  receipt_kafka_list: "kafka.agent_bus_roundtrip.passed"
}

const fixtureCheckTriggers: Record<string, string> = {
  check_posts: "migration.rows.validated",
  check_reactions: "migration.rows.validated",
  check_smoke_query: "migration.rows.validated",
  check_receipt_read: "migration.rows.validated",
  check_realtime: "realtime.postgres_events_bridge.passed",
  check_kafka: "kafka.agent_bus_roundtrip.passed",
  check_cutover: "cutover.demo_runtime.ready"
}

const kafkaAgentBusEventTypes = new Set([
  "access.connected",
  "behavior.scan.completed",
  "behavior.graph.generated",
  "migration.manifest.generated",
  "aiven.mcp.agent.probed",
  "aiven.project.detected",
  "aiven.postgres.verified",
  "aiven.kafka.verified",
  "migration.rows.validated",
  "realtime.postgres_events_bridge.passed",
  "adapter.package.generated",
  "adapter.package.validated",
  "cutover.artifact.generated",
  "cutover.pr.opened",
  "cutover.pr.skipped",
  "kafka.agent_bus_roundtrip.passed",
  "cutover.demo_runtime.ready",
  "proof.package.generated"
])

const visibleFixtureReceipts = (record: RunRecord) =>
  receipts.filter((receipt) => {
    const trigger = fixtureReceiptTriggers[receipt.id]
    return trigger ? hasFixtureEvent(record, trigger) : false
  })

const visibleFixtureChecks = (record: RunRecord) =>
  validationChecks.filter((check) => {
    const trigger = fixtureCheckTriggers[check.id]
    return trigger ? hasFixtureEvent(record, trigger) : false
  })

const visibleFixtureKafkaEvents = (record: RunRecord) =>
  fixtureEvents
    .filter((event) => kafkaAgentBusEventTypes.has(event.type) && hasEvent(record, event.type))
    .map((event) => ({
      ...event,
      details: {
        ...event.details,
        topic: "migration.events",
        observed: true,
        source: "fixture"
      }
    }))

const workflowEventsForKafka = (record: RunRecord) =>
  record.events.filter((event) => kafkaAgentBusEventTypes.has(event.type))

const finishRun = (record: RunRecord) => {
  if (record.timer) {
    clearInterval(record.timer)
  }
  record.timer = undefined
  record.status = "complete"
}

const emitFixtureStep = (record: RunRecord) => {
  const event = nextMissingFixtureEvent(record)
  if (!event) {
    finishRun(record)
    return false
  }

  record.events.push(event)
  notify(record.runId, event)
  if (!nextMissingFixtureEvent(record)) {
    finishRun(record)
  }
  return true
}

const detectedLabels = (detected: BehaviorScanResult["detected"]) => {
  const labels: string[] = []
  if (detected.tables.length > 0) labels.push(`tables ${detected.tables.join("/")}`)
  if (detected.realtimeTables.length > 0) labels.push(`realtime ${detected.realtimeTables.join("/")}`)
  if (detected.auth) labels.push("auth")
  if (detected.storageBuckets.length > 0) labels.push(`storage ${detected.storageBuckets.join("/")}`)
  if (detected.rlsTables.length > 0) labels.push(`RLS ${detected.rlsTables.join("/")}`)
  if (detected.edgeFunctions.length > 0) labels.push(`edge functions ${detected.edgeFunctions.join("/")}`)
  if (detected.rpcFunctions.length > 0) labels.push(`RPC ${detected.rpcFunctions.join("/")}`)
  if (detected.triggerFunctions.length > 0) labels.push(`triggers ${detected.triggerFunctions.join("/")}`)
  if (detected.vector) labels.push("pgvector")
  return labels
}

const sourceBehaviorSummary = (detected: BehaviorScanResult["detected"]) => {
  const labels = detectedLabels(detected)
  if (labels.length === 0) return "No Supabase-specific behavior markers were detected in PulseWall."
  return `Detected ${labels.join(", ")}.`
}

const scanEventsFor = (runId: string, scan: BehaviorScanResult): RunEvent[] => [
  {
    runId,
    type: "repo.scan.started",
    agent: "repo_scanner",
    state: "scan_running",
    status: "started",
    source: "live",
    summary: `Scanning ${scan.sourceLabel} source files and Supabase migrations (${scan.filesScanned} files).`,
    details: {
      filesScanned: scan.filesScanned,
      sourceRoot: displayPath(scan.sourceRoot),
      frameworks: scan.evidence.frameworks
    },
    createdAt: scan.createdAt
  },
  {
    runId,
    type: "source.behavior.detected",
    agent: "repo_scanner",
    state: "scan_running",
    status: "ok",
    source: "live",
    summary: sourceBehaviorSummary(scan.detected),
    details: scan.detected,
    createdAt: scan.createdAt
  },
  {
    runId,
    type: "behavior.scan.completed",
    agent: "behavior_mapper",
    state: "behavior_mapped",
    status: "ok",
    source: "live",
    summary: `Behavior graph generated ${scan.findings.length} live findings from ${scan.sourceLabel}.`,
    details: {
      sourceLabel: scan.sourceLabel,
      findingIds: scan.findings.map((finding) => finding.id),
      refsScanned: scan.refsScanned
    },
    createdAt: scan.createdAt
  }
]

const applySourceScan = async (record: RunRecord) => {
  const sourceRoot = resolveProfileSourceRoot(record.setupProfile)
  if (!sourceRoot && record.setupProfile.sourceDataPath === "csv_export") {
    const csvSummary = getConfiguredCsvSourceSummary()
    if (!csvSummary.configured) {
      throw new Error("CSV export files are not configured.")
    }
    const createdAt = now()
    record.behaviorGraph = {
      sourceLabel: record.setupProfile.sourceLabel,
      sourceKind: record.setupProfile.sourceKind,
      framework: [],
      packageManagers: [],
      summary: {
        tables: csvSummary.tables,
        hasAuth: false,
        hasStorage: false,
        hasRealtime: false,
        hasRls: false,
        hasRpc: false,
        hasEdgeFunctions: false,
        hasVector: false
      },
      nodes: [
        ...csvSummary.tables.map((table) => ({
          id: `csv_export:${table}`,
          kind: "csv_export" as const,
          name: table,
          detail: `CSV table export ${table} is available for Aiven shadow row import.`,
          classification: "direct_migrate" as const,
          target: "aiven_postgres" as const,
          dependsOn: [],
          evidence: [{ file: "csv_export", line: 1, match: table }],
          source: "live" as const
        })),
        {
          id: "client_call:adapter_required",
          kind: "client_call" as const,
          name: "adapter_required",
          detail: "CSV export contains rows but not source-code behavior or Supabase call sites.",
          classification: "adapter_required" as const,
          target: "generated_adapter" as const,
          dependsOn: csvSummary.tables.map((table) => `csv_export:${table}`),
          evidence: [{ file: "csv_export", line: 1, match: "headers only" }],
          source: "live" as const
        }
      ],
      readinessScore: 62,
      blockers: [
        {
          id: "csv_source_code_required",
          severity: "warning",
          behaviorNodeId: "client_call:adapter_required",
          title: "Source-code behavior unavailable",
          detail: "CSV exports provide row data but not Supabase client behavior, Auth, Storage, RLS, or route call sites.",
          resolution: "Connect a GitHub repo or Lovable export before claiming runtime adapter coverage.",
          source: "live"
        }
      ],
      source: "live",
      createdAt
    }
    record.behaviorFindings = [
      {
        id: "behavior_csv_tables",
        behavior: "CSV table exports",
        detected: true,
        sourceRefs: csvSummary.tables,
        classification: "direct_migrate",
        target: "Aiven Postgres shadow rows",
        demoTreatment: "Import uploaded CSV rows into Aiven shadow tables and validate row counts.",
        source: "live"
      },
      {
        id: "behavior_csv_adapter_gap",
        behavior: "Application adapter and runtime behavior",
        detected: true,
        sourceRefs: ["CSV headers only"],
        classification: "adapter_required",
        target: "Generated Lovable/Supabase adapter",
        demoTreatment: "Mark adapter generation as required before controlled runtime cutover.",
        source: "live"
      }
    ]
    upsertEvents(record, [
      {
        runId: record.runId,
        type: "repo.scan.started",
        agent: "repo_scanner",
        state: "scan_running",
        status: "started",
        source: "live",
        summary: `Reading ${csvSummary.fileCount} uploaded CSV export file(s) for source-data evidence.`,
        details: csvSummary,
        createdAt
      },
      {
        runId: record.runId,
        type: "source.behavior.detected",
        agent: "repo_scanner",
        state: "scan_running",
        status: "ok",
        source: "live",
        summary: `Detected CSV table exports for ${csvSummary.tables.join(", ")}. Source-code behavior remains unavailable from CSV alone.`,
        details: csvSummary,
        createdAt
      },
      {
        runId: record.runId,
        type: "behavior.scan.completed",
        agent: "behavior_mapper",
        state: "behavior_mapped",
        status: "ok",
        source: "live",
        summary: "CSV evidence graph generated data migration findings and adapter blockers.",
        details: {
          sourceLabel: record.setupProfile.sourceLabel,
          findingIds: record.behaviorFindings.map((finding) => finding.id),
          refsScanned: csvSummary.tables
        },
        createdAt
      }
    ])
    record.migrationManifest = buildMigrationManifest({
      runId: record.runId,
      setupProfile: record.setupProfile,
      graph: record.behaviorGraph,
      sourceDataPath: record.setupProfile.sourceDataPath,
      accessSnapshot: buildAccessSnapshot(record)
    })
    upsertEvents(record, [
      {
        runId: record.runId,
        type: "behavior.graph.generated",
        agent: "behavior_mapper",
        state: "behavior_mapped",
        status: "ok",
        source: "live",
        summary: `Behavior graph generated ${record.behaviorGraph.nodes.length} node(s) from CSV export evidence.`,
        details: {
          sourceLabel: record.setupProfile.sourceLabel,
          nodeCount: record.behaviorGraph.nodes.length,
          readinessScore: record.behaviorGraph.readinessScore
        },
        createdAt
      },
      {
        runId: record.runId,
        type: "migration.manifest.generated",
        agent: "behavior_mapper",
        state: "behavior_mapped",
        status: "ok",
        source: "live",
        summary: "Migration manifest generated for CSV shadow row import and adapter blockers.",
        details: {
          shadowCopyMode: record.migrationManifest.shadowCopy.mode,
          blockerCount: record.migrationManifest.blockers.length
        },
        createdAt
      }
    ])
    return undefined
  }
  if (!sourceRoot) {
    throw new Error(`${record.setupProfile.sourceLabel} does not have a local source root configured for scanning.`)
  }
  const scan = await scanLovableSource({
    sourceRoot,
    sourceLabel: record.setupProfile.sourceLabel
  })
  const graph = buildBehaviorGraph(scan, record.setupProfile)
  record.behaviorGraph = graph
  record.behaviorFindings = behaviorFindingsFromGraph(graph)
  record.migrationManifest = buildMigrationManifest({
    runId: record.runId,
    setupProfile: record.setupProfile,
    graph,
    sourceDataPath: record.setupProfile.sourceDataPath,
    accessSnapshot: buildAccessSnapshot(record)
  })
  upsertEvents(record, scanEventsFor(record.runId, scan))
  upsertEvents(record, [
    {
      runId: record.runId,
      type: "behavior.graph.generated",
      agent: "behavior_mapper",
      state: "behavior_mapped",
      status: "ok",
      source: "live",
      summary: `Behavior graph generated ${graph.nodes.length} node(s) with ${graph.blockers.length} blocker(s).`,
      details: {
        sourceLabel: graph.sourceLabel,
        nodeCount: graph.nodes.length,
        blockerCount: graph.blockers.length,
        readinessScore: graph.readinessScore
      },
      createdAt: graph.createdAt
    },
    {
      runId: record.runId,
      type: "migration.manifest.generated",
      agent: "behavior_mapper",
      state: "behavior_mapped",
      status: "ok",
      source: "live",
      summary: `Migration manifest generated for ${record.migrationManifest.shadowCopy.mode}.`,
      details: {
        shadowCopyMode: record.migrationManifest.shadowCopy.mode,
        directTables: record.migrationManifest.directMigrate.tables,
        adapterRequired: record.migrationManifest.adapterRequired,
        blockerCount: record.migrationManifest.blockers.length
      },
      createdAt: record.migrationManifest.createdAt
    }
  ])
  return scan
}

const getRecord = (runId: string): RunRecord => {
  const existing = runs.get(runId)
  if (existing) return existing

  const record: RunRecord = {
    runId,
    status: "idle",
    setupProfile: defaultSetupProfile,
    events: [],
    kafkaEvents: [],
    proofSource: "fixture",
    behaviorFindings: [],
    generatedArtifacts: [],
    cutoverArtifacts: [],
    receipts: [],
    validationChecks: [],
    rowValidations: []
  }
  runs.set(runId, record)
  return record
}

const notify = (runId: string, event: RunEvent) => {
  const runListeners = listeners.get(runId)
  if (!runListeners) return
  for (const listener of runListeners) {
    listener(event)
  }
}

export const createRun = (input?: { setupProfile?: Partial<SetupProfile> }) => {
  const record = getRecord(fixtureRunId)
  if (record.timer) {
    clearInterval(record.timer)
  }
  record.status = "idle"
  record.setupProfile = normalizeSetupProfile(input?.setupProfile)
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorGraph = undefined
  record.behaviorFindings = []
  record.migrationManifest = undefined
  record.generatedArtifacts = []
  record.cutoverArtifacts = []
  record.receipts = []
  record.validationChecks = []
  record.rowValidations = []
  record.timer = undefined
  return getSnapshot(record.runId)
}

export const startFixtureRun = async (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
  }
  const existingLiveScanEvents = record.events.filter(
    (event) =>
      event.source === "live" &&
      ["repo.scan.started", "source.behavior.detected", "behavior.scan.completed"].includes(event.type)
  )
  const existingBehaviorFindings = record.behaviorFindings
  const existingBehaviorGraph = record.behaviorGraph
  const existingMigrationManifest = record.migrationManifest

  record.status = "running"
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorGraph = existingBehaviorGraph
  record.behaviorFindings = existingBehaviorFindings
  record.migrationManifest = existingMigrationManifest
  record.generatedArtifacts = []
  record.cutoverArtifacts = []
  record.receipts = []
  record.validationChecks = []
  record.rowValidations = []

  emitFixtureStep(record)

  if (existingLiveScanEvents.length === 3 && existingBehaviorFindings.length > 0) {
    upsertEvents(record, existingLiveScanEvents)
  } else {
    try {
      await applySourceScan(record)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      upsertEvents(record, [
        {
          runId,
          type: "behavior.scan.completed",
          agent: "behavior_mapper",
          state: "failed",
          status: "failed",
          source: "live",
          summary: `Source scanner failed: ${message}`,
          createdAt: new Date().toISOString()
        }
      ])
      record.status = "failed"
      return getSnapshot(runId)
    }
  }

  const emitNext = () => {
    emitFixtureStep(record)
  }

  if (nextMissingFixtureEvent(record)) {
    record.timer = setInterval(emitNext, 650)
  }

  return getSnapshot(runId)
}

export const advanceRun = (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  record.status = "running"
  emitFixtureStep(record)
  if (fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type))) {
    record.status = "complete"
  }
  return getSnapshot(runId)
}

export const pauseRun = (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  return getSnapshot(runId)
}

export const resetRun = (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
  }
  record.status = "idle"
  record.setupProfile = normalizeSetupProfile(record.setupProfile)
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorGraph = undefined
  record.behaviorFindings = []
  record.migrationManifest = undefined
  record.generatedArtifacts = []
  record.cutoverArtifacts = []
  record.receipts = []
  record.validationChecks = []
  record.rowValidations = []
  record.timer = undefined
  return getSnapshot(runId)
}

const upsertEvents = (record: RunRecord, nextEvents: RunEvent[]) => {
  for (const event of nextEvents) {
    const existingIndex = record.events.findIndex((existing) => existing.type === event.type)
    if (existingIndex >= 0) {
      record.events[existingIndex] = event
    } else {
      record.events.push(event)
    }
    notify(record.runId, event)
  }
}

const mergeProofSource = (current: ProofSource, next: ProofSource): ProofSource => {
  if (current === "live" || next === "live") return "live"
  if (current === "cached" || next === "cached") return "cached"
  return "fixture"
}

const now = () => new Date().toISOString()

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const safeError = (error: unknown) => {
  let message = error instanceof Error ? error.message : String(error)
  const freshPostgresUrl = readEnv("AIDEN_FRESH_AIVEN_POSTGRES_URL")
  if (freshPostgresUrl) message = message.split(freshPostgresUrl).join("[AIDEN_FRESH_AIVEN_POSTGRES_URL]")
  const postgresUrl = readEnv("AIVEN_POSTGRES_URL")
  if (postgresUrl) message = message.split(postgresUrl).join("[AIVEN_POSTGRES_URL]")
  return message.slice(0, 360)
}

const receipt = (
  runId: string,
  input: Omit<AivenReceipt, "id" | "runId" | "createdAt"> & { idPrefix: string }
): AivenReceipt => {
  const details =
    input.source === "live"
      ? {
          controlPlane: "direct_aiven_fallback",
          fallbackFor: "aiven_mcp",
          ...(input.details ?? {})
        }
      : input.details
  return {
    id: `${input.idPrefix}_${randomUUID().slice(0, 8)}`,
    runId,
    agent: input.agent,
    intent: input.intent,
    tool: input.tool,
    target: input.target,
    risk: input.risk,
    result: input.result,
    rollback: input.rollback,
    details,
    source: input.source,
    createdAt: now()
  }
}

const check = (
  runId: string,
  input: Omit<ValidationCheck, "id" | "runId" | "createdAt"> & { idPrefix: string }
): ValidationCheck => ({
  id: `${input.idPrefix}_${randomUUID().slice(0, 8)}`,
  runId,
  checkName: input.checkName,
  status: input.status,
  details: input.details,
  source: input.source,
  createdAt: now()
})

const artifactId = (prefix: string) => `${prefix}_${randomUUID().slice(0, 8)}`

const sourceDbConfigured = () => Boolean(readEnv("SOURCE_SUPABASE_DB_URL") ?? readEnv("SOURCE_POSTGRES_URL"))
const sourceTablesConfigured = () => Boolean(readEnv("SOURCE_SUPABASE_TABLES") ?? readEnv("SOURCE_POSTGRES_TABLES"))

const statusCanGraduate = (status: AccessCheck["status"]) =>
  status === "ready" || status === "connected" || status === "live_verified"

const liveEventOk = (record: RunRecord, type: string) =>
  record.events.some((event) => event.type === type && event.source === "live" && event.status === "ok")

const liveCheckPassed = (record: RunRecord, checkName: string) =>
  record.validationChecks.some((candidate) => candidate.checkName === checkName && candidate.source === "live" && candidate.status === "passed")

const buildAccessSnapshot = (record: RunRecord): AccessSnapshot => {
  const sourceRoot = resolveProfileSourceRoot(record.setupProfile)
  const csvSummary = getConfiguredCsvSourceSummary()
  const csvSourceDataReady = record.setupProfile.sourceDataPath === "csv_export" && csvSummary.configured
  const sourceAvailable = csvSourceDataReady || Boolean(sourceRoot && existsSync(sourceRoot))
  const codexMcpConfigured = existsSync(resolve(repoRoot, ".codex/config.toml"))
  const rawMcpConfigured = existsSync(resolve(repoRoot, ".mcp.json"))
  const aivenMcpRuntime = readAivenMcpRuntimeConfig()
  const mcpConfigured = aivenMcpRuntime.enabled
  const freshProvisioningConfigured = canProvisionFreshAivenTarget()
  const activeTarget = getActiveAivenTargetSummary()
  const aivenProject = readEnv("AIVEN_PROJECT")
  const aivenPostgresService = activeTarget.postgresService
  const postgresConfigured = hasActiveAivenPostgresTarget()
  const requestedFreshWorkspaceMode = record.setupProfile.aivenWorkspaceMode === "create_new"
  const freshWorkspaceMode = requestedFreshWorkspaceMode && freshProvisioningConfigured && !postgresConfigured
  const aivenAccountReady = freshWorkspaceMode ? freshProvisioningConfigured : mcpConfigured || postgresConfigured
  const aivenProjectReady = freshWorkspaceMode ? freshProvisioningConfigured : Boolean(aivenProject) || postgresConfigured
  const seededDataPath = record.setupProfile.sourceDataPath === "seeded_demo_data"
  const demoAdapterSupported = isPulseWallDemoRuntimeProfile(record.setupProfile)
  const githubSource = record.setupProfile.sourceKind === "github_repo" ? record.setupProfile.github : undefined
  const genericSourceDataReady = !seededDataPath && sourceDbConfigured() && sourceTablesConfigured()
  const kafkaConfigured = hasActiveAivenKafkaTarget()
  const livePostgresVerified =
    liveEventOk(record, "aiven.postgres.verified") ||
    liveEventOk(record, "migration.rows.validated") ||
    liveEventOk(record, "cutover.demo_runtime.ready") ||
    liveCheckPassed(record, "aiven_postgres_receipt_readback") ||
    liveCheckPassed(record, "aiven_postgres_smoke_query") ||
    liveCheckPassed(record, "scoped_demo_runtime_smoke_test")
  const liveKafkaVerified =
    liveEventOk(record, "kafka.agent_bus_roundtrip.passed") || liveCheckPassed(record, "kafka_agent_bus_roundtrip")

  const checks: AccessCheck[] = [
    {
      id: "repo_source",
      label: "Source app import",
      scope: csvSourceDataReady ? "Read exported table data" : "Read Lovable/Supabase behavior",
      minimumPermission: githubSource
        ? "GitHub App repository contents: read"
        : record.setupProfile.sourceKind === "pulsewall_demo"
          ? "read managed PulseWall profile"
          : csvSourceDataReady
            ? "uploaded CSV files with headers"
            : "read selected source export",
      status: sourceAvailable ? "ready" : "blocked",
      source: sourceAvailable ? "live" : "cached",
      requiredForGraduate: true,
      proof: sourceAvailable
        ? csvSourceDataReady
          ? `${record.setupProfile.sourceLabel} has ${csvSummary.fileCount} CSV export file(s) staged for shadow migration.`
          : `${record.setupProfile.sourceLabel} is readable at ${displayPath(sourceRoot)}.`
        : `${record.setupProfile.sourceLabel} source path is missing or not configured.`,
      safeToShowDetails: {
        sourceKind: record.setupProfile.sourceKind,
        sourceRoot: displayPath(sourceRoot),
        csv: csvSourceDataReady ? csvSummary : undefined,
        github: githubSource
          ? {
              fullName: githubSource.fullName,
              repositoryId: githubSource.repositoryId,
              defaultBranch: githubSource.defaultBranch,
              ref: githubSource.ref,
              commitSha: githubSource.commitSha
            }
          : undefined
      }
    },
    {
      id: "source_data",
      label: "Source data path",
      scope: demoAdapterSupported ? "Managed source data" : csvSourceDataReady ? "CSV export upload" : "Selected source data path",
      minimumPermission: demoAdapterSupported
        ? "read managed PulseWall data"
        : csvSourceDataReady
          ? "CSV files uploaded through setup"
          : "source DB URL and table allowlist",
      status: demoAdapterSupported || genericSourceDataReady || csvSourceDataReady ? "ready" : "blocked",
      source: demoAdapterSupported ? "fixture" : genericSourceDataReady || csvSourceDataReady ? "cached" : "cached",
      requiredForGraduate: true,
      proof: demoAdapterSupported
        ? `Managed ${record.setupProfile.sourceLabel} dataset is available for validation.`
        : csvSourceDataReady
          ? `${csvSummary.fileCount} CSV export file(s) are staged for Aiven shadow row copy.`
        : genericSourceDataReady
          ? `${record.setupProfile.sourceDataPath} is configured for generic Aiven shadow row copy.`
          : githubSource
            ? `GitHub repository access covers source code only. ${record.setupProfile.sourceDataPath} still needs SOURCE_SUPABASE_DB_URL and SOURCE_SUPABASE_TABLES for row copy.`
          : seededDataPath
            ? `Managed source data is only wired for the PulseWall managed profile. ${unsupportedDemoRuntimeReason(record.setupProfile)}`
            : `${record.setupProfile.sourceDataPath} needs SOURCE_SUPABASE_DB_URL and SOURCE_SUPABASE_TABLES before generic source data copy can run.`,
      safeToShowDetails: {
        sourceKind: record.setupProfile.sourceKind,
        sourceDataPath: record.setupProfile.sourceDataPath,
        sourceDbConfigured: sourceDbConfigured(),
        sourceTablesConfigured: sourceTablesConfigured(),
        csv: csvSummary
      }
    },
    {
      id: "aiven_mcp",
      label: "Aiven account access",
      scope: "Account/project permission",
      minimumPermission: freshWorkspaceMode
        ? "Aiven API token with service create/read"
        : "Aiven MCP config or existing Aiven Postgres connection",
      status: aivenAccountReady ? "connected" : "blocked",
      source: freshProvisioningConfigured ? "live" : "cached",
      requiredForGraduate: true,
      proof: freshWorkspaceMode
        ? freshProvisioningConfigured
          ? `${record.setupProfile.workspaceLabel} can create fresh Aiven services in the selected project.`
          : "AIVEN_TOKEN and AIVEN_PROJECT are required before Aiden can create the fresh Aiven landing zone."
        : aivenAccountReady
          ? `${record.setupProfile.workspaceLabel} can use the connected Aiven Postgres target for shadow migration.`
          : "Connect an Aiven Postgres target or provide Aiven account access before graduation.",
      safeToShowDetails: {
        workspaceMode: record.setupProfile.aivenWorkspaceMode,
        runtimeControlPlane: freshWorkspaceMode ? "aiven_rest_api_fresh_provisioning" : "existing_aiven_postgres_target",
        mcpServer: aivenMcpRuntime.serverName,
        mcpConfigSource: aivenMcpRuntime.source,
        mcpEndpointConfigured: mcpConfigured,
        codexConfigPresentForDeveloperTools: codexMcpConfigured,
        rawDescriptorPresentForOtherClients: rawMcpConfigured
      }
    },
    {
      id: "aiven_project",
      label: "Aiven project",
      scope: freshWorkspaceMode ? "Project selected for fresh service creation" : "Project or service selected for existing target",
      minimumPermission: freshWorkspaceMode ? "create service in selected project" : "read/write selected Aiven Postgres target",
      status: aivenProjectReady ? "connected" : "blocked",
      source: freshProvisioningConfigured ? "live" : "cached",
      requiredForGraduate: true,
      proof: freshWorkspaceMode
        ? freshProvisioningConfigured && aivenProject
          ? "Aiven project is selected; Aiden will create a new target service during graduation."
          : "AIVEN_PROJECT is missing."
        : aivenProjectReady
          ? `Existing Aiven target ${aivenPostgresService ?? "connection"} is selected for this run.`
          : "Select an Aiven project/service or provide an Aiven Postgres URL.",
      safeToShowDetails: {
        project: aivenProject ?? null,
        postgresService: aivenPostgresService ?? (freshWorkspaceMode ? "created during graduation" : "connection string target"),
        freshPostgresCreated: activeTarget.freshPostgresCreated
      }
    },
    {
      id: "aiven_postgres",
      label: freshWorkspaceMode ? "Fresh Postgres runtime" : "Aiven Postgres runtime",
      scope: freshWorkspaceMode ? "Create fresh service, then shadow schema write/read" : "Shadow schema write/read on connected target",
      minimumPermission: freshWorkspaceMode ? "create service and safe write/read on shadow tables" : "safe write/read on shadow tables",
      status: livePostgresVerified ? "live_verified" : postgresConfigured || freshProvisioningConfigured ? "ready" : "blocked",
      source: livePostgresVerified ? "live" : "cached",
      requiredForGraduate: true,
      proof: postgresConfigured
        ? livePostgresVerified
          ? `Aiven Postgres ${aivenPostgresService ?? "target"} was verified in this run.`
          : `Aiven Postgres ${aivenPostgresService ?? "target"} is configured; live write/read proof runs during migration.`
        : freshProvisioningConfigured
          ? "Aiden will create a fresh Aiven Postgres service during graduation."
          : "Aiven Postgres target access is missing.",
      safeToShowDetails: {
        freshPostgresCreated: activeTarget.freshPostgresCreated,
        serviceName: aivenPostgresService,
        liveProofObserved: livePostgresVerified,
        existingTargetsAllowed: activeTarget.existingTargetsAllowed
      }
    },
    {
      id: "aiven_kafka",
      label: "Aiven Kafka event path",
      scope: "Agent bus / production event path",
      minimumPermission: "produce/consume migration.events",
      status: kafkaConfigured ? (liveKafkaVerified ? "live_verified" : "connected") : "warning",
      source: liveKafkaVerified ? "live" : "cached",
      requiredForGraduate: false,
      proof: kafkaConfigured
        ? liveKafkaVerified
          ? "Kafka migration.events roundtrip has been observed in this run."
          : "Kafka workspace path is configured; roundtrip proof can run as a sponsor-visible check."
        : "Kafka is optional for this demo; browser-critical realtime uses Aiven Postgres app_events.",
      safeToShowDetails: {
        topic: "migration.events",
        configured: kafkaConfigured,
        liveProofObserved: liveKafkaVerified,
        existingTargetsAllowed: activeTarget.existingTargetsAllowed
      }
    },
    {
      id: "demo_adapter",
      label: "Local Aiden adapter",
      scope: "Controlled runtime path",
      minimumPermission: demoAdapterSupported ? "switch local provider boundary" : "generated adapter for selected source",
      status: demoAdapterSupported ? "ready" : "later",
      source: demoAdapterSupported ? "live" : "cached",
      requiredForGraduate: demoAdapterSupported,
      proof: demoAdapterSupported
        ? "Local adapter can switch the controlled runtime after Aiven Postgres checks pass."
        : `${unsupportedDemoRuntimeReason(record.setupProfile)}`,
      safeToShowDetails: {
        productionAppChanged: false,
        adapterSupportedForProfile: demoAdapterSupported
      }
    },
    {
      id: "production_auth",
      label: "Production Auth adapter",
      scope: "Explicit future setup",
      minimumPermission: "not requested",
      status: "later",
      source: "fixture",
      requiredForGraduate: false,
      proof: "Production auth migration is intentionally outside the scoped demo runtime."
    },
    {
      id: "production_storage",
      label: "Production Storage adapter",
      scope: "Object-store adapter later",
      minimumPermission: "not requested",
      status: "later",
      source: "fixture",
      requiredForGraduate: false,
      proof: "Production storage migration is intentionally outside the scoped demo runtime."
    },
    {
      id: "production_cutover",
      label: "Production cutover",
      scope: "Requires separate approval",
      minimumPermission: "not requested",
      status: "not_requested",
      source: "fixture",
      requiredForGraduate: false,
      proof: "Aiden will not change the production app in this demo."
    }
  ]

  const blockers = checks
    .filter((checkItem) => checkItem.requiredForGraduate && !statusCanGraduate(checkItem.status))
    .map((checkItem) => checkItem.label)
  const warnings = checks.filter((checkItem) => checkItem.status === "warning").map((checkItem) => checkItem.proof)

  return {
    runId: record.runId,
    mode: blockers.length === 0 ? "shadow_migration" : "cached",
    canGraduate: blockers.length === 0,
    blockers,
    warnings,
    checks,
    createdAt: now()
  }
}

const accessEventFor = (accessSnapshot: AccessSnapshot): RunEvent => {
  const postgresCheck = accessSnapshot.checks.find((checkItem) => checkItem.id === "aiven_postgres")
  const hasLivePostgresProof = postgresCheck?.status === "live_verified"
  const source: ProofSource = accessSnapshot.canGraduate && hasLivePostgresProof ? "live" : accessSnapshot.canGraduate ? "cached" : "cached"
  return {
    runId: accessSnapshot.runId,
    type: "access.connected",
    agent: "access_broker",
    state: accessSnapshot.canGraduate ? "access_connected" : "failed",
    status: accessSnapshot.canGraduate ? "ok" : "failed",
    source,
    summary: accessSnapshot.canGraduate
      ? hasLivePostgresProof
        ? "Aiven workspace setup verified source evidence and a fresh Aiven Postgres runtime created for this run."
        : "Aiven workspace setup verified account/project access; fresh Aiven Postgres will be created during migration."
      : `Aiven workspace setup blocked graduation because required setup is missing: ${accessSnapshot.blockers.join(", ")}.`,
    details: {
      canGraduate: accessSnapshot.canGraduate,
      blockers: accessSnapshot.blockers,
      warnings: accessSnapshot.warnings,
      checks: accessSnapshot.checks.map((checkItem) => ({
        id: checkItem.id,
        status: checkItem.status,
        source: checkItem.source,
        requiredForGraduate: checkItem.requiredForGraduate
      }))
    },
    createdAt: accessSnapshot.createdAt
  }
}

const snapshotEvent = (snapshot: RunSnapshot, type: string) =>
  snapshot.events.find((event) => event.type === type)

const eventIs = (snapshot: RunSnapshot, type: string, source: ProofSource, status: RunEvent["status"]) => {
  const event = snapshotEvent(snapshot, type)
  return Boolean(event && event.source === source && event.status === status)
}

const hasFailedEvent = (snapshot: RunSnapshot) => snapshot.events.some((event) => event.status === "failed")

const stepResult = (
  context: AgentRunContext,
  snapshot: RunSnapshot,
  input: {
    ok: boolean
    summary: string
    blocking?: boolean
  }
) => ({
  ok: input.ok,
  source: snapshot.mode,
  summary: input.summary,
  blocking: input.blocking ?? (context.mode === "live_pg" && !input.ok),
  snapshot
})

const oneClickFailure = (runId: string, stepLabel: string, reason: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  upsertEvents(record, [
    {
      runId,
      type: "proof.package.generated",
      agent: "report_agent",
      state: "failed",
      status: "failed",
      source: record.proofSource === "fixture" ? "cached" : record.proofSource,
      summary: `One-click migration stopped at ${stepLabel}: ${reason}`,
      details: { stepLabel, reason },
      createdAt: now()
    }
  ])
  record.status = "failed"
  return getSnapshot(runId)
}

const applyAccessPreflight = (record: RunRecord) => {
  const accessSnapshot = buildAccessSnapshot(record)
  const accessEvent = accessEventFor(accessSnapshot)
  upsertEvents(record, [accessEvent])
  record.proofSource = mergeProofSource(record.proofSource, accessEvent.source)
  return accessSnapshot
}

export const runAccessPreflight = (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  const accessSnapshot = applyAccessPreflight(record)
  if (!accessSnapshot.canGraduate) {
    record.status = "failed"
  } else if (fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type))) {
    record.status = "complete"
  } else {
    record.status = "idle"
  }
  return getSnapshot(runId)
}

const annotateAccessForOneClick = (
  record: RunRecord,
  mode: AgentRunContext["mode"],
  reasonerSelection: AgentReasonerSelection
) => {
  const accessSnapshot = applyAccessPreflight(record)
  const accessEvent = record.events.find((event) => event.type === "access.connected")
  if (accessEvent) {
    accessEvent.details = {
      ...accessEvent.details,
      mode,
      reasoner: reasonerSelection.id,
      reasonerModel: reasonerSelection.model
    }
  }
  return accessSnapshot
}

const runAivenMcpAgentProbe = async (record: RunRecord) => {
  const activeTarget = getActiveAivenTargetSummary()
  const result = await runAivenMcpOperatorProbe({
    runId: record.runId,
    sourceLabel: record.setupProfile.sourceLabel,
    workspaceLabel: record.setupProfile.workspaceLabel,
    project: readEnv("AIVEN_PROJECT"),
    postgresService: activeTarget.postgresService ?? undefined,
    kafkaService: activeTarget.kafkaService ?? undefined
  })
  const observedTool = result.observedToolUses[0] ?? "anthropic_agent_sdk"
  const createdAt = now()

  upsertEvents(record, [
    {
      runId: record.runId,
      type: "aiven.mcp.agent.probed",
      agent: "aiven_operator",
      state: "aiven_shadow_ready",
      status: result.ok ? "ok" : "skipped",
      source: result.source,
      summary: result.summary,
      details: {
        agentRuntime: "anthropic_agent_sdk",
        controlPlane: "anthropic_agent_sdk_aiven_mcp",
        launched: result.launched,
        reasoner: result.reasoner,
        requestedReasoner: result.requestedReasoner,
        model: result.model,
        fallback: result.fallback,
        error: result.error,
        observedToolUses: result.observedToolUses,
        allowedTools: result.allowedTools,
        text: result.text
      },
      createdAt
    }
  ])

  record.receipts = [
    ...record.receipts,
    receipt(record.runId, {
      idPrefix: result.ok ? "receipt_aiven_mcp_agent_probe" : "receipt_aiven_mcp_agent_probe_skipped",
      agent: "aiven_operator",
      intent: result.ok
        ? "inspect Aiven control-plane context through Agent SDK MCP"
        : "launch Aiven Operator Agent MCP probe",
      tool: observedTool,
      target: "aiven_workspace",
      risk: "read_only",
      result: result.ok ? "ok" : "cached",
      source: result.source,
      details: {
        controlPlane: "anthropic_agent_sdk_aiven_mcp",
        fallbackFor: undefined,
        agentRuntime: "anthropic_agent_sdk",
        observedToolUses: result.observedToolUses,
        fallback: result.fallback,
        error: result.error
      }
    })
  ]

  record.validationChecks = [
    ...record.validationChecks,
    check(record.runId, {
      idPrefix: result.ok ? "check_aiven_mcp_agent_probe" : "check_aiven_mcp_agent_probe_skipped",
      checkName: "aiven_mcp_agent_probe",
      status: result.ok ? "passed" : "skipped",
      source: result.source,
      details: {
        launched: result.launched,
        observedToolUses: result.observedToolUses,
        allowedTools: result.allowedTools,
        fallback: result.fallback,
        error: result.error
      }
    })
  ]
  record.proofSource = mergeProofSource(record.proofSource, result.source)
}

export const runProofSpine = async (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  record.status = "running"

  await runAivenMcpAgentProbe(record)
  const result = await runAivenProofSpine(runId)

  upsertEvents(record, result.events)
  record.receipts = [...record.receipts, ...result.receipts]
  record.validationChecks = [...record.validationChecks, ...result.checks]
  record.proofSource = mergeProofSource(record.proofSource, result.source)
  if (result.events.some((event) => event.status === "failed")) {
    record.status = "failed"
  } else if (fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type))) {
    record.status = "complete"
  } else {
    record.status = "running"
  }

  return getSnapshot(runId)
}

export const runSourceScan = async (runId: string) => {
  const record = getRecord(runId)
  const timerWasActive = Boolean(record.timer)
  record.status = "running"

  try {
    await applySourceScan(record)

    if (fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type))) {
      record.status = "complete"
    } else if (timerWasActive) {
      record.status = "running"
    } else {
      record.status = "complete"
    }
  } catch (error) {
    if (record.timer) {
      clearInterval(record.timer)
      record.timer = undefined
    }
    const message = error instanceof Error ? error.message : String(error)
    upsertEvents(record, [
      {
        runId,
        type: "behavior.scan.completed",
        agent: "behavior_mapper",
        state: "failed",
        status: "failed",
        source: "live",
        summary: `Source scanner failed: ${message}`,
        createdAt: new Date().toISOString()
      }
    ])
    record.status = "failed"
  }

  return getSnapshot(runId)
}

export const runDataMigration = async (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  record.status = "running"

  const result = await runAivenDataMigration(runId, { setupProfile: record.setupProfile })
  upsertEvents(record, result.events)
  record.receipts = [...record.receipts, ...result.receipts]
  record.validationChecks = [...record.validationChecks, ...result.checks]
  record.rowValidations = result.rowValidations
  record.proofSource = mergeProofSource(record.proofSource, result.source)

  if (!result.ok && result.events.some((event) => event.status === "failed")) {
    record.status = "failed"
  } else if (fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type))) {
    record.status = "complete"
  } else {
    record.status = "running"
  }

  return getSnapshot(runId)
}

export const runKafkaAgentBus = async (runId: string) => {
  const record = getRecord(runId)
  const timerWasActive = Boolean(record.timer)
  record.status = "running"

  const result = await runKafkaAgentBusProof(runId, workflowEventsForKafka(record))

  upsertEvents(record, result.events)
  record.kafkaEvents = result.kafkaEvents
  record.receipts = [...record.receipts, ...result.receipts]
  record.validationChecks = [...record.validationChecks, ...result.checks]
  record.proofSource = mergeProofSource(record.proofSource, result.source)

  if (result.events.some((event) => event.status === "failed") || result.kafkaEvents.some((event) => event.status === "failed")) {
    record.status = "failed"
  } else if (fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type))) {
    record.status = "complete"
  } else if (timerWasActive) {
    record.status = "running"
  } else {
    record.status = "complete"
  }

  return getSnapshot(runId)
}

export const runProviderCutover = async (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  record.status = "running"

  const unsupportedRuntime = unsupportedDemoRuntimeReason(record.setupProfile)
  if (unsupportedRuntime) {
    upsertEvents(record, [
      {
        runId,
        type: "realtime.postgres_events_bridge.passed",
        agent: "compatibility_surgeon",
        state: "realtime_validated",
        status: "skipped",
        source: "cached",
        summary: `Realtime cutover is waiting for adapter generation: ${unsupportedRuntime}`,
        details: {
          sourceKind: record.setupProfile.sourceKind,
          sourceDataPath: record.setupProfile.sourceDataPath
        },
        createdAt: now()
      },
      {
        runId,
        type: "cutover.demo_runtime.ready",
        agent: "cutover_manager",
        state: "demo_cutover_complete",
        status: "skipped",
        source: "cached",
        summary: `Controlled runtime cutover is waiting for adapter generation: ${unsupportedRuntime}`,
        details: {
          requiredAdapter: "manifest_generated_adapter",
          existingAdapter: "pulsewall_adapter"
        },
        createdAt: now()
      }
    ])
    record.validationChecks = [
      ...record.validationChecks,
      check(runId, {
        idPrefix: "check_generic_cutover_blocked",
        checkName: "scoped_demo_runtime_smoke_test",
        status: "skipped",
        source: "cached",
        details: {
          reason: unsupportedRuntime,
          sourceKind: record.setupProfile.sourceKind
        }
      })
    ]
    record.proofSource = mergeProofSource(record.proofSource, "cached")
    record.status = fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type)) ? "complete" : "running"
    return getSnapshot(runId)
  }

  if (!canUseAivenProvider()) {
    const missingEnv = ["AIDEN_FRESH_AIVEN_POSTGRES_URL or AIVEN_POSTGRES_URL"]
    const events: RunEvent[] = [
      {
        runId,
        type: "realtime.postgres_events_bridge.passed",
        agent: "compatibility_surgeon",
        state: "realtime_validated",
        status: "skipped",
        source: "cached",
        summary: `Aiven Postgres app_events browser polling skipped; missing ${missingEnv.join(", ")}.`,
        details: { missingEnv, endpoint: "/api/events/recent" },
        createdAt: now()
      },
      {
        runId,
        type: "cutover.demo_runtime.ready",
        agent: "cutover_manager",
        state: "demo_cutover_complete",
        status: "skipped",
        source: "cached",
        summary: `Scoped Aiven adapter cutover skipped; missing ${missingEnv.join(", ")}.`,
        details: { missingEnv, provider: "aivenProvider" },
        createdAt: now()
      }
    ]
    upsertEvents(record, events)
    record.receipts = [
      ...record.receipts,
      receipt(runId, {
        idPrefix: "receipt_cutover_read_cached",
        agent: "cutover_manager",
        intent: "read migrated posts through local adapter",
        tool: "aiven_pg_read",
        target: "posts",
        risk: "read_only",
        result: "cached",
        source: "cached",
        details: { missingEnv }
      }),
      receipt(runId, {
        idPrefix: "receipt_cutover_event_cached",
        agent: "compatibility_surgeon",
        intent: "write reaction and app_events row through local adapter",
        tool: "aiven_pg_write",
        target: "reactions,app_events",
        risk: "safe_write",
        result: "cached",
        source: "cached",
        details: { missingEnv }
      })
    ]
    record.validationChecks = [
      ...record.validationChecks,
      check(runId, {
        idPrefix: "check_realtime_cached",
        checkName: "postgres_events_browser_polling",
        status: "skipped",
        source: "cached",
        details: { endpoint: "/api/events/recent", delivered: false, missingEnv }
      }),
      check(runId, {
        idPrefix: "check_cutover_cached",
        checkName: "scoped_demo_runtime_smoke_test",
        status: "skipped",
        source: "cached",
        details: { provider: "aivenProvider", supabaseRuntimePath: "unchanged", missingEnv }
      })
    ]
    record.proofSource = mergeProofSource(record.proofSource, "cached")
    record.status = fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type)) ? "complete" : "running"
    return getSnapshot(runId)
  }

  try {
    const provider = createAivenPulseWallProvider({ runId })
    const posts = await provider.listPosts()
    const post = posts[0]
    if (!post) {
      throw new Error("Aiven provider returned no posts; run data migration before cutover")
    }

    await provider.addReaction({ postId: post.id, emoji: "rocket", userId: "demo_user_001" })
    const [nextPosts, events, leaderboard] = await Promise.all([
      provider.listPosts(),
      provider.listRecentEvents({ limit: 10 }),
      provider.getLeaderboard()
    ])
    const deliveredEvent = events.find((event) => event.payload.postId === post.id)
    if (!deliveredEvent) {
      throw new Error("Aiven provider wrote a reaction but /api/events/recent did not return the app_events row")
    }
    if (nextPosts.length === 0 || leaderboard.length === 0) {
      throw new Error("Aiven provider read smoke test returned empty posts or leaderboard")
    }

    switchToAivenProvider(runId)

    upsertEvents(record, [
      {
        runId,
        type: "realtime.postgres_events_bridge.passed",
        agent: "compatibility_surgeon",
        state: "realtime_validated",
        status: "ok",
        source: "live",
        summary: "Aiven Postgres app_events delivered a reaction event through /api/events/recent polling.",
        details: {
          endpoint: "/api/events/recent",
          postId: post.id,
          eventId: deliveredEvent.id,
          eventsRead: events.length
        },
        createdAt: now()
      },
      {
        runId,
        type: "cutover.demo_runtime.ready",
        agent: "cutover_manager",
        state: "demo_cutover_complete",
        status: "ok",
        source: "live",
        summary: "Scoped demo runtime is now reading and writing through the local Aiden adapter backed by Aiven Postgres.",
        details: {
          provider: "aivenProvider",
          postsRead: nextPosts.length,
          leaderboardRows: leaderboard.length,
          supabaseRuntimePath: "unused"
        },
        createdAt: now()
      }
    ])

    record.receipts = [
      ...record.receipts,
      receipt(runId, {
        idPrefix: "receipt_cutover_read_live",
        agent: "cutover_manager",
        intent: "read migrated posts through local adapter",
        tool: "aiven_pg_read",
        target: "posts",
        risk: "read_only",
        result: "ok",
        source: "live",
        details: { postsRead: nextPosts.length, topPostId: post.id }
      }),
      receipt(runId, {
        idPrefix: "receipt_cutover_event_live",
        agent: "compatibility_surgeon",
        intent: "write reaction and app_events row through local adapter",
        tool: "aiven_pg_write",
        target: "reactions,app_events",
        risk: "safe_write",
        result: "ok",
        rollback: "delete reaction_runtime_* rows and matching app_event_runtime_* rows",
        source: "live",
        details: { postId: post.id, eventId: deliveredEvent.id }
      }),
      receipt(runId, {
        idPrefix: "receipt_cutover_event_read_live",
        agent: "validation_auditor",
        intent: "read recent app_events through local adapter",
        tool: "aiven_pg_read",
        target: "app_events_recent",
        risk: "read_only",
        result: "ok",
        source: "live",
        details: { eventsRead: events.length, deliveredEventId: deliveredEvent.id }
      })
    ]
    record.validationChecks = [
      ...record.validationChecks,
      check(runId, {
        idPrefix: "check_realtime_live",
        checkName: "postgres_events_browser_polling",
        status: "passed",
        source: "live",
        details: { endpoint: "/api/events/recent", delivered: true, eventId: deliveredEvent.id }
      }),
      check(runId, {
        idPrefix: "check_cutover_live",
        checkName: "scoped_demo_runtime_smoke_test",
        status: "passed",
        source: "live",
        details: { provider: "aivenProvider", supabaseRuntimePath: "unused", postsRead: nextPosts.length }
      })
    ]
    record.proofSource = mergeProofSource(record.proofSource, "live")
    record.status = fixtureEvents.every((fixtureEvent) => hasEvent(record, fixtureEvent.type)) ? "complete" : "running"
  } catch (error) {
    const message = safeError(error)
    upsertEvents(record, [
      {
        runId,
        type: "realtime.postgres_events_bridge.passed",
        agent: "compatibility_surgeon",
        state: "realtime_validated",
        status: "failed",
        source: "live",
        summary: `Aiven Postgres app_events cutover proof failed: ${message}`,
        createdAt: now()
      },
      {
        runId,
        type: "cutover.demo_runtime.ready",
        agent: "cutover_manager",
        state: "demo_cutover_complete",
        status: "failed",
        source: "live",
        summary: `Scoped Aiven adapter cutover failed: ${message}`,
        createdAt: now()
      }
    ])
    record.receipts = [
      ...record.receipts,
      receipt(runId, {
        idPrefix: "receipt_cutover_failed",
        agent: "cutover_manager",
        intent: "smoke test scoped Aiven adapter runtime",
        tool: "aiven_pg_read",
        target: "posts,reactions,app_events",
        risk: "read_only",
        result: "failed",
        source: "live",
        details: { error: message }
      })
    ]
    record.validationChecks = [
      ...record.validationChecks,
      check(runId, {
        idPrefix: "check_cutover_failed",
        checkName: "scoped_demo_runtime_smoke_test",
        status: "failed",
        source: "live",
        details: { error: message }
      })
    ]
    record.proofSource = mergeProofSource(record.proofSource, "live")
    record.status = "failed"
  }

  return getSnapshot(runId)
}

const runAdapterPackage = async (runId: string) => {
  const record = getRecord(runId)
  const graph = record.behaviorGraph
  const manifest = record.migrationManifest
  const createdAt = now()

  if (!graph || !manifest) {
    upsertEvents(record, [
      {
        runId,
        type: "adapter.package.generated",
        agent: "adapter_generator",
        state: "report_ready",
        status: "skipped",
        source: "cached",
        summary: "Adapter package skipped because the behavior graph or migration manifest is missing.",
        details: {
          behaviorGraph: Boolean(graph),
          migrationManifest: Boolean(manifest)
        },
        createdAt
      }
    ])
    record.generatedArtifacts = [
      ...record.generatedArtifacts,
      {
        id: artifactId("adapter_package_skipped"),
        runId,
        kind: "adapter_package",
        title: "Generated Aiven adapter package",
        status: "skipped",
        source: "cached",
        details: { behaviorGraph: Boolean(graph), migrationManifest: Boolean(manifest) },
        createdAt
      }
    ]
    return getSnapshot(runId)
  }

  const artifactSource: ProofSource = record.proofSource === "fixture" ? "cached" : record.proofSource
  const adapterPackage = generateAivenAdapterPackage({
    setupProfile: record.setupProfile,
    behaviorGraph: graph,
    migrationManifest: manifest,
    validationChecks: record.validationChecks,
    rowValidations: record.rowValidations,
    artifactSource,
    artifactStatus: "validated",
    createdAt
  })
  const validation = validateGeneratedAdapterPackage({
    runId,
    files: adapterPackage.files,
    source: artifactSource,
    createdAt
  })
  const artifactStatus: GeneratedArtifact["status"] = validation.ok ? "validated" : "failed"
  const generatedArtifacts: GeneratedArtifact[] = adapterPackage.artifacts.map((artifact) => ({
    ...artifact,
    id: `${artifact.id}_${randomUUID().slice(0, 8)}`,
    status: artifactStatus
  }))

  record.generatedArtifacts = [...record.generatedArtifacts, ...generatedArtifacts]
  record.validationChecks = [...record.validationChecks, ...adapterPackage.checks, ...validation.checks]
  record.proofSource = mergeProofSource(record.proofSource, artifactSource)

  upsertEvents(record, [
    {
      runId,
      type: "adapter.package.generated",
      agent: "adapter_generator",
      state: "report_ready",
      status: "ok",
      source: artifactSource,
      summary: `Generated Aiven adapter package with ${adapterPackage.files.length} reviewable file(s).`,
      details: {
        files: adapterPackage.files.map((file) => file.path),
        artifactCount: generatedArtifacts.length
      },
      createdAt
    },
    {
      runId,
      type: "adapter.package.validated",
      agent: "artifact_validator",
      state: "report_ready",
      status: validation.ok ? "ok" : "failed",
      source: artifactSource,
      summary: validation.ok
        ? "Generated adapter package passed required file, JSON, heading, and secret-scan checks."
        : "Generated adapter package failed validation and is recorded as a blocker.",
      details: {
        checkCount: validation.checks.length,
        blockerCount: validation.blockers.length
      },
      createdAt
    }
  ])

  if (!validation.ok) {
    record.cutoverArtifacts = [
      ...record.cutoverArtifacts,
      {
        id: artifactId("artifact_package_failed"),
        runId,
        type: "artifact_bundle",
        status: "failed",
        files: adapterPackage.files.map((file) => file.path),
        proof: "Adapter package failed validation; no cutover PR was attempted.",
        source: artifactSource,
        details: { blockerCount: validation.blockers.length },
        createdAt
      }
    ]
    return getSnapshot(runId)
  }

  if (!record.setupProfile.github) {
    record.cutoverArtifacts = [
      ...record.cutoverArtifacts,
      {
        id: artifactId("artifact_package_local"),
        runId,
        type: "artifact_bundle",
        status: "generated",
        files: adapterPackage.files.map((file) => file.path),
        proof: "Aiven adapter package generated locally; connect a GitHub source with write permission to open a PR.",
        source: "cached",
        details: {
          reason: "no_github_source",
          fileCount: adapterPackage.files.length
        },
        createdAt
      }
    ]
    upsertEvents(record, [
      {
        runId,
        type: "cutover.artifact.generated",
        agent: "cutover_manager",
        state: "report_ready",
        status: "ok",
        source: "cached",
        summary: "Local Aiven adapter artifact package generated; GitHub PR was not requested for this source.",
        details: { fileCount: adapterPackage.files.length },
        createdAt
      }
    ])
    return getSnapshot(runId)
  }

  const branchName = `aiden/graduate-to-aiven-${runId.replace(/[^\w-]+/g, "-").slice(0, 36)}`
  const prResult = await openCutoverPullRequest({
    github: record.setupProfile.github,
    title: "Graduate to Aiven",
    body: [
      "Aiden generated this cutover package after building the Aiven migration manifest.",
      "",
      "This PR does not switch production traffic. It adds reviewable adapter files, migration notes, and validation output.",
      "",
      `Source: ${record.setupProfile.sourceLabel}`,
      `Readiness: ${graph.readinessScore}/100`
    ].join("\n"),
    branchName,
    files: adapterPackage.files.map((file) => ({
      path: file.path,
      content: file.contents
    }))
  })
  const prSource: ProofSource = prResult.status === "opened" ? "live" : "cached"

  record.cutoverArtifacts = [
    ...record.cutoverArtifacts,
    {
      id: artifactId("github_pr"),
      runId,
      type: "github_pr",
      status: prResult.status,
      url: prResult.url,
      branch: prResult.branch ?? branchName,
      files: adapterPackage.files.map((file) => file.path),
      proof:
        prResult.status === "opened"
          ? "GitHub cutover PR opened with generated Aiven adapter files."
          : prResult.status === "skipped"
            ? `GitHub cutover PR skipped: ${prResult.error ?? "write permission was not available"}.`
            : `GitHub cutover PR failed: ${prResult.error ?? "unknown GitHub error"}.`,
      source: prSource,
      details: {
        repository: record.setupProfile.github.fullName,
        error: prResult.error
      },
      createdAt
    }
  ]
  record.proofSource = mergeProofSource(record.proofSource, prSource)
  upsertEvents(record, [
    {
      runId,
      type: prResult.status === "opened" ? "cutover.pr.opened" : prResult.status === "skipped" ? "cutover.pr.skipped" : "cutover.pr.failed",
      agent: "cutover_manager",
      state: "report_ready",
      status: prResult.status === "opened" ? "ok" : prResult.status === "skipped" ? "skipped" : "failed",
      source: prSource,
      summary:
        prResult.status === "opened"
          ? "GitHub cutover PR opened with generated Aiven adapter package."
          : prResult.status === "skipped"
            ? "GitHub cutover PR skipped; local generated package remains available."
            : "GitHub cutover PR failed; local generated package remains available.",
      details: {
        url: prResult.url,
        branch: prResult.branch ?? branchName,
        files: adapterPackage.files.map((file) => file.path),
        error: prResult.error
      },
      createdAt
    }
  ])

  return getSnapshot(runId)
}

export const runOneClickGraduate = async (runId: string) => {
  const mode = readAgentRunMode()
  if (mode === "fixture") {
    return startFixtureRun(runId)
  }
  const reasonerSelection = selectAgentReasoner()

  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  record.status = "running"
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorGraph = undefined
  record.behaviorFindings = []
  record.migrationManifest = undefined
  record.generatedArtifacts = []
  record.cutoverArtifacts = []
  record.receipts = []
  record.validationChecks = []
  record.rowValidations = []

  const accessSnapshot = annotateAccessForOneClick(record, mode, reasonerSelection)
  if (!accessSnapshot.canGraduate) {
    return oneClickFailure(runId, "Aiven workspace setup", `Missing required setup: ${accessSnapshot.blockers.join(", ")}.`)
  }

  const context: AgentRunContext = {
    runId,
    mode,
    requireLivePg: mode === "live_pg",
    requireKafka: process.env.AGENT_REQUIRE_KAFKA === "true" || hasActiveAivenKafkaTarget()
  }

  const steps: AgentStep[] = [
    {
      name: "repo_scanner",
      label: "Source scan",
      risk: "read_only",
      requiredForLivePg: true,
      async run(stepContext) {
        const snapshot = await runSourceScan(stepContext.runId)
        const ok = eventIs(snapshot, "behavior.scan.completed", "live", "ok")
        return stepResult(stepContext, snapshot, {
          ok,
          summary: ok
            ? `${snapshot.setupProfile.sourceLabel} behavior scan completed from real source files.`
            : `${snapshot.setupProfile.sourceLabel} behavior scan did not complete live.`,
          blocking: true
        })
      }
    },
    {
      name: "aiven_operator",
      label: "Aiven proof spine",
      risk: "safe_write",
      requiredForLivePg: true,
      async run(stepContext) {
        const snapshot = await runProofSpine(stepContext.runId)
        const livePostgresOk =
          eventIs(snapshot, "aiven.postgres.verified", "live", "ok") &&
          eventIs(snapshot, "mcp.receipt.written", "live", "ok")
        const ok = stepContext.requireLivePg ? livePostgresOk : !hasFailedEvent(snapshot)
        return stepResult(stepContext, snapshot, {
          ok,
          summary: livePostgresOk
            ? "Aiven Postgres proof spine wrote and read back live receipts."
            : "Aiven Postgres proof spine did not produce the required live receipt proof."
        })
      }
    },
    {
      name: "migration_operator",
      label: "Aiven Postgres data migration",
      risk: "safe_write",
      requiredForLivePg: true,
      async run(stepContext) {
        const snapshot = await runDataMigration(stepContext.runId)
        const liveMigrationOk =
          eventIs(snapshot, "migration.schema.applied", "live", "ok") &&
          eventIs(snapshot, "migration.rows.validated", "live", "ok")
        const ok = stepContext.requireLivePg ? liveMigrationOk : !hasFailedEvent(snapshot)
        return stepResult(stepContext, snapshot, {
          ok,
          summary: liveMigrationOk
            ? "Aiven Postgres schema and scoped selected-source rows validated live."
            : "Aiven Postgres data migration did not produce the required live validation."
        })
      }
    },
    {
      name: "cutover_manager",
      label: "Scoped provider cutover",
      risk: "reversible_demo_change",
      requiredForLivePg: true,
      async run(stepContext) {
        const snapshot = await runProviderCutover(stepContext.runId)
        const adapterRequired = !isPulseWallDemoRuntimeProfile(snapshot.setupProfile)
        const liveCutoverOk =
          eventIs(snapshot, "realtime.postgres_events_bridge.passed", "live", "ok") &&
          eventIs(snapshot, "cutover.demo_runtime.ready", "live", "ok")
        const adapterSkipOk =
          adapterRequired &&
          eventIs(snapshot, "realtime.postgres_events_bridge.passed", "cached", "skipped") &&
          eventIs(snapshot, "cutover.demo_runtime.ready", "cached", "skipped")
        const ok = adapterRequired ? adapterSkipOk : stepContext.requireLivePg ? liveCutoverOk : !hasFailedEvent(snapshot)
        return stepResult(stepContext, snapshot, {
          ok,
          summary: liveCutoverOk
            ? "Scoped runtime cutover read, wrote, and read back Aiven Postgres app_events live."
            : adapterSkipOk
              ? "Controlled runtime cutover is marked as an adapter-generation blocker; shadow migration can complete."
              : "Scoped runtime cutover did not produce the required live app_events proof.",
          blocking: !adapterRequired
        })
      }
    },
    {
      name: "adapter_package_generator",
      label: "Adapter package and cutover artifact",
      risk: "safe_write",
      requiredForLivePg: false,
      async run(stepContext) {
        const snapshot = await runAdapterPackage(stepContext.runId)
        const packageEvent = snapshot.events.find((event) => event.type === "adapter.package.validated")
        const prEvent = snapshot.events.find(
          (event) =>
            event.type === "cutover.pr.opened" ||
            event.type === "cutover.pr.skipped" ||
            event.type === "cutover.artifact.generated"
        )
        const packageOk = packageEvent?.status === "ok"
        const artifactOk = Boolean(prEvent && (prEvent.status === "ok" || prEvent.status === "skipped"))
        return stepResult(stepContext, snapshot, {
          ok: packageOk && artifactOk,
          summary:
            packageOk && artifactOk
              ? "Generated adapter package and recorded PR or local cutover artifact."
              : "Adapter package or cutover artifact generation did not complete cleanly.",
          blocking: false
        })
      }
    },
    {
      name: "kafka_bus_operator",
      label: "Kafka workflow bus proof",
      risk: "safe_write",
      requiredForLivePg: false,
      async run(stepContext) {
        const snapshot = await runKafkaAgentBus(stepContext.runId)
        const liveKafkaOk =
          eventIs(snapshot, "kafka.agent_bus_roundtrip.passed", "live", "ok") &&
          snapshot.validationChecks.some(
            (candidate) =>
              candidate.checkName === "kafka_agent_bus_roundtrip" &&
              candidate.source === "live" &&
              candidate.status === "passed"
          )
        const cachedKafkaOk =
          eventIs(snapshot, "kafka.agent_bus_roundtrip.passed", "cached", "skipped") ||
          snapshot.validationChecks.some(
            (candidate) => candidate.checkName === "kafka_agent_bus_roundtrip" && candidate.status === "skipped"
          )
        const ok = stepContext.requireKafka ? liveKafkaOk : liveKafkaOk || cachedKafkaOk
        return stepResult(stepContext, snapshot, {
          ok,
          summary: liveKafkaOk
            ? "Kafka workflow bus roundtripped live migration events."
            : "Kafka workflow bus is cached/skipped because the optional Kafka workspace path is not configured.",
          blocking: stepContext.requireKafka && !liveKafkaOk
        })
      }
    }
  ]

  const result = await runAgentSteps(context, steps)
  const failed = result.results.find((stepResultItem) => !stepResultItem.ok && stepResultItem.blocking)
  if (!result.ok && failed) {
    const failureReason = await callAgentReasoner(reasonerSelection, "explainFailure", {
      step: result.stoppedAt?.label,
      reason: failed.summary
    })
    return oneClickFailure(runId, result.stoppedAt?.label ?? "One-click run", failureReason.text)
  }

  const finalSnapshot = getSnapshot(runId)
  const behaviorSummary = await callAgentReasoner(reasonerSelection, "summarizeBehavior", {
    findingCount: finalSnapshot.behaviorFindings.length,
    findings: finalSnapshot.behaviorFindings.map((finding) => ({
      behavior: finding.behavior,
      classification: finding.classification,
      target: finding.target,
      source: finding.source
    }))
  })
  const recommendation = await callAgentReasoner(reasonerSelection, "writeExecutiveRecommendation", {
    demoCutoverStatus: finalSnapshot.report.demoCutoverStatus,
    runtimeDependency: finalSnapshot.report.runtimeDependency,
    validationChecks: finalSnapshot.validationChecks.length,
    receipts: finalSnapshot.receipts.length,
    rowValidations: finalSnapshot.report.rowValidations,
    blockers: finalSnapshot.report.blockers
  })

  const finalRecord = getRecord(runId)
  const finalCutoverReady = finalRecord.events.some(
    (event) => event.type === "cutover.demo_runtime.ready" && event.status === "ok"
  )
  upsertEvents(finalRecord, [
    {
      runId,
      type: "proof.package.generated",
      agent: "report_agent",
      state: "report_ready",
      status: "ok",
      source: finalRecord.proofSource === "fixture" ? "cached" : finalRecord.proofSource,
      summary: finalCutoverReady
        ? "One-click proof package is ready with live Postgres validation, controlled cutover result, blockers, and rollback."
        : "One-click proof package is ready with live Postgres validation, adapter blockers, and rollback.",
      details: {
        agentRuntime: "deterministic_step_registry",
        reasoner: recommendation.reasoner,
        requestedReasoner: recommendation.requestedReasoner,
        reasonerFallback: recommendation.fallback || behaviorSummary.fallback,
        reasonerModel: recommendation.model,
        reasonerError: recommendation.error ?? behaviorSummary.error,
        stepCount: steps.length,
        behaviorSummary: behaviorSummary.text,
        recommendation: recommendation.text
      },
      createdAt: now()
    }
  ])
  finalRecord.status = "complete"
  return getSnapshot(runId)
}

export const getSnapshot = (runId = fixtureRunId): RunSnapshot => {
  const record = getRecord(runId)
  const lastEvent = record.events.at(-1)
  const mergedReceipts = uniqueById([...visibleFixtureReceipts(record), ...record.receipts])
  const mergedValidationChecks = uniqueById([...visibleFixtureChecks(record), ...record.validationChecks])
  const rowsValidated = hasEvent(record, "migration.rows.validated")
  const rowValidations = record.rowValidations.length > 0
    ? record.rowValidations
    : rowsValidated
      ? finalReport.rowValidations
      : []
  const cutoverReady = record.events.some(
    (event) => event.type === "cutover.demo_runtime.ready" && event.status === "ok"
  )
  const adapterRequiredForProfile = !isPulseWallDemoRuntimeProfile(record.setupProfile)
  const reportEvent = record.events.find((event) => event.type === "proof.package.generated" && event.status === "ok")
  const reportReady = Boolean(reportEvent)
  const manifestBlockers =
    record.migrationManifest?.blockers.map((blockerItem) => `${blockerItem.title}: ${blockerItem.resolution}`) ?? []
  const artifactBlockers = record.generatedArtifacts
    .filter((artifact) => artifact.status === "failed")
    .map((artifact) => `${artifact.title}: generated artifact validation failed`)
  const reportBlockers = [
    ...(adapterRequiredForProfile ? ["Generated application adapter required before controlled runtime cutover."] : []),
    ...manifestBlockers,
    ...artifactBlockers,
    ...finalReport.blockers
  ].filter((blockerItem, index, all) => all.indexOf(blockerItem) === index)
  const generatedRecommendation =
    typeof reportEvent?.details?.recommendation === "string"
      ? reportEvent.details.recommendation
      : finalReport.ctoRecommendation
  const accessSnapshot = buildAccessSnapshot(record)

  return {
    runId: record.runId,
    status: record.status,
    state: lastEvent?.state ?? "idle",
    // TODO: decide whether this should be an overall run label or a per-surface evidence summary.
    // Behavior findings, events, receipts, checks, and report rows already carry their own source labels.
    mode: record.proofSource,
    setupProfile: record.setupProfile,
    accessSnapshot,
    events: record.events,
    kafkaEvents: record.kafkaEvents.length > 0 ? record.kafkaEvents : visibleFixtureKafkaEvents(record),
    behaviorGraph: record.behaviorGraph,
    behaviorFindings: record.behaviorFindings.length > 0 ? record.behaviorFindings : behaviorFindings,
    migrationManifest: record.migrationManifest,
    generatedArtifacts: record.generatedArtifacts,
    cutoverArtifacts: record.cutoverArtifacts,
    receipts: mergedReceipts,
    validationChecks: mergedValidationChecks,
    report: {
      ...finalReport,
      headline: reportReady
        ? cutoverReady
          ? finalReport.headline
          : "Aiven shadow migration proof package ready"
        : "Migration proof package pending",
      readinessScore: reportReady
        ? finalReport.readinessScore
        : Math.round((record.events.length / fixtureEvents.length) * finalReport.readinessScore),
      demoCutoverStatus: cutoverReady ? finalReport.demoCutoverStatus : "skipped",
      runtimeDependency: cutoverReady ? finalReport.runtimeDependency : "unchanged",
      rowValidations,
      source: record.proofSource,
      checks: mergedValidationChecks,
      receipts: mergedReceipts,
      blockers: reportReady ? reportBlockers : [],
      rollback: reportReady
        ? cutoverReady
          ? finalReport.rollback
          : "Delete run-scoped shadow rows and keep the source application unchanged."
        : "Rollback plan pending final proof package generation.",
      costSummary: reportReady ? finalReport.costSummary : "Cost estimate pending final proof package generation.",
      ctoRecommendation: reportReady
        ? generatedRecommendation
        : "CTO recommendation pending final proof package generation.",
      createdAt: lastEvent?.createdAt ?? finalReport.createdAt
    }
  }
}

export const subscribe = (runId: string, listener: Listener) => {
  const runListeners = listeners.get(runId) ?? new Set<Listener>()
  runListeners.add(listener)
  listeners.set(runId, runListeners)

  return () => {
    runListeners.delete(listener)
  }
}
