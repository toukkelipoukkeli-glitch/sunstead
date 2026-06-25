// The public front door — RUTHLESS strip for non-technical "Lovable vibe coders".
//
// Nav = wordmark + ONE primary button + a tiny muted "for agents" link.
// Hero = one headline, one subline, ONE big CTA → #/deploy.
// Below: a single compact 3-step strip (Connect → Watch → Operate), then the footer.
//
// The heavy marketing sections (HowItWorks / AgentsWelcome / GetItOnAiven) are kept on disk
// but intentionally NOT rendered here — the whole product is now the ONE path.

import { Logo, ArrowRight } from './icons.tsx'
import { Footer } from './components/landing/Footer.tsx'
// import { HowItWorks } from './components/landing/HowItWorks.tsx'   // parked — not part of the one path
// import { AgentsWelcome } from './components/landing/AgentsWelcome.tsx'
// import { GetItOnAiven } from './components/landing/GetItOnAiven.tsx'

const STEPS: { n: number; title: string; body: string }[] = [
  {
    n: 1,
    title: 'Connect',
    body: 'Point us at the bundled demo app or paste your own public repo. One click.',
  },
  {
    n: 2,
    title: 'Watch',
    body: 'A swarm of agents graduates your data, realtime and search onto Aiven — live.',
  },
  {
    n: 3,
    title: 'Operate',
    body: 'An always-on Aiven CTO runs your infra. You never open a dashboard again.',
  },
]

export default function Landing() {
  return (
    <div className="lp">
      {/* ── ruthless nav: wordmark + ONE button + tiny "for agents" ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a className="lp-wordmark" href="#/">
            <span className="lp-logo-mark" aria-hidden="true">
              <Logo size={24} />
            </span>
            <span className="lp-logo-text">
              Aiven<span className="lp-logo-divider">/</span>
              <span className="lp-logo-product">Overmind</span>
            </span>
          </a>
          <div className="lp-nav-cta" style={{ marginLeft: 'auto', alignItems: 'center', gap: 18 }}>
            <a className="lp-nav-foragents" href="#/signup">
              for agents ↗
            </a>
            <a className="lp-btn lp-btn-primary" href="#/deploy">
              Graduate your app <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── hero: one headline, one subline, ONE big CTA ── */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <h1 className="lp-hero-title">
              Your Lovable app,
              <br />
              graduated to Aiven — <span className="lp-grad">by agents.</span>
            </h1>

            <p className="lp-hero-sub">
              Your data, realtime and search move to Aiven. The rest of your app keeps shipping on
              Lovable. Then an always-on CTO agent runs it all — so you never touch infrastructure.
            </p>

            <div className="lp-hero-cta">
              <a className="lp-btn lp-btn-primary lp-btn-lg" href="#/deploy">
                Graduate your app <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </section>

        {/* ── one compact 3-step strip ── */}
        <section className="lp-strip">
          <div className="lp-strip-inner">
            {STEPS.map((s, i) => (
              <div className="lp-strip-step" key={s.n}>
                <span className="lp-strip-num">{s.n}</span>
                <div className="lp-strip-body">
                  <div className="lp-strip-title">{s.title}</div>
                  <div className="lp-strip-text">{s.body}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="lp-strip-arrow" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
