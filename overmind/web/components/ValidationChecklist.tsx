import type { ValidationCheck } from '../../shared/types.ts'

/**
 * Zone 3d — the verifier's gate. Row parity, boot, query, kafka roundtrip,
 * auth flow, search — all must go green before cutover is real.
 */
export function ValidationChecklist({ checks }: { checks: Record<string, ValidationCheck> }) {
  const list = Object.values(checks)
  const passed = list.filter((c) => c.status === 'pass').length

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>VALIDATION</h3>
        <span className="meta">
          {passed} / {list.length || '—'} green
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty pulse-wait">Verifier will run parity, boot, auth & search checks…</div>
      ) : (
        <div className="checks">
          {list.map((c) => (
            <div className={`check ${c.status}`} key={c.name}>
              <span className="mark">{c.status === 'pass' ? '✓' : c.status === 'fail' ? '✕' : '·'}</span>
              <span className="cname">{c.name}</span>
              {(c.actual || c.expected) && (
                <span className="cval">{c.actual ?? c.expected}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
