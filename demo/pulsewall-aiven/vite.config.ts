import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Web client lives in web/, builds to dist/, dev-proxies /api → the Hono server on :8787.
export default defineConfig({
  root: 'web',
  plugins: [react()],
  resolve: {
    alias: { '@shared': new URL('./shared', import.meta.url).pathname },
  },
  server: {
    port: 5175,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
