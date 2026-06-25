import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { SetupProfile } from "@aiden/contracts"
import { resetAdapterRuntime } from "../state/adapterRuntime.js"
import { applySetupRuntimeConfig } from "../state/setupConfig.js"
import {
  advanceRun,
  createRun,
  getSnapshot,
  pauseRun,
  resetRun,
  runAccessPreflight,
  runDataMigration,
  runKafkaAgentBus,
  runOneClickGraduate,
  runProviderCutover,
  runProofSpine,
  runSourceScan,
  startFixtureRun,
  subscribe
} from "../state/runStore.js"

type RunParams = {
  runId: string
}

type CreateRunBody = {
  setupProfile?: Partial<SetupProfile>
  sourceDbUrl?: string
  sourceTables?: string
  sourceCopyLimit?: string
  sourceSslDisabled?: boolean
}

type StepParams = {
  runId: string
  stepName: string
}

export const registerRunRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: CreateRunBody }>("/api/runs", async (request) => {
    applySetupRuntimeConfig(request.body ?? {})
    resetAdapterRuntime()
    return createRun({ setupProfile: request.body?.setupProfile })
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/graduate", async (request) => {
    resetAdapterRuntime()
    return runOneClickGraduate(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/graduate-fixture", async (request) => {
    resetAdapterRuntime()
    return startFixtureRun(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/proof-spine", async (request) => {
    return runProofSpine(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/source-scan", async (request) => {
    return runSourceScan(request.params.runId)
  })

  app.post<{ Params: RunParams }>("/api/runs/:runId/access-preflight", async (request) => {
    return runAccessPreflight(request.params.runId)
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
