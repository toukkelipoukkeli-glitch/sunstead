import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // Visible in the console if env isn't wired — the UI still renders its shell.
  console.warn('PulseWall: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon')
