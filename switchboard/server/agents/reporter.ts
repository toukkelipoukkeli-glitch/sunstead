import type { Analysis, MigrationPlan, MigrationReport, Gap } from './types'

// Agent 5 — Migration Reporter.
// Summarizes what moved, what didn't, and what Aiven should build to close the
// gaps. Takes the plan plus whatever live results the run produced (row counts,
// the real target service) so the report reflects reality, not a template.

export type ReportInput = {
  analysis: Analysis
  plan: MigrationPlan
  target: MigrationReport['target']
  rowCounts?: Record<string, number>
  authVerified?: boolean
  now?: string // injected (Date.* is avoided in some runtimes)
}

export function report(input: ReportInput): MigrationReport {
  const { analysis, plan, target, rowCounts, authVerified } = input
  const live = Boolean(rowCounts) // a live read happened only when we have counts
  const migrated: MigrationReport['migrated'] = []

  const tableCount = analysis.tables.length
  migrated.push({
    item: `Database schema (${tableCount} tables, ${analysis.schema?.indexes ?? 0} indexes)`,
    status: live ? 'done' : 'partial',
    note: live ? 'Recreated on the target Aiven Postgres.' : 'Transformed to Aiven SQL — add your Aiven URL to apply it.',
  })
  if (plan.rlsPolicies > 0)
    migrated.push({
      item: `RLS policies (${plan.rlsPolicies})`,
      status: live ? 'done' : 'partial',
      note: `Policy logic transfers verbatim; auth.uid() rebound to a per-request GUC${live ? '' : ' (generated)'}.`,
    })
  if (plan.authTables.length)
    migrated.push({
      item: 'Auth (users + sessions)',
      status: authVerified ? 'done' : 'partial',
      note: authVerified
        ? 'pgcrypto password hashing verified on the target.'
        : live
          ? 'pgcrypto auth tables created on the target.'
          : 'pgcrypto auth tables generated (run live to verify).',
    })
  if (plan.kafkaTopics.length)
    migrated.push({
      item: `Realtime (${analysis.realtimeChannels.length} channel(s))`,
      status: 'partial',
      note: `NOTIFY-over-SSE works today; Kafka topics ${plan.kafkaTopics.join(', ')} for scale.`,
    })
  const storageGap = analysis.findings.some((f) => f.surface === 'storage')
  if (storageGap)
    migrated.push({
      item: 'Storage (file uploads)',
      status: 'skipped',
      note: 'No managed Aiven object store; left on Supabase / external bucket.',
    })

  const recommendations = dedupe([
    ...plan.gaps.map((g: Gap) => `${g.feature}: ${g.recommendation}`),
    'Ship an Aiven MCP "migrate from Supabase" command so vibe-coded apps onboard in one step.',
  ])

  return {
    app: plan.app,
    target,
    migrated,
    gaps: plan.gaps,
    recommendations,
    rowCounts,
    generatedAt: input.now ?? 'unknown',
  }
}

function dedupe(xs: string[]): string[] {
  return [...new Set(xs)]
}

// Render a report as Markdown (used for the saved artifact and the pitch).
export function reportToMarkdown(r: MigrationReport): string {
  const lines: string[] = []
  lines.push(`# Migration report — ${r.app}`, '')
  lines.push(`**Target:** Aiven ${r.target.service} (${r.target.plan ?? 'pg'}, ${r.target.cloud ?? ''}) in ${r.target.project}`, '')
  lines.push('## Migrated', '')
  for (const m of r.migrated) {
    const mark = m.status === 'done' ? '✅' : m.status === 'partial' ? '🟡' : '⛔'
    lines.push(`- ${mark} **${m.item}** — ${m.note}`)
  }
  if (r.rowCounts) {
    lines.push('', '## Row counts (live on Aiven)', '')
    for (const [t, n] of Object.entries(r.rowCounts)) lines.push(`- \`${t}\`: ${n}`)
  }
  lines.push('', '## Gaps', '')
  for (const g of r.gaps) lines.push(`- **${g.feature}** — ${g.why}`)
  lines.push('', '## What Aiven should build', '')
  for (const rec of r.recommendations) lines.push(`- ${rec}`)
  lines.push('', `_Generated ${r.generatedAt}._`)
  return lines.join('\n')
}
