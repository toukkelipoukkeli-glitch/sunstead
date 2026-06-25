import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
  existsSync,
  rmSync,
  cpSync,
} from 'node:fs'
import { join, dirname, relative } from 'node:path'
import type { Analysis, MigrationPlan } from './types'

// Agent 4 — Code Rewriter.
// A codemod, not a template dump: it copies the source app, overlays the Aiven
// client + generated API, prunes the now-dead Supabase client, rewrites
// package.json, and reports a real per-file diff. Files are included
// conditionally based on what the Analyzer actually found.

export type RewriteChange = {
  path: string
  op: 'modified' | 'added' | 'removed'
  note: string
  added?: number
  removed?: number
}

export type RewriteResult = {
  outDir: string
  changes: RewriteChange[]
  summary: { modified: number; added: number; removed: number; linesAdded: number; linesRemoved: number }
}

const SKIP = new Set(['node_modules', 'dist', '.git', '.env'])

function copyDir(src: string, dst: string) {
  mkdirSync(dst, { recursive: true })
  for (const entry of readdirSync(src)) {
    if (SKIP.has(entry)) continue
    const s = join(src, entry)
    const d = join(dst, entry)
    if (statSync(s).isDirectory()) copyDir(s, d)
    else cpSync(s, d)
  }
}

function listFiles(dir: string, base = dir, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) listFiles(full, base, acc)
    else acc.push(relative(base, full))
  }
  return acc
}

// Line diff via LCS — small files, so the O(m*n) table is fine.
function lineDiff(a: string, b: string): { added: number; removed: number } {
  const A = a.split('\n')
  const B = b.split('\n')
  const m = A.length
  const n = B.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const lcs = dp[0][0]
  return { added: n - lcs, removed: m - lcs }
}

export function generateMigratedApp(opts: {
  sourceDir: string
  outDir: string
  templatesDir: string
  aivenSchemaPath?: string
  aivenSql?: string
  analysis: Analysis
  plan: MigrationPlan
}): RewriteResult {
  const { sourceDir, outDir, templatesDir, analysis, plan } = opts
  const usesRealtime = analysis.realtimeChannels.length > 0
  const usesStorage = analysis.findings.some((f) => f.surface === 'storage')
  const usesKafka = plan.kafkaTopics.length > 0
  const changes: RewriteChange[] = []

  // 1. Start from a clean copy of the source app.
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
  copyDir(sourceDir, outDir)

  // 2. Overlay the generated files, conditional on what the app actually uses.
  for (const rel of listFiles(templatesDir)) {
    if (rel.endsWith('realtime.ts') && rel.includes('lib') && !usesRealtime) continue
    if (rel.includes('api/src/realtime.ts') && !usesRealtime) continue
    if (rel.includes('realtime.kafka.ts') && !usesKafka) continue
    if (rel.endsWith('lib/storage.ts') && !usesStorage) continue

    const from = join(templatesDir, rel)
    const to = join(outDir, rel)
    const existed = existsSync(to)
    const before = existed ? readFileSync(to, 'utf8') : ''
    const after = readFileSync(from, 'utf8')
    mkdirSync(dirname(to), { recursive: true })
    writeFileSync(to, after)

    const note = noteFor(rel)
    if (existed) {
      const { added, removed } = lineDiff(before, after)
      changes.push({ path: rel, op: 'modified', note, added, removed })
    } else {
      changes.push({ path: rel, op: 'added', note, added: after.split('\n').length, removed: 0 })
    }
  }

  // 3. Prune the now-dead Supabase client.
  const deadClient = join(outDir, 'src/lib/supabaseClient.ts')
  if (existsSync(deadClient)) {
    const removedLines = readFileSync(deadClient, 'utf8').split('\n').length
    rmSync(deadClient)
    changes.push({ path: 'src/lib/supabaseClient.ts', op: 'removed', note: 'Replaced by aivenClient.ts.', removed: removedLines })
  }

  // 4. The Supabase schema isn't the deploy artifact anymore; ship the Aiven one
  // (the transformed SQL the Migrator runs, generated from THIS app's schema).
  const supaSchema = join(outDir, 'supabase')
  if (existsSync(supaSchema)) rmSync(supaSchema, { recursive: true, force: true })
  const dst = join(outDir, 'api/schema.sql')
  let aivenSql = opts.aivenSql
  if (!aivenSql && opts.aivenSchemaPath && existsSync(opts.aivenSchemaPath)) aivenSql = readFileSync(opts.aivenSchemaPath, 'utf8')
  if (aivenSql) {
    mkdirSync(dirname(dst), { recursive: true })
    writeFileSync(dst, aivenSql)
    changes.push({ path: 'api/schema.sql', op: 'added', note: 'Aiven schema (transformed from this app).', added: aivenSql.split('\n').length, removed: 0 })
  }

  // 5. Drop the Supabase dependency from package.json.
  const pkgPath = join(outDir, 'package.json')
  if (existsSync(pkgPath)) {
    const before = readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(before)
    let touched = false
    for (const field of ['dependencies', 'devDependencies'] as const) {
      if (pkg[field] && pkg[field]['@supabase/supabase-js']) {
        delete pkg[field]['@supabase/supabase-js']
        touched = true
      }
    }
    if (touched) {
      const after = JSON.stringify(pkg, null, 2) + '\n'
      writeFileSync(pkgPath, after)
      const { added, removed } = lineDiff(before, after)
      changes.push({ path: 'package.json', op: 'modified', note: 'Removed @supabase/supabase-js.', added, removed })
    }
  }

  const summary = {
    modified: changes.filter((c) => c.op === 'modified').length,
    added: changes.filter((c) => c.op === 'added').length,
    removed: changes.filter((c) => c.op === 'removed').length,
    linesAdded: changes.reduce((a, c) => a + (c.added ?? 0), 0),
    linesRemoved: changes.reduce((a, c) => a + (c.removed ?? 0), 0),
  }
  return { outDir, changes, summary }
}

function noteFor(rel: string): string {
  if (rel.endsWith('aivenClient.ts')) return 'New Aiven API client (replaces supabaseClient).'
  if (rel.endsWith('lib/auth.ts')) return 'auth.* -> Aiven auth endpoints (same signatures).'
  if (rel.endsWith('lib/db.ts')) return 'query builder -> Aiven API calls (same signatures).'
  if (rel.endsWith('lib/realtime.ts')) return 'channel() -> SSE over the Aiven API.'
  if (rel.endsWith('lib/storage.ts')) return 'storage shim (Aiven has no object store yet).'
  if (rel.startsWith('api/')) return 'Generated thin API over Aiven Postgres.'
  if (rel === 'README.md' || rel === '.env.example') return 'Migrated-app docs/config.'
  return 'Generated by the Code Rewriter.'
}

// CLI: tsx server/agents/rewriter.ts [sourceDir] [outDir]
if (process.argv[1] && process.argv[1].endsWith('rewriter.ts')) {
  ;(async () => {
    const { analyze } = await import('./analyzer')
    const { plan } = await import('./planner')
    const sourceDir = process.argv[2] || join(process.cwd(), 'sample-app')
    const outDir = process.argv[3] || join(process.cwd(), 'sample-app-migrated')
    const templatesDir = join(process.cwd(), 'server/agents/templates/migrated')
    const aivenSchemaPath = join(process.cwd(), 'aiven/schema.aiven.sql')
    const analysis = analyze(sourceDir)
    const p = plan(analysis, 'PulseBoard')
    const result = generateMigratedApp({ sourceDir, outDir, templatesDir, aivenSchemaPath, analysis, plan: p })
    console.log(JSON.stringify(result, null, 2))
  })()
}
