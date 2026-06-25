import type { AivenStack } from '../../shared/types.ts'

/**
 * Zone 3a — the Aiven control plane: Postgres + Kafka services as provisioned
 * live via the MCP. State pills track the real service lifecycle.
 */
export function AivenServices({ stack }: { stack: AivenStack | null }) {
  const pg = stack?.postgres
  const kafka = stack?.kafka

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>AIVEN SERVICES</h3>
        <span className="meta">{stack?.project ?? 'project pending'}</span>
      </div>

      <div className="svc-row">
        <div className="svc pg">
          <div className="svc-h">
            <span className="svc-name">
              <span className="em">⬢</span> Aiven PG
            </span>
            <span className={`state ${pg?.state ?? 'none'}`}>{pg?.state ?? 'not provisioned'}</span>
          </div>
          <div className="svc-detail mono">{pg?.service ?? 'awaiting provision'}</div>
          <div className="svc-tags">
            {pg?.pgvector && <span className="svc-tag pgvector">pgvector</span>}
            {pg?.state && <span className="svc-tag">postgres 16</span>}
          </div>
        </div>

        <div className="svc kafka">
          <div className="svc-h">
            <span className="svc-name">
              <span className="em">≋</span> Aiven Kafka
            </span>
            <span className={`state ${kafka?.state ?? 'none'}`}>{kafka?.state ?? 'not provisioned'}</span>
          </div>
          <div className="svc-detail mono">{kafka?.service ?? 'awaiting provision'}</div>
          <div className="svc-tags">
            {(kafka?.topics ?? []).slice(0, 4).map((t) => (
              <span className="svc-tag" key={t}>
                {t}
              </span>
            ))}
            {(kafka?.topics?.length ?? 0) > 4 && <span className="svc-tag">+{kafka!.topics.length - 4}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
