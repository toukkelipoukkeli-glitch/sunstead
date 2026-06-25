import { useEffect, useReducer, useRef, useState } from 'react'
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
      return { ...s, logs: [{ id: nextId(), level: e.level, msg: e.msg }, ...s.logs].slice(0, CAP) }
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
  heal: 'Self-healing until every test is green',
  verify: 'Verifying parity, auth, realtime & search',
  cutover: 'Cutting over to Aiven',
  operate: 'Operating live — CTO on watch',
  done: 'Migration complete — 100% on Aiven',
  error: 'Run halted — see log',
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
    await startRun()
    // leave the spinner state to the phase stream; clear local flag shortly
    setTimeout(() => setLaunching(false), 1200)
  }

  const phase = state.phase
  const running = !!state.run && state.run.status === 'running'
  const headline = phase ? PHASE_HEADLINE[phase] : 'Idle — point Overmind at a Lovable app'

  return (
    <div className="shell">
      <div className="topbar">
        <a className="brand" href="#/" title="Back to overmind.aiven.io" style={{ textDecoration: 'none' }}>
          <h1>OVERMIND</h1>
          <span className="sub">← Aiven Migration Mission Control</span>
        </a>

        <div className="phase-headline">
          <div className="phase-big">
            <span className="dim">{running ? 'Phase · ' : ''}</span>
            {headline}
          </div>
          <div className="spacer" />
          <PhaseRail phase={phase} />
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
          {running ? '◆ Overmind running' : launching ? 'Launching…' : '⚡ Launch Overmind'}
        </button>
      </div>

      {state.errorMsg && (
        <div className="panel" style={{ marginTop: 14, borderColor: '#4a2330' }}>
          <span className="logline error">
            <span className="lvl">error</span>
            <span className="lmsg">{state.errorMsg}</span>
          </span>
        </div>
      )}

      <div className="zones">
        {/* ZONE 1 — SOURCE */}
        <div className="zone zone-source">
          <div className="zone-title">
            <span className="bar" />
            Source App
          </div>
          <SourceCard run={state.run} graph={state.graph} />
        </div>

        {/* ZONE 2 — THE SWARM */}
        <div className="zone zone-swarm">
          <div className="zone-title">
            <span className="bar" />
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
            <span className="bar" />
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
