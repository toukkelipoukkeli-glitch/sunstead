import type { AddReactionInput } from "@aiden/contracts"
import type { FastifyInstance } from "fastify"
import { getAdapterRuntime, getPulseWallProvider } from "../state/adapterRuntime.js"

export const registerAdapterRoutes = async (app: FastifyInstance) => {
  app.get("/api/adapter/status", async () => {
    const runtime = getAdapterRuntime()
    return { mode: runtime.mode, runId: runtime.runId }
  })

  app.get("/api/posts", async () => getPulseWallProvider().listPosts())

  app.get("/api/leaderboard", async () => getPulseWallProvider().getLeaderboard())

  app.post<{ Body: AddReactionInput }>("/api/reactions", async (request) => {
    await getPulseWallProvider().addReaction(request.body)
    return { ok: true }
  })

  app.get<{ Querystring: { sinceId?: string; limit?: string } }>("/api/events/recent", async (request) => {
    return getPulseWallProvider().listRecentEvents({
      sinceId: request.query.sinceId,
      limit: request.query.limit ? Number(request.query.limit) : undefined
    })
  })
}
