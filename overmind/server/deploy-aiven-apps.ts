// server/deploy-aiven-apps.ts — the "100% on Aiven" finale.
//
// Deploys a tenant's GENERATED backend (the Surgeon's Aiven-native replacement for Supabase) to
// Aiven Apps, wiring the tenant's Postgres + Kafka as `service_integrations` so DATABASE_URL and the
// KAFKA_* / PROJECT_CA_CERT env vars are injected at runtime. App on Aiven, data on Aiven PG,
// realtime on Aiven Kafka — nothing left on Supabase, and the founder never opens a dashboard.
//
// Aiven Apps (the `application` service type + repo-build pipeline) is Limited Availability. On THIS
// demo account the `application` service type is NOT enabled and there is no GitHub VCS integration
// connected, so a real deploy can't complete here. This module is built to do the real thing when
// the account is enabled, and to degrade to {status:'pending'} otherwise — it NEVER crashes the
// pipeline. The orchestrator can call it at the `cutover` phase and surface the result in the UI.
//
// Owned file. Does not edit server/index.ts. Talks to Aiven only through aiven/rest.ts.

import { AivenError } from '../aiven/rest.ts'
import * as rest from '../aiven/rest.ts'

const BASE = 'https://api.aiven.io/v1'

// ───────────────────────── public types ─────────────────────────

export type DeployStatus = 'deployed' | 'pending' | 'error'

export interface DeployOpts {
  /** The tenant whose pg + kafka get wired in. For this demo every tenant shares touko-1f1c. */
  tenantId: string
  /** Git repo of the generated backend (the Surgeon's output, pushed to GitHub). */
  repoUrl: string
  /** Branch to build from. */
  branch: string
  /** Path within the repo where the Dockerfile lives (deploy/Dockerfile lives at this path). */
  buildPath: string
  /** Override the Aiven project (defaults to AIVEN_PROJECT / touko-1f1c — the demo bridge account). */
  project?: string
  /** Override the app service name (defaults to a slug derived from tenantId). */
  appName?: string
  /** Override the pg service to wire (defaults to overmind-pg). */
  pgService?: string
  /** Override the kafka service to wire (defaults to overmind-kafka). */
  kafkaService?: string
  /** Port the generated server binds (must match the Dockerfile EXPOSE). Defaults to 8788. */
  port?: number
  /** Cloud region for the app. Defaults to the pg service's cloud, then do-fra. */
  cloud?: string
}

export interface DeployResult {
  status: DeployStatus
  /** Human-readable explanation — surfaced verbatim in the Mission Control cutover panel. */
  detail: string
  /** Public URL of the deployed app, when status === 'deployed'. */
  url?: string
}

// ───────────────────────── helpers ─────────────────────────

function project(opts: DeployOpts): string {
  return opts.project || process.env.AIVEN_PROJECT || 'touko-1f1c'
}

/** A DNS-safe app service name: lowercase, dashes only, length-capped, never empty. */
function appName(opts: DeployOpts): string {
  if (opts.appName) return opts.appName
  const slug = (opts.tenantId || 'tenant')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'tenant'
  return `overmind-app-${slug}`
}

function token(): string | null {
  return process.env.AIVEN_TOKEN || null
}

/** Bare REST helper (the rest.ts request() is private) — only used for the Apps-specific endpoints
 *  rest.ts doesn't expose. Mirrors its auth + error shape so callers see a uniform AivenError. */
async function api<T = any>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const t = token()
  if (!t) throw new AivenError('AIVEN_TOKEN not set', 0)
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method || 'GET',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body != null ? JSON.stringify(init.body) : undefined,
    })
  } catch (e: any) {
    throw new AivenError(`network error calling ${init.method || 'GET'} ${path}: ${e?.message ?? e}`, 0)
  }
  const text = await res.text()
  let json: any
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
  }
  if (!res.ok) {
    const msg = (json && (json.message || json.errors?.[0]?.message)) || `${init.method || 'GET'} ${path} → HTTP ${res.status}`
    throw new AivenError(msg, res.status, json)
  }
  return json as T
}

/**
 * Probe whether Aiven Apps is enabled for this account by asking for the `application` service
 * type's plans. A 403 ("Service type unavailable") or any non-2xx ⇒ Apps is NOT available here.
 * Read-only; never throws — returns a typed reason instead.
 */
export async function appsAvailable(
  proj: string,
): Promise<{ available: boolean; reason: string; plans?: string[] }> {
  if (!token()) return { available: false, reason: 'AIVEN_TOKEN not set' }
  try {
    const r = await api<{ service_plans?: Array<{ service_plan: string }> }>(
      `/project/${encodeURIComponent(proj)}/service-types/application/plans`,
    )
    const plans = (r?.service_plans ?? []).map((p) => p.service_plan)
    return { available: true, reason: 'Aiven Apps enabled', plans }
  } catch (e) {
    if (e instanceof AivenError) {
      if (e.status === 403) {
        return { available: false, reason: 'Aiven Apps LA access pending (application service type unavailable for this account)' }
      }
      return { available: false, reason: `Aiven Apps probe failed: ${e.message}` }
    }
    return { available: false, reason: 'Aiven Apps probe failed (unknown error)' }
  }
}

/**
 * Check for a connected GitHub VCS integration — required so Aiven Apps can pull the repo.
 * Read-only; never throws. (For a public repo Aiven can sometimes build without one, but the
 * presence of an integration is the reliable signal that the repo path is wired.)
 */
async function vcsIntegrations(
  proj: string,
): Promise<{ ok: boolean; reason: string; integrations: Array<{ id: string; account: string }> }> {
  try {
    // Resolve org from the project, then list its VCS integrations.
    const p = await api<{ project?: { organization_id?: string }; organization_id?: string }>(
      `/project/${encodeURIComponent(proj)}`,
    )
    const orgId = p?.project?.organization_id || p?.organization_id
    if (!orgId) return { ok: false, reason: 'could not resolve organization for project', integrations: [] }
    const r = await api<{ vcs_integrations?: any[] }>(
      `/organization/${encodeURIComponent(orgId)}/vcs`,
    )
    const list = (r?.vcs_integrations ?? []).map((v: any) => ({
      id: String(v.vcs_integration_id ?? v.id ?? ''),
      account: String(v.vcs_account_name ?? v.account ?? ''),
    }))
    return {
      ok: list.length > 0,
      reason: list.length ? `${list.length} VCS integration(s) connected` : 'no GitHub VCS integration connected',
      integrations: list,
    }
  } catch (e) {
    const msg = e instanceof AivenError ? e.message : 'VCS integration probe failed'
    return { ok: false, reason: msg, integrations: [] }
  }
}

/** Confirm a service exists and is RUNNING. Returns its cloud_name when found. */
async function runningService(
  proj: string,
  name: string,
): Promise<{ running: boolean; cloud?: string; reason: string }> {
  try {
    const svc = await rest.getService(proj, name)
    const running = (svc.state || '').toUpperCase() === 'RUNNING'
    return {
      running,
      cloud: svc.cloud_name,
      reason: running ? 'RUNNING' : `state=${svc.state}`,
    }
  } catch (e) {
    if (e instanceof AivenError && e.status === 404) return { running: false, reason: 'not found' }
    return { running: false, reason: e instanceof AivenError ? e.message : 'lookup failed' }
  }
}

// ───────────────────────── main entry ─────────────────────────

/**
 * Deploy the tenant's generated backend to Aiven Apps.
 *
 * Sequence:
 *   1. Probe Aiven Apps availability (application service type). If unavailable → {pending}.
 *   2. Confirm the tenant's pg + kafka are RUNNING (so service_integrations can wire them).
 *   3. Confirm a GitHub VCS integration exists (so Aiven can pull the repo). If not → {pending}.
 *   4. Create the application service with pg + kafka as service_integrations and the repo build
 *      config, so DATABASE_URL + PROJECT_CA_CERT + KAFKA_* land in the container env.
 *
 * Returns {deployed,url} on success, {pending,detail} when Apps/VCS isn't enabled (the expected
 * state on this demo account), {error,detail} only for an unexpected hard failure. NEVER throws.
 */
export async function deployToAivenApps(opts: DeployOpts): Promise<DeployResult> {
  try {
    if (!opts?.repoUrl) return { status: 'error', detail: 'repoUrl is required' }
    const proj = project(opts)
    const name = appName(opts)
    const pgService = opts.pgService || 'overmind-pg'
    const kafkaService = opts.kafkaService || 'overmind-kafka'
    const port = opts.port || 8788

    // 1) Is Aiven Apps even enabled here?
    const apps = await appsAvailable(proj)
    if (!apps.available) {
      return { status: 'pending', detail: apps.reason }
    }

    // 2) Are the data services RUNNING so we can wire them in?
    const [pg, kafka] = await Promise.all([
      runningService(proj, pgService),
      runningService(proj, kafkaService),
    ])
    if (!pg.running) {
      return { status: 'pending', detail: `Aiven Apps enabled, but pg service "${pgService}" is not RUNNING (${pg.reason}) — cannot wire DATABASE_URL` }
    }
    if (!kafka.running) {
      return { status: 'pending', detail: `Aiven Apps enabled, but kafka service "${kafkaService}" is not RUNNING (${kafka.reason}) — cannot wire KAFKA_*` }
    }

    // 3) Is a GitHub VCS integration connected so Aiven can pull the repo?
    const vcs = await vcsIntegrations(proj)
    if (!vcs.ok) {
      return { status: 'pending', detail: `Aiven Apps enabled, but ${vcs.reason} — connect a GitHub account in the Aiven console to deploy ${opts.repoUrl}` }
    }

    // 4) Real deploy. Create the application service with the repo build + service integrations.
    //    The env_key names match what the generated server reads (see deploy/Dockerfile header):
    //    DATABASE_URL (+ PROJECT_CA_CERT auto-injected) and KAFKA_BROKERS/USERNAME/PASSWORD.
    const cloud = opts.cloud || pg.cloud || 'do-fra'
    const body = {
      service_name: name,
      service_type: 'application',
      cloud,
      plan: 'startup-50-1024',
      user_config: {
        application: {
          repository_url: opts.repoUrl,
          branch: opts.branch || 'main',
          build_path: opts.buildPath || 'deploy',
          port,
          vcs_integration_id: vcs.integrations[0]?.id,
        },
      },
      service_integrations: [
        { integration_type: 'application_pg', source_service: pgService, env_key: 'DATABASE_URL' },
        {
          integration_type: 'application_kafka',
          source_service: kafkaService,
          bootstrap_servers_env: 'KAFKA_BROKERS',
          username_env: 'KAFKA_USERNAME',
          password_env: 'KAFKA_PASSWORD',
        },
      ],
    }

    let created: any
    try {
      created = await api<{ service?: any }>(
        `/project/${encodeURIComponent(proj)}/service`,
        { method: 'POST', body },
      )
    } catch (e) {
      // The Apps API can reject the exact body shape even when the service type is enabled (LA
      // surface still shifting). Treat a 4xx as pending (config/access), a 5xx/other as error.
      if (e instanceof AivenError) {
        if (e.status >= 400 && e.status < 500) {
          return { status: 'pending', detail: `Aiven Apps deploy rejected (HTTP ${e.status}): ${e.message}` }
        }
        return { status: 'error', detail: `Aiven Apps deploy failed (HTTP ${e.status}): ${e.message}` }
      }
      return { status: 'error', detail: 'Aiven Apps deploy failed (unknown error)' }
    }

    // The build/run is async; surface the service URL if Aiven returned one yet.
    const svc = created?.service ?? {}
    const url: string | undefined =
      svc.service_uri ||
      svc.components?.find((c: any) => c.component === 'http' || c.usage === 'primary')?.host
    return {
      status: 'deployed',
      detail: `Aiven Apps service "${name}" created in ${proj} (${cloud}); building ${opts.repoUrl}@${opts.branch} with pg+kafka wired`,
      url: url ? (url.startsWith('http') ? url : `https://${url}`) : undefined,
    }
  } catch (e) {
    // Absolute backstop — this function must never throw into the orchestrator.
    return {
      status: 'pending',
      detail: `Aiven Apps deploy could not run: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
}

/**
 * Feasibility report — what the orchestrator/UI can show without attempting a deploy.
 * Pure read-only probes; never throws. Use this to render the cutover panel's "Aiven Apps" state.
 */
export async function aivenAppsFeasibility(
  opts?: Partial<DeployOpts>,
): Promise<{
  available: boolean
  appsReason: string
  appsPlans?: string[]
  vcsReason: string
  pgRunning: boolean
  kafkaRunning: boolean
  summary: string
}> {
  const proj = opts?.project || process.env.AIVEN_PROJECT || 'touko-1f1c'
  const pgService = opts?.pgService || 'overmind-pg'
  const kafkaService = opts?.kafkaService || 'overmind-kafka'
  const [apps, vcs, pg, kafka] = await Promise.all([
    appsAvailable(proj),
    vcsIntegrations(proj),
    runningService(proj, pgService),
    runningService(proj, kafkaService),
  ])
  const summary = apps.available
    ? vcs.ok
      ? 'Aiven Apps ready — deploy can proceed'
      : `Aiven Apps enabled but ${vcs.reason}`
    : apps.reason
  return {
    available: apps.available && vcs.ok && pg.running && kafka.running,
    appsReason: apps.reason,
    appsPlans: apps.plans,
    vcsReason: vcs.reason,
    pgRunning: pg.running,
    kafkaRunning: kafka.running,
    summary,
  }
}
