import type { BehaviorGraph, Classification } from '../../shared/types.ts'

const CLASSES: { c: Classification; label: string }[] = [
  { c: 'direct_migrate', label: 'Direct migrate' },
  { c: 'aiven_rewrite', label: 'Aiven rewrite' },
  { c: 'generate_service', label: 'Generate service' },
  { c: 'review', label: 'Review' },
  { c: 'cut', label: 'Cut' },
]

const COLOR: Record<Classification, string> = {
  direct_migrate: 'var(--green)',
  aiven_rewrite: 'var(--cyan)',
  generate_service: 'var(--violet)',
  review: 'var(--amber)',
  cut: 'var(--grey)',
}

/**
 * Zone 2b — the behavior graph. Every discovered behavior becomes a node,
 * colored by how the swarm will handle it. The readiness % is the proof number.
 */
export function BehaviorGraphPanel({ graph }: { graph: BehaviorGraph | null }) {
  const nodes = graph?.nodes ?? []
  const counts = CLASSES.reduce(
    (acc, { c }) => ({ ...acc, [c]: nodes.filter((n) => n.classification === c).length }),
    {} as Record<Classification, number>,
  )

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>BEHAVIOR GRAPH</h3>
        <span className="meta">{nodes.length} behaviors mapped</span>
      </div>

      <div className="bgraph">
        <div className="bgraph-legend">
          {CLASSES.map(({ c, label }) => (
            <span key={c} className={`legend-item cls-${c}`}>
              <span className={`sw sw-${c}`} />
              {label} · {counts[c] ?? 0}
            </span>
          ))}
        </div>

        {nodes.length === 0 ? (
          <div className="empty pulse-wait">Recon agents are mapping the source behavior graph…</div>
        ) : (
          <div className="bgraph-nodes">
            {nodes.map((n) => (
              <div
                className="bnode"
                key={n.id}
                style={{ ['--c' as string]: COLOR[n.classification] }}
                title={`${n.name} — ${n.detail}\n→ ${n.classification} (${n.target})`}
              >
                <span className="bn-kind">{n.kind}</span>
                <span className="bn-name">{n.name}</span>
                <span className="bn-detail">{n.detail}</span>
              </div>
            ))}
          </div>
        )}

        {graph && (
          <div className="readiness">
            <div>
              <div className="big">{Math.round(graph.readiness)}%</div>
              <div className="lbl">readiness</div>
            </div>
            <div className="summary">{graph.summary}</div>
          </div>
        )}
      </div>
    </div>
  )
}
