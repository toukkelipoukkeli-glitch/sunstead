import { randomUUID } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import type { FastifyInstance } from "fastify"
import {
  applyGitHubManifestConversionToEnv,
  buildGitHubAppManifest,
  exchangeGitHubManifestCode,
  getGitHubInstallUrl,
  listGitHubInstallationRepositories,
  materializeGitHubSource,
  safeGitHubError
} from "@aiden/github-source"
import type { SetupProfile } from "@aiden/contracts"

const routeDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(routeDir, "../../../../..")
const envLocalPath = resolve(repoRoot, ".env.local")

const manifestStates = new Map<string, { setupUrl: string; createdAt: number }>()

type GitHubRepositoryParams = {
  installationId: string
}

type GitHubManifestStartQuery = {
  setupUrl?: string
}

type GitHubManifestCompleteBody = {
  code?: string
  state?: string
  setupUrl?: string
}

type GitHubImportBody = {
  installationId?: number | string
  repositoryId?: number | string
  owner?: string
  repo?: string
  ref?: string
}

const cleanText = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined)

const safeSetupUrl = (value: unknown) => {
  const raw = cleanText(value)
  if (!raw || raw.length > 300) return undefined
  try {
    const url = new URL(raw)
    if (url.username || url.password) return undefined
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const appendQuery = (url: string, params: Record<string, string>) => {
  const parsed = new URL(url)
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value)
  }
  return parsed.toString()
}

const upsertEnvLocal = async (updates: Record<string, string>) => {
  const original = await readFile(envLocalPath, "utf8").catch(() => "")
  const lines = original.split(/\r?\n/)
  const seen = new Set<string>()
  const rewritten = lines.map((line) => {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line)
    if (!match) return line
    const key = match[1]
    if (!(key in updates)) return line
    seen.add(key)
    return `${key}=${updates[key]}`
  })

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) rewritten.push(`${key}=${value}`)
  }

  await writeFile(envLocalPath, `${rewritten.join("\n").replace(/\n+$/, "")}\n`, "utf8")
}

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

  app.get<{ Querystring: GitHubManifestStartQuery }>("/api/github/manifest/start", async (request, reply) => {
    try {
      const setupUrl = safeSetupUrl(request.query.setupUrl)
      if (!setupUrl) {
        reply.code(400)
        return {
          ok: false,
          error: "setupUrl must be an http(s) callback URL."
        }
      }

      const state = randomUUID()
      manifestStates.set(state, { setupUrl, createdAt: Date.now() })
      const manifest = buildGitHubAppManifest({
        setupUrl,
        appNameSuffix: state.slice(0, 8)
      })
      const action = appendQuery("https://github.com/settings/apps/new", { state })
      const manifestJson = JSON.stringify(manifest)
      reply.type("text/html")
      return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Create Aiden GitHub connector</title>
  </head>
  <body>
    <form id="github-app-manifest" method="post" action="${escapeHtml(action)}">
      <input type="hidden" name="manifest" value="${escapeHtml(manifestJson)}" />
      <button type="submit">Continue to GitHub</button>
    </form>
    <script>document.getElementById("github-app-manifest").submit()</script>
  </body>
</html>`
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: safeGitHubError(error)
      }
    }
  })

  app.post<{ Body: GitHubManifestCompleteBody }>("/api/github/manifest/complete", async (request, reply) => {
    try {
      const code = cleanText(request.body?.code)
      if (!code) throw new Error("GitHub manifest code is required.")

      const state = cleanText(request.body?.state)
      const stateRecord = state ? manifestStates.get(state) : undefined
      const setupUrl = safeSetupUrl(request.body?.setupUrl) ?? stateRecord?.setupUrl
      const conversion = await exchangeGitHubManifestCode({ code, setupUrl })
      applyGitHubManifestConversionToEnv(conversion)
      await upsertEnvLocal({
        GITHUB_APP_ID: String(conversion.id),
        GITHUB_APP_SLUG: conversion.slug,
        GITHUB_APP_PRIVATE_KEY_BASE64: Buffer.from(conversion.pem, "utf8").toString("base64"),
        ...(setupUrl ? { GITHUB_APP_INSTALL_CALLBACK_URL: setupUrl } : {})
      })
      if (state) manifestStates.delete(state)

      return {
        ok: true,
        configured: true,
        appId: conversion.id,
        appSlug: conversion.slug,
        setupUrl,
        installUrl: getGitHubInstallUrl().url
      }
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: safeGitHubError(error)
      }
    }
  })

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
