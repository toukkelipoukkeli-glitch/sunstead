import { apiFetch, getToken, setToken } from './aivenClient'

// Same exports and signatures as the Supabase version — only the bodies change,
// so App.tsx is untouched. Sessions are bearer tokens from the Aiven auth API.

export async function signUp(email: string, password: string, displayName: string) {
  const { token, user } = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  })
  setToken(token)
  return user
}

export async function signIn(email: string, password: string) {
  const { token, user } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(token)
  return { user }
}

export async function signOut() {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
  setToken(null)
}

export async function currentUser() {
  if (!getToken()) return null
  try {
    const { user } = await apiFetch('/auth/user')
    return user
  } catch {
    return null
  }
}

// Supabase returned { data: { subscription } }; we keep that shape so the
// caller's `data.subscription.unsubscribe()` still works. No socket needed —
// the app re-checks the session on load.
export function onAuthChange(_cb: (signedIn: boolean) => void) {
  return { data: { subscription: { unsubscribe() {} } } }
}
