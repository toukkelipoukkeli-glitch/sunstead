# Spec Stack

Date: 2026-06-25

## Purpose

This file defines the spec documents required before coding. The goal is spec-driven execution without drowning in process.

Planning depth: T15-25. We need a detailed DAG and contracts, not more strategy exploration.

The canonical entrypoint is [CRITICAL_PATH.md](CRITICAL_PATH.md). Use this file only to understand
which supporting specs own which details.

## Required Docs Before Code

Open [CRITICAL_PATH.md](CRITICAL_PATH.md) first. It links the required docs in implementation order.

### 0. Locked Decisions

Canonical doc: [LOCKED_DECISIONS.md](LOCKED_DECISIONS.md)

Owns:

- final source app choice;
- stack choice;
- demo realtime path;
- Kafka role;
- auth/storage/RLS scope;
- source credential requirements;
- fixture/live/cached labeling;
- build order.

If another doc leaves an option open, `LOCKED_DECISIONS.md` wins.

### 1. Demo Contract

Canonical doc: [DEMO_FLOW.md](../DEMO_FLOW.md)

Owns:

- what judges see;
- the exact live demo order;
- UI headline language;
- what is real versus generated;
- the final report contents.

Do not duplicate the demo script elsewhere. Implementation specs must point back to this.

### 2. UI Decision Package

Canonical doc: [UI_DECISION_PACKAGE.md](UI_DECISION_PACKAGE.md)

Owns:

- control-room visual direction;
- first viewport and cold-open composition;
- component hierarchy;
- proof source label behavior;
- visual quality bar;
- presenter/debug mode;
- responsive rules.

The UI is a required product proof surface, not optional polish. If this doc conflicts with
`DEMO_FLOW.md`, the demo flow wins. If it conflicts with `RUNTIME_CONTRACTS.md`, the runtime
contracts win.

### 3. UI Implementation Spec

Canonical doc: [UI_IMPLEMENTATION_SPEC.md](UI_IMPLEMENTATION_SPEC.md)

Owns:

- sales/front-door route;
- control-room route;
- component-level UI changes;
- CSS token plan;
- visible copy replacements;
- frontend implementation sequence;
- concrete UI acceptance gates.

This is the frontend coding handoff. It is subordinate to `UI_DECISION_PACKAGE.md`, `DEMO_FLOW.md`,
and `RUNTIME_CONTRACTS.md`, but it owns the details needed to implement the selected visual
direction quickly.

### 4. Critical Path

Canonical doc: [CRITICAL_PATH.md](CRITICAL_PATH.md)

Owns:

- build order;
- dependency DAG;
- Mission 00 fixture-backed demo shell;
- bottleneck;
- mission acceptance gates;
- kill/fallback conditions.

This is the document that controls what engineers do first.

### 5. Runtime Contracts

Canonical doc: [RUNTIME_CONTRACTS.md](RUNTIME_CONTRACTS.md)

Owns:

- local app topology;
- state machine;
- agent events;
- API endpoints;
- Postgres tables;
- Kafka topics and payloads;
- provider interface;
- environment variables.

This is the file that should prevent "we all imagined a different system."

### 6. MCP And Aiven Contract

Canonical doc: [MCP_AND_AIVEN_CONTRACT.md](MCP_AND_AIVEN_CONTRACT.md)

Owns:

- exact Aiven MCP actions to show;
- which actions must be live;
- which actions can be cached;
- receipt shape;
- fallback behavior when Aiven/Kafka is slow.

This protects sponsor scoring.

### 7. Verification Runbook

Canonical doc: [VERIFICATION_RUNBOOK.md](VERIFICATION_RUNBOOK.md)

Owns:

- pre-demo checklist;
- test commands;
- smoke tests;
- acceptance criteria;
- stage timing;
- fallback plan.

This protects the live pitch.

### 8. Live Aiven Verification Gate

Canonical doc: [live-aiven-verification-gate/README.md](live-aiven-verification-gate/README.md)

Owns:

- M05.5 verification script contract;
- live M01/M03/M05 API sequence;
- hard pass/fail assertions;
- Kafka warning policy;
- secret-safe terminal output;
- first live-result tracker update.

This protects the build from polishing a cached path that has not passed real Aiven Postgres and
scoped cutover proof.

## Useful But Not Blocking

Add only if time permits:

- `PITCH_SCRIPT.md` — 4-minute pitch and 1-minute Q&A answers.
- `POST_HACKATHON_ROADMAP.md` — how this becomes the real Aiden product.

These should not block coding the critical path.

## Document Ownership Rules

- Strategy belongs in architecture docs, not code tickets.
- Final implementation choices belong in `LOCKED_DECISIONS.md`.
- Demo wording belongs in `DEMO_FLOW.md`.
- UI direction belongs in `UI_DECISION_PACKAGE.md`.
- UI implementation details belong in `UI_IMPLEMENTATION_SPEC.md`.
- Exact contracts belong in `RUNTIME_CONTRACTS.md`.
- Aiven proof belongs in `MCP_AND_AIVEN_CONTRACT.md`.
- Build ordering belongs in `CRITICAL_PATH.md`.
- Verification belongs in `VERIFICATION_RUNBOOK.md`.
- Focused live M01/M03/M05 verification belongs in `live-aiven-verification-gate/README.md`.

If a fact appears in two places, one must clearly be canonical.

## Ready-To-Code Gate

Code can begin when these are true:

- `LOCKED_DECISIONS.md` is read and followed.
- `CRITICAL_PATH.md` defines Mission 00 through Mission 07.
- `UI_DECISION_PACKAGE.md` defines the stage-facing control-room shape.
- `UI_IMPLEMENTATION_SPEC.md` defines the concrete frontend route/component/style changes.
- `RUNTIME_CONTRACTS.md` defines enough interfaces to scaffold the repo.
- `MCP_AND_AIVEN_CONTRACT.md` defines at least one live MCP write and one live Kafka roundtrip.
- `VERIFICATION_RUNBOOK.md` defines how to prove the demo works.
- `live-aiven-verification-gate/README.md` defines the immediate live Aiven gate after M05 scaffold work.

First code target:

- implement Mission 00 before live integrations;
- drive the UI from fixture `RunEvent[]` data;
- make every fixture slot replaceable by live events without changing the demo flow.
