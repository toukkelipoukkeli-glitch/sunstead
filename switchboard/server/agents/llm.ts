import 'dotenv/config'
import type { Gap } from './types'

// The LLM brain of the migration. Claude reasons about an arbitrary Supabase
// schema and produces the Aiven-targeted SQL + gaps. This is the "agent figures
// it out" step — it handles schemas the regex transformer can't. The
// deterministic transformer (schema-transform.ts) stays as the fallback, and the
// Migrator runs every statement defensively, so a bad line can't slip through.

const MODEL = process.env.MIGRATION_MODEL || 'claude-opus-4-8'
const API = 'https://api.anthropic.com/v1/messages'

export function llmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}
export function llmModel(): string {
  return MODEL
}

export type LlmPlan = { aivenSql: string; notes: string[]; gaps: Gap[]; model: string }

const SYSTEM = `You are a senior database migration engineer. You migrate Supabase Postgres apps onto plain Aiven for PostgreSQL.

Produce idempotent SQL that recreates the app on Aiven:
- Replace Supabase auth: synthesize app_users(id uuid primary key default gen_random_uuid(), email citext unique not null, password_hash text not null, created_at timestamptz not null default now()) and sessions(token uuid primary key default gen_random_uuid(), user_id uuid references app_users(id) on delete cascade, created_at timestamptz, expires_at timestamptz). Use pgcrypto.
- Rewrite references to auth.users -> app_users, and auth.uid() -> current_setting('app.user_id', true)::uuid.
- Drop Supabase-only objects with no Aiven equivalent (the supabase_realtime publication; storage.* objects) and record them as gaps.
- Keep the user's tables, columns, constraints, indexes, and RLS policies. Strip the "public." schema qualifier.
- Make EVERYTHING idempotent: create extension if not exists; create table if not exists; create index if not exists; drop policy if exists <name> on <table> before each create policy.
- Schema + auth structure only — never INSERT data.

Return ONLY a JSON object (no markdown, no prose):
{"aivenSql": "<the full SQL>", "notes": ["short human notes on what you changed"], "gaps": [{"feature":"...","why":"...","recommendation":"..."}]}`

export async function llmPlanMigration(supabaseSql: string): Promise<LlmPlan | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Migrate this Supabase schema (pg_dump --schema-only output) to Aiven. Return only the JSON object.\n\n<schema>\n${supabaseSql.slice(0, 60000)}\n</schema>`,
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data: any = await res.json()
  const text: string = (data.content || []).map((c: any) => c.text || '').join('')
  const obj = extractJson(text)
  if (!obj?.aivenSql) throw new Error('LLM returned no aivenSql')
  return { aivenSql: String(obj.aivenSql), notes: obj.notes || [], gaps: obj.gaps || [], model: MODEL }
}

// The self-repair step: given statements that failed on the target with their
// errors, Claude returns corrected, idempotent SQL. This is what lets the
// migration loop fix its own mistakes instead of just giving up.
export type EnvClassification = {
  services: { label: string; keys: string[]; migratable: boolean; aiven: string | null; note: string }[]
  dbConnectionKey: string | null
}

// Agentic env detection: Opus reads the (value-masked) .env and figures out which
// backend services the app uses and how each maps to Aiven — no hardcoded regex,
// so it handles arbitrary/odd var names and recognizes providers by value shape.
export async function llmClassifyEnv(maskedEnv: string): Promise<EnvClassification | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  const sys = `You analyze an app's .env (values are MASKED for privacy — you see key names and value shapes/prefixes only). Identify every backend SERVICE the app uses and how to move it onto Aiven.

For each service return: label (e.g. "Supabase", "PostgreSQL", "Redis", "Kafka", "Stripe", "OpenAI"), keys (the env var names belonging to it), migratable (true only if Aiven can host it), aiven (the Aiven service: "Aiven for PostgreSQL" | "Aiven for Caching (Valkey)" | "Aiven for Apache Kafka" | "Aiven for OpenSearch" | "Aiven for MySQL" | "Aiven for ClickHouse", else null), and a one-line note.
Recognize providers from BOTH key names and value shapes: sb_secret_/sb_publishable_/eyJ…(JWT)/*.supabase.co = Supabase; postgres:// = PostgreSQL; mysql:// = MySQL; redis://|rediss:// = Redis; kafka/confluent = Kafka; sk_live_/sk_test_ = Stripe; sk-proj-/sk-ant- = LLM APIs. Third-party SaaS (Stripe, OpenAI, Resend, Clerk, auth, analytics, email) are NOT migratable (aiven=null). Plain config (NODE_ENV, PORT) is its own non-migratable "App config" service.
Also set dbConnectionKey to the env var holding the primary Postgres/MySQL CONNECTION STRING (a postgres://|mysql:// URL), or null if none is present (API keys are NOT connection strings).

Return ONLY JSON: {"services":[{"label":"","keys":[],"migratable":false,"aiven":null,"note":""}],"dbConnectionKey":null}`
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 2048, system: sys, messages: [{ role: 'user', content: maskedEnv }] }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data: any = await res.json()
  const text: string = (data.content || []).map((c: any) => c.text || '').join('')
  const obj = extractJson(text)
  if (!obj || !Array.isArray(obj.services)) return null
  return { services: obj.services, dbConnectionKey: obj.dbConnectionKey ?? null }
}

export type RepairDecision = { original: string; action: 'fix' | 'drop' | 'manual'; fixed: string; reason?: string }

export async function llmRepairStatements(failures: { sql: string; error: string }[]): Promise<RepairDecision[]> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !failures.length) return []
  const sys = `You are repairing a database migration running LIVE on Aiven for PostgreSQL (plain Postgres — no Supabase extensions/auth). Each statement below failed with the given error. For each, choose an action:
- "fix": it has a plain-Postgres equivalent — return corrected, IDEMPOTENT SQL in "fixed". Common fixes: auth.uid() -> current_setting('app.user_id', true)::uuid; auth.users -> app_users; "drop policy if exists <name> on <table>;" before "create policy"; "create extension if not exists"; create/qualify missing roles.
- "drop": the object has NO Aiven equivalent and should be skipped (e.g. the supabase_realtime publication, storage.* objects, Supabase-only extensions). Leave "fixed" empty; give a short "reason".
- "manual": genuinely needs a human. Leave "fixed" empty; give a short "reason".
Return ONLY a JSON array, no prose: [{"original":"<failed SQL>","action":"fix|drop|manual","fixed":"<corrected SQL or empty>","reason":"<short>"}].`
  const user = failures.map((f, i) => `#${i + 1}\nERROR: ${f.error}\nSQL:\n${f.sql}`).join('\n\n')
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 4096, system: sys, messages: [{ role: 'user', content: user }] }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data: any = await res.json()
  const text: string = (data.content || []).map((c: any) => c.text || '').join('')
  const arr = extractJson(text)
  return Array.isArray(arr) ? arr.filter((x) => x && x.action).map((x) => ({ original: x.original || '', action: x.action, fixed: x.fixed || '', reason: x.reason })) : []
}

function extractJson(text: string): any {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) t = fence[1].trim()
  try {
    return JSON.parse(t)
  } catch {
    /* fall through to bracket slicing */
  }
  const slice = (s: number, e: number) => {
    if (s < 0 || e <= s) return undefined
    try {
      return JSON.parse(t.slice(s, e + 1))
    } catch {
      return undefined
    }
  }
  const arrS = t.indexOf('['), arrE = t.lastIndexOf(']')
  const objS = t.indexOf('{'), objE = t.lastIndexOf('}')
  // Prefer whichever bracket type appears first (repair returns an array).
  if (arrS >= 0 && (arrS < objS || objS < 0)) {
    const r = slice(arrS, arrE)
    if (r !== undefined) return r
  }
  return slice(objS, objE) ?? slice(arrS, arrE) ?? null
}

// CLI: tsx server/agents/llm.ts   (uses a tiny built-in Supabase schema to test)
if (process.argv[1] && process.argv[1].endsWith('llm.ts')) {
  ;(async () => {
    const sample = `create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text
);
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz default now()
);
alter table public.notes enable row level security;
create policy "owners read notes" on public.notes for select using (auth.uid() = owner);
alter publication supabase_realtime add table public.notes;`
    if (!llmConfigured()) {
      console.error('No ANTHROPIC_API_KEY')
      process.exit(1)
    }
    const plan = await llmPlanMigration(sample)
    console.log('MODEL:', plan?.model)
    console.log('NOTES:', JSON.stringify(plan?.notes, null, 2))
    console.log('GAPS:', JSON.stringify(plan?.gaps, null, 2))
    console.log('AIVEN SQL:\n' + plan?.aivenSql)
  })()
}
