import type { RunEvent } from "@aiden/contracts"
import { CircleDashed, RadioTower, TriangleAlert } from "lucide-react"
import { ModeBadge } from "./ModeBadge"

const statusIcon = (status: RunEvent["status"]) => {
  if (status === "failed") return <TriangleAlert aria-hidden="true" size={15} />
  if (status === "skipped") return <CircleDashed aria-hidden="true" size={15} />
  return <RadioTower aria-hidden="true" size={15} />
}

const eventLabel = (type: string) => type.replaceAll("demo_runtime", "runtime")

export const KafkaAgentBus = ({ events }: { events: RunEvent[] }) => {
  const liveCount = events.filter((event) => event.source === "live" && event.status === "ok").length
  const skippedCount = events.filter((event) => event.status === "skipped").length

  return (
    <section className="panel kafka-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Aiven Kafka</p>
          <h2>Workflow events</h2>
        </div>
        <span className={liveCount > 0 ? "path-chip success" : "path-chip"}>
          {liveCount > 0 ? `${liveCount} live` : skippedCount > 0 ? "warning-only" : "migration.events"}
        </span>
      </div>
      <div className="bus-list">
        {events.length === 0 ? (
          <div className="empty-state">Kafka-observed workflow events will appear here.</div>
        ) : (
          events.map((event) => (
            <div className={`bus-row bus-${event.status}`} key={`${event.type}-${event.createdAt}`}>
              {statusIcon(event.status)}
              <div>
                <strong>{eventLabel(event.type)}</strong>
                <span>{event.agent.replaceAll("_", " ")}</span>
              </div>
              <div className="bus-proof-meta">
                <span className={`status-pill bus-status status-${event.status}`}>{event.status}</span>
                <ModeBadge source={event.source} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
