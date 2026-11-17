/**
 * Gets a fundraiser's link preview ready before its share link is pasted anywhere (founder request, Nov 17 2026):
 * the share-fundraiser function makes the preview photo (once per main photo, stored on the storage CDN) and is
 * awake when WhatsApp or iMessage asks a moment later. Kept apart from fundraiserSharing.ts, which only builds the
 * links people share.
 */
const BACKEND = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://vbnbacowuoeeojjdrzzp.supabase.co").replace(/\/$/, "");
const prepared = new Set<string>();

/**
 * Called when a share menu opens, on the organizer's dashboard, and with `again` after the photos change.
 * Fire and forget: nothing waits for it and a failure changes nothing (the preview is then made on first use).
 */
export function prepareShareCard(slug: string | null | undefined, again = false) {
  if (!slug || (prepared.has(slug) && !again)) return;
  prepared.add(slug);
  try {
    void fetch(`${BACKEND}/functions/v1/share-fundraiser?slug=${encodeURIComponent(slug)}&prepare=1`, { mode: "no-cors", credentials: "omit", keepalive: true }).catch(() => undefined);
  } catch { /* best effort */ }
}
