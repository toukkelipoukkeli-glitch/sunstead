import './env.ts'
import { readFileSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { api } from './routes.ts'
import { busReady, busMode } from './bus.ts'
import { applySchema, dbConfigured } from './db.ts'

const app = new Hono()
app.route('/api', api)

const isProd = process.env.NODE_ENV === 'production'
if (isProd) {
  // Serve the built client (vite → ./dist) and SPA-fallback to index.html.
  app.use('/*', serveStatic({ root: './dist' }))
  app.notFound((c) => {
    try {
      return c.html(readFileSync('./dist/index.html', 'utf8'))
    } catch {
      return c.text('client not built — run `npm run build`', 500)
    }
  })
}

const port = Number(process.env.PORT || 8787)

async function boot() {
  if (dbConfigured()) {
    try {
      await applySchema()
      console.log('[db] schema applied to Aiven Postgres')
    } catch (e) {
      console.error('[db] schema apply failed:', (e as Error).message)
    }
  } else {
    console.warn('[db] DATABASE_URL not set — API will error until you point it at Aiven')
  }
  await busReady
  serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
    console.log(`⚡ PulseWall (Aiven-native) on http://0.0.0.0:${info.port}  ·  bus=${busMode()}`)
  })
}

boot()
