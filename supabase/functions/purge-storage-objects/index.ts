// One-off maintenance function: permanently removes specific files from a
// public storage bucket. Used to purge government-ID photos that were
// mistakenly uploaded as public campaign cover images.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGETS: Record<string, string[]> = {
  "fundraiser-covers": [
    "5d8d1c38-0a5a-4b32-b5c9-14faccfab6e5/1770202761522.jpg",
    "f063f344-accc-49d3-a975-0ff96c010692/1770207470107.jpg",
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const results: Record<string, unknown> = {};
  for (const [bucket, paths] of Object.entries(TARGETS)) {
    const { data, error } = await admin.storage.from(bucket).remove(paths);
    results[bucket] = error ? { error: error.message } : { removed: data?.length ?? 0 };
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
