// server/workos.ts — Overmind's auth plane: humans AND agents.
//
// Two actors, one file:
//   • Humans  → WorkOS AuthKit (hosted login) → sealed session cookie.
//   • Agents  → M2M identities that *self-register* (POST /api/agents/register) and present
//               short-lived bearer JWTs we verify offline.
//
// Degrades cleanly: if WORKOS_API_KEY is absent we run MOCK MODE — same routes, same shapes,
// but we mint/verify our own HMAC-signed JWTs so the whole agentic-signup demo runs end-to-end
// with zero external account. Every entry point logs which mode it's in.
//
// Design notes for the reader (the "why"):
//   - Agent tokens are JWTs, not opaque keys, so the protected API can verify them *offline*
//     (signature + exp + scopes) without a round-trip per request. In WorkOS mode that's a JWKS
//     signature check; in mock mode it's an HMAC check. Same verb (`requireAgent`), two backends.
//   - Self-registration mirrors WorkOS's "auth.md" idea: an agent shows up with no human in the
//     loop, asks for an identity, and walks away with scoped credentials + a token it can use now.

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { SignJWT, jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose'
import type { Context, MiddlewareHandler } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

// ─────────────────────────── Config / mode detection ───────────────────────────

const WORKOS_API_KEY = process.env.WORKOS_API_KEY
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID
const WORKOS_REDIRECT_URI =
  process.env.WORKOS_REDIRECT_URI || `http://localhost:${process.env.PORT || 8788}/api/auth/callback`
const WORKOS_COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me'

/** WorkOS is "configured" only when we have an API key. Everything else has a mock fallback. */
export const WORKOS_ENABLED = !!WORKOS_API_KEY

/** Issuer/audience baked into mock tokens so they're self-describing and non-portable. */
const MOCK_ISS = 'overmind-mock-auth'
const MOCK_AUD = 'overmind-api'
const AGENT_TOKEN_TTL_SECONDS = 60 * 60 // 1h — short-lived, like WorkOS M2M access tokens
const SESSION_COOKIE = 'overmind_session'
const AGENT_HMAC_KEY = new TextEncoder().encode(AUTH_SECRET)

// Default scopes granted to a self-registering agent. Narrow on purpose: an agent should never
// hold more than it needs (least privilege), and these are exactly what POST /api/run requires.
const DEFAULT_AGENT_SCOPES = ['migration:run', 'migration:read']

let bannerPrinted = false
export function authBanner(): void {
  if (bannerPrinted) return
  bannerPrinted = true
  if (WORKOS_ENABLED) {
    console.log('🔐 auth: WorkOS mode — AuthKit (humans) + M2M (agents) via WorkOS.')
  } else {
    console.log(
      '🔐 auth: MOCK mode — no WORKOS_API_KEY. Humans get a dev session, agents self-register' +
        ' for locally-signed scoped JWTs. Set WORKOS_* to go live.',
    )
  }
}

// ─────────────────────────── Identities ───────────────────────────

export interface HumanIdentity {
  kind: 'human'
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export interface AgentIdentity {
  kind: 'agent'
  /** the M2M client / agent id (sub claim) */
  sub: string
  clientId: string
  /** tenant/org the agent acts for (WorkOS `org_id`) */
  orgId?: string
  scopes: string[]
}

// ─────────────────────────── Lazy WorkOS SDK ───────────────────────────
// Imported dynamically so MOCK mode never needs the package resolved at boot.

let _workos: import('@workos-inc/node').WorkOS | null = null
async function workos(): Promise<import('@workos-inc/node').WorkOS> {
  if (_workos) return _workos
  const { WorkOS } = await import('@workos-inc/node')
  _workos = new WorkOS(WORKOS_API_KEY!, { clientId: WORKOS_CLIENT_ID })
  return _workos
}

// ─────────────────────────── JWKS (agent verify, WorkOS mode) ───────────────────────────
// One cached remote JWKS set; `jose` handles fetch + rotation. We verify agent JWTs against this
// offline (no WorkOS round-trip per request).

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null
function agentJwks() {
  if (_jwks) return _jwks
  const url =
    process.env.WORKOS_JWKS_URL ||
    (WORKOS_CLIENT_ID
      ? `https://api.workos.com/sso/jwks/${WORKOS_CLIENT_ID}`
      : undefined)
  if (!url) throw new Error('no JWKS url: set WORKOS_JWKS_URL or WORKOS_CLIENT_ID')
  _jwks = createRemoteJWKSet(new URL(url))
  return _jwks
}

// ═══════════════════════════ HUMAN AUTH (AuthKit) ═══════════════════════════

/** GET /api/auth/login — send the human to WorkOS AuthKit (or a dev shortcut in mock mode). */
export async function handleLogin(c: Context): Promise<Response> {
  if (!WORKOS_ENABLED) {
    // MOCK: no hosted login to bounce to. Drop a dev session cookie and return to the app.
    const email = c.req.query('email') || 'founder@overmind.dev'
    const human: HumanIdentity = { kind: 'human', id: `mock_${handleFromEmail(email)}`, email }
    await setSessionCookie(c, human)
    console.log(`🔐 [mock] human login → ${email}`)
    const to = c.req.query('return') || '/'
    return c.redirect(to)
  }
  const wos = await workos()
  const authorizationUrl = wos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    clientId: WORKOS_CLIENT_ID!,
    redirectUri: WORKOS_REDIRECT_URI,
  })
  return c.redirect(authorizationUrl)
}

/** GET /api/auth/callback — exchange the AuthKit code for a user + sealed session, set cookie. */
export async function handleCallback(c: Context): Promise<Response> {
  if (!WORKOS_ENABLED) {
    // Shouldn't normally be hit in mock mode, but keep it harmless.
    return c.redirect('/')
  }
  const code = c.req.query('code')
  if (!code) return c.json({ error: 'missing code' }, 400)
  try {
    const wos = await workos()
    const auth = await wos.userManagement.authenticateWithCode({
      clientId: WORKOS_CLIENT_ID!,
      code,
      // A cookie password seals the WorkOS-managed session; we still set our own app cookie below.
      session: WORKOS_COOKIE_PASSWORD
        ? { sealSession: true, cookiePassword: WORKOS_COOKIE_PASSWORD }
        : undefined,
    })
    const u = auth.user
    const human: HumanIdentity = {
      kind: 'human',
      id: u.id,
      email: u.email,
      firstName: u.firstName ?? undefined,
      lastName: u.lastName ?? undefined,
    }
    // If WorkOS sealed a session, store it; otherwise fall back to our own signed app session.
    if (auth.sealedSession) {
      setCookie(c, SESSION_COOKIE, auth.sealedSession, sessionCookieOpts())
    } else {
      await setSessionCookie(c, human)
    }
    console.log(`🔐 [workos] human login → ${u.email}`)
    return c.redirect('/')
  } catch (e) {
    console.error('🔐 [workos] callback failed:', (e as Error)?.message)
    return c.json({ error: 'authentication failed' }, 401)
  }
}

/** GET /api/auth/me — current human (from cookie) or null. Also surfaces an agent if a bearer is present. */
export async function handleMe(c: Context): Promise<Response> {
  const agent = await readAgentFromRequest(c)
  if (agent) return c.json({ actor: agent })
  const human = await readHumanFromCookie(c)
  return c.json({ actor: human, mode: WORKOS_ENABLED ? 'workos' : 'mock' })
}

/** GET /api/auth/logout — clear the session cookie. */
export function handleLogout(c: Context): Response {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.redirect('/')
}

// ── Session cookie helpers (our own app session; coexists with a WorkOS sealed session) ──

function sessionCookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'Lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  }
}

async function setSessionCookie(c: Context, human: HumanIdentity): Promise<void> {
  // App-level session = a short signed JWT carrying the human identity. In WorkOS mode the WorkOS
  // sealed session is the source of truth; this is the mock/fallback session.
  const token = await new SignJWT({ email: human.email, kind: 'human' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(human.id)
    .setIssuer(MOCK_ISS)
    .setAudience(MOCK_AUD)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(AGENT_HMAC_KEY)
  setCookie(c, SESSION_COOKIE, token, sessionCookieOpts())
}

async function readHumanFromCookie(c: Context): Promise<HumanIdentity | null> {
  const raw = getCookie(c, SESSION_COOKIE)
  if (!raw) return null

  // WorkOS sealed session? Unseal via the SDK to recover the user.
  if (WORKOS_ENABLED && WORKOS_COOKIE_PASSWORD) {
    try {
      const wos = await workos()
      const session = wos.userManagement.loadSealedSession({
        sessionData: raw,
        cookiePassword: WORKOS_COOKIE_PASSWORD,
      })
      const r = await session.authenticate()
      if (r.authenticated) {
        return {
          kind: 'human',
          id: r.user.id,
          email: r.user.email,
          firstName: r.user.firstName ?? undefined,
          lastName: r.user.lastName ?? undefined,
        }
      }
    } catch {
      /* fall through to our own JWT check (e.g. mock session set before WorkOS came online) */
    }
  }

  // Our own signed app-session JWT.
  try {
    const { payload } = await jwtVerify(raw, AGENT_HMAC_KEY, {
      issuer: MOCK_ISS,
      audience: MOCK_AUD,
    })
    if (payload.kind !== 'human') return null
    return { kind: 'human', id: String(payload.sub), email: String(payload.email) }
  } catch {
    return null
  }
}

// ═══════════════════════════ AGENT AUTH (M2M) ═══════════════════════════

export interface RegisterResult {
  mode: 'workos' | 'mock'
  client_id: string
  /** present in mock mode (we can show the secret); in WorkOS mode only if WorkOS returns one */
  client_secret?: string
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  scopes: string[]
  org_id?: string
  /** how to mint a fresh token once this one expires */
  token_endpoint: string
  note: string
}

/**
 * POST /api/agents/register — the headline: an agent registers *itself*, no human, and walks away
 * with scoped credentials + a usable short-lived token.
 *
 * Body: { name?, orgId?, scopes?: string[] }
 *
 * WorkOS mode: provision an M2M identity and issue a client-credentials access token.
 * Mock mode:   mint a locally HMAC-signed scoped JWT so the demo runs with no external account.
 */
export async function handleAgentRegister(c: Context): Promise<Response> {
  let body: { name?: string; orgId?: string; scopes?: string[] } = {}
  try {
    body = await c.req.json()
  } catch {
    /* empty body is fine — we apply defaults */
  }
  const name = (body.name || `agent-${randomUUID().slice(0, 8)}`).slice(0, 64)
  const scopes = sanitizeScopes(body.scopes) ?? DEFAULT_AGENT_SCOPES
  const orgId = body.orgId

  if (WORKOS_ENABLED) {
    try {
      const result = await registerAgentWorkOS({ name, orgId, scopes })
      console.log(`🤖 [workos] agent self-registered → ${result.client_id} scopes=[${scopes.join(',')}]`)
      return c.json(result, 201)
    } catch (e) {
      // If WorkOS M2M provisioning isn't available on this account/plan, don't fail the demo —
      // fall back to a locally-signed token and say so loudly.
      console.warn(
        `🤖 [workos] M2M provisioning failed (${(e as Error)?.message}); falling back to mock token.`,
      )
      const result = await registerAgentMock({ name, orgId, scopes })
      result.note = 'WorkOS M2M provisioning unavailable — issued a locally-signed fallback token.'
      return c.json(result, 201)
    }
  }

  const result = await registerAgentMock({ name, orgId, scopes })
  console.log(`🤖 [mock] agent self-registered → ${result.client_id} scopes=[${scopes.join(',')}]`)
  return c.json(result, 201)
}

/** WorkOS path: best-effort M2M identity + client-credentials token. */
async function registerAgentWorkOS(args: {
  name: string
  orgId?: string
  scopes: string[]
}): Promise<RegisterResult> {
  const wos = await workos()

  // Provision a per-agent M2M identity. The exact SDK surface for *creating* an M2M app varies by
  // WorkOS plan/version; we try the documented organization-membership path and surface failures so
  // the caller can fall back. (Per WORKOS_AUTH_RESEARCH.md §2: each agent = its own client.)
  const wosAny = wos as unknown as {
    m2m?: { createClient?: (a: unknown) => Promise<{ clientId: string; clientSecret?: string }> }
  }
  let clientId: string
  let clientSecret: string | undefined
  if (wosAny.m2m?.createClient) {
    const created = await wosAny.m2m.createClient({
      name: args.name,
      organizationId: args.orgId,
      scopes: args.scopes,
    })
    clientId = created.clientId
    clientSecret = created.clientSecret
  } else {
    // No programmatic M2M-create on this SDK build → use the configured shared M2M client.
    clientId = process.env.WORKOS_M2M_CLIENT_ID || ''
    clientSecret = process.env.WORKOS_M2M_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('no WORKOS_M2M_CLIENT_ID/SECRET and SDK cannot create M2M clients')
    }
  }

  // Exchange client-credentials for a short-lived JWT (the token the agent presents to us).
  const tokenEndpoint =
    process.env.WORKOS_TOKEN_URL || 'https://api.workos.com/user_management/authenticate'
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret || '',
    scope: args.scopes.join(' '),
  })
  const resp = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!resp.ok) throw new Error(`token endpoint ${resp.status}`)
  const tok = (await resp.json()) as { access_token: string; expires_in?: number }

  return {
    mode: 'workos',
    client_id: clientId,
    client_secret: clientSecret,
    access_token: tok.access_token,
    token_type: 'Bearer',
    expires_in: tok.expires_in ?? AGENT_TOKEN_TTL_SECONDS,
    scopes: args.scopes,
    org_id: args.orgId,
    token_endpoint: tokenEndpoint,
    note: 'WorkOS M2M identity — verify via JWKS, re-mint via client_credentials when expired.',
  }
}

/** Mock path: mint our own scoped, short-lived HMAC JWT. Self-contained, no external account. */
async function registerAgentMock(args: {
  name: string
  orgId?: string
  scopes: string[]
}): Promise<RegisterResult> {
  const clientId = `agent_${randomBytes(9).toString('hex')}`
  const clientSecret = `sk_mock_${randomBytes(18).toString('hex')}`
  const access_token = await mintMockAgentToken(clientId, args.orgId, args.scopes)
  return {
    mode: 'mock',
    client_id: clientId,
    client_secret: clientSecret,
    access_token,
    token_type: 'Bearer',
    expires_in: AGENT_TOKEN_TTL_SECONDS,
    scopes: args.scopes,
    org_id: args.orgId,
    token_endpoint: '/api/agents/register',
    note:
      'MOCK MODE: locally HMAC-signed scoped JWT (no WorkOS account). Re-register or re-mint when' +
      ' expired. Set WORKOS_API_KEY to issue real WorkOS M2M tokens instead.',
  }
}

async function mintMockAgentToken(
  clientId: string,
  orgId: string | undefined,
  scopes: string[],
): Promise<string> {
  return await new SignJWT({ kind: 'agent', client_id: clientId, org_id: orgId, scope: scopes.join(' ') })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(clientId)
    .setIssuer(MOCK_ISS)
    .setAudience(MOCK_AUD)
    .setIssuedAt()
    .setExpirationTime(`${AGENT_TOKEN_TTL_SECONDS}s`)
    .sign(AGENT_HMAC_KEY)
}

/**
 * requireAgent — Hono middleware. Verifies an agent's bearer JWT and stashes the identity on the
 * context (`c.get('agent')`). 401s if no/invalid token. Use to protect agent-callable endpoints.
 */
export const requireAgent: MiddlewareHandler = async (c, next) => {
  const agent = await readAgentFromRequest(c)
  if (!agent) return c.json({ error: 'invalid or missing agent token' }, 401)
  c.set('agent', agent)
  await next()
}

/** Verify a bearer token (WorkOS JWKS in live mode, HMAC in mock) → AgentIdentity, or null. */
export async function readAgentFromRequest(c: Context): Promise<AgentIdentity | null> {
  const token = bearer(c.req.header('authorization'))
  if (!token) return null
  return await verifyAgentToken(token)
}

export async function verifyAgentToken(token: string): Promise<AgentIdentity | null> {
  // Mock tokens (and our app sessions) are HS256/iss=overmind-mock-auth. WorkOS tokens are RS256
  // signed by the JWKS. We try the cheap local HMAC check first, then JWKS.
  const hmac = await tryVerifyHmacAgent(token)
  if (hmac) return hmac
  if (WORKOS_ENABLED) {
    try {
      const { payload } = await jwtVerify(token, agentJwks())
      return payloadToAgent(payload)
    } catch {
      return null
    }
  }
  return null
}

async function tryVerifyHmacAgent(token: string): Promise<AgentIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, AGENT_HMAC_KEY, {
      issuer: MOCK_ISS,
      audience: MOCK_AUD,
    })
    if (payload.kind !== 'agent') return null
    return payloadToAgent(payload)
  } catch {
    return null
  }
}

function payloadToAgent(payload: JWTPayload & Record<string, unknown>): AgentIdentity {
  const scopeClaim = (payload.scope ?? payload.scopes) as string | string[] | undefined
  const scopes = Array.isArray(scopeClaim)
    ? scopeClaim
    : typeof scopeClaim === 'string'
      ? scopeClaim.split(/\s+/).filter(Boolean)
      : []
  return {
    kind: 'agent',
    sub: String(payload.sub ?? payload.client_id ?? 'unknown'),
    clientId: String(payload.client_id ?? payload.sub ?? 'unknown'),
    orgId: payload.org_id ? String(payload.org_id) : undefined,
    scopes,
  }
}

// ═══════════════════════════ Combined guard for /api/run ═══════════════════════════

export interface Actor {
  human?: HumanIdentity
  agent?: AgentIdentity
}

/**
 * requireHumanOrAgent — protect an endpoint that EITHER a logged-in human OR a valid agent token
 * may call. Stashes whichever it found on `c.set('actor', ...)`.
 */
export const requireHumanOrAgent: MiddlewareHandler = async (c, next) => {
  const agent = await readAgentFromRequest(c)
  if (agent) {
    c.set('actor', { agent } satisfies Actor)
    return next()
  }
  const human = await readHumanFromCookie(c)
  if (human) {
    c.set('actor', { human } satisfies Actor)
    return next()
  }
  // MOCK mode only: auto-grant a demo human so the public funnel's one-click migration works with
  // no login (and cross-origin, where a third-party cookie may not ride along). The agent
  // self-registration path above still runs first, so that showcase is unaffected. When WorkOS is
  // configured this branch is skipped and we 401 as before — real-mode security is untouched.
  if (!WORKOS_ENABLED) {
    const demo: HumanIdentity = { kind: 'human', id: 'demo', email: 'demo@overmind.dev' }
    c.set('actor', { human: demo } satisfies Actor)
    return next()
  }
  return c.json(
    { error: 'auth required: log in (GET /api/auth/login) or present an agent token (POST /api/agents/register)' },
    401,
  )
}

// ═══════════════════════════ small utils ═══════════════════════════

/** Pull the bearer token out of an Authorization header. */
export function bearer(header: string | undefined | null): string | undefined {
  if (!header) return undefined
  const m = header.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : undefined
}

function handleFromEmail(email: string): string {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'human'
}

/** Allow only known scope shapes; cap count; drop junk. Returns null if nothing valid given. */
function sanitizeScopes(scopes: unknown): string[] | null {
  if (!Array.isArray(scopes)) return null
  const clean = scopes
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => /^[a-z][a-z0-9_:.-]{1,40}$/.test(s))
    .slice(0, 16)
  return clean.length ? Array.from(new Set(clean)) : null
}

// Keep timingSafeEqual/createHmac imported usage explicit for any future opaque-key checks and to
// document that mock secrets are compared safely if ever validated server-side.
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
void createHmac // referenced to keep the crypto surface explicit for reviewers
