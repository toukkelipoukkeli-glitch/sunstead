# Evidence Radar AT Protocol Strategy

This subdir is the deeper argument for how **Tangled Evidence Radar** uses AT
Protocol in a way that is real, visible, and worth judging.

Read this packet in order:

1. [DEEP_THESIS.md](DEEP_THESIS.md)
2. [INTEGRATION_PLAN.md](INTEGRATION_PLAN.md)
3. [PITCH_NOTES.md](PITCH_NOTES.md)

## Position

Evidence Radar should not pitch "AI ranks PRs." That is crowded and portable to
GitHub.

The pitch is:

> Tangled turns open-source collaboration into portable network records. Evidence
> Radar uses those records to make maintainer decisions explainable,
> auditable, and faster.

The product uses AT Protocol as the **evidence substrate**:

- Git and knots carry code.
- Tangled records carry collaboration state.
- AT Protocol gives records portable identity, addressing, and sync semantics.
- Evidence Radar turns that network evidence into one maintainer decision:
  what to review next.

## What Is AT Protocol-Native

| Layer | Primitive | Demo Use |
| --- | --- | --- |
| Identity | DID plus handle resolution | Show that `@jules.dev` resolves to `did:plc:jules-vouched`. |
| Addressing | `at://` URIs | Every evidence chip can reveal the source record URI. |
| User-owned records | PDS-hosted repo records | Show that work is attached to people, not just one forge database. |
| Schemas | Lexicon-defined records | Treat pull, issue, comment, and vouch records as typed evidence. |
| Sync | Firehose/appview ingestion | Explain how the queue can update across users and knots. |
| Writes | XRPC/PDS record creation | Future/live path for comments, vouches, or PR drafts. |

## What Is Tangled-Specific

| Tangled Surface | Why It Matters |
| --- | --- |
| Repo DID | Keeps repository identity stable beyond one `owner/name` string. |
| Knot | Shows code can live outside one central forge. |
| Pull record | Makes review work protocol-addressable. |
| Issue record | Connects priority to maintainer pain. |
| Feed comment/reaction | Makes discussion part of the evidence trail. |
| Vouch/denounce record | Changes review friction using social trust. |
| PR rounds | Lets the app say "round 3 only changed one risky file." |
| Spindle result | Ties CI state to the collaboration timeline. |

## Non-Negotiable Demo Proof

The first minute must show at least four of these:

- handle
- DID
- `at://` pull record URI
- issue record URI
- vouch record URI
- feed comment URI
- repo DID
- knot
- spindle result
- PR round/delta

If those are not visible, judges can fairly read the product as a generic GitHub
dashboard.

## The Sharpest Version

Open on one sentence:

> This PR is first because the author is vouched, the linked security issue
> blocks today's release, the failing spindle is focused, and the latest round
> changed only one file.

Then reveal the evidence trail:

1. `@jules.dev` resolves to `did:plc:jules-vouched`.
2. Mira's vouch record reduces review friction.
3. Sana's issue record marks the release blocker.
4. Sana's comment record confirms the acceptable replay window.
5. The pull record and round delta prove the change is narrow.
6. The spindle result tells Mira exactly what remains.

That is the moment where Tangled/AT Protocol becomes necessary.

## Live Vs Seeded Boundary

Seeded demo data is acceptable if it is honest and the live path is legible.

| Piece | Hackathon Build | Live Path |
| --- | --- | --- |
| Queue data | Seeded JSON in `src/data.ts` | Appview/firehose indexed Tangled records. |
| Identity | Seeded handle/DID pairs | DID/handle resolution through AT Protocol. |
| Evidence URIs | Seeded `at://...` references | Resolve records from PDS/appview/XRPC. |
| Ranking | Deterministic scoring | Same scoring over live indexed records. |
| Action | Deep link to Tangled | XRPC write for comment, vouch, or draft PR action. |

The live path should be described, but the judged happy path should not depend on
live auth, rate limits, or Wi-Fi.

## Sources

- Tangled docs: <https://docs.tangled.org/single-page>
- Tangled intro: <https://blog.tangled.org/intro/>
- Tangled federation: <https://blog.tangled.org/federation/>
- Tangled vouching: <https://blog.tangled.org/vouching/>
- Tangled newsletter: <https://blog.tangled.org/newsletter-02/>
- AT Protocol overview: <https://atproto.com/guides/overview>
- AT Protocol repository spec: <https://atproto.com/specs/repository>
- AT Protocol XRPC spec: <https://atproto.com/specs/xrpc>
