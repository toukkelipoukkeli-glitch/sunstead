// web/Signup.tsx — "Start free". Two kinds of users, one door.
//
//   • Humans  → a single WorkOS AuthKit "Continue" button → /api/auth/login (hosted login).
//   • AGENTS  → THE HERO. An auth.md-style self-registration card: an agent POSTs
//               /api/agents/register, gets back scoped credentials + a short-lived token,
//               and we show the token plus a copy-paste snippet of the agent doing exactly
//               this. The standout — Overmind is the first Aiven product where agents are
//               first-class users that onboard themselves with no human in the loop.
//
// Owns: this file + web/product.css. Default export. Never edits App.tsx.

import { useState } from 'react'
import './product.css'
import { apiFetch, apiUrl } from './config.ts'

// The four scopes an agent can request. `migration:run` + `migration:read` are exactly what
// POST /api/run requires — least privilege by default (see server/workos.ts DEFAULT_AGENT_SCOPES).
const SCOPES = [
  { id: 'migration:run', label: 'migration:run' },
  { id: 'migration:read', label: 'migration:read' },
  { id: 'metrics:read', label: 'metrics:read' },
  { id: 'cto:chat', label: 'cto:chat' },
]

// The /api/agents/register response shape (server/workos.ts → RegisterResult).
interface RegisterResult {
  mode: string
  client_id: string
  access_token: string
  expires_in: number
  scopes: string[]
  note: string
}

// Tiny syntax-highlighted line renderer for the snippet — no dependency, just spans.
function CodeBlock({ name, title, lines }: { name: string; title: string; lines: string[] }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }
  return (
    <figure className="pp-code" aria-label={name}>
      <figcaption className="pp-code-head">
        <span className="pp-code-dot" />
        <span className="pp-code-dot" />
        <span className="pp-code-dot" />
        <span className="pp-code-title">{title}</span>
        <button className="pp-copy pp-code-copy" onClick={copy}>
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </figcaption>
      <pre>
        <code>
          {lines.map((l, i) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: hl(l) }} />
          ))}
        </code>
      </pre>
    </figure>
  )
}

// Minimal highlighter: comments, strings, the curl verb, and known keys.
function hl(line: string): string {
  const esc = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  if (esc.trimStart().startsWith('#')) return `<span class="c">${esc}</span>`
  return esc
    .replace(/('[^']*')/g, '<span class="s">$1</span>')
    .replace(/\b(curl|POST|GET)\b/g, '<span class="k">$1</span>')
    .replace(/(-[A-Za-z])\b/g, '<span class="v">$1</span>')
}

export default function Signup() {
  // ── agent registration state ──
  const [name, setName] = useState('recon-7')
  const [org, setOrg] = useState('acme')
  const [scopes, setScopes] = useState<string[]>(['migration:run', 'migration:read'])
  const [busy, setBusy] = useState(false)
  const [creds, setCreds] = useState<RegisterResult | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const toggleScope = (id: string) =>
    setScopes((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function registerAgent() {
    setBusy(true)
    setErr(null)
    setCreds(null)
    try {
      const res = await apiFetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, orgId: org || undefined, scopes }),
      })
      if (!res.ok) throw new Error(`register failed: ${res.status} ${await res.text()}`)
      setCreds((await res.json()) as RegisterResult)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  // The snippet shown verbatim — an agent registering ITSELF, then minting a token. The values
  // (name/org/scopes) track the form so the founder sees their own request.
  const registerLines = [
    '# An agent onboards itself — no human, no browser, no email.',
    'curl -s https://overmind.aiven.io/api/agents/register \\',
    "  -H 'content-type: application/json' \\",
    `  -d '${JSON.stringify({ name, org, scopes })}'`,
    '',
    '# → Overmind mints scoped credentials + a short-lived token, shown once:',
    '#   { "client_id": "...", "access_token": "<1h JWT>", "scopes": [...] }',
  ]

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
          <span>Already in? </span>
          <a href={apiUrl('/api/auth/login')}>Sign in</a>
        </div>
      </header>

      <main className="pp-wrap pp-wrap-narrow">
        <span className="pp-kicker">Start free</span>
        <h1 className="pp-h1">
          Two kinds of users.
          <br />
          One front door — and <span className="pp-grad">agents go through it too.</span>
        </h1>
        <p className="pp-lede">
          Humans sign in with WorkOS AuthKit in 30 seconds. But an agent isn&apos;t an extension of
          a person — it&apos;s a new kind of actor. So agents register themselves, programmatically.
        </p>

        <div className="pp-signup-grid" style={{ marginTop: 40 }}>
          {/* ── HUMANS — deliberately quiet ── */}
          <aside className="pp-human">
            <h2 className="pp-h2">I&apos;m a human</h2>
            <p className="pp-human-sub">
              Hosted login via WorkOS AuthKit. No password to manage, SSO-ready, free.
            </p>
            <a className="pp-btn pp-btn-dark pp-btn-block pp-btn-lg" href={apiUrl('/api/auth/login')}>
              Continue with AuthKit →
            </a>
            <p className="pp-fineprint">
              You&apos;ll land on Connect your app, point Overmind at your Lovable/Supabase project,
              and graduate it to Aiven. After that you talk to your CTO agent — never the dashboard.
            </p>
          </aside>

          {/* ── AGENTS — THE HERO ── */}
          <section className="pp-agent">
            <span className="pp-agent-tag">
              <span className="pp-pulse" />
              Agents welcome · auth.md
            </span>
            <h2>Sign your agent up</h2>
            <p className="pp-agent-sub">
              No signup form, no human in the loop. Your agent POSTs{' '}
              <code>/api/agents/register</code> and walks away with its own revocable credentials
              and a short-lived, scoped JWT it can use immediately.
            </p>

            <div className="pp-agent-fields">
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="pp-field" style={{ flex: 1 }}>
                  <label>Agent name</label>
                  <input
                    className="pp-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="recon-7"
                  />
                </div>
                <div className="pp-field" style={{ flex: 1 }}>
                  <label>Org / tenant</label>
                  <input
                    className="pp-input"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="acme"
                  />
                </div>
              </div>
              <div className="pp-field">
                <label>Scopes — least privilege by default</label>
                <div className="pp-scopes">
                  {SCOPES.map((s) => {
                    const on = scopes.includes(s.id)
                    return (
                      <span
                        key={s.id}
                        className={`pp-scope${on ? ' on' : ''}`}
                        onClick={() => toggleScope(s.id)}
                        role="checkbox"
                        aria-checked={on}
                      >
                        <span className="pp-scope-box">{on ? '✓' : ''}</span>
                        {s.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <button
              className="pp-btn pp-btn-primary pp-btn-lg pp-btn-block"
              onClick={registerAgent}
              disabled={busy || scopes.length === 0}
            >
              {busy ? (
                <span className="pp-deploy-running">
                  <span className="pp-spin" /> Minting credentials…
                </span>
              ) : (
                'Register this agent →'
              )}
            </button>

            {err && <div className="pp-err">{err}</div>}

            {/* the payoff: the token + identity the agent just received */}
            {creds && (
              <div className="pp-creds">
                <div className="pp-creds-head">
                  <span className="pp-ok-tag">
                    <span className="pp-dot-ok" />
                    Registered · mode: {creds.mode}
                  </span>
                  <span style={{ fontSize: 12, color: '#8f8fa0' }}>
                    expires in {Math.round(creds.expires_in / 60)} min
                  </span>
                </div>
                <CredRow k="client_id" v={creds.client_id} />
                <CredRow k="access_token" v={creds.access_token} secret />
                <CredRow k="scopes" v={creds.scopes.join('  ')} />
                <p style={{ fontSize: 12, color: '#8f8fa0', marginTop: 12, lineHeight: 1.5 }}>
                  {creds.note} It can now call protected endpoints —{' '}
                  <code style={{ color: '#ffb4ad' }}>Authorization: Bearer &lt;token&gt;</code> — and
                  Overmind verifies it offline against the WorkOS JWKS. No round-trip.
                </p>
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <CodeBlock
                name="agent self-registration"
                title="agent self-registration"
                lines={registerLines}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

// One credential row with a copy button. Secrets render truncated but copy in full.
function CredRow({ k, v, secret }: { k: string; v: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false)
  const shown = secret && v.length > 42 ? `${v.slice(0, 30)}…${v.slice(-6)}` : v
  const copy = () => {
    navigator.clipboard?.writeText(v).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }
  return (
    <div className="pp-cred-row">
      <span className="pp-cred-k">{k}</span>
      <span className="pp-cred-v" title={v}>
        {shown}
      </span>
      <button className={`pp-copy${copied ? ' done' : ''}`} onClick={copy}>
        {copied ? 'copied ✓' : 'copy'}
      </button>
    </div>
  )
}

// Aiven leaf mark — inline so the surfaces have zero asset dependencies.
function LeafMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4C20 4 8 5 5 13c-2 5 1 8 1 8s3-9 9-12c0 0-6 4-7 11 0 0 9 1 12-8 2-6 0-8 0-8z"
        fill="currentColor"
      />
    </svg>
  )
}
