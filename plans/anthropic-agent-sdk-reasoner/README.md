# Mission Spec: Anthropic Agent SDK Report Reasoner

Date: 2026-06-25

Mission ID: `M05.7`

Status: LIVE VERIFIED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: PulseWall source app -> one visible `Graduate To Aiven` action -> deterministic bounded agents run the Aiven migration workflow -> Anthropic Agent SDK writes the behavior/report language from sanitized proof facts -> final report remains backed by receipts and validations.
- Intentional cuts: LLM-controlled database mutation, LLM-controlled Kafka mutation, free-form shell agents, production cutover autonomy, and broad multi-agent infrastructure.

## Purpose

The repo now has the real one-click path:

```text
Graduate To Aiven
  -> source scan
  -> Aiven proof spine
  -> Aiven Postgres migration
  -> scoped provider cutover
  -> Kafka proof or warning
  -> final report
```

This mission adds Anthropic Agent SDK usage without weakening that safety model.

The Agent SDK should make the demo more credible as an agentic system, but it must not become the migration executor. Aiden's infrastructure actions stay deterministic, typed, and receipt-backed.

## Architecture Decision

Use `@anthropic-ai/claude-agent-sdk` only behind the existing `AgentReasoner` interface.

Allowed Agent SDK role:

```text
Report / CTO Agent
  -> receives sanitized JSON facts
  -> writes behavior summary, CTO recommendation, failure explanation
  -> returns text only
```

Forbidden Agent SDK role:

```text
Migration Executor
  -> no direct database writes
  -> no Kafka writes
  -> no Aiven service mutation
  -> no shell commands
  -> no file edits
  -> no MCP tools
  -> no secret handling
```

This preserves the core product claim:

> The agents are bounded operators. The LLM writes explanations; deterministic tools execute the migration and leave receipts.

## SDK Boundary

The implementation must use the Anthropic Agent SDK:

```text
@anthropic-ai/claude-agent-sdk
```

Use the SDK `query()` API with restrictive options:

```ts
query({
  prompt,
  options: {
    maxTurns: 1,
    tools: [],
    disallowedTools: [
      "Bash",
      "Edit",
      "Write",
      "Read",
      "Glob",
      "Grep",
      "WebFetch",
      "WebSearch",
      "Agent"
    ],
    mcpServers: {},
    strictMcpConfig: true,
    settingSources: [],
    permissionMode: "default",
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
    }
  }
})
```

Notes:

- `tools: []` and `disallowedTools` keep the agent text-only.
- `strictMcpConfig: true` prevents project MCP tools from being exposed to this reasoner.
- `settingSources: []` prevents local Claude settings from unexpectedly adding tools or behavior.
- `maxTurns: 1` prevents a multi-step agent loop.
- The deterministic fallback remains required.

## Env Contract

Use local `.env.local`; never commit real values.

```text
ANTHROPIC_API_KEY=...
AGENT_REASONER=anthropic
ANTHROPIC_MODEL=sonnet
CLAUDE_CODE_EXECUTABLE=/home/henri/.local/bin/claude
```

Behavior:

| Env | Behavior |
| --- | --- |
| `AGENT_REASONER=anthropic` and key exists | Use Anthropic Agent SDK reasoner |
| `ANTHROPIC_API_KEY` exists and `AGENT_REASONER` is unset | Use Anthropic Agent SDK reasoner for the demo |
| `AGENT_REASONER=off` | Force deterministic reasoner |
| key missing or SDK fails | Fall back to deterministic reasoner |

For demo reliability, `AGENT_REASONER=off` is the explicit escape hatch.

On WSL/ARM64, the bundled SDK native binary may fail. The API should prefer `CLAUDE_CODE_EXECUTABLE` when set and otherwise use `~/.local/bin/claude` when present before falling back to the bundled SDK binary.

## Sanitized Inputs

The Agent SDK reasoner may receive only these facts:

- behavior finding names, classifications, targets, and proof sources;
- final report status fields;
- row validation counts and statuses;
- validation check names/statuses/sources;
- receipt counts and high-level tools;
- blockers and rollback text already safe for UI.

The reasoner must never receive:

- full database URLs;
- API tokens;
- Kafka passwords;
- source service-role keys;
- raw `.env.local` contents;
- unredacted error messages;
- arbitrary repo files.

## Output Contract

The reasoner may produce:

- `behaviorSummary`;
- `recommendation`;
- `failureExplanation`.

The reasoner may not produce or override:

- row counts;
- readiness score;
- pass/fail status;
- proof source labels;
- receipt contents;
- rollback facts;
- cutover status.

Record proof metadata in `proof.package.generated.details`:

```json
{
  "agentRuntime": "deterministic_step_registry",
  "reasoner": "anthropic_agent_sdk",
  "requestedReasoner": "anthropic_agent_sdk",
  "reasonerFallback": false,
  "reasonerModel": "sonnet",
  "behaviorSummary": "...",
  "recommendation": "..."
}
```

If the SDK fails:

```json
{
  "reasoner": "deterministic",
  "requestedReasoner": "anthropic_agent_sdk",
  "reasonerFallback": true,
  "reasonerError": "redacted safe error"
}
```

## Implementation Plan

1. Install `@anthropic-ai/claude-agent-sdk`.
2. Remove any direct Anthropic Messages API/fetch implementation from the reasoner.
3. Add `anthropicAgentSdkReasoner` behind the existing `AgentReasoner` interface.
4. Keep `deterministicReasoner` as the default fallback.
5. Make `selectAgentReasoner()` choose SDK when `ANTHROPIC_API_KEY` exists unless `AGENT_REASONER=off`.
6. Send sanitized structured facts only.
7. Parse SDK stream results into a single text string.
8. Store reasoner metadata in `proof.package.generated.details`.
9. Surface generated recommendation in `RunSnapshot.report.ctoRecommendation`.
10. Update verifier to assert Anthropic Agent SDK metadata when `AGENT_REASONER=anthropic`.
11. Run typecheck, Vite build, separate-step verifier, and one-click verifier.

## Acceptance

- `@anthropic-ai/claude-agent-sdk` is installed and imported by the API.
- The one-click migration still passes with `AGENT_REASONER=off`.
- The one-click migration still passes with `AGENT_REASONER=anthropic`.
- With Anthropic enabled, `proof.package.generated.details.reasoner` is `anthropic_agent_sdk` unless the SDK fails.
- If the SDK fails, the run still completes with deterministic report text and `reasonerFallback: true`.
- No secrets are printed, committed, sent to the browser, or included in reasoner prompts.
- The Agent SDK cannot call shell, edit files, read arbitrary files, use MCP, or mutate infrastructure from this reasoner path.
- The SDK can use a configured standalone Claude Code executable when the bundled native binary is not reliable.

## Presenter Language

Use this if asked where Anthropic comes in:

> Aiden uses Anthropic's Agent SDK for the Report and CTO Agent. The migration itself is controlled by deterministic typed operators; the SDK turns sanitized receipts, checks, and blockers into the executive recommendation.

Use this if the SDK falls back:

> The Agent SDK is a text layer, not a migration dependency. If it is unavailable, Aiden still completes the migration with deterministic proof text.
