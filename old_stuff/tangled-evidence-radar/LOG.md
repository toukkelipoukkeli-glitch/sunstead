# Sunstead Mission Log

Append-only working log for Tangled Evidence Radar.

## 2026-06-24 12:31 EEST — Mission 00: Orient

- Navigator state: emerging, aligned enough to focus, still sponsor-sensitive.
- Current track: Tangled main challenge only; stay on Tangled Evidence Radar
  unless sponsor evidence strongly favors a pivot inside Tangled.
- Entrypoint brief read: `TANGLED_ROADMAP.md`.
- Clues loaded: `AGENTS.md`, `PLAYBOOK.md`, `TANGLED_IDEAS.md`,
  `TANGLED_ROADMAP.md`, navigate methodology/navigator.
- Repo gap found: README did not point to a log despite the workflow requiring
  one.
- Decision: create this log and add it to README before running missions.
- Bottleneck: define a concrete seeded evidence scenario before building UI.
- Next mission: gate the idea against official Tangled primitives and extract
  the minimum demo skeleton.

## 2026-06-24 12:39 EEST — Mission 01/02: Clue Harvest And Gate

- Navigator state: emerging, converging.
- Forward beam: Tangled docs/newsletter support knots, appview, repo DIDs,
  spindles, webhooks, pull/issue records, public vouch records, and PR record
  ingestion through the firehose.
- Backward beam: a winning demo needs one legible workflow where ATProto is
  necessary in the first minute.
- Gate result: keep **Tangled Evidence Radar** as the current bet.
- Upgrade: make the first screen about evidence-backed priority, not generic
  triage.
- Cold enough claim: official docs/newsletter are sufficient to seed a demo with
  pull records, issue records, comments/reactions, vouches, repo DIDs, and
  spindle/webhook-style CI state.
- Warm claim: exact live record write/read schema still needs direct Tangled
  API validation before live integration.
- Pivot triggers:
  - If sponsor wants write-side integration, pivot inside Tangled to Patch
    Customs Desk.
  - If sponsor wants cross-repo coordination, pivot to Emergency Broadcast.
  - If sponsor wants pure CI, narrow Evidence Radar into CI Black Box.
- T/A/P: direction 28/85/57 -> 22/84/62 after source gate.
- New bottleneck: produce a seeded evidence skeleton that makes provenance
  visible without requiring live auth.

## 2026-06-24 12:46 EEST — Mission 03: Evidence Skeleton

- Created `TANGLED_EVIDENCE_SCENARIO.md`.
- Scenario fixed: one maintainer, one repo, six work items, three trust states,
  two spindle outcomes, and one top-card evidence trail.
- Key design decision: prototype ranking is deterministic, not model-powered.
  This reduces demo risk and keeps protocol evidence visible.
- Bridge met: the first minute can show repo DID, handle/DID identity, pull
  record AT URI, vouch evidence, feed comment, and spindle result.
- T/A/P: skeleton 22/82/60 -> 16/80/64.
- New bottleneck: build the first screen and one drill-down using this scenario.

## 2026-06-24 12:54 EEST — Mission 04: Prototype Spine

- Built a React/Vite prototype for Tangled Evidence Radar.
- First screen opens directly on the maintainer queue for
  `solar-knot/payments`.
- Implemented:
  - bucket filters: `Review now`, `Needs context`, `Safe to batch`
  - ranked seeded work items from `TANGLED_EVIDENCE_SCENARIO.md`
  - evidence detail timeline with DIDs, AT URIs, vouch, comment, spindle, and
    repo references
  - deterministic scoring and action copy
- Verification:
  - `npm run build` passes.
  - `npm audit --audit-level=moderate` passes after dependency cleanup with zero
    vulnerabilities.
  - local server responds at `http://localhost:5173/`.
- Limitation: no local browser binary or Playwright install was available for a
  rendered screenshot in this pass.
- T/A/P: prototype spine 18/80/62 -> 14/76/62.
- New bottleneck: rendered UX inspection plus final pitch/protocol-proof polish.

## 2026-06-24 13:00 EEST — Mission 05: Protocol-Proof Polish

- Added a protocol-proof strip to the prototype:
  - data mode: seeded Tangled records
  - live path: appview/firehose to XRPC to PDS record writes
  - boundary: schema validation pending sponsor/API check
- Converted the Tangled action into an external Tangled link.
- Verification: `npm run build` passes after the change.
- T/A/P: protocol proof 16/78/62 -> 12/74/62.
- New bottleneck: presenter-machine rendered inspection and sponsor calibration.
- No new build mission should start before visual inspection unless sponsor
  feedback provides a stronger Tangled direction.

## 2026-06-24 13:08 EEST — Mission 06: Pitch Package

- Created `PITCH.md`.
- Pitch locks the current story: maintainer triage is valuable because Tangled
  turns identity, trust, comments, pull records, repo identity, and CI into
  portable evidence.
- Added demo beat order, 4-minute pacing, Q&A answers, sponsor calibration
  questions, and cut list.
- T/A/P: pitch 12/75/63 -> 10/72/62.
- Remaining bottleneck: rendered UX inspection and sponsor feedback. No further
  desk-only mission is clearly higher value before those happen.

## 2026-06-24 13:14 EEST — Mission 07: AT Protocol Deepening

- Created `evidence-radar-atproto/` as a separate strategy packet.
- Core clarification: AT Protocol is the evidence substrate, not the code host;
  Git/knots carry code, Tangled records carry collaboration state, and Evidence
  Radar turns those records into maintainer decisions.
- Added `README.md` for the ATProto-native argument, Tangled-specific surfaces,
  non-negotiable demo proof, and live-vs-seeded boundary.
- Added `INTEGRATION_PLAN.md` mapping prototype fields in `src/data.ts` to
  identity, trust, issue, pull, comment, spindle, and repo evidence.
- Added `PITCH_NOTES.md` with the 15-second pitch, demo beats, Q&A answers, and
  dangerous phrases to avoid.
- Bottleneck unchanged: rendered UX inspection and sponsor feedback. The new
  packet should guide edits only if the app or pitch starts drifting toward a
  generic dashboard.

## 2026-06-24 13:30 EEST — Mission 08: Problem-Soul Reframe

- Used the local `navigate/` resources for a problem-first ideation pass.
- Navigator state: emerging and aligned, with one high-amplitude new candidate
  warm enough for sponsor calibration.
- Reframed the challenge soul from "rank the next review item" to "make
  maintainer judgment portable as protocol evidence."
- Created `TANGLED_PROBLEM_SOUL.md`.
- New candidate: **Tangled Case Law**, a protocol-native precedent layer for
  open-source decisions.
- Core demo: an incoming PR collides with a signed project precedent, then the
  maintainer posts or previews a Tangled-native decision backed by issue, pull,
  comment, vouch, repo, and spindle evidence.
- T/A/P: Tangled Case Law 24/90/66, slightly above current Evidence Radar
  22/86/64 because it is more problem-first and more surprising.
- Decision: do not discard Evidence Radar yet. Test the Case Law wrapper with a
  Tangled sponsor or mentor first; if the reaction is strong, most seeded
  evidence work can be reused under the new wrapper.

## 2026-06-24 13:48 EEST — Mission 09: Case Law Yes/No Evidence

- Created `TANGLED_CASE_LAW_EVIDENCE.md`.
- Evidence moved the decision from "pivot to Case Law" toward "wrap Evidence
  Radar in project memory / precedent language."
- YES evidence: Tangled's own direction supports portable identity, repo DIDs,
  vouches, comments, PR records, PDS-backed public records, firehose ingestion,
  and agent-created PR records.
- NO evidence: no visible official precedent/project-decision lexicon, vouching
  is person trust rather than binding policy, evidence trails are partly future
  work, Tangled lexicons/wire formats are still moving, and XRPC auth should not
  be a live-demo dependency.
- Updated score: Evidence Radar with Case Law wrapper `T/A/P = 18/89/71`,
  pure custom-record Case Law `34/92/58`, plain Evidence Radar `20/84/64`.
- Current recommendation: test the phrase "Project Memory for Tangled" with the
  sponsor. Use "case law for open source" as the memorable analogy, not
  necessarily the product name.

## 2026-06-24 13:56 EEST — Mission 10: Thesis Farm Synthesis

- Farmed four independent thesis angles:
  - protocol truth: AT Protocol gives portable identity, typed records, record
    addressing, signed user repos, XRPC, and sync; Tangled gives those records
    open-source meaning.
  - Tangled sponsor fit: Evidence Radar should make Tangled collaboration
    records feel like the operating system for maintainer judgment.
  - maintainer workflow: the scarce resource is judgment under uncertainty, not
    more summaries or notifications.
  - narrative red-team: the ranking is not the invention; making maintainer
    judgment replayable is the invention.
- Created `evidence-radar-atproto/DEEP_THESIS.md`.
- Updated `evidence-radar-atproto/README.md` and `PITCH_NOTES.md` to point at
  the deeper thesis.
- Updated `PITCH.md` so the public story becomes "portable maintainer judgment"
  and "Project Memory for Tangled" rather than only a ranked review queue.
- Current thesis: **Git preserves what changed. Tangled can preserve why
  maintainers trust, reject, fast-track, or block a change.**
- Bottleneck unchanged: rendered UX inspection and sponsor feedback. Do not
  start live protocol plumbing until the visual proof and sponsor wording land.

## 2026-06-24 14:08 EEST — Mission 11: Wild Idea Reach

- Created `TANGLED_WILD_IDEAS.md`.
- Ran a higher-amplitude pass beyond Case Law / Project Memory.
- Best wild candidate: **Tangled Immune System**, a trust-aware review reach
  layer for AI-era code spam.
- Core demo: an `AI patch outbreak` creates many plausible but weak PRs; the app
  groups them into `cool down` using DIDs, vouches/denounces, PR records,
  comments, repo DID, and spindle evidence, while fast-tracking the vouched real
  fix.
- Why it sticks: Tangled's own vouching post already frames LLM-generated
  subtle-wrong submissions as a maintainer burden, and denounces currently inform
  decisions without blocking users.
- Runner-up: **Agent Passport Control**, especially if the sponsor wants
  agent-created PR records.
- Decision: keep the existing Evidence Radar implementation spine, but consider
  changing the story wrapper from "evidence queue" to "open-source immune
  system" if sponsor feedback likes the metaphor.

## 2026-06-24 14:16 EEST — Mission 12: Top Ideas Pitch Packet

- Created `TOP_IDEAS_PITCH.md`.
- Compiled the top ideas from `TANGLED_IDEAS.md`, `TANGLED_ROADMAP.md`,
  `TANGLED_PROBLEM_SOUL.md`, `TANGLED_CASE_LAW_EVIDENCE.md`,
  `TANGLED_WILD_IDEAS.md`, and `evidence-radar-atproto/DEEP_THESIS.md`.
- The packet ranks and pitches:
  - Evidence Radar as Project Memory
  - Tangled Immune System
  - Tangled Case Law
  - Agent Passport Control
  - OSS Recall Network
  - Patch Customs Desk
  - CI Black Box Recorder
  - Project Lifeboat Drill
  - Trust-Aware Review Queue
  - Good First Journey Packs
  - Migration Story Preserver
  - Compatibility Parliament
- Updated `README.md` to put `TOP_IDEAS_PITCH.md` before the final single-idea
  `PITCH.md`.
- Bottleneck unchanged: sponsor feedback should decide whether the final wrapper
  stays Project Memory or moves to Tangled Immune System / write-side PR intake.

## 2026-06-24 14:22 EEST — Mission 13: AI PR Trust Focus

- Created `TANGLED_AI_PR_TRUST.md`.
- User pushed on the sharper problem: making AI-produced code and PRs more
  trustworthy with Tangled's power.
- New best thesis: **Tangled Patch Passport**, trust receipts for AI PRs.
- Core demo: two AI PRs both look plausible and pass tests; only one earns
  maintainer review because it carries identity, human sponsor, linked issue,
  project memory, focused tests, spindle result, vouch evidence, and source
  record links.
- Score update: Tangled Patch Passport `T/A/P = 22/97/75`, above Tangled Immune
  System `24/95/71` because it is more specific, more current, and easier to
  explain as the AI-slop answer.
- Updated `TOP_IDEAS_PITCH.md` and `README.md` so Patch Passport is visible as
  the new top candidate.
- Decision: make AI PR trust the headline if sponsor feedback accepts it. Use
  Immune System as the broader world model, Project Memory as one receipt field,
  and Evidence Radar as the implementation shell.

## 2026-06-24 14:38 EEST — Mission 14: Archetype Convergence

- Created `TANGLED_ARCHETYPE_CONVERGENCE.md`.
- Ran the idea through developer archetypes: overloaded maintainer, core
  reviewer, trusted contributor, new contributor, AI-assisted human, autonomous
  agent builder, security maintainer, downstream maintainer, project lead,
  knot/spindle operator, and Tangled sponsor.
- Convergence: the shared object is not a queue or a detector, but a
  **reviewability receipt** for patches.
- New framing: **Tangled Review Passport** as the platform idea; **Tangled Patch
  Passport for AI PRs** as the first demo use case.
- Score update: Tangled Review Passport `T/A/P = 20/98/78`, Patch Passport
  `22/97/75`, Evidence Radar implementation shell `16/91/75`.
- Decision: pitch "AI PRs need receipts" in the demo, but keep the broader
  product language as reviewability for humans and agents.

## 2026-06-24 14:45 EEST — Mission 15: High-Level Thesis

- Created `TANGLED_HIGH_LEVEL_THESIS.md`.
- Captured the north-star problem-solution connection:
  **Git makes code portable; Tangled makes trust around code portable.**
- AI-era sharpening: **AI makes patches cheap; Tangled makes patches
  accountable.**
- Product consequence: frame the build as a reviewability layer for open source,
  not a dashboard, AI reviewer, smarter queue, trust score, or spam detector.
- Demo principle: a bare diff is not reviewable; a Tangled patch with receipts
  is reviewable.
- Updated `README.md` so the high-level thesis appears before deeper strategy
  packets.

## 2026-06-24 14:55 EEST — Mission 16: Autonomous Agents World

- Created `autonomous-agents-world/README.md`.
- Captured the world thesis: autonomous agents should be free to act in open
  source, but every meaningful action should carry public, portable evidence.
- Core principle: **Freedom to contribute. Receipts to be reviewed.**
- Best product shape: **Tangled Agent Flight Recorder** or **Tangled Review
  Passport for Agents**.
- Demo direction: an autonomous agent opens a PR with a public flight recorder
  containing agent DID, owner DID, intent, linked issue, tests, spindle result,
  vouch evidence, and AT URI records; a weak agent PR is routed to missing
  receipts.
- Updated `README.md` to include the new autonomous-agents theme packet.

## 2026-06-24 15:04 EEST — Mission 17: Freedom With Receipts

- Created `autonomous-agents-world/DEEP_THESIS.md`.
- Deepened the autonomous-agent thesis from "agent transparency" into
  **freedom with receipts**.
- Core conceptual split: preserve freedom to publish, but make review attention
  earned through evidence.
- New primitive: action receipts. At different scales these become review
  passports, flight recorders, and agent passports.
- Strategic recommendation: build the demo around **Agent Flight Recorder**, not
  a general dashboard. One agent, one issue, one PR, one flight recorder, one
  maintainer decision.
- Updated README links to include the deeper thesis.
