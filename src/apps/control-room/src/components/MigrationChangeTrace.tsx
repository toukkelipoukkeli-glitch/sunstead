import type { AccessCheckStatus, CutoverArtifact, GeneratedArtifact, RunEvent, RunSnapshot } from "@aiden/contracts"
import {
  Boxes,
  CheckCircle2,
  CircleDashed,
  Database,
  GitBranch,
  GitPullRequest,
  LockKeyhole,
  PackageCheck,
  RadioTower,
  ShieldCheck,
  TriangleAlert
} from "lucide-react"
import type { ReactNode } from "react"
import { ProofSourceBadge } from "./ProofSourceBadge"

type ChangeStatus = "done" | "active" | "waiting" | "warning"

type ChangeItem = {
  label: string
  before: string
  after: string
  status: ChangeStatus
  proof: string
  source?: RunEvent["source"]
  icon: ReactNode
}

const hasOkEvent = (events: RunEvent[], type: string) =>
  events.some((event) => event.type === type && event.status === "ok")

const hasEvent = (events: RunEvent[], type: string) => events.some((event) => event.type === type)

const statusText: Record<ChangeStatus, string> = {
  done: "changed",
  active: "running",
  waiting: "waiting",
  warning: "manual"
}

const accessReady = (status?: AccessCheckStatus) =>
  status === "ready" || status === "connected" || status === "live_verified"

const artifactStatus = (artifact?: GeneratedArtifact): ChangeStatus => {
  if (!artifact) return "waiting"
  if (artifact.status === "generated" || artifact.status === "validated") return "done"
  if (artifact.status === "planned") return "active"
  return "warning"
}

const cutoverArtifactStatus = (artifact?: CutoverArtifact | GeneratedArtifact): ChangeStatus => {
  if (!artifact) return "waiting"
  if (artifact.status === "opened" || artifact.status === "generated" || artifact.status === "validated") return "done"
  if (artifact.status === "planned") return "active"
  return "warning"
}

const statusIcon = (status: ChangeStatus) => {
  if (status === "done") return <CheckCircle2 aria-hidden="true" size={15} />
  if (status === "active") return <GitBranch aria-hidden="true" size={15} />
  if (status === "warning") return <TriangleAlert aria-hidden="true" size={15} />
  return <CircleDashed aria-hidden="true" size={15} />
}

export const MigrationChangeTrace = ({ snapshot }: { snapshot: RunSnapshot }) => {
  const events = snapshot.events
  const checkFor = (id: string) => snapshot.accessSnapshot.checks.find((check) => check.id === id)
  const sourceCheck = checkFor("repo_source")
  const mcpCheck = checkFor("aiven_mcp")
  const mcpProbe = events.find((event) => event.type === "aiven.mcp.agent.probed")
  const kafkaOk = hasOkEvent(events, "kafka.agent_bus_roundtrip.passed") || hasOkEvent(events, "aiven.kafka.verified")
  const kafkaSkipped = events.some((event) => event.type === "kafka.agent_bus_roundtrip.passed" && event.status === "skipped")
  const cutoverOk = hasOkEvent(events, "cutover.demo_runtime.ready")
  const cutoverSkipped = events.some((event) => event.type === "cutover.demo_runtime.ready" && event.status === "skipped")
  const generatedArtifacts = snapshot.generatedArtifacts ?? []
  const cutoverArtifacts = snapshot.cutoverArtifacts ?? []
  const adapterArtifact = generatedArtifacts.find((artifact) => artifact.kind === "adapter_package")
  const cutoverPr = cutoverArtifacts.find((artifact) => artifact.type === "github_pr")
  const generatedPr = generatedArtifacts.find((artifact) => artifact.kind === "github_pr")

  const changes: ChangeItem[] = [
    {
      label: "Source import",
      before: "Lovable/Supabase source hidden in code",
      after: "Readable source evidence and detected backend behavior",
      status: hasOkEvent(events, "source.behavior.detected")
        ? "done"
        : accessReady(sourceCheck?.status)
          ? "active"
          : "waiting",
      proof: sourceCheck?.proof ?? "Waiting for source access.",
      source: sourceCheck?.source,
      icon: <Boxes aria-hidden="true" size={16} />
    },
    {
      label: "Behavior mapping",
      before: "Supabase tables, Realtime, Auth, Storage, RLS mixed together",
      after: "Classified migration plan with explicit blockers",
      status: hasOkEvent(events, "behavior.scan.completed")
        ? "done"
        : hasEvent(events, "repo.scan.started")
          ? "active"
          : "waiting",
      proof: `${snapshot.behaviorFindings.length} behavior finding(s) in the current run.`,
      source: snapshot.behaviorFindings[0]?.source,
      icon: <GitBranch aria-hidden="true" size={16} />
    },
    {
      label: "Adapter package",
      before: "Supabase calls stay embedded in the source UI",
      after: "Scoped local adapter package for the Aiven runtime path",
      status: artifactStatus(adapterArtifact),
      proof: adapterArtifact?.path
        ? `${adapterArtifact.title} at ${adapterArtifact.path}.`
        : adapterArtifact?.title ?? "Waiting for adapter package artifact.",
      source: adapterArtifact?.source,
      icon: <PackageCheck aria-hidden="true" size={16} />
    },
    {
      label: "Data plane",
      before: "Supabase project owns runtime rows",
      after: "Aiven Postgres shadow rows and validation checks",
      status: hasOkEvent(events, "migration.rows.validated")
        ? "done"
        : hasOkEvent(events, "aiven.postgres.verified")
          ? "active"
          : "waiting",
      proof:
        snapshot.report.rowValidations.length > 0
          ? `${snapshot.report.rowValidations.length} table validation(s) recorded.`
          : "Waiting for row validation.",
      source: snapshot.report.rowValidations[0]?.source,
      icon: <Database aria-hidden="true" size={16} />
    },
    {
      label: "Realtime path",
      before: "Supabase Realtime publication",
      after: "Aiven Postgres app_events read by the browser",
      status: cutoverOk ? "done" : cutoverSkipped ? "warning" : hasOkEvent(events, "realtime.postgres_events_bridge.passed") ? "active" : "waiting",
      proof: cutoverSkipped
        ? "Adapter generation required before runtime cutover."
        : cutoverOk
          ? "Browser event readback passed through Aiven Postgres."
          : "Waiting for provider cutover.",
      source: events.find((event) => event.type === "cutover.demo_runtime.ready")?.source,
      icon: <ShieldCheck aria-hidden="true" size={16} />
    },
    {
      label: "Agent control",
      before: "Operator manually checks Aiven context",
      after: "Anthropic Agent SDK receives Aiven MCP directly",
      status: mcpProbe?.status === "ok" ? "done" : mcpProbe?.status === "skipped" ? "warning" : accessReady(mcpCheck?.status) ? "active" : "waiting",
      proof: mcpProbe?.summary ?? mcpCheck?.proof ?? "Waiting for Aiven MCP runtime configuration.",
      source: mcpProbe?.source ?? mcpCheck?.source,
      icon: <LockKeyhole aria-hidden="true" size={16} />
    },
    {
      label: "Workflow bus",
      before: "Migration progress only visible in local UI",
      after: "Aiven Kafka migration.events slot for agent workflow events",
      status: kafkaOk ? "done" : kafkaSkipped ? "warning" : "waiting",
      proof: kafkaOk
        ? "Kafka workflow bus roundtrip passed."
        : kafkaSkipped
          ? "Kafka is optional and warning-only until credentials are configured."
          : "Waiting for Kafka proof slot.",
      source: events.find((event) => event.type === "kafka.agent_bus_roundtrip.passed")?.source,
      icon: <RadioTower aria-hidden="true" size={16} />
    },
    {
      label: "Cutover PR",
      before: "Migration changes live only in the control room",
      after: "PR or local artifact records the controlled cutover patch",
      status: cutoverArtifactStatus(cutoverPr ?? generatedPr),
      proof: cutoverPr?.url
        ? `PR opened at ${cutoverPr.url}.`
        : cutoverPr?.files[0]
          ? `Local cutover artifact at ${cutoverPr.files[0]}.`
          : generatedPr?.path
            ? `Generated PR artifact at ${generatedPr.path}.`
            : "Waiting for cutover PR or local patch artifact.",
      source: cutoverPr?.source ?? generatedPr?.source,
      icon: <GitPullRequest aria-hidden="true" size={16} />
    }
  ]

  return (
    <section className="change-trace" aria-label="Migration changes">
      <div className="change-trace-header">
        <div>
          <p className="eyebrow">What is changing</p>
          <h2>Migration change trace</h2>
        </div>
        <span className="path-chip">{changes.filter((change) => change.status === "done").length}/{changes.length} changed</span>
      </div>
      <div className="change-trace-grid">
        {changes.map((change) => (
          <article className={`change-row change-${change.status}`} key={change.label}>
            <div className="change-icon">{change.icon}</div>
            <div className="change-main">
              <div className="change-title">
                <strong>{change.label}</strong>
                <span className={`change-status change-status-${change.status}`}>
                  {statusIcon(change.status)}
                  {statusText[change.status]}
                </span>
                {change.source ? <ProofSourceBadge source={change.source} /> : null}
              </div>
              <div className="change-before-after">
                <span>
                  <em>Before</em>
                  {change.before}
                </span>
                <span>
                  <em>After</em>
                  {change.after}
                </span>
              </div>
              <p>{change.proof}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
