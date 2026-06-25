// The public front door. Styled to feel native to aiven.io (dark theme, Aiven's
// coral accent, clean geometric sans) — but the product is Overmind, and the headline
// fact is: AGENTS can sign up and you can get it on Aiven.
import { Nav } from './components/landing/Nav.tsx'
import { Hero } from './components/landing/Hero.tsx'
import { HowItWorks } from './components/landing/HowItWorks.tsx'
import { AgentsWelcome } from './components/landing/AgentsWelcome.tsx'
import { GetItOnAiven } from './components/landing/GetItOnAiven.tsx'
import { Footer } from './components/landing/Footer.tsx'

export default function Landing() {
  return (
    <div className="lp">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <AgentsWelcome />
        <GetItOnAiven />
      </main>
      <Footer />
    </div>
  )
}
