import type {
  AdviseEvent,
  BenchResult,
  Candidate,
  PriceRow,
  ServiceStatus,
} from "./types";

// ── MOCK MODE ──────────────────────────────────────────────────────────────
//
// A fully scripted run that replays a believable EU-fintech scenario with ZERO
// backend. This is the demo-safety net (team playbook): if the live API or the
// network dies on stage, flip the Mock toggle and the entire flow still plays —
// streaming timeline, real-shaped pricing, provision REBUILDING->RUNNING, and a
// measured-vs-modeled benchmark.
//
// Numbers are anchored to the spec's VERIFIED LIVE FACTS so they read as real:
//   pg startup-4: $0.103/hr upcloud-se-sto, $0.151/hr upcloud-fi-hel1,
//                 $0.13562/hr google-europe-west12  (monthly = hr * 730)
//   free plans cost $0 and are what we actually provision live.

export const PROJECT = "touko-1f1c";
export const consoleUrl = (service: string) =>
  `https://console.aiven.io/account/-/project/${PROJECT}/services/${service}`;

const hr = (h: number) => +(h * 730).toFixed(2);

// Real-shaped price rows for the cost-comparison centerpiece. startup-4 is the
// production-grade 50GB-capable plan; rows span EU + non-EU so residency
// filtering and "savings vs default" both have something to chew on.
export const MOCK_PG_ROWS: PriceRow[] = [
  row("pg", "startup-4", "upcloud-se-sto", "Stockholm, Sweden", true, 2, 4096, 80_000, 0.103),
  row("pg", "startup-4", "google-europe-west12", "Turin, Italy", true, 2, 4096, 80_000, 0.13562),
  row("pg", "startup-4", "upcloud-fi-hel1", "Helsinki, Finland", true, 2, 4096, 80_000, 0.151),
  row("pg", "startup-4", "aws-eu-west-1", "Ireland", true, 2, 4096, 80_000, 0.1488),
  row("pg", "startup-4", "do-fra", "Frankfurt, Germany", true, 2, 4096, 80_000, 0.142),
  row("pg", "startup-4", "aws-us-east-1", "N. Virginia, USA", false, 2, 4096, 80_000, 0.0962),
  row("pg", "startup-4", "google-us-east4", "Virginia, USA", false, 2, 4096, 80_000, 0.0991),
];

export const MOCK_KAFKA_ROWS: PriceRow[] = [
  row("kafka", "startup-2", "upcloud-se-sto", "Stockholm, Sweden", true, 2, 2048, 0, 0.2767),
  row("kafka", "startup-2", "google-europe-west12", "Turin, Italy", true, 2, 2048, 0, 0.3123),
  row("kafka", "startup-2", "aws-eu-west-1", "Ireland", true, 2, 2048, 0, 0.3219),
  row("kafka", "startup-2", "aws-us-east-1", "N. Virginia, USA", false, 2, 2048, 0, 0.2511),
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "eu-cost",
    label: "EU cost-optimal",
    rationale:
      "Cheapest EU region that satisfies residency. Postgres startup-4 (4GB RAM, 80GB disk) in UpCloud Stockholm + Kafka startup-2 in the same region — co-located to keep the order stream's p99 tight.",
    services: [
      { serviceType: "pg", plan: "startup-4", cloud: "upcloud-se-sto" },
      { serviceType: "kafka", plan: "startup-2", cloud: "upcloud-se-sto" },
    ],
    monthly: hr(0.103) + hr(0.2767),
    eu: true,
  },
  {
    id: "eu-hyperscaler",
    label: "EU hyperscaler",
    rationale:
      "Same shape on AWS eu-west-1 (Ireland) for teams standardising on AWS networking/VPC peering. ~30% pricier than UpCloud but inside the EU and audit-friendly.",
    services: [
      { serviceType: "pg", plan: "startup-4", cloud: "aws-eu-west-1" },
      { serviceType: "kafka", plan: "startup-2", cloud: "aws-eu-west-1" },
    ],
    monthly: hr(0.1488) + hr(0.3219),
    eu: true,
  },
  {
    id: "eu-low-latency",
    label: "EU low-latency (Helsinki)",
    rationale:
      "UpCloud Helsinki places data closest to a Nordic user base for the lowest p99, at a small premium over Stockholm. Still fully EU-resident.",
    services: [
      { serviceType: "pg", plan: "startup-4", cloud: "upcloud-fi-hel1" },
      { serviceType: "kafka", plan: "startup-2", cloud: "google-europe-west12" },
    ],
    monthly: hr(0.151) + hr(0.3123),
    eu: true,
  },
];

export const MOCK_RECOMMENDATION = {
  candidateId: "eu-cost",
  why: "Meets EU residency, is the cheapest compliant region, and co-locating Postgres + Kafka in UpCloud Stockholm minimises cross-service hops for the order event stream. We provision the FREE tier of this exact shape live so you can benchmark it before paying a cent.",
  monthly: MOCK_CANDIDATES[0].monthly,
};

// We provision the FREE plan of the recommended shape (cost $0), in an EU region
// that offers free-1-1gb (the spec lists upcloud-nl-ams as an EU free region).
const PROVISION_NAME = "fintech-pg-demo";
const PROVISION_CLOUD = "upcloud-nl-ams";

export const MOCK_BENCHMARK: BenchResult = {
  measured: true,
  pgWriteP50: 4.2,
  pgWriteP95: 9.7,
  pgReadP50: 1.6,
  kafkaProduceP50: 6.1,
  note: "Measured on the live free-tier Postgres in upcloud-nl-ams: 200 INSERTs + 200 SELECTs over a fresh table. Other candidates' latency is modeled from region/plan class.",
};

function row(
  serviceType: string,
  plan: string,
  cloud: string,
  region: string,
  eu: boolean,
  cpu: number,
  memMb: number,
  diskMb: number,
  pricePerHour: number,
): PriceRow {
  return {
    serviceType,
    plan,
    cloud,
    region,
    eu,
    cpu,
    memMb,
    diskMb,
    pricePerHour,
    monthly: hr(pricePerHour),
  };
}

// ── The scripted event stream ───────────────────────────────────────────────
// Each step has a delay (ms) before it fires, so the timeline animates like a
// real agent thinking out loud and firing MCP tools.

type Step = { delay: number; ev: AdviseEvent };

export function mockScript(): Step[] {
  const allRows = [...MOCK_PG_ROWS, ...MOCK_KAFKA_ROWS];
  return [
    { delay: 350, ev: { type: "thought", text: "Parsing the workload. Two stores: a 50GB transactional Postgres and an order event stream — that's Kafka. Hard constraint: data must stay in the EU. Soft constraints: low p99 latency, tight budget." } },
    { delay: 700, ev: { type: "tool_call", tool: "aiven_list_clouds", args: { euOnly: true } } },
    { delay: 650, ev: { type: "tool_result", tool: "aiven_list_clouds", summary: "41 EU clouds available (UpCloud SE/FI, AWS eu-west/eu-north, GCP europe-west, DO fra/ams). Narrowing to EU-resident regions." } },
    {
      delay: 600,
      ev: {
        type: "context",
        workload: {
          appKind: "EU fintech ledger + order events",
          stores: [
            { engine: "postgres", sizeGb: 50, pattern: "transactional / OLTP", needsVector: false },
            { engine: "kafka", pattern: "order event stream", retention: "7d" },
          ],
          residency: "EU only (hard)",
          latency: "low p99 (soft)",
          throughput: "~1.5k writes/s peak",
          budget: "tight",
        },
      },
    },
    { delay: 700, ev: { type: "thought", text: "Before recommending anything I pull live Aiven pricing across EU regions. Never quote from memory — the cost engine reads the real /service_types feed." } },
    { delay: 600, ev: { type: "tool_call", tool: "aiven_compare_pricing", args: { serviceType: "pg", plan: "startup-4", euOnly: true } } },
    { delay: 750, ev: { type: "tool_result", tool: "aiven_compare_pricing", summary: "pg startup-4 across EU: cheapest upcloud-se-sto $75.19/mo, priciest upcloud-fi-hel1 $110.23/mo. 7 rows." } },
    { delay: 500, ev: { type: "tool_call", tool: "aiven_compare_pricing", args: { serviceType: "kafka", plan: "startup-2", euOnly: true } } },
    { delay: 650, ev: { type: "tool_result", tool: "aiven_compare_pricing", summary: "kafka startup-2 across EU: cheapest upcloud-se-sto $201.99/mo. 3 rows." } },
    { delay: 400, ev: { type: "pricing", rows: allRows } },
    { delay: 700, ev: { type: "thought", text: "Drafting 3 candidate stacks: EU cost-optimal (UpCloud Stockholm), EU hyperscaler (AWS Ireland), and EU low-latency (Helsinki). All EU-resident; they trade cost vs latency vs cloud standardisation." } },
    { delay: 550, ev: { type: "candidates", candidates: MOCK_CANDIDATES } },
    { delay: 800, ev: { type: "thought", text: "Recommending EU cost-optimal: cheapest compliant region, and co-locating PG + Kafka in one region keeps the order stream's p99 down. I'll provision the FREE tier of this shape live so we can benchmark before committing budget." } },
    { delay: 500, ev: { type: "recommendation", candidateId: MOCK_RECOMMENDATION.candidateId, why: MOCK_RECOMMENDATION.why, monthly: MOCK_RECOMMENDATION.monthly } },
    { delay: 700, ev: { type: "tool_call", tool: "aiven_service_create", args: { service: PROVISION_NAME, service_type: "pg", plan: "free-1-1gb", cloud: PROVISION_CLOUD } } },
    { delay: 600, ev: { type: "provision", status: provisionStatus("REBUILDING") } },
    { delay: 1400, ev: { type: "tool_call", tool: "aiven_service_get", args: { service: PROVISION_NAME } } },
    { delay: 700, ev: { type: "tool_result", tool: "aiven_service_get", summary: "state=REBUILDING — waiting for nodes to come up…" } },
    { delay: 1600, ev: { type: "provision", status: provisionStatus("RUNNING") } },
    { delay: 500, ev: { type: "tool_result", tool: "aiven_service_get", summary: "state=RUNNING in upcloud-nl-ams. service_uri ready." } },
    { delay: 700, ev: { type: "thought", text: "Service is live. Running a real micro-benchmark against it: CREATE TABLE, 200 INSERTs, 200 SELECTs, report p50/p95." } },
    { delay: 600, ev: { type: "tool_call", tool: "aiven_run_benchmark", args: { service: PROVISION_NAME, ops: 200 } } },
    { delay: 1500, ev: { type: "tool_result", tool: "aiven_run_benchmark", summary: "pg write p50 4.2ms / p95 9.7ms, read p50 1.6ms. Measured on the live instance." } },
    { delay: 400, ev: { type: "benchmark", result: MOCK_BENCHMARK } },
    { delay: 600, ev: { type: "thought", text: "Done. Recommendation: EU cost-optimal stack, ~$277/mo at production scale, EU-resident, measured PG write p50 of 4.2ms on the free instance. One click to adopt or tear down." } },
    { delay: 300, ev: { type: "done" } },
  ];
}

function provisionStatus(state: string): ServiceStatus {
  return {
    name: PROVISION_NAME,
    state,
    uri:
      state === "RUNNING"
        ? "postgres://avnadmin:****@fintech-pg-demo-touko-1f1c.l.aivencloud.com:13710/defaultdb?sslmode=require"
        : undefined,
    consoleUrl: consoleUrl(PROVISION_NAME),
  };
}

/**
 * Replay the scripted run, calling `onEvent` for each event with realistic
 * pacing. Returns a cancel fn (same shape as the real streamAdvise handle).
 */
export function runMock(
  onEvent: (ev: AdviseEvent) => void,
  onClose?: () => void,
): { cancel: () => void } {
  const steps = mockScript();
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  let acc = 0;
  for (const step of steps) {
    acc += step.delay;
    const t = setTimeout(() => {
      if (cancelled) return;
      onEvent(step.ev);
      if (step.ev.type === "done") onClose?.();
    }, acc);
    timers.push(t);
  }

  return {
    cancel: () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    },
  };
}

// Used by the provision/benchmark panels when in mock mode so the buttons feel
// live even after the scripted run finishes.
export const mockProvisionFlow = MOCK_RECOMMENDATION;
export { PROVISION_NAME, PROVISION_CLOUD };
