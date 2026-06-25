import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { analyze } from './agents/analyzer'
import { plan as makePlan } from './agents/planner'
import { transformSupabaseToAiven } from './agents/schema-transform'
import { generateMigratedApp } from './agents/rewriter'
import { resolveUrl, liveConfigured, liveMigrate } from './aiven-live'
import { deployToRender, type RenderEnvVar } from './render-deploy'

// "Paste a repo URL, get a live URL." The cockpit's app-deploy pipeline: clone the
// Lovable/Supabase repo, migrate it onto Aiven (schema -> Aiven Postgres, client ->
// thin Aiven API, + the single-container Dockerfile), push the migrated app to a
// fresh public repo, and deploy that to Render (AWS-backed) with DATABASE_URL
// pointing at Aiven. Data on Aiven, compute on AWS — the whole stack, one field.

type Log = (m: string) => void

export type DeployAppResult = {
  appName: string
  sourceRepo: string
  migratedRepo: string | null
  liveUrl: string | null
  dashboardUrl: string | null
  tables: string[]
  buckets: string[]
  simulated: boolean
  notes: string[]
}

function run(cmd: string, args: string[], cwd: string, log: Log): string {
  log(`$ ${cmd} ${args.join(' ')}`)
  try {
    return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch (e: any) {
    const out = (e.stdout || '') + (e.stderr || '')
    throw new Error(`${cmd} ${args[0]} failed: ${out.slice(0, 240) || e.message}`)
  }
}

// The app's DDL — the simplest "their app" input. Prefer a single schema.sql,
// else concatenate the ordered migrations, else null (caller decides what to do).
function readSourceSchema(srcDir: string, log: Log): string | null {
  const single = join(srcDir, 'supabase', 'schema.sql')
  if (existsSync(single)) {
    log('found supabase/schema.sql')
    return readFileSync(single, 'utf8')
  }
  const migDir = join(srcDir, 'supabase', 'migrations')
  if (existsSync(migDir)) {
    const files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
    if (files.length) {
      log(`concatenating ${files.length} migration(s) from supabase/migrations/`)
      return files.map((f) => readFileSync(join(migDir, f), 'utf8')).join('\n\n')
    }
  }
  return null
}

function repoNameFrom(repoUrl: string): string {
  const m = repoUrl.replace(/\.git$/, '').match(/([^/]+)\/([^/]+)$/)
  return (m ? m[2] : 'app').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'app'
}

export async function deployApp(opts: {
  repoUrl: string
  branch?: string
  appName?: string
  live?: boolean // actually push + deploy (vs. dry-run the side effects)
  onLog?: Log
}): Promise<DeployAppResult> {
  const log = opts.onLog || (() => {})
  const branch = opts.branch || 'main'
  const base = repoNameFrom(opts.repoUrl)
  const appName = (opts.appName || base).toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 32)
  const live = opts.live ?? Boolean(process.env.RENDER_API_KEY)
  const notes: string[] = []

  const work = mkdtempSync(join(tmpdir(), 'switchboard-deploy-'))
  const srcDir = join(work, 'src')
  const migratedDir = join(work, 'migrated')

  // 1. Clone the source app.
  log(`cloning ${opts.repoUrl} (${branch})…`)
  run('git', ['clone', '--depth', '1', '--branch', branch, opts.repoUrl, srcDir], work, log)

  // 2. Analyze + plan.
  const analysis = analyze(srcDir)
  const plan = makePlan(analysis, appName)
  log(`analyzed: ${analysis.tables.length} table(s), ${analysis.authMethods.length} auth call(s), ${analysis.realtimeChannels.length} realtime, ${analysis.storageBuckets.length} bucket(s)`)

  // 3. Derive the Aiven schema from the repo's SQL.
  let aivenSql = ''
  const sourceSql = readSourceSchema(srcDir, log)
  if (sourceSql) {
    const t = transformSupabaseToAiven(sourceSql)
    aivenSql = t.sql
    notes.push(...t.notes)
  } else {
    notes.push('No SQL schema in the repo — provisioning auth tables only. Add supabase/schema.sql or a DATABASE_URL to migrate your tables.')
    log('⚠ no supabase/schema.sql or migrations found — auth tables only')
  }

  // 4. Rewrite into the migrated, single-container app.
  const templatesDir = join(process.cwd(), 'server/agents/templates/migrated')
  const rewrite = generateMigratedApp({ sourceDir: srcDir, outDir: migratedDir, templatesDir, aivenSql, analysis, plan })
  log(`rewrote +${rewrite.summary.linesAdded}/-${rewrite.summary.linesRemoved} across ${rewrite.changes.length} file(s) → migrated app + Dockerfile`)

  // 5. Run the schema on Aiven Postgres (idempotent) and capture DATABASE_URL.
  const aivenUrl = resolveUrl()
  if (aivenSql && liveConfigured()) {
    log('running the schema on Aiven Postgres…')
    const state = await liveMigrate(aivenUrl, aivenSql, (m) => log('  ' + m))
    log(`Aiven now has ${state.tables.length} table(s); auth ${state.authVerified ? 'verified' : 'unverified'}`)
  } else if (!liveConfigured()) {
    notes.push('AIVEN_DB_* not set — skipped running the schema on Aiven.')
  }

  if (!live) {
    log('dry run (set RENDER_API_KEY to push + deploy for real).')
    return { appName, sourceRepo: opts.repoUrl, migratedRepo: null, liveUrl: null, dashboardUrl: null, tables: analysis.tables, buckets: analysis.storageBuckets, simulated: true, notes }
  }

  // 6. Push the migrated app to a fresh public repo (Render builds from git).
  const ghUser = run('gh', ['api', 'user', '-q', '.login'], work, log)
  const newName = `${appName}-aiven-${Math.random().toString(36).slice(2, 6)}`
  run('git', ['init', '-q'], migratedDir, log)
  run('git', ['-c', 'user.email=deploy@switchboard.dev', '-c', 'user.name=Switchboard', 'add', '-A'], migratedDir, log)
  run('git', ['-c', 'user.email=deploy@switchboard.dev', '-c', 'user.name=Switchboard', 'commit', '-q', '-m', 'Migrated to Aiven by Switchboard'], migratedDir, log)
  log(`creating public repo ${ghUser}/${newName} and pushing…`)
  run('gh', ['repo', 'create', `${ghUser}/${newName}`, '--public', '--source=.', '--remote=origin', '--push'], migratedDir, log)
  const migratedRepo = `https://github.com/${ghUser}/${newName}`

  // 7. Deploy to Render with the Aiven connection injected.
  const envVars: RenderEnvVar[] = []
  if (aivenUrl) envVars.push({ key: 'DATABASE_URL', value: aivenUrl })
  envVars.push({ key: 'NODE_ENV', value: 'production' })
  const dep = await deployToRender({ repoUrl: migratedRepo, branch: 'main', name: appName, envVars, onLog: (m) => log('  ' + m) })

  return {
    appName,
    sourceRepo: opts.repoUrl,
    migratedRepo,
    liveUrl: dep.url,
    dashboardUrl: dep.dashboardUrl,
    tables: analysis.tables,
    buckets: analysis.storageBuckets,
    simulated: dep.simulated,
    notes,
  }
}

// CLI: tsx server/deploy-app.ts <repoUrl> [branch] [--live]
if (process.argv[1] && process.argv[1].endsWith('deploy-app.ts')) {
  const repoUrl = process.argv[2]
  if (!repoUrl) {
    console.error('usage: tsx server/deploy-app.ts <repoUrl> [branch] [--live]')
    process.exit(1)
  }
  const branch = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'main'
  const live = process.argv.includes('--live')
  deployApp({ repoUrl, branch, live, onLog: (m) => console.error(m) })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
}
