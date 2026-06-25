# Hackathon Playbook

This repo is a compact operating system for hackathons.

Use it to:

- classify the event before building
- choose tracks and ideas with better expected value
- keep agents aligned with winning, not overengineering
- avoid repeated execution mistakes
- run a short postmortem after every event

Run the current Tangled Evidence Radar prototype (Tangled challenge):

```sh
npm install
npm run dev
```

Run the Switchboard / Vibe Deploy prototype (Aiven challenge):

```sh
cd switchboard
npm install
npm run dev
```

Challenge entries:

- **Tangled** → Tangled Evidence Radar (root `src/`, docs below)
- **Aiven** → [Switchboard / Vibe Deploy](switchboard/README.md): an agent crew that migrates
  a Lovable/Supabase app onto Aiven through the MCP. See [switchboard/PITCH.md](switchboard/PITCH.md),
  [switchboard/DEMO.md](switchboard/DEMO.md), and [switchboard/proof/migration-proof.md](switchboard/proof/migration-proof.md).

Read in this order:

1. [AGENTS.md](AGENTS.md)
2. [PLAYBOOK.md](PLAYBOOK.md)
3. [SUNSTEAD_HACK.md](SUNSTEAD_HACK.md)
4. [TANGLED_IDEAS.md](TANGLED_IDEAS.md)
5. [TANGLED_ROADMAP.md](TANGLED_ROADMAP.md)
6. [TANGLED_EVIDENCE_SCENARIO.md](TANGLED_EVIDENCE_SCENARIO.md)
7. [PITCH.md](PITCH.md)
8. [evidence-radar-atproto/README.md](evidence-radar-atproto/README.md)
9. [LOG.md](LOG.md)
10. [CHECKLIST.md](CHECKLIST.md)

After the event:

1. copy [POSTMORTEM_TEMPLATE.md](POSTMORTEM_TEMPLATE.md)
2. write a dated postmortem
3. update the playbook only if the lesson is reusable

Rule of thumb:

- hackathons are usually won by better calibration, tighter scoping, and better demos
- not by deeper architecture
