import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Generic Supabase -> Aiven schema transform. Takes the SQL DDL of ANY Supabase
// app (from its repo's supabase/schema.sql, or introspected live via the
// Management API) and rewrites it to run on plain Aiven Postgres:
//   * auth.users            -> app_users (synthesized pgcrypto auth table)
//   * auth.uid()            -> current_setting('app.user_id', true)::uuid
//   * supabase_realtime pub -> removed (realtime moves to NOTIFY/Kafka)
//   * public. qualifier     -> stripped (Aiven uses the default schema)
//   * everything idempotent so it can run repeatedly on the target.
// This is the agent's "figure out how to migrate" step, deterministic so it
// works without an LLM; an LLM pass can refine edge cases on top.

const AUTH_PREAMBLE = `-- Synthesized by Switchboard: auth that replaces Supabase GoTrue.
create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists app_users (
  id            uuid primary key default gen_random_uuid(),
  email         citext unique not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);`

export type Transform = { sql: string; notes: string[] }

export function transformSupabaseToAiven(supabaseSql: string): Transform {
  const notes: string[] = []
  let s = supabaseSql

  if (/\bauth\.users\b/.test(s)) notes.push('Repointed auth.users -> app_users (pgcrypto).')
  if (/\bauth\.uid\(\)/.test(s)) notes.push("Rebound auth.uid() -> current_setting('app.user_id').")
  if (/supabase_realtime/i.test(s)) notes.push('Dropped the supabase_realtime publication (realtime -> NOTIFY/Kafka).')
  if (/\bstorage\./i.test(s)) notes.push('Storage objects reference Supabase Storage (no Aiven equivalent) — left as-is.')

  // pg_dump emits psql backslash meta-commands (\restrict / \unrestrict — not valid
  // over the SQL protocol) and resets search_path to '' so its fully-qualified names
  // resolve. We strip the public. qualifier below, so an empty search_path would
  // leave unqualified DDL failing with "no schema has been selected to create in".
  // Drop those meta-commands and pin search_path to the default schema instead.
  if (/\\(?:un)?restrict\b/.test(s) || /set_config\(\s*'search_path'\s*,\s*''/i.test(s)) {
    notes.push('Stripped pg_dump psql meta-commands and pinned search_path to public.')
  }
  s = s.replace(/^[ \t]*\\(?:un)?restrict\b.*$/gim, '')
  s = s.replace(/SELECT\s+pg_catalog\.set_config\(\s*'search_path'\s*,\s*''[^;]*\);/gi, 'SET search_path = public;')

  s = s.replace(/\bpublic\./g, '')
  s = s.replace(/\bauth\.users\b/g, 'app_users')
  s = s.replace(/\bauth\.uid\(\)/g, "current_setting('app.user_id', true)::uuid")
  s = s.replace(/alter\s+publication\s+supabase_realtime[^;]*;/gi, '-- supabase_realtime publication removed')
  s = s.replace(/create\s+table\s+(?:if\s+not\s+exists\s+)?/gi, 'create table if not exists ')
  s = s.replace(/create\s+index\s+(?:if\s+not\s+exists\s+)?/gi, 'create index if not exists ')
  // Make policies idempotent: drop-if-exists before each create policy.
  s = s.replace(
    /create\s+policy\s+("[^"]+"|\S+)\s+on\s+(\S+)/gi,
    (_m, name, tbl) => `drop policy if exists ${name} on ${tbl};\ncreate policy ${name} on ${tbl}`,
  )

  return { sql: `${AUTH_PREAMBLE}\n\n-- ---- Migrated from the app's Supabase schema ----\n${s.trim()}\n`, notes }
}

// Read the user's schema from their repo (the simplest "their app" input).
export function readUserSchema(appDir: string): string | null {
  const p = join(appDir, 'supabase', 'schema.sql')
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

// CLI: tsx server/agents/schema-transform.ts [appDir]
if (process.argv[1] && process.argv[1].endsWith('schema-transform.ts')) {
  const appDir = process.argv[2] || join(process.cwd(), 'sample-app')
  const src = readUserSchema(appDir)
  if (!src) {
    console.error(`No supabase/schema.sql under ${appDir}`)
    process.exit(1)
  }
  const out = transformSupabaseToAiven(src)
  console.error('notes:\n' + out.notes.map((n) => '  - ' + n).join('\n'))
  console.log(out.sql)
}
