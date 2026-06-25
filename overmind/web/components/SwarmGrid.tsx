import type { AgentActivity, AgentRole, AgentStatus } from '../../shared/types.ts'

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
        <h3>THE SWARM</h3>
        <span className="meta">
          {live.filter((a) => a.status === 'working').length} working · {live.length} active
        </span>
      </div>
      <div className="swarm-grid">
        {cells.map((c) => {
          const status: AgentStatus = c.act?.status ?? 'idle'
          return (
            <div className="agent" data-status={status} key={c.key}>
              <span className="pill" />
              <div className="role">{c.label}</div>
              <div className="task">{c.act?.task ?? 'standing by'}</div>
              {c.act?.detail && <div className="detail mono">{c.act.detail}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
