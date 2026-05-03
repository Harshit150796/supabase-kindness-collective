import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: due } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .limit(5);

  let triggered = 0;
  for (const c of due || []) {
    try {
      await supabase.functions.invoke("send-newsletter", { body: { campaign_id: c.id } });
      triggered++;
    } catch (e) {
      console.error("scheduler invoke failed", c.id, e);
    }
  }

  return new Response(JSON.stringify({ triggered, checked: due?.length || 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
