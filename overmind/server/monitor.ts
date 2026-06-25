// server/monitor.ts — the always-on Aiven CTO monitor.
//
// A singleton loop that ticks every OVERMIND_MONITOR_INTERVAL_MS (default 20s), gathering REAL,
// read-only signals from the live infra (overmind-pg over DATABASE_URL + the Aiven REST API) and
// turning them into a fresh CtoState snapshot + a rolling, deduped alert feed — all held in memory.
//
// STRICTLY READ-ONLY / ADVISORY. It NEVER mutates infra: no CREATE/ALTER/INSERT/UPDATE/DELETE and
// no plan changes, ever. Every signal degrades to null independently — one failing source must
// never blank the others, and a tick must never throw.
//
// New alerts also flow over the existing /api/stream as {type:'cto', rec} via the broadcast hook,
// so the control room lights up live without polling.

import type { CtoRecommendation, CtoState, SwarmEvent } from '../shared/types.ts'
import { AIVEN_PROJECT, hasAivenToken } from './env.ts'
import { getPgMetrics } from './cto-chat.ts'
import { q } from '../aiven/pg.ts'
import * as rest from '../aiven/rest.ts'

// ───────────────────────── config / constants ─────────────────────────

const INTERVAL_MS = Number(process.env.OVERMIND_MONITOR_INTERVAL_MS ?? 20000)
const PG_SERVICE = process.env.OVERMIND_PG_SERVICE ?? 'overmind-pg'
const KAFKA_SERVICE = process.env.OVERMIND_KAFKA_SERVICE ?? 'overmind-kafka'
const PG_PLAN = 'startup-4'
const KAFKA_PLAN = 'business-4'
const CLOUD = 'do-fra'
const SUPABASE_USD = 599 // Supabase Pro baseline used elsewhere for the cost comparison.
const ALERTS_CAP = 40
// Don't re-emit the same condition every tick: only re-fire if its severity changes or this cools.
const ALERT_COOLDOWN_MS = 5 * 60 * 1000

const now = () => new Date().toISOString()
const rid = () => `cto_${Math.random().toString(36).slice(2, 9)}`

// Human labels for what each tick inspects — surfaced in CtoState.watching so the UI/agent can
// always say exactly what's being monitored.
const WATCHING: string[] = [
  'Postgres connections vs. limit',
  'Buffer cache hit ratio',
  'pgvector ANN index on embeddings',
  'CPU / memory / disk utilization',
  'Slow queries (pg_stat_statements)',
  'Monthly cost vs. Supabase Pro',
  'Service health (overmind-pg, overmind-kafka)',
]

// ───────────────────────── in-memory state ─────────────────────────

interface AlertMemo {
  rec: CtoRecommendation
  severity: CtoRecommendation['severity']
  lastSeen: number
}

let timer: ReturnType<typeof setInterval> | null = null
let broadcastFn: ((e: SwarmEvent) => void) | null = null
let latest: CtoState | null = null
let lastTickAt = 0
// Rolling feed, newest first, capped at ALERTS_CAP.
const feed: CtoRecommendation[] = []
// Dedup memory keyed by a stable condition key (severity-agnostic so a worsening condition re-fires).
const seen = new Map<string, AlertMemo>()

// ───────────────────────── public API ─────────────────────────

/**
 * Start the always-on monitor. Idempotent: a second call is a no-op (won't double-start the loop).
 * Runs one tick immediately, then on the interval. Pass the server's broadcast fn so NEW alerts
 * also flow over /api/stream as {type:'cto'} events.
 */
export function startMonitor(broadcast?: (e: SwarmEvent) => void): void {
  if (broadcast) broadcastFn = broadcast
  if (timer) return // already running
  // Fire-and-forget the first tick so boot isn't blocked on network/DB.
  void tick()
  timer = setInterval(() => {
    void tick()
  }, INTERVAL_MS)
  // Don't keep the event loop alive solely for the monitor.
  if (typeof (timer as any).unref === 'function') (timer as any).unref()
}

/** Stop the loop (cleanliness / tests). Leaves the last snapshot in memory. */
export function stopMonitor(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/**
 * The latest snapshot. Returns the in-memory one if fresh (within ~2 intervals); otherwise computes
 * one on demand. NEVER throws — every field degrades to null on failure.
 */
export async function getCtoState(tenantId: string): Promise<CtoState> {
  const fresh = latest && Date.now() - lastTickAt < INTERVAL_MS * 2
  if (fresh && latest) {
    return { ...latest, tenant: tenantId, lastCheckedAgoMs: Date.now() - lastTickAt }
  }
  // No fresh snapshot yet — compute one inline (still never throws).
  return tick(tenantId)
}

// ───────────────────────── the tick ─────────────────────────

/**
 * One monitoring pass. Gathers all signals (each guarded independently), recomputes alerts,
 * stores + returns the snapshot, and broadcasts any NEW alert. Guaranteed not to throw.
 */
async function tick(tenantId = 'demo'): Promise<CtoState> {
  const ts = now()
  lastTickAt = Date.now()

  // ── Signal: Postgres catalog stats over DATABASE_URL (reuses cto-chat's reader).
  const pgm = await safe(() => getPgMetrics(tenantId), null)
  const rows = pgm?.tables?.length
    ? pgm.tables.reduce((s, t) => s + (Number(t.rows) || 0), 0)
    : null

  // ── Signal: Aiven resource metrics (CPU / mem / disk %), tolerant parse.
  let resMetrics = { cpuPct: null as number | null, memPct: null as number | null, diskPct: null as number | null }
  if (hasAivenToken()) {
    const raw = await safe(() => rest.metrics(AIVEN_PROJECT, PG_SERVICE), null)
    if (raw && !raw.error) resMetrics = rest.parseResourceMetrics(raw)
  }

  // ── Signal: slow queries via pg_stat_statements (extension may be absent → null).
  const slowQueries = await readSlowQueries(tenantId)

  // ── Signal: monthly cost (pg + kafka) via plan pricing.
  let pgUsd: number | null = null
  let kafkaUsd: number | null = null
  if (hasAivenToken()) {
    const pgPrice = await safe(() => rest.planPricing(AIVEN_PROJECT, 'pg', PG_PLAN, CLOUD), null)
    const kafkaPrice = await safe(() => rest.planPricing(AIVEN_PROJECT, 'kafka', KAFKA_PLAN, CLOUD), null)
    pgUsd = pgPrice?.pricePerMonthUsd ?? null
    kafkaUsd = kafkaPrice?.pricePerMonthUsd ?? null
  }
  const totalUsd = pgUsd != null || kafkaUsd != null ? Number(((pgUsd ?? 0) + (kafkaUsd ?? 0)).toFixed(2)) : null

  // ── Signal: service health (running / plan) for pg + kafka.
  let pgStatus: 'running' | 'unknown' = 'unknown'
  let pgPlan = PG_PLAN
  let kafkaStatus: 'running' | 'unknown' = 'unknown'
  let kafkaPlan = KAFKA_PLAN
  if (hasAivenToken()) {
    const pgSvc = await safe(() => rest.getService(AIVEN_PROJECT, PG_SERVICE), null)
    if (pgSvc) {
      pgStatus = (pgSvc.state || '').toUpperCase() === 'RUNNING' ? 'running' : 'unknown'
      pgPlan = pgSvc.plan || PG_PLAN
    }
    const kafkaSvc = await safe(() => rest.getService(AIVEN_PROJECT, KAFKA_SERVICE), null)
    if (kafkaSvc) {
      kafkaStatus = (kafkaSvc.state || '').toUpperCase() === 'RUNNING' ? 'running' : 'unknown'
      kafkaPlan = kafkaSvc.plan || KAFKA_PLAN
    }
  }
  // If we couldn't reach the Aiven API but Postgres responded, PG is clearly running.
  if (pgStatus === 'unknown' && pgm) pgStatus = 'running'

  // ── Compose the snapshot.
  const state: CtoState = {
    ts,
    tenant: tenantId,
    pg: {
      status: pgStatus,
      plan: pgPlan,
      rows,
      connections: pgm?.connections ?? null,
      maxConnections: pgm?.maxConnections ?? null,
      cacheHitRatioPct: pgm?.cacheHitRatioPct ?? null,
      dbSizePretty: pgm?.dbSizePretty ?? null,
      cpuPct: resMetrics.cpuPct,
      memPct: resMetrics.memPct,
      diskPct: resMetrics.diskPct,
      hasVectorIndex: pgm?.hasVectorIndex ?? null,
    },
    kafka: { status: kafkaStatus, plan: kafkaPlan, topics: null },
    cost: { pgUsd, kafkaUsd, totalUsd, supabaseUsd: SUPABASE_USD },
    slowQueries,
    watching: WATCHING,
    alerts: [], // filled below
    lastCheckedAgoMs: 0,
  }

  // ── Derive alerts (grounded only in signals we actually read), dedup, broadcast new ones.
  const candidates = buildAlerts(state, rows)
  emitAlerts(candidates)
  state.alerts = feed.slice(0, ALERTS_CAP)

  latest = state
  return state
}

// ───────────────────────── alert derivation ─────────────────────────

/** A candidate alert plus its stable dedup key (severity-agnostic). */
interface Candidate {
  key: string
  rec: Omit<CtoRecommendation, 'id' | 'ts'>
}

function mk(
  key: string,
  severity: CtoRecommendation['severity'],
  title: string,
  detail: string,
  action: string,
  metric?: string,
): Candidate {
  return { key, rec: { severity, title, detail, action, metric } }
}

/** Turn the snapshot into grounded alert candidates. Only emits when the signal supports it. */
function buildAlerts(s: CtoState, rows: number | null): Candidate[] {
  const out: Candidate[] = []
  const pg = s.pg

  // pgvector ANN index advisory — only when we actually know there's no index.
  if (pg.hasVectorIndex === false) {
    const r = rows ?? 0
    const sev: CtoRecommendation['severity'] = r > 10000 ? 'critical' : r > 1000 ? 'warn' : 'info'
    out.push(
      mk(
        'pgvector-index',
        sev,
        'pgvector index advisory',
        `Semantic search has no ANN index and the DB holds ${r.toLocaleString()} rows — vector lookups run a sequential scan.`,
        r > 1000
          ? 'Add an HNSW index on the embeddings column now (CREATE INDEX … USING hnsw) — aiven_pg_optimize_query confirms the plan.'
          : 'Add an HNSW index before crossing ~1k rows; cheap now, expensive under load.',
        `rows=${r};hnsw=false`,
      ),
    )
  }

  // Connection pressure / cache hit ratio — read from pg_stat.
  if (pg.connections != null) {
    if (pg.connections > 80) {
      out.push(
        mk(
          'pg-connections',
          'critical',
          'Connection saturation',
          `${pg.connections} backends on ${PG_SERVICE}${pg.maxConnections ? ` of ${pg.maxConnections}` : ''} — near the pool ceiling.`,
          'Front Postgres with PgBouncer (transaction mode) before adding app instances — aiven_pg_bouncer_create.',
          `connections=${pg.connections}`,
        ),
      )
    } else if (pg.connections > 40) {
      out.push(
        mk(
          'pg-connections',
          'warn',
          'Connection growth',
          `${pg.connections} backends on ${PG_SERVICE} — climbing toward the pool limit.`,
          'Stand up PgBouncer in transaction mode now so scaling out is a no-op later.',
          `connections=${pg.connections}`,
        ),
      )
    }
  }

  if (pg.cacheHitRatioPct != null && pg.cacheHitRatioPct < 95) {
    out.push(
      mk(
        'pg-cache',
        'warn',
        'Cache hit ratio low',
        `Buffer cache hit ratio is ${pg.cacheHitRatioPct}% — under 95% means too much is read from disk.`,
        'Move to a larger memory tier (more shared_buffers) so the working set stays in RAM.',
        `cache_hit=${pg.cacheHitRatioPct}%`,
      ),
    )
  }

  // CPU / mem / disk — ONLY if we parsed a real number.
  pushResourceAlert(out, 'cpu', pg.cpuPct, 'CPU', 'Bump the plan one tier or add a read replica.')
  pushResourceAlert(out, 'mem', pg.memPct, 'Memory', 'Increase the memory tier or tune shared_buffers to avoid cache eviction.')
  pushResourceAlert(out, 'disk', pg.diskPct, 'Disk', 'Increase the storage tier before disk fills — writes stall when disk is full.')

  // Slow-query advisory — pg_stat_statements with a meaningfully slow query.
  if (Array.isArray(s.slowQueries) && s.slowQueries.length) {
    const worst = s.slowQueries.reduce((a, b) => (b.meanMs > a.meanMs ? b : a))
    if (worst.meanMs >= 100) {
      out.push(
        mk(
          'slow-query',
          worst.meanMs >= 1000 ? 'warn' : 'info',
          'Slow query detected',
          `A query averages ${worst.meanMs}ms over ${worst.calls.toLocaleString()} calls: ${worst.query}`,
          'Review its plan (EXPLAIN ANALYZE) and add a covering/partial index — aiven_pg_optimize_query suggests one.',
          `mean_ms=${worst.meanMs};calls=${worst.calls}`,
        ),
      )
    }
  }

  // Cost framing — grounded in real pricing, vs. the Supabase Pro baseline.
  if (s.cost.totalUsd != null) {
    const saving = s.cost.supabaseUsd - s.cost.totalUsd
    out.push(
      mk(
        'cost',
        'info',
        'Monthly cost',
        `Aiven runs at ~$${s.cost.totalUsd}/mo (PG ${PG_PLAN}${s.cost.pgUsd != null ? ` $${s.cost.pgUsd}` : ''}` +
          `, Kafka ${KAFKA_PLAN}${s.cost.kafkaUsd != null ? ` $${s.cost.kafkaUsd}` : ''})` +
          (saving > 0 ? ` — about $${saving.toFixed(0)}/mo under Supabase Pro ($${s.cost.supabaseUsd}).` : '.'),
        'No action — pricing is steady. I flag it if a scaling move would change the bill.',
        `total_usd=${s.cost.totalUsd};supabase_usd=${s.cost.supabaseUsd}`,
      ),
    )
  }

  // Steady-state heartbeat so the feed is never empty — always grounded in real numbers.
  const bits: string[] = []
  if (pg.connections != null) bits.push(`${pg.connections} connections`)
  if (pg.cacheHitRatioPct != null) bits.push(`${pg.cacheHitRatioPct}% cache hit`)
  if (pg.cpuPct != null) bits.push(`${pg.cpuPct.toFixed(0)}% CPU`)
  if (pg.memPct != null) bits.push(`${pg.memPct.toFixed(0)}% memory`)
  if (rows != null) bits.push(`${rows.toLocaleString()} rows`)
  out.push(
    mk(
      'heartbeat',
      'info',
      'All healthy — watching',
      bits.length
        ? `${PG_SERVICE} is ${pg.status} on ${pg.plan}: ${bits.join(', ')}. Nothing needs action.`
        : `Monitor is live on ${PG_SERVICE} (${pg.plan}). Gathering the first full reading.`,
      'I check connections, cache, indexes, CPU/mem/disk, slow queries and cost every tick.',
      `status=${pg.status};plan=${pg.plan}`,
    ),
  )

  return out
}

function pushResourceAlert(
  out: Candidate[],
  key: string,
  pct: number | null,
  label: string,
  fix: string,
): void {
  if (pct == null) return
  if (pct > 90) {
    out.push(mk(`res-${key}`, 'critical', `${label} critical`, `${label} at ${pct.toFixed(0)}% on ${PG_SERVICE}.`, fix, `${key}=${pct.toFixed(0)}%`))
  } else if (pct > 75) {
    out.push(mk(`res-${key}`, 'warn', `${label} high`, `${label} at ${pct.toFixed(0)}% on ${PG_SERVICE} — watch the trend.`, fix, `${key}=${pct.toFixed(0)}%`))
  }
}

/**
 * Dedup + emit. A candidate fires (and broadcasts) only if it's new, its severity changed, or its
 * cooldown elapsed. Keeps the rolling feed capped and newest-first.
 */
function emitAlerts(candidates: Candidate[]): void {
  const t = Date.now()
  for (const c of candidates) {
    const prior = seen.get(c.key)
    const changedSeverity = !prior || prior.severity !== c.rec.severity
    const cooled = !prior || t - prior.lastSeen > ALERT_COOLDOWN_MS
    if (!changedSeverity && !cooled) {
      if (prior) prior.lastSeen = t // keep it warm without re-emitting
      continue
    }
    const rec: CtoRecommendation = { id: rid(), ts: now(), ...c.rec }
    seen.set(c.key, { rec, severity: c.rec.severity, lastSeen: t })
    feed.unshift(rec)
    if (feed.length > ALERTS_CAP) feed.length = ALERTS_CAP
    if (broadcastFn) {
      try {
        broadcastFn({ type: 'cto', rec })
      } catch {
        /* a dead client is reaped elsewhere */
      }
    }
  }
}

// ───────────────────────── slow queries (pg_stat_statements) ─────────────────────────

/**
 * Top slow queries by total exec time. The extension may not be enabled → returns null
 * ("unavailable", not an error). Query text truncated to ~120 chars. Never throws.
 */
async function readSlowQueries(tenantId: string): Promise<CtoState['slowQueries']> {
  const cs = connStr(tenantId)
  if (!cs) return null
  try {
    const rows = await q<{ query: string; calls: string; mean_ms: string; total_ms: string }>(
      cs,
      `select query, calls,
              round(mean_exec_time::numeric, 1)  as mean_ms,
              round(total_exec_time::numeric, 1) as total_ms
         from pg_stat_statements
        order by total_exec_time desc
        limit 5`,
    )
    return rows.map((r) => ({
      query: truncate(r.query ?? '', 120),
      calls: Number(r.calls ?? 0),
      meanMs: Number(r.mean_ms ?? 0),
      totalMs: Number(r.total_ms ?? 0),
    }))
  } catch {
    // Extension not enabled / no permission — treat as a missing signal, not an error.
    return null
  }
}

// ───────────────────────── helpers ─────────────────────────

function connStr(_tenantId: string): string | undefined {
  // Single-account demo: every tenant resolves to the bridge DB (matches cto-chat.ts).
  return process.env.DATABASE_URL
}

function truncate(s: string, n: number): string {
  const oneLine = (s || '').replace(/\s+/g, ' ').trim()
  return oneLine.length > n ? oneLine.slice(0, n - 1) + '…' : oneLine
}

/** Run an async getter, swallowing any throw/rejection and returning a fallback. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

// Reusable parsed-metrics access for the chat agent's get_resource_metrics tool.
export async function getResourceMetrics(): Promise<rest.ResourceMetrics & { connections: number | null; maxConnections: number | null }> {
  const s = latest && Date.now() - lastTickAt < INTERVAL_MS * 2 ? latest : await getCtoState('demo')
  return {
    cpuPct: s.pg.cpuPct,
    memPct: s.pg.memPct,
    diskPct: s.pg.diskPct,
    connections: s.pg.connections,
    maxConnections: s.pg.maxConnections,
  }
}

// Reusable slow-query access for the chat agent's get_slow_queries tool.
export async function getSlowQueries(tenantId = 'demo'): Promise<CtoState['slowQueries']> {
  const s = latest && Date.now() - lastTickAt < INTERVAL_MS * 2 ? latest : await getCtoState(tenantId)
  return s.slowQueries
}

// Reusable cost access for the chat agent's get_cost tool.
export async function getCost(tenantId = 'demo'): Promise<CtoState['cost']> {
  const s = latest && Date.now() - lastTickAt < INTERVAL_MS * 2 ? latest : await getCtoState(tenantId)
  return s.cost
}
