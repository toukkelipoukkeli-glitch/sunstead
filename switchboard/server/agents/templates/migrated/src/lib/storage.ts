// GAP — Aiven has no managed object storage, so there is no drop-in target for
// Supabase Storage. The Code Rewriter leaves this shim (same signature) and the
// Migration Reporter flags it. Options: keep Supabase Storage for files only,
// or wire an external S3-compatible bucket and fill this in.
export async function uploadAvatar(_userId: string, _file: File): Promise<string> {
  throw new Error(
    'Storage not migrated: Aiven has no managed object store yet. ' +
      'Keep Supabase Storage for uploads, or point this at an S3-compatible bucket.',
  )
}
