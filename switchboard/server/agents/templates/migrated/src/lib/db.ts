import { apiFetch } from './aivenClient'

// Same exports/signatures as the Supabase version. The query builder calls
// become REST calls to the Aiven API; owner_id/author_id now come from the
// session server-side, so the id args are accepted but ignored.

export type Board = { id: string; owner_id: string; title: string; created_at: string }
export type Card = {
  id: string
  board_id: string
  author_id: string
  column_key: 'good' | 'bad' | 'action'
  body: string
  votes: number
  created_at: string
}

export async function listBoards(): Promise<Board[]> {
  return apiFetch('/api/boards')
}

export async function createBoard(_ownerId: string, title: string): Promise<Board> {
  return apiFetch('/api/boards', { method: 'POST', body: JSON.stringify({ title }) })
}

export async function listCards(boardId: string): Promise<Card[]> {
  return apiFetch(`/api/cards?board_id=${encodeURIComponent(boardId)}`)
}

export async function addCard(boardId: string, _authorId: string, columnKey: string, body: string) {
  return apiFetch('/api/cards', {
    method: 'POST',
    body: JSON.stringify({ board_id: boardId, column_key: columnKey, body }),
  })
}

export async function upvoteCard(cardId: string, votes: number) {
  await apiFetch(`/api/cards/${cardId}`, { method: 'PATCH', body: JSON.stringify({ votes }) })
}
