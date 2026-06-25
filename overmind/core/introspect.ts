// core/introspect.ts — live source-DB introspection (the "Recon DB half").
//
// Queries information_schema + pg_catalog over a `pg` connection to recover the *real*
// shape of the source Supabase Postgres: tables, columns, indexes, constraints, extensions,
// functions, triggers, RLS policies, and row counts. The repo scan tells us how the app
// *uses* Supabase; this tells us what actually *exists* in the DB.
//
// Contract: if no connection string is given (or it can't connect), return a well-formed
// EMPTY introspection so the rest of the pipeline runs in "repo-only mode". Never throw.

// `pg` is CJS; default-import works under esModuleInterop (set in tsconfig).
import pg from 'pg';

// ───────────────────────── Structured introspection result ─────────────────────────

export interface IntrospectedColumn {
  name: string;
  type: string;         // formatted type, e.g. "uuid", "text", "vector(1536)", "timestamptz"
  notNull: boolean;
  default?: string;
  isVector: boolean;
}

export interface IntrospectedIndex {
  name: string;
  table: string;
  definition: string;   // full pg_indexes.indexdef
  isVector: boolean;    // uses hnsw/ivfflat access method
  isUnique: boolean;
  isPrimary: boolean;
}

export interface IntrospectedConstraint {
  name: string;
  table: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | string;
  definition: string;
}

export interface IntrospectedFunction {
  schema: string;
  name: string;
  language: string;
  security: 'definer' | 'invoker';
  returnsTable: boolean;
  argTypes: string;
  usesPgNet: boolean;
}

export interface IntrospectedTrigger {
  name: string;
  table: string;
  timing: string;       // BEFORE / AFTER / INSTEAD OF
  events: string[];     // INSERT / UPDATE / DELETE
  functionName: string;
}

export interface IntrospectedPolicy {
  name: string;
  table: string;
  command: string;      // SELECT / INSERT / UPDATE / DELETE / ALL
  roles: string[];
  usesAuthUid: boolean;
  using?: string;
  withCheck?: string;
}

export interface IntrospectedTable {
  schema: string;
  name: string;
  columns: IntrospectedColumn[];
  rlsEnabled: boolean;
  rowCount: number;
  hasVectorColumn: boolean;
}

export interface SourceIntrospection {
  connected: boolean;
  notes: string[];
  serverVersion?: string;

  tables: IntrospectedTable[];
  indexes: IntrospectedIndex[];
  constraints: IntrospectedConstraint[];
  extensions: string[];
  functions: IntrospectedFunction[];
  triggers: IntrospectedTrigger[];
  policies: IntrospectedPolicy[];
  rowCounts: Record<string, number>;   // table name → live row count
}

// Schemas we care about. Supabase data lives in `public`; we also peek at storage/auth presence.
const USER_SCHEMAS = ['public'];

function emptyIntrospection(): SourceIntrospection {
  return {
    connected: false,
    notes: [],
    tables: [],
    indexes: [],
    constraints: [],
    extensions: [],
    functions: [],
    triggers: [],
    policies: [],
    rowCounts: {},
  };
}

// ───────────────────────── Public entry point ─────────────────────────

export async function introspectSource(connStr?: string): Promise<SourceIntrospection> {
  const intro = emptyIntrospection();

  const conn = connStr ?? process.env.SOURCE_DATABASE_URL ?? '';
  if (!conn) {
    intro.notes.push('no source connection string — repo-only mode');
    return intro;
  }

  const client = new pg.Client({
    connectionString: conn,
    // Supabase requires TLS; accept their cert chain without local CA fuss.
    ssl: needsSsl(conn) ? { rejectUnauthorized: false } : undefined,
    // Don't hang the whole pipeline on a dead DB.
    connectionTimeoutMillis: 8000,
    statement_timeout: 15000,
  });

  try {
    await client.connect();
    intro.connected = true;

    intro.serverVersion = await safeScalar(client, 'show server_version', intro);

    await loadExtensions(client, intro);
    await loadTables(client, intro);
    await loadColumns(client, intro);
    await loadIndexes(client, intro);
    await loadConstraints(client, intro);
    await loadFunctions(client, intro);
    await loadTriggers(client, intro);
    await loadPolicies(client, intro);
    await loadRowCounts(client, intro);

    finalize(intro);
  } catch (err) {
    intro.notes.push(`introspect failed, degrading to repo-only: ${errMsg(err)}`);
    intro.connected = false;
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore close errors */
    }
  }

  return intro;
}

// ───────────────────────── loaders ─────────────────────────

async function loadExtensions(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{ extname: string }>(
    client,
    `select extname from pg_extension order by extname`,
    [],
    intro,
  );
  intro.extensions = rows.map((r) => r.extname);
}

async function loadTables(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{ table_schema: string; table_name: string; rls: boolean }>(
    client,
    `select t.table_schema, t.table_name,
            coalesce(c.relrowsecurity, false) as rls
       from information_schema.tables t
       join pg_class c on c.relname = t.table_name
       join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.table_schema
      where t.table_type = 'BASE TABLE'
        and t.table_schema = any($1)
      order by t.table_schema, t.table_name`,
    [USER_SCHEMAS],
    intro,
  );
  for (const r of rows) {
    intro.tables.push({
      schema: r.table_schema,
      name: r.table_name,
      columns: [],
      rlsEnabled: r.rls,
      rowCount: 0,
      hasVectorColumn: false,
    });
  }
}

async function loadColumns(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{
    table_schema: string;
    table_name: string;
    column_name: string;
    formatted_type: string;
    is_nullable: string;
    column_default: string | null;
  }>(
    client,
    `select c.table_schema, c.table_name, c.column_name,
            case
              when c.data_type = 'USER-DEFINED' then c.udt_name
              when c.data_type = 'ARRAY' then c.udt_name
              else c.data_type
            end as formatted_type,
            c.is_nullable, c.column_default
       from information_schema.columns c
      where c.table_schema = any($1)
      order by c.table_schema, c.table_name, c.ordinal_position`,
    [USER_SCHEMAS],
    intro,
  );
  for (const r of rows) {
    const tbl = intro.tables.find(
      (t) => t.schema === r.table_schema && t.name === r.table_name,
    );
    if (!tbl) continue;
    const isVector = /vector/i.test(r.formatted_type);
    tbl.columns.push({
      name: r.column_name,
      type: r.formatted_type,
      notNull: r.is_nullable === 'NO',
      default: r.column_default ?? undefined,
      isVector,
    });
    if (isVector) tbl.hasVectorColumn = true;
  }
}

async function loadIndexes(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{
    tablename: string;
    indexname: string;
    indexdef: string;
  }>(
    client,
    `select tablename, indexname, indexdef
       from pg_indexes
      where schemaname = any($1)
      order by tablename, indexname`,
    [USER_SCHEMAS],
    intro,
  );
  for (const r of rows) {
    const def = r.indexdef;
    intro.indexes.push({
      name: r.indexname,
      table: r.tablename,
      definition: def,
      isVector: /using\s+(hnsw|ivfflat)/i.test(def),
      isUnique: /create\s+unique\s+index/i.test(def),
      isPrimary: /_pkey$/i.test(r.indexname),
    });
  }
}

async function loadConstraints(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{
    table_name: string;
    conname: string;
    contype: string;
    definition: string;
  }>(
    client,
    `select rel.relname as table_name,
            con.conname,
            con.contype::text as contype,
            pg_get_constraintdef(con.oid) as definition
       from pg_constraint con
       join pg_class rel on rel.oid = con.conrelid
       join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = any($1)
      order by rel.relname, con.conname`,
    [USER_SCHEMAS],
    intro,
  );
  const typeMap: Record<string, string> = {
    p: 'PRIMARY KEY',
    f: 'FOREIGN KEY',
    u: 'UNIQUE',
    c: 'CHECK',
  };
  for (const r of rows) {
    intro.constraints.push({
      name: r.conname,
      table: r.table_name,
      type: typeMap[r.contype] ?? r.contype,
      definition: r.definition,
    });
  }
}

async function loadFunctions(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{
    schema: string;
    name: string;
    language: string;
    security_definer: boolean;
    returns_set: boolean;
    arg_types: string;
    body: string;
  }>(
    client,
    `select n.nspname as schema,
            p.proname as name,
            l.lanname as language,
            p.prosecdef as security_definer,
            p.proretset as returns_set,
            pg_get_function_arguments(p.oid) as arg_types,
            coalesce(p.prosrc, '') as body
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       join pg_language l on l.oid = p.prolang
      where n.nspname = any($1)
        and p.prokind = 'f'
      order by p.proname`,
    [USER_SCHEMAS],
    intro,
  );
  for (const r of rows) {
    intro.functions.push({
      schema: r.schema,
      name: r.name,
      language: r.language,
      security: r.security_definer ? 'definer' : 'invoker',
      returnsTable: r.returns_set,
      argTypes: r.arg_types,
      usesPgNet: /net\s*\.\s*http_post/i.test(r.body),
    });
  }
}

async function loadTriggers(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  // information_schema.triggers yields one row per event; collapse to one per trigger name+table.
  const rows = await safeQuery<{
    trigger_name: string;
    event_object_table: string;
    action_timing: string;
    event_manipulation: string;
    action_statement: string;
  }>(
    client,
    `select trigger_name, event_object_table, action_timing,
            event_manipulation, action_statement
       from information_schema.triggers
      where trigger_schema = any($1)
      order by event_object_table, trigger_name`,
    [USER_SCHEMAS],
    intro,
  );
  const byKey = new Map<string, IntrospectedTrigger>();
  for (const r of rows) {
    const key = `${r.event_object_table}.${r.trigger_name}`;
    let t = byKey.get(key);
    if (!t) {
      t = {
        name: r.trigger_name,
        table: r.event_object_table,
        timing: r.action_timing,
        events: [],
        functionName:
          r.action_statement.match(/execute\s+(?:function|procedure)\s+([a-z0-9_."]+)\s*\(/i)?.[1]?.replace(/"/g, '') ??
          'unknown',
      };
      byKey.set(key, t);
    }
    if (!t.events.includes(r.event_manipulation)) t.events.push(r.event_manipulation);
  }
  intro.triggers = [...byKey.values()];
}

async function loadPolicies(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  const rows = await safeQuery<{
    tablename: string;
    policyname: string;
    cmd: string;
    roles: string[] | null;
    qual: string | null;
    with_check: string | null;
  }>(
    client,
    `select tablename, policyname, cmd, roles, qual, with_check
       from pg_policies
      where schemaname = any($1)
      order by tablename, policyname`,
    [USER_SCHEMAS],
    intro,
  );
  for (const r of rows) {
    const using = r.qual ?? undefined;
    const withCheck = r.with_check ?? undefined;
    intro.policies.push({
      name: r.policyname,
      table: r.tablename,
      command: r.cmd,
      roles: Array.isArray(r.roles) ? r.roles : [],
      usesAuthUid: /auth\s*\.\s*uid\s*\(\s*\)/i.test(`${using ?? ''} ${withCheck ?? ''}`),
      using,
      withCheck,
    });
  }
}

async function loadRowCounts(client: pg.Client, intro: SourceIntrospection): Promise<void> {
  // Per-table exact counts. Cheap on the small demo DB; capped by statement_timeout for safety.
  for (const t of intro.tables) {
    const ident = `"${t.schema}"."${t.name}"`;
    try {
      const res = await client.query<{ n: string }>(`select count(*)::text as n from ${ident}`);
      const n = parseInt(res.rows[0]?.n ?? '0', 10);
      t.rowCount = Number.isFinite(n) ? n : 0;
      intro.rowCounts[t.name] = t.rowCount;
    } catch (err) {
      intro.notes.push(`row count failed for ${t.name}: ${errMsg(err)}`);
      intro.rowCounts[t.name] = 0;
    }
  }
}

function finalize(intro: SourceIntrospection): void {
  // backfill vector flags from indexes too (a vector index implies a vector column)
  for (const idx of intro.indexes) {
    if (idx.isVector) {
      const t = intro.tables.find((x) => x.name === idx.table);
      if (t) t.hasVectorColumn = true;
    }
  }
}

// ───────────────────────── query helpers ─────────────────────────

async function safeQuery<T extends pg.QueryResultRow>(
  client: pg.Client,
  text: string,
  params: unknown[],
  intro: SourceIntrospection,
): Promise<T[]> {
  try {
    const res = await client.query<T>(text, params as any[]);
    return res.rows;
  } catch (err) {
    intro.notes.push(`query failed (${firstLine(text)}): ${errMsg(err)}`);
    return [];
  }
}

async function safeScalar(
  client: pg.Client,
  text: string,
  intro: SourceIntrospection,
): Promise<string | undefined> {
  try {
    const res = await client.query(text);
    const row = res.rows[0];
    if (!row) return undefined;
    const v = Object.values(row)[0];
    return v == null ? undefined : String(v);
  } catch (err) {
    intro.notes.push(`scalar failed (${firstLine(text)}): ${errMsg(err)}`);
    return undefined;
  }
}

function needsSsl(conn: string): boolean {
  // Supabase pooler/direct hosts are remote → TLS. Skip for local/no-host strings.
  if (/sslmode=disable/i.test(conn)) return false;
  if (/localhost|127\.0\.0\.1/i.test(conn)) return false;
  return true;
}

function firstLine(s: string): string {
  return s.trim().split('\n')[0].slice(0, 60);
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
