# Agent Gamma: OSS Review Automation Landscape

Date: 2026-06-24
Mission: 01 Tangled landscape
Agent: gamma
Scope: open-source and prior-art bots/projects around PR triage, review automation, stale management, code ownership, maintainer queues, issue routing, review assignment, release bots, merge queues, and GitHub/GitLab app patterns.

Navigator position: emerging and aligned, approaching cold on "generic forge automation is solved"; still warm on exact Tangled-native product shape.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow implied by this landscape: maintainer sees whether an AI or human PR has enough protocol evidence to deserve review.
- Intentionally cut from Gamma's recommendation: generic AI code review, basic label automation, stale closure, dependency update PRs, release-note generation, normal CODEOWNERS routing, and pure merge queue mechanics.

## Executive Read

The OSS ecosystem has already solved most mechanical maintainer automation:

- listen to forge events and run scripts;
- label issues and PRs;
- request reviewers from CODEOWNERS or path rules;
- post lint/test findings as PR comments;
- enforce approval policies;
- close stale or no-response items;
- open dependency and release PRs;
- batch, retest, and merge green PRs safely;
- show dashboards for large-project triage.

The crowded territory is not "make a bot respond to pull requests." Probot, GitHub Actions, Reviewpad, Danger, reviewdog, Renovate, Dependabot, Prow/Tide, Bors/Homu, Zuul, GitHub merge queue, GitLab merge trains, and many project-specific triage bots already cover that.

The unsolved wedge for Tangled is a **reviewability evidence queue**:

> Before review, show whether a patch carries identity, intent, tests, trust, ownership, project memory, and source-linked records sufficient to deserve maintainer attention.

That is not a normal merge queue. Merge queues answer "can this already-approved change land safely?" A Tangled evidence queue answers "is this incoming change accountable enough to spend review time on?"

## Strongest Gamma Conclusion

Build on existing automation ideas, but do not compete with them.

The Gamma recommendation is:

> Tangled Review/Patch Passport should treat existing bot outputs as evidence chips, not as the product.

Examples:

- CODEOWNERS or Reviewpad output becomes an `ownership` chip.
- Spindle/GitHub Actions/reviewdog output becomes a `test and lint evidence` chip.
- Renovate/Dependabot-like generated PRs become `bot-originated patch` examples.
- Rust triagebot/Triage Party patterns become `queue state` inspiration.
- Mergify/Bors/Prow/GitHub Merge Queue become `merge readiness` downstream, after reviewability.

The product surface Tangled can own is the portable record graph behind the decision: AT URI links to pull, issue, comment, vouch/denounce, spindle, repo DID, agent DID, and optional receipt records.

T/A/P:

| Claim | T | A | P | Evidence that would cool it |
| --- | ---: | ---: | ---: | --- |
| Generic forge PR automation is already solved. | 10 | 80 | 70 | No further cooling needed; source landscape is broad. |
| A pure GitHub-style bot would be low-scoring for Tangled. | 18 | 90 | 72 | Sponsor says GitHub-compatible workflow automation alone is enough. |
| Reviewability receipt/evidence queue is the Tangled-native gap. | 24 | 96 | 72 | Sponsor confirms custom or derived evidence records are welcome; demo shows four protocol primitives in first minute. |
| "Evidence queue" is not a mature PR automation category yet. | 28 | 84 | 56 | Find a popular forge-native project that already bundles identity, intent, tests, trust, and source records as review reach. |

## Prior-Art Map

### 1. Event frameworks and bot substrates

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| Probot | https://github.com/probot/probot and https://probot.github.io/ | Framework for GitHub Apps that listen to repository/org webhooks and perform actions. | GitHub App installation, GitHub identity, GitHub event model, repo-scoped app state. | Tangled equivalent should be firehose/appview-native: consume pull/issue/comment/vouch/spindle records without per-repo app install as the main story. |
| GitHub Actions | https://docs.github.com/en/actions | Repository-native automation for CI/CD and arbitrary workflow scripts. | YAML automation lives inside one forge/repo and outputs checks/comments, not portable collaboration records. | Spindles can be evidence inside a passport, not the whole product. |
| GitHub webhooks/events | https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows | Standard trigger matrix for PRs, issues, pushes, labels, merge groups. | Event transport is not itself a durable, user-owned evidence graph. | ATProto records can make the event object itself addressable and source-linked. |
| Forgejo Actions | https://forgejo.org/docs/latest/user/actions/overview/ | GitHub-Actions-like workflows for Forgejo/Codeberg-style forges. | Mostly compatibility-style CI automation, not a cross-forge social evidence layer. | Tangled should not sell "we have Actions"; sell protocol records around review decisions. |

Source notes:

- Probot describes itself as a framework for building GitHub Apps that listen to webhook events.
- GitHub Actions automates repository workflows and can combine community actions.
- Forgejo Actions intentionally feels familiar to GitHub Actions users, which supports the thesis that basic workflow automation is now commodity forge functionality.

### 2. Probot ecosystem and classic maintainer bots

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| probot/stale | https://github.com/probot/stale | Marks inactive issues/PRs stale and optionally closes them. | Time-based inactivity can be socially blunt; it does not ask whether the missing thing is intent, tests, owner, or evidence. | Tangled can replace "stale" with "missing receipts" and request specific evidence records. |
| actions/stale | https://github.com/actions/stale and https://docs.github.com/actions/managing-issues-and-pull-requests/closing-inactive-issues | GitHub Action version of stale marking/closure. | Same limitation; activity timestamp is a weak proxy for maintainer value. | Use inactivity only as one evidence chip. |
| probot/no-response | https://github.com/probot/no-response | Closes issues when the author does not answer maintainer requests. | Tracks response state, not reviewability or trust. | Tangled could create a missing-context comment with AT URI evidence requirements. |
| repository-settings/app | https://github.com/repository-settings/app | Settings-as-code for GitHub repository settings and branch protection. | Automates repo config, not PR evidence. | Tangled can keep policy records portable rather than hidden in forge settings. |
| Probot Apps directory | https://probot.github.io/apps/ | Marketplace of small GitHub workflow bots: stale, no-response, PR triage, release drafter, issue assigner, etc. | Shows the space is saturated with small automations. | Avoid building a grab-bag bot. Pick one memorable protocol-native flow. |

What is already solved:

- Run a bot when an issue/PR changes.
- Apply labels based on time, title/body, files, or status.
- Close no-response items.
- Synchronize repository settings from YAML.

What is not solved:

- Explain why a patch has earned review reach with source-linked, portable evidence.

### 3. Policy-as-code and PR workflow automation

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| Reviewpad | https://docs.reviewpad.com/ | GitHub App that reacts to PR/issue events from `reviewpad.yml`; policy-as-code for labels, reviewers, checks, warnings, and PR attention. | Very close on rules and "PRs that need attention," but still GitHub-app/YAML/central-forge oriented. | Tangled must make the proof source visible: DIDs, vouches, AT URIs, repo DID, spindle status. |
| Reviewpad built-ins | https://docs.reviewpad.com/guides/built-ins/ | Assigns relevant/available reviewers using code ownership information and supports many PR actions. | Reviewer assignment is solved; it is not a trust/evidence passport. | Use ownership/reviewer match as one passport field. |
| Palantir policy-bot | https://github.com/palantir/policy-bot | GitHub App enforcing complex approval policies via required status checks. | Excellent for governance gates after PR exists; not a contributor-facing evidence intake layer. | Tangled can preview evidence requirements without creating a hard global gate. |
| paritytech/review-bot | https://github.com/paritytech/review-bot | CODEOWNERS-derived review rules, including distinct reviewers across teams. | Strong approval policy handling, not portable trust or project memory. | Tangled can show "who owns this code" plus "who vouches for this agent/contributor." |
| Phabricator Herald | https://www.phacility.com/phabricator/herald/ | Rule engine for mandatory reviewers, audit triggers, blockers, and notifications. | Old but important prior art: policy routing is mature. | Tangled should avoid claiming rule-based reviewer routing as novel. |

Threat level:

- Reviewpad is the closest "policy-driven PR attention" prior art in Gamma scope.
- If Tangled Review Passport becomes only "reviewpad.yml but on Tangled," it is not differentiated.

Differentiator to emphasize:

- Reviewpad evaluates forge-local PR facts. Tangled can evaluate a network record graph: actor DID, human sponsor, vouches/denounces, pull/issue/comment AT URIs, repo DID/knot, and spindle result.

### 4. Inline automated review and CI comment bots

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| Danger | https://danger.systems/js/ and https://github.com/danger/danger | CI-time scripted review chores; posts PR messages based on team rules. | Excellent for rote PR feedback, but it is a CI comment layer. | Do not build "Danger with AI." Use Danger-style checks as evidence inside a passport. |
| reviewdog | https://github.com/reviewdog/reviewdog | Converts linter outputs into inline review comments on code hosting services. | Solves automated findings, not maintainer trust or review reach. | Spindle/reviewdog-like findings can become `evidence.tests` or `evidence.lint`. |
| GitHub Checks / Actions comments | https://docs.github.com/en/actions | Status checks and comments from workflow runs. | Checks prove a command ran, not whether intent, identity, and trust are sufficient. | Tangled can link check/spindle status to protocol records and show the evidence chain. |
| Mozilla code-review bots / Phabricator Harbormaster pattern | https://github.com/mozilla/code-review/blob/master/docs/phabricator.md | External tools analyze diffs and report pass/fail into review. | Mature "analysis result reports back to review" pattern. | The novelty must be social/protocol evidence, not the existence of automated analysis. |

Already solved:

- Convert tool output into review comments.
- Codify lightweight norms.
- Fail or warn on missing changelog/tests/large diffs.

Gamma cut:

- Do not present a generic AI code review bot. Judges and sponsor will compare it to Danger, reviewdog, Copilot Code Review, CodeRabbit, PR-Agent, and many tutorials.

### 5. CODEOWNERS, reviewer assignment, and ownership routing

| Project / feature | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| GitHub CODEOWNERS | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners | Automatically requests owners when PRs modify owned files; can require owner approval through branch protection. | Ownership is path/team based and forge/org scoped. It does not encode trust, contribution history, or agent scope. | Tangled can combine owner routing with actor/vouch/project-memory evidence. |
| GitHub team code review auto assignment | https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team | Replaces team review requests with individual reviewers by round-robin or load-balancing. | Assignment optimization, not reviewability. | Keep reviewer assignment out of first demo unless it directly supports a passport field. |
| GitLab Code Owners | https://docs.gitlab.com/user/project/codeowners/ | Code owner approvals in protected branch workflows. | Same pattern as GitHub: repo-scoped policy file and branch protections. | Tangled can make ownership/community trust portable across knots. |
| Auto Request Review action | https://github.com/marketplace/actions/auto-request-review | Requests reviewers based on changed files/groups. | Small utility action; reinforces that reviewer request automation is commodity. | Treat as solved commodity. |
| Reviewpad code-author reviewer assignment | https://docs.reviewpad.com/guides/built-ins/ | Assigns reviewers based on ownership/relevancy. | Close to advanced CODEOWNERS automation, still GitHub-bound. | Use as contrast: Tangled adds record-linked trust and agent identity. |

Already solved:

- Who should be notified?
- Which team owns this path?
- How many reviewers should be assigned?
- Is owner approval required?

Not solved:

- Why should the owner spend scarce review time now?
- Is the author/agent accountable?
- What source records back the PR's intent and test claims?

### 6. Issue routing, labeling, and triage dashboards

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| actions/labeler | https://github.com/marketplace/actions/labeler | Labels PRs based on changed paths or branch names. | File/path labeling is a solved primitive. | Use labels as evidence, not the main product. |
| actions/first-interaction | https://github.com/actions/first-interaction | Comments on first-time contributor issues/PRs. | Welcoming is useful but not a trust/evidence layer. | Tangled could make first-time status visible alongside vouches and receipt completeness. |
| actions/add-to-project | https://github.com/actions/add-to-project | Adds issues/PRs to GitHub Projects based on filters. | Moves work items into a board, but the board remains forge-local. | Tangled queue can aggregate records across knots/users. |
| Issue Labeler / AI labeler apps | https://github.com/marketplace/issue-label-bot and https://github.com/marketplace/coder-labeler | ML/rule-based label suggestions for issues. | Labeling is not enough for judge-visible novelty. | If used, make it an invisible helper behind evidence lanes. |
| Triage Party | https://github.com/google/triage-party | Stateless web app for large-scale GitHub issue/PR triage, using the GitHub API. | Very close to "maintainer queue," but tied to GitHub API objects and human triage sessions. | Tangled can make the queue network-native and evidence-backed. |
| Rust triagebot | https://github.com/rust-lang/triagebot and https://forge.rust-lang.org/triagebot/index.html | General-purpose bot for Rust org GitHub/Zulip workflows: labels, assignments, review queue support, commands. | Deeply project-specific and GitHub/Zulip-specific. | Tangled can generalize the state as protocol records rather than project-local bot conventions. |
| osbuild/pr-review-queue | https://github.com/osbuild/pr-review-queue | Daily actionable PR review queue, pinging authors/reviewers in Slack. | Queue notification, not portable evidence. | A good UI pattern: "who needs to act next"; Tangled should add "which receipt is missing." |

Already solved:

- Label and route issues.
- Build triage dashboards.
- Track waiting-on-author/reviewer states.
- Send queue summaries to Slack/Zulip/projects.

Tangled-new:

- Make queue ordering depend on protocol evidence completeness, trust circle, and source-linked project context.

### 7. Merge queues, gating, and "main stays green"

| Project / feature | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| Bors-NG | https://github.com/bors-ng/bors-ng and https://bors.tech/ | Merge bot for GitHub PRs; retests queued changes so main stays green. | Merge-readiness after review; not reviewability before review. Bors-NG is also archived/deprecated in practice. | Tangled should not reinvent Bors. Passport can hand off to merge queue after review. |
| Homu | https://github.com/rust-lang/homu | Rust-origin Bors-style merge queue bot. | Legacy/project-specific queueing. | Useful history only. |
| Prow / Tide | https://docs.prow.k8s.io/docs/overview/ and https://docs.prow.k8s.io/docs/components/core/tide/ | Kubernetes-scale GitHub automation, CI, labels, commands, and merge pool automation. | Huge proof that large OSS automation is mature. | Tangled should show a lighter, protocol-native evidence layer, not Kubernetes-scale infra. |
| GitHub Merge Queue | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue | Native merge queue that validates PRs against latest base and earlier queued PRs. | Native feature; impossible to beat as generic merge queue. | Do not pitch a merge queue. Pitch pre-merge, pre-review evidence. |
| GitLab Merge Trains | https://docs.gitlab.com/ci/pipelines/merge_trains/ | Queue MRs and validate them together before merging. | Native GitLab solved surface. | Same as above. |
| Mergify | https://mergify.com/ and https://docs.mergify.com/merge-queue/batches/ | Commercial PR automation, merge queues, batching, CI insights, governance. | Strong commercial competition on "manage PR flow." | Tangled needs "portable protocol evidence," not "faster merge automation." |
| Zuul | https://zuul-ci.org/ and https://zuul-ci.org/docs/zuul/latest/drivers/gerrit.html | Open-source project gating across code review systems, commonly Gerrit/OpenDev. | Powerful but infrastructure-heavy; focused on gating/test/merge correctness. | Use as proof that cross-system gating exists; Tangled's novelty is social evidence over ATProto. |

Already solved:

- Batch PRs.
- Retest against future main.
- Enforce required checks before merge.
- Use queues to maintain branch health.

Hard line for the Tangled demo:

- Merge readiness is not the product.
- Review reach is the product.

### 8. Dependency update bots and autonomous PR generation

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| Renovate | https://github.com/renovatebot/renovate and https://docs.renovatebot.com/ | Scans dependencies and opens PRs for updates with configurable schedules/policies. | Autonomous PR generation is already normal for dependency updates. | Tangled can use a Renovate-like PR as a familiar bot-origin example requiring receipts. |
| Dependabot core | https://github.com/dependabot/dependabot-core | Core logic for Dependabot security/version update PRs across ecosystems. | GitHub-integrated bot identity and PR format; evidence mainly changelog/security metadata. | Tangled can generalize bot PR accountability beyond dependencies. |
| GitHub Dependabot docs | https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates | Dependabot version updates and security updates open automated PRs. | Mature built-in for one class of bot PR. | Do not claim "bot opens PRs" is new. Claim "bot PRs carry portable identity/intent/test/trust receipts." |
| peter-evans/create-pull-request | https://github.com/marketplace/actions/create-pull-request | Creates PRs from workflow changes. | Mechanical PR creation is solved. | Tangled-native PR creation by PDS records matters only if it carries protocol evidence. |

Already solved:

- Bots can open PRs automatically.
- Projects can schedule/group/limit generated PRs.
- Dependency PRs can include changelogs and release notes.

Unsolved for AI/agent PRs:

- General-purpose agent PRs do not yet have a standard, network-portable receipt for owner, scope, intent, tests, trust, and past behavior.

### 9. Release bots and changelog automation

| Project | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| Release Drafter | https://github.com/release-drafter/release-drafter | Drafts release notes as PRs are merged; can autolabel PRs. | Release-note automation is solved and lower amplitude for Tangled. | Release context can be a passport chip: "blocks v1.4.0 freeze." |
| semantic-release | https://github.com/semantic-release/semantic-release | Automates version calculation, release notes, and package publishing. | CI/release workflow, not review evidence. | Treat release risk as one reason a PR gets attention. |
| release-please | https://github.com/googleapis/release-please | Creates release PRs from conventional commits; changelog/version bump automation. | Another strong proof that PR-generating release bots are commodity. | Tangled should not build release automation unless it supports the evidence story. |
| Changesets | https://github.com/changesets/changesets | Versioning and changelog workflow, especially monorepos; can create version PRs. | Specialized release management. | "Changeset present" can be evidence for package release PRs. |

Gamma cut:

- Do not build a release bot.
- Do show release pressure as context in the queue because judges understand urgency.

### 10. GitLab/Gerrit/Phabricator adjacent forge prior art

| Project / platform | URL | What it solves | Generic-forge limitation | Tangled opportunity |
| --- | --- | --- | --- | --- |
| GitLab Code Owners and approvals | https://docs.gitlab.com/user/project/codeowners/ and https://docs.gitlab.com/user/project/merge_requests/approvals/ | Code-owner approvals and MR approval rules. | Central forge policy. | Tangled can make trust/evidence portable across knots. |
| GitLab merge trains | https://docs.gitlab.com/ci/pipelines/merge_trains/ | Merge queue for MRs. | Merge readiness, not reviewability. | Same non-goal as GitHub Merge Queue. |
| Gerrit + Zuul | https://zuul-ci.org/docs/zuul/latest/drivers/gerrit.html and https://docs.opendev.org/opendev/system-config/latest/third_party.html | Review labels/votes, verification, gating, event streams. | High-power review infra, but not lightweight social protocol records for OSS contributors/agents. | Tangled can feel more approachable and social while keeping record addressability. |
| Phabricator Differential/Herald | https://secure.phabricator.com/book/phabricator/article/differential/ and https://www.phacility.com/phabricator/herald/ | Pre-push reviews, audits, rule-based notifications/mandatory reviewers. | Mature but older centralized suite. | Proof that "rules around reviews" is not novel; protocol portability is the wedge. |

Important pattern:

- Gerrit/Phabricator are closer to "review as first-class workflow object" than GitHub's lightweight PR model.
- Tangled can compete by making collaboration objects user-owned and network-addressable, not by building a heavier monolithic review suite.

## "Evidence Queue" Adjacent Concepts

The exact phrase "evidence queue" is not a common forge automation category. Adjacent uses and concepts:

| Concept / source | URL | Relevance | Limit |
| --- | --- | --- | --- |
| Serval "live evidence queue" | https://serval.la/ | Compliance/audit product uses evidence queue language: map evidence to controls before review. | Not OSS PR triage; useful metaphor only. |
| Code change reviewability research/discourse | https://newsletter.getdx.com/p/what-makes-a-code-change-easier-to and https://marco-c.github.io/publications/reviewability-fse2018.pdf | Reviewability depends on change size, description, tests, and reviewer confidence. | Mostly human/process research, not protocol records. |
| Mitchell Hashimoto on PR changesets | https://mitchellh.com/writing/github-changesets | Argues PRs should expose immutable change rounds for review. | GitHub UX idea; strong fit for Tangled PR rounds/receipt chain. |
| Tangled vouching evidence trails | https://blog.tangled.org/vouching/ | Tangled itself says future vouches should attach PR evidence. | This is the strongest sponsor-native clue for Review/Patch Passport. |
| AI PR reviewability discourse | https://www.eff.org/deeplinks/2026/02/effs-policy-llm-assisted-contributions-our-open-source-projects and https://lwn.net/Articles/1027100/ | Maintainers worry about LLM-generated code that looks plausible but is subtly wrong. | Policy/discourse, not an implementation. |

Interpretation:

- "Evidence queue" is a fresh phrase for PR automation.
- The strongest existing analog is audit/compliance evidence queues, but Tangled can translate it to maintainer attention: controls become project norms; evidence becomes identity/intent/tests/trust/source records.

## What Is Already Solved

Cold claims:

1. **Event ingestion and reaction.** Probot/GitHub Apps/GitHub Actions/GitLab/Forgejo/Prow can trigger on PR, issue, comment, label, push, and merge queue events.
2. **Labeling and routing.** Path, title, body, branch, author status, and project rules can apply labels or route issues.
3. **Reviewer assignment.** CODEOWNERS, GitHub team auto-assignment, Reviewpad, and custom actions assign reviewers.
4. **Approval policy enforcement.** GitHub/GitLab branch protection, policy-bot, Reviewpad Protect-style checks, and CODEOWNERS rules gate merges.
5. **Inline automated feedback.** Danger and reviewdog turn scripted rules/linter output into PR comments.
6. **Stale/no-response cleanup.** Probot stale, actions/stale, no-response, and GitHub tutorials handle inactivity.
7. **Dependency PRs.** Renovate and Dependabot are mature bot PR generators.
8. **Release PRs and notes.** release-please, release-drafter, semantic-release, and Changesets automate release management.
9. **Merge safety.** Bors/Homu/Prow/Tide/GitHub Merge Queue/GitLab Merge Trains/Mergify/Zuul handle queueing and retesting.
10. **Large project triage queues.** Triage Party, Rust triagebot, Prow dashboards, and project-specific queues show maintainers actionable lists.

## What Is Generic-Forge Commodity

These are bad headline features for Tangled because judges can mentally map them to GitHub/GitLab within seconds:

- "A bot comments on PRs."
- "A bot labels PRs."
- "A bot assigns reviewers."
- "A bot closes stale issues."
- "A bot opens dependency updates."
- "A bot drafts releases."
- "A queue merges green PRs."
- "A dashboard shows PRs waiting for review."
- "A YAML file defines PR policy."
- "A linter posts inline comments."

These can exist in the product, but only as supporting evidence chips.

## What Tangled/ATProto Can Make New

### 1. Reviewability receipts as protocol records

Generic bots leave labels/checks/comments inside a forge. Tangled can make the evidence itself linkable:

- pull record AT URI;
- issue record AT URI;
- comment record AT URI;
- vouch/denounce record;
- spindle/pipeline AT URI;
- repo DID and knot;
- agent/human DID;
- optional `app.sunstead.patchReceipt` or similar custom record if sponsor allows it.

This is the key wedge:

> The maintainer is not asked to trust a bot summary. The maintainer sees the source records behind the recommendation.

### 2. Trust-aware review reach without global reputation scores

Tangled's vouching model is already attenuated by circle and has no hard consequences. That maps perfectly to review reach:

- vouched contributor or agent: lower friction;
- denounced or unknown actor: request more context;
- repeated low-evidence pattern: cool down, not block;
- maintainer stays in control.

This avoids "social credit score" framing.

### 3. Agent identity as a first-class account, not a bot token

Renovate/Dependabot are accepted because their scope is narrow and familiar. General AI agents need more:

- stable DID;
- owner/human sponsor;
- declared scope;
- prior accepted work;
- tests and toolchain proof;
- vouch/denounce history;
- project-memory citations.

Tangled can make an agent a network actor with records, not just `some-bot[bot]`.

### 4. Cross-knot, cross-repo maintainer queue

Triage Party and GitHub Projects are GitHub API dashboards. Tangled's appview/firehose model can aggregate across knots and records:

- one maintainer sees PRs hosted on different knots;
- trust and collaboration records follow the actor;
- queue entries survive repo movement better than forge-local IDs;
- agents can write or cite ATProto records directly.

This is sponsor-native. Show it visually through repo DID/knot/AT URI, even if seeded.

### 5. Project memory as a receipt field

Existing bots can check "has changelog?" or "large diff?" They generally do not answer:

- Has this approach been rejected before?
- Which maintainer decision explains the norm?
- Which old PR/comment/test run is the precedent?
- Is this exception vouched by the right people?

Tangled can turn old pull/comment/vouch/spindle records into a compact "project memory" evidence chip.

### 6. Missing-receipt actions instead of stale closure

Stale bots ask for activity. A Tangled passport can ask for the exact missing evidence:

- link an issue;
- disclose agent identity;
- add focused test evidence;
- provide human sponsor;
- cite project precedent;
- rerun spindle;
- add a reasoned vouch.

This is better product copy and a clearer demo action.

## Competitive Threats To Avoid

| If we build... | It will be compared to... | Why that is bad | Reframe |
| --- | --- | --- | --- |
| AI PR review comments | Danger, reviewdog, Copilot Code Review, CodeRabbit, PR-Agent | Crowded and not Tangled-native. | "Evidence before review, not AI review." |
| Reviewer assignment | CODEOWNERS, GitHub team auto assignment, Reviewpad | Solved feature. | "Reviewer sees why this PR deserves attention." |
| Merge queue | GitHub Merge Queue, GitLab Merge Trains, Mergify, Bors, Prow/Tide | Native/commercial tools are mature. | "Reviewability queue before merge queue." |
| Dependency PR bot | Renovate, Dependabot | Commodity and narrow. | "Any agent PR needs an accountable passport." |
| Stale bot | probot/stale, actions/stale | Negative community pattern and low novelty. | "Request missing receipt." |
| Triage dashboard | Triage Party, GitHub Projects, Rust triagebot | Useful but generic. | "Protocol evidence queue with AT URI receipts." |
| Policy YAML | Reviewpad, policy-bot, Phabricator Herald | Mature policy-as-code prior art. | "Source-linked record graph, not just rules." |

## Best Demo Implications

The Gamma-informed demo should show:

1. A queue with lanes:
   - `Ready to review`
   - `Missing receipts`
   - `Cool down`
2. Two similar AI PRs:
   - one complete: agent DID, owner/human sponsor, linked issue, focused test, spindle pass, vouch, source AT URIs;
   - one weak: no stable identity, no issue, risky file, deleted test, denounce or low-evidence pattern.
3. A human PR control:
   - shows this is not anti-AI; humans also benefit from receipts.
4. Evidence detail:
   - every recommendation expands into source records, not just an AI explanation.
5. One action:
   - `Request missing receipt`, previewing a Tangled comment with AT URI evidence requirements.

Do not spend time implementing:

- real semantic search;
- real AI code review;
- full merge queue;
- full CODEOWNERS editor;
- dependency update generation;
- release automation;
- Slack/Zulip notifications;
- stale cleanup;
- broad admin policy UI.

## Source Inventory

Primary/official or near-primary sources checked:

- Tangled challenge file: `TANGLED_CHALLENGE_INFO.txt`
- Tangled docs: https://docs.tangled.org/single-page
- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled federation: https://blog.tangled.org/federation/
- Tangled intro: https://blog.tangled.org/intro/
- AT Protocol overview: https://atproto.com/guides/overview
- AT Protocol repository spec: https://atproto.com/specs/repository
- Probot framework: https://github.com/probot/probot and https://probot.github.io/
- Probot apps: https://probot.github.io/apps/
- probot/stale: https://github.com/probot/stale
- probot/no-response: https://github.com/probot/no-response
- repository-settings/app: https://github.com/repository-settings/app
- GitHub Actions docs: https://docs.github.com/en/actions
- GitHub workflow events: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- actions/stale: https://github.com/actions/stale
- GitHub stale tutorial: https://docs.github.com/actions/managing-issues-and-pull-requests/closing-inactive-issues
- actions/labeler: https://github.com/marketplace/actions/labeler
- actions/first-interaction: https://github.com/actions/first-interaction
- actions/add-to-project: https://github.com/actions/add-to-project
- create-pull-request action: https://github.com/marketplace/actions/create-pull-request
- GitHub CODEOWNERS: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- GitHub team code review assignment: https://docs.github.com/en/organizations/organizing-members-into-teams/managing-code-review-settings-for-your-team
- GitHub Merge Queue: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- GitLab Code Owners: https://docs.gitlab.com/user/project/codeowners/
- GitLab merge request approvals: https://docs.gitlab.com/user/project/merge_requests/approvals/
- GitLab merge trains: https://docs.gitlab.com/ci/pipelines/merge_trains/
- Reviewpad docs: https://docs.reviewpad.com/
- Reviewpad built-ins: https://docs.reviewpad.com/guides/built-ins/
- Reviewpad Check: https://docs.reviewpad.com/reviewpad-check/
- Palantir policy-bot: https://github.com/palantir/policy-bot
- Parity review-bot: https://github.com/paritytech/review-bot
- Danger JS: https://danger.systems/js/
- Danger Ruby: https://github.com/danger/danger
- reviewdog: https://github.com/reviewdog/reviewdog
- Renovate: https://github.com/renovatebot/renovate and https://docs.renovatebot.com/
- Dependabot core: https://github.com/dependabot/dependabot-core
- Dependabot docs: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-version-updates
- Bors-NG: https://github.com/bors-ng/bors-ng and https://bors.tech/
- Homu: https://github.com/rust-lang/homu
- Prow overview: https://docs.prow.k8s.io/docs/overview/
- Prow/Tide: https://docs.prow.k8s.io/docs/components/core/tide/
- Mergify: https://mergify.com/ and https://docs.mergify.com/merge-queue/batches/
- Zuul: https://zuul-ci.org/
- Zuul Gerrit driver: https://zuul-ci.org/docs/zuul/latest/drivers/gerrit.html
- OpenDev third-party testing: https://docs.opendev.org/opendev/system-config/latest/third_party.html
- Triage Party: https://github.com/google/triage-party
- Rust triagebot: https://github.com/rust-lang/triagebot and https://forge.rust-lang.org/triagebot/index.html
- Rust triagebot PR assignment: https://github.com/rust-lang/rust-forge/blob/master/src/triagebot/pr-assignment.md
- osbuild PR review queue: https://github.com/osbuild/pr-review-queue
- Release Drafter: https://github.com/release-drafter/release-drafter
- semantic-release: https://github.com/semantic-release/semantic-release
- release-please: https://github.com/googleapis/release-please
- Changesets: https://github.com/changesets/changesets
- Forgejo Actions: https://forgejo.org/docs/latest/user/actions/overview/
- Phabricator Differential: https://secure.phabricator.com/book/phabricator/article/differential/
- Phabricator Herald: https://www.phacility.com/phabricator/herald/
- Serval evidence queue: https://serval.la/
- DX reviewability article: https://newsletter.getdx.com/p/what-makes-a-code-change-easier-to
- Reviewability paper: https://marco-c.github.io/publications/reviewability-fse2018.pdf
- GitHub changesets essay: https://mitchellh.com/writing/github-changesets
- EFF LLM-assisted contributions policy: https://www.eff.org/deeplinks/2026/02/effs-policy-llm-assisted-contributions-our-open-source-projects
- LWN LLM-generated patch discussion: https://lwn.net/Articles/1027100/

## To Director / Next Synthesis

COLD:

- Mechanical PR/issue/review automation is crowded and mature.
- Reviewer assignment, stale cleanup, dependency PRs, release PRs, inline lint comments, policy checks, and merge queues should be treated as solved commodity surfaces.

WARM:

- Exact Tangled record shape for a reviewability receipt. T=24. Cool by asking sponsor whether custom lexicons are welcome or existing pull/issue/comment/vouch/spindle records are preferred.
- Whether to call it Review Passport, Patch Passport, Trust Receipts, or Evidence Radar. T=22. Cool by testing with sponsor/mentor in one sentence.

PLATEAU:

- Building a generic GitHub-like bot on Tangled. It may work technically but adds little judging leverage.
- Building a merge queue. Correct but strategically low leverage.
- Building AI review comments. Crowded and not protocol-native enough.

DEAD:

- Claiming "bot opens PRs" as novel. Renovate, Dependabot, release-please, create-pull-request actions, Copilot agents, and many demos already do this.

BOTTLENECK:

- Make Tangled's differentiator visible in under 20 seconds: "This patch earns review because these source records prove identity, intent, tests, trust, and project context." T=24, A=96, P=72.
