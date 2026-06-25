import './env.ts'
import { applySchema, dbConfigured, pool } from './db.ts'

if (!dbConfigured()) {
  console.error('DATABASE_URL not set. Point it at your Aiven Postgres (.env.local).')
  process.exit(1)
}

await applySchema()
console.log('✅ schema applied to Aiven Postgres')
await pool.end()
