import type { CsvSourceInput, SetupProfile } from "@aiden/contracts"
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Database,
  FileArchive,
  Github,
  LockKeyhole,
  ShieldCheck
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import {
  completeGitHubManifest,
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
    eyebrow: "Available",
    copy: "For Lovable-managed backends, Aiden imports exported tables into Aiven shadow rows.",
    state: "available",
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

type SetupMode = "managed" | "source_db" | "github" | "csv"
type GitHubBusyState = "install" | "manifest" | "repos" | "import"
type CsvSourceDraft = CsvSourceInput & {
  bytes: number
  rowEstimate: number
}

const parseInstallationId = (value: string) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

const tableNameFromFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, "").replace(/^\uFEFF/, "")
  const safeName = baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `public.${safeName || "uploaded_table"}`
}

const estimateCsvRows = (text: string) => Math.max(0, text.split(/\r?\n/).filter((line) => line.trim()).length - 1)

export const SetupPage = () => {
  const [mode, setMode] = useState<SetupMode>("managed")
  const [sourceLabel, setSourceLabel] = useState("Owned Supabase project")
  const [sourceRoot, setSourceRoot] = useState("pulsewall")
  const [sourceDbUrl, setSourceDbUrl] = useState("")
  const [sourceTables, setSourceTables] = useState("posts")
  const [sourceCopyLimit, setSourceCopyLimit] = useState("1000")
  const [sourceSslDisabled, setSourceSslDisabled] = useState(false)
  const [csvSources, setCsvSources] = useState<CsvSourceDraft[]>([])
  const [csvImportSummary, setCsvImportSummary] = useState<string | null>(null)
  const [workspaceLabel, setWorkspaceLabel] = useState("Henri pre-connected workspace")
  const [githubInstallUrl, setGithubInstallUrl] = useState<string | null>(null)
  const [githubInstallationId, setGithubInstallationId] = useState("")
  const [githubRepos, setGithubRepos] = useState<GitHubRepositorySummary[]>([])
  const [githubProfile, setGithubProfile] = useState<SetupProfile | null>(null)
  const [githubImportSummary, setGithubImportSummary] = useState<string | null>(null)
  const [githubConnectionStatus, setGithubConnectionStatus] = useState<{
    tone: "warning" | "success"
    message: string
  } | null>(null)
  const [githubBusy, setGithubBusy] = useState<GitHubBusyState | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const installationId = params.get("installation_id")
    const manifestCode = params.get("code")
    const manifestState = params.get("state") ?? undefined
    const setupUrl = `${window.location.origin}/setup/github/callback`
    if (manifestCode) {
      setMode("github")
      setGithubBusy("manifest")
      setGithubConnectionStatus({
        tone: "success",
        message: "GitHub created the local Aiden connector. Saving it and opening repository installation."
      })
      completeGitHubManifest({ code: manifestCode, state: manifestState, setupUrl })
        .then((response) => {
          if (response.installUrl) {
            setGithubInstallUrl(response.installUrl)
            window.location.assign(response.installUrl)
            return
          }
          setGithubConnectionStatus({
            tone: "success",
            message: "GitHub connector saved. Click Connect GitHub again to install it on a repository."
          })
          window.history.replaceState({}, "", "/setup")
        })
        .catch((manifestError) => {
          setError(manifestError instanceof Error ? manifestError.message : "GitHub connector setup failed.")
          setGithubConnectionStatus({
            tone: "warning",
            message: manifestError instanceof Error ? manifestError.message : "GitHub connector setup failed."
          })
        })
        .finally(() => setGithubBusy(null))
      return
    }

    if (installationId) {
      setMode("github")
      setGithubInstallationId(installationId)
      setGithubConnectionStatus({
        tone: "success",
        message: "GitHub connected. Importing the selected repository."
      })
      window.history.replaceState({}, "", "/setup")
      void loadGithubReposForInstallation(installationId)
    }
  }, [])

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
      if (mode === "csv") {
        return productSetupProfile({
          sourceLabel: sourceLabel.trim() || "Lovable CSV export",
          workspaceLabel: workspaceLabel.trim() || "Henri pre-connected workspace",
          sourceKind: "lovable_cloud_export",
          sourceDataPath: "csv_export",
          detectedBehaviors: ["CSV table export", "schema headers", "row import", "adapter required"]
        })
      }
      return productSetupProfile({
        sourceLabel: sourceLabel.trim() || githubRepos[0]?.fullName || "Owned Supabase project",
        sourceRoot: sourceRoot.trim() || undefined,
        workspaceLabel: workspaceLabel.trim() || "Henri pre-connected workspace"
      })
    },
    [githubProfile, githubRepos, mode, sourceLabel, sourceRoot, workspaceLabel]
  )

  const behaviorTags = selectedProfile.detectedBehaviors.length > 0 ? selectedProfile.detectedBehaviors : ["scan pending"]

  const connectGithub = async () => {
    setError(null)
    setGithubConnectionStatus(null)
    setGithubBusy("install")
    try {
      const response = await getGitHubInstallUrl()
      if (!response.configured || !response.url) {
        const recommendedSetupUrl = `${window.location.origin}/setup/github/callback`
        const bootstrapUrl = `/api/github/manifest/start?setupUrl=${encodeURIComponent(
          response.setupUrl || recommendedSetupUrl
        )}`
        setGithubConnectionStatus({
          tone: "success",
          message: "Opening GitHub to create the local Aiden connector, then you can install it on selected repos."
        })
        window.location.assign(bootstrapUrl)
        return
      }
      setGithubConnectionStatus({
        tone: "success",
        message: response.setupUrl
          ? `Opening GitHub. After installation, GitHub should return to ${response.setupUrl}.`
          : "Opening GitHub. If GitHub does not return automatically, copy the installation id from the GitHub URL."
      })
      setGithubInstallUrl(response.url)
      window.location.assign(response.url)
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "GitHub App setup failed."
      setGithubConnectionStatus({ tone: "warning", message })
      setError(message)
    } finally {
      setGithubBusy(null)
    }
  }

  async function loadGithubReposForInstallation(installationIdValue: string, autoImportSingle = true) {
    setError(null)
    setGithubBusy("repos")
    setGithubProfile(null)
    setGithubImportSummary(null)
    setGithubConnectionStatus(null)
    try {
      const installationId = parseInstallationId(installationIdValue)
      if (!installationId) {
        setError("GitHub did not return a valid installation id.")
        return
      }
      const response = await listGitHubRepositories(installationId)
      setGithubRepos(response.repositories)
      if (response.repositories.length === 0) {
        setError("This GitHub installation has no repositories available to Aiden.")
        setGithubConnectionStatus({
          tone: "warning",
          message: "GitHub connected, but no repositories were granted to Aiden."
        })
        return
      }
      if (response.repositories.length === 1 && autoImportSingle) {
        await importGithubRepo(response.repositories[0], installationIdValue)
        return
      }
      setGithubConnectionStatus({
        tone: "success",
        message: `GitHub granted ${response.repositories.length} repositories. Choose the source app to import.`
      })
    } catch (repoError) {
      setError(repoError instanceof Error ? repoError.message : "GitHub repository lookup failed.")
    } finally {
      setGithubBusy(null)
    }
  }

  async function importGithubRepo(repository: GitHubRepositorySummary, installationIdValue = githubInstallationId) {
    setError(null)
    setGithubBusy("import")
    setGithubConnectionStatus(null)
    try {
      const installationId = parseInstallationId(installationIdValue)
      if (!installationId) {
        setError("GitHub did not return a valid installation id.")
        return
      }
      const response = await importGitHubSource({
        installationId,
        repositoryId: repository.id,
        owner: repository.owner,
        repo: repository.repo,
        ref: repository.defaultBranch
      })
      setGithubProfile(response.setupProfile)
      setGithubImportSummary(
        `${response.setupProfile.sourceLabel} imported ${response.filesWritten} files (${formatBytes(
          response.bytesWritten
        )}) into ${response.sourceRoot}.`
      )
      setGithubConnectionStatus({
        tone: "success",
        message: `${response.setupProfile.sourceLabel} is ready for behavior scanning.`
      })
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "GitHub source import failed.")
    } finally {
      setGithubBusy(null)
    }
  }

  const importCsvFiles = async (files: FileList | null) => {
    setError(null)
    setCsvImportSummary(null)
    if (!files || files.length === 0) return
    const csvFiles = [...files].filter((file) => file.name.toLowerCase().endsWith(".csv"))
    if (csvFiles.length === 0) {
      setError("Select one or more .csv files.")
      return
    }
    if (csvFiles.length > 8) {
      setError("CSV import accepts at most 8 files at once.")
      return
    }

    try {
      const nextSources = await Promise.all(
        csvFiles.map(async (file) => {
          const csvText = await file.text()
          return {
            fileName: file.name,
            tableName: tableNameFromFileName(file.name),
            csvText,
            bytes: file.size,
            rowEstimate: estimateCsvRows(csvText)
          }
        })
      )
      setCsvSources(nextSources)
      setSourceLabel(sourceLabel.trim() && sourceLabel !== "Owned Supabase project" ? sourceLabel : "Lovable CSV export")
      setCsvImportSummary(
        `${nextSources.length} CSV file(s) staged: ${nextSources
          .map((source) => `${source.tableName} ${source.rowEstimate} rows`)
          .join(", ")}.`
      )
    } catch (csvError) {
      setError(csvError instanceof Error ? csvError.message : "CSV file import failed.")
    }
  }

  const updateCsvTableName = (index: number, tableName: string) => {
    setCsvSources((sources) =>
      sources.map((source, sourceIndex) => (sourceIndex === index ? { ...source, tableName } : source))
    )
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
    if (mode === "csv" && csvSources.length === 0) {
      setError("CSV export mode needs at least one .csv file.")
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
        : mode === "csv"
          ? {
              setupProfile: selectedProfile,
              csvSources: csvSources.map(({ fileName, tableName, csvText }) => ({ fileName, tableName, csvText })),
              sourceCopyLimit
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
        <button
          className={`setup-mode-button ${mode === "csv" ? "active" : ""}`}
          type="button"
          onClick={() => setMode("csv")}
        >
          <CloudUpload aria-hidden="true" size={16} />
          CSV export import
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
              {githubBusy === "install" || githubBusy === "manifest"
                ? "Opening GitHub"
                : githubBusy === "repos"
                  ? "Reading GitHub selection"
                  : githubBusy === "import"
                    ? "Importing repository"
                    : "Connect GitHub"}
            </button>
            {githubInstallUrl ? (
              <a href={githubInstallUrl} target="_blank" rel="noreferrer">
                Change GitHub repo access
              </a>
            ) : null}
          </div>
          {githubImportSummary ? <p className="setup-import-summary">{githubImportSummary}</p> : null}
          {githubConnectionStatus ? (
            <p className={`setup-connection-status setup-connection-status-${githubConnectionStatus.tone}`}>
              {githubConnectionStatus.message}
            </p>
          ) : null}
          {githubRepos.length > 1 && !githubProfile ? (
            <div className="github-repo-list" aria-label="GitHub repositories granted to Aiden">
              {githubRepos.map((repository) => (
                <button
                  className="ghost-button"
                  type="button"
                  key={repository.id}
                  onClick={() => importGithubRepo(repository)}
                  disabled={Boolean(githubBusy)}
                >
                  <Github aria-hidden="true" size={15} />
                  {repository.fullName}
                </button>
              ))}
            </div>
          ) : null}
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

      {mode === "csv" ? (
        <section className="setup-form-panel" aria-label="CSV export import configuration">
          <div className="setup-section-heading">
            <p className="eyebrow">04 CSV Export</p>
            <strong>Upload exported tables into Aiven shadow rows</strong>
          </div>
          <label>
            <span>Source label</span>
            <input value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} />
          </label>
          <label>
            <span>Copy limit</span>
            <input inputMode="numeric" value={sourceCopyLimit} onChange={(event) => setSourceCopyLimit(event.target.value)} />
          </label>
          <label className="setup-wide-field">
            <span>CSV files</span>
            <input
              accept=".csv,text/csv"
              multiple
              type="file"
              onChange={(event) => {
                void importCsvFiles(event.currentTarget.files)
              }}
            />
          </label>
          {csvSources.length > 0 ? (
            <div className="setup-csv-list">
              {csvSources.map((source, index) => (
                <label key={`${source.fileName}-${index}`}>
                  <span>{source.fileName} · {formatBytes(source.bytes)} · {source.rowEstimate} rows</span>
                  <input
                    value={source.tableName}
                    onChange={(event) => updateCsvTableName(index, event.target.value)}
                    placeholder="public.table_name"
                  />
                </label>
              ))}
            </div>
          ) : null}
          {csvImportSummary ? <p className="setup-import-summary">{csvImportSummary}</p> : null}
          <p>
            CSV mode imports table rows and headers into Aiven shadow tables. It cannot infer Auth,
            Storage, RLS, realtime, or adapter behavior from CSV alone.
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
            Backend ownership path: {mode === "managed" ? "managed source profile" : mode === "github" ? "GitHub App source import" : mode === "csv" ? "uploaded CSV table export" : "owned source Postgres URL"}.
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
