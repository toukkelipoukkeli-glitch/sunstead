// core/graph.ts — the heart of "behavior migration".
//
// Fuses the static repo scan + (optional) live DB introspection into a single BehaviorGraph:
// one node per behavior (table, index, function, trigger, RLS policy, extension, realtime,
// auth, storage, RPC, edge-function, client call), each classified into how the swarm will
// handle it, with dependency edges and a 0..100 readiness score (the proof number).
//
// Classification policy (per shared/types.ts):
//   direct_migrate    tables, indexes, constraints, pgvector, plain functions/triggers
//   aiven_rewrite     realtime publication / channels  → Kafka + SSE bridge
//   generate_service  auth, storage, the data-API client surface (.from/.rpc), edge functions
//   review            RLS policies that reference auth.uid() (semantics tied to auth context)
//   cut               nothing here by default (kept for completeness)
//
// Pure + deterministic: no I/O, no network. Defensive against partial inputs (repo-only mode
// where introspection is empty, or a scan that found very little).

import type {
  BehaviorGraph,
  BehaviorNode,
  BehaviorKind,
  Classification,
  AivenTarget,
} from '../shared/types.ts';
import type { RepoScan } from './scan.ts';
import type { SourceIntrospection } from './introspect.ts';

// ───────────────────────── Public entry point ─────────────────────────

export function buildGraph(scan: RepoScan, intro: SourceIntrospection): BehaviorGraph {
  const b = new GraphBuilder(scan, intro);
  return b.build();
}

// ───────────────────────── builder ─────────────────────────

interface ClassifyRules {
  classification: Classification;
  target: AivenTarget;
}

const RULES: Record<BehaviorKind, ClassifyRules> = {
  table: { classification: 'direct_migrate', target: 'aiven_postgres' },
  index: { classification: 'direct_migrate', target: 'aiven_postgres' },
  constraint: { classification: 'direct_migrate', target: 'aiven_postgres' },
  view: { classification: 'direct_migrate', target: 'aiven_postgres' },
  extension: { classification: 'direct_migrate', target: 'aiven_postgres' },
  function: { classification: 'direct_migrate', target: 'aiven_postgres' },
  trigger: { classification: 'direct_migrate', target: 'aiven_postgres' },
  realtime: { classification: 'aiven_rewrite', target: 'aiven_kafka' },
  auth: { classification: 'generate_service', target: 'generated_backend' },
  storage: { classification: 'generate_service', target: 'generated_backend' },
  rpc: { classification: 'generate_service', target: 'generated_backend' },
  client_call: { classification: 'generate_service', target: 'generated_backend' },
  edge_function: { classification: 'generate_service', target: 'generated_backend' },
  rls: { classification: 'review', target: 'generated_backend' },
};

class GraphBuilder {
  private nodes: BehaviorNode[] = [];
  private ids = new Set<string>();
  private scan: RepoScan;
  private intro: SourceIntrospection;

  constructor(scan: RepoScan, intro: SourceIntrospection) {
    this.scan = scan;
    this.intro = intro;
  }

  build(): BehaviorGraph {
    this.addExtensions();
    this.addTables();
    this.addIndexes();
    this.addFunctions();
    this.addTriggers();
    this.addRealtime();
    this.addRls();
    this.addAuth();
    this.addStorage();
    this.addRpc();
    this.addEdgeFunctions();
    this.addDataApiSurface();

    const source = this.buildSourceSummary();
    const readiness = this.computeReadiness();
    const summary = this.buildSummary(source, readiness);

    return { source, nodes: this.nodes, readiness, summary };
  }

  // ── node helpers ──

  private add(
    kind: BehaviorKind,
    name: string,
    detail: string,
    opts: { dependsOn?: string[]; evidence?: string[]; override?: Partial<ClassifyRules> } = {},
  ): string {
    const id = this.uniqueId(`${kind}:${name}`);
    const rule = RULES[kind];
    this.nodes.push({
      id,
      kind,
      name,
      detail,
      classification: opts.override?.classification ?? rule.classification,
      target: opts.override?.target ?? rule.target,
      dependsOn: (opts.dependsOn ?? []).filter((d) => this.ids.has(d)),
      evidence: opts.evidence,
    });
    return id;
  }

  private uniqueId(base: string): string {
    let id = base;
    let n = 2;
    while (this.ids.has(id)) id = `${base}#${n++}`;
    this.ids.add(id);
    return id;
  }

  private findId(prefix: string): string | undefined {
    for (const id of this.ids) if (id.startsWith(prefix)) return id;
    return undefined;
  }

  // ── behavior collectors (introspection wins; fall back to repo scan) ──

  private addExtensions(): void {
    const exts = unique([...this.intro.extensions, ...this.scan.extensions])
      // ignore noise extensions that always exist / aren't user-meaningful
      .filter((e) => !['plpgsql'].includes(e));
    for (const ext of exts) {
      const isVector = ext === 'vector';
      this.add('extension', ext, isVector ? 'pgvector — carries semantic search' : `Postgres extension ${ext}`, {
        evidence: this.intro.extensions.includes(ext)
          ? ['source DB: pg_extension']
          : ['repo: supabase/migrations'],
        // pgvector is the differentiator: still direct_migrate, but called out.
      });
    }
  }

  private addTables(): void {
    const tables = this.mergedTables();
    for (const t of tables) {
      const colSummary = t.columns.length
        ? `${t.columns.length} cols${t.hasVectorColumn ? ' (incl. vector embedding)' : ''}`
        : 'columns from migration';
      const rows = this.intro.rowCounts[t.name];
      const detail =
        `${colSummary}` +
        (typeof rows === 'number' ? ` · ${rows} rows` : '') +
        (t.inRealtimePublication ? ' · realtime' : '');
      this.add('table', t.name, detail, {
        dependsOn: this.findId('extension:vector') && t.hasVectorColumn ? [this.findId('extension:vector')!] : [],
        evidence: this.evidenceForTable(t.name),
      });
    }
  }

  private addIndexes(): void {
    const indexes = this.mergedIndexes();
    for (const idx of indexes) {
      const tableId = this.findId(`table:${idx.table}`);
      const detail = idx.isVector
        ? `vector index (${idx.using ?? 'hnsw/ivfflat'}) on ${idx.table} — powers similarity search`
        : `index on ${idx.table}${idx.using ? ` using ${idx.using}` : ''}`;
      this.add('index', idx.name, detail, {
        dependsOn: tableId ? [tableId] : [],
        evidence: idx.evidence,
      });
    }
  }

  private addFunctions(): void {
    const fns = this.mergedFunctions();
    for (const fn of fns) {
      // A function whose whole job is to call an edge function (net.http_post) is really the
      // edge-function trigger pattern → needs a generated replacement, not a raw copy.
      const isEdgeTrigger = fn.usesPgNet;
      const detail = isEdgeTrigger
        ? `pg_net → edge function (embedding trigger) — needs generated replacement`
        : `${fn.language} function${fn.returnsTable ? ' returning table (search RPC)' : ''}, security ${fn.security}`;
      this.add('function', fn.name, detail, {
        evidence: fn.evidence,
        override: isEdgeTrigger
          ? { classification: 'generate_service', target: 'generated_backend' }
          : undefined,
      });
    }
  }

  private addTriggers(): void {
    const trgs = this.mergedTriggers();
    for (const tr of trgs) {
      const tableId = this.findId(`table:${tr.table}`);
      const fnId = this.findId(`function:${tr.functionName}`);
      const deps = [tableId, fnId].filter(Boolean) as string[];
      this.add('trigger', tr.name, `${tr.timing} ${tr.events.join('/')} on ${tr.table} → ${tr.functionName}()`, {
        dependsOn: deps,
        evidence: tr.evidence,
      });
    }
  }

  private addRealtime(): void {
    const rtTables = unique([
      ...this.scan.realtimeTables,
      ...this.mergedTables().filter((t) => t.inRealtimePublication).map((t) => t.name),
    ]);
    const channelNames = unique(
      this.scan.clientCalls.filter((c) => c.kind === 'channel').map((c) => c.detail),
    );

    if (!rtTables.length && !this.scan.usesRealtime) return;

    for (const t of rtTables) {
      const tableId = this.findId(`table:${t}`);
      this.add('realtime', `realtime:${t}`, `postgres_changes on ${t} → Aiven Kafka topic + SSE bridge`, {
        dependsOn: tableId ? [tableId] : [],
        evidence: [
          'repo: supabase_realtime publication',
          ...channelNames.map((c) => `channel "${c}"`),
        ],
      });
    }

    // If code clearly subscribes but no publication table was parsed, still register the behavior.
    if (!rtTables.length && this.scan.usesRealtime) {
      this.add('realtime', 'realtime:client', 'supabase.channel(...).on(postgres_changes) → Kafka + SSE', {
        evidence: channelNames.map((c) => `channel "${c}"`),
      });
    }
  }

  private addRls(): void {
    const policies = this.mergedPolicies();
    for (const p of policies) {
      const tableId = this.findId(`table:${p.table}`);
      const authDep = p.usesAuthUid ? this.findId('auth:') : undefined;
      const detail = p.usesAuthUid
        ? `${p.command} policy on ${p.table} gated on auth.uid() — review: re-express against generated auth`
        : `${p.command} policy on ${p.table} (${p.expression || 'public'})`;
      this.add('rls', p.name, detail, {
        dependsOn: [tableId, authDep].filter(Boolean) as string[],
        evidence: p.evidence,
        // A policy that's just `using (true)` (public read) is not really auth-bound → direct.
        override: p.usesAuthUid
          ? undefined
          : { classification: 'direct_migrate', target: 'aiven_postgres' },
      });
    }
  }

  private addAuth(): void {
    if (!this.scan.usesAuth) return;
    const methods = unique(
      this.scan.clientCalls.filter((c) => c.kind === 'auth').map((c) => c.detail),
    );
    this.add('auth', 'auth', `Supabase Auth (${methods.join(', ') || 'session/sign-in'}) → generated JWT auth service`, {
      evidence: this.evidenceFor('auth'),
    });
  }

  private addStorage(): void {
    if (!this.scan.usesStorage) return;
    const buckets = this.scan.storageBuckets.map((b) => b.name);
    this.add('storage', 'storage', `Supabase Storage (${buckets.join(', ') || 'bucket'}) → generated bytea/object store + signed URLs`, {
      evidence: this.evidenceFor('storage'),
    });
  }

  private addRpc(): void {
    const rpcs = unique([
      ...this.scan.rpcsReferencedInCode,
      ...this.scan.clientCalls.filter((c) => c.kind === 'rpc').map((c) => c.detail),
    ]);
    for (const name of rpcs) {
      // RPC maps to a Postgres function; the *call surface* (supabase.rpc) must be regenerated as
      // an HTTP route. The underlying function still direct-migrates (separate function node).
      const fnId = this.findId(`function:${name}`);
      this.add('rpc', name, `supabase.rpc("${name}") → generated /api route over Aiven PG`, {
        dependsOn: fnId ? [fnId] : [],
        evidence: this.evidenceForCall('rpc', name),
      });
    }
  }

  private addEdgeFunctions(): void {
    const fns = unique([
      ...this.scan.edgeFunctions,
      ...this.scan.clientCalls.filter((c) => c.kind === 'functions_invoke').map((c) => c.detail),
    ]);
    for (const name of fns) {
      this.add('edge_function', name, `Supabase Edge Function "${name}" → generated server route`, {
        evidence: this.evidenceForCall('functions_invoke', name) ?? ['repo: supabase/functions'],
      });
    }
  }

  // The raw data-API client surface (`supabase.from('x')`) becomes generated REST/data routes.
  private addDataApiSurface(): void {
    const tablesUsed = unique(this.scan.tablesReferencedInCode);
    if (!tablesUsed.length) return;
    this.add(
      'client_call',
      'data-api',
      `supabase.from(${tablesUsed.map((t) => `"${t}"`).join(', ')}) → generated data API over Aiven PG`,
      {
        dependsOn: tablesUsed
          .map((t) => this.findId(`table:${t}`))
          .filter(Boolean) as string[],
        evidence: this.scan.clientCalls
          .filter((c) => c.kind === 'from')
          .slice(0, 6)
          .map((c) => `${c.file}:${c.line}`),
      },
    );
  }

  // ── merge: prefer live introspection, fall back to / union with repo scan ──

  private mergedTables(): Array<{
    name: string;
    columns: { name: string }[];
    hasVectorColumn: boolean;
    inRealtimePublication: boolean;
  }> {
    if (this.intro.tables.length) {
      return this.intro.tables.map((t) => ({
        name: t.name,
        columns: t.columns,
        hasVectorColumn: t.hasVectorColumn,
        inRealtimePublication: this.scan.realtimeTables.includes(t.name),
      }));
    }
    return this.scan.tables.map((t) => ({
      name: t.name,
      columns: t.columns,
      hasVectorColumn: t.hasVectorColumn,
      inRealtimePublication: t.inRealtimePublication,
    }));
  }

  private mergedIndexes(): Array<{ name: string; table: string; using?: string; isVector: boolean; evidence: string[] }> {
    if (this.intro.indexes.length) {
      return this.intro.indexes
        .filter((i) => !i.isPrimary) // pkeys ride along with the table create
        .map((i) => ({
          name: i.name,
          table: i.table,
          using: i.isVector ? 'hnsw/ivfflat' : undefined,
          isVector: i.isVector,
          evidence: ['source DB: pg_indexes'],
        }));
    }
    return this.scan.indexes.map((i) => ({
      name: i.name,
      table: i.table,
      using: i.using,
      isVector: i.isVector,
      evidence: ['repo: supabase/migrations'],
    }));
  }

  private mergedFunctions(): Array<{
    name: string;
    language: string;
    security: string;
    returnsTable: boolean;
    usesPgNet: boolean;
    evidence: string[];
  }> {
    if (this.intro.functions.length) {
      return this.intro.functions.map((f) => ({
        name: f.name,
        language: f.language,
        security: f.security,
        returnsTable: f.returnsTable,
        usesPgNet: f.usesPgNet,
        evidence: ['source DB: pg_proc'],
      }));
    }
    return this.scan.functions.map((f) => ({
      name: f.name,
      language: f.language,
      security: f.security,
      returnsTable: f.returnsTable,
      usesPgNet: f.usesPgNet,
      evidence: ['repo: supabase/migrations'],
    }));
  }

  private mergedTriggers(): Array<{
    name: string;
    table: string;
    timing: string;
    events: string[];
    functionName: string;
    evidence: string[];
  }> {
    if (this.intro.triggers.length) {
      return this.intro.triggers.map((t) => ({ ...t, evidence: ['source DB: information_schema.triggers'] }));
    }
    return this.scan.triggers.map((t) => ({ ...t, evidence: ['repo: supabase/migrations'] }));
  }

  private mergedPolicies(): Array<{
    name: string;
    table: string;
    command: string;
    usesAuthUid: boolean;
    expression: string;
    evidence: string[];
  }> {
    if (this.intro.policies.length) {
      return this.intro.policies.map((p) => ({
        name: p.name,
        table: p.table,
        command: p.command,
        usesAuthUid: p.usesAuthUid,
        expression: truncate(`${p.using ?? ''}${p.withCheck ? ` / ${p.withCheck}` : ''}`, 120),
        evidence: ['source DB: pg_policies'],
      }));
    }
    return this.scan.rlsPolicies.map((p) => ({
      name: p.name,
      table: p.table,
      command: p.command,
      usesAuthUid: p.usesAuthUid,
      expression: p.expression,
      evidence: ['repo: supabase/migrations'],
    }));
  }

  // ── evidence helpers ──

  private evidenceForTable(name: string): string[] {
    const ev: string[] = [];
    if (this.intro.tables.some((t) => t.name === name)) ev.push('source DB: information_schema.tables');
    if (this.scan.tables.some((t) => t.name === name)) ev.push('repo: supabase/migrations');
    const usage = this.scan.clientCalls.filter((c) => c.kind === 'from' && c.detail === name).slice(0, 3);
    for (const u of usage) ev.push(`${u.file}:${u.line}`);
    return ev.length ? ev : ['(no direct evidence)'];
  }

  private evidenceFor(kind: 'auth' | 'storage'): string[] {
    return this.scan.clientCalls
      .filter((c) => c.kind === kind)
      .slice(0, 4)
      .map((c) => `${c.file}:${c.line} (${c.detail})`);
  }

  private evidenceForCall(kind: 'rpc' | 'functions_invoke', name: string): string[] | undefined {
    const hits = this.scan.clientCalls
      .filter((c) => c.kind === kind && c.detail === name)
      .slice(0, 4)
      .map((c) => `${c.file}:${c.line}`);
    return hits.length ? hits : undefined;
  }

  // ── source summary ──

  private buildSourceSummary(): BehaviorGraph['source'] {
    const tables = this.mergedTables().map((t) => t.name);
    const extensions = unique([...this.intro.extensions, ...this.scan.extensions]).filter(
      (e) => e !== 'plpgsql',
    );
    const rowCounts: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.intro.rowCounts)) rowCounts[k] = v;

    const hasRealtime =
      this.scan.usesRealtime ||
      this.scan.realtimeTables.length > 0 ||
      this.mergedTables().some((t) => t.inRealtimePublication);

    return {
      framework: this.scan.framework,
      usesSupabaseJs: this.scan.usesSupabaseJs,
      tables,
      extensions,
      hasAuth: this.scan.usesAuth,
      hasStorage: this.scan.usesStorage,
      hasRealtime,
      hasEdgeFunctions: this.scan.usesEdgeFunctions || this.scan.edgeFunctions.length > 0,
      rowCounts,
    };
  }

  // ── readiness 0..100 ──
  //
  // The proof number. Weighted blend of:
  //  - coverage: did we actually recover behaviors to act on? (a richer graph = more confidence)
  //  - automation: fraction of behaviors handled without human review (direct/rewrite/generate)
  //  - grounding: bonus when we have a live DB introspection, not just repo guesses
  // Capped so a totally empty scan reads low, and a fully-understood app reads high but honest.

  private computeReadiness(): number {
    const total = this.nodes.length;
    if (total === 0) return 0;

    const byClass = (c: Classification) => this.nodes.filter((n) => n.classification === c).length;
    const direct = byClass('direct_migrate');
    const rewrite = byClass('aiven_rewrite');
    const generate = byClass('generate_service');
    const review = byClass('review');
    const cut = byClass('cut');

    // automation: review/cut drag the score; generate is automated but ambitious (slightly < direct)
    const automationScore =
      (direct * 1.0 + rewrite * 0.9 + generate * 0.8 + review * 0.4 + cut * 0.0) / total; // 0..1

    // coverage: more recovered behaviors → more confidence, saturating around ~16 nodes.
    const coverage = Math.min(1, total / 16);

    // grounding bonus: a real DB connection + row counts means the plan is verifiable.
    const grounded = this.intro.connected;
    const hasRows = Object.values(this.intro.rowCounts).some((n) => n > 0);
    const groundingBonus = (grounded ? 0.06 : 0) + (hasRows ? 0.04 : 0);

    // base blend
    let score = (automationScore * 0.7 + coverage * 0.3) * 100;
    score = score * (1 + groundingBonus);

    // floors/ceilings: never claim >97 (something always needs eyes), never <5 if we found anything.
    score = clamp(score, total > 0 ? 5 : 0, 97);
    return Math.round(score);
  }

  private buildSummary(source: BehaviorGraph['source'], readiness: number): string {
    const counts = countBy(this.nodes, (n) => n.classification);
    const parts: string[] = [];
    if (counts.direct_migrate) parts.push(`${counts.direct_migrate} direct-migrate`);
    if (counts.aiven_rewrite) parts.push(`${counts.aiven_rewrite} Kafka-rewrite`);
    if (counts.generate_service) parts.push(`${counts.generate_service} generated-service`);
    if (counts.review) parts.push(`${counts.review} review`);
    if (counts.cut) parts.push(`${counts.cut} cut`);

    const grounding = this.intro.connected
      ? `live source DB (${source.tables.length} tables, ${sumRows(source.rowCounts)} rows)`
      : 'repo-only mode (no source DB connected)';

    return (
      `${source.framework} app on Supabase → Aiven. ` +
      `${this.nodes.length} behaviors recovered from ${grounding}: ${parts.join(', ') || 'none'}. ` +
      `pgvector=${source.extensions.includes('vector')}, realtime=${source.hasRealtime}, ` +
      `auth=${source.hasAuth}, storage=${source.hasStorage}. Readiness ${readiness}/100.`
    );
  }
}

// ───────────────────────── tiny utils ─────────────────────────

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function countBy<T>(arr: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of arr) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function sumRows(rc: Record<string, number>): number {
  return Object.values(rc).reduce((a, b) => a + b, 0);
}
