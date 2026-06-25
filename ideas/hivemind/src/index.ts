// Hivemind — entrypoint. Wires Config → embedder → bus → store → server → watcher → (simulator).
// Run directly via Node type-stripping: `node src/index.ts`.

import process from "node:process";

import { loadConfig, type Config } from "./config.ts";
import { createEmbedder } from "./embed.ts";
import { createBus } from "./bus.ts";
import { createStore } from "./store.ts";
import { createServer } from "./server.ts";
import { createWatcher } from "./watcher.ts";
import { createSimulator } from "./simulate.ts";

async function main(): Promise<void> {
  const config = loadConfig();

  // Build the pluggable backends (local fallback OR Aiven adapters per config).
  const embedder = createEmbedder(config);
  const bus = createBus(config);
  const store = createStore(config, embedder);

  // Bring storage and bus online before anything starts producing events.
  await store.init();
  await bus.start();

  // The HTTP/SSE dashboard server. index.ts owns the bus→server wiring (server.ts does not subscribe itself).
  const server = createServer(config, bus, store);
  const unsubscribe = bus.subscribe((e) => server.ingest(e));
  await server.start();

  // Tail real Claude Code transcripts and publish each new event onto the bus.
  const watcher = createWatcher(config, (e) => {
    void bus.publish(e);
  });
  await watcher.start();

  // Optionally bring fake teammates to life so a one-laptop demo looks busy.
  const simulator = config.demo
    ? createSimulator(config, (e) => {
        void bus.publish(e);
      })
    : null;
  simulator?.start();

  printBanner(config);

  // Clean shutdown: tear down producers/watchers/server, then exit. Guard against double-fire.
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.stdout.write(`\n[hivemind] ${signal} received — shutting down…\n`);
    try {
      simulator?.stop();
      unsubscribe();
      await watcher.stop();
      await server.stop();
      await bus.stop();
    } catch (err) {
      process.stderr.write(`[hivemind] shutdown error: ${String(err)}\n`);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

function printBanner(config: Config): void {
  const url = `http://localhost:${config.port}`;
  const lines = [
    "",
    "  ╔════════════════════════════════════════════════╗",
    "  ║                  H I V E M I N D                 ║",
    "  ║      shared live context for your AI team        ║",
    "  ╚════════════════════════════════════════════════╝",
    "",
    `   dashboard   ${url}`,
    `   actor       ${config.actor}`,
    `   bus         ${config.busKind}`,
    `   store       ${config.storeKind}`,
    `   projects    ${config.projectsDir}`,
    `   demo        ${config.demo ? "ON (simulated teammates)" : "off"}`,
    "",
    "   Ctrl-C to stop.",
    "",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

main().catch((err) => {
  process.stderr.write(`[hivemind] fatal: ${err?.stack ?? String(err)}\n`);
  process.exit(1);
});
