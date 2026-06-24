# Agent Iota: Security Recall Networks Landscape

> **Status:** COMPLETE
> **Agent:** iota
> **Mission:** `01_landscape`
> **Date:** 2026-06-24
> **Navigator position:** Emerging and aligned. Cold on "advisory/scanner/remediation tooling is mature"; warm on "Tangled can own the targeted maintainer action layer."
> **Target T/A:** T55 -> T24, A96. Evidence that lowers T: sourced workflow map, close-player contrast, and a direct verdict against Patch Passport.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Challenge style: open-ended creative inside a Tangled sponsor need.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Judging/submission mode from local notes: Tangled partner selects finalists, then a 4-minute pitch with 1 minute of questions.
- Target track: Tangled main challenge.
- Best expected-value track: Tangled main challenge. The code-push side challenge is not worth optimizing around unless it happens naturally.
- Core demo flow under this agent's scope: a security advisory becomes targeted Tangled actions for affected repo DIDs, and each issue/PR/request carries protocol evidence.
- Intentionally cut: production vulnerability scanner, real ecosystem crawler, private disclosure room, live CVE/GHSA publication, mass PR automation, exploitability claims, and any claim that Tangled proves code is safe.

Known unknowns still worth flagging before large implementation:

- Presenter and preferred pitch style are still unknown.
- Exact Tangled write-side constraints are still moving: whether sponsor prefers only existing `sh.tangled.*` records or a preview custom recall/advisory record is unknown.
- Live auth/network reliability at judging is unknown, so the judged flow should be seeded unless sponsor explicitly asks for live writes.
- Whether Tangled wants cross-repo network coordination more than one-repo maintainer flow is a sponsor question, not a fact.

## Executive Verdict

**OSS Emergency Broadcast / Recall Network is not stronger than Patch Passport as the primary hackathon idea.**

It is higher amplitude as a world model, and more obviously "network-native" if the sponsor wants cross-repo coordination. But standalone recall runs straight into mature prior art: GitHub Security Advisories, GitHub Advisory Database, OSV, Dependabot alerts, Renovate, Snyk, Sonatype, npm audit, pip-audit, OSV-Scanner, OpenVEX, Dependency-Track, CISA KEV, EPSS, Scorecard, Allstar, Patchstack, CERT/VINCE, OpenSSF CVD, Autofix SIG, and OSS-SIRT.

The stronger mutation is:

> **Security Recall Passport**: every emergency advisory or targeted fix request is just another high-stakes reviewability receipt.

This folds Recall Network into Review/Patch Passport instead of competing with it. The advisory supplies `intent`; affected-repo evidence supplies `why you`; VEX/spindle supplies `affected / not affected`; vouches and reporter identity supply `why trust this`; generated issues/PRs supply `what to do next`.

Short verdict:

> Patch Passport should stay the main pitch. Recall Network should be the security/advisory mode: "when an advisory lands, Tangled turns it into targeted reviewable actions with receipts."

## What Existing Systems Already Do

### 1. Upstream private disclosure and advisory publication

| System | Workflow | Strength | Gap for Tangled |
| --- | --- | --- | --- |
| [GitHub Repository Security Advisories](https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/repository-security-advisories) | Maintainers privately discuss, fix, optionally request CVE, collaborate in a temporary private fork, then publish advisory. | Strong maintainer workflow on GitHub. Mature, understandable, tied to CVE/GHSA and package ecosystems. | Repo-local and platform-local. After publication, downstream action depends on dependency graphs, scanners, and humans. It does not create a portable network action object for every affected Tangled repo. |
| [GitHub private vulnerability reporting](https://docs.github.com/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository) | Researchers submit structured private reports to a repo. Maintainers accept, ask questions, reject, and collaborate. | Solves the "do not disclose in public issue" path for GitHub projects. | This is private intake, not broad recall. Tangled hackathon should not try to clone it. |
| [CERT/CC VINCE](https://certcc.github.io/VINCE-docs/) | Coordination platform for CVD involving reporters, vendors, and coordinators. | Real cross-stakeholder disclosure coordination. | Heavyweight incident coordination, not a 4-minute product demo for Tangled maintainers. |
| [OpenSSF CVD guides](https://openssf.org/groups/vulnerability-disclosures/) | Guidance, templates, and tooling advocacy for maintainers, consumers, researchers, and vendors. | Strong process legitimacy. | Guidance does not close the last-mile issue/PR/action gap inside an open code network. |
| [OpenSSF OSS-SIRT](https://github.com/ossf/SIRT) | Planned/active effort to provide neutral, maintainer-respecting incident response support for high-impact OSS vulnerabilities. | Validates the "maintainers need help under security pressure" problem. | Human coordination service, not forge-native protocol records. Tangled should complement it, not claim to replace it. |

Read: private disclosure and advisory publication are already mature on GitHub and in CVD practice. Tangled should not pitch "we publish advisories." The gap is after publication: targeted, evidenced, maintainer-respecting action across a decentralized code graph.

### 2. Advisory databases and machine-readable vulnerability records

| System | Workflow | Strength | Gap for Tangled |
| --- | --- | --- | --- |
| [GitHub Advisory Database](https://github.com/github/advisory-database) | Open database of CVEs and GitHub-originated advisories, stored in OSV format and used by Dependabot. | Excellent advisory corpus and ecosystem distribution. | Data is package/advisory centered. It does not know which Tangled maintainer should review a fix request or whether a generated PR has earned attention. |
| [OSV.dev](https://osv.dev/) and [OSV schema](https://ossf.github.io/osv-schema/) | Distributed vulnerability database and common schema for precise package versions or commit hashes. | Best open cross-ecosystem vulnerability metadata substrate. Covers GitHub Advisories, PyPI, Go, Rust, Drupal, OSS-Fuzz, malicious packages, Maven, npm, NuGet, PyPI, RubyGems, Linux, and more. | OSV answers "is this package/version affected?" It does not carry project social context, vouches, owner attention, or Tangled issue/PR actions. |
| [Python Packaging Advisory Database / pip-audit](https://pypi.org/project/pip-audit/) | `pip-audit` scans Python environments and requirements files using PyPI advisory data and OSV. | Good Python-specific audit and fix path, including machine-readable output and `--fix`. | Dependency audit, not maintainer recall. Its own security model warns it is not static analysis or malicious-package defense. |
| [npm audit](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/) | Sends dependency descriptions to the registry and returns vulnerability reports plus suggested patches when available. | Extremely familiar JS ecosystem workflow. | Command-line dependency audit. It may tell a consumer to update or open an issue upstream, but it does not create trust-scoped Tangled actions. |
| [Maven Central / OSS Index](https://central.sonatype.org/news/20210510_new-security-capabilities/) | Sonatype vulnerability intelligence for Maven artifacts and broader open-source components. | Strong enterprise/dependency intelligence. | Maven/SCA domain, not open forge collaboration state. |
| [OpenSSF Malicious Packages](https://github.com/ossf/malicious-packages) and [Package Analysis](https://openssf.org/package-analysis/) | Detect/report malicious packages and publish reports in OSV format. | Strong "ecosystem immune sensor" analogue. | Detection/reporting layer. The affected downstream repo action still lives elsewhere. |

Read: vulnerability data is increasingly standardized and multi-ecosystem. Tangled should consume and cite OSV/GHSA-style records instead of inventing a new vulnerability database.

### 3. Downstream alerts, scanners, and fix PRs

| System | Workflow | Strength | Gap for Tangled |
| --- | --- | --- | --- |
| [Dependabot alerts](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts) | Alerts when a new advisory lands or the dependency graph changes; shows affected file, severity, and fixed version. | Mature repo-specific notification for supported ecosystems. | GitHub-bound and dependency-graph-bound. It does not cover Tangled cross-knot state, vouches, project memory, or arbitrary source-level recalls. |
| [Dependabot security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates) | Opens PRs to minimum patched versions when possible; reports errors when it cannot safely update. | The canonical targeted dependency fix PR. | This is the key "do not duplicate" player. Tangled recall must not look like Dependabot with AT labels. |
| [Renovate](https://docs.renovatebot.com/configuration-options/) / [Mend Renovate](https://www.mend.io/renovate/) | Scans dependency files, creates configurable update PRs across many ecosystems, and can read GitHub vulnerability alerts. | Open-source, broad package-manager support, highly configurable. | Already owns dependency update automation. Tangled should use Renovate-like PRs as evidence or contrast, not the product. |
| [Snyk fix PRs](https://docs.snyk.io/scan-fix-and-prevent/fix/snyk-pull-or-merge-requests) | Creates automatic/manual PRs for supported ecosystems when fixes are available. | Mature commercial SCA and remediation workflow. | Vendor platform and SCM integrations. No public ATProto reviewability receipt or web-of-trust semantics. |
| [OSV-Scanner guided remediation](https://google.github.io/osv-scanner/experimental/guided-remediation/) | Suggests prioritized remediation steps and can modify manifests/lockfiles for supported npm and Maven cases. | Open, technically credible, explains why options were chosen. | Fixes dependency graphs, not social maintainer workflow. Also experimental. |
| [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/) | SCA utility for detecting publicly disclosed vulnerable dependencies. | Longstanding open-source scanner. | Scanner only. It does not decide review reach or generate protocol evidence. |
| [Dependency-Track](https://docs.dependencytrack.org/) | SBOM-based component analysis platform for finding vulnerabilities and enforcing policy. | Strong organizational inventory and risk platform. | Enterprise portfolio risk, not open-network maintainer action. |
| [GUAC](https://openssf.org/projects/guac/) | Ingests SBOMs and metadata into a graph of software relationships. | Closest open graph substrate for "which artifact affects which software?" | Artifact graph, not forge action. Could inspire Tangled's affected-repo matching, but not replace the review workflow. |

Read: the dependency-remediation lane is crowded and good. A Tangled recall idea wins only if it handles the missing social/action layer, especially for maintainers receiving fix requests.

### 4. VEX, exploitability, and "not affected" statements

| System | Workflow | Strength | Gap for Tangled |
| --- | --- | --- | --- |
| [OpenVEX](https://openssf.org/projects/openvex/) | Minimal JSON-LD implementation of Vulnerability Exploitability Exchange. | Strong machine-readable way to state product impact. | Product/artifact statement, not maintainer action queue. |
| [OpenVEX spec](https://github.com/openvex/spec/blob/main/OPENVEX-SPEC.md) | Statements include affected/not affected/fixed/under investigation style status, with required justifications for `not_affected` and action statements for `affected`. | Exactly the shape Tangled should copy for "skip because safe" or "action needed" records. | VEX by itself does not deliver the request to a Tangled maintainer, attach vouches, or create an issue/PR. |
| [OSV-Scanner V2 VEX plans](https://blog.google/security/announcing-osv-scanner-v2-vulnerability/) | Google notes VEX support as a next direction for vulnerability communication and collaboration. | Confirms VEX is the direction for reducing vulnerability noise. | Still scanner/remediation-layer, not code-collaboration social state. |

Read: Tangled should borrow VEX semantics for `affected`, `not affected`, `fixed`, and `under investigation`, but attach them to repo DIDs, issues, PRs, spindles, and maintainer decisions.

### 5. Prioritization and security posture systems

| System | Workflow | Strength | Gap for Tangled |
| --- | --- | --- | --- |
| [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | Public catalog of known exploited vulnerabilities, with remediation due dates for FCEB agencies under BOD 22-01. | Strong emergency-broadcast precedent: exploited, deadline, act now. | Applies to organizations and assets, not OSS repo maintainers or Tangled PR review. |
| [EPSS](https://www.first.org/epss/) | Daily 0-1 probability that a CVE will be exploited in the wild in the next 30 days. | Good prioritization signal for scarce remediation attention. | Risk score, not action. Also CVE-centered, not repo-specific. |
| [OpenSSF Scorecard](https://github.com/ossf/scorecard) | Automated security checks scored 0-10 with project goals and explicit non-goals. | Useful posture evidence and remediation hints. | Scorecard warns its checks are heuristics with false positives/negatives. It should be an evidence chip, not a Tangled trust verdict. |
| [OpenSSF Allstar](https://github.com/ossf/allstar) | GitHub app that monitors org/repo security policies, creates issues, and can revert some settings. | Closest "targeted issue creation for security posture" open-source analogue. | GitHub policy enforcement, not advisory recall. Could inspire "targeted issue, not mass PR" posture. |

Read: prioritization and posture signals are abundant. Tangled should avoid becoming another score dashboard. It should turn signals into clear, accountable maintainer actions.

### 6. Domain-specific recall and virtual patching

| System | Workflow | Strength | Gap for Tangled |
| --- | --- | --- | --- |
| [Patchstack vulnerability database](https://patchstack.com/database) | Hand-curated WordPress vulnerability intelligence. | Strong vertical intelligence and disclosure network. | WordPress/plugin ecosystem, not general code forge. |
| [Patchstack managed VDP](https://patchstack.com/for-plugins/) | Managed vulnerability disclosure program for plugin/theme developers. | Clear intermediary role for overwhelmed OSS vendors. | Service/intermediary, not protocol-native collaboration records. |
| [Patchstack virtual patching](https://patchstack.com/articles/virtual-patching/) | Ships WAF-style mitigation rules without changing vulnerable source code. | Great recall analogue: protect now while waiting for upstream fix. | Runtime mitigation for websites, not source-level Tangled issue/PR action. |
| [Sonatype Golden PRs](https://www.sonatype.com/blog/golden-pull-requests-automating-trusted-remediation-without-breaking-builds) | Policy-compliant, non-breaking remediation PRs. | Strong enterprise version of "trusted remediation PR." | Vendor SCA lane. Tangled should not compete on dependency upgrade quality. |

Read: the best commercial players either own vulnerability intelligence, fix PR quality, or runtime mitigation. Tangled's wedge is neither database nor scanner nor WAF; it is open collaboration state and review reach.

## Map Of Recall / Advisory Workflows

### Workflow A: Maintainer-owned private advisory

1. Researcher reports privately.
2. Maintainer accepts, asks questions, or rejects.
3. Maintainer collaborates on fix in private.
4. Maintainer requests CVE/GHSA if appropriate.
5. Maintainer publishes advisory after patch.
6. Advisory enters GHSA/OSV/NVD/package feeds.
7. Downstream scanners and dependency bots notify consumers.

Strong today:

- GitHub Security Advisories.
- CERT/VINCE for complex multi-vendor coordination.
- OpenSSF CVD guidance.

Weak today:

- Cross-forge portability of discussion and evidence.
- Project trust context around who reported, who validated, and who should act.
- Converting advisory publication into targeted, maintainable repo actions outside dependency updates.

Tangled implication:

- Do not build private disclosure.
- Build the public/semipublic action layer after a disclosure: `advisory -> affected repo DID -> action with receipts`.

### Workflow B: Package advisory to downstream alert

1. Advisory appears in GitHub Advisory Database, OSV, PyPI DB, npm audit feed, Go/Rust/PyPA/etc.
2. Scanner maps affected package/version against manifest or lockfile.
3. Alert is shown in repo security tab, CLI, CI, or dashboard.
4. Fix version is suggested if available.
5. Bot may open dependency bump PR.

Strong today:

- Dependabot alerts and security updates.
- Renovate vulnerability PRs.
- npm audit and pip-audit.
- OSV-Scanner guided remediation.
- Snyk/Sonatype commercial fix PRs.

Weak today:

- Dependency-only matching leaves out source patterns, configuration patterns, and "you copied this vulnerable helper" cases.
- Transitive fix PRs can fail or require parent updates.
- Alerts do not know maintainer context: release freeze, trust, issue history, vouches, project decisions, or whether a fix request is spam.
- False positives and non-exploitable findings create fatigue unless VEX/reachability/risk signals are used.

Tangled implication:

- If Recall Network is just dependency bump PRs, kill it.
- If it creates a Tangled action passport that explains `why this repo`, `who says`, `what evidence`, and `what to do`, it is differentiated.

### Workflow C: VEX / "not affected" triage

1. Vulnerability applies to a component.
2. Product/project decides whether the exact usage is affected.
3. A VEX statement says affected, not affected, fixed, or under investigation.
4. Tools ingest the statement to reduce false positives or prioritize action.

Strong today:

- OpenVEX gives compact machine-readable impact statements.
- VEX handles the most important anti-noise path: "this CVE exists but does not matter here."

Weak today:

- VEX is usually artifact/product oriented.
- It is not naturally a maintainer conversation or PR-review object.
- It may not carry social proof of who made the call and why a project trusts them.

Tangled implication:

- Add `Mark not affected` as a first-class recall action in the demo.
- Show a VEX-like receipt linked to a spindle result or maintainer comment.
- This is more interesting than opening three PRs.

### Workflow D: Mass remediation / bulk PR campaign

1. Researcher or tool finds a widespread pattern across many repos.
2. A campaign creates issues or PRs across dozens/hundreds/thousands of projects.
3. Maintainers must decide whether the campaign is legitimate, safe, and worth reviewing.

Strong today:

- Bulk PR campaigns have precedent in security research.
- OpenSSF Autofix SIG explicitly targets automated, repeatable reporting and disclosure campaigns that may interact with dozens to hundreds of maintainers.
- Allstar creates issues when policy violations are found.

Weak today:

- This can look like spam, especially in the AI era.
- Maintainers lack a compact trust/evidence object for the campaign.
- There is no common "campaign identity + scope + evidence + opt-out + status" protocol object across forges.

Tangled implication:

- This is the strongest recall-specific gap.
- A Tangled recall request should have campaign identity, reporter DID, sponsor/vouch, scope, exact evidence, action, and opt-out/mark-safe path.
- This is basically Patch Passport for security campaigns.

### Workflow E: Malicious-package detection and ecosystem alarm

1. Package-analysis systems watch registries for suspicious behavior.
2. Malicious packages are reported and represented in OSV-compatible records.
3. Registries, scanners, and security tools use those records to warn users.

Strong today:

- OpenSSF Package Analysis and Malicious Packages are close to a real immune sensor.
- OSV format lets reports flow into scanners.

Weak today:

- The action path still targets package consumers, not maintainers deciding issue/PR review.
- If a malicious package was copied, vendored, or used in a Tangled repo, the protocol action is not automatic.

Tangled implication:

- Good source for demo seed data, but too much to implement.
- Use only as evidence that "ecosystem sensors exist; Tangled can be the action layer."

## The Last-Mile Maintainer Action Gap

The gap is not "we need more vulnerability feeds." The ecosystem already has many.

The gap is:

> How does a maintainer receive a targeted security request that is specific, trusted, non-spammy, reviewable, and actionable in their actual code collaboration workflow?

Current systems often answer one of these questions:

- Is this package/version vulnerable?
- Is there a fixed version?
- Is this CVE exploited in the wild?
- Is this dependency in my manifest?
- Can a bot bump this lockfile?
- Can I state not affected?
- Is this repo following security best practices?

The missing bundled object answers all of these at once:

- Who is sending this recall?
- Why do they think this repo is affected?
- Which exact dependency, file path, call pattern, issue, or comment is the evidence?
- Is this repo actually affected, fixed, not affected, or under investigation?
- Is there a focused patch or test?
- Who vouches for the reporter/campaign/agent?
- What is the maintainer's next action?
- What public protocol records back the request?
- How do other maintainers avoid duplicate work or duplicate spam?

That is Tangled-shaped.

## Closest Adjacent Players

### Directly adjacent

1. **Dependabot security updates** - direct targeted fix PRs for vulnerable dependencies. Strongest "do not duplicate" reference.
2. **Renovate vulnerability alerts** - open-source, configurable, multi-ecosystem dependency update PRs.
3. **Snyk / Sonatype** - mature commercial "scan, prioritize, fix PR" workflows.
4. **OSV / OSV-Scanner** - open vulnerability metadata and remediation path.
5. **OpenVEX** - impact statement vocabulary for affected/not affected/fixed.
6. **OpenSSF Autofix SIG** - explicit work on automated disclosure/fix campaigns to dozens or hundreds of maintainers.
7. **OpenSSF OSS-SIRT** - validates the need for neutral, maintainer-respecting incident response.
8. **Allstar** - creates targeted GitHub issues for security policy violations.
9. **Patchstack** - vertical vulnerability disclosure, vulnerability database, and virtual patching for WordPress.
10. **CERT/VINCE** - heavyweight coordinated vulnerability disclosure collaboration.

### Adjacent but not exact

1. **CISA KEV and EPSS** - prioritization signals, not maintainer workflow.
2. **Scorecard** - posture signal, not recall or PR action.
3. **Dependency-Track and GUAC** - graph/inventory systems, not forge-native review.
4. **npm audit / pip-audit / Dependency-Check** - local/CI scanners, not social action.
5. **OpenSSF Malicious Packages / Package Analysis** - ecosystem sensors, not maintainer action surfaces.
6. **GitHub Advisory Database / NVD / ecosystem advisory DBs** - source data, not interaction workflow.

## Tangled-Native Product Shape

Working name:

> **Security Recall Passport**

Broader mode name:

> **OSS Emergency Broadcast**

Avoid as primary:

- `OSS Recall Network` if it sounds like auto-spam.
- `Security immune system` if it implies automatic detection or punishment.
- `Emergency broadcast` if the demo cannot show targeted, calm maintainer action.

Core object:

```text
Recall request = advisory intent + affected-repo evidence + trust + action + AT URI receipts
```

Possible seeded fields:

- `advisory`: GHSA/OSV/CVE or custom `app.sunstead.securityRecall` preview.
- `publisher`: DID/handle of security maintainer, CNA, researcher, or agent.
- `sponsor`: vouched human or org standing behind the campaign.
- `affected predicate`: package/version, file path, API call, config pattern, copied helper, or test failure.
- `repo subject`: repo DID, knot, branch, and source AT URI.
- `state`: `affected`, `not affected`, `fixed`, `under investigation`.
- `evidence`: dependency manifest, source line, issue/comment, previous patch, spindle run, VEX-like statement.
- `action`: open issue, open patch draft, request maintainer review, mark safe, run spindle, mute duplicate campaign.
- `trust`: vouches/denounces for publisher or campaign in maintainer's circle.
- `receipt`: AT URIs for advisory, issue, pull, comment, vouch, spindle, repo.

Tangled primitives that make it real:

- Appview/firehose can see issue, pull, comment, vouch, and PR records.
- Repo DIDs and knots make affected repos visible across hosting boundaries.
- Vouch hats and PDS records put trust at the point of interaction.
- Spindles can run focused checks and produce evidence.
- Agents can create PR records by writing to a PDS.
- AT URIs make the recall evidence inspectable instead of hidden in a vendor dashboard.

## Demo Flow If Sponsor Likes Recall

Setup:

- Security maintainer: `@sana.sec`
- Repo maintainer: `@mira.tangled.sh`
- Repo cluster: three Tangled repos on different knots.
- Advisory: `Webhook replay advisory`
- Actor: `@sana.sec` publishes a recall request, vouched by `@mira.tangled.sh` or another trusted maintainer.

Four-minute flow:

1. Sana publishes a recall: `Webhook replay windows under 5 minutes can be bypassed`.
2. The appview-style screen shows three affected repo DIDs:
   - `solar-knot/payments`: affected by source pattern and linked old comment.
   - `atlas-shop/webhooks`: affected by vulnerable dependency version.
   - `demo-ledger/events`: not affected because a spindle proves the risky code path is absent.
3. Each repo gets a different targeted action:
   - issue only: "please confirm replay-window behavior."
   - patch draft: focused fix with regression test.
   - no action: VEX-like `not affected` receipt with spindle evidence.
4. Mira opens the patch draft. It has a Recall Passport:
   - Sana DID and advisory record.
   - affected evidence.
   - test added.
   - spindle result.
   - vouch from Mira's circle.
   - AT URI receipt chain.
5. Mira reviews the patch or posts a Tangled comment:
   `This recall applies to our webhook verifier. Reviewing the focused fix. Evidence: ...`

Best demo moment:

> One advisory does not spam every repo. Tangled creates the right action for each repo: issue, patch, or verified no-action, all with receipts.

## Why This Is Not A Better Main Idea Than Patch Passport

Patch Passport wins as the primary hackathon pitch because:

- It is closer to Tangled's explicit sponsor signal: agents can create PR records, and vouching responds to LLM slop.
- It is legible in under 20 seconds: two AI PRs, one has receipts, one does not.
- It needs less explanation than security advisory ecosystems.
- It can show Tangled primitives in the first minute without pretending to scan the world.
- It avoids competing with mature advisory and SCA tools.
- It is emotionally broader: every maintainer has review overload, while security recall is high-stakes but narrower.

Recall Network wins only under a specific sponsor signal:

- Sponsor says cross-repo coordination is the most exciting Tangled primitive.
- Sponsor wants appview/firehose/repo DID proof more than agent PR proof.
- We can seed affected-repo evidence so clearly that it does not look fake.
- We can avoid looking like Dependabot, Snyk, or OSV-Scanner.

Best synthesis:

> Patch Passport is the product. Recall Network is the most compelling security mode inside it.

## T/A/P Update

| Candidate | T | A | P | Verdict |
| --- | ---: | ---: | ---: | --- |
| Tangled Review / Patch Passport | 20 | 98 | 78 | Still strongest mainline. Direct sponsor fit, lowest demo risk, broadest maintainer pain. |
| Security Recall Passport as Patch Passport mode | 23 | 96 | 73 | Strong. Adds high-stakes advisory intent without abandoning the receipt model. |
| Tangled Immune System with recall lane | 26 | 95 | 69 | Memorable wrapper if carefully phrased as review reach, not punishment. |
| Standalone OSS Emergency Broadcast / Recall Network | 33 | 96 | 63 | High amplitude but higher matching, source-data, and explanation risk. |
| Generic advisory scanner / dependency PR bot | 55 | 65 | 10 | Kill. Dependabot/Renovate/Snyk/OSV already own this surface. |

Evidence that would lower Recall Network T:

- Sponsor explicitly prefers cross-repo coordination over a one-repo PR passport.
- We can show a seeded Tangled action for each state: `affected`, `not affected`, `fixed`, `under investigation`.
- We can preview a custom recall/advisory record without relying on live write success.
- A mentor can repeat the pitch after 20 seconds without mentioning Dependabot.

Evidence that would raise Recall Network T:

- The demo requires explaining CVE/GHSA/OSV/VEX before showing Tangled.
- Affected-repo matching looks fake.
- The generated PRs feel like mass spam.
- The UI becomes a dashboard of vulnerabilities instead of a maintainer action surface.
- Sponsor wants agentic PRs and vouching rather than security response.

## Kill Conditions

Kill standalone Recall Network if:

1. It cannot show Tangled/ATProto primitives in the first minute.
2. It reads as "Dependabot for Tangled."
3. It claims real vulnerability detection, exploitability, or ecosystem crawl without proof.
4. It creates multiple automatic PRs without maintainer consent.
5. It turns security urgency into noisy red-alert theater.
6. It requires live private disclosure, CVE, GHSA, OSV, or package-registry integration for the judged happy path.

Keep recall as a second beat if:

1. It is framed as a recall passport, not a scanner.
2. It produces issues/PRs/comments with receipts.
3. It includes a `not affected` path.
4. It uses vouches/reporter identity to avoid AI slop security reports.
5. It remains calm, targeted, and maintainer-controlled.

## Recommendation To Synthesis

Use Iota as a sharpening pass, not a pivot.

Recommended main pitch:

> Tangled Review Passport makes patches earn review with identity, intent, tests, trust, and protocol evidence.

Recommended security line:

> When the intent is an emergency advisory, the same passport becomes a recall network: Tangled turns one advisory into targeted issues, patches, or verified no-action receipts across repo DIDs.

Recommended demo structure:

1. Lead with Patch Passport for AI PRs.
2. Add one security-advisory card as a high-stakes example:
   - `Intent: GHSA/OSV webhook replay advisory`
   - `Why this repo: dependency + file path + previous comment`
   - `Action: focused patch with test`
   - `Trust: vouched publisher`
   - `Receipt: AT URIs`
3. Mention future network mode in the close:
   `The same receipt model scales from AI PRs to security recalls across Tangled's network.`

Do not make Recall Network the headline unless sponsor specifically asks for cross-repo coordination.

## Source Notes

Tangled / AT Protocol:

- Tangled challenge file: `TANGLED_CHALLENGE_INFO.txt`
- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- Tangled docs: https://docs.tangled.org/single-page
- AT Protocol overview: https://atproto.com/guides/overview
- AT Protocol repository spec: https://atproto.com/specs/repository

Advisory and disclosure workflows:

- GitHub Repository Security Advisories: https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/repository-security-advisories
- GitHub Advisory Database docs: https://docs.github.com/en/code-security/concepts/vulnerability-reporting-and-management/github-advisory-database
- GitHub Advisory Database repo: https://github.com/github/advisory-database
- GitHub private vulnerability reporting: https://docs.github.com/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository
- CERT/CC VINCE docs: https://certcc.github.io/VINCE-docs/
- CERT CVD guide: https://certcc.github.io/CERT-Guide-to-CVD/
- OpenSSF Vulnerability Disclosures WG: https://openssf.org/groups/vulnerability-disclosures/
- OpenSSF Autofix SIG / OSS-SIRT note: https://openssf.org/blog/2023/07/27/openssf-vulnerability-disclosures-working-group-helps-guide-and-automate-handling-risk/
- OpenSSF OSS-SIRT: https://github.com/ossf/SIRT

Vulnerability data, scanners, and remediation:

- OSV: https://osv.dev/
- OSV data sources: https://google.github.io/osv.dev/data/
- OSV schema: https://ossf.github.io/osv-schema/
- OSV-Scanner guided remediation: https://google.github.io/osv-scanner/experimental/guided-remediation/
- OSV-Scanner V2: https://blog.google/security/announcing-osv-scanner-v2-vulnerability/
- Dependabot alerts: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts
- Dependabot security updates: https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates
- Renovate vulnerability alerts config: https://docs.renovatebot.com/configuration-options/
- Mend Renovate: https://www.mend.io/renovate/
- Snyk pull or merge requests: https://docs.snyk.io/scan-fix-and-prevent/fix/snyk-pull-or-merge-requests
- npm audit: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/
- pip-audit: https://pypi.org/project/pip-audit/
- PSF Advisory Database: https://github.com/psf/advisory-database
- Maven Central security capabilities: https://central.sonatype.org/news/20210510_new-security-capabilities/
- OWASP Dependency-Check: https://owasp.org/www-project-dependency-check/
- Dependency-Track: https://docs.dependencytrack.org/
- GUAC: https://openssf.org/projects/guac/

VEX, priority, posture, and ecosystem sensors:

- OpenVEX project: https://openssf.org/projects/openvex/
- OpenVEX spec: https://github.com/openvex/spec/blob/main/OPENVEX-SPEC.md
- CISA KEV catalog: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- EPSS: https://www.first.org/epss/
- OpenSSF Scorecard: https://github.com/ossf/scorecard
- Scorecard GitHub Action announcement: https://openssf.org/blog/2022/01/19/reducing-security-risks-in-open-source-software-at-scale-scorecards-launches-v4/
- OpenSSF Allstar: https://github.com/ossf/allstar
- OpenSSF Package Analysis: https://openssf.org/package-analysis/
- OpenSSF Malicious Packages: https://github.com/ossf/malicious-packages
- Patchstack database: https://patchstack.com/database
- Patchstack managed VDP: https://patchstack.com/for-plugins/
- Patchstack virtual patching: https://patchstack.com/articles/virtual-patching/
- Sonatype Golden PRs: https://www.sonatype.com/blog/golden-pull-requests-automating-trusted-remediation-without-breaking-builds
