import { useEffect, useState } from 'react'
import Landing from './Landing.tsx'
import Dashboard from './Dashboard.tsx'

// ───────────────────────── tiny hash router ─────────────────────────
// '#/app' → Mission Control dashboard. Everything else → the marketing Landing.
// Hash routing keeps this a pure static SPA — no server route table needed, so it
// works identically in `vite dev` and when the bundle is served from Aiven Apps.
function currentRoute(): 'app' | 'landing' {
  return window.location.hash.replace(/^#/, '').startsWith('/app') ? 'app' : 'landing'
}

export function App() {
  const [route, setRoute] = useState<'app' | 'landing'>(currentRoute())

  useEffect(() => {
    const onHash = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route === 'app' ? <Dashboard /> : <Landing />
}
