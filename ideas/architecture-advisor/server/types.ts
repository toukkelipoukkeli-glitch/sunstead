// types.ts — shared types for "Aiven Architect".
//
// This module is OWNED by the Aiven integration core; agent.ts, index.ts, and
// the frontend all import from here (the frontend may redeclare these
// identically in its own lib). Keep the shapes stable — they are the contract
// between the agent loop, the HTTP layer, and the React UI.

/**
 * One normalized pricing line: a (serviceType, plan, cloud) triple with its
 * real hourly price from the live Aiven API and a derived monthly estimate.
 * `monthly` is `pricePerHour * 730` (avg hours/month). `eu` is true when the
 * cloud sits in an EU/EEA geo_region (data-residency filter).
 */
export type PriceRow = {
  serviceType: string;
  plan: string;
  cloud: string;
  region: string;
  eu: boolean;
  cpu: number;
  memMb: number;
  diskMb: number;
  pricePerHour: number;
  monthly: number;
};

/** A candidate architecture the agent proposes (1..N services + a costed total). */
export type Candidate = {
  id: string;
  label: string;
  rationale: string;
  services: { serviceType: string; plan: string; cloud: string }[];
  monthly: number;
  eu: boolean;
};

/** Live status of a provisioned Aiven service. */
export type ServiceStatus = {
  name: string;
  state: string; // e.g. REBUILDING -> RUNNING
  uri?: string; // service_uri, e.g. postgres://...:.../defaultdb?sslmode=require
  consoleUrl?: string; // deep link into the Aiven console
};

/**
 * Result of the real micro-benchmark on the provisioned instance.
 * `measured: false` means we returned a modeled/placeholder result (e.g. no
 * URI yet) — the UI labels measured-vs-modeled explicitly.
 */
export type BenchResult = {
  measured: boolean;
  pgWriteP50?: number;
  pgReadP50?: number;
  pgWriteP95?: number;
  kafkaProduceP50?: number;
  note?: string;
};

/** SSE event stream emitted by the agent loop (one `data:` line each). */
export type AdviseEvent =
  | { type: "thought"; text: string }
  | { type: "tool_call"; tool: string; args: any }
  | { type: "tool_result"; tool: string; summary: string }
  | { type: "context"; workload: any }
  | { type: "candidates"; candidates: Candidate[] }
  | { type: "pricing"; rows: PriceRow[] }
  | { type: "recommendation"; candidateId: string; why: string; monthly: number }
  | { type: "provision"; status: ServiceStatus }
  | { type: "benchmark"; result: BenchResult }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * The capability surface used by the agent and the HTTP routes. Both the REST
 * implementation (aiven.ts) and the MCP implementation (mcp.ts) satisfy this
 * interface, so the backend is swappable via AIVEN_BACKEND=mcp|rest.
 */
export interface AivenTools {
  /** Raw service_types payload from Aiven (used for debugging / introspection). */
  listServiceTypes(): Promise<any>;
  /** Normalized, cross-region price comparison for a service type (+optional plan). */
  comparePricing(o: {
    serviceType: string;
    plan?: string;
    clouds?: string[];
    euOnly?: boolean;
  }): Promise<PriceRow[]>;
  /** All clouds with an `eu` residency flag. */
  listClouds(): Promise<{ cloud_name: string; geo_region?: string; eu: boolean }[]>;
  /** Provision a service (FREE plans only — enforced upstream too). */
  createService(o: {
    name: string;
    serviceType: string;
    plan: string;
    cloud: string;
    userConfig?: any;
  }): Promise<ServiceStatus>;
  /** Current status of a service. */
  getService(name: string): Promise<ServiceStatus>;
  /** Poll until the service reaches RUNNING (or timeout). */
  waitRunning(name: string, timeoutMs?: number): Promise<ServiceStatus>;
  /** Tear down a service. */
  deleteService(name: string): Promise<void>;
  /** Run arbitrary SQL on a Postgres service_uri (data plane). */
  pgQuery(uri: string, sql: string): Promise<any[]>;
  /** Real pg write/read micro-benchmark against a provisioned Postgres service (by name). */
  benchmark(serviceName: string): Promise<BenchResult>;
}

/** Aiven project + API constants (single source of truth). */
export const AIVEN_API_BASE = "https://api.aiven.io/v1";
export const AIVEN_PROJECT = process.env.AIVEN_PROJECT || "touko-1f1c";

/** Regions/clouds count as EU for residency when their name/geo matches this. */
export const EU_REGEX = /eu-|europe|northeurope|westeurope|fi-hel|se-sto|de-fra|nl-ams|uk-lon|do-fra|do-ams|do-lon/i;

/** Build a console deep-link for a provisioned service. */
export function consoleUrlFor(name: string): string {
  return `https://console.aiven.io/account/_/project/${AIVEN_PROJECT}/services/${encodeURIComponent(
    name,
  )}`;
}
