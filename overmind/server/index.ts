import './env.ts'
import { readFileSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import type { SwarmEvent } from '../shared/types.ts'
import { runMigration } from './orchestrator.ts'
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
  let source = SOURCE_REPO_DIR
  try {
    const body = await c.req.json()
    if (body?.source && typeof body.source === 'string') source = body.source
  } catch {
    /* empty/invalid body → default source */
  }

  const actor = c.get('actor')
  const who = actor.agent ? `agent:${actor.agent.clientId}` : `human:${actor.human?.email}`
  broadcast({ type: 'log', level: 'info', msg: `run started by ${who}` })

  // Kick off async; respond immediately. Events flow over /api/stream.
  void runMigration(source, broadcast).catch((e) => {
    broadcast({ type: 'error', msg: `run failed: ${(e as Error)?.message ?? e}` })
  })

  return c.json({ ok: true, source, started: true, actor: who })
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

authBanner()
serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`⚡ Aiven Overmind — control plane on http://0.0.0.0:${info.port}`)
  console.log(`   GET  /api/health   GET /api/stream (SSE)   POST /api/run {source?}`)
  console.log(`   auth: GET /api/auth/login|callback|me|logout   POST /api/agents/register`)
  console.log(`   cto:  GET /api/tenant/:id   POST /api/cto/chat (SSE)`)
})
