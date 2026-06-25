import type { AccessSnapshot, Report } from "@aiden/contracts"
import { CheckCircle2, Database, RadioTower, ShieldAlert } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

const guideSteps = [
  "Connect workspace",
  "Scan behavior",
  "Create Aiven landing zone",
  "Migrate and validate",
  "Cut over runtime path"
]

const kafkaOutcome = (accessSnapshot: AccessSnapshot) => {
  const kafka = accessSnapshot.checks.find((check) => check.id === "aiven_kafka")
  if (kafka?.status === "live_verified") return "Aiven Kafka migration.events live verified"
  if (kafka?.status === "connected") return "Kafka configured; workflow proof runs after Postgres cutover"
  return "Kafka proof cached/warning; Postgres path remains live-critical"
}

export const ColdOpenOutcome = ({ accessSnapshot, report }: { accessSnapshot: AccessSnapshot; report: Report }) => (
  <section className="cold-open">
    <div className="cold-copy">
      <div className="cold-kicker">
        <p className="eyebrow">Aiden Migration Control Room</p>
        <ProofSourceBadge source={report.source} />
      </div>
      <h2>{report.headline}</h2>
      <p>
        The controlled runtime path is created fresh on Aiven for this run. The original PulseWall app
        remains untouched, blockers are explicit, and every migration step has a receipt path.
      </p>
      <div className="outcome-path">
        <span>Lovable UI</span>
        <strong>Aiven workspace</strong>
        <span>Aiven Postgres app_events</span>
      </div>
      <div className="cold-guide" aria-label="One-click migration flow">
        <div>
          <p className="eyebrow">One-click flow</p>
          <strong>{report.demoCutoverStatus === "passed" ? "Current run outcome" : "Planned run"}</strong>
        </div>
        <ol>
          {guideSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
    <div className="outcome-grid">
      <div className="outcome-grid-header">
        <div>
          <p className="eyebrow">Completed outcome</p>
          <strong>Migration path ready</strong>
        </div>
        <span>{report.readinessScore}/100</span>
      </div>
      <div className="outcome-tile">
        <Database aria-hidden="true" />
        <span>Data plane</span>
        <strong>Aiven Postgres</strong>
      </div>
      <div className="outcome-tile">
        <CheckCircle2 aria-hidden="true" />
        <span>Realtime</span>
        <strong>app_events -&gt; /api/events/recent -&gt; browser</strong>
      </div>
      <div className="outcome-tile">
        <RadioTower aria-hidden="true" />
        <span>Workflow events</span>
        <strong>{kafkaOutcome(accessSnapshot)}</strong>
      </div>
      <div className="outcome-tile warning">
        <ShieldAlert aria-hidden="true" />
        <span>Production source</span>
        <strong>unchanged; Auth / Storage / RLS blocked</strong>
      </div>
    </div>
  </section>
)
