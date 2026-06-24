import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import Wall from './Wall.jsx'
import Leaderboard from './Leaderboard.jsx'
import Search from './Search.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('wall')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [total, setTotal] = useState(0)

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Big live "hypes" counter — total reactions, bumped over Realtime
  useEffect(() => {
    supabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setTotal(count ?? 0))
    const ch = supabase
      .channel('total-hypes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' },
        () => setTotal((t) => t + 1))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function signIn(e) {
    e.preventDefault()
    await supabase.auth.signInWithOtp({ email })
    setSent(true)
  }

  return (
    <div className="app">
      <header>
        <h1>PULSEWALL</h1>
        <div className="counter">{total.toLocaleString()}<span>hypes</span></div>
        <nav>
          <button className={tab === 'wall' ? 'on' : ''} onClick={() => setTab('wall')}>Wall</button>
          <button className={tab === 'leaderboard' ? 'on' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
          <button className={tab === 'search' ? 'on' : ''} onClick={() => setTab('search')}>Search</button>
        </nav>
        <div className="auth">
          {session ? (
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
          ) : sent ? (
            <span>check your email ✨</span>
          ) : (
            <form onSubmit={signIn}>
              <input type="email" placeholder="email to post" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
              <button>Get link</button>
            </form>
          )}
        </div>
      </header>

      <main>
        {tab === 'wall' && <Wall session={session} />}
        {tab === 'leaderboard' && <Leaderboard />}
        {tab === 'search' && <Search />}
      </main>
    </div>
  )
}
