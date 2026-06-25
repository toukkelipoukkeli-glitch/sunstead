import { useCallback, useRef, useState } from "react";
import type { AdviseEvent, RunState } from "./types";
import { emptyRun } from "./types";
import { streamAdvise } from "./api";
import { runMock } from "./mock";

// Folds the AdviseEvent stream into one RunState object and exposes start/stop.
// `mock` switches the source between the real SSE endpoint and the scripted
// replay — identical event shape, so the reducer below doesn't care which.

export function applyEvent(prev: RunState, ev: AdviseEvent): RunState {
  const ts = Date.now();
  switch (ev.type) {
    case "thought":
      return { ...prev, timeline: [...prev.timeline, { kind: "thought", text: ev.text, ts }] };
    case "tool_call":
      return {
        ...prev,
        timeline: [...prev.timeline, { kind: "tool_call", tool: ev.tool, args: ev.args, ts }],
      };
    case "tool_result":
      return {
        ...prev,
        timeline: [...prev.timeline, { kind: "tool_result", tool: ev.tool, summary: ev.summary, ts }],
      };
    case "context":
      return { ...prev, workload: ev.workload };
    case "candidates":
      return { ...prev, candidates: ev.candidates };
    case "pricing":
      // merge so multiple pricing events (pg + kafka) accumulate
      return { ...prev, pricing: dedupeRows([...(prev.pricing ?? []), ...ev.rows]) };
    case "recommendation":
      return {
        ...prev,
        recommendation: { candidateId: ev.candidateId, why: ev.why, monthly: ev.monthly },
      };
    case "provision":
      return { ...prev, provision: ev.status };
    case "benchmark":
      return { ...prev, benchmark: ev.result };
    case "done":
      return { ...prev, status: "done" };
    case "error":
      return { ...prev, status: "error", error: ev.message };
    default:
      return prev;
  }
}

function dedupeRows<T extends { serviceType: string; plan: string; cloud: string }>(rows: T[]): T[] {
  const seen = new Map<string, T>();
  for (const r of rows) seen.set(`${r.serviceType}|${r.plan}|${r.cloud}`, r);
  return [...seen.values()];
}

export function useRun(mock: boolean) {
  const [run, setRun] = useState<RunState>(emptyRun());
  const handle = useRef<{ cancel: () => void } | null>(null);

  const start = useCallback(
    (prompt: string) => {
      handle.current?.cancel();
      setRun({ ...emptyRun(prompt), status: "streaming" });

      const onEvent = (ev: AdviseEvent) => setRun((prev) => applyEvent(prev, ev));
      const onClose = () =>
        setRun((prev) => (prev.status === "streaming" ? { ...prev, status: "done" } : prev));

      handle.current = mock ? runMock(onEvent, onClose) : streamAdvise(prompt, onEvent, onClose);
    },
    [mock],
  );

  const stop = useCallback(() => {
    handle.current?.cancel();
    handle.current = null;
    setRun((prev) => (prev.status === "streaming" ? { ...prev, status: "done" } : prev));
  }, []);

  const reset = useCallback(() => {
    handle.current?.cancel();
    handle.current = null;
    setRun(emptyRun());
  }, []);

  // Direct setters for the provision/benchmark buttons (post-run interactions).
  const patch = useCallback((p: Partial<RunState>) => setRun((prev) => ({ ...prev, ...p })), []);

  return { run, start, stop, reset, patch };
}
