import { Router } from 'express'
import { pool } from './db'
import { bearer, userFromToken } from './session'

// Auth endpoints — the replacement for supabase.auth.* (GoTrue). Passwords are
// hashed by pgcrypto on Aiven Postgres (bcrypt via crypt()/gen_salt('bf')); a
// session is a row in `sessions` whose uuid token the client carries.
export const auth = Router()

auth.post('/signup', async (req, res) => {
  const { email, password, display_name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const u = await pool.query(
      "insert into app_users (email, password_hash) values ($1, crypt($2, gen_salt('bf'))) returning id, email",
      [email, password],
    )
    const user = u.rows[0]
    await pool.query(
      'insert into profiles (id, display_name) values ($1, $2) on conflict (id) do nothing',
      [user.id, display_name || String(email).split('@')[0]],
    )
    const s = await pool.query('insert into sessions (user_id) values ($1) returning token', [user.id])
    res.json({ token: s.rows[0].token, user })
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'email already registered' })
    res.status(500).json({ error: e.message })
  }
})

auth.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  const u = await pool.query(
    'select id, email from app_users where email = $1 and password_hash = crypt($2, password_hash)',
    [email, password],
  )
  if (!u.rows[0]) return res.status(401).json({ error: 'invalid credentials' })
  const s = await pool.query('insert into sessions (user_id) values ($1) returning token', [u.rows[0].id])
  res.json({ token: s.rows[0].token, user: u.rows[0] })
})

auth.post('/logout', async (req, res) => {
  const token = bearer(req)
  if (token) await pool.query('delete from sessions where token = $1', [token]).catch(() => {})
  res.json({ ok: true })
})

auth.get('/user', async (req, res) => {
  const user = await userFromToken(bearer(req))
  if (!user) return res.status(401).json({ error: 'no session' })
  res.json({ user })
})
