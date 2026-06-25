// server/voice.ts — server-side ElevenLabs text-to-speech for the Voice CTO.
//
// The CTO doesn't just write — it SPEAKS. This module turns a script into spoken audio (MPEG)
// via ElevenLabs TTS. It runs ENTIRELY server-side: the ELEVENLABS_API_KEY (loaded from
// .env.local by env.ts) is read here and sent only to api.elevenlabs.io over the xi-api-key
// header. It is NEVER returned to or exposed to the client — the browser only ever receives the
// resulting audio bytes from our own /api/cto/speak route.
//
// Defensive by design: if the key is missing we throw a typed VoiceUnavailableError so the route
// can answer 503 JSON instead of crashing. Text is capped so a runaway script can't run up cost
// or latency.

// ───────────────────────── config ─────────────────────────

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1/text-to-speech'
// "Sarah" — a calm, reassuring voice that fits a senior CTO delivering a briefing.
export const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'EXAVITQu4vr4xnSDxMaL'
// Low-latency turbo model — good enough quality, fast first byte for an interactive console.
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_turbo_v2_5'
// Hard cap on input so a malformed/huge script can't blow up cost or response time. ElevenLabs
// turbo handles a couple thousand chars comfortably; ~90s of speech is well under this.
const MAX_CHARS = 2500
// Network guard so a hung upstream never wedges the request indefinitely.
const TIMEOUT_MS = Number(process.env.ELEVENLABS_TIMEOUT_MS ?? 30000)

// ───────────────────────── typed errors ─────────────────────────

/** Raised when the ElevenLabs key is absent — the route maps this to 503 JSON, never a crash. */
export class VoiceUnavailableError extends Error {
  readonly code = 'voice_unavailable'
  constructor(message = 'ElevenLabs API key is not configured — voice is unavailable.') {
    super(message)
    this.name = 'VoiceUnavailableError'
  }
}

/** Raised when ElevenLabs accepts the request shape but returns a non-2xx (auth, quota, etc.). */
export class VoiceUpstreamError extends Error {
  readonly code = 'voice_upstream_error'
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'VoiceUpstreamError'
    this.status = status
  }
}

export function hasElevenLabs(): boolean {
  return !!process.env.ELEVENLABS_API_KEY
}

// ───────────────────────── public API ─────────────────────────

/**
 * Synthesize `text` to spoken audio via ElevenLabs and return it as a Node Buffer of audio/mpeg.
 *
 * - Key is read here and sent only to ElevenLabs (xi-api-key header). Never returned to the caller.
 * - No key → throws VoiceUnavailableError (typed; the route returns 503 JSON).
 * - Upstream non-2xx → throws VoiceUpstreamError with the status (route returns 502 JSON).
 * - Input is trimmed and capped to ~2500 chars.
 */
export async function speak(text: string, voiceId?: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new VoiceUnavailableError()

  const clean = String(text ?? '').trim().slice(0, MAX_CHARS)
  if (!clean) throw new VoiceUpstreamError(400, 'no text to speak')

  const voice = (voiceId && voiceId.trim()) || DEFAULT_VOICE_ID
  const url = `${ELEVEN_BASE}/${encodeURIComponent(voice)}/stream`

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: clean,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      // Read the body for a useful message, but NEVER include our key (it isn't in the body anyway).
      let detail = ''
      try {
        detail = (await res.text()).slice(0, 500)
      } catch {
        /* ignore — status alone is enough */
      }
      throw new VoiceUpstreamError(res.status, `ElevenLabs TTS failed (${res.status})${detail ? `: ${detail}` : ''}`)
    }

    const arrayBuf = await res.arrayBuffer()
    return Buffer.from(arrayBuf)
  } catch (e: any) {
    if (e instanceof VoiceUnavailableError || e instanceof VoiceUpstreamError) throw e
    if (e?.name === 'AbortError') throw new VoiceUpstreamError(504, 'ElevenLabs TTS timed out')
    throw new VoiceUpstreamError(502, `ElevenLabs TTS request failed: ${e?.message ?? String(e)}`)
  } finally {
    clearTimeout(t)
  }
}
