// web/config.ts — runtime-configurable API base.
//
// Why this exists: the static frontend ships to GitHub Pages, but the backend lives behind a
// tunnel at an address we don't know until run time. So instead of baking the API origin into the
// bundle, we resolve it at run time and persist it. Locally (API_BASE === '') everything is
// same-origin and the Vite dev proxy handles `/api/*` exactly as before — behavior is identical.
//
// Resolution order (first hit wins):
//   1. `?api=<url>` query param  → persisted to localStorage['overmind_api'], then used
//   2. localStorage['overmind_api']
//   3. import.meta.env.VITE_API_BASE  (build-time default)
//   4. ''  (same-origin — the local-dev default)
//
// Every fetch / EventSource / auth redirect in web/ must go through apiUrl()/apiFetch() so a single
// switch points the whole app at the tunnel.

const LS_KEY = 'overmind_api'

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

function resolveBase(): string {
  // (1) ?api=<url> — explicit override; persist it so refreshes keep working.
  try {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('api')
    if (fromQuery != null) {
      const v = stripTrailingSlash(fromQuery.trim())
      try {
        // empty string is a legitimate "go back to same-origin" reset
        if (v) window.localStorage.setItem(LS_KEY, v)
        else window.localStorage.removeItem(LS_KEY)
      } catch {
        /* storage may be unavailable (private mode) — fall through to using v */
      }
      return v
    }
  } catch {
    /* no window/search (SSR, tests) — keep going */
  }

  // (2) persisted value
  try {
    const stored = window.localStorage.getItem(LS_KEY)
    if (stored) return stripTrailingSlash(stored.trim())
  } catch {
    /* ignore */
  }

  // (3) build-time env default. Vite statically replaces `import.meta.env.VITE_*` at build; we read
  // it through a cast so this compiles without the `vite/client` ambient types in tsconfig.
  const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE ?? '')
  if (env) return stripTrailingSlash(env.trim())

  // (4) same-origin
  return ''
}

/** Resolved once at module load. '' means same-origin (local dev via the Vite proxy). */
export const API_BASE: string = resolveBase()

/** Join API_BASE + path. `path` always starts with `/api/...`. */
export function apiUrl(path: string): string {
  return API_BASE + path
}

/** fetch() against the resolved base, always sending credentials so sessions ride along. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { credentials: 'include', ...init })
}
