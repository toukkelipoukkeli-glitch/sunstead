import { useState } from 'react'
import { supabase } from './supabaseClient.js'

export default function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [ran, setRan] = useState(false)

  async function run(e) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      // 1) embed the query via the edge function
      const { data, error } = await supabase.functions.invoke('embed', { body: { text: q } })
      if (error) throw error
      // 2) cosine nearest-neighbour over post embeddings
      const { data: matches, error: rpcErr } = await supabase.rpc('match_posts', {
        query_embedding: data.embedding,
        match_count: 10,
      })
      if (rpcErr) throw rpcErr
      setResults(matches ?? [])
      setRan(true)
    } catch (e) {
      setErr(e.message ?? String(e))
    }
    setBusy(false)
  }

  return (
    <div className="search">
      <form onSubmit={run}>
        <input type="text" placeholder="find similar hype…" value={q}
          onChange={(e) => setQ(e.target.value)} required />
        <button disabled={busy}>{busy ? '…' : 'Search'}</button>
      </form>
      {err && (
        <p className="err">
          {err} — make sure the <code>embed</code> function is deployed with OPENAI_API_KEY set,
          and that some posts have embeddings (create a few through the app).
        </p>
      )}
      {ran && !err && results.length === 0 && (
        <p className="empty">No matches — have any posts been embedded yet?</p>
      )}
      <div className="feed">
        {results.map((r) => (
          <div className="card" key={r.id}>
            <p>{r.body}</p>
            <small>match {(r.similarity * 100).toFixed(0)}% · 🔥 {r.reaction_count}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
