import type { BehaviorGraph, MigrationRun } from '../../shared/types.ts'

/**
 * Zone 1 — the Lovable/Supabase source app, "still running" untouched.
 * Renders whatever the graph recon discovered; degrades to placeholders pre-scan.
 */
export function SourceCard({
  run,
  graph,
}: {
  run: MigrationRun | null
  graph: BehaviorGraph | null
}) {
  const src = graph?.source
  const tables = src?.tables ?? []
  const rows = src?.rowCounts ?? {}
  const totalRows = Object.values(rows).reduce((a, b) => a + b, 0)
  const name = run?.source || 'live-hype-wall'

  const caps: { label: string; on: boolean }[] = [
    { label: 'Auth', on: !!src?.hasAuth },
    { label: 'Storage', on: !!src?.hasStorage },
    { label: 'Realtime', on: !!src?.hasRealtime },
    { label: 'Edge Fns', on: !!src?.hasEdgeFunctions },
    { label: 'supabase-js', on: !!src?.usesSupabaseJs },
  ]

  return (
    <div className="source-card">
      <div className="glow" />
      <span className="source-badge">● Lovable + Supabase</span>
      <h2>{name}</h2>
      <div className="url mono">{src?.framework ? `${src.framework} app` : 'scanning framework…'}</div>

      <div className="source-stack">
        {caps.map((c) => (
          <span key={c.label} className={`chip ${c.on ? 'on' : ''}`}>
            {c.label}
          </span>
        ))}
        {(src?.extensions ?? []).map((e) => (
          <span key={e} className="chip on">
            {e}
          </span>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="n">{tables.length}</div>
          <div className="l">tables</div>
        </div>
        <div className="stat">
          <div className="n">{totalRows.toLocaleString()}</div>
          <div className="l">rows</div>
        </div>
        <div className="stat">
          <div className="n">{graph?.nodes.length ?? 0}</div>
          <div className="l">behaviors</div>
        </div>
      </div>

      <div className="source-live">
        <span className="dot" />
        Source still serving — zero downtime migration
      </div>
    </div>
  )
}
