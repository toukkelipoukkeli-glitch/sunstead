import { ArrowRight } from "lucide-react"

const proofItems = ["Aiven Postgres", "Kafka migration.events", "MCP receipts", "Scoped rollback"]

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
    title: "MCP receipts",
    copy: "Project, service, database, and topic actions are logged with rollback context."
  }
]

export const SalesHomePage = () => (
  <main className="sales-page">
    <div className="sales-announcement">
      <a href="/control">Aiven hackathon demo: PulseWall migration path ready</a>
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
        <a className="nav-outline" href="/control">Book a demo</a>
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
        <div className="mock-product-bar">
          <span className="service-dot postgres-dot" />
          <strong>Aiven for PostgreSQL</strong>
          <em>running</em>
        </div>
        <div className="mock-command">
          <div>
            <span>PulseWall migration run</span>
            <strong>Scoped demo path running</strong>
          </div>
          <button type="button">Graduate To Aiven</button>
        </div>
        <div className="mock-product-bar kafka-bar">
          <span className="service-dot kafka-dot" />
          <strong>Aiven for Apache Kafka</strong>
          <em>migration.events</em>
        </div>
        <div className="mock-grid">
          <div className="mock-panel">
            <span>Source</span>
            <strong>Lovable / Supabase</strong>
            <p>Original app unchanged</p>
          </div>
          <div className="mock-panel active">
            <span>Execution timeline</span>
            <strong>Behavior mapped</strong>
            <p>Realtime -&gt; app_events</p>
          </div>
          <div className="mock-panel">
            <span>Aiven landing zone</span>
            <strong>Postgres + Kafka ready</strong>
            <p>MCP receipts recording</p>
          </div>
        </div>
        <div className="mock-report">
          <span>Migration readiness memo</span>
          <strong>82/100</strong>
          <p>Rows, app_events polling, and workflow event validated.</p>
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
