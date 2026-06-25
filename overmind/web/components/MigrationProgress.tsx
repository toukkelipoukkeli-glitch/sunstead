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

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>DATA MIGRATION</h3>
        <span className="meta">
          {copied.toLocaleString()} / {total.toLocaleString()} rows
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty pulse-wait">Migrator will stream row-by-row progress per table…</div>
      ) : (
        <div className="migrate-list">
          {list.map((t) => {
            const pct = t.total > 0 ? Math.min(100, (t.copied / t.total) * 100) : 0
            const done = t.total > 0 && t.copied >= t.total
            return (
              <div className={`mig ${done ? 'done' : ''}`} key={t.table}>
                <span className="mname">{t.table}</span>
                <span className="mcount">
                  {t.copied.toLocaleString()} / {t.total.toLocaleString()} {done ? '✓' : ''}
                </span>
                <div className="track">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
