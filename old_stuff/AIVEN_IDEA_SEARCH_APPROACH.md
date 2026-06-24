# Aiven Idea Search Approach

## Current Classification

- Detected hackathon type: technical-first, sponsor-needs.
- Judging/submission mode: Aiven partner selection, then 4-minute pitch and 1-minute Q&A.
- Target track: Aiven main challenge, with optional side-track wrappers only if they do not distract.
- Core demo flow: not chosen yet.
- Intentionally cut for now: finished UI concepts, generic dashboards, and impressive simulations without a real user problem.

## North Star

Find a real workflow where backend or data-infrastructure setup is the thing preventing an AI agent from being useful.

The idea should not start from:

> What cool thing can Kafka and Postgres power?

It should start from:

> What painful data-infra workflow becomes radically different when agents can directly operate managed open-source infrastructure through Aiven MCP?

## Sponsor Reading

Aiven likely wants proof that MCP changes the relationship between agents and the data layer.

The winning demo should show that agents can avoid or replace manual work such as:

- backend API glue
- Terraform or console clicking
- SQL admin scripts
- Kafka setup
- pipeline wiring
- operational diagnosis
- query tuning
- app/data deployment handoff

The Aiven MCP action log should be part of the demo, not a hidden implementation detail.

## Candidate Gates

Every candidate must pass these before we build around it:

1. Who has this problem on Monday morning?
2. What do they do today instead?
3. Why is that painful, slow, risky, or expensive?
4. Why does Aiven MCP matter specifically?
5. Are Kafka, Postgres, service management, metrics, logs, or query tools load-bearing?
6. Do agents make real autonomous choices, not just execute a script?
7. Can judges understand the before/after in under 90 seconds?
8. Is it surprising enough to beat a plain DevOps assistant or data detective?

Kill or reframe any idea that cannot answer these cleanly.

## Rubric Scoring

Score every candidate before falling in love with it.

| Criterion | Weight | What High Score Looks Like |
| --- | ---: | --- |
| Depth of MCP Integration | 34% | Several Aiven MCP tool families are visibly used to achieve the goal. |
| Workflow Autonomy | 33% | Agents decide, coordinate, act, verify, and adapt without normal backend code. |
| Creativity & Impact | 33% | The problem is real, the demo is memorable, and the solution is not an obvious prompt example. |

Reject candidates that score high in only one dimension.

## Search Loop

1. List painful workflows involving data infrastructure under time pressure.
2. For each, name the user, current workaround, and failure mode.
3. Force Aiven MCP to be the agent's hands:
   - Kafka for coordination, events, and live state changes.
   - PostgreSQL for memory, artifacts, state, and analysis.
   - Core MCP tools for service lifecycle and infrastructure changes.
   - Metrics, logs, query stats, and optimization tools for operational feedback.
4. Score against the rubric.
5. Kill anything that could be a normal CRUD app or chatbot.
6. Prefer ideas where the MCP action ledger is itself exciting to watch.
7. Only then choose the 3-minute happy path.

## Starting Problem Territories

These are territories, not final ideas:

- Data migration and cutover commander.
- Schema and data-contract negotiator.
- Incident evidence builder.
- Temporary operations backend generator.
- Autonomous data QA and failure lab.
- Compliance or audit trail builder for live data changes.
- Agent-to-agent work marketplace backed by streams and durable memory.

## Current Bottleneck

The bottleneck is not implementation.

The bottleneck is finding a problem where:

- the pain is obvious,
- the workflow is naturally data-infra heavy,
- agent autonomy is credible,
- Aiven MCP is visibly essential,
- and the story still feels original.
