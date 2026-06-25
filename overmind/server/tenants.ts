// server/tenants.ts — the multi-tenant store, persisted in overmind-pg.
//
// A "tenant" is one founder's app (human-owned via WorkOS, or agent-owned via auth.md
// self-registration). Each row records which Aiven services back that tenant. In the DEMO every
// row points at the SAME overmind-pg / overmind-kafka (our shared bridge account); in PRODUCTION
// each row would carry the founder's own services. The provider seam (server/provider.ts) reads
// pg_service / kafka_service from here, so swapping accounts is a data change, not a code change.
//
// The table lives in overmind-pg itself (the same DB it tracks) — convenient and self-bootstrapping
// for the demo. We create it lazily on first use via aiven/pg.ts (a direct pg connection, so
// gen_random_uuid()/DDL is fine — unlike the MCP write path which blocks some DDL).

import { q, q1 } from '../aiven/pg.ts'

// ───────────────────────── types ─────────────────────────

export type TenantKind = 'human' | 'agent'
export type TenantStatus = 'active' | 'suspended' | 'migrating'

export interface Tenant {
  id: string
  name: string
  email: string
  kind: TenantKind
  pg_service: string
  kafka_service: string
  status: string
  created_at: string
}

// All tenants share overmind-pg as their control-plane store, regardless of which services back
// their data plane. That's the demo's shared-account bridge.
function controlDb(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('tenants: DATABASE_URL not set (control-plane overmind-pg)')
  return url
}

// ───────────────────────── schema bootstrap (idempotent) ─────────────────────────

let _ready: Promise<void> | null = null

/** Create the tenants table on first use. Cached so concurrent callers run the DDL once. */
function ensureSchema(): Promise<void> {
  if (_ready) return _ready
  _ready = (async () => {
    await q(
      controlDb(),
      `create table if not exists tenants (
         id uuid primary key default gen_random_uuid(),
         name text,
         email text,
         kind text check (kind in ('human','agent')),
         pg_service text,
         kafka_service text,
         status text default 'active',
         created_at timestamptz default now()
       )`
    )
    // A tenant's email is its natural key (one app per signup); enforce it so getTenantByEmail
    // and upserts are unambiguous. Partial: only when an email is present.
    await q(
      controlDb(),
      `create unique index if not exists tenants_email_key
         on tenants (lower(email)) where email is not null`
    )
  })().catch((e) => {
    // Reset so a later call can retry rather than caching a rejected promise forever.
    _ready = null
    throw e
  })
  return _ready
}

// ───────────────────────── CRUD ─────────────────────────

export interface CreateTenantInput {
  name: string
  email: string
  kind: TenantKind
  pgService?: string
  kafkaService?: string
}

/** Create a tenant. If one already exists for the email, returns it (idempotent on email). */
export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  await ensureSchema()
  const existing = await getTenantByEmail(input.email)
  if (existing) return existing
  const row = await q1<Tenant>(
    controlDb(),
    `insert into tenants (name, email, kind, pg_service, kafka_service)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      input.name,
      input.email,
      input.kind,
      input.pgService ?? null,
      input.kafkaService ?? null,
    ]
  )
  return row as Tenant
}

/** Look up a tenant by id (uuid) OR by the literal string 'demo' for the demo tenant. */
export async function getTenant(idOrDemo: string): Promise<Tenant | null> {
  await ensureSchema()
  if (idOrDemo === 'demo') {
    // The demo tenant is identified by name, not a uuid the caller has to know.
    return q1<Tenant>(controlDb(), `select * from tenants where name = 'demo' limit 1`)
  }
  // Guard: only query by id when it looks like a uuid, else pg throws on a bad cast.
  if (!/^[0-9a-f-]{36}$/i.test(idOrDemo)) return null
  return q1<Tenant>(controlDb(), `select * from tenants where id = $1`, [idOrDemo])
}

/** Look up a tenant by email (case-insensitive). */
export async function getTenantByEmail(email: string): Promise<Tenant | null> {
  await ensureSchema()
  if (!email) return null
  return q1<Tenant>(controlDb(), `select * from tenants where lower(email) = lower($1)`, [email])
}

/** List all tenants, newest first. */
export async function listTenants(): Promise<Tenant[]> {
  await ensureSchema()
  return q<Tenant>(controlDb(), `select * from tenants order by created_at desc`)
}

/** Update a tenant's status (active | suspended | migrating). Returns the updated row. */
export async function setTenantStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
  await ensureSchema()
  return q1<Tenant>(
    controlDb(),
    `update tenants set status = $2 where id = $1 returning *`,
    [id, status]
  )
}

// ───────────────────────── demo tenant ─────────────────────────

/**
 * Upsert the 'demo' tenant → the existing overmind-pg / overmind-kafka services. Idempotent:
 * safe to call on every boot. This is the row the SharedAccountProvider maps to the live services,
 * so the demo "just works" without any provisioning.
 */
export async function ensureDemoTenant(): Promise<Tenant> {
  await ensureSchema()
  const existing = await getTenant('demo')
  if (existing) {
    // Keep the service mapping fresh in case it drifted; cheap and idempotent.
    const updated = await q1<Tenant>(
      controlDb(),
      `update tenants
         set pg_service = 'overmind-pg', kafka_service = 'overmind-kafka', status = 'active'
       where id = $1
       returning *`,
      [existing.id]
    )
    return (updated as Tenant) ?? existing
  }
  const row = await q1<Tenant>(
    controlDb(),
    `insert into tenants (name, email, kind, pg_service, kafka_service, status)
     values ('demo', 'demo@overmind.dev', 'human', 'overmind-pg', 'overmind-kafka', 'active')
     returning *`
  )
  return row as Tenant
}
