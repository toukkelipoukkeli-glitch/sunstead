import type { AivenReceipt, RunEvent } from "@aiden/contracts"
import { CheckCircle2, Database, RadioTower } from "lucide-react"

export const AivenShadowPlane = ({ receipts, events }: { receipts: AivenReceipt[]; events: RunEvent[] }) => {
  const isReady = events.some((event) => event.type === "aiven.postgres.verified")
  const kafkaReady = events.some((event) => event.type === "aiven.kafka.verified")

  return (
    <section className="panel shadow-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Target landing zone</p>
          <h2>Aiven landing zone</h2>
        </div>
        <span className="path-chip">{receipts.length} receipts</span>
      </div>
      <div className="shadow-grid">
        <div className={isReady ? "shadow-card ready" : "shadow-card"}>
          <Database aria-hidden="true" />
          <span>Postgres</span>
          <strong>{isReady ? "ready" : "waiting"}</strong>
        </div>
        <div className={kafkaReady ? "shadow-card ready" : "shadow-card"}>
          <RadioTower aria-hidden="true" />
          <span>Kafka</span>
          <strong>{kafkaReady ? "ready" : "waiting"}</strong>
        </div>
        <div className="shadow-card ready">
          <CheckCircle2 aria-hidden="true" />
          <span>Receipts</span>
          <strong>recording</strong>
        </div>
      </div>
    </section>
  )
}
