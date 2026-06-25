import 'dotenv/config'
import pg from 'pg'
import { splitSql } from './aiven-ops'
import { llmConfigured, llmModel, llmRepairStatements } from './llm'

// The self-correcting migration loop. It runs the migration SQL on the target,
// catches the statements that fail, asks Claude to repair them from the actual
// error, and retries — until everything applies or it runs out of rounds. Then
// it verifies the result. This is the "fixes its own mistakes" core.

type Log = (m: string) => void
const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const short = (s: string) => (norm(s).length > 72 ? norm(s).slice(0, 69) + '…' : norm(s))

export type Repair = { original: string; fixed: string; error: string }
export type MigrationResult = {
  ok: boolean
  appliedCount: number
  rounds: number
  repairs: Repair[]
  dropped: { sql: string; reason: string }[]
  unresolved: { sql: string; error: string }[]
  tables: string[]
  counts: Record<string, number>
  totalRows: number
  authVerified: boolean
  schema: string
}

function client(url: string) {
  // node-postgres ignores the ssl option when sslmode is in the URL, so strip it
  // and pass ssl explicitly (Aiven uses a self-signed chain; local DBs use none).
  const u = new URL(url)
  const local = u.searchParams.get('sslmode') === 'disable' || /^(localhost|127\.0\.0\.1)$/.test(u.hostname)
  u.searchParams.delete('sslmode')
  return new pg.Client({ connectionString: u.toString(), ssl: local ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 8000, query_timeout: 30000 })
}

export async function migrateWithRepair(
  url: string,
  sql: string,
  onLog: Log = () => {},
  opts: { maxRounds?: number; schema?: string } = {},
): Promise<MigrationResult> {
  const maxRounds = opts.maxRounds ?? 3
  const schema = opts.schema
  const c = client(url)
  await c.connect()
  const repairs: Repair[] = []
  const dropped: { sql: string; reason: string }[] = []
  const unresolved: { sql: string; error: string }[] = []
  let pending = splitSql(sql)
  let applied = 0
  let attempt = 0
  try {
    if (schema) {
      // Isolate each migrated app in its own schema so two apps never collide.
      await c.query(`create schema if not exists "${schema}"`)
      await c.query(`set search_path to "${schema}", public`)
      onLog(`isolated into schema "${schema}"`)
    }
    while (pending.length && attempt < maxRounds) {
      attempt++
      const failures: { sql: string; error: string }[] = []
      for (const stmt of pending) {
        try {
          await c.query(stmt)
          applied++
          onLog('✓ ' + short(stmt))
        } catch (e: any) {
          failures.push({ sql: stmt, error: e.message })
          onLog('✗ ' + short(stmt) + ' — ' + e.message)
        }
      }
      if (!failures.length) {
        pending = []
        break
      }
      if (attempt >= maxRounds || !llmConfigured()) {
        unresolved.push(...failures)
        pending = []
        break
      }
      onLog(`round ${attempt}: ${failures.length} failed — asking ${llmModel()} to fix…`)
      const fixes = await llmRepairStatements(failures)
      const next: string[] = []
      failures.forEach((f, i) => {
        const fx = fixes[i] || fixes.find((x) => x && norm(x.original || '') === norm(f.sql))
        if (fx && fx.action === 'drop') {
          dropped.push({ sql: f.sql, reason: fx.reason || 'no Aiven equivalent' })
          onLog('⊘ dropped: ' + short(f.sql) + (fx.reason ? ' — ' + fx.reason : ''))
        } else if (fx && fx.action === 'fix' && fx.fixed.trim() && norm(fx.fixed) !== norm(f.sql)) {
          repairs.push({ original: f.sql, fixed: fx.fixed, error: f.error })
          next.push(fx.fixed)
          onLog('↻ repaired → ' + short(fx.fixed))
        } else {
          unresolved.push(f)
        }
      })
      pending = next
    }

    // Verify on the target: tables, row counts, and a pgcrypto auth probe.
    const tgt = schema || 'public'
    const t = await c.query('select tablename from pg_tables where schemaname = $1 order by tablename', [tgt])
    const tables = t.rows.map((r) => r.tablename)
    const counts: Record<string, number> = {}
    let totalRows = 0
    for (const tn of tables) {
      try {
        const r = await c.query(`select count(*)::int as n from "${tgt}"."${tn}"`)
        counts[tn] = r.rows[0].n
        totalRows += r.rows[0].n
      } catch {
        /* skip */
      }
    }
    let authVerified = false
    try {
      const a = await c.query("select (h = crypt('switchboard-probe', h)) as ok from (select crypt('switchboard-probe', gen_salt('bf')) as h) s")
      authVerified = a.rows[0]?.ok === true
    } catch {
      /* pgcrypto not present */
    }
    return { ok: unresolved.length === 0, appliedCount: applied, rounds: attempt, repairs, dropped, unresolved, tables, counts, totalRows, authVerified, schema: tgt }
  } finally {
    await c.end()
  }
}

// CLI: TEST_DB_URL=postgres://… npx tsx server/agents/migrator-loop.ts
// Runs deliberately broken Supabase-flavored SQL to prove the loop self-heals.
if (process.argv[1] && process.argv[1].endsWith('migrator-loop.ts')) {
  ;(async () => {
    const url = process.env.TEST_DB_URL
    if (!url) {
      console.error('set TEST_DB_URL')
      process.exit(1)
    }
    // Intentional mistakes: auth.uid() and a supabase_realtime publication that
    // don't exist on plain Postgres — the loop should repair them.
    const buggy = `create extension if not exists pgcrypto;
create table if not exists notes (id uuid primary key default gen_random_uuid(), owner uuid not null, body text not null);
alter table notes enable row level security;
create policy notes_read on notes for select using (auth.uid() = owner);
alter publication supabase_realtime add table notes;`
    const r = await migrateWithRepair(url, buggy, (m) => console.log('  ' + m))
    console.log('\nRESULT:', JSON.stringify({ ok: r.ok, applied: r.appliedCount, rounds: r.rounds, tables: r.tables, repairs: r.repairs.map((x) => ({ from: short(x.original), to: short(x.fixed) })), dropped: r.dropped.map((d) => short(d.sql) + ' (' + d.reason + ')'), unresolved: r.unresolved.map((u) => short(u.sql)) }, null, 2))
  })()
}
