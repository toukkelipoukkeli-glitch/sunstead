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
  rec(emit, 'info', 'Carbon-aware region', 'overmind-pg runs in google-europe-north1 (low-carbon grid).',
    'Keep latency-sensitive services co-located in this region.', 'region=eu-north1')
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
