import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { analyze } from './analyzer'
import { plan as makePlan } from './planner'
import { generateMigratedApp } from './rewriter'
import { report, reportToMarkdown } from './reporter'
import { planMcpOps, LIVE_TARGET } from './aiven-ops'
import { liveConfigured, liveInspect } from '../aiven-live'

// The whole crew, end to end. Point it at a Lovable/Supabase app and it writes
// every artifact to out/: the analysis, the plan, the exact Aiven MCP calls, the
// rewritten app, and the migration report. Row counts come live from Aiven when
// AIVEN_DB_URL is set; otherwise the report omits them rather than inventing.
export async function orchestrate(opts: { sourceDir: string; outDir: string; appName?: string; migratedDir?: string; now?: string }) {
  const { sourceDir, outDir } = opts
  const appName = opts.appName || 'PulseBoard'
  const migratedDir = opts.migratedDir || join(process.cwd(), 'sample-app-migrated')
  const templatesDir = join(process.cwd(), 'server/agents/templates/migrated')
  const aivenSchemaPath = join(process.cwd(), 'aiven/schema.aiven.sql')

  const analysis = analyze(sourceDir)
  const plan = makePlan(analysis, appName)
  const mcpOps = planMcpOps(plan, aivenSchemaPath)
  const rewrite = generateMigratedApp({ sourceDir, outDir: migratedDir, templatesDir, aivenSchemaPath, analysis, plan })

  let live = null
  if (liveConfigured()) {
    try {
      live = await liveInspect()
    } catch {
      /* leave null if unreachable */
    }
  }
  const migrationReport = report({
    analysis,
    plan,
    target: LIVE_TARGET,
    rowCounts: live?.counts,
    authVerified: live?.authVerified,
    now: opts.now,
  })

  mkdirSync(outDir, { recursive: true })
  const write = (name: string, data: unknown) =>
    writeFileSync(join(outDir, name), typeof data === 'string' ? data : JSON.stringify(data, null, 2))
  write('analysis.json', analysis)
  write('plan.json', plan)
  write('mcp-ops.json', mcpOps)
  write('rewrite.json', rewrite)
  write('report.json', migrationReport)
  write('report.md', reportToMarkdown(migrationReport))

  return { analysis, plan, mcpOps, rewrite, report: migrationReport, live }
}

// CLI: tsx server/agents/orchestrate.ts [sourceDir]
if (process.argv[1] && process.argv[1].endsWith('orchestrate.ts')) {
  ;(async () => {
    const sourceDir = process.argv[2] || join(process.cwd(), 'sample-app')
    const outDir = process.argv[3] || join(process.cwd(), 'out')
    const r = await orchestrate({ sourceDir, outDir, now: new Date().toISOString() })
    console.log(
      [
        `Analyzed ${r.analysis.filesScanned} files: ${r.analysis.tables.length} tables, ` +
          `${r.analysis.authMethods.length} auth calls, ${r.analysis.realtimeChannels.length} realtime channel(s), ` +
          `${r.analysis.storageBuckets.length} storage bucket(s).`,
        `Plan: provision ${r.plan.provision.map((p) => p.serviceType).join(' + ')}; ` +
          `${r.mcpOps.length} Aiven MCP ops; ${r.plan.gaps.length} gap(s).`,
        `Rewrite: +${r.rewrite.summary.linesAdded}/-${r.rewrite.summary.linesRemoved} across ` +
          `${r.rewrite.changes.length} files -> ${r.rewrite.outDir}`,
        r.live ? `Live: ${r.live.totalRows} rows on Aiven, auth ${r.live.authVerified ? 'verified' : 'unverified'}.` : 'Live: AIVEN_DB_URL not set (report omits row counts).',
        `Report -> ${join(outDir, 'report.md')}`,
      ].join('\n'),
    )
  })()
}
