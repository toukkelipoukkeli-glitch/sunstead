import { DatabaseZap, Pause, PlugZap, RadioTower, RotateCcw, ScanSearch, StepForward, Undo2 } from "lucide-react"

type PresenterControlsProps = {
  cutoverRunning: boolean
  eventCount: number
  kafkaRunning: boolean
  migrationRunning: boolean
  onColdOpen: () => void
  onRunKafka: () => void
  onRunCutover: () => void
  onRunMigration: () => void
  onPause: () => void
  onRunProof: () => void
  onRunScan: () => void
  onReset: () => void
  onStep: () => void
  proofRunning: boolean
  scanRunning: boolean
}

export const PresenterControls = ({
  cutoverRunning,
  eventCount,
  kafkaRunning,
  migrationRunning,
  onColdOpen,
  onRunKafka,
  onRunCutover,
  onRunMigration,
  onPause,
  onRunProof,
  onRunScan,
  onReset,
  onStep,
  proofRunning,
  scanRunning
}: PresenterControlsProps) => (
  <aside className="presenter-controls" aria-label="Presenter controls">
    <div>
      <p className="eyebrow">Presenter controls</p>
      <strong>{eventCount}/14 workflow events</strong>
    </div>
    <div className="presenter-actions">
      <button className="primary-button" type="button" onClick={onRunProof} disabled={proofRunning}>
        <RadioTower aria-hidden="true" size={16} />
        {proofRunning ? "Running live check" : "Run live check"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunScan} disabled={scanRunning}>
        <ScanSearch aria-hidden="true" size={16} />
        {scanRunning ? "Scanning" : "Scan source"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunMigration} disabled={migrationRunning}>
        <DatabaseZap aria-hidden="true" size={16} />
        {migrationRunning ? "Migrating" : "Migrate data"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunKafka} disabled={kafkaRunning}>
        <RadioTower aria-hidden="true" size={16} />
        {kafkaRunning ? "Publishing" : "Kafka bus"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunCutover} disabled={cutoverRunning}>
        <PlugZap aria-hidden="true" size={16} />
        {cutoverRunning ? "Cutting over" : "Cutover app"}
      </button>
      <button className="ghost-button" type="button" onClick={onColdOpen}>
        <Undo2 aria-hidden="true" size={16} />
        Cold open
      </button>
      <button className="ghost-button" type="button" onClick={onPause}>
        <Pause aria-hidden="true" size={16} />
        Pause
      </button>
      <button className="ghost-button" type="button" onClick={onStep}>
        <StepForward aria-hidden="true" size={16} />
        Step
      </button>
      <button className="ghost-button" type="button" onClick={onReset}>
        <RotateCcw aria-hidden="true" size={16} />
        Reset
      </button>
    </div>
  </aside>
)
