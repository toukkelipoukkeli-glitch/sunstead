# Tangled Evidence Radar Pitch

Use this for the 4-minute Tangled finalist pitch.

## One-Liner

Tangled Evidence Radar gives maintainers one prioritized review queue and shows
the portable protocol evidence behind every recommendation.

## Four-Minute Flow

### 0:00-0:25 — Problem

Open-source maintainers do not just need more notifications. They need to know
which work item deserves attention next, and why.

Most forges trap the evidence behind that decision inside one platform: identity,
trust, comments, PR history, CI state, and repo context are all platform exhaust.

### 0:25-0:50 — Tangled Wedge

Tangled changes the shape of the problem. Handles, DIDs, repo DIDs, records,
vouches, comments, and spindle state can become portable evidence.

Evidence Radar uses that protocol data to turn a maintainer inbox into an
explainable decision surface.

### 0:50-2:35 — Demo

1. Open the app on `solar-knot/payments`.
2. Point at the header: maintainer handle, repo DID, knot, release context.
3. Show the three buckets: `Review now`, `Needs context`, `Safe to batch`.
4. Click `PR #184: Harden webhook signature verification`.
5. Read the top reason: vouched author, failing spindle, release-blocking
   security issue.
6. Replay the evidence trail:
   - author handle resolves to DID
   - vouch record lowers review friction
   - linked issue record explains urgency
   - spindle run shows the exact failing check
   - feed comment confirms acceptable fix window
   - pull record and round delta show the current patch
7. Click the Tangled link and state the live boundary: seeded today, intended path
   is appview/firehose to XRPC to PDS record writes.

### 2:35-3:30 — Why It Wins

This is not a generic PR dashboard. If you remove Tangled primitives, the product
gets worse:

- without DIDs, identity is less portable
- without vouches, trust does not change the action
- without repo DIDs and AT URIs, evidence is not network-addressable
- without spindles, CI is disconnected from review priority

Tangled turns maintainer judgment into portable evidence.

### 3:30-4:00 — Close

The next step is to validate the live read/write path with Tangled: pull records,
issue records, comments, vouches, and spindle events.

Our fallback is already demo-safe with seeded data, and the core workflow is
clear: one maintainer, one repo, one next action, with protocol evidence.

## Q&A Answers

**Why Tangled instead of GitHub?**  
Because the value comes from portable identity, repo identity, vouch records, AT
URIs, and spindle evidence. On GitHub this becomes a platform dashboard; on
Tangled it becomes a protocol-backed decision trail.

**Is the integration live?**  
The current demo is seeded for reliability. The live path is explicit:
appview/firehose reads, XRPC access, and PDS record writes after schema validation
with the Tangled team.

**Why not use AI ranking?**  
The first build uses deterministic ranking because the demo should prove the
protocol value before adding model ambiguity. AI can later draft the review or
summarize evidence, but it should not hide the evidence.

**What is the maintainer pain?**  
Maintainers waste time deciding what deserves attention. Evidence Radar makes the
reason visible: urgency, trust, CI, discussion, and patch scope.

**What would you build next?**  
First, live read integration for pull/issue/comment/vouch/spindle records. Then
write-side actions: review comments, requested changes, or Patch Customs Desk.

## Sponsor Calibration

Ask these before adding features:

1. Which record types should be most visible in the first minute?
2. Is read-side maintainer triage enough, or do you want write-side record
   creation?
3. Should the final demo use a real Tangled repo or seeded records with deep
   links?
4. Are vouch/denounce records a strong judging signal for Tangled?
5. Which phrase lands better: "portable evidence" or "protocol-backed review"?

## Cut List

- No login or account settings.
- No broad analytics.
- No live firehose dependency before visual polish.
- No side-track wrappers.
- No generic AI code review.
