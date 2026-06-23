# AGENTS.md

This repo exists to help win hackathons. Optimize for score, demo quality, and submission quality under time pressure.

Before building, always check:

1. What is the primary scoring mode: `business-first`, `product-first`, or `technical-first`?
2. Is this an `open-ended creative` challenge or a `sponsor-needs` challenge?
3. How is judging done: live expo, live pitch, demo table, Devpost-style submission, code review, sponsor side prize?
4. What are the required APIs, rules, team limits, and submission constraints?
5. Which track has the best expected value for this team?

If any of those are unknown, flag it before doing large implementation work.

Default agent behavior:

- prefer the shortest path to a strong, memorable demo
- optimize for what judges can see and understand in under 3 minutes
- cut invisible technical work unless it directly improves demo reliability
- bias toward one polished flow over many half-finished features
- keep the story aligned with the judging rubric and sponsor goals
- treat time with judges, mentors, and organizers as high-value product research
- keep fallback plans for flaky APIs, bad wifi, and demo risk

Secrets policy:

- local agents may use env keys available on the machine
- secrets must never be committed, printed into docs, or added to examples with real values
- keep `.env.local` and similar files out of git

Execution policy:

- ask who is presenting and optimize the product for that person's flow
- prefer visible polish, crisp copy, seeded data, and smooth happy paths
- if a sponsor or judge gives direct feature guidance, treat that as strong signal
- if a sponsor or judge reacts positively to a feature idea, move that feature up fast
- do not add features just because they are technically interesting
- if a live deployment is not needed for judging, do not spend late hours on it
- if one project can enter multiple tracks legally, preserve that optionality
- if multi-track entry is legal, prefer one core build with multiple sponsor-facing wrappers over multiple unrelated builds
- research judge and sponsor backgrounds when available and adapt framing to their likely incentives

When proposing work, state:

1. the detected hackathon type
2. the judging/submission mode
3. the chosen track or target tracks
4. the core demo flow
5. what will be intentionally cut
