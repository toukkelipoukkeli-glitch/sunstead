import type { BehaviorFinding } from "@aiden/contracts"
import { ModeBadge } from "./ModeBadge"

const labelFor = (classification: BehaviorFinding["classification"]) => classification.replaceAll("_", " ")

export const BehaviorMap = ({ findings }: { findings: BehaviorFinding[] }) => (
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
