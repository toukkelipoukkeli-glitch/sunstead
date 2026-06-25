// web/Deploy.tsx — "Connect your app". The one button that starts everything.
//
// A field prefilled with the demo source (../demo/live-hype-wall), the exact list of what the
// swarm will do — straight from shared/types.ts RunPhase — and a big "Graduate to Aiven" button
// that POSTs /api/run { source } then navigates to Mission Control (#/app).
//
// Copy is load-bearing: "Runs on Aiven. You'll never open the Aiven dashboard — your CTO agent
// handles it." That's the product thesis on one screen.
//
// Owns: this file + web/product.css. Default export. Never edits App.tsx / orchestrator.

import { useState } from 'react'
import './product.css'

// The demo source the orchestrator scans (server/env.ts SOURCE_REPO_DIR default).
const DEMO_SOURCE = '../demo/live-hype-wall'

// The visible phases, mapped from shared/types.ts RunPhase. We collapse `plan` into provision and
// hide the terminal `done`/`error` — what the founder sees is the nine actions the swarm performs.
// Each line is a behavior-migration verb + the Aiven primitive it lands on.
const PHASES: { phase: string; name: string; target?: string; detail: string }[] = [
  { phase: 'recon', name: 'Recon', detail: 'Scan the repo + introspect the Supabase DB — tables, RLS, auth, realtime, edge functions.' },
  { phase: 'graph', name: 'Behavior graph', detail: 'Classify every behavior: direct-migrate, rewrite onto Aiven, or generate a replacement.' },
  { phase: 'provision', name: 'Provision', target: 'MCP', detail: 'Spin up Aiven for PostgreSQL® + Apache Kafka® live, via the Aiven MCP. Every action receipted.' },
  { phase: 'migrate', name: 'Migrate', target: 'Postgres', detail: 'Copy schema + data into Aiven PG with row-count parity. pgvector and indexes included.' },
  { phase: 'generate', name: 'Generate backend', target: 'Surgeon', detail: 'Emit a real Aiven-native backend — own JWT auth, data API, Kafka→SSE realtime, vector search.' },
  { phase: 'heal', name: 'Self-heal', detail: 'Boot the generated backend, run smoke tests, feed any error back to the Healer until green.' },
  { phase: 'verify', name: 'Verify', detail: 'Row-count parity, auth flow, query, Kafka roundtrip, vector search — every check must pass.' },
  { phase: 'cutover', name: 'Cut over', detail: 'Flip traffic to Aiven. Zero Supabase left running. Zero feature flags.' },
  { phase: 'operate', name: 'Operate', target: 'CTO', detail: 'Your Aiven CTO agent takes over — watches metrics, advises, scales. You never touch the dashboard.' },
]

export default function Deploy() {
  const [source, setSource] = useState(DEMO_SOURCE)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function graduate() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials so a logged-in human's session cookie rides along (requireHumanOrAgent).
        credentials: 'include',
        body: JSON.stringify({ source }),
      })
      if (!res.ok) {
        // 401 → not signed in. Send them through AuthKit, returning here.
        if (res.status === 401) {
          window.location.href = '/api/auth/login'
          return
        }
        throw new Error(`run failed: ${res.status} ${await res.text()}`)
      }
      // Hand off to Mission Control — the run streams over /api/stream and the dashboard renders it.
      window.location.hash = '#/app'
    } catch (e) {
      setErr((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="pp">
      <header className="pp-top">
        <a className="pp-wordmark" href="#/">
          <span className="pp-mark">
            <LeafMark />
          </span>
          Aiven
          <span className="pp-divider">/</span>
          <span>Overmind</span>
        </a>
        <div className="pp-top-right">
          <a href="#/app">Mission Control →</a>
        </div>
      </header>

      <main className="pp-wrap">
        <span className="pp-kicker">Connect your app</span>
        <h1 className="pp-h1">
          Point Overmind at your app.
          <br />
          <span className="pp-grad">Graduate it to Aiven.</span>
        </h1>
        <p className="pp-lede">
          One click hands your Lovable/Supabase backend to an agent swarm. It rebuilds every
          behavior on Aiven — live — and self-heals until every test is green.
        </p>

        <div className="pp-deploy-grid" style={{ marginTop: 36 }}>
          {/* left: source + the plan + the button */}
          <section className="pp-card pp-card-pad">
            <h2 className="pp-h2">Source app</h2>
            <div className="pp-source-field">
              <div className="pp-source-input">
                <span className="pp-leaf">
                  <FolderMark />
                </span>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  spellCheck={false}
                  aria-label="source app path"
                />
                <span className="pp-source-badge">
                  <DotMark /> Lovable · detected
                </span>
              </div>
            </div>

            <h2 className="pp-h2" style={{ marginTop: 30 }}>
              What the swarm will do
            </h2>
            <ol className="pp-phases">
              {PHASES.map((p, i) => (
                <li className="pp-phase" key={p.phase}>
                  <span className="pp-phase-num">{i + 1}</span>
                  <div className="pp-phase-body">
                    <div className="pp-phase-name">
                      {p.name}
                      {p.target && <span className="pp-tgt">{p.target}</span>}
                    </div>
                    <div className="pp-phase-detail">{p.detail}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="pp-deploy-cta">
              <button
                className="pp-btn pp-btn-primary pp-btn-lg pp-btn-block"
                onClick={graduate}
                disabled={busy || !source.trim()}
              >
                {busy ? (
                  <span className="pp-deploy-running">
                    <span className="pp-spin" /> Starting the swarm…
                  </span>
                ) : (
                  '⚡  Graduate to Aiven'
                )}
              </button>
              {err && (
                <div className="pp-err" style={{ color: 'var(--pp-crit)', background: 'rgba(255,68,56,0.08)', borderColor: 'rgba(255,68,56,0.3)' }}>
                  {err}
                </div>
              )}
              <p className="pp-deploy-note">
                <span className="pp-leaf">
                  <LeafMark />
                </span>
                <span>
                  Runs on Aiven. You&apos;ll never open the Aiven dashboard — your CTO agent handles
                  it.
                </span>
              </p>
            </div>
          </section>

          {/* right: the proof aside */}
          <aside className="pp-card pp-card-pad">
            <div className="pp-aside-stat">
              <div className="pp-stat">
                <div className="pp-stat-k">Rebuilds onto</div>
                <div className="pp-pill-row">
                  <span className="pp-pill">Aiven for PostgreSQL®</span>
                  <span className="pp-pill">Apache Kafka®</span>
                  <span className="pp-pill">pgvector</span>
                  <span className="pp-pill">Aiven Apps</span>
                </div>
              </div>
              <div className="pp-stat">
                <div className="pp-stat-k">Provisioned via</div>
                <div className="pp-stat-v">
                  Aiven MCP <small>every action receipted</small>
                </div>
              </div>
              <div className="pp-stat">
                <div className="pp-stat-k">Supabase left running</div>
                <div className="pp-stat-v" style={{ color: 'var(--pp-red)' }}>
                  0 <small>zero flags, full cutover</small>
                </div>
              </div>
              <div className="pp-stat">
                <div className="pp-stat-k">Backed by</div>
                <div className="pp-stat-v">
                  99.99% <small>Aiven SLA</small>
                </div>
              </div>
              <div
                style={{
                  marginTop: 6,
                  paddingTop: 20,
                  borderTop: '1px solid var(--pp-line)',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--pp-dim)',
                }}
              >
                After cutover you land in Mission Control to watch the swarm finish — then you only
                ever talk to <strong style={{ color: 'var(--pp-txt)' }}>your Aiven CTO</strong>.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

// ── inline marks (no asset deps) ──
function LeafMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4C20 4 8 5 5 13c-2 5 1 8 1 8s3-9 9-12c0 0-6 4-7 11 0 0 9 1 12-8 2-6 0-8 0-8z"
        fill="currentColor"
      />
    </svg>
  )
}
function FolderMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6.5A1.5 1.5 0 014.5 5h4l2 2.2H19.5A1.5 1.5 0 0121 8.7v9.3A1.5 1.5 0 0119.5 19.5h-15A1.5 1.5 0 013 18V6.5z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}
function DotMark() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  )
}
