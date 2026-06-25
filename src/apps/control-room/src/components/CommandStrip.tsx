import type { RunSnapshot } from "@aiden/contracts"
import { ArrowRight, Database, Play, RadioTower, ShieldCheck } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

type CommandStripProps = {
  canGraduate: boolean
  graduateBlockers: string[]
  isRunning: boolean
  snapshot: RunSnapshot
  onGraduate: () => void
}

const labelState = (state: string) => state.replaceAll("_", " ")

export const CommandStrip = ({ canGraduate, graduateBlockers, isRunning, snapshot, onGraduate }: CommandStripProps) => (
  <header className="command-strip">
    <div className="command-main">
      <p className="eyebrow">Aiden Migration Control Room</p>
      <h1>{snapshot.setupProfile.sourceLabel} migration run</h1>
      <div className="command-status">
        <span className="status-pill">
          <ShieldCheck aria-hidden="true" size={15} />
          {labelState(snapshot.state)}
        </span>
        <ProofSourceBadge source={snapshot.mode} />
      </div>
    </div>

    <div className="command-meta" aria-label="Migration path">
      <span>{snapshot.setupProfile.sourceLabel} / Lovable-Supabase</span>
      <ArrowRight aria-hidden="true" size={16} className="path-arrow" />
      <span>
        <ShieldCheck aria-hidden="true" size={15} />
        {snapshot.setupProfile.workspaceLabel}
      </span>
      <ArrowRight aria-hidden="true" size={16} className="path-arrow" />
      <span>
        <Database aria-hidden="true" size={15} />
        Aiven Postgres
      </span>
      <span>
        <RadioTower aria-hidden="true" size={15} />
        Kafka migration.events
      </span>
    </div>

    <div className="command-actions">
      <button className="primary-button" type="button" onClick={onGraduate} disabled={isRunning || !canGraduate}>
        <Play aria-hidden="true" size={17} />
        {isRunning ? "Graduating" : "Graduate To Aiven"}
      </button>
      {!canGraduate ? <span className="command-blocker">Blocked: {graduateBlockers.join(", ")}</span> : null}
    </div>
  </header>
)
