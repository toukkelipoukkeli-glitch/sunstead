import { createSign } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import type { GitHubSourceRef } from "@aiden/contracts"

type GitHubAppConfig = {
  appId: string
  slug: string
  privateKey: string
  apiBaseUrl: string
  webBaseUrl: string
}

export type GitHubRepositorySummary = {
  id: number
  owner: string
  repo: string
  fullName: string
  private: boolean
  defaultBranch: string
}

export type MaterializeGitHubSourceInput = {
  installationId?: number
  repositoryId?: number
  owner: string
  repo: string
  ref?: string
  workspaceRoot: string
}

export type MaterializedGitHubSource = {
  sourceRoot: string
  displayPath: string
  filesWritten: number
  bytesWritten: number
  github: GitHubSourceRef
}

type GitHubRepoResponse = {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
  owner: {
    login: string
  }
}

type GitHubCommitResponse = {
  sha: string
  commit: {
    tree: {
      sha: string
    }
  }
}

type GitHubTreeResponse = {
  truncated?: boolean
  tree: Array<{
    path?: string
    mode?: string
    type?: "blob" | "tree" | "commit"
    sha?: string
    size?: number
  }>
}

type GitHubBlobResponse = {
  content?: string
  encoding?: string
  size?: number
}

const defaultApiBaseUrl = "https://api.github.com"
const defaultWebBaseUrl = "https://github.com"

const scannedExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".sql", ".md", ".json"])
const ignoredPathParts = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo"])
const maxFiles = 10_000
const maxBytes = 250 * 1024 * 1024
const maxBlobBytes = 2 * 1024 * 1024

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const base64Url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url")

const safeError = (error: unknown) => {
  let message = error instanceof Error ? error.message : String(error)
  for (const name of ["GITHUB_TOKEN", "GITHUB_APP_PRIVATE_KEY", "GITHUB_APP_PRIVATE_KEY_BASE64"]) {
    const value = readEnv(name)
    if (value) message = message.split(value).join(`[${name}]`)
  }
  return message.slice(0, 360)
}

const readGitHubAppConfig = (): GitHubAppConfig | undefined => {
  const appId = readEnv("GITHUB_APP_ID")
  const slug = readEnv("GITHUB_APP_SLUG")
  const rawPrivateKey = readEnv("GITHUB_APP_PRIVATE_KEY")
  const privateKeyBase64 = readEnv("GITHUB_APP_PRIVATE_KEY_BASE64")
  const privateKey = rawPrivateKey
    ? rawPrivateKey.replaceAll("\\n", "\n")
    : privateKeyBase64
      ? Buffer.from(privateKeyBase64, "base64").toString("utf8")
      : undefined

  if (!appId || !slug || !privateKey) return undefined
  return {
    appId,
    slug,
    privateKey,
    apiBaseUrl: readEnv("GITHUB_API_BASE_URL") ?? defaultApiBaseUrl,
    webBaseUrl: readEnv("GITHUB_WEB_BASE_URL") ?? defaultWebBaseUrl
  }
}

export const getGitHubInstallUrl = () => {
  const config = readGitHubAppConfig()
  if (!config) {
    return {
      configured: false,
      url: undefined,
      missingEnv: ["GITHUB_APP_ID", "GITHUB_APP_SLUG", "GITHUB_APP_PRIVATE_KEY_BASE64"]
    }
  }

  return {
    configured: true,
    url: `${config.webBaseUrl}/apps/${encodeURIComponent(config.slug)}/installations/new`,
    missingEnv: []
  }
}

const createGitHubAppJwt = (config: GitHubAppConfig) => {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: config.appId
  }
  const unsigned = `${base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64Url(JSON.stringify(payload))}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  signer.end()
  return `${unsigned}.${signer.sign(config.privateKey).toString("base64url")}`
}

const githubJson = async <T>(
  url: string,
  token: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> => {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${text.slice(0, 240)}`)
  }
  return response.json() as Promise<T>
}

const createInstallationToken = async (installationId?: number) => {
  const devToken = readEnv("GITHUB_TOKEN")
  if (!installationId && devToken) return devToken

  const config = readGitHubAppConfig()
  if (!config) {
    if (devToken) return devToken
    throw new Error("GitHub App is not configured. Set GITHUB_APP_ID, GITHUB_APP_SLUG, and GITHUB_APP_PRIVATE_KEY_BASE64.")
  }
  if (!installationId) {
    throw new Error("GitHub installation id is required for GitHub App repository access.")
  }

  const jwt = createGitHubAppJwt(config)
  const body = await githubJson<{ token: string }>(
    `${config.apiBaseUrl}/app/installations/${installationId}/access_tokens`,
    jwt,
    { method: "POST" }
  )
  return body.token
}

export const listGitHubInstallationRepositories = async (installationId: number): Promise<GitHubRepositorySummary[]> => {
  const config = readGitHubAppConfig()
  const token = await createInstallationToken(installationId)
  const body = await githubJson<{ repositories?: GitHubRepoResponse[] }>(
    `${config?.apiBaseUrl ?? defaultApiBaseUrl}/installation/repositories?per_page=100`,
    token
  )
  return (body.repositories ?? []).map((repository) => ({
    id: repository.id,
    owner: repository.owner.login,
    repo: repository.name,
    fullName: repository.full_name,
    private: repository.private,
    defaultBranch: repository.default_branch
  }))
}

const shouldMaterializePath = (relativePath: string) => {
  const parts = relativePath.split("/")
  if (parts.some((part) => ignoredPathParts.has(part))) return false
  return scannedExtensions.has(path.extname(relativePath))
}

const safeWorkspaceName = (value: string) =>
  value.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "repo"

const ensureSafeWritePath = (root: string, relativePath: string) => {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "")
  if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
    throw new Error(`Unsafe GitHub source path: ${relativePath}`)
  }
  const target = path.resolve(root, normalized)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe GitHub source path: ${relativePath}`)
  }
  return target
}

export const materializeGitHubSource = async (
  input: MaterializeGitHubSourceInput
): Promise<MaterializedGitHubSource> => {
  const config = readGitHubAppConfig()
  const apiBaseUrl = config?.apiBaseUrl ?? defaultApiBaseUrl
  const token = await createInstallationToken(input.installationId)
  const repo = await githubJson<GitHubRepoResponse>(
    `${apiBaseUrl}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`,
    token
  )

  if (input.repositoryId && repo.id !== input.repositoryId) {
    throw new Error(`GitHub repository id mismatch for ${repo.full_name}.`)
  }

  const ref = input.ref?.trim() || repo.default_branch
  const commit = await githubJson<GitHubCommitResponse>(
    `${apiBaseUrl}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/commits/${encodeURIComponent(ref)}`,
    token
  )
  const tree = await githubJson<GitHubTreeResponse>(
    `${apiBaseUrl}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/git/trees/${commit.commit.tree.sha}?recursive=1`,
    token
  )
  if (tree.truncated) {
    throw new Error("GitHub repository tree is truncated; select a smaller repo or branch for this demo path.")
  }

  const sourceRoot = path.resolve(
    input.workspaceRoot,
    "artifacts",
    "github-sources",
    `${safeWorkspaceName(repo.owner.login)}-${safeWorkspaceName(repo.name)}-${commit.sha.slice(0, 12)}`
  )
  await rm(sourceRoot, { recursive: true, force: true })
  await mkdir(sourceRoot, { recursive: true })

  let filesWritten = 0
  let bytesWritten = 0
  for (const entry of tree.tree) {
    if (entry.type !== "blob" || !entry.path || !entry.sha) continue
    if (!shouldMaterializePath(entry.path)) continue
    if ((entry.size ?? 0) > maxBlobBytes) continue
    if (filesWritten >= maxFiles) throw new Error(`GitHub source import exceeded ${maxFiles} files.`)

    const blob = await githubJson<GitHubBlobResponse>(
      `${apiBaseUrl}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/git/blobs/${entry.sha}`,
      token
    )
    if (blob.encoding !== "base64" || !blob.content) continue
    const buffer = Buffer.from(blob.content.replace(/\s/g, ""), "base64")
    bytesWritten += buffer.byteLength
    if (bytesWritten > maxBytes) throw new Error(`GitHub source import exceeded ${maxBytes} bytes.`)

    const target = ensureSafeWritePath(sourceRoot, entry.path)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, buffer)
    filesWritten += 1
  }

  if (filesWritten === 0) {
    throw new Error("GitHub source import found no scanner-supported files.")
  }

  return {
    sourceRoot,
    displayPath: path.relative(input.workspaceRoot, sourceRoot).split(path.sep).join("/"),
    filesWritten,
    bytesWritten,
    github: {
      installationId: input.installationId ?? 0,
      repositoryId: repo.id,
      owner: repo.owner.login,
      repo: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      ref,
      commitSha: commit.sha,
      source: "github_app"
    }
  }
}

export const safeGitHubError = safeError
