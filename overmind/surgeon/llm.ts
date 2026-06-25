// surgeon/llm.ts — optional, table-specific code enrichment via the Anthropic SDK.
//
// If ANTHROPIC_API_KEY is set, the Surgeon asks Claude to refine the *column model* for
// each source table (better types, owner/vector detection) from whatever evidence the
// behavior graph carries. We deliberately keep the LLM in the *modelling* layer, not the
// codegen layer: the templates stay deterministic and always compile, while the LLM only
// improves the structured TableModel that feeds them. That means a bad/absent LLM response
// can never produce a broken backend — we just fall back to the parsed/heuristic model.
//
// No top-level throws, no hard dependency: every failure path returns the input unchanged.

import type { BehaviorGraph, BehaviorNode } from '../shared/types.ts'
import type { TableModel, ColumnModel } from './model.ts'
import { safeIdent } from './model.ts'

export function llmEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

// claude-3-5-haiku-* was retired 2026-02-19; use the current default model.
const MODEL = process.env.SURGEON_MODEL || 'claude-opus-4-8'

interface LlmColumn {
  name?: string
  type?: string
  nullable?: boolean
  default?: string | null
  primaryKey?: boolean
  references?: string | null
}
interface LlmTable {
  name?: string
  columns?: LlmColumn[]
  ownerColumn?: string | null
  vectorColumn?: string | null
  vectorDim?: number | null
}

function nodeEvidenceFor(graph: BehaviorGraph, table: string): string {
  const lc = table.toLowerCase()
  const rel = (graph.nodes ?? []).filter((n: BehaviorNode) => {
    const hay = `${n.name} ${n.detail} ${(n.evidence ?? []).join(' ')}`.toLowerCase()
    return hay.includes(lc)
  })
  return rel
    .map((n) => `- [${n.kind}] ${n.name}: ${n.detail}${n.evidence?.length ? `\n  evidence: ${n.evidence.join(' | ')}` : ''}`)
    .join('\n')
    .slice(0, 4000)
}

function coerceColumns(cols: LlmColumn[] | undefined): ColumnModel[] | null {
  if (!Array.isArray(cols) || cols.length < 2) return null
  const out: ColumnModel[] = []
  for (const c of cols) {
    const name = safeIdent(String(c.name ?? ''), '')
    if (!name) continue
    let type = String(c.type ?? 'text').trim().toLowerCase()
    if (!/^[a-z][a-z0-9 _]*(\(\d+\))?$/.test(type)) type = 'text'
    out.push({
      name: name.toLowerCase(),
      type,
      nullable: c.nullable !== false && !c.primaryKey,
      default: c.default ?? undefined,
      isPrimaryKey: !!c.primaryKey,
      references: c.references ?? undefined,
    })
  }
  return out.length >= 2 ? out : null
}

/**
 * Ask Claude to refine the column model for each table. Returns an improved model on
 * success, or the deterministic input unchanged on any failure (missing key, bad JSON,
 * network error). Never throws.
 */
export async function refineModelWithLLM(graph: BehaviorGraph, base: TableModel[]): Promise<TableModel[]> {
  if (!llmEnabled() || base.length === 0) return base

  let Anthropic: any
  try {
    ;({ default: Anthropic } = await import('@anthropic-ai/sdk'))
  } catch {
    return base // SDK not installed yet — deterministic path
  }

  let client: any
  try {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  } catch {
    return base
  }

  const evidence = base
    .map((t) => `## table "${t.name}"\ncurrent guess columns: ${t.columns.map((c) => `${c.name} ${c.type}`).join(', ')}\nsource evidence:\n${nodeEvidenceFor(graph, t.name) || '(none — infer a sensible shape from the name)'}`)
    .join('\n\n')

  const prompt = `You are migrating a Supabase/Lovable app to an Aiven-native Postgres backend.
For each source table below, return the best column model. Use the evidence (migration SQL,
column hints) when present; otherwise infer a sensible shape from the table name. Constraints:
- every table needs a uuid primary key "id" default gen_random_uuid() and a "created_at" timestamptz default now()
- replace any auth.users(id) FK target with users(id) (we own auth)
- keep vector(N) columns (pgvector) and flag them as vectorColumn with vectorDim
- mark the owner/author column (author_id/owner_id/user_id) as ownerColumn if present
- postgres types only: uuid, text, int, bigint, boolean, timestamptz, jsonb, bytea, vector(N), numeric

Return ONLY JSON of shape:
{"tables":[{"name":"...","columns":[{"name":"...","type":"...","nullable":bool,"default":"...|null","primaryKey":bool,"references":"table(col)|null"}],"ownerColumn":"...|null","vectorColumn":"...|null","vectorDim":int|null}]}

Tables:
${evidence}`

  let parsed: { tables?: LlmTable[] } | null = null
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const text: string = (resp?.content ?? [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('')
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.warn('[surgeon/llm] refine failed, using deterministic model:', (e as Error)?.message)
    return base
  }
  if (!parsed?.tables?.length) return base

  const byName = new Map<string, LlmTable>()
  for (const t of parsed.tables) {
    const n = safeIdent(String(t.name ?? ''), '').toLowerCase()
    if (n) byName.set(n, t)
  }

  return base.map((t) => {
    const llm = byName.get(t.name)
    if (!llm) return t
    const cols = coerceColumns(llm.columns)
    if (!cols) return t
    // guarantee invariants the templates rely on
    if (!cols.some((c) => c.isPrimaryKey))
      cols.unshift({ name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()', isPrimaryKey: true })
    if (!cols.some((c) => c.name === 'created_at'))
      cols.push({ name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' })

    const vecCol = cols.find((c) => /^vector\(\d+\)/.test(c.type))
    return {
      ...t,
      columns: cols,
      ownerColumn:
        (llm.ownerColumn && cols.some((c) => c.name === llm.ownerColumn) ? llm.ownerColumn! : undefined) ??
        t.ownerColumn,
      vectorColumn: vecCol?.name ?? (llm.vectorColumn ?? undefined) ?? t.vectorColumn,
      vectorDim: vecCol ? Number(vecCol.type.match(/\((\d+)\)/)?.[1]) : (llm.vectorDim ?? t.vectorDim ?? undefined),
    }
  })
}
