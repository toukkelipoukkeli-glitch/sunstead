// aiven/mcp.ts — run an Anthropic agent wired to the Aiven MCP (the judged autonomous surface).
//
// The agent calls `aiven_*` tools itself via the Messages API MCP connector. Each tool call is
// turned into a Receipt and emitted so the control-room ledger stays auditable.
//
// Defensive contract: if ANTHROPIC_API_KEY is unset, or the installed @anthropic-ai/sdk is too old
// to support the MCP connector, we throw 'aiven-agent-unavailable' so callers fall back to
// aiven/rest.ts. We never crash at import and never hang the pipeline.

import Anthropic from '@anthropic-ai/sdk'
import { Receipt } from '../shared/types.ts'

const MCP_URL = 'https://mcp.aiven.live/mcp?allow_secrets=true'
const MODEL = process.env.OVERMIND_AGENT_MODEL || 'claude-sonnet-4-5'
const MAX_TURNS = Number(process.env.OVERMIND_AGENT_MAX_TURNS || 16)

/** Sentinel error string callers match on to trigger the deterministic fallback. */
export const UNAVAILABLE = 'aiven-agent-unavailable'

function makeReceipt(action: string, summary: string, ok: boolean): Receipt {
  return {
    id: `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    summary,
    ok,
    ts: new Date().toISOString(),
  }
}

/** Short, readable summary of a tool input for the receipt ledger. */
function summarizeInput(name: string, input: unknown): string {
  try {
    const obj = (input ?? {}) as Record<string, any>
    const interesting = ['service_name', 'service', 'project', 'topic', 'plan', 'service_type', 'query']
    const parts: string[] = []
    for (const k of interesting) {
      if (obj[k] != null) {
        const v = typeof obj[k] === 'string' ? obj[k] : JSON.stringify(obj[k])
        parts.push(`${k}=${String(v).slice(0, 60)}`)
      }
    }
    return parts.length ? `${name} (${parts.join(', ')})` : name
  } catch {
    return name
  }
}

/**
 * Run the Aiven MCP agent on `prompt`. For every aiven_* tool the model invokes, `emit` (if given)
 * receives a Receipt. Returns the agent's final text answer.
 *
 * Throws UNAVAILABLE ('aiven-agent-unavailable') when the agent can't run, so the orchestrator can
 * fall back to aiven/rest.ts deterministically.
 */
export async function runAivenAgent(
  prompt: string,
  emit?: (r: Receipt) => void
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error(UNAVAILABLE)
  const aivenToken = process.env.AIVEN_TOKEN
  if (!aivenToken) throw new Error(UNAVAILABLE)

  let client: Anthropic
  try {
    client = new Anthropic({ apiKey })
  } catch {
    throw new Error(UNAVAILABLE)
  }

  // The MCP connector rides on a beta header + the `mcp_servers` request field. Older SDKs reject
  // unknown params; we pass it through `betas` and guard the whole call. If the runtime SDK or the
  // API rejects the connector, we surface UNAVAILABLE.
  const mcpServers = [
    {
      type: 'url' as const,
      url: MCP_URL,
      name: 'aiven',
      authorization_token: aivenToken,
    },
  ]

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }]

  // Detect beta-messages support up front; if the SDK shape is missing, bail to fallback.
  const betaMessages: any = (client as any)?.beta?.messages
  if (!betaMessages || typeof betaMessages.create !== 'function') {
    throw new Error(UNAVAILABLE)
  }

  let finalText = ''
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      let res: any
      try {
        res = await betaMessages.create({
          model: MODEL,
          max_tokens: 4096,
          messages,
          mcp_servers: mcpServers,
          betas: ['mcp-client-2025-04-04'],
        })
      } catch (e: any) {
        // First-turn failure almost always means the connector/beta isn't supported here.
        if (turn === 0) throw new Error(UNAVAILABLE)
        // Mid-conversation transient error: stop cleanly with what we have.
        break
      }

      // Walk the content blocks: collect text, emit receipts for tool/MCP calls.
      const content: any[] = res?.content ?? []
      for (const block of content) {
        if (block?.type === 'text' && typeof block.text === 'string') {
          finalText += block.text
        }
        // The MCP connector surfaces tool calls as `mcp_tool_use` (and results as
        // `mcp_tool_result`). Some SDK/beta combos use plain `tool_use`. Handle both.
        if (block?.type === 'mcp_tool_use' || block?.type === 'tool_use') {
          const toolName: string = block.name ?? 'aiven_tool'
          if (toolName.startsWith('aiven') || block?.type === 'mcp_tool_use') {
            emit?.(makeReceipt(toolName, summarizeInput(toolName, block.input), true))
          }
        }
        if (block?.type === 'mcp_tool_result') {
          // A failed MCP tool result lets us mark the receipt as not-ok.
          if (block.is_error) {
            emit?.(makeReceipt('aiven_tool_error', 'MCP tool returned an error', false))
          }
        }
      }

      const stop = res?.stop_reason
      // With the server-side MCP connector, the model+connector resolve tool calls internally, so a
      // normal completion ends the loop. If it paused for a (non-MCP) tool, we'd need to feed
      // results — but the Aiven MCP is server-executed, so `end_turn`/`stop_sequence`/`max_tokens`
      // all mean we're done.
      if (stop !== 'tool_use') break

      // Defensive: if somehow we get a client-side tool_use pause, append the assistant turn and a
      // minimal tool_result so we don't loop forever, then continue.
      messages.push({ role: 'assistant', content })
      const toolResults = content
        .filter((b) => b?.type === 'tool_use')
        .map((b) => ({
          type: 'tool_result' as const,
          tool_use_id: b.id,
          content: 'ok',
        }))
      if (!toolResults.length) break
      messages.push({ role: 'user', content: toolResults as any })
    }
  } catch (e: any) {
    if (e?.message === UNAVAILABLE) throw e
    // Any other unexpected failure → fall back deterministically.
    throw new Error(UNAVAILABLE)
  }

  return finalText.trim()
}
