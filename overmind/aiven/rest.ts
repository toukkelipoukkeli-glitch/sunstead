// aiven/rest.ts — deterministic Aiven REST client (the reliable path under the swarm).
// fetch-based, typed, defensive. Uses AIVEN_TOKEN + base https://api.aiven.io/v1.
// Every export degrades gracefully: missing token → a clear AivenError, never a top-level throw.

const BASE = 'https://api.aiven.io/v1'

export class AivenError extends Error {
  status: number
  body?: unknown
  constructor(message: string, status = 0, body?: unknown) {
    super(message)
    this.name = 'AivenError'
    this.status = status
    this.body = body
  }
}

// ───────────────────────── core request ─────────────────────────

function token(): string {
  const t = process.env.AIVEN_TOKEN
  if (!t) throw new AivenError('AIVEN_TOKEN not set', 0)
  return t
}

interface RequestOpts {
  method?: string
  body?: unknown
  // allow callers to tolerate a 404 (e.g. getService on a not-yet-created service)
  query?: Record<string, string | undefined>
}

async function request<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, query } = opts
  let url = `${BASE}${path}`
  if (query) {
    const qs = Object.entries(query)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) url += `?${qs}`
  }

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token()}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body != null ? JSON.stringify(body) : undefined,
    })
  } catch (e: any) {
    throw new AivenError(`network error calling ${method} ${path}: ${e?.message ?? e}`, 0)
  }

  const text = await res.text()
  let json: any = undefined
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = text
    }
  }

  if (!res.ok) {
    const msg =
      (json && (json.message || json.errors?.[0]?.message)) ||
      `${method} ${path} → HTTP ${res.status}`
    throw new AivenError(msg, res.status, json)
  }
  return json as T
}

// ───────────────────────── typed shapes (loose; Aiven payloads are wide) ─────────────────────────

export interface AivenService {
  service_name: string
  service_type: string
  state: string // RUNNING | REBUILDING | POWEROFF | ...
  plan: string
  cloud_name?: string
  service_uri?: string
  service_uri_params?: Record<string, any>
  connection_info?: Record<string, any>
  components?: Array<{
    component: string
    host: string
    port: number
    usage?: string
    kafka_authentication_method?: string
  }>
  metadata?: Record<string, any>
  [k: string]: any
}

export interface ConnectionInfo {
  uri?: string
  host?: string
  port?: number
  user?: string
  password?: string
  dbname?: string
  kafka?: {
    brokers?: string
    host?: string
    port?: number
    username?: string
    password?: string
    saslMechanism?: string
    ssl?: boolean
  }
}

export interface PlanPricing {
  serviceType: string
  plan: string
  cloud: string
  pricePerHourUsd?: number
  pricePerMonthUsd?: number
  currency?: string
  raw?: unknown
}

// ───────────────────────── operations ─────────────────────────

/** List all services in a project. */
export async function listServices(project: string): Promise<AivenService[]> {
  const r = await request<{ services: AivenService[] }>(
    `/project/${encodeURIComponent(project)}/service`
  )
  return r?.services ?? []
}

/** Get one service (full detail incl. components + connection_info). */
export async function getService(project: string, name: string): Promise<AivenService> {
  const r = await request<{ service: AivenService }>(
    `/project/${encodeURIComponent(project)}/service/${encodeURIComponent(name)}`
  )
  return r.service
}

/**
 * Provision a service. serviceType e.g. 'pg' | 'kafka'. plan e.g. 'hobbyist' | 'startup-2'.
 * cloud e.g. 'google-europe-north1'. userConfig is the Aiven user_config blob (e.g. pg version,
 * enabling pgvector via extensions, kafka rest/connect flags).
 */
export async function provision(
  project: string,
  serviceType: string,
  plan: string,
  cloud: string,
  name: string,
  userConfig?: Record<string, any>
): Promise<AivenService> {
  const body: Record<string, any> = {
    service_name: name,
    service_type: serviceType,
    plan,
    cloud: cloud,
  }
  if (userConfig && Object.keys(userConfig).length) body.user_config = userConfig
  const r = await request<{ service: AivenService }>(
    `/project/${encodeURIComponent(project)}/service`,
    { method: 'POST', body }
  )
  return r.service
}

/**
 * Connection info for a service. Returns flattened pg fields and, for kafka, a nested kafka object.
 * Pulls from service_uri_params + components, which is where Aiven exposes live creds.
 */
export async function connectionInfo(project: string, name: string): Promise<ConnectionInfo> {
  const svc = await getService(project, name)
  const params = svc.service_uri_params ?? {}
  const ci = svc.connection_info ?? {}
  const components = svc.components ?? []

  const out: ConnectionInfo = {
    uri: svc.service_uri,
    host: params.host,
    port: params.port != null ? Number(params.port) : undefined,
    user: params.user,
    password: params.password,
    dbname: params.dbname,
  }

  const type = (svc.service_type || '').toLowerCase()
  if (type === 'kafka' || components.some((c) => c.component === 'kafka')) {
    // Aiven exposes kafka brokers in connection_info.kafka (array of host:port) and components.
    const kafkaComp = components.filter((c) => c.component === 'kafka')
    let brokers: string | undefined
    if (Array.isArray(ci.kafka) && ci.kafka.length) {
      brokers = ci.kafka.join(',')
    } else if (kafkaComp.length) {
      brokers = kafkaComp.map((c) => `${c.host}:${c.port}`).join(',')
    } else if (svc.service_uri) {
      brokers = svc.service_uri
    }
    const first = kafkaComp[0]
    out.kafka = {
      brokers,
      host: first?.host ?? params.host,
      port: first?.port != null ? Number(first.port) : params.port != null ? Number(params.port) : undefined,
      username: params.user ?? 'avnadmin',
      password: params.password,
      saslMechanism: 'scram-sha-256',
      ssl: true,
    }
  }

  return out
}

/**
 * Poll until the service state is RUNNING (or timeout). Returns the running service.
 * Defensive: swallows transient errors during polling, throws AivenError on timeout.
 */
export async function waitRunning(
  project: string,
  name: string,
  timeoutMs = 10 * 60 * 1000
): Promise<AivenService> {
  const start = Date.now()
  const intervalMs = 5000
  let last: AivenService | undefined
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      last = await getService(project, name)
      if ((last.state || '').toUpperCase() === 'RUNNING') return last
    } catch (e) {
      // tolerate transient 5xx / network blips while the service is being created
      if (e instanceof AivenError && e.status && e.status >= 400 && e.status < 500 && e.status !== 404) {
        throw e
      }
    }
    if (Date.now() - start > timeoutMs) {
      throw new AivenError(
        `timed out waiting for ${name} to reach RUNNING (last state: ${last?.state ?? 'unknown'})`,
        0
      )
    }
    await sleep(intervalMs)
  }
}

/** Fetch service metrics (Aiven returns a Grafana-style dashboard payload; we pass it through). */
export async function metrics(project: string, name: string): Promise<any> {
  // POST /metrics/fetch with a period; default to 'hour'. Wrapped so callers get something usable.
  try {
    const r = await request<any>(
      `/project/${encodeURIComponent(project)}/service/${encodeURIComponent(name)}/metrics`,
      { method: 'POST', body: { period: 'hour' } }
    )
    return r?.metrics ?? r
  } catch (e) {
    if (e instanceof AivenError) return { error: e.message, status: e.status }
    throw e
  }
}

export interface ResourceMetrics {
  cpuPct: number | null
  memPct: number | null
  diskPct: number | null
}

/**
 * Tolerantly extract the latest CPU / memory / disk percentage from the Grafana-style payload
 * `metrics()` returns. Aiven shapes each metric as
 *   { <metric_name>: { data: { cols: [...], rows: [[header],[Date(...), value], ...] } } }
 * where the last data row's last numeric column is the most recent reading. All three are already
 * percentages on Aiven PG. This searches defensively across known key aliases and returns null for
 * anything it can't pin to a finite number — never throws.
 */
export function parseResourceMetrics(payload: any): ResourceMetrics {
  return {
    cpuPct: latestMetricValue(payload, ['cpu_usage', 'cpu', 'cpuUsage']),
    memPct: latestMetricValue(payload, ['mem_usage', 'memory_usage', 'mem', 'memory']),
    diskPct: latestMetricValue(payload, ['disk_usage', 'diskspace_used_percent', 'disk']),
  }
}

/** Pull the most recent finite number for one metric (trying several key aliases). */
function latestMetricValue(payload: any, keys: string[]): number | null {
  if (!payload || typeof payload !== 'object') return null
  for (const key of keys) {
    const block = payload[key]
    if (!block) continue
    // Standard shape: block.data.rows = [[header], [tsString, value], ...].
    const rows: any[] | undefined = block?.data?.rows ?? block?.rows
    if (Array.isArray(rows)) {
      // Walk backwards: the freshest data row is last; skip header rows (cells are label objects).
      for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i]
        if (!Array.isArray(row)) continue
        // A header row's cells are { label, type } objects; a data row has a Date string + numbers.
        const n = lastFiniteNumber(row)
        if (n != null) return n
      }
    }
    // Fallback: a bare numeric/stringy value directly on the block.
    const direct = toFiniteNumber(block)
    if (direct != null) return direct
  }
  return null
}

function lastFiniteNumber(row: any[]): number | null {
  for (let j = row.length - 1; j >= 0; j--) {
    const n = toFiniteNumber(row[j])
    if (n != null) return n
  }
  return null
}

function toFiniteNumber(v: any): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return null
}

/**
 * Pricing for a (serviceType, plan, cloud). Aiven exposes plans under the service type list;
 * we resolve the matching plan in the given cloud and normalize to per-hour / per-month USD.
 */
export async function planPricing(
  project: string,
  serviceType: string,
  plan: string,
  cloud: string
): Promise<PlanPricing> {
  const empty: PlanPricing = { serviceType, plan, cloud }
  try {
    const r = await request<{ service_plans?: any[] }>(
      `/project/${encodeURIComponent(project)}/service_types`
    )
    // service_types may be a map keyed by type; fall back to a flat plans query.
    const types: any = (r as any)?.service_types ?? r
    const typeBlock = types?.[serviceType]
    const plans: any[] = typeBlock?.service_plans ?? (r as any)?.service_plans ?? []
    const match =
      plans.find((p) => p.service_plan === plan && (!p.cloud_name || p.cloud_name === cloud)) ??
      plans.find((p) => p.service_plan === plan)
    if (!match) return empty
    const hourly =
      match.regions?.[cloud]?.price_usd != null
        ? Number(match.regions[cloud].price_usd)
        : match.price_usd != null
        ? Number(match.price_usd)
        : undefined
    return {
      serviceType,
      plan,
      cloud,
      pricePerHourUsd: hourly,
      pricePerMonthUsd: hourly != null ? Number((hourly * 730).toFixed(2)) : undefined,
      currency: 'USD',
      raw: match,
    }
  } catch (e) {
    if (e instanceof AivenError) return { ...empty, raw: { error: e.message } }
    throw e
  }
}

// ───────────────────────── util ─────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
