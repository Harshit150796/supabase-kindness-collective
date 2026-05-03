import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const c = url.searchParams.get("c");
  const s = url.searchParams.get("s");
  const e = url.searchParams.get("e");
  const u = url.searchParams.get("u");

  let target = "https://www.coupondonation.com";
  try {
    if (u) target = decodeURIComponent(u);
  } catch {}

  try {
    if (c && (s || e)) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await supabase.from("email_events").insert({
        campaign_id: c,
        subscriber_id: s || null,
        recipient_email: e || null,
        event_type: "clicked",
        url: target,
      });
      if (s) {
        await supabase.from("email_subscribers")
          .update({ last_click_at: new Date().toISOString() })
          .eq("id", s);
      }
    }
  } catch (err) {
    console.error("track-click error:", err);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "no-store" },
  });
});
