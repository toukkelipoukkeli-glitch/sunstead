# Tangled Archetype Convergence

Developer-archetype lens for the Tangled idea slate.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch
  for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow: a maintainer decides whether an AI-produced PR is reviewable
  because it carries protocol evidence.
- Intentionally cut: generic AI review, broad dashboards, automatic blocking,
  universal trust scores, full live graph indexing, and every archetype flow
  except the one demo path.

## Convergence

Looking across developer archetypes, the center is not "better PR ranking" and
not even only "AI PR trust."

The convergence is:

> Tangled can make patches reviewable before they consume maintainer time.

The object every archetype wants is a **reviewability receipt**:

- who or what produced the patch
- who stands behind it
- what issue or intent it claims to solve
- what project memory or precedent it cites
- what tests and spindle results back it
- what risk surface it touches
- what vouches, denounces, or prior work affect review friction
- what AT URIs prove the evidence trail

AI slop is the sharpest crisis and best demo wedge. But the broader product is:

> a protocol-native reviewability layer for open source.

Working product name:

> **Tangled Review Passport**

Demo-specific name:

> **Tangled Patch Passport for AI PRs**

## Archetype Map

| Archetype | Fear / Pain | What They Want | Tangled Primitive Pull | Product Pull |
| --- | --- | --- | --- | --- |
| Overloaded maintainer | AI and drive-by PRs waste scarce review time. | Know what deserves attention before reading the whole diff. | Vouches, denounces, issue records, pull records, spindles. | `Ready / Missing receipts / Cool down` lanes. |
| Core reviewer | A subtle bad patch slips through because context is missing. | A compact evidence chain before making the call. | Comments, PR rounds, spindle logs, repo DID. | Passport detail view before diff review. |
| Trusted contributor | Their earned reputation disappears across repos, knots, or accounts. | A portable fast lane backed by prior accepted work. | DID, handle, vouch records, merged PR evidence. | Review friction drops when trust evidence is present. |
| New contributor | Rejection feels opaque and arbitrary. | A clear checklist for earning review. | Issue links, comments, project records, public reasons. | Missing-receipts checklist instead of silent deprioritization. |
| AI-assisted human | AI use may get blanket-distrusted even when the work is careful. | A way to disclose, cite intent, add tests, and stay accountable. | Pull record, issue record, human sponsor, spindle. | AI is acceptable when it arrives with receipts. |
| Autonomous agent builder | Agent PRs are distrusted because they look ownerless. | Agent identity, scope, owner, and history. | DID/PDS records, agent-created PR records, vouches. | Agent passport as a receipt subtype. |
| Security maintainer | Urgent fixes drown in low-quality patches or unclear claims. | Intent, risk, tests, and trusted reporter context up front. | Security issue records, vouched reporters, focused spindles. | Security PR fast lane when evidence is complete. |
| Downstream maintainer | Upstream changes break consumers without visible consent. | Compatibility evidence and signed objections/approvals. | Repo DIDs, comments, downstream spindle results. | Future compatibility receipt, not first demo. |
| Project lead / incoming maintainer | Project judgment is trapped in old comments and memory. | Decisions and norms that survive handoff. | Comments, issue records, pull records, vouches, repo DID. | Project Memory becomes one passport field. |
| Knot or spindle operator | Failure context is split between infra and collaboration. | Events tied to repo identity and review decisions. | Knot identity, repo DID, spindle runs, webhooks. | CI is evidence inside the passport, not a separate dashboard. |
| Tangled sponsor / judge | A demo could be a GitHub dashboard with Tangled labels. | A workflow that only makes sense when records are portable. | AT URIs, DIDs, PDS records, appview/firehose, vouches. | The passport must visibly collapse without Tangled primitives. |

## What Multiple Angles Agree On

Every archetype asks for the same primitive in different language:

> show me the evidence before asking for my trust.

Maintainers call it triage.

Contributors call it fairness.

Agents call it identity and scope.

Security people call it provenance.

Project leads call it memory.

Tangled should call it reviewability.

## Product Shape

The main screen should not feel like a generic queue. It should feel like a
reviewability checkpoint.

Lanes:

- `Ready to review`: complete enough receipt for a maintainer to spend time.
- `Missing receipts`: patch may be valid but lacks intent, tests, owner, or
  source records.
- `Cool down`: repeated low-evidence or negatively vouched pattern; not blocked,
  just not given immediate review reach.

Passport checks:

- `Identity`: human or agent DID, handle, owner.
- `Intent`: linked issue, maintainer request, or advisory.
- `Evidence`: tests, spindle, comment, PR round, source AT URIs.
- `Trust`: vouches, denounces, previous accepted work.
- `Project memory`: precedent, convention, or previous decision.
- `Risk`: files touched, security/auth/payment surfaces.

Action copy:

- `Review now`
- `Request missing receipt`
- `Ask for human sponsor`
- `Cool down repeated low-evidence pattern`
- `Fast-track vouched focused fix`

## Best Demo From This Lens

Use AI slop as the visible crisis:

1. Two AI PRs both look plausible and both pass tests.
2. The first has a full review passport:
   `@rae.bot`, owner DID, Jules as human sponsor, linked security issue, focused
   regression test, passing spindle, vouch evidence, AT URI receipt chain.
3. The second has no stable identity, no issue link, deletes a test, touches auth
   code, and matches a denounced low-evidence pattern.
4. The maintainer sees:
   - first PR: `Ready to review`
   - second PR: `Missing receipts`
5. The app previews a Tangled comment:
   `Please resubmit with an issue link, focused test, and agent identity record.`

Best 20-second pitch:

> AI made patches cheap. Tangled Review Passport makes patches earn review with
> identity, intent, tests, trust, and protocol evidence.

Close:

> Tangled should be the forge where humans and agents can both contribute, but
> no patch gets maintainer attention without receipts.

## Score Update

| Option | T | A | P | Read |
| --- | ---: | ---: | ---: | --- |
| **Tangled Review Passport** | 20 | 98 | 78 | Best convergence: covers AI slop, contributors, maintainers, and agents. |
| Tangled Patch Passport for AI PRs | 22 | 97 | 75 | Best concrete first demo. |
| Evidence Radar as implementation shell | 16 | 91 | 75 | Best existing build surface. |
| Tangled Immune System | 24 | 95 | 71 | Best broader metaphor, but more sensitive. |
| Project Memory / Case Law | 18 | 89 | 71 | Strong supporting field inside the passport. |

Decision:

> Pitch the platform idea as Tangled Review Passport. Demo the first use case as
> Patch Passport for AI PRs. Keep Evidence Radar as the implementation shell.

## Why This Is Stronger Than Patch Passport Alone

Patch Passport answers the current AI-slop problem.

Review Passport explains why this becomes a Tangled platform wedge:

- Humans need it too.
- New contributors benefit from transparent requirements.
- Trusted contributors get portable review credit.
- Agents can become accountable network actors.
- Maintainers can preserve scarce attention.
- Sponsors see a workflow built from Tangled records, not just AI policy.

This framing avoids making the product sound anti-AI. The stance is:

> AI code is welcome when it is accountable.

## What To Build

Build the AI PR demo, not every archetype.

Minimum demo data:

- one vouched human sponsor
- one AI agent DID
- one complete AI PR passport
- one missing-receipts AI PR
- one normal human PR as a control
- one project-memory citation
- one spindle result
- one Tangled comment preview

Do not build:

- a universal contributor reputation system
- real AI detection
- automated enforcement
- cross-repo compatibility ballots
- live custom lexicon writes unless sponsor explicitly asks
- a broad settings or policy editor

## Sponsor Gate

Ask:

> If AI agents and AI-assisted humans are going to submit more PRs, should
> Tangled be the place where patches carry reviewability receipts: identity,
> intent, tests, trust, and source records?

If yes:

> Should the demo call this Review Passport, Patch Passport, or Trust Receipts?

Interpretation:

- If sponsor likes AI pain: lead with `Patch Passport for AI PRs`.
- If sponsor likes platform ambition: lead with `Review Passport`.
- If sponsor likes trust/vouching: lead with `Immune System`, but keep the UI as
  passports and receipts.
- If sponsor wants write-side integration: preview a custom receipt record.

## Naming

Best public names to test:

1. **Tangled Review Passport**
2. **Tangled Patch Passport**
3. **Trust Receipts for AI PRs**

Avoid as primary names:

- `trust score`
- `AI slop detector`
- `spam filter`
- `case law`
- `immune system`

The avoided names can still be useful as pitch metaphors, but they are either
too punitive, too abstract, or too easy to misunderstand.

## Sources

- Current local synthesis: `TANGLED_AI_PR_TRUST.md`
- Wild idea pass: `TANGLED_WILD_IDEAS.md`
- Project-memory thesis: `evidence-radar-atproto/DEEP_THESIS.md`
- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- Tangled federation: https://blog.tangled.org/federation/
- Tangled docs: https://docs.tangled.org/single-page
- AT Protocol overview: https://atproto.com/guides/overview
