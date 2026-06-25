#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.local", quiet: true })

const AIVEN_MCP_URL = "https://mcp.aiven.live/mcp?allow_secrets=true"
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8787").replace(/\/$/, "")
const args = new Set(process.argv.slice(2))
const verbose = args.has("--verbose")
const jsonOutput = args.has("--json")
const requireKafkaFlag = args.has("--require-kafka")
const oneClickMode = args.has("--one-click")

const expectedRows = {
  posts: 40,
  reactions: 120,
  demo_users: 8,
  app_events: 2
}

const sensitiveEnvNames = [
  "AIVEN_TOKEN",
  "AIVEN_POSTGRES_URL",
  "AIVEN_KAFKA_USERNAME",
  "AIVEN_KAFKA_PASSWORD",
  "SOURCE_SUPABASE_URL",
  "SOURCE_SUPABASE_DB_URL",
  "SOURCE_POSTGRES_URL",
  "SOURCE_SUPABASE_ANON_KEY",
  "SOURCE_SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY"
]

const collected = []

const secretValues = Object.entries(process.env)
  .filter(([name, value]) => {
    if (!value || value.length < 4) return false
    return sensitiveEnvNames.includes(name) || /(TOKEN|PASSWORD|SECRET|API_KEY|DATABASE_URL|POSTGRES_URL)/.test(name)
  })
  .sort(([, a], [, b]) => b.length - a.length)

const redact = (input) => {
  let output = typeof input === "string" ? input : JSON.stringify(input)
  for (const [name, value] of secretValues) {
    output = output.split(value).join(`[${name}]`)
  }
  return output
}

class GateError extends Error {
  constructor(gate, reason, nextAction = "Fix the failed gate and rerun npm run verify:live.") {
    super(reason)
    this.gate = gate
    this.nextAction = nextAction
  }
}

const record = (level, gate, message, details) => {
  collected.push({ level, gate, message, details })
  if (!jsonOutput) {
    const suffix = details && verbose ? ` ${redact(details)}` : ""
    console.log(`${level} ${gate}: ${message}${suffix}`)
  }
}

const pass = (gate, message, details) => record("PASS", gate, message, details)
const warn = (gate, message, details) => record("WARN", gate, message, details)

const fail = (gate, reason, nextAction) => {
  throw new GateError(gate, reason, nextAction)
}

const readTextFile = (path) => {
  try {
    return readFileSync(path, "utf8")
  } catch (error) {
    fail("repo config", `Missing ${path}.`, `Create ${path} with the Aiven MCP server configuration.`)
  }
}

const verifyMcpConfig = () => {
  const runtimeUrl = process.env.AIVEN_MCP_URL?.trim() || AIVEN_MCP_URL
  if (runtimeUrl !== AIVEN_MCP_URL) {
    warn("agent sdk mcp config", "AIVEN_MCP_URL overrides the hosted default; verify this is intentional.")
  } else {
    pass("agent sdk mcp config", "Agent SDK runtime uses the hosted Aiven MCP endpoint")
  }

  const rawJson = readTextFile(".mcp.json")
  let parsed
  try {
    parsed = JSON.parse(rawJson)
  } catch (error) {
    fail("raw mcp config", `.mcp.json is not valid JSON: ${error.message}`)
  }
  const rawUrl = parsed?.mcpServers?.aiven?.url
  if (rawUrl !== AIVEN_MCP_URL) {
    fail("raw mcp config", ".mcp.json does not contain the expected mcpServers.aiven.url.")
  }
  pass("raw mcp config", "root .mcp.json contains mcpServers.aiven")

  try {
    const codexConfig = readFileSync(".codex/config.toml", "utf8")
    if (codexConfig.includes("[mcp_servers.aiven]") && codexConfig.includes(AIVEN_MCP_URL)) {
      warn("codex mcp config", "Codex also has Aiven MCP configured, but it is not the product runtime gate.")
    }
  } catch {
    warn("codex mcp config", "No Codex MCP config found; product runtime uses Agent SDK MCP config.")
  }
}

const requireEnv = (names) => {
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) {
    fail(
      "environment",
      `Missing required env var(s): ${missing.join(", ")}.`,
      "Add the missing value(s) to .env.local and restart npm run dev before rerunning npm run verify:live."
    )
  }
}

const configuredEnv = (names) => names.every((name) => Boolean(process.env[name]?.trim()))

const requestJson = async (path, options = {}) => {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  }).catch((error) => {
    throw new GateError(
      "api connection",
      `Could not reach ${API_BASE_URL}: ${error.message}`,
      "Start the local API with npm run dev, then rerun npm run verify:live."
    )
  })

  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!response.ok) {
    const bodySummary = typeof body === "string" ? body : JSON.stringify(body)
    throw new GateError(
      "api request",
      `${options.method ?? "GET"} ${path} failed with HTTP ${response.status}: ${redact(bodySummary).slice(0, 500)}`,
      "Inspect the local API logs, fix the failing route, and rerun npm run verify:live."
    )
  }
  return body
}

const postJson = (path, body) =>
  requestJson(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body)
  })

const event = (snapshot, type) => snapshot?.events?.find((candidate) => candidate.type === type)
const check = (snapshot, name) => snapshot?.validationChecks?.find((candidate) => candidate.checkName === name)
const accessCheck = (snapshot, id) => snapshot?.accessSnapshot?.checks?.find((candidate) => candidate.id === id)

const requireEvent = (snapshot, type, source, status, gate) => {
  const found = event(snapshot, type)
  if (!found) fail(gate, `Missing event ${type}.`)
  if (found.source !== source || found.status !== status) {
    fail(
      gate,
      `Event ${type} expected ${source}/${status}, got ${found.source}/${found.status}.`,
      "Confirm the live Aiven env is loaded by the API process and rerun the gate."
    )
  }
  return found
}

const requirePassedCheck = (snapshot, name, source, gate) => {
  const found = check(snapshot, name)
  if (!found) fail(gate, `Missing validation check ${name}.`)
  if (found.source !== source || found.status !== "passed") {
    fail(gate, `Validation check ${name} expected ${source}/passed, got ${found.source}/${found.status}.`)
  }
  return found
}

const verifySourceScan = (snapshot) => {
  requireEvent(snapshot, "behavior.scan.completed", "live", "ok", "source scan")
  const findings = snapshot.behaviorFindings ?? []
  if (findings.length < 8) {
    fail("source scan", `Expected at least 8 behavior findings, got ${findings.length}.`)
  }
  pass("source scan", `${findings.length} findings from PulseWall`)
}

const verifyAccessPreflight = (snapshot, { requireLivePostgres }) => {
  const access = snapshot?.accessSnapshot
  if (!access) fail("access preflight", "Run snapshot does not include accessSnapshot.")
  if (access.canGraduate !== true) {
    fail("access preflight", `Expected canGraduate true, blockers: ${(access.blockers ?? []).join(", ") || "none"}.`)
  }
  if ((access.blockers ?? []).length > 0) {
    fail("access preflight", `Expected no access blockers, got ${access.blockers.join(", ")}.`)
  }

  const requiredChecks = ["repo_source", "source_data", "aiven_mcp", "aiven_project", "aiven_postgres", "demo_adapter"]
  for (const id of requiredChecks) {
    const found = accessCheck(snapshot, id)
    if (!found) fail("access preflight", `Missing access check ${id}.`)
    if (found.requiredForGraduate !== true) {
      fail("access preflight", `Access check ${id} should be required for graduation.`)
    }
    if (!["ready", "connected", "live_verified"].includes(found.status)) {
      fail("access preflight", `Required access check ${id} is not ready/connected/live_verified: ${found.status}.`)
    }
  }

  const postgres = accessCheck(snapshot, "aiven_postgres")
  if (requireLivePostgres && postgres.status !== "live_verified") {
    fail("access preflight", `Expected Aiven Postgres access to be live_verified after cutover, got ${postgres.status}.`)
  }

  const kafka = accessCheck(snapshot, "aiven_kafka")
  if (!kafka) fail("access preflight", "Missing access check aiven_kafka.")
  if (kafka.requiredForGraduate !== false) {
    fail("access preflight", "Kafka should not be required for the browser-critical graduation path.")
  }

  const productionCutover = accessCheck(snapshot, "production_cutover")
  if (!productionCutover || productionCutover.status !== "not_requested" || productionCutover.requiredForGraduate !== false) {
    fail("access preflight", "Production cutover should be not_requested and non-blocking.")
  }

  const auth = accessCheck(snapshot, "production_auth")
  const storage = accessCheck(snapshot, "production_storage")
  if (!auth || auth.status !== "later" || !storage || storage.status !== "later") {
    fail("access preflight", "Production auth and storage should be marked later.")
  }

  const serialized = JSON.stringify(access)
  for (const [, value] of secretValues) {
    if (value && serialized.includes(value)) {
      fail("access preflight", "Access snapshot contains an unredacted secret value.")
    }
  }

  pass(
    "access preflight",
    requireLivePostgres
      ? "required access remains green and Aiven Postgres is live_verified"
      : "required access green; Kafka/auth/storage/cutover are non-blocking scope decisions",
    { warnings: access.warnings?.length ?? 0 }
  )
}

const verifyProofSpine = (snapshot) => {
  const pgEvent = requireEvent(snapshot, "aiven.postgres.verified", "live", "ok", "proof spine")
  requireEvent(snapshot, "mcp.receipt.written", "live", "ok", "proof spine")
  requirePassedCheck(snapshot, "live_aiven_postgres_receipt_readback", "live", "proof spine")
  pass("proof spine", "Postgres receipt write/read live", pgEvent.details)

  const hasProjectEnv = configuredEnv(["AIVEN_TOKEN", "AIVEN_PROJECT"])
  const projectEvent = event(snapshot, "aiven.project.detected")
  if (hasProjectEnv) {
    if (!projectEvent || projectEvent.source !== "live" || projectEvent.status !== "ok") {
      fail("proof spine", "AIVEN_TOKEN/AIVEN_PROJECT are configured but project/service visibility is not live/ok.")
    }
    pass("project visibility", "Aiven project/service visibility live", projectEvent.details)
  } else {
    warn("project visibility", "skipped; AIVEN_TOKEN and AIVEN_PROJECT are not both configured")
  }

  const hasKafkaEnv = configuredEnv([
    "AIVEN_KAFKA_BOOTSTRAP_SERVERS",
    "AIVEN_KAFKA_USERNAME",
    "AIVEN_KAFKA_PASSWORD"
  ])
  const kafkaEvent = event(snapshot, "aiven.kafka.verified")
  if (hasKafkaEnv) {
    if (!kafkaEvent || kafkaEvent.source !== "live" || kafkaEvent.status !== "ok") {
      fail("proof spine", "Kafka env is configured but proof-spine Kafka verification is not live/ok.")
    }
    pass("proof spine kafka", "Kafka service/topic smoke proof live", kafkaEvent.details)
  } else {
    warn("proof spine kafka", "skipped; Kafka env is not fully configured")
  }
}

const verifyDataMigration = (snapshot) => {
  requireEvent(snapshot, "migration.schema.applied", "live", "ok", "data migration")
  requireEvent(snapshot, "migration.rows.validated", "live", "ok", "data migration")

  const rows = snapshot.report?.rowValidations ?? []
  for (const [table, expected] of Object.entries(expectedRows)) {
    const row = rows.find((candidate) => candidate.table === table)
    if (!row) fail("data migration", `Missing row validation for ${table}.`)
    if (row.source !== "live" || row.status !== "passed" || row.expected !== expected || row.actual !== expected) {
      fail(
        "data migration",
        `${table} expected live/passed ${expected}/${expected}, got source=${row.source} status=${row.status} expected=${row.expected} actual=${row.actual}.`
      )
    }
  }
  pass(
    "data migration",
    `posts=${expectedRows.posts} reactions=${expectedRows.reactions} demo_users=${expectedRows.demo_users} app_events=${expectedRows.app_events}`
  )
}

const verifyCutover = (snapshot) => {
  const realtimeEvent = requireEvent(
    snapshot,
    "realtime.postgres_events_bridge.passed",
    "live",
    "ok",
    "provider cutover"
  )
  requireEvent(snapshot, "cutover.demo_runtime.ready", "live", "ok", "provider cutover")
  requirePassedCheck(snapshot, "postgres_events_browser_polling", "live", "provider cutover")
  requirePassedCheck(snapshot, "scoped_demo_runtime_smoke_test", "live", "provider cutover")
  pass("cutover", "Aiven Postgres app_events bridge live", realtimeEvent.details)
}

const verifyKafkaAgentBus = (snapshot) => {
  const hasKafkaEnv = configuredEnv([
    "AIVEN_KAFKA_BOOTSTRAP_SERVERS",
    "AIVEN_KAFKA_USERNAME",
    "AIVEN_KAFKA_PASSWORD"
  ])
  const requireKafka = requireKafkaFlag || hasKafkaEnv
  const kafkaEvent = event(snapshot, "kafka.agent_bus_roundtrip.passed")
  const kafkaCheck = check(snapshot, "kafka_agent_bus_roundtrip")

  if (requireKafka) {
    if (!kafkaEvent || kafkaEvent.source !== "live" || kafkaEvent.status !== "ok") {
      fail("kafka agent bus", "Kafka is required/configured but agent-bus roundtrip is not live/ok.")
    }
    if (!kafkaCheck || kafkaCheck.source !== "live" || kafkaCheck.status !== "passed") {
      fail("kafka agent bus", "Kafka roundtrip check is not live/passed.")
    }
    const failedKafkaEvents = (snapshot.kafkaEvents ?? []).filter((candidate) => candidate.status === "failed")
    if (failedKafkaEvents.length > 0) {
      fail("kafka agent bus", `${failedKafkaEvents.length} Kafka workflow event(s) failed to roundtrip.`)
    }
    pass("kafka agent bus", `${snapshot.kafkaEvents?.length ?? 0} workflow events roundtripped live`, kafkaEvent.details)
    return
  }

  if (kafkaEvent?.source === "cached" || kafkaCheck?.status === "skipped") {
    warn("kafka agent bus", "skipped; Kafka env is not fully configured")
  } else if (kafkaEvent?.source === "live" && kafkaEvent.status === "ok") {
    pass("kafka agent bus", `${snapshot.kafkaEvents?.length ?? 0} workflow events roundtripped live`, kafkaEvent.details)
  } else {
    warn("kafka agent bus", "not verified; Kafka env is not fully configured")
  }
}

const verifyAdapterRuntime = async (runId) => {
  const status = await requestJson("/api/adapter/status")
  if (status?.mode !== "live") {
    fail("adapter status", `Expected adapter mode live, got ${status?.mode ?? "unknown"}.`)
  }
  if (status.runId !== runId) {
    fail("adapter status", `Expected adapter runId ${runId}, got ${status.runId ?? "none"}.`)
  }
  pass("adapter status", "adapter mode live")

  const posts = await requestJson("/api/posts")
  if (!Array.isArray(posts) || posts.length === 0) {
    fail("runtime read", "/api/posts returned no posts.")
  }
  pass("runtime read", `/api/posts returned ${posts.length}`)

  const leaderboard = await requestJson("/api/leaderboard")
  if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
    fail("runtime read", "/api/leaderboard returned no rows.")
  }
  pass("runtime read", `/api/leaderboard returned ${leaderboard.length} rows`)

  const post = posts[0]
  const reaction = await postJson("/api/reactions", {
    postId: post.id,
    emoji: "rocket",
    userId: "demo_user_001"
  })
  if (reaction?.ok !== true) {
    fail("runtime write", "/api/reactions did not return ok: true.")
  }
  pass("runtime write", `/api/reactions ok for ${post.id}`)

  const events = await requestJson("/api/events/recent?limit=20")
  if (!Array.isArray(events)) {
    fail("runtime event", "/api/events/recent did not return an array.")
  }
  const delivered = events.find(
    (candidate) =>
      candidate.eventType === "post.reaction_added" &&
      candidate.runId === runId &&
      candidate.payload?.postId === post.id
  )
  if (!delivered) {
    fail("runtime event", "/api/events/recent did not return the post.reaction_added event for the runtime write.")
  }
  pass("runtime event", `/api/events/recent returned ${delivered.eventType}`, { eventId: delivered.id })
}

const verifyFinalReport = (report) => {
  if (report?.demoCutoverStatus !== "passed") {
    fail("final report", `Expected demoCutoverStatus passed, got ${report?.demoCutoverStatus ?? "unknown"}.`)
  }
  if (report?.runtimeDependency !== "removed_from_scoped_demo_path") {
    fail("final report", `Expected runtimeDependency removed_from_scoped_demo_path, got ${report?.runtimeDependency ?? "unknown"}.`)
  }
  pass("final report", "scoped demo runtime removed Supabase from the demo path")
}

const verifyOneClickReasoner = (proofPackage) => {
  const keyPresent = Boolean(process.env.ANTHROPIC_API_KEY?.trim())
  const forcedOff = process.env.AGENT_REASONER?.trim() === "off"
  const details = proofPackage?.details ?? {}
  if (!keyPresent || forcedOff) {
    if (details.reasoner === "anthropic_agent_sdk") {
      pass("agent sdk reasoner", "Anthropic Agent SDK reasoner used", {
        model: details.reasonerModel,
        fallback: details.reasonerFallback
      })
    } else {
      warn("agent sdk reasoner", "not required; ANTHROPIC_API_KEY is missing or AGENT_REASONER=off")
    }
    return
  }

  if (details.requestedReasoner !== "anthropic_agent_sdk") {
    fail("agent sdk reasoner", "ANTHROPIC_API_KEY is present but the one-click proof did not request the Anthropic Agent SDK reasoner.")
  }
  if (details.reasoner === "anthropic_agent_sdk") {
    pass("agent sdk reasoner", "Anthropic Agent SDK produced proof text", {
      model: details.reasonerModel,
      fallback: details.reasonerFallback
    })
    return
  }
  if (details.reasoner === "deterministic" && details.reasonerFallback === true) {
    warn("agent sdk reasoner", "Anthropic Agent SDK was requested but deterministic fallback was used", {
      model: details.reasonerModel,
      error: details.reasonerError
    })
    return
  }
  fail("agent sdk reasoner", `Unexpected one-click reasoner metadata: ${JSON.stringify(details).slice(0, 500)}.`)
}

const main = async () => {
  if (!jsonOutput) {
    console.log("Aiden live Aiven verification")
    console.log(`API: ${API_BASE_URL}`)
  }

  verifyMcpConfig()
  requireEnv(["AIVEN_POSTGRES_URL"])

  const health = await requestJson("/api/health")
  if (health?.ok !== true) {
    fail("api health", "API health did not return ok: true.")
  }
  pass("api health", `ok (${health.mode ?? "unknown"} mode)`)

  const created = await postJson("/api/runs")
  const runId = created?.runId
  if (!runId) fail("create run", "POST /api/runs did not return runId.")
  if (!jsonOutput) console.log(`Run: ${runId}`)
  pass("create run", "fresh/reset run created")

  const accessPreflight = await postJson(`/api/runs/${encodeURIComponent(runId)}/access-preflight`)
  verifyAccessPreflight(accessPreflight, { requireLivePostgres: false })

  let workflowSnapshot

  if (oneClickMode) {
    const graduated = await postJson(`/api/runs/${encodeURIComponent(runId)}/graduate`)
    verifySourceScan(graduated)
    verifyProofSpine(graduated)
    verifyDataMigration(graduated)
    verifyCutover(graduated)
    verifyKafkaAgentBus(graduated)
    workflowSnapshot = graduated

    const proofPackage = event(graduated, "proof.package.generated")
    if (!proofPackage || proofPackage.status !== "ok") {
      fail("one-click graduate", "One-click run did not generate an ok proof.package.generated event.")
    }
    verifyOneClickReasoner(proofPackage)
    pass("one-click graduate", "single Graduate To Aiven route completed the migration proof", proofPackage.details)
  } else {
    const scanned = await postJson(`/api/runs/${encodeURIComponent(runId)}/source-scan`)
    verifySourceScan(scanned)

    const proofed = await postJson(`/api/runs/${encodeURIComponent(runId)}/proof-spine`)
    verifyProofSpine(proofed)

    const migrated = await postJson(`/api/runs/${encodeURIComponent(runId)}/data-migration`)
    verifyDataMigration(migrated)

    const cutover = await postJson(`/api/runs/${encodeURIComponent(runId)}/provider-cutover`)
    verifyCutover(cutover)

    const kafka = await postJson(`/api/runs/${encodeURIComponent(runId)}/kafka-agent-bus`)
    verifyKafkaAgentBus(kafka)
    workflowSnapshot = kafka
  }

  const finalAccess = await postJson(`/api/runs/${encodeURIComponent(runId)}/access-preflight`)
  verifyAccessPreflight(finalAccess ?? workflowSnapshot, { requireLivePostgres: true })

  await verifyAdapterRuntime(runId)

  const report = await requestJson(`/api/runs/${encodeURIComponent(runId)}/report`)
  verifyFinalReport(report)

  if (jsonOutput) {
    console.log(JSON.stringify({ ok: true, runId, apiBaseUrl: API_BASE_URL, checks: collected }, null, 2))
  } else {
    console.log("")
    console.log("Result: LIVE AIVEN GATE PASSED")
  }
}

main().catch((error) => {
  const gate = error instanceof GateError ? error.gate : "unexpected"
  const reason = error instanceof Error ? error.message : String(error)
  const nextAction = error instanceof GateError
    ? error.nextAction
    : "Inspect the script or local API logs, then rerun npm run verify:live."

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          failedGate: gate,
          reason: redact(reason),
          nextAction,
          checks: collected
        },
        null,
        2
      )
    )
  } else {
    console.error("")
    console.error("Result: LIVE AIVEN GATE FAILED")
    console.error(`Failed gate: ${gate}`)
    console.error(`Reason: ${redact(reason)}`)
    console.error(`Next action: ${nextAction}`)
  }
  process.exit(1)
})
