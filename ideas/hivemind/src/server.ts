// Hivemind — HTTP server: static web files + REST API + SSE live stream.
// CORE module: zero external deps. Reads Config; never process.env.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "./config.ts";
import type { Bus, Store, ActivityEvent, Presence, Stats, ServerMessage } from "./types.ts";

export interface HivemindServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  ingest(e: ActivityEvent): void;
}

// web/ lives next to src/ — resolve it relative to THIS module, not cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, "..", "web");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
};

// Map a request path to a file inside web/. Returns null if it escapes WEB_DIR.
function resolveWebFile(urlPath: string): string | null {
  const clean = urlPath === "/" ? "/index.html" : urlPath;
  const decoded = decodeURIComponent(clean);
  const full = path.normalize(path.join(WEB_DIR, decoded));
  // Prevent path traversal: the resolved file must stay under WEB_DIR.
  if (full !== WEB_DIR && !full.startsWith(WEB_DIR + path.sep)) return null;
  return full;
}

export function createServer(config: Config, bus: Bus, store: Store): HivemindServer {
  const clients = new Set<http.ServerResponse>();
  let httpServer: http.Server | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  // ---- SSE helpers ----
  function sendTo(res: http.ServerResponse, msg: ServerMessage): void {
    try {
      res.write(`data: ${JSON.stringify(msg)}\n\n`);
    } catch {
      // client likely gone; drop it.
      clients.delete(res);
    }
  }

  function broadcast(msg: ServerMessage): void {
    const frame = `data: ${JSON.stringify(msg)}\n\n`;
    for (const res of clients) {
      try {
        res.write(frame);
      } catch {
        clients.delete(res);
      }
    }
  }

  // ---- presence/stats recompute, throttled to avoid hammering the store ----
  let presenceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastPresenceAt = 0;
  const THROTTLE_MS = 500;

  async function buildStats(): Promise<Stats> {
    const s = await store.stats();
    return { ...s, bus: config.busKind, store: config.storeKind };
  }

  async function recomputeAndBroadcast(): Promise<void> {
    lastPresenceAt = Date.now();
    try {
      const [presence, stats] = await Promise.all([
        store.presence(config.activeWindowMs),
        buildStats(),
      ]);
      broadcast({ type: "presence", presence });
      broadcast({ type: "stats", stats });
    } catch {
      // best-effort live updates; never crash the server on a transient store error.
    }
  }

  // Leading + trailing throttle: fire immediately if we're past the window,
  // otherwise schedule one trailing run at the window boundary.
  function scheduleRecompute(): void {
    if (presenceTimer) return;
    const elapsed = Date.now() - lastPresenceAt;
    if (elapsed >= THROTTLE_MS) {
      void recomputeAndBroadcast();
      return;
    }
    presenceTimer = setTimeout(() => {
      presenceTimer = null;
      void recomputeAndBroadcast();
    }, THROTTLE_MS - elapsed);
  }

  // ---- request handling ----
  function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(payload),
      "cache-control": "no-store",
    });
    res.end(payload);
  }

  async function serveStatic(res: http.ServerResponse, urlPath: string): Promise<void> {
    const file = resolveWebFile(urlPath);
    if (!file) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    try {
      const data = await readFile(file);
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {
        "content-type": MIME[ext] ?? "application/octet-stream",
        "content-length": data.length,
        "cache-control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  }

  function openSse(req: http.IncomingMessage, res: http.ServerResponse): void {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no", // disable proxy buffering if present
    });
    // Nudge clients to retry quickly if the connection drops.
    res.write("retry: 2000\n\n");
    clients.add(res);

    // Send an initial snapshot of the current world.
    void (async () => {
      try {
        const [feed, presence, stats] = await Promise.all([
          store.recent(200),
          store.presence(config.activeWindowMs),
          buildStats(),
        ]);
        sendTo(res, { type: "snapshot", feed, presence, stats });
      } catch {
        // If the store hiccups, still send an empty snapshot so the client renders.
        sendTo(res, {
          type: "snapshot",
          feed: [],
          presence: [],
          stats: { events: 0, sessions: 0, actors: 0, bus: config.busKind, store: config.storeKind, since: 0 },
        });
      }
    })();

    const cleanup = () => {
      clients.delete(res);
    };
    req.on("close", cleanup);
    res.on("close", cleanup);
    res.on("error", cleanup);
  }

  async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Only GET is supported.
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { error: "method not allowed" });
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;

    if (pathname === "/events") {
      openSse(req, res);
      return;
    }

    if (pathname === "/api/feed") {
      const limit = clampInt(url.searchParams.get("limit"), 100, 1, 1000);
      const feed = await store.recent(limit);
      sendJson(res, 200, feed);
      return;
    }

    if (pathname === "/api/presence") {
      const presence = await store.presence(config.activeWindowMs);
      sendJson(res, 200, presence);
      return;
    }

    if (pathname === "/api/search") {
      const q = (url.searchParams.get("q") ?? "").trim();
      const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100);
      const hits = q ? await store.search(q, limit) : [];
      sendJson(res, 200, hits);
      return;
    }

    if (pathname === "/api/stats") {
      const stats = await buildStats();
      sendJson(res, 200, stats);
      return;
    }

    // Everything else → static web files.
    await serveStatic(res, pathname);
  }

  return {
    async start(): Promise<void> {
      httpServer = http.createServer((req, res) => {
        handle(req, res).catch((err) => {
          try {
            if (!res.headersSent) sendJson(res, 500, { error: String(err?.message ?? err) });
            else res.end();
          } catch {
            /* ignore */
          }
        });
      });

      // SSE connections are long-lived; don't let Node time them out.
      httpServer.requestTimeout = 0;
      httpServer.headersTimeout = 0;

      await new Promise<void>((resolve, reject) => {
        const srv = httpServer!;
        srv.once("error", reject);
        srv.listen(config.port, () => {
          srv.off("error", reject);
          resolve();
        });
      });

      // Heartbeat keeps proxies/browsers from closing idle SSE connections.
      heartbeat = setInterval(() => {
        for (const res of clients) {
          try {
            res.write(": ping\n\n");
          } catch {
            clients.delete(res);
          }
        }
      }, 15_000);
      heartbeat.unref?.();
    },

    async stop(): Promise<void> {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      if (presenceTimer) {
        clearTimeout(presenceTimer);
        presenceTimer = null;
      }
      for (const res of clients) {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
      clients.clear();
      const srv = httpServer;
      httpServer = null;
      if (srv) {
        await new Promise<void>((resolve) => srv.close(() => resolve()));
      }
    },

    ingest(e: ActivityEvent): void {
      // Persist, then push to live clients. Persistence is async but we don't
      // block the bus callback; broadcast the event immediately for snappy UX.
      void store.insert(e).catch(() => {
        /* dropping a persist error must not kill ingestion */
      });
      broadcast({ type: "event", event: e });
      scheduleRecompute();
    },
  };
}

function clampInt(raw: string | null, dflt: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}
