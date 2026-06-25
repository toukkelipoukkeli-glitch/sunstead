import { randomBytes } from 'node:crypto'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Aiven service type per detected source + the plans to try (free first, then a
// cheap paid fallback when the org's free slot for that type is used).
export const AIVEN_TYPES: Record<string, { type: string; plans: string[]; label: string }> = {
  pg: { type: 'pg', plans: ['free-1-1gb', 'hobbyist', 'startup-4'], label: 'Aiven for PostgreSQL' },
  supabase: { type: 'pg', plans: ['free-1-1gb', 'hobbyist', 'startup-4'], label: 'Aiven for PostgreSQL' },
  mysql: { type: 'mysql', plans: ['free-1-1gb', 'hobbyist', 'startup-4'], label: 'Aiven for MySQL' },
  redis: { type: 'valkey', plans: ['free-1', 'startup-4'], label: 'Aiven for Caching (Valkey)' },
  valkey: { type: 'valkey', plans: ['free-1', 'startup-4'], label: 'Aiven for Caching (Valkey)' },
  opensearch: { type: 'opensearch', plans: ['free-4-20', 'startup-4-1', 'startup-4'], label: 'Aiven for OpenSearch' },
  kafka: { type: 'kafka', plans: ['free-0', 'startup-2'], label: 'Aiven for Apache Kafka' },
}

export type ProvisionResult = {
  type: string
  serviceName: string
  plan: string
  host: string
  port: string
  user: string
  password: string
  uri: string
  simulated: boolean
}

function buildUri(type: string, p: any, pw: string): string {
  const host = p.host
  const port = p.port
  const user = p.user || 'avnadmin'
  if (type === 'valkey') return `rediss://${user}:${pw}@${host}:${port}`
  if (type === 'mysql') return `mysql://${user}:${pw}@${host}:${port}/${p.dbname || 'defaultdb'}?ssl-mode=REQUIRED`
  if (type === 'opensearch') return `https://${user}:${pw}@${host}:${port}`
  if (type === 'kafka') return `${host}:${port}` // bootstrap; auth is via certs, handled separately
  return `postgres://${user}:${pw}@${host}:${port}/${p.dbname || 'defaultdb'}?sslmode=require`
}

// Provision (or reuse) an Aiven service of any type on the user's account, set a
// known password (the token redacts the generated one), and return a usable
// connection. Reuse is the default: if a service of the right type is already
// running we adopt it instead of creating a new one — which is what keeps the
// migration working on a trial org that has hit its concurrent-service quota.
export async function provisionAiven(opts: {
  serviceType?: string
  name?: string
  token?: string
  project?: string
  cloud?: string
  plan?: string
  reuse?: boolean
  existingName?: string
  onLog?: (m: string) => void
}): Promise<ProvisionResult> {
  const token = opts.token || process.env.AIVEN_TOKEN
  const api = process.env.AIVEN_API_URL || 'https://api.aiven.io'
  const log = opts.onLog || (() => {})
  const cfg = AIVEN_TYPES[opts.serviceType || 'pg'] || AIVEN_TYPES.pg
  const serviceType = cfg.type
  const name = opts.name || 'sb-' + serviceType + '-' + randomBytes(3).toString('hex')

  if (!token) {
    await delay(400)
    return { type: serviceType, serviceName: name, plan: 'simulated', host: `${name}.aivencloud.com`, port: '0', user: 'avnadmin', password: '****', uri: '', simulated: true }
  }
  const headers = { authorization: `aivenv1 ${token}`, 'content-type': 'application/json' }

  let project = opts.project || process.env.AIVEN_PROJECT
  let cloud = opts.cloud || process.env.AIVEN_CLOUD
  if (!project || !cloud) {
    const pr = await fetch(`${api}/v1/project`, { headers })
    if (!pr.ok) throw new Error(`Aiven project list failed (${pr.status}). Check the token.`)
    const pj: any = await pr.json()
    const match = (pj.projects || []).find((p: any) => p.project_name === project) || pj.projects?.[0]
    if (!match?.project_name) throw new Error('No Aiven project found for this token.')
    project = project || match.project_name
    cloud = cloud || match.default_cloud
  }
  cloud = cloud || 'do-fra'

  // Reuse an already-running service of this type instead of creating a new one.
  // On a trial org that's at its service ceiling a fresh create 403s on BOTH the
  // (taken) free slot and the paid plans, so reuse is what keeps migrations green.
  // Default ON; AIVEN_REUSE=0 forces a fresh create. When several services of the
  // same type exist, AIVEN_<TYPE>_SERVICE (e.g. AIVEN_PG_SERVICE) picks which one.
  const reuse = opts.reuse ?? !/^(0|false|off)$/i.test(process.env.AIVEN_REUSE || '')
  if (reuse) {
    const preferName = opts.existingName || process.env[`AIVEN_${serviceType.toUpperCase()}_SERVICE`]
    const found = await findRunningService({ api, project, headers, serviceType, preferName })
    if (found) {
      log(`reusing existing ${cfg.label} "${found.name}" (${found.plan}) — no new service needed`)
      // Prefer a configured password so we don't rotate creds other consumers use
      // (AIVEN_DB_PASSWORD points at the pg target the live preview connects to).
      const knownPw = process.env[`AIVEN_${serviceType.toUpperCase()}_PASSWORD`] || (serviceType === 'pg' ? process.env.AIVEN_DB_PASSWORD : undefined)
      return finalizeService({ api, project, headers, serviceType, name: found.name, plan: found.plan, log, knownPassword: knownPw })
    }
    log(`no running ${serviceType} to reuse — provisioning a new one…`)
  }

  const plans = opts.plan ? [opts.plan, ...cfg.plans] : cfg.plans
  let usedPlan = ''
  for (const plan of plans) {
    const body: any = { service_name: name, service_type: serviceType, cloud, plan }
    if (serviceType === 'pg') body.user_config = { pg_version: '17' }
    const r = await fetch(`${api}/v1/project/${project}/service`, { method: 'POST', headers, body: JSON.stringify(body) })
    if (r.ok) { usedPlan = plan; log(`creating ${cfg.label} "${name}" (${plan}) in ${cloud}…`); break }
    if (r.status === 409) { usedPlan = plan; log(`reusing existing "${name}"`); break }
    const txt = await r.text()
    if (r.status === 403 && /free|quota|limit/i.test(txt)) { log(`${serviceType} ${plan}: free slot taken or over the trial quota — trying the next plan…`); continue }
    if (r.status === 404 && /not available/i.test(txt)) { log(`${plan} not in ${cloud} — trying next…`); continue }
    throw new Error(`Aiven create ${serviceType} failed (${r.status}): ${txt.slice(0, 160)}`)
  }
  if (!usedPlan) throw new Error(`Could not create an Aiven ${serviceType} on any plan — the free slot is taken and the trial is at its service quota. Reuse an existing ${serviceType} (AIVEN_REUSE=1) or free one up.`)

  return finalizeService({ api, project, headers, serviceType, name, plan: usedPlan, log })
}

// Find a RUNNING service of the given type to adopt. With preferName set only an
// exact name match counts; otherwise the first running service of that type wins.
async function findRunningService(a: { api: string; project: string; headers: Record<string, string>; serviceType: string; preferName?: string }): Promise<{ name: string; plan: string } | null> {
  const r = await fetch(`${a.api}/v1/project/${a.project}/service`, { headers: a.headers })
  if (!r.ok) return null
  const j: any = await r.json()
  const running: any[] = (j.services || []).filter((s: any) => s.service_type === a.serviceType && s.state === 'RUNNING')
  const pick = a.preferName ? running.find((s: any) => s.service_name === a.preferName) : running[0]
  return pick ? { name: pick.service_name, plan: pick.plan || 'existing' } : null
}

// Wait for a service to reach RUNNING, ensure we hold a working password (reuse a
// configured one when given so other consumers' creds aren't rotated, otherwise
// reset to a fresh known value), and return a usable connection. An
// already-running service returns on the first poll.
async function finalizeService(a: { api: string; project: string; headers: Record<string, string>; serviceType: string; name: string; plan: string; log: (m: string) => void; knownPassword?: string }): Promise<ProvisionResult> {
  const { api, project, headers, serviceType, name, plan, log } = a
  for (let i = 0; i < 120; i++) {
    const r = await fetch(`${api}/v1/project/${project}/service/${name}`, { headers })
    if (r.ok) {
      const j: any = await r.json()
      const state = j?.service?.state
      log(`state: ${state}`)
      if (state === 'RUNNING' && j?.service?.service_uri_params?.host) {
        const p = j.service.service_uri_params
        const user = p.user || 'avnadmin'
        let pw = a.knownPassword
        if (pw) {
          log('using the configured connection password…')
        } else {
          pw = randomBytes(18).toString('hex')
          log('setting the connection password…')
          const mod = await fetch(`${api}/v1/project/${project}/service/${name}/user/${user}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ operation: 'reset-credentials', new_password: pw }),
          })
          if (!mod.ok) throw new Error(`Set password failed (${mod.status})`)
          await delay(4000)
        }
        return { type: serviceType, serviceName: name, plan, host: p.host, port: p.port, user, password: pw, uri: buildUri(serviceType, p, pw), simulated: false }
      }
    }
    await delay(5000)
  }
  throw new Error(`Aiven ${serviceType} did not reach RUNNING in time.`)
}
