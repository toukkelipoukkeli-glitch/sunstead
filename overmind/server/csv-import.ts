// server/csv-import.ts — REAL CSV → Aiven Postgres import for migrating ANY app's data.
//
// WHY this exists: a Lovable Cloud app hides its DB connection string, so the only universal way to
// get its data out is a CSV export. This module takes those CSV files (read as text in the browser
// and POSTed up) and bulk-loads them into the freshly-provisioned Aiven Postgres target — for real,
// in a transaction, with verified row counts. It is the CSV sibling of migrator.ts's DB→DB copyData.
//
// Lifted from Henri's proven pattern: validate (<=8 files, <=2MB each, safe table names), parse CSV
// robustly (quoted fields with embedded commas/quotes/newlines), CREATE TABLE IF NOT EXISTS with
// every column TEXT (named from the header) over a DIRECT pg connection (the MCP pg_write path blocks
// DDL), then chunked parameterized INSERTs in one transaction, emitting {type:'migration'} progress.
//
// Degradation contract (same as migrator.ts): every path logs clearly and returns a typed result.
// We NEVER throw into the orchestrator pipeline, and we NEVER log full row data or any secret.

import type { SwarmEvent } from '../shared/types.ts'
import { applySchemaSql, pool } from '../aiven/pg.ts'

/** Caps (Henri's limits). max files, max bytes per file. */
const MAX_FILES = 8
const MAX_BYTES_PER_FILE = 2_000_000
/** Safe SQL identifier — letters/underscore start, then letters/digits/underscore. */
const SAFE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/
/** Insert rows in chunks to keep each statement's parameter count sane. */
const CHUNK_ROWS = 200

export interface CsvSource {
  tableName: string
  csvText: string
}

export interface CsvImportResult {
  table: string
  /** rows that actually landed in the target */
  copied: number
  /** rows parsed from the CSV (the denominator) */
  source: number
  ok: boolean
  error?: string
}

// ──────────────────────────── parser ────────────────────────────

/**
 * Parse CSV text → { header, rows }. Comma-delimited, double-quote quoting with "" escapes, allows
 * newlines inside quoted fields, and strips a single trailing empty line. Robust enough for real
 * spreadsheet/Postgres-COPY exports without pulling in a dependency.
 *
 *   • A field wrapped in "..." may contain commas, CR/LF, and "" (an escaped double-quote).
 *   • Outside quotes, , ends a field and \n (or \r\n) ends a record.
 *   • A lone trailing newline does NOT produce a phantom empty record.
 */
export function parseCsv(text: string): { header: string[]; rows: string[][] } {
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false
  let started = false // have we begun the current record (so we can detect the trailing empty line)

  const pushField = () => {
    record.push(field)
    field = ''
  }
  const pushRecord = () => {
    pushField()
    records.push(record)
    record = []
    started = false
  }

  const s = text
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++ // consume the escaped quote
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    // not in quotes
    if (ch === '"') {
      inQuotes = true
      started = true
    } else if (ch === ',') {
      pushField()
      started = true
    } else if (ch === '\r') {
      // swallow; the \n (if any) closes the record. A lone \r also closes a record.
      if (s[i + 1] === '\n') i++
      pushRecord()
    } else if (ch === '\n') {
      pushRecord()
    } else {
      field += ch
      started = true
    }
  }
  // Flush a final record if the text didn't end with a newline (started === true means there's
  // pending content). If it ended on a newline, `started` is false and we add nothing — that strips
  // the trailing empty line.
  if (started || field.length > 0 || record.length > 0) {
    pushRecord()
  }

  const header = records.shift() ?? []
  return { header, rows: records }
}

// ──────────────────────────── import ────────────────────────────

/**
 * Validate + import an array of CSV sources into the target Postgres. For each source:
 *   1. validate (count, byte size, safe table name) — invalid sources are skipped with ok:false.
 *   2. parse; derive TEXT columns from the header (deduped, safe-named).
 *   3. CREATE TABLE IF NOT EXISTS over a DIRECT pg connection (applySchemaSql — MCP blocks DDL).
 *   4. chunked, parameterized INSERTs in ONE transaction; emit {type:'migration'} as rows land.
 *   5. verify: SELECT count(*) and report real copied counts.
 *
 * Never throws into the pipeline; returns one result per requested source.
 */
export async function importCsvSources(
  targetConn: string,
  sources: CsvSource[],
  emit: (e: SwarmEvent) => void,
): Promise<CsvImportResult[]> {
  const results: CsvImportResult[] = []
  const list = Array.isArray(sources) ? sources : []

  if (list.length === 0) {
    emit({ type: 'log', level: 'warn', msg: 'csv-import: no CSV sources provided' })
    return results
  }
  if (list.length > MAX_FILES) {
    emit({ type: 'log', level: 'warn', msg: `csv-import: ${list.length} files exceeds max ${MAX_FILES} — rejecting extras` })
  }

  const accepted = list.slice(0, MAX_FILES)
  for (const src of accepted) {
    const table = String(src?.tableName ?? '').trim()
    const csvText = typeof src?.csvText === 'string' ? src.csvText : ''

    // ── validate ──
    if (!SAFE_NAME.test(table)) {
      emit({ type: 'log', level: 'warn', msg: `csv-import: rejected unsafe table name "${table.slice(0, 40)}"` })
      results.push({ table: table || '(invalid)', copied: 0, source: 0, ok: false, error: 'invalid table name' })
      continue
    }
    // Byte length (UTF-8), not char length — matches the on-the-wire size we cap.
    const byteLen = Buffer.byteLength(csvText, 'utf8')
    if (byteLen > MAX_BYTES_PER_FILE) {
      emit({ type: 'log', level: 'warn', msg: `csv-import: ${table} is ${byteLen} bytes, exceeds ${MAX_BYTES_PER_FILE} — skipped` })
      results.push({ table, copied: 0, source: 0, ok: false, error: 'file too large' })
      continue
    }

    try {
      const r = await importOne(targetConn, table, csvText, emit)
      results.push(r)
    } catch (e: any) {
      // Belt-and-suspenders: importOne already degrades, but never let a surprise throw escape.
      emit({ type: 'log', level: 'warn', msg: `csv-import: ${table} failed (${e?.message ?? e})` })
      results.push({ table, copied: 0, source: 0, ok: false, error: e?.message ?? String(e) })
    }
  }

  return results
}

/** Import a single validated CSV into one table. Creates the table (all TEXT), bulk-inserts, verifies. */
async function importOne(
  targetConn: string,
  table: string,
  csvText: string,
  emit: (e: SwarmEvent) => void,
): Promise<CsvImportResult> {
  const { header, rows } = parseCsv(csvText)
  const total = rows.length

  // Derive safe, unique column names from the header. A blank/unsafe header cell becomes col_<n>;
  // duplicates get a numeric suffix so the CREATE TABLE is always valid.
  const seen = new Map<string, number>()
  const columns = header.map((raw, idx) => {
    let name = String(raw ?? '').trim()
    if (!SAFE_NAME.test(name)) name = `col_${idx + 1}`
    const n = seen.get(name) ?? 0
    seen.set(name, n + 1)
    return n === 0 ? name : `${name}_${n}`
  })

  if (columns.length === 0) {
    emit({ type: 'log', level: 'warn', msg: `csv-import: ${table} has no header row — skipped` })
    return { table, copied: 0, source: total, ok: false, error: 'empty header' }
  }

  // ── DDL over a DIRECT connection (MCP pg_write blocks CREATE TABLE) ──
  const colDefs = columns.map((c) => `"${c}" text`).join(', ')
  const ddl = `create table if not exists "${table}" (${colDefs})`
  const schemaRes = await applySchemaSql(targetConn, ddl)
  if (!schemaRes.ok) {
    emit({ type: 'log', level: 'warn', msg: `csv-import: CREATE TABLE ${table} failed (${schemaRes.error})` })
    return { table, copied: 0, source: total, ok: false, error: schemaRes.error }
  }

  if (total === 0) {
    emit({ type: 'log', level: 'info', msg: `csv-import: ${table} created (0 data rows)` })
    emit({ type: 'migration', table, copied: 0, total: 0 })
    return { table, copied: 0, source: 0, ok: true }
  }

  // ── chunked parameterized INSERT in one transaction ──
  const colCount = columns.length
  const colList = columns.map((c) => `"${c}"`).join(', ')
  const client = await pool(targetConn).connect()
  let copied = 0
  try {
    await client.query('BEGIN')
    for (let i = 0; i < rows.length; i += CHUNK_ROWS) {
      const chunk = rows.slice(i, i + CHUNK_ROWS)
      const params: (string | null)[] = []
      const groups: string[] = []
      let p = 1
      for (const row of chunk) {
        const ph: string[] = []
        for (let c = 0; c < colCount; c++) {
          // Normalize ragged rows to the header width: missing → NULL, extras dropped.
          const v = c < row.length ? row[c] : null
          params.push(v === undefined ? null : v)
          ph.push(`$${p++}`)
        }
        groups.push(`(${ph.join(', ')})`)
      }
      await client.query(`insert into "${table}" (${colList}) values ${groups.join(', ')}`, params)
      copied += chunk.length
      emit({ type: 'migration', table, copied, total })
    }
    await client.query('COMMIT')
  } catch (e: any) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore */
    }
    emit({ type: 'log', level: 'warn', msg: `csv-import: ${table} insert rolled back (${e?.message ?? e})` })
    return { table, copied: 0, source: total, ok: false, error: e?.message ?? String(e) }
  } finally {
    client.release()
  }

  // ── verify real landed count ──
  let landed = copied
  try {
    const res = await pool(targetConn).query(`select count(*)::text n from "${table}"`)
    landed = Number(res.rows?.[0]?.n ?? copied)
  } catch {
    /* keep optimistic copied count if the verify query hiccups */
  }

  const ok = copied === total
  emit({
    type: 'log',
    level: ok ? 'info' : 'warn',
    msg: `csv-import: ${ok ? 'imported' : 'partially imported'} ${copied}/${total} rows into ${table} (table now holds ${landed})`,
  })
  return { table, copied, source: total, ok }
}
