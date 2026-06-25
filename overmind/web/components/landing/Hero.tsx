// Hero — Aiven's voice ("Stop Managing. Start Building."), our product.
// Primary CTA "Deploy on Aiven" → console. Secondary "Watch the swarm" → console too,
// landing the judge straight in Mission Control.

import { ServiceIcon, Rocket, Activity, ArrowRight } from '../../icons.tsx'

export function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-glow" aria-hidden="true" />
      <div className="lp-hero-inner">
        <a className="lp-eyebrow" href="#agents">
          <span className="lp-eyebrow-dot" />
          New · Agents can sign up too <ArrowRight size={15} />
        </a>

        <h1 className="lp-hero-title">
          Your Lovable app,
          <br />
          rebuilt on Aiven — <span className="lp-grad">by agents.</span>
        </h1>

        <p className="lp-hero-sub">
          Stop managing migrations. Point Overmind at any Lovable or Supabase app and a swarm of
          autonomous agents rebuilds the whole backend on Aiven — auth, data, realtime, vector —
          provisions it via MCP, self-heals until every test is green, then operates it for you.
          Zero Supabase. Zero flags. Backed by Aiven&apos;s 99.99% SLA.
        </p>

        <div className="lp-hero-cta">
          <a className="lp-btn lp-btn-primary lp-btn-lg" href="#/app">
            <Rocket size={17} /> Deploy on Aiven
          </a>
          <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#/app">
            <Activity size={17} /> Watch the swarm
          </a>
        </div>

        <div className="lp-hero-meta">
          <span>
            <strong>11</strong> agent phases
          </span>
          <span className="lp-dot-sep" />
          <span>
            <strong>100%</strong> on Aiven
          </span>
          <span className="lp-dot-sep" />
          <span>
            <strong>0</strong> Supabase left running
          </span>
        </div>

        <div className="lp-logos">
          <span className="lp-logos-label">Rebuilds onto</span>
          <span className="lp-logo-pill">
            <ServiceIcon kind="postgres" size={22} /> Aiven for PostgreSQL®
          </span>
          <span className="lp-logo-pill">
            <ServiceIcon kind="kafka" size={22} /> Apache Kafka®
          </span>
          <span className="lp-logo-pill">
            <ServiceIcon kind="pgvector" size={22} /> pgvector
          </span>
          <span className="lp-logo-pill">
            <ServiceIcon kind="app" size={22} /> Aiven Apps
          </span>
        </div>
      </div>
    </section>
  )
}
