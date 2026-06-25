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

/** A staged CSV table export the user dropped in: a derived table name + raw CSV text. */
export type CsvSource = { tableName: string; csvText: string }

/** Options for {@link startRun}. Empty fields are omitted from the POST body. */
export type RunOptions = {
  source?: string
  mode?: 'demo' | 'analyze'
  /** Postgres / Supabase connection string for live source data. */
  sourceConnString?: string
  /** Table CSV exports staged in the Connect screen. */
  csvSources?: CsvSource[]
}

/**
 * Kick off a migration run. POST /api/run { source?, mode?, sourceConnString?, csvSources? }.
 *  - `startRun()` / `startRun({ mode: 'demo' })`            → the real ~40s warm-path demo migration.
 *  - `startRun({ source: <github url>, mode: 'analyze' })`  → real clone + analyze + generate.
 *  - `startRun({ sourceConnString })`                       → bring real data via a live source DB.
 *  - `startRun({ csvSources })`                             → bring real data via table CSV exports.
 *
 * Backward-compatible: `startRun(source, mode)` (string first arg) still works — it's
 * normalized to `{ source, mode }`, so existing call sites like `startRun(undefined, 'demo')`
 * keep compiling and behaving identically.
 *
 * The backend runs without login (mock mode), so this works from the public URL.
 * Degrades to { ok:false } if the API is down — callers show an inline error.
 */
export async function startRun(
  optsOrSource?: RunOptions | string,
  legacyMode?: 'demo' | 'analyze',
): Promise<{ ok: boolean }> {
  // Normalize the legacy positional (source, mode) call into a RunOptions object.
  const opts: RunOptions =
    typeof optsOrSource === 'string' || optsOrSource === undefined
      ? { source: optsOrSource, mode: legacyMode }
      : optsOrSource

  try {
    const body: RunOptions = {}
    if (opts.source) body.source = opts.source
    if (opts.mode) body.mode = opts.mode
    if (opts.sourceConnString) body.sourceConnString = opts.sourceConnString
    if (opts.csvSources && opts.csvSources.length > 0) body.csvSources = opts.csvSources
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
