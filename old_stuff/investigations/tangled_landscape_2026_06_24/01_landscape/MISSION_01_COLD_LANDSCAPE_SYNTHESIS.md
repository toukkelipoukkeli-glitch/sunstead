# Mission 01 Cold Landscape Synthesis

> **Status:** COLD LANDSCAPE ONLY
> **Date:** 2026-06-24
> **Scope:** Adjacent companies, startups, OSS projects, standards, and concepts around Tangled, AT Protocol, autonomous PR agents, code review automation, trust, provenance, decentralized forges, maintainer overload, security recall, and project memory.
> **Non-goal:** This file does not choose the best hackathon idea. It records the cold landscape findings only.

Navigator position: emerging-to-cold on the landscape. The territory is now mapped well enough to avoid obvious duplicates. Idea selection remains intentionally deferred.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a Tangled sponsor need.
- Judging/submission mode from local notes: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Challenge center: build an integration with Tangled over AT Protocol that enhances open-source collaboration, ideally leaning into AT Protocol primitives and optionally agentic code review or agent-created PRs.
- Known unknowns still open: exact submission constraints, required APIs, live write preference, custom lexicon preference, presenter, and seeded-data acceptability.

## Cold Finding 1: Generic AI PR Review Is Crowded

Source file: `AGENT_ALPHA_AI_REVIEW_COMPANIES.md`.

The commercial market already covers automated PR review, codebase-aware review, multi-agent review, custom rules, summaries, autofix, test generation, policy gates, and security/code-quality findings.

Direct or close players:

- CodeRabbit: AI PR reviews, planning, Slack-to-PR workflows, IDE/CLI feedback, one-click fixes.
- Greptile: AI code reviewer with code graph context, multi-agent review, tests, coding-agent loops.
- Qodo / PR-Agent: multi-agent PR review, review standards, PR history/context, open-source PR-Agent.
- GitHub Copilot Code Review: native PR review, full project context, custom instructions, MCP/skills/memory, suggested fixes.
- GitLab Duo Code Review: agentic/non-agentic MR review and custom instructions.
- Cursor Bugbot: GitHub PR review and fix path through Cursor Background Agent.
- Claude Code Review and GitHub Actions: specialized agents over GitHub PRs; can implement fixes through actions.
- Amazon Q Developer for GitHub: development agent creates PRs; review agent reviews PRs and suggests fixes.
- Gemini Code Assist: GitHub PR summaries/reviews and comment-triggered help.
- Graphite/Diamond, Bito, Ellipsis, CodeAnt, cubic, Korbit, Sourcery, Codacy, DeepSource, Sonar, Snyk, CodeScene, HackerOne Code/PullRequest, Sentry Seer, Sourcegraph/Amp, Aikido, Kodus.

Cold claim:

> "AI comments on pull requests" is no longer novel. A Tangled submission that is mainly an AI review bot will be compared to mature GitHub/GitLab-native products.

Important distinction:

- These tools mostly review code or enforce private org/repo rules.
- They generally do not expose a public protocol evidence chain with DIDs, AT URIs, Tangled vouch/denounce records, repo DID/knot context, and spindle evidence.

## Cold Finding 2: Autonomous PR Creation Is Also Crowded

Source file: `AGENT_BETA_AUTONOMOUS_PR_AGENTS.md`.

"Issue or ticket goes in, branch and PR come out" is now a live category.

Direct or close players:

- GitHub Copilot coding agent / Agent HQ: assign issues/prompts; cloud agent opens draft PRs and responds to comments.
- OpenAI Codex cloud / GitHub integration: repo-connected cloud coding tasks, PRs, issue/PR mentions, code review.
- Google Jules: asynchronous GitHub coding agent that plans, edits, and opens PRs.
- Cognition Devin: async software engineer that can produce PRs from Slack/API workflows.
- Codegen: ticket/Slack/API to PR, comment responses, CI-failure fixes.
- Factory Droids: prompt-to-PR, review/fix workflows.
- Amazon Q Developer: GitHub issue-to-PR development agent plus review agent.
- Claude Code GitHub Actions: issue/PR comments or assignments trigger implementation/fix PRs.
- Cursor Cloud / Background Agents and Graphite Agents powered by Cursor.
- OpenHands, LangChain Open SWE, Sweep, Goose, SWE-agent, aider, Cline, Roo Code, OpenCode, Pythagora/GPT Pilot.

Cold claim:

> "An agent opens PRs" is not by itself differentiating. It is now a known product and OSS pattern.

Common accountability model in existing systems:

- bot or app identity;
- task request in GitHub/Slack/Jira/Linear;
- branch/PR timeline;
- logs or session traces;
- CI status;
- human final merge authority.

Gap observed across the landscape:

- portable agent identity across forges/clients;
- explicit human sponsor or delegation record;
- standard scope/authority record;
- reviewability receipt separate from the PR body;
- social evidence such as vouches, denounces, and prior accepted work as public records.

## Cold Finding 3: OSS Review Automation Already Owns The Mechanical Layer

Source file: `AGENT_GAMMA_OSS_REVIEW_AUTOMATION.md`.

The open-source ecosystem already has event bots, labelers, reviewer assignment, policy checks, inline tool comments, stale/no-response automation, dependency bots, release bots, merge queues, and triage dashboards.

Representative projects and features:

- Probot, GitHub Actions, GitHub webhooks, Forgejo Actions.
- Stale/no-response bots: `probot/stale`, `actions/stale`, `probot/no-response`.
- Policy-as-code and workflow routing: Reviewpad, Palantir `policy-bot`, Parity `review-bot`, Phabricator Herald.
- Inline automated review: Danger, reviewdog, CI comments/checks.
- CODEOWNERS and reviewer assignment: GitHub CODEOWNERS, GitLab Code Owners, Reviewpad reviewer assignment, team auto-assignment.
- Issue/PR routing: `actions/labeler`, Triage Party, Rust triagebot, project queue bots.
- Merge queues: Bors, Homu, Prow/Tide, GitHub Merge Queue, GitLab Merge Trains, Mergify, Zuul.
- Dependency and release bots: Renovate, Dependabot, `create-pull-request`, Release Drafter, semantic-release, release-please, Changesets.

Cold claim:

> Do not present labels, reviewer assignment, stale cleanup, release PRs, dependency PRs, or merge queues as the core novelty. Those are mature forge automation surfaces.

Useful cold distinction:

- Merge queues answer: "Can this already-reviewed change land safely?"
- Review intake answers: "Does this incoming change deserve maintainer attention at all?"

## Cold Finding 4: Provenance Standards Provide The Receipt Grammar

Source file: `AGENT_DELTA_PROVENANCE_PASSPORTS.md`.

The software supply-chain world has mature language and tooling for attestations, provenance, SBOMs, transparency logs, exploitability statements, and policy checks.

Important standards/projects:

- SLSA: supply-chain levels and provenance; v1.2 includes a Source Track around source authoring/review controls.
- in-toto: attestation framework for verifiable statements about software production.
- Sigstore: cosign, Fulcio, Rekor for signing, keyless identity, transparency logging.
- GitHub Artifact Attestations: signed build artifact claims using Sigstore.
- SPDX and CycloneDX: SBOM and related BOM standards, including AI/ML profiles.
- GUAC, Archivista, Chainloop, Tekton Chains, Witness: graph/evidence/attestation storage and pipeline provenance.
- OpenVEX: machine-readable vulnerability exploitability/impact statements.
- OpenSSF Scorecard: automated security health checks.
- Registry provenance: npm trusted publishing/provenance, PyPI Trusted Publishing/attestations, Homebrew provenance, JSR provenance.

Cold claim:

> Supply-chain provenance mostly answers artifact/build questions after software is produced: source, builder, workflow, dependency set, signature, and policy. It does not by itself answer whether an incoming patch deserves maintainer review attention.

Useful cold analogy:

- Artifact provenance: "Was this artifact built from the expected source by the expected workflow?"
- Review provenance: "Who/what produced this patch, why, under whose authority, with what tests, what trust context, and what source records?"

Boundary:

- Real SLSA/Sigstore/in-toto/SBOM compliance is too heavy for the hackathon path unless specifically requested.
- The transferable asset is the receipt pattern: subject, issuer, claim, evidence, verifier, policy.

## Cold Finding 5: Trust Systems Are Useful But Public Scores Are Dangerous

Source file: `AGENT_EPSILON_TRUST_REPUTATION.md`.

Trust/reputation systems exist across OSS, identity, decentralized networks, package registries, and communities.

Relevant systems:

- Tangled vouching: public PDS vouch/denounce records, reasons, trust-circle attenuation, hats in issues/PRs/comments, no hard denounce consequence in current design.
- `mitchellh/vouch`: OSS vouch/denounce GitHub Actions for allowing/closing issues and PRs.
- ATProto/Bluesky labelers: composable labels that affect reach without deleting underlying records.
- GitHub verified commits, CODEOWNERS, branch protection, profile contribution signals.
- OpenSSF Scorecard, CHAOSS metrics, OpenDigger/OpenRank.
- GnuPG Web of Trust, Debian keyring, Keyoxide.
- SourceCred, Human Passport/Gitcoin Passport, Stack Overflow reputation.
- PyPI/npm/RubyGems trusted publishing, crates.io ownership.
- Nostr WoT and Farcaster/OpenRank.

Cold claim:

> Public universal trust scores collapse context, invite gaming, exclude newcomers, create dispute workload, and can drift into punishment. The safer primitive is scoped evidence attached to a specific interaction.

Useful trust distinctions:

- A vouch is not code correctness.
- A denounce is not a ban.
- No vouch is not guilt.
- Commit signature or DID is identity/provenance evidence, not reviewworthiness.
- Review reach, merge authority, and release authority are separate permissions.

## Cold Finding 6: Decentralized/Federated Forge Prior Art Is Broad

Source file: `AGENT_ZETA_DECENTRALIZED_FORGES.md`.

Many systems already address decentralized code hosting, federated forge interaction, or durable collaboration metadata.

Major families:

- Federated web forges: ForgeFed, Forgejo/Gitea federation, GitLab ActivityPub plans, F3 Friendly Forge Format.
- Peer-to-peer sovereign forges: Radicle, Secure Scuttlebutt/git-ssb, Vervis/Anvil.
- Email/protocol-native workflows: SourceHut, public-inbox, Patchwork, `git-send-email`.
- Collaboration state stored with code: Fossil, Gerrit NoteDb, git-appraise, git-bug.
- VCS context: Darcs, Pijul, Jujutsu.

Cold claim:

> "Decentralized GitHub" or "federated PRs" is not a fresh enough headline. ForgeFed/Forgejo/Radicle/SourceHut/Fossil/Gerrit NoteDb already occupy large parts of that landscape.

Important comparison:

- ForgeFed/Forgejo focus on cross-instance forge interaction.
- Radicle focuses on sovereign/P2P Git-backed collaboration objects.
- SourceHut/email proves protocol-native open-source collaboration can work at serious scale.
- Fossil/Gerrit NoteDb/git-bug/git-appraise prove issues/reviews can be durable objects outside a proprietary forge database.
- Tangled's distinct substrate is AT Protocol records around Git: handles/DIDs, PDS records, appviews, firehose/sync, lexicons, vouching, and repo DIDs/knots.

## Cold Finding 7: Tangled/ATProto Primitives Are Real Enough To Anchor The Demo

Source file: `AGENT_ETA_ATPROTO_TANGLED_NATIVE.md`.

Official Tangled and AT Protocol sources support a concrete primitive map.

Cold Tangled/ATProto facts:

- Tangled is Git collaboration built on AT Protocol, with code on knots and collaboration/social state in AT records/appviews.
- Knots are self-hostable Git servers.
- The appview aggregates network activity across knots.
- Users log in with AT accounts/PDSes.
- AT Protocol gives DIDs, handles, public signed data repositories, typed records, Lexicon schemas, XRPC, AT URIs, sync/firehose mechanics, relays, and appviews.
- AT URIs address records by DID or handle; DID-based URIs are more durable.
- AT URIs are not content-addressed by themselves; do not overclaim immutability without CID/strongRef.
- Tangled vouch/denounce records are public PDS records with reasons and circle-scoped display.
- Tangled vouching was explicitly motivated in part by LLM-generated submissions that can look plausible but be subtly wrong.
- Vouch hats appear in issues, PRs, and comments.
- `sh.tangled.repo.pull` records are ingested through the firehose, and agents can create PRs by writing records to a PDS.
- Public Tangled source confirms lexicons including repo, pull, issue, feed comments, graph vouch, git ref updates, pipelines/status, knots, spindles, labels, collaborators, and repo DID fields.
- Spindle workflows can trigger on pull request updates, so CI can be part of review evidence.

First-minute visible primitives with high confidence:

- actor handle plus DID;
- repo DID plus knot;
- `sh.tangled.repo.pull` AT URI;
- linked issue/comment record;
- `sh.tangled.graph.vouch` or denounce evidence;
- spindle/pipeline status;
- seeded/live path: PDS records -> firehose/appview -> XRPC/PDS write.

Warm/uncertain implementation points:

- exact live appview query APIs;
- exact write-side auth and Tangled-specific record write path;
- sponsor preference for custom `app.sunstead.*` records;
- vouch graph query semantics for "my circle";
- public availability and granularity of spindle logs/status records.

## Cold Finding 8: Maintainer Pain Is Review Reach Under Cheap-Generation Pressure

Source file: `AGENT_THETA_MAINTAINER_PAIN.md`.

The maintainer-pain evidence is now strong enough to ground the problem.

Cold evidence:

- GitHub's June 2026 PR limits post says monthly merged PR volume grew from about 25 million in January 2023 to more than 90 million by mid-2026, and frames the issue as creation cost outrunning human review cost.
- GitHub's PR limits include PRs opened by Copilot or other AI agents and support trusted-contributor bypasses without granting write access.
- Tangled's vouching post independently names LLM-generated low-quality/subtly wrong submissions as a maintainer burden.
- Tidelift's 2024 maintainer report says 60% of surveyed maintainers are unpaid hobbyists, 48% had used AI coding tools, 64% were less willing to review known AI-generated contributions, and 45% might review them depending on factors such as contributor or LLM reputation.
- Tidelift also reports maintainers became less trusting of unknown contributors after xz while few had formal standards for vetting contributors.
- Seth Larson and Daniel Stenberg/curl describe low-quality AI-assisted security reports as costly because they can appear legitimate and require human refutation.
- LLVM and Ghostty policies converge on accountable human-in-the-loop AI contributions, disclosure, self-review, and not shifting work onto maintainers.
- Code review research has long treated review as social/project judgment, knowledge transfer, and design discussion, not just defect detection.

Cold claim:

> AI made patches cheap, but did not make trust, review, or accountability cheap.

Related cold claim:

> The problem is not "AI exists." The problem is ownerless, context-free, low-evidence work consuming scarce maintainer attention.

## Cold Finding 9: Security Recall/Advisory Infrastructure Is Mature

Source file: `AGENT_IOTA_SECURITY_RECALL_NETWORKS.md`.

The security/advisory ecosystem already has many strong systems.

Major systems:

- GitHub Repository Security Advisories and private vulnerability reporting.
- GitHub Advisory Database and OSV.dev / OSV schema.
- Dependabot alerts/security updates, Renovate, Snyk fix PRs, Sonatype, OSV-Scanner guided remediation, pip-audit, npm audit, OWASP Dependency-Check.
- OpenVEX and VEX-style affected/not-affected/fixed statements.
- CISA KEV, EPSS, OpenSSF Scorecard, OpenSSF Allstar.
- OpenSSF Vulnerability Disclosures group, OSS-SIRT, Autofix SIG.
- CERT/CC VINCE.
- Patchstack, Dependency-Track, GUAC, malicious-package analysis projects.

Cold claim:

> A standalone "security recall network" competes with mature advisory, scanner, dependency-remediation, and vulnerability-coordination ecosystems.

Cold last-mile gap:

> Existing systems often answer "is this package/version vulnerable?" or "can a dependency bump be opened?" They less often answer "how does a maintainer receive a targeted, trusted, non-spammy, reviewable action in their code-collaboration workflow?"

Useful imported semantics:

- `affected`
- `not affected`
- `fixed`
- `under investigation`
- evidence-backed targeted action
- reporter/campaign identity
- opt-out or mark-safe path

## Cold Finding 10: Project Memory Is Real, But "Case Law" Is A Risky Public Frame

Source file: `AGENT_KAPPA_WEIRD_CONCEPTS.md`.

Project memory, precedent, and reviewability have strong analogues.

Relevant concepts and systems:

- ADRs: ADR community, MADR, `adr-tools`, Log4brains, AWS ADR guidance, Martin Fowler ADR note.
- Formal proposals: IETF RFCs, Rust RFCs, Python PEPs, Kubernetes KEPs.
- Policy-as-code: OPA, Conftest, Allstar, CUE.
- Credentials: Open Badges, W3C Verifiable Credentials, DCO, CLA Assistant.
- Patch attestations: Git trailers, Linux `Signed-off-by`, `Reviewed-by`, `Tested-by`, `Acked-by`, `Fixes`, GitHub verified commits.
- Project knowledge tools: Unblocked, Swimm, Stack Overflow Teams, Mintlify, Backstage TechDocs, Sourcegraph context.
- Moderation and precedent: Wikipedia ArbCom, Stack Exchange moderation policy disputes, ATProto moderation labels.

Cold claim:

> Durable decision memory is a real need, but a primary "case law" metaphor risks sounding legalistic, bureaucratic, or governance-heavy.

Useful distinction:

- "Project Memory" and "Precedent" are safer public terms.
- "Case Law" is useful as an internal design metaphor.

Strongest conceptual precedent:

> Linux patch tags are already lightweight review receipts. Tangled can make comparable receipts protocol-addressed, queryable, source-linked, and visible at PR intake.

## Landscape Map By Category

| Category | Cold status | Representative players | Already solved | Remaining open space |
| --- | --- | --- | --- | --- |
| Commercial AI PR review | Saturated | CodeRabbit, Greptile, Qodo, Copilot, GitLab Duo, Cursor, Claude, Amazon Q, Gemini, DeepSource, Sonar, Snyk | PR comments, summaries, context, custom rules, autofix | Public, portable collaboration evidence around review attention |
| Autonomous PR agents | Crowded | Copilot agent, Codex, Jules, Devin, Codegen, Factory, OpenHands, Open SWE, Sweep, Goose | issue/ticket-to-PR, CI fixes, review comment responses | portable agent identity, sponsor/delegation, social trust, protocol receipts |
| OSS review automation | Mature | Probot, Actions, Reviewpad, Danger, reviewdog, CODEOWNERS, Prow/Tide, Bors, Renovate, Dependabot | event automation, labels, owners, policy checks, merge queues | source-linked evidence of reviewability before review |
| Supply-chain provenance | Mature but adjacent | SLSA, in-toto, Sigstore, Rekor, SBOMs, GUAC, OpenVEX, Scorecard | artifact/build/dependency provenance | pre-review collaboration provenance |
| Trust/reputation | Useful but risky | Tangled vouching, mitchellh/vouch, ATProto labels, PGP WoT, SourceCred, Human Passport, Stack Overflow | identity/trust signals, labels, privilege models | scoped, evidence-linked review reach without global scores |
| Decentralized forges | Broad prior art | ForgeFed, Forgejo, Radicle, SourceHut, Fossil, Gerrit NoteDb, git-bug | federation/P2P/state-with-repo/code collaboration | ATProto social records applied to maintainer attention |
| Tangled/ATProto primitives | Sufficient for demo framing | DIDs, PDS records, AT URIs, lexicons, XRPC, appviews, firehose, vouching, repo DIDs, spindles | record substrate and event model | exact live write/read ergonomics, sponsor schema preference |
| Maintainer pain | Strongly validated | GitHub PR limits, Tidelift, LLVM/Ghostty policies, security slop reports | clear problem evidence | careful non-punitive product framing |
| Security recall | Mature adjacent ecosystem | GHSA, OSV, Dependabot, Renovate, Snyk, OpenVEX, OSS-SIRT | advisories, alerts, scanners, fix PRs | targeted trusted maintainer actions with protocol evidence |
| Project memory | Strong conceptual analogues | ADRs, RFCs, PEPs, KEPs, Git trailers, DCO, Open Badges | decision records and attestations | surfacing relevant memory at PR intake without heavy governance |

## Cold Boundaries / Dead Ends

These are cold enough to avoid unless sponsor feedback explicitly reverses them:

1. Generic AI code review bot.
2. Generic autonomous PR generator.
3. GitHub/GitLab-style labels, stale bots, reviewer assignment, or merge queue.
4. "Decentralized GitHub" as a headline.
5. Full security advisory database or dependency-remediation clone.
6. Universal contributor or agent trust score.
7. AI-generated-code detector as the core claim.
8. Auto-block, auto-ban, auto-merge, or punitive denounce behavior.
9. Real SLSA/Sigstore/SBOM implementation as the hackathon core.
10. Public "case law court" framing as the first pitch.

## Warm Claims To Preserve For Later Idea Selection

These are not idea decisions, but they are the warm areas the landscape leaves open:

| Warm claim | Current T | What would cool it |
| --- | ---: | --- |
| A Tangled integration should center protocol evidence rather than model confidence. | 18 | Sponsor confirms this is what "lean into AT Protocol primitives" means. |
| Review reach is the safer framing for vouch/denounce than trust score or moderation. | 18 | Sponsor agrees vouches should affect attention, not punishment. |
| Existing `sh.tangled.*` records are enough for a seeded proof without custom lexicons. | 22 | Tangled mentor confirms record availability and preferred read path. |
| A custom receipt/attestation record could be a strong optional write-side beat. | 34 | Sponsor explicitly asks for custom lexicons or live writes. |
| Project memory should be a field, not primary headline. | 20 | Presenter/sponsor reacts better to Project Memory than agent PR intake. |
| Security recall is probably a mode, not the main idea. | 24 | Sponsor says cross-repo network coordination matters more than one-repo maintainer flow. |

## Source Files

- `AGENT_ALPHA_AI_REVIEW_COMPANIES.md`
- `AGENT_BETA_AUTONOMOUS_PR_AGENTS.md`
- `AGENT_GAMMA_OSS_REVIEW_AUTOMATION.md`
- `AGENT_DELTA_PROVENANCE_PASSPORTS.md`
- `AGENT_EPSILON_TRUST_REPUTATION.md`
- `AGENT_ZETA_DECENTRALIZED_FORGES.md`
- `AGENT_ETA_ATPROTO_TANGLED_NATIVE.md`
- `AGENT_THETA_MAINTAINER_PAIN.md`
- `AGENT_IOTA_SECURITY_RECALL_NETWORKS.md`
- `AGENT_KAPPA_WEIRD_CONCEPTS.md`

## To The Next Mission

COLD:

- Commercial AI PR review and autonomous PR generation are crowded.
- OSS PR automation and merge/dependency/release tooling are mature.
- Supply-chain provenance gives a receipt vocabulary but is not itself the maintainer-review product.
- Trust systems are useful only when scoped, evidence-linked, and non-punitive.
- Decentralized/federated forges are a broad existing category; Tangled's differentiator must be ATProto collaboration evidence, not generic federation.
- Tangled has enough concrete primitives to show DIDs, AT URIs, vouch records, pull/issue/comment records, repo DID/knot, appview/firehose path, and spindle evidence.
- Maintainer overload under cheap AI generation is a real, well-evidenced pain.
- Security recall and project memory are strong adjacent modes, but have mature prior art and/or framing risks.

WARM:

- Which specific product wrapper should be chosen.
- Whether to include a live write or record preview.
- Whether to use custom `app.sunstead.*` lexicons.
- Whether sponsor prefers agent-created PRs, agent review, maintainer intake, cross-repo security action, or project memory.

BOTTLENECK:

- Sponsor-facing product selection remains open by request. The next step should be a separate idea-selection synthesis using this cold landscape, not further broad research.
