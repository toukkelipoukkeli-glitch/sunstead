// aiven/embed-backfill.ts — give the migrated posts REAL semantic vectors so pgvector search works.
//
// match_posts() (in overmind-pg) ranks posts by cosine distance over posts.embedding (vector(1536)).
// For that to return sensible nearest-neighbours, every post needs an embedding that places
// semantically-similar text close together. This module produces those vectors and backfills them.
//
// Provider seam (mirrors the rest of Overmind's swappable-provider design):
//   • If an embedding API key is configured (OPENAI_API_KEY or VOYAGE_API_KEY), we call that real
//     model — the proper production path.
//   • If NONE is set, we fall back to a DETERMINISTIC LOCAL embedder: hashed token n-grams projected
//     into a normalized 1536-dim vector. It is NOT a learned model — it captures lexical/character
//     overlap, not deep meaning — but it is stable, dependency-free, and good enough that
//     match_posts() returns meaningful ranked neighbours for the demo. Swap in a real key and this
//     path is never taken.  <<< LOCAL STAND-IN — replace by setting OPENAI_API_KEY / VOYAGE_API_KEY.
//
// Run directly:  tsx aiven/embed-backfill.ts            (backfill all posts, then demo a search)
// Import:        import { embedText, embedBatch, backfillPostEmbeddings, EMBED_DIM } from './embed-backfill.ts'

import { q, q1 } from './pg.ts'

/** pgvector column width on posts.embedding. */
export const EMBED_DIM = 1536

// ───────────────────────── provider detection ─────────────────────────

export type EmbedProvider = 'openai' | 'voyage' | 'local'

export interface EmbedderInfo {
  provider: EmbedProvider
  model: string
  dim: number
  /** true when we're using the deterministic local stand-in (no API key found). */
  local: boolean
}

/** Which embedding backend is active, based purely on env (no network). */
export function detectProvider(): EmbedderInfo {
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', model: 'text-embedding-3-small', dim: EMBED_DIM, local: false }
  }
  if (process.env.VOYAGE_API_KEY) {
    // voyage-3 outputs 1024 dims; we right-pad to EMBED_DIM so it fits the existing column.
    return { provider: 'voyage', model: 'voyage-3', dim: EMBED_DIM, local: false }
  }
  return { provider: 'local', model: 'local-hashed-ngram-v1', dim: EMBED_DIM, local: true }
}

// ───────────────────────── deterministic LOCAL embedder ─────────────────────────
// LOCAL STAND-IN. Tokenize → for each word emit the word + its character 3-grams → hash each
// feature into one of EMBED_DIM buckets (signed) → L2-normalize. Shared words/character runs land
// in the same buckets, so texts that share vocabulary end up with high cosine similarity, while
// unrelated texts stay near-orthogonal. Fully deterministic: same text → same vector, always.

/** FNV-1a 32-bit hash — small, fast, well-distributed. Deterministic across runs/machines. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    // h *= 16777619, kept in 32-bit space via Math.imul
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Lowercase, split on non-alphanumerics, drop empties. */
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Character n-grams of a token (padded), so near-misses ("hype"/"hyped") still overlap. */
function charNGrams(token: string, n = 3): string[] {
  const t = `^${token}$`
  if (t.length <= n) return [t]
  const grams: string[] = []
  for (let i = 0; i + n <= t.length; i++) grams.push(t.slice(i, i + n))
  return grams
}

/** Deterministic local embedding for one string → normalized number[EMBED_DIM]. */
export function localEmbed(text: string, dim = EMBED_DIM): number[] {
  const vec = new Float64Array(dim)
  const tokens = tokenize(text)

  const bump = (feature: string, weight: number) => {
    const h = fnv1a(feature)
    const idx = h % dim
    // Use a second hash bit to pick the sign → reduces systematic bias, keeps it deterministic.
    const sign = (h & 0x80000000) !== 0 ? -1 : 1
    vec[idx] += sign * weight
  }

  for (const tok of tokens) {
    // Whole-word feature (strongest signal for exact lexical matches).
    bump(`w:${tok}`, 2)
    // Character 3-grams (fuzzy/morphological overlap).
    for (const g of charNGrams(tok, 3)) bump(`g:${g}`, 1)
  }
  // Word bigrams (a little phrase-level signal).
  for (let i = 0; i + 1 < tokens.length; i++) bump(`b:${tokens[i]}_${tokens[i + 1]}`, 1.5)

  // L2-normalize so cosine distance (pgvector `<=>`) is well-behaved. Empty text → zero vector
  // (still valid; it just sits far from everything).
  let norm = 0
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  if (norm > 0) for (let i = 0; i < dim; i++) vec[i] /= norm

  return Array.from(vec)
}

// ───────────────────────── real provider calls (used only when a key is set) ─────────────────────────

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  })
  if (!res.ok) throw new Error(`openai embeddings ${res.status}: ${await res.text()}`)
  const json: any = await res.json()
  return json.data.map((d: any) => fitDim(d.embedding))
}

async function voyageEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-3', input: texts }),
  })
  if (!res.ok) throw new Error(`voyage embeddings ${res.status}: ${await res.text()}`)
  const json: any = await res.json()
  return json.data.map((d: any) => fitDim(d.embedding))
}

/** Coerce a provider vector to exactly EMBED_DIM (truncate or zero-pad) so it fits the column. */
function fitDim(v: number[]): number[] {
  if (v.length === EMBED_DIM) return v
  if (v.length > EMBED_DIM) return v.slice(0, EMBED_DIM)
  return v.concat(new Array(EMBED_DIM - v.length).fill(0))
}

// ───────────────────────── unified embed API ─────────────────────────

/** Embed a batch of texts with whatever provider is active. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const info = detectProvider()
  if (info.provider === 'openai') return openaiEmbed(texts)
  if (info.provider === 'voyage') return voyageEmbed(texts)
  return texts.map((t) => localEmbed(t))
}

/** Embed a single text → number[EMBED_DIM]. Used both for backfill and for query-time search. */
export async function embedText(text: string): Promise<number[]> {
  const [v] = await embedBatch([text])
  return v
}

/** pgvector text literal: `[0.1,0.2,...]`. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}

// ───────────────────────── backfill ─────────────────────────

export interface BackfillResult {
  provider: EmbedProvider
  model: string
  updated: number
  total: number
}

/**
 * Embed every post's `body` and UPDATE posts.embedding in overmind-pg.
 * Idempotent: re-running re-embeds and overwrites (safe to call repeatedly).
 * @param connStr  target Aiven PG conn string (defaults to DATABASE_URL via aiven/pg.ts)
 */
export async function backfillPostEmbeddings(connStr?: string): Promise<BackfillResult> {
  const cs = connStr || process.env.DATABASE_URL || ''
  if (!cs) throw new Error('embed-backfill: no connection string (set DATABASE_URL or pass connStr)')

  const info = detectProvider()
  const rows = await q<{ id: string; body: string }>(cs, `select id, body from posts order by created_at`)

  // Embed in modest batches (real providers cap input size; local is instant either way).
  const BATCH = 32
  let updated = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH)
    const vecs = await embedBatch(slice.map((r) => r.body ?? ''))
    for (let j = 0; j < slice.length; j++) {
      await q(cs, `update posts set embedding = $1::vector where id = $2`, [
        toVectorLiteral(vecs[j]),
        slice[j].id,
      ])
      updated++
    }
  }

  return { provider: info.provider, model: info.model, updated, total: rows.length }
}

/**
 * Semantic search over posts via match_posts(). Embeds `query` with the SAME embedder used for the
 * backfill (critical — mixing embedders gives garbage similarities), then calls the SQL function.
 */
export async function searchPosts(
  query: string,
  matchCount = 8,
  connStr?: string,
): Promise<Array<{ body: string; similarity: number; reaction_count: number }>> {
  const cs = connStr || process.env.DATABASE_URL || ''
  const vec = await embedText(query)
  return q(
    cs,
    `select body, reaction_count, similarity from match_posts($1::vector, $2)`,
    [toVectorLiteral(vec), matchCount],
  )
}

// ───────────────────────── CLI: backfill + demo a search ─────────────────────────

async function main() {
  // Load .env.local so DATABASE_URL etc. are present when run via `tsx aiven/embed-backfill.ts`.
  const dotenv = await import('dotenv')
  dotenv.config({ path: new URL('../.env.local', import.meta.url).pathname })

  const info = detectProvider()
  console.log(
    `[embed-backfill] provider=${info.provider} model=${info.model} dim=${info.dim}` +
      (info.local ? '  (LOCAL deterministic stand-in — set OPENAI_API_KEY/VOYAGE_API_KEY for real embeddings)' : ''),
  )

  const res = await backfillPostEmbeddings()
  console.log(`[embed-backfill] embedded + updated ${res.updated}/${res.total} posts.`)

  // Proof: distinct vectors should now equal the number of distinct bodies (not 8 placeholders),
  // and a semantic query should return a sensible ranked list.
  const cs = process.env.DATABASE_URL!
  const distinct = await q1<{ distinct_vecs: number; total: number }>(
    cs,
    `select count(distinct embedding::text)::int distinct_vecs, count(*)::int total from posts`,
  )
  console.log(`[embed-backfill] distinct embeddings now: ${distinct?.distinct_vecs}/${distinct?.total}`)

  const query = 'pure hype'
  console.log(`\n[embed-backfill] match_posts() for query "${query}":`)
  const hits = await searchPosts(query, 8)
  for (const h of hits) {
    console.log(`  ${h.similarity.toFixed(3)}  (${h.reaction_count} reax)  ${h.body}`)
  }

  const { closeAll } = await import('./pg.ts')
  await closeAll()
}

// Run only when invoked directly (not when imported by the orchestrator).
const invokedDirectly =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
if (invokedDirectly) {
  main().catch((e) => {
    console.error('[embed-backfill] failed:', e?.message ?? e)
    process.exit(1)
  })
}
