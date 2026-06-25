import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import type { FastifyInstance } from "fastify"
import {
  getGitHubInstallUrl,
  listGitHubInstallationRepositories,
  materializeGitHubSource,
  safeGitHubError
} from "@aiden/github-source"
import type { SetupProfile } from "@aiden/contracts"

const routeDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(routeDir, "../../../../..")

type GitHubRepositoryParams = {
  installationId: string
}

type GitHubImportBody = {
  installationId?: number | string
  repositoryId?: number | string
  owner?: string
  repo?: string
  ref?: string
}

const cleanText = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined)

const positiveInteger = (value: unknown, label: string, required = true) => {
  if (value === undefined || value === null || value === "") {
    if (required) throw new Error(`${label} is required.`)
    return undefined
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`)
  }
  return parsed
}

const githubSetupProfileFor = (input: Awaited<ReturnType<typeof materializeGitHubSource>>): SetupProfile => ({
  sourceKind: "github_repo",
  sourceDataPath: "supabase_db_url",
  aivenWorkspaceMode: "henri_preconnected",
  migrationScope: {
    shadowMigration: true,
    scopedDemoCutover: true,
    productionCutover: "not_requested",
    authMigration: "adapter_required",
    storageMigration: "adapter_required"
  },
  sourceLabel: input.github.fullName,
  workspaceLabel: "Henri pre-connected workspace",
  sourceRoot: input.displayPath,
  github: input.github,
  detectedBehaviors: ["GitHub source import", "Supabase client scan pending"]
})

export const registerGitHubRoutes = async (app: FastifyInstance) => {
  app.get("/api/github/install-url", async () => getGitHubInstallUrl())

  app.get<{ Params: GitHubRepositoryParams }>(
    "/api/github/installations/:installationId/repositories",
    async (request, reply) => {
      try {
        const installationId = positiveInteger(request.params.installationId, "installationId")
        if (installationId === undefined) {
          throw new Error("installationId is required.")
        }
        return {
          repositories: await listGitHubInstallationRepositories(installationId)
        }
      } catch (error) {
        reply.code(400)
        return {
          ok: false,
          error: safeGitHubError(error)
        }
      }
    }
  )

  app.post<{ Body: GitHubImportBody }>("/api/github/source", async (request, reply) => {
    try {
      const owner = cleanText(request.body?.owner)
      const repo = cleanText(request.body?.repo)
      if (!owner || !repo) {
        throw new Error("owner and repo are required.")
      }

      const installationId = positiveInteger(request.body?.installationId, "installationId", false)
      const repositoryId = positiveInteger(request.body?.repositoryId, "repositoryId", false)
      const source = await materializeGitHubSource({
        installationId,
        repositoryId,
        owner,
        repo,
        ref: cleanText(request.body?.ref),
        workspaceRoot: repoRoot
      })
      const setupProfile = githubSetupProfileFor(source)
      return {
        ok: true,
        setupProfile,
        sourceRoot: source.displayPath,
        filesWritten: source.filesWritten,
        bytesWritten: source.bytesWritten,
        github: source.github
      }
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: safeGitHubError(error)
      }
    }
  })
}
