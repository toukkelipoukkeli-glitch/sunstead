import type { BehaviorClassification, BehaviorFinding, BehaviorGraph, BehaviorKind, BehaviorTarget } from "@aiden/contracts"
import { ModeBadge } from "./ModeBadge"
import { ProofSourceBadge } from "./ProofSourceBadge"

const labelFor = (classification: BehaviorFinding["classification"]) => classification.replaceAll("_", " ")
const nodeLabelFor = (value: BehaviorKind | BehaviorClassification | BehaviorTarget) => value.replaceAll("_", " ")

type BehaviorMapProps = {
  findings: BehaviorFinding[]
  behaviorGraph?: BehaviorGraph
}

const countBy = <T extends string>(values: T[]) =>
  values.reduce<Partial<Record<T, number>>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})

export const BehaviorMap = ({ findings, behaviorGraph }: BehaviorMapProps) => {
  if (behaviorGraph) {
    const kindCounts = countBy(behaviorGraph.nodes.map((node) => node.kind))
    const classificationCounts = countBy(behaviorGraph.nodes.map((node) => node.classification))
    const blockingCount = behaviorGraph.blockers.filter((blocker) => blocker.severity === "blocking").length
    const visibleBlockers = behaviorGraph.blockers.slice(0, 3)

    return (
      <section className="panel behavior-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Behavior migration</p>
            <h2>Compatibility map</h2>
          </div>
          <div className="report-header-badges">
            <ProofSourceBadge source={behaviorGraph.source} />
            <span className={blockingCount > 0 ? "path-chip warning" : "path-chip success"}>
              {behaviorGraph.readinessScore}/100 ready
            </span>
          </div>
        </div>

        <div className="behavior-summary-grid">
          <article>
            <span>Nodes</span>
            <strong>{behaviorGraph.nodes.length}</strong>
            <small>{behaviorGraph.sourceLabel}</small>
          </article>
          <article>
            <span>Classes</span>
            <strong>{Object.keys(classificationCounts).length}</strong>
            <small>
              {Object.entries(classificationCounts)
                .map(([classification, count]) => `${nodeLabelFor(classification as BehaviorClassification)} ${count}`)
                .join(" · ") || "pending"}
            </small>
          </article>
          <article>
            <span>Blockers</span>
            <strong>{behaviorGraph.blockers.length}</strong>
            <small>{blockingCount > 0 ? `${blockingCount} blocking` : "No blocking items in graph"}</small>
          </article>
        </div>

        <div className="behavior-node-cloud" aria-label="Behavior node classes">
          {Object.entries(kindCounts).map(([kind, count]) => (
            <span key={kind}>
              {nodeLabelFor(kind as BehaviorKind)}
              <strong>{count}</strong>
            </span>
          ))}
        </div>

        <div className="behavior-table">
          {behaviorGraph.nodes.slice(0, 5).map((node) => (
            <div className="behavior-row behavior-node-row" key={node.id}>
              <div>
                <strong>{node.name}</strong>
                <p>{node.detail}</p>
                <div className="source-refs" aria-label={`Source evidence for ${node.name}`}>
                  {node.evidence.slice(0, 2).map((ref) => (
                    <code key={`${ref.file}:${ref.line}`}>{`${ref.file}:${ref.line}`}</code>
                  ))}
                  {node.evidence.length > 2 ? <span>+{node.evidence.length - 2}</span> : null}
                </div>
              </div>
              <div>
                <span className={`classification ${node.classification}`}>{nodeLabelFor(node.classification)}</span>
                <small>{nodeLabelFor(node.kind)} to {nodeLabelFor(node.target)}</small>
              </div>
              <ProofSourceBadge source={node.source} />
            </div>
          ))}
        </div>

        {visibleBlockers.length > 0 ? (
          <div className="behavior-blockers">
            {visibleBlockers.map((blocker) => (
              <p className={`behavior-blocker behavior-blocker-${blocker.severity}`} key={blocker.id}>
                <strong>{blocker.title}</strong>
                {blocker.resolution}
              </p>
            ))}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <section className="panel behavior-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Behavior migration</p>
          <h2>Compatibility map</h2>
        </div>
        <span className="path-chip">{findings.length} findings</span>
      </div>
      <div className="behavior-table">
        {findings.map((finding) => (
          <div className="behavior-row" key={finding.id}>
            <div>
              <strong>{finding.behavior}</strong>
              <p>{finding.demoTreatment}</p>
              <div className="source-refs" aria-label={`Source references for ${finding.behavior}`}>
                {finding.sourceRefs.slice(0, 2).map((ref) => (
                  <code key={ref}>{ref}</code>
                ))}
                {finding.sourceRefs.length > 2 ? <span>+{finding.sourceRefs.length - 2}</span> : null}
              </div>
            </div>
            <div>
              <span className={`classification ${finding.classification}`}>{labelFor(finding.classification)}</span>
              <small>{finding.target}</small>
            </div>
            <ModeBadge source={finding.source} />
          </div>
        ))}
      </div>
    </section>
  )
}
