// "Connect GitHub" — OAuth 2.0 (web application flow) with a personal access
// token (ghp_… / github_pat_…) fallback. Mirrors supabase-oauth.ts: the token
// NEVER reaches the browser — the server keeps it in memory keyed by an httpOnly
// session cookie, and it's dropped on disconnect. This is the write credential the
// migrator uses to push a branch and open a Pull Request on the user's repo.
//
// GitHub user tokens don't expire (no refresh path), and the OAuth App flow uses a
// client secret rather than PKCE, so this is a touch simpler than the Supabase one.

import { randomBytes } from 'node:crypto'
import { parseCookies } from './supabase-oauth'

const AUTHORIZE = 'https://github.com/login/oauth/authorize'
const TOKEN = 'https://github.com/login/oauth/access_token'
// `repo` covers private repos + pushing a branch + opening a PR (and forking when
// the user lacks push access). Override if an operator wants a narrower scope.
const SCOPE = process.env.GITHUB_OAUTH_SCOPE || 'repo'

export const oauthConfigured = (): boolean => Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET)

export function redirectUri(): string {
  return process.env.GITHUB_OAUTH_REDIRECT_URI || 'http://localhost:5173/api/connect/github/callback'
}

// --- ephemeral session store: the token lives only here, in memory ------------
export type TokenSet = { accessToken: string; method: 'oauth' | 'pat' }
type Session = TokenSet & { createdAt: number }
const SESSIONS = new Map<string, Session>()
const SESSION_TTL = 60 * 60 * 1000 // 1h

type Pending = { createdAt: number }
const PENDING = new Map<string, Pending>() // keyed by OAuth state (CSRF guard)
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

// --- authorize + token exchange ------------------------------------------------
const b64url = (buf: Buffer): string => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function startAuthorize(): { url: string } {
  const state = b64url(randomBytes(24))
  sweep()
  PENDING.set(state, { createdAt: Date.now() })
  const u = new URL(AUTHORIZE)
  u.searchParams.set('client_id', process.env.GITHUB_OAUTH_CLIENT_ID || '')
  u.searchParams.set('redirect_uri', redirectUri())
  u.searchParams.set('scope', SCOPE)
  u.searchParams.set('state', state)
  return { url: u.toString() }
}

export async function exchangeCode(code: string, state: string): Promise<TokenSet> {
  if (!PENDING.delete(state)) throw new Error('Expired or unknown OAuth state — start the connection again.')
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID || '',
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET || '',
      code,
      redirect_uri: redirectUri(),
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`GitHub token endpoint ${res.status}: ${text.slice(0, 200)}`)
  const data = JSON.parse(text)
  // GitHub returns 200 with { error } on a bad code rather than a 4xx.
  if (data.error || !data.access_token) throw new Error(data.error_description || data.error || 'No access_token returned.')
  return { accessToken: data.access_token, method: 'oauth' }
}

// The only way the rest of the server gets a usable token: by session id.
export function tokenFor(id: string | undefined): { token: string; method: 'oauth' | 'pat' } | null {
  const s = getSession(id)
  return s ? { token: s.accessToken, method: s.method } : null
}

// --- cookie helpers ------------------------------------------------------------
// Distinct from the Supabase cookie so both connections coexist in one browser.
export const COOKIE = 'gh_sess'
export { parseCookies }
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
