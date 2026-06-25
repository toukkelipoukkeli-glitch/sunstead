# Implementation Tracker

Date: 2026-06-25

Current phase: final manual capture and pitch rehearsal from `/setup` through `/control`. Mission 06A Access Broker, Mission 06B Aiven workspace bootstrap framing, Mission 06C Source Intake & Workspace Setup, Mission 05.6 one-click runtime, Mission 06 control-room hardening, and Mission 07 rehearsal hardening pass the live Aiven Postgres gate. Kafka env remains optional/pending.

## Status

| Area | Status | Notes |
| --- | --- | --- |
| Root workspace | Complete | `npm install` succeeded; root `npm run dev` is configured for `src/apps/*` and `src/packages/*` with strict demo-port preflight. |
| Shared contracts | Complete | Contracts package typechecks. |
| Fixture data | Complete | Full cold-open -> report story exists. |
| Local API | Complete | Fixture run player and adapter endpoints typecheck. |
| Aiven proof spine | Live PG verified / direct fallback | `/api/runs/:runId/proof-spine` runs project visibility when configured, Postgres receipt readback, and Kafka agent-bus proof independently. Runtime proof uses direct Aiven fallback unless a real MCP action is added. Missing env returns explicit cached/skipped proof without fixture leakage. |
| Aiven MCP config | Complete / runtime fallback labeled | Project `.codex/config.toml` configures Codex for the hosted Aiven MCP server; root `.mcp.json` keeps the raw server descriptor. The API runtime currently labels proof actions as direct Aiven fallback, not live MCP tool calls. |
| PulseWall scanner | M02 complete | Deterministic scanner reads `demo/pulsewall`, detects Supabase behavior, and replaces the behavior map through `/api/runs/:runId/source-scan`. |
| Aiven Postgres data migration | M03 live PG verified | `/api/runs/:runId/data-migration` creates/loads/validates the scoped PulseWall dataset in Aiven Postgres. `npm run verify:live` passed row counts against live Aiven PG. |
| Kafka agent bus | M04 cached/scaffold complete | `/api/runs/:runId/kafka-agent-bus` publishes the current workflow timeline to Aiven Kafka when configured, otherwise returns explicit cached/skipped Kafka bus events. The source app does not need Kafka. |
| Provider cutover | M05 live PG verified | `/api/runs/:runId/provider-cutover` smoke-tests the Aiven provider and switches adapter routes only after Aiven Postgres read/write/event readback passes. `npm run verify:live` passed adapter read/write/event checks live. |
| Live Aiven verification | M05.5 live PG passed / Kafka env pending | `npm run verify:live` validates Codex/Aiven MCP config, then drives M02/M01/M03/M05/M04 and adapter endpoint checks. Live Aiven Postgres path passes; Kafka remains warning-only until Kafka env is configured. |
| Access Broker permission UX | M06A built / live PG verified | `AccessSnapshot`, `/api/runs/:runId/access-preflight`, Access Broker panel, primary-button gating, Kafka warning state, and production not-requested states are implemented. |
| One-click agent runtime | M05.6 live PG verified | [`plans/one-click-agent-runtime/README.md`](one-click-agent-runtime/README.md) is implemented with a bounded orchestrator, typed agent-step registry, deterministic reasoner, and one-click verifier mode. |
| Anthropic Agent SDK reasoner | M05.7 live verified | [`plans/anthropic-agent-sdk-reasoner/README.md`](anthropic-agent-sdk-reasoner/README.md) defines the text-only Report/CTO Agent boundary. `npm run verify:live -- --one-click` passed with `agent sdk reasoner: Anthropic Agent SDK produced proof text`. |
| Control room UI | M06 built / live PG verified | Stage-facing panels, Access Broker, one-click command strip, timeline state badges, realtime/Kafka proof distinction, validation pending states, and final readiness memo typecheck and build. |
| Aiven workspace bootstrap | M06B built / live PG verified | Setup is now framed as connect/create Aiven workspace; the UI says Henri's pre-connected workspace powers the demo and Aiden can create a workspace during setup. |
| Source intake setup | M06C built / live PG verified | [`plans/source-intake-workspace-setup/README.md`](source-intake-workspace-setup/README.md) defines and tracks the `/setup` product step for selecting source app, source data path, Aiven workspace mode, and migration scope before the control room. |
| Rehearsal hardening | M07 built / live PG verified | `demo:preflight`, `demo:reset`, `demo:fallback`, and `demo:rehearse` exist. Two consecutive live one-click rehearsal runs passed and fallback artifacts are generated locally under ignored `artifacts/rehearsal/`. |
| Verification | Complete for M06A/M06B/M06C/M05.6/M06/M07 live PG paths | `npm run typecheck`, Vite build, `npm run verify:live -- --one-click`, `npm run demo:preflight`, `npm run demo:fallback`, and `npm run demo:rehearse` passed. Kafka is skipped with warning because Kafka env vars are not configured. Browser screenshot/recording capture remains manual because no local browser binary is installed. |

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
- [x] Proof cards require `ok` events before showing Postgres ready; Kafka can remain waiting/warning when env is absent.
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
- [x] Live Aiven Postgres credentials configured and verified with real table creation/load/counts.

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
- [x] Live Aiven Postgres credentials configured and verified with real provider read/write/event polling.

## Mission 05.5 Acceptance

- [x] `npm run verify:live` exists.
- [x] Verifier checks project `.codex/config.toml` for `mcp_servers.aiven`.
- [x] Verifier checks root `.mcp.json` for the raw Aiven MCP descriptor.
- [x] Verifier checks Codex MCP OAuth status through `codex mcp list`.
- [x] Missing `AIVEN_POSTGRES_URL` fails fast with a clear message and no secret output.
- [x] Verifier sequence covers source scan, proof spine, data migration, provider cutover, Kafka agent bus, adapter reads/writes/events, and final report.
- [x] Verifier treats Aiven Postgres migration and cutover as hard live gates.
- [x] Verifier treats Kafka as warning-only when Kafka env is missing and required when Kafka env is configured or `--require-kafka` is used.
- [x] `npm run typecheck` passes after verifier implementation.
- [x] `npm exec --workspace @aiden/control-room vite -- build` passes after verifier implementation.
- [x] `AIVEN_POSTGRES_URL` configured and full live M05.5 Postgres/cutover gate passed.
- [ ] Live Kafka credentials configured and full Kafka agent-bus gate passed, if Kafka is available for the final demo.

## Mission 06A Acceptance

- [x] Focused mission spec exists at `plans/access-broker-permission-ux/README.md`.
- [x] Control room visibly separates access setup from the `Graduate To Aiven` product action.
- [x] Access Broker panel shows connected, live-verified, warning, not-requested/later, and blocked permissions with honest labels.
- [x] `POST /api/runs/:runId/access-preflight` returns a typed access snapshot without exposing secrets.
- [x] `Graduate To Aiven` is enabled only when the minimum shadow-migration permissions are satisfied.
- [x] Missing Kafka stays warning-only and does not block the demo-safe path.
- [x] Missing Aiven Postgres blocks graduation with a clear required-access state.
- [x] Existing proof routes remain available as presenter fallback controls.
- [x] UI copy says production app unchanged until scoped cutover proof passes.
- [x] `npm run typecheck` passes after implementation.
- [x] `npm run verify:live` still passes the live Aiven Postgres path after implementation.

## Mission 05.6 Acceptance

- [x] Focused mission spec exists at `plans/one-click-agent-runtime/README.md`.
- [x] `POST /api/runs/:runId/graduate` runs the full bounded agent workflow, not fixture-only playback.
- [x] Typed agent-step registry wraps source scan, proof spine, data migration, cutover, Kafka proof, and final report.
- [x] Presenter can run the main demo with one visible `Graduate To Aiven` click.
- [x] Separate proof buttons remain available as fallback/debug controls.
- [x] Anthropic Agent SDK reasoner is bounded to summaries/report text and cannot mutate infra.
- [x] Missing Anthropic key does not degrade the one-click run.
- [x] `npm run verify:live -- --one-click` passes against the live Aiven Postgres path.
- [x] Kafka remains warning-only when credentials are missing.
- [x] Fixture/live/cached labels remain honest throughout the one-click flow.

## Mission 05.7 Acceptance

- [x] Focused mission spec exists at `plans/anthropic-agent-sdk-reasoner/README.md`.
- [x] `@anthropic-ai/claude-agent-sdk` is installed and imported by the API reasoner path.
- [x] Anthropic reasoner is text/report-only behind the existing `AgentReasoner` interface.
- [x] Agent SDK path disables built-in tools, MCP config, local settings sources, and multi-turn tool loops.
- [x] Deterministic reasoner remains the fallback.
- [x] `npm run typecheck` passes after SDK integration.
- [x] `npm run verify:live -- --one-click` passes with `reasoner: "anthropic_agent_sdk"` or safe fallback metadata.
- [x] Verifier asserts Agent SDK metadata when `ANTHROPIC_API_KEY` is present.

## Mission 06 Acceptance

- [x] `Graduate To Aiven` remains the visible primary action and drives the one-click workflow.
- [x] Access Broker stays visible before the primary action and blocks only required access.
- [x] Timeline events show ok, skipped, and failed status states instead of implying every event passed.
- [x] Realtime proof separates browser-critical Aiven Postgres `app_events` polling from Kafka workflow proof.
- [x] Kafka panel shows warning-only/skipped states when Kafka credentials are not configured.
- [x] Validation panel has a clear pending state before row validation exists.
- [x] Final report renders as a migration readiness memo with readiness, rows, browser path, Aiven actions, Kafka status, blockers, cost, CTO recommendation, rollback, and evidence source.
- [x] `npm run typecheck` passes after M06.
- [x] `npm exec --workspace @aiden/control-room vite -- build` passes after M06.
- [x] `npm run verify:live -- --one-click` passes the live Aiven Postgres path after M06.
- [ ] Browser screenshot QA remains pending because no local Chromium/Chrome/Playwright browser is installed.

## Mission 06B Acceptance

- [x] Focused mission spec exists at `plans/aiven-workspace-bootstrap/README.md`.
- [x] First-screen copy frames setup as Aiven workspace connect/create, not credential collection.
- [x] UI says the demo uses Henri's pre-connected Aiven workspace.
- [x] UI says Aiden can create a workspace during setup if the user has no Aiven account.
- [x] Raw credentials remain in ignored local env/MCP config only; no secrets are committed, printed, or exposed.
- [x] Existing `AccessSnapshot` and `Graduate To Aiven` gates remain unchanged under the hood.
- [x] `npm run verify:live -- --one-click` still passes after copy/UI changes.

## Mission 06C Acceptance

- [x] Focused mission spec exists at `plans/source-intake-workspace-setup/README.md`.
- [x] `/setup` exists and is the default entry surface.
- [x] Setup screen has visible source app choices: PulseWall demo app, GitHub repo, Lovable export.
- [x] Setup screen has visible source data choices: seeded demo data, Supabase DB URL/read-only access, CSV/Lovable Cloud export.
- [x] Setup screen has visible Aiven workspace choices: Henri pre-connected workspace, connect existing workspace, create new workspace.
- [x] Setup screen confirms scope: shadow migration, scoped demo cutover, production cutover not requested.
- [x] Product paths not implemented for the hackathon are visible and honestly labeled.
- [x] `Continue to Control Room` opens the existing `/control` flow.
- [x] Existing `Graduate To Aiven` live one-click path still passes.
- [x] No secrets are shown or committed.

## Mission 07 Acceptance

- [x] One-command preflight exists as `npm run demo:preflight`.
- [x] One-command reset exists as `npm run demo:reset`.
- [x] Live seeded reset passes as `npm run demo:reset:live`.
- [x] Cached/fixture fallback event stream exists as `npm run demo:fallback` and writes ignored local artifacts.
- [x] Two-run rehearsal command exists as `npm run demo:rehearse`.
- [x] `npm run demo:preflight` passed against the running local demo.
- [x] `npm run demo:reset` passed against the running local demo.
- [x] `npm run demo:fallback` passed and wrote fallback run/report/event-stream/card artifacts.
- [x] `npm run demo:rehearse` passed two consecutive live one-click runs.
- [x] Four-minute script and judge Q&A bullets are documented in `plans/VERIFICATION_RUNBOOK.md`.
- [ ] Static screenshots and short recorded backup remain manual capture tasks.

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
- Started Mission 05.5 live Aiven verification gate implementation.
- Added `scripts/verify-live-aiven.mjs` and root `npm run verify:live`.
- Verifier validates `.codex/config.toml`, `.mcp.json`, and Codex MCP OAuth status before live proof.
- Verifier drives `/api/health`, `/api/runs`, source scan, proof spine, data migration, provider cutover, Kafka agent bus, adapter status, posts, leaderboard, reaction write, recent events, and final report.
- Verifier hard-fails non-live Aiven Postgres migration/cutover proof and warning-handles Kafka only when Kafka env is missing.
- Ran `npm run verify:live`; it passed MCP config/auth checks and failed fast at missing `AIVEN_POSTGRES_URL`, as expected on this machine.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Used authenticated Aiven MCP to discover project `henri-2699` and Postgres service `pg-3e23b49c`, then wrote the required Postgres env keys to ignored `.env.local` without committing them.
- Fixed API env loading so `src/apps/aiden-api` reads the repo-root `.env.local` when run as an npm workspace.
- Normalized Aiven Postgres connection strings by removing URL-level `sslmode` before passing explicit `pg` SSL settings; this avoids `pg` treating `sslmode=require` as certificate verification.
- Re-ran `npm run verify:live`; live Aiven Postgres proof, data migration, scoped provider cutover, adapter reads/writes, `app_events` polling, and final report all passed. Project visibility and Kafka remain warnings without REST/Kafka env.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Defined Mission 05.6 one-click agent runtime in `plans/one-click-agent-runtime/README.md` and linked it from the critical path, spec stack, plan dashboard, and tracker.
- Defined Mission 06A Access Broker permission UX in `plans/access-broker-permission-ux/README.md` and linked it from the critical path, spec stack, plan dashboard, and tracker.
- Implemented M05.6 one-click agent runtime with `oneClickOrchestrator.ts`, live/cached/fixture run modes, deterministic reasoner, `/graduate` orchestration, and `/graduate-fixture` fallback.
- Updated the control-room `Graduate To Aiven` action to disable while the one-click route runs, refresh the adapter after completion, and keep presenter controls as fallback/debug actions.
- Added `npm run verify:live -- --one-click` coverage for the product route while preserving the separate-step verifier path.
- Ran `npm run typecheck`; all workspaces passed.
- Ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Ran `API_BASE_URL=http://127.0.0.1:8877 npm run verify:live -- --one-click`; live Aiven Postgres source scan, proof spine, migration, cutover, adapter read/write/event, and final report passed. Kafka warned/skipped because Kafka env is not configured.
- Re-ran `API_BASE_URL=http://127.0.0.1:8877 npm run verify:live`; the separate-step fallback verifier path still passed.
- Implemented Mission 06A Access Broker: added typed `AccessSnapshot`/`AccessCheck` contracts, `/api/runs/:runId/access-preflight`, Access Broker control-room panel, primary `Graduate To Aiven` gating, Kafka warning state, and production not-requested/later states.
- Added access preflight assertions to `scripts/verify-live-aiven.mjs`; live verification now checks access before migration and again after cutover for `aiven_postgres: live_verified`.
- Verified missing `AIVEN_POSTGRES_URL` blocks graduation with `Aiven Postgres` as the clear blocker.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Re-ran `npm run verify:live`; live Aiven Postgres access preflight, migration, scoped cutover, runtime read/write/event proof, and final report passed. Kafka remains warning-only.
- Re-ran `npm run verify:live -- --one-click`; the primary `Graduate To Aiven` route completed the bounded agent workflow against the live Aiven Postgres path.
- Added `plans/anthropic-agent-sdk-reasoner/README.md` to pin Anthropic Agent SDK usage to the text-only Report/CTO Agent boundary.
- Installed `@anthropic-ai/claude-agent-sdk@0.3.191`.
- Replaced the partial direct Anthropic HTTP reasoner path with SDK `query()` using one turn, no built-in tools, no MCP config, no settings sources, and deterministic fallback.
- Re-ran `npm run typecheck`; all workspaces passed.
- Added standalone Claude Code executable resolution because the bundled SDK ARM64 binary crashed with `SIGTRAP` under this WSL environment; the API now prefers `CLAUDE_CODE_EXECUTABLE` or `~/.local/bin/claude` when present.
- Re-ran `npm run verify:live -- --one-click`; the live gate passed with `agent sdk reasoner: Anthropic Agent SDK produced proof text`.
- Re-ran `npm run verify:live`; the separate-step fallback verifier path still passed.
- Fixed proof-label overclaims: Aiven MCP config now shows as cached/configured unless a real MCP action is added, direct Aiven runtime receipts are labeled as direct fallback, and Kafka remains warning/cached unless credentials are configured.
- Updated cold-open outcome so it uses the current run report after successful cutover and shows Kafka as live/configured/warning based on access state.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Re-ran `API_BASE_URL=http://127.0.0.1:8787 npm run verify:live -- --one-click`; live Postgres one-click path passed, Anthropic Agent SDK produced proof text, and Kafka remained warning-only.
- Re-ran `API_BASE_URL=http://127.0.0.1:8787 npm run verify:live`; separate-step live gate passed with Kafka warning-only.
- Defined Mission 06B Aiven Workspace Bootstrap in `plans/aiven-workspace-bootstrap/README.md` and linked it into the critical path, plan index, spec stack, and tracker. The product story is connect/create Aiven workspace; the demo uses Henri's pre-connected workspace without committing raw credentials.
- Implemented Mission 06B copy: first-screen setup is now Aiven Workspace Setup, the command path shows Henri demo workspace, the cold open says Aiden can create a workspace during setup, and backend access proofs use workspace-first labels.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Re-ran `npm run verify:live -- --one-click`; live Postgres one-click path passed, Anthropic Agent SDK produced proof text, and Kafka remained warning-only.
- Implemented Mission 07 rehearsal hardening: `scripts/demo-rehearsal.mjs`, root demo scripts, ignored rehearsal artifacts, fallback event stream/report/card artifacts, four-minute script, and judge Q&A bullets.
- Added a Postgres advisory lock around the live Aiven data migration so repeated rehearsal/reset commands serialize instead of racing on the scoped demo tables.
- Ran `npm run demo:preflight`; local API/control room, access broker, source scan, adapter reset, and artifact write passed.
- Ran `npm run demo:reset`; fixture reset, adapter status, posts, recent events, and artifact write passed.
- Ran `npm run demo:reset:live`; live Aiven Postgres seed reset, provider cutover, adapter status, posts, recent events, and artifact write passed.
- Ran `npm run demo:fallback`; cached fixture fallback run/report/event-stream/card artifacts were written under ignored `artifacts/rehearsal/`.
- Ran `npm run demo:rehearse`; two consecutive live one-click Aiven Postgres rehearsals passed.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Defined Mission 06C Source Intake & Workspace Setup in `plans/source-intake-workspace-setup/README.md` and linked it into the critical path, plan index, spec stack, and tracker. The next build is a `/setup` product screen where PulseWall, seeded demo data, and Henri's Aiven workspace are selected demo profile choices rather than hidden assumptions.
- Implemented Mission 06C Source Intake & Workspace Setup: `/` and `/setup` render `SetupPage`, `/control` remains the control room, selected demo profile choices are visible, product paths are honestly labeled, and `Continue to Control Room` stores a typed browser-side setup profile before navigating.
- Re-ran `npm run typecheck`; all workspaces passed.
- Re-ran `npm exec --workspace @aiden/control-room vite -- build`; build passed.
- Re-ran `npm run verify:live -- --one-click`; live Aiven Postgres one-click path passed, Anthropic Agent SDK produced proof text, and Kafka remained warning-only.
