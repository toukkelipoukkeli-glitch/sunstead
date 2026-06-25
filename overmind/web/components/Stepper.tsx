// web/components/Stepper.tsx — the one shared rail for the whole funnel.
//
// "1 Connect · 2 Watch · 3 Operate". Shown on Connect (#/deploy), Watch (#/app) and
// Operate (#/cto). The current step is highlighted, completed steps read as done, and
// each step links to its screen so the user can always see where they are in the path.
//
// Pure presentational + reuses the `.pp` design tokens (product.css). No new colors.

import './Stepper.css'

export type StepKey = 'connect' | 'watch' | 'operate'

const STEPS: { key: StepKey; n: number; label: string; href: string }[] = [
  { key: 'connect', n: 1, label: 'Connect', href: '#/deploy' },
  { key: 'watch', n: 2, label: 'Watch', href: '#/app' },
  { key: 'operate', n: 3, label: 'Operate', href: '#/cto' },
]

export function Stepper({ active }: { active: StepKey }) {
  const activeIdx = STEPS.findIndex((s) => s.key === active)
  return (
    <nav className="pp-stepper" aria-label="progress">
      {STEPS.map((s, i) => {
        const state = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'todo'
        return (
          <a key={s.key} href={s.href} className={`pp-step ${state}`}>
            <span className="pp-step-num">{state === 'done' ? '✓' : s.n}</span>
            <span className="pp-step-label">{s.label}</span>
            {i < STEPS.length - 1 && <span className="pp-step-sep" aria-hidden="true" />}
          </a>
        )
      })}
    </nav>
  )
}
