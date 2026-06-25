import type { RunSnapshot } from "@aiden/contracts"
import { ArrowRight, Database, Play, RadioTower, ShieldCheck } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

type CommandStripProps = {
  snapshot: RunSnapshot
  onGraduate: () => void
}

const labelState = (state: string) => state.replaceAll("_", " ")

export const CommandStrip = ({ snapshot, onGraduate }: CommandStripProps) => (
  <header className="command-strip">
    <div className="command-main">
      <p className="eyebrow">Aiden Migration Control Room</p>
      <h1>PulseWall migration run</h1>
      <div className="command-status">
        <span className="status-pill">
          <ShieldCheck aria-hidden="true" size={15} />
          {labelState(snapshot.state)}
        </span>
        <ProofSourceBadge source={snapshot.mode} />
      </div>
    </div>

    <div className="command-meta" aria-label="Migration path">
      <span>PulseWall / Lovable-Supabase</span>
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
      <button className="primary-button" type="button" onClick={onGraduate}>
        <Play aria-hidden="true" size={17} />
        Graduate To Aiven
      </button>
    </div>
  </header>
)
