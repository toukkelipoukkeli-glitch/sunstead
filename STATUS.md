# STATUS — where we are (2026-06-25)

Quick orientation. Full spec in [idea.md](idea.md); judge profiles + talking points in
[judges.md](judges.md). This file = "what we have / what we're building / what's next."

## What we're building (one line)

**Lovable → Aiven behavior migrator + "Aiven, your CTO" agent.** When a vibe-coded Lovable
app blows up, an agent graduates its data plane off Supabase onto Aiven — migrates the data,
**rewrites realtime behavior to Aiven Kafka**, **deploys the replacement backend glue as a live
Aiven App so the app ends up 100% Aiven / zero Supabase**, verifies the cutover, and then stays
on as a CTO agent that watches the app and says what to do next. Aiven challenge = agentic
workflows on Aiven infra via the **Aiven MCP**.

## Locked decisions

- **Behavior migration, not just data migration.** The agent builds a *behavior graph* and
  classifies every Supabase feature: direct-migrate / rewrite / adapter / external / flag.
- **Actually deploy, don't just plan.** We deploy the rewritten glue as an **Aiven App** via
  MCP → fully removes Supabase. This also one-ups Aiven's *own* Lovable integration (theirs
  still routes through a Supabase Edge Function as middleware).
- **MCP is the control plane, not the bulk pipe.** Bulk copy uses `aiven-db-migrate` /
  `pg_dump`; MCP does provisioning, inspection, schema/metadata, Kafka topics+events,
  validation reads, and receipts.
- **Demo app = "PulseWall"** (a live event reaction wall — see below).

## The demo app: PulseWall

A real-time hype/reaction wall for a live event (festival / launch / stream). Attendees post
short messages + a photo; the wall, live reaction counts, and a leaderboard update in real
time on a big screen; "find similar hype" semantic search. Viral by nature ("it blew up, the
Supabase bill exploded"), very visual on stage. It's built on Supabase deliberately so the
migration lights up the full behavior graph:

| Feature (on Supabase) | Behavior class | Demo beat |
|---|---|---|
| `posts`/`reactions` tables + RLS | direct migrate | row counts match before/after |
| pgvector semantic search | direct migrate → Aiven pgvector | *win:* "AI search moves natively, Aiven is AI-ready" |
| Realtime wall + leaderboard | **rewrite → Aiven Kafka** | **hero beat:** channel → Kafka, live event hop |
| Auth (magic link) | adapter required | honestly flagged |
| Storage (post images) | externalize to object store | honestly flagged |
| Edge function (embeddings) | convert → **Aiven App** | the "delete Supabase" deploy beat |

**Scope rule for the live demo:** build *all* features in Lovable (cheap there) + seed heavily;
but on stage only **rewrite realtime→Kafka**, **migrate pgvector+tables**, and **deploy one
Aiven App**. Auth/storage get classified + flagged instantly (no live surgery). Full range,
no fragile over-reach.

## Open questions / blockers (help wanted)

- **✅ Lovable export surface — resolved.** See [demo/lovable-export-checklist.md](demo/lovable-export-checklist.md).
  Build PulseWall on **your own Supabase project, NOT Lovable Cloud** (Lovable Cloud gives no
  direct DB URL / service-role key → the migrator can't reach it). Then we get the connection
  string, service-role key, SQL editor, and a GitHub-synced repo to scan. Cost story confirmed:
  Lovable Cloud bills jump 3–5× from 10k→50k users.
- **Seed script ready:** [demo/pulsewall-seed.sql](demo/pulsewall-seed.sql) (~5k posts / ~50k reactions).
- **🚧 Aiven Apps access.** Aiven Apps is *limited availability* + stateless. The "deploy a
  live Aiven App" hero beat depends on us having access — **ask Daniil / Julie on site.**
- **CTO agent scope.** For the hackathon, ship 1–2 real recommendations off live Aiven
  metrics — concrete, not a mockup.

## Judges (detail in judges.md)

All product / startup-program, **none infra**. **Stanislav** (presented the challenge; owns
"context-maxing"; rewards MCP depth + polished playful demos). **Daniil** (Aiven for Startups;
founder value + land-and-expand). **Julie** (Aiven for Startups + GreenOps; production realism,
trust/verification, cost + carbon). Anchor frame: Aiven's own new mission **"Stop Managing.
Start Building."** Lovable is a co-sponsor → frame as "Lovable builds, Aiven runs," not "escape."

## Reuse

`ideas/architecture-advisor` (live Aiven pricing + provision via MCP/REST + benchmark) and
`ideas/hivemind` (agent-provisions-Aiven-live-via-MCP hero moment) — both are head starts.
