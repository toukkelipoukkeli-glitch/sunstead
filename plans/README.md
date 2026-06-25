# Aiden Plans

Date: 2026-06-25

## Start Here

The canonical grand entrypoint and implementation roadmap is:

> [CRITICAL_PATH.md](CRITICAL_PATH.md)

If you are assigning work, coding, rehearsing, or deciding what to cut, start there.

## Navigation State

LOCATE: emerging but aligned; close enough to ground.

The demo flow and migration core are locked. We are no longer exploring the idea. We are converting the idea into a visible fixture-backed demo shell first, then replacing fixture blocks with live Aiven/Supabase actions behind the same contracts.

Hackathon frame:

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo: PulseWall starts on Lovable/Supabase -> one click `Graduate To Aiven` -> agents scan behavior -> verify an Aiven shadow data plane with labeled receipts -> migrate/validate data -> route demo realtime through Aiven Postgres `app_events` -> show the Kafka workflow-events slot live when configured or cached/warning otherwise -> cut over scoped demo runtime through local adapter -> final proof package.
- Intentional cuts: production auth migration, production storage migration, full CDC, all source platforms, Aiven Apps deployment, and complex agent framework.

## Canonical Inputs

| Doc | Role |
| --- | --- |
| [DEMO_FLOW.md](../DEMO_FLOW.md) | Canonical user-facing demo script and pitch flow |
| [STATUS.md](../STATUS.md) | Current state and locked decisions |
| [LOCKED_DECISIONS.md](LOCKED_DECISIONS.md) | Canonical no-more-reopening implementation decisions |
| [BUILD_PLAN.md](../BUILD_PLAN.md) | Honest difficulty and implementation order |
| [ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md](ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md) | Product architecture and agent model |
| [AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md](AIVEN_BEHAVIOR_MIGRATION_ANALYSIS.md) | Strategy analysis and behavior migration framing |
| [LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md](../migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md) | Real migration mechanics |

## Spec Stack

Read these in order before code:

1. [CRITICAL_PATH.md](CRITICAL_PATH.md) — canonical entrypoint, implementation order, bottlenecks, and acceptance gates.
2. [LOCKED_DECISIONS.md](LOCKED_DECISIONS.md) — final choices; if docs conflict, this wins.
3. [DEMO_FLOW.md](../DEMO_FLOW.md) — what judges see.
4. [UI_DECISION_PACKAGE.md](UI_DECISION_PACKAGE.md) — stage-facing control-room design, proof hierarchy, and UI acceptance gates.
5. [UI_IMPLEMENTATION_SPEC.md](UI_IMPLEMENTATION_SPEC.md) — concrete UI routes, components, visual tokens, copy replacements, and build order.
6. [RUNTIME_CONTRACTS.md](RUNTIME_CONTRACTS.md) — state machine, events, data models, env vars, and provider boundaries.
7. [MCP_AND_AIVEN_CONTRACT.md](MCP_AND_AIVEN_CONTRACT.md) — exact Aiven proof actions and fallback rules.
8. [VERIFICATION_RUNBOOK.md](VERIFICATION_RUNBOOK.md) — demo preflight, test gates, fallbacks, and stage runbook.
9. [live-aiven-verification-gate/README.md](live-aiven-verification-gate/README.md) — focused M05.5 spec for proving M01/M03/M05 against live Aiven.
10. [access-broker-permission-ux/README.md](access-broker-permission-ux/README.md) — visible permission preflight, access snapshot contract, and setup/product-action split.
11. [aiven-workspace-bootstrap/README.md](aiven-workspace-bootstrap/README.md) — M06B spec for connect/create Aiven workspace framing; current runtime creates a fresh Aiven Postgres service per run.
12. [source-intake-workspace-setup/README.md](source-intake-workspace-setup/README.md) — M06C spec for source selection, source data path, workspace selection, and scope confirmation before the control room.
13. [GENERAL_LOVABLE_TO_AIVEN_MIGRATION_SPEC.md](GENERAL_LOVABLE_TO_AIVEN_MIGRATION_SPEC.md) — product-generalization plan and implemented first slice for setup profile, generic scanner API, manifest path, and executor roadmap.
14. [one-click-agent-runtime/README.md](one-click-agent-runtime/README.md) — M05.6 spec for turning `Graduate To Aiven` into a bounded one-click agent run.
15. [anthropic-agent-sdk-reasoner/README.md](anthropic-agent-sdk-reasoner/README.md) — M05.7 spec for Anthropic Agent SDK as the bounded Aiven MCP Report/CTO Agent.
16. [END_TO_END_DEMO_SETUP_CHECKLIST.md](END_TO_END_DEMO_SETUP_CHECKLIST.md) — setup checklist for local, Aiven, fixture, fallback, and rehearsal prep.
17. [SPEC_STACK.md](SPEC_STACK.md) — map of which specs exist and what each owns.

## Mission Table

| # | Mission | Status | T | A | Notes |
| --- | --- | --- | ---: | ---: | --- |
| 00 | Fixture-backed demo shell | BUILT | 14 | 95 | Full `Graduate To Aiven` story visible immediately, driven by `RunEvent[]` fixtures |
| 01 | Aiven proof spine | LIVE PG VERIFIED / DIRECT FALLBACK | 15 | 90 | Live Postgres receipts/readback pass; Agent SDK owns Aiven MCP context and direct fallback remains labeled for data-plane actions |
| 02 | PulseWall scanner + behavior graph | BUILT | 12 | 75 | Replace fixture behavior map with deterministic scanner over real files and migrations |
| 03 | Aiven Postgres data migration | LIVE PG VERIFIED | 18 | 85 | Live Aiven Postgres row counts pass through `npm run verify:live` |
| 04 | Kafka agent bus proof | BUILT / OPTIONAL LIVE CREDS PENDING | 16 | 90 | Dedicated Kafka bus endpoint/panel exists; live Aiven Kafka env is optional and warning-only until configured |
| 05 | Provider cutover + Postgres events | LIVE PG VERIFIED | 24 | 95 | Scoped runtime reads/writes/events pass against Aiven PG |
| 05.5 | Live Aiven verification gate | LIVE PG PASSED / KAFKA ENV PENDING | 10 | 95 | `npm run verify:live` passes the Postgres runtime path; Kafka is warning-only until configured |
| 06A | Access broker permission UX | LIVE PG VERIFIED | 10 | 90 | Access Broker panel, preflight route, button gating, Kafka warning, and production not-requested states are implemented |
| 05.6 | One-click agent runtime | LIVE PG VERIFIED | 12 | 90 | `Graduate To Aiven` runs the bounded workflow end to end; Anthropic SDK is report-only and Kafka warning-only |
| 05.7 | Anthropic Agent SDK reasoner | LIVE VERIFIED | 6 | 90 | Agent SDK receives Aiven MCP directly, uses allowlisted tools, and falls back deterministically |
| 06 | Control room UI hardening + final report | BUILT / LIVE PG VERIFIED | 12 | 85 | Final report memo, timeline status states, realtime/Kafka proof clarity, validation pending states |
| 06B | Aiven workspace bootstrap framing | BUILT / FRESH PG PROVISIONING | 4 | 95 | Setup is framed as connect Aiven account/project, then create a fresh Aiven Postgres target per run without committing secrets |
| 06C | Source intake and workspace setup | BUILT / FRESH PG PROVISIONING | 5 | 95 | `/setup` is the default entry surface and shows PulseWall plus fresh Aiven landing-zone creation as selected choices, not hidden hardcoding |
| 07 | Rehearsal hardening | BUILT / LIVE PG VERIFIED | 12 | 95 | `demo:preflight`, `demo:reset`, `demo:fallback`, and two-run `demo:rehearse` pass |

## Critical Bottleneck

Current build bottleneck: **final manual capture**.

Why:

- The live Aiven Postgres migration and scoped cutover path now pass verification.
- The access-rights inquiry now appears as a product step before the one-click action.
- The visible `Graduate To Aiven` product action now orchestrates the whole workflow.
- Judges can see one autonomous operator run with source intake, workspace-first setup, a visible permission preflight, and a finished readiness memo; the demo now feels like a product journey rather than a preloaded dashboard.
- Kafka remains visible and sponsor-relevant as the agent bus and production event-bus proof, but it can stay warning-only unless credentials arrive.

Mission 05.6, Mission 05.7, Mission 06A, Mission 06B, Mission 06C, Mission 06, and Mission 07 have landed. Final screenshots/recording are next.

## To Continue

Start with [CRITICAL_PATH.md](CRITICAL_PATH.md), keep the dev server running, rehearse `/setup` -> `/control` -> `Graduate To Aiven`, then capture final screenshots/recording. Kafka can stay warning-only unless Kafka credentials become available quickly.

Mission 00 is allowed to be nearly hardcoded, but it must use the final runtime contracts:

- one `Graduate To Aiven` action;
- one `RunEvent[]` event stream;
- fixture behavior map;
- fixture Aiven receipts;
- fixture Kafka agent bus;
- fixture validation cards;
- fixture final report.

After Mission 00, replace fixture blocks in this order:

- Aiven action receipt write, labeled as direct fallback unless a live MCP action exists.
- Aiven Postgres validation read.
- Local adapter can serve one Aiven-backed read.
- Local adapter can deliver one Aiven Postgres `app_events` event to the browser.
- Aiven Kafka produce/list roundtrip appears in the workflow-events panel when configured; otherwise the cached/warning Kafka slot remains honest.

Do not start broad decorative expansion until the replacement order above has begun. Mission 00 still must follow [UI_DECISION_PACKAGE.md](UI_DECISION_PACKAGE.md): the shell should feel stage-ready from the first fixture build, and the hard work is making each proof card both legible and truthful.
