import type { BehaviorGraph, BehaviorNode, Classification } from '../../shared/types.ts'
import { Network } from '../icons.tsx'

const CLASSES: { c: Classification; label: string }[] = [
  { c: 'direct_migrate', label: 'Direct migrate' },
  { c: 'aiven_rewrite', label: 'Aiven rewrite' },
  { c: 'generate_service', label: 'Generate service' },
  { c: 'review', label: 'Review' },
  { c: 'cut', label: 'Cut' },
]

const COLOR: Record<Classification, string> = {
  direct_migrate: 'var(--c-direct)',
  aiven_rewrite: 'var(--c-rewrite)',
  generate_service: 'var(--c-generate)',
  review: 'var(--c-review)',
  cut: 'var(--c-cut)',
}

const TARGET_LABEL: Record<string, string> = {
  aiven_postgres: 'Aiven PG',
  aiven_kafka: 'Aiven Kafka',
  generated_backend: 'gen backend',
  none: '—',
}

/**
 * Zone 2b — the behavior graph. Every discovered behavior becomes a node,
 * colored by how the swarm will handle it, grouped into classification columns
 * so the color organism reads at a glance. The readiness % is the proof number.
 */
export function BehaviorGraphPanel({ graph }: { graph: BehaviorGraph | null }) {
  const nodes = graph?.nodes ?? []
  const grouped = CLASSES.map(({ c, label }) => ({
    c,
    label,
    items: nodes.filter((n) => n.classification === c),
  }))
  const total = nodes.length || 1

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Network size={15} />
          </span>
          Behavior graph
        </h3>
        <span className="meta">{nodes.length} behaviors mapped</span>
      </div>

      <div className="bgraph">
        {/* stacked proportion bar — the whole organism at a glance */}
        {nodes.length > 0 && (
          <div className="bgraph-bar" aria-hidden>
            {grouped.map(
              ({ c, items }) =>
                items.length > 0 && (
                  <span
                    key={c}
                    className={`bbar-seg sw-${c}`}
                    style={{ flexGrow: items.length }}
                    title={`${items.length} · ${c}`}
                  />
                ),
            )}
          </div>
        )}

        <div className="bgraph-legend">
          {grouped.map(({ c, label, items }) => (
            <span key={c} className={`legend-item cls-${c}`}>
              <span className={`sw sw-${c}`} />
              {label} · {items.length}
            </span>
          ))}
        </div>

        {nodes.length === 0 ? (
          <div className="empty pulse-wait">Recon agents are mapping the source behavior graph…</div>
        ) : (
          <div className="bgraph-cols">
            {grouped.map(({ c, label, items }) =>
              items.length === 0 ? null : (
                <div className="bcol" key={c} style={{ ['--c' as string]: COLOR[c] }}>
                  <div className="bcol-h">
                    <span className="bcol-dot" />
                    <span className="bcol-label">{label}</span>
                    <span className="bcol-n">{items.length}</span>
                  </div>
                  <div className="bcol-nodes">
                    {items.map((n) => (
                      <Node key={n.id} n={n} />
                    ))}
                  </div>
                </div>
              ),
            )}
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

function Node({ n }: { n: BehaviorNode }) {
  return (
    <div
      className="bnode"
      style={{ ['--c' as string]: COLOR[n.classification] }}
      title={`${n.name} — ${n.detail}\n→ ${n.classification} (${n.target})${
        n.dependsOn.length ? `\ndepends on: ${n.dependsOn.join(', ')}` : ''
      }`}
    >
      <span className="bn-kind">{n.kind}</span>
      <span className="bn-name">{n.name}</span>
      <span className="bn-detail">{n.detail}</span>
      <span className="bn-target">→ {TARGET_LABEL[n.target] ?? n.target}</span>
    </div>
  )
}
