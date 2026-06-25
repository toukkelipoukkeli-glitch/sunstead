// Shared types — used by both the Hono server and the React client.
// This is the API contract. Server routes and the web client both import from here.

export interface User {
  id: string
  email: string
  handle: string
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  author_handle: string
  body: string
  image_url: string | null
  reaction_count: number
  created_at: string
}

export type SearchResult = Post & { similarity: number }

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  emoji: string
  created_at: string
}

// ── Realtime events (produced to Aiven Kafka, fanned out to browsers over SSE) ──
export type PulseEvent =
  | { type: 'post.created'; post: Post }
  | { type: 'post.updated'; post: Post }
  | { type: 'post.deleted'; id: string }
  | { type: 'reaction.created'; post_id: string; reaction_count: number; emoji: string }

// ── CTO agent ──────────────────────────────────────────────────────────────────
export interface CtoRecommendation {
  id: string
  severity: 'info' | 'warn' | 'critical'
  title: string
  detail: string
  action: string
  metric?: string
  created_at: string
}

// ── Auth API ────────────────────────────────────────────────────────────────────
export interface AuthSession {
  token: string
  user: User
}

// ── Migration receipts (proof the migration actually happened) ──────────────────
export interface MigrationReceipt {
  step: string
  status: 'ok' | 'skipped' | 'error'
  detail: string
  count?: number
  ms?: number
  at: string
}
