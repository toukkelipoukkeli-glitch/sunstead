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

## 2026-06-24 13:30 EEST — Mission 06: Problem-Soul Reframe

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
