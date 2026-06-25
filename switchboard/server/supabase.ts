import type { Inspection } from './pg'

// Supabase Management API: read a user's projects + database using only an access
// token (personal access token now, OAuth later). No connection string, no password.
const API = 'https://api.supabase.com'

async function api(token: string, path: string, init?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  if (!r.ok) throw new Error(`Supabase API ${r.status}: ${(await r.text()).slice(0, 300)}`)
  return r.json()
}

export type SbProject = { ref: string; name: string; region: string; status: string; host?: string }

export async function listProjects(token: string): Promise<SbProject[]> {
  const data: any[] = await api(token, '/v1/projects')
  return (data || []).map((p) => ({
    ref: p.id || p.ref,
    name: p.name,
    region: p.region,
    status: p.status,
    host: p.database?.host,
  }))
}

// Run arbitrary SQL through the Management API "Run a query" endpoint.
export async function runQuery(token: string, ref: string, query: string): Promise<any[]> {
  const data = await api(token, `/v1/projects/${ref}/database/query`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.rows)) return data.rows
  return []
}

// Same inspection as the direct-Postgres path, but over the Management API.
export async function inspectViaApi(token: string, ref: string): Promise<Inspection> {
  const q = (sql: string) => runQuery(token, ref, sql)

  const sizeRows = await q('select pg_database_size(current_database()) as bytes')
  const sizeBytes = Number(sizeRows[0]?.bytes || 0)

  const tableRows = await q(
    "select c.relname as name from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind = 'r' and n.nspname = 'public' order by c.relname"
  )
  const names: string[] = tableRows.map((r) => r.name)

  let tables: { name: string; rows: number }[] = []
  let totalRows = 0
  if (names.length) {
    // One query: exact counts for every table via UNION ALL (rate-limit friendly).
    const union = names
      .map((n) => `select '${n.replace(/'/g, "''")}' as name, count(*)::bigint as rows from "public"."${n.replace(/"/g, '""')}"`)
      .join(' union all ')
    const counts = await q(union)
    const map = new Map<string, number>(counts.map((r) => [r.name, Number(r.rows)]))
    tables = names.map((n) => ({ name: n, rows: map.get(n) ?? 0 }))
    totalRows = tables.reduce((a, t) => a + t.rows, 0)
  }

  const ext = await q('select extname from pg_extension order by extname')
  const pol = await q("select count(*)::int as n from pg_policies where schemaname = 'public'")
  const sb = await q(
    "select nspname from pg_namespace where nspname in ('auth','storage','graphql','graphql_public','realtime','vault','supabase_functions')"
  )

  return {
    sizeBytes,
    tables,
    totalRows,
    extensions: ext.map((r) => r.extname),
    policies: Number(pol[0]?.n || 0),
    supabaseSchemas: sb.map((r) => r.nspname),
  }
}
