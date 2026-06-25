import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import type { Analysis, Finding, SchemaInfo } from './types'

// Agent 1 — Code Analyzer.
// Scans a Lovable/Supabase app for every supabase-js usage and (if present) its
// SQL schema, then produces a structured Analysis the Planner turns into a plan.

const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const SKIP_DIR = new Set(['node_modules', 'dist', '.git', '.next', 'build', 'out'])

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      if (!SKIP_DIR.has(entry)) walk(full, acc)
    } else if (CODE_EXT.has(extname(entry))) {
      acc.push(full)
    }
  }
  return acc
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs)].sort()
}

// Per-line detectors. Line-based scanning is robust to the multi-line method
// chains supabase-js encourages (channel().on().subscribe() etc.).
export function scanSource(root: string): { findings: Finding[]; filesScanned: number } {
  const files = existsSync(root) && statSync(root).isDirectory() ? walk(root) : [root]
  const findings: Finding[] = []

  for (const file of files) {
    let text: string
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    if (!text.includes('supabase') && !text.includes('createClient')) continue
    const rel = relative(root, file) || file
    const lines = text.split('\n')

    // Resolve simple string constants (e.g. const BUCKET = 'avatars') so we can
    // name the bucket even when storage.from() is passed a variable.
    const consts = new Map<string, string>()
    for (const m of text.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g)) consts.set(m[1], m[2])
    const resolve = (tok: string) => consts.get(tok) ?? tok

    lines.forEach((raw, i) => {
      const line = raw.trim()
      const at = (surface: Finding['surface'], detail: string) =>
        findings.push({ surface, detail, file: rel, line: i + 1, snippet: line.slice(0, 160) })

      // Storage first, so the .storage.from() doesn't get miscounted as a table.
      for (const m of raw.matchAll(/\.storage\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) at('storage', `bucket "${m[1]}"`)
      for (const m of raw.matchAll(/\.storage\.from\(\s*([A-Za-z_]\w*)\s*\)/g)) at('storage', `bucket "${resolve(m[1])}"`)
      for (const m of raw.matchAll(/\.storage\.from\([^)]*\)\.(\w+)\(/g)) at('storage', `storage.${m[1]}()`)

      // Database tables via the query builder (exclude the storage .from above).
      if (!/\.storage\.from\(/.test(raw)) {
        for (const m of raw.matchAll(/(?:supabase|sb|client)\s*\.\s*from\(\s*['"`]([\w.]+)['"`]\s*\)/g))
          at('db', `from("${m[1]}")`)
      }

      // Auth.
      for (const m of raw.matchAll(/\.auth\.(\w+)\(/g)) at('auth', `auth.${m[1]}()`)

      // Realtime channels + the tables they watch.
      for (const m of raw.matchAll(/\.channel\(\s*[`'"]([^`'"]+)[`'"]/g)) at('realtime', `channel "${m[1]}"`)
      for (const m of raw.matchAll(/table:\s*['"](\w+)['"]/g)) at('realtime', `watches table "${m[1]}"`)
    })
  }
  return { findings, filesScanned: files.length }
}

// Best-effort SQL schema parse (counts, table names, realtime publication).
export function parseSchema(sqlPath: string): SchemaInfo | undefined {
  if (!existsSync(sqlPath)) return undefined
  const sql = readFileSync(sqlPath, 'utf8')
  const tables: { name: string; columns: number }[] = []
  const tableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\n\s*\);/gi
  for (const m of sql.matchAll(tableRe)) {
    const body = m[2]
    // Approximate column count: top-level commas + 1, minus obvious constraint lines.
    let depth = 0
    let commas = 0
    for (const ch of body) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
      else if (ch === ',' && depth === 0) commas++
    }
    const constraints = (body.match(/^\s*(primary key|unique|foreign key|check|constraint)\b/gim) || []).length
    tables.push({ name: m[1], columns: Math.max(1, commas + 1 - constraints) })
  }
  return {
    tables,
    policies: (sql.match(/create\s+policy/gi) || []).length,
    indexes: (sql.match(/create\s+index/gi) || []).length,
    hasRealtimePublication: /alter\s+publication\s+supabase_realtime/i.test(sql),
  }
}

export function analyze(root: string): Analysis {
  const { findings, filesScanned } = scanSource(root)
  const schemaPath = join(root, 'supabase', 'schema.sql')
  const schema = parseSchema(schemaPath)

  const tablesFromCode = findings
    .filter((f) => f.surface === 'db')
    .map((f) => f.detail.replace(/^from\("|"\)$/g, ''))
  const tablesFromSchema = schema?.tables.map((t) => t.name) ?? []

  const channels = findings.filter((f) => f.surface === 'realtime' && f.detail.startsWith('channel'))
  const watched = findings.filter((f) => f.surface === 'realtime' && f.detail.startsWith('watches'))

  return {
    root,
    filesScanned,
    tables: uniq([...tablesFromCode, ...tablesFromSchema]),
    authMethods: uniq(
      findings.filter((f) => f.surface === 'auth').map((f) => f.detail.replace(/^auth\.|\(\)$/g, '')),
    ),
    realtimeChannels: channels.map((c) => ({
      channel: c.detail.replace(/^channel "|"$/g, ''),
      table: watched[0]?.detail.replace(/^watches table "|"$/g, ''),
    })),
    storageBuckets: uniq(
      findings
        .filter((f) => f.surface === 'storage' && f.detail.startsWith('bucket'))
        .map((f) => f.detail.replace(/^bucket "|"$/g, '')),
    ),
    findings,
    schema,
  }
}

// CLI: tsx server/agents/analyzer.ts <dir>
if (process.argv[1] && process.argv[1].endsWith('analyzer.ts')) {
  const root = process.argv[2] || join(process.cwd(), 'sample-app')
  console.log(JSON.stringify(analyze(root), null, 2))
}
