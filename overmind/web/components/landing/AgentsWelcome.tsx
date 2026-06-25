// The differentiator. Humans sign up with WorkOS AuthKit (hosted login). AGENTS
// self-register programmatically — no browser, no email round-trip — and get a
// scoped, short-lived token. Grounded in docs/WORKOS_AUTH_RESEARCH.md:
//   • M2M Applications + OAuth2 client-credentials → 1h JWT (the realistic demo path)
//   • the JWT carries sub (agent identity) + org_id (tenant) + scopes
//   • Overmind verifies offline via JWKS (no WorkOS round-trip)
//   • auth.md (May 2026) is the open self-registration protocol we cite as the edge.

// The snippet is shown verbatim — an agent POSTing /api/agents/register and getting a token.
const REGISTER_SNIPPET = `# An agent onboards itself — no human, no browser.
curl -s https://overmind.aiven.io/api/agents/register \\
  -H 'content-type: application/json' \\
  -d '{ "name": "recon-7", "org": "acme", "scopes": ["migrate:read"] }'

# → Overmind mints a WorkOS M2M client for this agent and returns:
{
  "agent_id":      "agt_recon7",
  "client_id":     "client_01J...",
  "client_secret": "sk_m2m_...",      # store it; it's shown once
  "token_url":     "https://overmind.authkit.app/oauth2/token"
}`

const TOKEN_SNIPPET = `// Then the agent mints a short-lived token whenever it calls us:
const { access_token } = await fetch(token_url, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type:    'client_credentials',
    client_id, client_secret,
  }),
}).then(r => r.json())          // → JWT, expires_in: 3600

// Overmind verifies it offline against the WorkOS JWKS — no round-trip.
// Claims: sub = agent identity · org_id = tenant · scopes. Revoke one
// agent's credentials and only that agent is cut off. Users untouched.`

export function AgentsWelcome() {
  return (
    <section className="lp-section lp-agents" id="agents">
      <div className="lp-agents-grid">
        <div className="lp-agents-copy">
          <span className="lp-kicker lp-kicker-hot">Agents welcome</span>
          <h2 className="lp-h2">
            The first Aiven product where <span className="lp-grad">agents are first-class
            users.</span>
          </h2>
          <p className="lp-lede">
            Humans sign in with <strong>WorkOS AuthKit</strong> — hosted, free, 30 seconds. But an
            agent isn&apos;t an extension of a user; it&apos;s a new kind of actor that needs its own
            identity. So agents <strong>self-register programmatically</strong> against{' '}
            <code>/api/agents/register</code>, get their own revocable credentials, and mint
            short-lived scoped tokens — no signup form, no email round-trip, no human in the loop.
          </p>

          <ul className="lp-agents-points">
            <li>
              <span className="lp-tick" />
              <div>
                <strong>Per-agent identity.</strong> Each agent is its own WorkOS{' '}
                <em>M2M Application</em> — compromise one, revoke just that one.
              </div>
            </li>
            <li>
              <span className="lp-tick" />
              <div>
                <strong>Scoped &amp; short-lived.</strong> Client-credentials grant → a 1-hour JWT,
                carrying <code>sub</code>, <code>org_id</code> and scopes narrower than any human.
              </div>
            </li>
            <li>
              <span className="lp-tick" />
              <div>
                <strong>Verified offline.</strong> Overmind checks the signature against the WorkOS
                JWKS — no round-trip on the hot path.
              </div>
            </li>
            <li>
              <span className="lp-tick" />
              <div>
                <strong>Standards, not lock-in.</strong> Built toward WorkOS{' '}
                <a href="https://workos.com/auth-md" target="_blank" rel="noreferrer">
                  auth.md
                </a>
                , the open agent-registration protocol on OAuth 2.0.
              </div>
            </li>
          </ul>

          <div className="lp-hero-cta">
            <a className="lp-btn lp-btn-primary" href="#/app">
              Register an agent
            </a>
            <a
              className="lp-btn lp-btn-ghost"
              href="https://workos.com/auth-md"
              target="_blank"
              rel="noreferrer"
            >
              Read the protocol
            </a>
          </div>
        </div>

        <div className="lp-agents-code">
          <figure className="lp-code">
            <figcaption className="lp-code-head">
              <span className="lp-code-dot" />
              <span className="lp-code-dot" />
              <span className="lp-code-dot" />
              <span className="lp-code-title">agent self-registration</span>
            </figcaption>
            <pre>
              <code>{REGISTER_SNIPPET}</code>
            </pre>
          </figure>

          <figure className="lp-code">
            <figcaption className="lp-code-head">
              <span className="lp-code-dot" />
              <span className="lp-code-dot" />
              <span className="lp-code-dot" />
              <span className="lp-code-title">client-credentials → scoped token</span>
            </figcaption>
            <pre>
              <code>{TOKEN_SNIPPET}</code>
            </pre>
          </figure>
        </div>
      </div>
    </section>
  )
}
