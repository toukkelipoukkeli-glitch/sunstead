import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'web',
  plugins: [react()],
  resolve: { alias: { '@shared': new URL('./shared', import.meta.url).pathname } },
  // Proxy real API paths (/api/run, /api/stream, /api/auth/...) to the Hono server,
  // but NOT the `/api.ts` client module — a bare `/api` prefix would swallow that asset
  // and break the whole module graph. Anchor on `/api/` (+ exact `/api`) instead.
  server: { port: 5180, proxy: { '^/api(/|$)': 'http://localhost:8788' } },
  build: { outDir: '../dist', emptyOutDir: true },
})
