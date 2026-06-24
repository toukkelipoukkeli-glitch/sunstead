// PulseWall embedding edge function (Supabase / Deno).
// Two jobs:
//   1) on post insert  → { text, postId } : compute embedding + write it back to the row
//   2) for search      → { text }         : compute embedding + return it (frontend feeds match_posts)
//
// Deploy:  supabase functions deploy embed
// Secrets: supabase secrets set OPENAI_API_KEY=sk-...
//          (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically)
//
// Uses OpenAI text-embedding-3-small (1536 dims → matches vector(1536)).
// Swap for any 1536-dim embedder (Voyage, Cohere, a local model) by editing embed().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { text, postId } = await req.json()
    if (!text) return json({ error: 'text is required' }, 400)

    const embedding = await embed(text)

    if (postId) {
      const sb = createClient(SUPABASE_URL, SERVICE_ROLE)
      const { error } = await sb.from('posts').update({ embedding }).eq('id', postId)
      if (error) return json({ error: error.message }, 500)
    }

    return json({ embedding })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  if (!res.ok) throw new Error(`embeddings API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data[0].embedding
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
