// aiven/pg.ts — Postgres access for the target Aiven PG.
// Wraps `pg` with a pooled connection + tiny query helpers, and an idempotent schema applier.
// Aiven PG requires TLS; we strip sslmode/ssl-reject query params from the conn string and set
// ssl: { rejectUnauthorized: false } so it connects without needing the CA file on disk.

import pg from 'pg'

const { Pool } = pg
type PgPool = pg.Pool

// Reuse pools per (normalized) connection string so callers don't leak connections.
const pools = new Map<string, PgPool>()

/** True for Aiven-hosted Postgres (so we know to relax cert verification). */
function isAiven(connStr: string): boolean {
  return /aivencloud\.com/i.test(connStr)
}

/**
 * Strip TLS-related query params from a conn string. Aiven URIs come with `?sslmode=require`
 * (and sometimes a `?ssl=...`); node-postgres reads `sslmode` from the string and would then
 * demand a CA. We remove those and drive TLS via the `ssl` option object instead.
 */
export function normalizeConnString(connStr: string): string {
  if (!connStr) return connStr
  try {
    const u = new URL(connStr)
    u.searchParams.delete('sslmode')
    u.searchParams.delete('ssl')
    return u.toString()
  } catch {
    // Not a parseable URL — strip the params textually as a fallback.
    return connStr.replace(/([?&])(sslmode|ssl)=[^&]*/gi, '$1').replace(/[?&]$/, '')
  }
}

/** Get (or create) a pooled connection for the given conn string. */
export function pool(connStr?: string): PgPool {
  const cs = connStr || process.env.DATABASE_URL
  if (!cs) {
    throw new Error('aiven/pg: no connection string (pass one or set DATABASE_URL)')
  }
  const normalized = normalizeConnString(cs)
  let p = pools.get(normalized)
  if (p) return p

  p = new Pool({
    connectionString: normalized,
    ssl: isAiven(cs) ? { rejectUnauthorized: false } : undefined,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  })
  // Don't let an idle-client error crash the process; log and move on.
  p.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[aiven/pg] idle client error:', err.message)
  })
  pools.set(normalized, p)
  return p
}

/** Run a query, return all rows. */
export async function q<T = any>(
  connStr: string,
  text: string,
  params?: any[]
): Promise<T[]> {
  const res = await pool(connStr).query(text, params)
  return res.rows as T[]
}

/** Run a query, return the first row (or null). */
export async function q1<T = any>(
  connStr: string,
  text: string,
  params?: any[]
): Promise<T | null> {
  const res = await pool(connStr).query(text, params)
  return (res.rows[0] as T) ?? null
}

/**
 * Apply a SQL schema/migration string. Runs the whole script in one round-trip inside a
 * transaction so partial failures roll back. CREATE FUNCTION / triggers / DO blocks are fine here
 * (this is a direct pg connection, not the MCP write path which blocks them).
 * Returns { statements } as a best-effort count for receipts.
 */
export async function applySchemaSql(
  connStr: string,
  sql: string
): Promise<{ ok: boolean; statements: number; error?: string }> {
  const trimmed = (sql || '').trim()
  if (!trimmed) return { ok: true, statements: 0 }

  const client = await pool(connStr).connect()
  try {
    await client.query('BEGIN')
    // Run the full script as a single multi-statement query — preserves $$ function bodies and
    // DO blocks that naive ';'-splitting would shred.
    await client.query(trimmed)
    await client.query('COMMIT')
    return { ok: true, statements: countStatements(trimmed) }
  } catch (e: any) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore rollback failure */
    }
    return { ok: false, statements: 0, error: e?.message ?? String(e) }
  } finally {
    client.release()
  }
}

/** Rough top-level statement count (ignores ';' inside $$-quoted bodies). For receipts only. */
function countStatements(sql: string): number {
  let count = 0
  let inDollar = false
  let dollarTag = ''
  const tokens = sql.split(/(\$\w*\$)/g)
  for (const tok of tokens) {
    const m = tok.match(/^\$\w*\$$/)
    if (m) {
      if (!inDollar) {
        inDollar = true
        dollarTag = tok
      } else if (tok === dollarTag) {
        inDollar = false
        dollarTag = ''
      }
      continue
    }
    if (!inDollar) {
      count += (tok.match(/;/g) || []).length
    }
  }
  return Math.max(count, 1)
}

/** Close all pools (for graceful shutdown). */
export async function closeAll(): Promise<void> {
  await Promise.all([...pools.values()].map((p) => p.end().catch(() => {})))
  pools.clear()
}
