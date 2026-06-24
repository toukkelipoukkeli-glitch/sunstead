import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

export default function Leaderboard() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const load = () =>
      supabase
        .from('posts')
        .select('*')
        .order('reaction_count', { ascending: false })
        .limit(20)
        .then(({ data }) => setPosts(data ?? []))
    load()
    // re-rank live as reaction_count changes over Realtime
    const ch = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (posts.length === 0) return <p className="empty">Leaderboard fills up as the hype lands.</p>

  return (
    <ol className="leaderboard">
      {posts.map((p, i) => (
        <li key={p.id}>
          <span className="rank">#{i + 1}</span>
          <span className="b">{p.body}</span>
          <span className="c">🔥 {p.reaction_count}</span>
        </li>
      ))}
    </ol>
  )
}
