# UI Implementation Spec

Date: 2026-06-25

## Purpose

This spec turns `UI_DECISION_PACKAGE.md` into concrete frontend work.

It owns:

- route structure;
- component ownership;
- visual tokens;
- visible copy rules;
- implementation sequence;
- UI acceptance gates.

It does not own runtime contracts, Aiven proof behavior, or the demo script.

Authority order:

1. `DEMO_FLOW.md` owns what judges see and in what order.
2. `UI_DECISION_PACKAGE.md` owns visual direction and emotional intent.
3. This file owns the concrete frontend implementation plan.
4. `RUNTIME_CONTRACTS.md` owns data and API shapes.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: PulseWall Lovable/Supabase app -> one-click `Graduate To Aiven` -> behavior scan -> Aiven landing zone -> data and event validation -> scoped Aiven-backed runtime -> migration report.
- Intentional cuts: production auth migration, production storage migration, full CDC, all source platforms, Aiven Apps deploy, broad agent-framework showcase, and multi-page onboarding.

## Design Source

Use two Aiven-inspired surfaces:

| Surface | Source | Job |
| --- | --- | --- |
| Sales/front-door | Aiven public homepage: `https://aiven.io/` | Make the product feel valuable, sponsor-native, and commercially real. |
| Control room/product | Aiven Console shell: `https://console.aiven.io/` | Make the migration feel operational, trustworthy, and ready for paid infrastructure. |

Do not clone Aiven. Use Aiven-compatible cues so the demo feels native to the sponsor challenge.

## Route Spec

Mission UI should support two routes:

```text
/           Sales/front-door opener
/control    Migration Control Room
```

For stage reliability, `/control` can remain the default URL the presenter opens. The sales page is
for screenshots, submission video, and the first 10 seconds if we want judges to feel the product
before seeing implementation detail.

Routing should be minimal:

- no router library unless already present;
- use `window.location.pathname` or a small local state switch;
- normal links are acceptable;
- no authentication flow;
- no multi-step setup wizard.

## File Plan

Target files:

```text
src/apps/control-room/src/App.tsx
src/apps/control-room/src/pages/SalesHomePage.tsx
src/apps/control-room/src/pages/ControlRoom.tsx
src/apps/control-room/src/components/*
src/apps/control-room/src/styles.css
```

Recommended change:

1. Move the current `App` body into `pages/ControlRoom.tsx`.
2. Replace `App.tsx` with a tiny route switch.
3. Add `pages/SalesHomePage.tsx`.
4. Restyle `styles.css` with explicit sales and console token groups.
5. Keep current component filenames for speed, but change visible labels to the new language.

Do not rename every component just to match copy. Rename only if it reduces confusion during later
work. A component named `AgentMigrationSpine` may render a panel titled `Execution timeline`.

## Visual Tokens

Add CSS custom properties near the top of `styles.css`:

```css
:root {
  --font-ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;

  --sales-bg: #05080f;
  --sales-panel: #0d0e10;
  --sales-text: #ffffff;
  --sales-muted: #b1b5c8;
  --sales-border: #2d2e30;
  --sales-green: #5ffa74;
  --sales-green-hover: #8dff9c;

  --console-bg: #f7f7fa;
  --console-surface: #ffffff;
  --console-muted: #f4f4f4;
  --console-border: #d6d6d6;
  --console-border-soft: #ebebeb;
  --console-text: #1f2937;
  --console-text-muted: #68696b;
  --console-indigo: #5667e6;
  --console-indigo-soft: #ecefff;
  --console-success: #0ab060;
  --console-success-soft: #effef4;
  --console-warning: #fdb515;
  --console-warning-soft: #fffac2;
  --console-danger: #b62324;
  --console-danger-soft: #fff1f1;
  --console-orange: #ff5a00;

  --radius-sm: 4px;
  --radius-md: 8px;
  --shadow-console: 0 1px 2px rgba(5, 8, 15, 0.08);
}
```

Rules:

- sales route may use black, large type, bright green CTA, and full-bleed product imagery;
- control route must use white/muted surfaces, borders, compact rows, and table/report density;
- orange is not the default CTA color; use it only for high-attention accents if needed;
- green in the control room means success or an Aiven-homepage-style primary CTA, not decoration;
- avoid blue/teal dominance.

## Typography

Use the current system font stack unless fonts are already bundled.

Targets:

| Surface | Element | Desktop | Mobile |
| --- | --- | ---: | ---: |
| Sales | H1 | 64px | 40px |
| Sales | supporting copy | 18px | 16px |
| Sales | cards | 14px | 14px |
| Console | top title | 24px | 22px |
| Console | panel title | 16px | 16px |
| Console | row/table body | 13px | 13px |
| Console | labels | 11px | 11px |

Rules:

- no viewport-width font scaling;
- no negative letter spacing;
- text must not overflow buttons, chips, cells, or cards;
- use monospace only for paths, table names, endpoints, topic names, and receipt IDs.

## Sales Home Page

Component:

```text
SalesHomePage
```

Purpose:

Make Aiden feel like a commercial Aiven-aligned product before the judge sees implementation detail.

First viewport:

```text
Top nav:
  Aiden
  PulseWall -> Aiven
  [View control room]

Hero:
  Graduate Lovable apps to Aiven without losing behavior.
  Aiden turns a Supabase-backed prototype into an Aiven Postgres + Kafka runtime path,
  with receipts, validation, and rollback before production cutover.

  [Graduate To Aiven] [View migration report]

Visual:
  Product screenshot / control-room preview / generated product mock screenshot.

Proof strip:
  Aiven Postgres
  Kafka migration.events
  MCP receipts
  Scoped rollback
```

Do not build a generic landing page. The page should be a premium opener for the demo product.

Sales sections below the fold:

1. **Service cards**
   - `Postgres`: app data and `app_events`.
   - `Kafka`: workflow events and production event-path proof.
   - `MCP receipts`: project/service actions and audit trail.

2. **Before/after comparison**
   - Before: Lovable UI -> Supabase client -> Supabase Postgres/Realtime.
   - After: Lovable UI -> local Aiden adapter -> Aiven Postgres + app_events.
   - Remaining blockers: Auth, Storage, RLS review.

3. **Business proof strip**
   - zero source destruction;
   - rollback preserved;
   - scoped runtime validated;
   - production blockers explicit.

4. **CTA band**
   - headline: `Stop managing migration risk. Start building on Aiven.`
   - CTA: `Open control room`.

Sales copy rules:

- mention Aiven Postgres and Kafka above the fold;
- mention Lovable/Supabase only to establish the migration problem;
- do not mention "AI agent" in the hero;
- do not invent customer logos or customer outcomes;
- use our own proof instead of fake testimonials.

Sales visual rules:

- black or near-black hero;
- green primary CTA;
- rounded CTA buttons are allowed here;
- hero visual must be product-relevant, not abstract;
- no gradient blobs/orbs;
- no fake Aiven console screenshots.

## Control Room Page

Component:

```text
ControlRoom
```

Purpose:

Show the migration actually running and prove Aiven is load-bearing.

Layout:

```text
Command strip
Project/source/target summary
Execution stage
  Source app
  Execution timeline + behavior map
  Aiven landing zone + receipts + workflow events
Outcome rail
  Realtime path
  Validation
  Scoped cutover
  Migration report
Presenter controls
```

The control room should feel like a professional console, not a marketing page.

### Command Strip

Current component:

```text
CommandStrip
```

Visible copy:

- eyebrow: `Aiden Migration Control Room`
- title: `PulseWall migration run`
- source: `Lovable / Supabase`
- target: `Aiven Postgres + Kafka`
- primary action: `Graduate To Aiven`

Rules:

- primary action must be the most obvious control;
- keep mode/source labels visible but quiet;
- do not overload the strip with explanatory copy;
- use a compact console-native button, not a giant marketing CTA.

### Cold Open

Current component:

```text
ColdOpenOutcome
```

Job:

Start with a completed Aiven-backed outcome so the demo opens with confidence.

Visible structure:

```text
Migrated demo path running

Data plane: Aiven Postgres
Realtime: app_events -> /api/events/recent -> browser
Workflow events: Kafka migration.events
Production source: unchanged
Blockers: Auth / Storage / RLS review

[Rewind to one click]
```

Changes from current UI:

- remove "autonomous step" from visible body copy;
- change `Agent bus` to `Workflow events`;
- make the right side look like an operational summary table, not four equal decorative cards;
- keep `fixture/live/cached` label visible.

### Source App

Current component:

```text
SourceAppPanel
```

Job:

Make the starting app concrete and safe.

Must show:

- PulseWall preview;
- old runtime path;
- "source unchanged" status;
- one source behavior example, preferably realtime reaction behavior.

Do not embed the whole source app if it slows the demo. A credible preview is enough.

### Execution Timeline

Current component:

```text
AgentMigrationSpine
```

Visible title:

```text
Execution timeline
```

Rows:

| Status | Label | Source |
| --- | --- | --- |
| idle/pending | next step | derived from `RunEvent[]` |
| running | active migration step | latest event |
| passed | completed step | event status `ok` |
| failed | blocker | event status `failed` |

Copy replacements:

| Current tendency | Use |
| --- | --- |
| `Autonomous operator` | `Migration run` |
| `agent` | `workflow step` unless in presenter/debug detail |
| `next proof beat` | `next evidence item` |
| `AI found` | `Detected` |

Keep underlying agent names available in presenter mode.

### Behavior Map

Current component:

```text
BehaviorMap
```

Render as a compact table:

| Behavior | Detected | Treatment | Aiven target | Status |
| --- | --- | --- | --- | --- |
| Tables/data | yes | migrate rows | Aiven Postgres | ready/pending |
| Realtime | yes | adapter event table | `app_events` + polling | hero |
| Auth | yes/no | blocker | production review | blocked |
| Storage | yes/no | blocker | production review | blocked |
| RLS | yes/no | review | policy mapping | blocked |

This panel proves Aiden understands application behavior, not only tables.

### Aiven Landing Zone

Current component:

```text
AivenProofPlane
```

Visible title:

```text
Aiven landing zone
```

Render as service readiness rows, not a loud card grid:

| Service | Evidence | Source | Status |
| --- | --- | --- | --- |
| Aiven project | service visibility | live/cached/fixture | ready |
| Postgres | receipt write/read | live/cached/fixture | ready |
| Kafka | topic produce/list | live/cached/fixture | ready |
| MCP receipts | action log | live/cached/fixture | recording |

Rules:

- Aiven Postgres and Kafka must be visible above the fold;
- label cached/fixture honestly;
- use green only when passed;
- keep failed/skipped states readable;
- do not call everything "proof" in visible titles.

### Receipt Stream

Current component:

```text
ReceiptStream
```

Render as compact audit rows:

```text
action        target                 risk          result
service.list  aiven project          low           cached/live
pg.write      migration_receipts      low           written
kafka.send    migration.events        medium        observed
```

Rules:

- show action/tool names;
- show target;
- show risk and rollback;
- avoid raw JSON in judge-facing mode;
- raw payloads may appear in presenter mode only.

### Workflow Events

Current component:

```text
KafkaAgentBus
```

Visible title:

```text
Workflow events
```

Subtitle:

```text
Kafka migration.events
```

Rules:

- Kafka is not browser-critical realtime;
- Kafka is the workflow event stream and production event-path proof;
- do not label the panel `Agent bus` in judge-facing UI.

### Realtime Path

Current component:

```text
RealtimeProof
```

Visible title:

```text
Realtime path
```

Render the path explicitly:

```text
Before: Supabase Realtime
After:  Aiven Postgres app_events -> /api/events/recent -> browser polling
Kafka:  migration.events workflow event observed
```

Rules:

- use `polling`, not SSE;
- keep `app_events` visible;
- show recent browser event rows;
- one passed event is enough for the hero beat.

### Validation

Current component:

```text
ValidationCards
```

Render as a table or compact checklist:

| Check | Expected | Observed | Source | Status |
| --- | --- | --- | --- | --- |
| posts row count | fixture/live count | observed count | fixture/live | passed |
| reactions row count | fixture/live count | observed count | fixture/live | passed |
| app_events browser polling | one event | observed | fixture/live | passed |
| kafka roundtrip | one message | observed | fixture/live/cached | passed |

Cards are allowed only if they look like operational counters, not decorative tiles.

### Cutover

Current component:

```text
CutoverProof
```

Visible title:

```text
Scoped runtime cutover
```

Must show:

```text
Old: Lovable UI -> Supabase client -> Supabase Postgres/Realtime
New: Lovable UI -> local Aiden adapter -> Aiven Postgres + app_events
Workflow events: Aiven Kafka migration.events
Rollback: source app unchanged
Blockers: Auth / Storage / RLS review
```

Use `scoped demo runtime` whenever claiming Supabase removal.

### Migration Report

Current component:

```text
FinalReport
```

Visible title:

```text
Migration readiness memo
```

Must read like an operational memo:

```text
Recommendation: scoped demo path ready on Aiven
Readiness: 82/100
Validated: rows, app_events, browser polling, Kafka workflow event
Not production-ready until: Auth, Storage, RLS review
Rollback: source app unchanged
CTO next step: review blockers, then schedule production migration
```

Rules:

- no "executive proof package" label;
- no AI-summary wording;
- include cost/CTO recommendation if data exists;
- keep final screenshot dense and credible.

### Presenter Controls

Current component:

```text
PresenterControls
```

Rules:

- visually secondary;
- no strong primary CTA styling except `Run live proof` if needed;
- place after command strip or at the bottom;
- consider a compact `Presenter` disclosure later;
- do not let controls compete with `Graduate To Aiven`.

## CSS Refactor Plan

The current stylesheet can be refactored in place. Do not introduce Tailwind or a UI framework.

Pass 1:

- add token variables;
- replace hardcoded colors with variables;
- make app shell use `--console-bg`;
- make panels use `--console-surface`, `--console-border`, and `--shadow-console`;
- change primary button styling by context:
  - `.sales-page .primary-button`: green, rounded;
  - `.control-room .primary-button`: console-native, compact.

Pass 2:

- reduce `999px` pill usage;
- flatten card shadows;
- convert Aiven/validation/report tile groups to rows/tables where feasible;
- reduce hero headline size inside control room;
- remove visible `proof`, `agent`, and `autonomous` words where they are not needed.

Pass 3:

- responsive desktop and mobile polish;
- no text overflow;
- no panel overlap;
- stable dimensions for counters, rows, and buttons.

## Interaction Spec

Sales page:

- `Graduate To Aiven` navigates to `/control` and starts or reveals the control room.
- `View migration report` navigates to `/control` and can keep the cold-open completed state.
- no API dependency required for first paint.

Control room:

- cold open starts completed;
- `Rewind to one click` shows the run before migration;
- `Graduate To Aiven` starts fixture/live run;
- `Run live proof` is a presenter action;
- reset returns to cold open;
- pause/step stay presenter-only.

## State Labels

Every evidence object must show source:

```text
fixture | live | cached
```

Rules:

- never hide fixture/cached labels;
- `live` can be green;
- `cached` should be amber/neutral;
- `fixture` should be neutral;
- mixed state should be explicit if a panel includes multiple sources.

## Copy Replacement Table

| Replace | With |
| --- | --- |
| Autonomous migration | Migration run |
| Autonomous operator | Migration run |
| Agent migration spine | Execution timeline |
| Agent bus | Workflow events |
| Aiven proof | Aiven landing zone |
| Executive proof package | Migration readiness memo |
| proof card | evidence row |
| AI found | Detected |
| Aiden decided | Recommended |
| Running automation | Running migration step |
| next proof beat | next evidence item |

Architecture docs can keep agent language. Judge-facing UI should sound operational.

## Implementation Sequence

Do this in order:

1. Create `pages/ControlRoom.tsx` by moving current `App` logic.
2. Create `pages/SalesHomePage.tsx`.
3. Replace `App.tsx` with the tiny route switch.
4. Add sales-page CSS and token variables.
5. Update visible copy in control-room components.
6. Restyle command strip and cold open to the console style.
7. Restyle Aiven landing zone and validation panels from cards toward rows/tables.
8. Restyle final report as a memo.
9. Run typecheck/build.
10. Run local server and inspect `/` and `/control`.

## Acceptance Gate

This spec is implemented when:

- `/` renders an Aiven-homepage-inspired sales opener;
- `/control` renders the existing migration run without broken API behavior;
- the sales page has a black hero, green CTA, and product-relevant visual;
- the control room has white/muted Aiven Console-style surfaces;
- Aiven Postgres, Kafka `migration.events`, and MCP receipts are visible within the first viewport or one short scroll;
- visible UI copy says `Execution timeline`, `Aiven landing zone`, `Workflow events`, and `Migration readiness memo`;
- visible UI does not lead with "AI", "agent", "autonomous", or "proof package";
- fixture/live/cached labels remain visible;
- `npm run typecheck` passes;
- `npm exec --workspace @aiden/control-room vite -- build` passes;
- desktop and mobile viewports have no obvious overlap or text overflow.

## Cut Lines

Cut if time is tight:

- customer logo strip;
- animated hero video;
- separate `/report` route;
- component renames;
- full mobile optimization beyond no-overlap;
- dark mode;
- custom font loading.

Do not cut:

- sales/control surface split;
- Aiven green sales CTA;
- Aiven Console-style control room;
- one obvious `Graduate To Aiven` action;
- Aiven Postgres + Kafka visibility;
- honest proof source labels;
- final migration readiness memo.
