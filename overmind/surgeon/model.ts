// surgeon/model.ts — derive a concrete table model from the BehaviorGraph.
//
// The contract only guarantees `graph.source.tables: string[]` (names) — there is no
// column metadata in the shared type. To generate a *real* backend we need columns, so
// this module is defensive: it parses any column hints the recon/graph stage may have
// stuffed into a table node's `detail`/`evidence`, and otherwise synthesises a sensible
// default shape from conventions. The LLM pass (llm.ts) can later overwrite columns with
// table-specific ones; if it's unavailable these deterministic guesses keep the backend
// compiling and serving.

import type { BehaviorGraph, BehaviorNode } from '../shared/types.ts'

export interface ColumnModel {
  name: string
  /** postgres type, e.g. 'uuid', 'text', 'int', 'timestamptz', 'bytea', 'vector(1536)' */
  type: string
  nullable: boolean
  /** raw default expression, e.g. 'gen_random_uuid()', 'now()', '0' */
  default?: string
  isPrimaryKey?: boolean
  /** for FKs: "<table>(<col>)" */
  references?: string
}

export interface TableModel {
  name: string
  columns: ColumnModel[]
  /** the column the data-API treats as the owner for write authz, if any */
  ownerColumn?: string
  /** name of a vector column for pgvector search, if the table has embeddings */
  vectorColumn?: string
  vectorDim?: number
  /** column used for default ordering in list endpoints */
  orderColumn: string
}

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** Sanitise an arbitrary string into a safe SQL identifier (defensive against junk names). */
export function safeIdent(raw: string, fallback = 'item'): string {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/^public\./, '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+/, '')
    .slice(0, 60)
  if (!cleaned || !IDENT.test(cleaned)) return fallback
  // never let a generated table collide with our own auth tables
  return cleaned
}

/**
 * Normalise a FK target to the Aiven-native schema: drop schema prefixes and re-point
 * Supabase's `auth.users(id)` at our own `users(id)` table. Falls back to a safe identifier
 * for anything unrecognisable so the DDL never references a non-existent schema.
 */
export function normalizeFkTarget(ref: string): string {
  let r = String(ref ?? '').trim().toLowerCase()
  r = r.replace(/^auth\.users/, 'users').replace(/^public\./, '')
  const m = r.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\))?$/)
  if (!m) return 'users(id)'
  const table = m[1]
  const col = m[2] ? m[2].replace(/\s+/g, '') : '(id)'
  return `${table}${col}`
}

/** singular-ish form for a type name: posts -> Post, reactions -> Reaction, data -> Data */
export function typeName(table: string): string {
  const base = table.replace(/[^a-zA-Z0-9_]/g, '_')
  const singular = base.endsWith('ies')
    ? base.slice(0, -3) + 'y'
    : base.endsWith('ses')
      ? base.slice(0, -2)
      : base.endsWith('s')
        ? base.slice(0, -1)
        : base
  return singular
    .split('_')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('') || 'Row'
}

// Reserved table names we generate ourselves — never re-emit these from the source list.
const RESERVED = new Set(['users', 'auth_codes', 'images', 'migration_receipts', 'cto_recommendations'])

/**
 * Try to recover column definitions from a table node's free-text detail/evidence.
 * Recon may emit lines like "id uuid primary key, body text not null, created_at timestamptz".
 * This is best-effort: anything we can't parse falls back to defaults.
 */
function parseColumnsFromNode(node: BehaviorNode | undefined): ColumnModel[] | null {
  if (!node) return null
  const text = [node.detail, ...(node.evidence ?? [])].filter(Boolean).join('\n')
  if (!text) return null

  // Pull a "(...)" column list if present, else scan comma-separated "name type" pairs.
  const cols: ColumnModel[] = []
  const lines = text
    .replace(/\bcreate\s+table[^(]*\(/i, '')
    .split(/,(?![^()]*\))|\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    // type captures an optional precision/dimension, e.g. vector(1536), numeric(10,2), varchar(80)
    const m = line.match(/^"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s+([a-zA-Z][a-zA-Z0-9_ ]*?(?:\(\d+(?:,\d+)?\))?)(?=\s|$|,)(.*)$/)
    if (!m) continue
    const name = m[1].toLowerCase()
    if (['primary', 'unique', 'foreign', 'constraint', 'check', 'references'].includes(name)) continue
    let type = m[2].trim().toLowerCase()
    const rest = (m[3] || '').toLowerCase()
    // normalise a few common type spellings
    if (/^vector\(\d+\)/.test(type)) type = type // keep dimension
    else if (type === 'vector') type = 'vector(1536)' // default dim if recon dropped it
    else if (type.startsWith('character varying') || /^varchar(\(|$)/.test(type)) type = 'text'
    else if (type === 'integer') type = 'int'
    else if (type === 'boolean' || type === 'bool') type = 'boolean'
    else if (type === 'double precision' || type === 'real') type = 'float'
    const col: ColumnModel = {
      name,
      type,
      nullable: !/not\s+null|primary\s+key/.test(rest),
    }
    if (/primary\s+key/.test(rest)) col.isPrimaryKey = true
    if (/gen_random_uuid\(\)/.test(rest)) col.default = 'gen_random_uuid()'
    else if (/default\s+now\(\)/.test(rest)) col.default = 'now()'
    else {
      const dm = rest.match(/default\s+([^\s,]+)/)
      if (dm) col.default = dm[1]
    }
    const fk = rest.match(/references\s+([a-zA-Z_][a-zA-Z0-9_().]*)/)
    if (fk) col.references = normalizeFkTarget(fk[1])
    cols.push(col)
  }
  return cols.length >= 2 ? cols : null
}

/** A reasonable default shape when we know nothing but the table name. */
function defaultColumns(table: string): ColumnModel[] {
  return [
    { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()', isPrimaryKey: true },
    { name: 'owner_id', type: 'uuid', nullable: true, references: 'users(id)' },
    { name: 'body', type: 'text', nullable: true },
    { name: 'data', type: 'jsonb', nullable: true, default: `'{}'::jsonb` },
    { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
  ]
}

function pickOrderColumn(cols: ColumnModel[]): string {
  const names = cols.map((c) => c.name)
  for (const pref of ['created_at', 'inserted_at', 'updated_at', 'ts', 'id']) {
    if (names.includes(pref)) return pref
  }
  return names[0] || 'id'
}

function pickOwnerColumn(cols: ColumnModel[]): string | undefined {
  const names = cols.map((c) => c.name)
  for (const pref of ['author_id', 'owner_id', 'user_id', 'created_by']) {
    if (names.includes(pref)) return pref
  }
  return undefined
}

function pickVector(cols: ColumnModel[]): { col: string; dim: number } | undefined {
  for (const c of cols) {
    const m = c.type.match(/^vector\((\d+)\)/)
    if (m) return { col: c.name, dim: Number(m[1]) }
    if (c.name === 'embedding') return { col: c.name, dim: 1536 }
  }
  return undefined
}

/** Build the full table model the templates render against. Pure + deterministic. */
export function deriveModel(graph: BehaviorGraph): TableModel[] {
  const tableNodes = new Map<string, BehaviorNode>()
  for (const n of graph.nodes ?? []) {
    if (n.kind === 'table') tableNodes.set(safeIdent(n.name).toLowerCase(), n)
  }

  const rawNames = (graph.source?.tables ?? []).length
    ? graph.source.tables
    : Array.from(tableNodes.keys())

  const seen = new Set<string>()
  const models: TableModel[] = []

  for (const raw of rawNames) {
    const name = safeIdent(raw).toLowerCase()
    if (!name || seen.has(name) || RESERVED.has(name)) continue
    seen.add(name)

    const node = tableNodes.get(name)
    const cols = parseColumnsFromNode(node) ?? defaultColumns(name)

    // guarantee a primary key + created_at so generated routes are coherent
    if (!cols.some((c) => c.isPrimaryKey)) {
      cols.unshift({ name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()', isPrimaryKey: true })
    }
    if (!cols.some((c) => c.name === 'created_at')) {
      cols.push({ name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' })
    }

    const vec = pickVector(cols)
    models.push({
      name,
      columns: cols,
      ownerColumn: pickOwnerColumn(cols),
      vectorColumn: vec?.col,
      vectorDim: vec?.dim,
      orderColumn: pickOrderColumn(cols),
    })
  }

  return models
}
