import { useEffect, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  SwarmEvent,
  MigrationRun,
  BehaviorGraph,
  AivenStack,
  AgentActivity,
  Receipt,
  GeneratedArtifact,
  ValidationCheck,
  CtoRecommendation,
  RunPhase,
} from '../shared/types.ts'
import { connectStream, startRun } from './api.ts'
import { Stepper } from './components/Stepper.tsx'
import type { LogEntry } from './components/FeedPanel.tsx'
import type { TableProgress } from './components/MigrationProgress.tsx'
import type { KafkaEvent } from './components/KafkaTicker.tsx'
import type { CostState } from './components/CostCard.tsx'
import {
  Logo,
  Bolt,
  Check,
  ArrowRight,
  Search,
  Network,
  Layers,
  Server,
  Database,
  Sparkle,
  Shield,
  Activity,
  Rocket,
  Cloud,
  FileCode,
  Stream,
} from './icons.tsx'

// ───────────────────────── dashboard state ─────────────────────────
// NOTE: the reducer below is the contract — it is a pure switch over every
// SwarmEvent.type, so the whole UI stays a deterministic function of the SSE
// stream. We keep the full state shape even though the focused UI only renders
// a slice of it: the stream is unchanged, only the *render* is trimmed.
interface DashState {
  run: MigrationRun | null
  phase: RunPhase | null
  graph: BehaviorGraph | null
  stack: AivenStack | null
  agents: Record<string, AgentActivity> // keyed by agentId
  receipts: Receipt[] // newest first
  logs: LogEntry[] // newest first
  artifacts: Record<string, GeneratedArtifact> // keyed by path
  tables: Record<string, TableProgress> // keyed by table
  kafka: KafkaEvent[] // newest first
  checks: Record<string, ValidationCheck> // keyed by name
  cost: CostState | null
  recs: CtoRecommendation[] // newest first
  doneSummary: string | null
  doneReadiness: number | null
  errorMsg: string | null
}

const initial: DashState = {
  run: null,
  phase: null,
  graph: null,
  stack: null,
  agents: {},
  receipts: [],
  logs: [],
  artifacts: {},
  tables: {},
  kafka: [],
  checks: {},
  cost: null,
  recs: [],
  doneSummary: null,
  doneReadiness: null,
  errorMsg: null,
}

let seq = 0
const nextId = () => ++seq

const CAP = 200 // keep feeds bounded for a long-running demo

// The reducer is a pure switch over SwarmEvent.type — the whole UI is a
// deterministic function of the stream, exactly as the contract demands.
function reduce(s: DashState, e: SwarmEvent): DashState {
  switch (e.type) {
    case 'phase':
      return { ...s, phase: e.phase, run: e.run }
    case 'agent':
      return { ...s, agents: { ...s.agents, [e.activity.agentId]: e.activity } }
    case 'graph':
      return { ...s, graph: e.graph }
    case 'stack':
      return { ...s, stack: e.stack }
    case 'receipt':
      return { ...s, receipts: [e.receipt, ...s.receipts].slice(0, CAP) }
    case 'migration':
      return {
        ...s,
        tables: {
          ...s.tables,
          [e.table]: { table: e.table, copied: e.copied, total: e.total },
        },
      }
    case 'kafka':
      return {
        ...s,
        kafka: [{ id: nextId(), topic: e.topic, direction: e.direction, payload: e.payload }, ...s.kafka].slice(
          0,
          CAP,
        ),
      }
    case 'artifact':
      return { ...s, artifacts: { ...s.artifacts, [e.artifact.path]: e.artifact } }
    case 'heal': {
      // fold heal attempts into the matching artifact if present
      const a = s.artifacts[e.artifact]
      const artifacts = a
        ? {
            ...s.artifacts,
            [e.artifact]: {
              ...a,
              healAttempts: e.attempt,
              status: e.ok ? ('healed' as const) : a.status,
              lastError: e.error ?? a.lastError,
            },
          }
        : s.artifacts
      const log: LogEntry = {
        id: nextId(),
        level: e.ok ? 'info' : 'warn',
        msg: `heal ${e.artifact} · attempt ${e.attempt} · ${e.ok ? 'green' : e.error ?? 'failed'}`,
        ts: new Date().toISOString(),
      }
      return { ...s, artifacts, logs: [log, ...s.logs].slice(0, CAP) }
    }
    case 'validation':
      return { ...s, checks: { ...s.checks, [e.check.name]: e.check } }
    case 'cost':
      return { ...s, cost: { supabaseUsd: e.supabaseUsd, aivenUsd: e.aivenUsd, note: e.note } }
    case 'cto':
      return { ...s, recs: [e.rec, ...s.recs].slice(0, CAP) }
    case 'log':
      return {
        ...s,
        logs: [{ id: nextId(), level: e.level, msg: e.msg, ts: new Date().toISOString() }, ...s.logs].slice(
          0,
          CAP,
        ),
      }
    case 'done':
      return {
        ...s,
        doneSummary: e.summary,
        doneReadiness: e.readiness,
        phase: 'done',
        run: s.run ? { ...s.run, status: 'done', phase: 'done' } : s.run,
      }
    case 'error':
      return {
        ...s,
        errorMsg: e.msg,
        phase: 'error',
        run: s.run ? { ...s.run, status: 'error', phase: 'error' } : s.run,
      }
    default:
      return s
  }
}

// ───────────────────────── phase metadata ─────────────────────────
const PHASE_HEADLINE: Record<RunPhase, string> = {
  recon: 'Scanning the source backend',
  graph: 'Mapping the behavior graph',
  plan: 'Planning the Aiven target stack',
  provision: 'Provisioning Aiven via MCP',
  migrate: 'Migrating schema + data + vectors',
  generate: 'Generating the Aiven-native backend',
  heal: 'Generating + checking the backend',
  verify: 'Verifying parity, auth, realtime & search',
  cutover: 'Pointing your data + realtime at Aiven',
  operate: 'Operating live — CTO on watch',
  done: 'Your data + realtime live on Aiven',
  error: 'Run halted — see log',
}

const PHASE_ICON: Record<RunPhase, ReactNode> = {
  recon: <Search size={16} />,
  graph: <Network size={16} />,
  plan: <Layers size={16} />,
  provision: <Server size={16} />,
  migrate: <Database size={16} />,
  generate: <Sparkle size={16} />,
  heal: <Shield size={16} />,
  verify: <Check size={16} />,
  cutover: <ArrowRight size={16} />,
  operate: <Activity size={16} />,
  done: <Check size={16} />,
  error: <Bolt size={16} />,
}

// ───────────────────────── elapsed clock ─────────────────────────
function useElapsed(startedAt: string | undefined, stopped: boolean): string {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    if (!startedAt || stopped) return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt, stopped])
  if (!startedAt) return '0:00'
  const ms = Date.now() - new Date(startedAt).getTime()
  if (isNaN(ms) || ms < 0) return '0:00'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ───────────────────────── the hero feed ─────────────────────────
// One unified, chronological stream of what the agents are ACTUALLY doing:
// real Aiven/GitHub tool-call receipts interleaved with key logs. Newest at
// the bottom (it reads like a terminal), capped for a long demo.
interface FeedRow {
  key: string
  kind: 'receipt' | 'log'
  ok: boolean
  level?: 'info' | 'warn' | 'error'
  action?: string // receipt action verb, e.g. aiven_service_create
  text: string
  ts?: string
  icon: ReactNode
}

// A crisp icon per receipt action so the receipts read at a glance.
function receiptIcon(action: string): ReactNode {
  if (action.includes('service_create') || action.includes('service')) return <Server size={15} />
  if (action.includes('kafka')) return <Stream size={15} />
  if (action.includes('pg_') || action.includes('postgres') || action.includes('migration'))
    return <Database size={15} />
  if (action.includes('github') || action.includes('pull_request')) return <FileCode size={15} />
  if (action.includes('vector') || action.includes('integration')) return <Sparkle size={15} />
  if (action.includes('verify') || action.includes('validation')) return <Shield size={15} />
  return <Check size={15} />
}

function fmtTs(ts?: string): string {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function HeroFeed({ receipts, logs }: { receipts: Receipt[]; logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // receipts + logs are stored newest-first; build a chronological list
  // (oldest → newest) so the newest lands at the bottom like a console.
  const rRows: FeedRow[] = receipts.map((r) => ({
    key: `r-${r.id}`,
    kind: 'receipt',
    ok: r.ok,
    action: r.action,
    text: r.summary,
    ts: r.ts,
    icon: receiptIcon(r.action),
  }))
  const lRows: FeedRow[] = logs.map((l) => ({
    key: `l-${l.id}`,
    kind: 'log',
    ok: l.level !== 'error',
    level: l.level,
    text: l.msg,
    ts: l.ts,
    icon: l.level === 'error' ? <Bolt size={15} /> : <Activity size={15} />,
  }))

  // merge + sort ascending by timestamp; rows without ts keep insertion order
  const rows = [...rRows, ...lRows].sort((a, b) => {
    const ta = a.ts ? new Date(a.ts).getTime() : 0
    const tb = b.ts ? new Date(b.ts).getTime() : 0
    return ta - tb
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [rows.length])

  return (
    <div className="hero">
      <div className="hero-h">
        <h2>
          <span className="hero-live" /> What the agents are doing
        </h2>
        <span className="hero-meta">
          {receipts.filter((r) => r.ok).length}/{receipts.length || 0} real tool-calls
        </span>
      </div>
      <div className="hero-feed">
        {rows.length === 0 && (
          <div className="hero-empty pulse-wait">
            Every real Aiven &amp; GitHub tool-call the agents make lands here, live…
          </div>
        )}
        {rows.map((row) => (
          <div className={`hrow ${row.kind} ${row.ok ? '' : 'bad'} ${row.level ?? ''}`} key={row.key}>
            <span className="hrow-ico">{row.icon}</span>
            {row.action ? (
              <span className="hrow-action mono">{row.action}</span>
            ) : (
              <span className="hrow-tag">log</span>
            )}
            <span className="hrow-text">{row.text}</span>
            <span className="hrow-ts mono">{fmtTs(row.ts)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

// ───────────────────────── Dashboard (focused Mission Control) ─────────────────────────
export default function Dashboard() {
  const [state, dispatch] = useReducer(reduce, initial)
  const [connected, setConnected] = useState(false)
  const [launching, setLaunching] = useState(false)
  const sawEvent = useRef(false)

  useEffect(() => {
    setConnected(true)
    const disconnect = connectStream((ev) => {
      sawEvent.current = true
      dispatch(ev)
    })
    return () => {
      disconnect()
      setConnected(false)
    }
  }, [])

  const onLaunch = async () => {
    setLaunching(true)
    // Re-run the demo migration. The backend runs in mock mode, so no login is required —
    // on a failure we just clear the spinner (the stream keeps rendering) rather than
    // bouncing the user out of Mission Control.
    await startRun(undefined, 'demo')
    setTimeout(() => setLaunching(false), 1200)
  }

  const phase = state.phase
  const running = !!state.run && state.run.status === 'running'
  const finished = phase === 'done' || phase === 'error'
  const headline = phase ? PHASE_HEADLINE[phase] : 'Idle — point Overmind at a Lovable app'
  const elapsed = useElapsed(state.run?.startedAt, finished || !running)

  // ── target Aiven service status, derived purely from the stream ──
  // Prefer the explicit stack event; otherwise fall back to nothing.
  const pg = state.stack?.postgres
  const kafka = state.stack?.kafka
  // the "fresh service coming up" — show pg as the primary target, kafka as secondary
  const targetSvc = pg ?? null
  const rowsMigrated = Object.values(state.tables).reduce((s, t) => s + t.copied, 0)

  // ── the prominent PR hand-off (action === 'github_pull_request') ──
  const prReceipt = state.receipts.find((r) => r.action === 'github_pull_request')

  return (
    <div className="shell focused">
      {/* 1 ── compact header: stepper + phase headline + elapsed clock ── */}
      <header className="fhead">
        <a className="fbrand" href="#/" title="Back to overmind.aiven.io">
          <Logo size={26} />
          <span className="fbrand-txt">
            Aiven<span className="fbrand-sep">/</span>Overmind
          </span>
        </a>

        <div className="fhead-stepper">
          <Stepper active="watch" />
        </div>

        <div className="spacer" />

        <div className="fphase">
          <span className="fphase-ico">{phase ? PHASE_ICON[phase] : <Rocket size={16} />}</span>
          <span className="fphase-text">{headline}</span>
        </div>

        <div className="fclock mono" title="elapsed">
          <Activity size={13} /> {elapsed}
        </div>

        <span className={`fdot ${connected ? (running ? 'live' : 'idle') : ''}`} title={connected ? (running ? 'streaming' : 'connected') : 'offline'} />

        <button className={`flaunch ${running ? 'running' : ''}`} onClick={onLaunch} disabled={launching || running}>
          {running ? (
            <>
              <Activity size={15} /> Running
            </>
          ) : launching ? (
            'Launching…'
          ) : (
            <>
              <Rocket size={15} /> Launch
            </>
          )}
        </button>
      </header>

      {/* ── error: clean one-liner ── */}
      {state.errorMsg && (
        <div className="error-banner">
          <span className="eb-icon">!</span>
          <div className="eb-body">
            <div className="eb-title">Run halted</div>
            <div className="eb-sub mono">{state.errorMsg}</div>
          </div>
        </div>
      )}

      {/* ── done: clean success + the big CTO hand-off ── */}
      {phase === 'done' && (
        <div className="done-banner">
          <span className="db-icon">
            <Check size={22} />
          </span>
          <div className="db-body">
            <div className="db-title">
              Live on Aiven · {state.doneReadiness ?? 0}% of the heavy layer migrated
            </div>
            <div className="db-sub">
              {state.doneSummary ?? 'Your data + realtime now run on the Aiven plane.'}
            </div>
          </div>
          <a className="db-cto-btn" href="#/cto">
            Meet your Aiven CTO <ArrowRight size={16} />
          </a>
        </div>
      )}

      {/* 4 ── the prominent PR hand-off ── */}
      {prReceipt && (
        <a className="pr-banner" href={prReceipt.summary} target="_blank" rel="noreferrer">
          <span className="pr-icon">
            <FileCode size={20} />
          </span>
          <div className="pr-body">
            <div className="pr-title">Opened a PR to migrate your app</div>
            <div className="pr-sub mono">{prReceipt.summary}</div>
          </div>
          <span className="pr-cta">
            View on GitHub <ArrowRight size={15} />
          </span>
        </a>
      )}

      {/* 2 ── THE HERO: the live real-tool-call feed ── */}
      <HeroFeed receipts={state.receipts} logs={state.logs} />

      {/* 3 ── tiny target-service status line ── */}
      <div className="target-line">
        {targetSvc ? (
          <>
            <span className="tl-ico">
              <Server size={14} />
            </span>
            <span className="tl-name mono">{targetSvc.service}</span>
            <span className={`tl-state ${targetSvc.state === 'RUNNING' ? 'up' : 'building'}`}>
              {targetSvc.state === 'RUNNING' ? (
                <>
                  <Check size={12} /> RUNNING
                </>
              ) : (
                <>
                  <span className="tl-spin" /> {targetSvc.state || 'BUILDING'}
                </>
              )}
            </span>
            {targetSvc.pgvector && <span className="tl-tag">pgvector</span>}
            {kafka && (
              <>
                <span className="tl-sep" />
                <span className="tl-ico">
                  <Stream size={14} />
                </span>
                <span className="tl-name mono">{kafka.service}</span>
                <span className={`tl-state ${kafka.state === 'RUNNING' ? 'up' : 'building'}`}>
                  {kafka.state === 'RUNNING' ? 'RUNNING' : kafka.state || 'BUILDING'}
                </span>
              </>
            )}
            <span className="spacer" />
            <span className="tl-rows mono">{rowsMigrated.toLocaleString()} rows migrated</span>
          </>
        ) : (
          <>
            <span className="tl-ico">
              <Cloud size={14} />
            </span>
            <span className="tl-dim">Target Aiven service spins up here as the agents provision it…</span>
            {rowsMigrated > 0 && (
              <>
                <span className="spacer" />
                <span className="tl-rows mono">{rowsMigrated.toLocaleString()} rows migrated</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
