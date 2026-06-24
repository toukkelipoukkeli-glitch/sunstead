# Tangled Roadmap

This roadmap uses the navigate workflow for the Tangled-only Sunstead Hack
direction.

Navigator position: emerging, aligned enough to focus, still near the boundary
where sponsor calibration can change the bet.

## Target

Win the Tangled main challenge with a 4-minute demo that makes AT Protocol feel
necessary, not decorative.

The product should answer one visible question:

> What open-source workflow gets meaningfully better when code, identity, trust,
> review, and CI live as portable network records instead of inside one forge?

Default judging read:

- Hackathon type: `sponsor-needs`.
- Judging/submission mode: Tangled partner selects finalists, then 4-minute pitch
  plus 1-minute Q&A.
- Target track: Tangled only.
- Core demo shape: one polished workflow, seeded if needed, with Tangled/ATProto
  primitives visible in the first minute.
- Intentionally cut: generic GitHub-style dashboards, full auth, broad analytics,
  production deployment, live firehose dependency, and anything not pitch-visible.

## Foundation Harvest

Harvest foundations before locking the build. The point is to collect high-level
generators, not implementation trivia.

| Foundation | What to harvest | Why it matters | Spark questions |
| --- | --- | --- | --- |
| ATProto identity | DIDs, handles, account portability, user-owned records, AT URIs. | Makes contributor identity portable across tools. | What can a maintainer trust because it is signed/network-native? |
| Tangled repo model | Repo DIDs, knots, appview aggregation, self-hostable Git hosting. | Makes repos addressable beyond one central forge. | What workflow improves when repos can live anywhere but still share metadata? |
| Collaboration records | Issues, pull records, feed comments/reactions, PR rounds. | Turns review activity into queryable protocol data. | What review artifact should become replayable, portable, or auditable? |
| Trust layer | Vouch/denounce records and social context. | Gives review triage a Tangled-native edge. | Where does trust change the next action, not just decorate a profile? |
| CI/spindles | Spindle workflows, logs, pull-request triggers, Jetstream/appview events. | Connects code health to protocol-visible workflow. | What failed build story can be made instantly legible? |
| Migration gap | Git remotes migrate, but historical issues/PRs do not migrate cleanly. | Sponsor-relevant product gap with concrete demo value. | What must survive a move from GitHub to Tangled? |
| Sponsor language | What Tangled reps say they want to see. | Highest-signal scoring clue. | Do they prefer read-side views, write-side PR creation, or agents making records? |

Cold fact to preserve: Tangled already has enough primitives for demos around
trust, PRs, issues, CI, webhooks, knots, and migration. The idea should reveal
their combined value instead of rebuilding forge basics.

## Spark Engine

Use the collision lens. Combine moderately different domains until the result
creates a Tangled-native workflow that neither domain has alone.

Process:

1. Start from a Tangled primitive: DID, AT URI, pull record, issue record, vouch,
   repo DID, spindle result, webhook, knot, appview/firehose.
2. Collide it with a domain that has strong operational metaphors: customs,
   aviation, emergency dispatch, legal evidence, passports, recalls, hospitals,
   libraries, public hearings.
3. Keep only sparks where the metaphor changes the product behavior.
4. Kill any idea whose demo works just as well on GitHub without ATProto records.
5. Score by `P = A - T`, where `A` is demo/story amplitude and `T` is uncertainty.

Highest-signal collision targets from the subagent scan:

| Collision | Domains | Demo spark | T/A/P | Synergy |
| --- | --- | --- | ---: | --- |
| Evidence Locker for Patches | legal chain-of-custody x code review | Replay who authored, vouched, tested, commented, and changed each PR round. | 24/88/64 | Powers Review Radar or its own project. |
| Patch Customs Desk | border/customs screening x drive-by patches | A diff gets cleared, held, or sent back based on trust, tests, and repo policy. | 22/84/62 | Strongest Patch-to-PR Concierge variant. |
| OSS Emergency Broadcast Network | public safety alerts x maintainer response | Broadcast an advisory, find affected repos, generate targeted issues/PRs. | 28/88/60 | Separate high-amplitude direction. |
| CI Black Box Recorder | aviation recorder x spindle logs | Replay a failed build as a timeline of push, logs, comments, rounds, and fix. | 20/78/58 | Upgrade path for Review Radar. |
| Reviewer Air-Traffic Control | air-traffic control x distributed PRs | PRs become incoming flights with trust, runway conflicts, and blocked landings. | 22/79/57 | Visual wrapper for Review Radar. |
| Mutual Aid Dispatch for OSS | volunteer dispatch x contributor matching | Maintainers post help beacons; contributors are routed by trust and skills. | 30/86/56 | Separate contributor-side direction. |
| Interlibrary Patch Loan | library lending x reusable patches | Borrow a fix from one repo/fork into another with attribution and a ready PR. | 32/86/54 | Patch-to-PR extension. |
| Maintainer ER Triage | emergency room x review queue | Every issue/PR gets acuity: bleeding CI, trusted contributor, blocked release. | 18/70/52 | Simplest Review Radar story. |

## Synergy Map

Three trunks are worth exploring. Do not build all three.

**Trunk A: Review Radar plus Evidence**

- Product: maintainer inbox that prioritizes work and shows the evidence behind
  each recommendation.
- Spark wrapper: Evidence Locker, CI Black Box, Reviewer Air-Traffic Control, or
  ER Triage.
- Best demo: "This PR is first because the contributor is vouched, CI failed on
  a known pattern, and round 3 only changed one file."
- Tangled primitives: pull records, issue records, feed comments, vouches,
  spindles, repo DIDs, AT URIs.
- Risk: can become a generic dashboard. Kill or reframe if the first screen does
  not show record provenance.

**Trunk B: Patch Customs Desk**

- Product: drive-by patch intake that screens diffs and creates a Tangled-ready
  PR plan.
- Spark wrapper: customs clearance, reviewer policy, trusted contributor lane.
- Best demo: paste a diff, see `cleared / held / needs declaration`, then show
  the intended `sh.tangled.repo.pull` record/deep link.
- Tangled primitives: drive-by patch flow, pull records, vouch/denounce records,
  repo DID, AT URI.
- Risk: if it only summarizes code, it becomes generic AI review. The clearance
  decision must depend on Tangled-native trust/provenance.

**Trunk C: Emergency Broadcast Network**

- Product: maintainer broadcasts an advisory or migration notice, and affected
  Tangled repos receive targeted issues/patch drafts.
- Spark wrapper: public safety alert or dependency recall board.
- Best demo: one advisory becomes three repo-specific actions with visible
  protocol references.
- Tangled primitives: appview/firehose, repo DIDs, issue/pull records, feed
  comments.
- Risk: higher matching complexity. Use only if sponsor reacts strongly to
  cross-repo coordination.

Current recommendation: start with **Trunk A**, but upgrade the plain
"Review Radar" into **Tangled Evidence Radar**. It keeps the original reliable
maintainer workflow and adds a more memorable Tangled-native reason to care:
every recommendation is backed by portable protocol evidence.

Current state, 2026-06-24:

- Missions 01-05 have produced a source-gated direction, seeded evidence
  scenario, React/Vite prototype spine, and visible seeded/live protocol proof.
- The next bottleneck is rendered UX inspection on the presenter machine plus
  sponsor calibration.

## Mission Roadmap

| Mission | Goal | Output | T/A/P | Kill or pivot |
| --- | --- | --- | ---: | --- |
| 01 Landscape | Collect sponsor language, official primitives, and top collision sparks. | Foundation inventory plus 3 trunks. | 35/80/45 | If sponsor says write-side agents only, pivot to Patch Customs Desk. |
| 02 Gate | Test the top 3 one-sentence demos with sponsor/mentor/team. | Chosen trunk plus backup. | 28/85/57 | Kill any idea that needs more than 20 seconds to explain. |
| 03 Evidence Skeleton | Define one seeded repo, personas, records, trust signals, CI event, and PR/issue flow. | Demo data schema and storyboard. | 22/82/60 | If Tangled primitive is invisible on first screen, rewrite. |
| 04 Prototype Spine | Build the first screen and one complete drill-down. | Working local happy path. | 18/80/62 | If the app feels like generic GitHub analytics, inject provenance view. |
| 05 Protocol Proof | Add visible AT URIs/DIDs/record preview/deep links and document live vs seeded boundaries. | Sponsor-credible integration proof. | 16/78/62 | If live APIs are flaky, freeze seeded data and show intended XRPC path. |
| 06 Pitch Lock | Rehearse 4-minute story, screenshots, fallback video, and Q&A answers. | Demo script and submission copy. | 12/75/63 | Cut features until the first minute lands cleanly. |

## First Build Bet

Working title: **Tangled Evidence Radar**.

Pitch:

> A maintainer inbox for Tangled that ranks what to review next and shows the
> protocol evidence behind every recommendation: author identity, vouches,
> PR rounds, comments, repo DID, and spindle status.

First 60 seconds:

1. Open on a maintainer handle and a ranked queue.
2. Top card says "Review now" because CI is failing, the contributor is vouched,
   and the PR touched a release-critical file.
3. Click the card and replay the evidence trail: DID/handle, AT URI, vouch,
   comments, PR round, spindle result.
4. Close with the wedge: Tangled makes this possible because collaboration
   metadata is protocol data, not private forge exhaust.

Backup pivot:

- If sponsor wants creation/write-side work: pivot to **Patch Customs Desk**.
- If sponsor wants cross-repo coordination: pivot to **OSS Emergency Broadcast**.
- If sponsor wants pure CI: narrow to **CI Black Box Recorder** inside Review
  Radar.

## Immediate Next Actions

- Ask Tangled sponsor the five calibration questions from `TANGLED_IDEAS.md`.
- Inspect the rendered prototype on the presenter machine and fix any visual
  overlap or weak first-minute signal.
- Decide whether the final demo is read-side seeded, write-side live, or hybrid.
- Freeze new feature work until rendered UX inspection and sponsor calibration.
- Keep all copy focused on "portable evidence for better OSS decisions."

## Sources

- Tangled docs: <https://docs.tangled.org/single-page>
- Tangled newsletter: <https://blog.tangled.org/newsletter-02/>
- AT Protocol overview: <https://atproto.com/guides/overview>
