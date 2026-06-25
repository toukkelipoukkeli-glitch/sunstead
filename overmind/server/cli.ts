import './env.ts'
import { runMigration } from './orchestrator.ts'

// Headless run: drives the full 10-phase migration and prints each SwarmEvent as one
// JSON line on stdout. Used by `npm run migrate:demo` and for piping into anything.
const source = process.env.SOURCE_REPO_DIR || '../demo/live-hype-wall'

runMigration(source, (e) => {
  console.log(JSON.stringify(e))
}).catch((err) => {
  console.error(JSON.stringify({ type: 'error', msg: (err as Error)?.message ?? String(err) }))
  process.exit(1)
})
