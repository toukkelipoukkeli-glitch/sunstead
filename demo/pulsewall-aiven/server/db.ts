import { Pool } from 'pg'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.DATABASE_URL ?? ''

function makePool(): Pool {
  if (!url) return new Pool() // unconfigured — queries error clearly until DATABASE_URL is set
  // pg v8 ignores the `ssl` option when `sslmode` is in the URL, so strip it.
  const u = new URL(url)
  u.searchParams.delete('sslmode')
  let ssl: any
  if (process.env.PROJECT_CA_CERT) {
    // Injected by Aiven Apps deploy (base64 CA) — proper TLS verification.
    ssl = { ca: Buffer.from(process.env.PROJECT_CA_CERT, 'base64').toString('utf8'), rejectUnauthorized: true }
  } else if (url.includes('aivencloud.com') || url.includes('sslmode=require')) {
    // Local/dev with a console connection string — TLS without shipping the CA.
    ssl = { rejectUnauthorized: false }
  }
  return new Pool({ connectionString: u.toString(), ssl, max: 10 })
}

export const pool = makePool()

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params)
  return res.rows as T[]
}

export async function q1<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(text, params)
  return rows[0] ?? null
}

/** Apply db/schema.sql (idempotent — every statement is create-if-not-exists / or-replace). */
export async function applySchema(): Promise<void> {
  const sql = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8')
  await pool.query(sql)
}

export function dbConfigured(): boolean {
  return !!url
}
