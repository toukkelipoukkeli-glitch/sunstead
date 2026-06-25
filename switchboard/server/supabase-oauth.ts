// "Connect Supabase" — OAuth 2.0 (Authorization Code + PKCE) with a personal
// access token (sbp_…) fallback. The token NEVER reaches the browser: the server
// keeps it in memory keyed by an httpOnly session cookie. Nothing the token can
// reach is written to disk or logged. This replaces pasting a whole .env (every
// secret) with a single scoped credential the user can revoke at any time.

import { randomBytes, createHash } from 'node:crypto'

const BASE = (process.env.SUPABASE_API_URL || 'https://api.supabase.com').replace(/\/$/, '')
const AUTHORIZE = `${BASE}/v1/oauth/authorize`
const TOKEN = `${BASE}/v1/oauth/token`

export const oauthConfigured = (): boolean => Boolean(process.env.SUPABASE_OAUTH_CLIENT_ID && process.env.SUPABASE_OAUTH_CLIENT_SECRET)

export function redirectUri(): string {
  return process.env.SUPABASE_OAUTH_REDIRECT_URI || 'http://localhost:5173/api/connect/supabase/callback'
}

// --- ephemeral session store: the token lives only here, in memory ------------
export type TokenSet = { accessToken: string; refreshToken?: string; expiresAt: number; method: 'oauth' | 'pat' }
type Session = TokenSet & { createdAt: number }
const SESSIONS = new Map<string, Session>()
const SESSION_TTL = 60 * 60 * 1000 // 1h

type Pending = { codeVerifier: string; createdAt: number }
const PENDING = new Map<string, Pending>() // keyed by OAuth state
const PENDING_TTL = 10 * 60 * 1000

function sweep() {
  const now = Date.now()
  for (const [k, s] of SESSIONS) if (now - s.createdAt > SESSION_TTL) SESSIONS.delete(k)
  for (const [k, p] of PENDING) if (now - p.createdAt > PENDING_TTL) PENDING.delete(k)
}

export const newSessionId = (): string => randomBytes(32).toString('hex')
export function putSession(id: string, t: TokenSet) {
  sweep()
  SESSIONS.set(id, { ...t, createdAt: Date.now() })
}
export function getSession(id: string | undefined): Session | undefined {
  if (!id) return undefined
  sweep()
  return SESSIONS.get(id)
}
export const dropSession = (id: string | undefined) => {
  if (id) SESSIONS.delete(id)
}

// --- PKCE + authorize ----------------------------------------------------------
const b64url = (buf: Buffer): string => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function startAuthorize(): { url: string } {
  const state = b64url(randomBytes(24))
  const codeVerifier = b64url(randomBytes(48))
  const codeChallenge = b64url(createHash('sha256').update(codeVerifier).digest())
  sweep()
  PENDING.set(state, { codeVerifier, createdAt: Date.now() })
  const u = new URL(AUTHORIZE)
  u.searchParams.set('client_id', process.env.SUPABASE_OAUTH_CLIENT_ID || '')
  u.searchParams.set('redirect_uri', redirectUri())
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('state', state)
  u.searchParams.set('code_challenge', codeChallenge)
  u.searchParams.set('code_challenge_method', 'S256')
  return { url: u.toString() }
}

async function postToken(form: URLSearchParams): Promise<any> {
  const id = process.env.SUPABASE_OAUTH_CLIENT_ID || ''
  const secret = process.env.SUPABASE_OAUTH_CLIENT_SECRET || ''
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
    },
    body: form.toString(),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase token endpoint ${res.status}: ${text.slice(0, 200)}`)
  return JSON.parse(text)
}

export async function exchangeCode(code: string, state: string): Promise<TokenSet> {
  const pending = PENDING.get(state)
  PENDING.delete(state)
  if (!pending) throw new Error('Expired or unknown OAuth state — start the connection again.')
  const data = await postToken(
    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: pending.codeVerifier }),
  )
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
    method: 'oauth',
  }
}

async function refresh(s: Session): Promise<TokenSet> {
  if (s.method !== 'oauth' || !s.refreshToken) return s
  try {
    const data = await postToken(new URLSearchParams({ grant_type: 'refresh_token', refresh_token: s.refreshToken }))
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || s.refreshToken,
      expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
      method: 'oauth',
    }
  } catch {
    return s // keep the old token; a stale one surfaces as a clean 401 downstream
  }
}

// The only way the rest of the server gets a usable token: by session id. Refreshes
// an OAuth token that's about to expire. Returns null if there's no live session.
export async function tokenFor(id: string | undefined): Promise<{ token: string; method: 'oauth' | 'pat' } | null> {
  const s = getSession(id)
  if (!s) return null
  if (s.method === 'oauth' && s.expiresAt < Date.now() + 30_000 && s.refreshToken) {
    const t = await refresh(s)
    putSession(id!, t)
    return { token: t.accessToken, method: 'oauth' }
  }
  return { token: s.accessToken, method: s.method }
}

// --- cookie helpers (no dependency) -------------------------------------------
export const COOKIE = 'sb_sess'
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}
export function sessionCookie(id: string, secure: boolean): string {
  const bits = [`${COOKIE}=${id}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${SESSION_TTL / 1000}`]
  if (secure) bits.push('Secure')
  return bits.join('; ')
}
export function clearCookie(secure: boolean): string {
  const bits = [`${COOKIE}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0']
  if (secure) bits.push('Secure')
  return bits.join('; ')
}
