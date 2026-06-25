import type { AivenReceipt, RunEvent, ValidationCheck } from "@aiden/contracts"
import { CheckCircle2, Database, FileCheck2, RadioTower } from "lucide-react"

const hasEvent = (events: RunEvent[], type: string) =>
  events.some((event) => event.type === type && event.status === "ok")
const hasCheck = (checks: ValidationCheck[], checkName: string) =>
  checks.some((check) => check.checkName === checkName && check.status === "passed")

export const AivenProofPlane = ({
  checks,
  receipts,
  events
}: {
  checks: ValidationCheck[]
  receipts: AivenReceipt[]
  events: RunEvent[]
}) => {
  const postgresReady = hasEvent(events, "aiven.postgres.verified")
  const kafkaReady = hasEvent(events, "aiven.kafka.verified")
  const receiptReady = receipts.length > 0
  const validationReady = hasCheck(checks, "postgres_events_browser_polling")

  return (
    <section className="panel shadow-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Aiven services</p>
          <h2>Aiven landing zone</h2>
        </div>
        <span className="path-chip success">{receipts.length} receipts</span>
      </div>
      <div className="proof-summary">
        <strong>Aiven is carrying the controlled runtime path.</strong>
        <span>Action receipts, Postgres validation, and Kafka workflow events use the same slots live mode will replace.</span>
      </div>
      <div className="service-readiness-list">
        <div className={postgresReady ? "service-row ready" : "service-row"}>
          <Database aria-hidden="true" />
          <span>Postgres</span>
          <strong>{postgresReady ? "ready" : "waiting"}</strong>
        </div>
        <div className={kafkaReady ? "service-row ready" : "service-row"}>
          <RadioTower aria-hidden="true" />
          <span>Kafka</span>
          <strong>{kafkaReady ? "ready" : "waiting"}</strong>
        </div>
        <div className={receiptReady ? "service-row ready" : "service-row"}>
          <FileCheck2 aria-hidden="true" />
          <span>Action receipts</span>
          <strong>{receiptReady ? "recording" : "waiting"}</strong>
        </div>
        <div className={validationReady ? "service-row ready" : "service-row"}>
          <CheckCircle2 aria-hidden="true" />
          <span>Validation</span>
          <strong>{validationReady ? "passed" : "pending"}</strong>
        </div>
      </div>
    </section>
  )
}
