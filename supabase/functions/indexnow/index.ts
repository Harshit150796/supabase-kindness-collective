// Pings IndexNow when a fundraiser goes live or is edited, so new requests reach Bing-powered search
// (and ChatGPT, Copilot, DuckDuckGo) within minutes. Called by the app after a fundraiser is submitted
// or saved. It only accepts a slug for an open, real (non-example) fundraiser changed in the last two
// hours, so it can't be used to submit other pages, and it is rate-limited per caller.
import { createClient } from "npm:@supabase/supabase-js@2";
import { clientIp, overLimit, HOUR } from "../_shared/rate-limit.ts";
import { submitIndexNow } from "../_shared/indexnow.ts";

const SITE = "https://coupondonation.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let slug = "";
  try {
    const body = await req.json();
    slug = String(body?.slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 120);
  } catch { /* empty body */ }
  if (!slug) return json({ error: "Missing fundraiser" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  if (await overLimit(admin, "indexnow-ip", clientIp(req), 20, HOUR)) return json({ error: "Too many requests" }, 429);

  const { data: f } = await admin
    .from("fundraisers")
    .select("unique_slug, status, is_example, archived_at, updated_at, created_at")
    .eq("unique_slug", slug)
    .maybeSingle();
  const changed = Date.parse(f?.updated_at ?? f?.created_at ?? "");
  const recent = Number.isFinite(changed) && Date.now() - changed < 2 * HOUR;
  if (!f || f.status !== "active" || f.is_example || f.archived_at || !recent) return json({ submitted: false });

  // One submission per fundraiser per hour is plenty.
  if (await overLimit(admin, "indexnow-slug", slug, 1, HOUR)) return json({ submitted: false, reason: "recently submitted" });
  const status = await submitIndexNow([`${SITE}/f/${slug}`]);
  return json({ submitted: status === 200 || status === 202, status });
});
