import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subscribers, campaign } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Import subscribers
    let imported = 0;
    if (subscribers && subscribers.length > 0) {
      const { data, error } = await supabase
        .from("email_subscribers")
        .upsert(subscribers, { onConflict: "email", ignoreDuplicates: true });
      if (error) {
        console.error("Import error:", error);
      } else {
        imported = subscribers.length;
      }
    }

    // Create campaign if provided
    let campaignId = null;
    if (campaign) {
      const { data: campData, error: campErr } = await supabase
        .from("email_campaigns")
        .insert(campaign)
        .select("id")
        .single();
      if (campErr) {
        console.error("Campaign error:", campErr);
      } else {
        campaignId = campData.id;
      }
    }

    return new Response(
      JSON.stringify({ imported, campaignId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
