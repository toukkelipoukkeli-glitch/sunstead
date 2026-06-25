# UI Decision Package

Date: 2026-06-25

## Purpose

This document owns the visual and interaction direction for the Aiden Migration Control Room.
It turns the critical-path vision into concrete UI decisions before Mission 00 implementation.

Authority:

- `DEMO_FLOW.md` owns the demo order and exact stage story.
- `RUNTIME_CONTRACTS.md` owns event, API, and data shapes.
- `MCP_AND_AIVEN_CONTRACT.md` owns Aiven proof requirements.
- This file owns layout, visual hierarchy, interaction model, emotional tone, and UI acceptance gates.

If the UI conflicts with the demo story, fix the UI. If this file conflicts with runtime contracts,
fix this file.

## Hackathon Frame

- Detected hackathon type: `sponsor-needs`.
- Primary scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Chosen track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow: cold-open completed state -> PulseWall source app -> one-click `Graduate To Aiven` -> behavior scan -> Aiven shadow plane -> migration validation -> Postgres events realtime proof -> Kafka agent bus proof -> scoped cutover -> final report.
- Intentionally cut: production auth migration, production storage migration, full CDC, Aiven Apps deploy, every source platform, and complex agent-process orchestration.

## North Star

The UI is the product proof.

Judges should feel, within 30 seconds:

> Aiden is a calm migration control plane that makes a risky Lovable/Supabase graduation feel
> safe, visible, and inevitable on Aiven.

The interface is not a dashboard in the usual sense. It is a sponsor-native onboarding/control
plane: it stages a one-click migration so business/product judges understand the outcome quickly,
while technical judges can inspect the evidence without derailing the pitch.

Visually, this should read more like a production onboarding/control-plane workflow than an
"AI agent" product. Agent behavior is the engine, but the surface language should prioritize
migration run, execution timeline, workflow events, receipts, validation, and readiness.

The winning phrase the UI should support:

> Lovable builds the app. Aiven runs the data plane when it becomes a company.

## Design Locate

Current depth: emerging and aligned.

What is cold:

- the demo flow;
- the Aiven landing-zone surfaces;
- the browser-critical realtime path through Aiven Postgres `app_events` and `/api/events/recent`;
- the need for fixture/live/cached proof labels;
- the one-click `Graduate To Aiven` story.

What remains warm:

- exact visual composition;
- final spacing and component sizing;
- animation timing;
- mobile compaction rules.

Therefore Mission 00 should implement a polished control-room shell with stable layout decisions,
then cool details through screenshots and rehearsal.

## Judge Emotional Arc

Design every screen around this arc:

| Moment | Judge feeling | UI job |
| --- | --- | --- |
| Cold open | "This already worked." | Show completed Aiven-backed outcome before process detail. |
| Source app | "Production is safe." | Show the original PulseWall app/source path is untouched. |
| One click | "The product is simple." | Make `Graduate To Aiven` the only obvious primary action. |
| Behavior scan | "It understands apps, not just tables." | Show Supabase behaviors mapped to migration treatments. |
| Aiven landing zone | "Aiven is load-bearing." | Show Postgres, Kafka, Aiven receipts, risk, rollback. |
| Validation | "This is trustworthy." | Show row counts, smoke checks, and proof sources. |
| Realtime rewrite | "This is the clever part." | Show Supabase Realtime -> Aiven Postgres events -> browser polling, plus Kafka proof. |
| Scoped cutover | "They removed Supabase honestly." | Show old path vs new path and production blockers. |
| Final report | "A founder could use this." | Show readiness, cost/CTO recommendation, blockers, rollback. |

## Product Surface

Build a local web app called:

```text
Aiden Migration Control Room
```

The first screen is the actual control room, not a landing page and not a setup wizard. For the
hackathon, connection/setup appears as a compact checklist because the stage story begins after
access has been granted.

Primary action:

```text
Graduate To Aiven
```

Secondary controls, such as reset, pause, next step, and fixture/live mode, belong in presenter
controls. They should not compete with the primary action in judge-facing mode.

## Surface Split

Use two related Aiven-inspired surfaces:

1. **Sales page / outer wrapper**: borrow from Aiven's public homepage.
2. **Control room / product detail**: borrow from Aiven Console and Aquarium.

The sales page is optional for the live hackathon demo if it slows the core flow, but if we need a
front door or submission video opener, it should use the public Aiven homepage language:

- dark/black hero;
- large direct headline;
- compact nav;
- bright Aiven green primary CTA;
- secondary outline CTA;
- real product screenshot or video as the hero asset;
- product/service cards for Postgres, Kafka, and migration workflow;
- comparison/TCO proof;
- short customer-style evidence blocks, using our migration evidence rather than fake customer logos.

The control room should not inherit the marketing hero style. It should feel like the app the user
lands in after clicking `Get building` or `Graduate To Aiven`: white/muted surfaces, compact rows,
tables, service states, receipts, checks, and reports.

Simple route model:

```text
/           Sales-style intro, depending on demo needs
/control    Aiven Console-style Migration Control Room
```

For the judged demo, the product should open directly in the control room. The sales layer exists
to improve submission video, screenshots, and framing when needed; it must not create a second
home page inside `/control`.

## Screen Architecture

Use one primary route for Mission 00:

```text
/    Aiden Migration Control Room
```

The page has three persistent regions:

1. **Command Strip**: run status, source, target, mode, primary action.
2. **Execution Stage**: source lane, migration timeline, Aiven lane.
3. **Outcome Rail**: realtime proof, cutover proof, final report.

Desktop first viewport:

```text
+------------------------------------------------------------------------------+
| Aiden Migration Control Room   Source PulseWall   Target Aiven   [Graduate] |
| Status: Shadow migration ready / Demo runtime on Aiven / Fixture-Live label |
+-------------------+-----------------------------+--------------------------+
| Source Lane       | Execution Timeline          | Aiven Landing Zone       |
| PulseWall before  | Timeline + behavior graph   | Postgres + Kafka + MCP   |
| Old runtime path  | Current migration action     | Receipts + validation    |
+-------------------+-----------------------------+--------------------------+
| Realtime Rewrite Proof     Scoped Cutover Proof     Final Report Preview    |
+------------------------------------------------------------------------------+
```

The page should fit the full story on a laptop display without looking like a wall of logs. Panels
can scroll internally only for secondary detail; the core state should remain visible. Prefer an
enterprise console composition: command bar, project/source/target summary, execution timeline,
Aiven service readiness, validation table, and final report.

## Cold Open

Start the demo on the completed outcome state.

The cold-open surface should read like an operational success summary:

```text
Migrated demo path running

Data: Aiven Postgres
Realtime: Aiven Postgres app_events -> /api/events/recent -> browser
Workflow events: Aiven Kafka migration.events
Supabase: removed from scoped demo runtime
Production blockers: Auth, Storage, RLS review
```

Cold-open screen rules:

- it must show the brand/product name;
- it must show Aiven Postgres and Kafka above the fold;
- it must show that production/source was not destructively changed;
- it must sit inside the real control room rather than gating access to it;
- the command strip `Graduate To Aiven` action owns the one-click run;
- it must not look like a placeholder report.

## Component Hierarchy

Build these components for Mission 00:

| Component | Role | Priority |
| --- | --- | --- |
| `CommandStrip` | Global state, source/target, mode, `Graduate To Aiven` | P0 |
| `ColdOpenOutcome` | Completed outcome shown at demo start | P0 |
| `SourceAppPanel` | PulseWall old path and detected source behavior | P0 |
| `AgentMigrationSpine` | One-click state machine and agent progress | P0 |
| `BehaviorMap` | Supabase behaviors and migration treatments | P0 |
| `AivenProofPlane` | Postgres/Kafka/service readiness and MCP proof | P0 |
| `ReceiptStream` | Aiven action receipts with MCP/direct-fallback labels and risk/rollback | P0 |
| `ValidationCards` | Row counts, smoke query, app events, Kafka roundtrip | P0 |
| `RealtimeProof` | Supabase Realtime rewrite to Postgres polling plus Kafka proof | P0 |
| `CutoverProof` | Old path vs scoped Aiven-backed runtime path | P0 |
| `FinalReport` | Readiness, blockers, rollback, cost/CTO recommendation | P0 |
| `PresenterControls` | Reset, pause, next step, mode/debug toggles | P1 |
| `ProofSourceBadge` | Fixture/live/cached markers | P1 |

Do not build a chat panel for Mission 00. The agents are visible indirectly through timeline,
receipts, behavior map, workflow events, and report.

## Information Hierarchy

Every screen should answer these questions in this order:

1. What is the current migration outcome?
2. Is production/source safe?
3. What did the migration run detect?
4. What did Aiven actually do?
5. What was validated?
6. What remains blocked before production cutover?

Avoid equal-weight panels. The hierarchy should be:

- headline outcome;
- current step;
- Aiven landing zone;
- validation;
- detailed receipts/logs.

Receipts are proof, not the main story. Put them in a readable stream, but do not let them dominate
the first viewport.

## Visual System

Use an Aiven-branded two-layer style, not a generic AI dashboard.

The target feeling is:

```text
professional onboarding -> production data plane -> money is ready to move
```

The sales layer should borrow from Aiven's public homepage. The control-room layer should borrow
the discipline of Aiven's Console/Aquarium design language without pretending to be the real Aiven
Console. Together they should look like a credible Aiven-adjacent workflow where a founder is about
to graduate from prototype infrastructure into a paid production platform.

Observed Aiven homepage cues to emulate for the sales layer:

- black hero background;
- big direct headline;
- bright green primary CTA;
- rounded CTA buttons;
- real product screenshot/video as the main asset;
- product cards for open-source data services;
- comparison/TCO table;
- customer/logo proof and case-study framing;
- "stop managing, start building" style business outcome framing.

Observed Aiven Console cues to emulate for the product layer:

- white app shell;
- muted gray surfaces;
- restrained borders;
- small radii;
- light shadows used sparingly;
- indigo/deep blue as the secondary technical accent;
- green reserved for verified success;
- dense 14px/16px operational UI;
- table/checklist/report surfaces over decorative dashboards.

Direction:

- calm;
- precise;
- expensive;
- sponsor-native;
- onboarding-grade;
- dense enough for repeated use;
- clean enough for a stage demo.

Avoid:

- generic SaaS marketing hero layouts;
- generic AI-dashboard styling;
- raw developer-log dashboards;
- over-dark cyber/security styling;
- decorative gradient blobs/orbs;
- nested cards inside cards;
- huge type inside dense panels;
- excessive pill badges;
- soft blue/teal dashboard sameness;
- one-note purple/blue gradient palettes.

Canonical palette intent:

| Use | Direction |
| --- | --- |
| App background | `#ffffff` or `#f7f7fa` |
| Sales hero background | `#05080f` / near-black |
| Muted surface | `#f7f7fa` / `#f4f4f4` |
| Panel surface | `#ffffff` |
| Border | `#d6d6d6` / `#ebebeb` |
| Primary text | `#1f2937` or near-black neutral |
| Muted text | `#68696b` |
| Sales primary CTA | Aiven green, around `#5ffa74` |
| Console technical accent | Aiven indigo/deep blue, around `#5667e6` / `#6f64ff` |
| Console success | verified green, around `#00af41` / `#0ab060`, used sparingly |
| High-attention accent | Aiven orange, around `#ff5a00`, used sparingly |
| Warning | amber/yellow, around `#fdb515`, for adapter-required/review-required |
| Failure | red only for failed checks |
| Fixture/cached | muted neutral/amber, never hidden in presenter mode |

The UI can use color to show movement from source to target, but the main product should not read
as a decorative gradient. On the sales page, the strongest CTA should be Aiven green. In the
control room, keep the main action visually strong but console-native; do not flood the product
surface with marketing green or orange. Other panels should mostly use neutral surfaces and sharp
information hierarchy.

Shape and elevation rules:

- default radius: 4px;
- larger panel radius: 8px maximum;
- badges/chips should be quiet rectangular labels unless they are true status pills;
- avoid `999px` pill shapes except for tiny status indicators;
- panel shadows should be subtle and rare;
- use borders and spacing as the primary structure;
- tables, rows, checklists, receipts, and memo blocks should replace decorative card grids where possible.

Style references:

- Aiven public homepage: `https://aiven.io/`
- Aiven Console shell: `https://console.aiven.io/`

## Typography And Density

Use a practical system-font stack unless the implementation already has a better local standard.

Rules:

- no viewport-width font scaling;
- no negative letter spacing;
- compact headings inside panels;
- one true hero headline only in the cold-open/report state;
- body and table text must stay readable on projector displays;
- long technical labels should wrap cleanly or truncate with a tooltip.

Button and chip text must not overflow at mobile or laptop widths.

## Layout Rules

- Stable dimensions for proof cards, timeline rows, badges, and counters.
- No UI cards inside other UI cards.
- Page sections are layout regions; cards are individual proof objects only.
- Panel headers must state outcome, not describe UI mechanics.
- Every panel needs an empty, running, passed, failed, and fixture/cached/live state.
- If a panel cannot show meaningful content in the first demo pass, remove or collapse it.

The minimum viable layout should be simple enough to build fast but polished enough that it does
not need a Mission 06 rescue.

Preferred composition:

```text
Top console bar
Project / source / target summary
Left migration steps
Main execution panel
Right Aiven project, service, cost, and readiness summary
Bottom validation table and migration report
```

This composition should feel like an onboarding checklist for a professional cloud service:
specific, calm, and tied to account/project/service context. The user should feel that approving
the run has business weight.

Panel hierarchy:

1. Command strip with the orange `Graduate To Aiven` action.
2. Source/target/account context in neutral summary rows.
3. Execution timeline with subdued status icons.
4. Aiven service readiness and receipts.
5. Validation and realtime path tables.
6. Final migration report/memo.

Avoid a grid of equally loud proof cards. Dense rows and tables usually feel more credible than
decorative tiles.

## Motion And Interaction

Motion should make the migration run legible, not decorative.

Use:

- timeline rows entering as workflow steps complete;
- subtle progress transitions between canonical run states;
- proof cards flipping from pending to verified;
- a short pulse when Aiven receipts or Kafka events arrive;
- a clear final state transition into the report.

Avoid:

- continuous background animation;
- distracting particle effects;
- animations that hide actual status;
- timing so slow the presenter waits on the UI.

Target run feel:

```text
Click -> immediate acknowledgement -> steady run progress -> evidence beats -> final report.
```

## Proof Source Labels

Every proof object has a source:

```text
fixture | live | cached
```

Judge-facing mode:

- show `live` labels clearly on Aiven proof cards;
- show fixture/cached labels when the card is not live-critical;
- keep labels visually small but legible.

Presenter/debug mode:

- show source labels on every card, event, receipt, and validation;
- show event IDs or timestamps if useful;
- show manual controls.

Never silently present fixture or cached proof as live.

## State Model In The UI

The UI derives from append-only `RunEvent[]` plus typed proof data. It must not have separate visual
paths for fixture and live mode.

Canonical states:

```text
idle
access_connected
scan_running
behavior_mapped
aiven_shadow_ready
migration_running
migration_validated
realtime_validated
demo_cutover_running
demo_cutover_complete
report_ready
failed
```

Each state should have:

- primary headline;
- active agent;
- visible Aiven or validation consequence;
- next expected proof beat;
- failure/fallback copy.

## Panel Decisions

### Command Strip

Must show:

- product name;
- source: `PulseWall / Lovable-Supabase`;
- target: `Aiven Postgres + Kafka`;
- current run status;
- mode/source: fixture, live, cached, or mixed;
- primary `Graduate To Aiven` action.

Do not put explanatory onboarding copy here. It is a command surface.

### Source App Panel

Purpose: make the starting point concrete.

Show:

- old runtime path;
- source behavior summary;
- small PulseWall-style app preview or fixture snapshot;
- production/source unchanged indicator.

Do not spend time embedding the full app if it slows Mission 00. A credible source panel is enough
until live integration.

### Execution Timeline

Purpose: make the migration run visible.

Show:

- workflow role names in presenter/detail views only;
- current step;
- completed/pending/failed states;
- event summaries derived from `RunEvent[]`;
- one readable sentence per step.

This is not a raw log and not a chatbot transcript. It is the execution timeline for a professional
migration run.

### Behavior Map

Purpose: prove Aiden understands behavior migration.

Rows:

- Tables and data;
- Realtime;
- Auth;
- Storage;
- RLS;
- RPC/Edge Functions;
- pgvector.

Columns:

- detected;
- treatment;
- Aiven target or blocker;
- proof source.

Use strong copy for the hero row:

```text
Supabase Realtime -> Aiven Postgres app_events -> browser polling
Kafka migration.events validated as agent bus / production event path
```

### Aiven Landing Zone

Purpose: make sponsor tech impossible to miss.

Show:

- Aiven project/service visibility;
- Postgres ready;
- Kafka live or warning/cached;
- receipt write/read;
- topic produce/list;
- live/cached/fixture source.

This should be the visual anchor on the right side of the screen. The visible title can be
`Aiven landing zone`, `Target data plane`, or `Aiven services`; avoid making `proof` the dominant
word on the card.

### Receipt Stream

Purpose: trust and auditability.

Show:

- intent;
- tool/action;
- target;
- risk;
- result;
- rollback.

Keep the stream compact. Use expanded detail only on hover/click or presenter mode.

### Realtime Proof

Purpose: hero technical beat.

Show the before/after path visibly:

```text
Before: supabase.channel("posts")
After:  Aiven Postgres app_events -> /api/events/recent -> browser
Proof:  Aiven Kafka migration.events produce/list
```

Use polling language consistently. Do not label the browser bridge as SSE unless the optional SSE
path is actually built and enabled.

### Cutover Proof

Purpose: prove Supabase was removed honestly from the scoped demo runtime.

Show:

```text
Old: Lovable UI -> Supabase client -> Supabase Postgres/Realtime
New: Lovable UI -> local Aiden adapter -> Aiven Postgres + app_events
Workflow events: Aiven Kafka migration.events
```

Also show:

- production app/source unchanged;
- auth/storage/RLS as blockers;
- rollback ready.

### Final Report

Purpose: business and product closure.

Must include:

- readiness score;
- demo cutover status;
- row validations;
- Postgres event browser delivery;
- Kafka agent-bus proof;
- Aiven action receipt count;
- production blockers;
- rollback;
- cost card;
- first CTO recommendation.

This is the final screenshot judges should remember. It should read like a migration readiness memo,
not a generated AI summary.

### Presenter Controls

Purpose: keep the live demo reliable without making the product feel like a debug harness.

Rules:

- controls should be visually quieter than the main command strip;
- hide or collapse advanced controls in judge-facing mode if possible;
- `Run live proof` may stay visible for technical judges, but it should not compete with
  `Graduate To Aiven`;
- manual stepping/reset controls belong in a subdued presenter area.

## Copy Rules

Prefer outcome language:

- "Aiven landing zone ready"
- "Rows validated"
- "Postgres event delivered to browser"
- "Scoped demo runtime on Aiven"
- "Auth adapter required before production"
- "Migration run"
- "Execution timeline"
- "Workflow events"
- "Migration report"

Avoid vague implementation language:

- "processing data";
- "running automation";
- "syncing stuff";
- "AI is thinking";
- "magic migration complete."

Use "scoped demo runtime" whenever claiming Supabase removal.

Avoid overusing AI/agent language in visible UI:

| Avoid as primary UI copy | Prefer |
| --- | --- |
| Autonomous operator | Migration run |
| Agent migration spine | Execution timeline |
| Agent proof | Workflow evidence |
| Proof package | Migration report |
| AI found | Detected |
| Aiden decided | Recommended |
| Agent bus | Workflow events or Kafka `migration.events` |

Architecture docs can still use agent names. The demo UI should make the system feel operational
and trustworthy before it feels futuristic.

## Responsive Rules

Desktop/laptop is the primary judging surface.

Desktop:

- three-column proof stage;
- outcome rail below;
- receipts can be a compact vertical stream.

Tablet:

- source panel above;
- execution timeline and Aiven landing zone side by side;
- outcome rail below.

Mobile:

- single column;
- command strip remains sticky;
- panels ordered by judge story, not by implementation ownership:
  1. outcome/status;
  2. primary action;
  3. Aiven landing zone;
  4. behavior map;
  5. realtime proof;
  6. cutover proof;
  7. report;
  8. receipts.

No text overlap or button overflow is acceptable on mobile, even if mobile is not the stage target.

## Presenter Mode

Presenter mode is required but visually secondary.

It can expose:

- reset run state;
- rewind to start;
- pause/resume fixture playback;
- advance next event;
- switch fixture/live/cached/mixed display;
- show raw event/receipt payloads.

Presenter mode must not change the judge-facing layout. It only reveals controls and labels.

## First Implementation Slice

Build in this order:

1. `CommandStrip`
2. `ColdOpenOutcome`
3. layout shell with three proof lanes and outcome rail
4. `AgentMigrationSpine` driven by fixture `RunEvent[]`, rendered as an execution timeline
5. `AivenProofPlane` + `ReceiptStream`, rendered as the Aiven landing zone
6. `BehaviorMap`
7. `ValidationCards`
8. `RealtimeProof`
9. `CutoverProof`
10. `FinalReport`
11. `PresenterControls`
12. responsive pass and screenshot review

Do not start with receipt internals or scanner detail. Start with the stage composition.

## Acceptance Gate

Mission 00 UI is acceptable when:

- cold-open outcome communicates the completed Aiven-backed runtime path in under 10 seconds;
- `Graduate To Aiven` is the single obvious primary action;
- first viewport feels like a professional Aiven-adjacent onboarding/control-plane workflow;
- first viewport shows source, execution timeline, Aiven landing zone, and outcome direction;
- any sales/front-door screen uses Aiven homepage cues: dark hero, direct headline, green CTA, and a real product screenshot;
- the control room uses Aiven Console cues: white/muted surfaces, compact rows, restrained borders, and table/report density;
- the primary action follows its layer: Aiven green on the sales page, console-native accent inside the product;
- visible copy avoids leading with AI/agent language unless it is specifically explaining Kafka workflow events;
- every visible proof card can render `fixture`, `live`, and `cached` states;
- browser-critical realtime is labeled as Aiven Postgres `app_events` through `/api/events/recent`;
- Kafka is clearly visible as workflow events / production event-path proof, not browser-critical path;
- final report feels like a migration readiness memo, not a JSON dump or AI summary;
- no panel looks like a placeholder;
- no panel relies on decorative gradients, oversized pills, or generic dashboard color washes;
- no text overlaps, overflows, or cramped controls appear on desktop or mobile screenshots;
- presenter can reset/rewind/pause/step without disrupting judge-facing composition.

## Kill Lines

Cut or defer:

- chat UI;
- multi-page onboarding;
- decorative visual effects;
- full source-app embedding if a credible source panel is faster;
- detailed raw logs in the first viewport;
- custom graph visualization if a table/flow list is clearer;
- app realtime SSE before polling works;
- any panel that does not strengthen the `Graduate To Aiven` story.

Do not cut:

- cold open;
- one primary action;
- Aiven landing zone;
- behavior map;
- realtime proof;
- scoped cutover proof;
- final report.
