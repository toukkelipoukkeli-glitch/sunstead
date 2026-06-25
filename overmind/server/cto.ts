// The always-on CTO operator. One tick: read live Aiven metrics and emit
// CtoRecommendation events (scaling / index / cost / carbon moves). Designed to be
// called repeatedly (the orchestrator calls it once at hand-off; a caller can loop it).
//
// Prefers real metrics via aiven/rest.ts; if metrics aren't available it emits grounded,
// clearly-framed baseline recommendations so the operator panel is never empty.

import type { SwarmEvent, CtoRecommendation } from '../shared/types.ts'
import { AIVEN_PROJECT, hasAivenToken } from './env.ts'

const now = () => new Date().toISOString()
const rid = () => `cto_${Math.random().toString(36).slice(2, 9)}`

async function tryImport<T = any>(spec: string): Promise<T | null> {
  try {
    return (await import(spec)) as T
  } catch {
    return null
  }
}

function rec(
  emit: (e: SwarmEvent) => void,
  severity: CtoRecommendation['severity'],
  title: string,
  detail: string,
  action: string,
  metric?: string,
): void {
  const r: CtoRecommendation = { id: rid(), severity, title, detail, action, metric, ts: now() }
  emit({ type: 'cto', rec: r })
}

export async function ctoTick(emit: (e: SwarmEvent) => void): Promise<void> {
  const rest = await tryImport('../aiven/rest.ts')

  // ── Real signal #1: live Postgres catalog stats over DATABASE_URL (pg_stat_*). This is the most
  // reliable source — it reads the actual workload on overmind-pg and turns it into recommendations.
  let pgGrounded = false
  const pgMod = await tryImport('../aiven/pg.ts')
  const connStr = process.env.DATABASE_URL
  if (pgMod?.q1 && connStr) {
    try {
      // pgvector index advisory grounded in the REAL index state + row count.
      const idx: { has_hnsw: boolean; rows: string; seq_scan: string } | null = await pgMod.q1(
        connStr,
        `select
           exists(select 1 from pg_indexes where tablename='posts' and (indexdef ilike '%hnsw%' or indexdef ilike '%ivfflat%')) as has_hnsw,
           (select count(*)::text from posts) as rows,
           coalesce((select seq_scan::text from pg_stat_user_tables where relname='posts'),'0') as seq_scan`,
      )
      if (idx) {
        const rows = Number(idx.rows ?? 0)
        const seqScan = Number(idx.seq_scan ?? 0)
        if (!idx.has_hnsw) {
          rec(emit, rows > 1000 ? 'warn' : 'info', 'pgvector index advisory',
            `posts has ${rows} rows and ${seqScan} sequential scans; match_posts runs a seq scan with no ANN index.`,
            rows > 1000
              ? 'Add an HNSW index on posts.embedding now (CREATE INDEX ... USING hnsw).'
              : 'Add an HNSW index on posts.embedding before crossing ~1k rows (aiven_pg_optimize_query confirms).',
            `posts_rows=${rows};seq_scan=${seqScan};hnsw=false`)
        } else {
          rec(emit, 'info', 'pgvector index healthy', `posts.embedding already has an ANN index (${rows} rows).`,
            'Monitor recall vs. ef_search as rows grow.', `posts_rows=${rows};hnsw=true`)
        }
        pgGrounded = true
      }

      // Connection/cache pressure grounded in pg_stat_database for the current DB.
      const dbstat: { conns: string; hit: string; read: string } | null = await pgMod.q1(
        connStr,
        `select numbackends::text conns,
                coalesce(blks_hit::text,'0') hit,
                coalesce(blks_read::text,'0') read
           from pg_stat_database where datname = current_database()`,
      )
      if (dbstat) {
        const conns = Number(dbstat.conns ?? 0)
        const hit = Number(dbstat.hit ?? 0)
        const read = Number(dbstat.read ?? 0)
        const ratio = hit + read > 0 ? hit / (hit + read) : 1
        if (conns > 40) {
          rec(emit, conns > 80 ? 'critical' : 'warn', 'Connection growth',
            `${conns} backends on overmind-pg.`,
            'Front Aiven PG with PgBouncer (aiven_pg_bouncer_create) in transaction mode before scaling out.',
            `numbackends=${conns}`)
        } else {
          rec(emit, 'info', 'Cache hit ratio',
            `Buffer cache hit ratio ${(ratio * 100).toFixed(1)}% with ${conns} backends.`,
            ratio < 0.95
              ? 'Increase the memory tier (more shared_buffers) to lift the hit ratio.'
              : 'Healthy — keep PgBouncer ready before scaling out.',
            `hit_ratio=${(ratio * 100).toFixed(1)}%;numbackends=${conns}`)
        }
        pgGrounded = true
      }
    } catch (e) {
      emit({ type: 'log', level: 'warn', msg: `cto: pg_stat read failed (${(e as Error).message}) — trying Aiven metrics` })
    }
  }
  if (pgGrounded) return

  // Try to ground at least one recommendation in a real metric reading.
  if (rest?.metrics && hasAivenToken()) {
    try {
      const m = await rest.metrics(AIVEN_PROJECT, 'overmind-pg')
      const cpu = readNumber(m, ['cpu', 'cpu_usage', 'cpuUsage'])
      const mem = readNumber(m, ['mem', 'mem_usage', 'memory'])
      const conns = readNumber(m, ['connections', 'conn', 'active_connections'])

      if (cpu != null && cpu > 75) {
        rec(emit, 'warn', 'Postgres CPU high', `CPU at ${cpu.toFixed(0)}% on overmind-pg.`,
          'Bump plan startup-4 → business-4, or add a read replica.', `cpu=${cpu.toFixed(0)}%`)
      }
      if (mem != null && mem > 80) {
        rec(emit, 'warn', 'Memory pressure', `Memory at ${mem.toFixed(0)}% — risk of cache eviction.`,
          'Increase plan memory tier or tune shared_buffers.', `mem=${mem.toFixed(0)}%`)
      }
      if (conns != null && conns > 80) {
        rec(emit, 'critical', 'Connection saturation', `${conns} active connections — near the pool ceiling.`,
          'Enable PgBouncer (aiven_pg_bouncer_create) in transaction mode.', `conns=${conns}`)
      }
      rec(emit, 'info', 'Metrics ingested', 'Live Aiven metrics read for overmind-pg.',
        'Continue monitoring on a 60s tick.', 'source=aiven_service_metrics_fetch')
      return
    } catch (e) {
      emit({ type: 'log', level: 'warn', msg: `cto: metrics fetch failed (${(e as Error).message}) — baseline recs` })
    }
  }

  // Baseline operator recommendations (grounded in the chosen stack, clearly framed).
  rec(emit, 'info', 'pgvector index advisory', 'Semantic search uses a sequential scan until rows grow.',
    'Add an HNSW index on posts.embedding once > ~1k rows (aiven_pg_optimize_query confirms).', 'index=hnsw')
  rec(emit, 'info', 'Connection pooling', 'Generated backend opens a pool per instance.',
    'Front Aiven PG with PgBouncer before scaling out.', 'pool=pgbouncer')
  rec(emit, 'info', 'EU data residency', 'overmind-pg + overmind-kafka run in do-fra (DigitalOcean Frankfurt, EU).',
    'Keep latency-sensitive services co-located in this region; GDPR data stays in the EU.', 'region=do-fra')
}

function readNumber(obj: any, keys: string[]): number | null {
  if (!obj || typeof obj !== 'object') return null
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  }
  return null
}
