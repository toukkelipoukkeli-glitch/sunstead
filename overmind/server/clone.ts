// server/clone.ts — clone a PUBLIC GitHub repo to a throwaway temp dir.
//
// Used by the "analyze" run mode: the public site pastes a GitHub URL, we really clone it
// (shallow, single-branch), point the recon/graph/generate pipeline at the working copy, and
// always clean up afterwards.
//
// Security posture (the "why"):
//   - We NEVER interpolate the URL into a shell. `execFile('git', [...args])` passes argv directly
//     to git, so shell metacharacters in the URL can't be interpreted — no command injection.
//   - We validate the URL shape up front (https://github.com/<owner>/<repo>) and reject SSH,
//     non-GitHub, non-https, and anything carrying shell-meta chars, before git ever sees it.
//   - A hard timeout bounds the clone so a hung/huge repo can't wedge the server.

import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** GitHub owner/repo URL: https://github.com/<owner>/<repo> with an optional .git and trailing slash. */
const GITHUB_HTTPS_RE =
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/

// Characters that have meaning to a shell or to git's URL parsing (option-injection via a
// leading '-', etc.). Belt-and-suspenders on top of the strict allowlist regex above.
const SHELL_META_RE = /[\s;&|`$(){}<>\\'"]/

/**
 * Validate that `url` is a plausible PUBLIC https GitHub repo URL. Throws a clear Error otherwise.
 * Returns the normalized URL (kept as-is; we don't rewrite it).
 */
export function assertPublicGithubUrl(url: unknown): string {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('repo URL required (paste an https://github.com/<owner>/<repo> link)')
  }
  const u = url.trim()
  if (u.length > 300) throw new Error('repo URL too long')
  if (SHELL_META_RE.test(u)) throw new Error('repo URL contains illegal characters')
  if (u.startsWith('git@') || u.includes('ssh://')) {
    throw new Error('SSH URLs are not supported — paste a public https://github.com/... URL')
  }
  if (!GITHUB_HTTPS_RE.test(u)) {
    throw new Error('only public GitHub https URLs are supported (https://github.com/<owner>/<repo>)')
  }
  return u
}

/**
 * Clone a public GitHub repo (shallow, single-branch) into a fresh temp dir.
 * Returns the dir plus a best-effort `cleanup()` that rm -rf's it and never throws.
 */
export async function cloneRepo(url: string): Promise<{ dir: string; cleanup: () => void }> {
  const safeUrl = assertPublicGithubUrl(url)

  const dir = await mkdtemp(join(tmpdir(), 'overmind-clone-'))
  const cleanup = (): void => {
    // Fire-and-forget rm -rf; never throw out of cleanup so a `finally` is always safe.
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }

  try {
    await execFileP(
      'git',
      // `--` terminates options so a hostile URL can't be read as a git flag (defense in depth on
      // top of validation). Shallow + single-branch keeps the clone small and fast.
      ['clone', '--depth', '1', '--single-branch', '--no-tags', '--', safeUrl, dir],
      {
        timeoutMs: 60_000,
        // Disable any interactive credential prompt — a private/nonexistent repo should fail fast,
        // not block on a terminal that isn't there.
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: '/bin/echo' },
      },
    )
  } catch (e) {
    cleanup()
    throw new Error(`git clone failed: ${(e as Error)?.message ?? e}`)
  }

  return { dir, cleanup }
}

/** Extract an `owner/repo` slug from a GitHub URL or a bare slug. Throws on anything else. */
function toSlug(repoUrlOrSlug: string): string {
  const s = String(repoUrlOrSlug || '').trim()
  const m = s.match(/github\.com[/:]([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/)
  const slug = m ? m[1] : s
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug)) {
    throw new Error(`invalid repo (expected owner/repo): ${s}`)
  }
  return slug
}

/**
 * Clone a repo using the local `gh` CLI's auth — so PRIVATE repos work too (the demo's own
 * live-hype-wall is private). Falls back to plain `git` over https if gh is unavailable. Accepts an
 * https GitHub URL or an `owner/repo` slug. argv-only (no shell); returns the dir + a safe cleanup().
 */
export async function cloneRepoAuthed(repoUrlOrSlug: string): Promise<{ dir: string; cleanup: () => void }> {
  const slug = toSlug(repoUrlOrSlug)
  const dir = await mkdtemp(join(tmpdir(), 'overmind-clone-'))
  const cleanup = (): void => {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
  try {
    // `gh repo clone` uses the active gh auth (handles private). `--` passes git flags through.
    await execFileP('gh', ['repo', 'clone', slug, dir, '--', '--depth', '1', '--no-tags'], {
      timeoutMs: 90_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
  } catch {
    try {
      await execFileP(
        'git',
        ['clone', '--depth', '1', '--no-tags', '--', `https://github.com/${slug}.git`, dir],
        { timeoutMs: 90_000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: '/bin/echo' } },
      )
    } catch (e) {
      cleanup()
      throw new Error(`authed clone of ${slug} failed: ${(e as Error)?.message ?? e}`)
    }
  }
  return { dir, cleanup }
}

/** Promise wrapper around execFile with a hard timeout and bounded buffer. */
function execFileP(
  cmd: string,
  args: string[],
  opts: { timeoutMs: number; env: NodeJS.ProcessEnv },
): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: opts.timeoutMs, env: opts.env, maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (err, _stdout, stderr) => {
        if (err) {
          // git writes the useful diagnostic to stderr; surface a trimmed first line (no secrets:
          // public clone has no creds, and we never echo the env).
          const detail = (stderr || err.message || '').split('\n')[0]?.trim()
          reject(new Error(detail || 'git clone error'))
          return
        }
        resolve()
      },
    )
  })
}
