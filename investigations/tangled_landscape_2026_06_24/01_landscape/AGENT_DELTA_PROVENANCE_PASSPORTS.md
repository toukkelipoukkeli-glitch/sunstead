# Agent Delta: Provenance Passports And Reviewability Receipts

Research date: 2026-06-24  
Mission: Tangled Landscape / Agent Delta  
Navigator position: emerging and aligned; broad provenance landscape is mapped, the Tangled reinterpretation is warm-to-cold.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`, open-ended creative inside a sponsor challenge.
- Primary scoring mode: product/technical hybrid with sponsor fit first; Tangled says originality and AT Protocol-native integrations matter most.
- Judging/submission mode: local notes say Tangled partner selects finalists, then 4-minute pitch plus 1-minute Q&A; exact submission constraints remain unknown.
- Target track: Tangled main challenge.
- Core demo flow: maintainer sees two AI/agent PRs; only one earns review because it has a Tangled-native Patch Passport with identity, intent, test evidence, trust, project memory, and record links.
- Intentionally cut: real SLSA compliance, real Sigstore/Rekor/Fulcio infra, full SBOM generation, policy engines, universal trust scoring, AI detection, and cryptographic model provenance claims.

## Executive Verdict

The supply-chain world has already built excellent machinery for answering:

> Did this artifact come from the expected source, builder, workflow, and dependency set?

Tangled should not clone that. The winning adaptation is:

> Does this patch carry enough accountable evidence for a maintainer to spend scarce review time?

That is a different object. Supply-chain receipts protect downstream consumers after a build. Tangled review receipts protect maintainers before review. The strongest idea is therefore not "SLSA for PRs" literally; it is a Tangled-native **reviewability receipt** that borrows the grammar of SLSA/in-toto/Sigstore but uses AT Protocol records, DIDs, vouches, issue/pull/comment links, and spindle results as maintainer-facing evidence.

The best phrasing:

> AI made patches cheap. Tangled Patch Passport makes patches earn review with identity, intent, tests, trust, and protocol evidence.

## Cold Facts From Local Context

Tangled is a decentralized code hosting and collaboration platform built on AT Protocol. Its docs say Tangled is open-source and self-hostable, with knots for Git hosting and an appview that aggregates network activity across knots. AT Protocol gives DIDs, handles, signed data repositories, lexicons, relays, and appviews.

Tangled's own vouching blog is the key sponsor-native bridge. It explicitly frames vouching as a response to LLM-enabled submissions that look plausible but are subtly wrong. Vouches/denounces are public PDS records, visible in issues, PRs, and comments, and future additions mention evidence trails tied to PRs. Tangled newsletter 02 says pull request records are ingested through the firehose and agents can create pull requests by writing `sh.tangled.repo.pull` records to a PDS.

That means Patch Passport can be framed as the missing evidence object between:

- agent-written PR records,
- Tangled vouch/denounce records,
- issue/comment/pull records,
- repo DID and knot context,
- spindle CI results,
- future evidence trails.

## Primitive Map

| Provenance primitive | What it means in the supply-chain world | Patch Passport reinterpretation for Tangled |
| --- | --- | --- |
| Subject | Artifact digest, package, binary, image, SBOM, or source revision. | Pull request / patchset / PR round, addressed by Tangled pull record AT URI and repo DID. |
| Predicate | Typed claim about how the subject was produced, reviewed, scanned, or built. | Typed claim that the patch has identity, intent, tests, project-memory citation, trust context, and risk disclosure. |
| Attestation | Authenticated statement about a subject. in-toto is the common envelope. | Reviewability receipt: a signed/recorded AT Protocol claim, or derived view from existing Tangled records. |
| Provenance | Source, builder, workflow, parameters, materials, timestamps. | Agent/human producer, human sponsor, originating issue, prompt/task scope if disclosed, files touched, tests added/run, spindle status. |
| Identity | OIDC workflow identity, Fulcio certificate identity, signer key, package registry publisher. | Agent DID, human sponsor DID, maintainer DID, vouching circle, repo DID, optional OAuth/session identity for writes. |
| Transparency log | Rekor append-only log for signatures and attestations. | AT Protocol record graph plus firehose/appview visibility; not cryptographically equivalent to Rekor, but much more native to social review. |
| Builder | Trusted CI or build platform that produced an artifact. | Agent runtime or human+tool workflow that produced the patch; for hackathon, show as declared metadata, not verified infrastructure. |
| Materials | Source refs, dependencies, build config, base images. | Linked issue/comment, project precedent, dependency files touched, tests, spindle workflow, PR round lineage. |
| Verification policy | Consumer checks artifact provenance against allowed source/build policy. | Maintainer checks whether a patch deserves review: "complete receipt", "missing receipts", or "cool down". |
| SBOM | Inventory of software components and relationships. | Review BOM: files changed, subsystems affected, dependencies changed, tests touched, tools/models disclosed. |
| VEX | Status explaining whether a known vulnerability affects a product. | ReviewVEX: explicit explanation that a known concern is not applicable, accepted, fixed, or needs human context. |
| Scorecard | Automated security health checks for repos/dependencies. | Evidence checklist, not a score: identity present, intent present, tests present, trust present, risk explained. |
| Knowledge graph | GUAC/Archivista/Chainloop store and connect SBOMs, attestations, VEX, provenance. | Passport graph: AT URIs stitching agent, sponsor, PR, issue, vouch, comment, repo DID, knot, and spindle result. |

## Direct Analogy: Supply-Chain Receipt To Maintainer-Review Receipt

SLSA provenance says: "this artifact was produced by this build platform from this source under this build definition."

Tangled Patch Passport should say: "this PR was produced by this actor for this issue, under this scope, with these tests, with this trust context, and these Tangled records back the claim."

GitHub Artifact Attestations say consumers can verify where and how an artifact was built. Patch Passport says maintainers can verify where and why a patch arrived before reading the diff.

Sigstore keyless signing binds signatures to OIDC identities rather than long-lived keys. Patch Passport binds review evidence to DIDs and handles rather than throwaway agent usernames.

Rekor gives a public append-only transparency log. Tangled can give a protocol-native evidence trail: public PDS records, AT URIs, firehose ingestion, and appview aggregation. This is weaker than Rekor for cryptographic append-only guarantees, but stronger for review UX because the same records already live where maintainers interact.

SPDX/CycloneDX SBOMs answer "what is inside this software?" Patch Passport answers "what review-relevant evidence came with this change?"

OpenVEX answers "is this vulnerability exploitable here?" A Tangled review receipt can answer "is this apparent risk handled, irrelevant, or still needing maintainer judgment?"

OpenSSF Scorecard turns repo hygiene into automated checks. Patch Passport should copy the checklist discipline but avoid a global score. The product should show missing/present evidence and maintainer-controlled lanes.

SLSA Source Track is the closest direct bridge. SLSA v1.2 introduced a source track covering threats around authoring, reviewing, and managing source code; its highest source level requires two trusted people to review protected-branch changes. Tangled should not claim SLSA Source conformance. But it can translate the idea into review reach: a patch with human sponsor, vouch evidence, and final-revision test evidence earns attention faster.

## Adjacent Standards And OSS Projects

### SLSA

SLSA is a supply-chain security framework from OpenSSF. Build provenance in SLSA v1.2 describes how artifacts were produced and lets consumers verify artifacts against expectations. SLSA v1.2 also introduces the Source Track for source authoring/review controls. The relevant mental model is "levels of assurance", but the hackathon demo should avoid levels and show plain evidence checks.

Patch Passport analogy: reviewability levels, but displayed as receipts rather than compliance badges.

Too heavy for hackathon: real SLSA conformance, builder assessment, source-control-system assessment, hermetic/reproducible build guarantees.

### in-toto

in-toto Attestation Framework defines a general way to make verifiable claims about how software is produced. SLSA provenance is one predicate type inside that broader attestation pattern.

Patch Passport analogy: `app.sunstead.reviewReceipt` could be a Tangled-flavored predicate over a PR subject, but for demo reliability it can be a derived view from existing records.

Too heavy: implementing a full in-toto layout, policy verification, or predicate ecosystem.

### Sigstore: cosign, Fulcio, Rekor

Sigstore provides signing and verification for software artifacts. Cosign signs/verifies artifacts and attestations. Fulcio issues short-lived certificates tied to OIDC identity. Rekor records signing events in a transparency log.

Patch Passport analogy:

- Fulcio/OIDC -> agent DID / human sponsor DID / workflow identity.
- Rekor -> Tangled record graph and firehose-visible evidence.
- cosign verification -> "show receipt links and pass/fail evidence checks."

Too heavy: running or depending on Sigstore infra during judging. Use it as conceptual provenance precedent, not a runtime dependency.

### GitHub Artifact Attestations

GitHub Artifact Attestations use Sigstore to create signed claims about artifacts built in GitHub Actions. The claims include workflow, repo/org/environment, commit SHA, trigger event, and OIDC-derived info. GitHub cautions that attestations do not prove software is secure; they link artifacts to source and build instructions so consumers can make policy decisions.

Patch Passport analogy: exactly the UI-shaped object judges can understand. "GitHub has artifact attestations for release artifacts; Tangled can have review attestations for incoming patches."

Too heavy: verifying real GitHub attestations. Use the user-facing shape.

### npm, PyPI, Homebrew, JSR Provenance

Package ecosystems are adding provenance:

- npm trusted publishing can generate package provenance automatically.
- PyPI supports digital attestations via Trusted Publishing / PEP 740-style flows.
- Homebrew has Sigstore-powered build provenance for bottles.
- JSR creates SLSA/Sigstore provenance for packages published from GitHub Actions.

Patch Passport analogy: package managers are normalizing provenance badges. Tangled can normalize a "reviewability receipt" badge at the PR boundary.

Too heavy: package-registry flows are post-build; Patch Passport is pre-review.

### GUAC

GUAC ingests SBOMs and other software metadata into a graph, normalizing relationships so teams can understand how software pieces affect one another.

Patch Passport analogy: a mini GUAC for review evidence: actor -> PR -> issue -> vouch -> spindle -> repo DID -> precedent.

Too heavy: graph database, broad ingestion, dependency analysis. Demo should hard-code the graph through visible AT URI links.

### SPDX And CycloneDX

SPDX is an ISO-standard BOM format that now spans software, AI, datasets, and security references. CycloneDX is an ECMA/OWASP full-stack BOM standard supporting SBOM, VEX, SaaSBOM, CBOM, and AI/ML-BOM.

Patch Passport analogy: borrow the "bill of materials" concept for review ingredients. A patch can carry a Review BOM:

- files/subsystems touched,
- tests added/run,
- dependency and lockfile changes,
- model/tool disclosure if applicable,
- linked task and project precedent,
- CI/spindle result.

Too heavy: generating real SPDX/CycloneDX. A readable checklist is enough.

### OpenVEX

OpenVEX is a minimal JSON-LD implementation of VEX. It communicates exploitability status and lets teams reduce false-positive vulnerability noise.

Patch Passport analogy: maintainer triage needs the same "known concern status" pattern. Example statuses: `not affected`, `fixed by this patch`, `requires maintainer review`, `accepted risk`, `out of scope`.

Too heavy: real VEX tooling. Use a simple risk status chip.

### OpenSSF Scorecard

Scorecard runs automated security-health checks and gives maintainers/users a structured way to reason about repository risk.

Patch Passport analogy: a review receipt can use checks, but should avoid a universal contributor score. Judges and maintainers will trust "missing issue link / no focused test / unknown DID" more than "trust score: 73".

Too heavy: integrating Scorecard. Use deterministic seeded checks.

### Tekton Chains, Witness, Archivista, Chainloop

Tekton Chains generates SLSA provenance and signs attestations for Tekton pipelines. Witness creates in-toto attestations to show who did what and which tools were used. Archivista stores signed in-toto attestations in a graph/query service. Chainloop is an open-source evidence store for attestations, SBOMs, VEX, SARIF, QA reports, and policy evidence.

Patch Passport analogy: these projects prove "evidence store" is a real category. Tangled's advantage is that the evidence store can be the collaboration protocol itself, not a separate enterprise compliance backend.

Too heavy: evidence store, policy control plane, storage service, OPA/Rego.

## Commercial And Startup Landscape

The commercial market is crowded around enterprise supply-chain security, artifact/dependency visibility, and compliance evidence. These are adjacent but not direct competitors to a Tangled maintainer-review receipt.

| Player | Adjacent thing they do | Why it matters | Why Patch Passport is different |
| --- | --- | --- | --- |
| Chainguard | Supply-chain hardening, Sigstore/SLSA education, secure images. | Strong provenance credibility and tooling influence. | Mostly artifact/build/runtime trust, not PR review reach. |
| Stacklok / Minder / Trusty | Supply-chain policies and open-source dependency risk. Minder was donated to OpenSSF. | Shows demand for developer-friendly policy around OSS trust. | Focuses on repo/package risk; not protocol-native PR evidence. |
| Kusari | Software supply-chain trust platform, graph visibility, GUAC/Trustify ecosystem. | Closest to "software trust graph." | Enterprise component graph, not maintainer's 3-minute PR decision. |
| Scribe Security | Evidence-driven software supply-chain security, attestations, SDLC guardrails. | "Evidence hub" framing is very close. | Compliance/product supply chain, not open-source reviewability. |
| TestifySec | Evidence-driven compliance; Witness/Archivista origin. | Strongest attestation-store lineage. | Pipeline/compliance proof, not Tangled social records. |
| Chainloop | Open-source evidence store for attestations, SBOMs, VEX, SARIF, QA. | Best lightweight analogue for evidence collection. | External control plane; Tangled can show records directly in review. |
| Cycode / Cimon | CI/CD and SLSA attestation/security posture. | SLSA-as-product exists. | Enterprise AppSec governance, not agent PR passport. |
| Legit Security | ASPM, SBOM/compliance, advanced code-change management. | Validates source-to-deploy governance market. | Broad AppSec platform, not a protocol-native forge primitive. |
| Endor Labs | AI-native AppSec, dependency reachability, OSS risk. | Shows AI-generated/human code risk is now market language. | Vulnerability/dependency risk, not review accountability receipts. |
| Harness SCS | Software supply-chain assurance with SBOM/SLSA attestations. | Enterprise CI/CD attestation use case. | Post-build assurance, not pre-review maintainer triage. |

Conclusion: the market has many "prove the artifact/build/dependency chain" products. I did not find a direct product that says: "before a maintainer reviews an AI/agent PR, show a portable social/protocol receipt proving identity, intent, tests, sponsor, vouches, and project memory." That is the Tangled wedge.

## AI Provenance And Model/Tool Metadata

Real adjacent work exists, but it is not yet the same as provenance for generated code patches.

SPDX 3.0.1 has an AI Profile for documenting AI software systems, models, and datasets. CycloneDX AI/ML-BOM represents models, datasets, dependencies, dataset provenance, training methodology, and framework configuration. C2PA Content Credentials are a media/content provenance standard with manifests, claims, signatures, and asset bindings; the spec also discusses AI/ML asset types.

GitHub Copilot cloud agent is real and can research a repo, make code changes, create branches, and optionally open pull requests from a GitHub Actions-powered environment. Its responsible-use docs describe an asynchronous agent that can create branches, write code, and open PRs.

Gap: I did not find a mature standard that cryptographically attests "this PR hunk was generated by model X using prompt Y under tool Z" in a way normal open-source maintainers can verify today. For the demo, avoid claiming cryptographic model provenance. Say "tool/model metadata if disclosed" and focus on stable agent identity, human sponsor, scope, tests, and Tangled source records.

## What Is Too Heavy For The Hackathon

Cut these aggressively:

- real SLSA level claims;
- real in-toto predicates or layout validation;
- Fulcio/Rekor/cosign integration;
- SBOM generation in SPDX/CycloneDX;
- GUAC/Archivista/Chainloop-style evidence backend;
- policy-as-code / OPA / Rego;
- cryptographic proof of model, prompt, or AI generation;
- universal reputation score;
- automatic blocking, banning, or auto-merge;
- live package-registry integrations;
- full firehose indexer if seeded data can show the product.

Use a visible "receipt chain" instead:

- `at://did:plc:rae-agent/sh.tangled.repo.pull/payments-189`
- agent DID and handle,
- human sponsor DID,
- linked issue AT URI,
- vouch record AT URI,
- spindle run id/result,
- project-memory comment AT URI,
- repo DID and knot.

## Tangled-Native Reinterpretation

Supply-chain receipts are producer-to-consumer proof. Tangled review receipts should be contributor/agent-to-maintainer evidence.

The product should not say:

> This code is safe.

It should say:

> This patch is accountable enough to review.

Receipt fields for the demo:

| Field | Demo meaning |
| --- | --- |
| Identity | Stable agent DID and handle; human sponsor DID if agent-authored. |
| Intent | Linked issue, maintainer request, advisory, or project-memory precedent. |
| Scope | Files/subsystems touched and declared allowed task scope. |
| Tests | Regression test added, focused test run, spindle result. |
| Trust | Vouches/denounces from maintainer's circle; previous accepted work. |
| Risk | Auth/payment/security/dependency/file-surface flags. |
| Provenance | AT URIs for pull, issue, comment, vouch, repo, and CI evidence. |
| Decision | Ready to review, missing receipts, or cool down. |

A possible custom record, only if sponsor likes custom lexicons:

```text
app.sunstead.reviewReceipt
subject: at://did:plc:rae-agent/sh.tangled.repo.pull/payments-189
repo: did:plc:solar-payments-repo
producer: did:plc:rae-agent
sponsor: did:plc:jules-dev
intent: at://did:plc:mira/sh.tangled.repo.issue/payments-91
evidence: [issue AT URI, vouch AT URI, spindle run, project-memory comment]
checks: identity_present, issue_linked, focused_test_added, sponsor_vouched, risky_files_explained
decision: ready_to_review
```

Safer hackathon path: do not write this live. Show it as "record preview" while the actual UI derives the passport from seeded Tangled-like records.

## Recommended Demo Beat

Use two AI PRs that both look plausible and both pass a broad test:

- `PR #189 Fix webhook replay window` has agent DID, Jules as human sponsor, linked issue, project-memory citation, regression test, passing focused spindle, and vouch evidence. Route to `Ready to review`.
- `PR #190 Refactor checkout token validation` has no stable agent identity, no issue, touches auth, deletes a test, no sponsor, and matches a denounced low-evidence pattern. Route to `Missing receipts` or `Cool down`.

The punchline:

> Same CI status. Different review reach. Tangled can see the evidence chain, not just the diff.

## Delta Recommendation For Mission Synthesis

Best Delta-backed idea: **Tangled Review Receipt / Patch Passport**.

T/A/P: `T18 / A94 / P76`.

Why: the bridge from SLSA/in-toto/Sigstore/GitHub Artifact Attestations is real and legible, but the product twist is not already owned by those ecosystems. Tangled should take the receipt shape and move it from artifact consumers to maintainers deciding whether a patch deserves review.

Sponsor questions:

- Should the demo use only existing Tangled records, or is a preview custom receipt lexicon welcome?
- Should the language be `Patch Passport`, `Review Passport`, or `Reviewability Receipt`?
- Is Tangled comfortable positioning vouch/denounce evidence as review-reach input, not enforcement?
- Would agent-created PR records be the most exciting write-side proof if paired with a receipt preview?

## Kill Conditions From Delta

Kill/reframe if:

- the UI becomes a generic compliance dashboard;
- the pitch says "SLSA for PRs" but cannot show AT URIs, DIDs, vouches, and pull records in the first minute;
- the product claims to prove code safety;
- the product relies on AI detection;
- the receipt is just a PR template checklist without Tangled records;
- a judge could summarize it as "GitHub Artifact Attestations, but worse."

## Source Index

Local sources:

- `TANGLED_CHALLENGE_INFO.txt`
- `TANGLED_IDEAS.md`
- `TOP_IDEAS_PITCH.md`
- `TANGLED_ARCHETYPE_CONVERGENCE.md`
- `TANGLED_AI_PR_TRUST.md`
- `TANGLED_PROBLEM_SOUL.md`
- `investigations/tangled_landscape_2026_06_24/01_landscape/MISSION_01_LANDSCAPE.md`
- `navigate/SIMPLE_METHODOLOGY.md`
- `navigate/SIMPLE_GEOMETRIC_NAVIGATOR.logos`

Primary web sources:

- Tangled docs: https://docs.tangled.org/
- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- Tangled spindles: https://docs.tangled.org/spindles
- AT Protocol overview: https://atproto.com/guides/overview
- AT Protocol DIDs: https://atproto.com/specs/did
- SLSA v1.2 specification: https://slsa.dev/spec/v1.2/
- SLSA build provenance: https://slsa.dev/spec/v1.2/build-provenance
- SLSA source requirements: https://slsa.dev/spec/v1.2/source-requirements
- SLSA v1.2 announcement: https://slsa.dev/blog/2025/11/announce-slsa-v1.2
- in-toto attestation framework: https://github.com/in-toto/attestation
- Sigstore cosign keyless signing overview: https://docs.sigstore.dev/cosign/signing/overview/
- Sigstore Rekor overview: https://docs.sigstore.dev/logging/overview/
- Sigstore Fulcio OIDC: https://docs.sigstore.dev/certificate_authority/oidc-in-fulcio/
- GitHub Artifact Attestations concept: https://docs.github.com/en/actions/concepts/security/artifact-attestations
- GitHub Artifact Attestations how-to: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
- GitHub `actions/attest-build-provenance`: https://github.com/actions/attest-build-provenance
- GitHub Actions OIDC: https://docs.github.com/en/actions/concepts/security/openid-connect
- Sigstore bundle verification for npm/GitHub/Homebrew: https://blog.sigstore.dev/cosign-verify-bundles/
- npm provenance statements: https://docs.npmjs.com/generating-provenance-statements/
- npm trusted publishers: https://docs.npmjs.com/trusted-publishers/
- PyPI attestations: https://docs.pypi.org/attestations/producing-attestations/
- PyPI attestation GA: https://blog.sigstore.dev/pypi-attestations-ga/
- Homebrew supply-chain security: https://docs.brew.sh/Supply-Chain-Security
- Homebrew provenance: https://blog.trailofbits.com/2024/05/14/a-peek-into-build-provenance-for-homebrew/
- JSR provenance: https://jsr.io/docs/trust
- GUAC: https://guac.sh/
- GUAC OpenSSF project: https://openssf.org/projects/guac/
- SPDX: https://spdx.dev/
- SPDX AI Profile: https://spdx.github.io/spdx-spec/v3.0.1/model/AI/AI/
- CycloneDX: https://cyclonedx.org/
- CycloneDX AI/ML-BOM: https://cyclonedx.org/capabilities/mlbom/
- OpenVEX: https://github.com/openvex
- OpenSSF Scorecard: https://openssf.org/projects/scorecard/
- Tekton Chains SLSA provenance: https://tekton.dev/docs/chains/slsa-provenance/
- Witness: https://witness.dev/
- Archivista: https://github.com/in-toto/archivista
- Chainloop: https://github.com/chainloop-dev/chainloop
- C2PA: https://c2pa.org/
- C2PA technical specification: https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html
- GitHub Copilot cloud agent: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent
- GitHub Copilot responsible-use agent card: https://docs.github.com/en/copilot/responsible-use/agents

Commercial/market sources:

- Chainguard supply-chain toolbox: https://www.chainguard.dev/unchained/a-toolbox-for-a-secure-software-supply-chain
- Stacklok LLM info / Minder: https://stacklok.com/llm-info/
- Kusari: https://www.kusari.dev/
- Scribe/Omdia vendor assessment: https://omdia.tech.informa.com/om030838/on-the-radar-scribe-offers-security-for-the-software-supply-chain
- TestifySec attestation explainer: https://www.testifysec.com/blog/what-is-a-supply-chain-attestation/
- Cycode software supply-chain guide: https://cycode.com/blog/software-supply-chain/
- Legit Security SBOM/compliance: https://www.legitsecurity.com/continuous-compliance-sbom
- Endor Labs: https://www.endorlabs.com/
- Harness SCS concepts: https://developer.harness.io/docs/software-supply-chain-assurance/get-started/key-concepts
