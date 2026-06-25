import { readFileSync } from 'node:fs'

// Agent 0 — Env Detector.
// The new front door: instead of a single Supabase URL, the user pastes their whole
// .env. This scans every KEY=VALUE, identifies each backing service (Postgres,
// MySQL, Redis, Kafka, Elasticsearch, ClickHouse, MongoDB, S3, …) and the provider
// it came from, then maps each one onto an Aiven managed service with a verdict:
//   migrate  ✅  a drop-in managed equivalent exists on Aiven
//   adapter  🟡  Aiven covers it, but the protocol/data model needs reshaping
//   gap      ⛔  Aiven has no equivalent today (the pitch's "what Aiven should build")

export type ServiceKind =
  | 'postgres' | 'mysql' | 'redis' | 'kafka' | 'elasticsearch' | 'opensearch'
  | 'clickhouse' | 'cassandra' | 'mongodb' | 'influxdb' | 'rabbitmq' | 's3'

export type Verdict = 'migrate' | 'adapter' | 'gap'

export type AivenTarget = { service: string; verdict: Verdict; note: string }

export type DetectedService = {
  key: string // the env var that revealed it
  kind: ServiceKind
  provider: string // Supabase, PlanetScale, Upstash, … or "unknown"
  host?: string
  aiven: AivenTarget
}

export type EnvDetection = {
  source: string
  varsTotal: number
  services: DetectedService[]
  passthrough: string[] // vars that aren't infrastructure (API keys, secrets, flags)
  summary: { migrate: number; adapter: number; gap: number }
}

// --- How each detected service maps onto Aiven ---------------------------------
const AIVEN_MAP: Record<ServiceKind, AivenTarget> = {
  postgres:      { service: 'Aiven for PostgreSQL',        verdict: 'migrate', note: 'pg_dump | psql, or the Aiven migration tool' },
  mysql:         { service: 'Aiven for MySQL',             verdict: 'migrate', note: 'logical dump, or the Aiven MySQL migration' },
  redis:         { service: 'Aiven for Caching (Valkey)',  verdict: 'migrate', note: 'Valkey speaks the Redis protocol — drop-in' },
  kafka:         { service: 'Aiven for Apache Kafka',      verdict: 'migrate', note: 'recreate topics; MirrorMaker 2 for in-flight data' },
  elasticsearch: { service: 'Aiven for OpenSearch',        verdict: 'migrate', note: 'OpenSearch is ES 7.10-API compatible — reindex/snapshot restore' },
  opensearch:    { service: 'Aiven for OpenSearch',        verdict: 'migrate', note: 'native — snapshot restore' },
  clickhouse:    { service: 'Aiven for ClickHouse',        verdict: 'migrate', note: 'remote() table function or native backup copy' },
  cassandra:     { service: 'Aiven for Apache Cassandra',  verdict: 'migrate', note: 'native — sstableloader / dsbulk' },
  influxdb:      { service: 'Aiven for InfluxDB',          verdict: 'migrate', note: 'native — line-protocol backfill' },
  mongodb:       { service: '— no managed MongoDB on Aiven', verdict: 'gap',   note: 'recommend Aiven for PostgreSQL + JSONB, or flag for Aiven to build' },
  rabbitmq:      { service: 'Aiven for Apache Kafka',      verdict: 'adapter', note: 'no managed RabbitMQ — remodel queues/exchanges as Kafka topics' },
  s3:            { service: '— no managed object storage on Aiven', verdict: 'gap', note: 'the Storage gap from the pitch — recommend Aiven for Object Storage (S3 API)' },
}

// --- Parse ---------------------------------------------------------------------
export function parseEnv(text: string): { key: string; value: string }[] {
  const out: { key: string; value: string }[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    out.push({ key: m[1], value })
  }
  return out
}

// Pull a real (dotted) hostname out of a connection string, ignoring any user:pass@.
function extractHost(value: string): string | undefined {
  const withScheme = value.match(/^[a-z][a-z0-9+]*:\/\/(?:[^@/]*@)?([a-z0-9.-]+\.[a-z]{2,})/i)
  if (withScheme) return withScheme[1]
  const bare = value.match(/(?:^|@|\/\/)([a-z0-9.-]+\.[a-z]{2,})(?::\d+)?/i)
  return bare?.[1]
}

function providerFor(host?: string): string {
  if (!host) return 'unknown'
  const h = host.toLowerCase()
  if (h.includes('supabase.co') || h.includes('supabase.com')) return 'Supabase'
  if (h.includes('psdb.cloud')) return 'PlanetScale'
  if (h.includes('upstash.io')) return 'Upstash'
  if (h.includes('redis-cloud.com') || h.includes('redislabs.com') || h.includes('redns.')) return 'Redis Cloud'
  if (h.includes('mongodb.net')) return 'MongoDB Atlas'
  if (h.includes('confluent.cloud')) return 'Confluent'
  if (h.includes('cloud.es.io') || h.includes('found.io')) return 'Elastic Cloud'
  if (h.includes('clickhouse.cloud')) return 'ClickHouse Cloud'
  if (h.includes('rds.amazonaws.com')) return 'AWS RDS'
  if (h.includes('neon.tech')) return 'Neon'
  if (h.includes('aivencloud.com')) return 'Aiven (already there!)'
  if (h.includes('render.com')) return 'Render'
  return 'unknown'
}

// A *_API_KEY / *_PASSWORD / *_REGION style var is a credential satellite of some
// other service, not a service of its own. URLs are never satellites.
function isCredentialSatellite(key: string, value: string): boolean {
  if (/^[a-z][a-z0-9+]*:\/\//i.test(value)) return false
  return /(_API_KEY|_API_SECRET|_SECRET|_PASSWORD|_USER(NAME)?|_TOKEN|_KEY|_ACCESS_KEY_ID|_SECRET_ACCESS_KEY|_REGION|_ANON_KEY|_SERVICE_ROLE)$/i.test(key)
}

function detectVar(key: string, value: string): { kind: ServiceKind; host?: string; provider: string } | null {
  const K = key.toUpperCase()
  const host = extractHost(value)
  const provider = providerFor(host)
  const make = (kind: ServiceKind) => ({ kind, host, provider })

  // 1 — URL scheme is the strongest signal.
  const scheme = value.match(/^([a-z][a-z0-9+]*):\/\//i)?.[1]?.toLowerCase()
  if (scheme === 'postgres' || scheme === 'postgresql') return make('postgres')
  if (scheme === 'mysql' || scheme === 'mysql2' || scheme === 'mariadb') return make('mysql')
  if (scheme === 'redis' || scheme === 'rediss') return make('redis')
  if (scheme === 'mongodb' || scheme === 'mongodb+srv') return make('mongodb')
  if (scheme === 'amqp' || scheme === 'amqps') return make('rabbitmq')
  if (scheme === 'clickhouse') return make('clickhouse')
  if (scheme === 'cassandra') return make('cassandra')

  // 2 — Hostname (covers the many services that ride plain https://).
  if (host) {
    if (host.includes('supabase.co') || host.includes('supabase.com')) return make('postgres')
    if (host.includes('clickhouse')) return make('clickhouse')
    if (host.includes('cloud.es.io') || host.includes('found.io')) return make('elasticsearch')
    if (host.includes('confluent.cloud')) return make('kafka')
    if (host.includes('mongodb.net')) return make('mongodb')
  }

  // 3 — Variable name, for services configured via discrete vars (no single URL).
  // Keys are UPPER_SNAKE, so match on `_`-delimited segments — \b breaks on `_`
  // (\bREDIS\b would miss UPSTASH_REDIS_REST_URL).
  const seg = (re: string) => new RegExp(`(^|_)(${re})(_|$)`).test(K)
  if (seg('KAFKA|BOOTSTRAP|BROKERS?')) return make('kafka')
  if (seg('OPENSEARCH')) return make('opensearch')
  if (seg('ELASTIC|ELASTICSEARCH')) return make('elasticsearch')
  if (seg('CLICKHOUSE')) return make('clickhouse')
  if (seg('CASSANDRA|SCYLLA')) return make('cassandra')
  if (seg('INFLUX|INFLUXDB')) return make('influxdb')
  if (seg('MONGO|MONGODB')) return make('mongodb')
  if (seg('RABBIT|RABBITMQ|AMQP')) return make('rabbitmq')
  if (seg('REDIS|VALKEY|MEMCACHE|MEMCACHED')) return make('redis')
  if (seg('S3|BUCKET|MINIO|R2|GCS')) return make('s3')
  if (seg('MYSQL|MARIADB')) return make('mysql')
  if (seg('POSTGRES|POSTGRESQL|PG|PGHOST|DATABASE|DB') || /SUPABASE_URL$/.test(K)) return make('postgres')
  return null
}

export function detectEnv(text: string, source = '(pasted)'): EnvDetection {
  const vars = parseEnv(text)
  const services: DetectedService[] = []
  const passthrough: string[] = []
  const seen = new Set<string>() // dedupe by kind + (provider || host)

  for (const { key, value } of vars) {
    if (isCredentialSatellite(key, value)) { passthrough.push(key); continue }
    const hit = detectVar(key, value)
    if (!hit) { passthrough.push(key); continue }
    const dedupeKey = `${hit.kind}|${hit.provider !== 'unknown' ? hit.provider : hit.host ?? key}`
    if (seen.has(dedupeKey)) { passthrough.push(key); continue }
    seen.add(dedupeKey)
    services.push({ key, kind: hit.kind, provider: hit.provider, host: hit.host, aiven: AIVEN_MAP[hit.kind] })
  }

  const summary = { migrate: 0, adapter: 0, gap: 0 }
  for (const s of services) summary[s.aiven.verdict]++

  return { source, varsTotal: vars.length, services, passthrough, summary }
}

// --- Pretty-print for the CLI / demo -------------------------------------------
const ICON: Record<Verdict, string> = { migrate: '✅', adapter: '🟡', gap: '⛔' }

export function formatDetection(d: EnvDetection): string {
  const lines: string[] = []
  lines.push(`\n${d.source}`)
  lines.push(
    `${d.varsTotal} vars · ${d.services.length} services · ` +
    `${d.summary.migrate} migrate · ${d.summary.adapter} adapter · ${d.summary.gap} gap`,
  )
  lines.push('')
  const kindW = Math.max(4, ...d.services.map((s) => s.kind.length))
  const provW = Math.max(8, ...d.services.map((s) => s.provider.length))
  for (const s of d.services) {
    lines.push(
      `  ${ICON[s.aiven.verdict]} ${s.kind.padEnd(kindW)}  ` +
      `${s.provider.padEnd(provW)}  → ${s.aiven.service}`,
    )
  }
  if (d.passthrough.length) lines.push(`\n  passthrough (not infra): ${d.passthrough.join(', ')}`)
  return lines.join('\n')
}

// CLI: tsx server/agents/env-detect.ts <env-file> [--json]
if (process.argv[1] && process.argv[1].endsWith('env-detect.ts')) {
  const file = process.argv[2]
  if (!file) {
    console.error('usage: tsx server/agents/env-detect.ts <env-file> [--json]')
    process.exit(1)
  }
  const d = detectEnv(readFileSync(file, 'utf8'), file)
  console.log(process.argv.includes('--json') ? JSON.stringify(d, null, 2) : formatDetection(d))
}
