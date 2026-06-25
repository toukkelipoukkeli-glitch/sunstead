// Aiven-style multi-column footer.

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <div className="lp-footer-brand">
          <a className="lp-wordmark" href="#/">
            <span className="lp-logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M12 2 L21 7 V17 L12 22 L3 17 V7 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M12 7 L17 9.5 V14.5 L12 17 L7 14.5 V9.5 Z" fill="currentColor" />
              </svg>
            </span>
            <span className="lp-logo-text">
              Aiven<span className="lp-logo-divider">/</span>
              <span className="lp-logo-product">Overmind</span>
            </span>
          </a>
          <p className="lp-footer-tag">
            Stop managing migrations. Start shipping on Aiven — with a swarm of agents that builds,
            heals and operates for you.
          </p>
        </div>

        <div className="lp-footer-cols">
          <div className="lp-footer-col">
            <h4>Product</h4>
            <a href="#how">How it works</a>
            <a href="#agents">Agents welcome</a>
            <a href="#deploy">Get it on Aiven</a>
            <a href="#/app">Console</a>
          </div>
          <div className="lp-footer-col">
            <h4>Platform</h4>
            <a href="https://aiven.io/postgresql" target="_blank" rel="noreferrer">
              Aiven for PostgreSQL®
            </a>
            <a href="https://aiven.io/kafka" target="_blank" rel="noreferrer">
              Apache Kafka®
            </a>
            <a href="https://aiven.io" target="_blank" rel="noreferrer">
              Aiven Platform
            </a>
          </div>
          <div className="lp-footer-col">
            <h4>Developers</h4>
            <a href="#agents">Agent auth</a>
            <a href="https://workos.com/auth-md" target="_blank" rel="noreferrer">
              auth.md protocol
            </a>
            <a href="/api/agents/register">/api/agents/register</a>
          </div>
        </div>
      </div>

      <div className="lp-footer-bar">
        <span>© {new Date().getFullYear()} Overmind — built on the Aiven Platform.</span>
        <span className="lp-footer-legal">
          <a href="#/">Privacy</a>
          <a href="#/">Terms</a>
          <a href="#/app">Status</a>
        </span>
      </div>
    </footer>
  )
}
