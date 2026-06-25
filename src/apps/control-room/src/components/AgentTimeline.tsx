import type { RunEvent } from "@aiden/contracts"
import { Circle, CheckCircle2 } from "lucide-react"
import { plannedWorkflowEventCount } from "../lib/deriveRunView"
import { ModeBadge } from "./ModeBadge"

const eventLabel = (type: string) => type.replaceAll("demo_runtime", "runtime")

export const AgentTimeline = ({ events }: { events: RunEvent[] }) => (
  <section className="panel timeline-panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">Migration run</p>
        <h2>Agent timeline</h2>
      </div>
      <span className="path-chip">{events.length}/{plannedWorkflowEventCount}</span>
    </div>
    <div className="timeline-list">
      {events.length === 0 ? (
        <div className="empty-state">Waiting for `Graduate To Aiven`.</div>
      ) : (
        events.map((event) => (
          <div className="timeline-item" key={`${event.type}-${event.createdAt}`}>
            <CheckCircle2 aria-hidden="true" size={16} />
            <div>
              <div className="timeline-title">
                <strong>{eventLabel(event.type)}</strong>
                <ModeBadge source={event.source} />
              </div>
              <p>{event.summary}</p>
              <span>{event.agent.replaceAll("_", " ")}</span>
            </div>
          </div>
        ))
      )}
      {events.length < plannedWorkflowEventCount ? (
        <div className="timeline-item pending">
          <Circle aria-hidden="true" size={16} />
          <div>
            <strong>next proof slot</strong>
            <p>Aiden is ready to advance the run.</p>
          </div>
        </div>
      ) : null}
    </div>
  </section>
)
