# STATUS - Touko Final

Date: 2026-06-25

## Current Product

**Overmind** is the final-demo product path.

It takes a Lovable/Supabase-style app, builds a behavior graph, graduates the heavy data/realtime/search layer onto Aiven, streams the agent work in Mission Control, and hands off to an always-on CTO console.

## Demo Shape

1. Public landing page: black Aiven-style sales opener.
2. Deploy/connect flow: `#/deploy`.
3. Live Mission Control: `#/app`.
4. CTO handoff: `#/cto`.

## Core Runtime

Keep the `overmind/` app as the source of truth:

- `overmind/server/orchestrator.ts` drives the 10-phase migration stream.
- `overmind/aiven/*` owns Aiven MCP, REST, Postgres, and Kafka proof paths.
- `overmind/web/Dashboard.tsx` renders the live agent stream.
- `overmind/web/Deploy.tsx` owns the founder/deploy flow.
- `overmind/web/CtoConsole.tsx` owns the operating-agent handoff.

## Positioning

- Lovable builds. Aiven runs.
- MCP is the control plane and proof layer.
- Bulk data movement stays deterministic and receipt-backed.
- Real where real, honest where fallback.

## Intentional Cuts

- Do not merge the separate `henri` root workspace runtime into this branch.
- Do not add duplicate `src/apps/*` control-room or local API paths.
- Do not claim production auth/storage migration is fully solved unless the run proves it live.
- Do not commit secrets or local env files.

## Verification Before Submission

From `overmind/`:

```bash
npm run typecheck
npm run build
```

Browser smoke:

- `#/` shows the black landing page.
- `#/deploy` opens deploy/connect.
- `#/app` opens Mission Control.
- `#/cto` opens the CTO console.
