// server/pr.ts — the REAL cutover step: open a GitHub PR that repoints the migrated app's data
// layer from Supabase onto the freshly-provisioned Aiven Postgres.
//
// This is the honest "graduate" finale. After we have really provisioned a fresh Aiven PG and moved
// live rows into it with verified parity, the only thing left to make the app actually run on Aiven
// is to repoint its code. So we do exactly that, for real:
//   1. clone ToukoUrsin/live-hype-wall into a throwaway temp dir (via gh → git fallback),
//   2. branch overmind/graduate-to-aiven,
//   3. write a sensible, reviewable edit — a pg-backed data client (db/aiven.ts), a .env.aiven with
//      PLACEHOLDER host/db (NEVER real passwords/secrets), and a MIGRATION.md spelling out the
//      supabase-js → pg, realtime → Kafka, search → pgvector mapping,
//   4. commit, push, and open a REAL PR with `gh pr create`.
//
// Security posture:
//   • We NEVER write a real password, token, or connection secret into any committed file. The
//     .env.aiven carries only the public host + db name as placeholders; the password is a literal
//     "<set-me>" placeholder. assertNoSecrets() scans every staged file and aborts the push if a
//     secret-shaped string sneaks in.
//   • Degradation contract: any failure (gh missing, no push access, push rejected) emits a clear
//     {type:'log'} + a Receipt {action:'github_pull_request', ok:false} and returns — it NEVER
//     throws into the run. If the active gh account lacks push access, we fork + cross-fork PR.

import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SwarmEvent, Receipt } from '../shared/types.ts'

const now = () => new Date().toISOString()
const rid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function emitReceipt(emit: (e: SwarmEvent) => void, action: string, summary: string, ok: boolean): void {
  const receipt: Receipt = { id: rid('rcpt'), action, summary, ok, ts: now() }
  emit({ type: 'receipt', receipt })
}

/** Promise wrapper around execFile with a hard timeout and bounded buffer. Resolves {stdout,stderr,code}. */
function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      cmd,
      args,
      {
        cwd: opts.cwd,
        timeout: opts.timeoutMs ?? 90_000,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
        env: opts.env ?? { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      },
      (err, stdout, stderr) => {
        resolve({ ok: !err, stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '' })
      },
    )
  })
}

const BRANCH = 'overmind/graduate-to-aiven'

/** owner/repo from an https GitHub URL (e.g. https://github.com/ToukoUrsin/live-hype-wall → ToukoUrsin/live-hype-wall). */
function repoSlug(repoUrl: string): string | null {
  const m = repoUrl.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/)
  return m ? `${m[1]}/${m[2]}` : null
}

// ──────────────────────────── secret scan ────────────────────────────
// Belt-and-suspenders: before we commit, scan every file we WROTE for anything that looks like a
// live secret. This protects against a future edit accidentally interpolating a real connection
// string. Placeholders (<set-me>, YOUR-..., the literal aivencloud host with no password) are fine.

const SECRET_PATTERNS: { re: RegExp; what: string }[] = [
  { re: /postgres(?:ql)?:\/\/[^:@\s]+:[^@\s<]{6,}@/i, what: 'postgres URI with an embedded password' },
  { re: /sk-[A-Za-z0-9]{20,}/, what: 'API key (sk-…)' },
  { re: /gh[pousr]_[A-Za-z0-9]{20,}/, what: 'GitHub token' },
  { re: /AIVEN_TOKEN\s*=\s*\S{20,}/i, what: 'Aiven token' },
  { re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./, what: 'JWT' },
]

/** Throw if any written file contains a secret-shaped string. */
function assertNoSecrets(files: { path: string; content: string }[]): void {
  for (const f of files) {
    for (const { re, what } of SECRET_PATTERNS) {
      if (re.test(f.content)) {
        throw new Error(`refusing to commit ${f.path}: looks like it contains a ${what}`)
      }
    }
  }
}

// ──────────────────────────── the edit ────────────────────────────
// A real, reviewable repoint of the data layer onto Aiven. We do NOT rewrite every call site (that's
// the surgeon's job and would be a huge, risky diff); we add the Aiven-native data client + the
// config + the migration plan, which is exactly the cutover a human would review and merge.

function buildFiles(targetService: string, aivenHost: string, dbName: string): { path: string; content: string }[] {
  // db/aiven.ts — a pooled pg client + the pgvector semantic-search query that replaces the
  // Supabase `match_posts` RPC. Reads its connection string from env (never hardcoded).
  const aivenClient = `// db/aiven.ts — Aiven Postgres data client (generated by Overmind's graduate run).
//
// Repoints the data layer off supabase-js onto a direct, pooled Postgres connection against the
// Aiven service "${targetService}". The connection string comes from DATABASE_URL (see .env.aiven) —
// never hardcode credentials here.
//
// Mapping (see MIGRATION.md):
//   supabase.from('posts').select()      → pool.query('select … from posts …')
//   supabase.rpc('match_posts', …)       → pgvector '<=>' nearest-neighbour query below
//   supabase.channel(...).on('postgres_changes') → Aiven Kafka topic + SSE bridge (server side)
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set — copy .env.aiven and fill in your Aiven password.');
}

// Aiven Postgres requires TLS. We relax cert verification here for simplicity; in production pin the
// Aiven CA (ca.pem) instead of rejectUnauthorized:false.
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 8,
  idleTimeoutMillis: 30_000,
});

/** List the most recent posts (replaces supabase.from('posts').select(...).order(...).limit(...)). */
export async function listPosts(limit = 50) {
  const { rows } = await pool.query(
    \`select id, author_id, author_handle, body, image_url, reaction_count, created_at
       from posts
      order by created_at desc
      limit $1\`,
    [limit],
  );
  return rows;
}

/**
 * Semantic search over pgvector — the Aiven-native replacement for the Supabase match_posts RPC.
 * '<=>' is pgvector's cosine-distance operator; smaller is more similar, so 1 - distance ≈ similarity.
 */
export async function matchPosts(queryEmbedding: number[], matchCount = 12) {
  const literal = '[' + queryEmbedding.join(',') + ']';
  const { rows } = await pool.query(
    \`select id, author_id, author_handle, body, image_url, reaction_count, created_at,
            1 - (embedding <=> $1::vector) as similarity
       from posts
      where embedding is not null
      order by embedding <=> $1::vector
      limit $2\`,
    [literal, matchCount],
  );
  return rows;
}
`

  // .env.aiven — PLACEHOLDERS ONLY. The host + db are public; the password is a literal placeholder.
  const envAiven = `# .env.aiven — Aiven Postgres connection for the graduated app.
# Generated by Overmind. Fill in the password from the Aiven console / 'avn service get'.
# NEVER commit the real password — keep your filled-in copy in .env.local (gitignored).
#
# Aiven service: ${targetService}
DATABASE_URL=postgres://avnadmin:<set-me>@${aivenHost}:5432/${dbName}?sslmode=require

# Realtime (Supabase Realtime → Aiven Kafka). Brokers are public; SASL password is a placeholder.
KAFKA_BROKERS=<your-aiven-kafka-host>:<port>
KAFKA_USERNAME=avnadmin
KAFKA_PASSWORD=<set-me>
KAFKA_TOPIC=app.posts.outbox
`

  const migrationMd = `# Graduate to Aiven

This branch repoints the app off **Supabase / Lovable Cloud** onto a dedicated **Aiven** stack that
Overmind provisioned and migrated into — \`${targetService}\` (PostgreSQL) — with live data already
copied in and row-count parity verified.

## What changed

| Supabase primitive | Aiven replacement | Where |
| --- | --- | --- |
| \`@supabase/supabase-js\` client | Direct pooled \`pg\` client | \`db/aiven.ts\` |
| \`supabase.from('posts').select()\` | \`select … from posts\` | \`db/aiven.ts\` → \`listPosts()\` |
| \`supabase.rpc('match_posts', …)\` (pgvector) | pgvector \`<=>\` nearest-neighbour query | \`db/aiven.ts\` → \`matchPosts()\` |
| Supabase Realtime (\`postgres_changes\`) | Aiven **Kafka** topic + SSE bridge | server bridge (see \`.env.aiven\`) |
| Supabase Auth (GoTrue) | Generated auth service (magic-code → JWT) | follow-up |

## How to run

1. Copy \`.env.aiven\` → \`.env.local\` and fill in the Aiven password (from the Aiven console).
2. \`npm install pg\`
3. Import from \`db/aiven.ts\` instead of \`@/integrations/supabase/client\` at your data call sites.

## Why this is safe to merge incrementally

This PR adds the Aiven-native data client and config without ripping out the Supabase call sites in
one shot — so you can move components over one at a time and roll back trivially. The data is already
live on Aiven (\`${targetService}\`) with verified parity, so the cutover is config + import swaps,
not a data migration.

> Connection secrets are intentionally placeholders (\`<set-me>\`). Nothing in this branch contains a
> real password or token.
`

  return [
    { path: 'db/aiven.ts', content: aivenClient },
    { path: '.env.aiven', content: envAiven },
    { path: 'MIGRATION.md', content: migrationMd },
  ]
}

// ──────────────────────────── public API ────────────────────────────

export interface OpenPrArgs {
  repoUrl: string
  targetService: string
  /** Public Aiven host for the fresh service (for the placeholder .env). Optional. */
  aivenHost?: string
  /** DB name on the fresh service. Defaults to defaultdb. */
  dbName?: string
  emit: (e: SwarmEvent) => void
}

/**
 * Clone the repo, write the Aiven repoint edit, push branch overmind/graduate-to-aiven, and open a
 * REAL PR via `gh pr create`. Emits a Receipt {action:'github_pull_request', summary:<URL>} and a
 * {type:'log'} on success. Degrades gracefully (Receipt ok:false + log) on any failure; never throws.
 * Returns the PR URL on success, else null.
 */
export async function openMigrationPR(args: OpenPrArgs): Promise<string | null> {
  const { repoUrl, targetService, emit } = args
  const aivenHost = args.aivenHost || `${targetService}-PROJECT.aivencloud.com`
  const dbName = args.dbName || 'defaultdb'

  const slug = repoSlug(repoUrl)
  if (!slug) {
    emit({ type: 'log', level: 'warn', msg: `pr: cannot parse repo slug from ${repoUrl} — skipping PR` })
    emitReceipt(emit, 'github_pull_request', `Could not parse repo URL ${repoUrl}`, false)
    return null
  }

  // gh is required to open the PR. If it's missing we can't open a PR — degrade clearly.
  const ghVer = await run('gh', ['--version'], { timeoutMs: 10_000 })
  if (!ghVer.ok) {
    emit({ type: 'log', level: 'warn', msg: 'pr: gh CLI unavailable — cannot open a real PR' })
    emitReceipt(emit, 'github_pull_request', 'gh CLI unavailable — PR not opened', false)
    return null
  }

  let dir: string | null = null
  try {
    dir = await mkdtemp(join(tmpdir(), 'overmind-pr-'))

    // Clone via gh (uses the active gh auth for push), fall back to plain git for the clone.
    emit({ type: 'log', level: 'info', msg: `pr: cloning ${slug} to open the cutover PR` })
    let cloned = await run('gh', ['repo', 'clone', slug, dir, '--', '--depth', '1'], { timeoutMs: 90_000 })
    if (!cloned.ok) {
      cloned = await run('git', ['clone', '--depth', '1', '--', `https://github.com/${slug}.git`, dir], {
        timeoutMs: 90_000,
      })
    }
    if (!cloned.ok) {
      emit({ type: 'log', level: 'warn', msg: `pr: clone failed (${(cloned.stderr || cloned.stdout).split('\n')[0]})` })
      emitReceipt(emit, 'github_pull_request', `Clone of ${slug} failed — PR not opened`, false)
      return null
    }

    // Identity for the commit (config local to this clone; never touches global git config).
    await run('git', ['config', 'user.name', 'Overmind'], { cwd: dir })
    await run('git', ['config', 'user.email', 'overmind@aiven.local'], { cwd: dir })

    // Fresh branch off the default branch.
    await run('git', ['checkout', '-B', BRANCH], { cwd: dir })

    // Write the edit. assertNoSecrets() guards every file before we stage anything.
    const files = buildFiles(targetService, aivenHost, dbName)
    assertNoSecrets(files)
    for (const f of files) {
      const full = join(dir, f.path)
      const slash = full.lastIndexOf('/')
      if (slash > 0) await mkdir(full.slice(0, slash), { recursive: true })
      await writeFile(full, f.content, 'utf8')
    }

    await run('git', ['add', '-A'], { cwd: dir })
    const commit = await run(
      'git',
      [
        'commit',
        '-m',
        `Graduate to Aiven: repoint data layer to ${targetService}\n\n` +
          `Adds a pg-backed data client (db/aiven.ts), .env.aiven (placeholders), and MIGRATION.md.\n` +
          `Live data already migrated to Aiven ${targetService} with verified parity.\n\n` +
          `Generated by Overmind.`,
      ],
      { cwd: dir },
    )
    if (!commit.ok && !/nothing to commit/.test(commit.stdout + commit.stderr)) {
      emit({ type: 'log', level: 'warn', msg: `pr: commit failed (${(commit.stderr || commit.stdout).split('\n')[0]})` })
      emitReceipt(emit, 'github_pull_request', 'Commit failed — PR not opened', false)
      return null
    }

    // Push the branch. If the active account lacks push access, gh pr create --fill will fork; but a
    // direct push to origin is the common case (the user has WRITE). Try origin first; on failure,
    // create a fork and push there, then open a cross-fork PR.
    let pushedRemote = 'origin'
    let push = await run('git', ['push', '-u', 'origin', BRANCH, '--force'], { cwd: dir, timeoutMs: 90_000 })
    if (!push.ok) {
      emit({ type: 'log', level: 'info', msg: `pr: direct push failed — forking ${slug} for a cross-fork PR` })
      const fork = await run('gh', ['repo', 'fork', slug, '--remote', '--remote-name', 'fork', '--clone=false'], {
        cwd: dir,
        timeoutMs: 60_000,
      })
      if (fork.ok) {
        pushedRemote = 'fork'
        push = await run('git', ['push', '-u', 'fork', BRANCH, '--force'], { cwd: dir, timeoutMs: 90_000 })
      }
    }
    if (!push.ok) {
      emit({ type: 'log', level: 'warn', msg: `pr: push failed (${(push.stderr || push.stdout).split('\n')[0]})` })
      emitReceipt(emit, 'github_pull_request', 'Push failed (no write access / fork) — PR not opened', false)
      return null
    }

    // Open the PR. gh resolves the head ref from the pushed branch; --repo pins the base repo so a
    // cross-fork PR targets the upstream. If a PR for this branch already exists, surface its URL.
    const title = 'Graduate to Aiven'
    const body =
      `Overmind provisioned a fresh Aiven Postgres (\`${targetService}\`), migrated the live data into ` +
      `it with verified row-count parity (incl. pgvector embeddings), and this PR repoints the app's ` +
      `data layer onto it.\n\n` +
      `- Adds \`db/aiven.ts\` — pooled \`pg\` client + pgvector semantic search (replaces supabase-js + match_posts RPC)\n` +
      `- Adds \`.env.aiven\` — Aiven connection config (**placeholders only**, no secrets)\n` +
      `- Adds \`MIGRATION.md\` — the supabase-js→pg / realtime→Kafka / search→pgvector mapping\n\n` +
      `Merge incrementally: the Supabase call sites still work; swap imports to \`db/aiven.ts\` one ` +
      `component at a time. The data is already live on Aiven.`

    const prArgs = ['pr', 'create', '--repo', slug, '--base', 'main', '--title', title, '--body', body]
    if (pushedRemote === 'fork') {
      // Cross-fork: head must be <forkOwner>:branch. Resolve the fork owner from the active account.
      const me = await run('gh', ['api', 'user', '-q', '.login'], { timeoutMs: 15_000 })
      const owner = me.stdout.trim()
      if (owner) prArgs.push('--head', `${owner}:${BRANCH}`)
    } else {
      prArgs.push('--head', BRANCH)
    }

    let pr = await run('gh', prArgs, { cwd: dir, timeoutMs: 60_000 })
    let url = (pr.stdout.match(/https:\/\/github\.com\/\S+\/pull\/\d+/) || [])[0]

    // A PR for this branch may already exist (re-run): recover its URL instead of failing.
    if (!url && /already exists/i.test(pr.stderr + pr.stdout)) {
      const view = await run('gh', ['pr', 'view', `${BRANCH}`, '--repo', slug, '--json', 'url', '-q', '.url'], {
        cwd: dir,
        timeoutMs: 30_000,
      })
      url = view.stdout.trim() || (view.stdout.match(/https:\/\/github\.com\/\S+\/pull\/\d+/) || [])[0]
    }

    if (!url) {
      emit({ type: 'log', level: 'warn', msg: `pr: gh pr create failed (${(pr.stderr || pr.stdout).split('\n')[0]})` })
      emitReceipt(emit, 'github_pull_request', 'gh pr create failed — PR not opened', false)
      return null
    }

    emitReceipt(emit, 'github_pull_request', url, true)
    emit({ type: 'log', level: 'info', msg: `Opened migration PR: ${url}` })
    return url
  } catch (e) {
    emit({ type: 'log', level: 'warn', msg: `pr: unexpected failure (${(e as Error)?.message ?? e}) — PR not opened` })
    emitReceipt(emit, 'github_pull_request', `PR step failed: ${(e as Error)?.message ?? e}`, false)
    return null
  } finally {
    if (dir) rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
