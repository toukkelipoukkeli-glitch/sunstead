// surgeon/generate.ts — THE MOONSHOT DIFFERENTIATOR.
//
// Overmind doesn't *flag* auth/storage/realtime as "adapter required" — the Surgeon
// *generates a real Aiven-native backend* that replaces every Supabase behavior:
//   • own JWT-shaped auth (HMAC tokens + magic codes)        ← replaces Supabase GoTrue
//   • a data API over Aiven Postgres for each source table   ← replaces supabase.from()
//   • a Kafka → SSE realtime bridge                          ← replaces supabase.channel()
//   • pgvector semantic search                               ← replaces the embed edge fn
//   • bytea blob storage                                     ← replaces Supabase Storage
//   • a target schema.sql                                    ← runs on Aiven for PostgreSQL
//
// Modeled file-for-file on demo/pulsewall-aiven/server/*.ts, but *parameterized by the
// source app's tables* (from the BehaviorGraph) rather than hard-coded to PulseWall. If
// ANTHROPIC_API_KEY is set we let Claude refine each table's column model first; otherwise
// deterministic templates carry the whole thing. Every file written becomes a
// GeneratedArtifact{ status: 'generated' } so the Healer loop + control-room can track it.
//
// Defensive by construction: no top-level throws, graceful degradation on every missing
// input (no tables → still emits a coherent auth+storage backend), and the contract
// signature is matched exactly.

import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import type { BehaviorGraph, GeneratedArtifact } from '../shared/types.ts'
import { deriveModel, type TableModel } from './model.ts'
import { refineModelWithLLM } from './llm.ts'
import {
  envTs,
  dbTs,
  authTs,
  busTs,
  embeddingsTs,
  storageTs,
  routesTs,
  indexTs,
  applySchemaTs,
  schemaSql,
  packageJson,
  tsconfigJson,
  envExample,
} from './templates.ts'

type Kind = GeneratedArtifact['kind']

interface FileSpec {
  /** path relative to outDir */
  rel: string
  kind: Kind
  content: string
}

function newArtifact(path: string, kind: Kind): GeneratedArtifact {
  return { path, kind, status: 'generated', healAttempts: 0 }
}

/** Build the full list of files to emit for the given table model. Pure. */
function planFiles(models: TableModel[]): FileSpec[] {
  const vectorDim = models.find((m) => m.vectorColumn)?.vectorDim ?? 1536
  const anyVector = models.some((m) => m.vectorColumn)

  const files: FileSpec[] = [
    { rel: 'server/env.ts', kind: 'config', content: envTs() },
    { rel: 'server/db.ts', kind: 'config', content: dbTs() },
    { rel: 'server/auth.ts', kind: 'auth', content: authTs() },
    { rel: 'server/bus.ts', kind: 'realtime_bridge', content: busTs() },
    { rel: 'server/storage.ts', kind: 'storage', content: storageTs() },
    { rel: 'server/routes.ts', kind: 'data_api', content: routesTs(models) },
    { rel: 'server/index.ts', kind: 'config', content: indexTs() },
    { rel: 'server/apply-schema.ts', kind: 'config', content: applySchemaTs() },
    { rel: 'db/schema.sql', kind: 'schema', content: schemaSql(models) },
    { rel: 'package.json', kind: 'config', content: packageJson() },
    { rel: 'tsconfig.json', kind: 'config', content: tsconfigJson() },
    { rel: '.env.example', kind: 'config', content: envExample() },
  ]

  // embeddings module only when at least one table has a vector column
  if (anyVector) {
    files.splice(5, 0, { rel: 'server/embeddings.ts', kind: 'vector', content: embeddingsTs(vectorDim) })
  }

  return files
}

/**
 * Generate a working Aiven-native backend into `outDir` that replaces every Supabase
 * behavior described by `graph`. Returns one GeneratedArtifact per file written.
 *
 * Never throws: a write failure on a single file is recorded as status:'failed' on that
 * artifact (with lastError) so the pipeline keeps moving and the Healer can react.
 */
export async function generateBackend(graph: BehaviorGraph, outDir: string): Promise<GeneratedArtifact[]> {
  const artifacts: GeneratedArtifact[] = []

  // 1) derive a concrete table model (deterministic), then optionally refine with Claude.
  let models: TableModel[] = []
  try {
    models = deriveModel(graph ?? ({} as BehaviorGraph))
  } catch (e) {
    console.warn('[surgeon] deriveModel failed, proceeding auth-only:', (e as Error)?.message)
    models = []
  }

  try {
    models = await refineModelWithLLM(graph, models)
  } catch (e) {
    console.warn('[surgeon] LLM refine threw (ignored):', (e as Error)?.message)
  }

  // 2) plan + write each file, emitting an artifact per file.
  const files = planFiles(models)

  for (const f of files) {
    const abs = join(outDir, f.rel)
    try {
      await mkdir(dirname(abs), { recursive: true })
      await writeFile(abs, f.content, 'utf8')
      artifacts.push(newArtifact(abs, f.kind))
    } catch (e) {
      const art = newArtifact(abs, f.kind)
      art.status = 'failed'
      art.lastError = (e as Error)?.message ?? String(e)
      artifacts.push(art)
      console.error(`[surgeon] failed to write ${abs}:`, art.lastError)
    }
  }

  console.log(
    `[surgeon] generated ${artifacts.filter((a) => a.status === 'generated').length}/${files.length} files for ${models.length} source table(s) → ${outDir}`,
  )
  return artifacts
}
