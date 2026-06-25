// web/components/WeeklyBriefing.tsx — the "Weekly briefing" card in the CTO rail.
//
// One tap on "▶ This week's episode" fetches a ~90s spoken script from the backend
// (GET /api/cto/briefing?tenant=demo → { script, ts, stats }), shows the transcript (collapsible),
// and plays the audio by handing the script to the shared speak() the console already uses for
// chat replies (POST /api/cto/speak). Everything degrades gracefully:
//   • briefing endpoint missing/empty → an honest "couldn't load this week's episode" line, retryable
//   • audio (speak) unavailable        → transcript still shows; we just don't play sound
// All network goes through apiFetch (runtime ?api= base). No hardcoded URLs.

import { useState } from 'react'
import { apiFetch } from '../config.ts'

interface BriefingStats {
  [k: string]: string | number | null | undefined
}
interface Briefing {
  script: string
  ts?: string
  stats?: BriefingStats
}

interface Props {
  voiceOn: boolean
  speaking: boolean
  // Shared with the chat: POSTs text → /api/cto/speak and plays it; silent if audio is unavailable.
  onSpeak: (text: string) => Promise<void>
  onStop: () => void
}

export function WeeklyBriefing({ voiceOn, speaking, onSpeak, onStop }: Props) {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false) // transcript collapsible

  async function play() {
    // If we already have the script, just (re)play / stop the audio without refetching.
    if (briefing) {
      if (speaking) {
        onStop()
      } else if (voiceOn) {
        void onSpeak(briefing.script)
      }
      setOpen(true)
      return
    }
    setLoading(true)
    setFailed(false)
    try {
      const res = await apiFetch('/api/cto/briefing?tenant=demo')
      if (!res.ok) throw new Error('no briefing')
      const data = (await res.json()) as Briefing
      if (!data?.script?.trim()) throw new Error('empty script')
      setBriefing(data)
      setOpen(true)
      // Play it if voice is on; degrades to transcript-only if speak() can't reach audio.
      if (voiceOn) void onSpeak(data.script)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="pp-rail-section-title">Weekly briefing</div>
      <div className="pp-brief-card">
        <div className="pp-brief-top">
          <span className="pp-brief-emoji" aria-hidden="true">📻</span>
          <div className="pp-brief-headings">
            <div className="pp-brief-title">This week with your CTO</div>
            <div className="pp-brief-sub">A ~90-second spoken rundown of your infra.</div>
          </div>
        </div>

        <button className="pp-brief-play" onClick={play} disabled={loading}>
          {loading ? (
            <>
              <span className="pp-spin pp-spin-dark pp-spin-sm" /> Loading episode…
            </>
          ) : briefing && speaking ? (
            <>■ Stop episode</>
          ) : briefing ? (
            <>▶ Replay this week's episode</>
          ) : (
            <>▶ This week's episode</>
          )}
        </button>

        {failed && (
          <div className="pp-brief-fail">
            Couldn't load this week's episode right now.{' '}
            <button className="pp-brief-retry" onClick={play}>
              Try again
            </button>
          </div>
        )}

        {briefing && (
          <>
            <div className="pp-brief-meta">
              {briefing.ts && <span className="pp-brief-ts">{fmtTs(briefing.ts)}</span>}
              <button className="pp-brief-toggle" onClick={() => setOpen((o) => !o)}>
                {open ? 'Hide transcript' : 'Show transcript'}
              </button>
            </div>
            {open && <div className="pp-brief-script">{briefing.script}</div>}
            <div className="pp-brief-caption">Grounded in your live Aiven metrics.</div>
          </>
        )}
      </div>
    </>
  )
}

function fmtTs(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
