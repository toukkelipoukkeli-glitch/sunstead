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

### 2. Critical Path

Canonical doc: [CRITICAL_PATH.md](CRITICAL_PATH.md)

Owns:

- build order;
- dependency DAG;
- Mission 00 fixture-backed demo shell;
- bottleneck;
- mission acceptance gates;
- kill/fallback conditions.

This is the document that controls what engineers do first.

### 3. Runtime Contracts

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

### 4. MCP And Aiven Contract

Canonical doc: [MCP_AND_AIVEN_CONTRACT.md](MCP_AND_AIVEN_CONTRACT.md)

Owns:

- exact Aiven MCP actions to show;
- which actions must be live;
- which actions can be cached;
- receipt shape;
- fallback behavior when Aiven/Kafka is slow.

This protects sponsor scoring.

### 5. Verification Runbook

Canonical doc: [VERIFICATION_RUNBOOK.md](VERIFICATION_RUNBOOK.md)

Owns:

- pre-demo checklist;
- test commands;
- smoke tests;
- acceptance criteria;
- stage timing;
- fallback plan.

This protects the live pitch.

## Useful But Not Blocking

Add only if time permits:

- `UI_WIREFRAME_SPEC.md` — exact control-room layout, cards, visual states.
- `PITCH_SCRIPT.md` — 4-minute pitch and 1-minute Q&A answers.
- `POST_HACKATHON_ROADMAP.md` — how this becomes the real Aiden product.

These should not block coding the critical path.

## Document Ownership Rules

- Strategy belongs in architecture docs, not code tickets.
- Final implementation choices belong in `LOCKED_DECISIONS.md`.
- Demo wording belongs in `DEMO_FLOW.md`.
- Exact contracts belong in `RUNTIME_CONTRACTS.md`.
- Aiven proof belongs in `MCP_AND_AIVEN_CONTRACT.md`.
- Build ordering belongs in `CRITICAL_PATH.md`.
- Verification belongs in `VERIFICATION_RUNBOOK.md`.

If a fact appears in two places, one must clearly be canonical.

## Ready-To-Code Gate

Code can begin when these are true:

- `LOCKED_DECISIONS.md` is read and followed.
- `CRITICAL_PATH.md` defines Mission 00 through Mission 07.
- `RUNTIME_CONTRACTS.md` defines enough interfaces to scaffold the repo.
- `MCP_AND_AIVEN_CONTRACT.md` defines at least one live MCP write and one live Kafka roundtrip.
- `VERIFICATION_RUNBOOK.md` defines how to prove the demo works.

First code target:

- implement Mission 00 before live integrations;
- drive the UI from fixture `RunEvent[]` data;
- make every fixture slot replaceable by live events without changing the demo flow.
