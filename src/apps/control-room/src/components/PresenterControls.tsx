import { DatabaseZap, Pause, PlugZap, RadioTower, RotateCcw, ScanSearch, StepForward } from "lucide-react"

type PresenterControlsProps = {
  cutoverRunning: boolean
  disabled?: boolean
  eventCount: number
  kafkaRunning: boolean
  migrationRunning: boolean
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
  disabled = false,
  eventCount,
  kafkaRunning,
  migrationRunning,
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
      <button className="primary-button" type="button" onClick={onRunProof} disabled={disabled || proofRunning}>
        <RadioTower aria-hidden="true" size={16} />
        {proofRunning ? "Running live check" : "Run live check"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunScan} disabled={disabled || scanRunning}>
        <ScanSearch aria-hidden="true" size={16} />
        {scanRunning ? "Scanning" : "Scan source"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunMigration} disabled={disabled || migrationRunning}>
        <DatabaseZap aria-hidden="true" size={16} />
        {migrationRunning ? "Migrating" : "Migrate data"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunKafka} disabled={disabled || kafkaRunning}>
        <RadioTower aria-hidden="true" size={16} />
        {kafkaRunning ? "Publishing" : "Kafka bus"}
      </button>
      <button className="ghost-button" type="button" onClick={onRunCutover} disabled={disabled || cutoverRunning}>
        <PlugZap aria-hidden="true" size={16} />
        {cutoverRunning ? "Cutting over" : "Cutover app"}
      </button>
      <button className="ghost-button" type="button" onClick={onPause} disabled={disabled}>
        <Pause aria-hidden="true" size={16} />
        Pause
      </button>
      <button className="ghost-button" type="button" onClick={onStep} disabled={disabled}>
        <StepForward aria-hidden="true" size={16} />
        Step
      </button>
      <button className="ghost-button" type="button" onClick={onReset} disabled={disabled}>
        <RotateCcw aria-hidden="true" size={16} />
        Reset
      </button>
    </div>
  </aside>
)
