# Agent Kappa: Weird Concepts For Project Memory, Precedent, And Reviewability

> **Status:** COMPLETE
> **Agent:** kappa
> **Mission:** `01_landscape`
> **Date checked:** 2026-06-24
> **Navigator position:** emerging and aligned; the concept landscape supports project memory, but not as the primary public wrapper.
> **Target T/A:** T55 -> T20, A93. Evidence that lowers T: sourced analogies across ADR/RFC governance, credentials, Git trailers, policy-as-code, moderation precedent, and developer knowledge tools.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a Tangled sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow to protect: a maintainer decides whether a human or AI/agent PR deserves review because it carries protocol evidence.
- Intentionally cut: legal-heavy workflow, generic semantic search, broad governance system, public trust scores, real policy enforcement, live custom lexicon dependency, and anything not visible in the first minute.

Known unknowns still worth flagging before large build work:

- Whether Tangled sponsors want a custom project-decision record, or prefer composing only existing pull/issue/comment/vouch/spindle records.
- Whether "case law" lands as memorable or bureaucratic with the presenter and sponsor.
- Whether write-side record creation matters more than a seeded, high-polish read-side proof.
- Who is presenting and whether they can make the legal metaphor feel light.

## Executive Verdict

**Tangled Case Law should not be the primary idea by default.** It should become a **supporting field inside Tangled Review Passport / Patch Passport**, named publicly as **Project Memory** or **Precedent**, not "case law."

Why:

- ADRs, RFCs, PEPs, KEPs, governance docs, and moderation records prove that durable decision memory is a real need.
- DCO, CLAs, Git trailers, Linux `Reviewed-by`/`Tested-by`, Open Badges, and verifiable credentials prove that lightweight attestations and receipts already shape open-source behavior.
- Policy-as-code proves that structured rules can automate checks, but enforcement framing is too heavy for this hackathon.
- Moderation case law proves the metaphor is powerful but dangerous: it invites appeals, bureaucracy, fairness disputes, and legal vibes.
- Commercial project-memory tools already sell "context for engineers and agents." Tangled's unique twist is not memory alone; it is **memory as a protocol-addressed review receipt attached to a patch**.

Best synthesis:

> Review Passport is the product. Project Memory is one receipt inside it. "Case law" is the internal metaphor for precedent cards, not the sponsor-facing headline unless the sponsor explicitly lights up at that phrase.

Best 20-second wording:

> AI made patches cheap. Tangled Review Passport makes every patch cite identity, intent, tests, trust, and project memory before it consumes maintainer attention.

Best supporting line:

> Git preserves what changed. Tangled can preserve why this project accepts or rejects that kind of change.

## Conceptual Map

| Concept family | Existing pattern | What it preserves | Failure mode | Tangled implication |
| --- | --- | --- | --- | --- |
| ADRs / decision records | Short documents capturing context, decision, consequences, status, supersession. | Why a technical decision was made. | Often hidden in docs, stale, not linked to incoming PRs. | A passport can show the relevant decision at review time with AT URI evidence. |
| RFC / PEP / KEP processes | Public proposals with discussion, stages, owners, final status. | Legitimate change process and historical rationale. | Too slow/heavy for normal PRs. | Use the stage/status grammar, not the full process. |
| Policy-as-code | OPA/Rego, Conftest, Allstar, CUE validate structured inputs. | Machine-checkable rules and governance. | Enforcement product, not review judgment; brittle if policy is incomplete. | Use "missing receipts" checks, not automatic rejection. |
| Moderation case law | Wikipedia ArbCom, Stack Exchange Meta policies, label/moderation precedents. | Dispute history and norms. | Legalistic, appeals-heavy, politically charged. | Avoid primary "court" metaphor; borrow scoped precedent and evidence links. |
| Badges / credentials / passports | Open Badges, Verifiable Credentials, Human Passport-style stamps. | Issuer, subject, claim, criteria, evidence, verification. | Credential theater and score-chasing. | Passport is a strong metaphor if it means evidence bundle, not social rank. |
| Git trailers and patch tags | `Signed-off-by`, `Reviewed-by`, `Tested-by`, `Acked-by`, `Fixes`. | Human attestations embedded near the change. | Text conventions are easy to lose, forge-local, and not queryable as social graph. | Tangled can turn patch trailers into protocol-native receipt chips. |
| DCO / CLA | Contributor certifies contribution rights or signs project terms. | Accountability and legal permission. | Legal-heavy and often a merge blocker. | Good analogy for "submitter must certify," but do not center legal compliance. |
| Code review norms | Reviewability depends on clear intent, size, tests, risk, and context. | Reviewer attention and confidence. | Norms live in human memory and scattered comments. | Passport should convert norms into visible evidence requirements. |
| Maintainer handoff / governance | Governance docs define roles, authority, succession, commit access. | Who can decide and how decisions transfer. | Often written late, after crisis. | Project Memory helps new maintainers inherit judgment without reading every old PR. |
| Living docs / knowledge bots | Backstage TechDocs, Unblocked, Swimm, Stack Overflow Internal, Mintlify. | Searchable project context for humans and agents. | Enterprise/private context engine, not open protocol review evidence. | Tangled can be the public collaboration-memory layer, not another RAG bot. |

## Closest Weird Adjacent Players And Projects

### Decision Memory

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [ADR community](https://adr.github.io/) | Defines architecture decision records and decision logs. | Very high for "project memory." | ADRs are usually repo docs; Tangled can attach decisions to PR review surfaces as protocol records. |
| [MADR](https://adr.github.io/madr/) | Lightweight Markdown ADR template with structured fields. | High. | Use its compact field grammar: context, options, decision, consequences, status. |
| [adr-tools](https://github.com/npryce/adr-tools) | CLI for ADR logs stored as Markdown. | High as implementation precedent. | Good proof that decision records can be lightweight; not enough for Tangled differentiation. |
| [Log4brains](https://github.com/thomvaill/log4brains) | Docs-as-code ADR knowledge base, published as a static site. | High for "architecture knowledge base." | Competes with standalone Project Memory; Tangled should not just build an ADR viewer. |
| [AWS ADR guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html) | ADR process creates decision logs for project context. | High. | Strong support for project-memory field; too enterprise/process-heavy as pitch wrapper. |
| [Martin Fowler ADR note](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) | ADRs should be short and linked to superseding decisions. | High. | Supersession is critical for Tangled precedent records. |

### Formal Proposal Processes

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [IETF RFCs](https://www.ietf.org/process/rfcs/) and [Datatracker](https://datatracker.ietf.org/) | Public technical documents with lifecycle/status tracking. | Medium-high. | Borrow lifecycle/status and public archive, not the multi-year standards process. |
| [IETF rough consensus](https://datatracker.ietf.org/doc/html/rfc7282) | Consensus is about resolving objections, not simple voting. | Medium. | Great pitchable principle: vouches are evidence, not votes. |
| [Rust RFCs](https://github.com/rust-lang/rfcs) | Controlled path for important Rust changes. | High for major project evolution. | Shows that open-source communities need durable rationale, but too heavy for ordinary PR intake. |
| [Python PEP 1](https://peps.python.org/pep-0001/) / [PEP index](https://peps.python.org/) | Design documents with rationale and stable numbers. | Medium-high. | Stable IDs and status are useful; full PEP workflow is out of scope. |
| [Kubernetes KEPs](https://github.com/kubernetes/enhancements) | Enhancement tracking with sponsoring SIGs and staged implementation. | Medium-high. | Sponsor/owner field maps directly to Agent/Patch Passport. |

### Policy And Governance

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [Open Policy Agent](https://openpolicyagent.org/docs) | General-purpose policy engine with Rego. | Medium. | OPA is enforcement infrastructure; Tangled should use soft review lanes instead. |
| [Conftest](https://github.com/open-policy-agent/conftest) | Tests structured config against policies. | Medium. | Good analogy for checking passport completeness against structured records. |
| [OpenSSF Allstar](https://github.com/ossf/allstar) | Continuous enforcement of GitHub repo security policies. | Medium. | Strong contrast: Allstar enforces settings; Review Passport requests missing evidence. |
| [CUE](https://cuelang.org/docs/) | Data validation language where schema, data, and policy can coexist. | Medium. | Useful if a custom receipt schema exists; not a first-demo feature. |
| [Open Source Guides: governance](https://opensource.guide/leadership-and-governance/) | Explains roles, decision authority, commit access. | Medium. | Governance state can inform who is allowed to create binding project memory. |
| [CommunityRule](https://communityrule.info/) | Toolkit for community constitutions and decision rules. | Medium-low. | Interesting for future repo governance records, too abstract for first pitch. |

### Credentials, Badges, And Receipts

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0) | Packages achievements as verifiable credentials. | High for "passport" shape. | Good model: issuer, subject, criteria, evidence, verification. Avoid gamified badges. |
| [Open Badges FAQ](https://openbadges.org/about/faq) | Badge evidence can link to proof approved by issuer. | High. | Directly supports "evidence links inside passport." |
| [W3C Verifiable Credentials 2.0](https://www.w3.org/TR/vc-data-model-2.0/) | Claims by issuers about subjects, tamper-evident and verifiable. | High conceptually. | Too identity-standard-heavy for demo; useful vocabulary for claim/issuer/subject/verifier. |
| [DCO](https://developercertificate.org/) | Contributor certifies right to submit a contribution. | High for lightweight contribution attestation. | A Patch Passport is like DCO for reviewability, but social/technical rather than legal. |
| [CLA Assistant](https://github.com/cla-assistant/cla-assistant) | PR-time CLA signing workflow. | Medium. | Shows PR gates can request missing paperwork; avoid legal-style blocker UX. |

### Patch Attestation Conventions

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [Git trailers](https://git-scm.com/docs/git-interpret-trailers) | Structured token/value metadata in commit messages. | Very high for lightweight receipts. | Tangled can make trailers queryable, social, and linked to AT records. |
| [Linux patch submission tags](https://docs.kernel.org/process/submitting-patches.html) | Uses `Signed-off-by`, `Reviewed-by`, `Tested-by`, `Acked-by`, `Fixes`, etc. | Very high. | This is the closest "receipts before trust" tradition in OSS. |
| [GitHub verified commits](https://docs.github.com/en/authentication/managing-commit-signature-verification) | Confirms commits/tags come from a trusted source key/account. | Medium. | Identity proof is one chip, not reviewworthiness. |

### Project Memory And Knowledge Tools

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [Unblocked](https://getunblocked.com/) | Turns code, docs, tickets, and conversations into engineering context for humans and agents. | High for project memory. | Adjacent commercial threat if the pitch is "context engine"; Tangled must show protocol records and PR review reach. |
| [Swimm](https://swimm.io/) | Structured understanding and traceable code documentation / knowledge base. | Medium-high. | Good proof that code knowledge is valuable; not an open-source social evidence layer. |
| [Stack Overflow Internal / Teams](https://stackoverflowteams.com/) | Private human-validated knowledge store. | Medium. | Human validation is a good concept, but private enterprise KB is not Tangled-native. |
| [Mintlify](https://www.mintlify.com/) | Agent-oriented, self-updating documentation platform. | Medium. | Shows "docs for agents" is crowded; Tangled should require agents to cite project memory rather than generate docs. |
| [Backstage TechDocs](https://backstage.io/docs/features/techdocs/) | Docs-like-code in developer portal. | Medium. | Docs should live near code; Tangled adds public collaboration identity and review events. |
| [Sourcegraph](https://sourcegraph.com/) / [Cody context](https://sourcegraph.com/blog/how-cody-understands-your-codebase) | Codebase context for humans and agents. | Medium. | Code context is table stakes. Collaboration context is the wedge. |

### Moderation And Case Law Analogies

| Player / concept | What it does | Similarity | Tangled gap / implication |
| --- | --- | --- | --- |
| [Wikipedia ArbCom](https://en.wikipedia.org/wiki/Wikipedia%3ADispute_resolution_requests/ArbCom) | Final binding dispute-resolution body for serious conduct disputes. | Medium for "case law." | Strong caution: court metaphor adds legitimacy burden and appeals. |
| [Wikimedia ArbCom reflections](https://diff.wikimedia.org/2013/06/05/english-wikipedia-arbitration-committee/) | ArbCom decisions provide action and guidance for difficult community issues. | Medium. | Precedent works when rare and serious; too much case law slows normal work. |
| [Stack Exchange moderation strike](https://meta.stackexchange.com/questions/389811/moderation-strike-stack-overflow-inc-cannot-consistently-ignore-mistreat-an) | Public governance crisis around AI-generated-content moderation policy. | Medium. | AI moderation rules become contested fast; avoid "we judge AI" framing. |
| [ATProto moderation labels](https://docs.bsky.app/docs/advanced-guides/moderation) | Labelers affect visibility/reach without deleting underlying speech. | High philosophy fit. | Maps well to review reach: submission remains possible; attention is filtered by evidence. |

## Non-Obvious Analogies Worth Keeping

### 1. Linux Patch Tags Are The Best Precedent For Review Passport

The Linux kernel already has a distributed grammar of patch receipts:

- `Signed-off-by`: contribution-right certification / delivery path.
- `Reviewed-by`: someone known has reviewed and believes the patch has no serious known issues.
- `Tested-by`: someone tested it in an environment.
- `Acked-by`: a relevant person indicates acceptance.
- `Fixes`: ties the patch to a prior commit and helps review/stable backport decisions.

Tangled mutation:

> A Tangled Patch Passport is what Git trailers become when they are protocol-addressed, source-linked, scoped by vouches, visible in the PR UI, and usable by agents before they ask for review.

Pitchability: **very high**, but use it with developers, not judges if time is short.

Demo field:

- `Reviewed-by: @jules.dev` becomes "Jules vouched for this agent on webhook fixes."
- `Tested-by` becomes a spindle receipt.
- `Fixes` becomes linked issue/advisory AT URI.
- `Signed-off-by` becomes agent DID + human sponsor.

### 2. Open Badges, But For Reviewability Instead Of Achievement

Open Badges package issuer, subject, criteria, evidence, and verification. That is close to the shape of a Review Passport.

Tangled mutation:

> The badge is not "trusted developer." The badge is "this patch has enough evidence to review."

Pitchability: **medium-high**. "Passport" is stronger than "badge" because "badge" implies gamification.

Demo field:

- issuer: maintainer / app / agent
- subject: pull record AT URI
- criteria: identity, intent, tests, trust, project memory
- evidence: issue, comment, vouch, spindle, prior decision
- verifier: maintainer's Tangled appview / trust circle

### 3. ADR Supersession Is Exactly What Project Memory Needs

The key ADR move is not "write a big doc." It is:

- one decision per record;
- status;
- context;
- consequences;
- link to superseding record when the decision changes.

Tangled mutation:

> Project Memory should never say "this old comment is law forever." It should say "this decision is active, expired, or superseded, and here is the record that changed it."

Pitchability: **high as supporting detail**, not as headline.

Demo field:

- `Precedent: Hosted knots must not require Redis`
- `Status: active until v1.5`
- `Supersedes: none`
- `Evidence: issue + maintainer comment + failed spindle + vouch`

### 4. RFCs/PEPs/KEPs Prove That Rejected Ideas Are Valuable

Rejected proposals are not waste. They are project memory. They prevent repeated debates.

Tangled mutation:

> A rejected AI PR can still improve the project if it leaves a clean, cited precedent that future agents can read before submitting the same idea again.

Pitchability: **high**, especially for "AI keeps reopening old debates."

Demo beat:

- Weak PR gets `Missing receipts`, not shame.
- Maintainer clicks `Request precedent citation`.
- Agent learns: "project rejected Redis for hosted-knot deployability; adapt to SQLite adapter."

### 5. Policy-As-Code Is The Wrong Product But The Right Internal Check

OPA/Conftest/Allstar show that structured checks are useful. But "policy enforcement" creates the wrong vibe for a maintainer demo.

Tangled mutation:

> Do not enforce project law. Evaluate passport completeness and suggest the next action.

Pitchability: **low as public metaphor**, high as implementation pattern.

Good UI:

- `missing issue link`
- `missing focused test`
- `no stable agent identity`
- `project decision cited and satisfied`

Bad UI:

- `policy violation`
- `compliance failed`
- `blocked by case law`

### 6. Wikipedia ArbCom Is A Warning, Not A Model

Case law gives legitimacy when decisions are serious, public, and contested. It also creates process weight.

Tangled mutation:

> Use precedent to explain maintainer judgment, not to create a court system.

Pitchability: **low**. Do not mention Wikipedia ArbCom in the pitch unless a judge asks about governance.

### 7. Maintainer Handoff Is The Hidden High-A Value

Project memory becomes much more valuable when a maintainer burns out, a repo moves knots, or a new maintainer inherits old context.

Tangled mutation:

> Review Passport helps today's maintainer decide. Project Memory helps tomorrow's maintainer understand why.

Pitchability: **medium** as second-minute support, not first-screen hook.

## Pitchable Metaphors

| Metaphor | Score | Use / avoid | Reason |
| --- | ---: | --- | --- |
| **Review Passport** | 95 | Use as primary platform frame. | Concrete, compact, evidence-oriented, not punitive. |
| **Patch Passport for AI PRs** | 96 | Use as first demo frame. | Immediately tied to challenge and AI-agent future. |
| **Receipts before review** | 94 | Use in copy and pitch. | Strong, short, explains why maintainer time is scarce. |
| **Project Memory** | 88 | Use as supporting field. | Human and non-legal; maps to ADR/RFC rationale. |
| **Precedent** | 82 | Use inside detail view. | More precise than memory, less legalistic than case law. |
| **Case Law for open source** | 64 | Use only as internal or sponsor-test phrase. | Memorable but risks legal/compliance/bureaucracy read. |
| **Decision log** | 72 | Use in docs, not hero. | Accurate but dry. |
| **Trust receipts** | 80 | Use if sponsor reacts to vouching. | Good, but can drift toward reputation. |
| **Governance layer** | 46 | Avoid as primary. | Too abstract and political. |
| **Policy-as-code for PRs** | 35 | Avoid. | Sounds like enforcement and compliance. |
| **Court / judge / verdict** | 20 | Avoid. | Wrong emotional tone for hackathon UX. |
| **Badge** | 42 | Avoid in UI. | Gamified and status-seeking. |
| **Constitution** | 30 | Avoid. | Too heavy and not demo-actionable. |

Recommended naming hierarchy:

1. Product: **Tangled Review Passport**
2. Demo use case: **Patch Passport for AI PRs**
3. Detail section: **Project Memory**
4. Detail item: **Precedent**
5. Internal design shorthand: **Case Law**

## Should Tangled Case Law Be Primary?

### Verdict

**No, not by default.** Make it a supporting field inside Review Passport.

### Why Not Primary

1. **The challenge is agentic and open-ended, but the sponsor explicitly calls out autonomous agents and PR review.** Patch Passport hits that directly; Case Law is one layer removed.
2. **The phrase "case law" can sound legalistic.** It risks judges thinking about governance, moderation, or compliance instead of a fast maintainer workflow.
3. **Standalone Case Law implies a harder retrieval problem.** It suggests semantic matching over historical PRs, issue comments, and docs. That is out of scope for a reliable hackathon demo.
4. **Project memory by itself is already commercially adjacent.** Unblocked, Swimm, Stack Overflow Internal, Sourcegraph, Mintlify, and docs platforms all sell context/knowledge. Tangled wins when memory is linked to protocol receipts and review reach.
5. **Review Passport is broader.** It includes identity, intent, tests, trust, provenance, risk, and project memory. That makes it resilient if sponsor cares more about vouching, agents, spindles, or AT Protocol records.

### When It Could Become Primary

Promote Tangled Case Law / Project Memory only if the sponsor says one of these:

- "We really want custom lexicons / project-decision records."
- "Preserving collaboration history across knots is more exciting than AI PR intake."
- "We want something more novel than AI agent reviewability."
- "Project decisions as protocol records is the part we want to see."

If promoted, public name should be **Project Memory for Tangled**, not Case Law.

### Best Supporting Field Shape

Inside a Patch Passport detail view:

```text
Project Memory
  Precedent: Hosted knots must not require Redis
  Status: Active
  Scope: src/payments/cache/*, checkout sessions
  Why it matters: keeps hosted-knot deploys dependency-light
  Evidence:
    issue: at://did:plc:mira/sh.tangled.repo.issue/payments-91
    pull: at://did:plc:niko/sh.tangled.repo.pull/payments-143
    comment: at://did:plc:mira/sh.tangled.comment/...
    spindle: spindle://solar-knot/payments/143/2
    vouch: at://did:plc:jules/sh.tangled.graph.vouch/...
  Action: Request adaptation to SQLite-backed adapter
```

That is the sweet spot: enough precedent to explain the recommendation, not so much process that the product becomes court software.

## Product Implications

### What Kappa Adds To Review Passport

Add a `Project Memory` section with three possible states:

1. `Cites active precedent`: patch follows or explicitly accounts for a project decision.
2. `Reopens old decision`: patch repeats a rejected approach or unresolved debate.
3. `No precedent needed`: ordinary patch; memory does not affect review reach.

Add source-linked chips:

- `Decision`
- `Supersedes`
- `Expires`
- `Cited by`
- `Satisfied`
- `Exception requested`

Add one maintainer action:

- `Request precedent citation`

This action is more useful than "reject by precedent" because it keeps the maintainer in control and gives new contributors/agents a fair path.

### Demo Scenario Kappa Recommends

Use two AI PRs and one precedent:

1. `PR #189: Fix webhook replay window`
   - Complete passport.
   - Cites active security precedent.
   - Vouched sponsor.
   - Focused spindle pass.
   - Lane: `Ready to review`.

2. `PR #190: Replace checkout session cache with Redis`
   - Passing tests but missing project-memory citation.
   - Reopens active precedent: `Hosted knots must not require Redis`.
   - Lane: `Missing receipts`.
   - Action: `Request adaptation to existing SQLite adapter`.

Best visible moment:

> Two AI patches pass tests. Only one earns review because it carries the project memory and protocol receipts the maintainer needs.

### What To Cut

- No broad precedent search.
- No "binding law" language.
- No court/judge/verdict UI.
- No policy editor.
- No governance constitution builder.
- No global project-memory graph.
- No automatic blocking.
- No claims that a precedent proves a patch is wrong.

## Gap Inventory

| Gap / claim | T | A | P = A - T | Read |
| --- | ---: | ---: | ---: | --- |
| Project Memory should be a passport field, not the headline. | 16 | 94 | 78 | Strong. Local docs plus ADR/RFC/badge/trailer landscape converge. |
| "Case law for open source" is a pitchable phrase. | 38 | 86 | 48 | Risky. Memorable, but legal/bureaucratic. Sponsor-test only. |
| Patch Passport can borrow ADR/RFC supersession/status grammar. | 18 | 88 | 70 | Strong and buildable with seeded records. |
| Linux patch tags are the best OSS analogy for reviewability receipts. | 12 | 90 | 78 | Strong. Existing social receipt grammar maps cleanly to Tangled. |
| Policy-as-code should enforce review decisions. | 52 | 60 | 8 | Avoid. Use soft completeness checks instead. |
| Badges should be shown as contributor achievements. | 45 | 55 | 10 | Avoid. Use passport/receipt for patch-specific evidence, not gamification. |
| Commercial project-memory tools threaten standalone Project Memory positioning. | 22 | 82 | 60 | Real. Unblocked/Swimm/Mintlify/Stack Internal are adjacent; Tangled needs protocol evidence wedge. |

## Recommendation To Mission Synthesis

Keep the main idea as:

> **Tangled Review Passport**, demonstrated as **Patch Passport for AI PRs**.

Make `Project Memory` a first-class passport section and show exactly one precedent card. This preserves the higher-amplitude Tangled Case Law insight without letting the pitch drift into a governance product.

Recommended sponsor calibration question:

> Would it be compelling if an AI PR had to cite the relevant project decision before it earned review, with the issue, pull, comment, vouch, and spindle records linked as AT Protocol receipts?

If sponsor says yes, ask:

> Should that project decision be a custom record preview, or should we compose it from existing Tangled issue, pull, comment, vouch, and spindle records?

## Source Index

Local sources:

- `TANGLED_CHALLENGE_INFO.txt`
- `TANGLED_PROBLEM_SOUL.md`
- `TOP_IDEAS_PITCH.md`
- `TANGLED_ARCHETYPE_CONVERGENCE.md`
- `TANGLED_AI_PR_TRUST.md`
- `investigations/tangled_landscape_2026_06_24/01_landscape/MISSION_01_LANDSCAPE.md`
- `AGENT_ALPHA_AI_REVIEW_COMPANIES.md`
- `AGENT_BETA_AUTONOMOUS_PR_AGENTS.md`
- `AGENT_DELTA_PROVENANCE_PASSPORTS.md`
- `AGENT_EPSILON_TRUST_REPUTATION.md`
- `AGENT_GAMMA_OSS_REVIEW_AUTOMATION.md`
- `AGENT_ZETA_DECENTRALIZED_FORGES.md`
- `/home/henri/tlc/investigations/_master/SIMPLE_METHODOLOGY.md`
- `/home/henri/tlc/investigations/_master/SIMPLE_GEOMETRIC_NAVIGATOR.logos`

Decision records / proposal processes:

- ADR community: https://adr.github.io/
- MADR: https://adr.github.io/madr/
- adr-tools: https://github.com/npryce/adr-tools
- Log4brains: https://github.com/thomvaill/log4brains
- AWS ADR process: https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html
- Martin Fowler on ADRs: https://martinfowler.com/bliki/ArchitectureDecisionRecord.html
- IETF RFCs: https://www.ietf.org/process/rfcs/
- IETF Datatracker: https://datatracker.ietf.org/
- RFC 7282 rough consensus: https://datatracker.ietf.org/doc/html/rfc7282
- Rust RFCs: https://github.com/rust-lang/rfcs
- Python PEP 1: https://peps.python.org/pep-0001/
- Python PEP index: https://peps.python.org/
- Kubernetes enhancements / KEPs: https://github.com/kubernetes/enhancements

Policy / governance:

- Open Policy Agent: https://openpolicyagent.org/docs
- OPA policy language: https://openpolicyagent.org/docs/policy-language
- Conftest: https://github.com/open-policy-agent/conftest
- OpenSSF Allstar: https://github.com/ossf/allstar
- CUE docs: https://cuelang.org/docs/
- Open Source Guides governance: https://opensource.guide/leadership-and-governance/
- The Open Source Way governance: https://guidebook.theopensourceway.org/growing-contributors/project-and-community-governance
- CommunityRule: https://communityrule.info/

Credentials / attestations:

- Open Badges 3.0: https://www.imsglobal.org/spec/ob/v3p0
- Open Badges FAQ: https://openbadges.org/about/faq
- W3C Verifiable Credentials 2.0: https://www.w3.org/TR/vc-data-model-2.0/
- Developer Certificate of Origin: https://developercertificate.org/
- Linux Foundation DCO wiki: https://wiki.linuxfoundation.org/dco
- CLA Assistant: https://github.com/cla-assistant/cla-assistant
- Git trailers: https://git-scm.com/docs/git-interpret-trailers
- Linux patch submission docs: https://docs.kernel.org/process/submitting-patches.html
- GitHub commit signature verification: https://docs.github.com/en/authentication/managing-commit-signature-verification

Reviewability / knowledge tools:

- Code change reviewability paper: https://dl.acm.org/doi/10.1145/3236024.3236080
- Reviewability preprint PDF: https://marco-c.github.io/publications/reviewability-fse2018.pdf
- DX summary of reviewability: https://newsletter.getdx.com/p/what-makes-a-code-change-easier-to
- Backstage TechDocs: https://backstage.io/docs/features/techdocs/
- Unblocked: https://getunblocked.com/
- Swimm: https://swimm.io/
- Stack Overflow Internal / Teams: https://stackoverflowteams.com/
- Mintlify: https://www.mintlify.com/
- Sourcegraph: https://sourcegraph.com/
- Sourcegraph Cody context: https://sourcegraph.com/blog/how-cody-understands-your-codebase

Moderation / precedent cautions:

- Wikipedia ArbCom requests: https://en.wikipedia.org/wiki/Wikipedia%3ADispute_resolution_requests/ArbCom
- Wikimedia ArbCom reflections: https://diff.wikimedia.org/2013/06/05/english-wikipedia-arbitration-committee/
- Stack Exchange moderation strike / AI policy dispute: https://meta.stackexchange.com/questions/389811/moderation-strike-stack-overflow-inc-cannot-consistently-ignore-mistreat-an
- ATProto moderation labels: https://docs.bsky.app/docs/advanced-guides/moderation
