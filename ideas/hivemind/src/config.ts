// Hivemind — configuration. FROZEN env-var contract. All modules read Config, not process.env.
import os from "node:os";
import path from "node:path";

export interface Config {
  port: number;
  projectsDir: string; // where Claude Code writes transcripts (~/.claude/projects)
  actor: string; // this machine's teammate name
  busKind: "local" | "kafka";
  storeKind: "memory" | "postgres";
  demo: boolean; // run the simulator (fake teammates) alongside the real watcher
  backfill: number; // # of recent records per transcript file to replay on startup
  activeWindowMs: number; // presence "active" threshold
  dataFile: string; // memory-store persistence path (JSONL)
  redactSecrets: boolean; // scrub obvious secrets from event text before publishing
  pg?: { connectionString?: string };
  kafka?: {
    brokers: string[];
    topic: string;
    ssl: boolean;
    username?: string;
    password?: string;
    mechanism?: string; // e.g. "scram-sha-256" / "plain"
  };
  embed?: { url: string; apiKey: string; model: string; dim: number };
}

function bool(v: string | undefined, dflt: boolean): boolean {
  if (v == null || v === "") return dflt;
  return /^(1|true|yes|on)$/i.test(v);
}
function num(v: string | undefined, dflt: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const home = os.homedir();
  const busKind: Config["busKind"] = env.HIVEMIND_BUS === "kafka" ? "kafka" : "local";
  const storeKind: Config["storeKind"] = env.HIVEMIND_STORE === "postgres" ? "postgres" : "memory";

  return {
    port: num(env.HIVEMIND_PORT ?? env.PORT, 3737),
    projectsDir: env.HIVEMIND_PROJECTS_DIR || path.join(home, ".claude", "projects"),
    actor: env.HIVEMIND_USER || env.USER || os.hostname() || "anon",
    busKind,
    storeKind,
    demo: bool(env.HIVEMIND_DEMO, false),
    backfill: num(env.HIVEMIND_BACKFILL, 25),
    activeWindowMs: num(env.HIVEMIND_ACTIVE_WINDOW_MS, 90_000),
    dataFile: env.HIVEMIND_DATA_FILE || path.join(process.cwd(), "data", "events.jsonl"),
    redactSecrets: bool(env.HIVEMIND_REDACT, true),
    pg: storeKind === "postgres" ? { connectionString: env.PG_CONNECTION_STRING || env.DATABASE_URL } : undefined,
    kafka:
      busKind === "kafka"
        ? {
            brokers: (env.KAFKA_BROKERS || "").split(",").map((s) => s.trim()).filter(Boolean),
            topic: env.KAFKA_TOPIC || "hivemind.events",
            ssl: bool(env.KAFKA_SSL, true),
            username: env.KAFKA_USERNAME,
            password: env.KAFKA_PASSWORD,
            mechanism: env.KAFKA_SASL_MECHANISM,
          }
        : undefined,
    embed:
      env.EMBED_URL && env.EMBED_API_KEY
        ? {
            url: env.EMBED_URL,
            apiKey: env.EMBED_API_KEY,
            model: env.EMBED_MODEL || "text-embedding-3-small",
            dim: num(env.EMBED_DIM, 256),
          }
        : undefined,
  };
}
