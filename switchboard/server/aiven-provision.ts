import 'dotenv/config'

// Generalized Aiven provisioner — the multi-product sibling of aiven.ts.
// aiven.ts hardcodes service_type:'pg'; this creates/reuses ANY Aiven service
// (pg, valkey, mysql, opensearch, kafka, …) using the user's API token, then
// polls to RUNNING and returns the real (non-redacted) connection params. These
// are the same REST calls the Aiven MCP makes, so the driver can run headless.

const API = process.env.AIVEN_API_URL || 'https://api.aiven.io'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
type Log = (m: string) => void

export type AivenService = {
  serviceName: string
  serviceType: string
  uri: string // full connection URI incl. credentials (from REST — not redacted)
  host: string
  port: string
  params: Record<string, string>
  plan: string
  cloud: string
  state: string
  reused: boolean
}

function headers(token: string) {
  return { authorization: `aivenv1 ${token}`, 'content-type': 'application/json' }
}

async function getService(token: string, project: string, name: string): Promise<any | null> {
  const r = await fetch(`${API}/v1/project/${project}/service/${name}`, { headers: headers(token) })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Aiven get ${name} (${r.status}): ${(await r.text()).slice(0, 200)}`)
  return (await r.json()).service
}

// Create the service if missing (power it on if it's off), then poll to RUNNING.
export async function ensureService(opts: {
  token?: string
  project?: string
  name: string
  serviceType: string
  plan: string
  cloud: string
  userConfig?: Record<string, unknown>
  onLog?: Log
}): Promise<AivenService> {
  const token = opts.token || process.env.AIVEN_TOKEN
  if (!token) throw new Error('AIVEN_TOKEN not set')
  const project = opts.project || process.env.AIVEN_PROJECT
  if (!project) throw new Error('AIVEN_PROJECT not set')
  const log = opts.onLog || (() => {})
  const { name, serviceType, plan, cloud } = opts

  let svc = await getService(token, project, name)
  const reused = Boolean(svc)
  if (!svc) {
    log(`creating ${serviceType} "${name}" (${plan}, ${cloud})…`)
    const r = await fetch(`${API}/v1/project/${project}/service`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ service_name: name, service_type: serviceType, plan, cloud, user_config: opts.userConfig || {} }),
    })
    if (!r.ok && r.status !== 409) throw new Error(`Aiven create ${name} (${r.status}): ${(await r.text()).slice(0, 200)}`)
  } else if (svc.state === 'POWEROFF') {
    log(`powering on "${name}"…`)
    await fetch(`${API}/v1/project/${project}/service/${name}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({ powered: true }),
    })
  } else {
    log(`reusing ${serviceType} "${name}" (${svc.state})`)
  }

  // Poll to RUNNING (free services build for a few minutes).
  for (let i = 0; i < 150; i++) {
    svc = await getService(token, project, name)
    if (svc?.state === 'RUNNING' && svc.service_uri) break
    if (i % 4 === 0) log(`${name}: ${svc?.state}…`)
    await delay(5000)
  }
  if (svc?.state !== 'RUNNING') throw new Error(`${name} did not reach RUNNING in time`)

  const p = svc.service_uri_params || {}
  return {
    serviceName: name,
    serviceType,
    uri: svc.service_uri,
    host: p.host || '',
    port: String(p.port || ''),
    params: p,
    plan: svc.plan,
    cloud: svc.cloud_name,
    state: svc.state,
    reused,
  }
}

// Reset a service user's password to a known value. The restricted AIVEN_TOKEN
// returns "<redacted>" on read, so for services we didn't get creds for elsewhere
// we set a password we choose (a write op the token IS allowed to do).
export async function resetServiceUserPassword(opts: {
  token?: string
  project?: string
  service: string
  username: string
  newPassword: string
  onLog?: Log
}): Promise<boolean> {
  const token = opts.token || process.env.AIVEN_TOKEN
  const project = opts.project || process.env.AIVEN_PROJECT
  if (!token || !project) return false
  const r = await fetch(`${API}/v1/project/${project}/service/${opts.service}/user/${opts.username}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ operation: 'reset-credentials', new_password: opts.newPassword }),
  })
  if (!r.ok) opts.onLog?.(`reset ${opts.service}/${opts.username} failed (${r.status})`)
  return r.ok
}
