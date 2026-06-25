import { ArrowRight } from './icons.tsx'

const proofItems = ['Aiven Postgres', 'Kafka migration.events', 'Action receipts', 'Scoped rollback']

const serviceCards = [
  {
    color: '#6f64ff',
    eyebrow: 'Effortless database',
    title: 'PostgreSQL',
    copy: 'Application rows, app events and vector search move into an Aiven-backed data plane.',
  },
  {
    color: '#df56f2',
    eyebrow: 'Real-time data streams',
    title: 'Apache Kafka',
    copy: 'migration.events carries workflow evidence and the production event-path proof.',
  },
  {
    color: '#5ffa74',
    eyebrow: 'Agent control plane',
    title: 'Aiven MCP',
    copy: 'Provisioning, validation and receipts run through the Aiven control-plane surface.',
  },
]

export default function Landing() {
  return (
    <main className="lp sales-page">
      <div className="sales-announcement">
        <a href="#/app">Live Overmind mission control is ready on Aiven</a>
      </div>

      <header className="sales-nav">
        <a className="sales-brand" href="#/" aria-label="Aiven Overmind home">
          <strong>Aiven/Overmind</strong>
          <span>autonomous migration operator</span>
        </a>
        <nav aria-label="Sales navigation">
          <a href="#/deploy">Deploy</a>
          <a href="#/app">Mission Control</a>
          <a href="#/cto">CTO Console</a>
          <a className="nav-outline" href="#/signup">
            for agents
          </a>
          <a className="nav-solid" href="#/deploy">
            Graduate your app
          </a>
        </nav>
      </header>

      <section className="sales-hero">
        <div className="sales-hero-copy">
          <p className="sales-kicker">Lovable builds. Aiven runs.</p>
          <h1>
            Graduate <span>Lovable apps</span> to Aiven, by agents.
          </h1>
          <p>
            Overmind moves data, realtime and search from a Supabase-backed prototype onto Aiven,
            proves each step with receipts, then leaves a CTO agent watching the new runtime.
          </p>
          <div className="sales-actions">
            <a className="primary-button" href="#/deploy">
              Graduate your app
              <ArrowRight size={17} />
            </a>
            <a className="sales-secondary" href="#/app">
              Watch Mission Control
            </a>
          </div>
        </div>

        <div className="sales-product-visual" aria-label="Aiven Overmind mission preview">
          <div className="migration-preview">
            <div className="preview-topline">
              <span className="service-dot postgres-dot" />
              <div>
                <small>Aiven Overmind</small>
                <strong>PulseWall graduation ready</strong>
              </div>
              <em>92/100</em>
            </div>

            <div className="preview-flow">
              <div className="preview-node">
                <small>Source app</small>
                <strong>Lovable / Supabase</strong>
                <span>keeps shipping</span>
              </div>
              <div className="preview-arrow" aria-hidden="true">
                <ArrowRight size={18} />
              </div>
              <div className="preview-node target-node">
                <small>Aiven runtime</small>
                <strong>Postgres + Kafka + CTO</strong>
                <span>agents operating</span>
              </div>
            </div>

            <div className="preview-services" aria-label="Aiven service readiness">
              <article>
                <span className="service-dot postgres-dot" />
                <div>
                  <small>Aiven for PostgreSQL</small>
                  <strong>rows and pgvector verified</strong>
                </div>
              </article>
              <article>
                <span className="service-dot kafka-dot" />
                <div>
                  <small>Aiven for Apache Kafka</small>
                  <strong>realtime bridge observed</strong>
                </div>
              </article>
              <article>
                <span className="service-dot" />
                <div>
                  <small>Aiven MCP receipts</small>
                  <strong>risk and rollback recorded</strong>
                </div>
              </article>
            </div>

            <div className="preview-map" aria-label="Behavior migration map">
              <div>
                <span>Behavior</span>
                <span>Treatment</span>
                <span>Status</span>
              </div>
              <div>
                <strong>Tables + vectors</strong>
                <span>Aiven Postgres</span>
                <em>verified</em>
              </div>
              <div>
                <strong>Realtime channel</strong>
                <span>Aiven Kafka</span>
                <em>passed</em>
              </div>
              <div>
                <strong>Generated backend</strong>
                <span>PR + heal loop</span>
                <em className="review">review</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sales-proof-rail" aria-label="Aiven evidence surfaces">
        <div>
          {proofItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="sales-service-strip" aria-label="Aiven service cards">
        {serviceCards.map(({ color, eyebrow, title, copy }) => (
          <article key={title}>
            <span className="service-dot" style={{ backgroundColor: color }} />
            <small>{eyebrow}</small>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="sales-comparison" aria-label="Migration comparison">
        <div>
          <p className="sales-kicker">Before</p>
          <h2>Prototype runtime</h2>
          <p>Lovable UI -&gt; Supabase client -&gt; Supabase Postgres, Realtime, Auth and Storage.</p>
        </div>
        <ArrowRight size={22} />
        <div>
          <p className="sales-kicker">After</p>
          <h2>Aiven operating plane</h2>
          <p>Lovable UI -&gt; generated backend -&gt; Aiven Postgres, Kafka and live CTO recommendations.</p>
        </div>
        <div className="sales-safe-box">
          <span className="service-dot safety-dot" />
          <strong>Real where real. Honest where fallback.</strong>
          <p>MCP is the control plane and proof layer. Bulk migration stays deterministic and receipt-backed.</p>
        </div>
      </section>

      <section className="sales-final-cta">
        <h2>Stop managing migration risk. Start building on Aiven.</h2>
        <a className="primary-button" href="#/deploy">
          Start graduation
          <ArrowRight size={17} />
        </a>
      </section>
    </main>
  )
}
