import { randomUUID } from "node:crypto"
import { runAivenDataMigration, runAivenProofSpine, runKafkaAgentBusProof } from "@aiden/aiven-ops"
import type {
  AivenReceipt,
  BehaviorFinding,
  BehaviorScanResult,
  ProofSource,
  RowValidation,
  RunEvent,
  RunSnapshot,
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
import { scanPulseWallSource } from "@aiden/migration-core"
import { createAivenPulseWallProvider } from "@aiden/pulsewall-adapter"
import { canUseAivenProvider, switchToAivenProvider } from "./adapterRuntime.js"

type Listener = (event: RunEvent) => void

type RunRecord = {
  runId: string
  status: "idle" | "running" | "complete" | "failed"
  events: RunEvent[]
  kafkaEvents: RunEvent[]
  proofSource: ProofSource
  behaviorFindings: BehaviorFinding[]
  receipts: AivenReceipt[]
  validationChecks: ValidationCheck[]
  rowValidations: RowValidation[]
  timer?: NodeJS.Timeout
}

const runs = new Map<string, RunRecord>()
const listeners = new Map<string, Set<Listener>>()

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
  "aiven.project.detected",
  "aiven.postgres.verified",
  "aiven.kafka.verified",
  "migration.rows.validated",
  "realtime.postgres_events_bridge.passed",
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
    summary: `Scanning PulseWall source files and Supabase migrations (${scan.filesScanned} files).`,
    details: {
      filesScanned: scan.filesScanned,
      sourceRoot: "demo/pulsewall"
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
    summary: `Behavior graph generated ${scan.findings.length} live findings from real PulseWall source.`,
    details: {
      findingIds: scan.findings.map((finding) => finding.id),
      refsScanned: scan.refsScanned
    },
    createdAt: scan.createdAt
  }
]

const applySourceScan = async (record: RunRecord) => {
  const scan = await scanPulseWallSource()
  record.behaviorFindings = scan.findings
  upsertEvents(record, scanEventsFor(record.runId, scan))
  return scan
}

const getRecord = (runId: string): RunRecord => {
  const existing = runs.get(runId)
  if (existing) return existing

  const record: RunRecord = {
    runId,
    status: "idle",
    events: [],
    kafkaEvents: [],
    proofSource: "fixture",
    behaviorFindings: [],
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

export const createRun = () => {
  const record = getRecord(fixtureRunId)
  if (record.timer) {
    clearInterval(record.timer)
  }
  record.status = "idle"
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorFindings = []
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

  record.status = "running"
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorFindings = existingBehaviorFindings
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
          summary: `PulseWall scanner failed: ${message}`,
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
  record.events = []
  record.kafkaEvents = []
  record.proofSource = "fixture"
  record.behaviorFindings = []
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
  const postgresUrl = readEnv("AIVEN_POSTGRES_URL")
  if (postgresUrl) message = message.split(postgresUrl).join("[AIVEN_POSTGRES_URL]")
  return message.slice(0, 360)
}

const receipt = (
  runId: string,
  input: Omit<AivenReceipt, "id" | "runId" | "createdAt"> & { idPrefix: string }
): AivenReceipt => ({
  id: `${input.idPrefix}_${randomUUID().slice(0, 8)}`,
  runId,
  agent: input.agent,
  intent: input.intent,
  tool: input.tool,
  target: input.target,
  risk: input.risk,
  result: input.result,
  rollback: input.rollback,
  details: input.details,
  source: input.source,
  createdAt: now()
})

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

export const runProofSpine = async (runId: string) => {
  const record = getRecord(runId)
  if (record.timer) {
    clearInterval(record.timer)
    record.timer = undefined
  }
  record.status = "running"

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
        summary: `PulseWall scanner failed: ${message}`,
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

  const result = await runAivenDataMigration(runId)
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

  if (!canUseAivenProvider()) {
    const missingEnv = ["AIVEN_POSTGRES_URL"]
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
  const reportReady = hasEvent(record, "proof.package.generated")

  return {
    runId: record.runId,
    status: record.status,
    state: lastEvent?.state ?? "idle",
    // TODO: decide whether this should be an overall run label or a per-surface evidence summary.
    // Behavior findings, events, receipts, checks, and report rows already carry their own source labels.
    mode: record.proofSource,
    events: record.events,
    kafkaEvents: record.kafkaEvents.length > 0 ? record.kafkaEvents : visibleFixtureKafkaEvents(record),
    behaviorFindings: record.behaviorFindings.length > 0 ? record.behaviorFindings : behaviorFindings,
    receipts: mergedReceipts,
    validationChecks: mergedValidationChecks,
    report: {
      ...finalReport,
      headline: reportReady ? finalReport.headline : "Migration proof package pending",
      readinessScore: reportReady
        ? finalReport.readinessScore
        : Math.round((record.events.length / fixtureEvents.length) * finalReport.readinessScore),
      demoCutoverStatus: cutoverReady ? finalReport.demoCutoverStatus : "skipped",
      runtimeDependency: cutoverReady ? finalReport.runtimeDependency : "unchanged",
      rowValidations,
      source: record.proofSource,
      checks: mergedValidationChecks,
      receipts: mergedReceipts,
      blockers: reportReady ? finalReport.blockers : [],
      rollback: reportReady ? finalReport.rollback : "Rollback plan pending final proof package generation.",
      costSummary: reportReady ? finalReport.costSummary : "Cost estimate pending final proof package generation.",
      ctoRecommendation: reportReady
        ? finalReport.ctoRecommendation
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
