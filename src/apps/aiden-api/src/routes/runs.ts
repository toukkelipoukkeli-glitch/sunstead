import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { resetAdapterRuntime } from "../state/adapterRuntime.js"
import {
  advanceRun,
  createRun,
  getSnapshot,
  pauseRun,
  resetRun,
  runDataMigration,
  runKafkaAgentBus,
  runProviderCutover,
  runProofSpine,
  runSourceScan,
  startFixtureRun,
  subscribe
} from "../state/runStore.js"

type RunParams = {
  runId: string
}

type StepParams = {
  runId: string
  stepName: string
}

export const registerRunRoutes = async (app: FastifyInstance) => {
  app.post("/api/runs", async () => {
    resetAdapterRuntime()
    return createRun()
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/graduate", async (request) => {
    return startFixtureRun(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/proof-spine", async (request) => {
    return runProofSpine(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/source-scan", async (request) => {
    return runSourceScan(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/data-migration", async (request) => {
    return runDataMigration(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/kafka-agent-bus", async (request) => {
    return runKafkaAgentBus(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/provider-cutover", async (request) => {
    return runProviderCutover(request.params.runId)
  })

  app.get<{ Params: RunParams }>("/api/runs/:runId", async (request) => {
    return getSnapshot(request.params.runId)
  })

  app.get<{ Params: RunParams }>("/api/runs/:runId/report", async (request) => {
    return getSnapshot(request.params.runId).report
  })

  app.post<{ Params: StepParams }>("/api/runs/:runId/step/:stepName", async (request) => {
    if (request.params.stepName === "reset") {
      resetAdapterRuntime()
      return resetRun(request.params.runId)
    }
    if (request.params.stepName === "pause") {
      return pauseRun(request.params.runId)
    }
    return advanceRun(request.params.runId)
  })

  app.get<{ Params: RunParams }>("/api/runs/:runId/events", async (request: FastifyRequest<{ Params: RunParams }>, reply: FastifyReply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    })

    const send = (payload: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    for (const event of getSnapshot(request.params.runId).events) {
      send(event)
    }

    const unsubscribe = subscribe(request.params.runId, send)
    request.raw.on("close", () => {
      unsubscribe()
      reply.raw.end()
    })
  })
}
