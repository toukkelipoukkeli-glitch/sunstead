# Aiden Migration Control Room

Hackathon project for the Aiven challenge.

## Start Here

The canonical implementation roadmap is:

1. [plans/CRITICAL_PATH.md](plans/CRITICAL_PATH.md)
2. [plans/LOCKED_DECISIONS.md](plans/LOCKED_DECISIONS.md)
3. [DEMO_FLOW.md](DEMO_FLOW.md)
4. [plans/UI_DECISION_PACKAGE.md](plans/UI_DECISION_PACKAGE.md)
5. [plans/RUNTIME_CONTRACTS.md](plans/RUNTIME_CONTRACTS.md)
6. [plans/MCP_AND_AIVEN_CONTRACT.md](plans/MCP_AND_AIVEN_CONTRACT.md)
7. [plans/VERIFICATION_RUNBOOK.md](plans/VERIFICATION_RUNBOOK.md)

If docs conflict, follow [plans/CRITICAL_PATH.md](plans/CRITICAL_PATH.md) for mission order and [plans/LOCKED_DECISIONS.md](plans/LOCKED_DECISIONS.md) for final product choices.

## Current Build Target

Build Mission 00 first:

> Fixture-backed `Graduate To Aiven` demo shell using the final runtime contracts.

Then replace fixture blocks with live proof in this order:

1. Aiven MCP/Postgres receipt write and read.
2. Aiven Postgres migrated rows and validation counts.
3. PulseWall scanner and behavior graph.
4. Local adapter reading from Aiven Postgres.
5. Aiven Postgres `app_events` browser polling proof.
6. Aiven Kafka `migration.events` agent-bus proof.
7. Final report, cost card, CTO recommendation, and rehearsal hardening.

## Locked Demo Claim

```text
Lovable/Supabase app
  -> one click Graduate To Aiven
  -> Aiven Postgres data plane
  -> Aiven Postgres app_events for demo-safe browser realtime
  -> Aiven Kafka migration.events as agent bus / production event-path proof
  -> local Aiden adapter for the scoped demo runtime
```

Do not claim full production Supabase replacement. Auth, Storage, RLS review, full CDC, and Aiven Apps deployment are intentionally out of the live demo path.

## Reference Material

- [migration-info/](migration-info/) contains raw migration research and market scans.
- [demo/pulsewall/](demo/pulsewall/) is the canonical source app.
- [BUILD_PLAN.md](BUILD_PLAN.md) explains the honest difficulty and cut lines.
- [STATUS.md](STATUS.md) summarizes current assets, blockers, and judge framing.
