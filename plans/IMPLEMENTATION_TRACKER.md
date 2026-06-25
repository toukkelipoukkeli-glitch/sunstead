# Implementation Tracker

Date: 2026-06-25

Current phase: Mission 04 complete for cached/scaffold path; Mission 05.5 live Aiven verification gate remains next.

## Status

| Area | Status | Notes |
| --- | --- | --- |
| Root workspace | Complete | `npm install` succeeded; root `npm run dev` is configured for `src/apps/*` and `src/packages/*` with strict demo-port preflight. |
| Shared contracts | Complete | Contracts package typechecks. |
| Fixture data | Complete | Full cold-open -> report story exists. |
| Local API | Complete | Fixture run player and adapter endpoints typecheck. |
| Aiven proof spine | M01 scaffold complete after review fixes | `/api/runs/:runId/proof-spine` runs project visibility, Postgres receipt readback, and Kafka agent-bus proof independently. Missing env returns explicit cached/skipped proof without fixture leakage. |
| Aiven MCP config | Complete | Project `.codex/config.toml` configures Codex for the hosted Aiven MCP server; root `.mcp.json` keeps the raw server descriptor. Docs require redaction and keep secrets out of repo/browser output. |
| PulseWall scanner | M02 complete | Deterministic scanner reads `demo/pulsewall`, detects Supabase behavior, and replaces the behavior map through `/api/runs/:runId/source-scan`. |
| Aiven Postgres data migration | M03 cached/scaffold complete | `/api/runs/:runId/data-migration` creates/loads/validates the scoped PulseWall dataset when `AIVEN_POSTGRES_URL` is present; missing env returns cached/skipped row proof. |
| Kafka agent bus | M04 cached/scaffold complete | `/api/runs/:runId/kafka-agent-bus` publishes the current workflow timeline to Aiven Kafka when configured, otherwise returns explicit cached/skipped Kafka bus events. The source app does not need Kafka. |
| Provider cutover | M05 cached/scaffold complete | `/api/runs/:runId/provider-cutover` smoke-tests the Aiven provider and switches adapter routes only after Aiven Postgres read/write/event readback passes. Missing env leaves adapter on fixture and emits cached/skipped proof. |
| Live Aiven verification | M05.5 defined | [`plans/live-aiven-verification-gate/README.md`](live-aiven-verification-gate/README.md) defines the repeatable `npm run verify:live` gate for proving M01/M03/M05 live. |
| Control room UI | Complete | Stage-facing scaffold panels, proof lanes, outcome rail, presenter controls, and `Run live proof` / `Scan source` / `Migrate data` / `Kafka bus` / `Cutover app` actions typecheck. |
| Verification | Complete for M04 missing-env path | Typecheck, Vite build, M04 API smoke, and full presenter replacement smoke passed. Live Aiven proof/data/cutover/Kafka await real Aiven env vars. Browser screenshot check pending because Playwright is not installed locally. |

## Mission 00 Acceptance

- [x] `npm run dev` has strict preflight for the expected local API and control-room ports.
- [x] Cold-open outcome renders in the control-room app source and fixture report.
- [x] `Graduate To Aiven` plays the full fixture run.
- [x] Manual presenter controls can advance/reset/pause the run.
- [x] Every panel is wired to typed fixture data.
- [x] `/api/posts`, `/api/reactions`, and `/api/events/recent` work with fixture data.
- [x] Final report renders from a `Report` object.
- [x] No Aiven/Supabase secret is needed.
- [ ] UI has no obvious overlap, overflow, cramped controls, or placeholder proof cards.

## Mission 01 Acceptance

- [x] Aiven proof package can attempt project/service visibility through the Aiven API.
- [x] Aiven Postgres proof can create receipt tables, write a run-scoped receipt, read it back, and emit live receipts/checks when configured.
- [x] Aiven Kafka proof can create/reuse `migration.events`, produce an agent event, observe it with a consumer, and emit live receipts/checks when configured.
- [x] Missing Aiven env vars produce explicit cached/skipped receipts, checks, and proof events.
- [x] Cached proof is labeled as cached in the snapshot/UI contract.
- [x] Fixture receipts/checks do not leak into cached/live proof-only runs.
- [x] Configured expected Aiven services must be found for project/service verification to pass.
- [x] Proof events replace matching fixture proof events so the presenter story remains a 14-event flow.
- [x] Control room has a visible `Run live proof` presenter action.
- [x] Proof cards require `ok` events before showing Postgres/Kafka ready.
- [ ] Live Aiven credentials configured and verified against real Aiven services.

## Mission 02 Acceptance

- [x] Scanner reads real `demo/pulsewall/` files without LLM dependency.
- [x] Scanner detects tables, realtime, auth, storage, RLS, edge functions, RPC, triggers, and pgvector.
- [x] Scanner produces deterministic typed JSON with file refs and behavior findings.
- [x] Behavior findings include every row needed by the existing behavior map.
- [x] `POST /api/runs/:runId/source-scan` replaces scan timeline events with `source: live`.
- [x] `Graduate To Aiven` runs/preserves the live source scan inside the one-click path.
- [x] Manual `Scan source` replaces scan events without stopping the active playback timer.
- [x] Source-scan summaries are derived from actual scanner detections, not hardcoded claims.
- [x] Control room has a visible `Scan source` presenter action.
- [x] Behavior rows show compact source references so judges can see real evidence.
- [ ] Decide later whether the top-level run mode should summarize mixed evidence or stay as the overall proof mode.

## Mission 03 Acceptance

- [x] Aiven data migration runner can create scoped demo tables for `posts`, `reactions`, `demo_users`, and `app_events`.
- [x] Runner builds a deterministic scoped dataset matching the visible validation contract: 40 posts, 120 reactions, 8 demo users, 2 app events.
- [x] Runner writes migration receipts and validation checks when configured.
- [x] Missing `AIVEN_POSTGRES_URL` produces cached/skipped schema, row validation, receipt, and smoke-query proof.
- [x] `POST /api/runs/:runId/data-migration` replaces `migration.schema.applied` and `migration.rows.validated` events.
- [x] Control room has a visible `Migrate data` presenter action.
- [x] Full presenter-path M03 smoke keeps the run at 14 events while replacing data-migration events.
- [ ] Live Aiven Postgres credentials configured and verified with real table creation/load/counts.

## Mission 04 Acceptance

- [x] `RunSnapshot` has a dedicated `kafkaEvents` stream separate from the main 14-event timeline.
- [x] `POST /api/runs/:runId/kafka-agent-bus` replaces the Kafka panel data without requiring the source app to use Kafka.
- [x] Missing Kafka env vars produce cached/skipped Kafka bus events, receipts, and checks instead of fixture leakage.
- [x] Kafka proof receipts use produce and consume semantics; consumer observation is not labeled as message list.
- [x] Control room has a visible `Kafka bus` presenter action.
- [x] Kafka panel renders the dedicated bus stream with status and source labels.
- [ ] Live Aiven Kafka credentials configured and verified with real `migration.events` produce/consume for workflow transitions.

## Mission 05 Acceptance

- [x] `aivenProvider` exists behind the local adapter and keeps Aiven credentials server-side.
- [x] Adapter routes can switch between fixture provider and Aiven provider.
- [x] `GET /api/adapter/status` reports current adapter mode.
- [x] `POST /api/runs/:runId/provider-cutover` tests Aiven-backed post reads, reaction writes, and `app_events` readback before switching the adapter.
- [x] Missing `AIVEN_POSTGRES_URL` emits cached/skipped realtime and cutover proof.
- [x] Missing-env cutover keeps adapter routes on fixture mode.
- [x] Control room has a visible `Cutover app` presenter action.
- [x] Source app panel changes copy/chip after successful cutover so the scoped runtime path is visible.
- [x] Full presenter-path M05 smoke keeps the run at 14 events while replacing cutover/realtime events.
- [ ] Live Aiven Postgres credentials configured and verified with real provider read/write/event polling.

## Log

- Started Mission 00 scaffold from `plans/SCAFFOLD_STUB_PLAN.md`.
- Added root npm workspace with API, control-room app, and shared packages.
- Added contracts, fixtures, stub PulseWall provider, local API, and control-room panels.
- Ran `npm run typecheck`; all workspaces passed.
- Moved scaffold implementation source under root `src/`.
- Verified `npm run dev` boots API on `:8787` and control room on `:5173` when those ports are free.
- Verified `/api/health`, `/api/runs`, `/api/runs/:runId/graduate`, `/api/posts`, `/api/reactions`, `/api/events/recent`, and `/api/runs/:runId/report`.
- Fixture playback reaches `report_ready` with 14 events.
- Tried Playwright screenshot; canceled browser download because it was too slow. Manual browser QA remains.
- Brought stub UI in line with `plans/UI_DECISION_PACKAGE.md`: command strip, proof lanes, outcome rail, proof source badges, validation cards, and presenter controls.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Replaced Vite port fallback with strict `:5173` startup; surprise `:5174` demo URLs are now blocked by preflight.
- Started Mission 01 live Aiven proof spine.
- Added `@aiden/aiven-ops` implementation using Aiven REST, `pg`, and `kafkajs`.
- Added `POST /api/runs/:runId/proof-spine`.
- Added control-room `Run live proof` action to presenter controls.
- Verified missing-env M01 route returns cached/skipped proof instead of fake live success.
- Verified full presenter path remains 14 events after running M01 proof.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Upgraded the visual shell toward the full UI vision: operational palette, stronger cold-open path summary, real PulseWall image preview, sharper Aiven landing-zone panel, and more polished proof/report card hierarchy.
- Updated `UI_DECISION_PACKAGE.md` with the Aiven Console onboarding direction: white/muted surfaces, small radii, restrained borders, console-native action accents, indigo technical accent, reduced AI/agent wording, and migration-report/table-first surfaces.
- Refined the UI direction after inspecting the Aiven homepage: sales/front-door surfaces should use Aiven's black hero, bright green CTA, real product screenshot/video, service cards, and TCO/comparison proof; the control room should remain Aiven Console/Aquarium-like with white/muted operational detail.
- Added `UI_IMPLEMENTATION_SPEC.md` as the concrete frontend handoff for the sales opener, control-room route, visual tokens, component changes, copy replacements, and UI acceptance gates.
- Added progressive proof gating so receipts, checks, row validations, and final report copy appear only after the corresponding run events.
- Added deterministic PulseWall fixture reset for new runs and presenter reset.
- Verified `node scripts/check-ports.mjs` fails clearly when `:8787` and `:5173` are occupied and passes with alternate `PORT`/`VITE_PORT`.
- Ran API smoke on `:8877`: create run, immediate first event, reaction mutation, fixture reset, manual stepping to `report_ready`, progressive receipts/checks, and final report all passed.
- Fixed M01 review issues: snapshot mode now supports `cached`, fixture proof gating uses event triggers instead of wall-clock timestamps, proof-only cached runs return non-idle completion, expected Aiven services are enforced, and Kafka smoke subscribes from latest messages.
- Restored the missing `@aiden/migration-core` stub source so workspace typecheck covers every package.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Re-ran API smoke on `:8877`: missing-env M01 proof returned `mode: cached`, 5 cached proof events, 3 cached receipts, 3 cached checks, and zero fixture row validations.
- Re-ran fixture-flow smoke on `:8877`: full fixture run reached `report_ready` with 14 events, 10 fixture receipts, and 7 fixture checks.
- Started Mission 02 PulseWall scanner + behavior graph.
- Added deterministic scanner in `@aiden/migration-core` for Supabase client calls and SQL migration markers.
- Added behavior scan result contract and live behavior findings for tables, realtime, auth, storage, RLS, edge function, RPC, and pgvector.
- Added `POST /api/runs/:runId/source-scan`.
- Added control-room `Scan source` presenter action and compact source refs in behavior rows.
- Direct scanner smoke detected 12 files, 8 behavior findings, tables `posts/reactions`, realtime tables `posts/reactions`, storage bucket `post-images`, edge function `embed`, RPC `match_posts`, RLS tables `posts/reactions`, trigger `bump_reaction_count`, and pgvector.
- API scanner smoke returned 3 live scan events and 8 live behavior findings with source refs.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Full presenter-path scanner smoke kept the run at 14 events while replacing scan events with `source: live` and 8 live behavior findings.
- Fixed M02 review issues: one-click graduation now runs or preserves live source-scan output, manual scan no longer freezes fixture playback, scan-only calls finish as a completed operation, and scan summaries list the actual detected behaviors.
- Added a code TODO for the nuanced mixed-evidence label decision: behavior rows/events keep their own source labels for now; top-level run mode remains an overall proof-mode label until we choose the UX.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Re-ran M02 API smoke on `:8877`: scan-only returned complete with 8 live findings; `Graduate To Aiven` returned live scan events and continued playback; manual `Scan source` replaced scan events without freezing playback.
- Started Mission 03 Aiven Postgres data migration.
- Added `DataMigrationResult` contract and Aiven data migration runner in `@aiden/aiven-ops`.
- Added deterministic scoped PulseWall dataset builder for 40 posts, 120 reactions, 8 demo users, and 2 app events.
- Added `POST /api/runs/:runId/data-migration`.
- Added control-room `Migrate data` presenter action.
- Missing-env M03 smoke returned `mode: cached`, 2 cached migration events, 4 cached row validations, cached row-count/smoke checks, and cached Postgres receipts.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Full presenter-path M03 smoke kept the run at 14 events while replacing data-migration events and row validations with cached/skipped proof.
- Started Mission 05 provider cutover + Postgres events.
- Added Aiven-backed PulseWall provider in `@aiden/pulsewall-adapter` for `posts`, `leaderboard`, `reactions`, and `app_events`.
- Added adapter runtime switching in the API so browser routes stay stable while the server-side provider changes.
- Added `GET /api/adapter/status`.
- Added `POST /api/runs/:runId/provider-cutover`.
- Added control-room `Cutover app` presenter action.
- Missing-env M05 smoke returned `mode: cached`, 2 cached cutover/realtime events, 2 cached checks, 2 cached receipts, and adapter mode `fixture`.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Full presenter-path M05 smoke kept the run at 14 events while replacing realtime/cutover events with cached/skipped proof and leaving adapter mode `fixture`.
- Defined Mission 05.5 live Aiven verification gate in `plans/live-aiven-verification-gate/README.md` and linked it from the critical path/spec stack.
- Added root `.mcp.json` for hosted Aiven MCP and updated MCP/live-verification docs to treat it as the primary control-plane configuration while keeping secret redaction mandatory.
- Added project-scoped `.codex/config.toml` with `[mcp_servers.aiven]` so Codex CLI/IDE can initialize the hosted Aiven MCP server for this trusted repo.
- Started Mission 04 dedicated Kafka agent-bus proof.
- Added `KafkaAgentBusResult` and `RunSnapshot.kafkaEvents` so Kafka-observed workflow events do not share the normal timeline feed.
- Added `POST /api/runs/:runId/kafka-agent-bus` with cached/skipped fallback and live Kafka produce/consume implementation for workflow transition events.
- Added control-room `Kafka bus` presenter action and switched the Kafka panel to the dedicated bus stream.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Ran M04 API smoke on `:8877`: full fixture flow stayed at 14 timeline events, `/kafka-agent-bus` returned 10 cached/skipped Kafka bus events, and Kafka receipts used produce/consume tools.
