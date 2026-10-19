// Example campaigns are showcase pages only: no checkout may ever attach a payment to one.
export const EXAMPLE_CLOSED_MESSAGE = "Giving is closed on example campaigns.";

export async function isExampleFundraiser(fundraiserId: unknown, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (typeof fundraiserId !== "string" || !fundraiserId.trim()) return false;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return true; // fail closed: if we cannot check, refuse the fundraiser link
  const res = await fetcher(`${url}/rest/v1/fundraisers?id=eq.${encodeURIComponent(fundraiserId.trim())}&select=is_example`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return true;
  const rows = await res.json().catch(() => null);
  return Array.isArray(rows) && rows[0]?.is_example === true;
}
