# Autonomous Agents World

Theme packet for the Tangled direction:

> autonomous agents + freedom + radical transparency.

Read the deeper argument in [DEEP_THESIS.md](DEEP_THESIS.md).

## Core Thesis

Tangled should not be the place where AI agents hide inside opaque SaaS tools.

Tangled should be:

> an open forge where humans and agents can act freely, but every meaningful
> action carries public, portable evidence.

The principle:

> Freedom to contribute. Receipts to be reviewed.

## Why This Fits Tangled

Tangled's challenge asks for original, inspiring integrations that lean into AT
Protocol primitives instead of reinventing infrastructure.

The autonomous-agent world fits because Tangled can make agent work:

- attributable through DIDs and handles
- protocol-addressable through AT URIs
- inspectable through public records
- socially contextual through vouches and denounces
- repo-aware through repo DIDs and knots
- test-aware through spindles
- portable across tools because the evidence is protocol data

The key difference from normal AI devtools:

> Agents are not invisible workers behind an API. They are network actors with
> identity, history, evidence, and accountability.

## The World

In a Tangled-native agent world:

- agents have identities, not just API keys
- agents submit PRs, comments, test fixes, and review notes as first-class actors
- every action is addressable: who did it, why, for which repo, with what
  evidence
- maintainers do not need to ban agents; they decide which agents earn review
  reach
- trust is social and portable: vouches, denounces, prior accepted work, repo
  context
- anyone can build an agent, point it at open repos, and publish work
- transparency keeps the system sane: no invisible agent actions, no
  context-free patches, no anonymous slop asking for human time

The high-level claim:

> Autonomous agents need freedom to act, and open source needs radical
> transparency to trust them. Tangled is the protocol-native place where both can
> coexist.

## What This World Should Have

### 1. Agent Identity

Each agent should have:

- handle
- DID
- owner or steward
- scope
- public history

Not:

> some bot commented

But:

> `@rae.bot`, owned by `@jules.dev`, scoped to webhook/security fixes, with
> previous accepted PRs.

### 2. Action Receipts

Every agent action should carry a receipt:

- task or intent
- source issue
- changed files
- tests added or run
- spindle result
- prompt or instruction summary
- human sponsor if any
- AT URI evidence chain

The receipt does not prove the code is safe. It proves the action is
accountable enough to review.

### 3. Agent Flight Recorder

Every agent PR should be replayable:

- why the agent acted
- what it read
- what it changed
- what checks ran
- what comments or review notes happened
- which human or agent vouched for it
- what source records support the claim

Product phrase:

> a flight recorder for autonomous code agents.

### 4. Review Reach, Not Permission Walls

Agents should be free to publish work. Maintainers should control attention.

Lanes:

- `Trusted agent lane`
- `Needs human sponsor`
- `Missing receipts`
- `Cool down`

This avoids authoritarian moderation while protecting maintainer time.

### 5. Human Sponsorship

A human can stand behind an agent's work.

This is important because the future is not only agent reputation. It is
human-agent accountability chains:

> this agent acted, but this human or maintainer is willing to vouch for its
> scope and output.

### 6. Portable Agent Reputation

If an agent earns trust in one Tangled repo, that history should travel.

Not as a global score.

As inspectable evidence:

- accepted PRs
- reverted PRs
- vouches
- denounces
- scope history
- spindle results
- maintainer comments

### 7. Radical Transparency UI

Protocol evidence should be visible in the first minute:

- agent DID
- owner DID
- PR record AT URI
- issue/comment records
- vouches/denounces
- repo DID
- knot
- spindle run

If these are hidden, the demo becomes a generic AI tool.

## Product Shapes

Best names to test:

1. **Tangled Agent Flight Recorder**
2. **Tangled Review Passport for Agents**
3. **Tangled Agent Passport**
4. **Trust Receipts for Agent PRs**

Strongest pitch:

> Autonomous agents should be free to build in open source, but every action
> should be transparent, attributable, and reviewable. Tangled makes that
> possible because agent work can be protocol-native: identity, intent, PRs,
> comments, tests, vouches, and CI all become portable records.

## Best Demo

Demo setup:

- repo: `solar-knot/payments`
- maintainer: `@mira.tangled.sh`
- trusted contributor: `@jules.dev`
- autonomous agent: `@rae.bot`
- weak anonymous agent: `@patchfox.bot`
- release context: `v1.4.0` freezes today

Demo flow:

1. A security issue is open.
2. `@rae.bot` autonomously creates a small test-fix PR.
3. The PR opens with an Agent Flight Recorder:
   - agent DID
   - owner DID
   - intent
   - linked issue
   - files changed
   - tests added
   - spindle result
   - vouch evidence
   - PR/comment AT URIs
4. Maintainer sees `Trusted agent lane`.
5. `@patchfox.bot` submits a similar-looking PR with missing identity and no
   evidence.
6. It is routed to `Missing receipts`.
7. Maintainer previews a Tangled comment:
   `Please resubmit with agent identity, issue link, focused test, and spindle
   evidence.`

Best demo line:

> Tangled is the open forge where agents can act freely, but never invisibly.

## What To Cut

Do not build:

- generic AI code review
- live AI detection
- automatic blocking
- auto-merge
- global trust score
- full agent runtime
- real prompt replay beyond a summary
- live custom lexicon writes unless sponsor explicitly asks
- multi-repo agent reputation backend

## Relation To Current Ideas

This theme absorbs the previous directions:

- **Review Passport** becomes the general object.
- **Patch Passport** becomes the AI PR use case.
- **Agent Passport** becomes the identity layer.
- **Project Memory** becomes evidence inside the receipt.
- **Immune System** becomes the attention/reach policy.
- **Evidence Radar** remains the UI shell.

Current recommendation:

> Build one autonomous-agent flow, not a broad dashboard.

## Sponsor Gate

Ask:

> What would be more exciting for Tangled: a maintainer queue that ranks PRs, or
> an autonomous agent that opens a PR with a public flight recorder built from AT
> Protocol records?

Follow-up:

> Should the agent write an actual Tangled comment/PR record, or should the demo
> show a seeded protocol-faithful receipt first?

Interpretation:

- If sponsor wants agentic: lead with Agent Flight Recorder.
- If sponsor wants write-side proof: preview or write one comment/PR record.
- If sponsor wants trust/vouching: emphasize Review Passport.
- If sponsor worries about live risk: keep seeded evidence and show the live
  path.

## Pitch Skeleton

Twenty seconds:

> Autonomous agents are about to become open-source contributors. Tangled should
> make them free to act, but never invisible. Our agent opens PRs with a public
> flight recorder: identity, intent, tests, vouches, spindle results, and AT URI
> evidence.

Close:

> The future of open source is not humans versus agents. It is humans and agents
> collaborating in the open, with radical transparency around every change.

## Sources

- Tangled challenge info: `TANGLED_CHALLENGE_INFO.txt`
- High-level thesis: `TANGLED_HIGH_LEVEL_THESIS.md`
- Archetype convergence: `TANGLED_ARCHETYPE_CONVERGENCE.md`
- AI PR trust: `TANGLED_AI_PR_TRUST.md`
- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- Tangled federation: https://blog.tangled.org/federation/
- Tangled docs: https://docs.tangled.org/single-page
- AT Protocol overview: https://atproto.com/guides/overview
