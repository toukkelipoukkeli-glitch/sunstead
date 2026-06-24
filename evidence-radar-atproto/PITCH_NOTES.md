# Pitch Notes

Use this to keep the 4-minute pitch sharp.

## 15-Second Version

> Evidence Radar turns Tangled's protocol records into auditable maintainer
> decisions.

Alternate:

> Git preserves what changed. Tangled can preserve why maintainers trust, reject,
> fast-track, or block a change.

## 45-Second Version

Open-source maintainers do not just need another PR summary. They need to know
which decision is safe right now.

On GitHub, a lot of that context is trapped in one forge database. Tangled puts
collaboration on AT Protocol: identities, records, trust, discussion, and repo
metadata can be addressed and replayed.

Evidence Radar turns that into a maintainer workflow. Mira opens her repo, sees
the top review item, and can inspect exactly why it is first.

Deeper wrapper:

> This is Project Memory for Tangled: maintainer judgment with receipts.

## Demo Beats

1. "This is Mira's Tangled repo. Notice the repo DID and knot in the header."
2. "The app is not sorting by activity. It is ranking by evidence."
3. "The top PR is first because Jules is vouched, the linked security issue
   blocks today's release, and the spindle failure is focused."
4. "Opening it shows the source records: DID, vouch, issue, comment, pull record,
   and spindle result."
5. "That is the point: Tangled makes review decisions auditable because the
   collaboration context is network-native."

## Judge Q&A

**Is this live?**

The prototype uses seeded records for reliability, but the data model maps
directly to Tangled/ATProto records and spindle state. The live path is appview
or firehose ingestion into the same `WorkItem` and `Evidence` shapes.

**Why not just GitHub plus AI?**

GitHub plus AI can summarize diffs. This ranks a maintainer decision from
portable identity, trust, repo, issue, comment, pull, and CI evidence. Remove
those records and the product gets weaker.

**Why not write PR comments automatically?**

That is the write-side pivot. The safer core demo proves the evidence model
first. If sponsor feedback favors writes, the next step is one XRPC-backed
comment or draft PR record.

**What is the business/user value?**

Maintainers spend less time reconstructing context and more time making the
right review decision. For Tangled, it demonstrates why decentralized social
coding is more than self-hosted Git: the protocol data improves workflow.

## Dangerous Phrases

Avoid:

- "AI code review"
- "GitHub alternative"
- "dashboard"
- "analytics"
- "trust score"
- "smart queue"
- "we would integrate later"

Prefer:

- "protocol evidence"
- "portable maintainer context"
- "auditable review decision"
- "Tangled-native trust signal"
- "seeded demo, clear live path"
- "maintainer judgment with receipts"
- "Project Memory for Tangled"
