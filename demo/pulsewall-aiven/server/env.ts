// Load env before anything else reads process.env. Import this FIRST in every entrypoint.
import { config } from 'dotenv'
import { existsSync } from 'node:fs'

if (existsSync('.env.local')) config({ path: '.env.local' })
config() // .env fallback
