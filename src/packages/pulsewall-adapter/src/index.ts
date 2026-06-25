import { randomUUID } from "node:crypto"
import type {
  AddReactionInput,
  LeaderboardRow,
  Post,
  PulseWallEvent,
  PulseWallProvider
} from "@aiden/contracts"
import { appEvents as fixtureAppEvents, fixtureRunId, posts as fixturePosts } from "@aiden/fixtures"
import pg from "pg"

const { Client } = pg

const clonePosts = (): Post[] => fixturePosts.map((post) => ({ ...post }))
const cloneEvents = (): PulseWallEvent[] =>
  fixtureAppEvents.map((event) => ({ ...event, payload: { ...event.payload } }))

let posts: Post[] = clonePosts()
let events: PulseWallEvent[] = cloneEvents()

const rankPosts = (): LeaderboardRow[] =>
  posts
    .map((post) => ({
      postId: post.id,
      body: post.body,
      authorHandle: post.authorHandle,
      reactionCount: post.reactionCount,
      rank: 0
    }))
    .sort((a, b) => b.reactionCount - a.reactionCount)
    .map((row, index) => ({ ...row, rank: index + 1 }))

export const stubPulseWallProvider: PulseWallProvider = {
  async listPosts() {
    return [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  },

  async getLeaderboard() {
    return rankPosts()
  },

  async addReaction(input: AddReactionInput) {
    const post = posts.find((candidate) => candidate.id === input.postId)
    if (!post) {
      throw new Error(`Unknown post: ${input.postId}`)
    }

    post.reactionCount += 1
    const now = new Date().toISOString()
    events.unshift({
      id: `event_${String(events.length + 1).padStart(3, "0")}`,
      runId: fixtureRunId,
      eventType: "post.reaction_added",
      entityType: "reaction",
      entityId: `reaction_${Date.now()}`,
      payload: {
        postId: input.postId,
        emoji: input.emoji,
        userId: input.userId ?? "demo_user",
        source_behavior: "supabase_realtime",
        target: "aiven_postgres.app_events",
        browser_bridge: "/api/events/recent"
      },
      createdAt: now
    })
  },

  async listRecentEvents(input: { sinceId?: string; limit?: number }) {
    const limit = Math.max(1, Math.min(input.limit ?? 20, 50))
    if (!input.sinceId) {
      return events.slice(0, limit)
    }

    const index = events.findIndex((event) => event.id === input.sinceId)
    if (index < 0) {
      return events.slice(0, limit)
    }

    return events.slice(0, index).slice(0, limit)
  }
}

export const resetStubPulseWallProvider = () => {
  posts = clonePosts()
  events = cloneEvents()
}

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const createClient = () =>
  new Client({
    connectionString: readEnv("AIVEN_POSTGRES_URL")!,
    ssl:
      readEnv("AIVEN_POSTGRES_SSL") === "false"
        ? undefined
        : { rejectUnauthorized: readEnv("AIVEN_POSTGRES_SSL_REJECT_UNAUTHORIZED") === "true" }
  })

const timestamp = (value: unknown) => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return new Date().toISOString()
}

const normalizeEventType = (value: unknown): PulseWallEvent["eventType"] => {
  if (value === "post.created" || value === "leaderboard.updated") return value
  return "post.reaction_added"
}

const normalizeEntityType = (value: unknown): PulseWallEvent["entityType"] => {
  if (value === "post" || value === "leaderboard") return value
  return "reaction"
}

const mapPost = (row: {
  id: string
  body: string
  author_handle: string
  image_url: string | null
  reaction_count: number
  created_at: Date | string
}): Post => ({
  id: row.id,
  body: row.body,
  authorHandle: row.author_handle,
  imageUrl: row.image_url ?? undefined,
  reactionCount: row.reaction_count,
  createdAt: timestamp(row.created_at)
})

const withClient = async <T>(operation: (client: InstanceType<typeof Client>) => Promise<T>) => {
  const client = createClient()
  try {
    await client.connect()
    return await operation(client)
  } finally {
    await client.end().catch(() => undefined)
  }
}

export const isAivenPulseWallConfigured = () => Boolean(readEnv("AIVEN_POSTGRES_URL"))

export const createAivenPulseWallProvider = ({ runId = fixtureRunId }: { runId?: string } = {}): PulseWallProvider => ({
  async listPosts() {
    return withClient(async (client) => {
      const result = await client.query<{
        id: string
        body: string
        author_handle: string
        image_url: string | null
        reaction_count: number
        created_at: Date
      }>(
        `
        select id, body, author_handle, image_url, reaction_count, created_at
        from posts
        order by created_at desc
        limit 60
        `
      )
      return result.rows.map(mapPost)
    })
  },

  async getLeaderboard() {
    return withClient(async (client) => {
      const result = await client.query<{
        id: string
        body: string
        author_handle: string
        reaction_count: number
      }>(
        `
        select id, body, author_handle, reaction_count
        from posts
        order by reaction_count desc, created_at desc
        limit 20
        `
      )
      return result.rows.map((row, index): LeaderboardRow => ({
        postId: row.id,
        body: row.body,
        authorHandle: row.author_handle,
        reactionCount: row.reaction_count,
        rank: index + 1
      }))
    })
  },

  async addReaction(input: AddReactionInput) {
    await withClient(async (client) => {
      const reactionId = `reaction_runtime_${Date.now()}_${randomUUID().slice(0, 8)}`
      const eventId = `app_event_runtime_${Date.now()}_${randomUUID().slice(0, 8)}`
      const userId = input.userId ?? "demo_user_001"
      const emoji = input.emoji || "rocket"
      await client.query("begin")
      try {
        await client.query(
          `
          insert into reactions (id, post_id, user_id, emoji, created_at)
          values ($1, $2, $3, $4, now())
          `,
          [reactionId, input.postId, userId, emoji]
        )
        await client.query("update posts set reaction_count = reaction_count + 1 where id = $1", [input.postId])
        await client.query(
          `
          insert into app_events (id, run_id, event_type, entity_type, entity_id, payload, created_at)
          values ($1, $2, 'post.reaction_added', 'reaction', $3, $4::jsonb, now())
          `,
          [
            eventId,
            runId,
            reactionId,
            JSON.stringify({
              postId: input.postId,
              emoji,
              userId,
              source_behavior: "supabase_realtime",
              target: "aiven_postgres.app_events",
              browser_bridge: "/api/events/recent"
            })
          ]
        )
        await client.query("commit")
      } catch (error) {
        await client.query("rollback").catch(() => undefined)
        throw error
      }
    })
  },

  async listRecentEvents(input: { sinceId?: string; limit?: number }) {
    return withClient(async (client) => {
      const limit = Math.max(1, Math.min(input.limit ?? 20, 50))
      const result = await client.query<{
        id: string
        run_id: string
        event_type: string
        entity_type: string | null
        entity_id: string
        payload: Record<string, unknown>
        created_at: Date
      }>(
        `
        select id, run_id, event_type, entity_type, entity_id, payload, created_at
        from app_events
        where run_id = $1
          and ($2::text is null or created_at > coalesce((select created_at from app_events where id = $2), '-infinity'::timestamptz))
        order by created_at desc, id desc
        limit $3
        `,
        [runId, input.sinceId ?? null, limit]
      )
      return result.rows.map((row): PulseWallEvent => ({
        id: row.id,
        runId: row.run_id,
        eventType: normalizeEventType(row.event_type),
        entityType: normalizeEntityType(row.entity_type),
        entityId: row.entity_id,
        payload: row.payload ?? {},
        createdAt: timestamp(row.created_at)
      }))
    })
  }
})
