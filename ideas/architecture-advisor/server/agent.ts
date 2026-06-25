// agent.ts — Claude tool-use loop for "Aiven Architect".
//
// A senior Aiven solutions architect doing presales / capacity planning. The
// agent gathers a structured workload context, ALWAYS compares live Aiven
// pricing before recommending, proposes 2-3 candidate architectures, picks the
// cheapest region that satisfies residency, provisions ONLY a free plan live,
// and runs a real micro-benchmark — streaming an AdviseEvent for every step.
//
// The aiven_* tool names mirror the official Aiven MCP naming so they read well
// on stage; each maps to a method on the AivenTools interface (REST or MCP).

import Anthropic from "@anthropic-ai/sdk";
import type {
  AivenTools,
  AdviseEvent,
  Candidate,
  PriceRow,
  ServiceStatus,
  BenchResult,
} from "./types.ts";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// Free plans we are allowed to provision (credits are $0 — never provision paid).
const FREE_PLANS: Record<string, string> = { pg: "free-1-1gb", kafka: "free-0" };
export function isFreePlan(serviceType: string, plan: string): boolean {
  return FREE_PLANS[serviceType] === plan || /(^|[-_])free([-_]|$)/i.test(plan);
}

const SYSTEM_PROMPT = `You are a senior Aiven solutions architect running a live presales / capacity-planning session on stage at a hackathon.

A user describes an app or workload in plain English. Your job, end to end:

1. WORKLOAD CONTEXT. Infer a structured workload context from the prompt: data shape, access pattern, approximate scale in GB, throughput, region / data-residency requirement (e.g. "must stay in the EU"), latency sensitivity, and budget. State reasonable assumptions out loud rather than asking follow-up questions — this is a live demo, keep momentum. Emit it with the emit_context tool.

2. PRICING — ALWAYS BEFORE RECOMMENDING. You MUST call aiven_compare_pricing for every service type the workload needs (typically pg, often kafka) BEFORE proposing or recommending anything. The pricing is live and real from the Aiven API. If residency is required (EU), pass euOnly:true so the comparison only includes compliant regions. Prefer the cheapest region that satisfies the residency requirement.

3. CANDIDATES. Propose 2-3 candidate architectures (emit_candidates). Each is a coherent stack of services with a specific plan and cloud region, a one-line rationale, and a monthly cost. Make them genuinely different (e.g. cheapest-EU vs. balanced vs. lowest-latency). Compute each candidate's monthly cost from the pricing rows you fetched — do not invent numbers.

4. RECOMMENDATION. Recommend exactly one candidate (emit_recommendation) with a crisp "why" tied to cost + residency + latency.

5. PROVISION — FREE ONLY. Provision the recommended stack's primary datastore LIVE using aiven_service_create. You may ONLY provision FREE plans (pg "free-1-1gb", kafka "free-0", or any plan whose name contains "free"). NEVER provision a paid plan — the account runs on $0 credits. The free Postgres plan is available in EU clouds (e.g. upcloud-de-fra, do-fra, aws-eu-west-1, upcloud-nl-ams) — pick an EU cloud when residency requires it. After creating, call aiven_service_get / wait for RUNNING.

6. BENCHMARK. Once the service is RUNNING, call aiven_run_benchmark on it to measure REAL pg write/read latency.

7. TRANSPARENCY. Be explicit that the benchmark latency is MEASURED on the instance you just provisioned, while the other candidates' latency figures are MODELED estimates. Never present modeled numbers as measured.

Narrate your reasoning concisely with the think tool between actions — judges are watching the agent reason and watching the real aiven_* tool calls fire. Keep each thought to one or two sentences.

When you have provisioned and benchmarked, call done. Do not provision more than one service unless the workload genuinely needs both pg and kafka and both are free.`;

// Tool schemas exposed to Claude. The aiven_* names mirror the Aiven MCP server.
const TOOLS: Anthropic.Tool[] = [
  {
    name: "think",
    description:
      "Record a short reasoning step for the audience. Use between actions to narrate your plan. One or two sentences.",
    input_schema: {
      type: "object",
      properties: { text: { type: "string", description: "The thought to surface." } },
      required: ["text"],
    },
  },
  {
    name: "emit_context",
    description:
      "Emit the structured workload context you inferred (data shape, access pattern, scale GB, throughput, region/residency, latency sensitivity, budget). Call this once, early.",
    input_schema: {
      type: "object",
      properties: {
        workload: {
          type: "object",
          description:
            "Structured workload context. Suggested keys: summary, dataShape, accessPattern, scaleGb, throughput, residency, latencySensitivity, budget.",
        },
      },
      required: ["workload"],
    },
  },
  {
    name: "aiven_compare_pricing",
    description:
      "Compare LIVE, REAL Aiven pricing for a service type across cloud regions. Returns one PriceRow per (plan, cloud) with monthly USD cost and an EU residency flag. ALWAYS call this before recommending. Use euOnly:true to restrict to EU-resident regions.",
    input_schema: {
      type: "object",
      properties: {
        serviceType: { type: "string", description: 'e.g. "pg", "kafka", "clickhouse".' },
        plan: { type: "string", description: "Optional plan filter, e.g. \"startup-4\"." },
        euOnly: { type: "boolean", description: "Restrict to EU-resident regions for data residency." },
      },
      required: ["serviceType"],
    },
  },
  {
    name: "aiven_list_clouds",
    description:
      "List available Aiven cloud regions with their geo region and an EU residency flag. Useful to pick a compliant cloud for provisioning.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "emit_candidates",
    description:
      "Emit 2-3 candidate architectures for the cost-comparison UI. Each candidate has an id, a short label, a one-line rationale, the list of services (serviceType + plan + cloud), the monthly cost in USD, and an EU flag.",
    input_schema: {
      type: "object",
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              rationale: { type: "string" },
              services: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    serviceType: { type: "string" },
                    plan: { type: "string" },
                    cloud: { type: "string" },
                  },
                  required: ["serviceType", "plan", "cloud"],
                },
              },
              monthly: { type: "number" },
              eu: { type: "boolean" },
            },
            required: ["id", "label", "rationale", "services", "monthly", "eu"],
          },
        },
      },
      required: ["candidates"],
    },
  },
  {
    name: "emit_recommendation",
    description:
      "Recommend exactly one of the candidates. Reference it by candidateId and give a crisp 'why' tied to cost, residency, and latency, plus the monthly cost.",
    input_schema: {
      type: "object",
      properties: {
        candidateId: { type: "string" },
        why: { type: "string" },
        monthly: { type: "number" },
      },
      required: ["candidateId", "why", "monthly"],
    },
  },
  {
    name: "aiven_service_create",
    description:
      "Provision an Aiven service LIVE on the user's project. FREE PLANS ONLY (pg \"free-1-1gb\", kafka \"free-0\"). Returns the service status; it starts in REBUILDING and becomes RUNNING. Pick an EU cloud when residency requires it.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "A unique service name, e.g. \"architect-pg-demo\"." },
        serviceType: { type: "string", description: '"pg" or "kafka".' },
        plan: { type: "string", description: 'Free plan only: "free-1-1gb" (pg) or "free-0" (kafka).' },
        cloud: { type: "string", description: 'Cloud region name, e.g. "upcloud-de-fra".' },
      },
      required: ["name", "serviceType", "plan", "cloud"],
    },
  },
  {
    name: "aiven_service_get",
    description:
      "Get the current status of a provisioned service (state REBUILDING -> RUNNING, connection URI, console URL). This call WAITS until the service is RUNNING (or times out).",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "aiven_pg_query",
    description:
      "Run a raw SQL statement against a provisioned Postgres service's connection URI. Returns rows. Useful for a quick smoke check (e.g. SELECT version()).",
    input_schema: {
      type: "object",
      properties: {
        uri: { type: "string", description: "The postgres:// connection URI from the service status." },
        sql: { type: "string" },
      },
      required: ["uri", "sql"],
    },
  },
  {
    name: "aiven_run_benchmark",
    description:
      "Run a REAL micro-benchmark against a provisioned Postgres service: CREATE TABLE, N inserts + N selects, report p50/p95 write/read latency in ms. The result is MEASURED on this instance (not modeled).",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "done",
    description: "Signal that the costed + benchmarked recommendation is complete.",
    input_schema: { type: "object", properties: {} },
  },
];

function summarizeRows(rows: PriceRow[]): string {
  if (rows.length === 0) return "No matching plans/regions found.";
  const sorted = [...rows].sort((a, b) => a.monthly - b.monthly);
  const cheapest = sorted[0];
  const eu = sorted.filter((r) => r.eu);
  const cheapestEu = eu[0];
  const head = sorted
    .slice(0, 6)
    .map(
      (r) =>
        `${r.plan}@${r.cloud}${r.eu ? " (EU)" : ""} $${r.monthly.toFixed(2)}/mo`,
    )
    .join("; ");
  let s = `${rows.length} rows. Cheapest: ${cheapest.plan}@${cheapest.cloud} $${cheapest.monthly.toFixed(2)}/mo.`;
  if (cheapestEu)
    s += ` Cheapest EU: ${cheapestEu.plan}@${cheapestEu.cloud} $${cheapestEu.monthly.toFixed(2)}/mo.`;
  return `${s} Sample: ${head}`;
}

function summarizeStatus(st: ServiceStatus): string {
  return `${st.name}: ${st.state}${st.uri ? " (uri ready)" : ""}${
    st.consoleUrl ? ` console: ${st.consoleUrl}` : ""
  }`;
}

function summarizeBench(b: BenchResult): string {
  if (!b.measured) return `benchmark not measured${b.note ? `: ${b.note}` : ""}`;
  const parts: string[] = [];
  if (b.pgWriteP50 != null) parts.push(`write p50 ${b.pgWriteP50.toFixed(2)}ms`);
  if (b.pgWriteP95 != null) parts.push(`write p95 ${b.pgWriteP95.toFixed(2)}ms`);
  if (b.pgReadP50 != null) parts.push(`read p50 ${b.pgReadP50.toFixed(2)}ms`);
  if (b.kafkaProduceP50 != null)
    parts.push(`kafka produce p50 ${b.kafkaProduceP50.toFixed(2)}ms`);
  return `MEASURED — ${parts.join(", ")}`;
}

/**
 * Run the agentic advise loop. Yields AdviseEvent objects in order; the caller
 * (index.ts) serializes each as an SSE `data:` line. The generator finishes
 * after emitting `done` (or `error`).
 */
export async function* advise(
  prompt: string,
  tools: AivenTools,
): AsyncGenerator<AdviseEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: "error", message: "ANTHROPIC_API_KEY is not set on the server." };
    return;
  }

  const client = new Anthropic({ apiKey });

  // Track the candidates the model emitted so we can defend provisioning.
  const candidatesById = new Map<string, Candidate>();
  let lastProvisioned: string | undefined;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  const MAX_TURNS = 24;
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });

      // Surface any plain assistant prose as a thought (the model sometimes
      // narrates outside the think tool).
      for (const block of response.content) {
        if (block.type === "text" && block.text.trim()) {
          yield { type: "thought", text: block.text.trim() };
        }
      }

      if (response.stop_reason !== "tool_use") {
        // No tool call this turn — nothing more to do.
        yield { type: "done" };
        return;
      }

      messages.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let finished = false;

      for (const tu of toolUses) {
        const args = (tu.input ?? {}) as Record<string, any>;
        // Surface the call itself (skip our internal "think" — it has its own event).
        if (tu.name !== "think") {
          yield { type: "tool_call", tool: tu.name, args };
        }

        let resultText = "ok";
        try {
          switch (tu.name) {
            case "think": {
              yield { type: "thought", text: String(args.text ?? "") };
              resultText = "noted";
              break;
            }

            case "emit_context": {
              yield { type: "context", workload: args.workload ?? {} };
              resultText = "context recorded";
              break;
            }

            case "aiven_compare_pricing": {
              const rows = await tools.comparePricing({
                serviceType: String(args.serviceType),
                plan: args.plan ? String(args.plan) : undefined,
                euOnly: Boolean(args.euOnly),
              });
              yield { type: "pricing", rows };
              resultText = summarizeRows(rows);
              yield { type: "tool_result", tool: tu.name, summary: resultText };
              break;
            }

            case "aiven_list_clouds": {
              const clouds = await tools.listClouds();
              const eu = clouds.filter((c) => c.eu);
              resultText = `${clouds.length} clouds (${eu.length} EU). EU samples: ${eu
                .slice(0, 8)
                .map((c) => c.cloud_name)
                .join(", ")}`;
              yield { type: "tool_result", tool: tu.name, summary: resultText };
              break;
            }

            case "emit_candidates": {
              const candidates = (args.candidates ?? []) as Candidate[];
              candidatesById.clear();
              for (const c of candidates) candidatesById.set(c.id, c);
              yield { type: "candidates", candidates };
              resultText = `${candidates.length} candidates recorded: ${candidates
                .map((c) => `${c.id} ($${Number(c.monthly).toFixed(2)}/mo${c.eu ? ", EU" : ""})`)
                .join("; ")}`;
              break;
            }

            case "emit_recommendation": {
              yield {
                type: "recommendation",
                candidateId: String(args.candidateId),
                why: String(args.why ?? ""),
                monthly: Number(args.monthly ?? 0),
              };
              resultText = "recommendation recorded";
              break;
            }

            case "aiven_service_create": {
              const serviceType = String(args.serviceType);
              const plan = String(args.plan);
              if (!isFreePlan(serviceType, plan)) {
                // Hard guardrail: never provision paid. Tell the model so it
                // self-corrects to a free plan.
                resultText = `REJECTED: "${plan}" is not a FREE plan. This account runs on $0 credits — only provision free plans (pg "free-1-1gb", kafka "free-0"). Re-issue with a free plan.`;
                yield { type: "tool_result", tool: tu.name, summary: resultText };
                break;
              }
              const status = await tools.createService({
                name: String(args.name),
                serviceType,
                plan,
                cloud: String(args.cloud),
              });
              lastProvisioned = status.name;
              yield { type: "provision", status };
              resultText = `provisioning ${summarizeStatus(status)}`;
              yield { type: "tool_result", tool: tu.name, summary: resultText };
              break;
            }

            case "aiven_service_get": {
              const name = String(args.name ?? lastProvisioned ?? "");
              const status = await tools.waitRunning(name);
              lastProvisioned = status.name;
              yield { type: "provision", status };
              resultText = summarizeStatus(status);
              yield { type: "tool_result", tool: tu.name, summary: resultText };
              break;
            }

            case "aiven_pg_query": {
              const rows = await tools.pgQuery(String(args.uri), String(args.sql));
              resultText = `query ok — ${rows.length} row(s): ${JSON.stringify(rows).slice(0, 300)}`;
              yield { type: "tool_result", tool: tu.name, summary: resultText };
              break;
            }

            case "aiven_run_benchmark": {
              const name = String(args.name ?? lastProvisioned ?? "");
              const status = await tools.getService(name);
              if (status.state !== "RUNNING") {
                resultText = `service ${name} is ${status.state}, not RUNNING yet. Wait for RUNNING first via aiven_service_get.`;
                yield { type: "tool_result", tool: tu.name, summary: resultText };
                break;
              }
              const result = await tools.benchmark(name);
              yield { type: "benchmark", result };
              resultText = summarizeBench(result);
              yield { type: "tool_result", tool: tu.name, summary: resultText };
              break;
            }

            case "done": {
              finished = true;
              resultText = "done";
              break;
            }

            default: {
              resultText = `unknown tool ${tu.name}`;
              break;
            }
          }
        } catch (err: any) {
          resultText = `ERROR: ${err?.message ?? String(err)}`;
          yield { type: "tool_result", tool: tu.name, summary: resultText };
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: resultText,
        });
      }

      messages.push({ role: "user", content: toolResults });

      if (finished) {
        yield { type: "done" };
        return;
      }
    }

    // Ran out of turns — close the stream gracefully.
    yield { type: "done" };
  } catch (err: any) {
    if (err instanceof Anthropic.APIError) {
      yield {
        type: "error",
        message: `Anthropic API error ${err.status}: ${err.message}`,
      };
    } else {
      yield { type: "error", message: err?.message ?? String(err) };
    }
  }
}
