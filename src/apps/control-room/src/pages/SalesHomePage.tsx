import { ArrowRight } from "lucide-react"

const proofItems = ["Aiven Postgres", "Kafka migration.events", "Action receipts", "Scoped rollback"]

const serviceCards = [
  {
    color: "#6f64ff",
    eyebrow: "Effortless database",
    title: "PostgreSQL",
    copy: "Application rows and app_events move into an Aiven-backed data plane."
  },
  {
    color: "#df56f2",
    eyebrow: "Real-time data streams",
    title: "Apache Kafka",
    copy: "migration.events carries workflow evidence and production event-path proof."
  },
  {
    color: "#5ffa74",
    eyebrow: "Control plane",
    title: "Action receipts",
    copy: "Project, service, database, and topic actions are logged with rollback context."
  }
]

export const SalesHomePage = () => (
  <main className="sales-page">
    <div className="sales-announcement">
      <a href="/control">PulseWall migration path ready on Aiven</a>
    </div>
    <header className="sales-nav">
      <a className="sales-brand" href="/" aria-label="Aiden home">
        <strong>Aiden</strong>
        <span>Aiven migration operator</span>
      </a>
      <nav aria-label="Sales navigation">
        <a href="/control">Product</a>
        <a href="/control">Platform</a>
        <a href="/control">Docs</a>
        <a className="nav-outline" href="/control">Open control room</a>
        <a className="nav-solid" href="/control">Get building</a>
      </nav>
    </header>

    <section className="sales-hero">
      <div className="sales-hero-copy">
        <p className="sales-kicker">PulseWall -&gt; Aiven</p>
        <h1>
          Graduate <span>Lovable apps</span> to Aiven, made simple.
        </h1>
        <p>
          Aiden turns a Supabase-backed prototype into an Aiven Postgres and Kafka runtime path,
          with receipts, validation, and rollback before production cutover.
        </p>
        <div className="sales-actions">
          <a className="primary-button" href="/control">
            Graduate To Aiven
            <ArrowRight aria-hidden="true" size={17} />
          </a>
          <a className="sales-secondary" href="/control">
            View migration report
          </a>
        </div>
      </div>

      <div className="sales-product-visual" aria-label="Aiden Migration Control Room preview">
        <div className="migration-preview">
          <div className="preview-topline">
            <span className="service-dot postgres-dot" />
            <div>
              <small>Aiden control room</small>
              <strong>PulseWall migration ready</strong>
            </div>
            <em>82/100</em>
          </div>

          <div className="preview-flow">
            <div className="preview-node">
              <small>Source app</small>
              <strong>Lovable / Supabase</strong>
              <span>runtime unchanged</span>
            </div>
            <div className="preview-arrow" aria-hidden="true">
              <ArrowRight size={18} />
            </div>
            <div className="preview-node target-node">
              <small>Aiven target</small>
              <strong>Postgres + Kafka</strong>
              <span>shadow path validated</span>
            </div>
          </div>

          <div className="preview-services" aria-label="Aiven service readiness">
            <article>
              <span className="service-dot postgres-dot" />
              <div>
                <small>Aiven for PostgreSQL</small>
                <strong>app_events live</strong>
              </div>
            </article>
            <article>
              <span className="service-dot kafka-dot" />
              <div>
                <small>Aiven for Apache Kafka</small>
                <strong>migration.events observed</strong>
              </div>
            </article>
            <article>
              <span className="service-dot" />
              <div>
                <small>Action receipts</small>
                <strong>rollback path recorded</strong>
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
              <strong>Tables + rows</strong>
              <span>Aiven Postgres</span>
              <em>validated</em>
            </div>
            <div>
              <strong>Realtime channel</strong>
              <span>app_events polling</span>
              <em>passed</em>
            </div>
            <div>
              <strong>Auth / Storage</strong>
              <span>production adapter</span>
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
        <p>Lovable UI -&gt; Supabase client -&gt; Supabase Postgres / Realtime.</p>
      </div>
      <ArrowRight aria-hidden="true" size={22} />
      <div>
        <p className="sales-kicker">After</p>
        <h2>Aiven runtime path</h2>
        <p>Lovable UI -&gt; local Aiden adapter -&gt; Aiven Postgres + app_events.</p>
      </div>
      <div className="sales-safe-box">
        <span className="service-dot safety-dot" />
        <strong>Production source unchanged</strong>
        <p>Auth, Storage, and RLS stay explicit blockers before full production cutover.</p>
      </div>
    </section>

    <section className="sales-final-cta">
      <h2>Stop managing migration risk. Start building on Aiven.</h2>
      <a className="primary-button" href="/control">
        Open control room
        <ArrowRight aria-hidden="true" size={17} />
      </a>
    </section>
  </main>
)
