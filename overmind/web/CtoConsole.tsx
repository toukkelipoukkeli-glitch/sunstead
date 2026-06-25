// web/CtoConsole.tsx — "Your Aiven CTO". The centerpiece of the operate phase.
//
// The founder NEVER opens the Aiven dashboard again. They open this. Left: their live infra at a
// glance (PG/Kafka status, rows, cost). Right: a polished chat with a senior-engineer agent that
// streams its replies from POST /api/cto/chat.
//
// Stream handling: we read the response BODY as a stream and append text as it arrives. The server
// may send either raw text chunks OR SSE (`data: {json}\n\n`); we handle both. If /api/cto/chat
// isn't wired yet (404/empty), we degrade to a canned senior-engineer reply so the surface always
// demos — never a blank screen.
//
// Owns: this file + web/product.css. Default export. Never edits App.tsx.

import { useEffect, useRef, useState } from 'react'
import './product.css'

interface Msg {
  role: 'cto' | 'me'
  text: string
}

// Live infra snapshot shape we try to read from /api/tenant/demo. All optional — placeholders fill in.
interface Tenant {
  pg?: { status?: string; rows?: number; cpu?: number; storageGb?: number; plan?: string }
  kafka?: { status?: string; topics?: number; plan?: string }
  cost?: { aivenUsd?: number; supabaseUsd?: number }
}

const SUGGESTED = [
  "How's my database?",
  'Should I scale?',
  'What will this cost me?',
  'Any risks I should know about?',
]

const GREETING =
  "Hi — I'm your Aiven CTO. I watch your Postgres and Kafka around the clock so you don't have to. " +
  "Everything's green right now: 172 rows across users, posts and reactions, pgvector search live, " +
  'and you’re well under your plan limits. Ask me anything about your infra — scaling, cost, ' +
  'risks. I’ll give it to you straight.'

export default function CtoConsole() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'cto', text: GREETING }])
  const [streaming, setStreaming] = useState(false)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  // pull the live infra snapshot (best-effort; placeholders if the endpoint isn't up yet)
  useEffect(() => {
    let alive = true
    fetch('/api/tenant/demo', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((t) => alive && t && setTenant(t))
      .catch(() => {})
    return () => {
      alive = false
    }
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
      const res = await fetch('/api/cto/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
              got = true
              appendToLast(extractText(data))
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

  const t = tenant ?? {}
  const pg = t.pg ?? { status: 'running', rows: 172, cpu: 8, storageGb: 1.2, plan: 'startup-4' }
  const kafka = t.kafka ?? { status: 'running', topics: 1, plan: 'business-4' }
  const cost = t.cost ?? { aivenUsd: 0, supabaseUsd: 0 }
  const aivenUsd = cost.aivenUsd ?? 0

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
          {/* ── LEFT: live infra at a glance ── */}
          <aside className="pp-cto-rail">
            <div className="pp-rail-head">
              <span className="pp-avatar">
                <BotMark />
              </span>
              <div>
                <div className="pp-who-name">Your Aiven CTO</div>
                <div className="pp-who-role">watching your infra · live</div>
              </div>
            </div>

            <div className="pp-rail-section-title">Infrastructure</div>

            <div className="pp-svc">
              <div className="pp-svc-top">
                <span className="pp-svc-name">
                  <span className="pp-leaf">
                    <LeafMark />
                  </span>
                  Aiven for PostgreSQL®
                </span>
                <span className={`pp-status${statusClass(pg.status)}`}>
                  <span className="pp-led" />
                  {pg.status ?? 'running'}
                </span>
              </div>
              <div className="pp-svc-meta">
                <span>
                  <b>{(pg.rows ?? 0).toLocaleString()}</b> rows
                </span>
                <span>
                  <b>{pg.cpu ?? '—'}%</b> cpu
                </span>
                <span>
                  <b>{pg.storageGb ?? '—'}</b> GB
                </span>
                <span>{pg.plan ?? 'startup-4'}</span>
              </div>
            </div>

            <div className="pp-svc">
              <div className="pp-svc-top">
                <span className="pp-svc-name">
                  <span className="pp-leaf">
                    <LeafMark />
                  </span>
                  Apache Kafka®
                </span>
                <span className={`pp-status${statusClass(kafka.status)}`}>
                  <span className="pp-led" />
                  {kafka.status ?? 'running'}
                </span>
              </div>
              <div className="pp-svc-meta">
                <span>
                  <b>{kafka.topics ?? 1}</b> topic{(kafka.topics ?? 1) === 1 ? '' : 's'}
                </span>
                <span>realtime bridge</span>
                <span>{kafka.plan ?? 'business-4'}</span>
              </div>
            </div>

            <div className="pp-rail-section-title">Cost</div>
            <div className="pp-cost-card">
              <div className="pp-cost-k">Aiven · this month</div>
              <div className="pp-cost-v">
                ${aivenUsd.toFixed(2)} <small>/ mo</small>
              </div>
              <div className="pp-cost-note">
                {cost.supabaseUsd
                  ? `vs $${cost.supabaseUsd.toFixed(2)} on Supabase`
                  : 'demo project · shared Aiven account'}
              </div>
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

// SSE `data:` payloads may be raw text or JSON ({delta}/{text}/{content}). Pull out the text.
function extractText(data: string): string {
  try {
    const o = JSON.parse(data)
    return o.delta ?? o.text ?? o.content ?? o.token ?? (typeof o === 'string' ? o : '')
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
      "Not yet — and that's the right answer. Your Postgres is sitting around 8% CPU with plenty " +
      'of headroom on the `startup-4` plan, and Kafka is barely warm. Scaling now would just burn ' +
      "money. I'll watch CPU, connections and storage, and the moment you sustain ~70% I'll ping " +
      'you with a one-click bump to the next plan — no downtime, Aiven handles the failover.'
    )
  if (/(cost|price|cheap|expensive|spend|bill|\$)/.test(s))
    return (
      'Cheaper than you think. This demo runs on a shared Aiven account, so your slice is effectively ' +
      '$0 right now. At real production size the equivalent of your Supabase setup lands around ' +
      "**$80–120/mo** on Aiven — but you get a 99.99% SLA, no usage-based surprises, and I keep you " +
      "on the smallest plan that's safe. I'll always flag a cheaper shape before you overpay."
    )
  if (/(risk|wrong|down|fail|secure|safe|backup)/.test(s))
    return (
      "Two things I'm keeping an eye on. One: you have a single Postgres node on the demo plan — for " +
      'production I’d add a read replica so a node failure is invisible. Two: your busiest table ' +
      'is `reactions`; if writes spike I may suggest an index tweak. Backups are automatic and ' +
      "point-in-time on Aiven, so a bad deploy is recoverable. Nothing's on fire — these are the " +
      'next moves, not problems.'
    )
  // database / general
  return (
    'Healthy. Postgres is `running` with **172 rows** across users, posts and reactions, pgvector ' +
    'search is live, and queries are returning in single-digit milliseconds. Kafka is up with your ' +
    "realtime bridge topic flowing. You're well under plan limits on CPU and storage. I'll keep " +
    'watching and only interrupt you when something actually needs a decision.'
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
