// Load env from .env.local (preferred) then .env. Import this FIRST in index.ts and cli.ts,
// before anything that reads process.env, so config is present by the time modules initialize.
import { config } from 'dotenv'

// Later calls do NOT override already-set vars, so .env.local wins over .env, and real
// shell/CI env wins over both. We swallow errors: a missing file is fine (degrade gracefully).
try {
  config({ path: '.env.local' })
  config({ path: '.env' })
} catch {
  /* no env files — rely on process env / defaults */
}

export const PORT = Number(process.env.PORT || 8788)
export const AIVEN_PROJECT = process.env.AIVEN_PROJECT || 'touko-1f1c'
export const SOURCE_REPO_DIR = process.env.SOURCE_REPO_DIR || '../demo/live-hype-wall'

export function hasAnthropic(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
export function hasAivenToken(): boolean {
  return !!process.env.AIVEN_TOKEN
}
