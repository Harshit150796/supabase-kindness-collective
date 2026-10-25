// One-off: applies upload file-type limits to the storage buckets (the migration tool can't change
// storage settings). It only sets the fixed lists below and keeps each bucket's public setting and
// size limit, so calling it is harmless. Delete it once it has run.
import { createClient } from 'npm:@supabase/supabase-js@2';

const LIMITS: Record<string, string[]> = {
  'fundraiser-covers': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'],
  'cms-images': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  'email-assets': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  'card-donations': ['image/jpeg', 'image/png', 'image/webp'],
  'coupon-receipts': ['image/jpeg', 'image/png', 'image/webp'],
};

Deno.serve(async () => {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const results: Record<string, unknown> = {};
  for (const [id, types] of Object.entries(LIMITS)) {
    const { data: bucket, error: getErr } = await admin.storage.getBucket(id);
    if (getErr || !bucket) { results[id] = { error: getErr?.message ?? 'not found' }; continue; }
    const { error } = await admin.storage.updateBucket(id, {
      public: bucket.public,
      allowedMimeTypes: types,
      ...(bucket.file_size_limit ? { fileSizeLimit: bucket.file_size_limit } : {}),
    });
    results[id] = error ? { error: error.message } : { ok: true, public: bucket.public, types: types.length, size: bucket.file_size_limit ?? null };
  }
  return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
});
