# Tangled Idea Decision

Use this file to pick and sharpen the Sunstead Hack idea for the Tangled main
challenge. This is the canonical decision brief; `TANGLED_ROADMAP.md` turns it
into missions, and `TANGLED_EVIDENCE_SCENARIO.md` turns it into demo data.

Navigator position: emerging but aligned, approaching cold. There is enough
evidence to choose a build direction, but direct sponsor feedback can still flip
the implementation wrapper.

## Classification

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, with sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for
  4 minutes with 1 minute of questions.
- Chosen track: Tangled main challenge only.
- Optional target tracks: none for now; do not add side wrappers unless the
  Tangled demo is already stable and the rules clearly allow it.
- Core demo flow: maintainer opens a ranked Tangled queue, clicks the top item,
  and sees the protocol evidence trail behind the recommendation.
- Intentionally cut: generic AI code review, broad analytics, full auth,
  multi-repo setup, production deployment, live firehose dependency, side-track
  wrappers, and anything not visible in the first 4 minutes.

## Known Unknowns

Confirm these before large implementation work:

- Exact Tangled judging rubric and submission requirements.
- Whether live write-side Tangled integration is preferred over seeded/read-side
  data with visible record references and deep links.
- Required APIs, allowed external services, team limits, and repo/submission
  constraints.
- Presenter, pitch owner, and whether pre-finalist judging happens at a booth,
  table, or stage.
- Whether seeded/read-side data is acceptable for pre-finalist judging.

## Foundations

The foundations are the stable facts that should drive the idea. Anything that
does not flow from these is probably demo noise.

| Foundation | Why It Matters For Winning | Demo Consequence |
| --- | --- | --- |
| Sponsor motive | Tangled is judging ideas that plug into Tangled and improve open-source workflow. | The demo must answer "why Tangled?" in the first minute. |
| AT Protocol identity | Handles, DIDs, AT URIs, and user-owned records make identity and collaboration portable. | Show handles, DIDs, AT URIs, and record provenance on screen. |
| Tangled repo model | Repos can live on knots while Tangled aggregates network activity through the appview. | Show repo DID/knot context so the product is not a GitHub clone. |
| Collaboration records | Issues, pull records, comments/reactions, and PR rounds can be treated as protocol-visible workflow data. | Make records the evidence trail behind the decision. |
| Trust layer | Vouch/denounce records are a Tangled-native signal that changes review friction. | Use trust to change the recommendation, not just decorate profiles. |
| CI/spindles | Spindle status and logs connect code health to collaboration state. | Use CI state as one of the evidence chips behind the top item. |
| Hackathon judging | The top idea must be understood quickly and pitched in 4 minutes. | Prefer one polished, seeded happy path over live infra breadth. |
| Market crowding | AI PR review, repo dashboards, dependency bots, and health charts are crowded. | Avoid "Claude reviews your PR"; build protocol-backed maintainer judgment. |

## Selection Criteria

Score ideas by whether they improve expected judging outcome, not by technical
interestingness.

| Criterion | Weight | What Good Looks Like |
| --- | ---: | --- |
| Sponsor/Tangled fit | 5 | Cannot be explained as a normal GitHub app with Tangled labels. |
| First-20-second clarity | 5 | Judge can repeat the before/after without protocol expertise. |
| OSS workflow impact | 4 | Fixes maintainer or contributor pain that already exists. |
| ATProto visibility | 4 | DIDs, AT URIs, repo DIDs, vouches, records, or spindles are visible. |
| Build reliability | 4 | Works with seeded data and has a fallback if Wi-Fi/auth is bad. |
| Story amplitude | 3 | Feels memorable, not like another devtool dashboard. |
| Track discipline | 1 | Stays Tangled-first and does not dilute the core sponsor story. |

Navigator scoring uses `T/A/P`: uncertainty / amplitude / priority, with
`P = A - T`. A high-amplitude warm idea can beat a cold low-impact one, but not
if it cannot be demoed.

## Evaluated Ideas

| Rank | Idea | Verdict | T/A/P | Core Demo Moment | Why It Wins Or Loses |
| ---: | --- | --- | ---: | --- | --- |
| 1 | **Tangled Evidence Radar** | Best current main-track bet. | 22/86/64 | Maintainer opens a ranked queue, clicks the top PR, and sees the DID/vouch/issue/comment/spindle evidence trail. | Best balance of sponsor fit, demo clarity, OSS pain, and buildability. Must be framed as evidence, not analytics. |
| 2 | **Patch Customs Desk** | Best pivot if sponsor wants write-side integration. | 24/87/63 | Paste a diff, see `cleared / held / needs declaration`, then preview a Tangled PR record. | More memorable and write-side, but can collapse into generic AI review unless trust/provenance drives the decision. |
| 3 | **OSS Emergency Broadcast Network** | Highest-amplitude moonshot. | 32/92/60 | One advisory finds affected Tangled repos and creates targeted issue/patch drafts. | Very ATProto-native and cross-repo, but matching/data setup is riskier for the timebox. |
| 4 | **CI Black Box Recorder** | Best narrow technical demo. | 20/78/58 | Replay a failed spindle run as a timeline of push, PR round, comments, and fix action. | Clear and technical, but smaller OSS workflow surface than Evidence Radar. |
| 5 | **Trust-Aware Review Queue** | Safest build. | 18/74/56 | Two similar PRs are prioritized differently because one author is vouched and one is unknown. | Strong Tangled primitive, but basically a narrower Evidence Radar. |
| 6 | **AT Review Graph** | Strong protocol credibility, weaker product clarity. | 30/82/52 | Graph shows identities, PRs, comments, vouches, rounds, and CI events. | Technically native, but risks being a visualization rather than a workflow improvement. |
| 7 | **Good First Journey Packs** | Friendly contributor story, lower edge. | 28/77/49 | New contributor gets repos, maintainers, issues, and norms as an ATProto starter pack. | Demoable, but can look like issue recommendations unless identity/trust is decisive. |
| 8 | **Migration Story Preserver** | Practical sponsor gap, weaker pitch. | 30/76/46 | GitHub repo import shows which issues/PRs/social history would become Tangled records. | Useful, but risks becoming import tooling instead of a memorable open-source workflow. |
| 9 | **Repo Trust Passport** | Too static as a winner. | 18/62/44 | Open a repo health/trust card. | Low risk, but reads as analytics and lacks a sharp action. |

## Recommended Bet

Build **Tangled Evidence Radar**.

One-sentence pitch:

> Tangled Evidence Radar gives maintainers one prioritized review queue and shows
> the portable protocol evidence behind every recommendation: author identity,
> vouches, pull records, issue links, comments, repo DID, PR rounds, and spindle
> status.

The winning wedge is not "rank my PRs." The winning wedge is:

> Tangled makes review decisions auditable because collaboration metadata is
> network-native instead of trapped inside one forge.

Use the seeded scenario in `TANGLED_EVIDENCE_SCENARIO.md` as the first build
contract.

## Demo Flow

1. Presenter opens Evidence Radar as `@mira.tangled.sh` on
   `solar-knot/payments`.
2. The first screen shows repo DID, knot, release context, and three buckets:
   `Review now`, `Needs context`, `Safe to batch`.
3. The top card is `PR #184: Harden webhook signature verification`, prioritized
   because of a vouched author, linked release-blocking security issue, failing
   spindle run, and narrow latest-round delta.
4. Presenter opens the detail view and replays the evidence trail: handle/DID,
   vouch record, issue record, feed comment, pull record AT URI, repo DID, and
   spindle result.
5. Presenter closes with a prepared action: request one small test fix, then
   merge through the Tangled deep link.

## Falsification And Pivot Gates

Evidence Radar is falsified if any of these become true:

- Tangled sponsor says write-side integrations or agent-created PR records matter
  more than read-side maintainer views.
- The first screen does not show at least four Tangled/ATProto primitives in the
  first minute.
- Ranking works just as well after removing handles, DIDs, vouches, AT URIs,
  repo DID, and spindle status.
- A judge describes it as a GitHub dashboard.
- The UI becomes broad analytics instead of one clear next action.

Pivot plan:

- If sponsor wants write-side work, pivot to **Patch Customs Desk**.
- If sponsor wants cross-repo coordination, pivot to **OSS Emergency Broadcast
  Network**.
- If sponsor wants a technical CI showcase, narrow Evidence Radar into **CI
  Black Box Recorder**.
- Do not add side-track wrappers until the Tangled demo has passed sponsor and
  rendered UX checks.

## Sponsor Calibration Questions

Ask these before locking implementation details:

1. What kind of integration would make you say "this could only exist on
   Tangled/AT Protocol"?
2. Are read-side integrations, write-side integrations, or agent-created PR
   records more exciting for this challenge?
3. Which workflow is most painful right now: maintainer review overload,
   contributor onboarding, migration from GitHub, CI/debugging, or cross-repo
   coordination?
4. Is seeded Tangled data acceptable if the demo shows the intended record/XRPC
   path and deep links?
5. Are custom lexicons welcome, or should the project stick to existing
   `sh.tangled.*` records?
6. Is the visible seeded/live boundary credible for pre-finalist judging?

## Execution Checklist

- Confirm exact rules, required APIs, team size, and submission format.
- Confirm who is presenting and tune copy to that person's flow.
- Build the first screen and top-card drill-down before data plumbing.
- Use deterministic ranking first; add AI explanation only after the demo is
  stable.
- Keep every visible claim backed by a seeded record reference.
- Prepare screenshots or a short video fallback for bad Wi-Fi/auth.
- Cut account settings, generic analytics, multi-repo onboarding, production
  auth, live firehose ingestion, side-track wrappers, and extra feature menus.

## Sources

- Sunstead Hack: <https://sunsteadhack.com/>
- Tangled docs: <https://docs.tangled.org/single-page>
- Tangled intro: <https://blog.tangled.org/intro/>
- Tangled federation post: <https://blog.tangled.org/federation/>
- Tangled vouching post: <https://blog.tangled.org/vouching/>
- Tangled newsletter: <https://blog.tangled.org/newsletter-02/>
- AT Protocol overview: <https://atproto.com/guides/overview>
- AT Protocol repository spec: <https://atproto.com/specs/repository>
- AT Protocol XRPC spec: <https://atproto.com/specs/xrpc>
