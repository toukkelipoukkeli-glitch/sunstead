# Top Ideas Pitch

Use this as the single pitch packet for the best ideas generated so far. It is
not the final 4-minute script. It is the decision and presentation sheet for
choosing which idea to take to Tangled sponsors or judges.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, with sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for
  4 minutes with 1 minute of questions.
- Chosen track: Tangled main challenge.
- Core target: build an AT Protocol integration that plugs into Tangled and
  improves open-source workflow.
- Shared demo rule: one maintainer, one repo, one visible decision, with
  Tangled/ATProto primitives visible in the first minute.
- Intentionally cut across all ideas: generic AI code review, broad analytics,
  production auth, live firehose dependency, full semantic search, multi-repo
  infrastructure, and any side-track wrapper before the Tangled story lands.

## Shared Thesis

> Git preserves what changed. Tangled can preserve why maintainers trust,
> reject, fast-track, or block a change.

The strongest shared problem is not "rank PRs better." It is:

> Maintainers do not need more notifications. They need evidence for the next
> decision.

Sharper AI-era version:

> AI made code cheap, but review is still scarce. Maintainers need to know which
> AI-produced PRs deserve human attention before reading the whole diff.

Archetype convergence:

> Every developer archetype wants the same thing in different language:
> reviewability receipts before trust is requested.

The strongest shared Tangled wedge:

> AT Protocol gives portable identity, typed records, record addressing, signed
> user repositories, XRPC, and sync. Tangled turns those into open-source
> collaboration surfaces: repo DIDs, knots, pull records, issue records, comments,
> vouches, PR rounds, and spindles.

If an idea still works after removing handles, DIDs, AT URIs, vouches, repo DIDs,
knots, pull/issue/comment records, and spindle state, it is not Tangled-native
enough.

## Ranked Slate

| Rank | Idea | Pitch | Best Use | T/A/P |
| ---: | --- | --- | --- | ---: |
| 1 | **Tangled Review Passport** | Reviewability receipts for human and AI patches. | Best converged platform framing. | 20/98/78 |
| 2 | **Tangled Patch Passport** | Trust receipts for AI-produced PRs. | Best first demo and AI-slop answer. | 22/97/75 |
| 3 | **Evidence Radar as Project Memory** | Auditable maintainer decisions from Tangled records. | Best current implementation shell. | 16/91/75 |
| 4 | **Tangled Immune System** | A trust-aware reach layer for AI-era code spam. | Best broader metaphor if sponsor likes vouching/LLM-spam angle. | 24/95/71 |
| 5 | **Tangled Case Law** | Project decisions become portable precedent. | Best supporting evidence type if sponsor likes project memory or custom records. | 18/89/71 as wrapper, 34/92/58 as pure custom-record build |
| 6 | **Agent Passport Control** | AI-agent PRs carry identity, scope, vouches, and CI proof. | Best if sponsor emphasizes agent-created PR records. | 26/93/67 |
| 7 | **OSS Recall Network** | Broadcast advisories and create targeted Tangled actions. | Best if sponsor wants cross-repo coordination. | 31/96/65 |
| 8 | **Patch Customs Desk** | Screen a drive-by patch into a Tangled-ready PR plan. | Best write-side pivot. | 24/87/63 |
| 9 | **CI Black Box Recorder** | Replay a failed spindle run as a maintainer action timeline. | Best narrow technical/spindle demo. | 20/78/58 |
| 10 | **Project Lifeboat Drill** | Move code, then rehydrate repo judgment from protocol records. | Best if sponsor cares about migration/federation resilience. | 28/91/63 |
| 11 | **Trust-Aware Review Queue** | Vouches change review friction. | Safest small version of Evidence Radar. | 18/74/56 |
| 12 | **Good First Journey Packs** | Contributor onboarding packs from Tangled identity and trust. | Friendly contributor-side story, lower main-track edge. | 28/77/49 |
| 13 | **Migration Story Preserver** | Preserve issues, PRs, and decisions when moving to Tangled. | Practical migration gap, weaker live pitch. | 30/76/46 |
| 14 | **Compatibility Parliament** | Downstream maintainers sign, test, or object before merge. | Ambitious ecosystem-governance stretch. | 38/94/56 |

## 1. Tangled Review Passport

One-liner:

> Tangled Review Passport makes patches reviewable before they consume
> maintainer time.

Short thesis:

> Every patch should carry receipts: identity, intent, tests, trust, project
> memory, risk, and source records.

Core demo:

1. Mira opens `solar-knot/payments` during release freeze.
2. The app shows three lanes: `Ready to review`, `Missing receipts`, and
   `Cool down`.
3. The first use case is AI PR trust: one AI PR has a complete passport, another
   is missing identity, intent, and test evidence.
4. The complete passport reveals DID, human sponsor, linked issue, project
   memory, focused spindle, vouch evidence, and AT URI receipt chain.
5. Mira reviews the complete patch and asks the weak patch to resubmit with
   missing receipts.

Why it wins:

- It converges across maintainers, contributors, agents, security maintainers,
  downstream users, and Tangled itself.
- It is not anti-AI; it says AI code is welcome when accountable.
- It is broader than a queue, but still demoable through one AI PR flow.
- It turns Tangled's records into a new open-source norm: reviewability.

Sponsor test:

> Should Tangled be the place where patches carry reviewability receipts before
> maintainers spend time on them?

## 2. Tangled Patch Passport

One-liner:

> Tangled Patch Passport makes AI-produced PRs carry identity, intent, tests,
> trust, and provenance before maintainers spend review time on them.

Short thesis:

> AI PRs need receipts.

Core demo:

1. Mira opens `solar-knot/payments` during release freeze.
2. Two AI-generated PRs look plausible and both have passing tests.
3. `PR #189` has a complete passport: agent DID, human sponsor, linked issue,
   project-memory reference, focused test, spindle result, vouch evidence, and
   AT URI receipt chain.
4. `PR #190` has no stable agent identity, no linked issue, touches auth code,
   deletes a test, and matches a denounced low-evidence pattern.
5. The app routes `PR #189` to `Ready to review` and `PR #190` to
   `Missing receipts`.
6. Mira opens the good PR and sees the passport before the diff.

Why it wins:

- It attacks the most current maintainer pain: AI-generated plausible code.
- It is directly supported by Tangled's vouching motivation around LLM slop.
- It uses Tangled as a network of accountable records, not just a forge UI.
- It keeps maintainers in control and avoids unreliable AI-detection claims.
- It can be built with seeded records on the existing Evidence Radar UI.

Tangled proof:

- agent handle and DID
- human sponsor DID
- pull record AT URI
- linked issue/comment records
- vouch or denounce records
- repo DID and knot
- spindle run or CI reference
- optional `app.sunstead.aiPatchReceipt` preview if sponsor wants custom records

Cut:

- no AI-detection claim
- no auto-blocking or auto-merge
- no generic AI code review
- no live custom write dependency
- no cryptographic model-provenance overclaim

Sponsor test:

> Since Tangled already frames vouching as protection against LLM-generated
> subtle-wrong submissions, would an "AI PR passport" be a stronger demo than a
> general maintainer queue?

## 3. Evidence Radar As Project Memory

One-liner:

> Evidence Radar turns Tangled's protocol records into auditable maintainer
> decisions.

Short thesis:

> Project Memory for Tangled: maintainer judgment with receipts.

Core demo:

1. Mira opens `solar-knot/payments`.
2. The header shows maintainer handle, repo DID, knot, and release context.
3. The top item is `PR #184: Harden webhook signature verification`.
4. It is first because Jules is vouched, issue #91 blocks the release, the
   spindle failure is focused, and the latest round changed one risky file.
5. Opening the item reveals the evidence chain: DID, vouch, issue record, feed
   comment, pull record AT URI, repo DID, and spindle result.

Why it wins:

- It is already the current prototype direction.
- It is easy to understand in 20 seconds.
- It makes Tangled primitives visible without requiring live auth.
- It keeps the maintainer in control instead of hiding behind AI.

Tangled proof:

- `@jules.dev -> did:plc:jules-vouched`
- `at://did:plc:jules-vouched/sh.tangled.repo.pull/payments-184`
- vouch record from Mira
- linked issue/comment records
- repo DID and knot
- spindle run

Cut:

- no generic charts
- no AI review comments
- no live indexing
- no full auth
- no multi-repo setup

Sponsor test:

> Would you rather see a Tangled maintainer tool that ranks current work, or one
> that preserves and applies project decisions as protocol evidence?

## 4. Tangled Immune System

One-liner:

> Tangled Immune System protects maintainers from AI-era code spam by turning
> vouches, denounces, PR records, comments, repo identity, and CI into a
> network-native reach layer for open-source review.

Shorter:

> An immune system for open source, built from Tangled's web of trust.

Core demo:

1. Twelve plausible PRs arrive after a popular AI coding prompt goes viral.
2. The app groups nine as an `AI patch outbreak`: similar files, similar failing
   spindle pattern, unknown DIDs, weak or negative trust evidence.
3. It does not block anyone. It moves them to `cool down`.
4. A vouched contributor submits the focused fix with linked issue evidence and
   a useful spindle result.
5. That fix goes to `review now`.
6. Mira posts a calm Tangled comment pointing contributors to the handled issue
   and evidence trail.

Why it wins:

- It is memorable.
- It is anchored in Tangled's vouching motivation around low-quality LLM
  submissions.
- It turns trust into reach, not punishment.
- It reuses the Evidence Radar UI lanes with a stronger story.

Tangled proof:

- vouch and denounce records affect review reach
- PR records show repeated submissions
- spindle pattern clusters the failure
- repo DID/knot keep the event Tangled-native
- comments become the maintainer response path

Cut:

- no real spam classifier
- no banning
- no automatic enforcement
- no live trust graph
- no claim that Tangled already has this whole immune layer

Sponsor test:

> Tangled's vouching post frames LLM-generated subtle-wrong code as a maintainer
> burden. Would you rather see a trust-aware queue, or a full immune system that
> cools down patch outbreaks without blocking contributors?

## 5. Tangled Case Law

One-liner:

> Tangled Case Law turns maintainer decisions into portable protocol precedent,
> so every new PR can show the issue, pull request, vouch, comment, and CI
> evidence behind project judgment.

Safer public name:

> Project Memory for Tangled.

Core demo:

1. `PR #187: Replace checkout session cache` passes tests.
2. The app says it reopens a rejected architecture decision:
   `Hosted knots must not require Redis`.
3. A precedent card shows the old issue, old pull record, maintainer comment,
   vouch evidence, repo DID, knot, and spindle result.
4. Mira previews a Tangled comment:
   `This repeats a decision we made for hosted-knot deployability. Please adapt
   this to the SQLite-backed adapter. Evidence: ...`
5. A second PR is fast-tracked because it follows a trusted security precedent.

Why it wins:

- It is the deepest thesis.
- It makes project judgment portable, not just current work prioritized.
- It is differentiated from dashboards, AI review, and migration tooling.
- It gives Tangled a powerful product story: code moves, and judgment moves too.

Risk:

- No official precedent/project-decision lexicon is currently confirmed.
- "Case law" can sound legalistic.
- Semantic matching is out of scope.

Cut:

- no full semantic search
- no live custom lexicon write unless sponsor explicitly wants it
- no binding policy enforcement
- no legal-heavy language in the pitch

Sponsor test:

> Should the demo use existing Tangled records and comments only, or would a
> custom project-decision record be welcome?

## 6. Agent Passport Control

One-liner:

> Agent Passport Control lets maintainers accept AI-agent PRs only when the agent
> carries a DID, owner, scope, vouches, prior merged work, and CI proof as
> portable Tangled records.

Core demo:

1. `@rae.bot` opens a PR record from its PDS.
2. The app shows its passport: owner DID, allowed repos, prior accepted PRs,
   vouch from Mira, spindle success rate, and one denounce.
3. A second anonymous agent submits a similar patch without identity or scope.
4. Rae's scoped patch goes to `review now`; the anonymous patch goes to
   `manual review`.
5. Mira previews `allow scoped agent lane for security fixes`.

Why it wins:

- It uses the sponsor signal that agents can create PRs by writing records to a
  PDS.
- It treats agents as network actors with identity and accountability.
- It is a strong answer to "make agents work with Tangled."

Risk:

- "Agent passport" is not an official Tangled primitive.
- It can drift into generic AI governance.
- It is less immediately relatable than maintainer overload.

Cut:

- no autonomous merge permissions
- no broad AI governance framework
- no real agent reputation backend
- no live PDS writes until sponsor confirms write-side priority

Sponsor test:

> If agents can create PR records, what identity and trust evidence should they
> carry before maintainers spend review time on them?

## 7. OSS Recall Network

One-liner:

> OSS Recall Network broadcasts a security or compatibility advisory over
> Tangled, finds affected repo DIDs, and creates targeted issue or PR drafts with
> protocol evidence attached.

Core demo:

1. Sana publishes `Webhook replay advisory`.
2. The network view finds three affected Tangled repos.
3. One repo gets an issue, one gets a patch draft, and one is skipped because a
   spindle already proves it is safe.
4. Each action explains why that repo was affected: file path, dependency,
   comment, repo DID, and spindle result.

Why it wins:

- It is big and memorable.
- It shows Tangled as coordination infrastructure across knots.
- It turns appview/firehose and repo DIDs into visible product value.

Risk:

- Affected-repo matching can feel fake if not seeded carefully.
- It can become generic Dependabot/security tooling.
- It needs more explanation than Evidence Radar.

Cut:

- no real ecosystem crawler
- no full dependency graph
- no production advisory workflow
- no automatic mass PR creation

Sponsor test:

> Is Tangled more excited by one repo's maintainer workflow, or by cross-repo
> coordination that only a networked forge can make natural?

## 8. Patch Customs Desk

One-liner:

> Patch Customs Desk turns a drive-by diff into a Tangled-ready PR plan by
> clearing, holding, or requesting declarations based on trust, tests, repo
> policy, and protocol provenance.

Core demo:

1. Paste a `git diff`.
2. The app checks author DID, vouch status, touched files, linked issue, and
   expected spindle risk.
3. The patch gets `cleared`, `held`, or `needs declaration`.
4. A Tangled PR record preview appears with `sh.tangled.repo.pull` and source
   evidence.

Why it wins:

- It is the strongest write-side pivot.
- It has a vivid metaphor.
- It matches Tangled's drive-by patch and agent-created PR direction.

Risk:

- If it mostly summarizes code, it becomes generic AI review.
- Live PR creation has schema/auth risk.

Cut:

- no full editor
- no live write dependency unless sponsor asks for it
- no generalized code-review bot
- no automatic acceptance

Sponsor test:

> Would you rather see read-side maintainer judgment, or a write-side intake flow
> that creates Tangled-ready PR records?

## 9. CI Black Box Recorder

One-liner:

> CI Black Box Recorder replays a failed spindle run as a timeline of push, PR
> round, comments, trust context, and the next maintainer action.

Core demo:

1. Open a failed spindle run.
2. The app reconstructs the timeline: push, pull record, issue link, comment,
   round delta, spindle failure, fix recommendation.
3. Mira sees whether to review, wait, or ask for one focused test fix.

Why it wins:

- It is technically credible.
- It gives spindles a very visible demo.
- It is low-scope and clear.

Risk:

- It is narrower than the maintainer-judgment thesis.
- It may feel like CI log summarization unless PR records and trust context are
  visible.

Cut:

- no live CI runner
- no broad debugging AI
- no production log ingestion
- no generic GitHub Actions clone framing

Sponsor test:

> Do you want the demo to center on spindles and CI, or on the broader review
> decision around a Tangled PR?

## 10. Project Lifeboat Drill

One-liner:

> Project Lifeboat Drill shows a repo surviving a forge or knot failure: code
> moves, repo identity stays stable, and issues, PRs, trust, comments, and CI
> context rehydrate from Tangled records.

Core demo:

1. A forge or knot is marked unavailable.
2. The repo reappears on a new knot with repo DID continuity.
3. Open PRs, issue context, vouches, comments, and spindle history rehydrate.
4. Mira continues the release review without losing project judgment.

Why it wins:

- It makes anti-monoculture and federation concrete.
- It connects repo DIDs to user value.
- It frames Tangled as resilience for open-source projects.

Risk:

- It can read as backup or migration software.
- It is less daily-use than Evidence Radar.

Cut:

- no real migration
- no multi-knot infra
- no backup product framing
- no complex recovery animation

Sponsor test:

> Does Tangled want to showcase daily workflow, or the deeper reason repo identity
> and federation matter when infrastructure changes?

## 11. Trust-Aware Review Queue

One-liner:

> Trust-Aware Review Queue prioritizes Tangled PRs and issues by vouch/denounce
> context so maintainers spend scarce review time wisely.

Core demo:

1. Two similar PRs appear.
2. One author is vouched and linked to previous accepted work.
3. One author is unknown and touches high-risk files.
4. The app recommends different review friction for each.

Why it wins:

- It is easy to build.
- It is tightly connected to Tangled vouching.
- It is clear in 20 seconds.

Risk:

- It is a narrower Evidence Radar.
- It can sound like social scoring if phrased poorly.

Cut:

- no automatic rejection
- no global reputation score
- no denounce punishment
- no broad moderation system

Sponsor test:

> Should vouching be the center of the demo, or one evidence chip inside a
> broader maintainer decision?

## 12. Good First Journey Packs

One-liner:

> Good First Journey Packs give new contributors a Tangled-native onboarding
> path: repos to watch, maintainers to follow, issues to start with, and project
> norms backed by protocol records.

Core demo:

1. A new contributor enters a handle.
2. The app returns three starter paths: follow these maintainers, watch these
   repos, start with these issues, read these norms.
3. Trust and project context explain why each path fits.

Why it wins:

- Friendly and easy to understand.
- Borrows the social-network-native starter-pack pattern.
- Useful for contributor growth.

Risk:

- Lower sponsor edge than maintainer pain.
- Can look like GitHub issue recommendations.

Cut:

- no full recommendation engine
- no broad social graph
- no generic good-first-issue scraper

Sponsor test:

> Is Tangled more interested in maintainer overload or contributor onboarding?

## 13. Migration Story Preserver

One-liner:

> Migration Story Preserver shows what collaboration history would be lost when
> moving to Tangled, then maps issues, PRs, comments, decisions, and trust into a
> Tangled-ready plan.

Core demo:

1. Import a seeded GitHub repo snapshot.
2. Show that Git branches/tags migrate, but issue/PR judgment can be stranded.
3. Generate Tangled cards for issues, pull decisions, comments, and trust
   context.

Why it wins:

- It targets a real migration gap.
- It is practical for adoption.
- It connects to Project Memory.

Risk:

- It can become import/export tooling.
- GitHub API edge cases are bad for a hackathon demo.

Cut:

- no live GitHub auth
- no bulk migration
- no perfect history preservation
- no production importer

Sponsor test:

> Is the migration gap a priority, or should we focus on native Tangled workflows
> after projects arrive?

## 14. Compatibility Parliament

One-liner:

> Compatibility Parliament lets downstream maintainers sign, test, or object to
> breaking changes as AT Protocol records before an upstream project merges.

Core demo:

1. An upstream PR changes a checkout API.
2. Three downstream repo DIDs receive compatibility ballots.
3. Spindles run downstream smoke tests.
4. Two maintainers sign off; one blocks with evidence.
5. Upstream sees a merge recommendation.

Why it wins:

- It is deeply protocol-native.
- It shows cross-repo governance.
- It is the most ambitious ecosystem story.

Risk:

- Too abstract for a short pitch.
- Requires explaining downstream governance before showing value.
- Higher build risk than the others.

Cut:

- no real downstream CI matrix
- no broad governance system
- no live voting infra
- no consensus algorithm

Sponsor test:

> Is Tangled trying to show one-project collaboration or ecosystem-level
> coordination?

## Recommendation

Best default:

> Build **Evidence Radar as Project Memory for Tangled**.

It has the best balance of:

- 20-second clarity
- current prototype reuse
- Tangled-specific proof
- sponsor fit
- demo reliability

Best wild upgrade:

> Test **Tangled Immune System** with the sponsor.

It has the strongest memorable story if the sponsor reacts well to vouching,
denounces, LLM-generated patch overload, and attention reach.

Best write-side pivot:

> Use **Patch Customs Desk** if Tangled says agent-created PR records or
> write-side integrations matter most.

Best deep product thesis:

> Use **Tangled Case Law / Project Memory** if Tangled likes preserving project
> judgment as protocol evidence.

## Sponsor Decision Questions

Ask these in order:

1. Which would be more exciting: a maintainer decision surface, a patch intake
   flow, or a network-level trust/recall system?
2. Do you want read-side proof, write-side record creation, or both?
3. Are custom project-decision records welcome, or should we stick to existing
   Tangled records and comments?
4. Is vouching/denouncing a strong enough signal to put at the center of the
   demo?
5. Would an "immune system for open source" feel exciting or too heavy?
6. What should be visible in the first minute for you to say "this plugs into
   Tangled"?

## Final Cut List

Cut anything that weakens the main story:

- account settings
- generic analytics
- broad dashboards
- live auth
- production deployment
- real spam detection
- semantic search
- full migration tooling
- autonomous enforcement
- side-track wrappers
- generic AI review

Keep:

- one maintainer
- one repo
- one next action
- visible DID/handle
- visible repo DID/knot
- visible `at://` records
- visible vouch/comment/pull/issue/spindle evidence
- deterministic reasoning
- seeded data with a clear live path
