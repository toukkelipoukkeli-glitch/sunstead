import type {
  BehaviorGraph,
  GeneratedArtifact,
  MigrationBlocker,
  MigrationManifest,
  RowValidation,
  SetupProfile,
  ValidationCheck
} from "@aiden/contracts"
import {
  type AdapterTemplateInput,
  type GeneratedAdapterFile,
  renderAdapterPlanJson,
  renderAivenDbTs,
  renderAivenEventsTs,
  renderEnvExample,
  renderMigrationMd,
  renderValidationReportJson
} from "./templates"
import {
  assertNoGeneratedSecrets,
  redactSecretText,
  validateGeneratedAdapterPackage,
  type AdapterPackageValidationResult
} from "./validate"

export type GenerateAivenAdapterPackageInput = {
  setupProfile: SetupProfile
  behaviorGraph: BehaviorGraph
  migrationManifest: MigrationManifest
  validationChecks?: ValidationCheck[]
  rowValidations?: RowValidation[]
  blockers?: MigrationBlocker[]
  artifactSource?: GeneratedArtifact["source"]
  artifactStatus?: Extract<GeneratedArtifact["status"], "generated" | "validated">
  createdAt?: string
}

export type GeneratedAivenAdapterPackage = {
  runId: string
  files: GeneratedAdapterFile[]
  artifacts: GeneratedArtifact[]
  checks: ValidationCheck[]
  rowValidations: RowValidation[]
  blockers: MigrationBlocker[]
  createdAt: string
}

const stableCreatedAt = "1970-01-01T00:00:00.000Z"

const resolveCreatedAt = (input: GenerateAivenAdapterPackageInput) =>
  input.createdAt ?? input.migrationManifest.createdAt ?? input.behaviorGraph.createdAt ?? stableCreatedAt

const makeArtifact = (
  input: {
    runId: string
    createdAt: string
    source: GeneratedArtifact["source"]
    status: Extract<GeneratedArtifact["status"], "generated" | "validated">
  },
  artifact: Pick<GeneratedArtifact, "id" | "kind" | "path" | "title">
): GeneratedArtifact => ({
  ...artifact,
  runId: input.runId,
  status: input.status,
  source: input.source,
  createdAt: input.createdAt
})

const buildArtifacts = (
  runId: string,
  createdAt: string,
  source: GeneratedArtifact["source"],
  status: Extract<GeneratedArtifact["status"], "generated" | "validated">
): GeneratedArtifact[] => [
  makeArtifact(
    { runId, createdAt, source, status },
    {
      id: "adapter_migration_notes",
      kind: "migration_notes",
      path: "MIGRATION.md",
      title: "Aiven migration notes"
    }
  ),
  makeArtifact(
    { runId, createdAt, source, status },
    {
      id: "adapter_env_example",
      kind: "env_example",
      path: ".env.aiven.example",
      title: "Aiven environment placeholder file"
    }
  ),
  makeArtifact(
    { runId, createdAt, source, status },
    {
      id: "adapter_package",
      kind: "adapter_package",
      path: "aiden/",
      title: "Generated Aiven adapter package"
    }
  ),
  makeArtifact(
    { runId, createdAt, source, status },
    {
      id: "adapter_plan",
      kind: "schema_plan",
      path: "aiden/aiven-adapter-plan.json",
      title: "Aiven adapter generation plan"
    }
  ),
  makeArtifact(
    { runId, createdAt, source, status: status === "validated" ? "validated" : "generated" },
    {
      id: "adapter_validation_report",
      kind: "validation_report",
      path: "aiden/validation-report.json",
      title: "Generated adapter validation report"
    }
  )
]

const buildTemplateInput = (input: GenerateAivenAdapterPackageInput): AdapterTemplateInput => {
  const runId = input.migrationManifest.runId
  const createdAt = resolveCreatedAt(input)

  return {
    runId,
    setupProfile: input.setupProfile,
    behaviorGraph: input.behaviorGraph,
    migrationManifest: input.migrationManifest,
    validationChecks: input.validationChecks ?? [],
    rowValidations: input.rowValidations ?? [],
    blockers: input.blockers ?? input.migrationManifest.blockers ?? input.behaviorGraph.blockers,
    createdAt
  }
}

const renderFiles = (
  templateInput: AdapterTemplateInput,
  artifacts: GeneratedArtifact[],
  validation: AdapterPackageValidationResult
): GeneratedAdapterFile[] => [
  { path: "MIGRATION.md", contents: renderMigrationMd(templateInput) },
  { path: ".env.aiven.example", contents: renderEnvExample() },
  { path: "aiden/aiven-db.ts", contents: renderAivenDbTs() },
  { path: "aiden/aiven-events.ts", contents: renderAivenEventsTs() },
  { path: "aiden/aiven-adapter-plan.json", contents: renderAdapterPlanJson(templateInput) },
  {
    path: "aiden/validation-report.json",
    contents: renderValidationReportJson({
      ...templateInput,
      generatedArtifacts: artifacts,
      packageValidationChecks: validation.checks
    })
  }
]

export const generateAivenAdapterPackage = (
  input: GenerateAivenAdapterPackageInput
): GeneratedAivenAdapterPackage => {
  const templateInput = buildTemplateInput(input)
  const source = input.artifactSource ?? "cached"
  const status = input.artifactStatus ?? "generated"
  const artifacts = buildArtifacts(templateInput.runId, templateInput.createdAt, source, status)

  const preliminaryValidation = validateGeneratedAdapterPackage({
    runId: templateInput.runId,
    files: [
      { path: "MIGRATION.md", contents: renderMigrationMd(templateInput) },
      { path: ".env.aiven.example", contents: renderEnvExample() },
      { path: "aiden/aiven-db.ts", contents: renderAivenDbTs() },
      { path: "aiden/aiven-events.ts", contents: renderAivenEventsTs() },
      { path: "aiden/aiven-adapter-plan.json", contents: renderAdapterPlanJson(templateInput) },
      { path: "aiden/validation-report.json", contents: "{}\n" }
    ],
    createdAt: templateInput.createdAt,
    source
  })
  const files = renderFiles(templateInput, artifacts, preliminaryValidation)
  const validation = validateGeneratedAdapterPackage({
    runId: templateInput.runId,
    files,
    createdAt: templateInput.createdAt,
    source
  })
  const blockers = [...templateInput.blockers, ...validation.blockers]

  return {
    runId: templateInput.runId,
    files,
    artifacts,
    checks: validation.checks,
    rowValidations: templateInput.rowValidations,
    blockers,
    createdAt: templateInput.createdAt
  }
}

export { assertNoGeneratedSecrets, redactSecretText, validateGeneratedAdapterPackage }
export type { AdapterPackageValidationResult, GeneratedAdapterFile }
