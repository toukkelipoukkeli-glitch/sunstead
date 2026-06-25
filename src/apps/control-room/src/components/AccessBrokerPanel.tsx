import type { AccessCheck, AccessSnapshot } from "@aiden/contracts"
import { AlertTriangle, Ban, CheckCircle2, Clock3, RefreshCw, ShieldCheck } from "lucide-react"

type AccessBrokerPanelProps = {
  accessSnapshot: AccessSnapshot
  isRefreshing: boolean
  onRefresh: () => void
}

const statusLabel: Record<AccessCheck["status"], string> = {
  ready: "ready",
  connected: "connected",
  live_verified: "live verified",
  warning: "warning",
  blocked: "blocked",
  not_requested: "not requested",
  later: "later"
}

const statusIcon = (status: AccessCheck["status"]) => {
  if (status === "blocked") return <Ban aria-hidden="true" size={15} />
  if (status === "warning") return <AlertTriangle aria-hidden="true" size={15} />
  if (status === "later" || status === "not_requested") return <Clock3 aria-hidden="true" size={15} />
  if (status === "live_verified") return <ShieldCheck aria-hidden="true" size={15} />
  return <CheckCircle2 aria-hidden="true" size={15} />
}

const modeLabel = (mode: AccessSnapshot["mode"]) => mode.replaceAll("_", " ")
const canUseForGraduate = (status: AccessCheck["status"]) =>
  status === "ready" || status === "connected" || status === "live_verified"

export const AccessBrokerPanel = ({ accessSnapshot, isRefreshing, onRefresh }: AccessBrokerPanelProps) => {
  const requiredReady = accessSnapshot.checks.filter(
    (check) => check.requiredForGraduate && canUseForGraduate(check.status)
  ).length
  const requiredTotal = accessSnapshot.checks.filter((check) => check.requiredForGraduate).length

  return (
    <section className="access-broker" aria-label="Aiven workspace setup">
      <div className="access-broker-header">
        <div>
          <p className="eyebrow">Aiven Workspace Setup</p>
          <h2>Connected workspace. Safe graduation.</h2>
          <span>
            Workspace: Henri pre-connected workspace · Mode: controlled Aiven migration
          </span>
          <span>
            No Aiven account? Aiden can create a workspace during setup.
          </span>
          <span>
            Mode: {modeLabel(accessSnapshot.mode)} · Required checks {requiredReady}/{requiredTotal} · Production cutover not requested
          </span>
        </div>
        <div className="access-broker-actions">
          <span className={accessSnapshot.canGraduate ? "access-ready" : "access-blocked"}>
            {accessSnapshot.canGraduate ? "Ready to graduate" : "Blocked"}
          </span>
          <button className="ghost-button" type="button" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw aria-hidden="true" size={15} />
            {isRefreshing ? "Checking" : "Refresh access"}
          </button>
        </div>
      </div>

      <div className="access-table" role="table" aria-label="Workspace setup checks">
        <div className="access-row access-row-head" role="row">
          <span role="columnheader">Workspace item</span>
          <span role="columnheader">Minimum scope</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Proof</span>
        </div>
        {accessSnapshot.checks.map((check) => (
          <div className="access-row" role="row" key={check.id}>
            <span role="cell">
              <strong>{check.label}</strong>
              <em>{check.requiredForGraduate ? "required" : "optional"}</em>
            </span>
            <span role="cell">{check.scope}</span>
            <span role="cell">
              <mark className={`access-status access-status-${check.status}`}>
                {statusIcon(check.status)}
                {statusLabel[check.status]}
              </mark>
            </span>
            <span role="cell">{check.proof}</span>
          </div>
        ))}
      </div>

      {accessSnapshot.blockers.length > 0 || accessSnapshot.warnings.length > 0 ? (
        <div className="access-note">
          {accessSnapshot.blockers.length > 0 ? <span>Blockers: {accessSnapshot.blockers.join(", ")}</span> : null}
          {accessSnapshot.warnings.length > 0 ? <span>Warnings: {accessSnapshot.warnings.join(" ")}</span> : null}
        </div>
      ) : null}
    </section>
  )
}
