import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { config } from "dotenv"
import cors from "@fastify/cors"
import Fastify from "fastify"
import { registerAdapterRoutes } from "./routes/adapter.js"
import { registerGitHubRoutes } from "./routes/github.js"
import { registerRunRoutes } from "./routes/runs.js"
import { registerSetupRoutes } from "./routes/setup.js"

const appDir = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(appDir, "../../../../.env.local"), quiet: true })

const app = Fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024
})

await app.register(cors, {
  origin: true
})

await registerRunRoutes(app)
await registerSetupRoutes(app)
await registerGitHubRoutes(app)
await registerAdapterRoutes(app)

app.get("/api/health", async () => ({
  ok: true,
  mode: process.env.DEMO_MODE ?? "fixture"
}))

const port = Number(process.env.PORT ?? 8787)
await app.listen({ port, host: "0.0.0.0" })
