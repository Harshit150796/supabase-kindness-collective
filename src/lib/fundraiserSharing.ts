export function fundraiserPublicUrl(slug: string | null, id: string) {
  const host = (import.meta.env.VITE_SHARE_HOST as string | undefined)?.replace(/\/$/, "") || "https://coupondonation.com";
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