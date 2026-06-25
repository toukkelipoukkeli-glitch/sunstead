import { Coins, ArrowRight, Logo } from '../icons.tsx'

export interface CostState {
  supabaseUsd: number
  aivenUsd: number
  note: string
}

/**
 * Zone 3e — the money shot. Supabase $ vs Aiven $, with the saving called out.
 */
export function CostCard({ cost }: { cost: CostState | null }) {
  const sup = cost?.supabaseUsd ?? 0
  const aiv = cost?.aivenUsd ?? 0
  const save = sup - aiv
  const pct = sup > 0 ? Math.round((save / sup) * 100) : 0

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Coins size={15} />
          </span>
          Cost
        </h3>
        <span className="meta">monthly · estimated</span>
      </div>

      {!cost ? (
        <div className="empty pulse-wait">Architect will price the Aiven stack here…</div>
      ) : (
        <>
          <div className="cost">
            <div className="side sup">
              <div className="lbl">Supabase</div>
              <div className="amt">${sup.toLocaleString()}</div>
            </div>
            <div className="arrow">
              <ArrowRight size={18} />
            </div>
            <div className="side aiv">
              <div className="lbl">
                <Logo size={14} /> Aiven
              </div>
              <div className="amt">${aiv.toLocaleString()}</div>
            </div>
          </div>
          {save > 0 && (
            <div style={{ textAlign: 'center' }}>
              <span className="cost-save">
                ${save.toLocaleString()}/mo saved · {pct}% less
              </span>
            </div>
          )}
          <div className="cost-note">{cost.note}</div>
        </>
      )}
    </div>
  )
}
