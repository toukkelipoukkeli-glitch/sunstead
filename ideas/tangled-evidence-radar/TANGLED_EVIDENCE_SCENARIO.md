# Tangled Evidence Scenario

Seed data and storyboard for **Tangled Evidence Radar**.

Status: Mission 03 skeleton. Exact live record schemas are still warm; this file
defines the demo contract for the prototype.

## Demo Premise

Maintainer Mira opens Evidence Radar for `@mira.tangled.sh` and sees which
Tangled work item deserves attention next. The ranking is not a generic AI
priority score: it is backed by protocol-visible evidence.

Demo repo:

- Name: `solar-knot/payments`
- Repo DID: `did:plc:repo-solar-payments`
- Knot: `knot.helsinki.dev`
- Default branch: `main`
- Maintainer: `@mira.tangled.sh`
- Release context: `v1.4.0` release candidate freezes today.

## Personas

| Person | Handle | DID | Role | Trust state | Demo role |
| --- | --- | --- | --- | --- | --- |
| Mira | `@mira.tangled.sh` | `did:plc:mira-maintainer` | Maintainer | Owner | Presenter persona. |
| Jules | `@jules.dev` | `did:plc:jules-vouched` | Contributor | Vouched by Mira and two maintainers | High-trust PR author. |
| Niko | `@niko.dev` | `did:plc:niko-new` | First-time contributor | Unknown | Needs context, not rejection. |
| Sana | `@sana.sec` | `did:plc:sana-security` | Security maintainer | Vouched by Tangled core maintainer | Escalates advisory-related work. |
| Rae | `@rae.bot` | `did:plc:rae-bot` | Automation | Service account | Posts spindle and webhook evidence. |

## Evidence Types

| Evidence | Demo field | Why it matters |
| --- | --- | --- |
| Pull record | `at://did:plc:jules-vouched/sh.tangled.repo.pull/payments-184` | Shows the work item is protocol-addressable. |
| Issue record | `at://did:plc:sana-security/sh.tangled.repo.issue/payments-91` | Links PR priority to a concrete maintainer pain. |
| Vouch record | `at://did:plc:mira-maintainer/sh.tangled.graph.vouch/jules` | Justifies lower review friction for a contributor. |
| Feed comment | `at://did:plc:sana-security/sh.tangled.feed.comment/comment-552` | Shows discussion is portable evidence. |
| Spindle result | `spindle://knot.helsinki.dev/solar-knot/payments/runs/8821` | Makes CI state visible in the evidence trail. |
| Repo identity | `did:plc:repo-solar-payments` | Keeps the story Tangled-native instead of GitHub-native. |

## Ranked Work Items

| Rank | Item | Type | Status | Evidence-backed reason | Presenter action |
| ---: | --- | --- | --- | --- | --- |
| 1 | `PR #184: Harden webhook signature verification` | Pull request | Review now | Vouched author, release-critical files, failing spindle security test, linked security issue. | Open evidence trail and approve requested changes. |
| 2 | `Issue #91: Webhook replay risk before v1.4.0` | Issue | Review now | Vouched security reporter, active discussion, linked to top PR. | Show why the PR is first. |
| 3 | `PR #186: Add Danish locale strings` | Pull request | Safe to batch | Known contributor, passing spindle, no release-critical files. | Deprioritize confidently. |
| 4 | `PR #187: Replace checkout session cache` | Pull request | Needs context | First-time contributor, touches payment cache, no vouch, tests pass. | Request maintainer context instead of rejecting. |
| 5 | `Issue #93: Knot deploy docs mention old env var` | Issue | Safe to ignore today | Docs-only, no release impact, no linked PR. | Batch after release. |
| 6 | `PR #188: Refactor billing adapter naming` | Pull request | Safe to ignore today | Cosmetic, no CI failure, no discussion. | Skip in demo. |

## Top Item Evidence Trail

Work item:

- Title: `PR #184: Harden webhook signature verification`
- Author: `@jules.dev`
- Pull record: `at://did:plc:jules-vouched/sh.tangled.repo.pull/payments-184`
- Repo: `did:plc:repo-solar-payments`
- Branch: `jules/webhook-signature-window`
- Files: `src/webhooks/verify.ts`, `src/payments/replay-window.ts`,
  `tests/webhooks/verify.test.ts`

Evidence sequence shown on click:

1. **Identity**: `@jules.dev` resolves to `did:plc:jules-vouched`.
2. **Trust**: Mira and two maintainers have vouched for Jules; no denounces.
3. **Problem link**: security issue #91 reports replay risk before `v1.4.0`.
4. **CI**: spindle run `8821` failed only `webhook-signature-window`.
5. **Conversation**: Sana comments that a 5-minute window is acceptable.
6. **Round delta**: round 3 only changed `verify.ts` and the failing test.
7. **Recommended action**: review now; ask for one small test fix, then merge.

## Ranking Rules

Use deterministic scoring in the prototype. No model call is required for the
first build.

Positive signals:

- `+35` linked to release-blocking issue.
- `+25` failing or security-relevant spindle result.
- `+20` vouched contributor.
- `+15` recent maintainer/security comment.
- `+10` narrow latest-round delta.

Negative or deferral signals:

- `-20` no trust signal and high-risk files touched.
- `-15` docs/copy-only and no release impact.
- `-10` passing CI with no open discussion.

Buckets:

- `Review now`: score `60+`.
- `Needs context`: score `30-59` or unknown trust on high-risk files.
- `Safe to batch`: score below `30`.

## First Screen Requirements

- Show the maintainer, repo DID, knot, and release context in the header.
- Show three columns or filters: `Review now`, `Needs context`, `Safe to batch`.
- Top card must expose the reason in one sentence:
  `Vouched author + failing spindle + release-blocking security issue`.
- Every top-card evidence chip must reveal a protocol-ish reference on click or
  hover.
- The detail view must show the evidence timeline before any generic summary.

## Acceptance Criteria

- A judge can explain why PR #184 is first after seeing the app for 20 seconds.
- At least four Tangled/ATProto primitives are visible in the first minute.
- The demo still works offline with seeded data.
- The same UI would become weaker if handles/DIDs/vouches/spindles/AT URIs were
  removed.

## Open Questions

- Exact live XRPC/read path for pull/issue/comment/vouch records.
- Whether sponsor expects write-side record creation.
- Whether a real Tangled repo should be created for the final demo or seeded
  records are acceptable.
