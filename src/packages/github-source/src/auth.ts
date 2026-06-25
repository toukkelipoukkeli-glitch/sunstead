import { createSign } from "node:crypto"

export type GitHubAppConfig = {
  appId: string
  slug: string
  privateKey: string
  apiBaseUrl: string
  webBaseUrl: string
  setupUrl?: string
}

export const defaultApiBaseUrl = "https://api.github.com"
export const defaultWebBaseUrl = "https://github.com"

export const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const base64Url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url")

export const safeGitHubError = (error: unknown) => {
  let message = error instanceof Error ? error.message : String(error)
  for (const name of ["GITHUB_TOKEN", "GITHUB_APP_PRIVATE_KEY", "GITHUB_APP_PRIVATE_KEY_BASE64"]) {
    const value = readEnv(name)
    if (value) message = message.split(value).join(`[${name}]`)
  }
  return message.slice(0, 360)
}

export const readGitHubAppConfig = (): GitHubAppConfig | undefined => {
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
    webBaseUrl: readEnv("GITHUB_WEB_BASE_URL") ?? defaultWebBaseUrl,
    setupUrl: readEnv("GITHUB_APP_INSTALL_CALLBACK_URL") ?? readEnv("GITHUB_APP_SETUP_URL")
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

export const githubJson = async <T>(
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

export const createInstallationToken = async (installationId?: number) => {
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
