import type { FastifyInstance } from "fastify"
import { applySetupRuntimeConfig, type SetupProfileRequest } from "../state/setupConfig.js"

export const registerSetupRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: SetupProfileRequest }>("/api/setup/profile", async (request, reply) => {
    try {
      return applySetupRuntimeConfig(request.body ?? {})
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid setup profile."
      }
    }
  })
}
