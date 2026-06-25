import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { q, q1 } from './db.ts'
import { bearer, getUserFromToken, requestCode, verifyCode, signToken } from './auth.ts'
import { publish, onEvent, busMode } from './bus.ts'
import { embed, embeddingsEnabled, toVectorLiteral } from './embeddings.ts'
import { putImage, getImage } from './storage.ts'
import type { Post, SearchResult, User } from '../shared/types.ts'

const POST_COLS = 'id, author_id, author_handle, body, image_url, reaction_count, created_at'

export const api = new Hono()

async function authUser(c: any): Promise<User | null> {
  return getUserFromToken(bearer(c.req.header('Authorization')))
}

// ── Health / stats (drives the header counter + status badges) ──────────────────
api.get('/health', (c) => c.json({ ok: true, bus: busMode(), embeddings: embeddingsEnabled() }))

api.get('/stats', async (c) => {
  const [posts] = await q<{ n: string }>('select count(*)::text n from posts')
  const [reactions] = await q<{ n: string }>('select count(*)::text n from reactions')
  return c.json({
    posts: Number(posts?.n ?? 0),
    reactions: Number(reactions?.n ?? 0),
    bus: busMode(),
    embeddings: embeddingsEnabled(),
  })
})

// ── Auth (our own — replaces Supabase GoTrue) ───────────────────────────────────
api.post('/auth/request', async (c) => {
  const { email } = await c.req.json()
  if (!email || typeof email !== 'string') return c.json({ error: 'email required' }, 400)
  const code = await requestCode(email.toLowerCase().trim())
  console.log(`[auth] magic code for ${email}: ${code}`)
  const dev = process.env.AUTH_DEV === 'true'
  return c.json({ ok: true, ...(dev ? { code } : {}) })
})

api.post('/auth/verify', async (c) => {
  const { email, code } = await c.req.json()
  const user = await verifyCode(String(email).toLowerCase().trim(), String(code).trim())
  if (!user) return c.json({ error: 'invalid or expired code' }, 401)
  return c.json({ token: signToken(user.id, user.email), user })
})

api.get('/me', async (c) => {
  const user = await authUser(c)
  return c.json({ user })
})

// ── Posts ───────────────────────────────────────────────────────────────────────
api.get('/posts', async (c) => {
  const posts = await q<Post>(`select ${POST_COLS} from posts order by created_at desc limit 50`)
  return c.json({ posts })
})

api.post('/posts', async (c) => {
  const user = await authUser(c)
  if (!user) return c.json({ error: 'sign in to post' }, 401)
  const { body, image_id } = await c.req.json()
  const text = String(body ?? '').trim()
  if (!text || text.length > 280) return c.json({ error: 'body must be 1–280 chars' }, 400)
  const image_url = image_id ? `/api/images/${image_id}` : null

  const post = await q1<Post>(
    `insert into posts (author_id, author_handle, body, image_url)
     values ($1, $2, $3, $4) returning ${POST_COLS}`,
    [user.id, user.handle, text, image_url],
  )
  if (!post) return c.json({ error: 'insert failed' }, 500)

  await publish({ type: 'post.created', post })

  // Embed in the background → semantic search (fire-and-forget).
  void (async () => {
    const v = await embed(text)
    if (v) await q('update posts set embedding = $1 where id = $2', [toVectorLiteral(v), post.id])
  })()

  return c.json({ post })
})

api.post('/posts/:id/react', async (c) => {
  const user = await authUser(c)
  if (!user) return c.json({ error: 'sign in to react' }, 401)
  const postId = c.req.param('id')
  const emoji = (await c.req.json().catch(() => ({})))?.emoji ?? '🔥'

  await q('insert into reactions (post_id, user_id, emoji) values ($1, $2, $3)', [postId, user.id, emoji])
  const row = await q1<{ reaction_count: number }>('select reaction_count from posts where id = $1', [postId])
  const reaction_count = row?.reaction_count ?? 0

  await publish({ type: 'reaction.created', post_id: postId, reaction_count, emoji })
  return c.json({ reaction_count })
})

// ── Leaderboard ─────────────────────────────────────────────────────────────────
api.get('/leaderboard', async (c) => {
  const posts = await q<Post>(`select ${POST_COLS} from posts order by reaction_count desc, created_at desc limit 20`)
  return c.json({ posts })
})

// ── Semantic search (Aiven pgvector) ────────────────────────────────────────────
api.post('/search', async (c) => {
  const { query } = await c.req.json()
  const text = String(query ?? '').trim()
  if (!text) return c.json({ results: [] })
  if (!embeddingsEnabled()) return c.json({ error: 'search disabled (set OPENAI_API_KEY)', results: [] }, 200)
  const v = await embed(text)
  if (!v) return c.json({ error: 'embedding failed', results: [] }, 200)
  const results = await q<SearchResult>('select * from match_posts($1, 12)', [toVectorLiteral(v)])
  return c.json({ results })
})

// ── Realtime: Kafka → SSE ────────────────────────────────────────────────────────
api.get('/stream', (c) =>
  streamSSE(c, async (stream) => {
    await stream.writeSSE({ event: 'hello', data: JSON.stringify({ bus: busMode() }) })
    const off = onEvent((e) => {
      stream.writeSSE({ event: 'pulse', data: JSON.stringify(e) }).catch(() => {})
    })
    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: 'ping', data: '1' }).catch(() => {})
    }, 25000)
    stream.onAbort(() => {
      off()
      clearInterval(heartbeat)
    })
    // keep the stream open
    while (!stream.aborted) {
      await stream.sleep(60000)
    }
  }),
)

// ── Images (Aiven PG bytea — replaces Supabase Storage) ─────────────────────────
api.post('/images', async (c) => {
  const user = await authUser(c)
  if (!user) return c.json({ error: 'sign in to upload' }, 401)
  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) return c.json({ error: 'file required' }, 400)
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length > 5 * 1024 * 1024) return c.json({ error: 'image too large (max 5MB)' }, 400)
  const id = await putImage(buf, file.type || 'image/jpeg', user.id)
  return c.json({ id, url: `/api/images/${id}` })
})

api.get('/images/:id', async (c) => {
  const img = await getImage(c.req.param('id'))
  if (!img) return c.notFound()
  return new Response(img.bytes, {
    headers: { 'Content-Type': img.mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
  })
})

// ── CTO agent recommendations (written by cto/agent.ts off real Aiven metrics) ──
api.get('/cto', async (c) => {
  const recs = await q('select * from cto_recommendations order by created_at desc limit 10')
  return c.json({ recommendations: recs })
})
