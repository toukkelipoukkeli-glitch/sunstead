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
- Core demo: PulseWall starts on Lovable/Supabase -> one click `Graduate To Aiven` -> agents scan behavior -> create Aiven shadow data plane through MCP -> migrate/validate data -> route demo realtime through Aiven Postgres `app_events` -> validate Aiven Kafka as the agent bus / production event path -> cut over scoped demo runtime through local adapter -> final proof package.
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
10. [END_TO_END_DEMO_SETUP_CHECKLIST.md](END_TO_END_DEMO_SETUP_CHECKLIST.md) — setup checklist for local, Aiven, fixture, fallback, and rehearsal prep.
11. [SPEC_STACK.md](SPEC_STACK.md) — map of which specs exist and what each owns.

## Mission Table

| # | Mission | Status | T | A | Notes |
| --- | --- | --- | ---: | ---: | --- |
| 00 | Fixture-backed demo shell | BUILT | 14 | 95 | Full `Graduate To Aiven` story visible immediately, driven by `RunEvent[]` fixtures |
| 01 | Aiven proof spine | BUILT / LIVE CREDS PENDING | 15 | 90 | Replace fixture receipts with MCP receipts, Postgres writes/reads, Kafka topic/message roundtrip |
| 02 | PulseWall scanner + behavior graph | BUILT | 12 | 75 | Replace fixture behavior map with deterministic scanner over real files and migrations |
| 03 | Aiven Postgres data migration | BUILT / LIVE CREDS PENDING | 18 | 85 | Replace fixture row counts with tables, sample rows, validation counts, receipts |
| 04 | Kafka agent bus proof | DEFINED | 16 | 90 | Replace fixture bus with real Aiven Kafka `migration.events` produce/list |
| 05 | Provider cutover + Postgres events | BUILT / LIVE CREDS PENDING | 24 | 95 | Replace fixture cutover with scoped runtime reads/events from local adapter -> Aiven PG |
| 05.5 | Live Aiven verification gate | DEFINED | 10 | 95 | One repeatable command proves M01/M03/M05 live before Kafka/UI polish |
| 06 | Control room UI hardening + final report | DEFINED | 12 | 80 | Polish already-visible shell, proof package, cost/CTO card |
| 07 | Rehearsal hardening | DEFINED | 12 | 95 | Preflight, fallback, recorded backup, timing |

## Critical Bottleneck

Current build bottleneck: **provider cutover + Postgres events -> browser delivery after cutover**.

Why:

- It is the hero beat judges can see in the app.
- It proves Supabase Realtime behavior was migrated for the scoped demo path.
- It is now lower risk than Kafka-to-browser, but still depends on local adapter runtime, Aiven Postgres writes/reads, `/api/events/recent` polling, and frontend state.
- Kafka remains visible and sponsor-relevant as the agent bus and production event-bus proof.

The build should still start with Mission 00 so the demo story is visible and timing can be rehearsed. Then attack the Postgres-events cutover path early, before cosmetic polish.

Mission 04 may run in parallel if someone else owns it. With one implementer, do not let Kafka work delay Mission 05.

## To Continue

Start with [CRITICAL_PATH.md](CRITICAL_PATH.md), then run the focused [M05.5 live Aiven verification gate](live-aiven-verification-gate/README.md), then Mission 04/06.

Mission 00 is allowed to be nearly hardcoded, but it must use the final runtime contracts:

- one `Graduate To Aiven` action;
- one `RunEvent[]` event stream;
- fixture behavior map;
- fixture Aiven receipts;
- fixture Kafka agent bus;
- fixture validation cards;
- fixture final report.

After Mission 00, replace fixture blocks in this order:

- Aiven MCP receipt write.
- Aiven Postgres validation read.
- Local adapter can serve one Aiven-backed read.
- Local adapter can deliver one Aiven Postgres `app_events` event to the browser.
- Aiven Kafka produce/list roundtrip appears in the agent-bus panel.

Do not start broad decorative expansion until the replacement order above has begun. Mission 00 still must follow [UI_DECISION_PACKAGE.md](UI_DECISION_PACKAGE.md): the shell should feel stage-ready from the first fixture build, and the hard work is making each proof card both legible and truthful.
