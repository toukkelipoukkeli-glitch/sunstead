// Aiven-style top nav. The product wordmark stays singular: Overmind.
// "Sign in" / "Start free" point at the WorkOS auth routes the auth agent builds;
// if those 404 in dev they degrade to the console (handled in authHref()).

import { Logo, ArrowRight } from '../../icons.tsx'
import { apiUrl } from '../../config.ts'

function authHref(path: string): string {
  // In dev the WorkOS routes may not exist yet → fall back to the console.
  // We optimistically link to the real route (resolved against the configured API base so it
  // works behind the tunnel from a static Pages deploy); onError below swaps to the console.
  return apiUrl(path)
}

export function Nav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <a className="lp-wordmark" href="#/">
          <span className="lp-logo-mark" aria-hidden="true">
            <Logo size={24} />
          </span>
          <span className="lp-logo-text">Overmind</span>
        </a>

        <nav className="lp-nav-links">
          <a href="#how">How it works</a>
          <a href="#agents">Agents</a>
          <a href="#deploy">Get it on Aiven</a>
          <a className="lp-nav-console" href="#/app">
            Console <ArrowRight size={15} />
          </a>
        </nav>

        <div className="lp-nav-cta">
          <a
            className="lp-btn lp-btn-ghost"
            href={authHref('/api/auth/login')}
            onClick={(e) => degradeToConsole(e, '/api/auth/login')}
          >
            Sign in
          </a>
          <a
            className="lp-btn lp-btn-primary"
            href={authHref('/api/auth/login?screen_hint=sign-up')}
            onClick={(e) => degradeToConsole(e, '/api/auth/login?screen_hint=sign-up')}
          >
            Start free
          </a>
        </div>
      </div>
    </header>
  )
}

// If the WorkOS route isn't live yet (dev), a HEAD probe failing → open the console.
// We do this lazily on click so we never block render. Real route wins when it exists.
async function degradeToConsole(e: React.MouseEvent<HTMLAnchorElement>, path: string) {
  e.preventDefault()
  const url = apiUrl(path)
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual', credentials: 'include' })
    // 0 (opaqueredirect) or 2xx/3xx → the auth route exists; follow it.
    if (res.type === 'opaqueredirect' || res.status === 0 || (res.status >= 200 && res.status < 400)) {
      window.location.href = url
      return
    }
  } catch {
    /* network/route missing in dev → console fallback below */
  }
  window.location.hash = '#/app'
}
