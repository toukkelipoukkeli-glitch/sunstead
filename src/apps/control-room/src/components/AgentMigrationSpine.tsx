import type { RunEvent } from "@aiden/contracts"
import { CheckCircle2, Circle, CircleDashed, TimerReset, TriangleAlert } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

const eventLabel = (type: string) => type.replaceAll("demo_runtime", "runtime").replaceAll(".", " -> ")
const roleLabel = (agent: string) => agent.replaceAll("_", " ")

const statusIcon = (status: RunEvent["status"]) => {
  if (status === "failed") return <TriangleAlert aria-hidden="true" size={16} />
  if (status === "skipped") return <CircleDashed aria-hidden="true" size={16} />
  return <CheckCircle2 aria-hidden="true" size={16} />
}

export const AgentMigrationSpine = ({ events }: { events: RunEvent[] }) => (
  <section className="panel timeline-panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">Migration run</p>
        <h2>Execution timeline</h2>
      </div>
      <span className="path-chip">{events.length}/14</span>
    </div>
    <div className="timeline-list">
      {events.length === 0 ? (
        <div className="empty-state">Waiting for `Graduate To Aiven`.</div>
      ) : (
        events.map((event) => (
          <div className={`timeline-item timeline-${event.status}`} key={`${event.type}-${event.createdAt}`}>
            {statusIcon(event.status)}
            <div>
              <div className="timeline-title">
                <strong>{eventLabel(event.type)}</strong>
                <ProofSourceBadge source={event.source} />
                <span className={`status-pill timeline-status status-${event.status}`}>{event.status}</span>
              </div>
              <p>{event.summary}</p>
              <span>{roleLabel(event.agent)}</span>
            </div>
          </div>
        ))
      )}
      {events.length < 14 ? (
        <div className="timeline-item pending">
          {events.length === 0 ? <Circle aria-hidden="true" size={16} /> : <TimerReset aria-hidden="true" size={16} />}
          <div>
            <strong>next evidence item</strong>
            <p>Migration run is ready to advance through the next workflow step.</p>
          </div>
        </div>
      ) : null}
    </div>
  </section>
)
