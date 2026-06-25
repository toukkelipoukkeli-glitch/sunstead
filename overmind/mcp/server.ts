// overmind/mcp/server.ts
// ─────────────────────────────────────────────────────────────────────────────
// The Overmind MCP server — "the agentic operator layer that extends the Aiven MCP."
//
// The Aiven MCP gives an agent the raw Aiven primitives (create a service, run a
// query, fetch metrics). Overmind sits one level up: it turns those primitives into
// OPERATIONS a non-expert (human or agent) actually wants — "migrate this Lovable
// app onto Aiven", "is my database healthy", "what should I do next", "what does it
// cost vs Supabase". Every tool here WRAPS the already-working Overmind functions
// (server/*, core/*, aiven/*) and hits LIVE Aiven (project touko-1f1c, services
// overmind-pg + overmind-kafka). Nothing is reimplemented or mocked.
//
// Transport: stdio (McpServer + StdioServerTransport from the official SDK), so it
// drops into any MCP client (Claude Code, Inspector, etc.).
//
// Env + paths: we chdir to the Overmind root before importing anything that reads
// process.env or a source-dir path, so `.env.local`, the default `../demo/live-hype-wall`
// source, and the parent node_modules all resolve exactly as they do when the engine
// runs normally — this MCP is a thin façade, not a fork.
// ─────────────────────────────────────────────────────────────────────────────

// ── 0. FIRST import: absolute-path env load + chdir to the Overmind root. ───────
// This MUST precede every engine import (ESM evaluates imports in source order), so
// AIVEN_TOKEN / DATABASE_URL / etc. are present by the time server/env.ts runs.
import './bootstrap.ts'

// server/env.ts re-loads env (harmlessly, dotenv won't override) and exposes the flags.
import {
  AIVEN_PROJECT,
  SOURCE_REPO_DIR,
  hasAnthropic,
  hasAivenToken,
} from '../server/env.ts'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import type { SwarmEvent, BehaviorGraph, CtoRecommendation } from '../shared/types.ts'

// ── Engine functions we WRAP (never reimplement). ──────────────────────────────
import { scanRepo } from '../core/scan.ts'
import { introspectSource } from '../core/introspect.ts'
import { buildGraph } from '../core/graph.ts'
import { runMigration } from '../server/orchestrator.ts'
import { getPgMetrics, summarizeMetrics } from '../server/cto-chat.ts'
import { ctoTick } from '../server/cto.ts'
import * as rest from '../aiven/rest.ts'
import { getTenant, ensureDemoTenant } from '../server/tenants.ts'

// ─────────────────────────────── helpers ───────────────────────────────────────

const DEFAULT_SOURCE = SOURCE_REPO_DIR || '../demo/live-hype-wall'
const DEFAULT_TENANT = 'demo'

/** A tool result: one text block. The SDK wraps the rest. */
function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] }
}

/** Run something, but never let a thrown error crash the server — degrade to a clear message. */
async function safe(label: string, fn: () => Promise<any>) {
  try {
    return await fn()
  } catch (e: any) {
    return textResult(
      `Overmind ${label} hit an error talking to live Aiven: ${e?.message ?? String(e)}\n` +
        `(The Overmind engine is defensive; this usually means a transient Aiven/network issue or a missing credential in .env.local.)`,
    )
  }
}

/**
 * Resolve which Aiven Postgres service a tenant maps to. The 'demo' tenant → overmind-pg
 * (our shared bridge account). Reads the live tenant row; falls back to the well-known names
 * so a tool never fails just because the tenants table hasn't been bootstrapped yet.
 */
async function resolvePgService(tenant: string): Promise<string> {
  try {
    const t = (await getTenant(tenant)) ?? (tenant === 'demo' ? await ensureDemoTenant() : null)
    if (t?.pg_service) return t.pg_service
  } catch {
    /* fall through to default */
  }
  return process.env.OVERMIND_PG_SERVICE || 'overmind-pg'
}

async function resolveKafkaService(tenant: string): Promise<string | null> {
  try {
    const t = (await getTenant(tenant)) ?? (tenant === 'demo' ? await ensureDemoTenant() : null)
    if (t?.kafka_service) return t.kafka_service
  } catch {
    /* ignore */
  }
  return tenant === 'demo' ? 'overmind-kafka' : null
}

// ─────────────────────────────── the server ────────────────────────────────────

const server = new McpServer({
  name: 'overmind',
  version: '0.1.0',
})

// ── overmind_analyze ── read-only behavior-graph recon ──────────────────────────
// scanRepo + introspectSource + buildGraph: the "behavior migration" brain. Fast, no
// provisioning, no writes — safe to call first to understand a Lovable/Supabase app.
server.registerTool(
  'overmind_analyze',
  {
    title: 'Analyze a Lovable/Supabase app (behavior graph)',
    description:
      'OVERMIND OPERATOR LAYER (extends the Aiven MCP). Statically scan a Lovable/Supabase ' +
      'source app and (if a SOURCE_DATABASE_URL is set) introspect its live DB, then build the ' +
      'Overmind "behavior graph": every backend behavior (tables, indexes, functions, triggers, ' +
      'RLS, auth, storage, realtime, RPC, edge functions, the data-API surface) classified by how ' +
      'Overmind would move it onto Aiven (direct_migrate / aiven_rewrite / generate_service / ' +
      'review / cut), with a 0-100 readiness score. Fast and READ-ONLY — no Aiven writes, no ' +
      'provisioning. Use this first to understand an app before migrating it.',
    inputSchema: {
      source: z
        .string()
        .optional()
        .describe(
          `Path to the Lovable/Supabase source repo. Defaults to the bundled demo app (${DEFAULT_SOURCE}).`,
        ),
    },
  },
  async ({ source }) =>
    safe('analyze', async () => {
      const dir = source || DEFAULT_SOURCE
      const scan = await scanRepo(dir)
      // introspectSource no-ops gracefully (returns empty introspection) without SOURCE_DATABASE_URL.
      const intro = await introspectSource(process.env.SOURCE_DATABASE_URL || '')
      const graph: BehaviorGraph = buildGraph(scan, intro)

      const byClass: Record<string, number> = {}
      const byKind: Record<string, number> = {}
      for (const n of graph.nodes) {
        byClass[n.classification] = (byClass[n.classification] ?? 0) + 1
        byKind[n.kind] = (byKind[n.kind] ?? 0) + 1
      }

      const lines: string[] = []
      lines.push(`Overmind behavior graph for ${dir}`)
      lines.push('')
      lines.push(`Framework: ${graph.source.framework} · uses @supabase/supabase-js: ${graph.source.usesSupabaseJs}`)
      lines.push(
        `Capabilities: auth=${graph.source.hasAuth}, storage=${graph.source.hasStorage}, ` +
          `realtime=${graph.source.hasRealtime}, edge functions=${graph.source.hasEdgeFunctions}, ` +
          `extensions=[${graph.source.extensions.join(', ') || 'none'}]`,
      )
      lines.push(`Tables: ${graph.source.tables.join(', ') || 'none'}`)
      lines.push('')
      lines.push(`Behaviors recovered: ${graph.nodes.length}`)
      lines.push(
        `By Aiven plan: ${Object.entries(byClass)
          .map(([k, v]) => `${v}× ${k}`)
          .join(', ')}`,
      )
      lines.push(
        `By kind: ${Object.entries(byKind)
          .map(([k, v]) => `${v}× ${k}`)
          .join(', ')}`,
      )
      lines.push(`Migration readiness: ${graph.readiness}/100`)
      lines.push('')
      lines.push(`Summary: ${graph.summary}`)
      lines.push('')
      lines.push('All behaviors:')
      for (const n of graph.nodes) {
        lines.push(`  • [${n.classification} → ${n.target}] ${n.kind}:${n.name} — ${n.detail}`)
      }

      return {
        content: [
          { type: 'text' as const, text: lines.join('\n') },
          // Also hand back the structured graph so an agent can reason over it directly.
          {
            type: 'text' as const,
            text:
              'Structured graph (JSON):\n' +
              JSON.stringify(
                {
                  source: graph.source,
                  readiness: graph.readiness,
                  summary: graph.summary,
                  countsByClassification: byClass,
                  countsByKind: byKind,
                  behaviors: graph.nodes,
                },
                null,
                2,
              ),
          },
        ],
      }
    }),
)

// ── overmind_status ── live infra health, plain English ─────────────────────────
server.registerTool(
  'overmind_status',
  {
    title: 'Live infra health (plain English)',
    description:
      'OVERMIND OPERATOR LAYER. Read a LIVE health snapshot of the tenant\'s Aiven Postgres ' +
      '(via Overmind\'s getPgMetrics over pg_stat_*) and return it as plain English: total DB ' +
      'size, active vs max connections, buffer cache hit ratio, the largest tables with row ' +
      'counts, and whether semantic search has an ANN index. This is what the Aiven CTO reads ' +
      'before answering — call it to know "how is my database doing". READ-ONLY.',
    inputSchema: {
      tenant: z
        .string()
        .optional()
        .describe(`Tenant id, or 'demo' for the live overmind-pg service. Defaults to '${DEFAULT_TENANT}'.`),
    },
  },
  async ({ tenant }) =>
    safe('status', async () => {
      const t = tenant || DEFAULT_TENANT
      const m = await getPgMetrics(t)
      if (!m) {
        return textResult(
          `No live Postgres connection is configured for tenant "${t}" (DATABASE_URL unset in .env.local), ` +
            `so Overmind can't read its infra right now.`,
        )
      }
      const summary = summarizeMetrics(m)
      return {
        content: [
          { type: 'text' as const, text: summary },
          {
            type: 'text' as const,
            text: 'Raw metrics (JSON):\n' + JSON.stringify(m, null, 2),
          },
        ],
      }
    }),
)

// ── overmind_advise ── the CTO's recommendations ────────────────────────────────
server.registerTool(
  'overmind_advise',
  {
    title: 'Aiven CTO recommendations',
    description:
      'OVERMIND OPERATOR LAYER. Run one tick of the always-on "Aiven CTO" operator (Overmind\'s ' +
      'ctoTick) against the tenant\'s LIVE Aiven Postgres and return its recommendations: pgvector ' +
      'index advisories, connection-pooling / PgBouncer guidance, cache-hit and scaling calls, ' +
      'carbon-aware region notes — each grounded in real pg_stat_* numbers and severity-tagged ' +
      '(info / warn / critical). Advisory-only: it never mutates infra. Use it for "what should I ' +
      'do next with my database".',
    inputSchema: {
      tenant: z
        .string()
        .optional()
        .describe(`Tenant id, or 'demo'. Defaults to '${DEFAULT_TENANT}'. (ctoTick reads the live overmind-pg DB.)`),
    },
  },
  async ({ tenant }) =>
    safe('advise', async () => {
      void tenant // ctoTick reads DATABASE_URL (the demo tenant's overmind-pg) directly.
      const recs: CtoRecommendation[] = []
      const emit = (e: SwarmEvent) => {
        if (e.type === 'cto') recs.push(e.rec)
      }
      await ctoTick(emit)

      if (!recs.length) {
        return textResult('The Aiven CTO produced no recommendations this tick (infra looks nominal).')
      }

      const sev = (s: CtoRecommendation['severity']) =>
        s === 'critical' ? 'CRITICAL' : s === 'warn' ? 'WARN' : 'info'
      const lines = [`Aiven CTO recommendations (${recs.length}):`, '']
      for (const r of recs) {
        lines.push(`• [${sev(r.severity)}] ${r.title}`)
        lines.push(`    ${r.detail}`)
        lines.push(`    → ${r.action}`)
        if (r.metric) lines.push(`    metric: ${r.metric}`)
      }
      return {
        content: [
          { type: 'text' as const, text: lines.join('\n') },
          { type: 'text' as const, text: 'Recommendations (JSON):\n' + JSON.stringify(recs, null, 2) },
        ],
      }
    }),
)

// ── overmind_cost ── Aiven cost vs Supabase ─────────────────────────────────────
server.registerTool(
  'overmind_cost',
  {
    title: 'Aiven cost + savings vs Supabase',
    description:
      'OVERMIND OPERATOR LAYER. Summarize what the tenant\'s Aiven stack costs and the savings vs ' +
      'Supabase Pro, using LIVE Aiven plan pricing (aiven/rest planPricing) for the running ' +
      'Postgres (+ Kafka if present) plus Overmind\'s migration cost framing. READ-ONLY.',
    inputSchema: {
      tenant: z.string().optional().describe(`Tenant id, or 'demo'. Defaults to '${DEFAULT_TENANT}'.`),
    },
  },
  async ({ tenant }) =>
    safe('cost', async () => {
      const t = tenant || DEFAULT_TENANT
      const pgService = await resolvePgService(t)
      const kafkaService = await resolveKafkaService(t)

      // Read live state so we price the ACTUAL running plan, not an assumption.
      let pgPlan = 'startup-4'
      let pgCloud = 'google-europe-north1'
      let pgState = 'UNKNOWN'
      let kafkaPlan: string | null = null
      let kafkaCloud = pgCloud
      let kafkaState: string | null = null

      if (hasAivenToken()) {
        try {
          const svc = await rest.getService(AIVEN_PROJECT, pgService)
          pgPlan = svc?.plan || pgPlan
          pgCloud = svc?.cloud_name || pgCloud
          pgState = (svc?.state || 'UNKNOWN').toUpperCase()
        } catch {
          /* keep defaults */
        }
        if (kafkaService) {
          try {
            const ks = await rest.getService(AIVEN_PROJECT, kafkaService)
            kafkaPlan = ks?.plan || 'startup-2'
            kafkaCloud = ks?.cloud_name || pgCloud
            kafkaState = (ks?.state || 'UNKNOWN').toUpperCase()
          } catch {
            /* kafka may not exist for this tenant */
          }
        }
      }

      // Live plan pricing per service (per-month USD where Aiven exposes it).
      let pgMonthly: number | null = null
      let kafkaMonthly: number | null = null
      if (hasAivenToken()) {
        try {
          const p = await rest.planPricing(AIVEN_PROJECT, 'pg', pgPlan, pgCloud)
          if (typeof p.pricePerMonthUsd === 'number') pgMonthly = p.pricePerMonthUsd
        } catch {
          /* ignore */
        }
        if (kafkaService && kafkaPlan) {
          try {
            const k = await rest.planPricing(AIVEN_PROJECT, 'kafka', kafkaPlan, kafkaCloud)
            if (typeof k.pricePerMonthUsd === 'number') kafkaMonthly = k.pricePerMonthUsd
          } catch {
            /* ignore */
          }
        }
      }

      // Overmind's cost framing (same numbers the orchestrator emits). Use live pricing when we
      // got it; otherwise fall back to the engine's deterministic estimate so we never show a blank.
      const liveKnown = pgMonthly != null || kafkaMonthly != null
      const aivenUsd =
        liveKnown
          ? Math.round((pgMonthly ?? (kafkaService ? 90 : 90)) + (kafkaMonthly ?? (kafkaService ? 200 : 0)))
          : kafkaService
          ? 290
          : 90
      const supabaseUsd = 599
      const savings = supabaseUsd - aivenUsd
      const savingsPct = Math.round((savings / supabaseUsd) * 100)

      const lines: string[] = []
      lines.push('Aiven cost vs Supabase Pro')
      lines.push('')
      lines.push(
        `• Postgres "${pgService}" — plan ${pgPlan} in ${pgCloud}${pgState !== 'UNKNOWN' ? ` (${pgState})` : ''}` +
          (pgMonthly != null ? `: ~$${pgMonthly}/mo (live Aiven pricing)` : ': pricing estimate'),
      )
      if (kafkaService) {
        lines.push(
          `• Kafka "${kafkaService}" — plan ${kafkaPlan ?? 'startup-2'} in ${kafkaCloud}` +
            (kafkaState ? ` (${kafkaState})` : '') +
            (kafkaMonthly != null ? `: ~$${kafkaMonthly}/mo (live Aiven pricing)` : ': pricing estimate'),
        )
      }
      lines.push('')
      lines.push(`Aiven total: ~$${aivenUsd}/mo`)
      lines.push(`Supabase Pro (equivalent): $${supabaseUsd}/mo`)
      // Carbon note only when the real region is a known low-carbon grid — never assert it blindly.
      const lowCarbon = /north1|north-1|nordic|sweden|finland|fra/i.test(pgCloud)
      const carbonNote = lowCarbon ? `, running in a low-carbon European region (${pgCloud})` : ` (region ${pgCloud})`
      lines.push(
        savings > 0
          ? `Savings: ~$${savings}/mo (~${savingsPct}% cheaper)${carbonNote}.`
          : `Aiven runs ~$${-savings}/mo above the Supabase Pro baseline at this plan tier${carbonNote}.`,
      )

      return {
        content: [
          { type: 'text' as const, text: lines.join('\n') },
          {
            type: 'text' as const,
            text:
              'Cost detail (JSON):\n' +
              JSON.stringify(
                {
                  pg: { service: pgService, plan: pgPlan, cloud: pgCloud, state: pgState, monthlyUsd: pgMonthly },
                  kafka: kafkaService
                    ? { service: kafkaService, plan: kafkaPlan, cloud: kafkaCloud, state: kafkaState, monthlyUsd: kafkaMonthly }
                    : null,
                  aivenUsd,
                  supabaseUsd,
                  savingsUsd: savings,
                  savingsPct,
                  livePricing: liveKnown,
                },
                null,
                2,
              ),
          },
        ],
      }
    }),
)

// ── overmind_services ── list the tenant's Aiven services ───────────────────────
server.registerTool(
  'overmind_services',
  {
    title: 'List the tenant\'s Aiven services',
    description:
      'OVERMIND OPERATOR LAYER. List the LIVE Aiven services in the tenant\'s project (name, type, ' +
      'plan, state, cloud region) via aiven/rest listServices, flagging the ones Overmind manages ' +
      'for this tenant (its Postgres + Kafka). READ-ONLY.',
    inputSchema: {
      tenant: z.string().optional().describe(`Tenant id, or 'demo'. Defaults to '${DEFAULT_TENANT}'.`),
    },
  },
  async ({ tenant }) =>
    safe('services', async () => {
      if (!hasAivenToken()) {
        return textResult('AIVEN_TOKEN is not configured in .env.local — cannot list live Aiven services.')
      }
      const t = tenant || DEFAULT_TENANT
      const pgService = await resolvePgService(t)
      const kafkaService = await resolveKafkaService(t)
      const managed = new Set([pgService, kafkaService].filter(Boolean) as string[])

      const svcs = await rest.listServices(AIVEN_PROJECT)
      const rows = svcs.map((s) => ({
        name: s.service_name,
        type: s.service_type,
        plan: s.plan,
        state: s.state,
        cloud: s.cloud_name,
        managedByOvermind: managed.has(s.service_name),
      }))

      const lines = [`Aiven services in project ${AIVEN_PROJECT} (${rows.length}):`, '']
      for (const r of rows) {
        lines.push(
          `• ${r.name} — ${r.type}, plan ${r.plan}, ${r.state}, ${r.cloud}` +
            (r.managedByOvermind ? '  [Overmind-managed for this tenant]' : ''),
        )
      }
      return {
        content: [
          { type: 'text' as const, text: lines.join('\n') },
          { type: 'text' as const, text: 'Services (JSON):\n' + JSON.stringify(rows, null, 2) },
        ],
      }
    }),
)

// ── overmind_migrate ── the full real migration ─────────────────────────────────
// The big one: drive the entire recon→…→operate state machine against LIVE Aiven,
// collecting the SwarmEvent stream, and return the final summary + key receipts.
server.registerTool(
  'overmind_migrate',
  {
    title: 'Migrate a Lovable/Supabase app onto Aiven (full run)',
    description:
      'OVERMIND OPERATOR LAYER — the headline operation. Run Overmind\'s FULL autonomous migration ' +
      '(runMigration: recon → graph → plan → provision → migrate → generate → heal → verify → ' +
      'cutover → operate) for a Lovable/Supabase app against LIVE Aiven (project ' +
      `${AIVEN_PROJECT}, services overmind-pg + overmind-kafka). It verifies the live services, ` +
      'reads real row counts off Aiven Postgres, round-trips a realtime event over the live Aiven ' +
      'Kafka, and hands off to the CTO operator. Returns the final readiness summary plus the key ' +
      'receipts (auditable Aiven actions). This is longer-running than the read-only tools and ' +
      'TOUCHES live infra (verifies/reads; the demo services already exist).',
    inputSchema: {
      source: z
        .string()
        .optional()
        .describe(`Path to the Lovable/Supabase source repo to migrate. Defaults to ${DEFAULT_SOURCE}.`),
    },
  },
  async ({ source }) =>
    safe('migrate', async () => {
      const dir = source || DEFAULT_SOURCE
      const events: SwarmEvent[] = []
      let done: { readiness: number; summary: string } | null = null
      const receipts: string[] = []
      const phases: string[] = []
      const errors: string[] = []

      await runMigration(dir, (e: SwarmEvent) => {
        events.push(e)
        switch (e.type) {
          case 'done':
            done = { readiness: e.readiness, summary: e.summary }
            break
          case 'receipt':
            receipts.push(`${e.receipt.ok ? '✓' : '✗'} ${e.receipt.action} — ${e.receipt.summary}`)
            break
          case 'phase':
            phases.push(e.phase)
            break
          case 'error':
            errors.push(e.msg)
            break
          case 'log':
            if (e.level === 'error') errors.push(e.msg)
            break
        }
      })

      // Pull a few high-signal facts out of the stream for the headline.
      const migrationEvents = events.filter((e) => e.type === 'migration') as Extract<
        SwarmEvent,
        { type: 'migration' }
      >[]
      const finalCounts: Record<string, number> = {}
      for (const m of migrationEvents) finalCounts[m.table] = m.total
      const kafkaEvents = events.filter((e) => e.type === 'kafka')
      const costEvent = events.find((e) => e.type === 'cost') as
        | Extract<SwarmEvent, { type: 'cost' }>
        | undefined
      const ctoRecs = events.filter((e) => e.type === 'cto') as Extract<SwarmEvent, { type: 'cto' }>[]

      const lines: string[] = []
      lines.push(`Overmind migration of ${dir} — ${done ? 'complete' : 'finished (no done event)'}.`)
      lines.push('')
      if (done) {
        lines.push(`Readiness: ${(done as { readiness: number }).readiness}/100`)
        lines.push(`Summary: ${(done as { summary: string }).summary}`)
        lines.push('')
      }
      lines.push(`Phases driven: ${[...new Set(phases)].join(' → ')}`)
      if (Object.keys(finalCounts).length) {
        lines.push(
          `Live row counts on Aiven Postgres: ${Object.entries(finalCounts)
            .map(([t, n]) => `${t}=${n}`)
            .join(', ')}`,
        )
      }
      if (kafkaEvents.length) {
        lines.push(`Realtime: ${kafkaEvents.length} event(s) hopped over Aiven Kafka.`)
      }
      if (costEvent) {
        lines.push(
          `Cost: ~$${costEvent.aivenUsd}/mo on Aiven vs $${costEvent.supabaseUsd}/mo Supabase — ${costEvent.note}`,
        )
      }
      lines.push('')
      lines.push(`Receipts (${receipts.length} auditable Aiven actions):`)
      for (const r of receipts) lines.push(`  ${r}`)
      if (ctoRecs.length) {
        lines.push('')
        lines.push(`CTO hand-off (${ctoRecs.length} recommendation(s)):`)
        for (const c of ctoRecs) lines.push(`  • [${c.rec.severity}] ${c.rec.title} → ${c.rec.action}`)
      }
      if (errors.length) {
        lines.push('')
        lines.push(`Non-fatal notes (${errors.length}): ${errors.slice(0, 5).join(' | ')}`)
      }

      return {
        content: [
          { type: 'text' as const, text: lines.join('\n') },
          {
            type: 'text' as const,
            text:
              'Run detail (JSON):\n' +
              JSON.stringify(
                {
                  source: dir,
                  done,
                  phases: [...new Set(phases)],
                  liveRowCounts: finalCounts,
                  kafkaHops: kafkaEvents.length,
                  cost: costEvent ?? null,
                  receipts,
                  ctoRecommendations: ctoRecs.map((c) => c.rec),
                  eventCount: events.length,
                  errors,
                },
                null,
                2,
              ),
          },
        ],
      }
    }),
)

// ─────────────────────────────── boot ──────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Stderr only — stdout is the MCP JSON-RPC channel and must stay clean.
  console.error(
    `[overmind-mcp] connected over stdio — agentic operator layer on Aiven project ${AIVEN_PROJECT}. ` +
      `Aiven token: ${hasAivenToken() ? 'present' : 'MISSING'}, Anthropic key: ${hasAnthropic() ? 'present' : 'absent'}. ` +
      `Tools: overmind_analyze, overmind_status, overmind_advise, overmind_cost, overmind_services, overmind_migrate.`,
  )
}

main().catch((e) => {
  console.error('[overmind-mcp] fatal:', e?.stack ?? e)
  process.exit(1)
})
