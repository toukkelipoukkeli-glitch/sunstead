# Mission Spec: GitHub Source Integration

Date: 2026-06-25

Mission ID: `M07`

Status: FIRST SLICE IMPLEMENTED

## Hackathon Frame

- Type: `sponsor-needs`.
- Scoring mode: technical/product hybrid, sponsor fit first.
- Judging/submission mode: Aiven partner challenge; short live demo and 4-minute pitch if selected.
- Target track: Aiven main challenge, "The Autonomous Data Operator."
- Core demo flow after this mission: user connects a GitHub repo -> Aiden imports/scans the selected Lovable/Supabase source -> access preflight proves repo access and source-data readiness separately -> `Graduate To Aiven` runs only when required permissions are present.
- Intentionally cut: production auth migration, production storage migration, full CDC, Aiven account creation, arbitrary production cutover, and blind repo writes.

## Goal

Make the `Connect GitHub repo` product path actually functional.

GitHub integration should solve this part of the permissions story:

```text
User grants repo access
  -> Aiden lists selectable repositories
  -> user selects one repo/ref
  -> Aiden materializes source into a run workspace
  -> existing scanner builds SourceEvidence and behavior findings
```

It should not pretend to solve source data access. A GitHub repo gives code and migrations; it does not give live Supabase rows. For non-demo migrations, `source_data` must still require one of:

- `SOURCE_SUPABASE_DB_URL` or `SOURCE_POSTGRES_URL` plus explicit table allowlist;
- dump files;
- CSV/Lovable Cloud export path.

## Auth Decision

Use a **GitHub App** as the product path.

Why:

- GitHub Apps are installation-scoped and can be limited to selected repositories.
- Installation access tokens are short-lived and can be minted server-side when needed.
- Permissions can start read-only and later request write permissions for adapter branches or pull requests.

Do not make OAuth App or personal access token the main product path.

Fallbacks:

- Public repo URL import: acceptable for demos and examples.
- Fine-grained PAT: acceptable as a local/dev fallback only, with clear warnings.

Official references:

- GitHub App installation tokens: <https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app>
- GitHub App installation API: <https://docs.github.com/rest/apps/installations>
- GitHub Apps vs OAuth Apps: <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps>

## Required GitHub App Permissions

Start with least privilege.

Required for source scan:

```text
Repository metadata: read
Repository contents: read
```

Later, only when generating an adapter branch/PR:

```text
Repository contents: write
Pull requests: write
```

Optional later:

```text
Checks: write
```

Do not request organization administration, secrets, actions, deployments, environments, or package permissions for this mission.

## Environment

Add sanitized examples to `.env.example`:

```text
# GitHub App source import
GITHUB_APP_ID=
GITHUB_APP_SLUG=
GITHUB_APP_PRIVATE_KEY_BASE64=
GITHUB_APP_INSTALL_CALLBACK_URL=http://localhost:5173/setup/github/callback
GITHUB_WEBHOOK_SECRET=

# Optional dev fallback only
GITHUB_TOKEN=
```

Rules:

- GitHub App private key stays server-side only.
- Installation tokens are minted on demand and never written to disk.
- Do not put tokens into clone URLs that may appear in logs.
- Redact all GitHub tokens and private keys in errors.

## Data Contracts

Extend `SetupProfile` or add a nested source access ref.

Suggested shape:

```ts
type GitHubSourceRef = {
  installationId: number
  repositoryId: number
  owner: string
  repo: string
  fullName: string
  defaultBranch: string
  ref?: string
  source: "github_app"
}

type SetupProfile = {
  sourceKind: SourceKind
  sourceDataPath: SourceDataPath
  aivenWorkspaceMode: AivenWorkspaceMode
  migrationScope: MigrationScope
  sourceLabel: string
  workspaceLabel: string
  sourceRoot?: string
  github?: GitHubSourceRef
  detectedBehaviors: string[]
}
```

Keep `sourceRoot` for local/demo/fixture paths. Use `github` for remote sources.

Add a server-side run cache record:

```ts
type MaterializedSource = {
  runId: string
  sourceKind: "github_repo"
  sourceLabel: string
  rootPath: string
  owner: string
  repo: string
  ref: string
  commitSha: string
  createdAt: string
}
```

Do not expose local absolute paths to the browser; report relative/safe display paths only.

## Package/API Structure

Add a small package:

```text
src/packages/github-source/
  src/index.ts
```

Responsibilities:

- create GitHub App JWT from app id/private key;
- mint installation access token;
- list repositories for an installation;
- fetch selected repo metadata;
- download archive for selected ref;
- extract archive safely into a run-scoped workspace;
- return safe source metadata.

Add API routes:

```text
GET  /api/github/install-url
GET  /api/github/installations/:installationId/repositories
POST /api/github/source
```

Implemented first slice:

- `@aiden/github-source` mints GitHub App installation tokens, lists installation repositories, and materializes scanner-supported source files into ignored local artifacts.
- `aiden-api` exposes install URL, repository listing, and source import endpoints.
- `/setup` has a GitHub source import mode that stores the returned `SetupProfile`.
- Access preflight treats GitHub repository access as `repo_source` only; `source_data` remains blocked until a DB/export path is configured.

Known intentional gap:

- Source import currently writes to `artifacts/github-sources/{owner}-{repo}-{sha}` and returns a setup profile rather than creating a durable `artifacts/runs/{runId}/source` cache. That is sufficient for setup-to-scan demo behavior and should be made run-scoped before multi-user or long-lived service use.

Suggested route behavior:

### `GET /api/github/install-url`

Returns the GitHub App installation URL for the configured app.

```json
{
  "url": "https://github.com/apps/aiden-migration-operator/installations/new"
}
```

### `GET /api/github/installations/:installationId/repositories`

Server mints an installation token and lists repositories visible to the installation.

Response:

```json
{
  "repositories": [
    {
      "id": 123,
      "fullName": "owner/repo",
      "private": true,
      "defaultBranch": "main"
    }
  ]
}
```

### `POST /api/github/source`

Input:

```json
{
  "installationId": 123,
  "repositoryId": 456,
  "owner": "owner",
  "repo": "repo",
  "ref": "main"
}
```

Behavior:

- verify repository belongs to installation;
- materialize source into `artifacts/runs/{runId}/source`;
- create or update run `SetupProfile` with `sourceKind: "github_repo"`;
- run source scan or return enough state for `POST /api/runs/:runId/source-scan`.

## Source Materialization

Prefer archive download over `git clone` for the first slice.

Reason:

- no `.git` directory;
- no credential helper concerns;
- scanner only needs file contents;
- lower chance of leaking tokens in process output.

Implementation rules:

- max archive size, default 50 MB compressed;
- max extracted files, default 10,000;
- max extracted bytes, default 250 MB;
- reject symlinks;
- reject path traversal;
- ignore `.git`, `node_modules`, `dist`, `build`, `.next`, `.turbo`;
- scan only known safe extensions already used by `migration-core`;
- never execute code from the imported repo during scan.

Workspace:

```text
artifacts/runs/{runId}/source/
```

Add to `.gitignore` if not already covered:

```text
artifacts/
```

## API Flow

### First slice: read-only source import

```text
/setup
  user clicks Connect GitHub repo
  -> opens GitHub App installation URL
  -> GitHub redirects to /setup/github/callback?installation_id=...
  -> UI asks API for installation repos
  -> user selects repo/ref
  -> API materializes source and creates run profile
  -> /control loads with sourceKind=github_repo
  -> access preflight checks repo_source from materialized source
  -> source scan runs real scanner on imported repo
```

### Source data after GitHub import

If `sourceDataPath` is still missing:

```text
source_data = blocked
Graduate To Aiven disabled
```

If source DB URL plus table allowlist is configured:

```text
source_data = ready
data migration can run generic source row copy
demo_adapter remains blocked until adapter generation exists
```

This is deliberate. GitHub source access should not imply data migration permission.

## Access Preflight Changes

Update `buildAccessSnapshot` so `repo_source` handles:

- local PulseWall source path;
- local fixture/sourceRoot path;
- GitHub materialized source path;
- GitHub source not yet materialized.

Expected statuses:

```text
GitHub installation selected, source downloaded: ready/live
GitHub installation selected, not downloaded: blocked
GitHub install missing: blocked
```

Add safe details:

```json
{
  "sourceKind": "github_repo",
  "repository": "owner/repo",
  "ref": "main",
  "commitSha": "abc123",
  "filesScanned": 42
}
```

Do not expose installation tokens.

## Scanner Changes

Keep `scanLovableSource({ sourceRoot, sourceLabel })`.

Change run source resolution:

```ts
resolveProfileSourceRoot(profile, runId)
```

Resolution order:

1. explicit sanitized local `sourceRoot`;
2. materialized GitHub source for run;
3. PulseWall demo root;
4. undefined -> access blocked.

## UI Changes

Make setup options functional in this order:

1. `Use PulseWall demo app`: existing path.
2. `Connect GitHub repo`: real GitHub App flow.
3. `Upload Lovable export`: still product path.

For GitHub repo selected, show:

```text
GitHub connected
owner/repo
Branch/ref: main
Source scan ready
Source data: requires Supabase DB URL / export
```

Do not make product-path cards look selectable until they actually do something.

Update `AccessBrokerPanel` copy so the user can distinguish:

- source code access;
- source data access;
- Aiven target write access;
- demo adapter support.

## Branch/PR Generation Phase

Do this after read-only import works.

New permissions:

```text
Repository contents: write
Pull requests: write
```

Flow:

```text
generate adapter patch
create branch aiden/aiven-migration-{runId}
commit generated backend adapter and env example changes
open PR with proof package summary
```

Rules:

- never push to default branch;
- branch name is run-scoped;
- PR body must say auth/storage/RLS are blockers;
- no generated file may contain secrets;
- user must approve production cutover separately.

## Verification

Local non-live gates:

```text
npm run typecheck
npm exec --workspace @aiden/control-room vite -- build
```

GitHub dev smoke:

```text
GET /api/github/install-url
install app on a test repo
GET /api/github/installations/:id/repositories
POST /api/github/source
POST /api/runs/:runId/source-scan
```

Expected:

- `repo_source` is ready/live for imported repo;
- behavior scanner reports real file refs;
- source data is blocked unless source DB/export path is configured;
- `Graduate To Aiven` remains blocked for arbitrary repo until data path and adapter support are ready.

Live Aiven path remains:

```text
npm run verify:live -- --one-click
```

Do not require GitHub integration for the PulseWall stage fallback.

## Acceptance

This mission is complete when:

- `/setup` has a real GitHub connection path.
- A user can install the GitHub App on a selected repo.
- Aiden lists repositories from that installation.
- Aiden imports selected repo/ref into a run-scoped local source workspace.
- The existing scanner runs against that imported source.
- Access Broker marks repo source access as ready from real GitHub import.
- Source data remains a separate permission and blocks migration when absent.
- No GitHub token, installation token, private key, or source DB credential appears in UI, logs, receipts, artifacts, or browser env.

## Demo Framing

If implemented before judging:

> PulseWall is our stage fixture, but this button is the real product path: connect any GitHub repo, let Aiden scan its Supabase behavior, then grant source data access separately for migration.

If only partially implemented:

> GitHub import is live for repo scanning; source database access and generated adapter PRs are the next gates before arbitrary-app cutover.

## Immediate Task Order

1. Add env docs and gitignore for run artifacts.
2. Add `@aiden/github-source` package with GitHub App JWT and installation token utilities.
3. Add safe archive download/extraction.
4. Add GitHub API routes.
5. Extend `SetupProfile` with GitHub source ref.
6. Store selected GitHub source in run state.
7. Update `resolveProfileSourceRoot` to use run materialized source.
8. Make setup UI GitHub card open install/list/select flow.
9. Update Access Broker rows and copy.
10. Add verifier script for GitHub import smoke.
11. Only then add branch/PR generation.
