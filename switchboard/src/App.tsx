import { useEffect, useRef, useState } from 'react'
import { Search, Cloud, Database, PenLine, ClipboardList, Rocket, SquircleDashed, CircleCheck, TriangleAlert, CircleCheckBig, FileText, X, ArrowLeft, ArrowRight, LoaderCircle, type LucideIcon } from 'lucide-react'

// ---- types (mirror the server) -------------------------------------------
type EnvService = { kind: string; label: string; keys: string[]; migratable: boolean; aiven: string | null; note: string }
type Gap = { feature: string; why: string }
type Target = { connected: boolean; host: string; service: string; authVerified?: boolean | null }
type Savings = { supabaseMonthly: number; aivenMonthly: number; yearlySavings: number; pct: number; sizeGiB: number; plan: string }
type Analyzed = {
  services: EnvService[]; migratable: number; dbPresent: boolean; dbReachable: boolean
  tables: { name: string; rows: number }[]; totalRows: number; policies: number
  savings: Savings | null; needsConnection: boolean; byLLM: boolean; model: string | null
  platformAiven: boolean; target: Target
}
type Loop = {
  rounds: number
  repairs: { original: string; fixed: string; error: string }[]
  dropped: { sql: string; reason: string }[]
  unresolved: { sql: string; error: string }[]
  tables: string[]
}
type Report = { app: string; migrated: { item: string; status: 'done' | 'partial' | 'skipped'; note: string }[]; gaps: Gap[]; recommendations: string[]; rowCounts?: Record<string, number> }
type Provisioned = { label: string; type: string; serviceName?: string; plan?: string; host?: string; detail?: string; rows?: number; ok?: boolean }
type Result = { services: EnvService[]; provisioned?: Provisioned[]; needsConnection?: boolean; target: Target; rewrittenEnv: string; report: Report; loop?: Loop | null }
type DeployResult = {
  appName: string; sourceRepo: string; migratedRepo: string | null
  liveUrl: string | null; dashboardUrl: string | null
  tables: string[]; buckets: string[]; simulated: boolean; notes: string[]
}
type SbProject = { id: string; name: string; region: string; status: string }
type ConnectState = { connected: boolean; method: 'oauth' | 'pat' | null; oauthConfigured: boolean }

type StepKey = 'analyzer' | 'provision' | 'migrate' | 'rewrite' | 'report'
type Status = 'idle' | 'running' | 'done' | 'warn'

const CREW: { key: StepKey; label: string; Ic: LucideIcon; sub: string }[] = [
  { key: 'analyzer', label: 'Service Analyzer', Ic: Search, sub: 'inventory your .env' },
  { key: 'provision', label: 'Provisioner', Ic: Cloud, sub: 'provision Aiven' },
  { key: 'migrate', label: 'Migrator', Ic: Database, sub: 'deploy + self-correct' },
  { key: 'rewrite', label: '.env Rewriter', Ic: PenLine, sub: 'point .env at Aiven' },
  { key: 'report', label: 'Reporter', Ic: ClipboardList, sub: 'results + gaps' },
]
const STEPS = ['Connect', 'Review', 'Deploy', 'Done']
const THINKING = ['Reading your schema…', 'Identifying backend services…', 'Mapping each onto Aiven…', 'Checking what can migrate…']
// How long the start-screen decoration fades for before we advance to Review.
const DECOR_FADE_MS = 480

const emptyStr = () => ({ analyzer: '', provision: '', migrate: '', rewrite: '', report: '' }) as Record<StepKey, string>
const emptyLog = () => ({ analyzer: [], provision: [], migrate: [], rewrite: [], report: [] }) as Record<StepKey, string[]>
const emptyTimes = () => ({ analyzer: { s: 0, e: 0 }, provision: { s: 0, e: 0 }, migrate: { s: 0, e: 0 }, rewrite: { s: 0, e: 0 }, report: { s: 0, e: 0 } }) as Record<StepKey, { s: number; e: number }>

// ---- persistence: survive a page refresh ----------------------------------
// Every deploy provisions REAL Aiven services, so a reload must never quietly
// fire a second migration. We snapshot the flow to sessionStorage and rehydrate
// on load, restoring where you were instead of dropping back to the blank paste
// screen — which is what used to make people re-run the whole deploy.
const SNAP_KEY = 'vibe-deploy-flow-v1'
type Snapshot = {
  phase: 'source' | 'plan' | 'run' | 'done'
  envText: string
  projectRef: string
  analyzed: Analyzed | null
  status: Record<StepKey, Status>
  detail: Record<StepKey, string>
  log: Record<StepKey, string[]>
  times: Record<StepKey, { s: number; e: number }>
  result: Result | null
  interrupted: boolean
}

function loadSnapshot(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAP_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Snapshot
    if (!s || typeof s.phase !== 'string') return null
    // A half-finished analyze (Review with no result) can't resume on reload — the
    // request is gone. Land on Connect instead of a spinner that never ends.
    if (s.phase === 'plan' && !s.analyzed) s.phase = 'source'
    // A run that was mid-stream when the page reloaded can't be reattached (the
    // SSE POST is gone). Keep its progress, but stop any step from looking live
    // so we never imply it's still going — and never auto-restart it.
    if (s.phase === 'run') {
      s.interrupted = true
      for (const k of Object.keys(s.status) as StepKey[]) {
        if (s.status[k] === 'running') s.status[k] = 'warn'
        const t = s.times[k]
        if (t && t.s && !t.e) s.times[k] = { s: t.s, e: t.s }
      }
    }
    return s
  } catch { return null }
}

const saveSnapshot = (s: Snapshot) => { try { sessionStorage.setItem(SNAP_KEY, JSON.stringify(s)) } catch { /* quota / disabled — non-fatal */ } }
const clearSnapshot = () => { try { sessionStorage.removeItem(SNAP_KEY) } catch { /* ignore */ } }

// Classify each streamed log line so the transcript can mark wins, fixes, drops
// and failures — the self-correcting loop is the story, so make it legible.
function lineTone(l: string): 'ok' | 'fix' | 'drop' | 'bad' | '' {
  if (/^✓|bridged|reusing|powering on|live on|copied|→ Aiven/i.test(l)) return 'ok'
  if (/^↻|repair|asking .* to fix|round \d/i.test(l)) return 'fix'
  if (/^⊘|dropped/i.test(l)) return 'drop'
  if (/^✗|fail|couldn'?t|unavailable|error|issue/i.test(l)) return 'bad'
  return ''
}

function fmtElapsed(ms: number) {
  if (ms <= 0) return ''
  if (ms < 1000) return (ms / 1000).toFixed(1) + 's'
  const s = Math.round(ms / 1000)
  return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + String(s % 60).padStart(2, '0') + 's'
}

// One step's streamed activity — accumulates every log line and auto-sticks to
// the newest, so the user reads the agent working instead of a single flicker.
function StepLog({ lines, live }: { lines: string[]; live: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight }, [lines])
  if (!lines.length) return null
  return (
    <div className={'clog' + (live ? ' live' : '')} ref={ref}>
      {lines.map((l, i) => {
        const last = i === lines.length - 1
        return (
          <div key={i} className={'cline' + (last ? ' last' : '') + (lineTone(l) ? ' tone-' + lineTone(l) : '')}>
            <span className="ctext">{l}</span>
            {last && live && <span className="cpulse" />}
          </div>
        )
      })}
    </div>
  )
}

// A single GitHub repo URL pasted into the box switches the action from
// ".env migrate" to "deploy the whole app onto Aiven + AWS".
function isRepoUrl(t: string): boolean {
  const s = t.trim()
  return !s.includes('\n') && /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(s)
}

async function streamMigrate(body: any, onEvent: (e: any) => void, url = '/api/migrate') {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.body) throw new Error('No stream')
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, i)
      buf = buf.slice(i + 2)
      const line = block.split('\n').find((l) => l.startsWith('data:'))
      if (line) { try { onEvent(JSON.parse(line.slice(5).trim())) } catch { /* ignore */ } }
    }
  }
}

export default function App() {
  // Read any persisted flow exactly once (lazy init), then rehydrate from it.
  const [restored] = useState(loadSnapshot)
  const [phase, setPhase] = useState<'source' | 'plan' | 'run' | 'done' | 'deploy'>(restored?.phase ?? 'source')
  const [envText, setEnvText] = useState(restored?.envText ?? '')
  // OAuth path: a chosen Supabase project ref instead of a pasted .env.
  const [projectRef, setProjectRef] = useState(restored?.projectRef ?? '')
  const [connect, setConnect] = useState<ConnectState | null>(null)
  const [projects, setProjects] = useState<SbProject[]>([])
  const [showEnv, setShowEnv] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [analyzed, setAnalyzed] = useState<Analyzed | null>(restored?.analyzed ?? null)
  const [status, setStatus] = useState<Record<StepKey, Status>>(restored?.status ?? { analyzer: 'idle', provision: 'idle', migrate: 'idle', rewrite: 'idle', report: 'idle' })
  const [detail, setDetail] = useState<Record<StepKey, string>>(restored?.detail ?? emptyStr)
  const [log, setLog] = useState<Record<StepKey, string[]>>(restored?.log ?? emptyLog)
  const [times, setTimes] = useState<Record<StepKey, { s: number; e: number }>>(restored?.times ?? emptyTimes)
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [result, setResult] = useState<Result | null>(restored?.result ?? null)
  const [deployLog, setDeployLog] = useState<string[]>([])
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null)
  const [interrupted, setInterrupted] = useState(restored?.interrupted ?? false)
  const [health, setHealth] = useState<{ platformAiven?: boolean; aiModel?: string | null } | null>(null)
  const [thinkIdx, setThinkIdx] = useState(0)
  const [decorLeaving, setDecorLeaving] = useState(false)

  useEffect(() => { fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => {}) }, [])

  // On load: read the Supabase connection status and handle the OAuth return.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('connect')
    if (c) {
      if (c === 'error') setErr('Supabase connect failed: ' + (params.get('reason') || 'unknown'))
      window.history.replaceState({}, '', window.location.pathname)
    }
    refreshConnect()
  }, [])

  async function refreshConnect() {
    try {
      const s = await fetch('/api/connect/supabase/status').then((r) => r.json())
      setConnect(s)
      if (s.connected) loadProjects()
    } catch { /* api not up yet — fine */ }
  }
  async function loadProjects() {
    try {
      const d = await fetch('/api/connect/supabase/projects').then((r) => r.json())
      if (Array.isArray(d.projects)) setProjects(d.projects)
    } catch { /* ignore */ }
  }
  function connectOAuth() { window.location.href = '/api/connect/supabase/start' }
  async function disconnect() {
    await fetch('/api/connect/supabase/disconnect', { method: 'POST' }).catch(() => {})
    setConnect((cs) => (cs ? { ...cs, connected: false, method: null } : cs))
    setProjects([]); setProjectRef('')
  }

  // Persist the flow on every change so a refresh restores it rather than
  // re-running. A clean source screen (nothing typed) clears the snapshot.
  useEffect(() => {
    if (phase === 'deploy') return
    if (phase === 'source' && !envText.trim() && !projectRef && !result && !analyzed) { clearSnapshot(); return }
    saveSnapshot({ phase, envText, projectRef, analyzed, status, detail, log, times, result, interrupted })
  }, [phase, envText, projectRef, analyzed, status, detail, log, times, result, interrupted])

  // Tick a clock only while actively deploying, so each step shows live elapsed
  // time. A run restored from a refresh is frozen — don't tick it.
  useEffect(() => {
    if (phase !== 'run' || interrupted) return
    const id = setInterval(() => setNowTs(Date.now()), 250)
    return () => clearInterval(id)
  }, [phase, interrupted])

  // Reset to a clean paste screen and forget the persisted flow.
  function resetFlow() {
    setPhase('source'); setResult(null); setAnalyzed(null); setInterrupted(false); setErr('')
    setProjectRef('')
    setStatus({ analyzer: 'idle', provision: 'idle', migrate: 'idle', rewrite: 'idle', report: 'idle' })
    setDetail(emptyStr()); setLog(emptyLog()); setTimes(emptyTimes())
    clearSnapshot()
  }

  // Cycle "thinking" messages while the analyzer runs on the Review stage.
  useEffect(() => {
    if (phase !== 'plan' || analyzed) return
    setThinkIdx(0)
    const id = setInterval(() => setThinkIdx((i) => (i + 1) % THINKING.length), 1100)
    return () => clearInterval(id)
  }, [phase, analyzed])

  // Returning to the start screen replays the decoration's entrance, so clear the
  // leaving flag whenever we land back on 'source'.
  useEffect(() => { if (phase === 'source') setDecorLeaving(false) }, [phase])

  const stepIndex = phase === 'source' ? 0 : phase === 'plan' ? 1 : phase === 'run' || phase === 'deploy' ? 2 : 3

  // Source (a chosen project, or a pasted .env) → Review. Same shape back from the
  // server either way, so the Review stage doesn't care which path got here.
  async function analyze(body: { projectRef: string } | { envText: string }) {
    setErr(''); setBusy(true); setAnalyzed(null); setPhase('plan')
    try {
      const r = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Analysis failed')
      setAnalyzed(d)
    } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }

  // Start screen → Review. Fade the decorative shapes out first for a calmer
  // hand-off, then analyze. Reduced-motion users skip straight through.
  function proceed(body: { projectRef: string } | { envText: string }) {
    if (busy || decorLeaving) return
    const go = () => analyze(body)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { go(); return }
    setDecorLeaving(true)
    window.setTimeout(go, DECOR_FADE_MS)
  }

  function deploy() {
    setErr(''); setResult(null); setCopied(false); setInterrupted(false); setPhase('run')
    setStatus({ analyzer: 'running', provision: 'idle', migrate: 'idle', rewrite: 'idle', report: 'idle' })
    setDetail(emptyStr()); setLog(emptyLog()); setTimes({ ...emptyTimes(), analyzer: { s: Date.now(), e: 0 } })
    streamMigrate(projectRef ? { projectRef } : { envText }, (e) => {
      if (e.type === 'step') {
        setStatus((s) => ({ ...s, [e.key]: e.status }))
        if (e.detail) setDetail((d) => ({ ...d, [e.key]: e.detail }))
        setTimes((m) => {
          const cur = m[e.key as StepKey]
          if (e.status === 'running') return cur.s ? m : { ...m, [e.key]: { s: Date.now(), e: 0 } }
          if (e.status === 'done' || e.status === 'warn') return { ...m, [e.key]: { s: cur.s || Date.now(), e: Date.now() } }
          return m
        })
      } else if (e.type === 'log') {
        // Keep the last 120 lines per step — enough to read the whole story without unbounded growth.
        setLog((m) => ({ ...m, [e.key]: [...m[e.key as StepKey], e.detail].slice(-120) }))
        setTimes((m) => (m[e.key as StepKey].s ? m : { ...m, [e.key]: { s: Date.now(), e: 0 } }))
      } else if (e.type === 'result') { setResult(e); setPhase('done') }
      else if (e.type === 'error') setErr(e.message)
    }).catch((e) => setErr(e.message))
  }

  // Paste a GitHub repo URL -> clone, migrate onto Aiven, containerize, push, and
  // deploy to Render (AWS). Streams the same SSE shape as the .env crew.
  function deployAppNow() {
    const repoUrl = envText.trim()
    setErr(''); setDeployLog([]); setDeployResult(null); setBusy(true); setPhase('deploy')
    streamMigrate({ repoUrl }, (e) => {
      if (e.type === 'log') setDeployLog((l) => [...l, e.detail].slice(-200))
      else if (e.type === 'result') setDeployResult(e)
      else if (e.type === 'error') setErr(e.message)
      else if (e.type === 'done') setBusy(false)
    }, '/api/deploy-app').catch((e) => { setErr(e.message); setBusy(false) })
  }

  return (
    <div className={'page' + (phase === 'source' ? ' is-source' : '')}>
      {phase === 'source' && (
        <div className={'startdecor' + (decorLeaving ? ' leaving' : '')} aria-hidden="true">
          <svg className="decor burst-main" viewBox="-110 -110 220 220">
            <g fill="currentColor">
              <rect x="-22" y="-104" width="44" height="208" rx="22" />
              <rect x="-22" y="-104" width="44" height="208" rx="22" transform="rotate(60)" />
              <rect x="-22" y="-104" width="44" height="208" rx="22" transform="rotate(120)" />
            </g>
          </svg>
          <svg className="decor accent-green" viewBox="-110 -110 220 220">
            <g fill="currentColor">
              <rect x="-20" y="-104" width="40" height="208" rx="20" />
              <rect x="-20" y="-104" width="40" height="208" rx="20" transform="rotate(60)" />
              <rect x="-20" y="-104" width="40" height="208" rx="20" transform="rotate(120)" />
            </g>
          </svg>
          <svg className="decor brace brace-l" viewBox="799 0 195 482">
            <g transform="translate(1793 0) scale(-1 1)">
              <path fill="var(--color-yellow-40)" d="M799 -2.84794e-05C834.249 -2.53979e-05 862.06 3.24581 882.433 9.7374C902.806 15.9044 917.358 25.6418 926.09 38.9495C934.498 52.2573 938.702 69.2976 938.702 90.0707L938.702 152.877C938.702 172.027 943.714 185.497 953.739 193.287C963.44 201.077 976.861 205.134 994 205.459L994 276.541C974.92 276.866 961.015 280.923 952.284 288.713C943.229 296.828 938.702 310.298 938.702 329.123L938.702 391.929C938.702 413.027 934.497 430.067 926.09 443.05C917.358 456.358 902.806 466.096 882.433 472.263C862.06 478.754 834.249 482 799 482L799 411.404C822.93 411.404 838.776 408.483 846.537 402.64C854.299 397.123 858.179 386.411 858.179 370.507L858.179 309.648C858.179 289.2 862.707 273.62 871.761 262.909C880.816 252.198 895.368 245.22 915.418 241.974L915.418 240.026C895.368 236.78 880.816 229.802 871.761 219.091C862.707 208.38 858.179 192.8 858.179 172.352L858.179 111.493C858.179 95.5886 854.299 84.8775 846.537 79.3596C838.776 73.5172 822.93 70.596 799 70.596L799 -2.84794e-05Z" />
            </g>
          </svg>
          <svg className="decor brace brace-r" viewBox="799 0 195 482">
            <path fill="var(--color-purple-50)" d="M799 -2.84794e-05C834.249 -2.53979e-05 862.06 3.24581 882.433 9.7374C902.806 15.9044 917.358 25.6418 926.09 38.9495C934.498 52.2573 938.702 69.2976 938.702 90.0707L938.702 152.877C938.702 172.027 943.714 185.497 953.739 193.287C963.44 201.077 976.861 205.134 994 205.459L994 276.541C974.92 276.866 961.015 280.923 952.284 288.713C943.229 296.828 938.702 310.298 938.702 329.123L938.702 391.929C938.702 413.027 934.497 430.067 926.09 443.05C917.358 456.358 902.806 466.096 882.433 472.263C862.06 478.754 834.249 482 799 482L799 411.404C822.93 411.404 838.776 408.483 846.537 402.64C854.299 397.123 858.179 386.411 858.179 370.507L858.179 309.648C858.179 289.2 862.707 273.62 871.761 262.909C880.816 252.198 895.368 245.22 915.418 241.974L915.418 240.026C895.368 236.78 880.816 229.802 871.761 219.091C862.707 208.38 858.179 192.8 858.179 172.352L858.179 111.493C858.179 95.5886 854.299 84.8775 846.537 79.3596C838.776 73.5172 822.93 70.596 799 70.596L799 -2.84794e-05Z" />
          </svg>
        </div>
      )}
      <div className="shell">
        <div className="top">
          <div className="brand">
            <img className="logo" src="/aiven_logo.png" alt="Aiven" />
            <div>
              <b>Vibe Deploy</b>
              <small>{health ? (health.platformAiven ? 'deploys to Aiven' : 'set AIVEN_TOKEN to deploy') : 'paste your .env, land on Aiven'}</small>
            </div>
          </div>
        </div>

        <div className="chips">
          {STEPS.map((s, i) => (
            <div key={s} className={'chip' + (i < stepIndex ? ' done' : i === stepIndex ? ' on' : '')}>
              {s}
            </div>
          ))}
        </div>

        <div className="panel">

          {phase === 'source' && (
            <>
              <div className="connect">
                <div className="connect-head">
                  <b>Connect your Supabase</b>
                  <span>No database password, no <code>.env</code> — a scoped token you revoke anytime.</span>
                </div>

                {connect?.connected ? (
                  <>
                    <div className="connected">
                      <span className="dot" />
                      Connected to Supabase
                      <a className="lnk" onClick={disconnect}>disconnect</a>
                    </div>
                    <div className="sectlabel">Pick a project to migrate</div>
                    {projects.length ? (
                      <div className="projs">
                        {projects.map((p) => {
                          // Supabase pauses idle free projects; reading a paused DB times out
                          // (~16s) instead of analyzing. Block selection and say why.
                          const active = p.status === 'ACTIVE_HEALTHY'
                          return (
                            <button key={p.id} className={'proj' + (active ? '' : ' paused')}
                              disabled={busy || decorLeaving || !active}
                              title={active ? '' : 'Paused in Supabase — resume the project, then it can migrate.'}
                              onClick={() => { if (!active) return; setProjectRef(p.id); proceed({ projectRef: p.id }) }}>
                              <span><b>{p.name}</b><span className="projmeta">{active ? (p.region || p.id) : 'paused — resume in Supabase'}</span></span>
                              <ArrowRight size={15} />
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="hint">No projects on this account yet, or still loading… <a className="lnk" onClick={loadProjects}>refresh</a></div>
                    )}
                  </>
                ) : (
                  <>
                    <button className="btn hero connect-btn" onClick={connectOAuth} disabled={connect ? !connect.oauthConfigured : false}>
                      <span>Connect Supabase</span>
                    </button>
                  </>
                )}
              </div>

              <a className="lnk advlink" onClick={() => setShowEnv((v) => !v)}>
                {showEnv ? 'hide advanced' : 'Advanced: paste a .env or a GitHub repo URL instead'}
              </a>
              {showEnv && (
                <>
                  <textarea
                    className="text area startbox"
                    rows={8}
                    spellCheck={false}
                    placeholder={'# paste a .env to inventory every service…\nDATABASE_URL=postgresql://…\nREDIS_URL=redis://…\n\n# …or a GitHub repo URL to deploy the whole app:\n# https://github.com/you/your-lovable-app'}
                    value={envText}
                    onChange={(e) => setEnvText(e.target.value)}
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && envText.trim() && !busy) { isRepoUrl(envText) ? deployAppNow() : (setProjectRef(''), proceed({ envText })) } }}
                  />
                  <div className="row">
                    {isRepoUrl(envText)
                      ? <button className="btn hero" onClick={deployAppNow} disabled={busy}><Rocket size={15} /><span>Deploy app to Aiven + AWS</span></button>
                      : <button className="btn" onClick={() => { setProjectRef(''); proceed({ envText }) }} disabled={busy || decorLeaving || !envText.trim()}><span>Analyze .env</span></button>}
                    {isRepoUrl(envText) && <span className="est">GitHub repo → live app</span>}
                  </div>
                </>
              )}
              {err && <div className="err">{err}</div>}
            </>
          )}

          {phase === 'plan' && !analyzed && (
            <div className="thinking">
              {err ? (
                <>
                  <TriangleAlert size={22} />
                  <div className="thinking-label">{err}</div>
                  <a className="lnk" onClick={() => { setErr(''); setPhase('source') }}><ArrowLeft size={13} className="ic-inline" /> back</a>
                </>
              ) : (
                <>
                  <LoaderCircle className="spin" size={26} />
                  <div className="thinking-label" key={thinkIdx}>{THINKING[thinkIdx]}</div>
                </>
              )}
            </div>
          )}

          {phase === 'plan' && analyzed && (
            <>
              <div className="sectlabel">Services found</div>
              <div className="svcs">
                {analyzed.services.map((s) => (
                  <div key={s.kind} className={'svc' + (s.migratable ? ' mig' : '')}>
                    <div className="svcbody">
                      <b>{s.label}</b> <span className="svckeys">{s.keys.join(', ')}</span>
                      <div className="svcnote">{s.migratable ? s.aiven + ' — ' : ''}{s.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              {analyzed.dbReachable && (
                <>
                  <div className="sectlabel">Your database → Aiven for PostgreSQL</div>
                  <div className="list">
                    <div><span className="ok"><Database size={14} className="ic-inline" /></span><b>{analyzed.tables.length} tables · {analyzed.totalRows.toLocaleString()} rows · {analyzed.policies} RLS policies</b> — schema + auth + RLS, deployed to an isolated schema.</div>
                  </div>
                  {analyzed.savings && (
                    <div className="save">
                      <span className="big">${analyzed.savings.supabaseMonthly} → ${analyzed.savings.aivenMonthly}<span style={{ fontSize: 13 }}>/mo</span></span>
                      <span className="sub">~${analyzed.savings.yearlySavings}/yr · {analyzed.savings.sizeGiB} GiB · illustrative</span>
                    </div>
                  )}
                </>
              )}

              {analyzed.needsConnection && (
                <div className="note">Found Supabase, but no database connection in the .env — those API keys can't migrate data. Add <code>DATABASE_URL=postgres://…@db.&lt;ref&gt;.supabase.co:5432/postgres</code> and analyze again.</div>
              )}
              {!analyzed.platformAiven && (
                <div className="note">Operator: set <code>AIVEN_TOKEN</code> in <code>switchboard/.env</code> to enable live deploys.</div>
              )}

              <div className="row">
                <button className="btn hero" onClick={deploy} disabled={!analyzed.dbReachable || !analyzed.platformAiven}>
                  <span>Deploy {analyzed.migratable} service{analyzed.migratable === 1 ? '' : 's'} to Aiven</span>
                </button>
              </div>
              {!analyzed.dbReachable && !analyzed.needsConnection && <div className="hint">No reachable database to deploy — add a DATABASE_URL to migrate.</div>}
              {err && <div className="err">{err}</div>}
            </>
          )}

          {phase === 'deploy' && (
            <div className="crew">
              <div className={'cstep ' + (deployResult ? (deployResult.liveUrl ? 'done' : 'warn') : 'live')}>
                <div className="crow">
                  <div className={'ic ' + (deployResult ? (deployResult.liveUrl ? 'done' : 'warn') : 'live')}>
                    {deployResult ? (deployResult.liveUrl ? <CircleCheck size={16} /> : <TriangleAlert size={16} />) : <LoaderCircle className="spin" size={16} />}
                  </div>
                  <div className="t"><b>Deploy app</b> <span>clone → migrate to Aiven → push → Render (AWS)</span></div>
                </div>
                <StepLog lines={deployLog} live={!deployResult && !err} />
              </div>

              {deployResult && (
                <div className="done">
                  <div className="success">
                    <span className="mark">{deployResult.liveUrl ? <CircleCheckBig size={22} /> : <FileText size={22} />}</span>
                    <div>
                      <b>{deployResult.liveUrl ? 'Live — data on Aiven, app on AWS' : 'Migrated + containerized (dry run)'}</b>
                      <div><small>{deployResult.appName}{deployResult.tables.length ? ` · ${deployResult.tables.length} table${deployResult.tables.length === 1 ? '' : 's'} → Aiven` : ''}</small></div>
                    </div>
                  </div>
                  {deployResult.liveUrl && (
                    <div className="list">
                      <div><span className="ok"><Rocket size={13} className="ic-inline" /></span> <b>Live app:</b> <a className="lnk" href={deployResult.liveUrl} target="_blank" rel="noreferrer">{deployResult.liveUrl}</a></div>
                      {deployResult.migratedRepo && <div><span className="ok"><FileText size={13} className="ic-inline" /></span> migrated repo: <a className="lnk" href={deployResult.migratedRepo} target="_blank" rel="noreferrer">{deployResult.migratedRepo}</a></div>}
                    </div>
                  )}
                  {!deployResult.liveUrl && (
                    <div className="note">Migrated + containerized, but not deployed — set <code>RENDER_API_KEY</code> in <code>switchboard/.env</code> to push and go live.</div>
                  )}
                  {deployResult.notes.length > 0 && (<><div className="sectlabel">Notes</div><div className="recs">{deployResult.notes.map((n, i) => (<div key={i}>• {n}</div>))}</div></>)}
                  <div className="row"><button className="btn" onClick={() => { setPhase('source'); setDeployResult(null); setDeployLog([]); setEnvText('') }}><ArrowLeft size={15} /><span>Deploy another</span></button></div>
                </div>
              )}
              {err && !deployResult && (
                <>
                  <div className="err">{err}</div>
                  <div className="row"><a className="lnk" onClick={() => { setErr(''); setPhase('source') }}><ArrowLeft size={13} className="ic-inline" /> back</a></div>
                </>
              )}
            </div>
          )}

          {phase === 'run' && (
            <div className="crew">
              {CREW.map((c) => {
                const raw = status[c.key]
                const lines = log[c.key]
                // A step counts as "live" the moment its logs start streaming — the
                // migrator narrates while the provisioner is still spinning up. A run
                // restored after a refresh is never live: the stream is gone.
                const disp = raw === 'done' ? 'done' : raw === 'warn' ? 'warn' : (!interrupted && (raw === 'running' || lines.length)) ? 'live' : 'idle'
                const t = times[c.key]
                const elapsed = t.s ? (t.e || nowTs) - t.s : 0
                return (
                  <div key={c.key} className={'cstep ' + disp}>
                    <div className="crow">
                      <div className={'ic ' + disp}>
                        {disp === 'live' ? <LoaderCircle className="spin" size={16} />
                          : disp === 'done' ? <CircleCheck size={16} />
                          : disp === 'warn' ? <TriangleAlert size={16} />
                          : <SquircleDashed size={16} />}
                      </div>
                      <div className="t"><b>{c.label}</b> <span>{detail[c.key] || c.sub}</span></div>
                      {elapsed > 0 ? <span className="ctime">{fmtElapsed(elapsed)}</span> : null}
                    </div>
                    {disp === 'live' && <StepLog lines={lines} live />}
                  </div>
                )
              })}
              {phase === 'run' && interrupted && (
                <div className="hint">
                  This run was interrupted by a page reload — the progress above is preserved and nothing was restarted. It may have finished on Aiven; check your services, or <a className="lnk" onClick={resetFlow}>start over</a>.
                </div>
              )}
              {err && <div className="err">{err}</div>}
            </div>
          )}

          {phase === 'done' && result && (
            <div className="done">
              {result.provisioned && result.provisioned.length > 0 && (
                <>
                  <div className="sectlabel">Services deployed to Aiven</div>
                  <div className="list">
                    {result.provisioned.map((p, i) => (
                      <div key={'p' + i}>
                        <span className={p.ok === false ? 'bad' : 'ok'}>{p.ok === false ? <X size={13} className="ic-inline" /> : <CircleCheckBig size={13} className="ic-inline" />}</span>{' '}
                        <b>{p.label}</b> → {p.serviceName ? <code>{p.serviceName}</code> : 'failed'} <span style={{ color: 'var(--muted)' }}>{p.plan ? `· ${p.plan} ` : ''}· {p.detail}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {result.loop && result.loop.tables.length > 0 && (
                <>
                  <div className="sectlabel">Live on Aiven</div>
                  <div className="rowcounts">
                    {result.loop.tables.map((t) => (<span key={t} className="rc">{t}</span>))}
                  </div>
                </>
              )}

              <div className="sectlabel">Your new .env <a className="lnk" onClick={() => { navigator.clipboard?.writeText(result.rewrittenEnv); setCopied(true) }}>{copied ? 'copied' : 'copy'}</a></div>
              <pre className="envbox">{result.rewrittenEnv}</pre>

              <div className="row">
                <button className="btn" onClick={resetFlow}><ArrowLeft size={15} /><span>Migrate another app</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
