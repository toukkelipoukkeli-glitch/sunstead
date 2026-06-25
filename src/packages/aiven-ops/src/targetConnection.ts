export type TargetConnectionSource =
  | "env"
  | "aiven_mcp_connection_info"
  | "aiven_rest_connection_info"
  | "unavailable"

export type TargetConnectionResolution = {
  ok: boolean
  source: TargetConnectionSource
  connectionString?: string
  safeServiceLabel?: string
  safeHost?: string
  missingEnv: string[]
  error?: string
}

type ResolveAivenPostgresConnectionInput = {
  project?: string
  serviceName?: string
  allowMcpSecrets?: boolean
  sslDisabled?: boolean
}

type AivenServiceConnectionInfo = {
  service_type?: unknown
  service_uri?: unknown
  service_uri_params?: unknown
}

type AivenServiceShape = {
  service_name?: string
  service_type?: string
  state?: string
  service_uri?: string
  service_uri_params?: Record<string, unknown>
}

type JsonRpcResponse = {
  result?: unknown
  error?: unknown
}

const defaultAivenMcpUrl = "https://mcp.aiven.live/mcp?allow_secrets=true"
const defaultAivenApiBase = "https://api.aiven.io/v1"

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const unique = (values: string[]) => [...new Set(values)]

const readPositiveInt = (name: string, fallback: number) => {
  const value = readEnv(name)
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1000 ? parsed : fallback
}

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const redactedSecretPattern = /(?:<|%3c|\[)?redacted(?:>|%3e|\])?/i

const hasRedactedSecret = (value: unknown) => {
  if (typeof value !== "string") return false
  return redactedSecretPattern.test(value) || redactedSecretPattern.test(safeDecodeURIComponent(value))
}

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

const safeHostFromConnectionString = (connectionString: string) => {
  try {
    return new URL(connectionString).host || undefined
  } catch {
    return undefined
  }
}

const safeServiceLabel = (project?: string, serviceName?: string) => {
  if (project && serviceName) return `${project}/${serviceName}`
  return serviceName ?? project ?? "Aiven Postgres"
}

export const normalizePostgresConnectionString = (connectionString: string, sslDisabled = readEnv("AIVEN_POSTGRES_SSL") === "false") => {
  if (sslDisabled) return connectionString
  try {
    const url = new URL(connectionString)
    url.searchParams.delete("sslmode")
    return url.toString()
  } catch {
    return connectionString
  }
}

export const redactSecretText = (text: string) => {
  let redacted = text

  for (const name of [
    "AIVEN_TOKEN",
    "AIVEN_POSTGRES_URL",
    "AIDEN_FRESH_AIVEN_POSTGRES_URL",
    "SOURCE_SUPABASE_DB_URL",
    "SOURCE_POSTGRES_URL"
  ]) {
    const value = readEnv(name)
    if (value) redacted = redacted.split(value).join(`[${name}]`)
  }

  redacted = redacted.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, "[REDACTED_POSTGRES_URL]")
  redacted = redacted.replace(/(password=)[^&\s"'`]+/gi, "$1[REDACTED]")
  redacted = redacted.replace(/(Authorization:\s*Bearer\s+)[^\s"'`]+/gi, "$1[REDACTED]")
  redacted = redacted.replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+={0,2}/g, "$1[REDACTED]")
  redacted = redacted.replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")

  return redacted.slice(0, 600)
}

const errorText = (error: unknown) => redactSecretText(error instanceof Error ? error.message : String(error))

const missingTargetEnv = (project?: string, serviceName?: string, token?: string) =>
  unique([
    ...(token ? [] : ["AIVEN_TOKEN"]),
    ...(project ? [] : ["AIVEN_PROJECT"]),
    ...(serviceName ? [] : ["AIDEN_FRESH_AIVEN_PG_SERVICE"])
  ])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const textFromToolResult = (result: unknown) => {
  if (!isRecord(result)) return undefined
  if (result.isError === true) return undefined
  const content = result.content
  if (!Array.isArray(content)) return undefined
  const textBlock = content.find((item): item is { text: string } => isRecord(item) && typeof item.text === "string")
  return textBlock?.text
}

const unwrapAivenToolText = (text: string) => {
  const wrapped = text.match(/<untrusted-aiven-response-[^>]+>\n([\s\S]*?)\n<\/untrusted-aiven-response/)
  return wrapped?.[1] ?? text
}

const parseToolConnectionInfo = (result: unknown): AivenServiceConnectionInfo | undefined => {
  const text = textFromToolResult(result)
  if (!text) return undefined
  const parsed = safeJsonParse(unwrapAivenToolText(text))
  return isRecord(parsed) ? (parsed as AivenServiceConnectionInfo) : undefined
}

const extractJsonRpcPayload = async (response: Response): Promise<JsonRpcResponse | undefined> => {
  const text = await response.text()
  if (!text.trim()) return undefined

  const direct = safeJsonParse(text)
  if (isRecord(direct)) return direct

  const dataLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .filter((line) => line && line !== "[DONE]")

  for (const line of dataLines) {
    const parsed = safeJsonParse(line)
    if (isRecord(parsed)) return parsed
  }

  return { error: text }
}

const postJsonRpc = async (url: string, token: string, body: unknown, sessionId?: string) => {
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), readPositiveInt("AIVEN_MCP_TOOL_TIMEOUT_MS", 30_000))
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: abortController.signal,
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(sessionId ? { "Mcp-Session-Id": sessionId } : {})
      },
      body: JSON.stringify(body)
    })
    const payload = await extractJsonRpcPayload(response)
    if (!response.ok) {
      throw new Error(`Aiven MCP HTTP ${response.status}: ${payload?.error ? JSON.stringify(payload.error) : response.statusText}`)
    }
    if (payload?.error) {
      throw new Error(`Aiven MCP JSON-RPC error: ${JSON.stringify(payload.error)}`)
    }
    return {
      payload,
      sessionId: response.headers.get("mcp-session-id") ?? response.headers.get("Mcp-Session-Id") ?? undefined
    }
  } finally {
    clearTimeout(timeout)
  }
}

const callAivenMcpConnectionInfo = async (project: string, serviceName: string, token: string) => {
  const mcpUrl = readEnv("AIVEN_MCP_URL") ?? defaultAivenMcpUrl

  let sessionId: string | undefined
  try {
    const initialized = await postJsonRpc(
      mcpUrl,
      token,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "aiden-sunstead", version: "0.1.0" }
        }
      }
    )
    sessionId = initialized.sessionId
    await postJsonRpc(
      mcpUrl,
      token,
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {}
      },
      sessionId
    ).catch(() => undefined)
  } catch {
    sessionId = undefined
  }

  const called = await postJsonRpc(
    mcpUrl,
    token,
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "aiven_service_connection_info",
        arguments: {
          project,
          service_name: serviceName
        }
      }
    },
    sessionId
  )

  return parseToolConnectionInfo(called.payload?.result)
}

const serviceFromResponse = (body: unknown): AivenServiceShape | undefined => {
  if (!isRecord(body)) return undefined
  const service = body.service
  if (isRecord(service)) return service as AivenServiceShape
  return body as AivenServiceShape
}

const fetchAivenRestService = async (project: string, serviceName: string, token: string) => {
  const base = readEnv("AIVEN_API_BASE") ?? defaultAivenApiBase
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), readPositiveInt("AIVEN_REST_TIMEOUT_MS", 30_000))
  try {
    const url = `${base}/project/${encodeURIComponent(project)}/service/${encodeURIComponent(serviceName)}?include_secrets=true`
    const response = await fetch(url, {
      signal: abortController.signal,
      headers: { Authorization: `Bearer ${token}` }
    })
    const text = await response.text()
    const body = text ? safeJsonParse(text) : undefined
    if (!response.ok) {
      throw new Error(`Aiven REST HTTP ${response.status}: ${isRecord(body) ? JSON.stringify(body) : response.statusText}`)
    }
    return serviceFromResponse(body)
  } finally {
    clearTimeout(timeout)
  }
}

const connectionStringFromParams = (params: Record<string, unknown>) => {
  const host = typeof params.host === "string" ? params.host : undefined
  const user = typeof params.user === "string" ? params.user : undefined
  const password = typeof params.password === "string" ? params.password : undefined
  const dbname = typeof params.dbname === "string" ? params.dbname : "defaultdb"
  const port = typeof params.port === "string" || typeof params.port === "number" ? String(params.port) : "5432"
  if (!host || !user || !password) return undefined
  if ([host, user, password, dbname, port].some(hasRedactedSecret)) return undefined

  const url = new URL("postgres://placeholder")
  url.hostname = host
  url.port = port
  url.username = user
  url.password = password
  url.pathname = `/${dbname}`
  return url.toString()
}

const connectionStringFromInfo = (info: AivenServiceConnectionInfo | AivenServiceShape | undefined) => {
  if (!info) return undefined
  const serviceType = typeof info.service_type === "string" ? info.service_type : undefined
  if (serviceType && serviceType !== "pg") return undefined

  const serviceUri = typeof info.service_uri === "string" ? info.service_uri : undefined
  if (serviceUri && !hasRedactedSecret(serviceUri)) return serviceUri

  const params = isRecord(info.service_uri_params) ? info.service_uri_params : undefined
  if (params) return connectionStringFromParams(params)

  return undefined
}

const okResolution = (
  source: Exclude<TargetConnectionSource, "unavailable">,
  connectionString: string,
  project?: string,
  serviceName?: string,
  sslDisabled?: boolean
): TargetConnectionResolution => ({
  ok: true,
  source,
  connectionString: normalizePostgresConnectionString(connectionString, sslDisabled),
  safeHost: safeHostFromConnectionString(connectionString),
  safeServiceLabel: safeServiceLabel(project, serviceName),
  missingEnv: []
})

export const resolveAivenPostgresConnection = async (
  input: ResolveAivenPostgresConnectionInput = {}
): Promise<TargetConnectionResolution> => {
  const project = input.project ?? readEnv("AIDEN_FRESH_AIVEN_PROJECT") ?? readEnv("AIVEN_PROJECT")
  const serviceName = input.serviceName ?? readEnv("AIDEN_FRESH_AIVEN_PG_SERVICE") ?? readEnv("AIVEN_PG_SERVICE")
  const token = readEnv("AIVEN_TOKEN")
  const envConnectionString = readEnv("AIDEN_FRESH_AIVEN_POSTGRES_URL") ?? readEnv("AIVEN_POSTGRES_URL")

  if (envConnectionString) {
    return okResolution("env", envConnectionString, project, serviceName, input.sslDisabled)
  }

  const missingEnv = missingTargetEnv(project, serviceName, token)
  if (missingEnv.length > 0) {
    return {
      ok: false,
      source: "unavailable",
      safeServiceLabel: safeServiceLabel(project, serviceName),
      missingEnv,
      error: `Missing Aiven target connection environment: ${missingEnv.join(", ")}`
    }
  }

  const errors: string[] = []

  if (input.allowMcpSecrets !== false) {
    try {
      const mcpInfo = await callAivenMcpConnectionInfo(project!, serviceName!, token!)
      const connectionString = connectionStringFromInfo(mcpInfo)
      if (connectionString) {
        return okResolution("aiven_mcp_connection_info", connectionString, project, serviceName, input.sslDisabled)
      }
      errors.push("Aiven MCP connection-info did not return usable PostgreSQL credentials.")
    } catch (error) {
      errors.push(`Aiven MCP connection-info failed: ${errorText(error)}`)
    }
  }

  try {
    const service = await fetchAivenRestService(project!, serviceName!, token!)
    const connectionString = connectionStringFromInfo(service)
    if (connectionString) {
      return okResolution("aiven_rest_connection_info", connectionString, project, serviceName, input.sslDisabled)
    }
    errors.push("Aiven REST service response did not include unredacted PostgreSQL credentials.")
  } catch (error) {
    errors.push(`Aiven REST fallback failed: ${errorText(error)}`)
  }

  return {
    ok: false,
    source: "unavailable",
    safeServiceLabel: safeServiceLabel(project, serviceName),
    missingEnv: [],
    error: redactSecretText(errors.join(" "))
  }
}
