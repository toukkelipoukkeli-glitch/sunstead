import type { Analysis, MigrationPlan, Gap } from './types'

// Turns an Analysis into a concrete migration plan: which Aiven services to
// provision, which auth tables to synthesize, which realtime channels become
// Kafka topics, which files the Rewriter must touch, and the honest gaps.

const KNOWN_GAPS: Record<string, Gap> = {
  storage: {
    feature: 'Supabase Storage',
    why: 'Aiven has no managed S3-compatible object store, so avatar/file uploads have no drop-in target.',
    recommendation: 'Aiven for Object Storage (S3 API). Until then the app keeps Supabase Storage or wires its own bucket.',
  },
  auth: {
    feature: 'Hosted auth (GoTrue)',
    why: 'Supabase Auth is a managed service; on Aiven we recreate it as pgcrypto tables + a thin auth API.',
    recommendation: 'Aiven for Auth (managed GoTrue on Aiven Postgres) would make this a zero-code swap.',
  },
  realtime: {
    feature: 'Hosted Realtime',
    why: 'Supabase Realtime streams row changes over websockets; Aiven offers the pieces (Kafka, Postgres NOTIFY) but not the hosted bridge.',
    recommendation: 'A managed Postgres-changes -> Kafka/websocket bridge on Aiven would close this.',
  },
  rls: {
    feature: 'RLS role/grant migration via MCP',
    why: 'The Aiven MCP pg_write tool blocks GRANT/CREATE ROLE, so non-owner RLS roles must be created out-of-band.',
    recommendation: 'Allow scoped role/grant statements in the MCP so RLS-complete migrations are fully autonomous.',
  },
}

export function plan(analysis: Analysis, appName = 'app'): MigrationPlan {
  const usesAuth = analysis.authMethods.length > 0
  const usesRealtime = analysis.realtimeChannels.length > 0
  const usesStorage = analysis.storageBuckets.length > 0 || analysis.findings.some((f) => f.surface === 'storage')

  const provision: MigrationPlan['provision'] = [
    { serviceType: 'pg', plan: 'free-1-1gb', reason: 'Main database (replaces Supabase Postgres).' },
  ]
  if (usesRealtime)
    provision.push({
      serviceType: 'kafka',
      plan: 'startup-2',
      reason: 'Realtime pub/sub for high fan-out (replaces Supabase Realtime).',
    })

  // One Kafka topic per realtime-watched table.
  const kafkaTopics = usesRealtime
    ? [...new Set(analysis.realtimeChannels.map((c) => `${c.table ?? 'changes'}.changes`))]
    : []

  // Files the Rewriter will touch, inferred from where supabase shows up.
  const touched = [...new Set(analysis.findings.map((f) => f.file))]
  const rewriteReason = (file: string) => {
    if (file.includes('supabaseClient')) return 'Repoint the client at the Aiven API base URL.'
    if (file.includes('auth')) return 'Swap supabase.auth.* for the Aiven auth endpoints.'
    if (file.includes('realtime')) return 'Swap supabase.channel() for the Aiven SSE/Kafka stream.'
    if (file.includes('storage')) return 'Stub storage until Aiven object storage exists (gap).'
    if (file.includes('db')) return 'Swap the query builder for typed calls to the Aiven API.'
    return 'Replace supabase-js usage with Aiven API calls.'
  }

  const gaps: Gap[] = []
  if (usesStorage) gaps.push(KNOWN_GAPS.storage)
  if (analysis.schema && analysis.schema.policies > 0) gaps.push(KNOWN_GAPS.rls)

  return {
    app: appName,
    provision,
    authTables: usesAuth ? ['app_users', 'sessions'] : [],
    appTables: analysis.tables,
    rlsPolicies: analysis.schema?.policies ?? 0,
    kafkaTopics,
    rewrites: touched.map((file) => ({ file, reason: rewriteReason(file) })),
    gaps,
  }
}
