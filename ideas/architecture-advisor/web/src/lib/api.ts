import type {
  AdviseEvent,
  BenchResult,
  PriceRow,
  ServiceStatus,
} from "./types";

// ── SSE client for POST /api/advise ───────────────────────────────────────
//
// EventSource only does GET, and /api/advise is a POST with a JSON body, so we
// stream the response body with fetch + a ReadableStream reader and parse the
// `data:` lines ourselves. The backend emits one JSON-encoded AdviseEvent per
// SSE `data:` frame (frames separated by a blank line, per the spec).

export type AdviseHandle = {
  /** Abort the in-flight stream. Safe to call after completion (no-op). */
  cancel: () => void;
};

/**
 * Open POST /api/advise and invoke `onEvent` for each parsed AdviseEvent.
 * Resolves the returned handle synchronously so callers can cancel; the stream
 * runs in the background. Errors surface as an `{type:'error'}` event then a
 * final close — we never throw out of the loop so the UI stays alive.
 */
export function streamAdvise(
  prompt: string,
  onEvent: (ev: AdviseEvent) => void,
  onClose?: () => void,
): AdviseHandle {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch("/api/advise", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        onEvent({
          type: "error",
          message: `Backend returned ${res.status} ${res.statusText}. Is the server running? Flip on Mock mode for a backend-free demo.`,
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // SSE frames are separated by a blank line. Each frame may have multiple
      // `data:` lines that concatenate into one payload.
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const ev = parseFrame(frame);
          if (ev) onEvent(ev);
        }
      }
      // flush any trailing frame without a terminating blank line
      const tail = parseFrame(buffer);
      if (tail) onEvent(tail);
    } catch (err: any) {
      if (controller.signal.aborted) return; // user-initiated cancel
      onEvent({
        type: "error",
        message:
          err?.message ??
          "Network error talking to /api/advise. Try Mock mode.",
      });
    } finally {
      onClose?.();
    }
  })();

  return { cancel: () => controller.abort() };
}

function parseFrame(frame: string): AdviseEvent | null {
  const dataLines = frame
    .split("\n")
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trimStart());
  if (dataLines.length === 0) return null;
  const payload = dataLines.join("\n").trim();
  if (!payload) return null;
  try {
    return JSON.parse(payload) as AdviseEvent;
  } catch {
    return null; // ignore comments / keep-alive pings
  }
}

// ── REST helpers ──────────────────────────────────────────────────────────

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export const provision = (input: {
  name: string;
  serviceType: string;
  plan: string;
  cloud: string;
}) => postJson<ServiceStatus>("/api/provision", input);

export const runBenchmark = (name: string) =>
  postJson<BenchResult>("/api/benchmark", { name });

export async function getPricing(
  serviceType: string,
  euOnly = false,
): Promise<PriceRow[]> {
  const q = new URLSearchParams({ serviceType, euOnly: String(euOnly) });
  const res = await fetch(`/api/pricing?${q}`);
  if (!res.ok) throw new Error(`pricing ${res.status}`);
  return res.json();
}

export async function health(): Promise<boolean> {
  try {
    const res = await fetch("/api/health", {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
