import type { ValidationCheck } from '../../shared/types.ts'
import { Check, Shield } from '../icons.tsx'

/**
 * Zone 3d — the verifier's gate. Row parity, query, kafka roundtrip, search —
 * the checks that confirm your data + realtime really landed on Aiven.
 */
export function ValidationChecklist({ checks }: { checks: Record<string, ValidationCheck> }) {
  const list = Object.values(checks)
  const passed = list.filter((c) => c.status === 'pass').length
  const failed = list.filter((c) => c.status === 'fail').length
  const allGreen = list.length > 0 && passed === list.length

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Shield size={15} />
          </span>
          Validation
        </h3>
        <span className={`meta ${allGreen ? 'all-green' : ''}`}>
          {passed} / {list.length || '—'} green {allGreen ? '· parity confirmed' : ''}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty pulse-wait">Verifier will run parity, boot, auth & search checks…</div>
      ) : (
        <>
          {list.length > 0 && (
            <div className="vbar">
              <div className="vbar-fill pass" style={{ flexGrow: passed || 0.0001 }} />
              {failed > 0 && <div className="vbar-fill fail" style={{ flexGrow: failed }} />}
              {list.length - passed - failed > 0 && (
                <div className="vbar-fill pend" style={{ flexGrow: list.length - passed - failed }} />
              )}
            </div>
          )}
          <div className="checks">
            {list.map((c) => (
              <div className={`check ${c.status}`} key={c.name}>
                <span className="mark">
                  {c.status === 'pass' ? <Check size={12} /> : c.status === 'fail' ? '✕' : '·'}
                </span>
                <span className="cname">{c.name}</span>
                {c.status === 'fail' && c.expected && c.actual ? (
                  <span className="cval fail mono">
                    {c.actual} ≠ {c.expected}
                  </span>
                ) : (
                  (c.actual || c.expected) && <span className="cval mono">{c.actual ?? c.expected}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
