// GitHub REST API client — the write path. With a scoped, revocable token (an
// OAuth access token from "Connect GitHub", OR a pasted PAT) we read the user's
// repos, check push access, fork when needed, and open the migration Pull Request.
// The token stays server-side; it's never echoed into errors or logs.

const API = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '')

export type Repo = {
  fullName: string // owner/name
  name: string
  owner: string
  defaultBranch: string
  private: boolean
  canPush: boolean
}

// Strip any token-shaped substring so a leaked header/url can't ride out on an error.
const redact = (s: string): string => s.replace(/gh[pousr]_[A-Za-z0-9]+/g, 'gh_***').replace(/github_pat_[A-Za-z0-9_]+/g, 'github_pat_***')

async function api(token: string, path: string, init?: RequestInit): Promise<{ status: number; body: any }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'switchboard-vibe-deploy',
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  let body: any = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!res.ok) {
    const msg = redact((body && body.message ? body.message : text).slice(0, 300))
    throw new Error(`GitHub API ${res.status}${msg ? ': ' + msg : ''}`)
  }
  return { status: res.status, body }
}

export async function getUser(token: string): Promise<{ login: string }> {
  const { body } = await api(token, '/user')
  return { login: body?.login || '' }
}

// The repo picker source — owner + collaborator + org repos, most-recently-pushed first.
export async function listRepos(token: string): Promise<Repo[]> {
  const { body } = await api(token, '/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member')
  const arr = Array.isArray(body) ? body : []
  return arr.map(mapRepo)
}

export async function getRepo(token: string, owner: string, repo: string): Promise<Repo> {
  const { body } = await api(token, `/repos/${owner}/${repo}`)
  return mapRepo(body)
}

function mapRepo(r: any): Repo {
  return {
    fullName: r?.full_name || `${r?.owner?.login}/${r?.name}`,
    name: r?.name || '',
    owner: r?.owner?.login || '',
    defaultBranch: r?.default_branch || 'main',
    private: Boolean(r?.private),
    canPush: Boolean(r?.permissions?.push),
  }
}

// Fork into the authenticated user's account, then poll until the fork is clonable
// (GitHub returns 202 immediately but the repo isn't ready for a beat).
export async function forkRepo(token: string, owner: string, repo: string, onLog?: (m: string) => void): Promise<Repo> {
  const log = onLog || (() => {})
  log(`forking ${owner}/${repo}…`)
  const { body } = await api(token, `/repos/${owner}/${repo}/forks`, { method: 'POST', body: JSON.stringify({ default_branch_only: true }) })
  const forkFull: string = body?.full_name || ''
  const [forkOwner, forkName] = forkFull.split('/')
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    try {
      const ready = await getRepo(token, forkOwner, forkName)
      if (ready.fullName) { log(`fork ready: ${ready.fullName}`); return ready }
    } catch { /* not ready yet */ }
  }
  // Best effort: return what the fork POST told us even if the poll timed out.
  return mapRepo(body)
}

export async function openPullRequest(
  token: string,
  opts: { owner: string; repo: string; head: string; base: string; title: string; body: string },
): Promise<{ url: string; number: number }> {
  const { body } = await api(token, `/repos/${opts.owner}/${opts.repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ title: opts.title, head: opts.head, base: opts.base, body: opts.body }),
  })
  return { url: body?.html_url || '', number: body?.number || 0 }
}
