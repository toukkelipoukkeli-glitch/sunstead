import { q, q1 } from './db.ts'

// Image storage — bytes live in Aiven Postgres (bytea), served by the app. Replaces
// Supabase Storage. Keeps the whole app on Aiven (no external object store needed for the demo).
// Production note: at real scale you'd front this with S3-compatible object storage.

export async function putImage(bytes: Buffer, mime: string, ownerId: string | null): Promise<string> {
  const row = await q1<{ id: string }>(
    `insert into images (mime, bytes, owner_id) values ($1, $2, $3) returning id`,
    [mime, bytes, ownerId],
  )
  return row!.id
}

export async function getImage(id: string): Promise<{ mime: string; bytes: Buffer } | null> {
  return await q1<{ mime: string; bytes: Buffer }>(`select mime, bytes from images where id = $1`, [id])
}
