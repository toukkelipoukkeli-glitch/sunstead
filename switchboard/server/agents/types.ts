// Shared types for the Switchboard agent crew.
// Analyzer -> Planner -> (Provisioner, Migrator, Rewriter) -> Reporter.

export type Surface = 'db' | 'auth' | 'realtime' | 'storage'

export type Finding = {
  surface: Surface
  detail: string // e.g. "from('cards')", "auth.signUp", "channel board:${id}", "storage avatars"
  file: string // path relative to the scanned root
  line: number
  snippet: string
}

export type SchemaInfo = {
  tables: { name: string; columns: number }[]
  policies: number
  indexes: number
  hasRealtimePublication: boolean
}

export type Analysis = {
  root: string
  filesScanned: number
  tables: string[]
  authMethods: string[]
  realtimeChannels: { channel: string; table?: string }[]
  storageBuckets: string[]
  findings: Finding[]
  schema?: SchemaInfo
}

export type ProvisionSpec = {
  serviceType: 'pg' | 'kafka'
  plan: string
  reason: string
}

export type Gap = {
  feature: string
  why: string
  recommendation: string
}

export type MigrationPlan = {
  app: string
  provision: ProvisionSpec[]
  authTables: string[] // app_users, sessions
  appTables: string[]
  rlsPolicies: number
  kafkaTopics: string[]
  rewrites: { file: string; reason: string }[]
  gaps: Gap[]
}

export type StepResult = {
  ok: boolean
  detail: string
}

export type MigrationReport = {
  app: string
  target: { project: string; service: string; host?: string; plan?: string; cloud?: string }
  migrated: { item: string; status: 'done' | 'partial' | 'skipped'; note: string }[]
  gaps: Gap[]
  recommendations: string[]
  rowCounts?: Record<string, number>
  generatedAt: string
}
