import pg from 'pg'

// Connection to Aiven for PostgreSQL. Aiven requires TLS; node-postgres ignores
// the `ssl` option when `sslmode` is present in the URL, so we strip it and pass
// ssl explicitly. On Aiven Apps the platform injects PROJECT_CA_CERT (base64).
function buildConfig(): pg.PoolConfig {
  const raw = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
  const url = new URL(raw)
  url.searchParams.delete('sslmode')
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(url.hostname)
  const ca = process.env.PROJECT_CA_CERT
    ? Buffer.from(process.env.PROJECT_CA_CERT, 'base64').toString('utf8')
    : process.env.PGCACERT
  const ssl =
    process.env.PGSSL === 'disable' || isLocal
      ? undefined
      : ca
        ? { ca }
        : { rejectUnauthorized: false }
  return { connectionString: url.toString(), ssl }
}

export function pgConfig(): pg.PoolConfig {
  return buildConfig()
}

export const pool = new pg.Pool(buildConfig())

// Run work with the per-request user id set, so RLS policies that read
// current_setting('app.user_id') enforce on a non-owner connection.
export async function withUser<T>(userId: string | null, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('begin')
    if (userId) await client.query("select set_config('app.user_id', $1, true)", [userId])
    const out = await fn(client)
    await client.query('commit')
    return out
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }
}
