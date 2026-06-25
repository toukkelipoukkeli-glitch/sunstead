// "Get it on Aiven" — implies one-click availability on Aiven Apps, reusing the deploy
// story (MOONSHOT stretch: deploy the rebuilt backend via aiven_application_deploy).

import { Logo, Rocket, ArrowRight, Check, Cloud } from '../../icons.tsx'

export function GetItOnAiven() {
  return (
    <section className="lp-section lp-deploy" id="deploy">
      <div className="lp-deploy-card">
        <div className="lp-deploy-glow" aria-hidden="true" />
        <div className="lp-deploy-left">
          <span className="lp-kicker">
            <Cloud size={14} /> Get it on Aiven
          </span>
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
            <span className="lp-deploy-arrow">
              <ArrowRight size={16} />
            </span>
            <span className="lp-deploy-step">
              <span className="lp-deploy-n">2</span> Point at your Lovable app
            </span>
            <span className="lp-deploy-arrow">
              <ArrowRight size={16} />
            </span>
            <span className="lp-deploy-step">
              <span className="lp-deploy-n">3</span> Watch the swarm ship it
            </span>
          </div>

          <div className="lp-hero-cta">
            <a className="lp-btn lp-btn-primary lp-btn-lg" href="#/app">
              <Rocket size={17} /> Deploy on Aiven
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
                <Logo size={28} />
              </span>
              <div>
                <div className="lp-deploy-tile-name">Overmind</div>
                <div className="lp-deploy-tile-cat">Aiven Apps · Migration &amp; Ops</div>
              </div>
            </div>
            <div className="lp-deploy-tile-rows">
              <span>
                <span className="lp-row-ico">
                  <Check size={15} />
                </span>{' '}
                Aiven for PostgreSQL® · RUNNING
              </span>
              <span>
                <span className="lp-row-ico">
                  <Check size={15} />
                </span>{' '}
                Apache Kafka® · RUNNING
              </span>
              <span>
                <span className="lp-row-ico">
                  <Check size={15} />
                </span>{' '}
                Backend service · deployed
              </span>
              <span>
                <span className="lp-row-ico">
                  <Check size={15} />
                </span>{' '}
                CTO agent · on watch
              </span>
            </div>
            <a className="lp-btn lp-btn-primary lp-deploy-tile-cta" href="#/app">
              <Rocket size={16} /> Get it on Aiven
            </a>
          </div>
        </aside>
      </div>
    </section>
  )
}
