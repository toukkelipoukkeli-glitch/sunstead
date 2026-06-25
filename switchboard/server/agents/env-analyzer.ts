import { llmClassifyEnv } from './llm'

// Analyzes a pasted .env file: classifies every backend service the app uses,
// decides what Aiven can host, finds the database connection to migrate, and can
// rewrite the .env to point at Aiven. Secrets never leave the machine — values
// are only inspected locally here (the LLM only ever sees the DB schema, not the
// .env values).

export type EnvVar = { key: string; value: string }

export type EnvService = {
  kind: string
  label: string
  keys: string[]
  migratable: boolean
  aiven: string | null
  note: string
}

export type EnvAnalysis = {
  vars: EnvVar[]
  services: EnvService[]
  dbUrl: string | null
  dbKind: 'supabase' | 'postgres' | null
  migratable: EnvService[]
  needsConnection: boolean // migratable services found, but no DB connection string to act on
}

type Rule = {
  match: (k: string, v: string) => boolean
  kind: string
  label: string
  migratable: boolean
  aiven: string | null
  note: string
}

// Order matters: first match wins per variable.
const RULES: Rule[] = [
  { match: (k, v) => /supa_?base/i.test(k) || /^sb_(secret|publishable)_/i.test(v) || /^sbp_/i.test(v), kind: 'supabase', label: 'Supabase', migratable: true, aiven: 'Aiven for PostgreSQL', note: 'Database + auth migrate; Storage stays (no Aiven equivalent).' },
  { match: (k, v) => /(DATABASE|POSTGRES|PG)_?(URL|URI|CONNECTION)/i.test(k) || /^postgres(ql)?:\/\//i.test(v), kind: 'postgres', label: 'PostgreSQL', migratable: true, aiven: 'Aiven for PostgreSQL', note: 'Schema + data migrate directly.' },
  { match: (k, v) => /REDIS|UPSTASH|VALKEY/i.test(k) || /^rediss?:\/\//i.test(v), kind: 'redis', label: 'Redis / Valkey', migratable: true, aiven: 'Aiven for Caching (Valkey)', note: 'Provision Valkey; repoint the URL.' },
  { match: (k, v) => /KAFKA|CONFLUENT|REDPANDA/i.test(k), kind: 'kafka', label: 'Kafka', migratable: true, aiven: 'Aiven for Apache Kafka', note: 'Provision Kafka; recreate topics.' },
  { match: (k, v) => /MYSQL|MARIADB/i.test(k) || /^mysql:\/\//i.test(v), kind: 'mysql', label: 'MySQL', migratable: true, aiven: 'Aiven for MySQL', note: 'Schema + data migrate.' },
  { match: (k) => /OPENSEARCH|ELASTIC(SEARCH)?/i.test(k), kind: 'opensearch', label: 'OpenSearch / Elastic', migratable: true, aiven: 'Aiven for OpenSearch', note: 'Reindex into Aiven OpenSearch.' },
  { match: (k) => /CLICKHOUSE/i.test(k), kind: 'clickhouse', label: 'ClickHouse', migratable: true, aiven: 'Aiven for ClickHouse', note: 'Migrate tables to Aiven ClickHouse.' },
  {
    match: (k) => /STRIPE|OPENAI|ANTHROPIC|CLAUDE|COHERE|HUGGINGFACE|REPLICATE|RESEND|SENDGRID|MAILGUN|POSTMARK|TWILIO|CLERK|AUTH0|OKTA|FIREBASE|SENTRY|POSTHOG|MIXPANEL|SEGMENT|DATADOG|VERCEL|NETLIFY|CLOUDFLARE|AWS_|^S3_|GCP|GOOGLE_|AZURE|GITHUB|GITLAB|SLACK|DISCORD|NOTION|FIGMA|SHOPIFY|PLAID|ALGOLIA|PINECONE|WEAVIATE/i.test(k),
    kind: 'external', label: 'External API', migratable: false, aiven: null, note: 'Third-party SaaS — stays as-is.',
  },
]

function classify(key: string, value: string): Rule {
  for (const r of RULES) if (r.match(key, value)) return r
  // Plain config (no secret) vs unknown secret.
  if (/SECRET|TOKEN|KEY|PASSWORD|DSN|URL|URI/i.test(key)) {
    return { match: () => false, kind: 'unknown', label: 'Unknown service', migratable: false, aiven: null, note: 'Unrecognized — review manually.' }
  }
  return { match: () => false, kind: 'config', label: 'App config', migratable: false, aiven: null, note: 'Plain config — unchanged.' }
}

export function parseEnv(text: string): EnvVar[] {
  const out: EnvVar[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '')
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    if (key) out.push({ key, value })
  }
  return out
}

export function analyzeEnv(text: string): EnvAnalysis {
  const vars = parseEnv(text)
  const byKind = new Map<string, EnvService>()
  for (const { key, value } of vars) {
    const r = classify(key, value)
    const svc = byKind.get(r.kind) || { kind: r.kind, label: r.label, keys: [], migratable: r.migratable, aiven: r.aiven, note: r.note }
    svc.keys.push(key)
    byKind.set(r.kind, svc)
  }
  const services = [...byKind.values()].sort((a, b) => Number(b.migratable) - Number(a.migratable))

  // Find a usable Postgres connection string to migrate (prefer Supabase host).
  const pgUrls = vars.map((v) => v.value).filter((v) => /^postgres(ql)?:\/\//i.test(v))
  const supaUrl = pgUrls.find((u) => /supabase\.(co|com|net)/i.test(u))
  const dbUrl = supaUrl || pgUrls[0] || null
  const dbKind = dbUrl ? (/supabase/i.test(dbUrl) ? 'supabase' : 'postgres') : null

  const migratable = services.filter((s) => s.migratable)
  return { vars, services, dbUrl, dbKind, migratable, needsConnection: migratable.length > 0 && !dbUrl }
}

// A migratable service resolved to a concrete Aiven type + its source connection.
export type MigratableTarget = { kind: string; label: string; aivenKey: string; conn: string | null }

// Detect the Aiven service type from the value scheme (used both ways).
export function valueType(value: string): string | null {
  if (/^postgres(ql)?:\/\//i.test(value)) return 'pg'
  if (/^mysql:\/\//i.test(value)) return 'mysql'
  if (/^rediss?:\/\//i.test(value)) return 'redis'
  return null
}

// Map a detected service (LLM- or rule-classified) to an AIVEN_TYPES key.
function aivenKeyFor(s: EnvService): string {
  const hay = `${s.kind} ${s.label} ${s.aiven || ''}`.toLowerCase()
  if (/supabase/.test(hay)) return 'supabase'
  if (/postgre|pg\b/.test(hay)) return 'pg'
  if (/mysql|maria/.test(hay)) return 'mysql'
  if (/redis|valkey|cache/.test(hay)) return 'redis'
  if (/opensearch|elastic|search/.test(hay)) return 'opensearch'
  if (/kafka|confluent|redpanda/.test(hay)) return 'kafka'
  return ''
}

// Find the source connection string for a given Aiven target type from the .env.
function connForKey(vars: EnvVar[], key: string): string | null {
  const vals = vars.map((v) => v.value)
  if (key === 'pg' || key === 'supabase') {
    const pgs = vals.filter((v) => /^postgres(ql)?:\/\//i.test(v))
    return pgs.find((u) => /supabase/i.test(u)) || pgs[0] || null
  }
  if (key === 'mysql') return vals.find((v) => /^mysql:\/\//i.test(v)) || null
  if (key === 'redis') return vals.find((v) => /^rediss?:\/\//i.test(v)) || null
  if (key === 'opensearch')
    return vars.find((v) => /OPENSEARCH|ELASTIC/i.test(v.key) && /^https?:\/\//i.test(v.value))?.value || null
  if (key === 'kafka') return vars.find((v) => /KAFKA.*(BROKER|BOOTSTRAP|SERVERS|URL)/i.test(v.key))?.value || null
  return null
}

// Resolve every migratable service to { Aiven type, source connection } so the
// deploy loop can provision + migrate each one.
export function resolveMigratables(text: string, services: EnvService[]): MigratableTarget[] {
  const vars = parseEnv(text)
  const seen = new Set<string>()
  const out: MigratableTarget[] = []
  for (const s of services.filter((x) => x.migratable)) {
    const aivenKey = aivenKeyFor(s)
    if (!aivenKey || seen.has(aivenKey)) continue // one Aiven service per type
    seen.add(aivenKey)
    out.push({ kind: s.kind, label: s.label, aivenKey, conn: connForKey(vars, aivenKey) })
  }
  return out
}

// Produce a rewritten .env: every migrated service's connection points at its new
// Aiven service; Supabase auth/url vars are commented out; the rest is untouched.
// `repoints` is keyed by Aiven type: { pg, mysql, redis, opensearch, kafka }.
export function rewriteEnv(text: string, repoints: Record<string, string | null> | string | null): string {
  // Back-compat: a bare string/null means "the Postgres URL".
  const map: Record<string, string | null> =
    repoints && typeof repoints === 'object' ? repoints : { pg: (repoints as string | null) ?? null }
  const out: string[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) { out.push(raw); continue }
    const eq = line.indexOf('=')
    if (eq < 0) { out.push(raw); continue }
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '')
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    const t = valueType(value)
    if (t && t in map && map[t]) {
      out.push(`# was: ${key}=${redact(value)}`)
      out.push(`${key}=${map[t]}`)
    } else if (map.opensearch && /OPENSEARCH|ELASTIC/i.test(key) && /^https?:\/\//i.test(value)) {
      out.push(`# was: ${key}=${redact(value)}`)
      out.push(`${key}=${map.opensearch}`)
    } else if (map.kafka && /KAFKA.*(BROKER|BOOTSTRAP|SERVERS|URL)/i.test(key)) {
      out.push(`# was: ${key}=${value}`)
      out.push(`${key}=${map.kafka}`)
    } else if (/SUPABASE_(URL|ANON_KEY|SERVICE_ROLE_KEY)/i.test(key) || /VITE_SUPABASE/i.test(key)) {
      out.push(`# ${key} removed — migrated to Aiven (auth now via app_users + the generated API)`)
    } else {
      out.push(raw)
    }
  }
  return out.join('\n')
}

function redact(url: string): string {
  try {
    const u = new URL(url)
    if (u.password) u.password = '****'
    return u.toString()
  } catch {
    return url.replace(/:[^:@/]+@/, ':****@')
  }
}

// Mask a value before sending to the model: keep the shape (URL host/scheme,
// token prefix) so it can classify, but never the actual secret.
export function maskValue(v: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) {
    try {
      const u = new URL(v)
      if (u.password) u.password = '****'
      return u.toString()
    } catch {
      return v.replace(/:[^:@/]+@/, ':****@')
    }
  }
  return v.length > 12 ? v.slice(0, 12) + `…(${v.length})` : v
}

// Agentic detection: Opus classifies the (masked) .env; the deterministic
// analyzer is the fallback. The DB connection string is always resolved locally
// from the raw values, so no secret leaves the machine.
export async function analyzeEnvSmart(text: string): Promise<EnvAnalysis & { byLLM: boolean }> {
  const base = analyzeEnv(text)
  try {
    const masked = parseEnv(text)
      .map((v) => `${v.key}=${maskValue(v.value)}`)
      .join('\n')
    const cls = await llmClassifyEnv(masked)
    if (cls && cls.services.length) {
      const services: EnvService[] = cls.services
        .map((s) => ({
          kind: s.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          label: s.label,
          keys: s.keys || [],
          migratable: !!s.migratable,
          aiven: s.aiven ?? null,
          note: s.note || '',
        }))
        .sort((a, b) => Number(b.migratable) - Number(a.migratable))
      const migratable = services.filter((s) => s.migratable)
      return { ...base, services, migratable, needsConnection: migratable.length > 0 && !base.dbUrl, byLLM: true }
    }
  } catch {
    /* fall back to deterministic */
  }
  return { ...base, byLLM: false }
}

// CLI: tsx server/agents/env-analyzer.ts   (uses a sample .env)
if (process.argv[1] && process.argv[1].endsWith('env-analyzer.ts')) {
  const sample = `# my lovable app
VITE_SUPABASE_URL=https://abcd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres:secretpw@db.abcd.supabase.co:5432/postgres
REDIS_URL=redis://default:pw@fly-redis.upstash.io:6379
STRIPE_SECRET_KEY=sk_live_xxx
OPENAI_API_KEY=sk-proj-xxx
RESEND_API_KEY=re_xxx
JWT_SECRET=supersecret
NODE_ENV=production
PORT=3000`
  const a = analyzeEnv(sample)
  console.log('SERVICES:')
  for (const s of a.services) console.log(`  [${s.migratable ? 'MIGRATE→' + s.aiven : 'keep'}] ${s.label}: ${s.keys.join(', ')}`)
  console.log('\nDB to migrate:', a.dbKind, '->', a.dbUrl ? redact(a.dbUrl) : '(none)')
  console.log('\nREWRITTEN .env:\n' + rewriteEnv(sample, 'postgres://avnadmin:****@pg-xxx.aivencloud.com:14340/defaultdb?sslmode=require'))
}
