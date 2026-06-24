# STATUS — where we are (2026-06-25)

Quick orientation. Full spec in [idea.md](idea.md); judge profiles + talking points in
[judges.md](judges.md). This file = "what we have / what we're building / what's next."

## What we're building (one line)

**Lovable → Aiven behavior migrator + "Aiven, your CTO" agent.** When a vibe-coded Lovable
app blows up, an agent graduates its data plane off Supabase onto Aiven — migrates the data,
**rewrites realtime behavior to Aiven Kafka**, and rewires the app onto Aiven's data plane so
Supabase is deleted from the stack, verifies the cutover, and then stays
on as a CTO agent that watches the app and says what to do next. Aiven challenge = agentic
workflows on Aiven infra via the **Aiven MCP**.

## Locked decisions

- **Behavior migration, not just data migration.** The agent builds a *behavior graph* and
  classifies every Supabase feature: direct-migrate / rewrite / adapter / external / flag.
- **Delete Supabase by moving the data plane — not by hosting on Aiven.** ⚠️ UPDATED ~00:30:
  **Aiven Apps deploy is LA and our account isn't enabled** (verified live via MCP). So the rewired
  app runs against Aiven directly (Postgres + Kafka) and Supabase is still fully removed. Hosting the
  glue *on* Aiven Apps is the named next step — MCP path proven (`aiven_application_deploy`), just
  needs access. One-up line still holds: Aiven's own Lovable integration routes through a Supabase
  Edge Function; our migrated app doesn't touch Supabase at all.
- **MCP is the control plane, not the bulk pipe.** Bulk copy uses `aiven-db-migrate` /
  `pg_dump`; MCP does provisioning, inspection, schema/metadata, Kafka topics+events,
  validation reads, and receipts.
- **Demo app = "PulseWall"** (a live event reaction wall — see below).

## The demo app: PulseWall

✅ **Built & runs** — Vite + React + Supabase app in [demo/pulsewall/](demo/pulsewall/) (clean
production build, UI renders). Schema in `supabase/migrations/0001_init.sql` (matches the seed),
embedding edge function in `supabase/functions/embed/`. Setup steps in its README. Still TODO:
point it at a real Supabase project, deploy the edge function, run the seed.

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
| Edge function (embeddings) | embeddings migrate to Aiven pgvector; glue → worker | flagged (Aiven Apps host = post-GA) |

**Scope rule for the live demo:** build *all* features in Lovable (cheap there) + seed heavily;
but on stage only **migrate pgvector+tables to Aiven**, **rewrite realtime→Kafka (live)**, show the
**cost card** + **CTO recs**, and boot the rewired app against Aiven. Auth/storage/edge get
classified + flagged instantly (no live surgery). Full range, no fragile over-reach.

## Open questions / blockers (help wanted)

- **✅ Lovable export surface — resolved.** See [demo/lovable-export-checklist.md](demo/lovable-export-checklist.md).
  Build PulseWall on **your own Supabase project, NOT Lovable Cloud** (Lovable Cloud gives no
  direct DB URL / service-role key → the migrator can't reach it). Then we get the connection
  string, service-role key, SQL editor, and a GitHub-synced repo to scan. Cost story confirmed:
  Lovable Cloud bills jump 3–5× from 10k→50k users.
- **Seed script ready:** [demo/pulsewall-seed.sql](demo/pulsewall-seed.sql) (~5k posts / ~50k reactions).
- **❌ Aiven Apps access — verified no-go (~00:30).** Account not LA-enabled, GitHub not connected.
  Pivoted: no live App deploy in the demo; the rewired app runs against Aiven directly. Still worth
  asking Daniil/Julie on site — if enabled before 18:00 we bolt the deploy on as a bonus beat.
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
