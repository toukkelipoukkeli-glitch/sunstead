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

import { SourceCard } from './components/SourceCard.tsx'
import { SwarmGrid } from './components/SwarmGrid.tsx'
import { BehaviorGraphPanel } from './components/BehaviorGraphPanel.tsx'
import { FeedPanel, type LogEntry } from './components/FeedPanel.tsx'
import { AivenServices } from './components/AivenServices.tsx'
import { MigrationProgress, type TableProgress } from './components/MigrationProgress.tsx'
import { KafkaTicker, type KafkaEvent } from './components/KafkaTicker.tsx'
import { ValidationChecklist } from './components/ValidationChecklist.tsx'
import { CostCard, type CostState } from './components/CostCard.tsx'
import { CtoPanel } from './components/CtoPanel.tsx'
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
} from './icons.tsx'

// ───────────────────────── dashboard state ─────────────────────────
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

// ───────────────────────── phase rail metadata ─────────────────────────
const PHASES: { key: RunPhase; label: string }[] = [
  { key: 'recon', label: 'Recon' },
  { key: 'graph', label: 'Graph' },
  { key: 'plan', label: 'Plan' },
  { key: 'provision', label: 'Provision' },
  { key: 'migrate', label: 'Migrate' },
  { key: 'generate', label: 'Generate' },
  { key: 'heal', label: 'Heal' },
  { key: 'verify', label: 'Verify' },
  { key: 'cutover', label: 'Cutover' },
  { key: 'operate', label: 'Operate' },
]

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
  done: 'Your data + realtime live on Aiven — CTO on watch',
  error: 'Run halted — see log',
}

// A crisp line icon per phase — gives the headline the icon-rich Aiven feel.
const PHASE_ICON: Record<RunPhase, ReactNode> = {
  recon: <Search size={18} />,
  graph: <Network size={18} />,
  plan: <Layers size={18} />,
  provision: <Server size={18} />,
  migrate: <Database size={18} />,
  generate: <Sparkle size={18} />,
  heal: <Shield size={18} />,
  verify: <Check size={18} />,
  cutover: <ArrowRight size={18} />,
  operate: <Activity size={18} />,
  done: <Check size={18} />,
  error: <Bolt size={18} />,
}

function PhaseRail({ phase }: { phase: RunPhase | null }) {
  const curIdx = phase ? PHASES.findIndex((p) => p.key === phase) : -1
  return (
    <div className="phase-rail">
      {PHASES.map((p, i) => {
        const cls =
          phase === 'done'
            ? 'past'
            : i === curIdx
              ? 'cur'
              : curIdx > -1 && i < curIdx
                ? 'past'
                : ''
        return (
          <span key={p.key} className={`phase-pip ${cls}`}>
            {p.label}
          </span>
        )
      })}
    </div>
  )
}

// ───────────────────────── derived live metrics (the ribbon) ─────────────────────────
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

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className={`ribbon-metric ${tone ?? ''}`}>
      <div className="rm-n">{value}</div>
      <div className="rm-l">{label}</div>
    </div>
  )
}

// ───────────────────────── Dashboard (Mission Control) ─────────────────────────
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
    // leave the spinner state to the phase stream; clear local flag shortly
    setTimeout(() => setLaunching(false), 1200)
  }

  const phase = state.phase
  const running = !!state.run && state.run.status === 'running'
  const finished = phase === 'done' || phase === 'error'
  const headline = phase ? PHASE_HEADLINE[phase] : 'Idle — point Overmind at a Lovable app'

  // Live counters derived purely from the stream — the ribbon ticks as events arrive.
  const elapsed = useElapsed(state.run?.startedAt, finished || !running)
  const agentsList = Object.values(state.agents)
  const working = agentsList.filter((a) => a.status === 'working').length
  const receiptsOk = state.receipts.filter((r) => r.ok).length
  const rowsCopied = Object.values(state.tables).reduce((s, t) => s + t.copied, 0)
  const checksPass = Object.values(state.checks).filter((c) => c.status === 'pass').length
  const checksTotal = Object.values(state.checks).length
  const readiness =
    state.doneReadiness != null ? state.doneReadiness : state.graph ? Math.round(state.graph.readiness) : 0
  const savePct =
    state.cost && state.cost.supabaseUsd > 0
      ? Math.round(((state.cost.supabaseUsd - state.cost.aivenUsd) / state.cost.supabaseUsd) * 100)
      : 0

  return (
    <div className="shell">
      <div className="topbar">
        <a className="brand" href="#/" title="Back to overmind.aiven.io">
          <span className="brand-logo">
            <Logo size={30} />
          </span>
          <span className="brand-text">
            <h1>
              Aiven<span className="brand-sep">/</span>
              <span className="brand-product">Overmind</span>
            </h1>
            <span className="sub">Migration Mission Control</span>
          </span>
        </a>

        <div className="phase-headline">
          <div className="phase-big">
            {phase && <span className="phase-ico">{PHASE_ICON[phase]}</span>}
            <span className="dim">{running ? 'Phase · ' : ''}</span>
            {headline}
          </div>
          <div className="spacer" />
          <PhaseRail phase={phase} />
        </div>

        <div className="topbar-stepper">
          <Stepper active="watch" />
        </div>

        <div className="conn">
          <span className={`dot ${connected ? (running ? 'live' : 'idle') : ''}`} />
          {connected ? (running ? 'streaming' : 'connected') : 'offline'}
        </div>

        <button
          className={`launch ${running ? 'running' : ''}`}
          onClick={onLaunch}
          disabled={launching || running}
        >
          {running ? (
            <>
              <Activity size={16} /> Overmind running
            </>
          ) : launching ? (
            'Launching…'
          ) : (
            <>
              <Rocket size={16} /> Launch Overmind
            </>
          )}
        </button>
      </div>

      {/* live metrics ribbon — pure function of the stream, ticks as events land */}
      <div className="ribbon">
        <Metric label="elapsed" value={elapsed} />
        <Metric label="agents working" value={working} tone={working > 0 ? 'live' : ''} />
        <Metric label="behaviors" value={state.graph?.nodes.length ?? 0} />
        <Metric label="receipts ok" value={receiptsOk} tone="cyan" />
        <Metric label="rows migrated" value={rowsCopied.toLocaleString()} tone="green" />
        <Metric label="kafka events" value={state.kafka.length} tone="violet" />
        <Metric
          label="checks green"
          value={checksTotal ? `${checksPass}/${checksTotal}` : '—'}
          tone={checksTotal > 0 && checksPass === checksTotal ? 'green' : ''}
        />
        {savePct > 0 && <Metric label="cost cut" value={`${savePct}%`} tone="green" />}
        <div className="spacer" />
        <div className="ribbon-ready">
          <div className="rr-track">
            <div className="rr-fill" style={{ width: `${readiness}%` }} />
          </div>
          <div className="rr-pct">
            <span className="rr-n">{readiness}%</span>
            <span className="rr-l">heavy layer on Aiven</span>
          </div>
        </div>
      </div>

      {phase === 'done' && (
        <div className="done-banner">
          <span className="db-icon">
            <Check size={22} />
          </span>
          <div className="db-body">
            <div className="db-title">
              Graduated · {state.doneReadiness ?? readiness}% of the heavy layer on Aiven
            </div>
            <div className="db-sub">{state.doneSummary ?? 'Live on the Aiven plane — CTO operator now on watch.'}</div>
          </div>
          <a className="db-cto-btn" href="#/cto">
            Meet your Aiven CTO <ArrowRight size={16} />
          </a>
        </div>
      )}

      {state.errorMsg && (
        <div className="error-banner">
          <span className="eb-icon">!</span>
          <div className="eb-body">
            <div className="eb-title">Run halted</div>
            <div className="eb-sub mono">{state.errorMsg}</div>
          </div>
        </div>
      )}

      <div className="zones">
        {/* ZONE 1 — SOURCE */}
        <div className="zone zone-source">
          <div className="zone-title">
            <span className="zico">
              <Database size={15} />
            </span>
            Source App
          </div>
          <SourceCard run={state.run} graph={state.graph} />
        </div>

        {/* ZONE 2 — THE SWARM */}
        <div className="zone zone-swarm">
          <div className="zone-title">
            <span className="zico">
              <Network size={15} />
            </span>
            The Swarm
          </div>
          <SwarmGrid agents={state.agents} />
          <BehaviorGraphPanel graph={state.graph} />
          <FeedPanel
            receipts={state.receipts}
            logs={state.logs}
            artifacts={Object.values(state.artifacts)}
          />
        </div>

        {/* ZONE 3 — AIVEN PLANE */}
        <div className="zone zone-aiven">
          <div className="zone-title">
            <span className="zico">
              <Cloud size={15} />
            </span>
            Aiven Plane
          </div>
          <AivenServices stack={state.stack} />
          <MigrationProgress tables={state.tables} />
          <KafkaTicker events={state.kafka} />
          <ValidationChecklist checks={state.checks} />
          <CostCard cost={state.cost} />
          <CtoPanel recs={state.recs} />
        </div>
      </div>
    </div>
  )
}
