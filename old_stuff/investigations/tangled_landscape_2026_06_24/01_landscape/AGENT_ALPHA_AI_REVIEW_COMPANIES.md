# Agent Alpha: AI Review Companies Landscape

> **Agent:** alpha
> **Mission:** commercial AI code-review and PR-review companies/tools close to "AI reviews PRs" or "AI code review agent"
> **Date checked:** 2026-06-24
> **Status:** COMPLETE
> **Navigator position:** emerging and aligned; enough market evidence to ground the "generic AI reviewer" kill condition.

## Local Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Current local idea direction: **Tangled Review Passport** as the broad product object; **Patch Passport for AI PRs** as the demo wedge.
- Core demo flow to protect: a maintainer decides whether an AI-produced PR deserves review because it carries protocol evidence.
- Intentionally cut: generic AI code review, AI-detection claims, auto-blocking, universal trust scores, production auth, and a live dependency on flaky writes.

Scope note: this file focuses on commercial and commercial-adjacent PR review tools. It includes a few open-source projects where they are directly part of the commercial landscape or show how easy a generic AI PR reviewer is to replicate.

Fact/inference notation:

- **Fact:** stated by an official page, docs page, changelog, repo README, or dated product blog.
- **Inference:** my interpretation for Tangled strategy, based on those facts.

## Executive Verdict

**"AI reviews PRs" is an extremely crowded market in 2026.** CodeRabbit, Greptile, Qodo, Graphite, GitHub Copilot, GitLab Duo, Cursor Bugbot, Claude Code Review, Amazon Q Developer, Gemini Code Assist, Bito, Ellipsis, CodeAnt, cubic, Korbit, Sourcery, Codacy, DeepSource, Sentry, Sonar, Snyk, CodeScene, Aikido, and others already cover automated PR comments, summaries, custom rules, codebase context, multi-agent review, security findings, autofix, test generation, and in some cases agent-created pull requests.

**Implication:** If our Tangled idea is "an AI code-review bot listens to PRs and comments," it is already solved on GitHub/GitLab and will feel derivative. That path should be killed or demoted to an implementation detail.

**Tangled-native gap:** I did not find a direct competitor that makes a PR carry portable, public, protocol-addressable reviewability evidence: agent DID, human sponsor, repo DID/knot, issue/pull/comment AT URIs, vouches/denounces, spindle result, and project-memory receipts. The closest products have private team rules, repo memory, MCP/context connectors, compliance/audit evidence, or vendor-local learning loops. They review code; they do not create an open collaboration passport.

**Winning mutation:** Make AI review output one evidence chip inside the passport, not the product. The product should answer: "Has this patch earned scarce maintainer attention?" rather than "What bugs did an LLM find?"

## Direct Market Map

| Player / URL | Source date | What it does now - facts | Exact similarity to Tangled challenge | Differentiators / gaps vs Tangled Review Passport | Crowding risk | Implication for a Tangled-native idea |
| --- | --- | --- | --- | --- | --- | --- |
| [CodeRabbit](https://www.coderabbit.ai/) / [docs](https://docs.coderabbit.ai/) | Official pages checked 2026-06-24 | **Fact:** CodeRabbit describes an AI platform for code review, planning, and development workflows. Docs say it reviews PRs on GitHub, plans from Jira, opens PRs from Slack, and gives feedback in IDE/CLI. Docs also describe automated context-aware PR reviews, bug catching, standards enforcement, learning from team feedback, one-click fixes, and continuous improvement. | Very high for "AI reviews PRs"; medium-high for "agent opens PRs" because CodeRabbit has an agent/development workflow. It listens to Git hosting events rather than an ATProto firehose. | Strong on PR review quality and workflow breadth. Gap: no Tangled/ATProto state, no DID-based agent identity, no public vouch/denounce record, no portable receipt chain. | Critical | Do not pitch against CodeRabbit on review comments. Use CodeRabbit-style findings as possible passport evidence, but make the main demo about identity, sponsorship, issue intent, trust, and protocol receipts. |
| [Greptile](https://www.greptile.com/) | Official page checked 2026-06-24; copyright 2026 | **Fact:** Greptile calls itself "The AI Code Reviewer" with agents that review and test PRs using full codebase context. It indexes a code graph, uses a swarm of agents, learns from PR comments, supports custom rules, integrates with GitHub/GitLab, offers MCP and coding-agent loops, and has TREX for writing/running tests in a sandbox. | Very high. It is one of the closest direct competitors to an autonomous PR review agent and now reaches into tests and agent loops. | Strong on codebase context, multi-agent review, testing, and coding-agent integration. Gap: learning is team/vendor-local; no network-portable trust receipts, public social attestations, repo DID/knot story, or AT URI evidence model. | Critical | The Tangled pitch must not claim "full codebase AI reviewer" as novelty. Instead, show that even a Greptile-like review can be only one receipt in a broader accountability passport. |
| [Qodo](https://www.qodo.ai/) / [Qodo Code Review docs](https://docs.qodo.ai/code-review) | Qodo docs checked 2026-06-24; docs state Qodo v2 code review released 2026-02-04 | **Fact:** Qodo v2 brings multi-agent review, rule enforcement, and context-aware feedback into pull requests. Docs say it applies specialized review agents, full repository context, PR history, organizational standards, Review Standards, custom instructions, CI failure feedback, labels, and commands like `/compliance`, `/improve`, `/analyze`, `/implement`. | Very high. It is a full AI PR review platform and directly addresses AI-generated-code review. | Strong on standards and multi-agent review. Gap: Review Standards are organizational context, not public protocol records; no Tangled vouch/denounce, PDS, DID, repo DID, knot, or portable receipt surface. | Critical | Qodo owns "AI checks every PR against your standards." Tangled should own "patches carry public records explaining why they deserve review reach." |
| [PR-Agent](https://github.com/The-PR-Agent/pr-agent) | GitHub repo checked 2026-06-24; latest release shown 2026-06-21 | **Fact:** PR-Agent is an open-source AI-powered PR review agent and community-maintained legacy project of Qodo. README lists GitHub, GitLab, Bitbucket, Azure DevOps, Gitea, CLI, GitHub Actions, Docker/self-hosted/webhooks, multiple models, `/review`, `/improve`, `/describe`, `/ask`, and PR compression. | Very high for the basic "AI PR reviewer" concept. | Shows generic PR-review bots are easy to deploy and self-host. Gap: no Tangled protocol-native identity/trust/passport layer. | Critical | Generic review automation is not enough for a hackathon win. If needed, use PR-Agent as a proof that "AI comments on PRs" is commodity. |
| [Graphite](https://graphite.com/) / [Diamond coverage](https://www.devclass.com/ai-ml/2025/03/19/graphite-debuts-diamond-ai-code-reviewer-insists-ai-will-never-replace-human-code-review/1626959) | Official page checked 2026-06-24; Diamond article published 2025-03-19 | **Fact:** Graphite positions as an AI code review platform with stacked PRs, PR inbox, merge queue, AI code review, chat, and dev metrics. Third-party coverage says Graphite introduced Diamond, a code review agent based on Graphite Reviewer, for bugs, style, security, performance, docs, customizable rules, codebase context, and GitHub org integration. | High. Graphite combines PR workflow and AI review, not just a bot. | Strong on stacked PR workflow and merge mechanics. Gap: still GitHub-centric and workflow-platform-local; no open protocol trust object or portable project memory. | High-critical | Avoid building a generic "better review queue." Tangled lanes must be receipt lanes: Ready, Missing receipts, Cool down. |
| [GitHub Copilot Code Review](https://docs.github.com/en/copilot/concepts/agents/code-review) | GitHub docs checked 2026-06-24; GitHub changelog says GA 2025-04-04 | **Fact:** Copilot reviews pull requests, identifies issues, and suggests fixes. It supports GitHub.com, CLI, mobile, VS Code, Visual Studio, Xcode, JetBrains, and Azure DevOps public preview. Docs describe automatic PR reviews, full project context via agentic capabilities, suggested fixes passed to Copilot cloud agent, custom instructions, Copilot Memory preview, MCP servers, and agent skills. Docs also warn feedback must be validated by humans. | Very high and native to the dominant forge. It is the default "AI reviews PRs" baseline judges will know. | Strong on native GitHub integration and ecosystem control. Gap: platform-bound; no cross-forge AT records, no public vouch/denounce graph, no repo DID/knot, no explicit agent sponsor passport. | Critical | GitHub can add an "AI code review" button faster than we can. Tangled must show what GitHub cannot: protocol evidence that survives hosting boundaries and changes review reach. |
| [GitLab Duo Code Review / Code Review Flow](https://docs.gitlab.com/user/project/merge_requests/duo_in_merge_requests/) | GitLab docs checked 2026-06-24 | **Fact:** GitLab Duo can review merge requests for potential errors and standards alignment. Docs distinguish agentic Code Review Flow from non-agentic Duo Code Review; they include automatic reviews, custom instructions/comments, enhanced repository/cross-file context for agentic flow, and standard MR integration through `@GitLabDuo`. | Very high for GitLab users. | Strong on platform-native MR review and DevSecOps integration. Gap: GitLab-native, not open social protocol. Feedback does not currently influence later reviews of other MRs per docs. | Critical | Tangled cannot win by copying GitLab Duo. It can win by making reviewability an open record, not a platform add-on. |
| [Cursor Bugbot](https://cursor.com/bugbot) / [docs](https://cursor.com/docs/bugbot) | Official page checked 2026-06-24 | **Fact:** Bugbot automatically reviews GitHub PRs, comments on potential issues, and provides fixes in Cursor or through Background Agent. Bugbot Rules support custom coding standards and project-specific guidelines. | Very high for "AI reviews PRs"; high for agentic fix loop because it ties to Cursor Background Agent. | Strong because Cursor is where AI-generated code is produced. Gap: GitHub/Cursor workflow only; no portable social proof, public agent identity, or Tangled records. | Critical | The demo should not say "we catch bugs in AI code." Cursor already sells that. Say "we decide whether an AI patch has receipts before review." |
| [Claude Code Review](https://code.claude.com/docs/en/code-review) / [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions) | Claude docs checked 2026-06-24; Code Review is research preview | **Fact:** Claude Code Review analyzes GitHub PRs, posts inline findings, uses a fleet of specialized agents over full codebase context, tags severity, does not approve/block PRs, can be tuned with `CLAUDE.md`/`REVIEW.md`, can trigger on PR open/push/manual request, and includes verification/deduplication. Claude GitHub Actions can analyze code, create PRs, implement features, and fix bugs from PR/issue mentions. | Very high. It directly matches autonomous code review and partially matches co-development/PR creation. | Strong on multi-agent review and implementation actions. Gap: Claude agents are not ATProto actors with durable public review history; no Tangled vouch/sponsor/receipt chain. | Critical | Multi-agent PR review is no longer novel. Tangled should make Claude/Codex/Cursor-produced PRs accountable network actors. |
| [Amazon Q Developer for GitHub](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/amazon-q-for-github.html) / [review docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/github-code-reviews.html) | AWS docs checked 2026-06-24; GitHub integration marked Preview | **Fact:** Amazon Q Developer for GitHub includes a development agent that creates PRs from issues and a code review agent that automatically reviews new/reopened PRs, gives summaries and threaded findings, suggests fixes, and supports `/q review`, `/q dev`, and `/q` interactions. | Very high. It covers both challenge examples: review PRs and co-develop features/submits PRs. | Strong on GitHub issue-to-PR and PR review automation. Gap: Amazon/GitHub-specific agent with no ATProto-native agent identity, vouch graph, or open-source review passport. | Critical | A Tangled "agent opens PRs" demo will be crowded unless the agent identity and evidence are visibly protocol-native. |
| [Gemini Code Assist on GitHub](https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code) / [Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/gemini-code-assist-and-github-ai-code-reviews) | Docs checked 2026-06-24; blog dated 2025-08-01; docs say consumer version shuts down 2026-07-17, enterprise in preview | **Fact:** Gemini Code Assist on GitHub acts as a code reviewer, auto-summarizes PRs, provides in-depth reviews, supports `/gemini` interaction, retrieves repository and PR info, and has enterprise GitHub integration through Google Cloud. | Very high for PR review; less agentic for write-side PR creation. | Strong native GitHub app. Gap: no Tangled protocol object, public trust graph, or review reach semantics. | Critical | Another default platform AI reviewer. Tangled must make "receipts before attention" the visible novelty. |
| [Bito AI Code Review Agent](https://docs.bito.ai/ai-code-reviews-in-git/overview) / [repo](https://github.com/gitbito/codereviewagent) | Docs and GitHub repo checked 2026-06-24 | **Fact:** Bito positions its AI Code Review Agent as specialized engineers analyzing performance, code structure, security, optimization, and scalability. It uses repository context via symbol indexing, ASTs, and embeddings; supports GitHub/GitLab/Bitbucket; has cloud, self-hosted, and IDE modes; posts PR comments; can integrate static/security tools. | High. It is a context-aware PR/MR reviewer. | Strong privacy/deployment story and static-analysis combination. Gap: no ATProto public evidence, no maintainer social trust semantics. | High | Privacy/self-hosting is already covered by Bito/Kodus/DeepSource BYOK. Tangled should not lean on "we can self-host the reviewer." |
| [Ellipsis.dev](https://www.ellipsis.dev/) / [docs](https://docs.ellipsis.dev/features/code-review) | Official pages checked 2026-06-24 | **Fact:** Ellipsis offers automatic code reviews on every commit of every PR, catches logical bugs, style guide violations, antipatterns, security issues, spelling/grammar, and documentation drift; docs say it returns PR review comments within minutes and can fix bugs. YC page says developers can tag `@ellipsis-dev` to implement fixes and it executes generated code. | High. Direct automated PR review plus fix loop. | Strong action loop from finding to implementation. Gap: no protocol-visible accountability layer around who/what stands behind a patch. | High | "AI found and fixed it" is crowded. Tangled can ask whether the fix has identity, sponsor, tests, and a record chain. |
| [CodeAnt AI](https://www.codeant.ai/ai-code-review) | Official page checked 2026-06-24 | **Fact:** CodeAnt AI markets full-codebase AI code review, inline review, PR summary, quality gates, CI/CD hooks, IDE fixes, sequence diagrams, AI learnings, and integrations with GitHub, GitLab, Bitbucket, Azure DevOps, VS Code, Cursor, Windsurf, IntelliJ, Jira, and Slack. | High. Direct AI PR reviewer with security/quality workflow. | Strong enterprise/security/integration positioning. Gap: not Tangled/ATProto; no portable reviewability receipt or social evidence. | High | Do not compete on "full codebase context" or "quality gates"; competitors already frame those heavily. |
| [cubic](https://www.cubic.dev/) / [YC page](https://www.ycombinator.com/companies/cubic) | Official and YC pages checked 2026-06-24 | **Fact:** cubic positions as AI code reviews for complex codebases, finds hard-to-find bugs in PRs and entire codebases, and YC describes it as an AI-powered code review platform that automatically reviews PRs and helps human reviewers. | High. Direct newer AI PR-review startup. | Strong narrow wedge around complex-codebase bug finding. Gap: no protocol-native trust, provenance, or public maintainer evidence. | High | New entrants keep entering generic AI code review. A hackathon pitch in that lane will look like yet another startup clone. |
| [Korbit](https://www.korbit.ai/index.html) | Official page checked 2026-06-24 | **Fact:** Korbit works with GitLab, GitHub, and Bitbucket; writes PR descriptions and review summaries; supports custom policies and insights; markets itself as PR reviewer available 24/7. | High. Direct AI review/summarization on PRs. | Strong on PR context and team policies. Gap: no ATProto, DIDs, vouches, or public evidence chain. | High | PR summaries/descriptions are commodity. Passport details should be protocol receipts, not another summary. |
| [Sourcery](https://www.sourcery.ai/) / [docs](https://docs.sourcery.ai/Code-Review/Overview/) / [GitHub repo](https://github.com/sourcery-ai/sourcery) | Official pages checked 2026-06-24 | **Fact:** Sourcery reviews every PR/MR, adds reviews directly in GitHub/GitLab, supports IDE review of branches/uncommitted changes/current file, and provides summaries, high-level feedback, and line comments. It is free for public/open-source repos and paid for private repos after trial. | High. Direct PR/MR reviewer. | Strong open-source friendliness and IDE/repo coverage. Gap: no portable trust or record-based reviewability. | High | Open-source projects can already get AI PR review for free. Tangled needs a new open-source collaboration norm, not cheaper review comments. |
| [Codacy AI Reviewer](https://www.codacy.com/ai-reviewer) / [AI docs](https://docs.codacy.com/codacy-ai/codacy-ai/) | Official pages checked 2026-06-24 | **Fact:** Codacy's AI Reviewer combines deterministic code analysis with context-aware AI for security, test coverage gaps, complexity, business logic gaps, duplication, PR summaries, fix suggestions, and AI-enhanced comments on new PRs/reviews. Codacy also markets AI coding policies for unapproved model calls and prompt-injection risks. | Medium-high. More code-quality/security review than autonomous coding agent, but directly in PRs. | Strong hybrid analysis and AI policy angle. Gap: compliance is organizational/platform-local; no public ATProto receipt chain or maintainer vouch graph. | High | AI-specific policy violations are a useful evidence chip for passports. Do not make policy scanning the main idea. |
| [DeepSource](https://deepsource.com/) / [AI Review changelog](https://deepsource.com/changelog/2026-02-23) / [MCP changelog](https://deepsource.com/changelog) | Official page checked 2026-06-24; AI Review changelog dated 2026-02-23; MCP changelog dated 2026-04-07 | **Fact:** DeepSource positions as an AI Code Review Platform. It combines 5,000+ deterministic rules with an AI review agent on every PR, added AI Review in February 2026, and added an MCP server in April 2026 so agents can read PR findings, PR report card grades, vulnerabilities, coverage, compliance reports, and autonomously fix issues. BYOK support is available for Enterprise Server v5.0.0. | Medium-high. Direct PR review plus agent-accessible findings. | Strong hybrid static+AI, report cards, MCP, enterprise/BYOK. Gap: report cards are quality/security, not public reviewability receipts with social trust. | High | DeepSource is close to "review findings as machine-readable evidence." Tangled should make receipts open and social, not just vendor MCP data. |
| [Sonar AI / SonarQube](https://www.sonarsource.com/solutions/ai/) / [AI CodeFix blog](https://www.sonarsource.com/blog/ai-codefix-sonar/) | Official pages checked 2026-06-24 | **Fact:** Sonar frames AI-generated code as needing verification. SonarQube reviews AI-generated or human code for bugs, vulnerabilities, quality issues, compliance, and quality gates. Sonar Remediation Agent detects/fixes issues and verifies fixes before opening a PR. AI CodeFix suggests fixes for issues found by Sonar analysis and can appear on PR pages. | Medium-high. More quality/security gate than conversational reviewer, but directly addresses AI code review bottleneck and fix PRs. | Strong on deterministic, explainable, auditable quality/security standards. Gap: no open-source social trust, vouches, DIDs, project memory, or protocol receipt object. | Medium-high | "Auditable evidence" is a useful term. Tangled should borrow the evidence posture, but apply it to collaboration trust, not only static issues. |
| [Snyk DeepCode AI](https://snyk.io/platform/deepcode-ai/) / [Snyk PR checks docs](https://docs.snyk.io/scan-fix-and-prevent/prevent/pull-request-checks/pull-request-experience) | Official pages checked 2026-06-24 | **Fact:** Snyk DeepCode AI powers AppSec testing, Snyk Code/SAST, risk prioritization, AI security autofixes, hybrid symbolic/generative AI, and PR checks with inline comments/fix suggestions for Snyk Code findings. | Medium. Security/AppSec-focused PR review, not general AI code review. | Strong security domain credibility and autofix. Gap: no general maintainer trust/passport layer or Tangled protocol use. | Medium-high | Security findings can be a passport field. But a Tangled win should not look like Snyk-with-AT-labels. |
| [CodeScene Automated Code Health Reviews](https://codescene.com/product/automated-code-health-reviews) / [PR integration docs](https://codescene.io/docs/guides/pr-integration/integrate-into-ci-cd.html) | Official pages checked 2026-06-24; CodeScene blog on review impact dated 2025-09-22 | **Fact:** CodeScene auto-reviews PRs for Code Health, quality gates, technical debt trends, and supports GitHub, Bitbucket, GitLab, Azure, and Gerrit. | Medium. Automated review and PR gates, but not LLM-first. | Strong code-health/technical-debt analytics. Gap: not about agent identity, provenance, trust, or open protocol records. | Medium | If we build a queue/dashboard, it may be compared to CodeScene. Keep the product centered on a patch passport action. |
| [HackerOne Code / PullRequest](https://www.pullrequest.com/) / [Smart Review Selection](https://www.pullrequest.com/smart-review-selection/) | Official pages checked 2026-06-24 | **Fact:** PullRequest is now branded HackerOne Code. It combines AI with expert human review and uses AI-driven Smart Review Selection to pick highest-risk changes for professional reviewers. | Medium. It addresses scarce human review and PR risk, but via expert review marketplace rather than autonomous bot. | Strong human-in-loop security review. Gap: no protocol-native social proof or open maintainer evidence trail. | Medium | This validates the scarce-review framing. Tangled can say it preserves maintainer attention without outsourcing to paid experts. |
| [Sentry Seer AI Code Review](https://docs.sentry.io/product/ai-in-sentry/seer/code-review/) / [product page](https://sentry.io/product/seer/ai-code-review/) | Official docs/product checked 2026-06-24 | **Fact:** Sentry Code Review helps review code changes, predicts errors, offers suggestions before merging PRs/MRs, and product page says it finds/fixes coding errors in GitHub PRs and generates unit tests. | Medium-high if project uses Sentry; it is production-error-aware PR review. | Strong because it connects production error knowledge to PR review. Gap: domain-specific observability context, not portable collaboration trust. | Medium-high | Project-memory/context review is also crowded. Tangled project memory must be protocol evidence, not just app telemetry. |
| [Sourcegraph](https://sourcegraph.com/) / [Amp Code Review GitHub App](https://github.com/ampcode/cra-github) | Sourcegraph and Amp repo checked 2026-06-24 | **Fact:** Sourcegraph positions as codebase context for humans and agents. Amp Code Review GitHub App README says it uses Amp to review code for bugs, security issues, logic errors, runs automatically on PR open, supports manual re-review, suggests fixes, and is aware of existing PR conversation. Sourcegraph's own automated-code-review blog says Sourcegraph is a context layer, not a PR bot. | Medium-high. Amp is directly a PR review agent; Sourcegraph core is context infrastructure. | Strong on enterprise code context and agent infrastructure. Gap: not Tangled social protocol; no vouch/denounce/receipt model. | High for agentic review; medium for context layer | "Give agents context" is crowded. Tangled can give agents public collaboration context and force them to cite it. |
| [Aikido Code Quality](https://www.aikido.dev/code/code-quality) | Official page checked 2026-06-24 | **Fact:** Aikido markets AI-powered code reviews that catch logic bugs, incorrect conditionals, edge cases, runtime errors, anti-patterns, and custom-rule violations. Aikido broader platform also creates fix PRs for security findings. | Medium. Security/code-quality PR review adjacent to AI review. | Strong DevSecOps platform. Gap: not collaboration-trust/passport. | Medium | Aikido reinforces that "AI code quality" is a security-tools category, not a Tangled-native wedge by itself. |
| [Kodus / Kody](https://github.com/kodustech/kodus-ai) / [self-hosted page](https://kodus.io/self-hosted-ai-code-review/) | GitHub and product pages checked 2026-06-24 | **Fact:** Kodus is open-source AI code review with model choice/cost control, local/pipeline reviews, tech debt and delivery metrics, and self-hosted review where source code, LLM calls, and review history stay inside the team network. | High for generic PR review; open-source/self-hosted lane. | Strong self-hosted control and BYOK angle. Gap: no ATProto public trust network or repo identity. | High as commodity pressure | There is no moat in making a PR-review bot. Tangled's defensibility is the protocol-native data model and social workflow. |
| [Reviewpad](https://docs.reviewpad.com/reviewpad-check/) | Docs checked 2026-06-24; docs show transition notice to Snyk | **Fact:** Reviewpad Check flags PRs needing attention using signals such as many review iterations, high internal churn, and added lines; docs currently show Reviewpad temporarily unavailable during transition to Snyk. | Medium-low. PR workflow automation, not necessarily modern AI review. | Strong workflow automation/triage history. Gap: not AI-first now, not protocol-native. | Medium | Non-AI review triage already uses PR metadata. Tangled must make the metadata richer and portable. |

## Pattern Synthesis

### 1. Direct PR review is saturated

Fact pattern:

- Multiple products now use the same core language: automatic PR reviews, full codebase context, custom rules, inline comments, suggested fixes, security findings, and faster merges.
- The strongest products have moved beyond single LLM comments into multi-agent review, repo memory, code graph context, custom standards, MCP/context connectors, auto-fix, and test generation.
- Platform-native providers now cover the same flow inside GitHub, GitLab, Cursor, Claude, Amazon Q, and Gemini.

Inference for Tangled:

- **Kill condition triggered for generic AI review.** A Tangled project whose main novelty is "an AI review agent that comments on PRs" will look late.
- A firehose listener alone is not enough. GitHub/GitLab apps already listen to PR events. The unique part must be that Tangled PRs are protocol records with social/trust state attached.

### 2. "Context" is already table stakes

Fact pattern:

- Greptile indexes code graphs and learns from PR comments.
- Qodo uses repository context, PR history, and organizational standards.
- GitHub Copilot can use full project context, custom instructions, MCP servers, agent skills, and memory.
- GitLab Duo has agentic review flow with enhanced repository/cross-file context.
- Claude Code Review uses full-codebase multi-agent analysis.
- Bito uses symbol indexing, ASTs, and embeddings.
- Sourcegraph/Amp makes codebase context a core product.

Inference for Tangled:

- "Our reviewer understands the repo" is not differentiating.
- The missing context is not just code context; it is **collaboration context**: who authorized this agent, what issue requested it, which maintainer vouched, what prior decision it cites, whether a denounced pattern exists, and which protocol records prove that.

### 3. Auto-fix and agent loops are now common

Fact pattern:

- CodeRabbit, Qodo, Cursor Bugbot, Amazon Q, Claude Actions, Sonar Remediation Agent, Snyk Agent Fix, Ellipsis, DeepSource MCP, Aikido, and Amp all connect review findings to fixes or PRs in some way.

Inference for Tangled:

- Agent-created PRs are not speculative. They are a live category.
- The strongest Tangled question is: "When agents can open PRs, how do maintainers know which agents and patches deserve attention?"
- Build **Agent/Patch Passport**, not "agent makes patch."

### 4. Security and compliance players are adjacent, not identical

Fact pattern:

- Sonar, Snyk, DeepSource, Codacy, CodeAnt, Aikido, and CodeScene focus on quality gates, vulnerabilities, code health, compliance, report cards, AI code policies, and auditability.

Inference for Tangled:

- These players validate the "evidence/audit" metaphor.
- They do not solve maintainer trust in open-source collaboration. Their evidence usually says "this code passed rules"; Tangled can say "this patch is accountable enough to review."

### 5. Human-in-loop review still matters

Fact pattern:

- HackerOne Code/PullRequest combines AI selection with expert human review for important code.
- Many AI-review docs explicitly preserve human review or warn to validate AI feedback.

Inference for Tangled:

- Review Passport should not claim to replace maintainers or prove correctness.
- It should preserve scarce human review attention by making missing evidence obvious.

## Tangled Wedge Inventory

What competitors largely cover:

- AI PR summaries.
- Inline AI review comments.
- Bug/security/style/performance findings.
- Custom rules/instructions.
- Codebase graph/repo context.
- Multi-agent analysis.
- Auto-fixes and coding-agent loops.
- Test generation or test-aware review.
- Quality gates/report cards.
- Team-private review memory.

What appears under-covered or not covered by the scanned competitors:

- Stable AI-agent identity as a first-class open-source contributor object.
- Human sponsor/owner standing behind an agent PR.
- Public, protocol-addressable reviewability receipts.
- Vouch/denounce records changing review reach without becoming a global trust score.
- Repo DID/knot context: evidence survives repo movement or decentralized hosting.
- Pull/issue/comment/spindle/vouch AT URIs as source links in one passport.
- Project memory / case law as a citation required before review.
- Review reach lanes that separate "can submit" from "has earned maintainer attention."
- A maintainer action that asks for missing receipts rather than debating generated code quality.

T/A/P notes:

| Claim | T | A | P | Evidence that lowers T |
| --- | ---: | ---: | ---: | --- |
| Generic AI PR review is crowded and not a winning Tangled differentiator. | 8 | 95 | 87 | Multiple official docs/product pages show direct PR review, multi-agent review, auto-fix, and platform-native review. |
| Review Passport is differentiated if it is about portable protocol evidence, not code review comments. | 20 | 98 | 78 | No scanned competitor centers DIDs, AT URIs, vouches/denounces, repo DIDs, knots, and spindle records as a public reviewability object. |
| AI reviewer output should be a passport chip, not the product. | 16 | 92 | 76 | Security/quality tools already make findings useful as evidence; Tangled can aggregate them with social/protocol records. |
| Agent identity/sponsor receipts are the sharpest Tangled-native response to AI PR volume. | 22 | 97 | 75 | Challenge explicitly mentions autonomous agents on Tangled; market already has agent-created PRs, but not protocol-native accountable agent passports. |

## Implications For The Winning Idea

### Use this positioning

> AI reviewers find comments. Tangled Review Passport decides whether a patch has earned review.

or:

> GitHub can add another AI reviewer. Tangled can make AI patches carry identity, intent, tests, trust, and protocol receipts.

### Product object

Use **Tangled Review Passport** as the platform frame and **Patch Passport for AI PRs** as the first demo.

The passport should include:

- **Identity:** human or agent handle, DID, owner/sponsor.
- **Intent:** linked issue, advisory, maintainer request, or explicit task record.
- **Trust:** vouches, denounces, prior accepted work, human sponsor.
- **Evidence:** spindle/CI result, tests added, linked AI review findings, source record links.
- **Project memory:** precedent/case-law citation when the PR touches risky or previously-debated areas.
- **Risk:** file surface such as auth, payments, dependencies, or deleted tests.
- **Receipt chain:** AT URIs for pull, issue, comment, vouch/denounce, repo DID, spindle, optional custom receipt.

### Demo shape that avoids the crowded market

1. Two AI PRs both look plausible.
2. Both have a conventional AI review summary, or both pass superficial checks.
3. Only one gets `Ready to review` because it has:
   - stable agent DID;
   - human sponsor DID;
   - linked issue;
   - focused test/spindle result;
   - vouch evidence;
   - project-memory citation;
   - AT URI receipt chain.
4. The other goes to `Missing receipts` because it has:
   - anonymous/throwaway agent;
   - no issue intent;
   - risky files;
   - deleted test;
   - no sponsor/vouch;
   - maybe a denounced pattern.
5. Maintainer action is not "reject." It is `Request missing receipts`.

This shows Tangled/ATProto in the first minute and does not compete with CodeRabbit/Greptile/Qodo on review quality.

### What to intentionally cut

- Do not build an AI diff reviewer.
- Do not claim to detect AI-generated code.
- Do not claim a vouch proves code is correct.
- Do not auto-block, auto-reject, or auto-merge.
- Do not build a broad dashboard or review analytics product.
- Do not depend on live custom lexicon writes unless Tangled sponsor says custom records are welcome.

### What to borrow

- From Greptile/Qodo/Claude: multi-agent review can be an evidence source, not the whole story.
- From Sonar/Snyk/DeepSource/Codacy: quality/security findings can be auditable chips.
- From GitHub/GitLab custom instructions: repo-specific rules matter, but Tangled should make public project memory citeable.
- From HackerOne Code: scarce human attention is the real bottleneck.
- From PR-Agent/Kodus: generic AI review is commodity, so our moat must be protocol/state.

## Sponsor-facing Contrast

If a judge asks "Why not just GitHub Copilot/CodeRabbit/Greptile?"

Answer:

> Those tools review code. Review Passport reviews the evidence around the change. On Tangled, the evidence is not hidden in one vendor: the agent DID, human sponsor, issue, pull record, vouch, spindle, and project-memory links are protocol records. That lets maintainers say: AI code is welcome, but no patch gets scarce attention without receipts.

If a judge asks "Is this an AI reviewer?"

Answer:

> No. We can include AI review findings, but the core product is a reviewability layer. It tells a maintainer whether this patch has enough identity, intent, tests, trust, and provenance to deserve human review.

## Source Inventory

Primary sources checked on 2026-06-24:

- CodeRabbit product: https://www.coderabbit.ai/
- CodeRabbit docs: https://docs.coderabbit.ai/
- Greptile product: https://www.greptile.com/
- Qodo product: https://www.qodo.ai/
- Qodo code review docs: https://docs.qodo.ai/code-review
- PR-Agent GitHub repo: https://github.com/The-PR-Agent/pr-agent
- Graphite product: https://graphite.com/
- Graphite Diamond coverage, dated 2025-03-19: https://www.devclass.com/ai-ml/2025/03/19/graphite-debuts-diamond-ai-code-reviewer-insists-ai-will-never-replace-human-code-review/1626959
- Braintrust Graphite customer page: https://www.braintrust.dev/customers/graphite
- GitHub Copilot Code Review docs: https://docs.github.com/en/copilot/concepts/agents/code-review
- GitHub Copilot Code Review usage docs: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review
- GitHub Copilot Code Review GA changelog, dated 2025-04-04: https://github.blog/changelog/2025-04-04-copilot-code-review-now-generally-available/
- GitLab Duo in merge requests: https://docs.gitlab.com/user/project/merge_requests/duo_in_merge_requests/
- GitLab Duo Code Review docs: https://docs.gitlab.com/user/gitlab_duo/code_review/
- Cursor Bugbot: https://cursor.com/bugbot
- Cursor Bugbot docs: https://cursor.com/docs/bugbot
- Claude Code Review docs: https://code.claude.com/docs/en/code-review
- Claude Code GitHub Actions docs: https://code.claude.com/docs/en/github-actions
- Claude Code Review plugin repo: https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md
- Amazon Q Developer for GitHub: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/amazon-q-for-github.html
- Amazon Q Developer code review docs: https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/github-code-reviews.html
- Gemini Code Assist GitHub review docs: https://docs.cloud.google.com/gemini/docs/code-review/review-repo-code
- Google Cloud Gemini code review blog, dated 2025-08-01: https://cloud.google.com/blog/products/ai-machine-learning/gemini-code-assist-and-github-ai-code-reviews
- Bito AI Code Review docs: https://docs.bito.ai/ai-code-reviews-in-git/overview
- Bito CodeReviewAgent repo: https://github.com/gitbito/codereviewagent
- Ellipsis product: https://www.ellipsis.dev/
- Ellipsis code review docs: https://docs.ellipsis.dev/features/code-review
- Ellipsis YC page: https://www.ycombinator.com/companies/ellipsis
- CodeAnt AI Code Review: https://www.codeant.ai/ai-code-review
- cubic product: https://www.cubic.dev/
- cubic YC page: https://www.ycombinator.com/companies/cubic
- Korbit product: https://www.korbit.ai/index.html
- Sourcery product: https://www.sourcery.ai/
- Sourcery docs: https://docs.sourcery.ai/Code-Review/Overview/
- Sourcery GitHub repo: https://github.com/sourcery-ai/sourcery
- Codacy AI Reviewer: https://www.codacy.com/ai-reviewer
- Codacy AI docs: https://docs.codacy.com/codacy-ai/codacy-ai/
- Codacy product: https://www.codacy.com/
- DeepSource product: https://deepsource.com/
- DeepSource AI Review changelog, dated 2026-02-23: https://deepsource.com/changelog/2026-02-23
- DeepSource changelog / MCP and BYOK entries: https://deepsource.com/changelog
- Sonar AI solutions: https://www.sonarsource.com/solutions/ai/
- Sonar AI CodeFix blog: https://www.sonarsource.com/blog/ai-codefix-sonar/
- Snyk DeepCode AI: https://snyk.io/platform/deepcode-ai/
- Snyk PR checks docs: https://docs.snyk.io/scan-fix-and-prevent/prevent/pull-request-checks/pull-request-experience
- CodeScene automated reviews: https://codescene.com/product/automated-code-health-reviews
- CodeScene PR integration docs: https://codescene.io/docs/guides/pr-integration/integrate-into-ci-cd.html
- CodeScene review impact blog, dated 2025-09-22: https://codescene.com/blog/visualize-the-impact-of-automated-code-reviews-announcement
- HackerOne Code / PullRequest: https://www.pullrequest.com/
- PullRequest Smart Review Selection: https://www.pullrequest.com/smart-review-selection/
- Sentry Seer Code Review docs: https://docs.sentry.io/product/ai-in-sentry/seer/code-review/
- Sentry Seer AI Code Review product: https://sentry.io/product/seer/ai-code-review/
- Amp Code Review GitHub App: https://github.com/ampcode/cra-github
- Sourcegraph product: https://sourcegraph.com/
- Aikido Code Quality: https://www.aikido.dev/code/code-quality
- Kodus GitHub repo: https://github.com/kodustech/kodus-ai
- Kodus self-hosted AI code review: https://kodus.io/self-hosted-ai-code-review/
- Reviewpad Check docs: https://docs.reviewpad.com/reviewpad-check/
