import type {
  AccessCheck,
  AccessSnapshot,
  BehaviorGraph,
  BehaviorNode,
  MigrationBlocker,
  MigrationManifest,
  SetupProfile,
  SourceDataPath
} from "@aiden/contracts"

type ManifestInput = {
  runId: string
  setupProfile: SetupProfile
  graph: BehaviorGraph
  sourceDataPath: SourceDataPath
  accessSnapshot: AccessSnapshot
}

const unique = <T>(items: T[]) => [...new Set(items)]

const sortAlpha = (items: string[]) => unique(items.filter(Boolean)).sort((a, b) => a.localeCompare(b))

const namesForKind = (nodes: BehaviorNode[], kind: BehaviorNode["kind"]) =>
  sortAlpha(nodes.filter((node) => node.kind === kind).map((node) => node.name))

const accessCheckReady = (check: AccessCheck | undefined) =>
  check?.status === "live_verified" || check?.status === "connected"

const sourceDataAccessBlocker = (accessSnapshot: AccessSnapshot): MigrationBlocker | undefined => {
  const sourceDataCheck = accessSnapshot.checks.find((check) => check.id === "source_data")
  if (!sourceDataCheck || sourceDataCheck.status !== "blocked") return undefined

  return {
    id: "access_source_data_blocked",
    severity: "blocking",
    title: "Source data access blocked",
    detail: sourceDataCheck.proof,
    resolution: "Configure the selected source data path before running the shadow row copy.",
    source: sourceDataCheck.source
  }
}

const validationPlanFor = (graph: BehaviorGraph, kafkaConfigured: boolean): MigrationManifest["validationPlan"] => [
  ...graph.summary.tables.map((table) => ({
    id: `row_count_${table}`,
    checkName: `${table} row count`,
    expected: `Aiven shadow table ${table} has the expected source row count.`,
    source: graph.source
  })),
  ...(graph.summary.hasVector
    ? [
        {
          id: "extension_vector",
          checkName: "pgvector extension available",
          expected: "Aiven Postgres accepts vector extension dependent queries.",
          source: graph.source
        }
      ]
    : []),
  ...(graph.summary.hasRealtime
    ? [
        {
          id: "realtime_app_events",
          checkName: "Realtime app_events browser path",
          expected: "Browser realtime behavior is observable through Aiven Postgres app_events.",
          source: graph.source
        }
      ]
    : []),
  ...(kafkaConfigured
    ? [
        {
          id: "kafka_agent_bus",
          checkName: "Kafka agent bus roundtrip",
          expected: "Aiven Kafka migration.events can produce and consume a roundtrip proof.",
          source: "live" as const
        }
      ]
    : [])
]

export const buildMigrationManifest = ({
  runId,
  setupProfile,
  graph,
  sourceDataPath,
  accessSnapshot
}: ManifestInput): MigrationManifest => {
  const kafkaCheck = accessSnapshot.checks.find((check) => check.id === "aiven_kafka")
  const kafkaConfigured = accessCheckReady(kafkaCheck)
  const sourceDataBlocker = sourceDataAccessBlocker(accessSnapshot)
  const blockers = sourceDataBlocker ? [...graph.blockers, sourceDataBlocker] : graph.blockers

  return {
    runId,
    source: setupProfile,
    graph,
    directMigrate: {
      tables: graph.summary.tables,
      indexes: namesForKind(graph.nodes, "index"),
      extensions: namesForKind(graph.nodes, "extension"),
      functions: namesForKind(graph.nodes, "function"),
      triggers: namesForKind(graph.nodes, "trigger")
    },
    shadowCopy: {
      mode:
        setupProfile.sourceKind === "pulsewall_demo" && sourceDataPath === "seeded_demo_data"
          ? "pulsewall_schema"
          : sourceDataPath === "csv_export"
            ? "csv_source_rows"
            : "source_table_rows",
      tables: graph.summary.tables
    },
    adapterRequired: {
      auth: graph.summary.hasAuth,
      storage: graph.summary.hasStorage,
      rpc: namesForKind(graph.nodes, "rpc"),
      edgeFunctions: namesForKind(graph.nodes, "edge_function"),
      clientTables: graph.nodes.some((node) => node.kind === "client_call") ? graph.summary.tables : []
    },
    realtime: {
      browserPath: "aiven_postgres_app_events",
      kafkaPath: kafkaConfigured ? "configured_agent_bus" : "optional_agent_bus",
      sourceTables: namesForKind(graph.nodes, "realtime")
    },
    blockers,
    validationPlan: validationPlanFor(graph, kafkaConfigured),
    createdAt: accessSnapshot.createdAt || graph.createdAt
  }
}
