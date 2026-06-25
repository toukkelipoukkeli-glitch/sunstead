import type { Request, Response, NextFunction } from 'express'
import { pool } from './db'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function bearer(req: Request): string | null {
  const h = req.header('authorization') || ''
  const m = h.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

export async function userFromToken(token: string | null) {
  if (!token || !UUID.test(token)) return null
  const r = await pool.query(
    `select u.id, u.email
       from sessions s join app_users u on u.id = s.user_id
      where s.token = $1 and s.expires_at > now()`,
    [token],
  )
  return r.rows[0] || null
}

// Express middleware: require a valid session, attach the user id to the request.
export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const user = await userFromToken(bearer(req))
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  ;(req as any).userId = user.id
  ;(req as any).user = user
  next()
}
