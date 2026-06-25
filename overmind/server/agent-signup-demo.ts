// server/agent-signup-demo.ts — proof of agentic self-onboarding.
//
// An "agent" with no prior credentials:
//   1. POSTs /api/agents/register → receives client_id + a short-lived scoped bearer token.
//   2. Calls a PROTECTED endpoint (POST /api/run) with Authorization: Bearer <token>.
//   3. Confirms a no-token call is rejected (401) — the guard actually guards.
//
// Run against a live server:
//   npm run dev          # in one terminal (starts the API on :8788)
//   npx tsx server/agent-signup-demo.ts
//
// Works identically in WorkOS mode and MOCK mode — the agent never knows or cares which.

import './env.ts'

const BASE = process.env.OVERMIND_URL || `http://localhost:${process.env.PORT || 8788}`

function step(n: number, msg: string): void {
  console.log(`\n[${n}] ${msg}`)
}
function ok(msg: string): void {
  console.log(`    ✓ ${msg}`)
}
function bad(msg: string): void {
  console.log(`    ✗ ${msg}`)
}

async function main(): Promise<void> {
  console.log(`Agent self-onboarding demo → ${BASE}`)

  // Sanity: is the server up, and which auth mode is it in?
  step(0, 'Checking server health + auth mode')
  let mode = 'unknown'
  try {
    const h = await fetch(`${BASE}/api/health`).then((r) => r.json())
    mode = h.authMode ?? (h.workos ? 'workos' : 'mock')
    ok(`server up — auth mode: ${mode}`)
  } catch {
    bad(`server not reachable at ${BASE} — start it with: npm run dev`)
    process.exit(1)
  }

  // 1. The agent registers ITSELF — no human, no browser, no pre-shared key.
  step(1, 'Agent self-registers: POST /api/agents/register')
  const reg = await fetch(`${BASE}/api/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'overmind-migrator-bot',
      scopes: ['migration:run', 'migration:read'],
    }),
  })
  if (!reg.ok) {
    bad(`registration failed: ${reg.status} ${await reg.text()}`)
    process.exit(1)
  }
  const creds = (await reg.json()) as {
    mode: string
    client_id: string
    access_token: string
    expires_in: number
    scopes: string[]
    note: string
  }
  ok(`registered as client_id=${creds.client_id} (mode=${creds.mode})`)
  ok(`scopes=[${creds.scopes.join(', ')}]  token expires in ${creds.expires_in}s`)
  ok(`token (truncated): ${creds.access_token.slice(0, 24)}…`)
  console.log(`    ℹ ${creds.note}`)

  // 2. Negative control: the protected endpoint must reject a call with NO token.
  step(2, 'Sanity: POST /api/run with NO token must be rejected')
  const noAuth = await fetch(`${BASE}/api/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (noAuth.status === 401) {
    ok(`correctly rejected (401) — endpoint is actually protected`)
  } else {
    bad(`expected 401, got ${noAuth.status} — endpoint is NOT protected!`)
  }

  // 3. The agent calls the protected endpoint WITH its freshly-minted token.
  step(3, 'Agent calls protected POST /api/run with Authorization: Bearer <token>')
  const run = await fetch(`${BASE}/api/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creds.access_token}`,
    },
    body: JSON.stringify({ source: process.env.SOURCE_REPO_DIR || '../demo/live-hype-wall' }),
  })
  if (run.ok) {
    const out = (await run.json()) as { ok: boolean; actor?: string; source?: string }
    ok(`accepted (200) — server saw actor: ${out.actor}`)
    ok(`migration kicked off on source: ${out.source}`)
    console.log('\n✅ Agentic self-onboarding proven: register → token → protected call → action.')
  } else {
    bad(`expected 200, got ${run.status}: ${await run.text()}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('demo failed:', e)
  process.exit(1)
})
