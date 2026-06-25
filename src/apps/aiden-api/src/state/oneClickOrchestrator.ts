import { existsSync } from "node:fs"
import { query } from "@anthropic-ai/claude-agent-sdk"
import type { CanUseTool, McpServerConfig } from "@anthropic-ai/claude-agent-sdk"
import type { ProofSource, RunSnapshot } from "@aiden/contracts"

export type AgentRunMode = "live_pg" | "cached_ok" | "fixture"

export type AgentStepName =
  | "access_broker"
  | "repo_scanner"
  | "behavior_mapper"
  | "aiven_operator"
  | "migration_operator"
  | "compatibility_surgeon"
  | "validation_auditor"
  | "cutover_manager"
  | "report_agent"
  | "kafka_bus_operator"

export type AgentStepRisk = "read_only" | "safe_write" | "reversible_demo_change"

export type AgentRunContext = {
  runId: string
  mode: AgentRunMode
  requireLivePg: boolean
  requireKafka: boolean
}

export type AgentStepResult = {
  ok: boolean
  source: ProofSource
  summary: string
  blocking: boolean
  snapshot: RunSnapshot
}

export type AgentStep = {
  name: AgentStepName
  label: string
  risk: AgentStepRisk
  requiredForLivePg: boolean
  run(context: AgentRunContext): Promise<AgentStepResult>
}

export type AgentReasoner = {
  summarizeBehavior(input: Record<string, unknown>): Promise<string>
  writeExecutiveRecommendation(input: Record<string, unknown>): Promise<string>
  explainFailure(input: Record<string, unknown>): Promise<string>
}

export type AgentReasonerSelection = {
  id: "deterministic" | "anthropic_agent_sdk"
  model?: string
  reasoner: AgentReasoner
}

export type AgentReasonerCallResult = {
  text: string
  reasoner: "deterministic" | "anthropic_agent_sdk"
  requestedReasoner: "deterministic" | "anthropic_agent_sdk"
  model?: string
  fallback: boolean
  error?: string
}

export type AivenMcpRuntimeConfig = {
  enabled: boolean
  serverName: "aiven"
  source: "env" | "default"
  safeLabel: string
}

export const deterministicReasoner: AgentReasoner = {
  async summarizeBehavior(input) {
    const findingCount = typeof input.findingCount === "number" ? input.findingCount : 0
    return `Aiden mapped ${findingCount} PulseWall backend behaviors into the scoped Aiven migration plan.`
  },
  async writeExecutiveRecommendation(input) {
    const demoCutoverStatus = typeof input.demoCutoverStatus === "string" ? input.demoCutoverStatus : "unknown"
    return `Proceed with the scoped Aiven demo runtime after validation status: ${demoCutoverStatus}. Keep auth, storage, and RLS review as production blockers.`
  },
  async explainFailure(input) {
    const step = typeof input.step === "string" ? input.step : "one-click run"
    const reason = typeof input.reason === "string" ? input.reason : "unknown failure"
    return `${step} stopped before completion: ${reason}`
  }
}

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : undefined
}

const sanitizeReasonerInput = (input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeReasonerInput(item))
  }
  if (!input || typeof input !== "object") return input

  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => {
      if (/(token|password|secret|api[_-]?key|connection|string|dsn|url)/i.test(key)) {
        return [key, "[redacted]"]
      }
      if (typeof value === "string" && /^(postgres|postgresql|https?):\/\//i.test(value)) {
        return [key, "[redacted]"]
      }
      return [key, sanitizeReasonerInput(value)]
    })
  )
}

const safeReasonerError = (error: unknown) => {
  let message = error instanceof Error ? error.message : String(error)
  const apiKey = readEnv("ANTHROPIC_API_KEY")
  if (apiKey) message = message.split(apiKey).join("[ANTHROPIC_API_KEY]")
  const aivenToken = readEnv("AIVEN_TOKEN")
  if (aivenToken) message = message.split(aivenToken).join("[AIVEN_TOKEN]")
  return message.slice(0, 220)
}

const blockedLocalTools = [
  "Agent",
  "AskUserQuestion",
  "Bash",
  "Edit",
  "ExitPlanMode",
  "Glob",
  "Grep",
  "ListMcpResources",
  "NotebookEdit",
  "Read",
  "ReadMcpResource",
  "TaskCreate",
  "TaskGet",
  "TaskList",
  "TaskOutput",
  "TaskStop",
  "TaskUpdate",
  "TodoWrite",
  "WebFetch",
  "WebSearch",
  "Workflow",
  "Write"
]

const defaultAivenMcpUrl = "https://mcp.aiven.live/mcp?allow_secrets=true"

const aivenMcpToolNames = [
  "aiven_project_list",
  "aiven_service_list",
  "aiven_service_get",
  "aiven_pg_service_available_extensions",
  "aiven_kafka_topic_list"
]

const aivenMcpAllowedTools = aivenMcpToolNames.map((toolName) => `mcp__aiven__${toolName}`)
const aivenMcpAllowedToolSet = new Set(aivenMcpAllowedTools)

export const readAivenMcpRuntimeConfig = (): AivenMcpRuntimeConfig => {
  const configured = readEnv("AIVEN_MCP_URL")
  const url = configured ?? defaultAivenMcpUrl
  let safeLabel = "hosted Aiven MCP endpoint"
  try {
    safeLabel = new URL(url).host
  } catch {
    safeLabel = "configured Aiven MCP endpoint"
  }

  return {
    enabled: true,
    serverName: "aiven",
    source: configured ? "env" : "default",
    safeLabel
  }
}

const readAivenMcpUrl = () => readEnv("AIVEN_MCP_URL") ?? defaultAivenMcpUrl

const readPositiveInt = (name: string, fallback: number) => {
  const value = readEnv(name)
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1000 ? parsed : fallback
}

export const buildAivenMcpServers = (): Record<string, McpServerConfig> => ({
  aiven: {
    type: "http",
    url: readAivenMcpUrl(),
    timeout: readPositiveInt("AIVEN_MCP_TOOL_TIMEOUT_MS", 90_000),
    tools: aivenMcpToolNames.map((name) => ({
      name,
      permission_policy: "always_allow"
    }))
  }
})

const allowOnlyAivenMcpTools: CanUseTool = async (toolName, input) => {
  if (!toolName.startsWith("mcp__aiven__")) {
    return {
      behavior: "deny",
      message: "Aiden's Agent SDK runtime only permits the configured Aiven MCP server.",
      decisionClassification: "user_reject"
    }
  }

  if (!aivenMcpAllowedToolSet.has(toolName)) {
    return {
      behavior: "deny",
      message: `Aiden does not allow ${toolName} from the report/control agent path.`,
      decisionClassification: "user_reject"
    }
  }

  return {
    behavior: "allow",
    updatedInput: input,
    decisionClassification: "user_permanent"
  }
}

const agentSdkEnv = (apiKey: string): Record<string, string | undefined> => ({
  ANTHROPIC_API_KEY: apiKey,
  API_TIMEOUT_MS: "60000",
  CLAUDE_CODE_MAX_RETRIES: "1",
  CLAUDE_AGENT_SDK_CLIENT_APP: "aiden-sunstead/0.1.0",
  HOME: process.env.HOME,
  PATH: process.env.PATH,
  SHELL: process.env.SHELL,
  TMPDIR: process.env.TMPDIR,
  USER: process.env.USER
})

const readClaudeExecutable = () => {
  const configured = readEnv("CLAUDE_CODE_EXECUTABLE")
  if (configured && existsSync(configured)) return configured

  const homeClaude = process.env.HOME ? `${process.env.HOME}/.local/bin/claude` : undefined
  if (homeClaude && existsSync(homeClaude)) return homeClaude

  return undefined
}

const requestAnthropicText = async (
  input: Record<string, unknown>,
  instruction: string
) => {
  const apiKey = readEnv("ANTHROPIC_API_KEY")
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured")

  const model = readEnv("ANTHROPIC_MODEL") ?? "sonnet"
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 75_000)
  try {
    const prompt = [
      "You are Aiden's bounded Report/CTO Agent.",
      "Use only the provided JSON facts.",
      "Return only the requested prose. Do not use markdown.",
      "Do not invent live proof, prices, credentials, production readiness, or validation status.",
      "Before answering, try one safe read-only Aiven MCP call for project or service context if the configured server is reachable.",
      "If Aiven MCP is unavailable, answer from the provided JSON facts without claiming a live MCP call.",
      "Do not use shell, file, web, local settings, non-Aiven MCP servers, or unlisted Aiven MCP tools.",
      "Never mention secrets.",
      "",
      instruction,
      "",
      "Facts JSON:",
      JSON.stringify(sanitizeReasonerInput(input), null, 2)
    ].join("\n")

    for await (const message of query({
      prompt,
      options: {
        abortController,
        allowedTools: aivenMcpAllowedTools,
        canUseTool: allowOnlyAivenMcpTools,
        disallowedTools: blockedLocalTools,
        env: agentSdkEnv(apiKey),
        maxBudgetUsd: 0.05,
        maxTurns: 2,
        mcpServers: buildAivenMcpServers(),
        model,
        pathToClaudeCodeExecutable: readClaudeExecutable(),
        permissionMode: "dontAsk",
        settingSources: [],
        strictMcpConfig: true
      }
    })) {
      if (message.type !== "result") continue
      if (message.subtype === "success") {
        const result = message.result.trim()
        if (!result) throw new Error("Anthropic Agent SDK returned an empty result")
        return result
      }
      throw new Error(`Anthropic Agent SDK failed: ${message.errors.join("; ")}`)
    }
  } finally {
    clearTimeout(timeout)
  }

  throw new Error("Anthropic Agent SDK did not return a result")
}

const createAnthropicAgentSdkReasoner = (): AgentReasoner => ({
  summarizeBehavior(input) {
    return requestAnthropicText(
      input,
      "Summarize the detected PulseWall backend behavior for a live hackathon judge in one sentence under 30 words."
    )
  },
  writeExecutiveRecommendation(input) {
    return requestAnthropicText(
      input,
      "Write one CTO recommendation under 45 words. It must mention that the scoped demo runtime is Aiven-backed when validation passed, and keep auth/storage/RLS as production blockers."
    )
  },
  explainFailure(input) {
    return requestAnthropicText(
      input,
      "Explain the stopped migration gate in one sentence under 35 words. Be concrete and do not imply production data changed."
    )
  }
})

export const selectAgentReasoner = (): AgentReasonerSelection => {
  const requested = process.env.AGENT_REASONER?.trim()
  const apiKey = readEnv("ANTHROPIC_API_KEY")
  const shouldUseAnthropic = requested === "anthropic" || (requested !== "off" && Boolean(apiKey))
  if (shouldUseAnthropic && apiKey) {
    return {
      id: "anthropic_agent_sdk",
      model: readEnv("ANTHROPIC_MODEL") ?? "sonnet",
      reasoner: createAnthropicAgentSdkReasoner()
    }
  }
  return { id: "deterministic", reasoner: deterministicReasoner }
}

export const callAgentReasoner = async (
  selection: AgentReasonerSelection,
  method: keyof AgentReasoner,
  input: Record<string, unknown>
): Promise<AgentReasonerCallResult> => {
  try {
    return {
      text: await selection.reasoner[method](input),
      reasoner: selection.id,
      requestedReasoner: selection.id,
      model: selection.model,
      fallback: false
    }
  } catch (error) {
    return {
      text: await deterministicReasoner[method](input),
      reasoner: "deterministic",
      requestedReasoner: selection.id,
      model: selection.model,
      fallback: selection.id !== "deterministic",
      error: safeReasonerError(error)
    }
  }
}

export const readAgentRunMode = (): AgentRunMode => {
  const value = process.env.AGENT_RUN_MODE?.trim()
  if (value === "cached_ok" || value === "fixture" || value === "live_pg") return value
  return "live_pg"
}

export const runAgentSteps = async (context: AgentRunContext, steps: AgentStep[]) => {
  const results: AgentStepResult[] = []
  for (const step of steps) {
    const result = await step.run(context)
    results.push(result)
    if (!result.ok && result.blocking) {
      return { ok: false, stoppedAt: step, results }
    }
  }
  return { ok: true, stoppedAt: undefined, results }
}
