# Mission Spec: Aiven Workspace Bootstrap

Date: 2026-06-25

Mission ID: `M06B`

Status: BUILT / LIVE PG VERIFIED

Implemented:

- first-screen setup copy now says `Aiven Workspace Setup`;
- command path shows `Henri demo workspace`;
- cold-open copy says the demo uses Henri's pre-connected workspace and Aiden can create a workspace during setup;
- backend access-check labels are workspace-first while preserving the existing `AccessSnapshot` gates;
- `npm run verify:live -- --one-click` passes after the copy/UI changes.

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: source app imported -> Aiven workspace connected -> `Graduate To Aiven` -> behavior scan -> live Aiven Postgres migration -> scoped runtime cutover -> Kafka warning/proof slot -> final report.
- Intentional cuts: real Aiven account creation, billing setup, production auth migration, production storage migration, full CDC, Aiven Apps deployment, and real production cutover.

## Product Decision

Frame Aiden as an Aiven-native migration operator, not as a tool asking users to paste random infrastructure credentials.

Product promise:

```text
If you have an Aiven account, Aiden connects to your workspace.
If you do not, Aiden creates an Aiven workspace for you.
Then Aiden provisions and verifies the target data plane.
```

Demo truth:

```text
For the hackathon demo, Aiden uses Henri's pre-connected Aiven workspace.
The workspace is wired through local `.env.local` values and Aiven MCP OAuth.
No real secrets are committed, printed, shown in the browser, or embedded in docs.
```

The product can say "Aiden creates the Aiven account/workspace if you do not have one." The demo must say "pre-connected demo workspace" if asked how that part is implemented.

## Why This Is Stronger

The old story sounds like:

```text
Give Aiden access to many systems.
```

The stronger story sounds like:

```text
Aiden brings the app into an Aiven workspace.
```

This better matches sponsor incentives:

- Aiven becomes the destination and control plane, not merely a database target.
- The setup step becomes account/workspace onboarding, not credential collection.
- The demo feels like a future Aiven-native product.
- The permission story stays safe and bounded.

## Product Modes

| Mode | User has Aiven account? | Product behavior | Hackathon implementation |
| --- | --- | --- | --- |
| Connected workspace | Yes | User signs in / OAuth connects workspace | Use Henri's Aiven MCP OAuth and local env |
| Create workspace | No | Aiden creates starter Aiven account/workspace | Simulated/claimed as product path only |
| Demo workspace | N/A | Aiden uses pre-provisioned demo workspace | Current local demo path |

Do not implement real account creation during the hackathon unless Aiven provides an official, safe, sponsor-approved API path and it is faster than rehearsal.

## UI Framing

Replace credential-first wording with workspace-first wording.

Preferred labels:

```text
Aiven Workspace
Workspace: Henri demo workspace
Account: connected
Project: selected
Aiven Postgres: live verified
Aiven Kafka: optional production event path
```

Secondary setup states:

```text
No Aiven account? Aiden can create a workspace during setup.
Demo mode: using pre-connected Aiven workspace.
Production cutover: not requested.
```

Avoid:

```text
Paste Aiven credentials
Need database password
Bring your own target database
Hardcoded credentials
```

Use:

```text
Connected workspace
Pre-connected demo workspace
Local secret-backed demo workspace
Workspace bootstrap
```

## Demo Copy

Presenter line:

> Aiden is running inside a connected Aiven workspace. If a customer does not have one, Aiden would create the workspace during setup. For the live demo, this is Henri's pre-connected Aiven workspace, so the one-click migration can go straight to provisioning and verification.

Shorter version:

> We are not pasting target database credentials. Aiden has an Aiven workspace context, and it provisions the target runtime there.

When asked whether the account creation is real:

> The demo uses a pre-connected Aiven account. The product path is account/workspace creation or OAuth connection, depending on whether the user already has Aiven.

## Security Rule

The demo may be hardwired to Henri's Aiven workspace behavior, but it must not hardcode raw credentials.

Allowed:

- hardcode the visible workspace label;
- hardcode the demo mode label;
- load local secrets from ignored `.env.local`;
- use Aiven MCP OAuth configured in local Codex settings;
- show safe service names and proof states.

Forbidden:

- commit Aiven Postgres URLs;
- commit tokens, usernames, passwords, service-role keys, or Kafka credentials;
- show raw `.env.local` contents;
- print connection strings in verifier output;
- expose secrets in browser env or screenshots.

## Access Broker Relationship

M06A remains useful, but its user-facing framing should become workspace-first.

Map:

| Existing concept | New framing |
| --- | --- |
| Access Broker | Aiven Workspace Setup |
| Aiven MCP OAuth | Workspace connected |
| Aiven project | Project selected |
| Aiven Postgres | Target runtime live verified |
| Aiven Kafka | Optional production event path |
| Production cutover | Not requested |

The underlying `AccessSnapshot` can stay the same. This mission is primarily copy, first-screen story, and demo framing.

## Implementation Plan

1. Update critical-path docs and demo script language.
2. Rename visible panel copy from credential/access-first to workspace-first.
3. Keep the existing `AccessSnapshot` contract and preflight checks.
4. Add a safe demo workspace label such as `Henri demo workspace`.
5. Add one UI line: `No Aiven account? Aiden can create a workspace during setup.`
6. Ensure the UI also says: `Demo mode: using pre-connected Aiven workspace.`
7. Do not implement real account creation.
8. Re-run typecheck, build, and live verifier.

## Acceptance

- Judges understand Aiden is an Aiven workspace operator.
- The setup story is "connect or create Aiven workspace," not "paste credentials."
- Demo remains honest that Henri's pre-connected Aiven workspace is used.
- No real credential is committed, printed, or exposed.
- `Graduate To Aiven` still gates on the existing required checks.
- `npm run verify:live -- --one-click` still passes.

## Cut Line

If time is tight, only change:

- critical-path wording;
- Access Broker panel heading/copy;
- presenter line.

Do not spend time on real signup, billing, or account creation APIs before rehearsal.
