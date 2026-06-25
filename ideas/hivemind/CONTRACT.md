# Hivemind — build contract (FROZEN)

Shared live context for AI-assisted teams. A local watcher tails every teammate's Claude Code
transcripts (`~/.claude/projects/**/*.jsonl`), normalizes each new record into an `ActivityEvent`,
publishes it on a **Bus** (local fan-out, or **Aiven Kafka**), persists it in a **Store**
(in-memory JSONL, or **Aiven Postgres + pgvector**), and pushes it to a web dashboard over SSE —
plus semantic-ish "has anyone on the team already done X?" search.

## Runtime rules (do not violate)
- **Node ≥ 22.18 (target Node 26)**, ESM, TypeScript run directly via type-stripping (`node src/index.ts`).
- **Internal imports MUST include the `.ts` extension**: `import { parseRecord } from "./parse.ts";`
- **Built-ins use the `node:` prefix**: `node:fs`, `node:fs/promises`, `node:path`, `node:os`, `node:http`, `node:crypto`.
- **Core modules use ZERO external deps.** Only `parse.ts`, `watcher.ts`, `server.ts`, `simulate.ts`,
  `index.ts`, the in-memory store, the local bus, and the lexical embedder run in the default path.
- **Aiven adapters load deps lazily**: inside `KafkaBus`/`PgStore`, do
  `const { Kafka } = await import("kafkajs");` / `const pg = await import("pg");` inside try/catch and
  throw a friendly error telling the user to `npm i kafkajs` / `npm i pg` if missing. Never top-level-import them.
- Everything reads `Config` (from `config.ts`); never read `process.env` outside `config.ts`.
- Keep it dependency-light and readable; this is a hackathon prototype, not production.

## Files to build (each agent owns disjoint files — never edit another's file or the FROZEN ones)
FROZEN (already written, import from them): `src/types.ts`, `src/config.ts`, `package.json`, `tsconfig.json`, `aiven/schema.sql`.

1. `src/parse.ts` — transcript record → `ActivityEvent | null`
2. `src/watcher.ts` — tail `~/.claude/projects/**/*.jsonl`
3. `src/bus.ts` — `LocalBus` + `KafkaBus` (Aiven)
4. `src/store.ts` — `MemoryStore` + `PgStore` (Aiven), plus presence/search
5. `src/embed.ts` — `LexicalEmbedder` + `RemoteEmbedder`
6. `src/server.ts` — Node `http` server: SSE + REST + static web files
7. `src/simulate.ts` — fake teammates for demos
8. `src/index.ts` — wire Config → bus/store/watcher/server/(sim)
9. `web/index.html`, `web/app.js`, `web/style.css` — dashboard

---

## `src/parse.ts`
```ts
import type { ActivityEvent } from "./types.ts";
export interface ParseCtx { actor: string; redactSecrets: boolean; }
/** Parse ONE raw transcript record (already JSON.parsed). Returns an event, or null to skip. */
export function parseRecord(rec: any, ctx: ParseCtx): ActivityEvent | null;
/** Redact obvious secrets (sk-..., ghp_..., AKIA..., Bearer tokens, long hex/jwt) from text. */
export function redact(text: string): string;
```
Claude Code record shape (verified):
- top-level: `type`, `sessionId`, `timestamp` (ISO string), `uuid`, `cwd`, `gitBranch`, `message`.
- `type:"user"` → `message.content` is a **string** (human prompt) OR an **array** of blocks (often `tool_result`).
- `type:"assistant"` → `message.model`, `message.content` is an array of blocks: `thinking` | `text` | `tool_use` (`{type,name,input}`).
- other types: `attachment`, `system`, `queue-operation`, `mode`, `custom-title`, `ai-title`, `last-prompt`.

Mapping rules:
- `id` = `rec.uuid` if present, else `${sessionId}:${hash(JSON.stringify(rec)).slice(0,12)}`.
- `ts` = `Date.parse(rec.timestamp)` if valid, else `Date.now()` passed in by caller is NOT available — use `Date.parse` or fall back to `0` and let the caller stamp. (Caller may overwrite ts=now for live tails; see watcher.)
- `project` = basename of `rec.cwd` if present, else `"unknown"`. `cwd`, `gitBranch` copied through.
- `model` from `rec.message.model` when present.
- **`thinking` blocks are ALWAYS skipped** (private + noisy).
- For `assistant`: pick the FIRST meaningful block. If a `text` block → `kind:"assistant"`, `text` = trimmed first ~280 chars. If `tool_use` → `kind:"tool_use"`, `tool` = block.name, `text` = `"<Tool> <hint>"` where hint is derived from common input keys: Bash→`input.description||input.command`, Read/Edit/Write→`input.file_path`, Grep→`input.pattern`, WebSearch/WebFetch→`input.query||input.url`, Task/Agent→`input.description`; otherwise the first string-valued input field. Truncate to ~120 chars. If both text and tool_use exist in one record, prefer emitting the tool_use (more informative); if only thinking, return null.
- For `user` with string content: skip system-injected noise (content starting with `"Caveat:"`, `"Shell cwd was reset"`, `"<"`, or containing `"[Request interrupted"`). Otherwise `kind:"user"`, `text` = trimmed first ~280 chars.
- For `user` with array content (tool_result): `kind:"tool_result"`, `text` = `"↳ result"` (+ tool name if discoverable). Keep it short; the UI de-emphasizes these.
- `custom-title`/`ai-title` → `kind:"title"`, `text` = the title string (`rec.customTitle||rec.aiTitle||rec.title`). Used to label sessions.
- `attachment`, `system`, `queue-operation`, `mode`, `last-prompt` → return null.
- Apply `redact()` to `text` when `ctx.redactSecrets`.
- `actor` always = `ctx.actor`.

## `src/watcher.ts`
```ts
import type { Config } from "./config.ts";
import type { ActivityEvent } from "./types.ts";
export interface Watcher { start(): Promise<void>; stop(): Promise<void>; }
/** Tails *.jsonl under config.projectsDir; calls onEvent for every NEW parsed record. */
export function createWatcher(config: Config, onEvent: (e: ActivityEvent) => void): Watcher;
```
- Recursively find `*.jsonl` under `config.projectsDir` (use `fs.promises.readdir(..., {recursive:true})`).
- Track a byte offset per file. On startup: for each file, replay only the **last `config.backfill`** records
  (read whole file, split lines, take last N) and set offset to EOF. (Backfill events keep their parsed `ts`.)
- Watch with `fs.watch(projectsDir, {recursive:true})` AND a 1s poll over known files comparing `stat.size`
  (fs.watch is unreliable on macOS for nested files — poll is the source of truth; watch just nudges).
- On growth: read bytes `[offset, size)`, decode utf-8, split on `\n`, JSON.parse each complete line
  (buffer any trailing partial line until the next read), `parseRecord`, and for **live** (non-backfill)
  events stamp `ts = Date.now()` so the feed orders by arrival. Skip nulls. Swallow JSON/parse errors per-line.
- Detect new files on each poll (file count / new names) and start tailing them (offset 0, no backfill — they're new, tail all).
- `stop()` clears the interval and closes the FSWatcher.

## `src/bus.ts`
```ts
import type { Bus, ActivityEvent } from "./types.ts"; // ActivityEvent re-import from types
import type { Config } from "./config.ts";
export function createBus(config: Config): Bus; // returns LocalBus or KafkaBus per config.busKind
```
- **LocalBus**: in-process fan-out. `publish` → call every subscriber (async, never throw to caller).
  `subscribe` returns unsubscribe. `start`/`stop` are no-ops.
- **KafkaBus** (config.busKind==="kafka"): lazy `import("kafkajs")`. Build `new Kafka({ brokers, ssl, sasl })`
  using `config.kafka`. `start()` connects a producer AND a consumer (consumer in its own group, subscribes
  to `config.kafka.topic`, `fromBeginning:false`); each consumed message → JSON.parse → call subscribers
  (so every teammate's events arrive locally). `publish` → producer.send to the topic (key = actor).
  This is what makes Kafka the real cross-machine team bus. Friendly error if kafkajs missing.

## `src/store.ts`
```ts
import type { Store, ActivityEvent, Presence, SearchHit } from "./types.ts";
import type { Config } from "./config.ts";
import type { Embedder } from "./types.ts";
export function createStore(config: Config, embedder: Embedder): Store; // MemoryStore or PgStore
```
- **MemoryStore**: array of events (cap ~5000, drop oldest), `Map` dedupe on id. Persist by appending each
  event as a JSON line to `config.dataFile` (ensure dir exists); on `init()` load existing lines if present.
  - `recent(n)`: last n by ts desc. `presence(win)`: reduce events → one row per (actor+sessionId) with newest
    event; `title` = latest `kind:"title"` text for that session; `status` = active if `Date.now()-lastTs<win`.
    Sort by lastTs desc. `eventCount` per session.
  - `search(q,n)`: lexical. Lowercase-tokenize q; score each event by token overlap in `text`+`project`+`tool`
    (term frequency, small bonus for exact phrase). Return top n with `score` normalized to 0..1 and a `snippet`.
- **PgStore** (config.storeKind==="postgres"): lazy `import("pg")`, `new pg.Pool({connectionString, ssl:{rejectUnauthorized:false}})`.
  `init()` does NOT run DDL (schema.sql is applied out of band) but may `CREATE EXTENSION`/tables idempotently if you prefer — safer to just verify connectivity.
  - `insert`: upsert into `events` (ON CONFLICT (id) DO NOTHING). If `embedder` is a RemoteEmbedder (dim matches),
    compute embedding and store as a `vector` literal `'[...]'`; else leave null. Upsert `sessions` row (last_* fields, event_count = event_count+1, title only when kind="title").
  - `recent`: `SELECT ... ORDER BY ts DESC LIMIT n`.
  - `presence`: `SELECT * FROM sessions ORDER BY last_ts DESC`; map to Presence, status by window.
  - `search`: if embeddings present/embedder real → `ORDER BY embedding <=> $queryvec LIMIT n` (cosine), score = 1-distance.
    Else → full-text: `WHERE tsv @@ plainto_tsquery($q) ORDER BY ts_rank DESC`. Always degrade gracefully to recent() on error.
  - Map snake_case rows ↔ camelCase `ActivityEvent`/`Presence`.

## `src/embed.ts`
```ts
import type { Embedder } from "./types.ts";
import type { Config } from "./config.ts";
export function createEmbedder(config: Config): Embedder; // RemoteEmbedder if config.embed set, else LexicalEmbedder
export class LexicalEmbedder implements Embedder { readonly dim: number; embed(t:string):Promise<number[]>; }
```
- **LexicalEmbedder**: deterministic hashed bag-of-words vector of `config.embed?.dim ?? 256`. Tokenize, for each
  token bump `vec[hash(token)%dim] += 1`, L2-normalize. No network. (Lets pgvector do lexical-ish cosine offline.)
- **RemoteEmbedder**: POST to `config.embed.url` with `{ input, model }` and `Authorization: Bearer key`
  (OpenAI-compatible response `{data:[{embedding}]}`). Used only by PgStore when configured.

## `src/server.ts`
```ts
import type { Config } from "./config.ts";
import type { Bus, Store, ActivityEvent } from "./types.ts";
export interface HivemindServer { start(): Promise<void>; stop(): Promise<void>; ingest(e: ActivityEvent): void; }
export function createServer(config: Config, bus: Bus, store: Store): HivemindServer;
```
- Node `http.createServer`. Routes:
  - `GET /` → serve `web/index.html`; `GET /app.js`, `GET /style.css` → serve from `web/` with correct content-type.
  - `GET /api/feed?limit=` → JSON `ActivityEvent[]` from `store.recent`.
  - `GET /api/presence` → JSON `Presence[]` from `store.presence(config.activeWindowMs)`.
  - `GET /api/search?q=&limit=` → JSON `SearchHit[]`.
  - `GET /api/stats` → JSON `Stats` (store.stats + bus/store kind).
  - `GET /events` → **SSE** stream. On connect: send `{type:"snapshot", feed, presence, stats}`. Keep the
    `res` in a Set of clients; heartbeat `: ping\n\n` every 15s; cleanup on `close`.
- `ingest(e)`: `store.insert(e)` then broadcast `{type:"event", event:e}` to SSE clients; throttle presence/stats
  recompute (e.g. at most every 500ms) and broadcast `{type:"presence",...}` / `{type:"stats",...}`.
- The server SUBSCRIBES to the bus in index.ts (not here) — index wires `bus.subscribe(e => server.ingest(e))`.
- SSE framing: each message is `data: ${JSON.stringify(msg)}\n\n`.

## `src/simulate.ts`
```ts
import type { Config } from "./config.ts";
import type { ActivityEvent } from "./types.ts";
export interface Simulator { start(): void; stop(): void; }
/** Emits believable fake teammate events (2-3 personas, different projects) on a timer. */
export function createSimulator(config: Config, emit: (e: ActivityEvent) => void): Simulator;
```
- 2–3 fake actors (e.g. "Aino", "Mikael", "Sofia") each with a project + session id + rotating realistic
  events (user prompts, assistant replies, tool_use like Bash/Read/Edit, occasional title). Emit one every
  ~1.5–3.5s with `ts:Date.now()`. Used so the dashboard is alive in a one-laptop demo. Deterministic-ish
  (no Math.random reliance is fine here — Node has Math.random; vary by an incrementing index + modulo).

## `src/index.ts`
- `const config = loadConfig();`
- `const embedder = createEmbedder(config); const bus = createBus(config); const store = createStore(config, embedder);`
- `await store.init(); await bus.start();`
- `const server = createServer(config, bus, store); bus.subscribe(e => server.ingest(e)); await server.start();`
- `const watcher = createWatcher(config, e => bus.publish(e)); await watcher.start();`
- if `config.demo`: `createSimulator(config, e => bus.publish(e)).start();`
- Log a clear banner: URL, actor, bus, store, projectsDir, demo on/off.
- Handle SIGINT: stop watcher/bus/server, exit.

## `web/` dashboard
- `index.html` loads `style.css` + `app.js`, connects to `/events` via `EventSource`.
- Three regions: **left** = "Team" presence cards (actor, project, title, status dot, last activity, model);
  **center** = live **activity feed** (newest on top, color-coded by kind, tool events show the tool name, a
  thin "actor • project • relative time" line); **top** = a **search bar** ("Has anyone on the team…?") that
  hits `/api/search` and shows ranked hits with snippet + who/when.
- Render the `snapshot` first, then append on `event`, replace presence on `presence`, update a small stats
  footer on `stats`. Smooth, dark, modern; relative timestamps ("12s ago"); auto-scroll feed unless user scrolled up.
- Vanilla JS only (no build step). Make it look genuinely good — this is the demo surface.

## Verification (the build is "done" when)
- `node src/index.ts` starts, prints the banner, listens on the port.
- `GET /api/stats`, `/api/feed`, `/api/presence`, `/api/search?q=test` all return valid JSON.
- With `HIVEMIND_DEMO=1`, `/api/feed` fills with simulated events within a few seconds and `/api/presence` shows fake teammates.
- Pointing at the real `~/.claude/projects` produces real events (the watcher parses actual transcripts).
- No external dependency is required for any of the above.
