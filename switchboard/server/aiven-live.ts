import pg from 'pg'

// Live connection to an Aiven for PostgreSQL service. The URL is per-request
// (the user's own Aiven Postgres URI) with AIVEN_DB_URL as a fallback default.
// When present, the Migrator runs the (transformed) schema and reads real
// numbers; when absent, callers show "not connected" instead of inventing data.

const TABLES = ['app_users', 'sessions', 'profiles', 'boards', 'cards'] as const

// A password is unusable if it's empty or a redaction placeholder (the Aiven
// token returns "<REDACTED>"; a secret hook may rewrite URL passwords too).
function redacted(pw: string): boolean {
  return !pw || /redacted/i.test(pw) || pw.startsWith('<')
}
function usable(url: string): boolean {
  try {
    return !redacted(new URL(url).password || '')
  } catch {
    return false
  }
}

// Resolve a usable connection string: a passed URL, then AIVEN_DB_URL, then the
// split AIVEN_DB_* fields (a bare password survives the secret hook that mangles
// URL-embedded ones). Returns '' if no usable (non-redacted) connection exists.
export function resolveUrl(url?: string): string {
  if (url && url.trim() && usable(url)) return url.trim()
  const env = process.env.AIVEN_DB_URL || ''
  if (env && usable(env)) return env
  const host = process.env.AIVEN_DB_HOST
  const pw = process.env.AIVEN_DB_PASSWORD || ''
  if (host && !redacted(pw)) {
    const user = process.env.AIVEN_DB_USER || 'avnadmin'
    const port = process.env.AIVEN_DB_PORT || '5432'
    const db = process.env.AIVEN_DB_NAME || 'defaultdb'
    return `postgres://${user}:${encodeURIComponent(pw)}@${host}:${port}/${db}?sslmode=require`
  }
  return ''
}
export function envUrl(): string {
  return resolveUrl()
}
export function liveConfigured(url?: string): boolean {
  return Boolean(resolveUrl(url))
}

export function parseTarget(url?: string): { connected: boolean; host: string; service: string } {
  const u = resolveUrl(url)
  if (!u) return { connected: false, host: '', service: '' }
  try {
    const p = new URL(u)
    return { connected: true, host: `${p.hostname}:${p.port || '5432'}`, service: p.hostname.split('.')[0] }
  } catch {
    return { connected: false, host: '', service: '' }
  }
}

function newClient(url: string) {
  return new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
}

export type LiveState = {
  counts: Record<string, number>
  totalRows: number
  authVerified: boolean
  sizeBytes: number
  policies: number
  tables: string[]
}

async function readState(c: pg.Client): Promise<LiveState> {
  // Count whatever public tables actually exist (works for any migrated app).
  const t = await c.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename",
  )
  const tables: string[] = t.rows.map((r) => r.tablename)
  const counts: Record<string, number> = {}
  for (const name of tables) {
    try {
      const r = await c.query(`select count(*)::int as n from "${name}"`)
      counts[name] = r.rows[0].n
    } catch {
      /* skip unreadable */
    }
  }
  // Generic pgcrypto round-trip: proves password hashing works on the target.
  let authVerified = false
  try {
    const a = await c.query("select (h = crypt('switchboard-probe', h)) as ok from (select crypt('switchboard-probe', gen_salt('bf')) as h) s")
    authVerified = a.rows[0]?.ok === true
  } catch {
    /* pgcrypto not present yet */
  }
  const sz = await c.query('select pg_database_size(current_database()) as bytes')
  const pol = await c.query("select count(*)::int as n from pg_policies where schemaname = 'public'")
  return {
    counts,
    totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    authVerified,
    sizeBytes: Number(sz.rows[0].bytes),
    policies: pol.rows[0].n,
    tables,
  }
}

export async function liveInspect(url?: string): Promise<LiveState> {
  const u = resolveUrl(url)
  if (!u) throw new Error('no Aiven DB URL')
  const c = newClient(u)
  await c.connect()
  try {
    return await readState(c)
  } finally {
    await c.end()
  }
}

// Run the transformed schema live (idempotent) and read back real numbers.
export async function liveMigrate(url: string | undefined, sql: string, onLog?: (m: string) => void): Promise<LiveState> {
  const u = resolveUrl(url)
  if (!u) throw new Error('no Aiven DB URL')
  const c = newClient(u)
  await c.connect()
  try {
    for (const s of splitSql(sql)) {
      try {
        await c.query(s)
        onLog?.(firstWords(s))
      } catch (e: any) {
        onLog?.(`skip (${e.code || 'err'}): ${firstWords(s)}`)
      }
    }
    return await readState(c)
  } finally {
    await c.end()
  }
}

export function splitSql(sql: string): string[] {
  return sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

function firstWords(sql: string): string {
  const one = sql.replace(/\s+/g, ' ').trim()
  return one.length > 64 ? one.slice(0, 61) + '...' : one
}
