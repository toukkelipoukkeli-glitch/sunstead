# Agent Epsilon: Trust, Reputation, and Web-of-Trust Landscape

> **Status:** COMPLETE
> **Agent:** epsilon
> **Mission:** `01_landscape`
> **Navigator position:** Emerging and aligned. Wide trust landscape, selective down probes on closest analogues.
> **Target T/A:** T55 -> T22, A92. Evidence that lowers T: sourced contrast between scoring systems and Tangled-native vouch/denounce semantics.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Challenge style: open-ended creative inside a Tangled sponsor need.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow: a maintainer sees whether a human or agent PR has enough protocol evidence to deserve review attention.
- Intentionally cut: universal contributor scores, AI-detection claims, punitive denounce enforcement, live global graph indexing, broad moderation tooling, and any trust mechanic that auto-merges or auto-blocks code.

Known unknowns still worth flagging before large build work:

- Whether Tangled sponsors prefer only existing `sh.tangled.*` records or a preview custom receipt/agent-attestation record.
- Whether live write-side creation matters more than a seeded read-side proof.
- Whether vouch/denounce records expose enough shape for scope, evidence URI, and decay in the hackathon timeframe.

## Executive Verdict

The strongest trust direction is **review reach with receipts**, not a public trust score.

The closest exact external player is [mitchellh/vouch](https://github.com/mitchellh/vouch/): an OSS community trust tool that uses explicit vouches and denounces, with GitHub Actions that can close or allow issues/PRs. Tangled is already in the same conceptual neighborhood, but has a better sponsor-native wedge: public AT Protocol records, web-of-trust-scoped visibility, hats shown at issues/PRs/comments, and currently no automatic consequence for denounce.

The best Tangled version should say:

> Vouches and denounces do not decide whether a person may speak. They decide how much scarce maintainer review reach a patch receives, and every reach decision has receipts.

This maps directly to ATProto's broader speech/reach separation and Tangled's existing vouching posture. It is also safer than a global reputation system because it keeps trust contextual, explainable, revocable, and maintainer-controlled.

## Sourced Landscape Map

| System / concept | Signal model | What it solves | Failure mode | Tangled implication |
| --- | --- | --- | --- | --- |
| [Tangled native vouching](https://blog.tangled.org/vouching/) | Public PDS records for vouch/denounce, optional reason, visible through a user's trust circle. | Helps maintainers judge interactions under AI/LLM-generated low-quality submissions. | Red/green hats can drift toward social scoring if used as punishment. | Keep it as contextual review reach. Add evidence trails, decay, and "no hard consequence" language. |
| [Tangled newsletter 02](https://blog.tangled.org/newsletter-02/) | Vouch hats at issues, PRs, comments; public AT Protocol records; PR records ingested through firehose. | Puts trust signal exactly where review time is spent and confirms agents can create PR records by writing to PDSes. | If hidden in profile pages, the primitive is less demo-visible. | Show vouch/denounce evidence on the first screen of the PR decision. |
| [mitchellh/vouch](https://github.com/mitchellh/vouch/) | Flat-file vouch/denounce list, GitHub Actions checks, optional auto-close policies. | Exact AI-slop-adjacent precedent for explicit contributor trust gates. | More punitive than Tangled's current design; can block participation if configured that way. | Use as contrast: Tangled can be less brittle because records are portable, attenuated, and evidence-linked. |
| [GitHub verified commits](https://docs.github.com/en/authentication/managing-commit-signature-verification) | GPG/SSH/S/MIME signatures tied to commits/tags. | Shows that a commit came from a verified key/account source. | Identity/provenance is not correctness or reviewworthiness. | Treat signatures/DIDs as one receipt chip, not a trust verdict. |
| [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) and [branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) | Role/path-based review authority and required approvals. | Routes review to accountable owners and gates merge. | Repo-local, not portable across forks/knots; trust is institutional, not social. | Tangled can combine path ownership with portable vouches and PR receipts. |
| [GitHub profile contributions](https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile) | Contribution graph, pinned work, activity. | Lightweight public reputation signal. | Easy to misread as skill/trust; private work hidden/anonymized; quantity dominates quality. | Do not copy "green square" social proof. Prefer accepted-work receipts tied to specific repos and files. |
| [OpenSSF Scorecard](https://github.com/ossf/scorecard) | Automated security checks scored 0-10. | Dependency/project risk triage and security posture improvement. | Official non-goals warn it is not definitive, checks are opinionated heuristics, and false positives/negatives exist. | Scorecard-like checks are good as evidence chips; bad as a universal project or person trust score. |
| [CHAOSS metrics](https://chaoss.community/kb/metrics-model-starter-project-health/) | Project health metrics such as response time, closure ratio, contributor concentration, release frequency. | Helps OSPOs and contributors improve project health. | CHAOSS explicitly frames metrics as project-specific, not universal comparisons. | Good pattern: measure context, explain action, avoid global leaderboard. |
| [OpenDigger](https://open-digger.cn/en/docs/user-docs/intro) / [OpenRank GitHub rankings](https://docs.openrank.com/integrations/github-developers-and-repo-ranking) | GitHub event graph rankings, reputation proximity, OpenRank/EigenTrust-style computations. | Useful for discovering influential developers/repos in a chosen ecosystem. | Seed choice and edge weights define the outcome; scores are contextual but look objective. | If Tangled uses graph reach, make the trust root visible: "according to Mira's circle", not "trusted globally." |
| [GnuPG Web of Trust](https://www.gnupg.org/gph/en/manual/x547.html) | Key signatures and trust paths rooted in a local trust database. | Decentralized key validation without a central CA. | GnuPG itself frames the hard part as social, not technical; web growth and key validation are hard. | Tangled's vouch graph should stay human-legible and local; "enough signatures" is not enough for code review. |
| [Debian public keyring](https://keyring.debian.org/) and maintainer model | Maintainer/developer keys in curated keyrings. | Package upload trust and project membership. | High-assurance but slow, governance-heavy, and not suited to casual drive-by contributions. | Use for inspiration on durable identity and role trust, not for the hackathon UX. |
| [Keyoxide](https://docs.keyoxide.org/wiki/keyoxide/) | Decentralized identity proofs by linking accounts/domains to cryptographic keys. | Proves account/domain control across platforms. | Proves "same actor controls these accounts", not "this actor writes safe code." | Agent/human passports can use identity proof, but review reach still needs work/test/vouch receipts. |
| [ATProto/Bluesky labels and moderation](https://docs.bsky.app/docs/advanced-guides/moderation) and [label spec](https://atproto.com/specs/label) | Signed labels from labeler services, user-selected labelers, mutes/blocks, takedowns. | Composable trust and safety; separates source, subject, and value. | Label semantics can fragment; users may not know whose labels they are applying. | Model denounces as labels/records with source DID, subject DID/URI, value, reason, and negation/supersession. |
| [AT Protocol architecture](https://docs.bsky.app/docs/advanced-guides/atproto) | Account portability, signed data repos, algorithmic choice, and speech/reach distinction. | Lets users publish data while apps/labelers decide reach. | Reach systems can still centralize if one appview dominates. | Pitch line: Tangled applies speech/reach separation to code review attention. |
| [SourceCred](https://sourcecred.io/docs/beta/cred/) | Contribution graph -> Cred score -> optional Grain rewards. | Makes invisible community work inspectable and rewardable. | Scores invite governance disputes; SourceCred avoids transferability and says cred is community-specific. | Good lesson: if any "cred" exists, it must be inspectable, local to a project/circle, and not transferable. |
| [Human Passport / Gitcoin Passport](https://passport.human.tech/) and [Gitcoin sybil research](https://gitcoin.co/research/quadratic-funding-sybil-resistance) | Stamps/credentials -> unique-humanity or sybil-resistance score. | Protects airdrops, quadratic funding, and web3 campaigns from bots. | Scores gate access and can still be gamed; Gitcoin notes sophisticated attacks remain. | Tangled should not prove "good human"; it should show "accountable actor with receipts for this PR." |
| [Stack Overflow reputation](https://stackoverflow.com/help/privileges) | Points from peer voting unlock privileges. | Scales community moderation and reduces spam. | Reputation becomes status, creates cold-start friction, and transfers poorly across topics. | Good cautionary example: trust gates work only when privileges are narrow and earned in-context. |
| [PyPI Trusted Publishers](https://docs.pypi.org/trusted-publishers/), [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/), [RubyGems trusted publishing](https://guides.rubygems.org/trusted-publishing/) | OIDC workflow identity -> short-lived publishing token. | Reduces long-lived token risk and makes package publish provenance stronger. | Machine/workflow trust, not maintainer judgment or code quality. | Add CI/workflow provenance as a passport field, not the whole trust story. |
| [crates.io ownership](https://rustwiki.org/en/cargo/reference/publishing.html#cargo-owner) | Named owners with full power; team owners with restricted publish/yank power. | Splits package authority and reduces some maintainer compromise risk. | Named owner trust is strong and dangerous; docs explicitly warn not to grant it lightly. | Tangled should distinguish review reach, merge authority, and release authority. A vouch must not imply all three. |
| [Nostr WoT](https://github.com/nostr-wot) and [Nostr spam approach](https://nostr.org/) | Social-distance filtering and relay/client-level graph trust. | Decentralized spam filtering without one moderator. | Social distance can become opaque scoring and clique reinforcement. | Useful for "cool down" reach, but show distance/reason/evidence instead of a mystery number. |
| [Farcaster/OpenRank](https://docs.openrank.com/integrations/farcaster/ranking-strategies-on-farcaster) | Reputation graphs over follows/engagement. | Ranks high-quality profiles and content in an open social graph. | Engagement is not reviewworthiness; graph edges are ambiguous. | Do not infer code trust from social activity alone. |

## Closest Adjacent Players

### Directly Similar

1. **Tangled vouching itself** is the most important source. It already names the AI/LLM slop burden, uses vouch/denounce records on PDSes, and displays hats in issues, PRs, and comments. This is the sponsor-native primitive.
2. **mitchellh/vouch** is the nearest OSS implementation outside Tangled. It converts explicit vouches into contribution permission checks on GitHub and is framed around AI-generated low-quality contributions.
3. **Nostr WoT** is the nearest decentralized social analogue: social-distance filtering for spam/noise in a network without central authority.
4. **ATProto labelers** are the nearest protocol analogue: third-party/user-selected labels that affect reach without changing the underlying speech layer.

### Adjacent But Not Exact

1. **OpenRank / SourceCred** are algorithmic reputation graphs. They are useful for discovery and reward accounting but too score-like for the main Tangled UX.
2. **Stack Overflow / Gitcoin Passport** prove that reputation scores can scale privilege gates, but they also demonstrate why a public score changes user behavior and invites gaming.
3. **OpenSSF Scorecard / package registry trusted publishing** are excellent for risk/provenance receipts, not person-level reputation.
4. **PGP/GnuPG / Debian keyrings / Keyoxide** prove identity and trust paths, but do not solve maintainer review economics by themselves.

## Why Public Trust Scores Are Risky

1. **False precision.** A number looks objective even when it hides weight choices, trust roots, stale data, and context. OpenSSF Scorecard's own non-goals are a strong warning: useful heuristics are not definitive reports.
2. **Context collapse.** "Trusted" for docs, test fixes, auth code, release signing, and package publishing are different claims. A single person score collapses them into one dangerous blob.
3. **Goodhart and gaming.** Once the score controls reach, people optimize the score. GitHub contribution graphs, SourceCred-style contribution graphs, and package quality scores all risk behavior shaped around visible metrics.
4. **Sybil and collusion pressure.** Gitcoin-style passport systems exist because open networks produce strong incentives for fake identity farming. Gitcoin still reports that sophisticated attacks remain.
5. **Newcomer exclusion.** A global score favors incumbents and known social circles. First-time contributors need a path to earn review with evidence, not a permanent cold-start penalty.
6. **Punitive drift.** A red denounce marker can become a ban, a pile-on, or a permanent scar unless it is scoped, reasoned, evidence-linked, decayed, and supersedable.
7. **Staleness.** Maintainers move on, contributors improve, keys rotate, projects change norms. Tangled's own vouching post calls out future decay as important.
8. **Dispute workload.** Score systems create appeals, lobbying, and moderation burden. The product can accidentally move work from code review to reputation litigation.
9. **Overclaiming safety.** Identity, provenance, and vouches do not prove code correctness. They only answer whether a patch is accountable enough to review.
10. **Centralized weight power.** If one appview or algorithm decides trust, the system recreates platform authority under a decentralized skin.

## Better Alternatives: Receipts, Vouches, and Review Reach

Use **evidence bundles**, not public person scores.

Receipt fields that matter for Tangled:

- `identity`: actor DID, handle, PDS, and whether the actor is a human, org, or agent.
- `sponsor`: human/accountable owner for agent-origin work.
- `scope`: repo, file paths, subsystem, task type, and whether prior vouch applies to that scope.
- `intent`: issue, advisory, maintainer request, or project-memory reference.
- `work evidence`: prior merged PRs, prior accepted comments, review rounds, tests added, spindle result.
- `trust evidence`: vouch/denounce records with source DID, reason, and evidence AT URIs.
- `risk`: auth/security/payment/dependency touches, test deletion, release freeze, unsafe file area.
- `provenance`: signed commit, CI workflow identity, package provenance, agent attestation if available.

Policy alternatives:

- **Local trust roots:** show "trusted by Mira's circle" rather than "trusted globally."
- **Scoped vouches:** vouch for a person or agent in a repo/subsystem/task class, not for all possible actions.
- **Evidence-linked denounces:** denounce the incident/pattern with a reason and AT URI, not a vague moral mark.
- **Decay and renewal:** old vouches/denounces fade or require renewal.
- **Supersession and rebuttal:** new records can negate, supersede, or contextualize old trust records.
- **Neutral unknowns:** no vouch is missing evidence, not guilt.
- **Maintainer-controlled lanes:** `Ready to review`, `Missing receipts`, `Cool down`; no public 0-100 trust score.
- **Internal heuristics only:** the app may sort work internally, but the UI should present reasons and evidence chips.

## Tangled Semantics: Vouch/Denounce As Review Reach

Recommended semantics for the pitch and prototype:

| Signal | Meaning | Must not mean | Product action |
| --- | --- | --- | --- |
| Vouch | Someone in the maintainer's trust circle is willing to attach their name to this actor or work pattern. | Auto-merge, code correctness, universal trust, release permission. | Reduce review friction when receipts also exist. |
| Denounce | Someone in the maintainer's trust circle reports a harmful or low-evidence pattern. | Ban, shadowban, guilt, permanent punishment. | Slow review reach, request missing receipts, or route to `Cool down`. |
| No signal | Unknown trust state. | Bad actor. | Ask for identity, issue, tests, sponsor, and evidence. |
| Prior accepted work | Actor has produced useful work in a relevant context. | General competence across all repos/files. | Add an evidence chip and cite exact PR/issue AT URI. |
| Signed/provenanced work | The source of the commit/workflow is accountable. | Safe code. | Add provenance chip; still require review and tests. |

Concrete product rules:

- A vouch can move a patch from `Missing receipts` to `Ready to review` only when identity, intent, and test/provenance receipts are also present.
- A denounce can move a patch to `Cool down` only when it has a reason/evidence trail or matches a repeated low-evidence pattern.
- Unknown contributors and agents should receive a checklist: add issue link, focused test, stable identity, sponsor, and receipt links.
- Merge authority remains with maintainers, code owners, branch protection, and CI. Review reach is not release authority.
- The UI should render "why this lane" before the diff: e.g. `Vouched sponsor + linked security issue + focused spindle + prior merged fix`.

## Demo Implications

Best Epsilon-supported demo slice:

1. Mira opens the Tangled review queue for `solar-knot/payments`.
2. Two AI PRs both look plausible and both claim passing tests.
3. `@rae.bot` has a complete passport:
   - stable DID
   - human sponsor `@jules.dev`
   - Jules is vouched by Mira's circle
   - linked issue/advisory
   - focused regression test
   - spindle result
   - prior accepted work receipt
4. `@anon-fix-agent` has weak receipts:
   - no stable DID or sponsor
   - no issue link
   - deletes a test in auth/payment code
   - denounce evidence from a maintainer in Mira's circle for the same low-evidence pattern
5. The app does not punish the weak PR. It routes it to `Missing receipts` or `Cool down` and previews a Tangled comment:
   `Please resubmit with a stable agent identity, issue link, focused test, and human sponsor.`

Judge-facing line:

> Tangled does not ask maintainers to trust AI or strangers. It makes every patch earn review reach with identity, intent, tests, vouches, denounces, and protocol receipts.

## Gap Inventory

| Gap / claim | T | A | P = A - T | Read |
| --- | ---: | ---: | ---: | --- |
| Review reach with receipts is the safest trust framing | 18 | 96 | 78 | Strong. Matches Tangled vouching and ATProto speech/reach. |
| Vouch/denounce should be public score inputs | 42 | 62 | 20 | Weak. Too easy to become social scoring. Keep internal if used. |
| Denounce can be useful without punishment | 24 | 88 | 64 | Warm. Needs careful copy, evidence URI, decay/supersession. |
| Agent passports need scoped vouches and human sponsors | 24 | 94 | 70 | Strong demo wedge, especially for AI PR trust. |
| A custom trust labeler could be the product | 35 | 86 | 51 | Interesting but too broad for M01 demo unless sponsor asks for write-side labeler work. |
| OpenSSF/Scorecard-style security scores can decide review priority | 32 | 65 | 33 | Use as evidence only; not enough for social trust. |
| Global contributor reputation should be the headline | 55 | 70 | 15 | Avoid. Crowded, risky, and not Tangled-native enough compared with receipts. |

## Recommendation To Synthesis

Keep the main idea as **Tangled Review Passport / Patch Passport**, but sharpen the trust layer:

- Replace any UI phrase like `trust score` with `review reach`, `receipts`, `trusted by your circle`, or `missing evidence`.
- Make every vouch/denounce display source, reason, scope, and evidence link when available.
- Make `denounce` non-punitive in the demo: it slows attention, triggers an explanation, and asks for missing receipts.
- Treat no-vouch contributors as neutral. The product should help them earn review, not shame them.
- Use Tangled's official vouching language in sponsor discussion: it exists to inform decisions at the point of interaction under LLM-slop pressure.
- Use ATProto's speech/reach model as the philosophical foundation: code submission stays possible; review reach is filtered by maintainer-chosen evidence.

## Sources

- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- mitchellh/vouch: https://github.com/mitchellh/vouch/
- mitchellh/vouch FAQ: https://github.com/mitchellh/vouch/blob/main/FAQ.md
- GitHub commit signature verification: https://docs.github.com/en/authentication/managing-commit-signature-verification
- GitHub CODEOWNERS: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- GitHub branch protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- GitHub profile contributions: https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile
- OpenSSF Scorecard: https://github.com/ossf/scorecard
- CHAOSS starter project health metrics: https://chaoss.community/kb/metrics-model-starter-project-health/
- OpenDigger: https://open-digger.cn/en/docs/user-docs/intro
- OpenRank GitHub rankings: https://docs.openrank.com/integrations/github-developers-and-repo-ranking
- GnuPG web of trust: https://www.gnupg.org/gph/en/manual/x547.html
- Debian keyring: https://keyring.debian.org/
- Keyoxide docs: https://docs.keyoxide.org/wiki/keyoxide/
- Bluesky labels and moderation: https://docs.bsky.app/docs/advanced-guides/moderation
- AT Protocol labels: https://atproto.com/specs/label
- AT Protocol overview and speech/reach model: https://docs.bsky.app/docs/advanced-guides/atproto
- SourceCred cred docs: https://sourcecred.io/docs/beta/cred/
- Human Passport: https://passport.human.tech/
- Gitcoin sybil resistance research: https://gitcoin.co/research/quadratic-funding-sybil-resistance
- Stack Overflow privileges: https://stackoverflow.com/help/privileges
- PyPI Trusted Publishers: https://docs.pypi.org/trusted-publishers/
- npm trusted publishing: https://docs.npmjs.com/trusted-publishers/
- RubyGems trusted publishing: https://guides.rubygems.org/trusted-publishing/
- crates.io ownership: https://rustwiki.org/en/cargo/reference/publishing.html#cargo-owner
- Nostr WoT: https://github.com/nostr-wot
- Nostr protocol spam notes: https://nostr.org/
- Farcaster OpenRank strategies: https://docs.openrank.com/integrations/farcaster/ranking-strategies-on-farcaster
