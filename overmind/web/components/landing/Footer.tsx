// Minimal footer for the ruthless one-path landing. Wordmark + one line + the single CTA,
// plus the platform credit. No dead marketing anchors.
import { Logo } from '../../icons.tsx'

export function Footer() {
  return (
    <footer className="lp-footer lp-footer-min">
      <div className="lp-footer-min-inner">
        <a className="lp-wordmark" href="#/">
          <span className="lp-logo-mark" aria-hidden="true">
            <Logo size={22} />
          </span>
          <span className="lp-logo-text">
            Aiven<span className="lp-logo-divider">/</span>
            <span className="lp-logo-product">Overmind</span>
          </span>
        </a>
        <p className="lp-footer-tag">
          Graduate your Lovable app to Aiven — by a swarm of agents that builds, heals and operates
          for you.
        </p>
        <a className="lp-btn lp-btn-primary" href="#/deploy">
          Graduate your app →
        </a>
      </div>

      <div className="lp-footer-bar">
        <span>© {new Date().getFullYear()} Overmind — built on the Aiven Platform.</span>
        <span className="lp-footer-legal">
          <a href="https://aiven.io" target="_blank" rel="noreferrer">
            aiven.io ↗
          </a>
          <a href="#/signup">for agents</a>
        </span>
      </div>
    </footer>
  )
}
