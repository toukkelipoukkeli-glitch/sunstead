// Mirror of server/types.ts — kept identical so the SSE payloads and REST
// responses decode without adapters. If the backend changes the schema, change
// it here too (they are the contract).

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

export type Candidate = {
  id: string;
  label: string;
  rationale: string;
  services: { serviceType: string; plan: string; cloud: string }[];
  monthly: number;
  eu: boolean;
};

export type ServiceStatus = {
  name: string;
  state: string;
  uri?: string;
  consoleUrl?: string;
};

export type BenchResult = {
  measured: boolean;
  pgWriteP50?: number;
  pgReadP50?: number;
  pgWriteP95?: number;
  kafkaProduceP50?: number;
  note?: string;
};

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

// ── Frontend-only view model ─────────────────────────────────────────────
// We fold the AdviseEvent stream into this single object that drives the UI.

export type TimelineItem =
  | { kind: "thought"; text: string; ts: number }
  | { kind: "tool_call"; tool: string; args: any; ts: number }
  | { kind: "tool_result"; tool: string; summary: string; ts: number };

export type RunState = {
  status: "idle" | "streaming" | "done" | "error";
  prompt: string;
  timeline: TimelineItem[];
  workload?: any;
  candidates?: Candidate[];
  pricing?: PriceRow[];
  recommendation?: { candidateId: string; why: string; monthly: number };
  provision?: ServiceStatus;
  benchmark?: BenchResult;
  error?: string;
};

export const emptyRun = (prompt = ""): RunState => ({
  status: "idle",
  prompt,
  timeline: [],
});
