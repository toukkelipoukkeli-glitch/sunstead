import type { PulseWallEvent, ValidationCheck } from "@aiden/contracts"
import { Activity, CheckCircle2, RadioTower } from "lucide-react"

export const RealtimeProof = ({ checks, appEvents }: { checks: ValidationCheck[]; appEvents: PulseWallEvent[] }) => {
  const passed = checks.some((check) => check.checkName === "postgres_events_browser_polling" && check.status === "passed")
  const kafkaPassed = checks.some((check) => check.checkName === "kafka_agent_bus_roundtrip" && check.status === "passed")

  return (
    <section className="panel realtime-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Realtime behavior</p>
          <h2>Realtime path</h2>
        </div>
        <span className={passed ? "path-chip success" : "path-chip"}>{passed ? "passed" : "pending"}</span>
      </div>
      <div className="route-diagram">
        <span>supabase.channel("posts")</span>
        <Activity aria-hidden="true" size={16} />
        <span>Aiven Postgres app_events</span>
        <Activity aria-hidden="true" size={16} />
        <span>/api/events/recent polling</span>
      </div>
      <div className={kafkaPassed ? "kafka-proof-callout success" : "kafka-proof-callout"}>
        <RadioTower aria-hidden="true" size={16} />
        <span>Kafka workflow event: migration.events {kafkaPassed ? "roundtrip passed" : "pending"}</span>
      </div>
      <div className="event-list">
        {appEvents.slice(0, 3).map((event) => (
          <div className="event-row" key={event.id}>
            <CheckCircle2 aria-hidden="true" size={15} />
            <div>
              <strong>{event.eventType}</strong>
              <p>{event.entityType} - {event.entityId}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
