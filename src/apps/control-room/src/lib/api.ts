import type { AddReactionInput, Post, PulseWallEvent, Report, RunSnapshot, SetupProfile } from "@aiden/contracts"
import type { SetupRuntimeConfig } from "./setupProfile"

const readJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export const createRun = async (setupProfile?: SetupProfile) =>
  readJson<RunSnapshot>(
    await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupProfile })
    })
  )

export const submitSetupProfile = async (config: SetupRuntimeConfig) =>
  readJson<{ ok: boolean; applied: Record<string, unknown> }>(
    await fetch("/api/setup/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    })
  )

export type GitHubRepositorySummary = {
  id: number
  owner: string
  repo: string
  fullName: string
  private: boolean
  defaultBranch: string
}

export const getGitHubInstallUrl = async () =>
  readJson<{ configured: boolean; url?: string; missingEnv: string[] }>(await fetch("/api/github/install-url"))

export const listGitHubRepositories = async (installationId: number) =>
  readJson<{ repositories: GitHubRepositorySummary[] }>(
    await fetch(`/api/github/installations/${encodeURIComponent(String(installationId))}/repositories`)
  )

export const importGitHubSource = async (input: {
  installationId?: number
  repositoryId?: number
  owner: string
  repo: string
  ref?: string
}) =>
  readJson<{
    ok: true
    setupProfile: SetupProfile
    sourceRoot: string
    filesWritten: number
    bytesWritten: number
  }>(
    await fetch("/api/github/source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  )

export const graduateRun = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/graduate`, { method: "POST" }))

export const runProofSpine = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/proof-spine`, { method: "POST" }))

export const runSourceScan = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/source-scan`, { method: "POST" }))

export const runAccessPreflight = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/access-preflight`, { method: "POST" }))

export const runDataMigration = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/data-migration`, { method: "POST" }))

export const runKafkaAgentBus = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/kafka-agent-bus`, { method: "POST" }))

export const runProviderCutover = async (runId: string) =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/provider-cutover`, { method: "POST" }))

export const getRun = async (runId: string) => readJson<RunSnapshot>(await fetch(`/api/runs/${runId}`))

export const stepRun = async (runId: string, stepName = "next") =>
  readJson<RunSnapshot>(await fetch(`/api/runs/${runId}/step/${stepName}`, { method: "POST" }))

export const resetRun = async (runId: string) => stepRun(runId, "reset")

export const pauseRun = async (runId: string) => stepRun(runId, "pause")

export const getReport = async (runId: string) => readJson<Report>(await fetch(`/api/runs/${runId}/report`))

export const listPosts = async () => readJson<Post[]>(await fetch("/api/posts"))

export const addReaction = async (input: AddReactionInput) =>
  readJson<{ ok: true }>(
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  )

export const listRecentEvents = async () => readJson<PulseWallEvent[]>(await fetch("/api/events/recent"))
