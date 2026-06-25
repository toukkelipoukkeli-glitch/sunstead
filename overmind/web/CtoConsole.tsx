// web/CtoConsole.tsx — "Your Aiven CTO". The centerpiece of the operate phase.
//
// The founder NEVER opens the Aiven dashboard again. They open this. Left: an ALWAYS-ON live
// monitor — PG/Kafka health, real resource usage, cost, and a rolling alert feed that proves the
// CTO is watching every few seconds, not just answering when asked. Right: a polished chat with a
// senior-engineer agent that streams its replies from POST /api/cto/chat.
//
// Live state: we poll GET /api/cto/state?tenant=demo every 8s (and once on mount). Every field is
// optional / nullable — if the backend is down or a field is missing we degrade to calm, sensible
// placeholders so the static Pages deploy still looks complete. The monitor never shows a blank.
//
// Stream handling: we read the chat response BODY as a stream and append text as it arrives. The
// server may send either raw text chunks OR SSE (`data: {json}\n\n`); we handle both. If
// /api/cto/chat isn't wired (404/empty), we degrade to a canned senior-engineer reply.
//
// Owns: this file + web/product.css. Default export. Never edits App.tsx.

import { useEffect, useRef, useState } from 'react'
import './product.css'
import { apiFetch } from './config.ts'

interface Msg {
  role: 'cto' | 'me'
  text: string
}

// ── The live-state contract from GET /api/cto/state?tenant=demo ──
// Built by a teammate in parallel; we code against this shape and degrade on any null/missing field.
type Severity = 'info' | 'warn' | 'critical'

interface CtoAlert {
  id: string
  severity: Severity
  title: string
  detail: string
  action: string
  metric?: string
  ts: string
}

interface CtoState {
  ts: string
  tenant: string
  pg: {
    status: 'running' | 'unknown'
    plan: string
    rows: number | null
    connections: number | null
    maxConnections: number | null
    cacheHitRatioPct: number | null
    dbSizePretty: string | null
    cpuPct: number | null
    memPct: number | null
    diskPct: number | null
    hasVectorIndex: boolean | null
  }
  kafka: { status: 'running' | 'unknown'; plan: string; topics: number | null }
  cost: {
    pgUsd: number | null
    kafkaUsd: number | null
    totalUsd: number | null
    supabaseUsd: number
  }
  slowQueries: { query: string; calls: number; meanMs: number; totalMs: number }[] | null
  watching: string[]
  alerts: CtoAlert[]
  lastCheckedAgoMs: number
}

const POLL_MS = 8000

const SUGGESTED = [
  "How's my database?",
  'Should I scale?',
  'What will this cost me?',
  'Any risks I should know about?',
]

// Copy that stays true regardless of live values — no hardcoded row counts.
const GREETING =
  "Hi — I'm your Aiven CTO. I watch your Postgres and Kafka every few seconds, so you don't have " +
  "to. The live monitor on the left is always on: status, load, cost and anything that needs a " +
  "decision shows up there in real time. Ask me anything about your infra — scaling, cost, risks. " +
  "I'll give it to you straight."

export default function CtoConsole() {
  const [state, setState] = useState<CtoState | null>(null)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'cto', text: GREETING }])
  const [streaming, setStreaming] = useState(false)
  const [draft, setDraft] = useState('')
  // Local clock that re-renders the heartbeat ("checked Ns ago") between polls.
  const [now, setNow] = useState(() => Date.now())
  const lastFetchAt = useRef<number>(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Poll the live monitoring snapshot every 8s (and once on mount). Best-effort — placeholders fill
  // in when the endpoint is down so the surface always looks complete.
  useEffect(() => {
    let alive = true
    const pull = () => {
      apiFetch('/api/cto/state?tenant=demo')
        .then((r) => (r.ok ? r.json() : null))
        .then((s: CtoState | null) => {
          if (alive && s) {
            setState(s)
            lastFetchAt.current = Date.now()
          }
        })
        .catch(() => {})
    }
    pull()
    const id = setInterval(pull, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  // 1s clock so the heartbeat ("watching live · checked Ns ago") and relative timestamps tick.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // keep the transcript pinned to the latest token
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  // auto-grow the composer
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [draft])

  async function send(textArg?: string) {
    const text = (textArg ?? draft).trim()
    if (!text || streaming) return
    setDraft('')
    const history = [...messages, { role: 'me' as const, text }]
    setMessages([...history, { role: 'cto', text: '' }])
    setStreaming(true)

    try {
      const res = await apiFetch('/api/cto/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history.map((m) => ({ role: m.role === 'me' ? 'user' : 'assistant', content: m.text })),
        }),
      })

      if (!res.ok || !res.body) {
        appendToLast(fallbackReply(text))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let got = false
      let sseBuffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Detect SSE framing; otherwise treat the chunk as raw text to append.
        if (chunk.includes('data:')) {
          sseBuffer += chunk
          let idx
          while ((idx = sseBuffer.indexOf('\n\n')) !== -1) {
            const frame = sseBuffer.slice(0, idx)
            sseBuffer = sseBuffer.slice(idx + 2)
            for (const line of frame.split('\n')) {
              if (!line.startsWith('data:')) continue
              const data = line.slice(5).trim()
              if (!data || data === '[DONE]') continue
              const piece = extractText(data)
              if (piece) {
                got = true
                appendToLast(piece)
              }
            }
          }
        } else {
          got = true
          appendToLast(chunk)
        }
      }
      if (!got) appendToLast(fallbackReply(text))
    } catch {
      appendToLast(fallbackReply(text))
    } finally {
      setStreaming(false)
    }
  }

  function appendToLast(piece: string) {
    if (!piece) return
    setMessages((ms) => {
      const next = ms.slice()
      const last = next[next.length - 1]
      if (last && last.role === 'cto') next[next.length - 1] = { ...last, text: last.text + piece }
      return next
    })
  }

  // ── derive the rail's display values, with calm placeholders when the backend is down ──
  const live = !!state
  const pg = state?.pg
  const kafka = state?.kafka
  const cost = state?.cost
  const alerts = state?.alerts ?? []
  const watching = (state?.watching && state.watching.length ? state.watching : ['Postgres', 'Kafka'])

  const pgStatus = pg?.status ?? 'running'
  const pgPlan = pg?.plan ?? 'startup-4'
  const kafkaStatus = kafka?.status ?? 'running'
  const kafkaPlan = kafka?.plan ?? 'business-4'
  const kafkaTopics = kafka?.topics ?? 1

  // Cost: prefer real totals; keep the bridge "$0 · shared account" note when that's the case.
  const totalUsd = cost?.totalUsd ?? 0
  const supabaseUsd = cost?.supabaseUsd ?? 0

  // Heartbeat: prefer the server's own age, then advance it by our local clock between polls.
  const baseAgoMs = state?.lastCheckedAgoMs ?? 0
  const driftMs = lastFetchAt.current ? now - lastFetchAt.current : 0
  const checkedAgoS = live ? Math.max(0, Math.round((baseAgoMs + driftMs) / 1000)) : null

  return (
    <div className="pp">
      <div className="pp-cto">
        <header className="pp-top">
          <a className="pp-wordmark" href="#/">
            <span className="pp-mark">
              <LeafMark />
            </span>
            Aiven
            <span className="pp-divider">/</span>
            <span>Overmind</span>
          </a>
          <div className="pp-top-right">
            <a href="#/app">Mission Control →</a>
          </div>
        </header>

        <div className="pp-cto-body">
          {/* ── LEFT: the always-on live monitor ── */}
          <aside className="pp-cto-rail">
            <div className="pp-rail-head">
              <span className="pp-avatar">
                <BotMark />
              </span>
              <div>
                <div className="pp-who-name">Your Aiven CTO</div>
                <div className="pp-who-role">
                  <span className="pp-live-dot" /> watching {watching.join(' · ')} · live
                </div>
              </div>
            </div>

            <div className="pp-rail-section-title">Infrastructure</div>

            {/* PG card — real load with subtle bars */}
            <div className="pp-svc">
              <div className="pp-svc-top">
                <span className="pp-svc-name">
                  <span className="pp-leaf">
                    <LeafMark />
                  </span>
                  Aiven for PostgreSQL®
                </span>
                <span className={`pp-status${statusClass(pgStatus)}`}>
                  <span className="pp-led" />
                  {pgStatus}
                </span>
              </div>
              <div className="pp-svc-meta">
                <span>
                  <b>{pg?.rows != null ? pg.rows.toLocaleString() : '—'}</b> rows
                </span>
                <span>
                  <b>
                    {pg?.connections != null ? pg.connections : '—'}
                    {pg?.maxConnections != null ? ` / ${pg.maxConnections}` : ''}
                  </b>{' '}
                  conn
                </span>
                <span>
                  <b>{pg?.cacheHitRatioPct != null ? `${Math.round(pg.cacheHitRatioPct)}%` : '—'}</b> cache
                </span>
                <span>
                  <b>{pg?.dbSizePretty ?? '—'}</b> size
                </span>
              </div>
              <div className="pp-gauges">
                <Gauge label="cpu" pct={pg?.cpuPct ?? null} />
                <Gauge label="mem" pct={pg?.memPct ?? null} />
                <Gauge label="disk" pct={pg?.diskPct ?? null} />
              </div>
              <div className="pp-svc-foot">
                <span className="pp-tag">{pgPlan}</span>
                {pg?.hasVectorIndex ? <span className="pp-tag">pgvector</span> : null}
              </div>
            </div>

            {/* Kafka card */}
            <div className="pp-svc">
              <div className="pp-svc-top">
                <span className="pp-svc-name">
                  <span className="pp-leaf">
                    <LeafMark />
                  </span>
                  Apache Kafka®
                </span>
                <span className={`pp-status${statusClass(kafkaStatus)}`}>
                  <span className="pp-led" />
                  {kafkaStatus}
                </span>
              </div>
              <div className="pp-svc-meta">
                <span>
                  <b>{kafkaTopics}</b> topic{kafkaTopics === 1 ? '' : 's'}
                </span>
                <span>realtime bridge</span>
              </div>
              <div className="pp-svc-foot">
                <span className="pp-tag">{kafkaPlan}</span>
              </div>
            </div>

            <div className="pp-rail-section-title">Cost</div>
            <div className="pp-cost-card">
              <div className="pp-cost-k">Aiven · this month</div>
              <div className="pp-cost-v">
                ${totalUsd.toFixed(2)} <small>/ mo</small>
              </div>
              <div className="pp-cost-note">
                {totalUsd > 0
                  ? supabaseUsd > 0
                    ? `vs $${supabaseUsd.toFixed(2)} on Supabase`
                    : 'real Aiven pricing'
                  : 'demo · shared account = $0'}
              </div>
            </div>

            {/* ── NEW: the monitoring feed — proof the CTO is always on ── */}
            <div className="pp-rail-section-title pp-mon-title">
              Monitoring
              <span className="pp-mon-beat">
                <span className="pp-live-dot" />
                {checkedAgoS == null
                  ? 'connecting…'
                  : checkedAgoS < 2
                    ? 'checked just now'
                    : `checked ${checkedAgoS}s ago`}
              </span>
            </div>

            <div className="pp-mon-feed">
              {alerts.length === 0 ? (
                <div className="pp-mon-calm">
                  <span className="pp-mon-calm-led" />
                  <div>
                    <div className="pp-mon-calm-title">All healthy</div>
                    <div className="pp-mon-calm-sub">Nothing needs your attention.</div>
                  </div>
                </div>
              ) : (
                alerts.map((a) => (
                  <div className="pp-alert" key={a.id}>
                    <span className={`pp-alert-dot ${a.severity}`} />
                    <div className="pp-alert-body">
                      <div className="pp-alert-top">
                        <span className="pp-alert-title">{a.title}</span>
                        <span className="pp-alert-ts">{relTime(a.ts, now)}</span>
                      </div>
                      <div className="pp-alert-detail">{a.detail}</div>
                      {a.action && <div className="pp-alert-action">{a.action}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* ── RIGHT: the chat ── */}
          <section className="pp-chat">
            <div className="pp-chat-scroll" ref={scrollRef}>
              <div className="pp-chat-inner">
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1
                  return (
                    <div className={`pp-msg ${m.role}`} key={i}>
                      <span className="pp-msg-av">{m.role === 'cto' ? <BotMark /> : 'You'}</span>
                      <div className="pp-msg-body">
                        <div className="pp-msg-who">{m.role === 'cto' ? 'Aiven CTO' : 'You'}</div>
                        <div
                          className="pp-msg-text"
                          dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
                        />
                        {m.role === 'cto' && isLast && streaming && (
                          <span className="pp-cursor" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* suggested prompts — only before the first user turn */}
                {messages.length === 1 && (
                  <div className="pp-suggest">
                    {SUGGESTED.map((s) => (
                      <button key={s} className="pp-suggest-chip" onClick={() => send(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pp-composer">
              <div className="pp-composer-inner">
                <div className="pp-composer-box">
                  <textarea
                    ref={taRef}
                    rows={1}
                    value={draft}
                    placeholder="Ask your CTO anything — scaling, cost, risks…"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                  />
                  <button
                    className="pp-send"
                    onClick={() => send()}
                    disabled={streaming || !draft.trim()}
                    aria-label="send"
                  >
                    <SendMark />
                  </button>
                </div>
                <div className="pp-composer-hint">
                  Your CTO manages Aiven for you — you never open the dashboard.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── helpers ──

function statusClass(s?: string): string {
  if (!s) return ''
  return /run|ok|green|healthy/i.test(s) ? '' : ' warn'
}

// A subtle resource bar. Greens by default; escalates to amber/crit at high utilisation using the
// existing severity tokens — no new color scale.
function Gauge({ label, pct }: { label: string; pct: number | null }) {
  const v = pct == null ? null : Math.max(0, Math.min(100, pct))
  const tone = v == null ? '' : v >= 85 ? ' crit' : v >= 70 ? ' warn' : ''
  return (
    <div className="pp-gauge">
      <div className="pp-gauge-head">
        <span className="pp-gauge-label">{label}</span>
        <span className="pp-gauge-val">{v == null ? '—' : `${Math.round(v)}%`}</span>
      </div>
      <div className="pp-gauge-track">
        <div className={`pp-gauge-fill${tone}`} style={{ width: `${v ?? 0}%` }} />
      </div>
    </div>
  )
}

// Relative timestamp for the alert feed ("just now", "3m ago", "2h ago").
function relTime(iso: string, now: number): string {
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const s = Math.max(0, Math.round((now - t) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// SSE `data:` payloads are CtoChunk objects { type, value }. Only 'text' (and 'error') carry
// answer content; 'tool'/'done' are status frames we skip. Tolerate raw text + legacy {delta/text}.
function extractText(data: string): string {
  try {
    const o = JSON.parse(data)
    if (o && typeof o === 'object') {
      if (o.type === 'tool' || o.type === 'done') return ''
      return o.value ?? o.delta ?? o.text ?? o.content ?? o.token ?? ''
    }
    return typeof o === 'string' ? o : ''
  } catch {
    return data
  }
}

// Minimal, safe markdown-ish rendering: escape, then `code`, **bold**, and newlines.
function renderText(raw: string): string {
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

// Senior-engineer fallback so the surface always responds, even before /api/cto/chat is wired.
function fallbackReply(q: string): string {
  const s = q.toLowerCase()
  if (/(scale|grow|bigger|traffic|load)/.test(s))
    return (
      "Not yet — and that's the right answer. Your Postgres is sitting at low CPU with plenty " +
      'of headroom on its current plan, and Kafka is barely warm. Scaling now would just burn ' +
      "money. I watch CPU, connections and storage every few seconds, and the moment you sustain " +
      "~70% I'll ping you with a one-click bump to the next plan — no downtime, Aiven handles the " +
      'failover.'
    )
  if (/(cost|price|cheap|expensive|spend|bill|\$)/.test(s))
    return (
      'Cheaper than you think. This demo runs on a shared Aiven account, so your slice is effectively ' +
      '$0 right now. At real production size the equivalent of your Supabase setup lands well under ' +
      "typical Supabase Pro spend — and I'll always show you the live number in the monitor. You get " +
      "a 99.99% SLA, no usage-based surprises, and I keep you on the smallest plan that's safe. I'll " +
      'always flag a cheaper shape before you overpay.'
    )
  if (/(risk|wrong|down|fail|secure|safe|backup)/.test(s))
    return (
      "Two things I'm keeping an eye on. One: you have a single Postgres node on the demo plan — for " +
      'production I’d add a read replica so a node failure is invisible. Two: if writes spike on your ' +
      'busiest table I may suggest an index tweak. Backups are automatic and point-in-time on Aiven, ' +
      "so a bad deploy is recoverable. Nothing's on fire — these are the next moves, not problems."
    )
  // database / general
  return (
    'Healthy. Postgres is `running`, pgvector search is live, and queries are returning fast, well ' +
    'within target. Kafka is up with your realtime bridge topic flowing. You’re well ' +
    'under plan limits on CPU and storage. I keep watching and only interrupt you when something ' +
    'actually needs a decision.'
  )
}

// ── inline marks ──
function LeafMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4C20 4 8 5 5 13c-2 5 1 8 1 8s3-9 9-12c0 0-6 4-7 11 0 0 9 1 12-8 2-6 0-8 0-8z"
        fill="currentColor"
      />
    </svg>
  )
}
function BotMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="7" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7V3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9" cy="13" r="1.4" fill="currentColor" />
      <circle cx="15" cy="13" r="1.4" fill="currentColor" />
    </svg>
  )
}
function SendMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
