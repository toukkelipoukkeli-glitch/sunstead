# Mission Spec: Source Intake & Workspace Setup

Date: 2026-06-25

Mission ID: `M06C`

Status: BUILT / LIVE PG VERIFIED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: choose source app -> choose source data path -> connect/create Aiven workspace -> confirm shadow-migration scope -> enter control room -> `Graduate To Aiven`.
- Intentional cuts: GitHub OAuth, real file upload parsing, real Lovable Cloud import, real Aiven account creation, production auth/storage migration, full CDC, broad source support, and production cutover.

## Purpose

The current control room is strong once the run exists, but it still feels like a preloaded demo.

This mission adds the product step before the control room:

```text
What app are we migrating?
Where can Aiden read source data from?
Where should Aiden create or verify the Aiven workspace?
What scope is safe for this first click?
```

The goal is not to build full onboarding. The goal is to make the user journey credible and remove the feeling that PulseWall and Henri's Aiven workspace are invisible hardcoding.

## Source Inputs Read

- [`../../DEMO_FLOW.md`](../../DEMO_FLOW.md)
- [`../ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md`](../ONE_CLICK_AIVEN_BEHAVIOR_MIGRATION_AGENT_ARCHITECTURE.md)
- [`../../migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md`](../../migration-info/LOVABLE_SUPABASE_TO_POSTGRES_MIGRATION_GUIDE.md)
- [`../aiven-workspace-bootstrap/README.md`](../aiven-workspace-bootstrap/README.md)
- [`../access-broker-permission-ux/README.md`](../access-broker-permission-ux/README.md)

## Product Flow

The real product flow should be:

```text
Select source
  -> detect Lovable/Supabase backend
  -> choose source data path
  -> connect or create Aiven workspace
  -> confirm migration scope
  -> enter Aiden Control Room
  -> Graduate To Aiven
```

For the hackathon demo, implement this as one polished setup screen before `/control`.

## Screen Shape

Route:

```text
/setup
```

Default app entry:

```text
/ -> /setup
```

Control room remains:

```text
/control
```

## Setup Screen Layout

Use a compact operational setup surface, not a landing page and not a multi-page wizard.

Recommended screen:

```text
Aiden Workspace Setup

Source app
[x] Use PulseWall demo app
[ ] Connect GitHub repo                 Product path
[ ] Upload Lovable export               Product path

Detected source profile
Lovable/Supabase app
Supabase client usage detected
Migrations available from local export
Realtime/Auth/Storage/RLS behavior detected

Source data path
[x] Seeded demo data
[ ] Supabase DB URL / read-only access  Product path
[ ] CSV / Lovable Cloud export          Product path

Aiven workspace
[x] Henri pre-connected workspace
[ ] Connect existing Aiven workspace    Product path
[ ] Create new Aiven workspace          Product path

Migration scope
[x] Shadow migration
[x] Scoped demo cutover
[-] Production Auth adapter later
[-] Production Storage adapter later
[-] Production cutover not requested

[Continue to Control Room]
```

## Product Truth

The visible selected options should explain what is real:

| Option | Demo behavior | Product meaning |
| --- | --- | --- |
| PulseWall demo app | Real local source under `demo/pulsewall` | Placeholder for GitHub/Lovable export |
| Seeded demo data | Real deterministic seeded data path | Placeholder for Supabase dump/CSV/import |
| Henri pre-connected workspace | Real local Aiven env/MCP OAuth | Placeholder for connect/create Aiven workspace |
| Shadow migration | Real Aiven Postgres migration proof | Product default safe mode |
| Scoped demo cutover | Real local adapter cutover | Production cutover remains separate |

Do not pretend GitHub OAuth, upload parsing, or account creation are implemented. Mark them as product paths.

## Why This Matters

From the migration guide, the first real question is backend ownership:

- own Supabase project connected to Lovable;
- Lovable Cloud / managed backend;
- local export / fixture;
- CSV or dump fallback.

The user should not arrive in the control room until Aiden has a source profile. Even if the demo uses PulseWall, the UI should show that PulseWall is a selected source profile, not hidden magic.

## Data Model

Add a small run setup/profile contract. Exact names can change, but preserve the shape:

```ts
type SourceKind =
  | "pulsewall_demo"
  | "github_repo"
  | "lovable_export"

type SourceDataPath =
  | "seeded_demo_data"
  | "supabase_db_url"
  | "csv_export"
  | "lovable_cloud_export"

type AivenWorkspaceMode =
  | "henri_preconnected"
  | "connect_existing"
  | "create_new"

type MigrationScope = {
  shadowMigration: boolean
  scopedDemoCutover: boolean
  productionAuthAdapter: "later"
  productionStorageAdapter: "later"
  productionCutover: "not_requested"
}

type SetupProfile = {
  sourceKind: SourceKind
  sourceDataPath: SourceDataPath
  aivenWorkspaceMode: AivenWorkspaceMode
  migrationScope: MigrationScope
  sourceLabel: string
  workspaceLabel: string
  detectedBehaviors: string[]
}
```

The first implementation can store this in client state or submit it to `POST /api/runs`. Prefer a typed API route if it is fast.

## API Plan

Fastest acceptable implementation:

```text
POST /api/setup/profile
```

Request:

```json
{
  "sourceKind": "pulsewall_demo",
  "sourceDataPath": "seeded_demo_data",
  "aivenWorkspaceMode": "henri_preconnected"
}
```

Response:

```json
{
  "ok": true,
  "setupProfile": {
    "sourceLabel": "PulseWall demo app",
    "workspaceLabel": "Henri demo workspace",
    "detectedBehaviors": [
      "Supabase client",
      "tables",
      "realtime",
      "auth",
      "storage",
      "RLS"
    ]
  }
}
```

Alternative if time is tight:

- no backend route;
- static setup profile in React;
- clicking `Continue to Control Room` navigates to `/control`.

The control room still calls `POST /api/runs` on boot. That is acceptable for the hackathon if the setup screen clearly shows the selected profile.

## Frontend Plan

Add:

```text
src/apps/control-room/src/pages/SetupPage.tsx
```

Update routing so:

```text
/       -> setup page
/setup  -> setup page
/control -> existing control room
```

Setup controls:

- source selector cards;
- source data path selector cards;
- Aiven workspace selector cards;
- migration scope summary;
- `Continue to Control Room` primary button.

Disabled/product-path options must be visible but not selectable unless implementation time allows.

## Copy Rules

Use:

```text
Use PulseWall demo app
Connect GitHub repo
Upload Lovable export
Seeded demo data
Supabase DB URL / read-only access
CSV / Lovable Cloud export
Henri pre-connected workspace
Connect existing Aiven workspace
Create new Aiven workspace
Shadow migration
Production cutover not requested
```

Avoid:

```text
Hardcoded app
Fake source
Paste secrets
Database password
Magic demo
```

## Demo Script Change

Insert one beat before the current control room:

> Aiden starts with the app source. In production this would be a GitHub repo, Lovable export, or direct Supabase project. For the live demo I select PulseWall, seeded demo data, and Henri's pre-connected Aiven workspace.

Then:

> Now Aiden has enough context. The product action is still one click: Graduate To Aiven.

## Acceptance

- `/setup` exists and is the default entry screen.
- The setup screen has visible demo profile groups for source app, source data path, and Aiven workspace.
- PulseWall and Henri workspace are visible selected choices, not hidden assumptions.
- GitHub repo, Lovable export, Supabase DB URL, CSV export, connect workspace, and create workspace appear as product paths without pretending they are implemented.
- `Continue to Control Room` opens the existing `/control` flow.
- Existing `Graduate To Aiven` live one-click path still passes.
- No secrets are shown or committed.
- The setup screen looks like part of the product, not a marketing landing page.

## Implemented

- `/` and `/setup` now render `SetupPage`.
- `/control` still renders the existing control room.
- The setup screen shows PulseWall demo app, seeded demo data, and Henri's pre-connected workspace as selected demo profile choices.
- GitHub repo, Lovable export, Supabase DB URL/read-only access, CSV/Lovable Cloud export, connect workspace, and create workspace remain visible as product paths.
- `Continue to Control Room` stores a typed browser-side `SetupProfile` in `sessionStorage` and navigates to `/control`.
- No backend setup route was added in this mission; the control room still creates/runs the migration through the existing run APIs.
- Raw credentials remain outside the UI and docs.

## Verification

Run:

```text
npm run typecheck
npm exec --workspace @aiden/control-room vite -- build
npm run verify:live -- --one-click
```

Manual check:

- open `/setup`;
- confirm the selected demo profile is visible;
- click `Continue to Control Room`;
- confirm `/control` loads;
- run `Graduate To Aiven`.

## Cut Line

If time is tight:

- implement static setup page only;
- use local React state;
- navigate to `/control`;
- do not add API route;
- do not add upload/OAuth.

If time remains:

- add `SetupProfile` to `RunSnapshot`;
- show the selected source/workspace labels in the control room header;
- add `POST /api/setup/profile` or fold setup profile into `POST /api/runs`.
