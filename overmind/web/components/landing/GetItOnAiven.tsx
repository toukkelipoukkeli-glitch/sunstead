// "Get it on Aiven" — implies one-click availability on Aiven Apps, reusing the deploy
// story (MOONSHOT stretch: deploy the rebuilt backend via aiven_application_deploy).

export function GetItOnAiven() {
  return (
    <section className="lp-section lp-deploy" id="deploy">
      <div className="lp-deploy-card">
        <div className="lp-deploy-glow" aria-hidden="true" />
        <div className="lp-deploy-left">
          <span className="lp-kicker">Get it on Aiven</span>
          <h2 className="lp-h2">One click. The whole backend, running on Aiven.</h2>
          <p className="lp-lede">
            Overmind ships as an Aiven App. The swarm provisions Postgres and Kafka in your own
            Aiven project, deploys the rebuilt backend with <code>aiven_application_deploy</code>,
            and hands you a live service — on any cloud, in minutes, with no infra ops.
          </p>

          <div className="lp-deploy-steps">
            <span className="lp-deploy-step">
              <span className="lp-deploy-n">1</span> Connect your Aiven project
            </span>
            <span className="lp-deploy-arrow">→</span>
            <span className="lp-deploy-step">
              <span className="lp-deploy-n">2</span> Point at your Lovable app
            </span>
            <span className="lp-deploy-arrow">→</span>
            <span className="lp-deploy-step">
              <span className="lp-deploy-n">3</span> Watch the swarm ship it
            </span>
          </div>

          <div className="lp-hero-cta">
            <a className="lp-btn lp-btn-primary lp-btn-lg" href="#/app">
              Deploy on Aiven
            </a>
            <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#how">
              See the pipeline
            </a>
          </div>
        </div>

        <aside className="lp-deploy-right">
          <div className="lp-deploy-tile">
            <div className="lp-deploy-tile-head">
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
              <div>
                <div className="lp-deploy-tile-name">Overmind</div>
                <div className="lp-deploy-tile-cat">Aiven Apps · Migration &amp; Ops</div>
              </div>
            </div>
            <div className="lp-deploy-tile-rows">
              <span>
                <span className="lp-mini-dot lp-ok" /> Aiven for PostgreSQL® · RUNNING
              </span>
              <span>
                <span className="lp-mini-dot lp-ok" /> Apache Kafka® · RUNNING
              </span>
              <span>
                <span className="lp-mini-dot lp-ok" /> Backend service · deployed
              </span>
              <span>
                <span className="lp-mini-dot lp-ok" /> CTO agent · on watch
              </span>
            </div>
            <a className="lp-btn lp-btn-primary lp-deploy-tile-cta" href="#/app">
              Get it on Aiven
            </a>
          </div>
        </aside>
      </div>
    </section>
  )
}
