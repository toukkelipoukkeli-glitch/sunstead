# Tangled Problem Soul

Problem-first ideation pass using the local `navigate/` methodology.

Navigator position: emerging and aligned. This is a high-amplitude idea pass,
not a build lock. Current best new candidate is warm enough to test with a
sponsor or mentor before changing the prototype.

## Hackathon Classification

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, with sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists, then a 4-minute
  pitch with 1 minute of questions.
- Chosen track: Tangled main challenge.
- Core demo flow for this pass: maintainer opens a new incoming patch, sees the
  project precedent it collides with, and posts a Tangled-native decision backed
  by protocol evidence.
- Intentionally cut: generic AI code review, broad analytics, legal-heavy
  compliance language, full live indexing, production auth, multi-repo search,
  and anything not legible in the first minute.

Known unknowns to flag before large implementation work:

- Exact Tangled judging rubric and submission constraints.
- Whether sponsor prefers custom AT Protocol lexicons or only existing
  `sh.tangled.*` records.
- Whether write-side record creation is more valuable than a seeded/read-side
  proof.
- Presenter and preferred pitch style.
- Whether live Tangled auth/network access will be reliable at judging.

## Forward Beam: What Tangled Is Really Offering

Cold-enough facts from current local notes and official sources:

- Tangled is not just "GitHub but decentralized." It is Git plus AT Protocol
  communication records.
- Knots let code live on different servers while the appview gives one view of
  activity across the network.
- AT Protocol gives people stable DIDs, handles, signed public data records,
  lexicons, XRPC endpoints, and portable account data.
- Tangled has vouch/denounce records, and those trust signals show up where
  interaction decisions happen: issues, pull requests, and comments.
- Tangled's own vouching post names LLM-generated "looks right, subtly wrong"
  submissions as a maintainer burden.
- Pull request records are now ingested through the firehose, and agents can
  create pull requests by writing records to a PDS.
- Git migration preserves code history but not issue and pull request history,
  which means project judgment is still easy to strand.

High-level extraction:

> Git preserves code lineage. Tangled can preserve collaboration lineage.

The soul of the challenge is not "rank work items." It is:

> Make the social and decision layer of open source portable, inspectable, and
> actionable, so maintainer judgment can survive AI volume, repo moves, forks,
> and contributor churn.

## Backward Beam: What Winning Needs

To win, the idea must create a 20-second reaction:

> "That workflow is better because code, people, trust, and decisions are
> protocol records."

The demo should make these visible without a lecture:

- a human handle resolving to a DID
- a repo identity or knot context
- a pull/issue/comment AT URI
- a vouch or denounce record that changes the action
- a spindle result or code-health event
- a write-side action or record preview

If removing AT Protocol records leaves the same product, the idea is not strong
enough for Tangled.

## Core Problem

Maintainers are drowning less in "too little code" and more in "too much
untrusted context."

The hard open-source problem is project judgment:

- Why did we reject this approach last time?
- Whose opinion counts on this subsystem?
- Which old comment is still policy and which one expired?
- Is this contributor trusted because of actual merged work or just a profile?
- What context survives if this repo moves knots, changes maintainers, or forks?
- How do new contributors and agents avoid re-litigating project memory?

Today, this judgment lives in scattered comments, old PRs, maintainer memory,
Discord threads, release notes, and fragile forge-specific history. AI makes the
problem sharper because it makes plausible patches cheap. Decentralized hosting
also makes it sharper because code can move while the social context can lag.

## New Winning Candidate: Tangled Case Law

Working title: **Tangled Case Law**.

One-sentence pitch:

> Tangled Case Law turns maintainer decisions into portable protocol precedent,
> so every new PR can show the signed issue, pull request, vouch, comment, and
> CI evidence that explains whether this patch follows project judgment or
> reopens an old mistake.

Shorter pitch:

> Case law for open-source projects, backed by AT Protocol records.

The wedge:

> Tangled should not only move code between knots. It should move the judgment
> that makes a project maintainable.

## Why This Is New From The Current Ideas

This collides several existing directions but produces a different product
behavior:

| Existing piece | Reused part | What changes |
| --- | --- | --- |
| Evidence Radar | evidence trail | Evidence is attached to project decisions, not just ranked work. |
| Patch Customs Desk | clear/hold routing | Routing depends on precedent, not only current diff risk. |
| Trust-Aware Review Queue | vouch signal | Vouches explain whose decisions become precedent. |
| Migration Story Preserver | portable history | The preserved artifact is judgment, not raw history. |
| CI Black Box Recorder | spindle proof | CI becomes evidence in a decision record. |

This is not "AI reviews your PR." It is "Tangled remembers why this project
accepts or rejects a class of changes."

## Product Shape

Primary user: overloaded maintainer of a Tangled repo.

Secondary users:

- new contributors who need project norms before opening a patch
- AI agents that need guardrails before generating patches
- incoming maintainers inheriting a project
- forks and downstream projects that need to carry decision context forward

Core object: a **precedent card**.

Example fields:

- decision: `Rejected Redis cache for checkout sessions on hosted knots`
- scope: `src/payments/cache/*`, `checkout-session-cache`
- status: `binding`, `expires after v1.5`, or `superseded`
- reason: `hosted knots cannot assume managed Redis`
- signed by: `@mira.tangled.sh`, `did:plc:mira-maintainer`
- trusted by: vouches from two maintainers
- evidence:
  - issue AT URI
  - pull record AT URI
  - maintainer comment AT URI
  - spindle run reference
  - repo DID and knot context
- action:
  - uphold precedent and request change
  - mark exception
  - supersede precedent with a new signed record

## Four-Minute Demo

Setup:

- Repo: `solar-knot/payments`
- Maintainer: `@mira.tangled.sh`
- Incoming PR: `PR #187: Replace checkout session cache`
- Author: `@niko.dev`, first-time contributor
- Context: release candidate freezes today

Flow:

1. Mira opens Tangled Case Law on the repo.
2. The top item says: `PR #187 reopens a rejected architecture decision`.
3. The screen shows the matching precedent card:
   `Rejected Redis cache for hosted knots`, signed by Mira, linked to an issue,
   a pull record, a maintainer comment, and a failed spindle run.
4. The app shows why this is not an automatic rejection:
   Niko is unknown, tests pass, but the change violates a project decision that
   was vouched by two maintainers.
5. Mira clicks `Uphold precedent`. The app previews a Tangled comment or custom
   precedent record with AT URIs attached:
   `This project avoids Redis for hosted-knot deployability. Please adapt this
   to the existing SQLite-backed adapter. Evidence: ...`
6. Optional second beat: `PR #184` references a security precedent and gets the
   opposite outcome: fast-track review because it follows a signed decision and
   comes from a vouched contributor.

Best demo moment:

> Two patches with passing tests get different actions because one aligns with
> portable project judgment and the other repeats a documented mistake.

## Protocol Need

This is Tangled-native because the product needs:

- DIDs and handles to identify who made the decision.
- Public records on PDSes so decisions can survive tools and repo moves.
- AT URIs to link issues, pull requests, comments, and vouches as evidence.
- Lexicons/XRPC if a custom `precedent` record is allowed.
- Appview/firehose ingestion so agents can attach new PRs to old decisions.
- Vouch records to decide whose judgments should count for the current
  maintainer's trust circle.
- Knots and repo DIDs to make the "portable across hosting" story concrete.

Without those, this degrades into a generic code-search or bot-comment product.

## Can We Solve It In The Hackathon?

Yes, if scoped as one polished seeded flow.

Build plan:

- Reuse the current React/Vite prototype spine.
- Replace the ranked queue copy with a "precedent match" workbench.
- Seed 3 precedent cards and 3 incoming PRs.
- Show the evidence trail first, not an AI summary.
- Generate deterministic recommendations from explicit rules:
  - `+30` exact precedent match
  - `+20` signed by trusted maintainer
  - `+15` linked spindle evidence
  - `+15` incoming PR touches scoped files
  - `-20` precedent expired or superseded
  - `-15` author references and satisfies precedent
- Add one write-side preview:
  - fallback: Tangled comment preview with evidence links
  - stronger: custom `app.sunstead.precedent` record preview if sponsor likes
    custom lexicons

Do not build semantic search. Hard-code matching by files, labels, and seeded
decision tags. The demo judges the workflow, not retrieval infrastructure.

## T/A/P Scoring

| Candidate | T | A | P | Verdict |
| --- | ---: | ---: | ---: | --- |
| Tangled Case Law | 24 | 90 | 66 | Best new problem-first candidate. |
| Tangled Evidence Radar | 22 | 86 | 64 | Strong current build; less surprising. |
| Patch Customs Desk | 22 | 84 | 62 | Good fallback if sponsor wants write-side intake. |
| Maintainer Handoff Capsule | 30 | 86 | 56 | Strong soul, weaker first-minute action. |
| OSS Emergency Broadcast | 32 | 88 | 56 | High amplitude, higher data/matching risk. |

Temperature-lowering evidence for Tangled Case Law:

- Sponsor says custom or derived project-decision records are welcome.
- A mentor can repeat the pitch after 20 seconds.
- The first screen shows at least four protocol primitives.
- A seeded comment/record preview feels like a real Tangled integration.

Temperature-raising evidence:

- Sponsor wants only existing `sh.tangled.*` write paths and dislikes custom
  records.
- Judges read the product as legal/compliance rather than maintainer workflow.
- The app feels like generic semantic search over old PRs.

## Kill Conditions

Kill or demote Tangled Case Law if:

- The first screen cannot explain the before/after in 20 seconds.
- The demo still works just as well after removing DIDs, AT URIs, vouches, repo
  identity, and spindle evidence.
- The "case law" metaphor makes the product feel bureaucratic instead of useful.
- We cannot show a credible write-side comment or record preview.
- Sponsor strongly asks for pure PR creation, pure CI, or cross-repo emergency
  workflows.

## Sponsor Calibration Questions

Ask these before pivoting the current build:

1. Would a custom "project decision / precedent" record be exciting, or should
   we stick to comments and existing Tangled records?
2. Is the vouching roadmap interested in evidence trails beyond people, such as
   evidence-backed project decisions?
3. Which is more compelling: ranking current work, screening incoming patches,
   or preserving maintainer judgment across repo moves?
4. Would agents writing PR records to a PDS be a stronger story if they also had
   to cite project precedent?
5. Is "case law for open source" memorable or too heavy for Tangled's tone?

## Recommendation

Keep the existing Evidence Radar prototype alive, but test **Tangled Case Law**
immediately with sponsor or mentor feedback.

If the reaction is strong, pivot the prototype wrapper from "review priority" to
"project precedent." Most of the existing seeded evidence work remains useful:
the same DIDs, vouches, AT URIs, pull records, comments, repo DID, and spindle
results become the proof attached to precedent cards.

Current bet after this pass:

- build risk: manageable
- demo novelty: higher than Evidence Radar
- Tangled fit: stronger if write-side records are allowed
- best next action: create one seeded precedent scenario and mock the first
  screen before doing any live integration

## Sources Checked

- Local: `AGENTS.md`, `PLAYBOOK.md`, `SUNSTEAD_HACK.md`,
  `TANGLED_IDEAS.md`, `TANGLED_ROADMAP.md`, `TANGLED_EVIDENCE_SCENARIO.md`
- Local navigate resources: `navigate/SIMPLE_METHODOLOGY.md`,
  `navigate/SIMPLE_GEOMETRIC_NAVIGATOR.logos`
- Tangled docs: https://docs.tangled.org/single-page
- Tangled intro: https://blog.tangled.org/intro/
- Tangled federation post: https://blog.tangled.org/federation/
- Tangled vouching post: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- AT Protocol overview: https://atproto.com/guides/overview
- AT Protocol repository spec: https://atproto.com/specs/repository
- AT Protocol XRPC spec: https://atproto.com/specs/xrpc
