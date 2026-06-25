import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { inspect, dumpSchema, copyData, copyDataFromMgmt, type Inspection } from './pg'
import { provisionAiven, AIVEN_TYPES } from './aiven'
import { plan as makePlan } from './agents/planner'
import { report as makeReport } from './agents/reporter'
import { transformSupabaseToAiven } from './agents/schema-transform'
import { analyzeEnvSmart, rewriteEnv, resolveMigratables } from './agents/env-analyzer'
import { migrateMysql, probeRedis } from './agents/migrators'
import { llmConfigured, llmModel, llmPlanMigration } from './agents/llm'
import { liveConfigured, parseTarget, liveInspect, envUrl, type LiveState } from './aiven-live'
import { migrateWithRepair, type MigrationResult } from './agents/migrator-loop'
import { estimateSavings } from './savings'
import { deployApp } from './deploy-app'
import { listProjects, mgmtInspect, mgmtDumpSchema } from './supabase-mgmt'
import {
  oauthConfigured, startAuthorize, exchangeCode, putSession, dropSession, newSessionId,
  tokenFor, parseCookies, sessionCookie, clearCookie, COOKIE,
} from './supabase-oauth'
import type { Analysis } from './agents/types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
// Guard any potentially-slow await (LLM planning, etc.) so the stream can never
// hang silently — if it overruns we reject and fall back instead of freezing.
const withTimeout = <T>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms))])

const app = express()
app.use(cors())
app.use(express.json())

function analysisFromInspect(info: Inspection): Analysis {
  const has = (s: string) => info.supabaseSchemas.includes(s)
  return {
    root: '(live database)',
    filesScanned: 0,
    tables: info.tables.map((t) => t.name),
    authMethods: has('auth') ? ['signUp', 'signInWithPassword', 'signOut', 'getUser'] : [],
    realtimeChannels: has('realtime') ? [{ channel: 'supabase_realtime' }] : [],
    storageBuckets: has('storage') ? ['storage'] : [],
    findings: [],
    schema: { tables: info.tables.map((t) => ({ name: t.name, columns: 0 })), policies: info.policies, indexes: 0, hasRealtimePublication: has('realtime') },
  }
}
const stubAnalysis = (): Analysis => ({ root: '', filesScanned: 0, tables: [], authMethods: [], realtimeChannels: [], storageBuckets: [], findings: [], schema: { tables: [], policies: 0, indexes: 0, hasRealtimePublication: false } })

// ---- "Connect Supabase" helpers ---------------------------------------------
const getSessionId = (req: express.Request): string | undefined => parseCookies(req.headers.cookie)[COOKIE]
const isSecure = (req: express.Request): boolean => process.env.PUBLIC_HTTPS === '1' || req.headers['x-forwarded-proto'] === 'https'
// The single service the OAuth path migrates (the rest of the .env never existed here).
const supabaseService = () => ({ kind: 'supabase', label: 'Supabase', keys: ['connected via OAuth'], migratable: true, aiven: 'Aiven for PostgreSQL', note: 'Database + auth migrate; Storage stays (no Aiven equivalent).' })
function buildOAuthEnv(uri: string): string {
  if (!uri) return '# Nothing was provisioned (set AIVEN_TOKEN to deploy). Your Supabase project was not modified.'
  return [
    '# Vibe Deploy — your data now lives on Aiven for PostgreSQL.',
    '# Point your app at Aiven by replacing the Supabase connection with this:',
    `DATABASE_URL=${uri}`,
    '',
    '# Supabase auth moved to app_users + the generated auth API (see the report).',
    '# Your Supabase service_role / anon keys are no longer needed by the database.',
  ].join('\n')
}

// The migrate crew for the OAuth/PAT path: source is read over the Supabase
// Management API with a scoped token (no DB password), target is Aiven. Emits the
// SAME SSE step keys as the .env crew, so the cockpit renders it unchanged.
async function migrateFromSupabase(projectRef: string, sessionId: string | undefined, send: (e: any) => void) {
  const tick = 140
  const tok = await tokenFor(sessionId)
  if (!tok) { send({ type: 'error', message: 'Connect Supabase first.' }); return }

  // 1. Analyzer — introspect the project over HTTPS.
  send({ type: 'step', key: 'analyzer', status: 'running' })
  let info
  try { info = await mgmtInspect(tok.token, projectRef) }
  catch (e: any) { send({ type: 'error', message: 'Could not read the project: ' + (e?.message || 'unknown') }); return }
  send({ type: 'log', key: 'analyzer', detail: `${info.tables.length} tables · ${info.totalRows} rows · ${info.policies} RLS policies` })
  const analysis = analysisFromInspect(info)
  let aivenSql = ''
  let notes: string[] = []
  try {
    const supabaseSql = await mgmtDumpSchema(tok.token, projectRef)
    if (llmConfigured()) {
      send({ type: 'log', key: 'analyzer', detail: `${llmModel()} planning the database migration…` })
      try {
        const lp = await withTimeout(llmPlanMigration(supabaseSql), 25000, 'planning')
        if (lp) { aivenSql = lp.aivenSql; notes = [`planned by ${lp.model}`, ...lp.notes] }
      } catch (e: any) { send({ type: 'log', key: 'analyzer', detail: `model unavailable (${e.message}) — using deterministic transformer` }) }
    }
    if (!aivenSql) { const t = transformSupabaseToAiven(supabaseSql); aivenSql = t.sql; notes = t.notes }
  } catch (e: any) { send({ type: 'log', key: 'analyzer', detail: `schema read issue (${e.message})` }) }
  send({ type: 'step', key: 'analyzer', status: 'done', detail: `${info.tables.length} tables${aivenSql ? '' : ' · schema unreadable'}` })
  const plan = makePlan(analysis, 'your app')

  // 2 + 3. Provision Aiven Postgres, migrate schema (self-repairing), copy data.
  send({ type: 'step', key: 'provision', status: 'running' })
  const canDeploy = Boolean(process.env.AIVEN_TOKEN) || liveConfigured()
  let uri = ''
  let target = parseTarget(envUrl())
  let loop: MigrationResult | null = null
  const provisioned: any[] = []
  if (!canDeploy) {
    send({ type: 'step', key: 'provision', status: 'warn', detail: 'set AIVEN_TOKEN to provision' })
  } else {
    send({ type: 'log', key: 'provision', detail: 'provisioning Aiven for PostgreSQL…' })
    let prov: Awaited<ReturnType<typeof provisionAiven>> | undefined
    try { prov = await provisionAiven({ serviceType: 'pg', onLog: (m) => send({ type: 'log', key: 'provision', detail: m }) }) }
    catch (e: any) { send({ type: 'step', key: 'provision', status: 'warn', detail: e.message }) }
    if (prov) {
      uri = prov.uri
      target = { connected: !prov.simulated, host: prov.host, service: prov.serviceName }
      send({ type: 'step', key: 'provision', status: 'done', detail: prov.serviceName })
      const entry: any = { label: 'Supabase → PostgreSQL', type: prov.type, serviceName: prov.serviceName, plan: prov.plan, host: `${prov.host}:${prov.port}`, ok: true }
      if (aivenSql) {
        for (const n of notes) { await delay(tick / 2); send({ type: 'log', key: 'migrate', detail: n }) }
        loop = await migrateWithRepair(prov.uri, aivenSql, (m) => send({ type: 'log', key: 'migrate', detail: m }))
        try {
          send({ type: 'log', key: 'migrate', detail: 'copying row data over the Management API…' })
          const copied = await copyDataFromMgmt(tok.token, projectRef, prov.uri, info.tables.map((t) => t.name), (m) => send({ type: 'log', key: 'migrate', detail: m }))
          loop.counts = copied.counts; loop.totalRows = copied.totalRows
        } catch (e: any) { send({ type: 'log', key: 'migrate', detail: 'data copy issue: ' + e.message }) }
        entry.tables = loop.tables.length; entry.rows = loop.totalRows
        entry.detail = `${loop.tables.length} tables · ${loop.totalRows} rows${loop.repairs.length ? ` · ${loop.repairs.length} self-fixed` : ''}`
      } else entry.detail = 'provisioned (source schema unreadable)'
      provisioned.push(entry)
    }
  }

  // Migrator summary.
  send({ type: 'step', key: 'migrate', status: 'running' })
  if (loop && loop.tables.length) send({ type: 'step', key: 'migrate', status: loop.unresolved.length ? 'warn' : 'done', detail: `${loop.tables.length} tables · ${loop.totalRows} rows` })
  else if (!canDeploy) send({ type: 'step', key: 'migrate', status: 'warn', detail: 'no Aiven target configured' })
  else send({ type: 'step', key: 'migrate', status: 'warn', detail: 'nothing migrated' })

  // 4. Rewriter — hand back the new Aiven connection.
  send({ type: 'step', key: 'rewrite', status: 'running' })
  await delay(tick / 2)
  if (uri) send({ type: 'log', key: 'rewrite', detail: 'pointing DATABASE_URL → Aiven for PostgreSQL' })
  send({ type: 'step', key: 'rewrite', status: 'done', detail: uri ? 'connection repointed' : 'no changes' })
  const rewrittenEnv = buildOAuthEnv(uri)

  // 5. Reporter.
  send({ type: 'step', key: 'report', status: 'running' })
  send({ type: 'log', key: 'report', detail: 'compiling the migration report…' })
  const report = makeReport({ analysis, plan, target: { project: '', service: target.service, host: target.host }, rowCounts: loop?.counts, authVerified: loop?.authVerified, now: new Date().toISOString() })
  await delay(tick)
  for (const m of report.migrated.slice(0, 4)) send({ type: 'log', key: 'report', detail: `${m.status === 'done' ? '✓' : m.status === 'partial' ? '~' : '⊘'} ${m.item}` })
  for (const g of report.gaps.slice(0, 3)) send({ type: 'log', key: 'report', detail: `gap — ${g.feature}` })
  send({ type: 'step', key: 'report', status: report.gaps.length ? 'warn' : 'done', detail: `${report.migrated.length} items · ${report.gaps.length} gaps` })

  send({
    type: 'result',
    services: [supabaseService()],
    provisioned,
    dbKind: 'supabase',
    dbReachable: true,
    needsConnection: false,
    target: { ...target, authVerified: loop?.authVerified ?? null },
    rewrittenEnv,
    report,
    loop: loop ? { rounds: loop.rounds, repairs: loop.repairs, dropped: loop.dropped, unresolved: loop.unresolved, tables: loop.tables } : null,
  })
  send({ type: 'done' })
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    platformAiven: Boolean(process.env.AIVEN_TOKEN) || liveConfigured(),
    aiModel: llmConfigured() ? llmModel() : null,
    supabaseOAuth: oauthConfigured(),
  })
})

// ---- Connect Supabase: OAuth 2.0 (PKCE) + sbp_ PAT fallback -----------------
// The secure front door. A scoped, revocable token replaces pasting the whole
// .env: the source is read over the Management API, the token stays server-side.
app.get('/api/connect/supabase/status', async (req, res) => {
  const tok = await tokenFor(getSessionId(req))
  res.json({ connected: Boolean(tok), method: tok?.method ?? null, oauthConfigured: oauthConfigured() })
})

app.get('/api/connect/supabase/start', (req, res) => {
  if (!oauthConfigured()) return res.redirect('/?connect=error&reason=' + encodeURIComponent('OAuth app not configured — set SUPABASE_OAUTH_CLIENT_ID/SECRET, or use a token.'))
  res.redirect(startAuthorize().url)
})

app.get('/api/connect/supabase/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query as Record<string, string>
  if (error) return res.redirect('/?connect=error&reason=' + encodeURIComponent(error_description || error))
  if (!code || !state) return res.redirect('/?connect=error&reason=missing_code')
  try {
    const tokens = await exchangeCode(code, state)
    const id = newSessionId()
    putSession(id, tokens)
    res.setHeader('Set-Cookie', sessionCookie(id, isSecure(req)))
    res.redirect('/?connect=ok')
  } catch (e: any) {
    res.redirect('/?connect=error&reason=' + encodeURIComponent(e?.message || 'exchange_failed'))
  }
})

app.post('/api/connect/supabase/pat', async (req, res) => {
  const token = String(req.body?.token || '').trim()
  if (!token) return res.status(400).json({ error: 'Paste a Supabase access token (starts with sbp_).' })
  try {
    const projects = await listProjects(token) // validates the token
    const id = newSessionId()
    putSession(id, { accessToken: token, expiresAt: Date.now() + 365 * 24 * 3600 * 1000, method: 'pat' })
    res.setHeader('Set-Cookie', sessionCookie(id, isSecure(req)))
    res.json({ ok: true, method: 'pat', projects })
  } catch {
    res.status(401).json({ error: 'That token was rejected by Supabase. Create one at supabase.com/dashboard/account/tokens.' })
  }
})

app.get('/api/connect/supabase/projects', async (req, res) => {
  const tok = await tokenFor(getSessionId(req))
  if (!tok) return res.status(401).json({ error: 'Not connected.' })
  try {
    res.json({ projects: await listProjects(tok.token) })
  } catch (e: any) {
    res.status(502).json({ error: e?.message || 'Could not list projects.' })
  }
})

app.post('/api/connect/supabase/disconnect', (req, res) => {
  dropSession(getSessionId(req))
  res.setHeader('Set-Cookie', clearCookie(isSecure(req)))
  res.json({ ok: true })
})

// Analyze stage — Opus classifies the .env and (if a DB connection is present)
// introspects it, so the user sees what's going to Aiven BEFORE deploying. No deploy.
app.post('/api/analyze', async (req, res) => {
  try {
    // OAuth/PAT path: introspect the project over the Management API (no .env, no
    // DB password). Returns the same shape the .env path does, so Review is shared.
    const projectRef = (req.body?.projectRef as string) || ''
    if (projectRef) {
      const tok = await tokenFor(getSessionId(req))
      if (!tok) return res.status(401).json({ error: 'Connect Supabase first.' })
      let info
      try { info = await mgmtInspect(tok.token, projectRef) }
      catch (e: any) { return res.status(502).json({ error: 'Could not read the project: ' + (e?.message || 'unknown') }) }
      return res.json({
        services: [supabaseService()],
        migratable: 1,
        dbPresent: true,
        dbReachable: true,
        tables: info.tables,
        totalRows: info.totalRows,
        policies: info.policies,
        savings: estimateSavings(info.sizeBytes),
        needsConnection: false,
        byLLM: false,
        model: llmConfigured() ? llmModel() : null,
        platformAiven: Boolean(process.env.AIVEN_TOKEN) || liveConfigured(),
        target: parseTarget(envUrl()),
        connectedVia: tok.method,
      })
    }

    const envText = (req.body?.envText as string) || ''
    if (!envText.trim()) return res.status(400).json({ error: 'Paste your .env to analyze.' })
    const ea = await analyzeEnvSmart(envText)
    let dbReachable = false
    let tables: { name: string; rows: number }[] = []
    let sizeBytes = 0
    let policies = 0
    let savings: ReturnType<typeof estimateSavings> | null = null
    if (ea.dbUrl) {
      try {
        const info = await inspect(ea.dbUrl)
        dbReachable = true
        tables = info.tables
        sizeBytes = info.sizeBytes
        policies = info.policies
        savings = estimateSavings(sizeBytes)
      } catch {
        /* unreachable — review only */
      }
    }
    res.json({
      services: ea.services,
      migratable: ea.migratable.length,
      dbPresent: Boolean(ea.dbUrl),
      dbReachable,
      tables,
      totalRows: tables.reduce((a, t) => a + t.rows, 0),
      policies,
      savings,
      needsConnection: ea.needsConnection,
      byLLM: ea.byLLM,
      model: llmConfigured() ? llmModel() : null,
      platformAiven: Boolean(process.env.AIVEN_TOKEN) || liveConfigured(),
      target: parseTarget(envUrl()),
    })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Analysis failed.' })
  }
})

// The crew, streamed as SSE. Input: the app's .env (pasted). The agent inventories
// every service, migrates the databases onto the platform's Aiven, and rewrites
// the .env. Analyzer -> Provisioner -> Migrator -> .env Rewriter -> Reporter.
app.post('/api/migrate', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  ;(res as any).flushHeaders?.()
  const send = (e: any) => res.write(`data: ${JSON.stringify(e)}\n\n`)

  const envText = (req.body?.envText as string) || ''
  const projectRef = (req.body?.projectRef as string) || ''
  const tick = 140

  try {
    // OAuth/PAT path: read the source over the Management API, deploy to Aiven.
    if (projectRef) {
      await migrateFromSupabase(projectRef, getSessionId(req), send)
      return res.end()
    }
    if (!envText.trim()) {
      send({ type: 'error', message: 'Paste your .env to begin.' })
      return res.end()
    }

    // 1. Analyzer — Opus inventories every service in the .env (regex fallback).
    send({ type: 'step', key: 'analyzer', status: 'running' })
    if (llmConfigured()) send({ type: 'log', key: 'analyzer', detail: `${llmModel()} reading your .env…` })
    const ea = await analyzeEnvSmart(envText)
    for (const s of ea.services) {
      await delay(tick / 2)
      send({ type: 'log', key: 'analyzer', detail: `${s.migratable ? '→ ' + s.aiven : 'keep'}: ${s.label}` })
    }

    // Introspect the database to migrate (if the .env has a Postgres URL). This is
    // still the Analyzer's work, so keep its spinner live until the plan is ready —
    // otherwise the step reads "done" while the model plans and nothing appears to run.
    let analysis: Analysis = stubAnalysis()
    let aivenSql = ''
    let notes: string[] = []
    let dbReachable = false
    if (ea.dbUrl) {
      try {
        analysis = analysisFromInspect(await inspect(ea.dbUrl))
        const supabaseSql = await dumpSchema(ea.dbUrl)
        dbReachable = true
        if (llmConfigured()) {
          send({ type: 'log', key: 'analyzer', detail: `${llmModel()} planning the database migration…` })
          try {
            const lp = await withTimeout(llmPlanMigration(supabaseSql), 25000, 'planning')
            if (lp) { aivenSql = lp.aivenSql; notes = [`planned by ${lp.model}`, ...lp.notes] }
          } catch (e: any) {
            send({ type: 'log', key: 'analyzer', detail: `model unavailable (${e.message}) — using deterministic transformer` })
          }
        }
        if (!aivenSql) { const t = transformSupabaseToAiven(supabaseSql); aivenSql = t.sql; notes = t.notes }
      } catch (e: any) {
        send({ type: 'log', key: 'analyzer', detail: `couldn't reach the database — preview only (${e.message})` })
      }
    }
    send({ type: 'step', key: 'analyzer', status: 'done', detail: `${ea.migratable.length} migratable · ${ea.services.length} services${ea.byLLM ? ' · by ' + llmModel() : ''}` })
    const plan = makePlan(analysis, 'your app')

    // 2 + 3. Provisioner + Migrator — for EVERY migratable service: provision a
    // dedicated Aiven service, migrate its data by type, and collect the repoints.
    const targets = resolveMigratables(envText, ea.services)
    send({ type: 'step', key: 'provision', status: 'running' })
    let uri = ''
    let target = parseTarget(envUrl())
    let loop: MigrationResult | null = null
    const provisioned: any[] = []
    const repoints: Record<string, string> = {}
    const canDeploy = Boolean(process.env.AIVEN_TOKEN) || liveConfigured()

    if (!canDeploy) {
      send({ type: 'step', key: 'provision', status: 'warn', detail: 'set AIVEN_TOKEN to provision' })
    } else {
      if (targets.length) send({ type: 'log', key: 'provision', detail: `${targets.length} service${targets.length === 1 ? '' : 's'} to stand up on Aiven` })
      for (const t of targets) {
        if (!AIVEN_TYPES[t.aivenKey]) { send({ type: 'log', key: 'provision', detail: `no Aiven equivalent for ${t.label}` }); continue }
        const isPg = t.aivenKey === 'pg' || t.aivenKey === 'supabase'
        send({ type: 'log', key: 'provision', detail: `provisioning ${AIVEN_TYPES[t.aivenKey].label} for ${t.label}…` })
        let prov
        try {
          prov = await provisionAiven({ serviceType: t.aivenKey, onLog: (m) => send({ type: 'log', key: 'provision', detail: m }) })
        } catch (e: any) {
          send({ type: 'log', key: 'provision', detail: `${t.label} failed: ${e.message}` })
          provisioned.push({ label: t.label, type: t.aivenKey, ok: false, detail: e.message })
          continue
        }
        repoints[isPg ? 'pg' : t.aivenKey] = prov.uri
        const entry: any = { label: t.label, type: prov.type, serviceName: prov.serviceName, plan: prov.plan, host: `${prov.host}:${prov.port}`, ok: true }

        // Migrate by type.
        if (isPg) {
          uri = prov.uri
          target = { connected: !prov.simulated, host: prov.host, service: prov.serviceName }
          if (aivenSql) {
            for (const n of notes) { await delay(tick / 2); send({ type: 'log', key: 'migrate', detail: n }) }
            loop = await migrateWithRepair(prov.uri, aivenSql, (m) => send({ type: 'log', key: 'migrate', detail: m }))
            if (ea.dbUrl) {
              try {
                send({ type: 'log', key: 'migrate', detail: 'copying row data…' })
                const copied = await copyData(ea.dbUrl, prov.uri, (m) => send({ type: 'log', key: 'migrate', detail: m }))
                loop.counts = copied.counts; loop.totalRows = copied.totalRows
              } catch (e: any) { send({ type: 'log', key: 'migrate', detail: 'data copy issue: ' + e.message }) }
            }
            entry.tables = loop.tables.length; entry.rows = loop.totalRows
            entry.detail = `${loop.tables.length} tables · ${loop.totalRows} rows${loop.repairs.length ? ` · ${loop.repairs.length} self-fixed` : ''}`
          } else entry.detail = ea.needsConnection ? 'provisioned · add DATABASE_URL to migrate the schema' : 'provisioned (source schema unreachable)'
        } else if (t.aivenKey === 'mysql' && t.conn) {
          const r = await migrateMysql(t.conn, prov.uri, (m) => send({ type: 'log', key: 'migrate', detail: m }))
          entry.ok = r.ok; entry.detail = r.detail
        } else if (t.aivenKey === 'redis' && t.conn) {
          const r = await probeRedis(t.conn, (m) => send({ type: 'log', key: 'migrate', detail: m }))
          entry.detail = r.ok ? r.detail : 'provisioned + repointed'
          entry.rows = r.rows
        } else {
          entry.detail = 'provisioned + repointed · bulk data sync staged'
        }
        send({ type: 'log', key: 'migrate', detail: `${t.label} → ${prov.serviceName}: ${entry.detail}` })
        provisioned.push(entry)
      }
      const live = provisioned.filter((p) => p.ok)
      send({ type: 'step', key: 'provision', status: live.length ? 'done' : 'warn', detail: live.length ? live.map((p) => p.serviceName).join(' · ') : 'nothing provisioned' })
    }

    // Migrator step summary.
    send({ type: 'step', key: 'migrate', status: 'running' })
    if (provisioned.some((p) => p.ok)) {
      const summary = provisioned.filter((p) => p.ok).map((p) => `${p.label.split(/[ /]/)[0]}${p.rows != null ? ` ${p.rows}r` : ''}`).join(' · ')
      send({ type: 'step', key: 'migrate', status: loop && loop.unresolved.length ? 'warn' : 'done', detail: summary })
    } else if (ea.needsConnection) {
      send({ type: 'step', key: 'migrate', status: 'warn', detail: 'add your DATABASE_URL (postgres://…) to migrate' })
    } else if (!canDeploy) {
      send({ type: 'step', key: 'migrate', status: 'warn', detail: 'no Aiven target configured' })
    } else if (targets.length) {
      // Had something to migrate, but every provision failed (e.g. free quota in use).
      send({ type: 'step', key: 'migrate', status: 'warn', detail: 'skipped — no Aiven service was provisioned' })
    } else {
      send({ type: 'step', key: 'migrate', status: 'done', detail: 'no migratable services in .env' })
    }

    // 4. .env Rewriter — repoint every migrated service at its new Aiven service.
    send({ type: 'step', key: 'rewrite', status: 'running' })
    const repointTypes = Object.keys(repoints)
    for (const k of repointTypes) {
      await delay(tick / 3)
      send({ type: 'log', key: 'rewrite', detail: `repointing ${k.toUpperCase()} connection → ${AIVEN_TYPES[k]?.label || 'Aiven'}` })
    }
    const rewrittenEnv = rewriteEnv(envText, repoints)
    const changedKeys = rewrittenEnv.split('\n').filter((l) => l.startsWith('# was: ')).map((l) => l.slice(7).split('=')[0].trim())
    const removed = rewrittenEnv.split('\n').filter((l) => l.includes('removed — migrated to Aiven')).length
    await delay(tick / 2)
    if (changedKeys.length) send({ type: 'log', key: 'rewrite', detail: `rewrote ${changedKeys.join(', ')}` })
    if (removed) send({ type: 'log', key: 'rewrite', detail: `removed ${removed} Supabase key${removed === 1 ? '' : 's'} — auth now runs through app_users` })
    if (!changedKeys.length && !removed) send({ type: 'log', key: 'rewrite', detail: 'no live targets — .env left unchanged' })
    send({ type: 'step', key: 'rewrite', status: 'done', detail: changedKeys.length ? `${changedKeys.length} connection${changedKeys.length === 1 ? '' : 's'} repointed` : 'no changes' })

    // 5. Reporter
    send({ type: 'step', key: 'report', status: 'running' })
    send({ type: 'log', key: 'report', detail: 'compiling the migration report…' })
    const report = makeReport({
      analysis, plan,
      target: { project: '', service: target.service, host: target.host },
      rowCounts: loop?.counts,
      authVerified: loop?.authVerified,
      now: new Date().toISOString(),
    })
    await delay(tick)
    for (const m of report.migrated.slice(0, 4)) send({ type: 'log', key: 'report', detail: `${m.status === 'done' ? '✓' : m.status === 'partial' ? '~' : '⊘'} ${m.item}` })
    for (const g of report.gaps.slice(0, 3)) send({ type: 'log', key: 'report', detail: `gap — ${g.feature}` })
    send({ type: 'log', key: 'report', detail: `${report.migrated.length} items · ${report.gaps.length} gap${report.gaps.length === 1 ? '' : 's'} · ${report.recommendations.length} recommendation${report.recommendations.length === 1 ? '' : 's'}` })
    send({ type: 'step', key: 'report', status: report.gaps.length ? 'warn' : 'done', detail: `${report.migrated.length} items · ${report.gaps.length} gaps` })

    send({
      type: 'result',
      services: ea.services,
      provisioned,
      dbKind: ea.dbKind,
      dbReachable,
      needsConnection: ea.needsConnection,
      target: { ...target, authVerified: loop?.authVerified ?? null },
      rewrittenEnv,
      report,
      loop: loop ? { rounds: loop.rounds, repairs: loop.repairs, dropped: loop.dropped, unresolved: loop.unresolved, tables: loop.tables } : null,
    })
    send({ type: 'done' })
  } catch (e: any) {
    send({ type: 'error', message: e?.message || 'Migration failed.' })
  } finally {
    res.end()
  }
})

// App deploy, streamed as SSE. Input: a GitHub repo URL. Clones the Lovable app,
// migrates it onto Aiven (schema -> Aiven Postgres, client -> thin Aiven API, +
// single-container Dockerfile), pushes the migrated app to a fresh public repo,
// and deploys that to Render (AWS-backed) with DATABASE_URL pointing at Aiven.
// Data on Aiven, compute on AWS — the whole stack from one field.
app.post('/api/deploy-app', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  ;(res as any).flushHeaders?.()
  const send = (e: any) => res.write(`data: ${JSON.stringify(e)}\n\n`)

  const repoUrl = ((req.body?.repoUrl as string) || '').trim()
  const branch = ((req.body?.branch as string) || 'main').trim() || 'main'
  try {
    if (!/^https?:\/\/.+\/.+/.test(repoUrl)) {
      send({ type: 'error', message: 'Paste a GitHub repo URL (https://github.com/you/app).' })
      return res.end()
    }
    const canDeploy = Boolean(process.env.RENDER_API_KEY)
    send({ type: 'step', key: 'deploy', status: 'running', detail: canDeploy ? 'migrate + deploy' : 'dry run — set RENDER_API_KEY to go live' })
    const result = await deployApp({ repoUrl, branch, onLog: (m) => send({ type: 'log', key: 'deploy', detail: m }) })
    send({ type: 'step', key: 'deploy', status: result.liveUrl ? 'done' : 'warn', detail: result.liveUrl || 'migrated (dry run)' })
    send({ type: 'result', ...result })
    send({ type: 'done' })
  } catch (e: any) {
    send({ type: 'error', message: e?.message || 'Deploy failed.' })
  } finally {
    res.end()
  }
})

// Use API_PORT, not PORT: preview/host tooling commandeers PORT for the web server.
const port = Number(process.env.API_PORT) || 8787
app.listen(port, () => {
  console.log(`[switchboard] api on :${port} · platformAiven=${Boolean(process.env.AIVEN_TOKEN) || liveConfigured()}`)
})
