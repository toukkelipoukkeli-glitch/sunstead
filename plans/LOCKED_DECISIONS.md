# Locked Decisions

Date: 2026-06-25

Purpose: remove remaining ambiguity before implementation. If another planning doc leaves an option open, this file wins.

## No More Product Decisions

The remaining work is implementation, verification, and rehearsal. Do not reopen the product shape unless a live technical blocker invalidates a locked decision below.

## D01: Build The Fixture Demo Shell First

Decision:

- Build Mission 00 first.
- The full `Graduate To Aiven` flow should run with fixture data before live Aiven/Supabase work is wired.
- Every fixture card must use the same `RunEvent[]`, receipt, validation, Kafka-event, and report contracts as the live implementation.

Why:

- The judges need to understand the story immediately.
- The team can rehearse timing and copy before infra is done.
- Live integrations can replace fixture slots incrementally.

## D02: Canonical Source App

Decision:

- Product/demo name: **PulseWall**.
- Canonical source app for scanning, migration proof, and stage story: `demo/pulsewall/`.
- `demo/live-hype-wall/` remains a richer Lovable/TanStack reference export and scanner stress case.
- Do not switch the primary demo path to `demo/live-hype-wall/` unless `demo/pulsewall/` is technically blocked.

Why:

- `demo/pulsewall/` covers the behaviors the demo needs: Postgres tables, RLS, Auth, Storage, Realtime, Edge Function/RPC, triggers, seeded data, and pgvector.
- Its Vite/React shape is easier to scan, adapt, seed, and rehearse under hackathon pressure.
- It keeps the live demo focused on Aiven migration proof instead of Lovable/TanStack framework complexity.
- `demo/live-hype-wall/` is useful evidence that the scanner can recognize a more authentic Lovable export, but it should not sit on the critical path.

## D03: Implementation Stack

Decision:

- Control room UI: Vite + React + TypeScript.
- Local API/worker: Node + Fastify + TypeScript.
- Icons: `lucide-react`.
- Styling: use the repo/app's existing Tailwind/Radix style where already available; otherwise keep plain CSS dense and utilitarian.
- Do not use Next.js.
- Do not introduce a complex workflow engine.

Why:

- Fastest path to a local web control room and local adapter.
- Keeps secrets on the server side.
- Matches the current frontend ecosystem without deployment overhead.

## D04: Agents Are Modules, Not Separate Processes

Decision:

- Implement agents as named modules inside one local worker/state machine.
- Use these UI/event names: `access_broker`, `repo_scanner`, `behavior_mapper`, `aiven_operator`, `migration_operator`, `compatibility_surgeon`, `validation_auditor`, `cutover_manager`, `report_agent`.
- Claude/Agent SDK is optional and bounded: summaries, classifications, report text, and generated patch notes only.
- Deterministic code owns scanning, migration, validation, event delivery, and cutover state.

Why:

- The demo needs autonomy to be visible, not operational complexity.
- Database and infrastructure changes need typed tools and receipts, not free-form agent shell behavior.

## D05: Browser-Critical Realtime Path

Decision:

- Use Aiven Postgres `app_events` for the browser-critical demo realtime path.
- Primary browser delivery: polling `/api/events/recent` every ~750-1000ms.
- Optional enhancement: `/api/events` SSE after the polling path works.
- Do not put Kafka on the browser-critical path.

Why:

- Polling is reliable on stage.
- It still proves Supabase Realtime behavior was mapped to an Aiven-backed event path.
- Kafka remains visible without being a stage failure point.

Presenter wording:

> For the demo-safe path, realtime becomes Aiven Postgres events to the browser. Kafka is validated as the agent bus and production event path.

## D06: Kafka Role

Decision:

- Keep Kafka.
- Use one required topic: `migration.events`.
- Kafka is an Aiven-side agent bus and production event-bus proof, not a detected source-app dependency.
- The migration must still work when the Lovable/Supabase app has no Kafka usage.
- Kafka project testing and implementation come after the scaffold, Aiven Postgres migration, and browser-critical Postgres `app_events` cutover path.
- Required live Kafka proof when Kafka work begins: create/verify topic, produce one workflow event, list/read it in the UI.
- Do not build `app.outbox.posts` unless everything else is already working.

Why:

- Aiven Kafka increases sponsor depth.
- Lovable/Supabase apps normally use Supabase Realtime, not Kafka.
- Keeping it out of the browser path reduces demo risk.

## D07: Aiven Apps

Decision:

- Aiven Apps is not part of the live demo path.
- Backend glue runs locally in the Aiden API/demo runtime.
- Aiven Apps is roadmap only.

Why:

- Current account access is not enabled.
- The product proof is the Aiven data plane, not app hosting.

## D08: Auth, Storage, RLS, Edge Functions

Decision:

- Production Auth migration: cut, flag adapter-required.
- Production Storage migration: cut, flag object-store adapter-required.
- RLS depending on Supabase auth context: review-required blocker.
- Edge Functions/RPC: classify and generate adapter plan only.

Why:

- These are real production migration problems and should not be hand-waved.
- The demo wins by being honest and proving the scoped runtime.

## D09: Source Data Access

Decision:

- For Mission 00, no source credentials are required.
- For live demo migration, prefer fixture/seeded source data or read-only source access.
- `SOURCE_SUPABASE_SERVICE_ROLE_KEY` is optional, not required.
- Use service role only if RLS blocks demo data reads or a real source copy is explicitly needed.

Why:

- Reduces secret risk and setup friction.
- Keeps the one-click access story credible.

## D10: Aiven Proof Minimum

Decision:

Final rehearsal/judging must include at least:

- one live Aiven project/service visibility action;
- one live Aiven Postgres receipt write;
- one live Aiven Postgres validation/read;
- one live Kafka `migration.events` produce/list roundtrip.

Everything else may be fixture/cached if clearly labeled.

Why:

- This satisfies sponsor-visible MCP/Aiven depth without making every card live-critical.

## D11: Cost Card And CTO Recommendation

Decision:

- Cost card is required in the final report.
- Default source: deterministic configured/demo values.
- Live Aiven pricing/metrics are optional upgrades, not blockers.
- CTO recommendation is required, but may be generated from validation data if live metrics are unavailable.

Why:

- Business judges need the "why now" and "what next" story.
- Live pricing/metrics should not delay the core migration proof.

## D12: Cutover Scope

Decision:

- Cutover is scoped to the demo runtime only.
- No production DNS/env switch.
- No source deletion.
- No destructive cleanup.
- Presenter must say "scoped demo runtime" when discussing Supabase removal.

Why:

- Prevents auth/storage/RLS objections from derailing the demo.
- Keeps the product claim accurate.

## D13: UI Proof Labels

Decision:

- Receipts and event rows should carry `fixture`, `cached`, or `live`.
- In presenter/debug mode, labels are visible.
- In judge-facing mode, live proof cards should still show enough source detail to be credible.

Why:

- Lets the team rehearse safely while preserving honesty.

## D14: Build Order

Decision:

1. Fixture-backed demo shell.
2. Aiven proof spine.
3. Scanner/behavior graph.
4. Aiven Postgres migration and `app_events`.
5. Provider cutover path.
6. Kafka agent bus proof.
7. UI hardening and final report.
8. Rehearsal hardening.

Mission numbers are stable labels, not a reason to delay the browser-critical path. If a second implementer is available, the Kafka agent-bus proof may run in parallel after the Aiven proof spine. If there is one implementer, complete the provider cutover path before replacing the fixture Kafka panel with live Kafka.

Why:

- The story becomes visible immediately.
- Browser-critical functionality is de-risked before cosmetic expansion.
- Kafka stays sponsor-visible but not demo-fragile.

## D15: UI Quality Is Part Of The Proof

Decision:

- The control room UI is a required demo surface, not optional polish.
- Mission 00 must produce a credible stage-ready shell with the cold-open outcome screen, visible proof slots, clear state hierarchy, and readable final report.
- Mission 06 hardens that same shell; it does not rescue a debug-only interface.
- Keep the UI focused and dense, but do not downgrade it into raw logs or internal tooling.
- If time gets tight, cut optional technical breadth before cutting the main visual story.

Why:

- Judges need to understand the autonomous migration in seconds.
- A polished control room makes MCP receipts, Postgres validation, Kafka agent-bus events, and scoped cutover feel like one product.
- The UI is how the behavior migration claim becomes visible.
