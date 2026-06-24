# Integration Plan

This is the implementation interpretation of the AT Protocol strategy. It keeps
the prototype honest without turning the hackathon into protocol plumbing.

## Core Claim To Prove

Evidence Radar makes one maintainer decision better by combining evidence that
would normally be scattered:

- identity
- trust
- issue urgency
- pull request state
- review discussion
- latest round delta
- CI/spindle status
- repository identity

The proof is not that every record is live. The proof is that the UI, ranking,
and pitch materially depend on this protocol-shaped evidence.

## Data Model

Use the existing `src/data.ts` as the prototype data source. Treat each evidence
row as a stand-in for a live record or system event.

| Prototype Field | Protocol Meaning | Live Candidate |
| --- | --- | --- |
| `author` | Human-readable handle | Handle resolution. |
| `authorDid` | Portable identity | DID document / resolved identity. |
| `evidence.kind = identity` | Identity proof | DID/handle lookup. |
| `evidence.kind = trust` | Vouch or denounce | Tangled trust record. |
| `evidence.kind = issue` | Issue evidence | `sh.tangled.repo.issue`-style record. |
| `evidence.kind = pull` | Pull request evidence | `sh.tangled.repo.pull`-style record. |
| `evidence.kind = comment` | Discussion evidence | Tangled feed/comment record. |
| `evidence.kind = spindle` | CI evidence | Tangled spindle run/log/status. |
| `evidence.kind = repo` | Repo identity | Repo DID and knot metadata. |

## Read Path

For the hackathon demo:

1. Load seeded records from `src/data.ts`.
2. Render the ranked queue.
3. Show evidence chips and record references.
4. Deep-link to Tangled as the action path.

For a live version:

1. Resolve maintainer handle to DID.
2. Query Tangled/appview indexed records for repos the maintainer owns or follows.
3. Pull recent issue, pull, comment, vouch/denounce, and spindle signals.
4. Normalize them into the same `WorkItem` and `Evidence` shapes.
5. Run deterministic ranking.
6. Render the same UI.

## Write Path

Write-side integration is a pivot, not the first dependency.

Possible write actions:

| Action | Why It Helps | Risk |
| --- | --- | --- |
| Create a review comment | Makes the app visibly interactive. | Requires auth and exact record shape. |
| Draft a PR record | Strong sponsor proof if they prefer agents creating records. | Higher schema and workflow risk. |
| Create a vouch suggestion | Tangled-native, trust-focused. | Product semantics may be sensitive. |
| Create a follow-up issue | Safer than PR creation. | Less impressive if it looks like ticket automation. |

Default hackathon action:

> "Ask for one small test fix, then merge" plus a Tangled deep link.

Pivot action if sponsor demands writes:

> Generate a record preview and write one safe comment/draft through XRPC.

## Ranking Contract

Ranking must depend on protocol evidence. If the score can be computed from only
Git diffs and CI, the idea is too generic.

Required positive signals:

- vouched contributor
- linked release/security issue
- relevant failing spindle
- maintainer/security comment
- narrow latest round delta

Required deferral signals:

- unknown DID/trust state on high-risk files
- docs-only/no release impact
- passing CI with no active discussion

The top-card reason must fit in one line:

> Vouched author + failing spindle + release-blocking security issue

## Demo Instrumentation

Add or preserve these UI affordances:

- Header shows maintainer handle, repo DID, knot, and release context.
- Every evidence row shows a concrete URI or DID.
- Top card reason is readable without opening details.
- Detail view starts with evidence timeline, not generic summary text.
- Action button says the maintainer decision, not "Analyze."
- A small "seeded/live boundary" strip explains what is seeded and what would be
  live.

## Sponsor Checkpoint

Ask Tangled:

1. Which record families should we use if we add a live read path?
2. Is a seeded evidence demo acceptable if the record references and live path are
   explicit?
3. Would you rather see a read-side maintainer view or a write-side agent action?
4. Are custom records/lexicons welcome, or should we stick to existing Tangled
   records?
5. What is the best deep link target for a pull/issue/comment during judging?

## Build Priority

1. Make the current UI visibly protocol-native.
2. Add hover/click affordances for evidence chips if missing.
3. Add a compact seeded/live explanation.
4. Add one realistic Tangled deep link target.
5. Only then consider live reads or writes.

## Kill Conditions

Kill or pivot if:

- the first screen reads as generic repo analytics;
- judges cannot explain why the top PR is first after 20 seconds;
- the action path needs live auth to demo;
- sponsor explicitly asks for write-side record creation and does not value
  read-side evidence views.
