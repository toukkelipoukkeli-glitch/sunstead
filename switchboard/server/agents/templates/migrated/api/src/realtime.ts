import { Router } from 'express'
import pg from 'pg'
import { pgConfig } from './db'

// Realtime over Server-Sent Events, backed by Postgres LISTEN/NOTIFY. This is
// the drop-in replacement for supabase.channel().on('postgres_changes', …) for
// typical app fan-out. For very high fan-out, swap this for realtime.kafka.ts.
export const realtime = Router()

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

realtime.get('/cards/:boardId', async (req, res) => {
  const boardId = req.params.boardId
  if (!UUID.test(boardId)) return res.status(400).end()
  const channel = `cards:${boardId}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  ;(res as any).flushHeaders?.()

  // A dedicated connection — LISTEN needs a long-lived session, not a pool client.
  const client = new pg.Client(pgConfig())
  await client.connect()
  await client.query(`listen "${channel}"`)

  const onNotify = (msg: pg.Notification) => {
    if (msg.channel === channel && msg.payload) res.write(`data: ${msg.payload}\n\n`)
  }
  client.on('notification', onNotify)
  const ping = setInterval(() => res.write(': ping\n\n'), 25000)

  req.on('close', () => {
    clearInterval(ping)
    client.removeListener('notification', onNotify)
    client.end().catch(() => {})
  })
})
