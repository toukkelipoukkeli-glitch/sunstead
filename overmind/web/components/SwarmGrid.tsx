import type { AgentActivity, AgentRole, AgentStatus } from '../../shared/types.ts'
import {
  Network,
  Sparkle,
  Search,
  Layers,
  Server,
  Shield,
  Database,
  Activity,
  Check,
  Gauge,
} from '../icons.tsx'

const ROLE_ICON: Record<AgentRole, React.ReactNode> = {
  orchestrator: <Sparkle size={13} />,
  recon: <Search size={13} />,
  architect: <Layers size={13} />,
  operator: <Server size={13} />,
  surgeon: <Shield size={13} />,
  migrator: <Database size={13} />,
  healer: <Activity size={13} />,
  verifier: <Check size={13} />,
  cto: <Gauge size={13} />,
}

// relative "Ns ago" for the last activity ping — keeps the swarm feeling live
function rel(ts: string): string {
  const d = new Date(ts).getTime()
  if (isNaN(d)) return ''
  const s = Math.max(0, Math.round((Date.now() - d) / 1000))
  if (s < 1) return 'now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  return `${m}m ago`
}

// Canonical swarm roster — agents light up as activity events arrive, but the
// full mesh is always visible so judges see the whole organism.
const ROSTER: { role: AgentRole; label: string }[] = [
  { role: 'orchestrator', label: 'Overmind' },
  { role: 'recon', label: 'Recon' },
  { role: 'architect', label: 'Architect' },
  { role: 'operator', label: 'Operator' },
  { role: 'surgeon', label: 'Surgeon' },
  { role: 'migrator', label: 'Migrator' },
  { role: 'healer', label: 'Healer' },
  { role: 'verifier', label: 'Verifier' },
  { role: 'cto', label: 'CTO' },
]

/**
 * Zone 2a — THE SWARM. One node per live agentId; if a role has no live agent
 * yet we still show its slot idle. Status drives the glow.
 */
export function SwarmGrid({ agents }: { agents: Record<string, AgentActivity> }) {
  const live = Object.values(agents)
  const byRole = new Map<AgentRole, AgentActivity[]>()
  for (const a of live) {
    const arr = byRole.get(a.role) ?? []
    arr.push(a)
    byRole.set(a.role, arr)
  }

  const cells: { key: string; role: AgentRole; label: string; act?: AgentActivity }[] = []
  for (const slot of ROSTER) {
    const liveOnes = byRole.get(slot.role)
    if (liveOnes && liveOnes.length) {
      liveOnes
        .sort((a, b) => a.agentId.localeCompare(b.agentId))
        .forEach((act, i) =>
          cells.push({
            key: act.agentId,
            role: slot.role,
            label: liveOnes.length > 1 ? `${slot.label} ${i + 1}` : slot.label,
            act,
          }),
        )
    } else {
      cells.push({ key: slot.role, role: slot.role, label: slot.label })
    }
  }

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Network size={15} />
          </span>
          The Swarm
        </h3>
        <span className="meta">
          {live.filter((a) => a.status === 'working').length} working · {live.length} active
        </span>
      </div>
      {(() => {
        const err = live.filter((a) => a.status === 'error').length
        const done = live.filter((a) => a.status === 'done').length
        const work = live.filter((a) => a.status === 'working').length
        if (!live.length) return null
        return (
          <div className="swarm-stat">
            <span className="ss work">{work} working</span>
            <span className="ss done">{done} done</span>
            {err > 0 && <span className="ss err">{err} error</span>}
          </div>
        )
      })()}
      <div className="swarm-grid">
        {cells.map((c) => {
          const status: AgentStatus = c.act?.status ?? 'idle'
          return (
            <div className="agent" data-status={status} data-role={c.role} key={c.key}>
              <span className="pill" />
              <div className="agent-head">
                <span className="agent-ico">{ROLE_ICON[c.role]}</span>
                <div className="role">{c.label}</div>
              </div>
              <div className="task">{c.act?.task ?? 'standing by'}</div>
              {c.act?.detail && <div className="detail mono">{c.act.detail}</div>}
              {c.act?.ts && <div className="agent-ts mono">{rel(c.act.ts)}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
