// Hivemind — fake teammates for demos.
// Emits believable ActivityEvents for 2-3 personas on a timer so the dashboard
// is alive on a single laptop. CORE module: zero external deps.
import { randomUUID } from "node:crypto";
import type { Config } from "./config.ts";
import type { ActivityEvent, EventKind } from "./types.ts";

export interface Simulator {
  start(): void;
  stop(): void;
}

/** A scripted line a persona can emit. `tool` is required only for tool_use/tool_result. */
interface ScriptLine {
  kind: EventKind;
  text: string;
  tool?: string;
}

/** One fake teammate working on one session. */
interface Persona {
  actor: string;
  project: string;
  sessionId: string;
  cwd: string;
  gitBranch: string;
  model: string;
  title: string;
  /** Rotating sequence of plausible events; cycles forever. */
  script: ScriptLine[];
}

const MIN_DELAY_MS = 1_500;
const MAX_DELAY_MS = 3_500;

/**
 * Build the personas. Each gets a fresh session id per simulator run so repeated
 * starts don't collide. Scripts are ordered to read like a real Claude Code session:
 * a title, a human prompt, some tool_use + tool_result, an assistant reply, repeat.
 */
function buildPersonas(): Persona[] {
  return [
    {
      actor: "Aino",
      project: "ring-firmware",
      sessionId: `sim-aino-${randomUUID().slice(0, 8)}`,
      cwd: "/Users/aino/dev/ring-firmware",
      gitBranch: "feat/ble-reconnect",
      model: "claude-opus-4-8",
      title: "BLE reconnect backoff",
      script: [
        { kind: "title", text: "BLE reconnect backoff" },
        { kind: "user", text: "The ring drops its BLE connection in low-signal areas and never reconnects. Can you add exponential backoff?" },
        { kind: "tool_use", tool: "Grep", text: "Grep reconnect" },
        { kind: "tool_result", tool: "Grep", text: "↳ result" },
        { kind: "tool_use", tool: "Read", text: "Read src/ble/connection.c" },
        { kind: "tool_result", tool: "Read", text: "↳ result" },
        { kind: "assistant", text: "Found it — the reconnect loop retries every 500ms forever. I'll add capped exponential backoff (500ms → 30s)." },
        { kind: "tool_use", tool: "Edit", text: "Edit src/ble/connection.c" },
        { kind: "tool_use", tool: "Bash", text: "Build firmware for nRF52840" },
        { kind: "tool_result", tool: "Bash", text: "↳ result" },
        { kind: "assistant", text: "Build is clean. Backoff now doubles each attempt and caps at 30s; reset on a successful link." },
        { kind: "user", text: "Add a unit test that simulates 5 dropped connections in a row." },
        { kind: "tool_use", tool: "Write", text: "Write test/ble/reconnect_test.c" },
        { kind: "tool_use", tool: "Bash", text: "Run the BLE reconnect test suite" },
        { kind: "tool_result", tool: "Bash", text: "↳ result" },
        { kind: "assistant", text: "All 5 cases pass. The backoff sequence is 0.5s, 1s, 2s, 4s, 8s as expected." },
      ],
    },
    {
      actor: "Mikael",
      project: "sleep-api",
      sessionId: `sim-mikael-${randomUUID().slice(0, 8)}`,
      cwd: "/Users/mikael/dev/sleep-api",
      gitBranch: "fix/timezone-drift",
      model: "claude-sonnet-4-5",
      title: "Sleep stage timezone drift",
      script: [
        { kind: "title", text: "Sleep stage timezone drift" },
        { kind: "user", text: "Users travelling across timezones see sleep stages shifted by a few hours. Where does the API stamp the timestamps?" },
        { kind: "tool_use", tool: "Grep", text: "Grep toLocalTime" },
        { kind: "tool_result", tool: "Grep", text: "↳ result" },
        { kind: "tool_use", tool: "Read", text: "Read services/sleep/staging.ts" },
        { kind: "tool_result", tool: "Read", text: "↳ result" },
        { kind: "assistant", text: "The staging service uses the server timezone instead of the ring's recorded offset. That's the drift." },
        { kind: "tool_use", tool: "Edit", text: "Edit services/sleep/staging.ts" },
        { kind: "tool_use", tool: "Bash", text: "npm run test:sleep" },
        { kind: "tool_result", tool: "Bash", text: "↳ result" },
        { kind: "assistant", text: "Fixed — staging now honours the per-recording UTC offset. 42 tests green." },
        { kind: "user", text: "Can you also backfill the offset for records ingested in the last week?" },
        { kind: "tool_use", tool: "Write", text: "Write scripts/backfill_offsets.ts" },
        { kind: "tool_use", tool: "Bash", text: "Dry-run the backfill against staging DB" },
        { kind: "tool_result", tool: "Bash", text: "↳ result" },
        { kind: "assistant", text: "Dry run touched 18,402 rows. Want me to run it for real, or open a PR for review first?" },
      ],
    },
    {
      actor: "Sofia",
      project: "oura-ios",
      sessionId: `sim-sofia-${randomUUID().slice(0, 8)}`,
      cwd: "/Users/sofia/dev/oura-ios",
      gitBranch: "feat/readiness-widget",
      model: "claude-opus-4-8",
      title: "Readiness home-screen widget",
      script: [
        { kind: "title", text: "Readiness home-screen widget" },
        { kind: "user", text: "Build a WidgetKit home-screen widget that shows today's readiness score with a ring graphic." },
        { kind: "tool_use", tool: "Read", text: "Read Sources/Widgets/ReadinessWidget.swift" },
        { kind: "tool_result", tool: "Read", text: "↳ result" },
        { kind: "assistant", text: "There's a stub widget already. I'll wire it to the ReadinessProvider and add a TimelineProvider with hourly refresh." },
        { kind: "tool_use", tool: "Edit", text: "Edit Sources/Widgets/ReadinessWidget.swift" },
        { kind: "tool_use", tool: "Write", text: "Write Sources/Widgets/ReadinessRingView.swift" },
        { kind: "tool_use", tool: "Bash", text: "Build the Widgets target for iOS Simulator" },
        { kind: "tool_result", tool: "Bash", text: "↳ result" },
        { kind: "assistant", text: "Widget builds and renders the ring. The score animates on refresh; I used a trim on a Circle for the arc." },
        { kind: "user", text: "It looks great. Add a small / medium / large layout variant." },
        { kind: "tool_use", tool: "Edit", text: "Edit Sources/Widgets/ReadinessWidget.swift" },
        { kind: "tool_use", tool: "Bash", text: "Snapshot-test all three widget families" },
        { kind: "tool_result", tool: "Bash", text: "↳ result" },
        { kind: "assistant", text: "All three families render. Large shows a 7-day trend strip under the ring." },
      ],
    },
  ];
}

export function createSimulator(config: Config, emit: (e: ActivityEvent) => void): Simulator {
  const personas = buildPersonas();
  // Per-persona cursor into its script, and a monotonically rising "tick" so the
  // choice of which persona speaks next rotates deterministically (no Math.random
  // dependence for selection — varies by an incrementing index + modulo).
  const cursors = new Array<number>(personas.length).fill(0);
  let tick = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  function nextEvent(): ActivityEvent {
    // Round-robin across personas so all teammates stay visibly active.
    const pIdx = tick % personas.length;
    const persona = personas[pIdx];
    const cIdx = cursors[pIdx];
    const line = persona.script[cIdx];
    cursors[pIdx] = (cIdx + 1) % persona.script.length;
    tick++;

    const e: ActivityEvent = {
      id: randomUUID(),
      ts: Date.now(),
      actor: persona.actor,
      sessionId: persona.sessionId,
      project: persona.project,
      cwd: persona.cwd,
      gitBranch: persona.gitBranch,
      kind: line.kind,
      text: line.text,
      model: line.kind === "assistant" ? persona.model : undefined,
    };
    if (line.tool) e.tool = line.tool;
    return e;
  }

  function schedule(): void {
    if (!running) return;
    // Vary the cadence between ~1.5s and ~3.5s. Math.random is fine here per the contract.
    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
    timer = setTimeout(() => {
      if (!running) return;
      try {
        emit(nextEvent());
      } catch {
        // Never let a downstream emit error kill the simulator loop.
      }
      schedule();
    }, delay);
    // Don't keep the process alive solely for the simulator.
    if (typeof timer.unref === "function") timer.unref();
  }

  return {
    start() {
      if (running) return;
      running = true;
      // Emit one event promptly so the dashboard isn't empty on connect, then
      // settle into the randomized cadence.
      timer = setTimeout(() => {
        if (!running) return;
        try {
          emit(nextEvent());
        } catch {
          /* ignore */
        }
        schedule();
      }, 300);
      if (typeof timer.unref === "function") timer.unref();
    },
    stop() {
      running = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
