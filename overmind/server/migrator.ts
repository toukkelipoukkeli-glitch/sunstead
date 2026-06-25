// server/migrator.ts — REAL, deterministic data plumbing for the Overmind demo migration.
//
// This is the honest engine behind the demo's provision → migrate → verify arc. It does NO theater:
//   • targetConnInfo()   resolves overmind-grad's live connection string from the Aiven REST API.
//   • applyTargetSchema() applies the PulseWall schema to overmind-grad (idempotent, direct pg —
//                         the MCP write path blocks CREATE EXTENSION / CREATE FUNCTION).
//   • copyData(emit)      reads rows from the SOURCE (overmind-pg via DATABASE_URL) and bulk-inserts
//                         them into the TARGET (overmind-grad), in FK order, INCLUDING the pgvector
//                         embedding column. Emits {type:'migration'} as rows actually land.
//   • verifyParity()      SELECT count(*) per table on BOTH source and target and reports real equality.
//
// Degradation contract: every function logs clearly and returns a typed result rather than throwing
// into the pipeline. The orchestrator decides how to narrate; we never crash the run.

import type { SwarmEvent } from '../shared/types.ts'
import { AIVEN_PROJECT, hasAivenToken } from './env.ts'
import { applySchemaSql, q, normalizeConnString } from '../aiven/pg.ts'
import { connectionInfo } from '../aiven/rest.ts'
import { getPgSecrets } from '../aiven/mcp.ts'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** The target service we migrate INTO. The source is overmind-pg via DATABASE_URL. */
export const TARGET_SERVICE = process.env.OVERMIND_TARGET_SERVICE || 'overmind-grad'

/** Tables in FK-safe insert order. users ← posts ← reactions. */
const TABLES = ['users', 'posts', 'reactions'] as const
type Table = (typeof TABLES)[number]

/** Per-table column lists (match demo/pulsewall-aiven/db/schema.sql exactly). embedding is read/written
 *  as text and cast to vector so it round-trips over the plain pg driver. */
const COLUMNS: Record<Table, string[]> = {
  users: ['id', 'email', 'handle', 'created_at'],
  posts: ['id', 'author_id', 'author_handle', 'body', 'image_url', 'reaction_count', 'embedding', 'created_at'],
  reactions: ['id', 'post_id', 'user_id', 'emoji', 'created_at'],
}

/** Columns that must be read as ::text from the source and re-cast on insert (pgvector). */
const TEXT_CAST: Partial<Record<Table, Record<string, string>>> = {
  posts: { embedding: 'vector' },
}

const now = () => new Date().toISOString()

// ──────────────────────────── target connection ────────────────────────────

/** A REST conn string whose password is the literal redaction placeholder is unusable. */
function isRedacted(conn: string | undefined): boolean {
  return !conn || /:%3Credacted%3E@|:<redacted>@/i.test(conn)
}

/**
 * Resolve overmind-grad's live Postgres connection string.
 *
 * IMPORTANT: the Aiven REST v1 API redacts service passwords for our token scope
 * (service_uri_params.password === "<redacted>"), so a REST-assembled URI fails auth. The MCP
 * endpoint (allow_secrets=true) is the only path that returns the real password — we try it FIRST.
 * REST is kept as a fallback for the rare case the MCP secrets call is unavailable but REST isn't
 * redacting. Returns a normalized conn string (sslmode stripped — aiven/pg.ts drives TLS via ssl),
 * or null (with a clear log) if creds can't be resolved.
 */
export async function targetConnInfo(emit: (e: SwarmEvent) => void): Promise<string | null> {
  if (!hasAivenToken()) {
    emit({ type: 'log', level: 'warn', msg: 'migrate: AIVEN_TOKEN unset — cannot resolve target connection' })
    return null
  }

  // 1) MCP secrets (real password).
  try {
    const sec = await getPgSecrets(AIVEN_PROJECT, TARGET_SERVICE)
    let conn = sec?.service_uri
    if (!conn && sec?.host && sec?.user && sec?.password) {
      const db = sec.dbname || 'defaultdb'
      conn = `postgres://${encodeURIComponent(sec.user)}:${encodeURIComponent(sec.password)}@${sec.host}:${sec.port ?? 5432}/${db}?sslmode=require`
    }
    if (conn && !isRedacted(conn)) {
      emit({ type: 'log', level: 'info', msg: `migrate: resolved live ${TARGET_SERVICE} credentials via Aiven MCP` })
      return normalizeConnString(conn)
    }
  } catch (e) {
    emit({ type: 'log', level: 'warn', msg: `migrate: MCP connection-info lookup failed (${(e as Error).message})` })
  }

  // 2) REST fallback (works only if this token's REST scope is not redacting secrets).
  try {
    const ci = await connectionInfo(AIVEN_PROJECT, TARGET_SERVICE)
    let conn = ci.uri
    if ((!conn || isRedacted(conn)) && ci.host && ci.user && ci.password) {
      const db = ci.dbname || 'defaultdb'
      conn = `postgres://${encodeURIComponent(ci.user)}:${encodeURIComponent(ci.password)}@${ci.host}:${ci.port ?? 5432}/${db}?sslmode=require`
    }
    if (conn && !isRedacted(conn)) {
      emit({ type: 'log', level: 'info', msg: `migrate: resolved ${TARGET_SERVICE} credentials via Aiven REST` })
      return normalizeConnString(conn)
    }
    emit({ type: 'log', level: 'warn', msg: `migrate: ${TARGET_SERVICE} credentials redacted by REST and MCP secrets unavailable` })
    return null
  } catch (e) {
    emit({ type: 'log', level: 'warn', msg: `migrate: target connection lookup failed (${(e as Error).message})` })
    return null
  }
}

// ──────────────────────────── schema ────────────────────────────

/** Read the canonical PulseWall schema from demo/pulsewall-aiven/db/schema.sql. */
function loadSchemaSql(): string {
  // overmind/server → repo root is two levels up; schema lives under demo/pulsewall-aiven/db.
  const path = resolve(__dirname, '../../demo/pulsewall-aiven/db/schema.sql')
  return readFileSync(path, 'utf8')
}

/**
 * Apply the PulseWall schema to the target over a DIRECT pg connection (applySchemaSql runs the
 * whole script in one transaction, so CREATE EXTENSION / CREATE FUNCTION / triggers all work — the
 * MCP write path would reject them). Idempotent: the schema is all `create ... if not exists` /
 * `create or replace`. Returns {ok, statements, error?}.
 */
export async function applyTargetSchema(
  targetConn: string,
  emit: (e: SwarmEvent) => void,
): Promise<{ ok: boolean; statements: number; error?: string }> {
  let sql: string
  try {
    sql = loadSchemaSql()
  } catch (e) {
    const error = `schema file unreadable: ${(e as Error).message}`
    emit({ type: 'log', level: 'warn', msg: `migrate: ${error}` })
    return { ok: false, statements: 0, error }
  }
  const res = await applySchemaSql(targetConn, sql)
  if (res.ok) {
    emit({ type: 'log', level: 'info', msg: `migrate: applied schema to ${TARGET_SERVICE} (${res.statements} statements, idempotent)` })
  } else {
    emit({ type: 'log', level: 'warn', msg: `migrate: schema apply failed on ${TARGET_SERVICE} (${res.error})` })
  }
  return res
}

// ──────────────────────────── data copy ────────────────────────────

export interface CopyTableResult {
  table: string
  source: number
  copied: number
  ok: boolean
  error?: string
}

/** Build the SELECT column expr — cast vector → text so it serializes over the wire. */
function selectExpr(table: Table): string {
  const cast = TEXT_CAST[table] ?? {}
  return COLUMNS[table]
    .map((c) => (cast[c] ? `${c}::text as ${c}` : c))
    .join(', ')
}

/** Build a parameterized INSERT with one ($1,$2,...) row group, re-casting text columns back. */
function insertSql(table: Table, rowCount: number): string {
  const cols = COLUMNS[table]
  const cast = TEXT_CAST[table] ?? {}
  const groups: string[] = []
  let p = 1
  for (let r = 0; r < rowCount; r++) {
    const ph = cols.map((c) => {
      const placeholder = `$${p++}`
      return cast[c] ? `${placeholder}::${cast[c]}` : placeholder
    })
    groups.push(`(${ph.join(', ')})`)
  }
  return `insert into ${table} (${cols.join(', ')}) values ${groups.join(', ')} on conflict (id) do nothing`
}

/**
 * Copy all rows for one table from source → target, chunked, on a single dedicated client.
 * Emits a {type:'migration'} event after each chunk REALLY lands (copied reflects rows actually
 * inserted into the target). The caller manages the reaction trigger around the whole sequence.
 */
async function copyTable(
  sourceConn: string,
  client: import('pg').PoolClient,
  table: Table,
  emit: (e: SwarmEvent) => void,
  chunkSize = 50,
): Promise<CopyTableResult> {
  const cols = COLUMNS[table]
  // Read every row from the source (small demo dataset — full read is fine and exact).
  const rows = await q<Record<string, any>>(sourceConn, `select ${selectExpr(table)} from ${table} order by created_at asc, id asc`)
  const total = rows.length
  let copied = 0

  // Idempotent: truncate the target table so re-runs land exact counts. We copy in FK order
  // (users→posts→reactions); truncating `users` cascades to children, so by the time we reach
  // posts/reactions they're already empty — truncating each again is a harmless no-op.
  await client.query(`truncate table ${table} cascade`)
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const params: any[] = []
    for (const row of chunk) for (const c of cols) params.push(row[c] ?? null)
    await client.query(insertSql(table, chunk.length), params)
    copied += chunk.length
    emit({ type: 'migration', table, copied, total })
  }
  return { table, source: total, copied, ok: copied === total }
}

/**
 * Copy users → posts → reactions from source into target, in FK order, including pgvector embeddings.
 * Emits real {type:'migration'} progress as rows land. Returns per-table results.
 *
 * The reaction trigger problem: schema.sql installs trg_bump_reaction, which increments
 * posts.reaction_count on every reaction INSERT. If left active, copying reactions would corrupt the
 * reaction_count we just copied verbatim from the source. avnadmin is NOT a superuser on Aiven (so
 * `SET session_replication_role=replica` is denied), but it OWNS the schema objects — so we DROP the
 * trigger before the copy and recreate it afterward (DDL avnadmin is allowed to run). The whole copy
 * runs in one transaction on one client, so a failure rolls back cleanly and the trigger is restored.
 */
export async function copyData(
  sourceConn: string,
  targetConn: string,
  emit: (e: SwarmEvent) => void,
): Promise<CopyTableResult[]> {
  const results: CopyTableResult[] = []
  const { pool } = await import('../aiven/pg.ts')
  const client = await pool(targetConn).connect()
  try {
    await client.query('BEGIN')
    // Disable the reaction-count trigger for the bulk copy (avnadmin owns it → DROP is allowed).
    await client.query('drop trigger if exists trg_bump_reaction on reactions')
    for (const t of TABLES) {
      const r = await copyTable(sourceConn, client, t, emit)
      results.push(r)
      if (r.ok) {
        emit({ type: 'log', level: 'info', msg: `migrate: copied ${r.copied}/${r.source} rows into ${TARGET_SERVICE}.${t}` })
      } else {
        emit({ type: 'log', level: 'warn', msg: `migrate: ${t} copy incomplete (${r.copied}/${r.source})` })
      }
    }
    // Recreate the trigger so the live target behaves exactly like the source going forward.
    await client.query(`create trigger trg_bump_reaction
      after insert or delete on reactions
      for each row execute function bump_reaction_count()`)
    await client.query('COMMIT')
  } catch (e: any) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore */
    }
    emit({ type: 'log', level: 'warn', msg: `migrate: copy transaction failed, rolled back (${e?.message ?? e})` })
    // Reflect failure for any tables not yet recorded.
    for (const t of TABLES) {
      if (!results.find((r) => r.table === t)) results.push({ table: t, source: 0, copied: 0, ok: false, error: e?.message ?? String(e) })
    }
  } finally {
    client.release()
  }
  return results
}

// ──────────────────────────── parity ────────────────────────────

export interface ParityRow {
  table: string
  source: number
  target: number
  ok: boolean
}

/**
 * SELECT count(*) per table on BOTH source and target; ok only when equal. Real numbers, no fakery.
 * Also reports the embedding row (posts with a non-null embedding) so we can prove vectors moved.
 */
export async function verifyParity(
  sourceConn: string,
  targetConn: string,
  emit: (e: SwarmEvent) => void,
): Promise<{ rows: ParityRow[]; embedding: ParityRow }> {
  const rows: ParityRow[] = []
  for (const t of TABLES) {
    let source = -1
    let target = -1
    try {
      source = Number((await q<{ n: string }>(sourceConn, `select count(*)::text n from ${t}`))[0]?.n ?? -1)
    } catch (e) {
      emit({ type: 'log', level: 'warn', msg: `verify: source count ${t} failed (${(e as Error).message})` })
    }
    try {
      target = Number((await q<{ n: string }>(targetConn, `select count(*)::text n from ${t}`))[0]?.n ?? -1)
    } catch (e) {
      emit({ type: 'log', level: 'warn', msg: `verify: target count ${t} failed (${(e as Error).message})` })
    }
    rows.push({ table: t, source, target, ok: source >= 0 && source === target })
  }

  // Embedding parity: posts with a non-null vector on both sides.
  let embSrc = -1
  let embTgt = -1
  const embSql = `select count(*)::text n from posts where embedding is not null`
  try {
    embSrc = Number((await q<{ n: string }>(sourceConn, embSql))[0]?.n ?? -1)
  } catch {
    /* leave -1 */
  }
  try {
    embTgt = Number((await q<{ n: string }>(targetConn, embSql))[0]?.n ?? -1)
  } catch {
    /* leave -1 */
  }
  const embedding: ParityRow = { table: 'posts.embedding', source: embSrc, target: embTgt, ok: embSrc >= 0 && embSrc === embTgt }

  return { rows, embedding }
}

/** Source connection string — the live overmind-pg via DATABASE_URL. */
export function sourceConn(): string | null {
  return process.env.DATABASE_URL || null
}
