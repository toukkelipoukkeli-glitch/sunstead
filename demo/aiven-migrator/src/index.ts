import 'dotenv/config'
import { config as loadEnv } from 'dotenv'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { repoTools } from './tools.ts'

if (existsSync('.env.local')) loadEnv({ path: '.env.local', override: true })

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8'
const AIVEN_MCP_URL = process.env.AIVEN_MCP_URL || 'https://mcp.aiven.live/mcp?allow_secrets=true'
const AIVEN_TOKEN = process.env.AIVEN_TOKEN || ''
const PROJECT = process.env.AIVEN_PROJECT || 'touko-1f1c'
const PG = process.env.AIVEN_PG_SERVICE || 'pulsewall-pg'
const SOURCE = process.env.SOURCE_REPO || '/tmp/live-hype-wall'

const client = new Anthropic() // ANTHROPIC_API_KEY from env

// ── The behavior graph: the artifact the swarm produces ─────────────────────────
const NodeSchema = z.object({
  feature: z.string().describe('the Supabase/Lovable feature, e.g. "Realtime: posts channel"'),
  classification: z.enum(['direct-migrate', 'rewrite', 'adapter', 'external', 'flag']),
  aiven_target: z.string().describe('what it becomes on Aiven, or why it cannot move'),
  detail: z.string(),
  evidence: z.array(z.string()).describe('file:line citations').optional(),
})
type Node = z.infer<typeof NodeSchema>
const FindingsSchema = z.object({ nodes: z.array(NodeSchema) })

// ── Scouts: one agent per Supabase surface, run in parallel (the swarm) ──────────
const SURFACES = [
  'Postgres schema, tables, indexes, extensions and RLS policies',
  'supabase-js data calls (.from().select/insert/update, .rpc)',
  'Realtime usage (.channel / postgres_changes subscriptions)',
  'Storage usage (supabase.storage buckets, uploads, public URLs)',
  'Auth flow (signIn, sessions, JWT, auth.uid in RLS)',
  'Edge functions and any server-side / service_role code',
]

async function scout(surface: string): Promise<Node[]> {
  let captured: Node[] = []
  const submit = betaZodTool({
    name: 'submit_findings',
    description: 'Submit your structured behavior-graph nodes for this surface. Call once, when done.',
    inputSchema: FindingsSchema,
    run: ({ nodes }) => {
      captured = nodes
      return `recorded ${nodes.length} node(s)`
    },
  })

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    system:
      'You are a migration scout. You inspect a Lovable/Supabase app to map ONE surface to Aiven. ' +
      'Use list_files/read_file/grep to gather evidence, then classify each feature you find:\n' +
      '- direct-migrate: native Postgres, moves to Aiven Postgres unchanged (tables, indexes, RLS, pgvector)\n' +
      '- rewrite: must change to an Aiven primitive (e.g. Supabase Realtime -> Aiven Kafka)\n' +
      '- adapter: needs a shim/replacement service (auth/GoTrue, storage)\n' +
      '- external: belongs off-Aiven\n' +
      '- flag: human review needed\n' +
      'Cite file:line evidence. Be precise and honest. Then call submit_findings exactly once.',
    tools: [...repoTools, submit],
    messages: [
      { role: 'user', content: `Map this surface of the app at ${SOURCE}: ${surface}. Investigate, then submit_findings.` },
    ],
  })

  for await (const _msg of runner) {
    /* drain the agentic loop */
  }
  return captured
}

// ── Migrator: drives the live Aiven MCP to move the data plane ───────────────────
async function migrate(graph: Node[]): Promise<string> {
  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    // The Aiven MCP, connected natively — Claude calls aiven_* tools directly (the challenge).
    betas: ['mcp-client-2025-11-20'],
    mcp_servers: [
      AIVEN_TOKEN
        ? { type: 'url', name: 'aiven', url: AIVEN_MCP_URL, authorization_token: AIVEN_TOKEN }
        : { type: 'url', name: 'aiven', url: AIVEN_MCP_URL },
    ],
    system:
      'You are the Aiven migration engineer. You move a Lovable app\'s DATA PLANE onto Aiven, live, ' +
      'using the Aiven MCP tools (aiven_pg_write, aiven_pg_read, aiven_service_get, aiven_service_connection_info, ' +
      'aiven_kafka_topic_create, aiven_service_metrics_fetch).\n' +
      `Target: project "${PROJECT}", Postgres service "${PG}".\n` +
      'Rules: aiven_pg_write does ONE statement per call and BLOCKS create function/trigger/do — so create only ' +
      'tables, indexes and copy data via aiven_pg_write; note functions/triggers as applied-by-the-app. ' +
      'Read the real source DDL from the repo (supabase/migrations) with read_file, strip Supabase-isms ' +
      '(auth.users refs, storage.*, supabase_realtime, pg_net, auth.uid RLS), and recreate the portable core on Aiven. ' +
      'Verify with aiven_pg_read (counts, \\d). Keep every reasoning string ASCII (the MCP rejects non-ASCII). ' +
      'Finish with a short markdown migration report: what you created, row counts, and what was flagged.',
    tools: [...repoTools],
    messages: [
      {
        role: 'user',
        content:
          'Here is the behavior graph the scouts produced:\n\n```json\n' +
          JSON.stringify(graph, null, 2) +
          '\n```\n\nMigrate the direct-migrate nodes onto Aiven Postgres now (schema + a representative ' +
          'data slice), verify, and report. For rewrite/adapter/flag nodes, state the plan but do not fake them.',
      },
    ],
  })

  let report = ''
  for await (const msg of runner) {
    for (const block of msg.content) {
      if (block.type === 'text') report = block.text // keep the latest assistant text as the report
    }
  }
  return report
}

// ── Orchestrate ──────────────────────────────────────────────────────────────────
async function main() {
  const scoutOnly = process.argv.includes('--scout-only')
  mkdirSync('out', { recursive: true })

  console.log(`\n🛰️  swarm: ${SURFACES.length} scouts mapping ${SOURCE} ...`)
  const results = await Promise.all(SURFACES.map(scout))
  const graph = results.flat()
  writeFileSync('out/behavior-graph.json', JSON.stringify(graph, null, 2))

  const by = (c: Node['classification']) => graph.filter((n) => n.classification === c).length
  console.log(
    `\n🧭 behavior graph: ${graph.length} nodes  ` +
      `[direct ${by('direct-migrate')} · rewrite ${by('rewrite')} · adapter ${by('adapter')} · ` +
      `external ${by('external')} · flag ${by('flag')}]`,
  )
  console.log('   → out/behavior-graph.json')

  if (scoutOnly) return
  if (!AIVEN_TOKEN) {
    console.log('\n⚠️  AIVEN_TOKEN not set — skipping the live migration. Set it in .env.local to run the MCP migration.')
    return
  }

  console.log(`\n🚚 migrating the data plane onto Aiven (${PROJECT}/${PG}) via the Aiven MCP ...`)
  const report = await migrate(graph)
  writeFileSync('out/migration-report.md', report || '(no report produced)')
  console.log('\n' + (report || '(no report)'))
  console.log('\n✅ done → out/migration-report.md')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
