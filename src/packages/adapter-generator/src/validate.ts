import type { GeneratedArtifact, MigrationBlocker, ValidationCheck } from "@aiden/contracts"
import { migrationRequiredHeadings, requiredGeneratedFiles } from "./templates"

export type GeneratedAdapterFile = {
  path: string
  contents: string
}

export type GeneratedAdapterPackageLike = {
  runId?: string
  files: GeneratedAdapterFile[]
  createdAt?: string
  source?: GeneratedArtifact["source"]
}

export type AdapterPackageValidationResult = {
  ok: boolean
  checks: ValidationCheck[]
  blockers: MigrationBlocker[]
}

type SecretFinding = {
  path: string
  reason: string
}

const stableCreatedAt = "1970-01-01T00:00:00.000Z"

const postgresUrlPattern = /\bpostgres(?:ql)?:\/\/([^:\s/@]+):([^@\s]+)@/gi
const jwtPattern = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g

const forbiddenPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "AIVEN_TOKEN", pattern: /\bAIVEN_TOKEN\b/i },
  { label: "ANTHROPIC_API_KEY", pattern: /\bANTHROPIC_API_KEY\b/i },
  { label: "GITHUB_TOKEN", pattern: /\bGITHUB_TOKEN\b/i },
  { label: "GitHub personal access token", pattern: /\bghp_[A-Za-z0-9_]{10,}\b/g },
  { label: "OpenAI-style API key", pattern: /\bsk-[A-Za-z0-9_-]{10,}\b/g },
  { label: "JWT-looking string", pattern: jwtPattern },
  { label: "SUPABASE_SERVICE_ROLE_KEY", pattern: /\bSUPABASE_SERVICE_ROLE_KEY\b/i },
  { label: "service_role", pattern: /\bservice_role\b/i }
]

const placeholderPattern =
  /^(?:<[^>]+>|\$\{[^}]+}|\[[A-Z0-9_ -]+]|REPLACE_ME|CHANGE_ME|CHANGEME|PASSWORD|PLACEHOLDER|[A-Z0-9_]*PASSWORD[A-Z0-9_]*)$/i

const isPlaceholderPassword = (value: string) => {
  const decoded = decodeURIComponent(value)
  return placeholderPattern.test(value) || placeholderPattern.test(decoded)
}

const normalizeFiles = (files: GeneratedAdapterFile[] | Record<string, string>): GeneratedAdapterFile[] =>
  Array.isArray(files)
    ? files
    : Object.entries(files).map(([path, contents]) => ({
        path,
        contents
      }))

const findSecrets = (files: GeneratedAdapterFile[]): SecretFinding[] => {
  const findings: SecretFinding[] = []

  for (const file of files) {
    postgresUrlPattern.lastIndex = 0
    for (const match of file.contents.matchAll(postgresUrlPattern)) {
      const password = match[2] ?? ""
      if (!isPlaceholderPassword(password)) {
        findings.push({ path: file.path, reason: "Postgres URL contains an embedded non-placeholder password" })
      }
    }

    for (const forbidden of forbiddenPatterns) {
      forbidden.pattern.lastIndex = 0
      if (forbidden.pattern.test(file.contents)) {
        findings.push({ path: file.path, reason: forbidden.label })
      }
    }
  }

  return findings
}

export const redactSecretText = (text: string) =>
  text
    .replace(postgresUrlPattern, "postgres://$1:<REDACTED_PASSWORD>@")
    .replace(/\b(AIVEN_TOKEN|ANTHROPIC_API_KEY|GITHUB_TOKEN|SUPABASE_SERVICE_ROLE_KEY)\s*=\s*["']?[^"'\s]+["']?/gi, "$1=<REDACTED>")
    .replace(/\bghp_[A-Za-z0-9_]{10,}\b/g, "<REDACTED_GITHUB_TOKEN>")
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "<REDACTED_API_KEY>")
    .replace(jwtPattern, "<REDACTED_JWT>")

export const assertNoGeneratedSecrets = (files: GeneratedAdapterFile[] | Record<string, string>) => {
  const findings = findSecrets(normalizeFiles(files))
  if (findings.length > 0) {
    const summary = findings.map((finding) => `${finding.path}: ${finding.reason}`).join("; ")
    throw new Error(`Generated adapter package contains forbidden secret material: ${summary}`)
  }
}

const makeCheck = (
  pkg: GeneratedAdapterPackageLike,
  id: string,
  checkName: string,
  status: ValidationCheck["status"],
  details: Record<string, unknown>
): ValidationCheck => ({
  id,
  runId: pkg.runId ?? "adapter-generator",
  checkName,
  status,
  details,
  source: pkg.source ?? "cached",
  createdAt: pkg.createdAt ?? stableCreatedAt
})

const makeBlocker = (
  pkg: GeneratedAdapterPackageLike,
  id: string,
  title: string,
  detail: string,
  resolution: string
): MigrationBlocker => ({
  id,
  severity: "blocking",
  title,
  detail,
  resolution,
  source: pkg.source ?? "cached"
})

export const validateGeneratedAdapterPackage = (
  pkg: GeneratedAdapterPackageLike
): AdapterPackageValidationResult => {
  const files = normalizeFiles(pkg.files)
  const byPath = new Map(files.map((file) => [file.path, file.contents]))
  const checks: ValidationCheck[] = []
  const blockers: MigrationBlocker[] = []

  const missingFiles = requiredGeneratedFiles.filter((file) => !byPath.has(file))
  checks.push(
    makeCheck(pkg, "adapter_required_files", "Required generated files", missingFiles.length === 0 ? "passed" : "failed", {
      requiredFiles: requiredGeneratedFiles,
      missingFiles
    })
  )
  if (missingFiles.length > 0) {
    blockers.push(
      makeBlocker(
        pkg,
        "adapter_missing_required_files",
        "Generated adapter package is missing required files",
        `Missing: ${missingFiles.join(", ")}`,
        "Regenerate the adapter package before demo handoff."
      )
    )
  }

  const jsonFiles = ["aiden/aiven-adapter-plan.json", "aiden/validation-report.json"]
  const jsonErrors: Record<string, string> = {}
  for (const file of jsonFiles) {
    const contents = byPath.get(file)
    if (!contents) continue
    try {
      JSON.parse(contents)
    } catch (error) {
      jsonErrors[file] = error instanceof Error ? error.message : String(error)
    }
  }
  checks.push(
    makeCheck(pkg, "adapter_json_parse", "Generated JSON parses", Object.keys(jsonErrors).length === 0 ? "passed" : "failed", {
      parsedFiles: jsonFiles.filter((file) => byPath.has(file) && !jsonErrors[file]),
      jsonErrors
    })
  )
  if (Object.keys(jsonErrors).length > 0) {
    blockers.push(
      makeBlocker(
        pkg,
        "adapter_invalid_json",
        "Generated adapter package contains invalid JSON",
        JSON.stringify(jsonErrors),
        "Fix the generated JSON templates and rerun validation."
      )
    )
  }

  const secretFindings = findSecrets(files)
  checks.push(
    makeCheck(pkg, "adapter_secret_scan", "Generated files contain no forbidden secret material", secretFindings.length === 0 ? "passed" : "failed", {
      findings: secretFindings
    })
  )
  if (secretFindings.length > 0) {
    blockers.push(
      makeBlocker(
        pkg,
        "adapter_secret_material_detected",
        "Generated adapter package contains forbidden secret material",
        secretFindings.map((finding) => `${finding.path}: ${finding.reason}`).join("; "),
        "Replace real tokens and credentials with placeholders before generating artifacts."
      )
    )
  }

  const migrationMd = byPath.get("MIGRATION.md") ?? ""
  const missingHeadings = migrationRequiredHeadings.filter((heading) => !migrationMd.includes(heading))
  checks.push(
    makeCheck(
      pkg,
      "adapter_migration_headings",
      "Migration notes include required headings",
      missingHeadings.length === 0 ? "passed" : "failed",
      {
        requiredHeadings: migrationRequiredHeadings,
        missingHeadings
      }
    )
  )
  if (missingHeadings.length > 0) {
    blockers.push(
      makeBlocker(
        pkg,
        "adapter_missing_migration_headings",
        "Generated migration notes are missing required headings",
        `Missing: ${missingHeadings.join(", ")}`,
        "Regenerate MIGRATION.md with the required migration sections."
      )
    )
  }

  return {
    ok: checks.every((check) => check.status === "passed"),
    checks,
    blockers
  }
}
