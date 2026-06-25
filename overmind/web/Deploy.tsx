// web/Deploy.tsx — "Connect" (#/deploy), step 1 of the one path.
//
// ONE dominant action: graduate the bundled demo Lovable app (the reliable ~40s real migration).
// ONE secondary, clearly separated: paste a public GitHub repo to clone + analyze + generate live.
// On a failed start we show a small inline error — we never hard-redirect to login (the backend
// runs in mock mode, so the buttons work straight from the public URL).
//
// Owns: this file + product.css. Default export. Never edits App.tsx / server / orchestrator.

import { useState } from 'react'
import './product.css'
import { Stepper } from './components/Stepper.tsx'
import { startRun, type CsvSource, type RunOptions } from './api.ts'

// Which kind of *source data* the run should carry. Demo is the honest default.
type DataSource = 'demo' | 'pg' | 'csv'

// Derive a SQL-safe table name from a CSV filename: strip .csv, lowercase, non-alnum -> _.
function tableNameFromFile(name: string): string {
  return name
    .replace(/\.csv$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'table'
}

// Quick, cheap row estimate: non-empty lines minus the header. Good enough for a summary.
function estimateRows(csvText: string): number {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
  return Math.max(0, lines.length - 1)
}

export default function Deploy() {
  const [repo, setRepo] = useState('')
  const [busy, setBusy] = useState<null | 'demo' | 'analyze'>(null)
  const [err, setErr] = useState<string | null>(null)

  // ── source-data picker state ──
  const [dataSource, setDataSource] = useState<DataSource>('demo')
  const [connString, setConnString] = useState('')
  const [csvSources, setCsvSources] = useState<CsvSource[]>([])
  const [csvRows, setCsvRows] = useState<Record<string, number>>({})

  async function onCsvPick(files: FileList | null) {
    if (!files || files.length === 0) return
    const staged: CsvSource[] = []
    const rows: Record<string, number> = {}
    for (const file of Array.from(files)) {
      const csvText = await file.text()
      const tableName = tableNameFromFile(file.name)
      staged.push({ tableName, csvText })
      rows[file.name] = estimateRows(csvText)
    }
    setCsvSources(staged)
    setCsvRows(rows)
  }

  async function go(source: string | undefined, mode: 'demo' | 'analyze') {
    if (busy) return
    setBusy(mode)
    setErr(null)
    // Layer the chosen source data onto the run. Demo carries nothing extra.
    const opts: RunOptions = { source, mode }
    if (dataSource === 'pg' && connString.trim()) opts.sourceConnString = connString.trim()
    if (dataSource === 'csv' && csvSources.length > 0) opts.csvSources = csvSources
    const { ok } = await startRun(opts)
    if (!ok) {
      setErr("Couldn't reach the migration engine. Check your connection and try again.")
      setBusy(null)
      return
    }
    // Hand off to Mission Control — the run streams over /api/stream and the dashboard renders it.
    window.location.hash = '#/app'
  }

  return (
    <div className="pp">
      <header className="pp-top">
        <a className="pp-wordmark" href="#/">
          <span className="pp-mark">
            <LeafMark />
          </span>
          Aiven
          <span className="pp-divider">/</span>
          <span>Overmind</span>
        </a>
        <div className="pp-top-right">
          <Stepper active="connect" />
        </div>
      </header>

      <main className="pp-wrap pp-wrap-narrow">
        <span className="pp-kicker">Step 1 · Connect</span>
        <h1 className="pp-h1">
          Pick an app to <span className="pp-grad">graduate.</span>
        </h1>
        <p className="pp-lede">
          One click hands the backend to an agent swarm. It moves the parts that need Aiven scale —
          data, realtime, vector search — and leaves the rest running on Lovable.
        </p>

        {/* ── SOURCE DATA: pick what real data (if any) the run should carry ── */}
        <section className="pp-data-picker">
          <div className="pp-data-picker-head">Source data</div>
          <div className="pp-data-tabs" role="tablist" aria-label="Source data">
            <button
              type="button"
              role="tab"
              aria-selected={dataSource === 'demo'}
              className={`pp-data-tab${dataSource === 'demo' ? ' on' : ''}`}
              onClick={() => setDataSource('demo')}
            >
              Demo data
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dataSource === 'pg'}
              className={`pp-data-tab${dataSource === 'pg' ? ' on' : ''}`}
              onClick={() => setDataSource('pg')}
            >
              Postgres / Supabase
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dataSource === 'csv'}
              className={`pp-data-tab${dataSource === 'csv' ? ' on' : ''}`}
              onClick={() => setDataSource('csv')}
            >
              Table CSVs
            </button>
          </div>

          {dataSource === 'demo' && (
            <p className="pp-data-help">
              Graduate with PulseWall's bundled sample data — nothing to configure.
            </p>
          )}

          {dataSource === 'pg' && (
            <div className="pp-data-body">
              <div className="pp-source-input">
                <span className="pp-leaf">
                  <DbMark />
                </span>
                <input
                  value={connString}
                  onChange={(e) => setConnString(e.target.value)}
                  placeholder="postgres://user:pass@host:5432/db"
                  spellCheck={false}
                  aria-label="Postgres or Supabase connection string"
                />
              </div>
              <p className="pp-data-help">
                Own-Supabase apps expose this in Settings -&gt; Database.
              </p>
            </div>
          )}

          {dataSource === 'csv' && (
            <div className="pp-data-body">
              <label className="pp-csv-drop">
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={(e) => onCsvPick(e.target.files)}
                  aria-label="Table CSV exports"
                />
                <span className="pp-csv-drop-label">
                  {csvSources.length > 0
                    ? `${csvSources.length} file${csvSources.length === 1 ? '' : 's'} staged · click to replace`
                    : 'Drop your table CSV exports'}
                </span>
              </label>
              {csvSources.length > 0 && (
                <div className="pp-csv-summary">
                  {Object.entries(csvRows)
                    .map(([file, rows]) => `${file} -> ${rows} rows`)
                    .join(', ')}
                </div>
              )}
              <p className="pp-data-help">
                Works even for locked Lovable Cloud apps — export each table to CSV and drop them here.
              </p>
            </div>
          )}
        </section>

        {/* ── PRIMARY: the bundled demo app ── */}
        <section className="pp-connect-primary">
          <div className="pp-connect-main">
            <div className="pp-connect-eyebrow">
              <span className="pp-live-dot" /> Recommended · real ~40s migration
            </div>
            <h2 className="pp-h2">Use the demo app</h2>
            <div className="pp-demo-app">
              <span className="pp-leaf">
                <FolderMark />
              </span>
              <div className="pp-demo-app-body">
                <div className="pp-demo-app-name">PulseWall</div>
                <div className="pp-demo-app-sub">a real Lovable + Supabase app</div>
              </div>
              <span className="pp-source-badge">
                <DotMark /> Lovable · detected
              </span>
            </div>
          </div>
          <div className="pp-connect-action">
            <button
              className="pp-btn pp-btn-primary pp-btn-lg pp-btn-block"
              onClick={() => go(undefined, 'demo')}
              disabled={busy !== null}
            >
              {busy === 'demo' ? (
                <span className="pp-deploy-running">
                  <span className="pp-spin" /> Starting the swarm…
                </span>
              ) : (
                '⚡  Graduate to Aiven'
              )}
            </button>
          </div>
        </section>

        {/* ── SECONDARY: bring your own ── */}
        <section className="pp-connect-byo">
          <div className="pp-byo-or">Or bring your own</div>
          <div className="pp-byo-row">
            <div className="pp-source-input">
              <span className="pp-leaf">
                <FolderMark />
              </span>
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="https://github.com/your-org/your-lovable-app"
                spellCheck={false}
                aria-label="public GitHub repo URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && repo.trim()) go(repo.trim(), 'analyze')
                }}
              />
            </div>
            <button
              className="pp-btn pp-btn-ghost pp-btn-lg"
              onClick={() => go(repo.trim(), 'analyze')}
              disabled={busy !== null || !repo.trim()}
            >
              {busy === 'analyze' ? (
                <span className="pp-deploy-running">
                  <span className="pp-spin pp-spin-dark" /> Analyzing…
                </span>
              ) : (
                'Analyze & graduate'
              )}
            </button>
          </div>
          <p className="pp-byo-note">
            We clone your repo, analyze it, and generate your Aiven backend live. Live data needs your
            source DB connection — Lovable hides it, so we never fake it.
          </p>
        </section>

        {err && (
          <div
            className="pp-err"
            style={{
              color: 'var(--pp-crit)',
              background: 'rgba(218,54,51,0.08)',
              borderColor: 'rgba(218,54,51,0.3)',
            }}
          >
            {err}
          </div>
        )}
      </main>
    </div>
  )
}

// ── inline marks (no asset deps) ──
function LeafMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 4C20 4 8 5 5 13c-2 5 1 8 1 8s3-9 9-12c0 0-6 4-7 11 0 0 9 1 12-8 2-6 0-8 0-8z"
        fill="currentColor"
      />
    </svg>
  )
}
function FolderMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6.5A1.5 1.5 0 014.5 5h4l2 2.2H19.5A1.5 1.5 0 0121 8.7v9.3A1.5 1.5 0 0119.5 19.5h-15A1.5 1.5 0 013 18V6.5z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}
function DbMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}
function DotMark() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  )
}
