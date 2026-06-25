// Hivemind — transcript watcher. Tails *.jsonl under config.projectsDir and emits parsed events.
//
// Strategy:
//  - Recursively discover *.jsonl files under projectsDir.
//  - Track a byte offset per file (where we've read up to).
//  - On startup, BACKFILL: read only the LAST ~64KB of each file, parse the complete lines in that
//    window, and replay the last `config.backfill` of them. Backfill events keep their parsed `ts`.
//  - Watch with fs.watch(recursive) as a nudge AND a 1s poll comparing stat.size (poll is the
//    source of truth; fs.watch is unreliable for nested files on macOS).
//  - On growth: read [offset, size), decode utf-8, split on "\n", JSON.parse complete lines, buffer
//    a trailing partial line for the next read. Live (post-startup) events are stamped ts = Date.now()
//    so the feed orders by arrival. Parse/JSON errors are swallowed per line.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { Config } from "./config.ts";
import type { ActivityEvent } from "./types.ts";
import { parseRecord, type ParseCtx } from "./parse.ts";

export interface Watcher {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/** Per-file tail state. */
interface FileState {
  offset: number; // bytes read so far
  partial: string; // trailing incomplete line carried to next read
}

const POLL_MS = 1000;
// How far back from EOF we read on startup so we can backfill without loading huge transcripts.
const BACKFILL_WINDOW_BYTES = 64 * 1024;

export function createWatcher(config: Config, onEvent: (e: ActivityEvent) => void): Watcher {
  const ctx: ParseCtx = { actor: config.actor, redactSecrets: config.redactSecrets };
  const files = new Map<string, FileState>();

  let watcher: fs.FSWatcher | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let polling = false; // guard against overlapping async polls
  let started = false;

  /** Recursively list absolute paths of *.jsonl files under projectsDir. */
  async function listJsonlFiles(): Promise<string[]> {
    let entries: string[];
    try {
      entries = await fsp.readdir(config.projectsDir, { recursive: true });
    } catch {
      // projectsDir may not exist yet — that's fine, just nothing to watch.
      return [];
    }
    return entries
      .filter((rel) => rel.endsWith(".jsonl"))
      .map((rel) => path.join(config.projectsDir, rel));
  }

  /** Parse a complete JSON line; emit if it yields an event. `live` stamps ts = Date.now(). */
  function handleLine(line: string, live: boolean): void {
    const trimmed = line.trim();
    if (!trimmed) return;
    let rec: any;
    try {
      rec = JSON.parse(trimmed);
    } catch {
      return; // swallow malformed lines
    }
    let event: ActivityEvent | null;
    try {
      event = parseRecord(rec, ctx);
    } catch {
      return; // a bad record must not crash the tail
    }
    if (!event) return;
    if (live) event.ts = Date.now(); // live tails order by arrival
    onEvent(event);
  }

  /**
   * Startup backfill for one file: read only the last ~64KB, keep only complete lines within that
   * window (drop a leading partial line), replay the last `config.backfill` of them, and set the
   * offset to EOF so the live tail continues from there.
   */
  async function backfillFile(file: string): Promise<void> {
    let size = 0;
    let handle: fsp.FileHandle | null = null;
    try {
      handle = await fsp.open(file, "r");
      const stat = await handle.stat();
      size = stat.size;

      const start = Math.max(0, size - BACKFILL_WINDOW_BYTES);
      const length = size - start;
      let text = "";
      if (length > 0) {
        const buf = Buffer.allocUnsafe(length);
        const { bytesRead } = await handle.read(buf, 0, length, start);
        text = buf.subarray(0, bytesRead).toString("utf8");
        // If we started mid-file, the first segment is almost certainly a partial line — drop it.
        if (start > 0) {
          const nl = text.indexOf("\n");
          text = nl === -1 ? "" : text.slice(nl + 1);
        }
      }

      // Only complete lines. split("\n") leaves a trailing element that's either "" (text ended on a
      // newline) or the incomplete final fragment (no newline yet) — dropping it is correct either way.
      const segments = text.split("\n");
      const complete = segments.slice(0, -1);

      const recent = config.backfill > 0 ? complete.slice(-config.backfill) : [];
      for (const line of recent) {
        handleLine(line, /* live */ false); // backfill keeps parsed ts
      }
    } catch {
      // Unreadable file — skip; the poll loop may pick it up later.
    } finally {
      if (handle) await handle.close().catch(() => {});
    }
    // Continue the live tail from EOF (even if backfill read failed mid-way).
    files.set(file, { offset: size, partial: "" });
  }

  /** Begin tailing a brand-new file (appeared after startup): tail everything from offset 0. */
  function trackNewFile(file: string): void {
    files.set(file, { offset: 0, partial: "" });
  }

  /** Read any bytes appended to a known file since its offset and emit live events. */
  async function readFileGrowth(file: string): Promise<void> {
    const state = files.get(file);
    if (!state) return;

    let stat: fs.Stats;
    try {
      stat = await fsp.stat(file);
    } catch {
      // File vanished (rotated/deleted) — forget it.
      files.delete(file);
      return;
    }

    const size = stat.size;
    if (size === state.offset) return; // unchanged
    if (size < state.offset) {
      // File was truncated/rotated — restart tailing from the beginning.
      state.offset = 0;
      state.partial = "";
    }
    if (size <= state.offset) return;

    let handle: fsp.FileHandle | null = null;
    let text = "";
    try {
      handle = await fsp.open(file, "r");
      const length = size - state.offset;
      const buf = Buffer.allocUnsafe(length);
      const { bytesRead } = await handle.read(buf, 0, length, state.offset);
      text = buf.subarray(0, bytesRead).toString("utf8");
      state.offset += bytesRead;
    } catch {
      return; // transient read error — try again next poll
    } finally {
      if (handle) await handle.close().catch(() => {});
    }

    const combined = state.partial + text;
    const segments = combined.split("\n");
    // Last segment is a partial line unless the chunk ended on a newline — buffer it for next read.
    state.partial = segments.pop() ?? "";
    for (const line of segments) {
      handleLine(line, /* live */ true);
    }
  }

  /** One poll pass: pick up new files, then read growth on all known files. */
  async function poll(): Promise<void> {
    if (polling) return;
    polling = true;
    try {
      const current = await listJsonlFiles();
      for (const file of current) {
        if (!files.has(file)) trackNewFile(file); // new since startup → tail all (no backfill)
      }
      // Read growth sequentially to keep ordering stable and avoid fd storms.
      for (const file of [...files.keys()]) {
        await readFileGrowth(file);
      }
    } catch {
      // Never let a poll throw; we'll retry on the next tick.
    } finally {
      polling = false;
    }
  }

  async function start(): Promise<void> {
    if (started) return;
    started = true;

    // 1) Discover + backfill existing files (sets offsets to EOF).
    const initial = await listJsonlFiles();
    for (const file of initial) {
      await backfillFile(file);
    }

    // 2) fs.watch as a nudge — trigger an immediate poll on any change.
    try {
      watcher = fs.watch(config.projectsDir, { recursive: true }, () => {
        void poll();
      });
      watcher.on("error", () => {
        /* ignore watcher errors; the poll loop is the source of truth */
      });
    } catch {
      watcher = null; // recursive watch may be unsupported; poll still covers us
    }

    // 3) 1s poll — the reliable source of truth.
    pollTimer = setInterval(() => void poll(), POLL_MS);
  }

  async function stop(): Promise<void> {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (watcher) {
      try {
        watcher.close();
      } catch {
        /* ignore */
      }
      watcher = null;
    }
    started = false;
  }

  return { start, stop };
}
