import type { CutoverArtifact, GeneratedArtifact, Report } from "@aiden/contracts"
import {
  CheckCircle2,
  CircleDollarSign,
  Database,
  FileCheck2,
  GitPullRequest,
  PackageCheck,
  RadioTower,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  ShieldCheck
} from "lucide-react"
import { ModeBadge } from "./ModeBadge"
import { ProofSourceBadge } from "./ProofSourceBadge"

const label = (value: string) => value.replaceAll("_", " ")
const tableLabel = (value: string) => (value === "demo_users" ? "users" : value)
const artifactLabel = (value: string) => value.replaceAll("_", " ")

const checkStatus = (checks: Report["checks"], matcher: (checkName: string) => boolean) => {
  const matched = checks.filter((check) => matcher(check.checkName))
  if (matched.some((check) => check.status === "passed")) return "passed"
  if (matched.some((check) => check.status === "failed")) return "failed"
  if (matched.some((check) => check.status === "skipped")) return "warning"
  return "pending"
}

type FinalReportProps = {
  report: Report
  generatedArtifacts?: GeneratedArtifact[]
  cutoverArtifacts?: CutoverArtifact[]
}

export const FinalReport = ({ report, generatedArtifacts = [], cutoverArtifacts = [] }: FinalReportProps) => {
  const kafkaChecks = report.checks.filter((check) => check.checkName.includes("kafka"))
  const passedRows = report.rowValidations.filter((row) => row.status === "passed").length
  const liveReceipts = report.receipts.filter((receipt) => receipt.source === "live").length
  const browserStatus = checkStatus(report.checks, (checkName) => checkName === "postgres_events_browser_polling")
  const kafkaStatus = checkStatus(report.checks, (checkName) => checkName.includes("kafka"))
  const cutoverLabel =
    report.demoCutoverStatus === "passed" ? "Runtime cutover passed" : `Runtime cutover ${report.demoCutoverStatus}`
  const runtimeLead =
    report.demoCutoverStatus === "passed"
      ? "Controlled runtime path is ready on Aiven."
      : "Controlled runtime path is waiting on final proof."
  const dependencyLabel =
    report.runtimeDependency === "removed_from_scoped_demo_path"
      ? "Supabase removed from controlled runtime path"
      : label(report.runtimeDependency)
  const generatedCount = generatedArtifacts.filter((artifact) =>
    artifact.status === "generated" || artifact.status === "validated"
  ).length
  const generatedSummary = generatedArtifacts.length > 0 ? `${generatedCount}/${generatedArtifacts.length} ready` : "none recorded"
  const prArtifact = cutoverArtifacts.find((artifact) => artifact.type === "github_pr")
  const artifactSource = prArtifact?.source ?? generatedArtifacts[0]?.source

  return (
    <section className="panel report-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Migration report</p>
          <h2>Migration readiness memo</h2>
        </div>
        <div className="report-header-badges">
          <ModeBadge source={report.source} />
          <span className={`memo-chip memo-chip-${report.demoCutoverStatus}`}>{cutoverLabel}</span>
        </div>
      </div>

      <div className="memo-hero">
        <div className="score-row">
          <FileCheck2 aria-hidden="true" />
          <div>
            <span>Migration readiness</span>
            <strong>{report.readinessScore}/100</strong>
            <p>{dependencyLabel}</p>
          </div>
        </div>
        <div>
          <strong>{runtimeLead}</strong>
          <p>
            PulseWall source stays untouched while Aiden validates the shadow data plane,
            browser event path, rollback plan, and production blockers.
          </p>
        </div>
      </div>

      {generatedArtifacts.length > 0 || cutoverArtifacts.length > 0 ? (
        <div className="artifact-summary">
          <article>
            <PackageCheck aria-hidden="true" size={16} />
            <div>
              <span>Generated package</span>
              <strong>{generatedSummary}</strong>
              <p>
                {generatedArtifacts
                  .slice(0, 2)
                  .map((artifact) => `${artifact.title}: ${artifactLabel(artifact.status)}`)
                  .join(" · ") || "No generated package recorded yet."}
              </p>
            </div>
          </article>
          <article>
            <GitPullRequest aria-hidden="true" size={16} />
            <div>
              <span>Cutover PR</span>
              <strong>{prArtifact ? artifactLabel(prArtifact.status) : "not opened"}</strong>
              <p>{prArtifact?.url ?? prArtifact?.files[0] ?? "Local artifact path will show when available."}</p>
            </div>
          </article>
          {artifactSource ? <ProofSourceBadge source={artifactSource} /> : null}
        </div>
      ) : null}

      <div className="memo-fact-grid">
        <article className="memo-fact">
          <Database aria-hidden="true" size={16} />
          <span>Rows validated</span>
          <strong>{passedRows}/{report.rowValidations.length || 4}</strong>
          <small>
            {report.rowValidations.map((row) => `${tableLabel(row.table)} ${row.actual}/${row.expected}`).join(" · ") ||
              "pending"}
          </small>
        </article>
        <article className="memo-fact">
          <CheckCircle2 aria-hidden="true" size={16} />
          <span>Browser event path</span>
          <strong>{browserStatus}</strong>
          <small>Aiven Postgres app_events -&gt; /api/events/recent</small>
        </article>
        <article className="memo-fact">
          <ReceiptText aria-hidden="true" size={16} />
          <span>Aiven actions</span>
          <strong>{report.receipts.length}</strong>
          <small>{liveReceipts} live receipts</small>
        </article>
        <article className="memo-fact">
          <RadioTower aria-hidden="true" size={16} />
          <span>Kafka workflow proof</span>
          <strong>{kafkaStatus}</strong>
          <small>{kafkaChecks.length} check entries</small>
        </article>
      </div>

      <div className="memo-section blockers">
        <h3>
          <ShieldAlert aria-hidden="true" size={15} />
          Production blockers
        </h3>
        <div className="memo-list">
          {report.blockers.length > 0 ? (
            report.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)
          ) : (
            <p>Production blockers are pending final proof package generation.</p>
          )}
        </div>
      </div>

      <div className="memo-copy-grid">
        <article className="memo-copy-card">
          <CircleDollarSign aria-hidden="true" size={16} />
          <div>
            <span>Cost read</span>
            <p>{report.costSummary}</p>
          </div>
        </article>
        <article className="memo-copy-card">
          <ShieldCheck aria-hidden="true" size={16} />
          <div>
            <span>CTO recommendation</span>
            <p>{report.ctoRecommendation}</p>
          </div>
        </article>
        <article className="memo-copy-card">
          <RotateCcw aria-hidden="true" size={16} />
          <div>
            <span>Rollback</span>
            <p>{report.rollback}</p>
          </div>
        </article>
      </div>
      <div className="memo-footer">
        <span>Evidence source</span>
        <ProofSourceBadge source={report.source} />
      </div>
    </section>
  )
}
