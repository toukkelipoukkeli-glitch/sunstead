import pg from 'pg'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mgmtAuthUsers, mgmtReadTable } from './supabase-mgmt'

// Homebrew's libpq is keg-only, so pg_dump/psql aren't on PATH. Resolve them.
function pgTool(name: 'pg_dump' | 'psql'): string {
  const candidates = [
    process.env.PG_BIN ? `${process.env.PG_BIN.replace(/\/$/, '')}/${name}` : '',
    `/opt/homebrew/opt/libpq/bin/${name}`,
    `/usr/local/opt/libpq/bin/${name}`,
  ].filter(Boolean)
  for (const p of candidates) if (existsSync(p)) return p
  return name // fall back to PATH
}

// Build a node-postgres config. CRITICAL: node-postgres tries to verify the cert
// when `sslmode` is in the connection string, which fails on Supabase/Aiven's
// chain — so we strip sslmode and pass ssl explicitly. Local DBs use no TLS.
export function clientConfig(url: string): pg.ClientConfig {
  const u = new URL(url)
  const local = u.searchParams.get('sslmode') === 'disable' || /^(localhost|127\.0\.0\.1)$/.test(u.hostname)
  u.searchParams.delete('sslmode')
  return {
    connectionString: u.toString(),
    ssl: local ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 25000,
  }
}

export type Inspection = {
  sizeBytes: number
  tables: { name: string; rows: number }[]
  totalRows: number
  extensions: string[]
  policies: number
  supabaseSchemas: string[]
}

export async function inspect(url: string): Promise<Inspection> {
  const client = new pg.Client(clientConfig(url))
  await client.connect()
  try {
    const size = await client.query('select pg_database_size(current_database()) as bytes')
    const sizeBytes = Number(size.rows[0].bytes)

    const tablesRes = await client.query(
      `select c.relname as name, c.reltuples::bigint as est
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where c.relkind = 'r' and n.nspname = 'public'
        order by c.relname`
    )
    const tables: { name: string; rows: number }[] = []
    let totalRows = 0
    for (const t of tablesRes.rows) {
      let rows = Number(t.est) || 0
      try {
        const c = await client.query(`select count(*)::bigint as n from "public"."${t.name}"`)
        rows = Number(c.rows[0].n)
      } catch {
        /* keep estimate */
      }
      totalRows += rows
      tables.push({ name: t.name, rows })
    }

    const ext = await client.query('select extname from pg_extension order by extname')
    const pol = await client.query("select policyname from pg_policies where schemaname = 'public'")
    const sb = await client.query(
      "select nspname from pg_namespace where nspname in ('auth','storage','graphql','graphql_public','realtime','vault','supabase_functions')"
    )

    return {
      sizeBytes,
      tables,
      totalRows,
      extensions: ext.rows.map((r) => r.extname),
      policies: pol.rowCount ?? 0,
      supabaseSchemas: sb.rows.map((r) => r.nspname),
    }
  } finally {
    await client.end()
  }
}

// Dump the public-schema DDL of a Supabase database (the user pastes its URL).
// pg_dump gives real, complete DDL (tables, RLS, indexes); the transformer then
// rewrites it for Aiven. Data is copied separately via realMigrate.
export function dumpSchema(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const dump = spawn(pgTool('pg_dump'), ['--schema-only', '--no-owner', '--no-acl', '--schema=public', '--dbname=' + url])
    let out = ''
    let err = ''
    const timer = setTimeout(() => { dump.kill(); reject(new Error('pg_dump timed out (host unreachable?)')) }, 25000)
    dump.stdout.on('data', (d) => (out += d.toString()))
    dump.stderr.on('data', (d) => (err += d.toString()))
    dump.on('error', (e) => { clearTimeout(timer); reject(new Error('pg_dump not available: ' + e.message)) })
    dump.on('close', (code) => { clearTimeout(timer); code === 0 ? resolve(out) : reject(new Error('pg_dump exited ' + code + ': ' + err.slice(0, 300))) })
  })
}

// Copy row DATA from the source DB into the migrated target. Two parts:
//  1. Supabase auth.users -> app_users (preserves bcrypt password hashes = logins).
//  2. public-schema data via pg_dump --data-only | psql (dependency-ordered).
export async function copyData(
  sourceUrl: string,
  targetUrl: string,
  onLog: (m: string) => void = () => {},
): Promise<{ authUsers: number; counts: Record<string, number>; totalRows: number }> {
  // 1. auth.users -> app_users bridge (best effort; skipped if no auth schema).
  let authUsers = 0
  try {
    const src = new pg.Client(clientConfig(sourceUrl))
    const tgt = new pg.Client(clientConfig(targetUrl))
    await src.connect()
    await tgt.connect()
    try {
      const r = await src.query('select id, email, encrypted_password from auth.users where email is not null')
      for (const u of r.rows) {
        await tgt
          .query(
            "insert into app_users (id, email, password_hash) values ($1, $2, coalesce($3, '')) on conflict (id) do nothing",
            [u.id, u.email, u.encrypted_password],
          )
          .catch(() => {})
      }
      authUsers = r.rows.length
      if (authUsers) onLog(`bridged ${authUsers} auth.users → app_users`)
    } finally {
      await src.end()
      await tgt.end()
    }
  } catch {
    /* no auth schema, or unreachable — fine */
  }

  // 2. public data: pg_dump --data-only | psql (pg_dump orders by FK dependency).
  await new Promise<void>((resolve, reject) => {
    const dump = spawn(pgTool('pg_dump'), ['--data-only', '--no-owner', '--no-acl', '--schema=public', '--dbname=' + sourceUrl])
    const restore = spawn(pgTool('psql'), ['--dbname=' + targetUrl, '-v', 'ON_ERROR_STOP=0', '-q'])
    dump.stdout.pipe(restore.stdin)
    const timer = setTimeout(() => { dump.kill(); restore.kill(); reject(new Error('data copy timed out')) }, 120000)
    dump.on('error', (e) => { clearTimeout(timer); reject(new Error('pg_dump: ' + e.message)) })
    restore.on('error', (e) => { clearTimeout(timer); reject(new Error('psql: ' + e.message)) })
    restore.on('close', () => { clearTimeout(timer); resolve() })
  })

  // 3. count what's now on the target.
  const counts: Record<string, number> = {}
  let totalRows = 0
  const c = new pg.Client(clientConfig(targetUrl))
  await c.connect()
  try {
    const t = await c.query("select tablename from pg_tables where schemaname = 'public' order by tablename")
    for (const row of t.rows) {
      try {
        const r = await c.query(`select count(*)::int as n from "${row.tablename}"`)
        counts[row.tablename] = r.rows[0].n
        totalRows += r.rows[0].n
      } catch {
        /* skip */
      }
    }
  } finally {
    await c.end()
  }
  return { authUsers, counts, totalRows }
}

// Copy row DATA when the source is reached over the Supabase Management API (the
// OAuth / PAT "Connect Supabase" path) instead of a raw connection string. Reads
// run over HTTPS with the scoped token; writes go to the Aiven target via pg.
// Mirrors copyData: auth.users -> app_users bridge, then public tables.
export async function copyDataFromMgmt(
  token: string,
  ref: string,
  targetUrl: string,
  tables: string[],
  onLog: (m: string) => void = () => {},
): Promise<{ authUsers: number; counts: Record<string, number>; totalRows: number; capped: string[] }> {
  const tgt = new pg.Client(clientConfig(targetUrl))
  await tgt.connect()
  const counts: Record<string, number> = {}
  const capped: string[] = []
  let authUsers = 0
  let totalRows = 0
  try {
    const users = await mgmtAuthUsers(token, ref)
    for (const u of users) {
      await tgt
        .query("insert into app_users (id, email, password_hash) values ($1, $2, coalesce($3, '')) on conflict (id) do nothing", [u.id, u.email, u.encrypted_password])
        .catch(() => {})
    }
    authUsers = users.length
    if (authUsers) onLog(`bridged ${authUsers} auth.users → app_users`)

    for (const t of tables) {
      try {
        const { rows, capped: cap } = await mgmtReadTable(token, ref, t)
        if (cap) capped.push(t)
        let n = 0
        for (const row of rows) {
          const keys = Object.keys(row)
          if (!keys.length) continue
          const colList = keys.map((k) => `"${k}"`).join(', ')
          const ph = keys.map((_, i) => `$${i + 1}`).join(', ')
          const vals = keys.map((k) => normalizeVal(row[k]))
          try {
            await tgt.query(`insert into "public"."${t}" (${colList}) values (${ph}) on conflict do nothing`, vals)
            n++
          } catch {
            /* skip a row the target rejects (type edge) — honest partial copy */
          }
        }
        counts[t] = n
        totalRows += n
        onLog(`copied ${n} row${n === 1 ? '' : 's'} → ${t}${cap ? ' (capped at 5000)' : ''}`)
      } catch (e: any) {
        onLog(`skip ${t}: ${e.message}`)
      }
    }
  } finally {
    await tgt.end()
  }
  return { authUsers, counts, totalRows, capped }
}

// Management-API rows come back as parsed JSON. Objects are jsonb -> stringify;
// arrays pass through to node-postgres (native pg array). Scalars pass through.
function normalizeVal(v: any): any {
  if (v === null || v === undefined) return null
  if (Array.isArray(v)) return v
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}

async function countAll(url: string, tables: string[]) {
  const c = new pg.Client(clientConfig(url))
  await c.connect()
  const out: Record<string, number> = {}
  try {
    for (const t of tables) {
      const r = await c.query(`select count(*)::bigint as n from "public"."${t}"`)
      out[t] = Number(r.rows[0].n)
    }
  } finally {
    await c.end()
  }
  return out
}

export async function verifyCounts(sourceUrl: string, targetUrl: string, tables: string[]) {
  const [source, target] = await Promise.all([countAll(sourceUrl, tables), countAll(targetUrl, tables)])
  const mismatch = tables.filter((t) => source[t] !== target[t])
  return { source, target, match: mismatch.length === 0, mismatch }
}

// Real migration: pg_dump (public schema) piped straight into psql on the target.
export function realMigrate(sourceUrl: string, targetUrl: string, onLog: (m: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const dump = spawn(pgTool('pg_dump'), ['--no-owner', '--no-acl', '--schema=public', '--dbname=' + sourceUrl])
    const restore = spawn(pgTool('psql'), ['--dbname=' + targetUrl, '-v', 'ON_ERROR_STOP=0'])
    dump.stdout.pipe(restore.stdin)

    let failed = false
    const fail = (e: unknown) => {
      if (failed) return
      failed = true
      reject(e instanceof Error ? e : new Error(String(e)))
    }
    const line = (d: Buffer) => String(d).split('\n').map((s) => s.trim()).filter(Boolean).forEach(onLog)
    dump.stderr.on('data', line)
    restore.stderr.on('data', line)
    dump.on('error', (e) => fail(new Error('pg_dump not available: ' + e.message)))
    restore.on('error', (e) => fail(new Error('psql not available: ' + e.message)))
    restore.on('close', (code) => (code === 0 ? resolve() : fail(new Error('psql exited with code ' + code))))
  })
}
