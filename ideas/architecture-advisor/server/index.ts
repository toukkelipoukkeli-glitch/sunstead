// index.ts — Bun HTTP server for "Aiven Architect".
//
// Routes:
//   POST /api/advise     {prompt}                         -> text/event-stream of AdviseEvent
//   POST /api/provision  {name, serviceType, plan, cloud} -> ServiceStatus (FREE plans only)
//   POST /api/benchmark  {name}                            -> BenchResult
//   GET  /api/pricing?serviceType=pg&euOnly=true           -> PriceRow[]
//   GET  /api/health                                       -> { ok: true }
//
// Also statically serves the built frontend from ../web/dist when present.
//
// Backend selection (AIVEN_BACKEND=mcp|rest, default mcp): the MCP client spawns
// the official Aiven MCP server; if spawn/list fails it auto-falls back to the
// REST implementation. Both satisfy the same AivenTools interface.

import { dirname, join, normalize } from "path";
import { fileURLToPath } from "url";
import { advise, isFreePlan } from "./agent.ts";
import { createAivenTools } from "./aiven.ts";
import { createMcpAivenTools } from "./mcp.ts";
import type { AivenTools } from "./types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_DIST = join(HERE, "..", "web", "dist");
const PORT = Number(process.env.PORT || 8787);

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extra },
  });
}

// ---- Backend wiring (MCP first, REST fallback) ---------------------------

let toolsPromise: Promise<AivenTools> | undefined;
async function getTools(): Promise<AivenTools> {
  if (!toolsPromise) {
    toolsPromise = (async () => {
      const backend = (process.env.AIVEN_BACKEND || "mcp").toLowerCase();
      const rest = createAivenTools();
      if (backend === "rest") {
        console.log("[aiven] backend=rest");
        return rest;
      }
      try {
        const mcp = await createMcpAivenTools({ fallback: rest });
        console.log("[aiven] backend=mcp (with rest fallback)");
        return mcp;
      } catch (err: any) {
        console.warn(
          `[aiven] MCP backend failed (${err?.message ?? err}); falling back to REST.`,
        );
        return rest;
      }
    })();
  }
  return toolsPromise;
}

// ---- Static file serving --------------------------------------------------

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function serveStatic(pathname: string): Promise<Response | undefined> {
  // Map "/" -> index.html; guard against path traversal.
  const rel = pathname === "/" ? "/index.html" : pathname;
  const target = normalize(join(WEB_DIST, rel));
  if (!target.startsWith(WEB_DIST)) return undefined;

  let file = Bun.file(target);
  if (!(await file.exists())) {
    // SPA fallback: serve index.html for unknown non-API GET routes.
    const index = Bun.file(join(WEB_DIST, "index.html"));
    if (await index.exists()) file = index;
    else return undefined;
  }
  const ext = "." + (file.name?.split(".").pop() ?? "");
  const type = CONTENT_TYPES[ext] ?? "application/octet-stream";
  return new Response(file, { headers: { "Content-Type": type, ...CORS_HEADERS } });
}

// ---- SSE advise stream ----------------------------------------------------

function sseAdvise(prompt: string): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      // Initial comment to open the stream promptly through proxies.
      controller.enqueue(enc.encode(": stream open\n\n"));
      try {
        const tools = await getTools();
        for await (const ev of advise(prompt, tools)) {
          send(ev);
        }
      } catch (err: any) {
        send({ type: "error", message: err?.message ?? String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...CORS_HEADERS,
    },
  });
}

// ---- Server ---------------------------------------------------------------

const server = Bun.serve({
  port: PORT,
  idleTimeout: 0, // SSE streams are long-lived; don't time them out.
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // --- API routes ---
    if (pathname === "/api/health") {
      return json({ ok: true, backend: process.env.AIVEN_BACKEND || "mcp" });
    }

    if (pathname === "/api/advise" && req.method === "POST") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }
      const prompt = String(body?.prompt ?? "").trim();
      if (!prompt) return json({ error: "missing 'prompt'" }, 400);
      return sseAdvise(prompt);
    }

    if (pathname === "/api/provision" && req.method === "POST") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }
      const { name, serviceType, plan, cloud } = body ?? {};
      if (!name || !serviceType || !plan || !cloud) {
        return json({ error: "name, serviceType, plan, cloud are required" }, 400);
      }
      // Guardrail: reject any non-free plan (the account runs on $0 credits).
      if (!isFreePlan(String(serviceType), String(plan))) {
        return json(
          {
            error: `Refusing to provision paid plan "${plan}". Only FREE plans are allowed (pg "free-1-1gb", kafka "free-0").`,
          },
          400,
        );
      }
      try {
        const tools = await getTools();
        const status = await tools.createService({
          name: String(name),
          serviceType: String(serviceType),
          plan: String(plan),
          cloud: String(cloud),
        });
        return json(status);
      } catch (err: any) {
        return json({ error: err?.message ?? String(err) }, 502);
      }
    }

    if (pathname === "/api/benchmark" && req.method === "POST") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid JSON body" }, 400);
      }
      const name = String(body?.name ?? "").trim();
      if (!name) return json({ error: "missing 'name'" }, 400);
      try {
        const tools = await getTools();
        const status = await tools.getService(name);
        if (status.state !== "RUNNING") {
          return json(
            { error: `service "${name}" is ${status.state}, not RUNNING yet` },
            409,
          );
        }
        const result = await tools.benchmark(name);
        return json(result);
      } catch (err: any) {
        return json({ error: err?.message ?? String(err) }, 502);
      }
    }

    if (pathname === "/api/pricing" && req.method === "GET") {
      const serviceType = url.searchParams.get("serviceType") || "pg";
      const euOnly = url.searchParams.get("euOnly") === "true";
      const plan = url.searchParams.get("plan") || undefined;
      try {
        const tools = await getTools();
        const rows = await tools.comparePricing({ serviceType, plan, euOnly });
        return json(rows);
      } catch (err: any) {
        return json({ error: err?.message ?? String(err) }, 502);
      }
    }

    // --- Static frontend (GET only) ---
    if (req.method === "GET") {
      const res = await serveStatic(pathname);
      if (res) return res;
    }

    return json({ error: "not found" }, 404);
  },
});

console.log(`Aiven Architect server listening on http://localhost:${server.port}`);
console.log(`  POST /api/advise   (SSE)   POST /api/provision   POST /api/benchmark`);
console.log(`  GET  /api/pricing          GET  /api/health`);
