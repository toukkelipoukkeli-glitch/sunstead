import type { Report, ValidationCheck } from "@aiden/contracts"
import { CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

const label = (value: string) => value.replaceAll("_", " ")

const iconFor = (status: ValidationCheck["status"]) => {
  if (status === "passed") return <CheckCircle2 aria-hidden="true" size={16} />
  if (status === "failed") return <TriangleAlert aria-hidden="true" size={16} />
  return <CircleDashed aria-hidden="true" size={16} />
}

export const ValidationCards = ({ checks, report }: { checks: ValidationCheck[]; report: Report }) => (
  <section className="panel validation-panel">
    <div className="panel-header">
      <div>
        <p className="eyebrow">Validation</p>
        <h2>Validation checks</h2>
      </div>
      <span className="path-chip success">{checks.filter((check) => check.status === "passed").length} passed</span>
    </div>

    <div className="validation-grid">
      {report.rowValidations.map((row) => (
        <article className="validation-card" key={row.table}>
          <div>
            <span>{row.table}</span>
            <strong>{row.actual}/{row.expected}</strong>
          </div>
          <ProofSourceBadge source={row.source} />
        </article>
      ))}
    </div>

    <div className="check-list">
      {checks.map((check) => (
        <article className={`check-row check-${check.status}`} key={check.id}>
          {iconFor(check.status)}
          <div>
            <strong>{label(check.checkName)}</strong>
            <span>{check.status}</span>
          </div>
          <ProofSourceBadge source={check.source} />
        </article>
      ))}
    </div>
  </section>
)
