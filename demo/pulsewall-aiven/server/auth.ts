import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { q, q1 } from './db.ts'
import type { User } from '../shared/types.ts'

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me'
const WEEK = 1000 * 60 * 60 * 24 * 7

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url')
}

/** Minimal HMAC-signed token (JWT-shaped) — replaces Supabase GoTrue sessions. */
export function signToken(sub: string, email: string): string {
  const body = b64url(JSON.stringify({ sub, email, exp: Date.now() + WEEK }))
  const sig = b64url(createHmac('sha256', SECRET).update(body).digest())
  return `${body}.${sig}`
}

export function verifyToken(token: string | undefined): { sub: string; email: string } | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = b64url(createHmac('sha256', SECRET).update(body).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (data.exp && data.exp < Date.now()) return null
    return { sub: data.sub, email: data.email }
  } catch {
    return null
  }
}

export function handleFromEmail(email: string): string {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'hyper'
}

/** Issue a magic code (replaces Supabase magic-link email). Returned in dev; emailed in prod. */
export async function requestCode(email: string): Promise<string> {
  const code = String(randomInt(100000, 999999))
  await q(
    `insert into auth_codes (email, code, expires_at) values ($1, $2, now() + interval '10 minutes')`,
    [email, code],
  )
  return code
}

export async function verifyCode(email: string, code: string): Promise<User | null> {
  const row = await q1<{ code: string }>(
    `select code from auth_codes where email = $1 and expires_at > now() order by created_at desc limit 1`,
    [email],
  )
  if (!row || row.code !== code) return null
  await q(`delete from auth_codes where email = $1`, [email])
  return await q1<User>(
    `insert into users (email, handle) values ($1, $2)
     on conflict (email) do update set handle = users.handle
     returning id, email, handle, created_at`,
    [email, handleFromEmail(email)],
  )
}

export async function getUserFromToken(token: string | undefined): Promise<User | null> {
  const claims = verifyToken(token)
  if (!claims) return null
  return await q1<User>(`select id, email, handle, created_at from users where id = $1`, [claims.sub])
}

/** Pull the bearer token out of an Authorization header. */
export function bearer(header: string | undefined | null): string | undefined {
  if (!header) return undefined
  const m = header.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : undefined
}
