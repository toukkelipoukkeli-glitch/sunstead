import type { SwarmEvent } from '../shared/types.ts'
import { apiUrl, apiFetch } from './config.ts'

/**
 * Connect to the orchestrator's SSE stream. The server emits `event: pulse`
 * with `data: <JSON SwarmEvent>` (plus `event: ping` heartbeats we ignore).
 * Returns a disconnect fn. The control room is a pure function of this stream.
 */
export function connectStream(onEvent: (e: SwarmEvent) => void): () => void {
  let es: EventSource | null = null
  let closed = false

  const open = () => {
    if (closed) return
    es = new EventSource(apiUrl('/api/stream'), { withCredentials: true })

    es.addEventListener('pulse', (ev) => {
      try {
        const data = (ev as MessageEvent).data
        if (!data) return
        const parsed = JSON.parse(data) as SwarmEvent
        onEvent(parsed)
      } catch {
        // ignore malformed frames — never let one bad event kill the stream
      }
    })

    // The browser auto-reconnects EventSource on error, but if the server
    // closed the connection hard we re-open after a short delay defensively.
    es.onerror = () => {
      if (closed) return
      // Let the native retry handle transient blips; only force-reopen if dead.
      if (es && es.readyState === EventSource.CLOSED) {
        es.close()
        es = null
        setTimeout(open, 1500)
      }
    }
  }

  open()

  return () => {
    closed = true
    if (es) {
      es.close()
      es = null
    }
  }
}

/**
 * Kick off a migration run. POST /api/run { source?, mode? }.
 *  - `startRun()` / `startRun(undefined, 'demo')` → the real ~40s warm-path demo migration.
 *  - `startRun(<github url>, 'analyze')`           → real clone + analyze + generate.
 * The backend runs without login (mock mode), so this works from the public URL.
 * Degrades to { ok:false } if the API is down — callers show an inline error.
 */
export async function startRun(
  source?: string,
  mode?: 'demo' | 'analyze',
): Promise<{ ok: boolean }> {
  try {
    const body: { source?: string; mode?: 'demo' | 'analyze' } = {}
    if (source) body.source = source
    if (mode) body.mode = mode
    const res = await apiFetch('/api/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}
