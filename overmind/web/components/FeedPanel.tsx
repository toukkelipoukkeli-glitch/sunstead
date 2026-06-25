import { useState } from 'react'
import type { Receipt, GeneratedArtifact } from '../../shared/types.ts'

export interface LogEntry {
  id: number
  level: 'info' | 'warn' | 'error'
  msg: string
}

/**
 * Zone 2c — the streaming evidence feed. Receipts are the auditable Aiven MCP
 * trail judges trust; the log is the swarm's running narration; artifacts are
 * the real generated backend files.
 */
export function FeedPanel({
  receipts,
  logs,
  artifacts,
}: {
  receipts: Receipt[]
  logs: LogEntry[]
  artifacts: GeneratedArtifact[]
}) {
  const [tab, setTab] = useState<'receipts' | 'log' | 'artifacts'>('receipts')

  return (
    <div className="panel feed-panel">
      <div className="panel-h">
        <h3>EVIDENCE FEED</h3>
        <span className="meta">{receipts.filter((r) => r.ok).length} receipts ok</span>
      </div>

      <div className="feed-tabs">
        <button className={`feed-tab ${tab === 'receipts' ? 'on' : ''}`} onClick={() => setTab('receipts')}>
          Receipts<span className="badge">{receipts.length}</span>
        </button>
        <button className={`feed-tab ${tab === 'log' ? 'on' : ''}`} onClick={() => setTab('log')}>
          Log<span className="badge">{logs.length}</span>
        </button>
        <button className={`feed-tab ${tab === 'artifacts' ? 'on' : ''}`} onClick={() => setTab('artifacts')}>
          Artifacts<span className="badge">{artifacts.length}</span>
        </button>
      </div>

      {tab === 'receipts' && (
        <div className="feed">
          {receipts.length === 0 && <div className="empty pulse-wait">Every Aiven MCP action lands here…</div>}
          {receipts.map((r) => (
            <div className="receipt" key={r.id}>
              <span className={`ok-dot ${r.ok ? 'ok' : 'bad'}`} />
              <span className="action">{r.action}</span>
              <span className="rs">{r.summary}</span>
              <span className="rt mono">{fmt(r.ts)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'log' && (
        <div className="feed">
          {logs.length === 0 && <div className="empty">Swarm narration will stream here…</div>}
          {logs.map((l) => (
            <div className={`logline ${l.level}`} key={l.id}>
              <span className="lvl">{l.level}</span>
              <span className="lmsg">{l.msg}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'artifacts' && (
        <div className="feed">
          {artifacts.length === 0 && (
            <div className="empty">The Surgeon will generate real backend files here…</div>
          )}
          <div className="artifacts">
            {artifacts.map((a) => (
              <div className="artifact" key={a.path}>
                <span className="akind">{a.kind}</span>
                <span className="apath">{a.path}</span>
                {a.healAttempts > 0 && <span className="heals">⟲{a.healAttempts}</span>}
                <span className={`astatus ${a.status}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function fmt(ts: string): string {
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })
}
