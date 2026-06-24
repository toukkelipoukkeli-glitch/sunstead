import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

export default function Wall({ session }) {
  const [posts, setPosts] = useState([])
  const [body, setBody] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => setPosts(data ?? []))

    const ch = supabase
      .channel('wall')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        ({ new: p }) => setPosts((prev) => [p, ...prev].slice(0, 80)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' },
        ({ new: p }) => setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...p } : x))))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function post(e) {
    e.preventDefault()
    if (!session) return
    setBusy(true)
    let image_url = null
    if (file) {
      const path = `${session.user.id}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('post-images').upload(path, file)
      if (!error && data) {
        image_url = supabase.storage.from('post-images').getPublicUrl(path).data.publicUrl
      }
    }
    const { data: inserted } = await supabase
      .from('posts')
      .insert({ author_id: session.user.id, body, image_url })
      .select()
      .single()
    setBody('')
    setFile(null)
    setBusy(false)
    // fire-and-forget: edge function backfills the embedding for semantic search
    if (inserted) {
      supabase.functions.invoke('embed', { body: { text: body, postId: inserted.id } })
    }
  }

  async function react(postId) {
    if (!session) return
    await supabase.from('reactions').insert({ post_id: postId, user_id: session.user.id, emoji: '🔥' })
  }

  return (
    <div className="wall">
      {session && (
        <form className="composer" onSubmit={post}>
          <input className="body" type="text" placeholder="drop your hype…" value={body}
            onChange={(e) => setBody(e.target.value)} maxLength={140} required />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button disabled={busy}>{busy ? '…' : 'POST'}</button>
        </form>
      )}
      {posts.length === 0 ? (
        <p className="empty">No hype yet. {session ? 'Be the first 🔥' : 'Sign in to post.'}</p>
      ) : (
        <div className="feed">
          {posts.map((p) => (
            <div className="card" key={p.id}>
              {p.image_url && <img src={p.image_url} alt="" />}
              <p>{p.body}</p>
              <button className="react" onClick={() => react(p.id)} disabled={!session}>
                🔥 {p.reaction_count}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
