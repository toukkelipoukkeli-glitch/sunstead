import 'dotenv/config'
import { join } from 'node:path'
import express from 'express'
import cors from 'cors'
import { auth } from './auth'
import { data } from './data'
import { realtime } from './realtime'

// PulseBoard API — the thin middleware Switchboard generates. It speaks plain
// JSON over HTTP to the front-end and talks to Aiven for PostgreSQL underneath.
// Deploy target: Aiven Apps (see ../Dockerfile). Replaces Supabase entirely
// except Storage (the documented gap).
const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true, backend: 'aiven-postgres' }))
app.use('/auth', auth)
app.use('/api', data)
app.use('/realtime', realtime)

// Single-service deploy: when STATIC_DIR is set (the production container), this
// one process also serves the built front-end from the same origin, with an
// index.html fallback so client-side routes resolve. The /auth, /api, /realtime
// and /health routes above are matched first, so the SPA fallback never shadows them.
const staticDir = process.env.STATIC_DIR
if (staticDir) {
  app.use(express.static(staticDir))
  app.get('*', (_req, res) => res.sendFile(join(staticDir, 'index.html')))
}

const port = Number(process.env.PORT) || 8089
app.listen(port, '0.0.0.0', () => {
  console.log(`[pulseboard-api] listening on :${port} -> Aiven Postgres`)
})
