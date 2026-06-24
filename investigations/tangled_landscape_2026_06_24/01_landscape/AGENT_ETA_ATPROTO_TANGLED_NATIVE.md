# Agent Eta: AT Protocol And Tangled-Native Primitives

> Mission: map AT Protocol/Tangled-specific primitives and similar ATProto apps or lexicon patterns.
> Date: 2026-06-24.
> Deliverable: fact sheet with primary-source URLs, safe pitch claims, uncertainty, and first-minute primitives.
> Source discipline: official Tangled docs/blogs and AT Protocol docs first; adjacent ATProto app patterns second; local brainstorms used only for synthesis.

Navigator position: emerging and aligned, approaching cold on the protocol surface. The key facts are sourced, but live write-side integration details and sponsor preference for custom records remain warm.

## Executive Read

Eta strongly supports the current **Tangled Review Passport / Patch Passport** direction.

The best Tangled-native claim is not "we made an AI PR reviewer" and not "we made decentralized GitHub." It is:

> Tangled turns code collaboration into public, typed, addressable protocol records. A maintainer can decide whether a human or agent patch deserves review by inspecting identity, intent, trust, discussion, repo identity, and CI/spindle evidence before reading the whole diff.

The first minute must visibly show:

- actor handle plus DID;
- repo DID plus knot;
- `sh.tangled.repo.pull` AT URI;
- linked `sh.tangled.repo.issue` or `sh.tangled.feed.comment` AT URI;
- `sh.tangled.graph.vouch` / denounce evidence;
- spindle or pipeline status;
- a clear live path: PDS records -> firehose/appview -> XRPC/PDS write.

If these stay hidden, the product reads as a generic GitHub queue. If they are first-class evidence chips, the demo becomes sponsor-native.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid with sponsor fit first.
- Challenge style: open-ended creative inside a Tangled sponsor need.
- Judging/submission mode: Tangled challenge selects projects; local packet says finalists pitch for 4 minutes plus 1 minute Q&A. The challenge file itself emphasizes originality/inspiration and AT Protocol-native primitives.
- Target track: Tangled main challenge.
- Core Eta demo flow: one maintainer opens one repo, sees one AI/human PR, and the decision depends on Tangled records rather than a model summary.
- Intentionally cut: generic AI code review, universal trust score, live firehose dependency during judging, broad custom lexicon work, production auth, and claims that records prove code correctness.

## Primary-Source Fact Sheet

### Tangled Official Sources

| Source | Facts to preserve | Pitch implication |
| --- | --- | --- |
| Local challenge file: `TANGLED_CHALLENGE_INFO.txt` | Tangled is a code platform built natively on AT Protocol. The challenge wants integrations over AT Protocol that enhance open source, especially autonomous agents that review code or submit PRs. Judging is 99% "original and inspiring" projects that lean into AT Protocol primitives. | Lead with the protocol-native workflow, not raw AI capability. |
| Tangled docs / source docs: https://docs.tangled.org/single-page and https://tangled.org/tangled.org/core/blob/master/docs/DOCS.md | Tangled is decentralized code hosting and collaboration. Knots are self-hostable Git servers. The appview at `tangled.org` gives a consolidated view across knots. Users log in with AT accounts and PDSes. Current migration docs say Git history moves by changing remotes, while issue/PR migration tooling is not yet present. | "Code lives on knots; collaboration evidence lives as AT records." Also, project memory/migration is a real gap. |
| Tangled intro: https://blog.tangled.org/intro/ | Tangled describes itself as a social-enabled Git collaboration platform built on AT Protocol. It positions knots as lightweight headless Git servers and the appview as the consolidated network view. | Safe opening line: Tangled is not just Git hosting; it is Git hosting plus protocol-native social/collaboration state. |
| Tangled federation post: https://blog.tangled.org/federation/ | Tangled frames the stack as `git` for code transfer plus AT Protocol for communication. Events include issues, pull requests, timeline/social events, follows, stars, and vouches. It says users can collaborate across knots and open PRs across servers. | Pitch the product as "reviewability over federated collaboration events," not "we federate PRs." |
| Tangled vouching post: https://blog.tangled.org/vouching/ | Vouching/denouncing exists because LLM tooling lowers the cost of plausible but subtly wrong submissions. Vouch/denounce records are public PDS records with optional reason. Display is attenuated to your circle. Denounce currently has no blocking consequence; it is a warning label for decisions. Future ideas include decay and evidence trails. | Do not say "trust score." Say "review reach with receipts." Vouch/denounce can affect attention, not merge permission or punishment. |
| Tangled newsletter 02: https://blog.tangled.org/newsletter-02/ | Vouch hats appear in issues, PRs, and comments. Vouch records are public AT Protocol records on the user's PDS. Feed comments/reactions were unified into `sh.tangled.feed.comment` and `sh.tangled.feed.reaction`. Pull request records `sh.tangled.repo.pull` are ingested through the firehose. Agents can create PRs by writing records to a PDS. Repo DIDs now support renames; migrations between knots are next. | This is the strongest sponsor-native evidence for Patch Passport: agents writing PR records is officially named, and vouch context is shown exactly where review happens. |
| Tangled public source clone: `https://tangled.org/tangled.org/core`, inspected at commit `9b3e1670c09006cf82867f7728ac528c6d0c3212` on `master` | Confirms lexicons for repo, pull, issue, feed comments, graph vouch, git ref updates, pipelines, knots, spindles, sync procedures, collaborators, labels, and repo DID fields. | Use exact `sh.tangled.*` collection names on screen. Treat schema details as source facts, but confirm live API expectations with Tangled before writing records during the demo. |

### AT Protocol Official Sources

| Source | Facts to preserve | Pitch implication |
| --- | --- | --- |
| AT Protocol overview / Bluesky guide: https://docs.bsky.app/docs/advanced-guides/atproto | AT Protocol defines identity, signed user data repositories, federation, Lexicon schemas, PDS/BGS/AppView roles, account portability, algorithmic choice, and speech vs reach. | "Submission and review reach are separate." Anyone can write/submit; a maintainer-selected appview can route scarce attention. |
| Repository spec: https://atproto.com/specs/repository | Each account has a public, verifiable repository of records. Commits are signed. Repo paths are `<collection>/<record-key>`. Records can be deleted without a tombstone. Firehose diffs can be verified, but repositories are untrusted input. | Public signed records are evidence of authorship/integrity of records, not proof that the record's claim is true. Do not overclaim immutability or safety. |
| AT URI scheme: https://atproto.com/specs/at-uri-scheme | `at://` addresses records in a repository by DID or handle. DID-based URIs are more durable than handle-based ones. AT URIs are not content-addressed, so record content can change or disappear. | Use AT URIs as source pointers. If saying "receipt," make clear it is addressable evidence, not immutable proof unless paired with CID/strongRef. |
| Lexicon spec: https://atproto.com/specs/lexicon | Lexicon describes records, XRPC endpoints, and event streams. Primary types include `record`, `query`, `procedure`, and `subscription`. | Custom receipt records are protocol-normal, but schema design is a real product commitment. |
| XRPC spec: https://atproto.com/specs/xrpc | XRPC maps Lexicon query/procedure NSIDs to `/xrpc/{NSID}` endpoints. Queries are GET; procedures are POST and may mutate state. | The live path can be stated as XRPC reads/writes, but exact Tangled endpoints/auth must be verified. |
| Sync spec: https://atproto.com/specs/sync | Atproto has full repo exports and real-time repository event streams commonly called the firehose. Firehose messages include repo commits, sync, identity, and account events. Relays can aggregate PDS streams. | Safe live-read claim: an indexer/appview can subscribe to relevant record changes. Unsafe claim: perfect completeness from one relay. |
| Firehose guide: https://docs.bsky.app/docs/advanced-guides/firehose | Many apps start with the firehose: feed generators, labelers, bots, and search engines. Jetstream provides a simpler JSON stream for some uses. | Tangled Review Passport can be framed as an appview/indexer over public Tangled records. |
| Custom schemas guide: https://docs.bsky.app/docs/advanced-guides/custom-schemas | Apps may define their own independent namespace records, but should be careful because record schemas are hard to change once records are published. AppViews are needed to index and present records. | For the hackathon, default to existing `sh.tangled.*` records; preview `app.sunstead.*` only as optional. |
| Publishing lexicons guide: https://atproto.com/guides/publishing-lexicons | Lexicons can be published to a PDS and resolved through DNS TXT records mapping namespace prefixes to DIDs. | If we propose a custom receipt lexicon, use a controlled domain namespace and be explicit that it is a prototype. |
| Statusphere example app: https://github.com/bluesky-social/statusphere-example-app and guide https://atproto.com/guides/applications | Official example covers OAuth sign-in, custom schema, listening to the network firehose, and publishing data on the user's account. The guide shows custom records flowing from repo writes to firehose ingestion to an app database/view. | This is the pattern Tangled integration should mimic: typed records, write to PDS, index into an appview, render a workflow view. |

## Tangled-Native Primitive Map

These are the primitives Eta should feed into the synthesis and demo spec.

| Primitive | Confirmed shape | What it gives the demo | Safe visible use |
| --- | --- | --- | --- |
| Actor DID + handle | AT accounts use handles for UX and DIDs for durable identity. Tangled login accepts AT accounts/PDSes. | Stable identity for maintainers, contributors, and agents. | `@rae.bot -> did:plc:rae-agent`; `@mira.tangled.sh -> did:plc:mira-maintainer`. |
| PDS records | Tangled vouching and AT docs both state user data records are stored in PDS-backed repos. | Public source of truth for vouches, pull records, comments, optional agent receipts. | "This evidence chip links to the record that actor wrote." |
| Repo DID | Tangled source `sh.tangled.repo` includes `repoDid`; newsletter says repo DIDs now support renames. | Repository identity beyond `owner/name` and beyond one knot. | Show `did:plc:repo-solar-payments` in the header. |
| Knot | Tangled docs define knots as self-hostable Git servers. Source `sh.tangled.repo` requires a `knot` field. | Code hosting is separate from collaboration records. | Header: `solar-knot/payments` on `knot.helsinki.dev`. |
| Appview | Tangled intro/docs describe the appview as the consolidated view across knots. AT docs describe AppViews as services that index records and provide views. | Third-party maintainer intelligence can be an appview-style integration, not a core Tangled feature. | "Evidence Radar indexes public records like an appview." |
| Firehose / sync | Newsletter says `sh.tangled.repo.pull` records are fully ingested through the firehose. AT sync docs define the firehose model. | Agents/listeners can react to PR creation/update records. | "Live version listens for `sh.tangled.repo.pull` and linked records." |
| XRPC | AT Protocol HTTP API convention; Tangled docs say knot/spindle APIs moved to XRPC after v1.8.2. | Standard read/write path for records and service APIs. | "Seeded now; live path is XRPC reads and PDS record writes." |
| Pull record | Source lexicon `sh.tangled.repo.pull`: key `tid`; required `target`, `title`, `createdAt`, `rounds`; rounds contain `patchBlob` for gzipped git format-patches; `references` and `dependentOn` can hold AT URIs. | The PR itself can be an addressable protocol object; agent PRs are not speculative. | Evidence chip: `at://did:plc:rae-agent/sh.tangled.repo.pull/payments-189`. |
| Issue record | Source lexicon `sh.tangled.repo.issue`: required `repo`, `title`, `createdAt`; optional `body`, `mentions`, `references`. | Intent and urgency can be source-linked instead of inferred from a diff. | "Linked security issue #91 blocks the release." |
| Feed comment | Newsletter says comments/reactions are unified. Source `sh.tangled.feed.comment` has `subject` strongRef, markdown body, `replyTo`, and optional `pullRoundIdx`. | Maintainer guidance and project memory can be linked to exact subjects/rounds. | Evidence chip: comment confirming acceptable fix window. |
| Pull/issue comments | Source still contains `sh.tangled.repo.pull.comment` and `sh.tangled.repo.issue.comment`. | Older/specific comment records may exist; feed comment is the safer current public name after newsletter 02. | Prefer `sh.tangled.feed.comment` in pitch, mention legacy/specific comments only if asked. |
| Vouch/denounce | Source `sh.tangled.graph.vouch`: `kind` enum `vouch`/`denounce`; `reason`; `createdAt`; optional `evidences` up to 10 AT URIs. Blog confirms public PDS records and circle-scoped display. | Trust can be contextual and evidence-linked. | No score. Show "vouched by Mira's circle with PR evidence." |
| Git ref update | Source `sh.tangled.git.refUpdate`: includes ref, committer DID, repo, old/new SHA, meta. | Pushes can become protocol events tied to actor/repo identity. | Secondary evidence only; do not lead with it unless showing push/fix timeline. |
| Spindles / pipelines | Docs define `.tangled/workflows` CI with `push`, `pull_request`, and `manual` triggers. Source `sh.tangled.pipeline` and `sh.tangled.pipeline.status` include trigger metadata, repo DID, workflow status enum, errors, and exit code. | CI state becomes another record-backed receipt in the review decision. | "Focused spindle failed, then passed" or "status: failed on webhook test." |
| Agent-written records | Newsletter explicitly says agents can create PRs by writing records to their or your PDS. | Autonomous agents become protocol actors, not GitHub bot comments. | "The agent's DID authored the pull record; the human sponsor/vouch is separate." |
| AT URI receipts | AT URI spec gives record addressing; Tangled records use AT URI references in source lexicons. | Every claim in the passport can reveal where it came from. | Use DID-based AT URIs; avoid handle-based AT URIs in source links. |
| Strong references / CIDs | Feed comments use `com.atproto.repo.strongRef`; createRecord responses include URI/CID in official examples. | Stronger evidence than mutable URI alone. | If time allows, show URI plus CID on detail view; otherwise say "source record", not "immutable proof." |

## Adjacent ATProto App And Lexicon Patterns

The adjacent app ecosystem matters less as competitors and more as proof that the product architecture is normal in atproto.

| Pattern / app | Primary source | What it proves | Tangled implication |
| --- | --- | --- | --- |
| Statusphere example app | https://github.com/bluesky-social/statusphere-example-app and https://atproto.com/guides/applications | Official sample covers OAuth, custom schema, firehose ingestion, and publishing data to user accounts. | Review Passport can follow the exact pattern: custom or existing records -> firehose/appview -> workflow UI. |
| Lexicon community / awesome lexicons | https://github.com/lexicon-community/awesome-lexicons | There is already a broad ecosystem of non-Bluesky lexicons and apps: WhiteWind, Smoke Signal, Frontpage, LinkAT, Skylights, PinkSea, ATFile, Recipe Exchange, etc. | Custom `app.sunstead.aiPatchReceipt` is plausible, but not necessary for the first demo. |
| WhiteWind long-form blog | Listed in awesome lexicons; source at https://github.com/whtwnd/whitewind-blog/tree/main/lexicons/com/whtwnd/blog | A non-Bluesky app can define domain-specific content records. | Tangled can define code-collaboration records similarly; interoperability still depends on app support. |
| Leaflet long-form publishing | https://lab.leaflet.pub/3lxy5sg373k2z | Leaflet/WhiteWind show a real custom-lexicon interop tension: separate lexicons can fragment apps unless communities align. | Avoid overbuilding custom receipt schemas. Existing `sh.tangled.*` records give better sponsor fit; custom receipt should be additive. |
| Smoke Signal events/RSVP | Listed in awesome lexicons; ATProtocol Dev coverage: https://atprotocol.dev/tech-talk-smoke-signal-turns-one/ | ATProto apps can be open source, self-hostable, use Tangled, and expose XRPC/webhook patterns. | A Tangled integration can be an app around protocol records, not a plugin trapped inside one host. |
| Frontpage link aggregator | Listed in awesome lexicons with source: https://github.com/likeandscribe/frontpage/tree/main/lexicons/fyi/unravel/frontpage | Link/news app as custom record family and appview. | Review Passport should feel like a specialized appview for maintainer decisions. |
| Bluesky moderation / labels | https://docs.bsky.app/docs/advanced-guides/moderation and AT Protocol speech/reach docs | Labels and reach systems separate record publication from how clients surface content. | Map code review to speech/reach: submission stays possible; maintainer attention is routed by evidence/trust/risk. |

Key lesson from adjacent apps:

> Atproto apps win when the record model is simple and the appview makes the records useful. They struggle when custom lexicons fragment shared meaning. For Tangled, use existing `sh.tangled.*` records as the main receipt chain and only preview a custom receipt record if the sponsor asks for it.

## What Can Be Safely Claimed In The Pitch

Use these confidently:

1. Tangled is a Git collaboration platform built on AT Protocol.
2. Tangled separates code hosting on knots from collaboration/social state carried through AT Protocol records and appviews.
3. AT Protocol provides portable identity through handles/DIDs, public signed data repositories, typed records, Lexicon schemas, XRPC, record addressing, and sync/firehose mechanics.
4. Tangled already has native issue, pull, comment/feed, vouch, repo, pipeline/spindle, knot, and related lexicons in public source.
5. Tangled's own newsletter says pull request records are ingested through the firehose and agents can create PRs by writing records to a PDS.
6. Tangled's vouching feature was explicitly motivated by LLM-generated low-quality or subtly wrong submissions.
7. Vouches/denounces are public PDS records with reasons, scoped display through the user's circle, and no hard consequence for denounce in the current design.
8. Spindle workflows can trigger on pull request updates, so CI can be part of the review evidence chain.
9. Repo DIDs and knots make repo identity/hosting visible in ways a central forge account/name does not.
10. A Review Passport can be built as an appview-style integration that reads public Tangled records and optionally writes comments/receipts through XRPC/PDS writes.

Best pitch phrasing:

> Git tells you what changed. Tangled can tell you why a maintainer should spend attention on it: who or what authored it, which issue it claims to solve, who vouches for it, what discussion it cites, which repo/knot it targets, and what the spindle saw.

## What Is Uncertain Or Should Be Softened

Do not overclaim these:

| Uncertain point | Current read | Safe handling |
| --- | --- | --- |
| Exact live appview queries for all records | Docs/source confirm records; hackathon live API ergonomics may differ. | Use seeded records with an explicit live path unless Tangled confirms endpoints. |
| Exact write-side auth and permissions | XRPC/PDS writes are standard, but Tangled-specific write flows may require schema/auth details. | Preview write payloads; do one live write only if sponsor/mentor confirms. |
| Custom `app.sunstead.*` receipt acceptance | ATProto allows custom schemas, but sponsor may prefer existing `sh.tangled.*`. | Make custom receipt optional and additive. |
| Vouch graph query semantics | Blog explains circle attenuation, but exact appview API for "my circle" may be private/evolving. | Seed "according to Mira's circle" and ask sponsor for the intended query. |
| Denounce consequences | Current blog says no consequences beyond warning label; future may change. | Say "today, review reach/warning, not blocking." |
| AT URI immutability | AT URI is addressable but not content-addressed. Records can change/delete. | Use "source record" or "receipt pointer"; use CID/strongRef language for stronger proof. |
| Pull record rounds as immutable history | Source lexicon says newer rounds are appended but appviews may reject records and not to treat the field as append-only. | Say "current pull record/round evidence," not "immutable PR history." |
| Repo migration between knots | Newsletter says repo renames are done and migrations between knots are next. | Claim repo DIDs support rename stability; treat knot migration as roadmap unless sponsor confirms shipped. |
| Spindle record visibility | Docs/source confirm workflows/status; exact public indexing of all logs/status may vary. | Show CI/spindle as evidence chip; avoid saying every log line is a signed AT record. |
| Agent identity model | Agents can write records to PDSes, but no official "agent passport" lexicon found. | Model the agent as an actor DID plus optional human sponsor/vouch/evidence, not a formal standard. |

## First-Minute Primitive Priority

Ranked by judging value:

1. **Pull record AT URI**: `at://did:plc:rae-agent/sh.tangled.repo.pull/payments-189`. This makes the PR a protocol object.
2. **Actor DID + handle**: `@rae.bot`, `did:plc:rae-agent`; human sponsor `@jules.dev`, `did:plc:jules-vouched`.
3. **Vouch/denounce evidence**: `sh.tangled.graph.vouch` with `kind`, reason, and evidence AT URIs. This is the anti-AI-slop sponsor signal.
4. **Linked issue/comment**: `sh.tangled.repo.issue` and `sh.tangled.feed.comment` show intent and project memory.
5. **Repo DID + knot**: durable repo identity plus hosting separation: `did:plc:repo-solar-payments` on `knot.helsinki.dev`.
6. **Spindle/pipeline status**: CI result as evidence, especially if it is focused and tied to a pull_request trigger.
7. **Live path strip**: "Seeded now; live path: firehose/appview read -> deterministic passport -> XRPC/PDS comment or receipt write."

Minimum first viewport:

- Header: maintainer handle/DID, repo DID, knot, release context.
- Top card reason: `Vouched sponsor + linked issue + focused spindle + pull record`.
- Evidence chips: identity, pull, issue, comment, vouch, spindle, repo.
- One visible DID-based AT URI, not only pretty labels.
- One action: `Review now`, `Request missing receipts`, or `Cool down`.

## Best Demo Flow From Eta

Use two AI PRs and one maintainer:

1. Mira opens `solar-knot/payments`, shown with repo DID and knot.
2. `PR #189` from `@rae.bot` is `Ready to review` because:
   - `@rae.bot` has a stable DID;
   - `@jules.dev` is the human sponsor;
   - PR record is `sh.tangled.repo.pull`;
   - it references release-blocking issue #91;
   - it adds a focused regression test;
   - spindle/pipeline status is focused or passing;
   - Jules or Mira's circle vouches, with evidence AT URIs.
3. `PR #190` is `Missing receipts` because:
   - no stable actor identity or sponsor;
   - no linked issue/comment;
   - risky files touched;
   - no focused test/spindle evidence;
   - similar low-evidence pattern has a denounce record.
4. The UI never says the weak PR is malicious. It asks for missing receipts.
5. Close with:

> Tangled does not ask maintainers to trust AI. It makes AI and human patches carry identity, intent, tests, trust, and source records before they consume review time.

## Product Implications

1. **Build with existing records first.** Use `sh.tangled.repo.pull`, `sh.tangled.repo.issue`, `sh.tangled.feed.comment`, `sh.tangled.graph.vouch`, repo DID/knot, and spindle/pipeline evidence. This avoids custom-lexicon uncertainty.
2. **Use custom receipt as a preview, not a dependency.** If sponsor likes the write-side story, preview `app.sunstead.aiPatchReceipt` with fields for agent DID, sponsor DID, pull URI, issue URI, tests, spindle URI, vouch URIs, and createdAt.
3. **Make "review reach" the trust mechanic.** Vouch/denounce changes lanes and explanations, not permissions.
4. **Keep records public/evidence-linked.** The product should be inspectable, not a black-box score.
5. **Do not depend on live indexing during judging.** Seeded data is acceptable if exact source record types and live path are visible.

## Open Sponsor Questions

Ask these before large implementation work:

1. Should the demo use only existing `sh.tangled.*` records, or would a small custom receipt/agent-attestation lexicon be exciting?
2. What is the preferred live read path for recent pull/issue/comment/vouch/spindle records: appview endpoint, firehose, or repo/PDS reads?
3. Is a read-side maintainer passport enough for the challenge, or should we include one live write action such as a Tangled comment?
4. How should vouch/denounce be queried for "my circle" in an integration?
5. Are spindle pipeline statuses/logs intended to be consumed as public evidence records by third-party apps?
6. Would the Tangled team rather see agent-created PRs, agent-reviewed PRs, or agent receipts attached to PRs?

## Verdict

Eta lowers the ATProto/Tangled-native uncertainty from T55 to about T20.

The highest-amplitude path is:

> **Tangled Review Passport**, demoed as **Patch Passport for AI PRs**, with the first minute dominated by `sh.tangled.*` records, DIDs, repo DID/knot, vouch evidence, and spindle status.

This idea hits the challenge because it uses the protocol as the product surface. The competitor/adjacent ATProto app lesson is clear: custom lexicons and appviews are normal, but the winning hackathon move is not inventing a large schema. It is making Tangled's existing collaboration records visibly change one maintainer decision.

## Source Index

- Challenge file: `TANGLED_CHALLENGE_INFO.txt`
- Mission spec: `investigations/tangled_landscape_2026_06_24/01_landscape/MISSION_01_LANDSCAPE.md`
- Local idea spine: `TOP_IDEAS_PITCH.md`, `TANGLED_ARCHETYPE_CONVERGENCE.md`, `TANGLED_AI_PR_TRUST.md`, `TANGLED_PROBLEM_SOUL.md`, `evidence-radar-atproto/DEEP_THESIS.md`
- Tangled docs: https://docs.tangled.org/single-page
- Tangled docs source: https://tangled.org/tangled.org/core/blob/master/docs/DOCS.md
- Tangled intro: https://blog.tangled.org/intro/
- Tangled federation: https://blog.tangled.org/federation/
- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- Tangled public source: https://tangled.org/tangled.org/core
- Public source commit inspected locally: `9b3e1670c09006cf82867f7728ac528c6d0c3212`
- AT Protocol overview: https://docs.bsky.app/docs/advanced-guides/atproto
- AT Protocol repository spec: https://atproto.com/specs/repository
- AT URI scheme: https://atproto.com/specs/at-uri-scheme
- Lexicon spec: https://atproto.com/specs/lexicon
- XRPC spec: https://atproto.com/specs/xrpc
- Sync spec: https://atproto.com/specs/sync
- Firehose guide: https://docs.bsky.app/docs/advanced-guides/firehose
- Custom schemas guide: https://docs.bsky.app/docs/advanced-guides/custom-schemas
- Publishing lexicons guide: https://atproto.com/guides/publishing-lexicons
- AT Protocol app guide: https://atproto.com/guides/applications
- Statusphere example app: https://github.com/bluesky-social/statusphere-example-app
- Awesome lexicons: https://github.com/lexicon-community/awesome-lexicons
- Leaflet longform lexicon notes: https://lab.leaflet.pub/3lxy5sg373k2z
- WhiteWind source lexicons: https://github.com/whtwnd/whitewind-blog/tree/main/lexicons/com/whtwnd/blog
- Smoke Signal ATProtocol Dev coverage: https://atprotocol.dev/tech-talk-smoke-signal-turns-one/
- Smoke Signal lexicons: https://github.com/SmokeSignal-Events/lexicon
- Frontpage lexicons: https://github.com/likeandscribe/frontpage/tree/main/lexicons/fyi/unravel/frontpage
