#!/usr/bin/env node

const JETSTREAM_HOST =
  process.env.JETSTREAM_HOST || "wss://jetstream2.us-east.bsky.network/subscribe";

const defaultCollections = [
  "sh.tangled.repo",
  "sh.tangled.repo.pull",
  "sh.tangled.repo.issue",
  "sh.tangled.repo.pull.comment",
  "sh.tangled.repo.issue.comment",
  "sh.tangled.feed.comment",
  "sh.tangled.feed.reaction",
  "sh.tangled.feed.star",
  "sh.tangled.git.refUpdate",
  "sh.tangled.graph.follow",
  "sh.tangled.graph.vouch",
  "sh.tangled.pipeline",
  "sh.tangled.pipeline.status",
];

const args = process.argv.slice(2);
const collections = [];
let all = false;
let pretty = false;
let commitsOnly = false;
let limit = 0;
let cursor = "";

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === "--all") {
    all = true;
  } else if (arg === "--pretty") {
    pretty = true;
  } else if (arg === "--commits-only") {
    commitsOnly = true;
  } else if (arg === "--collection" || arg === "-c") {
    const value = args[index + 1];
    if (!value) throw new Error(`${arg} requires a collection`);
    collections.push(value);
    index += 1;
  } else if (arg === "--limit" || arg === "-n") {
    const value = Number(args[index + 1]);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`${arg} requires a positive integer`);
    }
    limit = value;
    index += 1;
  } else if (arg === "--cursor") {
    const value = args[index + 1];
    if (!value) throw new Error("--cursor requires a microsecond timestamp");
    cursor = value;
    index += 1;
  } else if (arg === "--since-seconds") {
    const seconds = Number(args[index + 1]);
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new Error("--since-seconds requires a non-negative number");
    }
    cursor = String(Math.floor((Date.now() - seconds * 1000) * 1000));
    index += 1;
  } else if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  } else {
    throw new Error(`unknown argument: ${arg}`);
  }
}

const wantedCollections = all
  ? []
  : collections.length > 0
    ? collections
    : defaultCollections;

const url = new URL(JETSTREAM_HOST);
for (const collection of wantedCollections) {
  url.searchParams.append("wantedCollections", collection);
}
if (cursor) {
  url.searchParams.set("cursor", cursor);
}

let seen = 0;
const socket = new WebSocket(url);

console.error(`connecting ${url.toString()}`);

socket.addEventListener("open", () => {
  console.error("connected; printing raw JSON events");
});

socket.addEventListener("message", (event) => {
  const raw = String(event.data);
  const parsed = commitsOnly || pretty ? JSON.parse(raw) : null;

  if (commitsOnly && parsed.kind !== "commit") {
    return;
  }

  if (pretty) {
    console.log(JSON.stringify(parsed, null, 2));
  } else {
    console.log(raw);
  }

  seen += 1;
  if (limit > 0 && seen >= limit) {
    socket.close(1000, "limit reached");
  }
});

socket.addEventListener("close", (event) => {
  console.error(`closed code=${event.code} reason=${event.reason || "(none)"}`);
});

socket.addEventListener("error", (event) => {
  console.error("websocket error", event.error || event.message || event);
  process.exitCode = 1;
});

process.on("SIGINT", () => {
  socket.close(1000, "interrupted");
});

function printHelp() {
  console.log(`Usage:
  node scripts/tangled-firehose-json.mjs [options]

Options:
  --all                         Print all Jetstream JSON events.
  -c, --collection <nsid>       Add one collection filter. Repeatable.
  -n, --limit <count>           Stop after this many events.
  --commits-only                Skip identity/account events.
  --pretty                      Pretty-print JSON instead of JSONL.
  --cursor <microseconds>       Start from a Jetstream cursor.
  --since-seconds <seconds>     Rewind by this many seconds.

Examples:
  node scripts/tangled-firehose-json.mjs
  node scripts/tangled-firehose-json.mjs --pretty --commits-only --limit 3
  node scripts/tangled-firehose-json.mjs -c sh.tangled.repo.pull --since-seconds 86400
  node scripts/tangled-firehose-json.mjs --all --limit 10
`);
}
