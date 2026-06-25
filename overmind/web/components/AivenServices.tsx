import type { AivenStack } from '../../shared/types.ts'
import { ServiceIcon, Check, Server } from '../icons.tsx'

/**
 * Zone 3a — the Aiven control plane: Postgres + Kafka services as provisioned
 * live via the MCP. Rendered exactly like Aiven's real console: a colorful
 * per-service icon tile, the service name as a teal link, a green "Running"
 * badge with a check, and plan / cloud meta below. State pills track the real
 * service lifecycle.
 */
const isRunning = (s?: string) => !!s && /running/i.test(s)
const isProvisioning = (s?: string) => !!s && !isRunning(s)

function StatePill({ state }: { state?: string }) {
  const label = state ?? 'not provisioned'
  const cls = state ?? 'none'
  return (
    <span className={`state ${cls}`}>
      {isRunning(state) && <Check size={13} />}
      {label}
    </span>
  )
}

export function AivenServices({ stack }: { stack: AivenStack | null }) {
  const pg = stack?.postgres
  const kafka = stack?.kafka

  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Server size={15} />
          </span>
          Aiven services
        </h3>
        <span className="meta mono">{stack?.project ?? 'project pending'}</span>
      </div>

      <div className="svc-row">
        <div
          className={`svc pg ${isProvisioning(pg?.state) ? 'provisioning' : ''} ${
            isRunning(pg?.state) ? 'up' : ''
          }`}
        >
          <div className="svc-h">
            <ServiceIcon kind="postgres" size={38} />
            <div className="svc-id">
              <span className="svc-name">{pg?.service ?? 'Aiven for PostgreSQL'}</span>
              <span className="svc-sub">PostgreSQL® · {pg?.state ? 'managed' : 'pending'}</span>
            </div>
            <StatePill state={pg?.state} />
          </div>
          <div className="svc-tags">
            {pg?.pgvector && <span className="svc-tag pgvector">pgvector</span>}
            {pg?.state && <span className="svc-tag">postgres 16</span>}
            <span className="svc-tag">primary + replica</span>
          </div>
        </div>

        <div
          className={`svc kafka ${isProvisioning(kafka?.state) ? 'provisioning' : ''} ${
            isRunning(kafka?.state) ? 'up' : ''
          }`}
        >
          <div className="svc-h">
            <ServiceIcon kind="kafka" size={38} />
            <div className="svc-id">
              <span className="svc-name">{kafka?.service ?? 'Aiven for Apache Kafka'}</span>
              <span className="svc-sub">Apache Kafka® · {kafka?.state ? 'managed' : 'pending'}</span>
            </div>
            <StatePill state={kafka?.state} />
          </div>
          <div className="svc-tags">
            {(kafka?.topics ?? []).slice(0, 4).map((t) => (
              <span className="svc-tag" key={t}>
                {t}
              </span>
            ))}
            {(kafka?.topics?.length ?? 0) > 4 && (
              <span className="svc-tag">+{kafka!.topics.length - 4}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
