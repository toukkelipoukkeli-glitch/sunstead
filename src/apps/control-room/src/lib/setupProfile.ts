import type { CsvSourceInput, SetupProfile } from "@aiden/contracts"

export const setupProfileStorageKey = "aiden.setupProfile"
export const setupRuntimeConfigStorageKey = "aiden.setupRuntimeConfig"

export const managedSetupProfile: SetupProfile = {
  sourceKind: "pulsewall_demo",
  sourceDataPath: "seeded_demo_data",
  aivenWorkspaceMode: "henri_preconnected",
  migrationScope: {
    shadowMigration: true,
    scopedDemoCutover: true,
    productionCutover: "not_requested",
    authMigration: "adapter_required",
    storageMigration: "adapter_required"
  },
  sourceLabel: "PulseWall managed profile",
  workspaceLabel: "Henri pre-connected workspace",
  detectedBehaviors: ["Supabase client", "tables", "realtime", "auth", "storage", "RLS", "RPC/edge markers"]
}

export const demoSetupProfile = managedSetupProfile

export type SetupRuntimeConfig = {
  setupProfile: SetupProfile
  sourceDbUrl?: string
  sourceTables?: string
  sourceCopyLimit?: string
  sourceSslDisabled?: boolean
  csvSources?: CsvSourceInput[]
}

export const productSetupProfile = (input: {
  sourceLabel: string
  sourceRoot?: string
  workspaceLabel: string
  sourceKind?: SetupProfile["sourceKind"]
  sourceDataPath?: SetupProfile["sourceDataPath"]
  detectedBehaviors?: string[]
}): SetupProfile => ({
  sourceKind: input.sourceKind ?? "owned_supabase_project",
  sourceDataPath: input.sourceDataPath ?? "supabase_db_url",
  aivenWorkspaceMode: "henri_preconnected",
  migrationScope: {
    shadowMigration: true,
    scopedDemoCutover: true,
    productionCutover: "not_requested",
    authMigration: "adapter_required",
    storageMigration: "adapter_required"
  },
  sourceLabel: input.sourceLabel,
  workspaceLabel: input.workspaceLabel,
  sourceRoot: input.sourceRoot,
  detectedBehaviors: input.detectedBehaviors ?? ["Supabase client", "tables"]
})

export const storeSetupProfile = (profile: SetupProfile) => {
  window.sessionStorage.setItem(setupProfileStorageKey, JSON.stringify(profile))
}

export const storeSetupRuntimeConfig = (config: SetupRuntimeConfig) => {
  const persisted = {
    ...config,
    sourceDbUrl: config.sourceDbUrl ? "[configured]" : undefined,
    csvSources: config.csvSources?.map((source) => ({
      fileName: source.fileName,
      tableName: source.tableName,
      csvText: "[uploaded]"
    }))
  }
  window.sessionStorage.setItem(setupRuntimeConfigStorageKey, JSON.stringify(persisted))
}

export const readStoredSetupProfile = (): SetupProfile => {
  try {
    const raw = window.sessionStorage.getItem(setupProfileStorageKey)
    if (!raw) return managedSetupProfile
    return { ...managedSetupProfile, ...(JSON.parse(raw) as Partial<SetupProfile>) }
  } catch {
    return managedSetupProfile
  }
}
