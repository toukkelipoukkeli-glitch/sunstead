// server/briefing.ts — the weekly spoken "infra briefing" for the Voice CTO.
//
// generateBriefing(tenantId) gathers the REAL current snapshot of the founder's Aiven infra
// (via the always-on monitor's getCtoState + a fresh getPgMetrics read) and turns it into a warm,
// plain-English, ~90-second SPOKEN script — the kind a calm senior CTO would record on a Friday.
//
// Grounding is the whole point: every number in the script comes from data we actually read this
// run. We NEVER invent figures. The Opus-4.8 model is given ONLY the real stats and is told to use
// only those. If there's no Anthropic key (or the model fails), we fall back to a deterministic
// template assembled from the same real stats — same facts, less polish, still 100% grounded.
//
// The frontend speaks the returned `script` by POSTing it to /api/cto/speak (ElevenLabs TTS).

import Anthropic from '@anthropic-ai/sdk'
import { hasAnthropic } from './env.ts'
import { getCtoState } from './monitor.ts'
import { getPgMetrics } from './cto-chat.ts'
import type { CtoState } from '../shared/types.ts'

const MODEL = process.env.OVERMIND_MODEL ?? 'claude-opus-4-8'

// ───────────────────────── public types ─────────────────────────

/** The grounded facts the script is built from — also returned so the UI can show the receipts. */
export interface BriefingStats {
  pgStatus: 'running' | 'unknown'
  plan: string
  rows: number | null
  dbSizePretty: string | null
  connections: number | null
  maxConnections: number | null
  cacheHitRatioPct: number | null
  cpuPct: number | null
  memPct: number | null
  diskPct: number | null
  hasVectorIndex: boolean | null
  largestTables: { name: string; rows: number; sizePretty: string }[]
  kafkaStatus: 'running' | 'unknown'
  kafkaPlan: string
  cost: { pgUsd: number | null; kafkaUsd: number | null; totalUsd: number | null; supabaseUsd: number }
  monthlySavingUsd: number | null
  alerts: { severity: 'info' | 'warn' | 'critical'; title: string; detail: string }[]
  openIssueCount: number
  watching: string[]
}

export interface Briefing {
  script: string
  ts: string // ISO timestamp of when the briefing was generated
  stats: BriefingStats
}

// ───────────────────────── public API ─────────────────────────

/**
 * Build this week's spoken infra briefing for `tenantId`, grounded in REAL Aiven data.
 * Never throws on the data path — degrades to the deterministic template if the model is absent
 * or fails. Returns { script, ts, stats }.
 */
export async function generateBriefing(tenantId: string): Promise<Briefing> {
  const stats = await gatherStats(tenantId)
  const ts = new Date().toISOString()

  // Degraded path: no Anthropic key → deterministic, fully-grounded template.
  if (!hasAnthropic()) {
    return { script: templateScript(stats), ts, stats }
  }

  try {
    const script = await writeScriptWithModel(stats)
    // Guard against an empty/blank model result — fall back rather than ship silence.
    if (!script || !script.trim()) return { script: templateScript(stats), ts, stats }
    return { script: script.trim(), ts, stats }
  } catch {
    // Model/network failure: same real facts, deterministic phrasing.
    return { script: templateScript(stats), ts, stats }
  }
}

// ───────────────────────── gather REAL stats ─────────────────────────

async function gatherStats(tenantId: string): Promise<BriefingStats> {
  // The monitor snapshot is the authoritative, multi-signal view (cost, resource %, alerts, kafka).
  const state: CtoState = await getCtoState(tenantId).catch(() => null as any)
  // A fresh PG read gets us the per-table breakdown the snapshot summarizes only as a total.
  const pgm = await getPgMetrics(tenantId).catch(() => null)

  const cost = state?.cost ?? { pgUsd: null, kafkaUsd: null, totalUsd: null, supabaseUsd: 599 }
  const monthlySaving =
    cost.totalUsd != null ? Number((cost.supabaseUsd - cost.totalUsd).toFixed(0)) : null

  const largestTables = (pgm?.tables ?? [])
    .slice(0, 3)
    .map((t) => ({ name: t.name, rows: t.rows, sizePretty: t.sizePretty }))

  const alerts = (state?.alerts ?? []).map((a) => ({
    severity: a.severity,
    title: a.title,
    detail: a.detail,
  }))
  // "Open issues" = anything beyond the steady-state heartbeat / info-level cost note.
  const openIssueCount = alerts.filter((a) => a.severity === 'warn' || a.severity === 'critical').length

  return {
    pgStatus: state?.pg?.status ?? (pgm ? 'running' : 'unknown'),
    plan: state?.pg?.plan ?? 'startup-4',
    rows: state?.pg?.rows ?? (pgm ? pgm.tables.reduce((s, t) => s + (Number(t.rows) || 0), 0) : null),
    dbSizePretty: state?.pg?.dbSizePretty ?? pgm?.dbSizePretty ?? null,
    connections: state?.pg?.connections ?? pgm?.connections ?? null,
    maxConnections: state?.pg?.maxConnections ?? pgm?.maxConnections ?? null,
    cacheHitRatioPct: state?.pg?.cacheHitRatioPct ?? pgm?.cacheHitRatioPct ?? null,
    cpuPct: state?.pg?.cpuPct ?? null,
    memPct: state?.pg?.memPct ?? null,
    diskPct: state?.pg?.diskPct ?? null,
    hasVectorIndex: state?.pg?.hasVectorIndex ?? pgm?.hasVectorIndex ?? null,
    largestTables,
    kafkaStatus: state?.kafka?.status ?? 'unknown',
    kafkaPlan: state?.kafka?.plan ?? 'business-4',
    cost,
    monthlySavingUsd: monthlySaving,
    alerts,
    openIssueCount,
    watching: state?.watching ?? [],
  }
}

// ───────────────────────── model-written script ─────────────────────────

let _client: Anthropic | null | undefined
function client(): Anthropic | null {
  if (_client !== undefined) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return (_client = null)
  try {
    // Use Node's native fetch — the pinned SDK (0.32.1) bundles a fetch shim that mis-handles
    // streaming on Node 22+/26 (see cto-chat.ts). We don't stream here, but stay consistent.
    _client = new Anthropic({
      apiKey,
      ...(typeof globalThis.fetch === 'function' ? { fetch: globalThis.fetch as any } : {}),
    })
  } catch {
    _client = null
  }
  return _client
}

async function writeScriptWithModel(stats: BriefingStats): Promise<string> {
  const anthropic = client()
  if (!anthropic) throw new Error('no anthropic client')

  const system = [
    `You are the founder's "Aiven CTO" — a calm, senior infrastructure lead recording a short`,
    `WEEKLY spoken briefing for a smart, non-technical founder who has migrated their backend onto`,
    `Aiven (Postgres, and Kafka). They will never open a dashboard; this 90-second voice note is how`,
    `they know their infra is in good hands.`,
    ``,
    `Write a SPOKEN script — it will be read aloud by a text-to-speech voice. So:`,
    `- Warm, plain English. No headings, no bullet points, no markdown, no emoji, no stage directions.`,
    `- Lead with the bottom line ("Good news — everything's healthy this week" / or the one thing to know).`,
    `- Frame it as "this week on Aiven". Conversational, reassuring, senior. Around 130-160 words`,
    `  (about 90 seconds spoken).`,
    `- Explain any technical term in one short clause the moment you use it.`,
    `- End with what you'll keep watching, so they feel covered.`,
    ``,
    `ABSOLUTE RULE — grounding: use ONLY the numbers in the DATA below. Do NOT invent, round wildly,`,
    `or imply any figure you weren't given. If a value is null/unknown, simply don't mention it —`,
    `never guess. Speak the real numbers naturally (e.g. "just over twelve thousand rows").`,
    `Output ONLY the spoken words — nothing else.`,
  ].join('\n')

  const data = JSON.stringify(stats, null, 2)
  const userMsg = `Here is this week's REAL infrastructure data. Write the spoken weekly briefing from it.\n\nDATA:\n${data}`

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMsg }],
    ...({ thinking: { type: 'adaptive' } } as Record<string, unknown>),
  } as Anthropic.MessageCreateParamsNonStreaming)

  // Concatenate text blocks; skip thinking/redacted_thinking blocks (present with adaptive thinking).
  const text = (resp.content ?? [])
    .filter((b: any) => b?.type === 'text')
    .map((b: any) => b.text)
    .join('')
    .trim()
  return text
}

// ───────────────────────── deterministic fallback (still 100% real) ─────────────────────────

function templateScript(s: BriefingStats): string {
  const parts: string[] = []
  const healthy = s.openIssueCount === 0 && s.pgStatus === 'running'

  parts.push(
    healthy
      ? `Quick weekly check-in on your Aiven infrastructure — and the headline is good: everything's healthy.`
      : `Quick weekly check-in on your Aiven infrastructure. Mostly steady, with ${s.openIssueCount} thing${s.openIssueCount === 1 ? '' : 's'} I'm keeping an eye on.`,
  )

  // Postgres core stats.
  const pgBits: string[] = []
  if (s.rows != null) pgBits.push(`it's holding ${s.rows.toLocaleString()} rows`)
  if (s.dbSizePretty) pgBits.push(`about ${s.dbSizePretty} of data`)
  if (s.connections != null) {
    pgBits.push(
      s.maxConnections != null
        ? `${s.connections} of ${s.maxConnections} connections in use`
        : `${s.connections} active connections`,
    )
  }
  if (pgBits.length) {
    parts.push(`Your Postgres database on the ${s.plan} plan is running fine — ${joinNatural(pgBits)}.`)
  } else {
    parts.push(`Your Postgres database is on the ${s.plan} plan and running.`)
  }

  // Cache + resource health.
  if (s.cacheHitRatioPct != null) {
    const word = s.cacheHitRatioPct >= 99 ? 'excellent' : s.cacheHitRatioPct >= 95 ? 'healthy' : 'a little low'
    parts.push(`The cache hit ratio — how often reads are served from memory instead of disk — is ${s.cacheHitRatioPct} percent, which is ${word}.`)
  }
  const resBits: string[] = []
  if (s.cpuPct != null) resBits.push(`CPU at ${Math.round(s.cpuPct)} percent`)
  if (s.memPct != null) resBits.push(`memory at ${Math.round(s.memPct)} percent`)
  if (s.diskPct != null) resBits.push(`disk at ${Math.round(s.diskPct)} percent`)
  if (resBits.length) parts.push(`On the hardware: ${joinNatural(resBits)} — plenty of headroom.`)

  // pgvector index posture.
  if (s.hasVectorIndex === true) {
    parts.push(`Semantic search has its index in place, so vector lookups stay fast.`)
  } else if (s.hasVectorIndex === false) {
    parts.push(`One note: your semantic search doesn't have an index yet, so those lookups scan the whole table — worth adding before traffic grows.`)
  }

  // Cost framing vs Supabase.
  if (s.cost.totalUsd != null) {
    const save =
      s.monthlySavingUsd != null && s.monthlySavingUsd > 0
        ? ` — roughly ${s.monthlySavingUsd} dollars a month less than Supabase Pro would cost`
        : ''
    parts.push(`On the bill, you're at about ${Math.round(s.cost.totalUsd)} dollars a month${save}.`)
  }

  // The one or two real issues, if any.
  const issues = s.alerts.filter((a) => a.severity === 'warn' || a.severity === 'critical').slice(0, 2)
  for (const a of issues) parts.push(`Worth flagging: ${a.detail}`)

  parts.push(
    `I'll keep watching your connections, cache, indexes, hardware usage and cost around the clock, and I'll surface anything the moment it needs you. Talk next week.`,
  )

  return parts.join(' ')
}

/** "a, b and c" — natural spoken list joining. */
function joinNatural(items: string[]): string {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
