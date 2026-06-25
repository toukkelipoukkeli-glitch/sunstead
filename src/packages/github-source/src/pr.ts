import type { GitHubSourceRef } from "@aiden/contracts"
import {
  createInstallationToken,
  defaultApiBaseUrl,
  githubJson,
  readEnv,
  readGitHubAppConfig,
  safeGitHubError
} from "./auth"

export type CutoverPullRequestFile = {
  path: string
  content: string
}

export type OpenCutoverPullRequestInput = {
  github: GitHubSourceRef
  title: string
  body: string
  branchName: string
  files: CutoverPullRequestFile[]
}

export type OpenCutoverPullRequestResult = {
  ok: boolean
  status: "opened" | "skipped" | "failed"
  url?: string
  branch?: string
  files: number
  error?: string
  source: GitHubSourceRef
}

type GitHubRepoResponse = {
  id: number
  default_branch: string
}

type GitHubRefResponse = {
  ref: string
  object: {
    sha: string
    type: string
  }
}

type GitHubCommitResponse = {
  sha: string
  tree: {
    sha: string
  }
}

type GitHubBlobResponse = {
  sha: string
}

type GitHubTreeResponse = {
  sha: string
}

type GitHubPullResponse = {
  html_url?: string
}

class CutoverValidationError extends Error {}

const secretKeyNamePattern = /(?:^|[^A-Z0-9_/-])["']?(?:[A-Z0-9_/-]*(?:SECRET|TOKEN|API[_-]?KEY|PASSWORD|PASS|PRIVATE[_-]?KEY|CONNECTION[_-]?STRING|DATABASE[_-]?URL|DSN)[A-Z0-9_/-]*)["']?\s*[:=]\s*(["']?)([^"'\s#,}]+)\1/i

const obviousSecretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgithub_pat_[A-Za-z0-9_]{60,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bsk-[A-Za-z0-9_-]{32,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\b[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/\s:@]+:([^@\s/]+)@/
]

const placeholderPattern = /^(?:|<[^>]+>|\$\{[^}]+}|%\w+%|\*\*\*+|x+|X+|_+|your[-_\w]*|set[-_ ]?me|change[-_ ]?me|replace[-_ ]?me|todo|placeholder|example|dummy|null|undefined)$/i

const result = (
  input: OpenCutoverPullRequestInput,
  status: OpenCutoverPullRequestResult["status"],
  details: Omit<OpenCutoverPullRequestResult, "ok" | "status" | "files" | "source">
): OpenCutoverPullRequestResult => ({
  ok: status === "opened",
  status,
  files: input.files?.length ?? 0,
  source: input.github,
  ...details
})

const encodePath = (value: string) =>
  value.split("/").map((part) => encodeURIComponent(part)).join("/")

const normalizeGitHubPath = (filePath: string) => {
  const normalized = filePath.trim().replaceAll("\\", "/").replace(/^\/+/, "")
  const parts = normalized.split("/").filter(Boolean)
  if (
    normalized.length === 0 ||
    normalized.endsWith("/") ||
    parts.some((part) => part === "." || part === ".." || part === ".git")
  ) {
    throw new CutoverValidationError(`Unsafe generated file path: ${filePath}`)
  }
  return parts.join("/")
}

const validateBranchName = (branchName: string) => {
  const value = branchName.trim()
  if (!value) throw new CutoverValidationError("Cutover branch name is required.")
  if (
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.endsWith(".") ||
    value.includes("..") ||
    value.includes("//") ||
    value.includes("@{") ||
    value.endsWith(".lock") ||
    /[\s~^:?*[\]\\]/.test(value) ||
    value.startsWith("refs/")
  ) {
    throw new CutoverValidationError("Cutover branch name is not a safe Git ref name.")
  }
  return value
}

const isPlaceholderValue = (value: string) => {
  const normalized = value.trim().replace(/^["']|["']$/g, "")
  if (placeholderPattern.test(normalized)) return true
  if (/^(?:process\.env\.|import\.meta\.env\.|env\.)[A-Z0-9_]+$/i.test(normalized)) return true
  return false
}

const scrubLineForPlaceholderCheck = (line: string) =>
  line.replace(/[,;]/g, "").trim()

export const assertNoPrSecrets = (files: CutoverPullRequestFile[]) => {
  for (const file of files) {
    const filePath = normalizeGitHubPath(file.path)
    const lines = file.content.split(/\r?\n/)
    for (const [index, line] of lines.entries()) {
      for (const pattern of obviousSecretPatterns) {
        const match = pattern.exec(line)
        if (!match) continue
        const credential = match[1] ?? match[0]
        if (isPlaceholderValue(scrubLineForPlaceholderCheck(credential))) continue
        throw new CutoverValidationError(`Generated file ${filePath}:${index + 1} contains a secret-shaped value.`)
      }

      const assignment = secretKeyNamePattern.exec(line)
      if (!assignment) continue
      const value = scrubLineForPlaceholderCheck(assignment[2] ?? "")
      if (isPlaceholderValue(value)) continue
      throw new CutoverValidationError(`Generated file ${filePath}:${index + 1} contains a secret-shaped value.`)
    }
  }
}

const validateInput = (input: OpenCutoverPullRequestInput) => {
  if (!input.github?.owner || !input.github.repo) {
    throw new CutoverValidationError("GitHub repository source is required for cutover PR creation.")
  }
  if (!input.title?.trim()) {
    throw new CutoverValidationError("Cutover PR title is required.")
  }
  const branchName = validateBranchName(input.branchName)
  if (!Array.isArray(input.files) || input.files.length === 0) {
    throw new CutoverValidationError("At least one generated file is required for cutover PR creation.")
  }

  const seenPaths = new Set<string>()
  const files = input.files.map((file) => {
    if (typeof file.content !== "string") {
      throw new CutoverValidationError("Generated PR file content must be text.")
    }
    const filePath = normalizeGitHubPath(file.path)
    if (seenPaths.has(filePath)) {
      throw new CutoverValidationError(`Duplicate generated file path: ${filePath}`)
    }
    seenPaths.add(filePath)
    return {
      path: filePath,
      content: file.content
    }
  })

  assertNoPrSecrets(files)
  return { branchName, files }
}

const isMissingWriteAccess = (error: string) =>
  /\b(?:401|403|404)\b/.test(error) || /Resource not accessible by integration|Bad credentials|Not Found/i.test(error)

const getRef = async (apiBaseUrl: string, repoPath: string, token: string, ref: string) =>
  githubJson<GitHubRefResponse>(
    `${apiBaseUrl}/repos/${repoPath}/git/ref/${encodePath(ref)}`,
    token
  )

const findOpenPullRequest = async (
  apiBaseUrl: string,
  repoPath: string,
  token: string,
  owner: string,
  branchName: string,
  baseBranch: string
) => {
  const query = new URLSearchParams({
    state: "open",
    head: `${owner}:${branchName}`,
    base: baseBranch,
    per_page: "1"
  })
  const pulls = await githubJson<GitHubPullResponse[]>(
    `${apiBaseUrl}/repos/${repoPath}/pulls?${query.toString()}`,
    token
  )
  return pulls[0]
}

export const openCutoverPullRequest = async (
  input: OpenCutoverPullRequestInput
): Promise<OpenCutoverPullRequestResult> => {
  try {
    const { branchName, files } = validateInput(input)
    if (input.github.installationId === 0 && !readEnv("GITHUB_TOKEN")) {
      return result(input, "skipped", {
        error: "Missing GitHub write permission: source has installationId 0 and GITHUB_TOKEN is not set."
      })
    }

    const token = await createInstallationToken(input.github.installationId || undefined)
    const apiBaseUrl = readGitHubAppConfig()?.apiBaseUrl ?? defaultApiBaseUrl
    const repoPath = `${encodeURIComponent(input.github.owner)}/${encodeURIComponent(input.github.repo)}`
    const repo = await githubJson<GitHubRepoResponse>(
      `${apiBaseUrl}/repos/${repoPath}`,
      token
    )

    if (input.github.repositoryId && repo.id !== input.github.repositoryId) {
      return result(input, "failed", {
        error: "GitHub repository id mismatch for cutover PR creation."
      })
    }

    const baseBranch = input.github.defaultBranch || repo.default_branch
    if (branchName === baseBranch) {
      return result(input, "skipped", {
        error: "Cutover branch must be different from the repository default branch."
      })
    }

    const baseRef = await getRef(apiBaseUrl, repoPath, token, `heads/${baseBranch}`)
    let branchExists = true
    let currentSha = baseRef.object.sha
    try {
      const targetRef = await getRef(apiBaseUrl, repoPath, token, `heads/${branchName}`)
      currentSha = targetRef.object.sha
    } catch (error) {
      if (!/GitHub API 404\b/.test(safeGitHubError(error))) throw error
      branchExists = false
    }

    const currentCommit = await githubJson<GitHubCommitResponse>(
      `${apiBaseUrl}/repos/${repoPath}/git/commits/${encodeURIComponent(currentSha)}`,
      token
    )
    const treeEntries = []
    for (const file of files) {
      const blob = await githubJson<GitHubBlobResponse>(
        `${apiBaseUrl}/repos/${repoPath}/git/blobs`,
        token,
        {
          method: "POST",
          body: {
            content: file.content,
            encoding: "utf-8"
          }
        }
      )
      treeEntries.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha
      })
    }

    const tree = await githubJson<GitHubTreeResponse>(
      `${apiBaseUrl}/repos/${repoPath}/git/trees`,
      token,
      {
        method: "POST",
        body: {
          base_tree: currentCommit.tree.sha,
          tree: treeEntries
        }
      }
    )

    if (tree.sha === currentCommit.tree.sha) {
      return result(input, "skipped", {
        branch: branchName,
        error: "Generated files already match the cutover branch."
      })
    }

    const commit = await githubJson<GitHubCommitResponse>(
      `${apiBaseUrl}/repos/${repoPath}/git/commits`,
      token,
      {
        method: "POST",
        body: {
          message: input.title.trim(),
          tree: tree.sha,
          parents: [currentSha]
        }
      }
    )

    if (branchExists) {
      await githubJson<GitHubRefResponse>(
        `${apiBaseUrl}/repos/${repoPath}/git/refs/${encodePath(`heads/${branchName}`)}`,
        token,
        {
          method: "PATCH",
          body: {
            sha: commit.sha,
            force: false
          }
        }
      )
    } else {
      await githubJson<GitHubRefResponse>(
        `${apiBaseUrl}/repos/${repoPath}/git/refs`,
        token,
        {
          method: "POST",
          body: {
            ref: `refs/heads/${branchName}`,
            sha: commit.sha
          }
        }
      )
    }

    const existingPull = await findOpenPullRequest(
      apiBaseUrl,
      repoPath,
      token,
      input.github.owner,
      branchName,
      baseBranch
    )
    if (existingPull?.html_url) {
      return result(input, "opened", {
        url: existingPull.html_url,
        branch: branchName
      })
    }

    const pull = await githubJson<GitHubPullResponse>(
      `${apiBaseUrl}/repos/${repoPath}/pulls`,
      token,
      {
        method: "POST",
        body: {
          title: input.title.trim(),
          body: input.body ?? "",
          head: branchName,
          base: baseBranch
        }
      }
    )

    return result(input, "opened", {
      url: pull.html_url,
      branch: branchName
    })
  } catch (error) {
    const message = safeGitHubError(error)
    return result(input, error instanceof CutoverValidationError ? "failed" : isMissingWriteAccess(message) ? "skipped" : "failed", {
      error: message
    })
  }
}
