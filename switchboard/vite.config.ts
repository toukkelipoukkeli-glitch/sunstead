import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
    // The Rewriter writes generated apps under the project root at request time.
    // Don't let those writes trigger an HMR full-reload (it would reset the demo).
    watch: {
      ignored: ['**/sample-app/**', '**/sample-app-migrated/**', '**/out/**', '**/server/agents/templates/**'],
    },
  },
})
