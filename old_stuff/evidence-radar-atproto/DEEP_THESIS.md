# Deep Thesis

This is the farmed synthesis after four independent passes:

- protocol truth
- Tangled sponsor fit
- maintainer workflow pain
- narrative red-team

## Final Thesis

> Git preserves what changed. Tangled can preserve why maintainers trust,
> reject, fast-track, or block a change.

Evidence Radar should not be pitched as a smarter PR queue. It should be pitched
as a **portable maintainer judgment surface**.

The product thesis:

> Open-source maintainers do not need more notifications. They need evidence for
> the next decision. Tangled turns identity, trust, discussion, pull requests,
> repo identity, and CI into portable collaboration records. Evidence Radar uses
> those records to make maintainer judgment explainable and replayable.

The shortest pitch:

> Evidence Radar turns Tangled's protocol records into auditable maintainer
> decisions.

## Thesis Stack

| Layer | Claim | Why It Matters |
| --- | --- | --- |
| Maintainer pain | The scarce resource is judgment, not notifications. | Maintainers need to decide what deserves attention, not just see what changed. |
| AT Protocol | ATProto supplies portable identity, typed records, record addressing, signed user repos, XRPC, and sync. | Evidence can be attributed, addressed, indexed, and replayed across tools. |
| Tangled | Tangled maps those primitives into open-source collaboration: repo DIDs, knots, pull records, issue records, comments, vouches, PR rounds, and spindles. | The proof is not abstract protocol; it is code collaboration state. |
| Product | Evidence Radar combines those records into one next maintainer action. | The UI becomes a decision surface, not analytics. |
| Demo | One top PR is prioritized with a visible evidence chain. | Judges see why Tangled makes the workflow better. |

## Why This Is Not Generic

Generic tools mostly do one of these:

- summarize code changes;
- aggregate notifications;
- create dependency PRs;
- run merge queues;
- chart repo health;
- score project security;
- comment on diffs with AI.

Evidence Radar should do something narrower and more Tangled-native:

> It reconstructs the reason a maintainer can act now, using source records the
> network can carry.

The ranking is not the invention. The invention is making maintainer judgment
replayable.

## Protocol Precision

Do not overclaim what AT Protocol does.

| Precise Claim | Avoid Saying |
| --- | --- |
| AT Protocol stores and syncs user data repositories and typed records. | AT Protocol stores the code. |
| DIDs are persistent identifiers; handles are human-readable and mutable. | Handles are permanent identity. |
| AT URIs address records. | AT URIs prove immutable evidence. |
| Signatures prove authorship/integrity of repo data. | Signed data proves the claim is true. |
| Relays/firehose/appviews make network records indexable. | The firehose guarantees perfect completeness. |
| Pulls, issues, vouches, knots, repo DIDs, and spindles are Tangled-specific surfaces built on the protocol. | These are all generic AT Protocol primitives. |

Better phrasing:

> AT Protocol gives Evidence Radar portable, typed, addressable records.
> Tangled gives those records open-source meaning.

## Project Memory Wrapper

The deeper product frame is **Project Memory for Tangled**.

Evidence Radar is the buildable shell:

> What should I review next?

Project Memory is the deeper reason:

> What judgment has this project already accumulated, and how should it affect
> this patch?

Case Law is the metaphor:

> Case law for open source, backed by Tangled records.

Use the metaphor carefully. It is memorable, but it can sound bureaucratic. The
safer public name is **Project Memory**. The sharper private thesis is **case law
for open-source decisions**.

## Best Demo Moment

The current Evidence Radar proof:

> This PR is first because the author is vouched, the linked issue blocks
> today's release, the failing spindle is focused, and the latest round changed
> only one risky file.

Then open the evidence chain:

1. `@jules.dev` resolves to `did:plc:jules-vouched`.
2. A vouch record reduces review friction.
3. An issue record explains release urgency.
4. A feed comment confirms the acceptable fix window.
5. The pull record and round delta show review scope.
6. The spindle result shows the remaining failing check.
7. Each claim links to a source record or system event.

The stronger Project Memory beat:

> Two passing patches get different actions. One is fast-tracked because it
> follows a trusted project decision. One is held because it reopens a rejected
> architecture choice.

This proves Tangled is not just hosting code. It is carrying project judgment.

## First Screen Contract

The first viewport must show:

- maintainer handle and DID;
- repo name, repo DID, and knot;
- one visible next action;
- top-card reason in one sentence;
- evidence chips for vouch, issue, pull, comment, spindle, and round delta;
- at least one visible `at://did:.../sh.tangled.../...` URI or source-record
  affordance;
- seeded/live boundary if asked.

The first viewport must not show:

- charts first;
- broad analytics;
- generic AI summary;
- a score with no evidence chain;
- protocol details hidden three clicks deep.

## Sponsor-Question Defense

**Why Tangled?**

Because the recommendation depends on Tangled records: repo DID, knot, pull and
issue records, feed comments, vouches, PR rounds, and spindles. Remove those and
the product loses provenance.

**Is this actually integrated?**

The prototype is seeded for reliability, but every visible chip maps to a
Tangled or ATProto primitive. The live path is PDS/appview/firehose reads and
XRPC/PDS writes after schema validation.

**Why not AI code review?**

AI can summarize a diff. Evidence Radar explains a maintainer decision from
identity, trust, urgency, scope, discussion, and CI evidence. AI can draft the
comment later; it should not hide the evidence.

**Why not a write-side agent?**

Write-side actions are the pivot. The read-side proof is the decision layer; if
Tangled wants writes, the next step is a comment or draft PR record backed by the
same evidence chain.

**Does vouching automate trust too aggressively?**

No. Vouches change review friction and explanation; they do not auto-punish or
auto-merge. Keep the maintainer in control.

## Decision

Current best bet:

> Build Evidence Radar as **Project Memory for Tangled**.

Use the current queue UI, but sharpen the language:

- from "ranked queue" to "evidence-backed decision surface";
- from "review priority" to "maintainer judgment with receipts";
- from "dashboard" to "protocol evidence chain";
- from "case law" as product name to "case law" as the memorable analogy.

T/A/P after farm:

| Option | T | A | P | Read |
| --- | ---: | ---: | ---: | --- |
| Evidence Radar with Project Memory wrapper | 16 | 91 | 75 | Best current thesis and build path. |
| Pure Case Law with custom records | 34 | 92 | 58 | High upside, too much live schema uncertainty. |
| Plain Evidence Radar | 20 | 84 | 64 | Buildable, but easier to dismiss as dashboard. |
| Patch Customs Desk | 24 | 87 | 63 | Best pivot if sponsor asks for write-side PR creation. |

## Phrases

Use:

- "portable maintainer judgment"
- "maintainer judgment with receipts"
- "protocol evidence chain"
- "auditable maintainer decision"
- "Project Memory for Tangled"
- "Git preserves what changed; Tangled can preserve why maintainers acted"
- "seeded demo, mapped directly to Tangled records"

Avoid:

- "AI code review"
- "dashboard"
- "analytics"
- "trust score"
- "decentralized GitHub"
- "smart queue"
- "AT Protocol stores code"
- "this could only exist on AT Protocol"

## Next Build Implication

Do not start live protocol plumbing yet.

First make the existing prototype prove the thesis:

1. The top card should expose the evidence chain before any generic summary.
2. The detail view should use source-record language: DID, collection, AT URI,
   repo DID, knot, spindle.
3. Add or preserve a Project Memory / precedent beat if it can be shown without
   breaking the current demo.
4. Keep deterministic ranking. The thesis is stronger when the evidence is not
   hidden behind model output.

## Sources

- Tangled docs: <https://docs.tangled.org/single-page>
- Tangled federation: <https://blog.tangled.org/federation/>
- Tangled vouching: <https://blog.tangled.org/vouching/>
- Tangled newsletter: <https://blog.tangled.org/newsletter-02/>
- AT Protocol overview: <https://atproto.com/guides/overview>
- AT Protocol repository spec: <https://atproto.com/specs/repository>
- AT Protocol sync spec: <https://atproto.com/specs/sync>
- AT URI scheme: <https://atproto.com/specs/at-uri-scheme>
- XRPC spec: <https://atproto.com/specs/xrpc>
- GitHub notifications docs: <https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications>
- GitHub Copilot code review docs: <https://docs.github.com/en/copilot/concepts/agents/code-review>
- CHAOSS project health model: <https://chaoss.community/kb/metrics-model-starter-project-health/>
- OpenSSF Scorecard: <https://openssf.org/projects/scorecard/>
