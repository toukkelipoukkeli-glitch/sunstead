import { randomUUID } from "node:crypto"
import type {
  AivenReceipt,
  AgentName,
  DataMigrationResult,
  KafkaAgentBusResult,
  Post,
  ProofSource,
  PulseWallEvent,
  RowValidation,
  RunEvent,
  RunState,
  ValidationCheck
} from "@aiden/contracts"
import { appEvents as fixtureAppEvents, posts as fixturePosts, receipts as fixtureReceipts } from "@aiden/fixtures"
import { Kafka, logLevel } from "kafkajs"
import pg from "pg"

const { Client } = pg

type ProofStatus = "passed" | "failed" | "skipped"

export type ProofSpineResult = {
  source: ProofSource
  ok: boolean
  missingEnv: string[]
  events: RunEvent[]
  receipts: AivenReceipt[]
  checks: ValidationCheck[]
}

export type ProofClient = {
  listReceipts(): Promise<AivenReceipt[]>
}

type ProofAccumulator = {
  runId: string
  missingEnv: Set<string>
  events: RunEvent[]
  receipts: AivenReceipt[]
  checks: ValidationCheck[]
}

type DataMigrationAccumulator = ProofAccumulator & {
  rowValidations: RowValidation[]
}

const now = () => new Date().toISOString()

const expectedRowCounts: Record<RowValidation["table"], number> = {
  posts: 40,
  reactions: 120,
  demo_users: 8,
  app_events: 2
}

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const missing = (names: string[]) => names.filter((name) => !readEnv(name))

const sourceFrom = (acc: ProofAccumulator): ProofSource => {
  if ([...acc.events, ...acc.receipts, ...acc.checks].some((item) => item.source === "live")) return "live"
  if ([...acc.events, ...acc.receipts, ...acc.checks].some((item) => item.source === "cached")) return "cached"
  return "fixture"
}

const safeError = (error: unknown) => {
  let message = error instanceof Error ? error.message : String(error)
  for (const name of [
    "AIVEN_TOKEN",
    "AIVEN_POSTGRES_URL",
    "AIVEN_KAFKA_USERNAME",
    "AIVEN_KAFKA_PASSWORD",
    "SOURCE_SUPABASE_SERVICE_ROLE_KEY"
  ]) {
    const value = readEnv(name)
    if (value) message = message.split(value).join(`[${name}]`)
  }
  return message.slice(0, 360)
}

const id = (prefix: string) => `${prefix}_${randomUUID().slice(0, 8)}`

const addEvent = (
  acc: ProofAccumulator,
  input: {
    type: string
    agent?: AgentName
    state?: RunState
    status: RunEvent["status"]
    source: ProofSource
    summary: string
    details?: Record<string, unknown>
  }
) => {
  acc.events.push({
    runId: acc.runId,
    type: input.type,
    agent: input.agent ?? "aiven_operator",
    state: input.state ?? "aiven_shadow_ready",
    status: input.status,
    source: input.source,
    summary: input.summary,
    details: input.details,
    createdAt: now()
  })
}

const addReceipt = (
  acc: ProofAccumulator,
  input: Omit<AivenReceipt, "id" | "runId" | "agent" | "createdAt"> & {
    idPrefix: string
    agent?: AgentName
    createdAt?: string
  }
) => {
  acc.receipts.push({
    id: id(input.idPrefix),
    runId: acc.runId,
    agent: input.agent ?? "aiven_operator",
    intent: input.intent,
    tool: input.tool,
    target: input.target,
    risk: input.risk,
    result: input.result,
    rollback: input.rollback,
    details: input.details,
    source: input.source,
    createdAt: input.createdAt ?? now()
  })
}

const addCheck = (
  acc: ProofAccumulator,
  input: {
    idPrefix: string
    checkName: string
    status: ProofStatus
    details: Record<string, unknown>
    source: ProofSource
  }
) => {
  acc.checks.push({
    id: id(input.idPrefix),
    runId: acc.runId,
    checkName: input.checkName,
    status: input.status,
    details: input.details,
    source: input.source,
    createdAt: now()
  })
}

const addRowValidation = (
  acc: DataMigrationAccumulator,
  input: {
    table: RowValidation["table"]
    actual: number
    status: RowValidation["status"]
    source: ProofSource
  }
) => {
  acc.rowValidations.push({
    table: input.table,
    expected: expectedRowCounts[input.table],
    actual: input.actual,
    status: input.status,
    source: input.source
  })
}

const addMissingProof = (
  acc: ProofAccumulator,
  input: {
    missingEnv: string[]
    eventType: string
    checkName: string
    receiptTool: string
    target: string
    summary: string
    intent: string
  }
) => {
  for (const name of input.missingEnv) acc.missingEnv.add(name)
  addEvent(acc, {
    type: input.eventType,
    status: "skipped",
    source: "cached",
    summary: `${input.summary}; missing ${input.missingEnv.join(", ")}.`,
    details: { missingEnv: input.missingEnv }
  })
  addReceipt(acc, {
    idPrefix: input.receiptTool,
    intent: input.intent,
    tool: input.receiptTool,
    target: input.target,
    risk: "read_only",
    result: "cached",
    source: "cached",
    details: { missingEnv: input.missingEnv }
  })
  addCheck(acc, {
    idPrefix: input.checkName,
    checkName: input.checkName,
    status: "skipped",
    source: "cached",
    details: { missingEnv: input.missingEnv }
  })
}

const timestampFromPg = (value: unknown) => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return now()
}

const createPgClient = () =>
  new Client({
    connectionString: readEnv("AIVEN_POSTGRES_URL")!,
    ssl:
      readEnv("AIVEN_POSTGRES_SSL") === "false"
        ? undefined
        : { rejectUnauthorized: readEnv("AIVEN_POSTGRES_SSL_REJECT_UNAUTHORIZED") === "true" }
  })

const pad = (value: number) => String(value).padStart(3, "0")

const demoUsers = Array.from({ length: expectedRowCounts.demo_users }, (_, index) => ({
  id: `demo_user_${pad(index + 1)}`,
  handle: ["@mira", "@kai", "@nova", "@sam", "@avi", "@rhea", "@jules", "@toni"][index] ?? `@user${index + 1}`
}))

const buildDemoPosts = (): Post[] => {
  const posts: Post[] = fixturePosts.map((post) => ({ ...post }))
  while (posts.length < expectedRowCounts.posts) {
    const index = posts.length + 1
    const author = demoUsers[(index - 1) % demoUsers.length]
    posts.push({
      id: `post_${pad(index)}`,
      body: `PulseWall migrated post ${index}: Aiden kept the wall, leaderboard, and reaction counts intact.`,
      authorHandle: author.handle,
      reactionCount: 0,
      createdAt: new Date(Date.parse("2026-06-25T09:00:00.000Z") + index * 45_000).toISOString()
    })
  }
  return posts
}

const buildDemoReactions = (posts: Post[]) =>
  Array.from({ length: expectedRowCounts.reactions }, (_, index) => {
    const post = posts[index % posts.length]
    const user = demoUsers[index % demoUsers.length]
    return {
      id: `reaction_${pad(index + 1)}`,
      postId: post.id,
      userId: user.id,
      emoji: ["rocket", "fire", "heart", "clap"][index % 4],
      createdAt: new Date(Date.parse("2026-06-25T09:30:00.000Z") + index * 12_000).toISOString()
    }
  })

const buildDemoAppEvents = (runId: string): PulseWallEvent[] =>
  fixtureAppEvents.slice(0, expectedRowCounts.app_events).map((event, index) => ({
    ...event,
    id: `app_event_${pad(index + 1)}`,
    runId,
    payload: {
      ...event.payload,
      source: "m03_aiven_postgres_seed"
    }
  }))

const verifyAivenProject = async (acc: ProofAccumulator) => {
  const required = missing(["AIVEN_TOKEN", "AIVEN_PROJECT"])
  if (required.length > 0) {
    addMissingProof(acc, {
      missingEnv: required,
      eventType: "aiven.project.detected",
      checkName: "aiven_project_service_visibility",
      receiptTool: "aiven_service_list",
      target: "Aiven project API",
      intent: "list target project services",
      summary: "Aiven project visibility skipped"
    })
    return
  }

  const token = readEnv("AIVEN_TOKEN")
  const project = readEnv("AIVEN_PROJECT")
  const baseUrl = readEnv("AIVEN_API_BASE") ?? "https://api.aiven.io/v1"

  try {
    const response = await fetch(`${baseUrl}/project/${encodeURIComponent(project!)}/service`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) {
      throw new Error(`Aiven service list failed with HTTP ${response.status}`)
    }
    const body = (await response.json()) as { services?: unknown }
    const services = Array.isArray(body.services) ? (body.services as Record<string, unknown>[]) : []
    const serviceNames = services
      .map((service) => service.service_name)
      .filter((serviceName): serviceName is string => typeof serviceName === "string")
    const expectedServices = [readEnv("AIVEN_PG_SERVICE"), readEnv("AIVEN_KAFKA_SERVICE")].filter(
      (serviceName): serviceName is string => Boolean(serviceName)
    )
    const foundExpectedServices = expectedServices.filter((serviceName) => serviceNames.includes(serviceName))
    const missingExpectedServices = expectedServices.filter((serviceName) => !serviceNames.includes(serviceName))
    const serviceCheckPassed = missingExpectedServices.length === 0

    addReceipt(acc, {
      idPrefix: "receipt_aiven_services",
      intent: "list target project services",
      tool: "aiven_service_list",
      target: project!,
      risk: "read_only",
      result: "ok",
      source: "live",
      details: {
        serviceCount: services.length,
        expectedServices,
        foundExpectedServices,
        missingExpectedServices
      }
    })
    addCheck(acc, {
      idPrefix: "check_aiven_project",
      checkName: "aiven_project_service_visibility",
      status: serviceCheckPassed ? "passed" : "failed",
      source: "live",
      details: { serviceCount: services.length, expectedServices, foundExpectedServices, missingExpectedServices }
    })
    addEvent(acc, {
      type: "aiven.project.detected",
      status: serviceCheckPassed ? "ok" : "failed",
      source: "live",
      summary: serviceCheckPassed
        ? `Aiven project API returned ${services.length} services for the target project.`
        : `Aiven project API is reachable, but expected services are missing: ${missingExpectedServices.join(", ")}.`,
      details: { expectedServices, foundExpectedServices, missingExpectedServices }
    })
  } catch (error) {
    const message = safeError(error)
    addReceipt(acc, {
      idPrefix: "receipt_aiven_services_failed",
      intent: "list target project services",
      tool: "aiven_service_list",
      target: project!,
      risk: "read_only",
      result: "failed",
      source: "live",
      details: { error: message }
    })
    addCheck(acc, {
      idPrefix: "check_aiven_project_failed",
      checkName: "aiven_project_service_visibility",
      status: "failed",
      source: "live",
      details: { error: message }
    })
    addEvent(acc, {
      type: "aiven.project.detected",
      status: "failed",
      source: "live",
      summary: `Aiven project visibility failed: ${message}`
    })
  }
}

const verifyPostgres = async (acc: ProofAccumulator) => {
  const required = missing(["AIVEN_POSTGRES_URL"])
  if (required.length > 0) {
    addMissingProof(acc, {
      missingEnv: required,
      eventType: "aiven.postgres.verified",
      checkName: "live_aiven_postgres_receipt_readback",
      receiptTool: "aiven_pg_write",
      target: "Aiven Postgres",
      intent: "write and read an Aiven Postgres receipt",
      summary: "Aiven Postgres receipt proof skipped"
    })
    addEvent(acc, {
      type: "mcp.receipt.written",
      status: "skipped",
      source: "cached",
      summary: `Live MCP receipt write skipped; missing ${required.join(", ")}.`,
      details: { missingEnv: required }
    })
    return
  }

  const connectionString = readEnv("AIVEN_POSTGRES_URL")!
  const client = new Client({
    connectionString,
    ssl:
      readEnv("AIVEN_POSTGRES_SSL") === "false"
        ? undefined
        : { rejectUnauthorized: readEnv("AIVEN_POSTGRES_SSL_REJECT_UNAUTHORIZED") === "true" }
  })

  try {
    await client.connect()
    await client.query("begin")
    await client.query(`
      create table if not exists migration_runs (
        run_id text primary key,
        demo_name text not null default 'pulsewall',
        status text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `)
    await client.query(`
      create table if not exists mcp_receipts (
        id bigserial primary key,
        run_id text not null,
        agent text not null,
        intent text not null,
        tool text not null,
        target text not null,
        risk text not null,
        result text not null,
        rollback text,
        details jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `)
    await client.query(`
      create table if not exists validation_checks (
        id bigserial primary key,
        run_id text not null,
        check_name text not null,
        status text not null,
        details jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `)
    await client.query("alter table mcp_receipts add column if not exists details jsonb not null default '{}'::jsonb")
    await client.query("alter table validation_checks add column if not exists details jsonb not null default '{}'::jsonb")
    await client.query(
      `
      insert into migration_runs (run_id, demo_name, status, updated_at)
      values ($1, 'pulsewall', 'm01_live_proof', now())
      on conflict (run_id) do update set status = excluded.status, updated_at = now()
      `,
      [acc.runId]
    )

    const receiptWrite = await client.query<{ id: string; created_at: Date }>(
      `
      insert into mcp_receipts (run_id, agent, intent, tool, target, risk, result, rollback, details)
      values (
        $1,
        'aiven_operator',
        'write mission 01 live receipt',
        'aiven_pg_write',
        'mcp_receipts',
        'safe_write',
        'ok',
        'delete from mcp_receipts where run_id = ''' || $1 || ''' and tool = ''aiven_pg_write''',
        $2::jsonb
      )
      returning id::text, created_at
      `,
      [
        acc.runId,
        JSON.stringify({
          mission: "m01",
          proof: "postgres_receipt_write_readback",
          source: "aiden-api"
        })
      ]
    )
    const readback = await client.query<{ receipt_count: number }>(
      "select count(*)::int as receipt_count from mcp_receipts where run_id = $1",
      [acc.runId]
    )
    await client.query(
      `
      insert into validation_checks (run_id, check_name, status, details)
      values ($1, 'live_aiven_postgres_receipt_readback', 'passed', $2::jsonb)
      `,
      [acc.runId, JSON.stringify({ receiptCount: readback.rows[0]?.receipt_count ?? 0 })]
    )
    await client.query("commit")

    const receiptCount = readback.rows[0]?.receipt_count ?? 0
    addReceipt(acc, {
      idPrefix: `receipt_pg_${receiptWrite.rows[0]?.id ?? "write"}`,
      intent: "write mission 01 live receipt",
      tool: "aiven_pg_write",
      target: "mcp_receipts",
      risk: "safe_write",
      result: "ok",
      rollback: "delete the run-scoped mcp_receipts and validation_checks rows",
      source: "live",
      createdAt: timestampFromPg(receiptWrite.rows[0]?.created_at),
      details: { receiptCount }
    })
    addReceipt(acc, {
      idPrefix: "receipt_pg_readback",
      intent: "read mission 01 receipt count",
      tool: "aiven_pg_read",
      target: "mcp_receipts",
      risk: "read_only",
      result: "ok",
      source: "live",
      details: { receiptCount }
    })
    addCheck(acc, {
      idPrefix: "check_pg_readback",
      checkName: "live_aiven_postgres_receipt_readback",
      status: "passed",
      source: "live",
      details: { receiptCount }
    })
    addEvent(acc, {
      type: "aiven.postgres.verified",
      status: "ok",
      source: "live",
      summary: `Aiven Postgres accepted and read back a run-scoped MCP receipt (${receiptCount} receipts for run).`,
      details: { receiptCount }
    })
    addEvent(acc, {
      type: "mcp.receipt.written",
      status: "ok",
      source: "live",
      summary: "Live MCP-style receipt was written to Aiven Postgres with rollback metadata.",
      details: { receiptCount }
    })
  } catch (error) {
    await client.query("rollback").catch(() => undefined)
    const message = safeError(error)
    addReceipt(acc, {
      idPrefix: "receipt_pg_failed",
      intent: "write and read mission 01 live receipt",
      tool: "aiven_pg_write",
      target: "mcp_receipts",
      risk: "safe_write",
      result: "failed",
      source: "live",
      details: { error: message }
    })
    addCheck(acc, {
      idPrefix: "check_pg_failed",
      checkName: "live_aiven_postgres_receipt_readback",
      status: "failed",
      source: "live",
      details: { error: message }
    })
    addEvent(acc, {
      type: "aiven.postgres.verified",
      status: "failed",
      source: "live",
      summary: `Aiven Postgres proof failed: ${message}`
    })
    addEvent(acc, {
      type: "mcp.receipt.written",
      status: "failed",
      source: "live",
      summary: `Live MCP receipt write failed: ${message}`
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}

const verifyKafka = async (acc: ProofAccumulator) => {
  const required = missing(["AIVEN_KAFKA_BOOTSTRAP_SERVERS", "AIVEN_KAFKA_USERNAME", "AIVEN_KAFKA_PASSWORD"])
  const topic = readEnv("AIVEN_KAFKA_TOPIC") ?? "migration.events"
  if (required.length > 0) {
    addMissingProof(acc, {
      missingEnv: required,
      eventType: "aiven.kafka.verified",
      checkName: "kafka_agent_bus_roundtrip",
      receiptTool: "aiven_kafka_topic_message_produce",
      target: topic,
      intent: "produce and observe an agent workflow event",
      summary: "Aiven Kafka agent-bus proof skipped"
    })
    addEvent(acc, {
      type: "kafka.agent_bus_roundtrip.passed",
      status: "skipped",
      source: "cached",
      state: "realtime_validated",
      summary: `Aiven Kafka roundtrip skipped; missing ${required.join(", ")}.`,
      details: { topic, missingEnv: required }
    })
    return
  }

  const brokers = readEnv("AIVEN_KAFKA_BOOTSTRAP_SERVERS")!
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean)
  const messageId = randomUUID()
  const kafka = new Kafka({
    clientId: `aiden-m01-${acc.runId}`.slice(0, 80),
    brokers,
    ssl: readEnv("AIVEN_KAFKA_SSL") === "false" ? undefined : true,
    sasl: {
      mechanism: "plain",
      username: readEnv("AIVEN_KAFKA_USERNAME")!,
      password: readEnv("AIVEN_KAFKA_PASSWORD")!
    },
    connectionTimeout: 6000,
    requestTimeout: 9000,
    logLevel: logLevel.NOTHING
  })

  const admin = kafka.admin()
  const producer = kafka.producer()
  const consumer = kafka.consumer({ groupId: `aiden-m01-${acc.runId}-${Date.now()}`.slice(0, 120) })

  try {
    await admin.connect()
    let topicStatus: "created" | "existing_or_reused" = "existing_or_reused"
    try {
      const created = await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic }]
      })
      topicStatus = created ? "created" : "existing_or_reused"
    } catch (error) {
      const message = safeError(error).toLowerCase()
      if (!message.includes("already exists") && !message.includes("topic with this name")) throw error
    }

    addReceipt(acc, {
      idPrefix: "receipt_kafka_topic",
      intent: "verify agent bus topic",
      tool: "aiven_kafka_topic_create",
      target: topic,
      risk: "safe_write",
      result: "ok",
      rollback: "delete topic after demo only if it was created for the rehearsal",
      source: "live",
      details: { topicStatus }
    })
    addEvent(acc, {
      type: "aiven.kafka.verified",
      status: "ok",
      source: "live",
      summary: `Aiven Kafka topic ${topic} is reachable for the agent bus.`,
      details: { topic, topicStatus }
    })

    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })
    let settled = false
    const observed = new Promise<boolean>((resolve) => {
      const settle = (value: boolean) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        resolve(value)
      }
      const timeout = setTimeout(() => settle(false), 8000)
      void consumer
        .run({
          eachMessage: async ({ message }) => {
            const value = message.value?.toString() ?? ""
            if (value.includes(messageId)) settle(true)
          }
        })
        .catch(() => settle(false))
    })
    await new Promise((resolve) => setTimeout(resolve, 500))

    await producer.connect()
    await producer.send({
      topic,
      messages: [
        {
          key: acc.runId,
          value: JSON.stringify({
            id: messageId,
            runId: acc.runId,
            type: "kafka.agent_bus_roundtrip.passed",
            agent: "aiven_operator",
            createdAt: now()
          })
        }
      ]
    })

    const listed = await observed
    addReceipt(acc, {
      idPrefix: "receipt_kafka_produce",
      intent: "produce agent workflow event",
      tool: "aiven_kafka_topic_message_produce",
      target: topic,
      risk: "safe_write",
      result: "ok",
      source: "live",
      details: { messageId }
    })
    addReceipt(acc, {
      idPrefix: "receipt_kafka_observe",
      intent: "observe agent workflow event",
      tool: "aiven_kafka_topic_message_consume",
      target: topic,
      risk: "read_only",
      result: listed ? "ok" : "failed",
      source: "live",
      details: { messageId, observed: listed }
    })
    addCheck(acc, {
      idPrefix: "check_kafka_roundtrip",
      checkName: "kafka_agent_bus_roundtrip",
      status: listed ? "passed" : "failed",
      source: "live",
      details: { topic, produced: 1, observed: listed ? 1 : 0 }
    })
    addEvent(acc, {
      type: "kafka.agent_bus_roundtrip.passed",
      status: listed ? "ok" : "failed",
      source: "live",
      state: "realtime_validated",
      summary: listed
        ? "Aiven Kafka migration.events produced and consumed a live agent workflow event."
        : "Aiven Kafka produced an agent workflow event, but the consumer did not observe it before timeout.",
      details: { topic, messageId, observed: listed }
    })
  } catch (error) {
    const message = safeError(error)
    addReceipt(acc, {
      idPrefix: "receipt_kafka_failed",
      intent: "produce and observe agent workflow event",
      tool: "aiven_kafka_topic_message_produce",
      target: topic,
      risk: "safe_write",
      result: "failed",
      source: "live",
      details: { error: message }
    })
    addCheck(acc, {
      idPrefix: "check_kafka_failed",
      checkName: "kafka_agent_bus_roundtrip",
      status: "failed",
      source: "live",
      details: { topic, error: message }
    })
    addEvent(acc, {
      type: "aiven.kafka.verified",
      status: "failed",
      source: "live",
      summary: `Aiven Kafka proof failed: ${message}`,
      details: { topic }
    })
    addEvent(acc, {
      type: "kafka.agent_bus_roundtrip.passed",
      status: "failed",
      source: "live",
      state: "realtime_validated",
      summary: `Aiven Kafka roundtrip failed: ${message}`,
      details: { topic }
    })
  } finally {
    await Promise.allSettled([producer.disconnect(), consumer.disconnect(), admin.disconnect()])
  }
}

type KafkaWorkflowEnvelope = {
  id: string
  runId: string
  type: string
  agent: AgentName
  state: RunState
  status: RunEvent["status"]
  source: ProofSource
  summary: string
  details?: Record<string, unknown>
  createdAt: string
}

const fallbackKafkaWorkflowEvents = (runId: string): RunEvent[] => [
  {
    runId,
    type: "kafka.agent_bus.requested",
    agent: "aiven_operator",
    state: "realtime_validated",
    status: "started",
    source: "cached",
    summary: "Kafka agent-bus proof requested before workflow events were available.",
    createdAt: now()
  }
]

const cachedKafkaEventsFor = (topic: string, missingEnv: string[], workflowEvents: RunEvent[]): RunEvent[] =>
  workflowEvents.map((event) => ({
    ...event,
    source: "cached",
    status: "skipped",
    summary: `Cached Kafka agent-bus event: ${event.summary}`,
    details: {
      ...event.details,
      topic,
      observed: false,
      missingEnv,
      originalSource: event.source,
      originalStatus: event.status
    },
    createdAt: now()
  }))

export const runKafkaAgentBusProof = async (
  runId: string,
  inputWorkflowEvents: RunEvent[]
): Promise<KafkaAgentBusResult> => {
  const acc: ProofAccumulator = {
    runId,
    missingEnv: new Set<string>(),
    events: [],
    receipts: [],
    checks: []
  }
  const topic = readEnv("AIVEN_KAFKA_TOPIC") ?? "migration.events"
  const workflowEvents = inputWorkflowEvents.length > 0 ? inputWorkflowEvents : fallbackKafkaWorkflowEvents(runId)
  const required = missing(["AIVEN_KAFKA_BOOTSTRAP_SERVERS", "AIVEN_KAFKA_USERNAME", "AIVEN_KAFKA_PASSWORD"])

  if (required.length > 0) {
    for (const name of required) acc.missingEnv.add(name)
    const kafkaEvents = cachedKafkaEventsFor(topic, required, workflowEvents)
    addReceipt(acc, {
      idPrefix: "receipt_kafka_bus_produce_cached",
      intent: "produce workflow transition events to the agent bus",
      tool: "aiven_kafka_topic_message_produce",
      target: topic,
      risk: "safe_write",
      result: "cached",
      source: "cached",
      details: { topic, expectedEvents: workflowEvents.length, missingEnv: required }
    })
    addReceipt(acc, {
      idPrefix: "receipt_kafka_bus_consume_cached",
      intent: "consume workflow transition events from the agent bus",
      tool: "aiven_kafka_topic_message_consume",
      target: topic,
      risk: "read_only",
      result: "cached",
      source: "cached",
      details: { topic, observed: 0, expectedEvents: workflowEvents.length, missingEnv: required }
    })
    addCheck(acc, {
      idPrefix: "check_kafka_bus_cached",
      checkName: "kafka_agent_bus_roundtrip",
      status: "skipped",
      source: "cached",
      details: { topic, produced: 0, observed: 0, expectedEvents: workflowEvents.length, missingEnv: required }
    })
    addEvent(acc, {
      type: "aiven.kafka.verified",
      status: "skipped",
      source: "cached",
      summary: `Aiven Kafka workflow bus skipped; missing ${required.join(", ")}.`,
      details: { topic, missingEnv: required, expectedEvents: workflowEvents.length }
    })
    addEvent(acc, {
      type: "kafka.agent_bus_roundtrip.passed",
      status: "skipped",
      source: "cached",
      state: "realtime_validated",
      summary: `Kafka agent-bus workflow roundtrip skipped; ${workflowEvents.length} cached workflow events are shown.`,
      details: { topic, missingEnv: required, expectedEvents: workflowEvents.length }
    })

    return {
      source: "cached",
      ok: false,
      missingEnv: [...acc.missingEnv],
      events: acc.events,
      kafkaEvents,
      receipts: acc.receipts,
      checks: acc.checks
    }
  }

  const brokers = readEnv("AIVEN_KAFKA_BOOTSTRAP_SERVERS")!
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean)
  const envelopes: KafkaWorkflowEnvelope[] = workflowEvents.map((event) => ({
    id: randomUUID(),
    runId,
    type: event.type,
    agent: event.agent,
    state: event.state,
    status: event.status,
    source: event.source,
    summary: event.summary,
    details: event.details,
    createdAt: now()
  }))
  const expectedIds = new Set(envelopes.map((event) => event.id))
  const observed = new Map<string, KafkaWorkflowEnvelope>()
  const kafka = new Kafka({
    clientId: `aiden-m04-${runId}`.slice(0, 80),
    brokers,
    ssl: readEnv("AIVEN_KAFKA_SSL") === "false" ? undefined : true,
    sasl: {
      mechanism: "plain",
      username: readEnv("AIVEN_KAFKA_USERNAME")!,
      password: readEnv("AIVEN_KAFKA_PASSWORD")!
    },
    connectionTimeout: 6000,
    requestTimeout: 9000,
    logLevel: logLevel.NOTHING
  })
  const admin = kafka.admin()
  const producer = kafka.producer()
  const consumer = kafka.consumer({ groupId: `aiden-m04-${runId}-${Date.now()}`.slice(0, 120) })

  try {
    await admin.connect()
    let topicStatus: "created" | "existing_or_reused" = "existing_or_reused"
    try {
      const created = await admin.createTopics({
        waitForLeaders: true,
        topics: [{ topic }]
      })
      topicStatus = created ? "created" : "existing_or_reused"
    } catch (error) {
      const message = safeError(error).toLowerCase()
      if (!message.includes("already exists") && !message.includes("topic with this name")) throw error
    }

    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })

    let settled = false
    let timeout: NodeJS.Timeout | undefined
    const observedAll = new Promise<boolean>((resolve) => {
      const settle = (value: boolean) => {
        if (settled) return
        settled = true
        if (timeout) clearTimeout(timeout)
        resolve(value)
      }
      timeout = setTimeout(() => settle(false), 9000)
      void consumer
        .run({
          eachMessage: async ({ message }) => {
            const value = message.value?.toString()
            if (!value) return
            try {
              const payload = JSON.parse(value) as KafkaWorkflowEnvelope
              if (!expectedIds.has(payload.id)) return
              observed.set(payload.id, payload)
              if (observed.size === expectedIds.size) settle(true)
            } catch {
              // Ignore unrelated messages on a shared demo topic.
            }
          }
        })
        .catch(() => settle(false))
    })
    await new Promise((resolve) => setTimeout(resolve, 500))

    await producer.connect()
    await producer.send({
      topic,
      messages: envelopes.map((event) => ({
        key: `${runId}:${event.type}`,
        value: JSON.stringify(event)
      }))
    })

    const allObserved = await observedAll
    const missingMessageIds = envelopes.filter((event) => !observed.has(event.id)).map((event) => event.id)
    const kafkaEvents: RunEvent[] = envelopes.map((event) => {
      const observedEvent = observed.get(event.id)
      return {
        runId,
        type: event.type,
        agent: event.agent,
        state: event.state,
        status: observedEvent ? event.status : "failed",
        source: "live",
        summary: observedEvent
          ? event.summary
          : `Kafka did not consume workflow event ${event.type} before timeout.`,
        details: {
          ...event.details,
          topic,
          messageId: event.id,
          observed: Boolean(observedEvent),
          originalSource: event.source,
          originalStatus: event.status
        },
        createdAt: observedEvent?.createdAt ?? now()
      }
    })

    addReceipt(acc, {
      idPrefix: "receipt_kafka_bus_topic",
      intent: "create or verify agent-bus topic",
      tool: "aiven_kafka_topic_create",
      target: topic,
      risk: "safe_write",
      result: "ok",
      rollback: "delete topic after demo only if it was created for the rehearsal",
      source: "live",
      details: { topicStatus, eventCount: envelopes.length }
    })
    addReceipt(acc, {
      idPrefix: "receipt_kafka_bus_produce",
      intent: "produce workflow transition events to the agent bus",
      tool: "aiven_kafka_topic_message_produce",
      target: topic,
      risk: "safe_write",
      result: "ok",
      source: "live",
      details: { topic, produced: envelopes.length, messageIds: envelopes.map((event) => event.id) }
    })
    addReceipt(acc, {
      idPrefix: "receipt_kafka_bus_consume",
      intent: "consume workflow transition events from the agent bus",
      tool: "aiven_kafka_topic_message_consume",
      target: topic,
      risk: "read_only",
      result: allObserved ? "ok" : "failed",
      source: "live",
      details: {
        topic,
        observed: observed.size,
        expectedEvents: envelopes.length,
        missingMessageIds
      }
    })
    addCheck(acc, {
      idPrefix: "check_kafka_bus_roundtrip",
      checkName: "kafka_agent_bus_roundtrip",
      status: allObserved ? "passed" : "failed",
      source: "live",
      details: { topic, produced: envelopes.length, observed: observed.size, missingMessageIds }
    })
    addEvent(acc, {
      type: "aiven.kafka.verified",
      status: "ok",
      source: "live",
      summary: `Aiven Kafka topic ${topic} is ready for workflow agent-bus events.`,
      details: { topic, topicStatus, expectedEvents: envelopes.length }
    })
    addEvent(acc, {
      type: "kafka.agent_bus_roundtrip.passed",
      status: allObserved ? "ok" : "failed",
      source: "live",
      state: "realtime_validated",
      summary: allObserved
        ? `Aiven Kafka consumed ${observed.size}/${envelopes.length} workflow agent-bus events.`
        : `Aiven Kafka produced ${envelopes.length} workflow events but consumed ${observed.size} before timeout.`,
      details: { topic, produced: envelopes.length, observed: observed.size, missingMessageIds }
    })

    return {
      source: sourceFrom(acc),
      ok: allObserved,
      missingEnv: [],
      events: acc.events,
      kafkaEvents,
      receipts: acc.receipts,
      checks: acc.checks
    }
  } catch (error) {
    const message = safeError(error)
    const kafkaEvents: RunEvent[] = envelopes.map((event) => ({
      runId,
      type: event.type,
      agent: event.agent,
      state: event.state,
      status: "failed",
      source: "live",
      summary: `Kafka agent-bus event ${event.type} failed: ${message}`,
      details: {
        topic,
        messageId: event.id,
        observed: false,
        originalSource: event.source,
        originalStatus: event.status,
        error: message
      },
      createdAt: now()
    }))
    addReceipt(acc, {
      idPrefix: "receipt_kafka_bus_failed",
      intent: "produce and consume workflow transition events",
      tool: "aiven_kafka_topic_message_produce",
      target: topic,
      risk: "safe_write",
      result: "failed",
      source: "live",
      details: { error: message }
    })
    addCheck(acc, {
      idPrefix: "check_kafka_bus_failed",
      checkName: "kafka_agent_bus_roundtrip",
      status: "failed",
      source: "live",
      details: { topic, error: message }
    })
    addEvent(acc, {
      type: "aiven.kafka.verified",
      status: "failed",
      source: "live",
      summary: `Aiven Kafka workflow bus failed: ${message}`,
      details: { topic }
    })
    addEvent(acc, {
      type: "kafka.agent_bus_roundtrip.passed",
      status: "failed",
      source: "live",
      state: "realtime_validated",
      summary: `Kafka workflow event roundtrip failed: ${message}`,
      details: { topic }
    })

    return {
      source: sourceFrom(acc),
      ok: false,
      missingEnv: [],
      events: acc.events,
      kafkaEvents,
      receipts: acc.receipts,
      checks: acc.checks
    }
  } finally {
    await Promise.allSettled([producer.disconnect(), consumer.disconnect(), admin.disconnect()])
  }
}

export const runAivenProofSpine = async (runId: string): Promise<ProofSpineResult> => {
  const acc: ProofAccumulator = {
    runId,
    missingEnv: new Set<string>(),
    events: [],
    receipts: [],
    checks: []
  }

  await verifyAivenProject(acc)
  await verifyPostgres(acc)
  await verifyKafka(acc)

  return {
    source: sourceFrom(acc),
    ok: acc.checks.length > 0 && acc.checks.every((check) => check.status === "passed"),
    missingEnv: [...acc.missingEnv],
    events: acc.events,
    receipts: acc.receipts,
    checks: acc.checks
  }
}

const addMissingDataMigration = (acc: DataMigrationAccumulator, missingEnv: string[]) => {
  for (const name of missingEnv) acc.missingEnv.add(name)
  for (const table of Object.keys(expectedRowCounts) as RowValidation["table"][]) {
    addRowValidation(acc, {
      table,
      actual: 0,
      status: "skipped",
      source: "cached"
    })
    addCheck(acc, {
      idPrefix: `check_${table}_cached`,
      checkName: `${table}_row_count`,
      status: "skipped",
      source: "cached",
      details: { expected: expectedRowCounts[table], actual: 0, missingEnv }
    })
  }
  addCheck(acc, {
    idPrefix: "check_pg_smoke_cached",
    checkName: "aiven_postgres_smoke_query",
    status: "skipped",
    source: "cached",
    details: { query: "select count(*) from posts limit 1", missingEnv }
  })
  addReceipt(acc, {
    idPrefix: "receipt_data_migration_cached",
    intent: "create PulseWall demo schema and load representative rows",
    tool: "aiven_pg_write",
    target: "posts,reactions,demo_users,app_events",
    risk: "safe_write",
    result: "cached",
    source: "cached",
    details: { missingEnv }
  })
  addReceipt(acc, {
    idPrefix: "receipt_data_validation_cached",
    intent: "read PulseWall row counts from Aiven Postgres",
    tool: "aiven_pg_read",
    target: "posts,reactions,demo_users,app_events",
    risk: "read_only",
    result: "cached",
    source: "cached",
    details: { missingEnv }
  })
  addEvent(acc, {
    type: "migration.schema.applied",
    agent: "migration_operator",
    state: "migration_running",
    status: "skipped",
    source: "cached",
    summary: `Aiven Postgres data migration skipped; missing ${missingEnv.join(", ")}.`,
    details: { missingEnv }
  })
  addEvent(acc, {
    type: "migration.rows.validated",
    agent: "validation_auditor",
    state: "migration_validated",
    status: "skipped",
    source: "cached",
    summary: `Aiven Postgres row validation skipped; missing ${missingEnv.join(", ")}.`,
    details: { missingEnv }
  })
}

const ensureDataMigrationTables = async (client: InstanceType<typeof Client>) => {
  await client.query(`
    create table if not exists migration_runs (
      run_id text primary key,
      demo_name text not null default 'pulsewall',
      status text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create table if not exists mcp_receipts (
      id bigserial primary key,
      run_id text not null,
      agent text not null,
      intent text not null,
      tool text not null,
      target text not null,
      risk text not null,
      result text not null,
      rollback text,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create table if not exists validation_checks (
      id bigserial primary key,
      run_id text not null,
      check_name text not null,
      status text not null,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create table if not exists demo_users (
      id text primary key,
      handle text not null,
      created_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create table if not exists posts (
      id text primary key,
      author_id text references demo_users(id),
      author_handle text not null,
      body text not null,
      image_url text,
      reaction_count int not null default 0,
      created_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create table if not exists reactions (
      id text primary key,
      post_id text references posts(id) on delete cascade,
      user_id text references demo_users(id),
      emoji text not null,
      created_at timestamptz not null default now()
    )
  `)
  await client.query(`
    create table if not exists app_events (
      id text primary key,
      run_id text not null,
      event_type text not null,
      entity_type text,
      entity_id text,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)
  await client.query("create index if not exists app_events_run_created_idx on app_events (run_id, created_at desc, id desc)")
}

const insertMigrationReceipt = async (
  client: InstanceType<typeof Client>,
  input: {
    runId: string
    agent: AgentName
    intent: string
    tool: string
    target: string
    risk: AivenReceipt["risk"]
    result: AivenReceipt["result"]
    rollback?: string
    details: Record<string, unknown>
  }
) => {
  await client.query(
    `
    insert into mcp_receipts (run_id, agent, intent, tool, target, risk, result, rollback, details)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    `,
    [
      input.runId,
      input.agent,
      input.intent,
      input.tool,
      input.target,
      input.risk,
      input.result,
      input.rollback ?? null,
      JSON.stringify(input.details)
    ]
  )
}

export const runAivenDataMigration = async (runId: string): Promise<DataMigrationResult> => {
  const acc: DataMigrationAccumulator = {
    runId,
    missingEnv: new Set<string>(),
    events: [],
    receipts: [],
    checks: [],
    rowValidations: []
  }

  const required = missing(["AIVEN_POSTGRES_URL"])
  if (required.length > 0) {
    addMissingDataMigration(acc, required)
    return {
      source: "cached",
      ok: false,
      missingEnv: [...acc.missingEnv],
      events: acc.events,
      receipts: acc.receipts,
      checks: acc.checks,
      rowValidations: acc.rowValidations
    }
  }

  const client = createPgClient()
  const demoPosts = buildDemoPosts()
  const demoReactions = buildDemoReactions(demoPosts)
  const demoEvents = buildDemoAppEvents(runId)

  try {
    await client.connect()
    await client.query("begin")
    await ensureDataMigrationTables(client)
    await client.query(
      `
      insert into migration_runs (run_id, demo_name, status, updated_at)
      values ($1, 'pulsewall', 'm03_data_migration', now())
      on conflict (run_id) do update set status = excluded.status, updated_at = now()
      `,
      [runId]
    )

    await client.query("delete from app_events where run_id = $1 and id like 'app_event_%'", [runId])
    await client.query("delete from reactions where id like 'reaction_%'")
    await client.query("delete from posts where id like 'post_%'")
    await client.query("delete from demo_users where id like 'demo_user_%'")

    for (const user of demoUsers) {
      await client.query(
        `
        insert into demo_users (id, handle)
        values ($1, $2)
        on conflict (id) do update set handle = excluded.handle
        `,
        [user.id, user.handle]
      )
    }

    for (const post of demoPosts) {
      const user = demoUsers.find((candidate) => candidate.handle === post.authorHandle) ?? demoUsers[0]
      await client.query(
        `
        insert into posts (id, author_id, author_handle, body, image_url, reaction_count, created_at)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do update set
          author_id = excluded.author_id,
          author_handle = excluded.author_handle,
          body = excluded.body,
          image_url = excluded.image_url,
          reaction_count = excluded.reaction_count,
          created_at = excluded.created_at
        `,
        [post.id, user.id, post.authorHandle, post.body, post.imageUrl ?? null, post.reactionCount, post.createdAt]
      )
    }

    for (const reaction of demoReactions) {
      await client.query(
        `
        insert into reactions (id, post_id, user_id, emoji, created_at)
        values ($1, $2, $3, $4, $5)
        on conflict (id) do update set
          post_id = excluded.post_id,
          user_id = excluded.user_id,
          emoji = excluded.emoji,
          created_at = excluded.created_at
        `,
        [reaction.id, reaction.postId, reaction.userId, reaction.emoji, reaction.createdAt]
      )
    }

    for (const event of demoEvents) {
      await client.query(
        `
        insert into app_events (id, run_id, event_type, entity_type, entity_id, payload, created_at)
        values ($1, $2, $3, $4, $5, $6::jsonb, $7)
        on conflict (id) do update set
          run_id = excluded.run_id,
          event_type = excluded.event_type,
          entity_type = excluded.entity_type,
          entity_id = excluded.entity_id,
          payload = excluded.payload,
          created_at = excluded.created_at
        `,
        [event.id, runId, event.eventType, event.entityType, event.entityId, JSON.stringify(event.payload), event.createdAt]
      )
    }

    await insertMigrationReceipt(client, {
      runId,
      agent: "migration_operator",
      intent: "apply PulseWall demo schema",
      tool: "aiven_pg_write",
      target: "posts,reactions,demo_users,app_events",
      risk: "safe_write",
      result: "ok",
      rollback: "delete rows with demo id prefixes and app_events for this run",
      details: { mission: "m03", tables: Object.keys(expectedRowCounts) }
    })
    await insertMigrationReceipt(client, {
      runId,
      agent: "migration_operator",
      intent: "load representative PulseWall rows",
      tool: "aiven_pg_write",
      target: "posts,reactions,demo_users,app_events",
      risk: "safe_write",
      result: "ok",
      rollback: "delete rows with demo id prefixes and app_events for this run",
      details: { expectedRowCounts }
    })

    const counts = await client.query<{
      posts: number
      reactions: number
      demo_users: number
      app_events: number
    }>(
      `
      select
        (select count(*)::int from posts where id like 'post_%') as posts,
        (select count(*)::int from reactions where id like 'reaction_%') as reactions,
        (select count(*)::int from demo_users where id like 'demo_user_%') as demo_users,
        (select count(*)::int from app_events where run_id = $1 and id like 'app_event_%') as app_events
      `,
      [runId]
    )
    const actual = counts.rows[0] ?? { posts: 0, reactions: 0, demo_users: 0, app_events: 0 }

    const validations = (Object.keys(expectedRowCounts) as RowValidation["table"][]).map((table) => ({
      table,
      actual: actual[table],
      passed: actual[table] === expectedRowCounts[table]
    }))
    for (const validation of validations) {
      addRowValidation(acc, {
        table: validation.table,
        actual: validation.actual,
        status: validation.passed ? "passed" : "failed",
        source: "live"
      })
      addCheck(acc, {
        idPrefix: `check_${validation.table}_live`,
        checkName: `${validation.table}_row_count`,
        status: validation.passed ? "passed" : "failed",
        source: "live",
        details: { expected: expectedRowCounts[validation.table], actual: validation.actual }
      })
      await client.query(
        `
        insert into validation_checks (run_id, check_name, status, details)
        values ($1, $2, $3, $4::jsonb)
        `,
        [
          runId,
          `${validation.table}_row_count`,
          validation.passed ? "passed" : "failed",
          JSON.stringify({ expected: expectedRowCounts[validation.table], actual: validation.actual })
        ]
      )
    }

    const smoke = await client.query<{ returned_rows: number }>("select count(*)::int as returned_rows from posts limit 1")
    const returnedRows = smoke.rows.length
    addCheck(acc, {
      idPrefix: "check_pg_smoke_live",
      checkName: "aiven_postgres_smoke_query",
      status: returnedRows === 1 ? "passed" : "failed",
      source: "live",
      details: { query: "select count(*) from posts limit 1", returnedRows }
    })
    await client.query(
      `
      insert into validation_checks (run_id, check_name, status, details)
      values ($1, 'aiven_postgres_smoke_query', $2, $3::jsonb)
      `,
      [
        runId,
        returnedRows === 1 ? "passed" : "failed",
        JSON.stringify({ query: "select count(*) from posts limit 1", returnedRows })
      ]
    )

    await insertMigrationReceipt(client, {
      runId,
      agent: "validation_auditor",
      intent: "read PulseWall row counts",
      tool: "aiven_pg_read",
      target: "posts,reactions,demo_users,app_events",
      risk: "read_only",
      result: validations.every((validation) => validation.passed) && returnedRows === 1 ? "ok" : "failed",
      details: { expectedRowCounts, actual }
    })

    await client.query("commit")

    addReceipt(acc, {
      idPrefix: "receipt_schema_apply_live",
      agent: "migration_operator",
      intent: "apply PulseWall demo schema",
      tool: "aiven_pg_write",
      target: "posts,reactions,demo_users,app_events",
      risk: "safe_write",
      result: "ok",
      rollback: "delete demo-prefixed rows and run-scoped app_events",
      source: "live",
      details: { tables: Object.keys(expectedRowCounts) }
    })
    addReceipt(acc, {
      idPrefix: "receipt_data_load_live",
      agent: "migration_operator",
      intent: "load representative PulseWall rows",
      tool: "aiven_pg_write",
      target: "posts,reactions,demo_users,app_events",
      risk: "safe_write",
      result: "ok",
      rollback: "delete demo-prefixed rows and run-scoped app_events",
      source: "live",
      details: { expectedRowCounts, actual }
    })
    addReceipt(acc, {
      idPrefix: "receipt_data_validate_live",
      agent: "validation_auditor",
      intent: "read PulseWall row counts",
      tool: "aiven_pg_read",
      target: "posts,reactions,demo_users,app_events",
      risk: "read_only",
      result: validations.every((validation) => validation.passed) && returnedRows === 1 ? "ok" : "failed",
      source: "live",
      details: { expectedRowCounts, actual }
    })

    const allPassed = acc.rowValidations.every((validation) => validation.status === "passed") &&
      acc.checks.every((check) => check.status === "passed")
    addEvent(acc, {
      type: "migration.schema.applied",
      agent: "migration_operator",
      state: "migration_running",
      status: "ok",
      source: "live",
      summary: "PulseWall demo schema and representative rows were applied to Aiven Postgres.",
      details: { tables: Object.keys(expectedRowCounts), expectedRowCounts }
    })
    addEvent(acc, {
      type: "migration.rows.validated",
      agent: "validation_auditor",
      state: "migration_validated",
      status: allPassed ? "ok" : "failed",
      source: "live",
      summary: allPassed
        ? "Aiven Postgres row counts match the scoped PulseWall demo dataset."
        : "Aiven Postgres row-count validation failed for the scoped PulseWall demo dataset.",
      details: { expectedRowCounts, actual }
    })

    return {
      source: "live",
      ok: allPassed,
      missingEnv: [],
      events: acc.events,
      receipts: acc.receipts,
      checks: acc.checks,
      rowValidations: acc.rowValidations
    }
  } catch (error) {
    await client.query("rollback").catch(() => undefined)
    const message = safeError(error)
    addEvent(acc, {
      type: "migration.schema.applied",
      agent: "migration_operator",
      state: "migration_running",
      status: "failed",
      source: "live",
      summary: `Aiven Postgres data migration failed: ${message}`
    })
    addEvent(acc, {
      type: "migration.rows.validated",
      agent: "validation_auditor",
      state: "migration_validated",
      status: "failed",
      source: "live",
      summary: `Aiven Postgres row validation failed: ${message}`
    })
    addReceipt(acc, {
      idPrefix: "receipt_data_migration_failed",
      agent: "migration_operator",
      intent: "create PulseWall demo schema and load representative rows",
      tool: "aiven_pg_write",
      target: "posts,reactions,demo_users,app_events",
      risk: "safe_write",
      result: "failed",
      source: "live",
      details: { error: message }
    })
    addCheck(acc, {
      idPrefix: "check_data_migration_failed",
      checkName: "aiven_postgres_data_migration",
      status: "failed",
      source: "live",
      details: { error: message }
    })
    return {
      source: "live",
      ok: false,
      missingEnv: [],
      events: acc.events,
      receipts: acc.receipts,
      checks: acc.checks,
      rowValidations: acc.rowValidations
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

export const stubProofClient: ProofClient = {
  async listReceipts() {
    return fixtureReceipts
  }
}
