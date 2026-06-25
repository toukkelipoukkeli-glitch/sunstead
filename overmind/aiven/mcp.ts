// aiven/mcp.ts — run an Anthropic (claude-opus-4-8) agent wired to the Aiven MCP connector. This is
// the judged AUTONOMOUS surface: the model decides which aiven_* tools to call to satisfy a goal,
// and every real tool call becomes a Receipt on the Mission Control ledger.
//
// We drive the Messages API over RAW fetch + SSE streaming rather than the @anthropic-ai/sdk. The
// pinned SDK (0.32.1) is from before the MCP connector stabilized and its non-streaming fetch path
// reliably throws "Premature close" while the server-side MCP executes a tool — which silently
// tripped the UNAVAILABLE fallback and made the whole agentic surface look dead. Raw SSE keeps the
// connection alive for the full tool round-trip and gives us clean control over the wall-clock guard.
//
// Defensive contract: if ANTHROPIC_API_KEY / AIVEN_TOKEN are unset, or the API rejects the request,
// we throw 'aiven-agent-unavailable' so callers fall back to aiven/rest.ts. We never crash at import
// and never hang the pipeline (one wall-clock deadline via AbortController).

import { Receipt } from '../shared/types.ts'

const MCP_URL = 'https://mcp.aiven.live/mcp?allow_secrets=true'
// claude-sonnet-4-5 is retired and 404s (which silently tripped the UNAVAILABLE fallback, making the
// whole agentic-MCP surface look dead). Default to Opus 4.8 — the strongest model for the autonomous
// provision/migration decisions (we have the credits to run the best).
const MODEL = process.env.OVERMIND_AGENT_MODEL || 'claude-opus-4-8'
// Generous turn budget: the autonomous provision path may call several aiven_* tools in sequence
// (project_list → service_type_plans → service_create → topic_create). Default 16.
const MAX_TURNS = Number(process.env.OVERMIND_AGENT_MAX_TURNS || 16)
/** Hard wall-clock budget for the whole agent run. The agent NEVER hangs the pipeline. */
const TIMEOUT_MS = Number(process.env.OVERMIND_AGENT_TIMEOUT_MS || 90000)

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
type AnyBlock = Record<string, any>

interface StreamedMessage {
  stopReason: string | undefined
  text: string
  /** Assistant content blocks, reassembled from the SSE deltas (incl. mcp_tool_use input JSON). */
  blocks: AnyBlock[]
}

/**
 * One streamed Messages API turn over raw fetch + SSE. Reassembles content blocks (text and tool_use
 * input_json deltas) and the final stop_reason. Bounded by `signal` (the shared wall-clock).
 * Throws on any non-200 or stream error so the caller can decide whether to fall back.
 */
async function streamTurn(
  apiKey: string,
  messages: AnyBlock[],
  mcpServers: AnyBlock[],
  signal: AbortSignal,
): Promise<StreamedMessage> {
  const res = await fetch('https://api.anthropic.com/v1/messages?beta=true', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      stream: true,
      messages,
      mcp_servers: mcpServers,
    }),
    signal,
  })
  if (!res.ok || !res.body) {
    throw new Error(`anthropic ${res.status}`)
  }

  const blocks: AnyBlock[] = []
  let curText = '' // accumulates the current text block
  let curJson = '' // accumulates input_json_delta for the current tool_use block
  let stopReason: string | undefined
  let text = ''

  const finalizeBlock = () => {
    const last = blocks[blocks.length - 1]
    if (!last) return
    if (last.type === 'text') {
      last.text = curText
      text += curText
    } else if (last.type === 'mcp_tool_use' || last.type === 'tool_use') {
      if (curJson) {
        try {
          last.input = JSON.parse(curJson)
        } catch {
          /* leave whatever partial input the start event carried */
        }
      }
    }
    curText = ''
    curJson = ''
  }

  const decoder = new TextDecoder()
  let buf = ''
  for await (const chunk of res.body as any as AsyncIterable<Uint8Array>) {
    buf += decoder.decode(chunk, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
      if (!dataLine) continue
      let ev: AnyBlock
      try {
        ev = JSON.parse(dataLine.slice(5).trim())
      } catch {
        continue
      }
      switch (ev.type) {
        case 'content_block_start':
          blocks.push({ ...ev.content_block })
          curText = ''
          curJson = ''
          break
        case 'content_block_delta':
          if (ev.delta?.type === 'text_delta') curText += ev.delta.text
          else if (ev.delta?.type === 'input_json_delta') curJson += ev.delta.partial_json ?? ''
          break
        case 'content_block_stop':
          finalizeBlock()
          break
        case 'message_delta':
          if (ev.delta?.stop_reason) stopReason = ev.delta.stop_reason
          break
        case 'error':
          throw new Error(ev.error?.message || 'anthropic stream error')
        default:
          break
      }
    }
  }
  return { stopReason, text, blocks }
}

export async function runAivenAgent(
  prompt: string,
  emit?: (r: Receipt) => void
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error(UNAVAILABLE)
  const aivenToken = process.env.AIVEN_TOKEN
  if (!aivenToken) throw new Error(UNAVAILABLE)

  const mcpServers = [{ type: 'url', url: MCP_URL, name: 'aiven', authorization_token: aivenToken }]
  const messages: AnyBlock[] = [{ role: 'user', content: prompt }]

  // ONE generous wall-clock guard for the whole run via a shared AbortController. No racing
  // per-request timeout (that was the old flaky path). When the deadline fires we abort the in-flight
  // fetch and bail to the deterministic fallback so the pipeline keeps moving.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, Math.max(1, TIMEOUT_MS))

  let finalText = ''
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (timedOut) throw new Error(UNAVAILABLE)

      let res: StreamedMessage
      try {
        res = await streamTurn(apiKey, messages, mcpServers, controller.signal)
      } catch (e: any) {
        if (timedOut) throw new Error(UNAVAILABLE)
        // First-turn failure means the connector/beta/auth isn't usable → deterministic fallback.
        if (turn === 0) throw new Error(UNAVAILABLE)
        // Mid-conversation transient error: stop cleanly with what we have so far.
        break
      }

      // Emit a Receipt for every real aiven_* tool call (mcp_tool_use), and mark failed results.
      for (const block of res.blocks) {
        if (block.type === 'text' && typeof block.text === 'string') {
          finalText += block.text
        }
        if (block.type === 'mcp_tool_use' || block.type === 'tool_use') {
          const toolName: string = block.name ?? 'aiven_tool'
          if (toolName.startsWith('aiven') || block.type === 'mcp_tool_use') {
            emit?.(makeReceipt(toolName, summarizeInput(toolName, block.input), true))
          }
        }
        if (block.type === 'mcp_tool_result' && block.is_error) {
          emit?.(makeReceipt('aiven_tool_error', 'MCP tool returned an error', false))
        }
      }

      // The Aiven MCP is server-executed: the connector resolves mcp_tool_use internally and the
      // turn ends with end_turn/max_tokens. We only loop on a client-side `tool_use` pause (rare).
      if (res.stopReason !== 'tool_use') break

      messages.push({ role: 'assistant', content: res.blocks })
      const toolResults = res.blocks
        .filter((b) => b.type === 'tool_use')
        .map((b) => ({ type: 'tool_result', tool_use_id: b.id, content: 'ok' }))
      if (!toolResults.length) break
      messages.push({ role: 'user', content: toolResults })
    }
  } catch (e: any) {
    if (e?.message === UNAVAILABLE) throw e
    throw new Error(UNAVAILABLE)
  } finally {
    clearTimeout(timer)
  }

  return finalText.trim()
}

// ───────────────────────── deterministic MCP tool call (secrets) ─────────────────────────
// The Aiven REST v1 API redacts service passwords for our token scope (service_uri_params.password
// comes back as the literal "<redacted>"). The MCP endpoint with allow_secrets=true is the ONLY
// path that returns live credentials. This is a plain JSON-RPC tools/call — no model in the loop —
// so it's deterministic and fast. Returns the parsed connection-info object, or null on any failure.

export interface PgSecrets {
  service_uri?: string
  host?: string
  port?: number
  user?: string
  password?: string
  dbname?: string
  ca_cert?: string
}

/** Parse the MCP tool-result envelope (text content block wrapping a JSON blob inside a guard tag). */
function parseMcpJson(payload: any): any | null {
  try {
    const content = payload?.result?.content
    if (!Array.isArray(content)) return null
    const textBlock = content.find((c: any) => c?.type === 'text' && typeof c.text === 'string')
    if (!textBlock) return null
    const txt: string = textBlock.text
    // The server wraps the JSON in an <untrusted-aiven-response-...> guard tag; grab the JSON object.
    const start = txt.indexOf('{')
    const end = txt.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    return JSON.parse(txt.slice(start, end + 1))
  } catch {
    return null
  }
}

/**
 * Fetch LIVE Postgres connection secrets for `service` via the Aiven MCP (allow_secrets=true).
 * Deterministic JSON-RPC call, bounded by `timeoutMs`. Returns null (never throws) on any failure so
 * callers can fall back. This is how the migrator resolves overmind-grad's real password.
 */
export async function getPgSecrets(
  project: string,
  service: string,
  timeoutMs = 15000,
): Promise<PgSecrets | null> {
  const aivenToken = process.env.AIVEN_TOKEN
  if (!aivenToken) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs))
  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${aivenToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'aiven_service_connection_info', arguments: { project, service_name: service } },
      }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    let json: any
    if (ct.includes('text/event-stream')) {
      // SSE framing: pull the JSON from the last `data:` line.
      const text = await res.text()
      const dataLines = text
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
      const last = dataLines[dataLines.length - 1]
      if (!last) return null
      json = JSON.parse(last)
    } else {
      json = await res.json()
    }
    const info = parseMcpJson(json)
    if (!info) return null
    const params = info.service_uri_params ?? {}
    return {
      service_uri: info.service_uri,
      host: params.host,
      port: params.port != null ? Number(params.port) : undefined,
      user: params.user,
      password: params.password ?? info.users?.[0]?.password,
      dbname: params.dbname,
      ca_cert: info.ca_cert,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
