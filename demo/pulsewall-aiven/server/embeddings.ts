// Vector embeddings — calls the embedding API directly (no Supabase edge fn, no
// Lovable AI gateway). text-embedding-3-small → vector(1536). Swap model/provider freely.

const KEY = process.env.OPENAI_API_KEY

export function embeddingsEnabled(): boolean {
  return !!KEY
}

export async function embed(text: string): Promise<number[] | null> {
  if (!KEY) return null
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    })
    if (!res.ok) {
      console.error('[embed] failed', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return data.data[0].embedding as number[]
  } catch (e) {
    console.error('[embed] error', e)
    return null
  }
}

/** pgvector accepts a vector literal like "[0.1,0.2,...]". */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(',')}]`
}
