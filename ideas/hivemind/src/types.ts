// Hivemind — shared contract types. FROZEN: build modules import from here.

export type EventKind =
  | "user" // a human prompt typed to Claude
  | "assistant" // assistant text reply
  | "tool_use" // assistant invoked a tool
  | "tool_result" // a tool returned a result to the model
  | "title" // session title set/updated
  | "session_start"
  | "session_end"
  | "system";

/** One normalized unit of team activity, derived from a Claude Code transcript record. */
export interface ActivityEvent {
  id: string; // stable unique id (transcript record uuid, else hash of sessionId+seq)
  ts: number; // epoch ms
  actor: string; // teammate display name (whose machine produced it)
  sessionId: string; // Claude Code session id
  project: string; // short project name (basename of cwd, else project dir)
  cwd?: string;
  gitBranch?: string;
  kind: EventKind;
  text: string; // human-readable, already-truncated one-liner for the feed
  tool?: string; // tool name when kind === "tool_use"
  model?: string; // model id when known (assistant records)
}

/** Live "who is doing what" — one row per (actor, session), newest activity wins. */
export interface Presence {
  actor: string;
  sessionId: string;
  project: string;
  title?: string;
  model?: string;
  gitBranch?: string;
  lastTs: number;
  lastKind: EventKind;
  lastText: string;
  status: "active" | "idle"; // active when lastTs within config.activeWindowMs
  eventCount: number;
}

export interface SearchHit {
  event: ActivityEvent;
  score: number; // 0..1 relevance
  snippet: string; // text with the match, trimmed
}

export interface Stats {
  events: number;
  sessions: number;
  actors: number;
  bus: string; // "local" | "kafka"
  store: string; // "memory" | "postgres"
  since: number; // epoch ms of earliest retained event (0 if none)
}

// ---- pluggable backends (local fallback OR Aiven) ----

export interface Bus {
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Publish an event to the shared bus (local fan-out OR Aiven Kafka topic). */
  publish(e: ActivityEvent): Promise<void>;
  /** Subscribe to every event on the bus. Returns an unsubscribe fn. */
  subscribe(handler: (e: ActivityEvent) => void): () => void;
}

export interface Store {
  init(): Promise<void>;
  /** Persist one event; MUST be idempotent on event.id. */
  insert(e: ActivityEvent): Promise<void>;
  /** Most recent events, newest first. */
  recent(limit: number): Promise<ActivityEvent[]>;
  /** Relevance search over event text (lexical for memory, FTS/pgvector for postgres). */
  search(query: string, limit: number): Promise<SearchHit[]>;
  /** Current presence rows, most-recently-active first. */
  presence(activeWindowMs: number): Promise<Presence[]>;
  stats(): Promise<Pick<Stats, "events" | "sessions" | "actors" | "since">>;
}

export interface Embedder {
  readonly dim: number;
  embed(text: string): Promise<number[]>;
}

/** Server → client messages, sent as SSE `data:` JSON lines. */
export type ServerMessage =
  | { type: "snapshot"; feed: ActivityEvent[]; presence: Presence[]; stats: Stats }
  | { type: "event"; event: ActivityEvent }
  | { type: "presence"; presence: Presence[] }
  | { type: "stats"; stats: Stats };
