/**
 * What the fundraiser page (/f/<slug>) reads first: the fundraiser and its photos in one request, so the main
 * photo is known with the title (founder request, Nov 17 2026: share links were slow to open). The page shell's
 * fast start (index.html, `data-fundraiser-fast-start`) sends exactly this request while the app is still
 * downloading; vite.config.ts writes FUNDRAISER_PAGE_SELECT into it at build time. Kept free of browser-only
 * imports so vite.config.ts can read it.
 */
export const FUNDRAISER_PAGE_SELECT =
  "id,title,story,category,monthly_goal,cover_photo_url,status,unique_slug,created_at,user_id,allow_messages,beneficiary_display_name,show_beneficiary_name,is_example,zip_code,fundraiser_images(id,image_url,display_order,is_primary)";

export const isFundraiserId = (slug: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

type EarlyFundraiser = { slug: string; data: Promise<unknown> };

/**
 * The fast start's answer for this address, used once (moving to another fundraiser asks again). Null when
 * there is none, it failed, or it found nothing visitors can see; the page then asks itself, signed in.
 */
export function takeEarlyFundraiser(slug: string): Promise<Record<string, unknown> | null> | null {
  if (typeof globalThis.document === "undefined") return null;
  const holder = globalThis as unknown as { __cdFundraiser?: EarlyFundraiser };
  const early = holder.__cdFundraiser;
  if (!early || early.slug !== slug) return null;
  holder.__cdFundraiser = undefined;
  return early.data.then((row) => (row && typeof row === "object" ? (row as Record<string, unknown>) : null), () => null);
}
