import type { RunEvent } from "@aiden/contracts"
import { RadioTower } from "lucide-react"
import { ModeBadge } from "./ModeBadge"

export const KafkaAgentBus = ({ events }: { events: RunEvent[] }) => {
  return (
    <section className="panel kafka-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Aiven Kafka</p>
          <h2>Workflow events</h2>
        </div>
        <span className="path-chip">migration.events</span>
      </div>
      <div className="bus-list">
        {events.length === 0 ? (
          <div className="empty-state">Kafka-observed workflow events will appear here.</div>
        ) : (
          events.map((event) => (
            <div className="bus-row" key={`${event.type}-${event.createdAt}`}>
              <RadioTower aria-hidden="true" size={15} />
              <div>
                <strong>{event.type}</strong>
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
