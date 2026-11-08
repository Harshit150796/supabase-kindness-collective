const SITE = "https://coupondonation.com";

/** The fundraiser page itself: the "Public page" button, QR codes and the website widget. */
export function fundraiserPublicUrl(slug: string | null, id: string) {
  return `${SITE}/f/${encodeURIComponent(slug || id)}`;
}

/**
 * The link people share. Lovable gives link-preview bots one page for every address, so
 * coupondonation.com/f/… always previews as the generic CouponDonation card. share.coupondonation.com/f/…
 * shows the fundraiser's own photo, title and story in WhatsApp, iMessage, Facebook, X and LinkedIn,
 * and sends people straight on to the page above (AGENTS.md, Link previews).
 */
export function fundraiserShareUrl(slug: string | null, id: string) {
  const host = (import.meta.env.VITE_SHARE_HOST as string | undefined)?.replace(/\/$/, "") || "https://share.coupondonation.com";
  return `${host}/f/${encodeURIComponent(slug || id)}`;
}

export async function shareFundraiser(title: string, url: string): Promise<"shared" | "copied" | "cancelled"> {
  if (navigator.share) {
    try { await navigator.share({ title, url }); return "shared"; }
    catch (error) { if (error instanceof DOMException && error.name === "AbortError") return "cancelled"; }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
