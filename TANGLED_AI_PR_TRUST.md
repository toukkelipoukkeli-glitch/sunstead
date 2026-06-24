# Tangled AI PR Trust

Focused answer to the AI-slop question:

> Can Tangled make AI-produced code and pull requests more trustworthy?

Verdict: yes. This is probably the sharpest version of the whole direction.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: product/technical hybrid, sponsor fit first.
- Challenge style: open-ended creative inside a sponsor need.
- Judging/submission mode: Tangled partner selects finalists; finalists pitch
  for 4 minutes with 1 minute of questions.
- Target track: Tangled main challenge.
- Core demo flow: an AI-generated PR arrives with a portable trust receipt; the
  maintainer can see whether it deserves review before reading the whole diff.
- Intentionally cut: generic AI code review, AI-detection claims, real live
  model provenance, automatic blocking, full trust graph indexing, production
  auth, and anything that depends on fragile live writes.

## Thesis

AI-generated code is not going away. The winning problem is not "stop AI code."
It is:

> How do maintainers know which AI-produced PRs deserve scarce human attention?

Generic answer:

> Use AI to review AI.

This is weak. It hides the evidence behind another model and can run on any
forge.

Tangled answer:

> Make every AI-produced PR carry a portable trust receipt: agent identity,
> human sponsor, issue intent, project memory, test evidence, CI/spindle result,
> vouches or denounces, and source record links.

Short pitch:

> Tangled Patch Passport makes AI PRs accountable before maintainers spend time
> reviewing them.

Alternative name:

> Trust Receipts for AI PRs.

## Why This Is The Striking Problem

AI slop is the present and future pressure on open source:

- producing plausible patches is now cheap;
- reviewing subtle-wrong code is still expensive;
- maintainers cannot read every AI-generated diff deeply;
- a passing test suite is not enough if the patch solves the wrong problem;
- anonymous or throwaway agents can flood a project without durable reputation;
- "AI-generated" is not the real issue; unaccountable and context-free is.

The maintainer needs a fast answer:

> Who or what made this, who stands behind it, what evidence came with it, and
> has this actor earned attention before?

That is exactly where Tangled is stronger than a normal forge.

## Product: Tangled Patch Passport

Every AI-generated PR gets a passport card before review.

Passport fields:

- `agent`: handle, DID, and PDS record source
- `human sponsor`: the person or maintainer who authorized the agent, if any
- `scope`: repos, files, and task types the agent is allowed to touch
- `intent`: issue or maintainer request the patch claims to solve
- `project memory`: precedent or prior decision the patch cites
- `tests`: tests added, tests run, and relevant spindle result
- `provenance`: model/toolchain/build metadata if available
- `trust`: vouches, denounces, and previous accepted PR evidence
- `risk`: high-risk files, dependency changes, auth/security touchpoints
- `receipt`: AT URIs for pull, issue, comment, vouch, repo, and CI evidence

The passport does not say "this code is correct." It says:

> This patch is accountable enough to review, or it is missing evidence.

## Four-Minute Demo

Setup:

- Repo: `solar-knot/payments`
- Maintainer: `@mira.tangled.sh`
- Release context: `v1.4.0` freezes today
- AI agent: `@rae.bot`, DID `did:plc:rae-agent`
- Human sponsor: `@jules.dev`, already vouched by Mira

Flow:

1. Mira opens the incoming PR queue.
2. Two AI-generated PRs look superficially similar:
   - `PR #189: Fix webhook replay window`
   - `PR #190: Refactor checkout token validation`
3. `PR #189` has a complete Patch Passport:
   - agent DID and owner
   - linked security issue
   - cites the project decision about webhook windows
   - adds the missing regression test
   - spindle failed once, then passed on the focused check
   - Jules vouches for the agent after prior merged work
   - every claim has an AT URI or spindle reference
4. `PR #190` has a weak passport:
   - no linked issue
   - anonymous agent identity
   - touches auth code and deletes a test
   - no vouch
   - similar pattern was denounced by another maintainer
5. The app routes:
   - `PR #189` -> `review now`
   - `PR #190` -> `needs human context` or `cool down`
6. Mira opens `PR #189` and sees the receipt chain before the diff.
7. Close:
   `Tangled does not ask maintainers to trust AI. It makes AI patches carry
   evidence, identity, and accountability as protocol records.`

Best demo moment:

> Two AI PRs both pass tests. Only one earns review because it carries a
> Tangled Patch Passport.

## Why Tangled Is Necessary

This idea is Tangled-native because it needs multiple protocol surfaces at once:

- DIDs and handles identify the agent and human sponsor.
- Pull records make the PR protocol-addressable.
- Issue/comment records preserve the task and discussion context.
- Vouch/denounce records create a network-scoped reputation layer.
- Repo DIDs and knots show the passport survives repo movement and hosting
  boundaries.
- Spindles attach CI evidence to the same collaboration trail.
- PDS records let agents and humans publish signed/public evidence.
- Appviews and firehose ingestion let the maintainer see trust context from
  across the network.

GitHub can add an "AI-generated" badge. Tangled can show:

> This AI patch was produced by this network actor, for this issue, under this
> scope, backed by these records, and trusted or distrusted by this circle.

## What Not To Claim

Do not say:

- "We detect AI slop."
- "We prove the code is safe."
- "A vouch means auto-merge."
- "Denounced contributors are blocked."
- "The model provenance is cryptographically complete."

Say:

- "We make AI PRs accountable before review."
- "We separate submission from review reach."
- "The maintainer stays in control."
- "The passport is evidence, not proof."
- "No passport means no fast lane."

## Evidence That Supports This

| Evidence | Why It Matters |
| --- | --- |
| Tangled vouching explicitly targets LLM-generated subtle-wrong submissions. | The sponsor has already named the problem. |
| Vouches and denounces are public AT Protocol records on PDSes. | Trust context can be portable and source-linked. |
| Vouch hats appear in issues, PRs, and comments. | Trust already belongs at the point of review. |
| Denounces currently inform decisions without hard consequences. | Patch Passport can control review reach without becoming punitive moderation. |
| Pull records are ingested through the firehose. | AI PRs can be visible as protocol events. |
| Agents can create PRs by writing records to a PDS. | Agent-submitted PRs are not speculative; Tangled already points there. |
| Repo DIDs are stable across renames and future migrations. | The agent's accepted/denounced history can be tied to durable repo context. |
| Spindles run on pull request events. | Test evidence can be attached to the review decision. |
| SLSA/in-toto-style provenance exists as a broader software supply-chain pattern. | The "receipt" metaphor is credible, but Tangled can make it social and workflow-native. |

## Evidence Against / Risks

| Risk | Handling |
| --- | --- |
| No official AI-agent passport lexicon exists. | Seed it as an app-level receipt and preview a possible record. Do not require live writes. |
| "Trust score" can feel dystopian. | Avoid scores. Use missing/present evidence and maintainer-controlled lanes. |
| AI-detection is unreliable and distracting. | Do not detect AI. Treat declared or agent-origin PRs as passport-required. |
| Provenance can be faked if it is just text. | Make the demo about linked source records, not perfect cryptographic proof. |
| Too many fields can overwhelm judges. | Show one compact passport with 5 checks: identity, intent, tests, trust, provenance. |
| Sponsor may prefer existing records only. | Use issue, pull, comment, vouch, repo DID, and spindle references as the receipt. |

## Score Update

| Option | T | A | P | Read |
| --- | ---: | ---: | ---: | --- |
| **Tangled Patch Passport** | 22 | 97 | 75 | Best thesis: current pain, future-facing, Tangled-native. |
| Tangled Immune System | 24 | 95 | 71 | Wider umbrella; good pitch wrapper. |
| Project Memory / Case Law | 18 | 89 | 71 | Strong supporting evidence type. |
| Agent Passport Control | 26 | 93 | 67 | Becomes part of Patch Passport. |
| Plain Evidence Radar | 20 | 84 | 64 | Too safe unless reframed around AI PR trust. |

Decision:

> Make AI PR trust the headline. Use Immune System as the world model, Project
> Memory as one receipt field, and Evidence Radar as the UI shell.

## Build Slice

Build only:

- two AI PR cards
- one human PR control card
- one complete Patch Passport detail view
- one weak/missing passport contrast
- deterministic routing:
  - complete passport + vouched sponsor + focused spindle -> `review now`
  - missing identity + risky files + no issue -> `needs human context`
  - repeated weak pattern + denounce evidence -> `cool down`
- one Tangled comment preview:
  `Please resubmit with an issue link, focused test, and agent identity record.`

Do not build:

- live AI detection
- real agent execution
- cryptographic model attestation
- generic diff review
- enforcement/blocking
- broad dashboard analytics

## First Screen

Hero line inside the product:

> AI PRs need receipts.

Visible lanes:

- `Ready to review`: AI PRs with identity, intent, tests, trust, and provenance.
- `Missing receipts`: AI PRs missing issue, tests, owner, or record links.
- `Cool down`: repeated low-evidence submissions from weak or denounced actors.

Top card reason:

> `@rae.bot` is vouched, scoped to webhook fixes, linked to issue #91, and
> passed the focused spindle after adding a regression test.

Detail tabs:

- `Passport`
- `Evidence`
- `Diff risk`
- `Action`

## Sponsor Gate

Ask:

> Since Tangled already frames vouching as protection against LLM-generated
> subtle-wrong submissions, would an "AI PR passport" be a stronger demo than a
> general maintainer queue?

Follow-up:

> Should we model the passport using only existing pull, issue, comment, vouch,
> repo, and spindle records, or preview a custom agent-attestation record?

Interpretation:

- If yes to AI PR passport: pivot the headline immediately.
- If yes to existing records only: build seeded receipts from current records.
- If yes to custom record: preview `app.sunstead.aiPatchReceipt`.
- If no: fall back to Project Memory / Evidence Radar.

## Pitch

Twenty seconds:

> AI made code cheap, but review is still scarce. Tangled Patch Passport makes
> AI-generated PRs carry identity, intent, tests, trust, and provenance before a
> maintainer spends time on them.

Close:

> Tangled should be the forge where AI code is welcome, but never anonymous,
> context-free, or free to consume maintainer attention without receipts.

## Sources

- Tangled vouching: https://blog.tangled.org/vouching/
- Tangled newsletter 02: https://blog.tangled.org/newsletter-02/
- Tangled federation: https://blog.tangled.org/federation/
- Tangled docs: https://docs.tangled.org/single-page
- Tangled migration docs: https://docs.tangled.org/migrating-knots-and-spindles
- AT Protocol overview: https://atproto.com/guides/overview
- AT Protocol repository spec: https://atproto.com/specs/repository
- AT Protocol XRPC spec: https://atproto.com/specs/xrpc
- SLSA provenance: https://slsa.dev/provenance
- in-toto: https://in-toto.io/
