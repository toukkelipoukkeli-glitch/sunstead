# Tangled High-Level Thesis

## Core Connection

Open source's bottleneck is shifting from producing code to trusting change.

Git already made code history portable:

- what changed
- who committed it
- when it happened
- how the code evolved

But the future bottleneck is the evidence around the change:

- who or what produced this patch
- why it was made
- who stands behind it
- whether this actor has earned attention before
- what issue, test, CI run, review, precedent, or vouch supports it
- whether a maintainer should spend scarce review time on it

That evidence usually lives in scattered places: forge comments, CI logs,
maintainer memory, chat threads, issue history, review habits, private trust
judgment, and platform-specific metadata.

Tangled's unique power is making that collaboration context portable protocol
data.

## The Thesis

> Git makes code portable. Tangled makes trust around code portable.

Sharper AI-era version:

> AI makes patches cheap. Tangled makes patches accountable.

## The Real Problem

The problem is not "we need a better GitHub."

The problem is:

> A bare diff is no longer enough information to decide whether a change deserves
> human attention.

This becomes more urgent because:

- AI can generate plausible patches cheaply
- review time remains scarce
- subtle-wrong code is expensive to catch
- agents can submit changes without obvious accountability
- contributors move across projects, accounts, and hosting surfaces
- project judgment is trapped in old comments, past PRs, and maintainer memory
- decentralized hosting only works if the social context can move too

## Tangled's Solution Shape

Tangled can become the trust and evidence layer for software change.

Instead of treating a pull request as only a diff, Tangled can make it a bundle
of protocol evidence:

- identity: handle, DID, human or agent source
- intent: linked issue, advisory, maintainer request, or project goal
- trust: vouches, denounces, prior accepted work
- project memory: previous decisions, conventions, rejected approaches
- review context: comments, PR rounds, requested changes
- code health: spindle/CI result, tests added, failing checks
- repo context: repo DID, knot, branch, release state
- provenance: source records, AT URIs, PDS-backed evidence

That turns a patch from:

> "Here is a diff. Please trust me."

into:

> "Here is a change with identity, intent, tests, trust, and source records."

## Product Consequence

The product should not be framed as:

- a dashboard
- an AI reviewer
- a smarter queue
- decentralized GitHub
- a trust score
- a spam detector

The product should be framed as:

> a reviewability layer for open source.

The strongest product object is a **reviewability receipt**:

- enough evidence to justify spending maintainer time
- clear missing evidence when the patch is not ready
- portable proof links instead of hidden platform state
- maintainer control rather than automated punishment

## Current Best Instantiation

Platform framing:

> **Tangled Review Passport** makes patches reviewable before they consume
> maintainer time.

First demo wedge:

> **Tangled Patch Passport for AI PRs** makes AI-generated pull requests carry
> identity, intent, tests, trust, and provenance before a maintainer reviews
> them.

Supporting frames:

- **Project Memory**: project decisions become evidence for future patches.
- **Immune System**: low-evidence AI patch bursts lose review reach without
  blocking contributors.
- **Agent Passport**: agents become accountable network actors.
- **Evidence Radar**: the implementation shell for showing the next reviewable
  action.

## Demo Principle

The demo should prove one thing:

> A bare diff is not reviewable. A Tangled patch with receipts is reviewable.

Concrete demo:

1. Two AI PRs both look plausible.
2. Both pass superficial tests.
3. One has a complete review passport:
   - agent DID
   - human sponsor
   - linked issue
   - focused test
   - spindle result
   - vouch evidence
   - project-memory citation
   - AT URI receipt chain
4. The other lacks identity, intent, and trustworthy evidence.
5. The maintainer reviews the first and asks the second to resubmit with missing
   receipts.

This makes Tangled's protocol layer visible in the first minute.

## One-Liners

Best:

> AI makes patches cheap. Tangled makes patches accountable.

Broad:

> Git makes code portable. Tangled makes trust around code portable.

Product:

> Tangled Review Passport makes patches earn review with identity, intent,
> tests, trust, and protocol evidence.

Demo:

> Two patches can look equally plausible; Tangled shows which one has earned
> maintainer attention.

## What To Avoid

Do not overclaim:

- Tangled proves code is safe.
- AI-generated code can be reliably detected.
- vouches should auto-merge patches.
- denounces should block people.
- custom receipt records are already official Tangled primitives.

Do say:

- Tangled makes evidence visible.
- Tangled separates submission from review reach.
- Maintainers stay in control.
- Receipts justify attention; they do not prove correctness.
- AI code is welcome when accountable.

## Final North Star

> Tangled should be the forge where humans and agents can both contribute, but
> no patch gets maintainer attention without receipts.
