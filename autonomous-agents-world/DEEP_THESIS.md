# Deep Thesis: Freedom With Receipts

## Position

The most interesting Tangled world is not "AI agents do code review."

It is:

> autonomous agents become first-class open-source actors, and Tangled gives
> open source a protocol-native social contract for trusting them.

That social contract is:

> maximum freedom to act, radical transparency for every action.

Or shorter:

> Freedom with receipts.

## The World Shift

Software collaboration is moving through three phases:

1. **Human-only forges**: people write code, people review code, platforms host
   the coordination.
2. **Hidden-agent forges**: agents work behind SaaS boundaries, with opaque
   prompts, private logs, and platform-owned context.
3. **Protocol-native agent forges**: humans and agents both act in the open,
   and their actions carry portable identity, intent, evidence, and reputation.

Tangled should aim at phase 3.

The opportunity is not just "add an agent to Tangled." The opportunity is to
show what a forge looks like when agents are open network participants instead
of hidden backend workers.

## The Tension

Autonomous agents create a real contradiction:

- Open source wants low-friction contribution.
- Maintainers need protection from low-quality work.
- Agents can produce useful fixes at scale.
- Agents can also produce plausible noise at scale.
- Permission walls kill the openness.
- Unbounded review demand burns maintainers.

The product should not resolve this by blocking agents.

It should resolve it by separating two rights:

| Right | Meaning |
| --- | --- |
| Freedom to publish | Anyone, including agents, can create work and records. |
| Right to attention | Maintainers decide what earns review reach. |

This is the key conceptual move.

> Submission should stay open. Review attention should be earned with evidence.

That is exactly where Tangled's protocol layer matters.

## Why AT Protocol Matters

In a normal forge, agent accountability is usually platform-local:

- bot account
- hidden API key
- private logs
- local CI result
- local maintainer notes

In a Tangled/AT Protocol world, agent accountability can be network-native:

- DID and handle identify the agent
- PDS records publish the agent's actions
- AT URIs address the evidence
- pull and comment records make collaboration state portable
- vouches and denounces create social context
- repo DIDs and knots anchor the work to a portable repo identity
- spindles attach automated checks to the same story
- appviews/firehose make actions discoverable without a central black box

That gives the hackathon demo a clear claim:

> Agents do not just use Tangled. Agents become legible through Tangled.

## What "Radical Transparency" Means

Radical transparency does not mean publishing everything.

It means every action that asks for maintainer attention should expose enough
structured evidence to be judged.

For an agent PR, that means:

- Who is the agent?
- Who owns or sponsors it?
- What was it trying to do?
- What issue, comment, or request triggered it?
- What files did it touch?
- What tests did it add or run?
- What did the spindle say?
- What prior work supports trusting it?
- Who vouched for it, if anyone?
- What record URIs back those claims?

The transparency target is not surveillance.

The transparency target is reviewability.

## The New Primitive

The new primitive should be:

> an action receipt.

An action receipt is the public evidence bundle attached to a meaningful agent
action.

For a PR, it becomes:

> a review passport.

For a sequence of agent decisions, it becomes:

> a flight recorder.

For a long-lived agent, it becomes:

> an agent passport.

These are the same object viewed at different scales.

| Scale | Object | Question Answered |
| --- | --- | --- |
| Single action | Action receipt | Why did this happen, and what evidence came with it? |
| Single PR | Review passport | Is this patch reviewable? |
| Agent session | Flight recorder | What did the agent do from task to PR? |
| Agent identity | Agent passport | Has this actor earned review reach before? |

## Why This Is Original And Inspiring

The challenge criteria reward original and inspiring integrations that lean into
AT Protocol primitives.

This thesis is stronger than a normal code-review agent because the exciting
thing is not the model output.

The exciting thing is:

> a future where autonomous agents can participate in open source without hiding
> inside private infrastructure.

The demo should make the judge feel:

> This is what agents on an open protocol should look like.

## What The Demo Must Prove

The demo must prove three claims quickly:

1. The agent can act.
2. The action is visible as Tangled/AT Protocol evidence.
3. The maintainer can decide review reach from the evidence.

A strong demo:

1. `@rae.bot` sees issue #91 and opens a focused PR.
2. The PR has a flight recorder:
   - agent DID
   - owner DID
   - trigger issue
   - prompt/task summary
   - files changed
   - test added
   - spindle result
   - vouch from `@jules.dev`
   - PR/comment AT URIs
3. `@patchfox.bot` opens a similar patch with no owner, no issue link, and no
   tests.
4. Mira sees:
   - Rae: `Trusted agent lane`
   - Patchfox: `Missing receipts`
5. The product says:

> Both agents are free to submit. Only one has earned review attention.

That is the whole thesis in one screen.

## What To Avoid

Avoid the dead ends:

- **AI reviewer**: too generic, model output is not Tangled-native.
- **AI slop detector**: brittle and negative; detection is not the point.
- **Trust score**: too reductive and politically risky.
- **Agent permission system**: kills the freedom side of the thesis.
- **Opaque backend orchestration**: contradicts radical transparency.
- **Big dashboard**: loses the first-minute story.

## Product Sentence

Best current sentence:

> Tangled Agent Flight Recorder lets autonomous agents open PRs with public,
> protocol-native receipts: identity, intent, tests, vouches, CI, and source
> records.

More philosophical:

> Tangled is where autonomous agents get freedom, and maintainers get receipts.

Most judge-friendly:

> Our agent opens a PR, and Tangled shows exactly who it is, why it acted, what
> it changed, what checks ran, and why the maintainer should or should not spend
> review time.

## Strategic Recommendation

Build the first demo around **Agent Flight Recorder**, not a general Review
Passport dashboard.

Reason:

- The challenge explicitly calls out autonomous agents.
- The criteria reward original and inspiring projects.
- A live-ish agent action is more memorable than a static queue.
- Review Passport still appears as the object attached to the PR.
- Evidence Radar remains useful as the UI surface.

The build should be:

> one agent, one issue, one PR, one flight recorder, one maintainer decision.

Not:

> an entire agent platform.

## Final Thesis

> Open source can stay open in the agent era only if agents are free to act and
> their actions are radically transparent. Tangled is the protocol-native forge
> where that social contract can exist.
