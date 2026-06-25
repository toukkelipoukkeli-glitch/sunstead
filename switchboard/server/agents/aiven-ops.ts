import { readFileSync, existsSync } from 'node:fs'
import type { MigrationPlan } from './types'

// The bridge between the product and the Aiven MCP. planMcpOps() turns a
// migration plan into the exact ordered list of Aiven MCP tool calls the agents
// make — provision services, execute SQL, create Kafka topics. In Claude Code
// these run through the real MCP (aiven_service_create / aiven_pg_write /
// aiven_kafka_topic_create); the bundled server runs the same SQL over a
// DATABASE_URL so it also works headless.

export type McpOp = {
  agent: 'Provisioner' | 'Migrator'
  tool: string
  summary: string
  args: Record<string, unknown>
}

// The real Aiven service this project targets (identity only — no data here).
// Row counts and auth verification come live from aiven-live.ts at runtime.
export const LIVE_TARGET = {
  project: 'samukahonen-dc30',
  service: 'pg-22a59da',
  host: 'pg-22a59da-samukahonen-dc30.e.aivencloud.com:14340',
  plan: 'free-1-1gb',
  cloud: 'do-ams',
  kafkaService: 'kafka-1b71550b',
}

// Split SQL into statements, respecting dollar-quoted blocks ($$ … $$ / $tag$ … $tag$)
// and single-quoted strings — so DO blocks and function bodies aren't cut on their
// inner semicolons. (a string, or a path for back-compat.)
export function splitSql(sqlOrPath: string): string[] {
  const raw = sqlOrPath.includes('\n') || !existsSync(sqlOrPath) ? sqlOrPath : readFileSync(sqlOrPath, 'utf8')
  const sql = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
  const out: string[] = []
  let buf = ''
  let inSingle = false
  let dollar: string | null = null
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    if (dollar) {
      if (sql.startsWith(dollar, i)) {
        buf += dollar
        i += dollar.length - 1
        dollar = null
      } else buf += ch
      continue
    }
    if (inSingle) {
      buf += ch
      if (ch === "'") inSingle = false
      continue
    }
    if (ch === "'") {
      inSingle = true
      buf += ch
      continue
    }
    if (ch === '$') {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/)
      if (m) {
        dollar = m[0]
        buf += m[0]
        i += m[0].length - 1
        continue
      }
    }
    if (ch === ';') {
      const s = buf.trim()
      if (s) out.push(s)
      buf = ''
      continue
    }
    buf += ch
  }
  const last = buf.trim()
  if (last) out.push(last)
  return out
}

export function planMcpOps(plan: MigrationPlan, aivenSql: string): McpOp[] {
  const ops: McpOp[] = []

  for (const svc of plan.provision) {
    ops.push({
      agent: 'Provisioner',
      tool: 'aiven_service_create',
      summary: `Provision ${svc.serviceType === 'pg' ? 'Aiven for PostgreSQL' : 'Aiven for Apache Kafka'} (${svc.plan})`,
      args: { project: LIVE_TARGET.project, service_type: svc.serviceType, plan: svc.plan, cloud: LIVE_TARGET.cloud },
    })
  }

  for (const stmt of splitSql(aivenSql)) {
    ops.push({
      agent: 'Migrator',
      tool: 'aiven_pg_write',
      summary: firstWords(stmt),
      args: { project: LIVE_TARGET.project, service_name: LIVE_TARGET.service, query: stmt },
    })
  }

  for (const topic of plan.kafkaTopics) {
    ops.push({
      agent: 'Provisioner',
      tool: 'aiven_kafka_topic_create',
      summary: `Create Kafka topic ${topic}`,
      args: { project: LIVE_TARGET.project, service_name: LIVE_TARGET.kafkaService, topic_name: topic, partitions: 1, replication: 2 },
    })
  }

  return ops
}

function firstWords(sql: string): string {
  const oneLine = sql.replace(/\s+/g, ' ').trim()
  return oneLine.length > 64 ? oneLine.slice(0, 61) + '...' : oneLine
}
