import type { Report } from "@aiden/contracts"
import { CheckCircle2, Database, RadioTower, RotateCcw, ShieldAlert } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

export const ColdOpenOutcome = ({
  report,
  onRewind
}: {
  report: Report
  onRewind: () => void
}) => (
  <section className="cold-open">
    <div className="cold-copy">
      <div className="cold-kicker">
        <p className="eyebrow">Aiden Migration Control Room</p>
        <ProofSourceBadge source={report.source} />
      </div>
      <h2>{report.headline}</h2>
      <p>
        The scoped demo runtime is on Aiven. The original PulseWall app remains untouched,
        blockers are explicit, and every migration step has a receipt path.
      </p>
      <div className="outcome-path">
        <span>Lovable UI</span>
        <strong>local Aiden adapter</strong>
        <span>Aiven Postgres app_events</span>
      </div>
      <div className="cold-actions">
        <button className="primary-button" type="button" onClick={onRewind}>
          <RotateCcw aria-hidden="true" size={16} />
          Rewind to one click
        </button>
      </div>
    </div>
    <div className="outcome-grid">
      <div className="outcome-grid-header">
        <div>
          <p className="eyebrow">Completed outcome</p>
          <strong>Migration complete for the scoped demo path</strong>
        </div>
        <span>{report.readinessScore}/100</span>
      </div>
      <div className="outcome-tile">
        <Database aria-hidden="true" />
        <span>Data plane</span>
        <strong>Aiven Postgres</strong>
      </div>
      <div className="outcome-tile">
        <CheckCircle2 aria-hidden="true" />
        <span>Realtime</span>
        <strong>app_events -&gt; /api/events/recent -&gt; browser</strong>
      </div>
      <div className="outcome-tile">
        <RadioTower aria-hidden="true" />
        <span>Workflow events</span>
        <strong>Aiven Kafka migration.events</strong>
      </div>
      <div className="outcome-tile warning">
        <ShieldAlert aria-hidden="true" />
        <span>Production source</span>
        <strong>unchanged; Auth / Storage / RLS blocked</strong>
      </div>
    </div>
  </section>
)
