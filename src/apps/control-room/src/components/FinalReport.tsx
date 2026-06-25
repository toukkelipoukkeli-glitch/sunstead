import type { Report } from "@aiden/contracts"
import { FileCheck2, RadioTower, ReceiptText, ShieldAlert } from "lucide-react"
import { ModeBadge } from "./ModeBadge"

export const FinalReport = ({ report }: { report: Report }) => {
  const kafkaChecks = report.checks.filter((check) => check.checkName.includes("kafka"))

  return (
    <section className="panel report-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Migration report</p>
          <h2>Migration readiness memo</h2>
        </div>
        <ModeBadge source={report.source} />
      </div>
      <div className="score-row">
        <FileCheck2 aria-hidden="true" />
        <div>
          <span>Migration readiness</span>
          <strong>{report.readinessScore}/100</strong>
          <p>Demo cutover: {report.demoCutoverStatus}</p>
        </div>
      </div>
      <div className="report-grid">
        <div className="mini-stat">
          <ReceiptText aria-hidden="true" size={16} />
          <span>Aiven MCP actions</span>
          <strong>{report.receipts.length}</strong>
        </div>
        <div className="mini-stat">
          <RadioTower aria-hidden="true" size={16} />
          <span>Workflow checks</span>
          <strong>{kafkaChecks.length}</strong>
        </div>
        {report.rowValidations.slice(0, 2).map((row) => (
          <div className="mini-stat" key={row.table}>
            <span>{row.table}</span>
            <strong>{row.actual}/{row.expected}</strong>
          </div>
        ))}
      </div>
      <div className="blockers">
        <strong>
          <ShieldAlert aria-hidden="true" size={15} />
          Production blockers
        </strong>
        {report.blockers.map((blocker) => (
          <p key={blocker}>{blocker}</p>
        ))}
      </div>
      <div className="report-copy">
        <p>{report.costSummary}</p>
        <p>{report.ctoRecommendation}</p>
        <p>Rollback: {report.rollback}</p>
      </div>
    </section>
  )
}
