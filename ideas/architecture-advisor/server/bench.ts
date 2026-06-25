// bench.ts — real micro-benchmark against a provisioned Aiven service.
//
// PG path (the must-have): connect to the service_uri, CREATE a throwaway
// table, run N INSERTs and N SELECTs, and report p50/p95 latency in ms. This is
// MEASURED on the live instance — the UI labels it as such, versus the MODELED
// latency shown for the non-provisioned candidates.
//
// Kafka path is behind a feature flag (BENCH_KAFKA=1) since client setup is
// heavier; the PG path always works for the hero demo.

import postgres from "postgres";
import type { BenchResult } from "./types.ts";

/** How many ops per phase. Small enough to stay snappy on a free 1GB node. */
const N = Number(process.env.BENCH_N || 30);

function percentile(samples: number[], p: number): number {
  if (!samples.length) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return round2(sorted[idx]);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Run a pg write/read micro-benchmark. Returns measured p50/p95.
 * Safe to call repeatedly; uses a uniquely-named temp-ish table it drops after.
 */
export async function benchmarkPg(uri: string): Promise<BenchResult> {
  if (!uri || !/^postgres(ql)?:\/\//.test(uri)) {
    return { measured: false, note: "no postgres service_uri available yet" };
  }

  // Aiven requires TLS; the URI carries ?sslmode=require. porsager/postgres
  // needs ssl set explicitly. `prepare:false` keeps each statement a fresh
  // round-trip so the latency we measure is real per-op latency.
  const sql = postgres(uri, {
    ssl: "require",
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
    prepare: false,
    onnotice: () => {},
  });

  const table = `bench_${Date.now().toString(36)}`;
  const writes: number[] = [];
  const reads: number[] = [];

  try {
    await sql.unsafe(
      `CREATE TABLE IF NOT EXISTS ${table} (id serial primary key, v text not null, ts timestamptz default now())`,
    );

    // WRITE phase — N single-row inserts.
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      await sql.unsafe(`INSERT INTO ${table} (v) VALUES ($1)`, [`row-${i}`]);
      writes.push(performance.now() - t0);
    }

    // READ phase — N point selects.
    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      await sql.unsafe(`SELECT id, v FROM ${table} WHERE id = $1`, [i + 1]);
      reads.push(performance.now() - t0);
    }

    return {
      measured: true,
      pgWriteP50: percentile(writes, 50),
      pgWriteP95: percentile(writes, 95),
      pgReadP50: percentile(reads, 50),
      note: `MEASURED on the provisioned instance — ${N} writes + ${N} reads.`,
    };
  } catch (err: any) {
    return {
      measured: false,
      note: `benchmark failed: ${err?.message ?? String(err)}`,
    };
  } finally {
    try {
      await sql.unsafe(`DROP TABLE IF EXISTS ${table}`);
    } catch {
      /* best-effort cleanup */
    }
    try {
      await sql.end({ timeout: 5 });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Run the same micro-benchmark via an injected single-statement executor.
 * Used by the MCP backend, which runs SQL server-side through aiven_pg_write /
 * aiven_pg_read — so it works even when the REST API masks the avnadmin
 * password. Each op is one MCP round-trip, so the measured latency is real
 * end-to-end (agent -> MCP -> DB). N is kept modest because round-trips are
 * slower than a direct socket.
 */
export async function benchmarkViaExec(
  exec: (query: string, write: boolean) => Promise<void>,
  n: number = Number(process.env.BENCH_MCP_N || 12),
): Promise<BenchResult> {
  // Fixed table name + DELETE-based cleanup: the MCP safety filter BLOCKS DROP /
  // TRUNCATE, so we reuse one table and clear its rows instead of dropping it.
  const table = "aiven_architect_bench";
  const writes: number[] = [];
  const reads: number[] = [];
  try {
    await exec(
      `CREATE TABLE IF NOT EXISTS ${table} (id serial primary key, v text not null, ts timestamptz default now())`,
      true,
    );
    try {
      await exec(`DELETE FROM ${table}`, true);
    } catch {
      /* fresh table — nothing to clear */
    }
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      await exec(`INSERT INTO ${table} (v) VALUES ('row-${i}')`, true);
      writes.push(performance.now() - t0);
    }
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      await exec(`SELECT id, v FROM ${table} WHERE v = 'row-${i}' LIMIT 1`, false);
      reads.push(performance.now() - t0);
    }
    return {
      measured: true,
      pgWriteP50: percentile(writes, 50),
      pgWriteP95: percentile(writes, 95),
      pgReadP50: percentile(reads, 50),
      note: `MEASURED via Aiven MCP (aiven_pg_write/aiven_pg_read) — ${n} writes + ${n} reads, end-to-end incl. MCP round-trip.`,
    };
  } catch (err: any) {
    return { measured: false, note: `benchmark failed: ${err?.message ?? String(err)}` };
  } finally {
    try {
      await exec(`DELETE FROM ${table}`, true);
    } catch {
      /* best-effort cleanup */
    }
  }
}

/**
 * Optional Kafka produce/consume latency benchmark. Gated behind BENCH_KAFKA=1
 * because the SASL/SSL client setup is heavier; the PG path is the must-have.
 * `components` come from the service object (host/port for the kafka component)
 * and credentials from connection_info.
 */
export async function benchmarkKafka(opts: {
  brokerUri?: string;
  username?: string;
  password?: string;
  caCert?: string;
}): Promise<Partial<BenchResult>> {
  if (process.env.BENCH_KAFKA !== "1") {
    return { note: "kafka benchmark disabled (set BENCH_KAFKA=1 to enable)" };
  }
  if (!opts.brokerUri) {
    return { note: "kafka benchmark: no broker uri" };
  }
  try {
    // Lazy import so the dependency isn't required unless the flag is on.
    const { Kafka, logLevel } = await import("kafkajs");
    const [host, port] = opts.brokerUri.replace(/^.*:\/\//, "").split(":");
    const kafka = new Kafka({
      clientId: "aiven-architect-bench",
      brokers: [`${host}:${port}`],
      ssl: opts.caCert ? { ca: [opts.caCert] } : true,
      sasl:
        opts.username && opts.password
          ? { mechanism: "scram-sha-256", username: opts.username, password: opts.password }
          : undefined,
      logLevel: logLevel.NOTHING,
    });

    const topic = `bench-${Date.now().toString(36)}`;
    const producer = kafka.producer();
    await producer.connect();

    const produce: number[] = [];
    for (let i = 0; i < Math.min(N, 20); i++) {
      const t0 = performance.now();
      await producer.send({ topic, messages: [{ value: `m-${i}` }] });
      produce.push(performance.now() - t0);
    }
    await producer.disconnect();

    return { kafkaProduceP50: percentile(produce, 50) };
  } catch (err: any) {
    return { note: `kafka benchmark failed: ${err?.message ?? String(err)}` };
  }
}
