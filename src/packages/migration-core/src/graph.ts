import type {
  BehaviorClassification,
  BehaviorFinding,
  BehaviorGraph,
  BehaviorNode,
  BehaviorScanResult,
  BehaviorTarget,
  MigrationBlocker,
  ProofSource,
  SetupProfile,
  SourceRef
} from "@aiden/contracts"

const unique = <T>(items: T[]) => [...new Set(items)]

const sortAlpha = (items: string[]) => unique(items.filter(Boolean)).sort((a, b) => a.localeCompare(b))

const nodeId = (kind: BehaviorNode["kind"], name: string) => `${kind}:${name}`

const sourceRefKey = (ref: SourceRef) => `${ref.file}:${ref.line}:${ref.match}`

const sortRefs = (refs: SourceRef[]) =>
  unique(refs.map((ref) => sourceRefKey(ref)))
    .sort((a, b) => a.localeCompare(b))
    .map((key) => {
      const [file = "", line = "0", ...matchParts] = key.split(":")
      return { file, line: Number(line), match: matchParts.join(":") }
    })

const refsForRecord = (record: Record<string, SourceRef[]>, key: string) => sortRefs(record[key] ?? [])

const refsForAny = (record: Record<string, SourceRef[]>, keys: string[]) =>
  sortRefs(keys.flatMap((key) => record[key] ?? []))

const existingDeps = (ids: Set<string>, candidates: string[]) => sortAlpha(candidates.filter((candidate) => ids.has(candidate)))

const findingTarget = (target: BehaviorTarget) => {
  switch (target) {
    case "aiven_postgres":
      return "Aiven Postgres"
    case "aiven_kafka":
      return "Aiven Kafka"
    case "generated_adapter":
      return "Generated adapter"
    case "human_review":
      return "Human review"
    case "none":
      return "None"
  }
}

const treatmentFor = (node: BehaviorNode) => {
  switch (node.kind) {
    case "table":
      return `Copy ${node.name} into the Aiven shadow schema and validate row counts.`
    case "extension":
      return `Verify ${node.name} is available on the Aiven Postgres target before dependent behavior runs.`
    case "trigger":
      return `Review ${node.name} trigger semantics during schema migration.`
    case "realtime":
      return `Map ${node.name} realtime changes to app_events for the browser path.`
    case "auth":
      return "Use a scoped demo identity now; keep production auth as an adapter task."
    case "storage":
      return `Route ${node.name} storage behavior through an object-store adapter after the demo path.`
    case "rls":
      return `Review ${node.name} RLS policy behavior before any production cutover.`
    case "rpc":
      return `Generate an adapter route for ${node.name} backed by Aiven Postgres.`
    case "edge_function":
      return `Rewrite ${node.name} as a backend worker or function outside the browser data path.`
    case "client_call":
      return "Point browser data calls at the generated Aiven-compatible adapter."
    default:
      return `Carry ${node.name} through the migration plan.`
  }
}

const blocker = (input: Omit<MigrationBlocker, "source"> & { source?: ProofSource }): MigrationBlocker => ({
  ...input,
  source: input.source ?? "cached"
})

type NodeInput = Omit<BehaviorNode, "dependsOn" | "source"> & {
  dependsOn?: string[]
  source?: ProofSource
}

const addNode = (nodes: BehaviorNode[], input: NodeInput) => {
  nodes.push({
    ...input,
    dependsOn: input.dependsOn ?? [],
    evidence: sortRefs(input.evidence),
    source: input.source ?? "live"
  })
}

export const buildBehaviorGraph = (scan: BehaviorScanResult, setupProfile?: SetupProfile): BehaviorGraph => {
  const detectedTables = sortAlpha(scan.detected.tables)
  const realtimeTables = sortAlpha(scan.detected.realtimeTables)
  const storageBuckets = sortAlpha(scan.detected.storageBuckets)
  const edgeFunctions = sortAlpha(scan.detected.edgeFunctions)
  const rpcFunctions = sortAlpha(scan.detected.rpcFunctions)
  const rlsTables = sortAlpha(scan.detected.rlsTables)
  const triggerFunctions = sortAlpha(scan.detected.triggerFunctions)
  const extensions = sortAlpha([
    ...scan.evidence.migrations.extensions,
    ...(scan.detected.vector && !scan.evidence.migrations.extensions.includes("vector") ? ["vector"] : [])
  ])

  const nodes: BehaviorNode[] = []

  for (const table of detectedTables) {
    addNode(nodes, {
      id: nodeId("table", table),
      kind: "table",
      name: table,
      detail: `Detected table ${table} from SQL or Supabase data API usage.`,
      classification: "direct_migrate",
      target: "aiven_postgres",
      evidence: refsForRecord(scan.evidence.supabase.tableRefs, table),
      source: scan.source
    })
  }

  for (const extension of extensions) {
    addNode(nodes, {
      id: nodeId("extension", extension),
      kind: "extension",
      name: extension,
      detail:
        extension === "vector"
          ? "Detected pgvector usage or vector extension marker."
          : `Detected Postgres extension ${extension}.`,
      classification: "direct_migrate",
      target: "aiven_postgres",
      evidence: [],
      source: scan.source
    })
  }

  if (scan.detected.auth) {
    addNode(nodes, {
      id: nodeId("auth", "supabase_auth"),
      kind: "auth",
      name: "supabase_auth",
      detail: "Detected Supabase Auth session or auth.uid policy usage.",
      classification: "adapter_required",
      target: "generated_adapter",
      evidence: scan.evidence.supabase.authRefs,
      source: scan.source
    })
  }

  for (const triggerFunction of triggerFunctions) {
    addNode(nodes, {
      id: nodeId("trigger", triggerFunction),
      kind: "trigger",
      name: triggerFunction,
      detail: `Detected trigger function ${triggerFunction}.`,
      classification: "review_required",
      target: "aiven_postgres",
      evidence: [],
      source: scan.source
    })
  }

  for (const table of realtimeTables) {
    addNode(nodes, {
      id: nodeId("realtime", table),
      kind: "realtime",
      name: table,
      detail: `Detected Supabase Realtime behavior for ${table}.`,
      classification: "rewrite",
      target: "generated_adapter",
      evidence: refsForRecord(scan.evidence.supabase.realtimeRefs, table),
      source: scan.source
    })
  }

  for (const bucket of storageBuckets) {
    addNode(nodes, {
      id: nodeId("storage", bucket),
      kind: "storage",
      name: bucket,
      detail: `Detected Supabase Storage bucket ${bucket}.`,
      classification: "adapter_required",
      target: "generated_adapter",
      evidence: refsForRecord(scan.evidence.supabase.storageRefs, bucket),
      source: scan.source
    })
  }

  for (const table of rlsTables) {
    addNode(nodes, {
      id: nodeId("rls", table),
      kind: "rls",
      name: table,
      detail: `Detected row-level security for ${table}.`,
      classification: "review_required",
      target: "human_review",
      evidence: refsForRecord(scan.evidence.supabase.tableRefs, table),
      source: scan.source
    })
  }

  for (const rpcFunction of rpcFunctions) {
    addNode(nodes, {
      id: nodeId("rpc", rpcFunction),
      kind: "rpc",
      name: rpcFunction,
      detail: `Detected Supabase RPC call ${rpcFunction}.`,
      classification: "adapter_required",
      target: "generated_adapter",
      evidence: refsForRecord(scan.evidence.supabase.rpcRefs, rpcFunction),
      source: scan.source
    })
  }

  for (const edgeFunction of edgeFunctions) {
    addNode(nodes, {
      id: nodeId("edge_function", edgeFunction),
      kind: "edge_function",
      name: edgeFunction,
      detail: `Detected Supabase Edge Function ${edgeFunction}.`,
      classification: "rewrite",
      target: "generated_adapter",
      evidence: refsForRecord(scan.evidence.supabase.edgeFunctionRefs, edgeFunction),
      source: scan.source
    })
  }

  if (detectedTables.length > 0 && scan.evidence.supabase.clientRefs.length > 0) {
    addNode(nodes, {
      id: nodeId("client_call", "supabase_data_api"),
      kind: "client_call",
      name: "supabase_data_api",
      detail: "Detected browser/client Supabase data API surface.",
      classification: "adapter_required",
      target: "generated_adapter",
      evidence: refsForAny(scan.evidence.supabase.tableRefs, detectedTables),
      source: scan.source
    })
  }

  const ids = new Set(nodes.map((node) => node.id))
  const tableDeps = detectedTables.map((table) => nodeId("table", table))
  const authDep = nodeId("auth", "supabase_auth")

  const nodesWithDependencies = nodes.map((node) => {
    if (node.kind === "realtime") {
      return { ...node, dependsOn: existingDeps(ids, [nodeId("table", node.name), authDep]) }
    }
    if (node.kind === "client_call") {
      return { ...node, dependsOn: existingDeps(ids, [...tableDeps, authDep]) }
    }
    if (node.kind === "rls") {
      return { ...node, dependsOn: existingDeps(ids, [nodeId("table", node.name), authDep]) }
    }
    if (node.kind === "rpc") {
      return { ...node, dependsOn: existingDeps(ids, [nodeId("extension", "vector"), ...tableDeps, authDep]) }
    }
    return { ...node, dependsOn: existingDeps(ids, node.dependsOn) }
  })

  const hasSourceDataBlocker = setupProfile?.sourceKind !== "pulsewall_demo" && setupProfile?.sourceDataPath === "seeded_demo_data"
  const blockers: MigrationBlocker[] = []

  if (scan.detected.auth) {
    blockers.push(
      blocker({
        id: "auth_adapter_required",
        severity: "warning",
        behaviorNodeId: nodeId("auth", "supabase_auth"),
        title: "Production auth adapter required",
        detail: "Supabase Auth behavior was detected and is outside direct Postgres row migration.",
        resolution: "Use a scoped demo identity for the demo, then configure production auth adapter work before cutover.",
        source: scan.source
      })
    )
  }

  if (storageBuckets.length > 0) {
    blockers.push(
      blocker({
        id: "storage_adapter_required",
        severity: "warning",
        behaviorNodeId: nodeId("storage", storageBuckets[0]),
        title: "Storage adapter required",
        detail: "Supabase Storage buckets do not directly migrate into Aiven Postgres.",
        resolution: "Route storage reads/writes through an object-store adapter or keep static demo URLs.",
        source: scan.source
      })
    )
  }

  if (rlsTables.length > 0) {
    blockers.push(
      blocker({
        id: "rls_review_required",
        severity: "blocking",
        behaviorNodeId: nodeId("rls", rlsTables[0]),
        title: "RLS policy review required",
        detail: "Row-level security behavior depends on Supabase auth context.",
        resolution: "Review and reimplement server-side authorization before production cutover.",
        source: scan.source
      })
    )
  }

  if (edgeFunctions.length > 0) {
    blockers.push(
      blocker({
        id: "edge_function_rewrite_required",
        severity: "warning",
        behaviorNodeId: nodeId("edge_function", edgeFunctions[0]),
        title: "Edge Function rewrite required",
        detail: "Supabase Edge Functions need a backend worker or function runtime outside Aiven Postgres.",
        resolution: "Generate or deploy backend adapter code for the detected function entrypoints.",
        source: scan.source
      })
    )
  }

  if (rpcFunctions.length > 0) {
    blockers.push(
      blocker({
        id: "rpc_adapter_required",
        severity: "warning",
        behaviorNodeId: nodeId("rpc", rpcFunctions[0]),
        title: "RPC adapter required",
        detail: "Supabase RPC calls need an Aiven-compatible API boundary.",
        resolution: "Generate adapter endpoints backed by migrated Postgres functions or SQL queries.",
        source: scan.source
      })
    )
  }

  if (hasSourceDataBlocker) {
    blockers.push(
      blocker({
        id: "source_data_path_required",
        severity: "blocking",
        title: "Source data path required",
        detail: "Seeded demo data is only direct-copy ready for the managed PulseWall demo profile.",
        resolution: "Use CSV export, source DB URL, or dump files for generic source table rows.",
        source: scan.source
      })
    )
  }

  const readinessPenalty =
    (scan.detected.auth ? 10 : 0) +
    (storageBuckets.length > 0 ? 10 : 0) +
    (rlsTables.length > 0 ? 10 : 0) +
    (edgeFunctions.length > 0 ? 8 : 0) +
    (rpcFunctions.length > 0 ? 6 : 0) +
    (hasSourceDataBlocker ? 5 : 0)

  return {
    sourceLabel: setupProfile?.sourceLabel ?? scan.sourceLabel,
    sourceKind: setupProfile?.sourceKind ?? "local_lovable_export",
    framework: sortAlpha(scan.evidence.frameworks),
    packageManagers: sortAlpha(scan.evidence.packageManagers),
    summary: {
      tables: detectedTables,
      hasAuth: scan.detected.auth,
      hasStorage: storageBuckets.length > 0,
      hasRealtime: realtimeTables.length > 0,
      hasRls: rlsTables.length > 0,
      hasRpc: rpcFunctions.length > 0,
      hasEdgeFunctions: edgeFunctions.length > 0,
      hasVector: scan.detected.vector || extensions.includes("vector")
    },
    nodes: nodesWithDependencies,
    readinessScore: Math.max(35, 100 - readinessPenalty),
    blockers,
    source: scan.source,
    createdAt: scan.createdAt
  }
}

export const behaviorFindingsFromGraph = (graph: BehaviorGraph): BehaviorFinding[] =>
  graph.nodes.map((node) => ({
    id: `finding_${node.id.replace(/[^a-zA-Z0-9]+/g, "_")}`,
    behavior: node.detail,
    detected: true,
    sourceRefs: node.evidence.map((ref) => `${ref.file}:${ref.line}`),
    classification: node.classification as BehaviorClassification,
    target: findingTarget(node.target),
    demoTreatment: treatmentFor(node),
    source: node.source
  }))
