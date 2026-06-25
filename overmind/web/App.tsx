import { useEffect, useState } from 'react'
import Landing from './Landing.tsx'
import Dashboard from './Dashboard.tsx'
import Signup from './Signup.tsx'
import Deploy from './Deploy.tsx'
import CtoConsole from './CtoConsole.tsx'

// ───────────────────────── tiny hash router ─────────────────────────
// The founder flow: landing → #/signup → #/deploy → #/app (live migration) → #/cto.
// Hash routing keeps this a pure static SPA — identical in `vite dev` and when the
// bundle is served from Aiven Apps. Everything unknown falls back to the Landing.
type Route = 'landing' | 'signup' | 'deploy' | 'app' | 'cto'

function currentRoute(): Route {
  const h = window.location.hash.replace(/^#/, '')
  if (h.startsWith('/app')) return 'app'
  if (h.startsWith('/signup')) return 'signup'
  if (h.startsWith('/deploy')) return 'deploy'
  if (h.startsWith('/cto') || h.startsWith('/console')) return 'cto'
  return 'landing'
}

export function App() {
  const [route, setRoute] = useState<Route>(currentRoute())

  useEffect(() => {
    const onHash = () => {
      setRoute(currentRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  switch (route) {
    case 'app':
      return <Dashboard />
    case 'signup':
      return <Signup />
    case 'deploy':
      return <Deploy />
    case 'cto':
      return <CtoConsole />
    default:
      return <Landing />
  }
}
