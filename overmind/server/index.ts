import './env.ts'
import { readFileSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import type { SwarmEvent, RunMode } from '../shared/types.ts'
import { runMigration } from './orchestrator.ts'
import { startMonitor, stopMonitor, getCtoState } from './monitor.ts'
import { closeAll } from '../aiven/pg.ts'
import { PORT, SOURCE_REPO_DIR } from './env.ts'
import {
  authBanner,
  handleLogin,
  handleCallback,
  handleMe,
  handleLogout,
  handleAgentRegister,
  requireHumanOrAgent,
  type Actor,
} from './workos.ts'
import { ctoChat, getPgMetrics } from './cto-chat.ts'
import { ensureDemoTenant, getTenant } from './tenants.ts'
import { speak, VoiceUnavailableError, VoiceUpstreamError } from './voice.ts'
import { generateBriefing } from './briefing.ts'

// ── Fan-out hub ──────────────────────────────────────────────────────────────────
// Every connected control-room holds one emitter in this set. A run broadcasts each
// SwarmEvent to all of them, so multiple browsers watch the same migration live.
type Client = (e: SwarmEvent) => void
const clients = new Set<Client>()

function broadcast(e: SwarmEvent): void {
  for (const c of clients) {
    try {
      c(e)
    } catch {
      /* a dead client is reaped on its own abort */
    }
  }
}

// `c.get('actor')` is typed for the protected /api/run handler.
const app = new Hono<{ Variables: { actor: Actor } }>()

// ── CORS ─────────────────────────────────────────────────────────────────────────────
// Let the GitHub Pages site + a cloudflared tunnel call this API from another origin. We reflect
// the request origin (not '*') because credentials:true forbids the wildcard. Must precede routes.
app.use(
  '/api/*',
  cors({
    origin: (o) => o ?? '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// ── Auth: humans (WorkOS AuthKit) + agents (M2M self-registration) ───────────────────
// Open by design: login/callback/me/logout + the agentic self-registration endpoint. With no
// WORKOS_API_KEY these run in MOCK mode (see server/workos.ts) so the demo is self-contained.
app.get('/api/auth/login', (c) => handleLogin(c))
app.get('/api/auth/callback', (c) => handleCallback(c))
app.get('/api/auth/me', (c) => handleMe(c))
app.get('/api/auth/logout', (c) => handleLogout(c))

// THE headline: an agent registers itself and receives scoped credentials + a short-lived token.
app.post('/api/agents/register', (c) => handleAgentRegister(c))

// ── Health ─────────────────────────────────────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({
    ok: true,
    service: 'aiven-overmind',
    clients: clients.size,
    aiven: !!process.env.AIVEN_TOKEN,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    workos: !!process.env.WORKOS_API_KEY,
    authMode: process.env.WORKOS_API_KEY ? 'workos' : 'mock',
  }),
)

// ── SSE stream of SwarmEvents ───────────────────────────────────────────────────────
// `event: pulse` carries one JSON SwarmEvent; `event: ping` is a heartbeat. The UI is a
// pure function of this stream.
app.get('/api/stream', (c) =>
  streamSSE(c, async (stream) => {
    await stream.writeSSE({ event: 'hello', data: JSON.stringify({ ok: true }) })

    const emit: Client = (e) => {
      stream.writeSSE({ event: 'pulse', data: JSON.stringify(e) }).catch(() => {})
    }
    clients.add(emit)

    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: 'ping', data: '1' }).catch(() => {})
    }, 25000)

    stream.onAbort(() => {
      clients.delete(emit)
      clearInterval(heartbeat)
    })

    while (!stream.aborted) {
      await stream.sleep(60000)
    }
  }),
)

// ── Start a migration → broadcast to every stream client ────────────────────────────
// Protected: callable by EITHER a logged-in human OR a valid agent bearer token. This is what an
// agent does right after it self-registers — proving end-to-end agentic onboarding → action.
app.post('/api/run', requireHumanOrAgent, async (c) => {
  // Reject oversized payloads up front (Content-Length) so a runaway body can't exhaust memory.
  // CSV imports can be large — we accept up to ~16MB of JSON.
  const MAX_BODY_BYTES = 16 * 1024 * 1024
  const declaredLen = Number(c.req.header('content-length') ?? 0)
  if (Number.isFinite(declaredLen) && declaredLen > MAX_BODY_BYTES) {
    return c.json({ ok: false, error: 'request body too large (max ~16MB)' }, 413)
  }

  let bodySource: string | undefined
  let bodyMode: RunMode | undefined
  let sourceConnString: string | undefined
  let csvSources: { tableName: string; csvText: string }[] | undefined
  try {
    const body = await c.req.json()
    if (body?.source && typeof body.source === 'string') bodySource = body.source.trim()
    if (body?.mode === 'demo' || body?.mode === 'analyze') bodyMode = body.mode

    // Optional user-provided SOURCE Postgres connection string (own-Supabase → DB→DB copy). SECRET.
    if (typeof body?.sourceConnString === 'string' && body.sourceConnString.trim()) {
      sourceConnString = body.sourceConnString.trim()
    }

    // Optional CSV exports (Lovable → CSV import). Validate shapes defensively; the importer enforces
    // the hard caps (<=8 files, <=2MB each, safe table names) — here we just coerce to a clean array.
    if (Array.isArray(body?.csvSources)) {
      const cleaned = body.csvSources
        .filter((s: any) => s && typeof s.tableName === 'string' && typeof s.csvText === 'string')
        .map((s: any) => ({ tableName: s.tableName.trim(), csvText: s.csvText }))
      if (cleaned.length) csvSources = cleaned
    }
  } catch {
    /* empty/invalid body → defaults below */
  }

  // Mode resolution: explicit `mode` wins; else an https URL source ⇒ 'analyze'; else 'demo'.
  const isUrl = !!bodySource && /^https?:\/\//i.test(bodySource)
  const mode: RunMode = bodyMode ?? (isUrl ? 'analyze' : 'demo')
  // Demo mode keeps using SOURCE_REPO_DIR when no source is given (unchanged behavior).
  const source = bodySource || SOURCE_REPO_DIR

  const actor = c.get('actor')
  const who = actor.agent ? `agent:${actor.agent.clientId}` : `human:${actor.human?.email}`
  // NEVER log sourceConnString (secret) or csvText (data) — only their presence/shape.
  const srcKind = csvSources ? `csv:${csvSources.length}` : sourceConnString ? 'source-db' : 'seeded'
  broadcast({ type: 'log', level: 'info', msg: `run started by ${who} (mode=${mode}, data=${srcKind})` })

  // Kick off async; respond immediately. Events flow over /api/stream.
  void runMigration(source, broadcast, { mode, sourceConnString, csvSources }).catch((e) => {
    broadcast({ type: 'error', msg: `run failed: ${(e as Error)?.message ?? e}` })
  })

  // Response never echoes secrets/data — only the resolved shape.
  return c.json({ ok: true, source, mode, dataSource: srcKind, started: true, actor: who })
})

// ── Tenant infra snapshot (the CTO console's live left rail) ─────────────────────────
app.get('/api/tenant/:id', async (c) => {
  const id = c.req.param('id')
  const tenant = await getTenant(id).catch(() => null)
  const m: any = await getPgMetrics(id).catch(() => null)
  // Shape into the fields the CTO console's left rail reads (rows/status/plan), keeping the raw extras.
  let pg: any = null
  if (m) {
    const rows = Array.isArray(m.tables)
      ? m.tables.reduce((s: number, t: any) => s + (Number(t.rows) || 0), 0)
      : undefined
    pg = {
      status: 'running',
      rows,
      plan: 'startup-4',
      cacheHitRatioPct: m.cacheHitRatioPct,
      connections: m.connections,
      maxConnections: m.maxConnections,
      dbSizePretty: m.dbSizePretty,
    }
  }
  return c.json({ tenant, pg })
})

// ── Always-on CTO monitor snapshot (latest in-memory state + rolling alert feed) ─────
// Always 200 with a valid (possibly degraded) CtoState — getCtoState never throws.
app.get('/api/cto/state', async (c) => c.json(await getCtoState(c.req.query('tenant') ?? 'demo')))

// ── Talk to your Aiven CTO — a real agent reply, streamed over SSE ───────────────────
// The founder never opens the Aiven dashboard; they ask their CTO agent, which reads their
// live infra (overmind-pg / metrics) and answers. Advisory-first (proposes; never mutates).
app.post('/api/cto/chat', async (c) => {
  let body: any = {}
  try {
    body = await c.req.json()
  } catch {
    /* empty body */
  }
  const tenantId = String(body?.tenant ?? 'demo')
  const message = String(body?.message ?? '').slice(0, 4000)
  const history = Array.isArray(body?.history) ? body.history : []

  return streamSSE(c, async (stream) => {
    await ctoChat({ tenantId, message, history }, (chunk) => {
      stream.writeSSE({ data: JSON.stringify(chunk) }).catch(() => {})
    }).catch((e) => {
      stream
        .writeSSE({ data: JSON.stringify({ type: 'error', value: String((e as Error)?.message ?? e) }) })
        .catch(() => {})
    })
  })
})

// ── Voice CTO: speak a script (ElevenLabs TTS, server-side) ──────────────────────────
// The browser POSTs text and gets back audio/mpeg bytes. The ELEVENLABS_API_KEY lives only on the
// server (voice.ts) and is sent only to ElevenLabs — it never reaches the client. Degrades to 503
// JSON (no key) / 502 JSON (upstream failure) instead of crashing.
app.post('/api/cto/speak', async (c) => {
  let body: any = {}
  try {
    body = await c.req.json()
  } catch {
    /* empty/invalid body */
  }
  const text = String(body?.text ?? '').trim()
  const voice = body?.voice ? String(body.voice) : undefined
  if (!text) return c.json({ error: 'missing "text" to speak' }, 400)

  try {
    const audio = await speak(text, voice)
    // Return a standard Response with the audio bytes. We slice into a fresh ArrayBuffer sized
    // exactly to the audio so no extra pool memory leaks into the body.
    const ab = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength)
    return new Response(ab as ArrayBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    if (e instanceof VoiceUnavailableError) return c.json({ error: e.message, code: e.code }, 503)
    if (e instanceof VoiceUpstreamError)
      return c.json({ error: e.message, code: e.code }, e.status >= 500 ? 502 : 502)
    return c.json({ error: `voice failed: ${(e as Error)?.message ?? e}` }, 500)
  }
})

// ── Voice CTO: weekly spoken briefing script (grounded in REAL Aiven data) ────────────
// Returns { script, ts, stats }. The frontend turns `script` into audio via /api/cto/speak.
// Always 200 with a real, grounded script — generateBriefing degrades to a deterministic template
// (same real numbers) if the model is unavailable, and never fabricates metrics.
app.get('/api/cto/briefing', async (c) => {
  try {
    const briefing = await generateBriefing(c.req.query('tenant') ?? 'demo')
    return c.json(briefing)
  } catch (e) {
    return c.json({ error: `briefing failed: ${(e as Error)?.message ?? e}` }, 500)
  }
})

// ── Serve the built control-room in production ──────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist' }))
  app.notFound((c) => {
    try {
      return c.html(readFileSync('./dist/index.html', 'utf8'))
    } catch {
      return c.text('control-room not built — run `npm run build`', 500)
    }
  })
}

// Ensure the demo tenant exists (maps to the live overmind-pg / overmind-kafka).
ensureDemoTenant().catch((e) => console.warn('[tenant] ensureDemoTenant skipped:', (e as Error)?.message ?? e))

// Start the always-on CTO monitor. Idempotent; ticks immediately then on the interval. New alerts
// flow over /api/stream via broadcast. Read-only / advisory — it never mutates infra.
startMonitor(broadcast)

authBanner()
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`⚡ Overmind — control plane on http://0.0.0.0:${info.port}`)
  console.log(`   GET  /api/health   GET /api/stream (SSE)   POST /api/run {source?}`)
  console.log(`   auth: GET /api/auth/login|callback|me|logout   POST /api/agents/register`)
  console.log(`   cto:  GET /api/tenant/:id   GET /api/cto/state   POST /api/cto/chat (SSE)`)
  console.log(`   voice: POST /api/cto/speak (audio/mpeg)   GET /api/cto/briefing`)
})

// Graceful shutdown: stop the monitor tick and drain the pg pools so restarts don't drop sockets.
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.once(sig, () => {
    stopMonitor()
    closeAll().finally(() => process.exit(0))
  })
}
