import type { CtoRecommendation } from '../../shared/types.ts'
import { Gauge, ArrowRight } from '../icons.tsx'

/**
 * Zone 3f — the persistent CTO operator. It stays on: reads live Aiven
 * metrics and emits scaling / index / cost / carbon moves.
 */
export function CtoPanel({ recs }: { recs: CtoRecommendation[] }) {
  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Gauge size={15} />
          </span>
          CTO operator
        </h3>
        <span className="meta">always-on · {recs.length} moves</span>
      </div>

      {recs.length === 0 ? (
        <div className="empty pulse-wait">
          The CTO agent stays on once your data is live on Aiven, optimizing the running system…
        </div>
      ) : (
        <div className="cto-list">
          {recs.map((r) => (
            <div className={`rec ${r.severity}`} key={r.id}>
              <div className="rec-h">
                <span className="rec-sev">{r.severity}</span>
                <span className="rec-title">{r.title}</span>
                {r.metric && <span className="rec-metric">{r.metric}</span>}
              </div>
              <div className="rec-detail">{r.detail}</div>
              <div className="rec-action">
                <ArrowRight size={14} />
                {r.action}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
