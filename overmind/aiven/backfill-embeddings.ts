// aiven/backfill-embeddings.ts — populate posts.embedding so pgvector semantic search works.
//
// Context: the migrated schema has `embedding vector(1536)` on posts and a match_posts() RPC that
// ranks by cosine distance, but the column was never backfilled (all 40 rows NULL), so search
// returned 0 rows. The generated runtime path (generated/server/embeddings.ts) calls OpenAI's
// text-embedding-3-small — but no OPENAI_API_KEY is configured (only ANTHROPIC_API_KEY, and
// Anthropic has no embeddings endpoint). Rather than block on a hosted provider, we embed locally
// with a deterministic feature-hashing model: real 1536-dim vectors, genuine lexical-semantic
// ranking, no external dependency, fully reproducible. Swap in a hosted embedder later by
// replacing embedText() — the column, index, and RPC are identical.
//
// Run from the overmind/ dir:  npx tsx aiven/backfill-embeddings.ts
// (import order matters: ../server/env.ts loads .env.local before we read DATABASE_URL)

import '../server/env.ts'
import { q, q1 } from './pg.ts'

const DIM = 1536

// ── deterministic local embedding ───────────────────────────────────────────────────────────
// Signed feature hashing (a.k.a. the "hashing trick"): map text features into DIM buckets, with a
// separate sign hash per feature to cancel collision bias. Features = word unigrams + word bigrams
// (topical overlap) + character trigrams (morphological robustness, so "love"/"loving" partially
// align). Weight by sublinear term frequency, then L2-normalize so cosine similarity is clean.

/** FNV-1a 32-bit — stable string hash, no Math.random, identical across runs/machines. */
function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function features(text: string): string[] {
  const tokens = (text.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((t) => t.length > 0)
  const feats: string[] = []
  // word unigrams
  for (const t of tokens) feats.push(`w:${t}`)
  // word bigrams
  for (let i = 0; i + 1 < tokens.length; i++) feats.push(`b:${tokens[i]}_${tokens[i + 1]}`)
  // character trigrams over each token (padded so prefixes/suffixes are captured)
  for (const t of tokens) {
    const p = `^${t}$`
    for (let i = 0; i + 3 <= p.length; i++) feats.push(`c:${p.slice(i, i + 3)}`)
  }
  return feats
}

function embedText(text: string): number[] {
  const vec = new Float64Array(DIM)
  const counts = new Map<string, number>()
  for (const f of features(text)) counts.set(f, (counts.get(f) ?? 0) + 1)

  for (const [feat, tf] of counts) {
    const h = fnv1a(feat)
    const bucket = h % DIM
    const sign = (fnv1a(feat, 0x01000193) & 1) === 0 ? 1 : -1
    // sublinear tf damps very repetitive tokens
    vec[bucket] += sign * (1 + Math.log(tf))
  }

  // L2-normalize → unit vector (cosine distance then ranks purely by direction)
  let norm = 0
  for (let i = 0; i < DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm) || 1
  const out = new Array<number>(DIM)
  for (let i = 0; i < DIM; i++) out[i] = Number((vec[i] / norm).toFixed(6))
  return out
}

/** pgvector literal: "[a,b,c,...]" */
function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}

// ── backfill ────────────────────────────────────────────────────────────────────────────────
async function main() {
  const connStr = process.env.DATABASE_URL
  if (!connStr) throw new Error('DATABASE_URL not set (expected in .env.local)')

  const posts = await q<{ id: string; body: string }>(
    connStr,
    'select id, body from posts order by created_at',
  )
  console.log(`[backfill] ${posts.length} posts to embed (dim=${DIM}, model=local-feature-hash)`)

  let n = 0
  for (const p of posts) {
    const lit = toVectorLiteral(embedText(p.body ?? ''))
    await q(connStr, 'update posts set embedding = $1::vector where id = $2', [lit, p.id])
    n++
  }
  console.log(`[backfill] updated ${n} rows`)

  // ── verify ──
  const cov = await q1<{ total: string; embedded: string }>(
    connStr,
    'select count(*)::text total, count(embedding)::text embedded from posts',
  )
  console.log(`[verify] coverage: ${cov?.embedded}/${cov?.total} posts embedded`)

  const probe = await q1<{ id: string }>(connStr, 'select id from posts where embedding is not null limit 1')
  const ranked = await q<{ id: string; similarity: number }>(
    connStr,
    'select id, similarity from match_posts((select embedding from posts where id = $1), 5)',
    [probe?.id],
  )
  console.log(`[verify] match_posts returned ${ranked.length} ranked rows (top sim=${ranked[0]?.similarity?.toFixed(4)})`)

  // ── demo: a real free-text query, embedded the same way, ranked by semantic-ish overlap ──
  const query = 'I love this new feature, it is amazing'
  const qlit = toVectorLiteral(embedText(query))
  const demo = await q<{ author_handle: string; body: string; similarity: number }>(
    connStr,
    'select author_handle, body, similarity from match_posts($1::vector, 3)',
    [qlit],
  )
  console.log(`\n[demo] query: "${query}"`)
  for (const r of demo) {
    console.log(`  ${r.similarity.toFixed(4)}  @${r.author_handle}: ${r.body.slice(0, 70)}`)
  }

  const ok = Number(cov?.embedded) === Number(cov?.total) && ranked.length > 0
  console.log(`\n[result] ${ok ? 'PASS ✅' : 'FAIL ❌'} — embeddings backfilled, semantic search live`)
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error('[backfill] error:', e)
  process.exit(1)
})
