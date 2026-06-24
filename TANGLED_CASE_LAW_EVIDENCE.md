# Tangled Case Law Evidence

Yes/no evidence pass for the **Tangled Case Law** pivot.

Status: warm. The idea is stronger than a plain review queue as a story, but
too uncertain to make live custom protocol writes the first build dependency.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, with sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists, then finalists
  pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow under test: maintainer opens an incoming PR, sees the project
  precedent it collides with, and previews a Tangled-native response backed by
  protocol evidence.
- Intentionally cut: full semantic search, live custom lexicon writes, broad
  analytics, legal-heavy product language, multi-repo indexing, and anything not
  visible in the first minute.

## Current Verdict

**Yes** to testing Tangled Case Law as the pitch/product wrapper.

**No** to depending on a live custom `precedent` record unless Tangled sponsor
explicitly wants custom lexicons or write-side experiments.

Best practical build:

> Evidence Radar becomes a "project memory / precedent" workbench using seeded
> evidence. The visible action is a Tangled comment or record preview with AT
> URIs attached. Live custom records stay behind a sponsor gate.

Suggested naming for sponsor test:

- First test phrase: **Project Memory for Tangled**.
- Second phrase: **case law for open source**.
- Reason: "Case law" is memorable, but may sound bureaucratic. "Project
  Memory" says the user value faster.

## YES Evidence

| Evidence | Why It Supports Case Law | Strength |
| --- | --- | --- |
| Tangled frames itself as Git plus AT Protocol communication, not only another forge. | A product about portable decisions sits directly in the communication layer around code. | Strong |
| Tangled explicitly says code collaboration uses one protocol for code transfer and one for communication. | "Project precedent" is a communication artifact around code, so it belongs in Tangled's AT layer. | Strong |
| Tangled says users can collaborate across knots, fork across servers, and open PRs across servers. | Cross-server work makes portable project judgment valuable; a GitHub-only database would be the wrong substrate. | Strong |
| AT Protocol has DIDs, handles, signed data repositories, lexicons, PDSes, relays, and appviews. | The primitive stack can represent who made a decision, where it lives, and how clients can interpret it. | Strong |
| Tangled vouching exists specifically to help maintainers judge interactions. | Case Law extends trust from "who is this contributor?" to "whose project decision should this patch respect?" | Strong |
| Tangled's vouching post names LLM-generated subtle-wrong submissions as a maintainer burden. | This is exactly the problem shape: plausible patches are cheap; trusted project memory becomes more valuable. | Strong |
| Vouch records are public AT Protocol records stored on PDSes. | Trust evidence can be shown as protocol evidence rather than local app state. | Strong |
| Tangled has unified feed comment/reaction lexicons and PR record ingestion through the firehose. | Case Law can use comments and pull records as evidence today, even without a new precedent lexicon. | Strong |
| Tangled newsletter says agents can create pull requests by writing records to a PDS. | "Agents should cite project precedent before opening PRs" is a natural sponsor-facing extension. | Strong |
| Tangled moved repositories toward stable repo DIDs across renames and transfers. | The "decision memory survives repo moves" story is not decorative; repo identity is moving in that direction. | Strong |
| Tangled docs say Git migration preserves branches/tags but not issue/PR data. | The collaboration-history gap is real. Case Law focuses on preserving judgment, not only importing raw tickets. | Medium-strong |
| Spindle listens to protocol records and processes repo events. | CI evidence can be part of the decision trail without pretending it is just a GitHub Actions clone. | Medium |

Net YES claim:

> Tangled has a credible native substrate for portable project judgment: identity,
> trust, comments, PR records, repo identity, appview/firehose ingestion, and CI
> events.

## NO Evidence

| Evidence | Why It Pushes Against Case Law | Severity |
| --- | --- | --- |
| No official "precedent" or "project decision" Tangled lexicon is visible in the checked docs. | A custom live record may look invented unless sponsor likes custom lexicons. | High |
| Vouching is currently person trust, not project-policy trust. | The idea must not imply Tangled already supports binding policy decisions. | High |
| Tangled says denounces currently have no direct consequences. | Case Law should recommend and explain, not auto-block or hard-reject. | High |
| Tangled's vouching post lists PR-backed evidence trails as future work. | Evidence-backed trust is directionally aligned but not fully shipped as described. | Medium-high |
| Tangled migration docs show recent non-backward-compatible knot/spindle and lexicon changes. | Live integration with exact schemas is risky during a hackathon. | Medium-high |
| The v1.14 migration changed wire formats for `sh.tangled.repo.pull` and `sh.tangled.repo.issue`. | A demo that depends on exact live issue/PR writes can fail for boring reasons. | Medium-high |
| XRPC spec notes the auth system is likely to be overhauled. | Write-side live auth should be avoided unless required by sponsor. | Medium |
| "Case law" language may feel legalistic. | The pitch can lose Tangled's "fun and social" tone if it sounds like compliance tooling. | Medium |
| The first screen may need explanation if it starts with abstract precedent. | Evidence Radar's queue is easier to understand in 20 seconds. | Medium |
| Semantic matching is out of scope. | If we promise "finds every old decision," the build becomes too large. | High |

Net NO claim:

> The idea is strong as a product wrapper, but the live protocol surface must be
> conservative: use existing issue, pull, comment, vouch, repo, and spindle
> evidence first; only add custom precedent records after sponsor confirmation.

## What This Changes

Previous score:

- Tangled Case Law: `T/A/P = 24/90/66`
- Evidence Radar: `T/A/P = 22/86/64`

After yes/no evidence:

| Option | T | A | P | Read |
| --- | ---: | ---: | ---: | --- |
| Evidence Radar with Case Law wrapper | 18 | 89 | 71 | Best current bet. Uses existing prototype and adds the stronger problem soul. |
| Pure Tangled Case Law with custom record | 34 | 92 | 58 | High upside, too much schema/sponsor uncertainty. |
| Plain Evidence Radar | 20 | 84 | 64 | Safe, but less memorable and more dashboard-shaped. |
| Patch Customs Desk | 24 | 87 | 63 | Best pivot if sponsor asks for write-side PR creation. |

Decision:

> Do not choose between Evidence Radar and Case Law. Reframe Evidence Radar as a
> precedent-aware maintainer workbench, then demo one decisive precedent match.

## The Stronger Demo

Open with one sentence:

> This PR passes tests, but it reopens a decision this project already made.

Then show:

1. `PR #187: Replace checkout session cache`
2. Matching precedent: `Hosted knots must not require Redis`
3. Evidence:
   - old issue AT URI
   - old pull record AT URI
   - maintainer comment AT URI
   - vouch record for the maintainer who made the call
   - spindle run showing the deploy constraint
   - repo DID and knot context
4. Recommended action:
   `Ask Niko to adapt the patch to the SQLite-backed adapter.`
5. Preview comment:
   `Thanks for the patch. This repeats a decision we made for hosted-knot
   deployability: ...`

Second beat:

> The system fast-tracks another PR because it follows a vouched security
> precedent instead of reopening an old architecture fight.

## Sponsor Gate

Ask this exact question:

> Would you rather see a Tangled maintainer tool that ranks current work, or one
> that preserves and applies project decisions as AT Protocol evidence?

Follow-up if they lean yes:

> Should the hackathon demo use only existing Tangled records and comments, or
> would a custom project-decision record be welcome?

Interpretation:

- If they like "project decisions" and custom records: build the precedent
  wrapper and preview `app.sunstead.precedent`.
- If they like "project decisions" but not custom records: build the precedent
  wrapper with existing comments/issues/PRs/vouches only.
- If they dislike the framing: fall back to Evidence Radar and keep "precedent"
  as one evidence chip.

## Build Scope

Build only:

- one precedent match
- one precedent-following fast-track
- one no-precedent case
- deterministic matching by seeded file paths and tags
- evidence timeline using existing seeded record references
- one Tangled comment preview

Do not build:

- live semantic search
- custom live writes
- precedent expiration UI beyond a static label
- multi-repo decision import
- policy enforcement
- agent autonomy

## Source Notes

- Tangled federation post: Git plus AT Protocol communication, knots, cross
  server collaboration, issues/PR events:
  https://blog.tangled.org/federation/
- Tangled vouching post: vouch/denounce records, LLM spam motivation, current
  constraints, future evidence trails:
  https://blog.tangled.org/vouching/
- Tangled newsletter 02: vouching placement, public PDS records, unified feed
  lexicons, PR record ingestion, agent-created PR records, repo DIDs:
  https://blog.tangled.org/newsletter-02/
- Tangled docs: migration gap for issue/PR data, spindle architecture:
  https://docs.tangled.org/single-page
- Tangled migration docs: repo DIDs, wire-format churn, XRPC migration:
  https://docs.tangled.org/migrating-knots-and-spindles
- AT Protocol overview: DIDs, handles, signed data repositories, PDS/relay/appview
  architecture, lexicons:
  https://atproto.com/guides/overview
- AT Protocol repository spec: repository paths, signed commits, PDS authority:
  https://atproto.com/specs/repository
- AT Protocol XRPC spec: lexicon endpoints, query/procedure split, auth caveat:
  https://atproto.com/specs/xrpc
