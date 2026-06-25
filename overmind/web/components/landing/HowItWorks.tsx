import type { RunPhase } from '../../../shared/types.ts'
import type { ReactNode } from 'react'
import {
  Search,
  Network,
  Layers,
  Server,
  Database,
  Sparkle,
  Shield,
  Check,
  ArrowRight,
  Activity,
} from '../../icons.tsx'

const STEP_ICON: Record<Exclude<RunPhase, 'done' | 'error'>, ReactNode> = {
  recon: <Search size={15} />,
  graph: <Network size={15} />,
  plan: <Layers size={15} />,
  provision: <Server size={15} />,
  migrate: <Database size={15} />,
  generate: <Sparkle size={15} />,
  heal: <Shield size={15} />,
  verify: <Check size={15} />,
  cutover: <ArrowRight size={15} />,
  operate: <Activity size={15} />,
}

// The swarm pipeline. Keys are the REAL RunPhase values from shared/types.ts — the
// same phases Mission Control streams over SSE — so the marketing page and the live
// console can never drift. We render every operational phase (terminal 'done'/'error'
// are not steps).
const PIPELINE: { phase: Exclude<RunPhase, 'done' | 'error'>; title: string; body: string }[] = [
  {
    phase: 'recon',
    title: 'Recon',
    body: 'Parallel agents scan the repo and introspect the source database into evidence.',
  },
  {
    phase: 'graph',
    title: 'Behavior graph',
    body: 'Every table, policy, auth flow and realtime path becomes a typed node — classified migrate / rewrite / generate.',
  },
  {
    phase: 'plan',
    title: 'Plan',
    body: 'The Architect turns the graph into a target Aiven stack, with cost and a build order.',
  },
  {
    phase: 'provision',
    title: 'Provision via MCP',
    body: 'The Operator drives the Aiven MCP — Postgres, Kafka, topics — every action a signed receipt.',
  },
  {
    phase: 'migrate',
    title: 'Migrate',
    body: 'Schema, rows and pgvector embeddings move across, with live row-count parity.',
  },
  {
    phase: 'generate',
    title: 'Generate',
    body: 'Surgeon agents write a real Aiven-native backend — auth, data API, realtime bridge, storage.',
  },
  {
    phase: 'heal',
    title: 'Self-heal',
    body: 'Deploy → smoke-test → read the error → patch the generated code → repeat until green.',
  },
  {
    phase: 'verify',
    title: 'Verify',
    body: 'Row counts, boot, queries, a realtime hop, the auth flow and search all must pass.',
  },
  {
    phase: 'cutover',
    title: 'Cutover',
    body: 'Traffic moves to Aiven. Supabase is switched off — nothing left running behind it.',
  },
  {
    phase: 'operate',
    title: 'Operate',
    body: 'A persistent CTO agent reads live Aiven metrics forever — scaling, indexes, cost, carbon.',
  },
]

export function HowItWorks() {
  return (
    <section className="lp-section" id="how">
      <div className="lp-section-head">
        <span className="lp-kicker">
          <Network size={14} /> How it works
        </span>
        <h2 className="lp-h2">One swarm. Ten phases. Fully autonomous.</h2>
        <p className="lp-lede">
          Overmind isn&apos;t a wizard you babysit. It&apos;s a bounded agent swarm — typed tools, a
          receipt ledger — that runs the whole migration end to end while you watch it in Mission
          Control.
        </p>
      </div>

      <ol className="lp-pipeline">
        {PIPELINE.map((step, i) => (
          <li className="lp-step" key={step.phase}>
            <div className="lp-step-rail">
              <span className="lp-step-num">{String(i + 1).padStart(2, '0')}</span>
              {i < PIPELINE.length - 1 && <span className="lp-step-line" />}
            </div>
            <div className="lp-step-body">
              <h3 className="lp-step-title">
                <span className="lp-step-ico">{STEP_ICON[step.phase]}</span>
                {step.title}
                <span className="lp-step-phase">{step.phase}</span>
              </h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
