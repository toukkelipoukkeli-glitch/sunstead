// overmind/mcp/bootstrap.ts
// ─────────────────────────────────────────────────────────────────────────────
// Side-effect-only module: load the Overmind root's .env.local from an ABSOLUTE path
// and chdir to the Overmind root — BEFORE any engine module is imported.
//
// Why a separate module: ESM evaluates `import` statements in source order, before the
// importing module's own statement bodies run. server/env.ts loads dotenv with the
// RELATIVE path '.env.local' at its own import time, so if we only chdir'd in server.ts's
// body, env.ts would already have run against the wrong cwd. By importing THIS module
// first in server.ts, the absolute-path dotenv load + chdir happen before env.ts (and
// every other engine module) is evaluated.
// ─────────────────────────────────────────────────────────────────────────────

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
export const OVERMIND_ROOT = resolve(HERE, '..')

// Absolute-path env load — independent of cwd. .env.local wins; later .env fills gaps;
// real shell/CI env still wins over both (dotenv never overrides already-set vars).
try {
  config({ path: resolve(OVERMIND_ROOT, '.env.local') })
  config({ path: resolve(OVERMIND_ROOT, '.env') })
} catch {
  /* missing env files are fine — degrade gracefully */
}

// Anchor cwd at the Overmind root so the engine's relative source-dir defaults
// (e.g. '../demo/live-hype-wall') and any other cwd-relative reads resolve as normal.
try {
  process.chdir(OVERMIND_ROOT)
} catch {
  /* best-effort */
}
