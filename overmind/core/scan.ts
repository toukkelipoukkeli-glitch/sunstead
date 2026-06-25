// core/scan.ts — deterministic, network-free static scan of a Lovable/Supabase repo.
//
// This is the "Recon (repo half)" brain. It walks the source tree with node:fs only,
// detects how the app talks to Supabase (client API surface + env vars), and parses the
// SQL migrations into structured schema facts. No DB connection, no Aiven, no network.
//
// Everything here is best-effort and defensive: a missing dir, an unreadable file, or a
// weird migration must NEVER throw — recon should always produce *something*.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

// ───────────────────────── Structured scan result ─────────────────────────

/** One detected use of the Supabase client API in source (e.g. `supabase.from('posts')`). */
export interface ClientCall {
  /** which API surface: data / auth / storage / realtime / rpc / edge-function */
  kind: 'from' | 'auth' | 'storage' | 'channel' | 'rpc' | 'functions_invoke';
  /** the method or argument captured (e.g. 'posts', 'signInWithOtp', 'match_posts') */
  detail: string;
  /** repo-relative file where it was found */
  file: string;
  /** 1-based line number */
  line: number;
}

export interface SqlColumn {
  name: string;
  type: string;
  notNull: boolean;
  default?: string;
  references?: string; // e.g. "auth.users(id)" or "public.posts(id)"
}

export interface SqlIndex {
  name: string;
  table: string;
  using?: string;       // e.g. "hnsw", "btree"
  columns: string;      // raw column expression
  isVector: boolean;    // hnsw/ivfflat over a vector column
}

export interface RlsPolicy {
  name: string;
  table: string;
  command: string;          // SELECT / INSERT / UPDATE / DELETE / ALL
  usesAuthUid: boolean;     // references auth.uid() — the review-flag signal
  expression: string;       // raw using/with-check body (truncated)
}

export interface SqlFunction {
  name: string;
  language: string;
  security: 'definer' | 'invoker' | 'unknown';
  returnsTable: boolean;
  body: string;             // truncated body for context
  usesPgNet: boolean;       // calls net.http_post → edge-function trigger pattern
}

export interface SqlTrigger {
  name: string;
  table: string;
  timing: string;           // BEFORE / AFTER / INSTEAD OF
  events: string[];         // INSERT / UPDATE / DELETE
  functionName: string;
}

export interface SqlTable {
  name: string;             // unqualified (e.g. "posts")
  schema: string;           // "public", "storage", etc.
  columns: SqlColumn[];
  hasVectorColumn: boolean;
  rlsEnabled: boolean;
  inRealtimePublication: boolean;
}

export interface StorageBucket {
  /** bucket id inferred from storage.objects RLS / .from('x') usage */
  name: string;
  publicRead: boolean;
}

export interface RepoScan {
  dir: string;
  ok: boolean;
  notes: string[];                 // anything that went sideways, surfaced not thrown

  framework: string;               // "tanstack-start" | "vite-react" | "next" | "unknown"
  packageManager: string;          // "npm" | "pnpm" | "yarn" | "bun" | "unknown"
  usesSupabaseJs: boolean;
  supabaseJsVersion?: string;

  // Detected client API surface
  clientCalls: ClientCall[];
  usesAuth: boolean;
  usesStorage: boolean;
  usesRealtime: boolean;
  usesRpc: boolean;
  usesEdgeFunctions: boolean;
  tablesReferencedInCode: string[];   // distinct args to .from(...)
  rpcsReferencedInCode: string[];     // distinct args to .rpc(...)

  // Env var names referenced (VITE_/SUPABASE_), values never captured
  envVars: string[];

  // Migration files (repo-relative paths), in lexical order
  migrationFiles: string[];

  // Parsed SQL facts
  tables: SqlTable[];
  indexes: SqlIndex[];
  extensions: string[];
  functions: SqlFunction[];
  triggers: SqlTrigger[];
  rlsPolicies: RlsPolicy[];
  realtimeTables: string[];           // tables added to supabase_realtime publication
  storageBuckets: StorageBucket[];
  edgeFunctions: string[];            // names under supabase/functions/*
}

// ───────────────────────── Public entry point ─────────────────────────

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.vercel',
  'coverage', '.cache', '.output', '.vite', '.idea', '.vscode',
]);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

export async function scanRepo(dir: string): Promise<RepoScan> {
  const scan: RepoScan = {
    dir,
    ok: false,
    notes: [],
    framework: 'unknown',
    packageManager: 'unknown',
    usesSupabaseJs: false,
    clientCalls: [],
    usesAuth: false,
    usesStorage: false,
    usesRealtime: false,
    usesRpc: false,
    usesEdgeFunctions: false,
    tablesReferencedInCode: [],
    rpcsReferencedInCode: [],
    envVars: [],
    migrationFiles: [],
    tables: [],
    indexes: [],
    extensions: [],
    functions: [],
    triggers: [],
    rlsPolicies: [],
    realtimeTables: [],
    storageBuckets: [],
    edgeFunctions: [],
  };

  try {
    if (!dir || !existsSync(dir)) {
      scan.notes.push(`repo dir not found: ${dir}`);
      return scan;
    }

    // 1) package.json — framework, package manager, supabase-js
    detectPackage(dir, scan);

    // 2) walk source for client API usage + env vars
    const codeFiles = collectCodeFiles(dir, scan);
    for (const file of codeFiles) {
      scanCodeFile(dir, file, scan);
    }
    dedupeClientFacts(scan);

    // 3) SQL migrations
    parseMigrations(dir, scan);

    // 4) edge functions on disk
    detectEdgeFunctions(dir, scan);

    // cross-link: storage usage in code implies bucket even if no RLS parsed
    if (scan.usesStorage && scan.storageBuckets.length === 0) {
      for (const c of scan.clientCalls) {
        if (c.kind === 'storage' && c.detail && c.detail !== 'storage') {
          if (!scan.storageBuckets.some((b) => b.name === c.detail)) {
            scan.storageBuckets.push({ name: c.detail, publicRead: false });
          }
        }
      }
    }

    scan.ok = true;
  } catch (err) {
    // Last-ditch: never propagate. Recon degrades, it does not crash the swarm.
    scan.notes.push(`scan error: ${errMsg(err)}`);
  }

  return scan;
}

// ───────────────────────── package.json ─────────────────────────

function detectPackage(dir: string, scan: RepoScan): void {
  const pkgPath = join(dir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(safeRead(pkgPath));
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

      const supaVer = deps['@supabase/supabase-js'];
      if (supaVer) {
        scan.usesSupabaseJs = true;
        scan.supabaseJsVersion = String(supaVer);
      }

      // framework heuristic
      if (deps['@tanstack/react-start']) scan.framework = 'tanstack-start';
      else if (deps['next']) scan.framework = 'next';
      else if (deps['@remix-run/react']) scan.framework = 'remix';
      else if (deps['vite'] && (deps['react'] || deps['react-dom'])) scan.framework = 'vite-react';
      else if (deps['vite']) scan.framework = 'vite';
    } catch (err) {
      scan.notes.push(`package.json parse failed: ${errMsg(err)}`);
    }
  } else {
    scan.notes.push('no package.json at repo root');
  }

  // package manager from lockfile
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) scan.packageManager = 'pnpm';
  else if (existsSync(join(dir, 'yarn.lock'))) scan.packageManager = 'yarn';
  else if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) scan.packageManager = 'bun';
  else if (existsSync(join(dir, 'package-lock.json'))) scan.packageManager = 'npm';
}

// ───────────────────────── source walk ─────────────────────────

function collectCodeFiles(dir: string, scan: RepoScan): string[] {
  const out: string[] = [];
  const roots = ['src', 'app', 'pages', 'lib'].map((s) => join(dir, s)).filter(existsSync);
  // If no conventional roots, fall back to scanning the dir root (shallow-ish via walk).
  const startDirs = roots.length ? roots : [dir];

  for (const root of startDirs) {
    walk(root, out, scan, 0);
  }
  return out;
}

function walk(current: string, out: string[], scan: RepoScan, depth: number): void {
  if (depth > 12) return; // guard against symlink loops / pathological trees
  let entries: string[];
  try {
    entries = readdirSync(current);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(current, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out, scan, depth + 1);
    } else if (st.isFile() && CODE_EXTS.has(extname(entry))) {
      // skip the autogenerated route tree and giant lockfiles
      if (entry === 'routeTree.gen.ts') continue;
      out.push(full);
    }
  }
}

// Regexes for the Supabase client API surface. Loose on whitespace, anchored on `.method(`.
const RE_FROM = /supabase\s*\.\s*from\s*\(\s*['"`]([^'"`]+)['"`]/g;
const RE_RPC = /supabase\s*\.\s*rpc\s*\(\s*['"`]([^'"`]+)['"`]/g;
const RE_STORAGE_FROM = /supabase\s*\.\s*storage\s*\.\s*from\s*\(\s*['"`]([^'"`]+)['"`]/g;
const RE_STORAGE_ANY = /supabase\s*\.\s*storage\b/g;
const RE_AUTH = /supabase\s*\.\s*auth\s*\.\s*([A-Za-z0-9_]+)/g;
const RE_CHANNEL = /supabase\s*\.\s*channel\s*\(\s*['"`]([^'"`]*)['"`]?/g;
const RE_REALTIME_HINT = /\.\s*on\s*\(\s*['"`]postgres_changes['"`]|\.\s*subscribe\s*\(/g;
const RE_FN_INVOKE = /\.\s*functions\s*\.\s*invoke\s*\(\s*['"`]([^'"`]+)['"`]/g;
const RE_ENV = /(?:import\s*\.\s*meta\s*\.\s*env|process\s*\.\s*env)\s*\.\s*((?:VITE_)?(?:SUPABASE|LOVABLE)[A-Z0-9_]+)/g;

function scanCodeFile(dir: string, file: string, scan: RepoScan): void {
  const rel = relative(dir, file);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return;
  }

  // Precompute line offsets so we can map an index → line number cheaply.
  const lineStarts = computeLineStarts(text);
  const at = (idx: number) => lineOf(lineStarts, idx);

  collect(text, RE_FROM, (m, idx) => {
    scan.usesSupabaseJs = true;
    scan.clientCalls.push({ kind: 'from', detail: m[1], file: rel, line: at(idx) });
  });
  collect(text, RE_RPC, (m, idx) => {
    scan.usesRpc = true;
    scan.clientCalls.push({ kind: 'rpc', detail: m[1], file: rel, line: at(idx) });
  });
  collect(text, RE_STORAGE_FROM, (m, idx) => {
    scan.usesStorage = true;
    scan.clientCalls.push({ kind: 'storage', detail: m[1], file: rel, line: at(idx) });
  });
  // bare storage usage (e.g. getPublicUrl chains) without a bucket capture
  collect(text, RE_STORAGE_ANY, (_m, idx) => {
    scan.usesStorage = true;
    // only record a generic marker if no specific storage.from on this line already
  });
  collect(text, RE_AUTH, (m, idx) => {
    scan.usesAuth = true;
    scan.clientCalls.push({ kind: 'auth', detail: m[1], file: rel, line: at(idx) });
  });
  collect(text, RE_CHANNEL, (m, idx) => {
    scan.usesRealtime = true;
    scan.clientCalls.push({ kind: 'channel', detail: m[1] || 'channel', file: rel, line: at(idx) });
  });
  // realtime can also be detected via postgres_changes / subscribe even if channel name dynamic
  if (RE_REALTIME_HINT.test(text)) scan.usesRealtime = true;
  RE_REALTIME_HINT.lastIndex = 0;

  collect(text, RE_FN_INVOKE, (m, idx) => {
    scan.usesEdgeFunctions = true;
    scan.clientCalls.push({ kind: 'functions_invoke', detail: m[1], file: rel, line: at(idx) });
  });
  collect(text, RE_ENV, (m) => {
    if (!scan.envVars.includes(m[1])) scan.envVars.push(m[1]);
  });
}

function collect(
  text: string,
  re: RegExp,
  cb: (m: RegExpExecArray, idx: number) => void,
): void {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    cb(m, m.index);
    if (m.index === re.lastIndex) re.lastIndex++; // zero-width guard
  }
}

function dedupeClientFacts(scan: RepoScan): void {
  const tables = new Set<string>();
  const rpcs = new Set<string>();
  for (const c of scan.clientCalls) {
    if (c.kind === 'from') tables.add(c.detail);
    if (c.kind === 'rpc') rpcs.add(c.detail);
  }
  scan.tablesReferencedInCode = [...tables].sort();
  scan.rpcsReferencedInCode = [...rpcs].sort();
}

// ───────────────────────── SQL migration parsing ─────────────────────────

function parseMigrations(dir: string, scan: RepoScan): void {
  const migDir = join(dir, 'supabase', 'migrations');
  if (!existsSync(migDir)) {
    scan.notes.push('no supabase/migrations directory');
    return;
  }
  let files: string[];
  try {
    files = readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();
  } catch (err) {
    scan.notes.push(`cannot read migrations: ${errMsg(err)}`);
    return;
  }

  for (const f of files) {
    const full = join(migDir, f);
    scan.migrationFiles.push(relative(dir, full));
    const sql = safeRead(full);
    if (!sql) continue;
    try {
      parseSql(sql, scan);
    } catch (err) {
      scan.notes.push(`SQL parse issue in ${f}: ${errMsg(err)}`);
    }
  }

  // Mark vector columns / rls / realtime flags onto the table records.
  finalizeTables(scan);
}

function parseSql(sqlRaw: string, scan: RepoScan): void {
  const sql = stripSqlComments(sqlRaw);

  // extensions
  for (const m of sql.matchAll(/create\s+extension\s+(?:if\s+not\s+exists\s+)?["']?([a-z0-9_]+)["']?/gi)) {
    const ext = m[1].toLowerCase();
    if (!scan.extensions.includes(ext)) scan.extensions.push(ext);
  }

  // tables: split on statement terminators that aren't inside the column list.
  for (const m of sql.matchAll(
    /create\s+table\s+(?:if\s+not\s+exists\s+)?((?:[a-z0-9_]+)\.)?([a-z0-9_]+)\s*\(([\s\S]*?)\)\s*;/gi,
  )) {
    const schema = (m[1] ? m[1].replace('.', '') : 'public').toLowerCase();
    const name = m[2].toLowerCase();
    const columns = parseColumns(m[3]);
    const table: SqlTable = {
      name,
      schema,
      columns,
      hasVectorColumn: columns.some((c) => /vector\s*\(/i.test(c.type) || /\bvector\b/i.test(c.type)),
      rlsEnabled: false,
      inRealtimePublication: false,
    };
    if (!scan.tables.some((t) => t.name === name && t.schema === schema)) {
      scan.tables.push(table);
    }
  }

  // indexes (incl. vector ones via `using hnsw/ivfflat`)
  for (const m of sql.matchAll(
    /create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\s+on\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s*(?:using\s+([a-z0-9_]+)\s*)?\(([\s\S]*?)\)/gi,
  )) {
    const using = m[3]?.toLowerCase();
    scan.indexes.push({
      name: m[1].toLowerCase(),
      table: m[2].toLowerCase(),
      using,
      columns: m[4].trim().replace(/\s+/g, ' '),
      isVector: using === 'hnsw' || using === 'ivfflat',
    });
  }

  // enable RLS
  for (const m of sql.matchAll(/alter\s+table\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi)) {
    const t = m[1].toLowerCase();
    const tbl = scan.tables.find((x) => x.name === t);
    if (tbl) tbl.rlsEnabled = true;
    else scan.tables.push(makeStub(t));
    const stub = scan.tables.find((x) => x.name === t);
    if (stub) stub.rlsEnabled = true;
  }

  // RLS policies
  for (const m of sql.matchAll(
    /create\s+policy\s+["']([^"']+)["']\s+on\s+(?:([a-z0-9_]+)\.)?([a-z0-9_]+)\s+for\s+([a-z]+)([\s\S]*?);/gi,
  )) {
    const body = m[5] ?? '';
    scan.rlsPolicies.push({
      name: m[1],
      table: m[3].toLowerCase(),
      command: m[4].toUpperCase(),
      usesAuthUid: /auth\s*\.\s*uid\s*\(\s*\)/i.test(body),
      expression: truncate(body.trim().replace(/\s+/g, ' '), 200),
    });
  }

  // functions
  for (const m of sql.matchAll(
    /create\s+(?:or\s+replace\s+)?function\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s*\(([\s\S]*?)\)([\s\S]*?)\$\$([\s\S]*?)\$\$/gi,
  )) {
    const name = m[1].toLowerCase();
    const meta = m[3] ?? '';
    const body = m[4] ?? '';
    const language = (meta.match(/language\s+([a-z]+)/i)?.[1] ?? 'unknown').toLowerCase();
    const security: SqlFunction['security'] = /security\s+definer/i.test(meta)
      ? 'definer'
      : /security\s+invoker/i.test(meta)
        ? 'invoker'
        : 'unknown';
    const fn: SqlFunction = {
      name,
      language,
      security,
      returnsTable: /returns\s+table/i.test(meta),
      body: truncate(body.trim(), 400),
      usesPgNet: /net\s*\.\s*http_post/i.test(body),
    };
    // last definition wins (mirrors `create or replace`)
    const existing = scan.functions.findIndex((f) => f.name === name);
    if (existing >= 0) scan.functions[existing] = fn;
    else scan.functions.push(fn);
  }

  // triggers
  for (const m of sql.matchAll(
    /create\s+trigger\s+([a-z0-9_]+)\s+(before|after|instead\s+of)\s+([a-z\s,]+?)\s+on\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)[\s\S]*?execute\s+(?:function|procedure)\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)/gi,
  )) {
    const events = m[3]
      .split(/\s+or\s+|,/i)
      .map((e) => e.trim().toUpperCase())
      .filter(Boolean);
    scan.triggers.push({
      name: m[1].toLowerCase(),
      table: m[4].toLowerCase(),
      timing: m[2].toUpperCase().replace(/\s+/g, ' '),
      events,
      functionName: m[5].toLowerCase(),
    });
  }

  // realtime publication
  for (const m of sql.matchAll(
    /alter\s+publication\s+supabase_realtime\s+add\s+table\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)/gi,
  )) {
    const t = m[1].toLowerCase();
    if (!scan.realtimeTables.includes(t)) scan.realtimeTables.push(t);
  }

  // storage buckets via storage.objects policies (bucket_id = 'x')
  for (const m of sql.matchAll(/bucket_id\s*=\s*['"]([^'"]+)['"]/gi)) {
    const bucket = m[1];
    let b = scan.storageBuckets.find((x) => x.name === bucket);
    if (!b) {
      b = { name: bucket, publicRead: false };
      scan.storageBuckets.push(b);
    }
  }
  // public-read detection: a SELECT policy on storage.objects gated on this bucket
  for (const m of sql.matchAll(
    /for\s+select[\s\S]*?bucket_id\s*=\s*['"]([^'"]+)['"]/gi,
  )) {
    const b = scan.storageBuckets.find((x) => x.name === m[1]);
    if (b) b.publicRead = true;
  }
}

function parseColumns(block: string): SqlColumn[] {
  const cols: SqlColumn[] = [];
  for (const raw of splitColumnDefs(block)) {
    const line = raw.trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    // skip table-level constraints
    if (
      /^(primary\s+key|unique|foreign\s+key|constraint|check)\b/.test(lower)
    ) {
      continue;
    }
    const nameMatch = line.match(/^["']?([a-z0-9_]+)["']?\s+(.*)$/i);
    if (!nameMatch) continue;
    const name = nameMatch[1].toLowerCase();
    const rest = nameMatch[2];
    // type = up to the first constraint keyword
    const typeMatch = rest.match(
      /^([a-z0-9_]+(?:\s*\([^)]*\))?(?:\s+with\s+time\s+zone|\s+without\s+time\s+zone)?(?:\[\])?)/i,
    );
    const type = (typeMatch?.[1] ?? rest.split(/\s+/)[0] ?? 'unknown').trim();
    const def = rest.match(/default\s+([^,]+?)(?:\s+(?:not\s+null|references|check|unique|primary)\b|$)/i)?.[1]?.trim();
    const ref = rest.match(/references\s+((?:[a-z0-9_]+\.)?[a-z0-9_]+\s*\([^)]*\))/i)?.[1]?.replace(/\s+/g, '');
    cols.push({
      name,
      type,
      notNull: /\bnot\s+null\b/i.test(rest),
      default: def,
      references: ref,
    });
  }
  return cols;
}

// Split a column-definition block on top-level commas (ignore commas inside parens).
function splitColumnDefs(block: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of block) {
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) out.push(buf);
  return out;
}

function finalizeTables(scan: RepoScan): void {
  for (const t of scan.tables) {
    if (scan.realtimeTables.includes(t.name)) t.inRealtimePublication = true;
    if (scan.rlsPolicies.some((p) => p.table === t.name)) t.rlsEnabled = true;
  }
}

function makeStub(name: string): SqlTable {
  return {
    name,
    schema: 'public',
    columns: [],
    hasVectorColumn: false,
    rlsEnabled: false,
    inRealtimePublication: false,
  };
}

// ───────────────────────── edge functions ─────────────────────────

function detectEdgeFunctions(dir: string, scan: RepoScan): void {
  const fnDir = join(dir, 'supabase', 'functions');
  if (!existsSync(fnDir)) return;
  let entries: string[];
  try {
    entries = readdirSync(fnDir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(fnDir, entry);
    try {
      if (statSync(full).isDirectory() && entry !== '_shared') {
        scan.edgeFunctions.push(entry);
        scan.usesEdgeFunctions = true;
      }
    } catch {
      /* ignore */
    }
  }
}

// ───────────────────────── tiny utilities ─────────────────────────

function stripSqlComments(sql: string): string {
  // remove -- line comments and /* */ block comments (keeps $$ bodies intact enough for our regexes)
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ');
}

function computeLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) starts.push(i + 1);
  }
  return starts;
}

function lineOf(starts: number[], idx: number): number {
  // binary search for the greatest start <= idx
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

function safeRead(p: string): string {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
