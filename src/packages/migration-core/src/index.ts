import { existsSync } from "node:fs"
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import type { BehaviorFinding, BehaviorScanResult, SourceEvidence, SourceRef } from "@aiden/contracts"
import { behaviorFindings as fixtureBehaviorFindings } from "@aiden/fixtures"

type SourceFile = {
  relativePath: string
  absolutePath: string
  text: string
  lines: string[]
}

type ScannerOptions = {
  sourceRoot?: string
  sourceLabel?: string
}

const ignoredDirs = new Set([".git", "node_modules", "dist", "build", ".next", ".turbo"])
const scannedExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".sql", ".md", ".json"])

const unique = <T>(items: T[]) => [...new Set(items)]

const sortAlpha = (items: string[]) => unique(items).sort((a, b) => a.localeCompare(b))

const findExistingSourceRoot = (input?: string) => {
  const candidates = [
    input,
    process.env.LOVABLE_SOURCE_ROOT,
    process.env.PULSEWALL_SOURCE_ROOT,
    path.resolve(process.cwd(), "demo/pulsewall"),
    path.resolve(process.cwd(), "../demo/pulsewall"),
    path.resolve(process.cwd(), "../../demo/pulsewall"),
    path.resolve(process.cwd(), "../../../demo/pulsewall"),
    path.resolve(process.cwd(), "../../../../demo/pulsewall")
  ].filter((candidate): candidate is string => Boolean(candidate))

  const found = candidates.find((candidate) => existsSync(candidate))
  if (!found) {
    throw new Error("Lovable/Supabase source root not found. Set LOVABLE_SOURCE_ROOT or run from the sunstead repo.")
  }
  return path.resolve(found)
}

const walk = async (root: string, dir = root): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true })
  const results = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (ignoredDirs.has(entry.name)) return []
        return walk(root, absolutePath)
      }
      if (!entry.isFile()) return []
      return scannedExtensions.has(path.extname(entry.name)) ? [absolutePath] : []
    })
  )
  return results.flat()
}

const readSourceFiles = async (sourceRoot: string): Promise<SourceFile[]> => {
  const files = await walk(sourceRoot)
  return Promise.all(
    files.sort((a, b) => a.localeCompare(b)).map(async (absolutePath) => {
      const text = await readFile(absolutePath, "utf8")
      return {
        absolutePath,
        relativePath: path.relative(sourceRoot, absolutePath).split(path.sep).join("/"),
        text,
        lines: text.split(/\r?\n/)
      }
    })
  )
}

const refsFor = (files: SourceFile[], pattern: RegExp, limit = 6) => {
  const refs: string[] = []
  for (const file of files) {
    file.lines.forEach((line, index) => {
      pattern.lastIndex = 0
      if (pattern.test(line)) refs.push(`${file.relativePath}:${index + 1}`)
    })
  }
  return refs.slice(0, limit)
}

const sourceRefsFor = (files: SourceFile[], pattern: RegExp, limit = 20): SourceRef[] => {
  const refs: SourceRef[] = []
  for (const file of files) {
    file.lines.forEach((line, index) => {
      pattern.lastIndex = 0
      const match = pattern.exec(line)
      if (match) {
        refs.push({
          file: file.relativePath,
          line: index + 1,
          match: (match[1] ?? match[0]).slice(0, 120)
        })
      }
    })
  }
  return refs.slice(0, limit)
}

const refsMatching = (files: SourceFile[], predicate: (file: SourceFile) => boolean) =>
  files.filter(predicate).map((file) => file.relativePath)

const collectMatches = (files: SourceFile[], pattern: RegExp, group = 1) => {
  const values: string[] = []
  for (const file of files) {
    for (const match of file.text.matchAll(pattern)) {
      const value = match[group]
      if (value) values.push(value)
    }
  }
  return sortAlpha(values)
}

const collectLineMatches = (files: SourceFile[], pattern: RegExp, shouldSkip: (line: string) => boolean = () => false) => {
  const values: string[] = []
  for (const file of files) {
    for (const line of file.lines) {
      if (shouldSkip(line)) continue
      pattern.lastIndex = 0
      const match = pattern.exec(line)
      if (match?.[1]) values.push(match[1])
    }
  }
  return sortAlpha(values)
}

const collectLineRefsByMatch = (
  files: SourceFile[],
  pattern: RegExp,
  shouldSkip: (line: string) => boolean = () => false
) => {
  const grouped: Record<string, SourceRef[]> = {}
  for (const file of files) {
    for (const [index, line] of file.lines.entries()) {
      if (shouldSkip(line)) continue
      pattern.lastIndex = 0
      const match = pattern.exec(line)
      const key = match?.[1]
      if (!key) continue
      grouped[key] = grouped[key] ?? []
      if (grouped[key].length < 10) {
        grouped[key].push({
          file: file.relativePath,
          line: index + 1,
          match: key
        })
      }
    }
  }
  return Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)))
}

const isLikelyPgIdentifier = (value: string) => /^[a-zA-Z_][\w]*$/.test(value)

const lineContext = (file: SourceFile, index: number, before = 3, after = 2) =>
  file.lines.slice(Math.max(0, index - before), Math.min(file.lines.length, index + after + 1)).join("\n")

const collectClientTableMatches = (files: SourceFile[]) => {
  const names: string[] = []
  const refs: Record<string, SourceRef[]> = {}

  for (const file of files) {
    for (const [index, line] of file.lines.entries()) {
      const context = lineContext(file, index)
      if (/storage\s*\.\s*from\s*\(/.test(context)) continue

      const pattern = /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g
      for (const match of line.matchAll(pattern)) {
        const table = match[1]
        if (!table || !isLikelyPgIdentifier(table)) continue
        names.push(table)
        refs[table] = refs[table] ?? []
        if (refs[table].length < 10) {
          refs[table].push({ file: file.relativePath, line: index + 1, match: table })
        }
      }
    }
  }

  return { names: sortAlpha(names), refs: Object.fromEntries(Object.entries(refs).sort(([a], [b]) => a.localeCompare(b))) }
}

const collectRealtimeTableMatches = (files: SourceFile[]) => {
  const names: string[] = []
  const refs: Record<string, SourceRef[]> = {}

  for (const file of files) {
    for (const [index, line] of file.lines.entries()) {
      const context = lineContext(file, index, 5, 2)
      if (!/postgres_changes|supabase_realtime|schema:\s*['"`]public['"`]/.test(context)) continue

      const pattern = /table:\s*['"`]([^'"`]+)['"`]/g
      for (const match of line.matchAll(pattern)) {
        const table = match[1]
        if (!table || !isLikelyPgIdentifier(table)) continue
        names.push(table)
        refs[table] = refs[table] ?? []
        if (refs[table].length < 10) {
          refs[table].push({ file: file.relativePath, line: index + 1, match: table })
        }
      }
    }
  }

  return { names: sortAlpha(names), refs: Object.fromEntries(Object.entries(refs).sort(([a], [b]) => a.localeCompare(b))) }
}

const collectTables = (files: SourceFile[]) => {
  const clientTables = collectClientTableMatches(files).names
  const sqlTables = collectMatches(files, /create\s+table\s+if\s+not\s+exists\s+(?:public\.)?([a-zA-Z_][\w]*)/gi)
  return sortAlpha([...clientTables, ...sqlTables].filter((table) => !table.includes(".")))
}

const collectRealtimeTables = (files: SourceFile[]) => {
  const clientTables = collectRealtimeTableMatches(files).names
  const sqlTables = collectMatches(files, /alter\s+publication\s+supabase_realtime\s+add\s+table\s+(?:public\.)?([a-zA-Z_][\w]*)/gi)
  return sortAlpha([...clientTables, ...sqlTables])
}

const collectStorageBuckets = (files: SourceFile[]) => {
  const clientBuckets = collectMatches(files, /storage\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g)
  const sqlBuckets = collectMatches(files, /values\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`][^'"`]+['"`]\s*,\s*true\s*\)/gi)
  return sortAlpha([...clientBuckets, ...sqlBuckets])
}

const collectEdgeFunctions = (files: SourceFile[]) => {
  const invoked = collectMatches(files, /functions\.invoke\(\s*['"`]([^'"`]+)['"`]/g)
  const functionDirs = refsMatching(files, (file) => file.relativePath.startsWith("supabase/functions/"))
    .map((relativePath) => relativePath.split("/")[2])
    .filter(Boolean)
  return sortAlpha([...invoked, ...functionDirs])
}

const collectRpcFunctions = (files: SourceFile[]) => {
  const clientRpc = collectMatches(files, /\.rpc\(\s*['"`]([^'"`]+)['"`]/g)
  const sqlFunctions = collectMatches(files, /create\s+or\s+replace\s+function\s+(?:public\.)?([a-zA-Z_][\w]*)/gi)
  return sortAlpha([...clientRpc, ...sqlFunctions].filter((name) => name !== "bump_reaction_count"))
}

const collectRlsTables = (files: SourceFile[]) =>
  sortAlpha(collectMatches(files, /alter\s+table\s+(?:public\.)?([a-zA-Z_][\w]*)\s+enable\s+row\s+level\s+security/gi))

const collectTriggerFunctions = (files: SourceFile[]) =>
  sortAlpha(collectMatches(files, /create\s+or\s+replace\s+function\s+(?:public\.)?([a-zA-Z_][\w]*)\(\)\s+returns\s+trigger/gi))

const collectExtensions = (files: SourceFile[]) =>
  sortAlpha(collectMatches(files, /create\s+extension\s+(?:if\s+not\s+exists\s+)?["']?([a-zA-Z_][\w-]*)["']?/gi))

const hasPattern = (files: SourceFile[], pattern: RegExp) =>
  files.some((file) => {
    pattern.lastIndex = 0
    return pattern.test(file.text)
  })

const finding = (input: Omit<BehaviorFinding, "source" | "detected"> & { detected?: boolean }): BehaviorFinding => ({
  ...input,
  detected: input.detected ?? input.sourceRefs.length > 0,
  source: "live"
})

const buildFindings = (files: SourceFile[], detected: BehaviorScanResult["detected"]): BehaviorFinding[] => {
  const tableRefs = unique([
    ...refsFor(files, /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z_][\w]*)\b/i),
    ...refsFor(files, /\.(from|insert|select|update)\(/),
    ...refsFor(files, /create\s+(index|trigger)|reaction_count/i)
  ])
  const realtimeRefs = unique([
    ...refsFor(files, /\.channel\(/),
    ...refsFor(files, /postgres_changes/),
    ...refsFor(files, /supabase_realtime/)
  ])
  const authRefs = unique([
    ...refsFor(files, /supabase\.auth\./),
    ...refsFor(files, /auth\.users|auth\.uid\(\)|\bto authenticated\b/i)
  ])
  const storageRefs = unique([...refsFor(files, /storage\.from\(/), ...refsFor(files, /storage\.buckets|storage\.objects/i)])
  const rlsRefs = unique([...refsFor(files, /enable row level security/i), ...refsFor(files, /create policy/i)])
  const edgeRefs = unique([...refsFor(files, /functions\.invoke\(/), ...refsFor(files, /Deno\.serve|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/)])
  const rpcRefs = unique([...refsFor(files, /\.rpc\(/), ...refsFor(files, /create\s+or\s+replace\s+function\s+public\.match_posts/i)])
  const vectorRefs = unique([...refsFor(files, /\bvector\b|ivfflat|<=>/), ...refsFor(files, /text-embedding-3-small|embeddings API/i)])

  return [
    finding({
      id: "behavior_tables",
      behavior: "Postgres tables, indexes, and trigger logic",
      sourceRefs: tableRefs,
      classification: "direct_migrate",
      target: "Aiven Postgres",
      demoTreatment: `Migrate ${detected.tables.join(", ")} plus detected trigger semantics; validate row counts in Aiven.`
    }),
    finding({
      id: "behavior_realtime",
      behavior: "Supabase Realtime channels and publication",
      sourceRefs: realtimeRefs,
      classification: "rewrite",
      target: "Aiven Postgres app_events + browser polling; Kafka production path proof",
      demoTreatment: `Rewrite ${detected.realtimeTables.join(", ")} change streams into app_events for the scoped demo.`
    }),
    finding({
      id: "behavior_auth",
      behavior: "Supabase Auth session and auth.uid policies",
      sourceRefs: authRefs,
      classification: "adapter_required",
      target: "Production auth adapter",
      demoTreatment: "Use a seeded demo user in the scoped runtime; flag production auth/RLS before cutover."
    }),
    finding({
      id: "behavior_storage",
      behavior: "Supabase Storage bucket",
      sourceRefs: storageRefs,
      classification: "adapter_required",
      target: "Object-store adapter",
      demoTreatment: `Replace ${detected.storageBuckets.join(", ")} uploads with static demo URLs for the live demo.`
    }),
    finding({
      id: "behavior_rls",
      behavior: "RLS policies using Supabase auth context",
      sourceRefs: rlsRefs,
      classification: "review_required",
      target: "Server-side authorization review",
      demoTreatment: "Preserve the blocker in the final report; do not claim production authorization is migrated."
    }),
    finding({
      id: "behavior_edge_function",
      behavior: "Supabase Edge Function for embeddings",
      sourceRefs: edgeRefs,
      classification: "rewrite",
      target: "Local backend worker or deployable function service",
      demoTreatment: `Detect ${detected.edgeFunctions.join(", ")} and mark it as a backend rewrite outside the scoped data-plane migration.`
    }),
    finding({
      id: "behavior_rpc",
      behavior: "Supabase RPC semantic-search call",
      sourceRefs: rpcRefs,
      classification: "adapter_required",
      target: "Local adapter route backed by Aiven Postgres",
      demoTreatment: `Map RPC ${detected.rpcFunctions.join(", ")} to an adapter endpoint before production cutover.`
    }),
    finding({
      id: "behavior_vector",
      behavior: "pgvector search and embedding column",
      sourceRefs: vectorRefs,
      classification: "direct_migrate",
      target: "Aiven Postgres vector extension",
      demoTreatment: "Check extension availability during Postgres migration; keep it out of the browser-critical path."
    })
  ].filter((item) => item.detected)
}

const detectPackageManagers = (files: SourceFile[]) => {
  const names = new Set<string>()
  if (files.some((file) => file.relativePath === "package.json")) names.add("npm")
  if (files.some((file) => file.relativePath.endsWith("pnpm-lock.yaml"))) names.add("pnpm")
  if (files.some((file) => file.relativePath.endsWith("yarn.lock"))) names.add("yarn")
  return [...names].sort()
}

const detectFrameworks = (files: SourceFile[]) => {
  const text = files.map((file) => file.text).join("\n")
  const names = new Set<string>()
  if (/"react"|'react'|from\s+["']react["']/.test(text)) names.add("React")
  if (/"vite"|'vite'|@vitejs/.test(text)) names.add("Vite")
  if (/"next"|'next'|next\//.test(text)) names.add("Next.js")
  if (/@tanstack/.test(text)) names.add("TanStack")
  if (/supabase-js|@supabase\/supabase-js/.test(text)) names.add("Supabase JS")
  return [...names].sort()
}

const buildSourceEvidence = (
  sourceRoot: string,
  sourceLabel: string,
  files: SourceFile[],
  detected: BehaviorScanResult["detected"]
): SourceEvidence => ({
  sourceRoot,
  sourceLabel,
  filesScanned: files.length,
  packageManagers: detectPackageManagers(files),
  frameworks: detectFrameworks(files),
  supabase: {
    clientRefs: sourceRefsFor(files, /@supabase\/supabase-js|createClient\(/),
    envRefs: sourceRefsFor(files, /VITE_SUPABASE|SUPABASE_(?:URL|ANON_KEY|SERVICE_ROLE_KEY)/),
    tableRefs: {
      ...collectClientTableMatches(files).refs,
      ...collectLineRefsByMatch(files, /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z_][\w]*)/gi)
    },
    realtimeRefs: {
      ...collectRealtimeTableMatches(files).refs,
      ...collectLineRefsByMatch(files, /alter\s+publication\s+supabase_realtime\s+add\s+table\s+(?:public\.)?([a-zA-Z_][\w]*)/gi)
    },
    authRefs: sourceRefsFor(files, /supabase\.auth\.|auth\.uid\(\)|auth\.users/i),
    storageRefs: collectLineRefsByMatch(files, /storage\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g),
    rpcRefs: collectLineRefsByMatch(files, /\.rpc\(\s*['"`]([^'"`]+)['"`]/g),
    edgeFunctionRefs: collectLineRefsByMatch(files, /functions\.invoke\(\s*['"`]([^'"`]+)['"`]/g)
  },
  migrations: {
    files: files
      .map((file) => file.relativePath)
      .filter((relativePath) => relativePath.endsWith(".sql") || relativePath.startsWith("supabase/migrations/"))
      .sort((a, b) => a.localeCompare(b)),
    tables: detected.tables,
    functions: detected.rpcFunctions,
    triggers: detected.triggerFunctions,
    rlsTables: detected.rlsTables,
    extensions: collectExtensions(files)
  }
})

export const scanLovableSource = async (options: ScannerOptions = {}): Promise<BehaviorScanResult> => {
  const sourceRoot = findExistingSourceRoot(options.sourceRoot)
  const rootStat = await stat(sourceRoot)
  if (!rootStat.isDirectory()) {
    throw new Error(`Lovable/Supabase source root is not a directory: ${sourceRoot}`)
  }

  const files = await readSourceFiles(sourceRoot)
  const sourceLabel = options.sourceLabel ?? "Lovable/Supabase source"
  const detected: BehaviorScanResult["detected"] = {
    tables: collectTables(files),
    realtimeTables: collectRealtimeTables(files),
    auth: hasPattern(files, /supabase\.auth\.|auth\.uid\(\)|auth\.users/i),
    storageBuckets: collectStorageBuckets(files),
    edgeFunctions: collectEdgeFunctions(files),
    rpcFunctions: collectRpcFunctions(files),
    rlsTables: collectRlsTables(files),
    triggerFunctions: collectTriggerFunctions(files),
    vector: hasPattern(files, /\bvector\b|ivfflat|<=>|text-embedding-3-small/i)
  }

  return {
    sourceRoot,
    sourceLabel,
    filesScanned: files.length,
    refsScanned: files.map((file) => file.relativePath),
    evidence: buildSourceEvidence(sourceRoot, sourceLabel, files, detected),
    detected,
    findings: buildFindings(files, detected),
    source: "live",
    createdAt: new Date().toISOString()
  }
}

export const scanPulseWallSource = async (options: ScannerOptions = {}): Promise<BehaviorScanResult> =>
  scanLovableSource({
    ...options,
    sourceLabel: options.sourceLabel ?? "PulseWall demo app"
  })

export const scanSupabaseUsage = async (): Promise<BehaviorFinding[]> => {
  return (await scanPulseWallSource()).findings
}

export const classifyBehavior = async (): Promise<BehaviorFinding[]> => {
  return scanSupabaseUsage()
}

export const fixtureBehaviorGraph = fixtureBehaviorFindings

export { buildBehaviorGraph, behaviorFindingsFromGraph } from "./graph.js"
export { buildMigrationManifest } from "./manifest.js"
