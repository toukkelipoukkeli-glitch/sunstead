import { config } from "dotenv"
import cors from "@fastify/cors"
import Fastify from "fastify"
import { registerAdapterRoutes } from "./routes/adapter.js"
import { registerRunRoutes } from "./routes/runs.js"

config({ path: ".env.local" })

const app = Fastify({
  logger: true
})

await app.register(cors, {
  origin: true
})

await registerRunRoutes(app)
await registerAdapterRoutes(app)

app.get("/api/health", async () => ({
  ok: true,
  mode: process.env.DEMO_MODE ?? "fixture"
}))

const port = Number(process.env.PORT ?? 8787)
await app.listen({ port, host: "0.0.0.0" })
