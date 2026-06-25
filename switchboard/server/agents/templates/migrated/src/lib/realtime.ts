import { BASE } from './aivenClient'
import type { Card } from './db'

// Same export/signature as the Supabase version. supabase.channel(...) becomes
// an EventSource (SSE) onto the Aiven API, which streams Postgres NOTIFY events
// (or Kafka, behind the same endpoint). The returned unsubscribe is identical.
export function subscribeToCards(boardId: string, onInsert: (card: Card) => void) {
  const es = new EventSource(`${BASE}/realtime/cards/${encodeURIComponent(boardId)}`)
  es.onmessage = (e) => {
    try {
      onInsert(JSON.parse(e.data) as Card)
    } catch {
      /* ignore keep-alives */
    }
  }
  return () => es.close()
}
