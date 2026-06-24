# Tangled Wild Ideas

High-amplitude idea pass after `TANGLED_CASE_LAW_EVIDENCE.md`.

Navigator position: reach mode. The goal here is not to be safe. The goal is to
find a wilder idea that still survives sponsor fit, 20-second clarity, Tangled
specificity, and hackathon build risk.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch
  for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow under test: a maintainer faces AI-era OSS overload; Tangled's
  protocol records decide which code gets attention, which gets cooled down, and
  which gets broadcast across the network.
- Intentionally cut: generic AI review, live semantic indexing, real moderation
  enforcement, production auth, broad multi-repo infrastructure, and any idea
  that cannot land in the first minute.

## Cold Starting Points

Use these as hard constraints:

- Tangled is Git plus AT Protocol communication around code.
- Knots let repositories live on different servers while the appview presents a
  consolidated network view.
- Tangled already has issues, pull requests, comments, vouches, denounces,
  feed records, repo DIDs, spindles, and webhooks as visible surfaces.
- Tangled's vouching announcement explicitly frames LLM-generated subtle-wrong
  submissions as a maintainer burden.
- Vouch and denounce records are public AT Protocol records stored on PDSes and
  scoped through a web of trust.
- Denounces currently do not block users; they inform decisions at interaction
  points.
- Pull request records are ingested through the firehose, and agents can create
  PR records by writing to a PDS.
- Repo DIDs make repository identity more stable across renames and future
  migrations.
- Tangled's exact live lexicons and XRPC surfaces are still moving, so the
  judged happy path should be seeded unless sponsor says otherwise.

## Wild Candidate Ranking

| Rank | Idea | T | A | P | Stick Verdict |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | **Tangled Immune System** | 24 | 95 | 71 | Sticks best. Wild, sponsor-native, demoable seeded. |
| 2 | **Agent Passport Control** | 26 | 93 | 67 | Strong if sponsor likes agent-created PR records. |
| 3 | **OSS Recall Network** | 31 | 96 | 65 | Huge story, but matching/data risk is higher. |
| 4 | **Project Lifeboat Drill** | 28 | 91 | 63 | Very Tangled, but can drift into migration tooling. |
| 5 | **Compatibility Parliament** | 38 | 94 | 56 | Ambitious, but too abstract for 4 minutes. |
| 6 | **Patch Treaty Market** | 40 | 92 | 52 | Interesting, but incentives/bounties distract. |
| 7 | **Case Law / Project Memory** | 18 | 89 | 71 | Still best safe wrapper; no longer the wildest. |

The surprising result: the wild idea with the best expected value ties the safe
Case Law wrapper on `P`, but has much higher story amplitude.

## 1. Tangled Immune System

One-sentence pitch:

> Tangled Immune System protects maintainers from AI-era code spam by turning
> vouches, denounces, PR records, comments, repo identity, and CI into a
> network-native reach layer for open-source review.

Shorter pitch:

> An immune system for open source, built from Tangled's web of trust.

Core problem:

AI tools make plausible code cheap. Maintainer attention becomes the scarce
resource. The open-source question is no longer "can someone submit a patch?"
but "which patches deserve scarce human review?"

Why Tangled:

- GitHub can add spam labels, but Tangled can make trust portable across knots
  and accounts.
- AT Protocol gives identity, public records, appview aggregation, and a
  speech/reach separation: a user can still submit, while each maintainer's
  trust circle controls what gets attention.
- Tangled's own vouching system is already designed to inform decisions at
  issues, PRs, and comments.

Four-minute demo:

1. Open on `solar-knot/payments` during release freeze.
2. Twelve incoming PRs land after a popular AI coding prompt goes viral:
   same bug shape, plausible code, weak tests, unknown DIDs.
3. The Immune System groups them as an `outbreak`: same files, same failing
   spindle pattern, no trusted vouches, two denounces from Mira's circle.
4. It does not block them. It moves them to `cool down` and shows the evidence.
5. A vouched contributor or vouched agent submits the real fix with a passing
   spindle and linked issue. It gets `review now`.
6. Mira posts a calm Tangled comment: `Thanks - this issue is being handled in
   PR #184. Please follow the linked evidence before resubmitting.`

Best demo moment:

> The same code-looking activity gets different reach because Tangled knows the
> network context, not just the diff.

YES evidence:

- Tangled explicitly frames vouching as a response to LLM submissions that look
  correct but are subtly wrong.
- Vouch/denounce records are public PDS records and appear at PR/comment
  decision points.
- Denounces have no hard consequences today, which supports a reach-layer story
  instead of a punitive moderation story.
- PR records, feed comments, repo DIDs, and spindles give enough seeded evidence
  to demo the workflow.

NO evidence:

- Abuse/trust systems are sensitive; a careless demo can look like social
  scoring or exclusion.
- Vouching is people-first today; outbreak grouping is our product layer, not an
  official Tangled primitive.
- It risks sounding like security theater if the UI claims automatic detection.

Stick test:

- YES if we say "inform attention, do not block people."
- YES if the first screen says `AI patch outbreak - cool down 9, review 1`.
- NO if we say "detect spam automatically" or "ban bad contributors."

Build scope:

- Seed 12 incoming PRs with repeated tags.
- Seed vouch/denounce records in Mira's trust circle.
- Seed one passing real fix and one failing spindle cluster.
- Show three lanes: `review now`, `cool down`, `needs human context`.
- Add one Tangled comment preview.

## 2. Agent Passport Control

One-sentence pitch:

> Agent Passport Control lets maintainers accept AI-agent PRs only when the
> agent carries a DID, owner, scope, vouches, prior merged work, and CI proof as
> portable Tangled records.

Why it is wild:

The sponsor newsletter says agents can create pull requests by writing records
to a PDS. That creates a new problem: agents become network actors. If agents
can submit patches, they need identity, accountability, and reputation.

Demo:

1. `@rae.bot` opens a PR record from its PDS.
2. The app shows its passport:
   owner DID, allowed repos, last 5 accepted PRs, vouch from Mira, spindle
   success rate, and one denounce from another maintainer.
3. A second anonymous agent submits a similar patch with no passport and gets
   routed to `manual review`.
4. Mira clicks `allow scoped agent lane for security fixes`.

YES evidence:

- PR records can be created by writing to a PDS.
- Vouching is designed to inform interaction decisions.
- Agent identity is materially different on AT Protocol because records are
  tied to DIDs and repositories.

NO evidence:

- "Agent passport" is not an official Tangled primitive.
- This could become generic AI governance if not tied tightly to PR records and
  Tangled vouches.
- It may be less relatable than human maintainer overload.

Stick test:

- YES if sponsor wants agent-created PRs.
- YES if the demo shows a bot DID and real record preview in the first minute.
- NO if it becomes "AI reviews AI code."

## 3. OSS Recall Network

One-sentence pitch:

> OSS Recall Network broadcasts a security or compatibility advisory over
> Tangled, finds affected repo DIDs, and creates targeted issue or PR drafts
> with protocol evidence attached.

Why it is wild:

It treats open-source like public safety infrastructure. One advisory becomes a
network-wide, trust-scoped response.

Demo:

1. Sana publishes `Webhook replay advisory`.
2. The appview-style screen finds three affected Tangled repos.
3. Each repo gets a targeted action:
   - issue only
   - patch draft
   - no action because it already has a passing spindle
4. Maintainers see why they were notified: dependency, file path, comment,
   spindle, repo DID.

YES evidence:

- Tangled federates code events across knots.
- Pull records and issue/comment records are protocol-visible surfaces.
- PR records can be agent-created through PDS writes.

NO evidence:

- Matching affected repos is large and easy to fake badly.
- Too much cross-repo machinery for the timebox.
- A security advisory story can become generic Dependabot unless trust and AT
  records are front and center.

Stick test:

- YES if sponsor asks for cross-repo coordination.
- NO if we cannot seed affected-repo evidence clearly.

## 4. Project Lifeboat Drill

One-sentence pitch:

> Project Lifeboat Drill shows a repository surviving a forge or knot failure:
> code moves, repo identity stays stable, and issues, PRs, trust, comments, and
> CI context rehydrate from Tangled records.

Why it is wild:

It makes the anti-monoculture argument physical. The demo can start with:
`GitHub is down. What survives?`

Demo:

1. Old forge/knot is marked unavailable.
2. Repo reappears on a new knot with repo DID continuity.
3. The app restores open PRs, issue context, vouches, and CI state from seeded
   AT records.
4. Maintainer continues the release review without losing social context.

YES evidence:

- Tangled explicitly argues against forge monocultures.
- Knots and repo DIDs support the story.
- Official docs say migration preserves Git branches/tags but not issues/PRs,
  which makes collaboration recovery a real gap.

NO evidence:

- Real migration between knots is not the thing to build live.
- It can feel like import tooling rather than daily workflow.
- The demo must show maintainer value after recovery, not just a migration
  animation.

Stick test:

- YES if the sponsor cares about migration and federation reliability.
- NO if judges read it as backup software.

## 5. Compatibility Parliament

One-sentence pitch:

> Compatibility Parliament lets downstream maintainers sign, test, or object to
> breaking changes as AT Protocol records before an upstream project merges.

Why it is wild:

Open-source governance is usually buried in maintainer memory. This makes
ecosystem consent visible and portable.

Demo:

1. Upstream PR changes a checkout API.
2. Three downstream repo DIDs receive compatibility ballots.
3. Spindles run downstream smoke tests.
4. Two maintainers sign off, one blocks with evidence.
5. Upstream sees a merge recommendation.

YES evidence:

- Repo DIDs, spindles, PR records, and comments can represent the pieces.
- It is deeply protocol-native because cross-repo governance needs identities
  outside one forge.

NO evidence:

- Too abstract for a short pitch.
- Requires explaining downstream governance before showing value.
- Build risk is high unless fully seeded.

Stick test:

- YES only if sponsor wants ambitious ecosystem coordination.
- NO for the default demo.

## The Best Wild Bet

The best wild idea to test is **Tangled Immune System**.

Why it sticks:

- It is anchored in Tangled's stated LLM-spam/vouching motivation.
- It uses Tangled's trust layer to change review reach, not just decorate cards.
- It has a visceral first screen: `AI patch outbreak`.
- It can be built with seeded records and the current prototype's evidence
  components.
- It gives the sponsor a memorable line:

> Tangled is the forge where maintainers can keep code collaboration open
> without giving every patch equal claim on human attention.

## How It Relates To The Current Build

Do not throw away Evidence Radar. Turn it into the visible core of the Immune
System:

- Evidence Radar's `Review now` becomes immune-system `review now`.
- Evidence Radar's `Needs context` becomes `needs human context`.
- Evidence Radar's `Safe to batch` becomes `cool down`.
- Case Law / Project Memory becomes one evidence type: precedent match.
- Agent Passport becomes one evidence type: agent identity and scope.
- Recall Network becomes a future network-wide mode.

This keeps build risk controlled while making the story much wilder.

## Sponsor Gate

Ask:

> Tangled's vouching post frames LLM-generated subtle-wrong code as a maintainer
> burden. Would you rather see a trust-aware review queue, or a full "immune
> system" that groups AI patch outbreaks and controls review reach without
> blocking contributors?

If they lean yes:

> Should we focus the demo on human contributors, AI agents, or both?

Interpretation:

- If they say human: build Tangled Immune System.
- If they say agents: build Agent Passport Control.
- If they say cross-repo: build OSS Recall Network.
- If they hesitate on the metaphor: keep Evidence Radar and use "immune system"
  as a pitch beat only.

## Build Slice

First screen:

- Header: `@mira.tangled.sh`, `solar-knot/payments`, repo DID, knot, release
  freeze.
- Alert: `AI patch outbreak detected: 9 similar PRs cooled down`.
- Lanes:
  - `review now`: vouched real fix with linked issue and passing/focused spindle
  - `cool down`: repeated unknown-DID AI-looking patches
  - `needs human context`: unknown but unique contributor work
- Detail view:
  - DID/handle
  - vouch/denounce evidence
  - PR record AT URI
  - comment AT URI
  - spindle pattern
  - repo DID/knot
  - preview Tangled comment

Do not build:

- real spam classifier
- live trust graph
- enforcement or blocking
- fully live PDS writes
- real multi-repo outbreak detection

## Source Notes

- Tangled federation: Git plus AT Protocol communication, knots, cross-server
  collaboration, issues/PR events:
  https://blog.tangled.org/federation/
- Tangled vouching: LLM-submission burden, vouch/denounce records, no hard
  consequences, evidence-trail direction:
  https://blog.tangled.org/vouching/
- Tangled newsletter 02: public PDS vouch records, PR records ingested through
  firehose, agents can create PRs by writing records to a PDS, repo DIDs:
  https://blog.tangled.org/newsletter-02/
- Tangled docs: appview across knots, repo creation on knots, spindles,
  migration limitations and API churn:
  https://docs.tangled.org/single-page
- Tangled migration docs: repo DIDs and XRPC/lexicon migration details:
  https://docs.tangled.org/migrating-knots-and-spindles
- AT Protocol overview: DIDs, handles, repositories, lexicons, PDS, relays,
  appviews, firehose:
  https://atproto.com/guides/overview
- AT Protocol repository spec:
  https://atproto.com/specs/repository
- AT Protocol XRPC spec:
  https://atproto.com/specs/xrpc
