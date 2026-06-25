// server/provider.ts — the provider seam: "whose Aiven account backs a tenant".
//
// THE SEAM (read this):
//   In the DEMO, every tenant is backed by our ONE Aiven account (project touko-1f1c) and the
//   existing overmind-pg + overmind-kafka services. That account acts as a shared bridge.
//   In PRODUCTION, each founder gets their OWN Aiven account — same code, a different token +
//   project. The InfraProvider interface is the swap point: SharedAccountProvider today,
//   OwnAccountProvider tomorrow. The orchestrator/CTO never learn which one they're talking to.
//
// We keep the abstraction tiny on purpose: ensureTenantStack (give me a backend for this tenant)
// and getMetrics (how's it doing). Everything else (provisioning brand-new services, REST calls)
// lives behind these two so the rest of the app stays provider-agnostic.

import * as rest from '../aiven/rest.ts'
import { AIVEN_PROJECT } from './env.ts'
import { getTenant, ensureDemoTenant } from './tenants.ts'

// ───────────────────────── interface ─────────────────────────

/** The backend Aiven stack handed to a tenant. databaseUrl is ready to feed aiven/pg.ts. */
export interface TenantStack {
  project: string
  pgService: string
  kafkaService: string
  databaseUrl: string
  kafkaBrokers: string
}

/**
 * The swap point. Whichever provider is active, the orchestrator just asks for a tenant's stack
 * and metrics — it never knows (or cares) whose Aiven account is underneath.
 */
export interface InfraProvider {
  ensureTenantStack(tenantId: string): Promise<TenantStack>
  getMetrics(tenantId: string): Promise<any>
}

// ───────────────────────── shared-account provider (the demo) ─────────────────────────

/**
 * Backs every tenant with OUR one Aiven account (AIVEN_TOKEN + AIVEN_PROJECT).
 *  - tenant 'demo' → the EXISTING overmind-pg + overmind-kafka (instant; reuses .env.local creds).
 *  - any other tenant → would provision tenant-prefixed services via aiven/rest.provision.
 *    (Implemented below for completeness; the demo path never calls it.)
 */
export class SharedAccountProvider implements InfraProvider {
  constructor(
    private readonly project: string = AIVEN_PROJECT,
    private readonly cloud: string = 'do-fra'
  ) {}

  async ensureTenantStack(tenantId: string): Promise<TenantStack> {
    // The demo tenant maps to the already-running services. No provisioning, no waiting.
    if (tenantId === 'demo') {
      // Make sure the tenant row exists (idempotent) so the rest of the app can look it up.
      const t = (await getTenant('demo')) ?? (await ensureDemoTenant())
      const pgService = t.pg_service || 'overmind-pg'
      const kafkaService = t.kafka_service || 'overmind-kafka'

      // Demo creds come straight from .env.local — these point at the live overmind services,
      // so we don't hit the REST API at all on the hot path.
      const databaseUrl = process.env.DATABASE_URL
      const kafkaBrokers = process.env.KAFKA_BROKERS
      if (databaseUrl && kafkaBrokers) {
        return { project: this.project, pgService, kafkaService, databaseUrl, kafkaBrokers }
      }
      // Fallback: env not set — resolve creds live from Aiven REST.
      return this.resolveStack(pgService, kafkaService)
    }

    // Brand-new tenant path (NOT used in the demo): provision tenant-prefixed services and wait.
    return this.provisionTenantStack(tenantId)
  }

  async getMetrics(tenantId: string): Promise<any> {
    const stack = await this.ensureTenantStack(tenantId)
    // CPU/mem/disk for the tenant's Postgres — the number the CTO agent reasons over.
    return rest.metrics(this.project, stack.pgService)
  }

  /** Resolve live connection info for already-running services into a TenantStack. */
  private async resolveStack(pgService: string, kafkaService: string): Promise<TenantStack> {
    const pgCi = await rest.connectionInfo(this.project, pgService)
    const databaseUrl = pgCi.uri || ''
    let kafkaBrokers = ''
    try {
      const kCi = await rest.connectionInfo(this.project, kafkaService)
      kafkaBrokers = kCi.kafka?.brokers || ''
    } catch {
      // Kafka may not exist for every tenant; leave brokers empty rather than failing the stack.
    }
    return { project: this.project, pgService, kafkaService, databaseUrl, kafkaBrokers }
  }

  /**
   * Provision a fresh tenant-prefixed PG (+ Kafka) under our shared account and wait for RUNNING.
   * Implemented for completeness — the production path is identical against an OwnAccountProvider,
   * just a different token/project. NOT exercised by the demo.
   */
  private async provisionTenantStack(tenantId: string): Promise<TenantStack> {
    const safe = tenantId.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 24)
    const pgService = `tenant-${safe}-pg`
    const kafkaService = `tenant-${safe}-kafka`

    // pgvector on by default — Overmind migrates embedding/search behaviors.
    await rest.provision(this.project, 'pg', 'startup-4', this.cloud, pgService, {
      pg: { shared_buffers_percentage: 20 },
      pgaudit: {},
      pg_version: '16',
    })
    await rest.provision(this.project, 'kafka', 'startup-2', this.cloud, kafkaService, {
      kafka_rest: true,
    })
    await rest.waitRunning(this.project, pgService)
    await rest.waitRunning(this.project, kafkaService)

    return this.resolveStack(pgService, kafkaService)
  }
}

// ───────────────────────── own-account provider (production, one-line swap) ─────────────────────────

/**
 * PRODUCTION shape: each founder's OWN Aiven account. Same InfraProvider, different token+project.
 * This is the entire delta between demo and prod — swap which provider getProvider() returns
 * (and source the token/project from the tenant record instead of process.env). The orchestrator,
 * CTO agent, and dashboard need zero changes.
 *
 * Stubbed deliberately: the demo runs on SharedAccountProvider, but this proves the seam is real.
 */
export class OwnAccountProvider implements InfraProvider {
  constructor(
    private readonly token: string,
    private readonly project: string,
    private readonly cloud: string = 'do-fra'
  ) {}

  async ensureTenantStack(_tenantId: string): Promise<TenantStack> {
    // Production: provision into the founder's own account using `this.token` / `this.project`.
    // (rest.ts reads AIVEN_TOKEN from env today; the production wiring would pass the per-tenant
    //  token through — a small, mechanical change, not an architectural one.)
    throw new Error(
      'OwnAccountProvider is the production seam — not wired for the demo. ' +
        'Swap getProvider() to return this once per-tenant tokens are stored.'
    )
  }

  async getMetrics(_tenantId: string): Promise<any> {
    throw new Error('OwnAccountProvider.getMetrics — production seam, not wired for the demo.')
  }
}

// ───────────────────────── selection ─────────────────────────

let _provider: InfraProvider | null = null

/**
 * The single place the app asks "who backs tenants?". Demo → SharedAccountProvider (our one
 * account). Prod → return an OwnAccountProvider per founder. Cached so callers share one instance.
 */
export function getProvider(): InfraProvider {
  if (_provider) return _provider
  _provider = new SharedAccountProvider()
  return _provider
}

/** Test/override hook — lets a test swap in OwnAccountProvider without touching getProvider. */
export function setProvider(p: InfraProvider): void {
  _provider = p
}
