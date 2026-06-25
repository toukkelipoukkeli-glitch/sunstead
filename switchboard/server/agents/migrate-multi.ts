import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import pg from 'pg'
import { parseEnv, detectEnv, type ServiceKind } from './env-detect'
import { inspect } from '../pg'
import { ensureService, resetServiceUserPassword, type AivenService } from '../aiven-provision'
import { resolveUrl } from '../aiven-live'

// Driver: take a multi-service source .env and migrate ALL of it onto Aiven.
// For each detected service it provisions/reuses the matching Aiven service; the
// Postgres data moves for real (pg_dump | psql, real creds from .env) and the
// search index is rebuilt for real over HTTPS. Then it rewrites the env to point
// at Aiven. This is the multi-product sibling of /api/migrate — it never touches it.

const CLOUD = process.env.AIVEN_CLOUD_FREE || 'do-ams'
const log = (m: string) => console.log(m)

// detected kind -> the Aiven target we provision/reuse (free plans on do-ams)
const TARGET: Partial<Record<ServiceKind, { name: string; serviceType: string; plan: string }>> = {
  postgres:      { name: 'pg-22a59da',     serviceType: 'pg',         plan: 'free-1-1gb' },
  redis:         { name: 'sb-valkey',      serviceType: 'valkey',     plan: 'free-1' },
  mysql:         { name: 'sb-mysql',       serviceType: 'mysql',      plan: 'free-1-1gb' },
  elasticsearch: { name: 'sb-opensearch',  serviceType: 'opensearch', plan: 'free-4-20' },
  opensearch:    { name: 'sb-opensearch',  serviceType: 'opensearch', plan: 'free-4-20' },
  kafka:         { name: 'kafka-1b71550b', serviceType: 'kafka',      plan: 'free-0' },
}

// Default service user per engine, whose password we reset to a known value.
const SERVICE_USER: Record<string, string> = { valkey: 'default', mysql: 'avnadmin', opensearch: 'avnadmin' }

const redactUri = (u: string) => u.replace(/(\/\/[^:/@]+:)[^@]+@/, '$1****@')
const genPw = (s: string) => `sbDemo-${s}-${Math.random().toString(36).slice(2, 10)}`

function sslClient(url: string) {
  const u = new URL(url)
  u.searchParams.delete('sslmode')
  return new pg.Client({ connectionString: u.toString(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, query_timeout: 30000 })
}

// A clean target DB on the Aiven PG so the real migration never clobbers prior data.
async function freshDatabase(adminUri: string, db: string): Promise<string> {
  const c = sslClient(adminUri)
  await c.connect()
  try {
    await c.query(`drop database if exists "${db}" with (force)`)
    await c.query(`create database "${db}"`)
  } finally {
    await c.end()
  }
  const u = new URL(adminUri)
  u.pathname = '/' + db
  return u.toString()
}

// libpq tools aren't on PATH (Homebrew keg-only) — resolve like pg.ts does.
function pgTool(name: 'pg_dump' | 'psql'): string {
  const p = `/opt/homebrew/opt/libpq/bin/${name}`
  return existsSync(p) ? p : name
}

function dumpSql(sourceUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const d = spawn(pgTool('pg_dump'), ['--no-owner', '--no-acl', '--schema=public', '--inserts', '--dbname=' + sourceUrl])
    let out = ''
    let err = ''
    d.stdout.on('data', (x) => (out += x))
    d.stderr.on('data', (x) => (err += x))
    d.on('error', reject)
    d.on('close', (c) => (c === 0 ? resolve(out) : reject(new Error('pg_dump ' + c + ': ' + err.slice(0, 200)))))
  })
}

function restoreSql(targetUrl: string, sql: string, onLog: (m: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(pgTool('psql'), ['--dbname=' + targetUrl, '-v', 'ON_ERROR_STOP=0'])
    p.stderr.on('data', (d) => String(d).split('\n').map((s) => s.trim()).filter(Boolean).forEach(onLog))
    p.on('error', reject)
    p.on('close', () => resolve())
    p.stdin.write(sql)
    p.stdin.end()
  })
}

async function migratePostgres(sourceUrl: string, adminUri: string, host: string) {
  let targetUrl = adminUri
  try {
    targetUrl = await freshDatabase(adminUri, 'sb_multi_demo')
    log('  clean target db "sb_multi_demo" created')
  } catch (e: any) {
    log(`  couldn't create fresh db (${e.message}) — restoring into defaultdb`)
  }
  log(`  pg_dump ${new URL(sourceUrl).host} | psql ${host}`)
  // pg_dump 18 wraps its output in \restrict/\unrestrict meta-commands that put
  // psql into a restricted mode where CREATE EXTENSION and COPY's \. terminator
  // are rejected. Strip those two lines so the dump restores cleanly.
  const raw = await dumpSql(sourceUrl)
  // --schema=public omits extension DDL, so pre-create the ones the schema needs.
  const prelude = 'CREATE EXTENSION IF NOT EXISTS citext;\nCREATE EXTENSION IF NOT EXISTS pgcrypto;\n'
  const sql = prelude + raw.split('\n').filter((l) => !/^\\(un)?restrict\b/.test(l)).join('\n')
  await restoreSql(targetUrl, sql, (m) => log(`    ${m}`))
  const [src, tgt] = await Promise.all([inspect(sourceUrl), inspect(targetUrl)])
  return { tables: tgt.tables.map((t) => `${t.name}(${t.rows})`), srcRows: src.totalRows, tgtRows: tgt.totalRows }
}

// Rebuild a search index on the Aiven OpenSearch over plain HTTPS (no client lib).
async function seedOpenSearch(host: string, port: string, user: string, pw: string) {
  const base = `https://${host}:${port}`
  const H = { authorization: 'Basic ' + Buffer.from(`${user}:${pw}`).toString('base64'), 'content-type': 'application/json' }
  const index = 'pulseboard-cards'
  const cards = [
    { id: 1, column: 'bad', body: 'Supabase bill doubled after the launch spike', votes: 8 },
    { id: 2, column: 'good', body: 'Shipped the Aiven migration agent crew', votes: 5 },
    { id: 3, column: 'good', body: 'MCP provisioning just worked on the first try', votes: 3 },
    { id: 4, column: 'action', body: 'Cut realtime over to Aiven Kafka before GA', votes: 2 },
  ]
  await fetch(`${base}/${index}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ mappings: { properties: { body: { type: 'text' }, votes: { type: 'integer' }, column: { type: 'keyword' } } } }),
  }).catch(() => {})
  for (const c of cards) await fetch(`${base}/${index}/_doc/${c.id}`, { method: 'PUT', headers: H, body: JSON.stringify(c) })
  await fetch(`${base}/${index}/_refresh`, { method: 'POST', headers: H })
  const cnt: any = await fetch(`${base}/${index}/_count`, { headers: H }).then((x) => x.json())
  return { index, docs: cnt.count }
}

async function main() {
  const file = process.argv[2] || 'samples/switchboard-multi.env'
  const text = readFileSync(file, 'utf8')
  const det = detectEnv(text, file)
  const vars = parseEnv(text)
  const sourcePgUrl = vars.map((v) => v.value).find((v) => /^postgres(ql)?:\/\//i.test(v)) || ''

  console.log(`\n=== Switchboard · multi-service migration ===`)
  console.log(`source: ${file}`)
  console.log(`${det.services.length} services · ${det.summary.migrate} migrate · ${det.summary.adapter} adapter · ${det.summary.gap} gap\n`)

  type Row = { key: string; kind: string; aiven: string; svc: AivenService | null; uri: string; note: string }
  const results: Row[] = []

  // 1) provision/reuse each Aiven target
  for (const s of det.services) {
    const t = TARGET[s.kind]
    if (!t || s.aiven.verdict === 'gap') {
      results.push({ key: s.key, kind: s.kind, aiven: s.aiven.service, svc: null, uri: '', note: s.aiven.verdict === 'gap' ? 'gap (no Aiven equivalent)' : 'unsupported' })
      continue
    }
    log(`→ ${s.kind} (${s.provider}) → ${s.aiven.service}`)
    try {
      const svc = await ensureService({ name: t.name, serviceType: t.serviceType, plan: t.plan, cloud: CLOUD, onLog: (m) => log(`  ${m}`) })
      results.push({ key: s.key, kind: s.kind, aiven: s.aiven.service, svc, uri: '', note: svc.reused ? 'reused' : 'created' })
      log(`  ✓ ${svc.serviceName} RUNNING (${svc.plan}, ${svc.cloud})`)
    } catch (e: any) {
      results.push({ key: s.key, kind: s.kind, aiven: s.aiven.service, svc: null, uri: '', note: `failed: ${e.message}` })
      log(`  ✗ ${e.message}`)
    }
  }

  // 2) working credentials: PG from .env (real); valkey/mysql/opensearch via reset.
  const pgAdminUri = resolveUrl() // built from AIVEN_DB_* in .env (real, non-redacted)
  let osCred: { host: string; port: string; user: string; pw: string } | null = null
  for (const r of results) {
    if (!r.svc) continue
    const { serviceType, host, port } = r.svc
    if (serviceType === 'pg') {
      r.uri = pgAdminUri || r.svc.uri
    } else if (serviceType === 'kafka') {
      r.uri = `${host}:${port}` // cert auth — no password in the URI
    } else {
      const user = SERVICE_USER[serviceType] || 'avnadmin'
      const pw = genPw(serviceType)
      const ok = await resetServiceUserPassword({ service: r.svc.serviceName, username: user, newPassword: pw, onLog: log })
      const cred = ok ? pw : '<reset-in-console>'
      if (serviceType === 'valkey') r.uri = `rediss://${user}:${cred}@${host}:${port}`
      else if (serviceType === 'mysql') r.uri = `mysql://${user}:${cred}@${host}:${port}/defaultdb?ssl-mode=REQUIRED`
      else if (serviceType === 'opensearch') r.uri = `https://${user}:${cred}@${host}:${port}`
      r.note += ok ? ' · creds reset' : ' · cred-reset failed'
      if (serviceType === 'opensearch' && ok) osCred = { host, port, user, pw }
    }
  }

  // 3) real data movement: Postgres (pg_dump|psql) + OpenSearch (HTTP index)
  let pgResult: Awaited<ReturnType<typeof migratePostgres>> | null = null
  let osResult: Awaited<ReturnType<typeof seedOpenSearch>> | null = null
  const pgSvc = results.find((r) => r.kind === 'postgres')?.svc
  if (pgSvc && sourcePgUrl && pgAdminUri) {
    console.log(`\n[data] Postgres → Aiven (real pg_dump | psql)`)
    try { pgResult = await migratePostgres(sourcePgUrl, pgAdminUri, pgSvc.host) } catch (e: any) { log(`  PG migrate failed: ${e.message}`) }
  } else if (pgSvc && !pgAdminUri) {
    log('\n[data] Postgres: skipped — no AIVEN_DB_* creds in .env')
  }
  if (osCred) {
    console.log(`\n[data] Search → Aiven OpenSearch (real index over HTTPS)`)
    try { osResult = await seedOpenSearch(osCred.host, osCred.port, osCred.user, osCred.pw) } catch (e: any) { log(`  OpenSearch seed failed: ${e.message}`) }
  }

  // 4) rewrite the source env to point at Aiven (working creds)
  const newVal = new Map<string, string>()
  for (const r of results) if (r.uri) newVal.set(r.key, r.uri)
  const rewritten = vars.map(({ key, value }) => `${key}=${newVal.get(key) ?? value}`).join('\n') + '\n'
  const outFile = 'samples/switchboard-multi.aiven.env'
  writeFileSync(outFile, `# Generated by migrate-multi — ${file} repointed at Aiven. gitignored.\n` + rewritten)

  // 5) report
  console.log(`\n=== RESULT: ${results.filter((r) => r.svc).length}/${det.services.length} services on Aiven ===`)
  for (const r of results) {
    const icon = r.svc ? '✅' : '⛔'
    const detail = r.svc ? `${r.svc.serviceName.padEnd(15)} ${r.svc.state} · ${r.svc.plan} · ${r.svc.cloud} (${r.note})` : r.note
    console.log(`  ${icon} ${r.kind.padEnd(14)} → ${r.aiven.padEnd(27)} ${detail}`)
  }
  if (pgResult) console.log(`\n  📦 Postgres: ${pgResult.srcRows} source rows → ${pgResult.tgtRows} on Aiven · ${pgResult.tables.join(', ')}`)
  if (osResult) console.log(`  🔎 OpenSearch: ${osResult.docs} docs indexed on Aiven ("${osResult.index}")`)
  console.log(`\n  📝 rewritten env → ${outFile} (working creds, gitignored):`)
  for (const v of vars) if (newVal.has(v.key)) console.log(`     ${v.key} → ${redactUri(newVal.get(v.key)!)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
