// Supabase Management API client — the secure read path.
//
// With a scoped, revocable token (an OAuth access token from "Connect Supabase",
// OR a personal access token `sbp_…`) we read the source project ENTIRELY over
// HTTPS: list projects, introspect the schema, read rows. We never hold the
// database password or a raw `postgres://` connection string. Every SQL read runs
// through POST /v1/projects/{ref}/database/query — the same endpoint the Supabase
// dashboard SQL editor uses. The token stays server-side and is never logged.

import type { Inspection } from './pg'

const API = (process.env.SUPABASE_API_URL || 'https://api.supabase.com').replace(/\/$/, '')

export type SupabaseProject = {
  id: string // the project ref
  name: string
  region: string
  organizationId: string
  createdAt: string
  status: string
}

// Low-level call. Never include the token in thrown errors.
async function api(token: string, path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  const text = await res.text()
  if (!res.ok) {
    const msg = text.slice(0, 300).replace(/sbp_[A-Za-z0-9]+/g, 'sbp_***')
    throw new Error(`Supabase API ${res.status}${msg ? ': ' + msg : ''}`)
  }
  return text ? JSON.parse(text) : null
}

export async function listProjects(token: string): Promise<SupabaseProject[]> {
  const raw = await api(token, '/v1/projects')
  const arr = Array.isArray(raw) ? raw : []
  return arr
    .map((p: any) => ({
      id: p.id || p.ref || '',
      name: p.name || p.id || '(unnamed)',
      region: p.region || '',
      organizationId: p.organization_id || '',
      createdAt: p.created_at || '',
      status: p.status || '',
    }))
    .filter((p) => p.id)
}

// Run a read query against the project through the Management API.
export async function query(token: string, ref: string, sql: string): Promise<any[]> {
  const out = await api(token, `/v1/projects/${ref}/database/query`, { method: 'POST', body: JSON.stringify({ query: sql }) })
  return Array.isArray(out) ? out : []
}

// Introspect the source — returns the SAME shape as pg.inspect(), so the rest of
// the pipeline (analysisFromInspect, savings, the Review screen) is unchanged.
export async function mgmtInspect(token: string, ref: string): Promise<Inspection> {
  const q = (sql: string) => query(token, ref, sql)
  const tablesRows = await q(
    `select c.relname as name, c.reltuples::bigint as est
       from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where c.relkind='r' and n.nspname='public'
      order by c.relname`,
  )
  const tables: { name: string; rows: number }[] = []
  let totalRows = 0
  for (const t of tablesRows) {
    let rows = Number(t.est) || 0
    try {
      const c = await q(`select count(*)::bigint as n from "public"."${t.name}"`)
      rows = Number(c[0]?.n) || 0
    } catch {
      /* keep estimate */
    }
    totalRows += rows
    tables.push({ name: t.name, rows })
  }
  const [size, ext, pol, sb] = await Promise.all([
    q(`select pg_database_size(current_database()) as bytes`).catch(() => []),
    q(`select extname from pg_extension order by extname`).catch(() => []),
    q(`select policyname from pg_policies where schemaname='public'`).catch(() => []),
    q(
      `select nspname from pg_namespace where nspname in ('auth','storage','graphql','graphql_public','realtime','vault','supabase_functions')`,
    ).catch(() => []),
  ])
  return {
    sizeBytes: Number(size[0]?.bytes) || 0,
    tables,
    totalRows,
    extensions: ext.map((r: any) => r.extname),
    policies: pol.length,
    supabaseSchemas: sb.map((r: any) => r.nspname),
  }
}

// Reconstruct public-schema DDL from the catalog (pg_dump isn't reachable without
// a direct connection). The output is pg_dump-like SQL that feeds the same LLM
// planner / deterministic transformer the .env path uses; the self-repairing
// migrator fixes any rough edges, so this only needs to be close.
export async function mgmtDumpSchema(token: string, ref: string): Promise<string> {
  const q = (sql: string) => query(token, ref, sql).catch(() => [] as any[])
  const parts: string[] = []

  const exts = await q(`select extname from pg_extension where extname <> 'plpgsql' order by extname`)
  for (const e of exts) parts.push(`create extension if not exists "${e.extname}";`)

  // Columns -> CREATE TABLE (format_type gives precise, dump-quality types).
  const cols = await q(
    `select c.relname as tbl, a.attname as col,
            format_type(a.atttypid, a.atttypmod) as type,
            a.attnotnull as notnull,
            pg_get_expr(ad.adbin, ad.adrelid) as dflt, a.attnum
       from pg_class c
       join pg_namespace n on n.oid=c.relnamespace
       join pg_attribute a on a.attrelid=c.oid
       left join pg_attrdef ad on ad.adrelid=c.oid and ad.adnum=a.attnum
      where n.nspname='public' and c.relkind='r' and a.attnum>0 and not a.attisdropped
      order by c.relname, a.attnum`,
  )
  const byTable = new Map<string, any[]>()
  for (const r of cols) {
    const arr = byTable.get(r.tbl) || []
    arr.push(r)
    byTable.set(r.tbl, arr)
  }
  for (const [tbl, rows] of byTable) {
    const lines = rows.map((r) => {
      let s = `  "${r.col}" ${r.type}`
      if (r.dflt) s += ` default ${r.dflt}`
      if (r.notnull) s += ' not null'
      return s
    })
    parts.push(`create table if not exists public."${tbl}" (\n${lines.join(',\n')}\n);`)
  }

  // Constraints: emit PK/UNIQUE before FK/CHECK so foreign keys can resolve.
  const cons = await q(
    `select c.relname as tbl, con.conname as name, pg_get_constraintdef(con.oid) as def, con.contype::text as t
       from pg_constraint con
       join pg_class c on c.oid=con.conrelid
       join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'`,
  )
  const emitCon = (r: any) => parts.push(`alter table public."${r.tbl}" add constraint "${r.name}" ${r.def};`)
  for (const r of cons) if (r.t === 'p' || r.t === 'u') emitCon(r)
  for (const r of cons) if (r.t === 'f' || r.t === 'c') emitCon(r)

  // Indexes that don't back a constraint.
  const idx = await q(
    `select i.indexname, i.indexdef
       from pg_indexes i
      where i.schemaname='public'
        and not exists (
          select 1 from pg_constraint con
          join pg_class ic on ic.oid=con.conindid
          where ic.relname=i.indexname)
      order by i.indexname`,
  )
  for (const r of idx) parts.push(r.indexdef.replace(/^CREATE (UNIQUE )?INDEX /i, (_m: string, u: string) => `CREATE ${u || ''}INDEX IF NOT EXISTS `) + ';')

  // RLS + policies.
  const rls = await q(
    `select c.relname as tbl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relrowsecurity`,
  )
  for (const r of rls) parts.push(`alter table public."${r.tbl}" enable row level security;`)

  const pol = await q(`select tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname='public'`)
  for (const p of pol) {
    const roles = Array.isArray(p.roles) ? p.roles.join(', ') : p.roles || 'public'
    const cmd = p.cmd && p.cmd !== 'ALL' ? ` for ${String(p.cmd).toLowerCase()}` : ''
    const perm = p.permissive === 'RESTRICTIVE' ? ' as restrictive' : ''
    let s = `create policy "${p.policyname}" on public."${p.tablename}"${perm}${cmd} to ${roles}`
    if (p.qual) s += ` using (${p.qual})`
    if (p.with_check) s += ` with check (${p.with_check})`
    parts.push(s + ';')
  }

  return parts.join('\n\n')
}

// Read Supabase auth.users (bcrypt hashes preserved -> logins keep working).
export async function mgmtAuthUsers(token: string, ref: string): Promise<{ id: string; email: string; encrypted_password: string }[]> {
  try {
    return (await query(token, ref, `select id, email, encrypted_password from auth.users where email is not null`)) as any
  } catch {
    return []
  }
}

// Read one public table (bounded — most vibe-coded apps are small; we flag a cap).
export async function mgmtReadTable(token: string, ref: string, table: string, limit = 5000): Promise<{ rows: any[]; capped: boolean }> {
  const rows = await query(token, ref, `select * from "public"."${table}" limit ${limit + 1}`)
  const capped = rows.length > limit
  return { rows: capped ? rows.slice(0, limit) : rows, capped }
}
