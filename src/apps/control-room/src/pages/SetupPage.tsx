import type { SetupProfile } from "@aiden/contracts"
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Database,
  FileArchive,
  Github,
  LockKeyhole,
  RefreshCw,
  ShieldCheck
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  getGitHubInstallUrl,
  importGitHubSource,
  listGitHubRepositories,
  submitSetupProfile,
  type GitHubRepositorySummary
} from "../lib/api"
import {
  managedSetupProfile,
  productSetupProfile,
  storeSetupProfile,
  storeSetupRuntimeConfig,
  type SetupRuntimeConfig
} from "../lib/setupProfile"

type OptionState = "selected" | "available" | "coming_soon"

type SetupOption = {
  title: string
  eyebrow: string
  copy: string
  state: OptionState
  icon: LucideIcon
}

const dataOptions: SetupOption[] = [
  {
    title: "Managed source data",
    eyebrow: "Selected data path",
    copy: "Deterministic PulseWall rows for live Aiven Postgres migration and validation proof.",
    state: "selected",
    icon: Database
  },
  {
    title: "Supabase DB URL / read-only access",
    eyebrow: "Available",
    copy: "For an owned Supabase project, Aiden can dump schema/data and compare source counts.",
    state: "available",
    icon: LockKeyhole
  },
  {
    title: "CSV / Lovable Cloud export",
    eyebrow: "Coming soon",
    copy: "For Lovable-managed backends, Aiden recreates schema from exportable artifacts.",
    state: "coming_soon",
    icon: CloudUpload
  }
]

const workspaceOptions: SetupOption[] = [
  {
    title: "Henri pre-connected workspace",
    eyebrow: "Selected workspace",
    copy: "Connected Aiven workspace using local secure credentials and ignored local secrets.",
    state: "selected",
    icon: ShieldCheck
  },
  {
    title: "Connect existing Aiven workspace",
    eyebrow: "Coming soon",
    copy: "Aiden uses the customer's Aiven account to create or verify the target data plane.",
    state: "coming_soon",
    icon: CheckCircle2
  },
  {
    title: "Create new Aiven workspace",
    eyebrow: "Coming soon",
    copy: "If the customer does not have Aiven, Aiden creates the workspace during setup.",
    state: "coming_soon",
    icon: ArrowRight
  }
]

const stateLabel = (state: OptionState) => {
  if (state === "selected") return "selected"
  if (state === "available") return "available"
  return "coming soon"
}

const SetupCard = ({ option }: { option: SetupOption }) => {
  const Icon = option.icon
  return (
    <article className={`setup-option setup-option-${option.state}`}>
      <div className="setup-option-icon">
        <Icon aria-hidden="true" size={17} />
      </div>
      <div>
        <span>{option.eyebrow}</span>
        <strong>{option.title}</strong>
        <p>{option.copy}</p>
      </div>
      <em>{stateLabel(option.state)}</em>
    </article>
  )
}

type SetupMode = "managed" | "source_db" | "github"
type GitHubBusyState = "install" | "repos" | "import"

const parseInstallationId = (value: string) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export const SetupPage = () => {
  const [mode, setMode] = useState<SetupMode>("managed")
  const [sourceLabel, setSourceLabel] = useState("Owned Supabase project")
  const [sourceRoot, setSourceRoot] = useState("pulsewall")
  const [sourceDbUrl, setSourceDbUrl] = useState("")
  const [sourceTables, setSourceTables] = useState("posts")
  const [sourceCopyLimit, setSourceCopyLimit] = useState("1000")
  const [sourceSslDisabled, setSourceSslDisabled] = useState(false)
  const [workspaceLabel, setWorkspaceLabel] = useState("Henri pre-connected workspace")
  const [githubInstallUrl, setGithubInstallUrl] = useState<string | null>(null)
  const [githubInstallationId, setGithubInstallationId] = useState("")
  const [githubRepos, setGithubRepos] = useState<GitHubRepositorySummary[]>([])
  const [selectedGithubRepoId, setSelectedGithubRepoId] = useState("")
  const [githubRef, setGithubRef] = useState("")
  const [githubProfile, setGithubProfile] = useState<SetupProfile | null>(null)
  const [githubImportSummary, setGithubImportSummary] = useState<string | null>(null)
  const [githubBusy, setGithubBusy] = useState<GitHubBusyState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const installationId = new URLSearchParams(window.location.search).get("installation_id")
    if (!installationId) return
    setMode("github")
    setGithubInstallationId(installationId)
  }, [])

  const selectedGithubRepo = useMemo(
    () => githubRepos.find((repository) => String(repository.id) === selectedGithubRepoId),
    [githubRepos, selectedGithubRepoId]
  )

  const sourceOptions = useMemo<SetupOption[]>(
    () => [
      {
        title: "Use PulseWall managed profile",
        eyebrow: mode === "managed" ? "Selected source" : "Available",
        copy: "Managed Lovable/Supabase-style profile with migrations, realtime, auth, storage, RLS, and source data.",
        state: mode === "managed" ? "selected" : "available",
        icon: CheckCircle2
      },
      {
        title: "Connect GitHub repo",
        eyebrow: mode === "github" ? "Selected source" : "Available",
        copy: githubProfile
          ? `${githubProfile.sourceLabel} imported for source scanning.`
          : "Aiden scans the repo, finds Supabase behavior, and prepares an adapter branch.",
        state: mode === "github" ? "selected" : "available",
        icon: Github
      },
      {
        title: "Upload Lovable export",
        eyebrow: "Coming soon",
        copy: "Aiden imports a local export when GitHub or direct Lovable project access is unavailable.",
        state: "coming_soon",
        icon: FileArchive
      }
    ],
    [githubProfile, mode]
  )

  const selectedProfile = useMemo(
    () => {
      if (mode === "managed") return managedSetupProfile
      if (mode === "github" && githubProfile) return githubProfile
      return productSetupProfile({
        sourceLabel: sourceLabel.trim() || selectedGithubRepo?.fullName || "Owned Supabase project",
        sourceRoot: sourceRoot.trim() || undefined,
        workspaceLabel: workspaceLabel.trim() || "Henri pre-connected workspace"
      })
    },
    [githubProfile, mode, selectedGithubRepo?.fullName, sourceLabel, sourceRoot, workspaceLabel]
  )

  const behaviorTags = selectedProfile.detectedBehaviors.length > 0 ? selectedProfile.detectedBehaviors : ["scan pending"]

  const connectGithub = async () => {
    setError(null)
    setGithubBusy("install")
    try {
      const response = await getGitHubInstallUrl()
      if (!response.configured || !response.url) {
        setError(`GitHub App setup is missing: ${response.missingEnv.join(", ") || "GitHub App env"}.`)
        return
      }
      setGithubInstallUrl(response.url)
      window.location.assign(response.url)
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "GitHub App setup failed.")
    } finally {
      setGithubBusy(null)
    }
  }

  const loadGithubRepos = async () => {
    setError(null)
    setGithubBusy("repos")
    setGithubProfile(null)
    setGithubImportSummary(null)
    try {
      const installationId = parseInstallationId(githubInstallationId)
      if (!installationId) {
        setError("Enter the GitHub installation id from the App callback URL.")
        return
      }
      const response = await listGitHubRepositories(installationId)
      setGithubRepos(response.repositories)
      setSelectedGithubRepoId(response.repositories[0] ? String(response.repositories[0].id) : "")
      setGithubRef(response.repositories[0]?.defaultBranch ?? "")
      if (response.repositories.length === 0) {
        setError("This GitHub installation has no repositories available to Aiden.")
      }
    } catch (repoError) {
      setError(repoError instanceof Error ? repoError.message : "GitHub repository lookup failed.")
    } finally {
      setGithubBusy(null)
    }
  }

  const importSelectedGithubRepo = async () => {
    setError(null)
    setGithubBusy("import")
    try {
      const installationId = parseInstallationId(githubInstallationId)
      if (!installationId) {
        setError("Enter the GitHub installation id before importing.")
        return
      }
      if (!selectedGithubRepo) {
        setError("Select a GitHub repository to import.")
        return
      }
      const response = await importGitHubSource({
        installationId,
        repositoryId: selectedGithubRepo.id,
        owner: selectedGithubRepo.owner,
        repo: selectedGithubRepo.repo,
        ref: githubRef.trim() || selectedGithubRepo.defaultBranch
      })
      setGithubProfile(response.setupProfile)
      setGithubImportSummary(
        `${response.setupProfile.sourceLabel} imported ${response.filesWritten} files (${formatBytes(
          response.bytesWritten
        )}) into ${response.sourceRoot}.`
      )
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "GitHub source import failed.")
    } finally {
      setGithubBusy(null)
    }
  }

  const continueToControl = async () => {
    setError(null)
    setIsSubmitting(true)
    if (mode === "source_db" && (!sourceDbUrl.trim() || !sourceTables.trim())) {
      setError("Source DB mode needs a Postgres URL and table allowlist.")
      setIsSubmitting(false)
      return
    }
    if (mode === "github" && !githubProfile) {
      setError("Import a GitHub repository before continuing.")
      setIsSubmitting(false)
      return
    }

    const config: SetupRuntimeConfig =
      mode === "source_db"
        ? {
            setupProfile: selectedProfile,
            sourceDbUrl,
            sourceTables,
            sourceCopyLimit,
            sourceSslDisabled
          }
        : { setupProfile: selectedProfile }

    try {
      await submitSetupProfile(config)
      storeSetupProfile(selectedProfile)
      storeSetupRuntimeConfig(config)
      window.location.assign("/control")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Setup failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell setup-page">
      <header className="setup-header">
        <div>
          <p className="eyebrow">Aiden Workspace Setup</p>
          <h1>Choose the app source and Aiven workspace.</h1>
          <p>
            Start with a managed PulseWall profile, import a GitHub repository, or connect an owned
            source database. Aiden verifies access, builds a shadow data plane, and reports every
            blocker before cutover.
          </p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={continueToControl}
          disabled={isSubmitting || Boolean(githubBusy)}
        >
          {isSubmitting ? "Preparing" : "Continue to Control Room"}
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </header>

      {error ? <div className="error-strip">{error}</div> : null}

      <section className="setup-mode-panel" aria-label="Setup mode">
        <button
          className={`setup-mode-button ${mode === "managed" ? "active" : ""}`}
          type="button"
          onClick={() => setMode("managed")}
        >
          <CheckCircle2 aria-hidden="true" size={16} />
          Managed PulseWall profile
        </button>
        <button
          className={`setup-mode-button ${mode === "github" ? "active" : ""}`}
          type="button"
          onClick={() => setMode("github")}
        >
          <Github aria-hidden="true" size={16} />
          GitHub source import
        </button>
        <button
          className={`setup-mode-button ${mode === "source_db" ? "active" : ""}`}
          type="button"
          onClick={() => setMode("source_db")}
        >
          <Database aria-hidden="true" size={16} />
          Source DB shadow copy
        </button>
      </section>

      <section className="setup-grid" aria-label="Migration setup selections">
        <div className="setup-column">
          <div className="setup-section-heading">
            <p className="eyebrow">01 Source App</p>
            <strong>What app are we graduating?</strong>
          </div>
          {sourceOptions.map((option) => (
            <SetupCard key={option.title} option={option} />
          ))}
        </div>

        <div className="setup-column">
          <div className="setup-section-heading">
            <p className="eyebrow">02 Source Data</p>
            <strong>Where can Aiden read rows from?</strong>
          </div>
          {dataOptions.map((option) => (
            <SetupCard key={option.title} option={option} />
          ))}
        </div>

        <div className="setup-column">
          <div className="setup-section-heading">
            <p className="eyebrow">03 Aiven Workspace</p>
            <strong>Where should the target runtime live?</strong>
          </div>
          {workspaceOptions.map((option) => (
            <SetupCard key={option.title} option={option} />
          ))}
        </div>
      </section>

      {mode === "github" ? (
        <section className="setup-form-panel" aria-label="GitHub source import configuration">
          <div className="setup-section-heading">
            <p className="eyebrow">04 GitHub Source</p>
            <strong>Repository contents import for behavior scanning</strong>
          </div>
          <div className="setup-inline-actions">
            <button className="primary-button" type="button" onClick={connectGithub} disabled={Boolean(githubBusy)}>
              <Github aria-hidden="true" size={16} />
              {githubBusy === "install" ? "Opening GitHub" : "Connect GitHub"}
            </button>
            <button className="ghost-button" type="button" onClick={loadGithubRepos} disabled={Boolean(githubBusy)}>
              <RefreshCw aria-hidden="true" size={16} />
              {githubBusy === "repos" ? "Loading repos" : "Load repositories"}
            </button>
          </div>
          <label>
            <span>Installation id</span>
            <input
              inputMode="numeric"
              value={githubInstallationId}
              onChange={(event) => setGithubInstallationId(event.target.value)}
              placeholder="12345678"
            />
          </label>
          <label>
            <span>Repository</span>
            <select
              value={selectedGithubRepoId}
              onChange={(event) => {
                const repository = githubRepos.find((candidate) => String(candidate.id) === event.target.value)
                setSelectedGithubRepoId(event.target.value)
                setGithubRef(repository?.defaultBranch ?? "")
                setGithubProfile(null)
                setGithubImportSummary(null)
              }}
            >
              <option value="">Select repository</option>
              {githubRepos.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Branch, tag, or SHA</span>
            <input
              value={githubRef}
              onChange={(event) => {
                setGithubRef(event.target.value)
                setGithubProfile(null)
                setGithubImportSummary(null)
              }}
              placeholder={selectedGithubRepo?.defaultBranch ?? "main"}
            />
          </label>
          <div className="setup-inline-actions">
            <button className="secondary-button" type="button" onClick={importSelectedGithubRepo} disabled={Boolean(githubBusy)}>
              {githubBusy === "import" ? "Importing repository" : "Import selected repository"}
            </button>
            {githubInstallUrl ? (
              <a href={githubInstallUrl} target="_blank" rel="noreferrer">
                GitHub App install URL
              </a>
            ) : null}
          </div>
          {githubImportSummary ? <p className="setup-import-summary">{githubImportSummary}</p> : null}
          <p>
            Repository access uses GitHub App contents read permission. Source rows remain a separate
            Supabase/Postgres permission and will stay blocked until a DB URL and table allowlist are configured.
          </p>
        </section>
      ) : null}

      {mode === "source_db" ? (
        <section className="setup-form-panel" aria-label="Source DB shadow copy configuration">
          <div className="setup-section-heading">
            <p className="eyebrow">04 Source DB Inputs</p>
            <strong>Allowlisted row copy into Aiven shadow tables</strong>
          </div>
          <label>
            <span>Source label</span>
            <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} />
          </label>
          <label>
            <span>Local source root</span>
            <input value={sourceRoot} onChange={(event) => setSourceRoot(event.target.value)} />
          </label>
          <label className="setup-wide-field">
            <span>Source Postgres URL</span>
            <input
              autoComplete="off"
              aria-label="Source Postgres URL"
              type="password"
              value={sourceDbUrl}
              onChange={(event) => setSourceDbUrl(event.target.value)}
              placeholder="postgresql://..."
            />
          </label>
          <label>
            <span>Table allowlist</span>
            <input
              aria-label="Table allowlist"
              value={sourceTables}
              onChange={(event) => setSourceTables(event.target.value)}
              placeholder="public.posts,public.reactions"
            />
          </label>
          <label>
            <span>Copy limit</span>
            <input inputMode="numeric" value={sourceCopyLimit} onChange={(event) => setSourceCopyLimit(event.target.value)} />
          </label>
          <label className="setup-checkbox-field">
            <input
              checked={sourceSslDisabled}
              type="checkbox"
              onChange={(event) => setSourceSslDisabled(event.target.checked)}
            />
            <span>Disable source SSL for local database testing</span>
          </label>
          <p>
            This path proves source row access and Aiven shadow writes. Generated app-compatible DDL
            and adapter cutover remain blocked until manifest adapter generation exists.
          </p>
        </section>
      ) : null}

      <section className="setup-bottom-grid" aria-label="Detected profile and migration scope">
        <article className="setup-panel">
          <div>
            <p className="eyebrow">Detected Source Profile</p>
            <h2>{selectedProfile.sourceLabel}</h2>
          </div>
          <div className="setup-tags">
            {behaviorTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p>
            Backend ownership path: {mode === "managed" ? "managed source profile" : mode === "github" ? "GitHub App source import" : "owned source Postgres URL"}.
            Product source-data paths cover owned Supabase projects, Lovable Cloud exports, and CSV/data dump fallbacks.
          </p>
        </article>

        <article className="setup-panel">
          <div>
            <p className="eyebrow">Migration Scope</p>
            <h2>Shadow first. Production untouched.</h2>
          </div>
          <div className="scope-list">
            <span><CheckCircle2 aria-hidden="true" size={15} /> Shadow migration</span>
            <span><CheckCircle2 aria-hidden="true" size={15} /> Controlled runtime cutover</span>
            <span>Production Auth adapter later</span>
            <span>Production Storage adapter later</span>
            <span>Production cutover not requested</span>
          </div>
        </article>
      </section>
    </main>
  )
}
