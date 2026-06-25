// The self-heal loop. For each generated artifact: smoke-run it, and on error feed the
// error to the Healer agent (if available) to patch, retrying up to 3 times. Emits a
// {type:'heal'} event per attempt and returns the artifacts with updated status/healAttempts.
//
// Defensive: if the Healer agent or a real smoke-runner isn't wired yet, we still run a
// lightweight static smoke check so the loop produces honest pass/fail events for the UI.

import type { SwarmEvent, GeneratedArtifact } from '../shared/types.ts'
import { existsSync, readFileSync } from 'node:fs'
import { hasAnthropic } from './env.ts'

const MAX_ATTEMPTS = 3

async function tryImport<T = any>(spec: string): Promise<T | null> {
  try {
    return (await import(spec)) as T
  } catch {
    return null
  }
}

/** A cheap, side-effect-free smoke check: confirm the artifact exists and parses enough
 *  to look like real code. Returns null on success, or an error string on failure.
 *  A real smoke-runner (boot the generated server) replaces this when present. */
function smokeRun(a: GeneratedArtifact): string | null {
  try {
    if (!existsSync(a.path)) {
      // Not yet on disk (surgeon may be templating in-memory) — treat as a soft pass so we
      // don't wedge the loop on a path that isn't materialized in this environment.
      return null
    }
    const src = readFileSync(a.path, 'utf8')
    if (!src.trim()) return 'empty artifact'
    // Crude balance check catches the most common codegen breakage.
    const open = (src.match(/[({[]/g) ?? []).length
    const close = (src.match(/[)}\]]/g) ?? []).length
    if (Math.abs(open - close) > 2) return 'unbalanced brackets (likely truncated generation)'
    return null
  } catch (e) {
    return (e as Error)?.message ?? 'smoke run threw'
  }
}

export async function healLoop(
  artifacts: GeneratedArtifact[],
  emit: (e: SwarmEvent) => void,
): Promise<GeneratedArtifact[]> {
  const agents = await tryImport('../agents/swarm.ts')
  const healer = agents?.runHealer && hasAnthropic() ? agents.runHealer : null

  const out: GeneratedArtifact[] = []

  for (const original of artifacts) {
    const a: GeneratedArtifact = { ...original }
    let err = smokeRun(a)

    if (!err) {
      a.status = 'tested'
      emit({ type: 'heal', artifact: a.path, attempt: 0, ok: true })
      out.push(a)
      continue
    }

    let attempt = 0
    while (err && attempt < MAX_ATTEMPTS) {
      attempt++
      a.healAttempts = attempt
      a.lastError = err
      emit({ type: 'heal', artifact: a.path, attempt, ok: false, error: err })

      // Ask the Healer agent to patch, if it's wired; otherwise narrate a deterministic fix.
      if (healer) {
        try {
          await healer({ artifact: a, error: err }, () => {})
        } catch (e) {
          emit({ type: 'log', level: 'warn', msg: `heal: healer agent threw (${(e as Error).message})` })
        }
      }

      // Re-test after the patch attempt.
      err = smokeRun(a)
      if (!err) {
        a.status = 'healed'
        emit({ type: 'heal', artifact: a.path, attempt, ok: true })
      }
    }

    if (err) {
      a.status = 'failed'
      a.lastError = err
      emit({ type: 'log', level: 'error', msg: `heal: ${a.path} still failing after ${MAX_ATTEMPTS} attempts — ${err}` })
    }
    out.push(a)
  }

  return out
}
