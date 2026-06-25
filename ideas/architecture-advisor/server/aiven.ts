// aiven.ts — REST-backed implementation of the AivenTools interface.
//
// Talks to the live Aiven public API (https://api.aiven.io/v1) using the
// `aivenv1 <token>` auth scheme. Verified read-only against project touko-1f1c
// (June 2026): see pricing.ts for the exact price numbers this reproduces.
//
// The token is read from process.env.AIVEN_TOKEN (loaded from .env.local by
// Bun's auto .env loading). It is NEVER logged, committed, or hardcoded.

import {
  AIVEN_API_BASE,
  AIVEN_PROJECT,
  consoleUrlFor,
  type AivenTools,
  type PriceRow,
  type ServiceStatus,
  type BenchResult,
} from "./types.ts";
import { comparePricingRows, isEuCloud } from "./pricing.ts";
import { benchmarkPg } from "./bench.ts";
import postgres from "postgres";

const FREE_PLAN_RE = /(^|[-_])free([-_]|$)/i;

function token(): string {
  const t = process.env.AIVEN_TOKEN;
  if (!t) throw new Error("AIVEN_TOKEN is not set (load it from .env.local).");
  return t;
}

/** Thin authed fetch wrapper. Throws a readable error on non-2xx. */
async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${AIVEN_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `aivenv1 ${token()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    // Aiven returns {message, errors:[...]} — surface it without leaking auth.
    let msg = `Aiven API ${res.status} on ${path}`;
    try {
      const j = JSON.parse(text);
      msg += `: ${j.message ?? text}`;
    } catch {
      msg += `: ${text.slice(0, 200)}`;
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : {};
}

export function createAivenTools(): AivenTools {
  // Caches: service_types and clouds are stable for a session; cache them so the
  // agent's repeated price comparisons stay instant and free.
  let serviceTypesCache: Record<string, any> | undefined;
  let euLookupCache: Map<string, boolean> | undefined;

  async function getServiceTypes(): Promise<Record<string, any>> {
    if (serviceTypesCache) return serviceTypesCache;
    const j = await api(`/project/${AIVEN_PROJECT}/service_types`);
    serviceTypesCache = j.service_types ?? {};
    return serviceTypesCache!;
  }

  async function getEuLookup(): Promise<Map<string, boolean>> {
    if (euLookupCache) return euLookupCache;
    const map = new Map<string, boolean>();
    try {
      const j = await api(`/clouds`);
      for (const c of j.clouds ?? []) {
        map.set(c.cloud_name, isEuCloud(c.cloud_name, c.geo_region));
      }
    } catch {
      // /clouds is best-effort; name-regex fallback still works in pricing.ts.
    }
    euLookupCache = map;
    return map;
  }

  function toStatus(svc: any): ServiceStatus {
    return {
      name: svc?.service_name,
      state: svc?.state ?? "UNKNOWN",
      uri: svc?.service_uri || undefined,
      consoleUrl: consoleUrlFor(svc?.service_name ?? ""),
    };
  }

  const tools: AivenTools = {
    async listServiceTypes() {
      return getServiceTypes();
    },

    async comparePricing(o) {
      const [st, eu] = await Promise.all([getServiceTypes(), getEuLookup()]);
      return comparePricingRows(st, o, eu);
    },

    async listClouds() {
      const j = await api(`/clouds`);
      return (j.clouds ?? []).map((c: any) => ({
        cloud_name: c.cloud_name,
        geo_region: c.geo_region,
        eu: isEuCloud(c.cloud_name, c.geo_region),
      }));
    },

    async createService(o): Promise<ServiceStatus> {
      // Defense in depth: never let a paid plan through this layer either.
      if (!FREE_PLAN_RE.test(o.plan)) {
        throw new Error(
          `Refusing to provision non-free plan "${o.plan}" — this account runs on $0 credits.`,
        );
      }
      const j = await api(`/project/${AIVEN_PROJECT}/service`, {
        method: "POST",
        body: JSON.stringify({
          service_name: o.name,
          service_type: o.serviceType,
          plan: o.plan,
          cloud: o.cloud,
          user_config: o.userConfig ?? {},
        }),
      });
      return toStatus(j.service);
    },

    async getService(name): Promise<ServiceStatus> {
      const j = await api(`/project/${AIVEN_PROJECT}/service/${encodeURIComponent(name)}`);
      return toStatus(j.service);
    },

    async waitRunning(name, timeoutMs = 240_000): Promise<ServiceStatus> {
      const deadline = Date.now() + timeoutMs;
      let last = await this.getService(name);
      while (last.state !== "RUNNING" && Date.now() < deadline) {
        await sleep(4000);
        last = await this.getService(name);
      }
      return last;
    },

    async deleteService(name): Promise<void> {
      await api(`/project/${AIVEN_PROJECT}/service/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
    },

    async pgQuery(uri, sql): Promise<any[]> {
      if (!uri) throw new Error("pgQuery: empty service_uri");
      const client = postgres(uri, {
        ssl: "require",
        max: 1,
        idle_timeout: 5,
        connect_timeout: 15,
        prepare: false,
        onnotice: () => {},
      });
      try {
        const rows = await client.unsafe(sql);
        return Array.from(rows as Iterable<any>);
      } finally {
        try {
          await client.end({ timeout: 5 });
        } catch {
          /* ignore */
        }
      }
    },

    async benchmark(serviceName): Promise<BenchResult> {
      // Resolve the connection URI by name and benchmark over a direct socket.
      // Works when the token returns real credentials (e.g. paid tier); if the
      // password is masked this returns measured:false and the MCP path is used.
      const status = await this.getService(serviceName);
      if (!status.uri) {
        return { measured: false, note: "no postgres service_uri available yet" };
      }
      return benchmarkPg(status.uri);
    },
  };

  return tools;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
