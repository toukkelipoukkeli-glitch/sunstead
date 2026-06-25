import type {
  BehaviorGraph,
  GeneratedArtifact,
  MigrationBlocker,
  MigrationManifest,
  RowValidation,
  SetupProfile,
  ValidationCheck
} from "@aiden/contracts"

export type GeneratedAdapterFile = {
  path: string
  contents: string
}

export type AdapterTemplateInput = {
  runId: string
  setupProfile: SetupProfile
  behaviorGraph: BehaviorGraph
  migrationManifest: MigrationManifest
  validationChecks: ValidationCheck[]
  rowValidations: RowValidation[]
  blockers: MigrationBlocker[]
  createdAt: string
}

export type ValidationReportInput = AdapterTemplateInput & {
  generatedArtifacts: GeneratedArtifact[]
  packageValidationChecks: ValidationCheck[]
}

export const requiredGeneratedFiles = [
  "MIGRATION.md",
  ".env.aiven.example",
  "aiden/aiven-db.ts",
  "aiden/aiven-events.ts",
  "aiden/aiven-adapter-plan.json",
  "aiden/validation-report.json"
] as const

export const migrationRequiredHeadings = [
  "# Aiven Adapter Migration",
  "## Scope",
  "## Generated Files",
  "## Production Cutover",
  "## Review Required",
  "## Validation"
] as const

const sorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))

const sortObject = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortObject)
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortObject(nested)])
  )
}

const sanitizeReportString = (value: string) =>
  value
    .replace(/\b(?:AIVEN_TOKEN|ANTHROPIC_API_KEY|GITHUB_TOKEN|SUPABASE_SERVICE_ROLE_KEY)\b/gi, "[secret_env_name]")
    .replace(/\bservice_role\b/gi, "[privileged_role]")
    .replace(/\bghp_[A-Za-z0-9_]{10,}\b/g, "[redacted_github_token]")
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[redacted_api_key]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[redacted_jwt]")

const sanitizeReportValue = (value: unknown): unknown => {
  if (typeof value === "string") return sanitizeReportString(value)
  if (Array.isArray(value)) return value.map(sanitizeReportValue)
  if (!value || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
      sanitizeReportString(key),
      sanitizeReportValue(nested)
    ])
  )
}

export const stableStringify = (value: unknown) => `${JSON.stringify(sortObject(value), null, 2)}\n`

const bulletList = (items: string[], empty = "None detected.") =>
  items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`

const blockerList = (blockers: MigrationBlocker[]) =>
  blockers.length > 0
    ? blockers
        .map((blocker) => `- ${blocker.severity.toUpperCase()}: ${blocker.title} - ${blocker.resolution}`)
        .join("\n")
    : "- No blockers generated for the scoped demo path."

export const renderMigrationMd = (input: AdapterTemplateInput) => {
  const manifest = input.migrationManifest
  const graph = input.behaviorGraph

  return `${migrationRequiredHeadings[0]}

Run: ${input.runId}
Source: ${input.setupProfile.sourceLabel}
Workspace: ${input.setupProfile.workspaceLabel}

${migrationRequiredHeadings[1]}

This package preserves the scoped setup to control flow and prepares the generated adapter files for an Aiven-backed demo path.

- Source kind: ${input.setupProfile.sourceKind}
- Data path: ${input.setupProfile.sourceDataPath}
- Aiven workspace mode: ${input.setupProfile.aivenWorkspaceMode}
- Readiness score: ${graph.readinessScore}

Direct migration targets:
${bulletList(sorted(manifest.directMigrate.tables))}

Realtime source tables:
${bulletList(sorted(manifest.realtime.sourceTables))}

${migrationRequiredHeadings[2]}

${requiredGeneratedFiles.map((file) => `- ${file}`).join("\n")}

${migrationRequiredHeadings[3]}

Production cutover is not performed by this generated package. This means production cutover is not performed in the generated adapter flow; final production routing stays behind an explicit human approval step.

${migrationRequiredHeadings[4]}

Auth, storage, and RLS may require review before any production migration. Review these areas with the application owner because source application policies, file access, and user identity flows are often product-specific.

Adapter-required areas:
- Auth: ${manifest.adapterRequired.auth ? "review required" : "not detected"}
- Storage: ${manifest.adapterRequired.storage ? "review required" : "not detected"}
- RPC functions: ${manifest.adapterRequired.rpc.length > 0 ? sorted(manifest.adapterRequired.rpc).join(", ") : "none detected"}
- Edge functions: ${
    manifest.adapterRequired.edgeFunctions.length > 0 ? sorted(manifest.adapterRequired.edgeFunctions).join(", ") : "none detected"
  }

Blockers and warnings:
${blockerList(input.blockers)}

${migrationRequiredHeadings[5]}

Validation checks are included in \`aiden/validation-report.json\`. The package validator checks required files, parses generated JSON, scans for secrets, and verifies these migration notes keep the required headings.
`
}

export const renderEnvExample = () => `# Aiven demo adapter placeholders only.
# Replace these locally or in deployment configuration. Do not commit real values.
AIVEN_POSTGRES_URL="postgres://avnadmin:<AIVEN_POSTGRES_PASSWORD>@<AIVEN_POSTGRES_HOST>:<AIVEN_POSTGRES_PORT>/<AIVEN_POSTGRES_DATABASE>?sslmode=require"
AIVEN_KAFKA_BOOTSTRAP_SERVERS="<AIVEN_KAFKA_BOOTSTRAP_SERVERS>"
AIVEN_KAFKA_USERNAME="<AIVEN_KAFKA_USERNAME>"
AIVEN_KAFKA_PASSWORD="<AIVEN_KAFKA_PASSWORD>"
AIDEN_APP_EVENTS_TOPIC="aiden.app_events"
`

export const renderAivenDbTs = () => `import pg from "pg"

const { Pool } = pg

const readEnv = (name: string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(\`\${name} is required for the generated Aiven adapter.\`)
  return value
}

export const createAivenPool = () =>
  new Pool({
    connectionString: readEnv("AIVEN_POSTGRES_URL"),
    ssl: { rejectUnauthorized: true }
  })

export const queryAiven = async <T>(sql: string, values: unknown[] = []) => {
  const pool = createAivenPool()
  try {
    const result = await pool.query<T>(sql, values)
    return result.rows
  } finally {
    await pool.end()
  }
}
`

export const renderAivenEventsTs = () => `export type AivenAppEvent = {
  eventType: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  createdAt: string
}

export type AivenEventPublisher = (topic: string, event: AivenAppEvent) => Promise<void>

const readTopic = () => process.env.AIDEN_APP_EVENTS_TOPIC?.trim() || "aiden.app_events"

export const buildAivenAppEvent = (input: Omit<AivenAppEvent, "createdAt">): AivenAppEvent => ({
  ...input,
  createdAt: new Date().toISOString()
})

export const publishAivenAppEvent = async (event: AivenAppEvent, publisher?: AivenEventPublisher) => {
  const topic = readTopic()
  if (publisher) {
    await publisher(topic, event)
    return { topic, published: true }
  }

  return { topic, published: false, event }
}
`

export const renderAdapterPlanJson = (input: AdapterTemplateInput) =>
  stableStringify({
    adapterPackage: "@aiden/adapter-generator",
    runId: input.runId,
    source: {
      label: input.setupProfile.sourceLabel,
      kind: input.setupProfile.sourceKind,
      dataPath: input.setupProfile.sourceDataPath
    },
    workspace: {
      label: input.setupProfile.workspaceLabel,
      mode: input.setupProfile.aivenWorkspaceMode
    },
    generatedFiles: requiredGeneratedFiles,
    graphSummary: input.behaviorGraph.summary,
    directMigrate: input.migrationManifest.directMigrate,
    shadowCopy: input.migrationManifest.shadowCopy,
    adapterRequired: input.migrationManifest.adapterRequired,
    realtime: input.migrationManifest.realtime,
    blockers: input.blockers,
    validationPlan: input.migrationManifest.validationPlan,
    createdAt: input.createdAt
  })

export const renderValidationReportJson = (input: ValidationReportInput) =>
  stableStringify(sanitizeReportValue({
    runId: input.runId,
    generatedAt: input.createdAt,
    source: input.generatedArtifacts[0]?.source ?? "cached",
    artifacts: input.generatedArtifacts,
    packageValidationChecks: input.packageValidationChecks,
    migrationValidationChecks: input.validationChecks,
    rowValidations: input.rowValidations,
    blockers: input.blockers,
    summary: {
      requiredFiles: requiredGeneratedFiles.length,
      packageChecksPassed: input.packageValidationChecks.every((check) => check.status === "passed"),
      migrationChecksPassed: input.validationChecks.every((check) => check.status === "passed"),
      rowValidationPassed: input.rowValidations.every((row) => row.status === "passed")
    }
  }))
