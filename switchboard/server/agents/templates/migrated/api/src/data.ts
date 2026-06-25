import { Router } from 'express'
import { withUser } from './db'
import { requireUser } from './session'

// Data endpoints — the replacement for the supabase-js query builder. Every
// handler runs through withUser() so the migrated RLS policies enforce, and the
// owner/author id comes from the session (never the client).
export const data = Router()
data.use(requireUser)

data.get('/boards', async (req, res) => {
  const rows = await withUser((req as any).userId, (c) =>
    c.query('select * from boards order by created_at desc').then((r) => r.rows),
  )
  res.json(rows)
})

data.post('/boards', async (req, res) => {
  const { title } = req.body || {}
  const row = await withUser((req as any).userId, (c) =>
    c
      .query('insert into boards (owner_id, title) values ($1, $2) returning *', [(req as any).userId, title])
      .then((r) => r.rows[0]),
  )
  res.json(row)
})

data.get('/cards', async (req, res) => {
  const boardId = String(req.query.board_id || '')
  const rows = await withUser((req as any).userId, (c) =>
    c.query('select * from cards where board_id = $1 order by created_at asc', [boardId]).then((r) => r.rows),
  )
  res.json(rows)
})

data.post('/cards', async (req, res) => {
  const { board_id, column_key, body } = req.body || {}
  const row = await withUser((req as any).userId, async (c) => {
    const r = await c.query(
      'insert into cards (board_id, author_id, column_key, body) values ($1, $2, $3, $4) returning *',
      [board_id, (req as any).userId, column_key || 'good', body],
    )
    // Realtime fan-out: NOTIFY on a per-board channel (replaces Supabase Realtime).
    await c.query("select pg_notify('cards:' || $1::text, $2)", [board_id, JSON.stringify(r.rows[0])])
    return r.rows[0]
  })
  res.json(row)
})

data.patch('/cards/:id', async (req, res) => {
  const { votes } = req.body || {}
  await withUser((req as any).userId, (c) =>
    c.query('update cards set votes = $1 where id = $2', [votes, req.params.id]),
  )
  res.json({ ok: true })
})
