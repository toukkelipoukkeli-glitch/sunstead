import 'dotenv/config'

// Render deploy driver — the compute half of "whole stack on Aiven". Aiven Apps
// is Limited-Availability (the `application` service type 403s on this account),
// so the migrated, Aiven-wired container is deployed to Render (an AWS-backed
// host) while every data service stays on Aiven. Same REST-with-a-token shape as
// aiven-provision.ts: create from a public repo's Dockerfile, poll to live, return
// the URL. Swap this file for aiven_application_deploy the day Apps opens up.

const API = process.env.RENDER_API_URL || 'https://api.render.com'
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
type Log = (m: string) => void

// Render renamed serviceDetails.env -> serviceDetails.runtime. Both are kept here
// as constants so a single edit fixes the call if an account is on the old shape;
// the raw API error (logged below) tells you which one to use.
const RUNTIME_FIELD = 'runtime'
const DOCKER_RUNTIME = 'docker' // build from the repo's Dockerfile (not a prebuilt image)

export type RenderEnvVar = { key: string; value: string }

export type RenderDeployResult = {
  url: string
  serviceId: string
  dashboardUrl: string
  status: string
  simulated: boolean
}

function headers(token: string) {
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json' }
}

async function resolveOwnerId(token: string): Promise<string> {
  if (process.env.RENDER_OWNER_ID) return process.env.RENDER_OWNER_ID
  const r = await fetch(`${API}/v1/owners?limit=1`, { headers: headers(token) })
  if (!r.ok) throw new Error(`Render owners list failed (${r.status}): ${(await r.text()).slice(0, 160)}`)
  const arr: any = await r.json()
  const id = arr?.[0]?.owner?.id
  if (!id) throw new Error('No Render owner/workspace found for this API key.')
  return id
}

// Create a Render web service that builds the repo's Dockerfile, injecting the
// Aiven connection env vars, then poll its deploy to "live". Returns the URL.
export async function deployToRender(opts: {
  repoUrl: string
  branch?: string
  name: string
  envVars?: RenderEnvVar[]
  region?: string
  plan?: string
  dockerfilePath?: string
  dockerContext?: string
  token?: string
  onLog?: Log
}): Promise<RenderDeployResult> {
  const token = opts.token || process.env.RENDER_API_KEY
  const log = opts.onLog || (() => {})
  const branch = opts.branch || 'main'
  const name = sanitizeName(opts.name)

  if (!token) {
    await delay(400)
    log('RENDER_API_KEY not set — simulating the deploy (no service created).')
    return { url: `https://${name}.onrender.com`, serviceId: 'srv-simulated', dashboardUrl: 'https://dashboard.render.com', status: 'simulated', simulated: true }
  }

  const ownerId = await resolveOwnerId(token)
  const serviceDetails: any = {
    [RUNTIME_FIELD]: DOCKER_RUNTIME,
    plan: opts.plan || 'free',
    region: opts.region || 'oregon',
    envSpecificDetails: { dockerfilePath: opts.dockerfilePath || './Dockerfile', dockerContext: opts.dockerContext || '.' },
  }
  const body = {
    type: 'web_service',
    name,
    ownerId,
    repo: opts.repoUrl.replace(/\.git$/, ''),
    branch,
    autoDeploy: 'yes',
    serviceDetails,
    envVars: opts.envVars || [],
  }

  log(`creating Render web service "${name}" from ${body.repo}@${branch} (Docker, ${serviceDetails.plan}, ${serviceDetails.region})…`)
  const r = await fetch(`${API}/v1/services`, { method: 'POST', headers: headers(token), body: JSON.stringify(body) })
  if (!r.ok) {
    // Surface the exact request + Render's reason so a field mismatch (e.g. runtime
    // vs env on an older account) is a one-line fix, not a guessing game.
    const txt = await r.text()
    throw new Error(`Render create failed (${r.status}): ${txt.slice(0, 240)}\n  sent serviceDetails: ${JSON.stringify(serviceDetails)}`)
  }
  const created: any = await r.json()
  const service = created?.service || created
  const serviceId: string = service?.id
  if (!serviceId) throw new Error(`Render created a service but returned no id: ${JSON.stringify(created).slice(0, 200)}`)
  const dashboardUrl = service?.dashboardUrl || `https://dashboard.render.com/web/${serviceId}`
  let url: string = service?.serviceDetails?.url || ''
  log(`service ${serviceId} created — building the image…`)

  // Poll the latest deploy to a terminal state. Free-tier image builds take a few
  // minutes; statuses go created -> build_in_progress -> live (or *_failed).
  let status = 'created'
  for (let i = 0; i < 120; i++) {
    await delay(5000)
    const dr = await fetch(`${API}/v1/services/${serviceId}/deploys?limit=1`, { headers: headers(token) })
    if (!dr.ok) continue
    const deploys: any = await dr.json()
    const d = deploys?.[0]?.deploy
    status = d?.status || status
    if (i % 3 === 0) log(`deploy status: ${status}`)
    if (status === 'live') break
    if (/failed|canceled|deactivated/.test(status)) throw new Error(`Render deploy ended as "${status}" — check build logs at ${dashboardUrl}`)
  }
  if (status !== 'live') log(`still ${status} after the poll window — it may go live shortly; watch ${dashboardUrl}`)

  if (!url) {
    // Backfill the public URL from the service record if the create response omitted it.
    const sr = await fetch(`${API}/v1/services/${serviceId}`, { headers: headers(token) })
    if (sr.ok) { const s: any = await sr.json(); url = (s?.service || s)?.serviceDetails?.url || '' }
  }
  url = url || `https://${name}.onrender.com`
  log(`live → ${url}`)
  return { url, serviceId, dashboardUrl, status, simulated: false }
}

// Render service names: lowercase letters, numbers and dashes; keep it tidy.
function sanitizeName(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  return s || 'vibe-deploy-app'
}
