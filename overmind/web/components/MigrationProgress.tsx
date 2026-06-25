import { Database, Check } from '../icons.tsx'

export interface TableProgress {
  table: string
  copied: number
  total: number
}

/**
 * Zone 3b — per-table data migration. Bars fill as rows land in Aiven PG.
 */
export function MigrationProgress({ tables }: { tables: Record<string, TableProgress> }) {
  const list = Object.values(tables).sort((a, b) => a.table.localeCompare(b.table))
  const copied = list.reduce((s, t) => s + t.copied, 0)
  const total = list.reduce((s, t) => s + t.total, 0)
  const overall = total > 0 ? Math.min(100, (copied / total) * 100) : 0
  const doneCount = list.filter((t) => t.total > 0 && t.copied >= t.total).length

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Database size={15} />
          </span>
          Data migration
        </h3>
        <span className="meta">
          {copied.toLocaleString()} / {total.toLocaleString()} rows
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty pulse-wait">Migrator will stream row-by-row progress per table…</div>
      ) : (
        <>
          <div className="mig-overall">
            <div className="track lg">
              <div className={`fill ${overall >= 100 ? 'complete' : 'busy'}`} style={{ width: `${overall}%` }} />
            </div>
            <span className="mig-overall-meta">
              {Math.round(overall)}% · {doneCount}/{list.length} tables synced
            </span>
          </div>
          <div className="migrate-list">
            {list.map((t) => {
              const pct = t.total > 0 ? Math.min(100, (t.copied / t.total) * 100) : 0
              const done = t.total > 0 && t.copied >= t.total
              const busy = !done && t.copied > 0
              return (
                <div className={`mig ${done ? 'done' : ''}`} key={t.table}>
                  <span className="mname">{t.table}</span>
                  <span className="mcount">
                    {t.copied.toLocaleString()} / {t.total.toLocaleString()}{' '}
                    {done && <Check size={12} style={{ color: 'var(--green)' }} />}
                  </span>
                  <div className="track">
                    <div className={`fill ${busy ? 'busy' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
