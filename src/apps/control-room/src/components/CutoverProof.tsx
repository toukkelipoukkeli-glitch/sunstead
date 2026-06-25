import type { RunSnapshot } from "@aiden/contracts"
import { CheckCircle2, ExternalLink, FileArchive } from "lucide-react"
import { ProofSourceBadge } from "./ProofSourceBadge"

const statusLabel = (value: string) => value.replaceAll("_", " ")

export const CutoverProof = ({ snapshot }: { snapshot: RunSnapshot }) => {
  const cutoverReady = snapshot.events.some(
    (event) => event.type === "cutover.demo_runtime.ready" && event.status === "ok"
  )
  const cutoverArtifacts = snapshot.cutoverArtifacts ?? []
  const adapterArtifact = (snapshot.generatedArtifacts ?? []).find((artifact) => artifact.kind === "adapter_package")
  const hasCutoverArtifacts = cutoverArtifacts.length > 0

  return (
    <section className="panel cutover-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Controlled cutover</p>
          <h2>Runtime cutover</h2>
        </div>
        <div className="report-header-badges">
          {cutoverArtifacts[0]?.source ? <ProofSourceBadge source={cutoverArtifacts[0].source} /> : null}
          <span className={cutoverReady ? "path-chip success" : "path-chip"}>
            {cutoverReady ? "ready" : "waiting"}
          </span>
        </div>
      </div>
      <div className="path-compare">
        <div>
          <span>Old</span>
          <strong>Lovable UI -&gt; Supabase client -&gt; Postgres/Realtime</strong>
        </div>
        <div className={cutoverReady ? "active-path" : ""}>
          <span>New</span>
          <strong>Lovable UI -&gt; local Aiden adapter -&gt; Aiven Postgres + app_events</strong>
        </div>
        <div className={cutoverReady ? "active-path" : ""}>
          <span>Workflow events</span>
          <strong>Aiven Kafka migration.events</strong>
        </div>
      </div>
      {hasCutoverArtifacts ? (
        <div className="cutover-artifacts" aria-label="Cutover artifacts">
          {cutoverArtifacts.map((artifact) => {
            const localFallback = artifact.files[0] ?? adapterArtifact?.path
            return (
              <article className={`cutover-artifact cutover-artifact-${artifact.status}`} key={artifact.id}>
                <div>
                  <span>{artifact.type.replaceAll("_", " ")}</span>
                  <strong>{statusLabel(artifact.status)}</strong>
                  <p>{artifact.proof}</p>
                </div>
                <div className="cutover-artifact-meta">
                  <ProofSourceBadge source={artifact.source} />
                  {artifact.url ? (
                    <a href={artifact.url} target="_blank" rel="noreferrer">
                      PR
                      <ExternalLink aria-hidden="true" size={13} />
                    </a>
                  ) : localFallback ? (
                    <code>
                      <FileArchive aria-hidden="true" size={13} />
                      {localFallback}
                    </code>
                  ) : (
                    <span>{artifact.status === "skipped" ? "No PR opened" : "Artifact pending"}</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
      <p className="cutover-note">
        <CheckCircle2 aria-hidden="true" size={15} />
        Supabase removal is scoped to the controlled runtime path. Source stays untouched; rollback is ready.
      </p>
    </section>
  )
}
