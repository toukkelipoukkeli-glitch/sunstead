# Agent Zeta: Decentralized Forges And Protocol-Native Collaboration

> Mission: map decentralized/federated code forges and protocol-native collaboration systems for the Tangled landscape sweep.
> Date: 2026-06-24.
> Scope: ForgeFed, Forgejo/Gitea federation, Radicle, Secure Scuttlebutt/git-ssb, SourceHut, Codeberg, GitLab/GitHub federation discussions, ActivityPub forges, Darcs/Pijul/Jujutsu context, Tangled itself, and nearby state-in-Git systems.

Navigator position: emerging and aligned, approaching cold on the main contrast. The landscape is broad enough to lower the decentralized-forge uncertainty, but exact Tangled implementation preference still depends on sponsor feedback about custom lexicons versus existing `sh.tangled.*` records.

## Executive Read

The prior art repeatedly converges on the same problem:

> Git already distributes code. The unsolved part is portable collaboration state: issues, pull requests, review rounds, CI evidence, trust, project decisions, and who is allowed to consume maintainer attention.

The closest adjacent systems split into four schools:

1. **Federated web forges**: ForgeFed, Forgejo, GitLab ActivityPub plans. They try to let users on one forge interact with repositories on another forge.
2. **Peer-to-peer sovereign forges**: Radicle and historical git-ssb. They make repository and social artifacts replicate through peers rather than a central forge.
3. **Email/protocol-native patch workflow**: SourceHut, public-inbox, Patchwork, git-send-email. This is the old, proven federation layer for serious open source.
4. **Collaboration state stored with code**: Fossil, Gerrit NoteDb, git-appraise, git-bug. They show that review/issues can be durable objects rather than forge database rows.

Tangled's wedge is not "decentralized GitHub." Others already own pieces of that story. Tangled's distinctive claim is:

> Git transfers code; AT Protocol transfers signed, typed, addressable collaboration evidence from portable identities. Tangled can make review trust and agent accountability visible at the exact PR/issue/comment where maintainers decide what deserves attention.

This strongly supports the local **Tangled Review Passport / Patch Passport** direction. A passport is not a generic AI review bot. It is a protocol evidence bundle over existing Tangled records: agent or human DID, repo DID, pull record, issue/comment records, vouch/denounce records, spindle result, and optional custom receipt record.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow from this Zeta slice: maintainer opens an AI or drive-by PR and sees the protocol evidence that makes it reviewable before reading the whole diff.
- Intentionally cut: building federation itself, ForgeFed interop, email bridge, Radicle bridge, P2P node operation, universal reputation, generic AI code review, live firehose dependency, broad migration tooling.

## Player Map

| Player / project | Model | Collaboration state | Identity model | Maturity | Relevance to Tangled |
| --- | --- | --- | --- | --- | --- |
| **Tangled** | Git on self-hostable knots plus AT Protocol for collaboration events and social state. | `sh.tangled.*` records, pull/issue/comment/feed records, vouch records, spindle events, repo DIDs, appview aggregation. | AT Protocol DIDs and handles; PDS-hosted records; repo DIDs for stable repository identity. | Young but live; public challenge source. | Exact target. Differentiates through signed public records, firehose, appviews, vouching, agent-created PR records. |
| **ForgeFed** | ActivityPub extension for software forges. | ActivityPub/ForgeFed objects and activities for repos, issues, PRs, forks, stars, SSH keys, remote push. | ActivityPub actors, including users and resource actors such as repositories or issue trackers. | Spec in development; active discussion; implementation uneven. | Closest "federated forge protocol" prior art. Shows cross-instance issues/PRs are known territory, not the hackathon wedge. |
| **Forgejo / Codeberg federation** | Self-hosted Forgejo instances with experimental ActivityPub/ForgeFed/F3 federation. | Forge DB objects mapped toward ForgeFed/F3; remote users, issues, stars, future PRs and collaborators. | Forgejo local accounts plus remote ActivityPub actors. | Major self-hosted forge; federation experimental and breaking per FAQ. | Strong adjacent player. Tangled should not pitch "we federate forges" generically; Forgejo is already aiming there. |
| **Gitea federation discussions** | Earlier Gitea issues and grants around ActivityPub/ForgeFed. | Proposed external users, projects, issues, pull requests, and resource mappings. | Gitea local users plus federated actor concepts. | Mostly discussion/history; Forgejo became main implementation path. | Confirms the problem is old: cross-forge PRs and account-per-instance friction. |
| **GitLab ActivityPub / cross-instance MR plans** | ActivityPub as incremental path from social following to cross-instance search, forks, discussions, and merge requests. | GitLab project/user/group activities, issues, merge requests, cross-instance discussions. | GitLab accounts on instances; ActivityPub actors if implemented. | Public epic/issues, not mainstream product capability. | Shows large incumbents understand the same need but move slowly. Good contrast: Tangled can demo now because records are native. |
| **GitHub** | Centralized social/code network with Actions, PRs, bots, Copilot/Codex integrations. | GitHub database and APIs. | GitHub account identity; org-level permissions; app/bot identities. | Dominant incumbent. | Mostly negative space. GitHub can add AI review badges, but not portable AT records or independent appviews. |
| **Radicle** | Peer-to-peer sovereign forge built on Git. | Code, issues, patches, discussions as signed Git-backed Collaborative Objects (COBs); replicated between peers and seed nodes. | Cryptographic identities/DIDs, node IDs, repository IDs, delegates and thresholds. | Active, open source, mature enough for real use; Radicle 1.x releases through 2026. | Closest technical competitor for "sovereign code collaboration." Tangled must beat it on web UX, social graph, appview/firehose, and human-readable account portability. |
| **SourceHut** | Modular hosted forge built around Git/Mercurial, email, mailing lists, CI, tickets, project hub. | Email threads, patchsets, tickets, build results, project hub resources. | SourceHut accounts plus email addresses; participation often possible by email without account. | Active public alpha/business; used by serious FOSS projects. | The strongest "protocol-native but not new-protocol" benchmark. Tangled should learn from its composable resources and maintainer-first minimalism. |
| **public-inbox / Patchwork / git-send-email ecosystem** | Email-native patch collaboration. | mbox archives, patch states, review replies, mailing list history. | Email addresses, optional PGP/sign-off chains. | Proven at Linux-scale. | Demonstrates that open collaboration can be protocol-native and durable. Tangled's advantage is structured records, DIDs, and appviews rather than prose email archaeology. |
| **Secure Scuttlebutt / git-ssb** | P2P social log with Git interface. | SSB messages for issues, forks, PRs, project feeds. | SSB feed public keys and friend-of-friend replication. | Historically important; git-ssb GitHub mirror archived in 2019. | Shows "social coding over a trust graph" was tried. Useful caution: great principles can lose on UX/adoption. |
| **Vervis / Anvil** | ForgeFed reference/proof-of-concept server and client path. | ActivityPub/ForgeFed forge objects. | ActivityPub actors. | PoC/reference level. | Good source for conceptual coverage, not a direct hackathon threat. |
| **F3 Friendly Forge Format** | Open file/archive format for forge data migration and storage. | Issues, pull/merge requests, milestones, releases, VCS data. | Not primarily an identity system. | Developed around Forgejo federation/migration needs. | Migration/history adjacent. It supports "collaboration metadata needs a portable format," but not live agent workflow. |
| **Fossil SCM** | All-in-one distributed SCM with tickets, wiki, forum, chat, technotes, web UI. | Project management artifacts bundled and cloned with the repo/site. | Fossil repo/user accounts, not a broad social identity protocol. | Mature and battle-tested. | Important precedent: a repo can carry more than code. Tangled's upgrade is network-wide identity and records across repos/knots. |
| **Gerrit NoteDb** | Git-backed storage for code review metadata. | Change metadata, patchsets, comments, accounts/groups in Git refs such as `refs/changes/.../meta`. | Gerrit accounts, groups, external auth. | Mature; Gerrit 3.x uses NoteDb. | Proves review metadata in Git enables auditability, replication, federation/offline review. Tangled can use AT records instead of Git refs for social evidence. |
| **git-appraise** | Distributed Git code review CLI. | Reviews stored as Git objects; pushed/pulled with repo. | Git user/remote credentials, no broad social identity. | Useful but niche. | Good prior art for "review state should not live only in a forge DB." |
| **git-bug / git-issue** | Distributed issue trackers embedded in Git. | Issues/comments/users as Git objects, with bridges to GitHub/GitLab. | Git-level identity plus tool records. | Active enough to matter, niche. | Reinforces "issues as portable state" but lacks first-class social graph, vouching, and PR attention routing. |
| **Darcs / Pijul** | Patch-theory version control. | Changes are first-class patches, with commutation and dependency theory. | VCS-level authorship, not broad forge identity. | Darcs mature niche; Pijul active niche. | Conceptual only. They sharpen the idea that "patch" is the core unit, but Tangled should not replace Git/VCS in a hackathon demo. |
| **Jujutsu (jj)** | Git-compatible VCS with first-class mutable changes; supports stacked workflows. | Change graph and bookmarks; external forge handles review state. | Git identity plus forge accounts. | Rapidly growing developer workflow tool. | Tangled already highlights stacked PRs using jj change IDs. Use as demo credibility, not core landscape wedge. |

## Collaboration-State Model

The landscape can be understood by asking: where does collaboration state live, and how does it move?

| State model | Examples | Where state lives | What moves well | What breaks |
| --- | --- | --- | --- | --- |
| **Forge database** | GitHub, GitLab, Gitea/Forgejo today | Central service DB plus Git repos | Polished UX, permissions, search, notifications | Account lock-in, poor portability, cross-forge PR friction, opaque data ownership |
| **Federated object inboxes** | ForgeFed, Forgejo federation, GitLab ActivityPub plan | ActivityPub actors/inboxes/outboxes and forge DB mappings | Cross-instance issues, follows, comments, pull/merge requests | Spec/implementation complexity, moderation/access control, actor portability in practice |
| **P2P Git-backed objects** | Radicle COBs, git-appraise, git-bug | Git objects/refs replicated peer-to-peer or through remotes | Offline work, auditability, no central server, code and review state close together | Discovery, web UX, global search, contributor onboarding, social graph portability |
| **Email threads** | SourceHut, kernel workflow, public-inbox, Patchwork | Email inboxes, mailing list archives, public-inbox Git stores | Proven federation, resilient archives, no forge account needed | Poor structure, steep UX, hard automation, identity/trust scattered across prose |
| **All-in-one repo/site** | Fossil | Single distributed project repository with tickets/wiki/forum/site | Project state travels together, strong coherence | Project silo, weak cross-project social graph, not a modern public app ecosystem |
| **AT records plus Git knots** | Tangled | Git repos on knots; collaboration records in PDSes; appviews/Jetstream aggregate | Portable identity, typed records, AT URIs, agent/event firehose, independent appviews | Young ecosystem, public-record constraints, appview/knot maturity, custom lexicon uncertainty |

Main finding:

> The best systems make collaboration state first-class. Tangled's distinctive move is making that state first-class at the social protocol layer instead of only in Git, email, or one forge database.

This matters for autonomous agents. An agent does not just need somewhere to push code. It needs a durable identity, scope, owner/sponsor, issue intent, tests, CI result, vouches/denounces, and PR history. In Tangled, those can be separately addressable records and still converge inside one maintainer UI.

## Identity Model

| Identity model | Systems | Strength | Weakness | Tangled implication |
| --- | --- | --- | --- | --- |
| **Forge account** | GitHub, GitLab, current Forgejo/Gitea | Easy UX, permissions, spam control | Identity tied to host; account-per-forge friction | Do not copy this. Tangled should show identity surviving repo/knot movement. |
| **Email address** | SourceHut, git-send-email, mailing lists | Universal, decentralized, long-lived enough | Weak structured trust, spam, messy key rotation, weak app UX | Good fallback metaphor: Tangled is "git plus structured comms," like email but typed and signed. |
| **ActivityPub actor** | ForgeFed, Mastodon-style federation, Forgejo plans | Cross-instance social object model | Practical name/account portability is implementation-dependent; server-domain identity remains sticky | Tangled should explicitly show DID/handle split and PDS migration story. |
| **Cryptographic key / DID** | Radicle, SSB, AT Protocol | Self-authenticating authorship and portable verification | Can be unfriendly; key/device management is hard | Tangled has the best demoable version: human handles plus stable DIDs. |
| **Repository identity** | Radicle RID, Tangled repo DID, Fossil repo | Stable project reference independent of display name/location | Adoption requires tools to expose it meaningfully | Show repo DID on screen. It is a hard differentiator for renames/transfers. |
| **Delegates / maintainers / trust circle** | Radicle delegates, Tangled vouches, Gerrit labels/owners | Review authority can be explicit | Can drift into social scoring or governance complexity | Use evidence chips and lanes, not global scores. |
| **Agent identity** | Mostly absent or generic bots on GitHub; natural in AT/Radicle | Enables accountability for autonomous contributors | Needs owner/scope/evidence to be trusted | Tangled can make an agent a DID-backed network actor with a human sponsor and vouch trail. |

Strongest identity insight:

> Radicle gets sovereignty through keys and peer replication. ForgeFed gets cross-instance reach through ActivityPub actors. Tangled can combine human-readable handles, stable DIDs, signed records, and appview-level discovery in a way that is unusually demoable.

## What Tangled Uniquely Enables Through AT Protocol

These are the primitives that competitors do not combine in the same way.

1. **Signed, typed collaboration records outside one forge DB.**
   AT Protocol accounts store public records in signed repositories. Tangled can make pull, issue, comment, vouch, feed, and optional receipt records individually addressable and independently indexed.

2. **AT URIs as review evidence.**
   A maintainer tool can point to exact records: pull record, issue record, comment, vouch, spindle event, repo record. The passport is not a summary blob; it is a receipt chain.

3. **Human-readable handles plus stable DIDs.**
   ActivityPub and P2P systems often force a tradeoff between friendly names and durable identifiers. AT Protocol makes the split central: handles can move, DIDs remain stable.

4. **Repo DIDs and knot mobility.**
   Tangled docs state repositories get DIDs, making them stable across renames and transfers. This makes "project memory survives movement" much more concrete than generic forge export/import.

5. **Firehose / Jetstream as an agent substrate.**
   Agents can listen for PR records and other events through the firehose/Jetstream pattern. Tangled newsletter 02 says pull request records are ingested through the firehose and agents can create PRs by writing records to a PDS.

6. **Appview pattern for third-party maintainer intelligence.**
   A Review Passport app does not need to be a Tangled core feature or a GitHub App equivalent. It can read the same public protocol records and compute its own view.

7. **Vouching as reach, not punishment.**
   Tangled's vouch/denounce design already uses public records, text reasons, attenuation to the user's circle, hats at points of interaction, and no hard consequences for denounces. This maps perfectly to review lanes: ready, missing receipts, cool down.

8. **Agents as first-class protocol actors.**
   GitHub bots are app accounts inside GitHub. On Tangled, an agent can plausibly be a DID/handle/PDS actor that writes pull records, comments, and receipts and accumulates vouch evidence.

9. **CI as protocol-visible evidence.**
   Spindles listen to Jetstream/repo records and execute pipelines. That lets CI move from "green check in a proprietary UI" to "one evidence chip in an AT-addressed review receipt."

10. **"Speech vs reach" applied to code review.**
    AT Protocol's moderation philosophy separates publication from reach. For open-source review, that becomes: anyone can submit, but scarce maintainer attention is routed by evidence, trust, scope, and risk.

## Closest Competitor Contrasts

### Tangled vs ForgeFed / Forgejo

ForgeFed's core promise is cross-forge interaction: host code anywhere, open issues or submit pull requests without accounts on each remote forge. That is close, but it is infrastructure-first.

Tangled's hackathon wedge should be workflow-first:

> A maintainer can decide whether this PR deserves attention because identity, intent, trust, CI, and project memory are source-linked records.

Forgejo federation is active but explicitly experimental, with moderation and access control still called out as not fully developed. Tangled can use the sponsor challenge to show an integration that sits above the protocol now, rather than promising federation someday.

Idea implication: do not pitch "we federate PRs." Pitch "we make federated PRs reviewable and accountable."

### Tangled vs Radicle

Radicle is the hardest technical adjacent player. It already stores social artifacts as signed Git-backed Collaborative Objects and replicates them through peers. It is local-first, sovereign, and serious.

Tangled should not claim Radicle cannot do decentralized collaboration. It should claim:

- Radicle optimizes for sovereignty and P2P replication.
- Tangled optimizes for social reach, account portability, appview-level discovery, and web-native agent integrations.
- Radicle collaboration state is naturally repository/peer scoped.
- Tangled collaboration evidence can be indexed across the AT network and shown anywhere the actor/repo records are relevant.

Idea implication: the Review Passport should use cross-record/cross-actor social evidence, not just repo-local PR metadata. Otherwise Radicle and Gerrit NoteDb have already explored the better "state with repo" story.

### Tangled vs SourceHut / email

SourceHut proves that serious open source can be protocol-native, modular, and maintainer-first without inventing a new social protocol. It also proves that CI-on-patches and email-based review can be extremely effective.

Tangled should not argue email is bad. It should argue:

- email is resilient but unstructured;
- Tangled records are structured, typed, signed, queryable, and addressable;
- AI agents need structured intent/scope/test/trust records more than humans need prose threads;
- maintainers need a compact decision surface over records, not another inbox.

Idea implication: build a maintainer checkpoint that feels as low-noise as SourceHut, not a flashy dashboard.

### Tangled vs Gerrit NoteDb / git-appraise / git-bug / Fossil

These systems show that collaboration metadata can live outside a proprietary database. Gerrit NoteDb especially proves review metadata can be auditable Git history.

Tangled's difference:

- Git-backed metadata travels with one repo; AT records can connect people, repos, vouches, issues, CI, and agents across the network.
- Gerrit/git-appraise/git-bug are excellent for local durability, weaker for public social graph and portable contributor trust.
- Fossil is coherent but project-siloed; Tangled can make project judgment portable across knots and visible in a network social UI.

Idea implication: "Project Memory" and "Case Law" are credible because the state-in-repo school validates durable review state. Tangled should lift that state into signed social records.

## Gaps And Open Territory

| Gap | T/A/P | Evidence that lowers T | Product opportunity |
| --- | ---: | --- | --- |
| **Agent accountability for PRs is not solved by decentralized forges.** | 24/96/72 | Tangled confirms custom or existing record pattern for agent identity/scope/receipt. | Patch Passport for AI PRs. |
| **Cross-forge/federated PRs are known territory, but review reach is not.** | 18/90/72 | Sponsor says vouches/evidence trails should alter maintainer attention. | Review lanes: ready, missing receipts, cool down. |
| **Project judgment portability remains weak outside all-in-one tools.** | 26/91/65 | Sponsor likes custom project-decision records or evidence-backed comments. | Case Law / Project Memory as a passport field. |
| **Trust systems risk sounding like global social scoring.** | 30/84/54 | UI uses evidence presence and scoped vouch circle, not numeric ranking. | Evidence chips, no score, maintainer-controlled action. |
| **AT custom lexicon acceptance is uncertain.** | 34/88/54 | Sponsor says custom `app.sunstead.*` receipt is welcome. | Optional write-side preview. Fallback to existing records. |
| **Live network/firehose reliability at judging is uncertain.** | 28/82/54 | Seeded records plus screenshots/deep links are accepted. | Build deterministic seeded app with visible AT URI path. |

## Product Implications For The Best Idea

### Best Zeta-supported idea

**Tangled Review Passport**, demoed as **Patch Passport for AI PRs**.

Reason:

> Every major adjacent project tries to liberate collaboration state from a single forge. Tangled can go one level higher and make reviewability itself a portable protocol object.

The passport should answer:

- Who or what produced this patch?
- Which DID/handle owns that identity?
- Who stands behind it?
- What issue or maintainer request does it claim to solve?
- What project decision or previous comment does it cite?
- What tests/spindle result back it?
- What vouch/denounce context applies in this maintainer's circle?
- Which repo DID and pull record are involved?
- Which AT URIs prove each claim?

### Strongest demo shape

One maintainer, one repo, two AI PRs:

1. `PR #189` is from `@rae.bot`, linked to a stable DID, human sponsor, issue, focused regression test, passing spindle, and vouch evidence.
2. `PR #190` is from an unknown/throwaway agent, no issue, no sponsor, no focused test, risky files, and a denounced low-evidence pattern.
3. Both patches look plausible.
4. Only one gets `Ready to review`.
5. The difference is not model confidence. It is protocol evidence.

Twenty-second judge framing:

> Git tells you what changed. Tangled can tell you why this patch deserves attention. Patch Passport makes AI PRs carry identity, intent, tests, trust, and AT Protocol receipts before a maintainer spends review time.

### Tangled-native proof chips to show on screen

- `@rae.bot` handle and agent DID.
- Human sponsor DID.
- Repo DID and knot.
- `sh.tangled.repo.pull` AT URI.
- Linked issue/comment AT URIs.
- Vouch/denounce records from the maintainer's trust circle.
- Spindle run/event reference.
- Optional custom `app.sunstead.aiPatchReceipt` preview if sponsor likes custom records.

### What to cut

- Do not build a ForgeFed bridge.
- Do not build a Radicle bridge.
- Do not pitch "GitHub but decentralized."
- Do not build generic AI code review.
- Do not claim AI detection.
- Do not claim a vouch proves code is safe.
- Do not create a universal trust score.
- Do not make the demo depend on live P2P/federation plumbing.

## Secondary Idea Mutations From Zeta

### 1. Review Passport as "federated pull request customs"

Borrow from ForgeFed and SourceHut: anyone can send a patch from elsewhere, but a maintainer still needs intake rules. Tangled can be the customs desk where remote/agent patches declare identity, intent, tests, and trust.

Use if sponsor pushes write-side integrations.

### 2. Project Memory as "Fossil for a social protocol"

Fossil shows project state can travel with code. Tangled can show project judgment travels across knots, identities, and appviews.

Use if sponsor likes repo DIDs, knot migration, or custom project-decision records.

### 3. Vouch evidence trails as the missing ForgeFed moderation layer

Forgejo explicitly calls moderation/access control gaps in federation. Tangled already has vouches/denounces, attenuation, and hats at points of interaction. A product that turns those into review reach is very sponsor-native.

Use if sponsor reacts strongly to vouching.

### 4. Agent DID registry for code forges

Radicle supports delegates, GitHub supports bot accounts, but Tangled can make agents AT actors with owner/scope records. This could be a smaller write-side artifact inside the passport.

Use if sponsor says "agents should create PRs" more than "maintainers need a queue."

## Dead Ends / Downgrades

- **"Decentralized GitHub"**: dead for this hackathon. Forgejo, Radicle, SourceHut, Fossil, and Tangled itself already occupy the general position. Too broad for a 4-minute pitch.
- **Forge federation interoperability demo**: high build risk, low originality for Tangled challenge. ForgeFed/Forgejo/GitLab already frame it.
- **Universal reputation score**: likely harmful. Tangled vouching deliberately avoids hard consequences and scopes decisions to circles.
- **Pure P2P/offline story**: Radicle wins that comparison. Tangled wins on AT social records and appviews.
- **Pure migration/archive story**: F3/Fossil/git-bug/git-appraise cover much of the conceptual ground. Make migration a proof point, not the headline.
- **Email bridge**: SourceHut/public-inbox are already excellent. It would distract from Tangled's agentic AT Protocol challenge.

## Source Notes

Primary and high-signal sources checked:

- Tangled challenge file: `TANGLED_CHALLENGE_INFO.txt`.
- Tangled docs: <https://docs.tangled.org/single-page>.
- Tangled website: <https://tangled.org/>.
- Tangled intro: <https://blog.tangled.org/intro/>.
- Tangled federation post: <https://blog.tangled.org/federation/>.
- Tangled vouching post: <https://blog.tangled.org/vouching/>.
- Tangled newsletter 02: <https://blog.tangled.org/newsletter-02/>.
- Tangled knot/spindle migration docs: <https://docs.tangled.org/migrating-knots-and-spindles>.
- AT Protocol overview: <https://atproto.com/guides/overview>.
- AT Protocol repository spec: <https://atproto.com/specs/repository>.
- AT Protocol identity guide: <https://atproto.com/guides/identity>.
- AT Protocol streaming data / Jetstream: <https://atproto.com/guides/streaming-data>.
- ForgeFed home: <https://forgefed.org/>.
- ForgeFed spec: <https://forgefed.org/spec/>.
- Forgejo FAQ: <https://forgejo.org/faq/>.
- Forgejo federation questions: <https://forgejo.org/2023-01-10-answering-forgejo-federation-questions/>.
- Forgejo first monthly update / federation focus: <https://forgejo.org/2022-12-26-monthly-update/>.
- Vervis actor refactoring / reference implementation: <https://forgefed.org/blog/vervis-actor-refactoring/>.
- F3 Friendly Forge Format: <https://f3.forgefriends.org/>.
- GitLab ActivityPub epic: <https://gitlab.com/groups/gitlab-org/-/epics/11247>.
- GitLab cross-server merge requests issue: <https://gitlab.com/gitlab-org/gitlab/-/issues/14116>.
- Gitea federation issues: <https://github.com/go-gitea/gitea/issues/1612> and <https://github.com/go-gitea/gitea/issues/14186>.
- NLnet Gitea/ForgeFed grant: <https://nlnet.nl/project/Gitea/>.
- Radicle home: <https://radicle.dev/>.
- Radicle user guide: <https://radicle.dev/guides/user>.
- SourceHut home: <https://sourcehut.org/>.
- SourceHut project hub: <https://sourcehut.org/blog/2020-04-30-the-sourcehut-hub-is-live/>.
- SourceHut mailing-list CI: <https://sourcehut.org/blog/2020-07-14-setting-up-ci-for-mailing-lists/>.
- Drew DeVault on Git/email federation: <https://drewdevault.com/blog/Git-is-already-distributed/>.
- Secure Scuttlebutt applications / git-ssb: <https://handbook.scuttlebutt.nz/applications>.
- git-ssb archived GitHub mirror: <https://github.com/clehner/git-ssb>.
- Fossil SCM: <https://fossil-scm.org/>.
- Gerrit NoteDb: <https://gerrit-review.googlesource.com/Documentation/note-db.html>.
- git-appraise: <https://github.com/google/git-appraise>.
- git-bug: <https://github.com/git-bug/git-bug>.
- Pijul: <https://pijul.org/>.
- Darcs: <https://darcs.net/>.
- Jujutsu GitHub/GitLab workflow docs: <https://docs.jj-vcs.dev/latest/github/>.

## To The Director

COLD:

- Decentralized code collaboration is crowded at the infrastructure layer. ForgeFed/Forgejo/GitLab cover cross-forge ActivityPub; Radicle covers P2P Git-backed collaboration; SourceHut/email covers resilient protocol-native patch flow; Fossil/Gerrit/git-appraise/git-bug cover state-with-code.
- Tangled's differentiator is AT Protocol collaboration evidence: portable DIDs/handles, signed public records, AT URIs, appviews, firehose/Jetstream, repo DIDs, vouch records, spindles, and agent-writable PR records.

WARM:

- Exact record strategy remains T=34: existing `sh.tangled.*` receipt composition versus a custom `app.sunstead.*` passport record.
- Sponsor preference for read-side seeded proof versus write-side record creation remains T=28.

BOTTLENECK:

- Make the first minute visibly Tangled-native. If the UI looks like a GitHub PR queue with AI labels, the idea fails. The first screen must show DID/handle, repo DID/knot, AT URI evidence, vouch context, and spindle/PR record proof.

Recommendation:

- Continue with **Tangled Review Passport**, demoed as **Patch Passport for AI PRs**.
- Keep **Project Memory / Case Law** as a passport field, not the headline unless sponsor strongly prefers project-decision records.
- Ask sponsor: "Should passport evidence be composed only from existing pull/issue/comment/vouch/spindle records, or would a custom agent receipt record be exciting?"
