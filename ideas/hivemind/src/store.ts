// Hivemind — store. MemoryStore (local JSONL) + PgStore (Aiven Postgres + pgvector).
// CORE module: zero external deps in the default (memory) path. PgStore lazy-loads "pg".
import fsp from "node:fs/promises";
import path from "node:path";
import type {
  Store,
  ActivityEvent,
  Presence,
  SearchHit,
  Stats,
  Embedder,
  EventKind,
} from "./types.ts";
import type { Config } from "./config.ts";

const MAX_EVENTS = 5000;

type StoreStats = Pick<Stats, "events" | "sessions" | "actors" | "since">;

/** Pick the right store for the configured backend. */
export function createStore(config: Config, embedder: Embedder): Store {
  if (config.storeKind === "postgres") return new PgStore(config, embedder);
  return new MemoryStore(config, embedder);
}

// ---- shared lexical helpers (also used as the offline pg fallback path) ----

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/** Build a one-line snippet around the first matching token, else the head of the text. */
function makeSnippet(text: string, queryTokens: string[], max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const lower = flat.toLowerCase();
  let at = -1;
  for (const tok of queryTokens) {
    const i = lower.indexOf(tok);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  if (at < 0) return flat.length > max ? flat.slice(0, max - 1) + "…" : flat;
  const start = Math.max(0, at - Math.floor(max / 3));
  const end = Math.min(flat.length, start + max);
  let snip = flat.slice(start, end);
  if (start > 0) snip = "…" + snip;
  if (end < flat.length) snip = snip + "…";
  return snip;
}

/** Lexical relevance scoring shared by MemoryStore (and pg offline fallback). */
function lexicalSearch(events: ActivityEvent[], query: string, limit: number): SearchHit[] {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const qSet = new Set(qTokens);
  const phrase = query.toLowerCase().trim();

  const scored: { event: ActivityEvent; raw: number }[] = [];
  for (const e of events) {
    const hay = `${e.text} ${e.project} ${e.tool ?? ""}`.toLowerCase();
    const docTokens = tokenize(hay);
    if (docTokens.length === 0) continue;

    // term frequency: count how often each query token appears in the doc.
    let tf = 0;
    let matchedDistinct = 0;
    const seen = new Set<string>();
    for (const t of docTokens) {
      if (qSet.has(t)) {
        tf += 1;
        if (!seen.has(t)) {
          seen.add(t);
          matchedDistinct += 1;
        }
      }
    }
    if (tf === 0) continue;

    // coverage rewards matching more distinct query terms.
    const coverage = matchedDistinct / qSet.size;
    let raw = tf + coverage * qTokens.length;
    // small bonus for an exact phrase hit.
    if (phrase.length > 2 && hay.includes(phrase)) raw += qTokens.length;
    scored.push({ event: e, raw });
  }

  if (scored.length === 0) return [];
  const maxRaw = scored.reduce((m, s) => Math.max(m, s.raw), 0) || 1;
  scored.sort((a, b) => b.raw - a.raw || b.event.ts - a.event.ts);

  return scored.slice(0, limit).map((s) => ({
    event: s.event,
    score: Math.min(1, s.raw / maxRaw),
    snippet: makeSnippet(s.event.text, qTokens),
  }));
}

/** Reduce events into one presence row per session, newest activity wins. */
function reducePresence(events: ActivityEvent[], activeWindowMs: number): Presence[] {
  const bySession = new Map<string, Presence>();
  const titles = new Map<string, { ts: number; text: string }>();

  for (const e of events) {
    // track the latest title seen for each session.
    if (e.kind === "title") {
      const prev = titles.get(e.sessionId);
      if (!prev || e.ts >= prev.ts) titles.set(e.sessionId, { ts: e.ts, text: e.text });
    }

    const cur = bySession.get(e.sessionId);
    if (!cur) {
      bySession.set(e.sessionId, {
        actor: e.actor,
        sessionId: e.sessionId,
        project: e.project,
        title: undefined,
        model: e.model,
        gitBranch: e.gitBranch,
        lastTs: e.ts,
        lastKind: e.kind,
        lastText: e.text,
        status: "idle",
        eventCount: 1,
      });
    } else {
      cur.eventCount += 1;
      if (e.model) cur.model = e.model; // keep latest known model
      if (e.gitBranch) cur.gitBranch = e.gitBranch;
      if (e.ts >= cur.lastTs) {
        cur.actor = e.actor;
        cur.project = e.project;
        cur.lastTs = e.ts;
        cur.lastKind = e.kind;
        cur.lastText = e.text;
      }
    }
  }

  const now = Date.now();
  const rows = [...bySession.values()];
  for (const r of rows) {
    const t = titles.get(r.sessionId);
    if (t) r.title = t.text;
    r.status = now - r.lastTs < activeWindowMs ? "active" : "idle";
  }
  rows.sort((a, b) => b.lastTs - a.lastTs);
  return rows;
}

// ---------------------------------------------------------------------------
// MemoryStore — in-memory array + Map dedupe, JSONL persistence to dataFile.
// ---------------------------------------------------------------------------

export class MemoryStore implements Store {
  private events: ActivityEvent[] = [];
  private byId = new Map<string, ActivityEvent>();
  private readonly config: Config;
  private readonly dataFile: string;

  constructor(config: Config, _embedder: Embedder) {
    this.config = config;
    this.dataFile = config.dataFile;
  }

  async init(): Promise<void> {
    // ensure the persistence dir exists, then load any prior events.
    await fsp.mkdir(path.dirname(this.dataFile), { recursive: true });
    let raw: string;
    try {
      raw = await fsp.readFile(this.dataFile, "utf8");
    } catch (err: any) {
      if (err?.code === "ENOENT") return; // first run, nothing to load
      throw err;
    }
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const e = JSON.parse(trimmed) as ActivityEvent;
        if (e && typeof e.id === "string" && !this.byId.has(e.id)) {
          this.byId.set(e.id, e);
          this.events.push(e);
        }
      } catch {
        // skip corrupt line
      }
    }
    // enforce cap (oldest first by ts) and keep array ordered by ts asc.
    this.events.sort((a, b) => a.ts - b.ts);
    if (this.events.length > MAX_EVENTS) {
      const overflow = this.events.splice(0, this.events.length - MAX_EVENTS);
      for (const e of overflow) this.byId.delete(e.id);
    }
  }

  async insert(e: ActivityEvent): Promise<void> {
    if (this.byId.has(e.id)) return; // idempotent on id
    this.byId.set(e.id, e);
    this.events.push(e);

    // cap: drop oldest by ts.
    if (this.events.length > MAX_EVENTS) {
      // events is roughly ts-ordered; find true oldest to drop.
      let oldestIdx = 0;
      for (let i = 1; i < this.events.length; i++) {
        if (this.events[i].ts < this.events[oldestIdx].ts) oldestIdx = i;
      }
      const [dropped] = this.events.splice(oldestIdx, 1);
      if (dropped) this.byId.delete(dropped.id);
    }

    // append-only JSONL persistence (best effort, never throws to caller).
    try {
      await fsp.appendFile(this.dataFile, JSON.stringify(e) + "\n");
    } catch {
      // persistence failure shouldn't break the live pipeline.
    }
  }

  async recent(limit: number): Promise<ActivityEvent[]> {
    const sorted = [...this.events].sort((a, b) => b.ts - a.ts);
    return sorted.slice(0, Math.max(0, limit));
  }

  async search(query: string, limit: number): Promise<SearchHit[]> {
    return lexicalSearch(this.events, query, Math.max(0, limit));
  }

  async presence(activeWindowMs: number): Promise<Presence[]> {
    return reducePresence(this.events, activeWindowMs);
  }

  async stats(): Promise<StoreStats> {
    const sessions = new Set<string>();
    const actors = new Set<string>();
    let since = 0;
    for (const e of this.events) {
      sessions.add(e.sessionId);
      actors.add(e.actor);
      if (since === 0 || e.ts < since) since = e.ts;
    }
    return { events: this.events.length, sessions: sessions.size, actors: actors.size, since };
  }
}

// ---------------------------------------------------------------------------
// PgStore — Aiven Postgres + pgvector. Lazy-loads "pg". Degrades gracefully.
// ---------------------------------------------------------------------------

export class PgStore implements Store {
  private pool: any = null;
  private hasVectorEmbedder: boolean;
  private readonly config: Config;
  private readonly embedder: Embedder;

  constructor(config: Config, embedder: Embedder) {
    this.config = config;
    this.embedder = embedder;
    // We embed for pgvector only when a real (remote) embedder is configured.
    // The lexical embedder is offline/lexical-ish; we treat the presence of
    // config.embed as the signal that embeddings are meaningful for ANN search.
    this.hasVectorEmbedder = Boolean(config.embed) && embedder.dim === (config.embed?.dim ?? embedder.dim);
  }

  private async getPg(): Promise<any> {
    try {
      const pg = await import("pg");
      return (pg as any).default ?? pg;
    } catch {
      throw new Error(
        'PgStore needs the "pg" package. Install it with:  npm i pg   (or run with HIVEMIND_STORE=memory)',
      );
    }
  }

  async init(): Promise<void> {
    const pg = await this.getPg();
    const connectionString = this.config.pg?.connectionString;
    if (!connectionString) {
      throw new Error(
        "PgStore needs PG_CONNECTION_STRING (or DATABASE_URL) set. (or run with HIVEMIND_STORE=memory)",
      );
    }
    this.pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Aiven uses a CA we don't bundle
      max: 4,
    });
    // Verify connectivity only; schema.sql is applied out of band.
    await this.pool.query("SELECT 1");
  }

  /** Format a JS number[] as a pgvector literal: '[1,2,3]'. */
  private vectorLiteral(vec: number[]): string {
    return "[" + vec.join(",") + "]";
  }

  async insert(e: ActivityEvent): Promise<void> {
    if (!this.pool) return;
    try {
      let embeddingLiteral: string | null = null;
      if (this.hasVectorEmbedder) {
        try {
          const vec = await this.embedder.embed(e.text);
          if (Array.isArray(vec) && vec.length > 0) embeddingLiteral = this.vectorLiteral(vec);
        } catch {
          embeddingLiteral = null; // embedding is best-effort
        }
      }

      // upsert event (idempotent on id).
      await this.pool.query(
        `INSERT INTO events (id, ts, actor, session_id, project, cwd, git_branch, kind, text, tool, model, embedding)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::vector)
         ON CONFLICT (id) DO NOTHING`,
        [
          e.id,
          e.ts,
          e.actor,
          e.sessionId,
          e.project,
          e.cwd ?? null,
          e.gitBranch ?? null,
          e.kind,
          e.text,
          e.tool ?? null,
          e.model ?? null,
          embeddingLiteral,
        ],
      );

      // upsert the materialized session presence row.
      const titleValue = e.kind === "title" ? e.text : null;
      await this.pool.query(
        `INSERT INTO sessions (session_id, actor, project, title, model, git_branch, last_ts, last_kind, last_text, event_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1)
         ON CONFLICT (session_id) DO UPDATE SET
           actor       = EXCLUDED.actor,
           project     = EXCLUDED.project,
           title       = COALESCE(EXCLUDED.title, sessions.title),
           model       = COALESCE(EXCLUDED.model, sessions.model),
           git_branch  = COALESCE(EXCLUDED.git_branch, sessions.git_branch),
           last_ts     = GREATEST(sessions.last_ts, EXCLUDED.last_ts),
           last_kind   = CASE WHEN EXCLUDED.last_ts >= sessions.last_ts THEN EXCLUDED.last_kind ELSE sessions.last_kind END,
           last_text   = CASE WHEN EXCLUDED.last_ts >= sessions.last_ts THEN EXCLUDED.last_text ELSE sessions.last_text END,
           event_count = sessions.event_count + 1`,
        [
          e.sessionId,
          e.actor,
          e.project,
          titleValue,
          e.model ?? null,
          e.gitBranch ?? null,
          e.ts,
          e.kind,
          e.text,
        ],
      );
    } catch (err) {
      // never break the live pipeline on a write error.
      console.error("[PgStore] insert failed:", (err as Error)?.message ?? err);
    }
  }

  private rowToEvent(r: any): ActivityEvent {
    return {
      id: r.id,
      ts: Number(r.ts),
      actor: r.actor,
      sessionId: r.session_id,
      project: r.project,
      cwd: r.cwd ?? undefined,
      gitBranch: r.git_branch ?? undefined,
      kind: r.kind as EventKind,
      text: r.text,
      tool: r.tool ?? undefined,
      model: r.model ?? undefined,
    };
  }

  async recent(limit: number): Promise<ActivityEvent[]> {
    if (!this.pool) return [];
    try {
      const { rows } = await this.pool.query(
        `SELECT id, ts, actor, session_id, project, cwd, git_branch, kind, text, tool, model
         FROM events ORDER BY ts DESC LIMIT $1`,
        [Math.max(0, limit)],
      );
      return rows.map((r: any) => this.rowToEvent(r));
    } catch (err) {
      console.error("[PgStore] recent failed:", (err as Error)?.message ?? err);
      return [];
    }
  }

  async search(query: string, limit: number): Promise<SearchHit[]> {
    if (!this.pool) return [];
    const n = Math.max(0, limit);
    // Prefer pgvector cosine search when we have a real embedder.
    if (this.hasVectorEmbedder) {
      try {
        const vec = await this.embedder.embed(query);
        const qvec = this.vectorLiteral(vec);
        const { rows } = await this.pool.query(
          `SELECT id, ts, actor, session_id, project, cwd, git_branch, kind, text, tool, model,
                  (embedding <=> $1::vector) AS distance
           FROM events
           WHERE embedding IS NOT NULL
           ORDER BY embedding <=> $1::vector
           LIMIT $2`,
          [qvec, n],
        );
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            event: this.rowToEvent(r),
            score: Math.max(0, Math.min(1, 1 - Number(r.distance))),
            snippet: makeSnippet(r.text, tokenize(query)),
          }));
        }
        // no embedded rows yet → fall through to full-text.
      } catch (err) {
        console.error("[PgStore] vector search failed, falling back to FTS:", (err as Error)?.message ?? err);
      }
    }

    // Full-text search via the generated tsvector column.
    try {
      const { rows } = await this.pool.query(
        `SELECT id, ts, actor, session_id, project, cwd, git_branch, kind, text, tool, model,
                ts_rank(tsv, plainto_tsquery('english', $1)) AS rank
         FROM events
         WHERE tsv @@ plainto_tsquery('english', $1)
         ORDER BY rank DESC, ts DESC
         LIMIT $2`,
        [query, n],
      );
      const qTokens = tokenize(query);
      const maxRank = rows.reduce((m: number, r: any) => Math.max(m, Number(r.rank) || 0), 0) || 1;
      return rows.map((r: any) => ({
        event: this.rowToEvent(r),
        score: Math.max(0, Math.min(1, (Number(r.rank) || 0) / maxRank)),
        snippet: makeSnippet(r.text, qTokens),
      }));
    } catch (err) {
      // graceful degrade: lexical scan over recent events.
      console.error("[PgStore] FTS failed, degrading to recent():", (err as Error)?.message ?? err);
      try {
        const recent = await this.recent(500);
        return lexicalSearch(recent, query, n);
      } catch {
        return [];
      }
    }
  }

  async presence(activeWindowMs: number): Promise<Presence[]> {
    if (!this.pool) return [];
    try {
      const { rows } = await this.pool.query(
        `SELECT session_id, actor, project, title, model, git_branch, last_ts, last_kind, last_text, event_count
         FROM sessions ORDER BY last_ts DESC`,
      );
      const now = Date.now();
      return rows.map((r: any) => {
        const lastTs = Number(r.last_ts);
        return {
          actor: r.actor,
          sessionId: r.session_id,
          project: r.project,
          title: r.title ?? undefined,
          model: r.model ?? undefined,
          gitBranch: r.git_branch ?? undefined,
          lastTs,
          lastKind: r.last_kind as EventKind,
          lastText: r.last_text ?? "",
          status: now - lastTs < activeWindowMs ? "active" : "idle",
          eventCount: Number(r.event_count) || 0,
        } satisfies Presence;
      });
    } catch (err) {
      console.error("[PgStore] presence failed:", (err as Error)?.message ?? err);
      return [];
    }
  }

  async stats(): Promise<StoreStats> {
    if (!this.pool) return { events: 0, sessions: 0, actors: 0, since: 0 };
    try {
      const { rows } = await this.pool.query(
        `SELECT
           (SELECT COUNT(*) FROM events)                  AS events,
           (SELECT COUNT(DISTINCT session_id) FROM events) AS sessions,
           (SELECT COUNT(DISTINCT actor) FROM events)      AS actors,
           (SELECT COALESCE(MIN(ts), 0) FROM events)       AS since`,
      );
      const r = rows[0] ?? {};
      return {
        events: Number(r.events) || 0,
        sessions: Number(r.sessions) || 0,
        actors: Number(r.actors) || 0,
        since: Number(r.since) || 0,
      };
    } catch (err) {
      console.error("[PgStore] stats failed:", (err as Error)?.message ?? err);
      return { events: 0, sessions: 0, actors: 0, since: 0 };
    }
  }
}
