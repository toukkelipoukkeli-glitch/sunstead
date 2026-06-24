# Hackathon Playbook

This repo is a compact operating system for hackathons.

Use it to:

- classify the event before building
- choose tracks and ideas with better expected value
- keep agents aligned with winning, not overengineering
- avoid repeated execution mistakes
- run a short postmortem after every event

Candidate ideas (not committed yet) live under [`ideas/`](ideas/). The current
front-runner, **Tangled Evidence Radar**, is in
[`ideas/tangled-evidence-radar/`](ideas/tangled-evidence-radar/). Run its prototype:

```sh
cd ideas/tangled-evidence-radar
npm install
npm run dev
```

Read in this order:

1. [AGENTS.md](AGENTS.md)
2. [PLAYBOOK.md](PLAYBOOK.md)
3. [SUNSTEAD_HACK.md](SUNSTEAD_HACK.md)
4. [CHALLENGES.md](CHALLENGES.md)
5. [ideas/tangled-evidence-radar/TANGLED_IDEAS.md](ideas/tangled-evidence-radar/TANGLED_IDEAS.md)
6. [ideas/tangled-evidence-radar/TANGLED_ROADMAP.md](ideas/tangled-evidence-radar/TANGLED_ROADMAP.md)
7. [ideas/tangled-evidence-radar/TANGLED_EVIDENCE_SCENARIO.md](ideas/tangled-evidence-radar/TANGLED_EVIDENCE_SCENARIO.md)
8. [ideas/tangled-evidence-radar/PITCH.md](ideas/tangled-evidence-radar/PITCH.md)
9. [ideas/tangled-evidence-radar/LOG.md](ideas/tangled-evidence-radar/LOG.md)
10. [CHECKLIST.md](CHECKLIST.md)

After the event:

1. copy [POSTMORTEM_TEMPLATE.md](POSTMORTEM_TEMPLATE.md)
2. write a dated postmortem
3. update the playbook only if the lesson is reusable

Rule of thumb:

- hackathons are usually won by better calibration, tighter scoping, and better demos
- not by deeper architecture
