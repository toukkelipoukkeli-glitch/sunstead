// server/cto-chat.ts — the "Aiven CTO" agent: a calm senior infra lead for a non-technical
// founder, grounded in their REAL Aiven infra. This is the product centerpiece — after migration
// the founder never opens the Aiven dashboard; they just talk to this.
//
// It's a real Claude tool-use loop (@anthropic-ai/sdk, model claude-opus-4-8) with read-only tools
// over the tenant's actual Postgres + the Aiven REST API. Advisory-first: it PROPOSES next steps
// and asks for explicit confirmation before any write/risky/cost action — it never mutates infra.
//
// Streaming: the answer streams out token-by-token via emit({type:'text', value}). Tool calls emit
// a short emit({type:'tool', ...}) notice. On completion emit({type:'done'}); on failure 'error'.
//
// Degradation: if ANTHROPIC_API_KEY is unset (or the model path fails), it falls back to a
// deterministic infra summary built straight from get_metrics() so the panel is never empty.

import Anthropic from '@anthropic-ai/sdk'
import { q, q1 } from '../aiven/pg.ts'
import { AIVEN_PROJECT, hasAivenToken, hasAnthropic } from './env.ts'

// ───────────────────────── config ─────────────────────────

const MODEL = process.env.OVERMIND_MODEL ?? 'claude-opus-4-8'
// Bounded tool-loop turns so the agent can never run away mid-conversation.
const MAX_TURNS = Number(process.env.OVERMIND_CTO_MAX_TURNS ?? 8)

// ───────────────────────── public types ─────────────────────────

export type CtoChunk = { type: 'text' | 'tool' | 'done' | 'error'; value: string }

export interface CtoChatOpts {
  tenantId: string
  message: string
  history?: { role: 'user' | 'assistant'; content: string }[]
}

// ───────────────────────── tenant → connection ─────────────────────────

/**
 * Map a tenant to its Postgres connection string. For the 'demo' tenant this is overmind-pg
 * (the bridge DB) via DATABASE_URL. In production each founder has their own DB; this seam is
 * where that lookup would happen. Returns undefined if no conn string is resolvable.
 */
function tenantConnString(tenantId: string): string | undefined {
  // Single-account demo: every tenant resolves to the bridge DB. Kept as a function so the
  // multi-tenant version is a one-line change (look up by tenantId).
  void tenantId
  return process.env.DATABASE_URL
}

/** The Aiven Postgres service name for a tenant (used by REST tools). */
function tenantServiceName(tenantId: string): string {
  void tenantId
  return process.env.OVERMIND_PG_SERVICE ?? 'overmind-pg'
}

// ───────────────────────── read-only SQL guard ─────────────────────────

/**
 * Allow only a single read-only SELECT/WITH/EXPLAIN/SHOW statement. Rejects anything that could
 * mutate (INSERT/UPDATE/DELETE/DDL), call a function with side effects, or chain a second
 * statement. This is the hard safety boundary for the model's query_pg tool.
 */
function assertReadOnly(sql: string): { ok: boolean; reason?: string } {
  const trimmed = (sql || '').trim().replace(/;+\s*$/g, '') // tolerate a single trailing ';'
  if (!trimmed) return { ok: false, reason: 'empty query' }
  // No statement chaining — a ';' in the middle means a second statement.
  if (/;/.test(trimmed)) return { ok: false, reason: 'multiple statements are not allowed' }
  // Must start with a read-only keyword.
  if (!/^\s*(select|with|explain|show|table)\b/i.test(trimmed)) {
    return { ok: false, reason: 'only SELECT/WITH/EXPLAIN/SHOW queries are allowed (read-only)' }
  }
  // Defense in depth: reject mutating keywords anywhere as whole words.
  const banned =
    /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|comment|copy|call|do|merge|vacuum|reindex|cluster|refresh|set|reset|lock|begin|commit|rollback|nextval|setval|pg_terminate_backend|pg_cancel_backend)\b/i
  if (banned.test(trimmed)) {
    return { ok: false, reason: 'query contains a non-read-only keyword' }
  }
  return { ok: true }
}

// ───────────────────────── metrics gathering (grounding) ─────────────────────────

export interface PgMetrics {
  db: string
  connections: number
  maxConnections: number
  cacheHitRatioPct: number | null
  dbSizePretty: string | null
  tables: { name: string; rows: number; sizePretty: string }[]
  hasVectorIndex: boolean | null
  topPosts?: number
  note?: string
}

/**
 * Read a real snapshot from the tenant's Postgres via pg_stat_* + pg_catalog. Pure reads.
 * Defensive: any single query that fails just leaves its field null/empty; we never throw.
 */
export async function getPgMetrics(tenantId: string): Promise<PgMetrics | null> {
  const cs = tenantConnString(tenantId)
  if (!cs) return null

  const out: PgMetrics = {
    db: 'unknown',
    connections: 0,
    maxConnections: 0,
    cacheHitRatioPct: null,
    dbSizePretty: null,
    tables: [],
    hasVectorIndex: null,
  }

  try {
    const dbstat = await q1<{ db: string; conns: string; hit: string; read: string; size: string }>(
      cs,
      `select current_database() as db,
              (select numbackends::text from pg_stat_database where datname = current_database()) as conns,
              coalesce((select blks_hit::text  from pg_stat_database where datname = current_database()), '0') as hit,
              coalesce((select blks_read::text from pg_stat_database where datname = current_database()), '0') as read,
              pg_size_pretty(pg_database_size(current_database())) as size`,
    )
    if (dbstat) {
      out.db = dbstat.db
      out.connections = Number(dbstat.conns ?? 0)
      out.dbSizePretty = dbstat.size
      const hit = Number(dbstat.hit ?? 0)
      const read = Number(dbstat.read ?? 0)
      out.cacheHitRatioPct = hit + read > 0 ? Number(((hit / (hit + read)) * 100).toFixed(1)) : null
    }
  } catch {
    /* leave defaults */
  }

  try {
    const mc = await q1<{ max: string }>(cs, `select setting as max from pg_settings where name = 'max_connections'`)
    if (mc) out.maxConnections = Number(mc.max ?? 0)
  } catch {
    /* ignore */
  }

  try {
    // Per-table live row estimate + total relation size, top 12 by size.
    const tables = await q<{ name: string; rows: string; size: string }>(
      cs,
      `select relname as name,
              coalesce(n_live_tup, 0)::text as rows,
              pg_size_pretty(pg_total_relation_size(relid)) as size
         from pg_stat_user_tables
        order by pg_total_relation_size(relid) desc
        limit 12`,
    )
    out.tables = tables.map((t) => ({ name: t.name, rows: Number(t.rows ?? 0), sizePretty: t.size }))
  } catch {
    /* ignore */
  }

  try {
    // Does the embeddings table have an ANN index? (semantic-search health)
    const idx = await q1<{ has: boolean }>(
      cs,
      `select exists(
         select 1 from pg_indexes
          where indexdef ilike '%hnsw%' or indexdef ilike '%ivfflat%'
       ) as has`,
    )
    if (idx) out.hasVectorIndex = idx.has
  } catch {
    /* ignore */
  }

  return out
}

/** A compact, human-readable summary of the metrics — the deterministic fallback answer. */
export function summarizeMetrics(m: PgMetrics): string {
  const lines: string[] = []
  lines.push(`Here's the current state of your database (${m.db}):`)
  lines.push('')
  if (m.dbSizePretty) lines.push(`• Total size: ${m.dbSizePretty}`)
  const connNote =
    m.maxConnections > 0 ? `${m.connections} of ${m.maxConnections} connections in use` : `${m.connections} active connections`
  lines.push(`• ${connNote}`)
  if (m.cacheHitRatioPct != null) {
    const health = m.cacheHitRatioPct >= 99 ? 'excellent' : m.cacheHitRatioPct >= 95 ? 'healthy' : 'low — worth a look'
    lines.push(`• Cache hit ratio: ${m.cacheHitRatioPct}% (${health})`)
  }
  if (m.tables.length) {
    const top = m.tables
      .slice(0, 6)
      .map((t) => `${t.name} (${t.rows.toLocaleString()} rows, ${t.sizePretty})`)
      .join(', ')
    lines.push(`• Largest tables: ${top}`)
  }
  if (m.hasVectorIndex === false) {
    lines.push(`• Semantic search runs a sequential scan — no ANN index on your embeddings yet.`)
  } else if (m.hasVectorIndex === true) {
    lines.push(`• Semantic search has an ANN index in place.`)
  }
  lines.push('')

  // A grounded verdict on scaling.
  const connPressure = m.maxConnections > 0 ? m.connections / m.maxConnections : 0
  if (connPressure > 0.7) {
    lines.push(
      `On scaling: connections are getting tight (${Math.round(connPressure * 100)}% of the limit). I'd propose putting a connection pooler (PgBouncer) in front before you add more app instances. Want me to walk through that?`,
    )
  } else {
    lines.push(
      `On scaling: you're comfortably within your limits right now — nothing urgent. The first move when you do grow is a connection pooler, not a bigger machine. I'll keep watching and flag it before it matters.`,
    )
  }
  return lines.join('\n')
}

// ───────────────────────── system prompt ─────────────────────────

function systemPrompt(tenantId: string): string {
  return [
    `You are the "Aiven CTO" — the always-on infrastructure lead for a non-technical founder.`,
    `The founder has just migrated their app's backend onto Aiven (Postgres, and possibly Kafka).`,
    `They will NEVER open the Aiven dashboard. You are their entire relationship with their infra.`,
    ``,
    `Who you're talking to: a smart founder who is NOT an engineer. No jargon dumps. When you must`,
    `use a term (connection pool, cache hit ratio, ANN index), explain it in one short clause.`,
    ``,
    `Tone: calm, plain-English, reassuring, senior. Lead with the answer. Be concrete and specific —`,
    `always ground claims in the real numbers you read from their infra, never vague reassurance.`,
    ``,
    `You have read-only tools that read their ACTUAL infrastructure:`,
    `- get_metrics(): a live snapshot (connections, cache hit ratio, DB size, table sizes + row`,
    `  counts, whether semantic search has an index). Call this first for any "how's my DB / should`,
    `  I scale / is it healthy" question.`,
    `- query_pg(sql): run a single READ-ONLY SELECT against their Postgres for a specific fact`,
    `  (e.g. a row count, a recent record). Reads only — writes are rejected.`,
    `- list_services() / get_service(name): their Aiven services (plan, state, cloud region).`,
    ``,
    `Advisory-first, and this is a hard rule: you NEVER mutate their infrastructure. For anything`,
    `that writes data, changes a plan, costs money, or carries risk, you PROPOSE the step and ask`,
    `for explicit confirmation. You describe what you'd do and why; you do not do it.`,
    ``,
    `Always prefer reading real data before answering. If a tool fails, say so plainly and answer`,
    `with what you do know — don't invent numbers.`,
    `(Tenant: ${tenantId}.)`,
  ].join('\n')
}

// ───────────────────────── the agent loop ─────────────────────────

let _client: Anthropic | null | undefined
function client(): Anthropic | null {
  if (_client !== undefined) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    _client = null
    return _client
  }
  try {
    // Use Node's native global fetch. The pinned SDK (0.32.1) bundles an older fetch shim that
    // throws "Premature close" mid-response on Node 22+/26; the platform fetch is reliable.
    _client = new Anthropic({
      apiKey,
      ...(typeof globalThis.fetch === 'function' ? { fetch: globalThis.fetch as any } : {}),
    })
  } catch {
    _client = null
  }
  return _client
}

/** Tool definitions the model sees. */
function toolDefs(): Anthropic.Tool[] {
  return [
    {
      name: 'get_metrics',
      description:
        'Get a live read-only snapshot of the founder\'s Postgres: active connections, max connections, ' +
        'cache hit ratio, total DB size, per-table row counts + sizes, and whether semantic search has an ' +
        'ANN index. Call this first for any health/scaling/"how is my database" question.',
      input_schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'query_pg',
      description:
        'Run ONE read-only SQL query (SELECT / WITH / EXPLAIN / SHOW) against the founder\'s Postgres to ' +
        'fetch a specific fact — a row count, a recent row, an aggregate. Read-only: any write or DDL is ' +
        'rejected. Use get_metrics for the general health snapshot; use this for a targeted question.',
      input_schema: {
        type: 'object',
        properties: { sql: { type: 'string', description: 'A single read-only SQL statement.' } },
        required: ['sql'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_services',
      description:
        'List the founder\'s Aiven services (name, type, plan, state, cloud region). Use for questions ' +
        'about what infrastructure exists, its state, or its region.',
      input_schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'get_service',
      description:
        'Get details for one Aiven service by name (plan, state, cloud region). Use to answer cost or ' +
        'capacity questions about a specific service.',
      input_schema: {
        type: 'object',
        properties: { name: { type: 'string', description: 'The Aiven service name, e.g. overmind-pg.' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
  ]
}

/** Execute a tool the model called. Returns the string fed back as the tool_result. */
async function runTool(tenantId: string, name: string, input: any): Promise<string> {
  switch (name) {
    case 'get_metrics': {
      const m = await getPgMetrics(tenantId)
      if (!m) return JSON.stringify({ error: 'no database connection configured for this tenant' })
      return JSON.stringify(m)
    }
    case 'query_pg': {
      const sql = String(input?.sql ?? '')
      const guard = assertReadOnly(sql)
      if (!guard.ok) return JSON.stringify({ error: `rejected: ${guard.reason}` })
      const cs = tenantConnString(tenantId)
      if (!cs) return JSON.stringify({ error: 'no database connection configured for this tenant' })
      try {
        const rows = await q(cs, sql)
        // Cap the payload so a wide SELECT can't blow up the context window.
        const capped = rows.slice(0, 50)
        return JSON.stringify({ rowCount: rows.length, rows: capped })
      } catch (e: any) {
        return JSON.stringify({ error: e?.message ?? String(e) })
      }
    }
    case 'list_services': {
      if (!hasAivenToken()) return JSON.stringify({ error: 'Aiven token not configured' })
      try {
        const rest = await import('../aiven/rest.ts')
        const svcs = await rest.listServices(AIVEN_PROJECT)
        return JSON.stringify(
          svcs.map((s) => ({
            name: s.service_name,
            type: s.service_type,
            plan: s.plan,
            state: s.state,
            cloud: s.cloud_name,
          })),
        )
      } catch (e: any) {
        return JSON.stringify({ error: e?.message ?? String(e) })
      }
    }
    case 'get_service': {
      if (!hasAivenToken()) return JSON.stringify({ error: 'Aiven token not configured' })
      const svcName = String(input?.name ?? tenantServiceName(tenantId))
      try {
        const rest = await import('../aiven/rest.ts')
        const s = await rest.getService(AIVEN_PROJECT, svcName)
        return JSON.stringify({
          name: s.service_name,
          type: s.service_type,
          plan: s.plan,
          state: s.state,
          cloud: s.cloud_name,
        })
      } catch (e: any) {
        return JSON.stringify({ error: e?.message ?? String(e) })
      }
    }
    default:
      return JSON.stringify({ error: `unknown tool: ${name}` })
  }
}

/** A short, human-readable notice for a tool call (the 'tool' chunk). */
function toolNotice(name: string, input: any): string {
  switch (name) {
    case 'get_metrics':
      return 'Reading your live database metrics…'
    case 'query_pg':
      return `Running a read-only query…`
    case 'list_services':
      return 'Listing your Aiven services…'
    case 'get_service':
      return `Checking service ${input?.name ?? ''}…`.trim()
    default:
      return `Calling ${name}…`
  }
}

/**
 * The Aiven CTO agent. Streams a real, data-grounded answer via `emit`.
 * Token deltas → {type:'text'}. Tool calls → a short {type:'tool'} notice. End → {type:'done'}.
 * On any hard failure → {type:'error'}, but it first tries the deterministic fallback.
 */
export async function ctoChat(opts: CtoChatOpts, emit: (chunk: CtoChunk) => void): Promise<void> {
  const { tenantId, message } = opts
  const history = opts.history ?? []

  // ── Degraded path: no Anthropic key → deterministic infra summary from real metrics.
  if (!hasAnthropic() || !client()) {
    await degradedAnswer(tenantId, emit)
    return
  }

  const anthropic = client()!
  const tools = toolDefs()

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content }) as Anthropic.MessageParam),
    { role: 'user', content: message },
  ]

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt(tenantId),
        tools,
        messages,
        // Adaptive thinking is the recommended mode for claude-opus-4-8; the pinned SDK (0.32.1)
        // predates the type, so pass it through without tripping the older MessageCreateParams.
        ...({ thinking: { type: 'adaptive' } } as Record<string, unknown>),
      } as Anthropic.MessageStreamParams)

      // Stream text deltas straight through to the caller as they arrive.
      stream.on('text', (delta) => {
        if (delta) emit({ type: 'text', value: delta })
      })

      const final = await stream.finalMessage()

      // If the model wants tools, run them and loop; otherwise we're done.
      if (final.stop_reason !== 'tool_use') {
        emit({ type: 'done', value: '' })
        return
      }

      const toolUses = final.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      )
      if (!toolUses.length) {
        emit({ type: 'done', value: '' })
        return
      }

      // Echo the assistant turn (must include the tool_use blocks) before sending results.
      messages.push({ role: 'assistant', content: final.content })

      const results: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        emit({ type: 'tool', value: toolNotice(tu.name, tu.input) })
        let out: string
        let isError = false
        try {
          out = await runTool(tenantId, tu.name, tu.input)
          // Surface tool-level errors to the model so it can adapt and say so plainly.
          try {
            if (JSON.parse(out)?.error) isError = true
          } catch {
            /* not JSON-with-error; treat as success */
          }
        } catch (e: any) {
          out = JSON.stringify({ error: e?.message ?? String(e) })
          isError = true
        }
        results.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: out,
          ...(isError ? { is_error: true } : {}),
        })
      }
      messages.push({ role: 'user', content: results })
    }

    // Ran out of turns — close out cleanly rather than hanging.
    emit({ type: 'done', value: '' })
  } catch (e: any) {
    // Model/network failure: try the deterministic fallback so the founder still gets a real answer.
    try {
      await degradedAnswer(tenantId, emit, `(Live assistant unavailable — showing a direct readout.)`)
    } catch {
      emit({ type: 'error', value: e?.message ?? String(e) })
    }
  }
}

/** Deterministic answer from real metrics — used when the model path is unavailable. */
async function degradedAnswer(
  tenantId: string,
  emit: (chunk: CtoChunk) => void,
  prefix?: string,
): Promise<void> {
  emit({ type: 'tool', value: 'Reading your live database metrics…' })
  const m = await getPgMetrics(tenantId)
  if (!m) {
    emit({ type: 'error', value: 'No database connection is configured, so I can\'t read your infra right now.' })
    return
  }
  if (prefix) emit({ type: 'text', value: prefix + '\n\n' })
  emit({ type: 'text', value: summarizeMetrics(m) })
  emit({ type: 'done', value: '' })
}
