// agents/swarm.ts — the Anthropic Agent SDK swarm wrappers.
//
// Five role-runners (Recon · Architect · Surgeon · Healer · CTO) that add reasoning +
// narration on top of the deterministic core/aiven work. Each runs a *bounded* Claude
// tool-loop with a role-specific system prompt, emits AgentActivity (working → done),
// and returns a structured result.
//
// Degradation contract: if ANTHROPIC_API_KEY is unset (or any SDK error fires), the
// runner still emits activity and returns a deterministic stub so the orchestrator's
// pipeline runs end-to-end with zero hard dependency on the model.

import Anthropic from '@anthropic-ai/sdk'
import { AgentActivity, AgentRole, AgentStatus } from '../shared/types.ts'

// ───────────────────────── config ─────────────────────────

const MODEL = process.env.OVERMIND_MODEL ?? 'claude-opus-4-8'
// Hard ceiling on loop turns so the swarm can never run away.
const MAX_TURNS = Number(process.env.OVERMIND_MAX_TURNS ?? 6)

let _client: Anthropic | null | undefined
/** Lazy client. Returns null when no key — every runner degrades gracefully on null. */
function client(): Anthropic | null {
  if (_client !== undefined) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    _client = null
    return _client
  }
  try {
    _client = new Anthropic({ apiKey })
  } catch {
    _client = null
  }
  return _client
}

// ───────────────────────── activity helpers ─────────────────────────

let _seq = 0
function activity(
  agentId: string,
  role: AgentRole,
  status: AgentStatus,
  task: string,
  detail?: string,
): AgentActivity {
  return { agentId, role, status, task, detail, ts: new Date().toISOString() }
}

type Emit = (a: AgentActivity) => void

// A tool the agent can call to do real work. `run` returns a string fed back as the
// tool_result. Keep these side-effect-light: the heavy deterministic ops live in core/.
interface AgentTool {
  name: string
  description: string
  input_schema: Anthropic.Tool.InputSchema
  run: (input: any) => Promise<string> | string
}

// ───────────────────────── the bounded loop ─────────────────────────

interface LoopResult {
  /** Final assistant text (the reasoning / explanation / narration). */
  text: string
  /** Whatever the tools accumulated — role-runners read this for structured output. */
  toolOutputs: Record<string, any>
  /** How many model turns ran (0 == stubbed, no model). */
  turns: number
  /** True when the model path actually ran; false when degraded to a stub. */
  usedModel: boolean
}

/**
 * Runs a bounded Claude tool-loop. Never throws: on any failure it returns a
 * best-effort partial so the caller can still produce a structured result.
 */
async function boundedLoop(
  system: string,
  userPrompt: string,
  tools: AgentTool[],
): Promise<LoopResult> {
  const toolOutputs: Record<string, any> = {}
  const anthropic = client()
  if (!anthropic) {
    return { text: '', toolOutputs, turns: 0, usedModel: false }
  }

  const toolDefs: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }))
  const byName = new Map(tools.map((t) => [t.name, t]))

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ]
  let lastText = ''
  let turns = 0

  try {
    for (let i = 0; i < MAX_TURNS; i++) {
      turns++
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system,
        messages,
        ...(toolDefs.length ? { tools: toolDefs } : {}),
      })

      // Capture any text the model emitted this turn.
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      if (text) lastText = text

      if (res.stop_reason !== 'tool_use') break

      const toolUses = res.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      )
      if (!toolUses.length) break

      // Echo the assistant turn (must include the tool_use blocks) before results.
      messages.push({ role: 'assistant', content: res.content })

      const results: Anthropic.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        const tool = byName.get(tu.name)
        let out = ''
        let isError = false
        if (!tool) {
          out = `Unknown tool: ${tu.name}`
          isError = true
        } else {
          try {
            out = String(await tool.run(tu.input))
            toolOutputs[tu.name] = tu.input
          } catch (e: any) {
            out = `Tool ${tu.name} failed: ${e?.message ?? e}`
            isError = true
          }
        }
        results.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: out,
          ...(isError ? { is_error: true } : {}),
        })
      }
      messages.push({ role: 'user', content: results })
    }
  } catch {
    // Model/network error — fall through with whatever we gathered. usedModel stays
    // true so the caller knows the model path was attempted (it'll still degrade the
    // *result* sensibly because lastText may be empty).
  }

  return { text: lastText, toolOutputs, turns, usedModel: true }
}

// ───────────────────────── role system prompts ─────────────────────────

const PROMPTS: Record<string, string> = {
  recon: [
    'You are RECON in the Aiven Overmind swarm. You scan a Lovable/Supabase app and',
    'reason about its behavior graph: tables, auth, storage, realtime, edge functions,',
    'vector search. Classify what migrates directly vs. must be rebuilt on Aiven.',
    'Be terse and concrete. State findings as short bullet facts, not prose.',
  ].join(' '),
  architect: [
    'You are ARCHITECT in the Aiven Overmind swarm. Given a behavior graph, you design',
    'the target Aiven stack (Postgres + pgvector, Kafka topics) and a migration plan,',
    'and you estimate cost. Prefer the cheapest plan that meets the workload. Output a',
    'crisp plan: services to provision, topics, and the order of operations.',
  ].join(' '),
  surgeon: [
    'You are SURGEON in the Aiven Overmind swarm. You generate a real Aiven-native',
    'backend that replaces every Supabase behavior (own JWT auth, /api data routes over',
    'Aiven PG, Kafka→SSE realtime bridge, pgvector search, bytea storage). The heavy',
    'deterministic codegen lives in core/aiven/surgeon — you add reasoning about which',
    'behaviors need a generated service and explain the replacement design.',
  ].join(' '),
  healer: [
    'You are HEALER in the Aiven Overmind swarm. You read a smoke-test error from the',
    'generated backend, diagnose the root cause, and propose the minimal patch to make',
    'the test pass. One focused fix at a time. Explain the cause in one line, then the fix.',
  ].join(' '),
  cto: [
    'You are CTO in the Aiven Overmind swarm — the persistent operator. You read live',
    'Aiven metrics and recommend scaling/index/cost/carbon moves. Each recommendation is',
    'one actionable change with a severity (info|warn|critical) and the metric behind it.',
  ].join(' '),
}

// ───────────────────────── role runners ─────────────────────────

export interface ReconResult {
  agentId: 'recon'
  reasoning: string
  notes: string[]
  usedModel: boolean
}

export async function runRecon(context: any, emit: Emit): Promise<ReconResult> {
  const id: AgentRole = 'recon'
  emit(activity('recon', id, 'working', 'Scanning source + introspecting behavior'))

  const scan = context?.scan ?? context?.graph?.source ?? {}
  const tables: string[] = scan?.tables ?? context?.graph?.source?.tables ?? []
  const summary = describeSource(scan, context)

  const { text, usedModel } = await boundedLoop(
    PROMPTS.recon,
    [
      'Here is the scanned source app. Classify its behaviors for migration to Aiven.',
      'Summarize the most important migration facts in <=6 short bullets.',
      '',
      JSON.stringify(summary, null, 2),
    ].join('\n'),
    [], // recon reasons over already-scanned data; no live tools needed
  )

  const notes = text
    ? text.split('\n').map((l) => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
    : deterministicReconNotes(summary, tables)

  emit(
    activity(
      'recon',
      id,
      'done',
      `Classified ${tables.length} table(s) + ${countBehaviors(summary)} behavior(s)`,
      notes[0],
    ),
  )
  return { agentId: 'recon', reasoning: text, notes, usedModel }
}

export interface ArchitectResult {
  agentId: 'architect'
  reasoning: string
  plan: string[]
  topics: string[]
  usedModel: boolean
}

export async function runArchitect(context: any, emit: Emit): Promise<ArchitectResult> {
  const id: AgentRole = 'architect'
  emit(activity('architect', id, 'working', 'Designing Aiven stack + plan + cost'))

  const graph = context?.graph ?? {}
  const source = graph?.source ?? {}
  const needsKafka = !!source?.hasRealtime
  const topics = deriveTopics(source)

  const { text, usedModel } = await boundedLoop(
    PROMPTS.architect,
    [
      'Design the target Aiven stack and a step-by-step migration plan for this graph.',
      `Realtime present: ${needsKafka}. Tables: ${(source?.tables ?? []).length}.`,
      'List the plan as <=7 numbered steps.',
      '',
      JSON.stringify({ source, readiness: graph?.readiness }, null, 2),
    ].join('\n'),
    [],
  )

  const plan = text
    ? text.split('\n').map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean)
    : deterministicPlan(source, needsKafka)

  emit(
    activity(
      'architect',
      id,
      'done',
      `Planned PG${needsKafka ? ' + Kafka' : ''} stack, ${plan.length} step(s)`,
      plan[0],
    ),
  )
  return { agentId: 'architect', reasoning: text, plan, topics, usedModel }
}

export interface SurgeonResult {
  agentId: 'surgeon'
  reasoning: string
  /** Names of behaviors the surgeon decided need a generated Aiven-native service. */
  generate: string[]
  usedModel: boolean
}

export async function runSurgeon(context: any, emit: Emit): Promise<SurgeonResult> {
  const id: AgentRole = 'surgeon'
  emit(activity('surgeon', id, 'working', 'Reasoning about generated backend services'))

  const graph = context?.graph ?? {}
  const source = graph?.source ?? {}
  const candidates = surgeonCandidates(source)

  const { text, usedModel } = await boundedLoop(
    PROMPTS.surgeon,
    [
      'For this app, decide which Supabase behaviors require a generated Aiven-native',
      'service (auth, storage, data API, realtime bridge, vector search). Name each and',
      'give a one-line reason. Tables: ' + (source?.tables ?? []).join(', ') + '.',
      '',
      JSON.stringify({ source }, null, 2),
    ].join('\n'),
    [],
  )

  // Derive the structured `generate` list from the candidates either way; the model
  // adds the explanation, the deterministic core does the actual codegen.
  emit(
    activity(
      'surgeon',
      id,
      'done',
      `Will generate ${candidates.length} service(s): ${candidates.join(', ') || 'none'}`,
      text ? text.split('\n')[0] : undefined,
    ),
  )
  return { agentId: 'surgeon', reasoning: text, generate: candidates, usedModel }
}

export interface HealResult {
  agentId: 'healer'
  reasoning: string
  /** One-line diagnosis. */
  diagnosis: string
  /** Proposed minimal patch description. */
  patch: string
  usedModel: boolean
}

export async function runHealer(context: any, emit: Emit): Promise<HealResult> {
  const id: AgentRole = 'healer'
  const artifact = context?.artifact ?? 'backend'
  const error = context?.error ?? context?.lastError ?? ''
  const attempt = context?.attempt ?? 1
  emit(activity('healer', id, 'working', `Diagnosing ${artifact} (attempt ${attempt})`))

  const { text, usedModel } = await boundedLoop(
    PROMPTS.healer,
    [
      `The generated artifact "${artifact}" failed its smoke test. Diagnose the root`,
      'cause in one line prefixed "CAUSE:", then give the minimal fix prefixed "FIX:".',
      '',
      'Error:',
      String(error).slice(0, 4000),
    ].join('\n'),
    [],
  )

  const diagnosis = pick(text, 'CAUSE:') || deterministicDiagnosis(String(error))
  const patch = pick(text, 'FIX:') || 'Apply defensive guard / retry; degrade gracefully.'

  emit(activity('healer', id, 'done', `Diagnosed ${artifact}`, diagnosis))
  return { agentId: 'healer', reasoning: text, diagnosis, patch, usedModel }
}

export interface CtoResult {
  agentId: 'cto'
  reasoning: string
  recommendations: Array<{ severity: 'info' | 'warn' | 'critical'; text: string }>
  usedModel: boolean
}

export async function runCto(context: any, emit: Emit): Promise<CtoResult> {
  const id: AgentRole = 'cto'
  emit(activity('cto', id, 'working', 'Reading Aiven metrics → recommendations'))

  const metrics = context?.metrics ?? {}
  const { text, usedModel } = await boundedLoop(
    PROMPTS.cto,
    [
      'Given these live Aiven metrics, emit up to 3 operator recommendations.',
      'Format each line as "<severity>: <action>" where severity is info|warn|critical.',
      '',
      JSON.stringify(metrics, null, 2),
    ].join('\n'),
    [],
  )

  const recommendations = text
    ? parseRecs(text)
    : deterministicRecs(metrics)

  emit(
    activity(
      'cto',
      id,
      'done',
      `Emitted ${recommendations.length} recommendation(s)`,
      recommendations[0]?.text,
    ),
  )
  return { agentId: 'cto', reasoning: text, recommendations, usedModel }
}

// ───────────────────────── deterministic fallbacks + helpers ─────────────────────────
// Everything below makes the swarm useful with zero model access. These are the stubs
// the degradation contract promises.

function describeSource(scan: any, context: any): any {
  const g = context?.graph?.source ?? {}
  return {
    framework: scan?.framework ?? g?.framework ?? 'unknown',
    usesSupabaseJs: scan?.usesSupabaseJs ?? g?.usesSupabaseJs ?? false,
    tables: scan?.tables ?? g?.tables ?? [],
    hasAuth: scan?.hasAuth ?? g?.hasAuth ?? false,
    hasStorage: scan?.hasStorage ?? g?.hasStorage ?? false,
    hasRealtime: scan?.hasRealtime ?? g?.hasRealtime ?? false,
    hasEdgeFunctions: scan?.hasEdgeFunctions ?? g?.hasEdgeFunctions ?? false,
    extensions: scan?.extensions ?? g?.extensions ?? [],
  }
}

function countBehaviors(s: any): number {
  return ['hasAuth', 'hasStorage', 'hasRealtime', 'hasEdgeFunctions'].filter(
    (k) => s?.[k],
  ).length
}

function deterministicReconNotes(s: any, tables: string[]): string[] {
  const notes: string[] = []
  notes.push(`${tables.length} table(s) → direct_migrate to Aiven Postgres`)
  if (s?.hasAuth) notes.push('Supabase auth → generate_service (own JWT auth on Aiven)')
  if (s?.hasStorage) notes.push('Supabase storage → generate_service (bytea on Aiven PG)')
  if (s?.hasRealtime) notes.push('Realtime channels → aiven_rewrite (Kafka + SSE bridge)')
  if ((s?.extensions ?? []).includes('vector') || (s?.extensions ?? []).includes('pgvector'))
    notes.push('pgvector → direct_migrate (embeddings + similarity search)')
  if (s?.hasEdgeFunctions) notes.push('Edge functions → generate_service (Aiven-hosted routes)')
  if (notes.length === 1) notes.push('No managed services detected — data-plane migration only')
  return notes
}

function deriveTopics(source: any): string[] {
  if (!source?.hasRealtime) return []
  const tables: string[] = source?.tables ?? []
  // One change-event topic per table, plus a generic realtime bus.
  const topics = tables.slice(0, 8).map((t) => `cdc.${t}`)
  topics.push('overmind.realtime')
  return topics
}

function deterministicPlan(source: any, needsKafka: boolean): string[] {
  const plan: string[] = [
    'Provision Aiven Postgres (with pgvector) via the Aiven MCP',
    'Migrate schema: tables, indexes, constraints, extensions',
    'Copy rows + embeddings into Aiven Postgres',
  ]
  if (needsKafka) {
    plan.push('Provision Aiven Kafka + create change-event topics')
    plan.push('Stand up Kafka→SSE realtime bridge in the generated backend')
  }
  if (source?.hasAuth) plan.push('Generate own JWT auth service (replace Supabase auth)')
  if (source?.hasStorage) plan.push('Generate bytea storage service (replace Supabase storage)')
  plan.push('Boot generated backend, run smoke tests, heal until green, cut over')
  return plan
}

function surgeonCandidates(source: any): string[] {
  const out: string[] = []
  if (source?.hasAuth) out.push('auth')
  if (source?.hasStorage) out.push('storage')
  if ((source?.tables ?? []).length) out.push('data_api')
  if (source?.hasRealtime) out.push('realtime_bridge')
  if ((source?.extensions ?? []).includes('vector') ||
    (source?.extensions ?? []).includes('pgvector')) out.push('vector')
  return out
}

function deterministicDiagnosis(error: string): string {
  const e = error.toLowerCase()
  if (e.includes('econnrefused') || e.includes('connection'))
    return 'Service not reachable yet — connection refused (provision/wait race).'
  if (e.includes('jwt') || e.includes('token') || e.includes('unauthorized'))
    return 'Auth misconfig — JWT secret/verification mismatch.'
  if (e.includes('relation') || e.includes('does not exist'))
    return 'Schema not applied — target table/relation missing.'
  if (e.includes('vector') || e.includes('extension'))
    return 'pgvector extension not enabled on target.'
  return 'Smoke test failed — inspect the first error line for the failing call.'
}

function deterministicRecs(
  metrics: any,
): Array<{ severity: 'info' | 'warn' | 'critical'; text: string }> {
  const recs: Array<{ severity: 'info' | 'warn' | 'critical'; text: string }> = []
  const cpu = num(metrics?.cpu ?? metrics?.cpuUsage)
  const mem = num(metrics?.mem ?? metrics?.memUsage)
  const conns = num(metrics?.connections)
  if (cpu != null && cpu > 80)
    recs.push({ severity: 'critical', text: `CPU at ${cpu}% — scale the PG plan up one tier.` })
  if (mem != null && mem > 85)
    recs.push({ severity: 'warn', text: `Memory at ${mem}% — enable PgBouncer / tune work_mem.` })
  if (conns != null && conns > 80)
    recs.push({ severity: 'warn', text: `${conns} connections — add PgBouncer pooling.` })
  if (!recs.length)
    recs.push({ severity: 'info', text: 'Metrics nominal — no scaling action needed.' })
  return recs
}

function parseRecs(
  text: string,
): Array<{ severity: 'info' | 'warn' | 'critical'; text: string }> {
  return text
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(info|warn|critical)\s*[:\-]\s*(.+)$/i)
      if (m) {
        return {
          severity: m[1].toLowerCase() as 'info' | 'warn' | 'critical',
          text: m[2].trim(),
        }
      }
      return { severity: 'info' as const, text: line }
    })
    .slice(0, 3)
}

// pull the text following a "LABEL:" marker from a model response
function pick(text: string, label: string): string {
  if (!text) return ''
  const idx = text.indexOf(label)
  if (idx === -1) return ''
  return text
    .slice(idx + label.length)
    .split('\n')[0]
    .trim()
}

function num(v: any): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
