# Agent Theta: Maintainer Pain, AI Slop, and Review Economics

> **Agent:** theta  
> **Mission:** maintainer pain, AI slop discourse, contributor overload, review economics, security maintainer burden  
> **Date checked:** 2026-06-24  
> **Status:** COMPLETE  
> **Navigator position:** emerging and aligned; the pain is cold enough to ground the Review/Patch Passport frame.

## Local Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Current local idea direction: **Tangled Review Passport** as the platform frame; **Patch Passport for AI PRs** as the first demo.
- Core demo flow to support: a maintainer sees two plausible AI PRs and chooses which one deserves review because one carries identity, intent, tests, trust, and protocol receipts.
- Intentionally cut: generic AI code review, AI-detection claims, universal trust scores, auto-blocking, auto-merge, and any workflow that looks like GitHub with Tangled labels.

Known unknowns before large implementation:

- Presenter and preferred pitch style are still unknown.
- Exact submission rules, team limits, and whether Tangled prefers custom lexicons or existing `sh.tangled.*` records only are still unknown.
- Live write reliability at judging is unknown; the demo should have seeded fallback data.

## Executive Verdict

The maintainer pain is not "we need a smarter bot to comment on PRs."

The pain is:

> AI made patches cheap, but it did not make review, trust, or accountability cheap.

GitHub's own platform response now validates this. On 2026-06-18, GitHub introduced pull request limits and said monthly merged PR volume grew from about **25 million in January 2023** to **more than 90 million** by mid-2026, roughly **3.6x**. GitHub's post says the problem maintainers report is too many incoming PRs, low-quality noise, and too few controls for contribution flow. It also says PRs opened by Copilot or another AI agent count toward limits, and trusted contributors can be placed on a bypass list without granting write access. Source: [GitHub Blog, "How pull request limits are cutting down the noise"](https://github.blog/open-source/maintainers/how-pull-request-limits-are-cutting-down-the-noise/).

Tangled has already named the same pressure from its own angle: vouching exists partly because maintainers face LLM-generated submissions that can look plausible while still being subtly wrong. Source: [Tangled vouching](https://blog.tangled.org/vouching/).

That is almost exactly Tangled's wedge:

> Submission can stay open. Review reach must be earned.

The best Tangled-native answer is not a gate that bans AI. It is a receipt system that lets maintainers decide, before reading the whole diff, whether a patch has earned scarce attention.

## The Pain Map

| Pain | Evidence | Maintainer translation | Tangled implication |
| --- | --- | --- | --- |
| Creation cost collapsed; review cost did not. | GitHub says merged PR volume rose from about 25M/month in January 2023 to more than 90M/month in 2026, and frames this as "the cost to create outran the cost to review." | The queue got 3.6x louder, but maintainer hours did not 3.6x. | Build a review-reach layer, not another notification source. |
| Good work and low-quality work look identical in the queue. | GitHub's PR limits post says polished changes and rough drafts land in the same queue; limits force contributors to prioritize before reaching maintainers. | The maintainer's first job is not code review; it is triage under uncertainty. | `Ready / Missing receipts / Cool down` lanes are legible and sponsor-native. |
| AI slop is expensive because it looks plausible. | Seth Larson says low-quality LLM security reports can look legitimate at first glance and require time to refute. Daniel Stenberg says better-looking bad reports take longer to discard. | Old spam was obvious. AI slop arrives dressed as work. | Do not claim AI detection. Require provenance, issue intent, tests, sponsor, and vouch evidence. |
| Security reports are a worse version of the same problem. | Python and curl maintainers describe false security reports as stressful, private, and costly. curl is pausing vulnerability report intake for July 2026. | Security work preempts everything, even when the report is nonsense. | Security PRs need stronger receipts: reporter identity, advisory intent, proof, tests, and trusted context. |
| Maintainers are already underfunded and burned out. | Tidelift's 2024 maintainer report says 60% of respondents are unpaid hobbyists. Tidelift's 2023 survey reported 58% had quit or considered quitting. | The system is asking volunteers to absorb the cost of machine-generated volume. | Pitch attention preservation as maintainer welfare, not moderation. |
| Maintainers distrust AI-generated contributions, but are not anti-AI. | Tidelift found 48% of maintainers had used AI coding tools, while 64% were less willing to review known AI-generated contributions. 45% said willingness depended on factors such as contributor or LLM reputation. | Maintainers are not rejecting tools. They are rejecting ownerless work. | Patch Passport should say "AI welcome when accountable." |
| Trust in unknown contributors is more fragile after supply-chain attacks. | Tidelift found 66% of maintainers were less trusting of unknown contributors after xz, while only 13% had formal standards for vetting new contributors. | Everybody wants vetting, but few projects have tooling to do it cleanly. | Tangled vouches/denounces and DIDs can make vetting visible without global scores. |
| Major projects are writing explicit AI contribution policies. | LLVM requires human-in-the-loop review before asking maintainers to review LLM-generated work, labels unreviewed LLM output an "extractive contribution," and bans autonomous agents posting without human approval. Ghostty requires AI disclosure and human understanding. | The emerging norm is accountability, not prohibition. | Passport fields should mirror policy: disclosure, human sponsor, ability to explain, evidence of self-review. |
| Pull request review is social judgment, not just static analysis. | Modern code review research has long treated review as defect finding plus knowledge transfer, design discussion, and project coordination. | A passing test or AI review comment does not answer "should I spend time on this?" | Project memory and maintainer precedent should be receipt fields. |
| Cross-repo spray is a network problem. | GitHub says per-repo caps do not solve contributors opening PRs across hundreds of repositories and is exploring cross-repository controls. | Abuse and low-evidence contribution patterns are network-shaped. | Tangled's protocol graph, firehose, DIDs, and vouch records are the right substrate. |

## Sponsor-Specific Signal

Tangled's own vouching post is unusually good evidence for this challenge. It means the pitch does not have to persuade the sponsor that AI-era trust is real from scratch. The sponsor has already published the premise.

What theta adds is the broader proof:

- GitHub is responding with PR limits and bypass lists.
- Tidelift shows maintainers use AI but distrust ownerless AI contributions.
- Python/curl security maintainers show that plausible slop is more expensive than obvious spam.
- LLVM/Ghostty show the emerging policy norm: AI is acceptable when a human stands behind it and the work is reviewed before asking maintainers for review.

So the sponsor-native frame is:

> Vouching helps decide who gets social reach. Review Passport helps decide which patch gets review reach.

## Memorable Phrases To Reuse

- AI made code cheap. It did not make trust cheap.
- A pull request is a request for someone else's scarce time.
- Spam used to look like spam. AI slop looks like homework for a maintainer.
- Submission is open. Review reach is earned.
- Maintainers do not need more confident comments. They need evidence before attention.
- GitHub can limit volume. Tangled can make reviewability portable.
- The bottleneck moved from code generation to attention allocation.
- Tests say "this ran." Receipts say "this deserves review."
- Do not score people. Show receipts.
- The future forge needs customs, not another conveyor belt.

## Evidence Notes

### 1. GitHub has made review overload a platform feature

GitHub's June 2026 PR-limits post is the single strongest mainstream validation. It explicitly says:

- creating PRs is easier than ever, while human review still takes real time;
- GitHub is adding persistent, configurable pull request limits;
- Copilot or other AI-agent PRs count toward those limits;
- trusted contributors can bypass limits without getting write access;
- a smaller pool helps good work stand out;
- future work includes issue limits, smarter bypass signals, and cross-repository controls.

Short fair-use quote to reuse:

> "Creating a pull request has never been easier."

This is the judge-friendly problem statement. GitHub is solving it with caps. Tangled can solve it with **reviewability receipts**.

Source: [GitHub Blog, 2026-06-18](https://github.blog/open-source/maintainers/how-pull-request-limits-are-cutting-down-the-noise/).

### 2. Tidelift quantifies maintainer fragility

Useful statistics from Tidelift's maintainer survey work:

- The 2024 report surveyed more than 400 maintainers and says **60%** identify as unpaid hobbyists.
- The 2024 report says **48%** had used AI-based coding tools or LLMs for maintainer work.
- The same report says **64%** would be less willing to review contributions known to be AI-generated.
- It also says **45%** might review AI-generated contributions depending on factors such as contributor or LLM reputation, while a minority would not under any circumstance.
- After the xz attack, **66%** reported being less trusting of unknown contributors; only **13%** reported formal standards for vetting new contributors.
- Tidelift's 2023 survey reported **58%** of maintainers had quit or considered quitting open-source maintenance.

Interpretation:

> The blocker is not AI usage. The blocker is ownerless, unvetted, context-free AI work landing in an underfunded queue.

Sources:

- [2024 Tidelift State of the Open Source Maintainer Report](https://assets-eu-01.kc-usercontent.com/ef593040-b591-0198-9506-ed88b30bc023/d325a56f-05be-4379-bfd1-ee4776fcad41/2024-tidelift-state-of-the-open-source-maintainer-report-.pdf)
- [Tidelift maintainer survey on quitting](https://tidelift.com/blog/over-half-of-open-source-maintainers-have-considered-quitting)

### 3. Security maintainers show the extreme version

Seth Larson, who triages security reports for CPython, pip, urllib3, Requests, and other projects, describes a rise in low-quality, spammy, LLM-hallucinated security reports. The important detail is not that AI is involved; it is that reports are plausible enough to require human refutation and private enough to isolate the maintainer.

Short fair-use quote:

> "appear at first-glance to be potentially legitimate"

Larson's platform asks are also directly relevant: rate-limit abusive report creation, expose low-quality reports so communities can coordinate, remove perverse incentives, and pay experienced maintainers to review campaigns before sending them.

Source: [Seth Larson, "New era of slop security reports for open source"](https://sethmlarson.dev/slop-security-reports).

Daniel Stenberg's curl posts sharpen the same point:

- curl's bug bounty had paid more than **$70,000**, received **415** vulnerability reports, and confirmed **64** security problems as of January 2024.
- Stenberg says the harder problem is well-written bad reports, because a human has to inspect and discard them.
- In June 2026 curl announced it will not accept vulnerability reports during July 2026, calling it the "curl summer of bliss."
- curl's vulnerability disclosure policy now tells reporters not to paste massive AI-generated explanations and says clear writing reduces maintainer burden.

Sources:

- [Daniel Stenberg, "The I in LLM stands for intelligence"](https://daniel.haxx.se/blog/2024/01/02/the-i-in-llm-stands-for-intelligence/)
- [Daniel Stenberg, "curl summer of bliss"](https://daniel.haxx.se/blog/2026/06/15/curl-summer-of-bliss/)
- [curl vulnerability disclosure policy](https://curl.se/dev/security.html)

### 4. Project AI policies are converging on "accountable human in the loop"

LLVM's policy is especially aligned with Review Passport. It says contributors may use tools, but must review generated code or text before asking others to review it, remain accountable as authors, label substantial tool-generated content, and be able to answer questions. It explicitly calls unreviewed LLM output an **"extractive contribution"** because it shifts work from contributor to reviewer.

Short fair-use quote:

> "scarce maintainer time"

Source: [LLVM AI Tool Use Policy](https://llvm.org/docs/AIToolPolicy.html).

Ghostty's policy is more blunt and demo-useful. It requires disclosure, says the human in the loop must understand the code, and frames strict rules as protecting maintainers rather than rejecting AI. It also says maintainers are exempt because they have already proven judgment.

Source: [Ghostty AI Usage Policy](https://github.com/ghostty-org/ghostty/blob/main/AI_POLICY.md).

Implication:

> Tangled should make the policy visible at PR intake: disclosed AI use, human sponsor, self-review evidence, tests, linked intent, and a maintainer-controlled action.

### 5. Review economics are older than AI

AI made the asymmetry louder, but the underlying economics are old:

- Modern code review is used for defects, design improvement, knowledge transfer, and shared project understanding, not only bug finding. See Bacchelli and Bird, [Expectations, Outcomes, and Challenges of Modern Code Review](https://doi.org/10.1145/2487085.2487122).
- Pull-request research has long shown that merge decisions depend on review latency, social/project factors, prior interaction, and project process, not only diff correctness. See Gousios et al., [An Exploratory Study of the Pull-Based Software Development Model](https://doi.org/10.1145/2597073.2597121), and follow-on work on pull-based development practices.

Inference:

> A passport cannot prove code is correct. Its job is narrower and more valuable for the demo: prove the patch has done enough homework to justify a maintainer's first 10 minutes.

## What Judges Will Instantly Understand

Use this frame in the pitch:

> Every maintainer has a queue. AI makes the queue bigger. The scarce resource is not code; it is trusted human review. Tangled Review Passport makes a patch bring receipts before it asks for that attention.

Then show one decision:

1. Two AI PRs both look plausible.
2. Both may pass tests.
3. One has agent DID, human sponsor, linked issue, focused test, spindle result, vouch evidence, and AT URI receipt chain.
4. The other has no stable identity, no issue, risky files, deleted tests, and no sponsor.
5. The maintainer does not "ban AI." They route:
   - complete passport -> `Ready to review`
   - missing evidence -> `Request missing receipts`
   - repeated low-evidence pattern -> `Cool down`

This is legible in under 30 seconds.

## Recommended Problem Framing

Primary:

> Maintainers need a trust-aware intake layer for AI-era pull requests.

More specific:

> Tangled Review Passport makes patches reviewable before they consume maintainer time.

AI wedge:

> Tangled Patch Passport makes AI-produced PRs carry identity, intent, tests, trust, and protocol receipts before maintainers spend review time.

Avoid:

- "AI slop detector"
- "trust score"
- "AI code review bot"
- "automatic spam filter"
- "AI-generated code blocker"

Why:

- Detection is unreliable and not Tangled-native.
- Scores feel punitive and dystopian.
- AI reviewers are crowded.
- Blocking fights open-source norms.
- Receipts preserve openness while making attention scarce.

## The Pain In One Demo Scene

Maintainer: Mira, maintainer of `solar-knot/payments`.

Context: release freeze, payment/auth risk, too many incoming PRs.

Queue:

- `PR #189: Fix webhook replay window` from `@rae.bot`.
- `PR #190: Refactor token validation` from `@temp-agent`.
- `PR #191: Docs typo cleanup` from a human contributor.

The two AI PRs look similar at first glance.

`PR #189` passport:

- agent DID and owner
- human sponsor DID
- linked Tangled issue
- focused test added
- passing spindle
- vouch from a maintainer's trust circle
- project-memory citation
- source AT URIs for pull, issue, comment, vouch, repo, and CI evidence

`PR #190` passport:

- no stable identity
- no linked intent
- touches auth code
- deletes a test
- no sponsor
- denounced low-evidence pattern

Maintainer action:

- `Review now` for #189.
- `Request missing receipts` for #190.

The emotional beat:

> Mira did not trust the AI. She trusted the receipts.

## Tangled-Native Fit

This is stronger on Tangled than on GitHub/GitLab because the receipt can be made from public protocol objects:

- DID and handle for agent identity.
- DID and handle for human sponsor.
- Pull record AT URI for the PR.
- Issue/comment records for intent and discussion.
- Vouch/denounce records for review reach.
- Repo DID and knot context for portability.
- Spindle/CI record for test evidence.
- PDS records for public, source-linked evidence.
- Firehose/appview for cross-repo or cross-network patterns.

GitHub's model is limit and bypass. Tangled's model can be:

> proof of reviewability as portable collaboration state.

## What To Build, Based On This Pain

Build:

- one tight maintainer queue with three lanes: `Ready`, `Missing receipts`, `Cool down`;
- one complete AI Patch Passport;
- one weak AI Patch Passport;
- one normal human PR as a control;
- a compact receipt chain using AT URI-looking source links;
- one maintainer action preview: `Request missing receipts`;
- one visible vouch/denounce signal, but no trust score.

Do not build:

- a diff reviewer;
- a model-provenance verifier;
- an AI detector;
- a reputation leaderboard;
- an auto-reject workflow;
- broad analytics.

## Sponsor Questions To Ask

- Should Tangled be the place where AI-generated and AI-assisted PRs arrive with receipts before review?
- Would you rather see this use only existing Tangled records, or is a custom `patchReceipt` lexicon interesting?
- Should vouching affect only review reach, or should it also affect issue/comment visibility in the demo?
- What record should be the hero object in the first minute: PR record, vouch record, spindle record, or a custom receipt?
- Is "Review Passport" or "Patch Passport" closer to Tangled's preferred language?

## Claim Temperatures

| Claim | T | A | P | Why |
| --- | ---: | ---: | ---: | --- |
| Maintainer attention is the central bottleneck. | 8 | 98 | 90 | GitHub, Tidelift, curl, Python, LLVM, Ghostty, and review research all point to review cost. |
| AI slop is best framed as accountability failure, not detection failure. | 14 | 96 | 82 | Maintainer discourse accepts AI use when a human understands and stands behind the work. |
| Tangled Review Passport is judge-legible in under 3 minutes. | 18 | 97 | 79 | The GitHub PR-limits analogy makes the problem obvious; Tangled records make the wedge visible. |
| Vouch/denounce should control review reach, not become a global trust score. | 16 | 92 | 76 | Preserves openness and avoids reputation-system backlash. |
| Security PR/report receipts are a strong second demo beat, not the first demo. | 24 | 90 | 66 | Very compelling pain, but more complex and easy to overclaim under hackathon time. |

## Source Inventory

Primary and high-signal sources checked on 2026-06-24:

- Tangled challenge brief: `TANGLED_CHALLENGE_INFO.txt`
- Local idea spine: `TANGLED_AI_PR_TRUST.md`, `TANGLED_ARCHETYPE_CONVERGENCE.md`, `TOP_IDEAS_PITCH.md`
- Tangled vouching: https://blog.tangled.org/vouching/
- GitHub PR limits: https://github.blog/open-source/maintainers/how-pull-request-limits-are-cutting-down-the-noise/
- Tidelift 2024 maintainer report PDF: https://assets-eu-01.kc-usercontent.com/ef593040-b591-0198-9506-ed88b30bc023/d325a56f-05be-4379-bfd1-ee4776fcad41/2024-tidelift-state-of-the-open-source-maintainer-report-.pdf
- Tidelift quitting survey article: https://tidelift.com/blog/over-half-of-open-source-maintainers-have-considered-quitting
- Seth Larson on slop security reports: https://sethmlarson.dev/slop-security-reports
- Daniel Stenberg on AI security reports: https://daniel.haxx.se/blog/2024/01/02/the-i-in-llm-stands-for-intelligence/
- Daniel Stenberg on curl summer of bliss: https://daniel.haxx.se/blog/2026/06/15/curl-summer-of-bliss/
- curl vulnerability disclosure policy: https://curl.se/dev/security.html
- LLVM AI Tool Use Policy: https://llvm.org/docs/AIToolPolicy.html
- Ghostty AI Usage Policy: https://github.com/ghostty-org/ghostty/blob/main/AI_POLICY.md
- OpenSSF Alpha-Omega: https://github.com/ossf/alpha-omega
- Bacchelli and Bird, modern code review: https://doi.org/10.1145/2487085.2487122
- Gousios et al., pull-based development model: https://doi.org/10.1145/2597073.2597121

## Bottom Line For Synthesis

Theta's recommendation:

> Keep **Tangled Review Passport** as the platform name and demo **Patch Passport for AI PRs**. The maintainer pain is strongest when framed as review reach under cheap-generation pressure. Tangled should not make a better reviewer; Tangled should make patches bring receipts before asking for a review.

The cleanest sponsor-facing contrast:

> GitHub is adding limits because PR volume outran review capacity. Tangled can go one layer deeper: make every human or agent patch carry portable reviewability receipts, backed by AT Protocol identity, vouches, issue/pull/comment records, repo DIDs, knots, and spindle evidence.
