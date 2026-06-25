#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { config as loadEnv } from "dotenv"

loadEnv({ path: ".env.local", quiet: true })

const command = process.argv[2] ?? "preflight"
const args = new Set(process.argv.slice(3))
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "")
const CONTROL_ROOM_URL = process.env.CONTROL_ROOM_URL ?? "http://127.0.0.1:5173/control"
const artifactDir = "artifacts/rehearsal"

const sensitiveEnvNames = [
  "AIVEN_TOKEN",
  "AIDEN_FRESH_AIVEN_POSTGRES_URL",
  "AIVEN_POSTGRES_URL",
  "AIDEN_FRESH_AIVEN_KAFKA_USERNAME",
  "AIDEN_FRESH_AIVEN_KAFKA_PASSWORD",
  "AIVEN_KAFKA_USERNAME",
  "AIVEN_KAFKA_PASSWORD",
  "SOURCE_SUPABASE_URL",
  "SOURCE_SUPABASE_DB_URL",
  "SOURCE_POSTGRES_URL",
  "SOURCE_SUPABASE_ANON_KEY",
  "SOURCE_SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY"
]

const secretValues = Object.entries(process.env)
  .filter(([name, value]) => {
    if (!value || value.length < 4) return false
    return sensitiveEnvNames.includes(name) || /(TOKEN|PASSWORD|SECRET|API_KEY|DATABASE_URL|POSTGRES_URL)/.test(name)
  })
  .sort(([, a], [, b]) => b.length - a.length)

const checks = []

class RehearsalError extends Error {
  constructor(gate, message, nextAction) {
    super(message)
    this.gate = gate
    this.nextAction = nextAction
  }
}

const redact = (input) => {
  let output = typeof input === "string" ? input : JSON.stringify(input)
  for (const [name, value] of secretValues) {
    output = output.split(value).join(`[${name}]`)
  }
  return output
}

const record = (level, gate, message, details) => {
  checks.push({ level, gate, message, details })
  const suffix = details ? ` ${redact(details)}` : ""
  console.log(`${level} ${gate}: ${message}${suffix}`)
}

const pass = (gate, message, details) => record("PASS", gate, message, details)
const warn = (gate, message, details) => record("WARN", gate, message, details)
const fail = (gate, message, nextAction) => {
  throw new RehearsalError(gate, message, nextAction)
}

const ensureNoSecrets = (label, value) => {
  const serialized = JSON.stringify(value)
  for (const [, secret] of secretValues) {
    if (serialized.includes(secret)) {
      fail(label, "Artifact payload contains an unredacted secret.", "Do not save this artifact; inspect the payload source.")
    }
  }
}

const writeArtifact = async (name, value) => {
  ensureNoSecrets(name, value)
  await mkdir(artifactDir, { recursive: true })
  const path = `${artifactDir}/${name}`
  const body = typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`
  await writeFile(path, body, "utf8")
  pass("artifact", `wrote ${path}`)
  return path
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {})
    }
  }).catch((error) => {
    throw new RehearsalError(
      "api connection",
      `Could not reach ${API_BASE_URL}: ${error.message}`,
      "Start the demo server with npm run dev, then rerun the rehearsal command."
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
    fail(
      "api request",
      `${options.method ?? "GET"} ${path} failed with HTTP ${response.status}: ${redact(body).slice(0, 500)}`,
      "Inspect API logs, reset the demo, and rerun this command."
    )
  }
  return body
}

const postJson = (path, body) =>
  request(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body)
  })

const checkControlRoom = async () => {
  const response = await fetch(CONTROL_ROOM_URL, { method: "HEAD" }).catch((error) => {
    throw new RehearsalError(
      "control room",
      `Could not reach ${CONTROL_ROOM_URL}: ${error.message}`,
      "Start the control room dev server and reopen the demo URL."
    )
  })
  if (!response.ok) {
    fail("control room", `${CONTROL_ROOM_URL} returned HTTP ${response.status}.`, "Restart npm run dev.")
  }
  pass("control room", `reachable at ${CONTROL_ROOM_URL}`)
}

const createFreshRun = async () => {
  const snapshot = await postJson("/api/runs")
  if (!snapshot?.runId) fail("create run", "POST /api/runs did not return a runId.", "Restart the API server.")
  pass("create run", `fresh run ${snapshot.runId}`)
  return snapshot
}

const pollRun = async (runId, predicate, timeoutMs = 22000) => {
  const started = Date.now()
  let snapshot = await request(`/api/runs/${encodeURIComponent(runId)}`)
  while (!predicate(snapshot)) {
    if (Date.now() - started > timeoutMs) return snapshot
    await new Promise((resolve) => setTimeout(resolve, 650))
    snapshot = await request(`/api/runs/${encodeURIComponent(runId)}`)
  }
  return snapshot
}

const runPreflight = async () => {
  if (!existsSync("package.json")) fail("repo", "Run this from the repository root.", "cd /home/henri/sunstead")
  if (!existsSync(".env.local")) {
    warn("env", ".env.local is missing; fixture fallback can run, but live Aiven proof will not.")
  } else {
    pass("env", ".env.local exists")
  }

  const health = await request("/api/health")
  if (health?.ok !== true) fail("api health", "API health did not return ok: true.", "Restart npm run dev.")
  pass("api health", `ok (${health.mode ?? "unknown"} mode)`)
  await checkControlRoom()

  const snapshot = await createFreshRun()
  const access = await postJson(`/api/runs/${encodeURIComponent(snapshot.runId)}/access-preflight`)
  if (!access?.accessSnapshot?.canGraduate) {
    fail(
      "access broker",
      `required access blocked: ${(access?.accessSnapshot?.blockers ?? []).join(", ") || "unknown"}`,
      "Fix required access or use npm run demo:fallback for cached rehearsal."
    )
  }
  pass("access broker", "required access is ready", {
    warnings: access.accessSnapshot.warnings?.length ?? 0
  })

  const scanned = await postJson(`/api/runs/${encodeURIComponent(snapshot.runId)}/source-scan`)
  const findingCount = scanned?.behaviorFindings?.length ?? 0
  if (findingCount < 8) fail("source scan", `Expected at least 8 findings, got ${findingCount}.`, "Check demo/pulsewall files.")
  pass("source scan", `${findingCount} behavior findings`)

  const adapter = await request("/api/adapter/status")
  if (adapter?.mode !== "fixture") warn("adapter", `adapter is currently ${adapter?.mode}; reset before stage.`)
  else pass("adapter", "fixture mode after fresh reset")

  await writeArtifact("preflight-latest.json", {
    ok: true,
    apiBaseUrl: API_BASE_URL,
    controlRoomUrl: CONTROL_ROOM_URL,
    runId: snapshot.runId,
    checks,
    createdAt: new Date().toISOString()
  })
}

const runReset = async () => {
  const snapshot = await createFreshRun()
  let finalSnapshot = snapshot

  if (args.has("--live")) {
    const migrated = await postJson(`/api/runs/${encodeURIComponent(snapshot.runId)}/data-migration`)
    const migrationOk = migrated?.events?.some(
      (event) => event.type === "migration.rows.validated" && event.status === "ok" && event.source === "live"
    )
    if (!migrationOk) fail("live seed reset", "Aiven Postgres row validation did not pass.", "Run npm run verify:live.")
    pass("live seed reset", "Aiven Postgres scoped dataset reloaded")

    finalSnapshot = await postJson(`/api/runs/${encodeURIComponent(snapshot.runId)}/provider-cutover`)
    const cutoverOk = finalSnapshot?.events?.some(
      (event) => event.type === "cutover.demo_runtime.ready" && event.status === "ok" && event.source === "live"
    )
    if (!cutoverOk) fail("live adapter reset", "Scoped Aiven provider cutover did not pass.", "Inspect API logs.")
    pass("live adapter reset", "adapter cut over to Aiven provider")
  }

  const [adapter, posts, events] = await Promise.all([
    request("/api/adapter/status"),
    request("/api/posts"),
    request("/api/events/recent?limit=5")
  ])
  pass("adapter", `mode ${adapter?.mode ?? "unknown"}`)
  pass("posts", `${Array.isArray(posts) ? posts.length : 0} rows visible`)
  pass("events", `${Array.isArray(events) ? events.length : 0} recent browser events`)

  await writeArtifact("reset-latest.json", {
    ok: true,
    live: args.has("--live"),
    apiBaseUrl: API_BASE_URL,
    controlRoomUrl: CONTROL_ROOM_URL,
    runId: finalSnapshot.runId,
    adapter,
    visiblePosts: Array.isArray(posts) ? posts.length : 0,
    recentEvents: Array.isArray(events) ? events.length : 0,
    createdAt: new Date().toISOString()
  })
}

const runFallback = async () => {
  const started = await createFreshRun()
  await postJson(`/api/runs/${encodeURIComponent(started.runId)}/graduate-fixture`)
  const snapshot = await pollRun(
    started.runId,
    (candidate) => candidate.status === "complete" && (candidate.events?.length ?? 0) >= 14,
    24000
  )
  if (snapshot.status !== "complete" || (snapshot.events?.length ?? 0) < 14) {
    fail("fixture fallback", "Fixture run did not complete the 14-event story in time.", "Use manual presenter controls.")
  }
  pass("fixture fallback", "14-event fixture story complete")

  const eventStream = snapshot.events.map((event) => JSON.stringify(event)).join("\n")
  const fallbackLine = [
    "# Rehearsal Fallback Card",
    "",
    "Use this line if live Aiven or network proof is unstable:",
    "",
    "> This run is replaying the same receipt stream from rehearsal; here is one live Aiven write now.",
    "",
    `Run ID: ${snapshot.runId}`,
    `Events: ${snapshot.events.length}`,
    `Report status: ${snapshot.report.demoCutoverStatus}`,
    ""
  ].join("\n")

  await writeArtifact("fallback-run-latest.json", snapshot)
  await writeArtifact("fallback-report-latest.json", snapshot.report)
  await writeArtifact("fallback-event-stream-latest.ndjson", `${eventStream}\n`)
  await writeArtifact("fallback-card-latest.md", fallbackLine)
}

const parseVerifierJson = (stdout) => {
  const firstBrace = stdout.indexOf("{")
  if (firstBrace < 0) throw new Error("verifier did not print JSON")
  return JSON.parse(stdout.slice(firstBrace))
}

const runLiveTwice = async () => {
  const runs = []
  for (let index = 1; index <= 2; index += 1) {
    console.log(`RUN live one-click ${index}/2`)
    const result = spawnSync(process.execPath, ["scripts/verify-live-aiven.mjs", "--json", "--one-click"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, API_BASE_URL },
      timeout: 180000
    })
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`
    let parsed
    try {
      parsed = parseVerifierJson(result.stdout ?? "")
    } catch {
      parsed = { ok: false, reason: redact(output).slice(0, 1000) }
    }
    runs.push({
      index,
      exitCode: result.status,
      ok: result.status === 0 && parsed.ok === true,
      result: parsed
    })
    if (result.status !== 0 || parsed.ok !== true) {
      await writeArtifact("live-twice-latest.json", {
        ok: false,
        apiBaseUrl: API_BASE_URL,
        runs,
        createdAt: new Date().toISOString()
      })
      fail("live rehearsal", `run ${index}/2 failed`, "Demote failing component to fallback or inspect verifier output.")
    }
    pass("live rehearsal", `run ${index}/2 passed`, { runId: parsed.runId })
  }

  await writeArtifact("live-twice-latest.json", {
    ok: true,
    apiBaseUrl: API_BASE_URL,
    runs,
    createdAt: new Date().toISOString()
  })
}

const printHelp = () => {
  console.log(`Usage: node scripts/demo-rehearsal.mjs <command>

Commands:
  preflight      Check API/control-room/access/source-scan readiness.
  reset          Reset fixture adapter and write reset artifact.
  reset --live   Reload Aiven Postgres seed data and cut over local adapter.
  fallback       Run explicit fixture fallback and save event/report artifacts.
  live-twice     Run the live one-click verifier twice consecutively.

Env:
  API_BASE_URL=${API_BASE_URL}
  CONTROL_ROOM_URL=${CONTROL_ROOM_URL}`)
}

try {
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp()
  } else if (command === "preflight") {
    await runPreflight()
  } else if (command === "reset") {
    await runReset()
  } else if (command === "fallback") {
    await runFallback()
  } else if (command === "live-twice") {
    await runLiveTwice()
  } else {
    printHelp()
    fail("command", `Unknown rehearsal command: ${command}`, "Use one of: preflight, reset, fallback, live-twice.")
  }
} catch (error) {
  const gate = error instanceof RehearsalError ? error.gate : "unexpected"
  const message = error instanceof Error ? error.message : String(error)
  const nextAction = error instanceof RehearsalError
    ? error.nextAction
    : "Inspect the command output and rerun the rehearsal command."
  console.error("")
  console.error("Result: REHEARSAL COMMAND FAILED")
  console.error(`Failed gate: ${gate}`)
  console.error(`Reason: ${redact(message)}`)
  console.error(`Next action: ${nextAction}`)
  process.exit(1)
}
