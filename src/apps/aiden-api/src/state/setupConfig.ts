import type { SetupProfile } from "@aiden/contracts"

export type SetupProfileRequest = {
  setupProfile?: Partial<SetupProfile>
  sourceDbUrl?: string
  sourceTables?: string
  sourceCopyLimit?: string
  sourceSslDisabled?: boolean
}

const clean = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined)

const cleanTables = (value: unknown) => {
  const text = clean(value)
  if (!text) return undefined
  const tables = text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  if (tables.length === 0) return undefined
  for (const table of tables) {
    if (!/^[a-zA-Z_][\w]*(\.[a-zA-Z_][\w]*)?$/.test(table)) {
      throw new Error(`Invalid table allowlist entry: ${table}`)
    }
  }
  return tables.join(",")
}

const cleanCopyLimit = (value: unknown) => {
  const text = clean(value)
  if (!text) return undefined
  const limit = Number(text)
  if (!Number.isInteger(limit) || limit <= 0 || limit > 50_000) {
    throw new Error("Source copy limit must be an integer from 1 to 50000.")
  }
  return String(limit)
}

export const applySetupRuntimeConfig = (input: SetupProfileRequest = {}) => {
  const sourceDbUrl = clean(input.sourceDbUrl)
  const sourceTables = cleanTables(input.sourceTables)
  const sourceCopyLimit = cleanCopyLimit(input.sourceCopyLimit)

  if (sourceDbUrl) {
    process.env.SOURCE_SUPABASE_DB_URL = sourceDbUrl
  }
  if (sourceTables) {
    process.env.SOURCE_SUPABASE_TABLES = sourceTables
  }
  if (sourceCopyLimit) {
    process.env.SOURCE_COPY_LIMIT = sourceCopyLimit
  }
  if (typeof input.sourceSslDisabled === "boolean") {
    process.env.SOURCE_SUPABASE_SSL = input.sourceSslDisabled ? "false" : "true"
  }

  return {
    ok: true,
    applied: {
      sourceDbUrl: Boolean(sourceDbUrl || process.env.SOURCE_SUPABASE_DB_URL || process.env.SOURCE_POSTGRES_URL),
      sourceTables: sourceTables ?? process.env.SOURCE_SUPABASE_TABLES ?? process.env.SOURCE_POSTGRES_TABLES ?? null,
      sourceCopyLimit: sourceCopyLimit ?? process.env.SOURCE_COPY_LIMIT ?? null,
      sourceSslDisabled: process.env.SOURCE_SUPABASE_SSL === "false"
    }
  }
}
